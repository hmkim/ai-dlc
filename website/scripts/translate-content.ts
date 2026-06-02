/**
 * translate-content.ts
 *
 * Hybrid i18n pipeline. English markdown under content/{papers,docs,blog} is the
 * single source of truth. This script translates changed source files into a
 * target locale (default: ko) and writes them to content/<locale>/<type>/<file>.
 *
 * Translation runs through AWS Bedrock (Claude) using the AWS CLI's
 * `bedrock-runtime converse` command, so no extra npm dependency or API key is
 * required — it reuses the ambient AWS credentials.
 *
 * Incremental: a content hash of each source file is cached in
 * scripts/.translation-cache.json. Unchanged files are skipped, so re-runs are
 * cheap and only re-translate what actually changed.
 *
 * Usage:
 *   npx tsx scripts/translate-content.ts            # translate ko (changed only)
 *   npx tsx scripts/translate-content.ts --locale ko
 *   npx tsx scripts/translate-content.ts --force    # ignore cache, retranslate all
 *   npx tsx scripts/translate-content.ts --only papers/ai-dlc-2026.md
 *
 * Env overrides:
 *   BEDROCK_MODEL_ID   (default: us.anthropic.claude-sonnet-4-6)
 *   AWS_REGION         (default: us-west-2)
 */

import { execFileSync } from "node:child_process"
import crypto from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const ROOT = path.join(process.cwd(), "content")
const CONTENT_TYPES = ["papers", "docs", "blog"] as const
const CACHE_PATH = path.join(
	process.cwd(),
	"scripts",
	".translation-cache.json",
)

const MODEL_ID =
	process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-sonnet-4-6"
const REGION = process.env.AWS_REGION || "us-west-2"

// Language metadata. Add new locales here to extend support (e.g. ja).
const LOCALES: Record<string, { name: string; nativeName: string }> = {
	ko: { name: "Korean", nativeName: "한국어" },
	ja: { name: "Japanese", nativeName: "日本語" },
}

/**
 * Terminology that must NOT be translated. These are AI-DLC's core concepts and
 * must stay verbatim in English so the methodology stays consistent across the
 * paper, plugin, and website (see CLAUDE.md terminology table).
 */
const PRESERVE_TERMS = [
	"AI-DLC",
	"Intent",
	"Unit",
	"Bolt",
	"Pass",
	"HITL",
	"OHOTL",
	"AHOTL",
	"Claude Code",
	"hat",
	"hats",
]

interface CacheEntry {
	sourceHash: string
	model: string
	translatedAt: string
}
type Cache = Record<string, CacheEntry> // key: "<locale>/<type>/<file>"

function parseArgs(argv: string[]) {
	const args = { locale: "ko", force: false, only: null as string | null }
	for (let i = 2; i < argv.length; i++) {
		const a = argv[i]
		if (a === "--force") args.force = true
		else if (a === "--locale") args.locale = argv[++i]
		else if (a === "--only") args.only = argv[++i]
	}
	return args
}

function sha256(text: string): string {
	return crypto.createHash("sha256").update(text).digest("hex")
}

function loadCache(): Cache {
	if (!fs.existsSync(CACHE_PATH)) return {}
	try {
		return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")) as Cache
	} catch {
		return {}
	}
}

function saveCache(cache: Cache): void {
	fs.writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`)
}

/** List every English source markdown file as "<type>/<file>.md" relative keys. */
function listSourceFiles(): string[] {
	const files: string[] = []
	for (const type of CONTENT_TYPES) {
		const dir = path.join(ROOT, type)
		if (!fs.existsSync(dir)) continue
		for (const file of fs.readdirSync(dir)) {
			if (file.endsWith(".md")) files.push(`${type}/${file}`)
		}
	}
	return files
}

/**
 * Split a markdown body into chunks at heading boundaries (## then ###), and as
 * a last resort at blank-line paragraph boundaries, without ever cutting inside
 * a fenced code block. Frontmatter is handled separately by the caller. Chunks
 * accumulate until they exceed CHUNK_CHARS, then a new chunk starts at the next
 * available boundary. This keeps each translation request small enough to finish
 * reliably and well under the output-token ceiling (single large calls truncate).
 */
const CHUNK_CHARS = 4000
const HARD_LIMIT = 6000

function splitMarkdown(body: string): string[] {
	const lines = body.split("\n")
	const chunks: string[] = []
	let current: string[] = []
	let inFence = false

	const flush = () => {
		if (current.length > 0) {
			chunks.push(current.join("\n"))
			current = []
		}
	}

	for (const line of lines) {
		if (/^```/.test(line.trim()) || /^~~~/.test(line.trim())) {
			inFence = !inFence
		}
		const size = current.join("\n").length
		if (!inFence) {
			const isHeading = /^#{1,3}\s/.test(line)
			const isBlank = line.trim() === ""
			// Prefer heading boundaries once past the soft target; fall back to a
			// paragraph break if a single section blows past the hard limit.
			if (
				(isHeading && size >= CHUNK_CHARS) ||
				(isBlank && size >= HARD_LIMIT)
			) {
				flush()
			}
		}
		current.push(line)
	}
	flush()

	// Tiny docs: keep as a single chunk.
	return chunks.length > 0 ? chunks : [body]
}

/** Split off a leading YAML frontmatter block, if present. */
function splitFrontmatter(text: string): { frontmatter: string; body: string } {
	if (text.startsWith("---\n")) {
		const end = text.indexOf("\n---", 4)
		if (end !== -1) {
			const close = text.indexOf("\n", end + 1)
			const cut = close === -1 ? text.length : close + 1
			return { frontmatter: text.slice(0, cut), body: text.slice(cut) }
		}
	}
	return { frontmatter: "", body: text }
}

type Segment = "frontmatter" | "body" | "full"

function buildPrompt(
	locale: string,
	markdown: string,
	segment: Segment,
): string {
	const lang = LOCALES[locale]
	const rules = [
		"Output ONLY the translated Markdown. No preamble, no explanation, and do NOT wrap the whole output in a code fence.",
		"Do NOT translate content inside fenced code blocks (```), inline code (`...`), URLs, file paths, HTML tags/attributes, or Markdown link targets. Translate only link display text.",
		"Keep all Markdown structure identical: heading levels, list markers, tables, blockquotes, emphasis, and image syntax.",
		`Keep these terms verbatim in English (do not translate or transliterate): ${PRESERVE_TERMS.join(", ")}.`,
		"Use natural, fluent technical writing in the target language — not a literal word-for-word rendering.",
	]
	if (segment === "frontmatter") {
		rules.unshift(
			"This is a YAML frontmatter block. Preserve its structure EXACTLY, including the --- markers. Translate ONLY the human-readable values of `title`, `subtitle`, and `description`. Do NOT translate or alter keys, dates, slugs, tags, authors, booleans, or numbers.",
		)
	} else if (segment === "body") {
		rules.unshift(
			"This is a fragment of a larger document (it may start mid-section). Translate it as-is; do NOT add frontmatter, a title, or any wrapping.",
		)
	} else {
		rules.unshift(
			"Preserve the YAML frontmatter block (between the leading --- markers) structure EXACTLY. Translate the human-readable values of `title`, `subtitle`, and `description` only.",
		)
	}
	return [
		`You are a professional technical translator. Translate the following Markdown from English into ${lang.name} (${lang.nativeName}).`,
		"",
		"Strict rules:",
		...rules.map((r, i) => `${i + 1}. ${r}`),
		"",
		"Content to translate:",
		"",
		markdown,
	].join("\n")
}

/** Invoke Bedrock converse via AWS CLI, passing a temp JSON body file. */
function bedrockTranslate(
	locale: string,
	markdown: string,
	segment: Segment,
): string {
	const body = {
		messages: [
			{
				role: "user",
				content: [{ text: buildPrompt(locale, markdown, segment) }],
			},
		],
		// Per-chunk ceiling. Large documents are split (see splitMarkdown) so each
		// request stays well under this and finishes reliably within the timeout.
		inferenceConfig: { maxTokens: 16000, temperature: 0.2 },
	}
	const tmp = path.join(
		os.tmpdir(),
		`bedrock-${sha256(markdown).slice(0, 12)}.json`,
	)
	fs.writeFileSync(tmp, JSON.stringify(body))
	try {
		// Large documents (e.g. the paper) take well over the AWS CLI's default
		// 60s read timeout, so raise it and retry transient timeouts.
		const MAX_ATTEMPTS = 3
		let lastErr: Error | null = null
		for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
			try {
				const out = execFileSync(
					"aws",
					[
						"bedrock-runtime",
						"converse",
						"--region",
						REGION,
						"--model-id",
						MODEL_ID,
						"--cli-read-timeout",
						"600",
						"--cli-connect-timeout",
						"60",
						"--cli-input-json",
						`file://${tmp}`,
					],
					{ encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
				)
				const parsed = JSON.parse(out)
				const text: string | undefined =
					parsed?.output?.message?.content?.[0]?.text
				if (!text) throw new Error("No text in Bedrock response")
				if (parsed?.stopReason === "max_tokens") {
					console.warn(
						"    ⚠ response hit max_tokens — translation may be truncated. Consider splitting the source.",
					)
				}
				return text.trim()
			} catch (err) {
				lastErr = err as Error
				if (attempt < MAX_ATTEMPTS) {
					console.warn(`    retry ${attempt}/${MAX_ATTEMPTS - 1} …`)
				}
			}
		}
		throw lastErr ?? new Error("Bedrock translation failed")
	} finally {
		fs.rmSync(tmp, { force: true })
	}
}

/**
 * Translate a full markdown file. Small files go in one request; large ones are
 * split into frontmatter + body chunks (each translated separately) and
 * reassembled, so no single request risks truncation or timeout.
 */
function translateDocument(locale: string, source: string): string {
	// Small enough for a single request — keep the simple path.
	if (source.length <= CHUNK_CHARS * 1.5) {
		return bedrockTranslate(locale, source, "full")
	}

	const { frontmatter, body } = splitFrontmatter(source)
	const parts: string[] = []
	if (frontmatter) {
		parts.push(bedrockTranslate(locale, frontmatter, "frontmatter").trim())
	}

	const chunks = splitMarkdown(body)
	process.stdout.write(`(${chunks.length} chunks) `)
	for (const chunk of chunks) {
		if (chunk.trim() === "") continue
		parts.push(bedrockTranslate(locale, chunk, "body").trim())
	}
	return parts.join("\n\n")
}

function main(): void {
	const { locale, force, only } = parseArgs(process.argv)
	if (!LOCALES[locale]) {
		console.error(
			`Unsupported locale "${locale}". Known: ${Object.keys(LOCALES).join(", ")}`,
		)
		process.exit(1)
	}

	const cache = loadCache()
	let sources = listSourceFiles()
	if (only) sources = sources.filter((s) => s === only)

	if (sources.length === 0) {
		console.log("No source files to translate.")
		return
	}

	console.log(
		`Translating ${sources.length} file(s) → ${locale} (${LOCALES[locale].nativeName}) via ${MODEL_ID}\n`,
	)

	let translated = 0
	let skipped = 0
	for (const rel of sources) {
		const srcPath = path.join(ROOT, rel)
		const srcText = fs.readFileSync(srcPath, "utf8")
		const hash = sha256(srcText)
		const cacheKey = `${locale}/${rel}`
		const outPath = path.join(ROOT, locale, rel)

		const cached = cache[cacheKey]
		const upToDate =
			!force &&
			cached &&
			cached.sourceHash === hash &&
			cached.model === MODEL_ID &&
			fs.existsSync(outPath)

		if (upToDate) {
			skipped++
			continue
		}

		process.stdout.write(`  • ${rel} … `)
		try {
			const result = translateDocument(locale, srcText)
			fs.mkdirSync(path.dirname(outPath), { recursive: true })
			fs.writeFileSync(outPath, `${result}\n`)
			cache[cacheKey] = {
				sourceHash: hash,
				model: MODEL_ID,
				// Stamped from system clock; fine for a cache record.
				translatedAt: new Date().toISOString(),
			}
			saveCache(cache)
			translated++
			console.log("done")
		} catch (err) {
			console.log("FAILED")
			console.error(`    ${(err as Error).message}`)
		}
	}

	console.log(`\n✓ ${translated} translated, ${skipped} up-to-date (cached).`)
}

main()

import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

/** Default (English) source lives in content/blog; other locales in content/<locale>/blog. */
function blogDir(locale?: string): string {
	return locale && locale !== "en"
		? path.join(process.cwd(), "content", locale, "blog")
		: path.join(process.cwd(), "content/blog")
}

export interface BlogPost {
	slug: string
	title: string
	description?: string
	date: string
	author?: string
	content: string
}

export function getBlogSlugs(locale?: string): string[] {
	const dir = blogDir(locale)
	if (!fs.existsSync(dir)) {
		return []
	}

	return fs
		.readdirSync(dir)
		.filter((file) => file.endsWith(".md"))
		.map((file) => file.replace(/\.md$/, ""))
}

export function getBlogPostBySlug(
	slug: string,
	locale?: string,
): BlogPost | null {
	const fullPath = path.join(blogDir(locale), `${slug}.md`)

	if (!fs.existsSync(fullPath)) {
		return null
	}

	const fileContents = fs.readFileSync(fullPath, "utf8")
	const { data, content } = matter(fileContents)

	return {
		slug,
		title: data.title || slug,
		description: data.description,
		date: data.date || new Date().toISOString(),
		author: data.author,
		content,
	}
}

export function getAllBlogPosts(locale?: string): BlogPost[] {
	const slugs = getBlogSlugs(locale)
	const posts = slugs
		.map((slug) => getBlogPostBySlug(slug, locale))
		.filter((post): post is BlogPost => post !== null)

	// Sort by date, newest first
	return posts.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	)
}

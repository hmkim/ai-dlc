/**
 * Minimal i18n for the AI-DLC website.
 *
 * English is the default and lives at the root (/paper, /docs, /blog).
 * Additional locales are mirrored under /<locale> (e.g. /ko/paper). Content
 * pages read translated Markdown from content/<locale>/ via the loaders; this
 * module covers the surrounding UI strings (page chrome, headings, labels).
 */

export const LOCALES = ["en", "ko"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "en"

/** Locales other than the default — used for generateStaticParams on /[locale] routes. */
export const NON_DEFAULT_LOCALES = LOCALES.filter(
	(l) => l !== DEFAULT_LOCALE,
) as Exclude<Locale, typeof DEFAULT_LOCALE>[]

export const localeNames: Record<Locale, string> = {
	en: "English",
	ko: "한국어",
}

/** BCP-47 tags for <html lang> and hreflang. */
export const localeHtmlLang: Record<Locale, string> = {
	en: "en",
	ko: "ko",
}

export function isLocale(value: string): value is Locale {
	return (LOCALES as readonly string[]).includes(value)
}

/** Prefix to prepend to a root-relative href for a given locale ("" for default). */
export function localeHref(locale: Locale, href: string): string {
	if (locale === DEFAULT_LOCALE) return href
	return `/${locale}${href}`
}

interface Dictionary {
	docsTitle: string
	docsIntro: string
	blogTitle: string
	blogIntro: string
	blogEmpty: string
	by: string
	backToDocs: string
	printPdf: string
	paperTitle: string
}

const dictionaries: Record<Locale, Dictionary> = {
	en: {
		docsTitle: "Documentation",
		docsIntro:
			"Learn how to use AI-DLC to structure your AI-driven development workflow.",
		blogTitle: "Blog",
		blogIntro: "News and updates about AI-DLC and AI-driven development.",
		blogEmpty: "No blog posts yet. Check back soon!",
		by: "By",
		backToDocs: "Back to docs",
		printPdf: "Print / PDF",
		paperTitle: "AI-DLC Paper",
	},
	ko: {
		docsTitle: "문서",
		docsIntro: "AI-DLC로 AI 주도 개발 워크플로를 구성하는 방법을 알아보세요.",
		blogTitle: "블로그",
		blogIntro: "AI-DLC와 AI 주도 개발에 대한 소식과 업데이트.",
		blogEmpty: "아직 게시글이 없습니다. 곧 다시 확인해 주세요!",
		by: "작성자",
		backToDocs: "문서로 돌아가기",
		printPdf: "인쇄 / PDF",
		paperTitle: "AI-DLC 페이퍼",
	},
}

export function getDictionary(locale: Locale): Dictionary {
	return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE]
}

/** Locale-aware date formatting for content metadata. */
export function formatDate(dateString: string, locale: Locale): string {
	const date = new Date(dateString)
	const tag = locale === "ko" ? "ko-KR" : "en-US"
	return date.toLocaleDateString(tag, {
		year: "numeric",
		month: "long",
		day: "numeric",
	})
}

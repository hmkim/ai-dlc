"use client"

import { DEFAULT_LOCALE, type Locale, localeNames } from "@/lib/i18n"
import Link from "next/link"
import { usePathname } from "next/navigation"

/**
 * Paths that have a real Korean mirror under /ko. Only the content sections
 * have ko versions today; the home page and everything else are English-only
 * for now. For English-only pages we keep the user on the SAME path when they
 * toggle language (so the menu position is preserved) rather than bouncing them
 * to an unrelated page.
 */
const MIRRORED = ["/paper", "/docs", "/blog"]

function isMirrored(enPath: string): boolean {
	return MIRRORED.some((p) => enPath === p || enPath.startsWith(`${p}/`))
}

function currentLocale(pathname: string): Locale {
	return pathname === "/ko" || pathname.startsWith("/ko/") ? "ko" : "en"
}

/** Strip a leading /ko so we have the canonical English path. */
function toEnglishPath(pathname: string): string {
	if (pathname === "/ko") return "/"
	if (pathname.startsWith("/ko/")) return pathname.slice(3)
	return pathname
}

/** Map an English path to its locale path. */
function toLocalePath(enPath: string, locale: Locale): string {
	if (locale === DEFAULT_LOCALE) return enPath
	// Mirrored pages get the /ko version; English-only pages stay on the same
	// path (no ko content yet, but the menu/location is preserved).
	if (!isMirrored(enPath)) return enPath
	return enPath === "/" ? `/${locale}` : `/${locale}${enPath}`
}

export function LanguageToggle() {
	const pathname = usePathname()
	const active = currentLocale(pathname)
	const enPath = toEnglishPath(pathname)

	const links: { locale: Locale; href: string }[] = [
		{ locale: "en", href: enPath },
		{ locale: "ko", href: toLocalePath(enPath, "ko") },
	]

	return (
		<div
			className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 text-sm dark:border-gray-700"
			aria-label="Language"
		>
			{links.map(({ locale, href }) => {
				const isActive = locale === active
				return (
					<Link
						key={locale}
						href={href}
						hrefLang={locale}
						aria-current={isActive ? "true" : undefined}
						className={`rounded px-2 py-1 transition ${
							isActive
								? "bg-gray-100 font-medium text-gray-900 dark:bg-gray-800 dark:text-white"
								: "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
						}`}
					>
						{localeNames[locale]}
					</Link>
				)
			})}
		</div>
	)
}

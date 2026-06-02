import { getAllDocs } from "@/lib/docs"
import { getDictionary } from "@/lib/i18n"
import type { Metadata } from "next"
import Link from "next/link"

const t = getDictionary("ko")

export const metadata: Metadata = {
	title: `${t.docsTitle} - AI-DLC`,
	description: t.docsIntro,
	alternates: {
		canonical: "/ko/docs",
		languages: { en: "/docs", ko: "/ko/docs" },
	},
}

export default function KoDocsPage() {
	const docs = getAllDocs("ko")

	return (
		<div className="max-w-3xl">
			<h1 className="mb-4 text-4xl font-bold tracking-tight">{t.docsTitle}</h1>
			<p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
				{t.docsIntro}
			</p>

			<ul className="space-y-3">
				{docs.map((doc) => (
					<li key={doc.slug}>
						<Link
							href={`/ko/docs/${doc.slug}/`}
							className="font-medium text-blue-600 hover:underline dark:text-blue-400"
						>
							{doc.title}
						</Link>
						{doc.description && (
							<p className="text-sm text-gray-600 dark:text-gray-400">
								{doc.description}
							</p>
						)}
					</li>
				))}
			</ul>
		</div>
	)
}

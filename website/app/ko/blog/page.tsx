import { getAllBlogPosts } from "@/lib/blog"
import { formatDate, getDictionary } from "@/lib/i18n"
import type { Metadata } from "next"
import Link from "next/link"

const t = getDictionary("ko")

export const metadata: Metadata = {
	title: `${t.blogTitle} - AI-DLC`,
	description: t.blogIntro,
	alternates: {
		canonical: "/ko/blog",
		languages: { en: "/blog", ko: "/ko/blog" },
	},
}

export default function KoBlogPage() {
	const posts = getAllBlogPosts("ko")

	return (
		<div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
			<h1 className="mb-4 text-4xl font-bold tracking-tight">{t.blogTitle}</h1>
			<p className="mb-12 text-lg text-gray-600 dark:text-gray-400">
				{t.blogIntro}
			</p>

			{posts.length === 0 ? (
				<div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
					<p className="text-gray-600 dark:text-gray-400">{t.blogEmpty}</p>
				</div>
			) : (
				<div className="space-y-8">
					{posts.map((post) => (
						<article
							key={post.slug}
							className="rounded-lg border border-gray-200 p-6 transition hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
						>
							<time className="text-sm text-gray-500 dark:text-gray-500">
								{formatDate(post.date, "ko")}
							</time>
							<h2 className="mt-2 text-2xl font-semibold">
								<Link
									href={`/ko/blog/${post.slug}/`}
									className="hover:text-blue-600 dark:hover:text-blue-400"
								>
									{post.title}
								</Link>
							</h2>
							{post.description && (
								<p className="mt-2 text-gray-600 dark:text-gray-400">
									{post.description}
								</p>
							)}
							{post.author && (
								<p className="mt-4 text-sm text-gray-500">
									{t.by} {post.author}
								</p>
							)}
						</article>
					))}
				</div>
			)}
		</div>
	)
}

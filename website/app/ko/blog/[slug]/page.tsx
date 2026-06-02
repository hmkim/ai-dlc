import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog"
import { formatDate, getDictionary } from "@/lib/i18n"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"

const SITE_URL = "https://ai-dlc.dev"
const t = getDictionary("ko")

interface Props {
	params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
	const posts = getAllBlogPosts("ko")
	return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params
	const post = getBlogPostBySlug(slug, "ko")

	if (!post) {
		return { title: "Post Not Found" }
	}

	const postUrl = `${SITE_URL}/ko/blog/${post.slug}/`

	return {
		title: post.title,
		description: post.description,
		alternates: {
			canonical: postUrl,
			languages: {
				en: `${SITE_URL}/blog/${slug}/`,
				ko: postUrl,
			},
		},
	}
}

export default async function KoBlogPostPage({ params }: Props) {
	const { slug } = await params
	const post = getBlogPostBySlug(slug, "ko")

	if (!post) {
		notFound()
	}

	return (
		<article className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
			<Link
				href="/ko/blog/"
				className="mb-8 inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
			>
				<svg
					className="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				{t.blogTitle}
			</Link>

			<header className="mb-8">
				<time className="text-sm text-gray-500 dark:text-gray-500">
					{formatDate(post.date, "ko")}
				</time>
				<h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
					{post.title}
				</h1>
				{post.author && (
					<p className="mt-4 text-gray-600 dark:text-gray-400">
						{t.by} {post.author}
					</p>
				)}
			</header>

			<div className="prose prose-gray dark:prose-invert max-w-none">
				<ReactMarkdown
					remarkPlugins={[remarkGfm]}
					rehypePlugins={[rehypeHighlight, rehypeSlug]}
				>
					{post.content}
				</ReactMarkdown>
			</div>
		</article>
	)
}

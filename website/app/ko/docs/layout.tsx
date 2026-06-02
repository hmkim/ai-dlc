import { getDocsNavigation } from "@/lib/docs"
import type { ReactNode } from "react"
import { DocsSidebar } from "../../components"

export default function KoDocsLayout({ children }: { children: ReactNode }) {
	const navigation = getDocsNavigation("ko")

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
			<div className="lg:flex lg:gap-12">
				<DocsSidebar navigation={navigation} />
				<div className="min-w-0 flex-1">{children}</div>
			</div>
		</div>
	)
}

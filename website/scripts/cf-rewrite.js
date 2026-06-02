// CloudFront Function (viewer-request) for serving a Next.js static export
// (`output: "export"`, `trailingSlash: false`) from S3.
//
// Next emits clean URLs as files: /paper -> paper.html, /docs/installation ->
// docs/installation.html. S3 has no clean-URL routing, so rewrite here:
//   - "/"                 -> "/index.html"   (also the distribution default root)
//   - "/foo" (no ext)     -> "/foo.html"
//   - "/foo/" (dir slash) -> "/foo/index.html"
// Requests that already have a file extension (e.g. /_next/*.js, *.xml) pass
// through untouched.
function handler(event) {
	var request = event.request
	var uri = request.uri

	if (uri === "/" || uri === "") {
		request.uri = "/index.html"
		return request
	}

	if (uri.endsWith("/")) {
		request.uri = uri + "index.html"
		return request
	}

	// No file extension in the last path segment -> append .html
	var lastSegment = uri.substring(uri.lastIndexOf("/") + 1)
	if (lastSegment.indexOf(".") === -1) {
		request.uri = uri + ".html"
	}

	return request
}

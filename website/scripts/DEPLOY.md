# Deploying the website to AWS (S3 + CloudFront)

The site is a Next.js static export (`output: "export"`). `scripts/deploy-aws.sh`
builds it and serves `out/` from a private S3 bucket behind CloudFront.

This is an **alternative** to the existing GitHub Pages deploy
(`.github/workflows/deploy-website.yml`), intended for one-command deploys from a
machine with AWS credentials.

## Prerequisites

- AWS CLI v2, authenticated (`aws sts get-caller-identity` works)
- `bun` and `jq` on PATH

## Usage

```bash
cd website
./scripts/deploy-aws.sh                 # build + deploy (provisions on first run)
SKIP_BUILD=1 ./scripts/deploy-aws.sh    # redeploy existing out/ without rebuilding
BUCKET=my-bucket REGION=us-east-1 ./scripts/deploy-aws.sh
```

The first run provisions and caches resource IDs in `scripts/.aws-deploy.json`
(gitignored):

1. Private S3 bucket (`ai-dlc-website-<accountId>` by default)
2. Origin Access Control (CloudFront → private S3)
3. CloudFront Function `ai-dlc-website-rewrite` — rewrites clean URLs
   (`/paper` → `/paper.html`) because the export uses `trailingSlash: false`
4. CloudFront distribution (HTTPS redirect, gzip, SPA-style 404 → `/404.html`)

Subsequent runs skip provisioning and just build → `s3 sync` → invalidate.
Korean pages under `/ko/*` are served the same way — they are plain files in
`out/ko/`.

## Caching

- `/_next/*` (fingerprinted assets): `max-age=31536000, immutable`
- Everything else (HTML): `max-age=300, must-revalidate`
- Each deploy issues a `/*` CloudFront invalidation.

## Custom domain (ai-dlc.dev) — follow-up, not automated

The script serves on the `*.cloudfront.net` domain. To use `ai-dlc.dev`:

1. Request/validate an ACM certificate for `ai-dlc.dev` **in us-east-1**
   (CloudFront only reads certs from us-east-1).
2. Add the domain as a CNAME/Alias on the distribution and attach the cert.
3. Point DNS (Route 53 alias or your registrar) at the distribution.

Because the repo currently ships a `CNAME` file (`ai-dlc.dev`) for GitHub Pages,
decide which host is authoritative before repointing DNS to avoid a split.

## Tear down

```bash
# disable + delete the distribution (via console or CLI), then:
aws s3 rb "s3://ai-dlc-website-<accountId>" --force
aws cloudfront delete-function --name ai-dlc-website-rewrite --if-match <etag>
rm website/scripts/.aws-deploy.json
```

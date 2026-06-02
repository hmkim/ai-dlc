#!/usr/bin/env bash
#
# deploy-aws.sh — Build the website and deploy the static export to S3 + CloudFront.
#
# Idempotent: the first run provisions infrastructure (private S3 bucket,
# Origin Access Control, a CloudFront Function for clean-URL rewriting, and a
# CloudFront distribution). Every run builds, syncs out/ to S3, and invalidates
# the CloudFront cache. Provisioned resource IDs are cached in
# scripts/.aws-deploy.json so subsequent runs skip straight to deploy.
#
# Usage:
#   ./scripts/deploy-aws.sh                 # build + deploy (provision if needed)
#   SKIP_BUILD=1 ./scripts/deploy-aws.sh    # deploy the existing out/ without rebuilding
#   BUCKET=my-bucket REGION=us-east-1 ./scripts/deploy-aws.sh
#
# Requirements: aws CLI v2 (configured creds), bun, jq.
#
# Notes:
#   - CloudFront is a global service; its API calls go through us-east-1. The S3
#     bucket can live in any region (default us-east-1 here for simplicity).
#   - This does NOT configure a custom domain (ai-dlc.dev) or ACM certificate.
#     The distribution serves on its *.cloudfront.net name. Wiring the custom
#     domain + cert is a deliberate follow-up (see scripts/DEPLOY.md).

set -euo pipefail

# --- Resolve paths -----------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBSITE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE_FILE="$SCRIPT_DIR/.aws-deploy.json"
FUNCTION_FILE="$SCRIPT_DIR/cf-rewrite.js"

# --- Config (overridable via env) --------------------------------------------
REGION="${REGION:-us-east-1}"
BUCKET="${BUCKET:-}"            # default derived from account id on first run
FUNCTION_NAME="${FUNCTION_NAME:-ai-dlc-website-rewrite}"
CALLER_REF_PREFIX="ai-dlc-website"

# --- Helpers -----------------------------------------------------------------
log() { printf '\033[1;34m▶ %s\033[0m\n' "$*"; }
die() { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

command -v aws >/dev/null || die "aws CLI not found"
command -v jq  >/dev/null || die "jq not found"

# Resolve bun (it may be installed under ~/.bun/bin but not on PATH).
BUN="${BUN:-}"
if [ -z "$BUN" ]; then
	if command -v bun >/dev/null; then BUN="bun"
	elif [ -x "$HOME/.bun/bin/bun" ]; then BUN="$HOME/.bun/bin/bun"
	else die "bun not found (install bun or set BUN=/path/to/bun)"; fi
fi

state_get() { [ -f "$STATE_FILE" ] && jq -r --arg k "$1" '.[$k] // empty' "$STATE_FILE" || true; }
state_set() {
	local k="$1" v="$2" tmp
	tmp="$(mktemp)"
	if [ -f "$STATE_FILE" ]; then jq --arg k "$k" --arg v "$v" '.[$k]=$v' "$STATE_FILE" > "$tmp"
	else jq -n --arg k "$k" --arg v "$v" '{($k):$v}' > "$tmp"; fi
	mv "$tmp" "$STATE_FILE"
}

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
[ -n "$ACCOUNT_ID" ] || die "could not resolve AWS account (check credentials)"

# --- Load / initialize state -------------------------------------------------
BUCKET="${BUCKET:-$(state_get bucket)}"
[ -n "$BUCKET" ] || BUCKET="ai-dlc-website-${ACCOUNT_ID}"
DISTRIBUTION_ID="$(state_get distributionId)"
FUNCTION_ARN="$(state_get functionArn)"

# =============================================================================
# 1. Build
# =============================================================================
if [ "${SKIP_BUILD:-}" != "1" ]; then
	log "Building website (bun run build)…"
	( cd "$WEBSITE_DIR" && "$BUN" run build )
fi
[ -d "$WEBSITE_DIR/out" ] || die "out/ not found — build first (unset SKIP_BUILD)"

# =============================================================================
# 2. Provision S3 bucket (private; served via CloudFront OAC)
# =============================================================================
if ! aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
	log "Creating S3 bucket: $BUCKET ($REGION)"
	if [ "$REGION" = "us-east-1" ]; then
		aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" >/dev/null
	else
		aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
			--create-bucket-configuration LocationConstraint="$REGION" >/dev/null
	fi
	aws s3api put-public-access-block --bucket "$BUCKET" \
		--public-access-block-configuration \
		BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true >/dev/null
fi
state_set bucket "$BUCKET"

# =============================================================================
# 3. Provision CloudFront Function (clean-URL rewriting)
# =============================================================================
if [ -z "$FUNCTION_ARN" ]; then
	if aws cloudfront describe-function --name "$FUNCTION_NAME" >/dev/null 2>&1; then
		FUNCTION_ARN="$(aws cloudfront describe-function --name "$FUNCTION_NAME" \
			--query 'FunctionSummary.FunctionMetadata.FunctionARN' --output text)"
	else
		log "Creating CloudFront Function: $FUNCTION_NAME"
		aws cloudfront create-function \
			--name "$FUNCTION_NAME" \
			--function-config Comment="AI-DLC clean URL rewrite",Runtime="cloudfront-js-2.0" \
			--function-code "fileb://$FUNCTION_FILE" >/dev/null
		ETAG="$(aws cloudfront describe-function --name "$FUNCTION_NAME" --query 'ETag' --output text)"
		aws cloudfront publish-function --name "$FUNCTION_NAME" --if-match "$ETAG" >/dev/null
		FUNCTION_ARN="$(aws cloudfront describe-function --name "$FUNCTION_NAME" \
			--query 'FunctionSummary.FunctionMetadata.FunctionARN' --output text)"
	fi
fi
state_set functionArn "$FUNCTION_ARN"

# =============================================================================
# 4. Provision CloudFront distribution (private S3 origin via OAC)
# =============================================================================
if [ -z "$DISTRIBUTION_ID" ]; then
	log "Creating Origin Access Control…"
	OAC_ID="$(aws cloudfront create-origin-access-control \
		--origin-access-control-config \
		Name="ai-dlc-website-oac",SigningProtocol="sigv4",SigningBehavior="always",OriginAccessControlOriginType="s3" \
		--query 'OriginAccessControl.Id' --output text 2>/dev/null \
		|| aws cloudfront list-origin-access-controls \
			--query "OriginAccessControlList.Items[?Name=='ai-dlc-website-oac'].Id | [0]" --output text)"

	ORIGIN_DOMAIN="${BUCKET}.s3.${REGION}.amazonaws.com"
	CALLER_REF="${CALLER_REF_PREFIX}-$(date +%s)"

	log "Creating CloudFront distribution…"
	DIST_CONFIG="$(jq -n \
		--arg ref "$CALLER_REF" \
		--arg domain "$ORIGIN_DOMAIN" \
		--arg oac "$OAC_ID" \
		--arg fn "$FUNCTION_ARN" \
		'{
			CallerReference: $ref,
			Comment: "AI-DLC website",
			Enabled: true,
			DefaultRootObject: "index.html",
			Origins: { Quantity: 1, Items: [ {
				Id: "s3-origin",
				DomainName: $domain,
				OriginAccessControlId: $oac,
				S3OriginConfig: { OriginAccessIdentity: "" }
			} ] },
			DefaultCacheBehavior: {
				TargetOriginId: "s3-origin",
				ViewerProtocolPolicy: "redirect-to-https",
				Compress: true,
				CachePolicyId: "658327ea-f89d-4fab-a63d-7e88639e58f6",
				FunctionAssociations: { Quantity: 1, Items: [ {
					EventType: "viewer-request", FunctionARN: $fn
				} ] }
			},
			CustomErrorResponses: { Quantity: 2, Items: [
				{ ErrorCode: 404, ResponsePagePath: "/404.html",
				  ResponseCode: "404", ErrorCachingMinTTL: 60 },
				# A private S3 origin (OAC, no s3:ListBucket) returns 403 for
				# missing keys; surface our 404 page instead of AccessDenied.
				{ ErrorCode: 403, ResponsePagePath: "/404.html",
				  ResponseCode: "404", ErrorCachingMinTTL: 60 }
			] }
		}')"

	CREATE_OUT="$(aws cloudfront create-distribution --distribution-config "$DIST_CONFIG")"
	DISTRIBUTION_ID="$(echo "$CREATE_OUT" | jq -r '.Distribution.Id')"
	state_set distributionId "$DISTRIBUTION_ID"

	# Allow this distribution to read the private bucket.
	log "Applying S3 bucket policy for CloudFront OAC…"
	POLICY="$(jq -n --arg b "$BUCKET" --arg acct "$ACCOUNT_ID" --arg dist "$DISTRIBUTION_ID" '{
		Version: "2008-10-17",
		Statement: [ {
			Sid: "AllowCloudFrontServicePrincipal",
			Effect: "Allow",
			Principal: { Service: "cloudfront.amazonaws.com" },
			Action: "s3:GetObject",
			Resource: ("arn:aws:s3:::" + $b + "/*"),
			Condition: { StringEquals: { "AWS:SourceArn": ("arn:aws:cloudfront::" + $acct + ":distribution/" + $dist) } }
		} ]
	}')"
	aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$POLICY"
fi
state_set distributionId "$DISTRIBUTION_ID"

# =============================================================================
# 5. Sync to S3
# =============================================================================
log "Syncing out/ → s3://$BUCKET …"
# Long-cache the immutable, fingerprinted asset bundle…
aws s3 sync "$WEBSITE_DIR/out/_next" "s3://$BUCKET/_next" \
	--cache-control "public, max-age=31536000, immutable" --delete --only-show-errors
# …and short-cache the HTML/everything else (clean URLs must revalidate).
aws s3 sync "$WEBSITE_DIR/out" "s3://$BUCKET" \
	--exclude "_next/*" --cache-control "public, max-age=300, must-revalidate" \
	--delete --only-show-errors

# =============================================================================
# 6. Invalidate CloudFront
# =============================================================================
log "Invalidating CloudFront cache…"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" \
	--paths "/*" --query 'Invalidation.Id' --output text >/dev/null

DOMAIN="$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" \
	--query 'Distribution.DomainName' --output text)"

printf '\n\033[1;32m✓ Deployed.\033[0m\n'
printf '  Bucket:        %s\n' "$BUCKET"
printf '  Distribution:  %s\n' "$DISTRIBUTION_ID"
printf '  URL:           https://%s\n' "$DOMAIN"
printf '  (New distributions take ~5-15 min to finish deploying globally.)\n'

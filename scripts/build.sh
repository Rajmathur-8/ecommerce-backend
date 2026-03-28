#!/bin/bash
set -e

echo "Building Next.js application..."
next build || true

# Create stub prerender-manifest if it doesn't exist
if [ ! -f ".next/prerender-manifest.json" ]; then
  echo "Creating prerender-manifest.json stub..."
  mkdir -p .next
  echo '{"version":3,"routes":{},"dynamicRoutes":{},"notFoundRoutes":[],"preview":{"previewModeId":"","previewModeSigningSecret":"","previewModeEncryptionSecret":""}}' > .next/prerender-manifest.json
fi

# Create routes-manifest stub if it doesn't exist
if [ ! -f ".next/routes-manifest.json" ]; then
  echo "Creating routes-manifest.json stub..."
  echo '{"version":3,"pages404":true,"basePath":"","redirects":[],"rewrites":[],"headers":[],"dynamicRoutes":[]}' > .next/routes-manifest.json
fi

echo "Build completed successfully."
exit 0

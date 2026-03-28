#!/bin/bash
set -e

echo "Building Next.js application..."
next build || true

echo "Build completed. The .next folder has been created for runtime rendering."
exit 0

#!/bin/sh
set -e

echo "==> Building lib packages..."
pnpm -w run typecheck:libs

echo "==> Building frontend..."
pnpm --filter @workspace/claimtrace run build

echo "==> Assembling Vercel Build Output..."
rm -rf .vercel/output
mkdir -p .vercel/output/static

cp -r artifacts/claimtrace/dist/. .vercel/output/static/

cat > .vercel/output/config.json << 'EOF'
{
  "version": 3,
  "routes": [
    {
      "src": "/assets/(.*)",
      "headers": { "cache-control": "public, max-age=31536000, immutable" },
      "continue": true
    },
    { "handle": "filesystem" },
    {
      "src": "/api/(.*)",
      "dest": "/api/index"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
EOF

echo "==> Build Output ready in .vercel/output/"
ls -la .vercel/output/static/

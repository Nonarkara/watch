#!/usr/bin/env bash
# One-time install of the live attention pipeline. Run on the M5 (it has the
# Cloudflare login) from the repo root, ONLY after Non says go.
#
# What it does:
#   1. creates (or reuses) the KV namespace "watch-live"
#   2. renders worker/live/wrangler.toml and the root wrangler.toml (Pages KV binding)
#   3. deploys the Worker "watch-live" with one daily cron (06:40 UTC = 13:40 ICT)
#   4. seeds KV once from this machine so the site has a snapshot before the first cron
# What it does NOT do: deploy the Pages site. That stays a separate, explicit step:
#   npm run build && npx wrangler pages deploy dist --branch main
set -euo pipefail
cd "$(dirname "$0")/.."

WR="npx -y wrangler@4"
NS_TITLE="watch-live"

node -e 'const [a]=process.versions.node.split(".").map(Number); if(a<20){console.error("Node 20+ needed");process.exit(1)}'
$WR whoami >/dev/null

echo "→ KV namespace"
ID=$($WR kv namespace list 2>/dev/null | node -e '
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
    try{const j=JSON.parse(s.slice(s.indexOf("[")));const n=j.find(x=>x.title===process.argv[1]||x.title.endsWith("-"+process.argv[1]));process.stdout.write(n?n.id:"")}catch{process.stdout.write("")}
  })' "$NS_TITLE")
if [ -z "$ID" ]; then
  $WR kv namespace create "$NS_TITLE"
  ID=$($WR kv namespace list | node -e '
    let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s.slice(s.indexOf("[")));const n=j.find(x=>x.title===process.argv[1]||x.title.endsWith("-"+process.argv[1]));process.stdout.write(n?n.id:"")})' "$NS_TITLE")
fi
[ -n "$ID" ] || { echo "could not find the KV namespace id"; exit 1; }
echo "  id $ID"

echo "→ wrangler.toml files"
sed "s/__KV_ID__/$ID/" worker/live/wrangler.toml.example > worker/live/wrangler.toml
if [ ! -f wrangler.toml ]; then
  cat > wrangler.toml <<TOML
# Pages project "watch": binds the live-attention KV to functions/live/.
name = "watch"
pages_build_output_dir = "dist"
compatibility_date = "2026-10-01"

[[kv_namespaces]]
binding = "WATCH_LIVE"
id = "$ID"
TOML
else
  echo "  wrangler.toml already exists; check it binds WATCH_LIVE = $ID"
fi

echo "→ deploy Worker watch-live (cron only, no routes)"
$WR deploy -c worker/live/wrangler.toml

echo "→ seed KV from this machine (one run, 20 Wikimedia requests)"
TMP=$(mktemp -t watch-attention.XXXXXX)
node worker/live/run-local.mjs --out "$TMP"
$WR kv key put attention:latest --path "$TMP" --namespace-id "$ID" --remote
rm -f "$TMP"

cat <<NEXT

Done. Commit worker/live/wrangler.toml and wrangler.toml (the KV id is not a secret).
The site starts reading /live/ only after the Pages deploy, which needs its own go:
  npm run build && npx wrangler pages deploy dist --branch main
Then check:
  curl -s https://watch.nonarkara.org/live/health.json
Workers Free allows 5 cron triggers per account; if the deploy above refused the
cron, that limit is the reason.
NEXT

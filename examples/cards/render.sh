#!/usr/bin/env bash
# Render the README images from card.html: social-card.jpg at the repo root
# and examples/cards/<skill>.jpg for each skill. Needs Google Chrome and sips
# (macOS). The store card shows the gallery, so no export is needed first.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PORT="${PORT:-4680}"
TMP="$(mktemp -d)"

python3 -m http.server "$PORT" --directory "$ROOT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER; rm -rf "$TMP"' EXIT
sleep 1

for card in social mobile desktop store tokens; do
  "$CHROME" --headless=new --window-size=2000,1000 --hide-scrollbars \
    --virtual-time-budget=15000 --screenshot="$TMP/$card.png" \
    "http://localhost:$PORT/examples/cards/card.html?card=$card" 2>/dev/null
  if [ "$card" = social ]; then out="$ROOT/social-card.jpg"; else out="$ROOT/examples/cards/$card.jpg"; fi
  sips -s format jpeg -s formatOptions 90 "$TMP/$card.png" --out "$out" >/dev/null
  echo "$out"
done

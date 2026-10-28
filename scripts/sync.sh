#!/usr/bin/env bash
# Copy the shared engine and references into every skill and example.
#
# Skills install one folder at a time (npx skills add, plugin installs), so a
# skill can never reach into a sibling folder at runtime. shared/ is the one
# place these files are edited; this script copies them where they are used,
# and the copies are committed.
#
# Usage: scripts/sync.sh           copy shared files into place
#        scripts/sync.sh --check   exit 1 if any copy differs (CI)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHECK=0
[ "${1:-}" = "--check" ] && CHECK=1

# destination-dir  source-files...   (paths relative to shared/, or to the
# repo root when they start with skills/ — examples carry copies of their
# skill's own engine files too)
MANIFEST='
skills/mobile-mockups/assets          assets/mockup-core.js assets/mockup-core.css assets/phone.js assets/phone.css
skills/mobile-mockups/references      references/design-system.md references/review.md references/handoff.md
skills/desktop-mockups/assets         assets/mockup-core.js assets/mockup-core.css assets/window.js assets/window.css
skills/desktop-mockups/references     references/design-system.md references/review.md references/handoff.md
skills/store-screenshots/assets       assets/mockup-core.js assets/mockup-core.css assets/phone.js assets/phone.css assets/window.js assets/window.css
skills/store-screenshots/references   references/review.md
skills/app-icon/assets                assets/mockup-core.css
examples/fieldnote/mobile             assets/mockup-core.js assets/mockup-core.css assets/phone.js assets/phone.css
examples/fieldnote/desktop            assets/mockup-core.js assets/mockup-core.css assets/window.js assets/window.css
examples/fieldnote/store              assets/mockup-core.js assets/mockup-core.css assets/phone.js assets/phone.css assets/window.js assets/window.css skills/store-screenshots/assets/store.js skills/store-screenshots/assets/store.css skills/store-screenshots/assets/export.sh
examples/fieldnote/icon               assets/mockup-core.css skills/app-icon/assets/icon.js skills/app-icon/assets/icon.css skills/app-icon/assets/export-icons.sh skills/app-icon/assets/outline-text.py
'

status=0
while read -r dest files; do
  [ -z "$dest" ] && continue
  for f in $files; do
    case "$f" in
      skills/*) src="$ROOT/$f" ;;
      *) src="$ROOT/shared/$f" ;;
    esac
    out="$ROOT/$dest/$(basename "$f")"
    [ -f "$src" ] || { echo "missing ${src#$ROOT/}" >&2; status=1; continue; }
    if [ $CHECK -eq 1 ]; then
      if ! cmp -s "$src" "$out"; then
        echo "out of sync: $dest/$(basename "$f")  (run scripts/sync.sh)" >&2
        status=1
      fi
    else
      mkdir -p "$ROOT/$dest"
      cp -p "$src" "$out"
    fi
  done
done <<< "$MANIFEST"
exit $status

#!/usr/bin/env bash
# Export store-listing graphics from store.html with headless Chrome.
#
# Usage: export.sh [apple|google|mac|all]      (default: all)
#   STORE_PAGE=http://localhost:4680/store.html export.sh   capture over http
#   OUT=path/to/out export.sh                                output folder
#   ICON=path/to/icon-1024.png export.sh                     also write google/icon.png
#
# THE RULE: capture each frame at its AUTHORING size × an integer scale, then
# resample the PNG to the exact store size. Never shrink or reshape the
# capture window to hit a store size — the page reflows and headlines
# re-wrap. Resampling a finished image by a fraction of a percent is
# invisible; a re-wrapped headline is not.
#
# ---------------------------------------------------------------------------
# Size table. Authoring size (CSS px) × scale = capture; capture → store size.
# Verify the store sizes against App Store Connect / Play Console before a
# submission — they change.
#
#   kind      authoring   scale  capture     store outputs
#   shot      440×956     3      1320×2868   apple/iphone-6.9 (as captured)
#                                            apple/iphone-6.5 1284×2778
#   shot+play 440×782     3      1320×2346   google/phone     1080×1920 (9:16)
#   sub       512×512     2      1024×1024   apple/iap        (as captured)
#   feature   512×250     2      1024×500    google/feature-graphic.png
#   mac       1440×900    2      2880×1800   mac/2880x1800 (as captured)
#                                            mac/1280x800
# ---------------------------------------------------------------------------
SHOT_AUTHOR=440,956;   SHOT_SCALE=3; IPHONE_65=1284x2778
PLAY_AUTHOR=440,782;   PLAY_SCALE=3; PLAY_PHONE=1080x1920
SUB_AUTHOR=512,512;    SUB_SCALE=2
FEAT_AUTHOR=512,250;   FEAT_SCALE=2
MAC_AUTHOR=1440,900;   MAC_SCALE=2;  MAC_SMALL=1280x800
ICON_SIZE=512
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PAGE="${STORE_PAGE:-file://$HERE/store.html}"
OUT="${OUT:-$HERE/out}"
TARGET="${1:-all}"

CHROME="${CHROME:-}"
if [ -z "$CHROME" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
           "/Applications/Chromium.app/Contents/MacOS/Chromium" \
           "$(command -v google-chrome || true)" "$(command -v chromium || true)"; do
    [ -n "$c" ] && [ -x "$c" ] && CHROME="$c" && break
  done
fi
[ -n "$CHROME" ] || { echo "No Chrome/Chromium found; set CHROME=/path/to/chrome" >&2; exit 1; }

# One frame per URL, window = authoring size, integer device scale. The
# virtual-time budget lets webfonts land before the capture.
shoot() { # out.png  author(W,H)  scale  query
  "$CHROME" --headless=new \
    --force-device-scale-factor="$3" \
    --window-size="$2" \
    --hide-scrollbars \
    --virtual-time-budget=15000 \
    --screenshot="$1" \
    "$PAGE$4" >/dev/null 2>&1
}

# Exact-size resample (and flatten: store screenshots must not carry alpha).
resample() { # in.png  WxH  out.png
  local w="${2%x*}" h="${2#*x}"
  if command -v sips >/dev/null; then
    sips -z "$h" "$w" "$1" --out "$3" >/dev/null
  elif command -v magick >/dev/null; then
    magick "$1" -resize "${w}x${h}!" -background white -alpha remove -alpha off "$3"
  else
    convert "$1" -resize "${w}x${h}!" -background white -alpha remove -alpha off "$3"
  fi
}

# Frame list comes from the page itself (?manifest), so names and order live
# in one place: the shots array in store.html.
MANIFEST="$("$CHROME" --headless=new --virtual-time-budget=5000 --dump-dom "$PAGE?manifest" 2>/dev/null \
  | sed -e 's/.*<pre id="manifest">//' -e 's/<\/pre>.*//' | grep -E '^(shot|sub|feature|mac) [0-9]+ ' || true)"
[ -n "$MANIFEST" ] || { echo "Empty manifest from $PAGE?manifest — does the page render?" >&2; exit 1; }
items() { echo "$MANIFEST" | awk -v k="$1" '$1==k {print $2, $3}'; }

export_apple() {
  mkdir -p "$OUT/apple/iphone-6.9" "$OUT/apple/iphone-6.5" "$OUT/apple/iap"
  while read -r i name; do
    [ -z "$i" ] && continue
    shoot "$OUT/apple/iphone-6.9/$name.png" "$SHOT_AUTHOR" "$SHOT_SCALE" "?shot=$i"
    resample "$OUT/apple/iphone-6.9/$name.png" "$IPHONE_65" "$OUT/apple/iphone-6.5/$name.png"
    echo "apple/iphone-6.9|6.5/$name.png"
  done <<< "$(items shot)"
  while read -r i name; do
    [ -z "$i" ] && continue
    shoot "$OUT/apple/iap/$name.png" "$SUB_AUTHOR" "$SUB_SCALE" "?sub=$i"
    echo "apple/iap/$name.png"
  done <<< "$(items sub)"
}

export_google() {
  mkdir -p "$OUT/google/phone"
  while read -r i name; do
    [ -z "$i" ] && continue
    shoot "$OUT/google/phone/$name.png" "$PLAY_AUTHOR" "$PLAY_SCALE" "?shot=$i&platform=android"
    resample "$OUT/google/phone/$name.png" "$PLAY_PHONE" "$OUT/google/phone/$name.png"
    echo "google/phone/$name.png"
  done <<< "$(items shot)"
  if [ -n "$(items feature)" ]; then
    shoot "$OUT/google/feature-graphic.png" "$FEAT_AUTHOR" "$FEAT_SCALE" "?feature"
    echo "google/feature-graphic.png"
  fi
  if [ -n "${ICON:-}" ]; then
    resample "$ICON" "${ICON_SIZE}x${ICON_SIZE}" "$OUT/google/icon.png"
    echo "google/icon.png"
  fi
}

export_mac() {
  [ -n "$(items mac)" ] || { echo "(no mac frames)"; return; }
  mkdir -p "$OUT/mac/2880x1800" "$OUT/mac/1280x800"
  while read -r i name; do
    [ -z "$i" ] && continue
    shoot "$OUT/mac/2880x1800/$name.png" "$MAC_AUTHOR" "$MAC_SCALE" "?mac=$i"
    resample "$OUT/mac/2880x1800/$name.png" "$MAC_SMALL" "$OUT/mac/1280x800/$name.png"
    echo "mac/{2880x1800,1280x800}/$name.png"
  done <<< "$(items mac)"
}

case "$TARGET" in
  apple) export_apple ;;
  google) export_google ;;
  mac) export_mac ;;
  all) export_apple; export_google; export_mac ;;
  *) echo "usage: $0 [apple|google|mac|all]" >&2; exit 2 ;;
esac

# Report every file's real pixel size — read it, don't trust it.
echo
find "$OUT" -name '*.png' | sort | while read -r f; do
  if command -v sips >/dev/null; then
    dims="$(sips -g pixelWidth -g pixelHeight "$f" | awk '/pixel/{printf "%s ", $2}')"
  else
    dims="$(magick identify -format '%w %h ' "$f" 2>/dev/null || identify -format '%w %h ' "$f")"
  fi
  printf '%-11s %s\n' "$dims" "${f#"$OUT"/}"
done

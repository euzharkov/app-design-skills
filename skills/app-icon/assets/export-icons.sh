#!/usr/bin/env bash
# export-icons.sh — render one concept's SVG masters into every platform file.
#
# What it produces (all from 1024-grid SVG masters; see icon.js for geometry):
#
#   PLATFORM  FILE                                              PX         NOTES
#   iOS       ios/AppIcon-1024.png                              1024       light, opaque, no alpha (App Store)
#             ios/AppIcon-1024-dark.png                         1024       transparent bg; OS adds dark plate
#             ios/AppIcon-1024-tinted.png                       1024       grayscale, transparent; OS tints
#   Android   android/mipmap-mdpi/ic_launcher_{foreground,background,monochrome}.png     108  (108dp @1x)
#             android/mipmap-hdpi/…                             162        @1.5x
#             android/mipmap-xhdpi/…                            216        @2x
#             android/mipmap-xxhdpi/…                           324        @3x
#             android/mipmap-xxxhdpi/…                          432        @4x
#             android/mipmap-anydpi-v26/ic_launcher{,_round}.xml           adaptive-icon wiring
#             android/play-store-512.png                        512        opaque full square (Play masks it)
#   macOS     macos/AppIcon.iconset/icon_16x16.png … icon_512x512@2x.png   16,32,32,64,128,256,256,512,512,1024
#             macos/AppIcon.icns                                           via iconutil (macOS only)
#   Web       web/favicon.svg                                   vector     rounded master, artSmall if declared
#             web/favicon-32.png                                32
#             web/apple-touch-icon.png                          180        opaque full square (iOS rounds it)
#             web/icon-192.png, web/icon-512.png                192, 512   manifest purpose "any"
#             web/icon-maskable-512.png                         512        manifest purpose "maskable"
#
# Usage:
#   export-icons.sh <workbench-url> <concept-id> <out-dir>
#       e.g. export-icons.sh http://localhost:4680/icon.html leaf design/icon/out
#   export-icons.sh --masters <dir-of-master-svgs> <out-dir>
#
# Options (before positional args):
#   --allow-text      export even if a master still contains <text> (not recommended)
#   --renderer X      force "rsvg" (rsvg-convert) or "chrome" (headless Chrome + sips)
#
# Needs: python3; rsvg-convert (brew install librsvg) or Google Chrome; Chrome
# is also needed to pull masters out of the workbench (?masters=<id>).
# macOS extras: sips (sizes/verification), iconutil (.icns).
set -euo pipefail

ALLOW_TEXT=0
RENDERER=""
MASTERS_DIR=""
while [ $# -gt 0 ]; do
  case "$1" in
    --allow-text) ALLOW_TEXT=1; shift ;;
    --renderer) RENDERER="$2"; shift 2 ;;
    --masters) MASTERS_DIR="$2"; shift 2 ;;
    -h|--help) sed -n '2,40p' "$0"; exit 0 ;;
    *) break ;;
  esac
done

if [ -n "$MASTERS_DIR" ]; then
  [ $# -eq 1 ] || { echo "usage: $0 --masters <dir> <out-dir>" >&2; exit 2; }
  OUT="$1"
else
  [ $# -eq 3 ] || { echo "usage: $0 <workbench-url> <concept-id> <out-dir>" >&2; exit 2; }
  URL="$1"; CONCEPT="$2"; OUT="$3"
fi

find_chrome() {
  if [ -n "${CHROME:-}" ]; then echo "$CHROME"; return; fi
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
           "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
    [ -x "$c" ] && { echo "$c"; return; }
  done
  for c in google-chrome google-chrome-stable chromium chromium-browser; do
    command -v "$c" >/dev/null 2>&1 && { command -v "$c"; return; }
  done
}
CHROME_BIN="$(find_chrome || true)"

if [ -z "$RENDERER" ]; then
  if command -v rsvg-convert >/dev/null 2>&1; then RENDERER=rsvg
  elif [ -n "$CHROME_BIN" ]; then RENDERER=chrome
  else echo "need rsvg-convert or Google Chrome" >&2; exit 1; fi
fi
if [ "$RENDERER" = chrome ]; then
  [ -n "$CHROME_BIN" ] || { echo "Chrome not found (set CHROME=…)" >&2; exit 1; }
  command -v sips >/dev/null 2>&1 || { echo "chrome renderer needs sips (macOS) for resizing" >&2; exit 1; }
  echo "renderer: headless Chrome (rsvg-convert not found) — 1024 render, sips downscale"
else
  echo "renderer: rsvg-convert"
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"

# ---- 1. masters -------------------------------------------------------------
if [ -z "$MASTERS_DIR" ]; then
  [ -n "$CHROME_BIN" ] || { echo "Chrome is needed to read masters from the workbench; or pass --masters DIR" >&2; exit 1; }
  case "$URL" in *\?*) MURL="$URL&masters=$CONCEPT" ;; *) MURL="$URL?masters=$CONCEPT" ;; esac
  "$CHROME_BIN" --headless=new --disable-gpu --virtual-time-budget=5000 --dump-dom "$MURL" > "$TMP/masters.html" 2>/dev/null
  MASTERS_DIR="$OUT/masters"
  python3 - "$TMP/masters.html" "$MASTERS_DIR" <<'PY'
import os, re, sys
src, dest = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf-8").read()
items = re.findall(r'<script type="image/svg\+xml" data-file="([^"]+)">(.*?)</script>', s, re.S)
if not items:
    m = re.search(r'<p id="error">(.*?)</p>', s)
    sys.exit("no masters found: " + (m.group(1) if m else "is the workbench served over http, and the concept id right?"))
os.makedirs(dest, exist_ok=True)
for name, svg in items:
    with open(os.path.join(dest, name), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n' + svg.strip() + "\n")
print(f"masters: {len(items)} files -> {dest}")
PY
fi
MASTERS_DIR="$(cd "$MASTERS_DIR" && pwd)"

for f in ios-light ios-dark ios-tinted android-foreground android-background android-monochrome maskable macos favicon; do
  [ -f "$MASTERS_DIR/$f.svg" ] || { echo "missing master $f.svg in $MASTERS_DIR" >&2; exit 1; }
done

# Live <text> renders with whatever fonts the exporting machine has. Outline it.
if grep -l '<text' "$MASTERS_DIR"/*.svg >/dev/null 2>&1; then
  echo "masters contain live <text>: $(grep -l '<text' "$MASTERS_DIR"/*.svg | xargs -n1 basename | tr '\n' ' ')" >&2
  if [ $ALLOW_TEXT -eq 0 ]; then
    echo "outline letterforms to paths first (outline-text.py), or pass --allow-text" >&2
    exit 1
  fi
fi

# ---- 2. rendering -------------------------------------------------------------
EXPECT="$TMP/expect.txt"
: > "$EXPECT"

chrome_1024() { # svg -> cached 1024 png
  local svg="$1" key out html
  key="$(basename "$svg" .svg)"
  out="$TMP/$key-1024.png"
  if [ ! -f "$out" ]; then
    html="$TMP/$key.html"
    printf '<!doctype html><html><body style="margin:0;background:transparent"><img src="file://%s" width="1024" height="1024" style="display:block"></body></html>' "$svg" > "$html"
    "$CHROME_BIN" --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 \
      --allow-file-access-from-files --window-size=1024,1024 --screenshot="$out" "file://$html" >/dev/null 2>&1
  fi
  echo "$out"
}

render() { # svg size out
  local svg="$1" size="$2" out="$3"
  mkdir -p "$(dirname "$out")"
  if [ "$RENDERER" = rsvg ]; then
    rsvg-convert -w "$size" -h "$size" "$svg" -o "$out"
  else
    cp "$(chrome_1024 "$svg")" "$out"
    [ "$size" -eq 1024 ] || sips -z "$size" "$size" "$out" >/dev/null
  fi
  echo "$out $size" >> "$EXPECT"
}

flatten() { # drop the alpha channel from an opaque image (App Store / Play want none)
  local f="$1"
  if command -v sips >/dev/null 2>&1 && file "$f" | grep -q 'RGBA'; then
    sips -s format bmp "$f" --out "$TMP/flat.bmp" >/dev/null
    sips -s format png "$TMP/flat.bmp" --out "$f" >/dev/null
  fi
}

M="$MASTERS_DIR"

# iOS — single-size 1024 per appearance
render "$M/ios-light.svg" 1024 "$OUT/ios/AppIcon-1024.png"; flatten "$OUT/ios/AppIcon-1024.png"
render "$M/ios-dark.svg" 1024 "$OUT/ios/AppIcon-1024-dark.png"
render "$M/ios-tinted.svg" 1024 "$OUT/ios/AppIcon-1024-tinted.png"

# Android — adaptive layers per density (108dp × scale) + Play Store
for d in mdpi:108 hdpi:162 xhdpi:216 xxhdpi:324 xxxhdpi:432; do
  name="${d%%:*}"; px="${d##*:}"
  for layer in foreground background monochrome; do
    render "$M/android-$layer.svg" "$px" "$OUT/android/mipmap-$name/ic_launcher_$layer.png"
  done
done
mkdir -p "$OUT/android/mipmap-anydpi-v26"
for n in ic_launcher ic_launcher_round; do
  cat > "$OUT/android/mipmap-anydpi-v26/$n.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>
XML
done
render "$M/ios-light.svg" 512 "$OUT/android/play-store-512.png"; flatten "$OUT/android/play-store-512.png"

# macOS — .iconset (name:px) + .icns
SET="$OUT/macos/AppIcon.iconset"
for e in 16x16:16 16x16@2x:32 32x32:32 32x32@2x:64 128x128:128 128x128@2x:256 256x256:256 256x256@2x:512 512x512:512 512x512@2x:1024; do
  render "$M/macos.svg" "${e##*:}" "$SET/icon_${e%%:*}.png"
done
if command -v iconutil >/dev/null 2>&1; then
  iconutil -c icns "$SET" -o "$OUT/macos/AppIcon.icns"
else
  echo "iconutil not found (not macOS?) — .iconset written, .icns skipped" >&2
fi

# Web
mkdir -p "$OUT/web"
sed '1{/^<?xml/d;}' "$M/favicon.svg" > "$OUT/web/favicon.svg"
render "$M/favicon.svg" 32 "$OUT/web/favicon-32.png"
render "$M/ios-light.svg" 180 "$OUT/web/apple-touch-icon.png"; flatten "$OUT/web/apple-touch-icon.png"
render "$M/favicon.svg" 192 "$OUT/web/icon-192.png"
render "$M/favicon.svg" 512 "$OUT/web/icon-512.png"
render "$M/maskable.svg" 512 "$OUT/web/icon-maskable-512.png"; flatten "$OUT/web/icon-maskable-512.png"

# ---- 3. verify ----------------------------------------------------------------
fail=0
count=0
while read -r f want; do
  if command -v sips >/dev/null 2>&1; then
    w=$(sips -g pixelWidth "$f" | awk '/pixelWidth/{print $2}')
    h=$(sips -g pixelHeight "$f" | awk '/pixelHeight/{print $2}')
  else
    read -r w h < <(python3 -c 'import struct,sys;d=open(sys.argv[1],"rb").read(24);print(*struct.unpack(">II",d[16:24]))' "$f")
  fi
  count=$((count + 1))
  if [ "$w" != "$want" ] || [ "$h" != "$want" ]; then
    echo "SIZE MISMATCH ${f#$OUT/}: ${w}x${h}, expected ${want}x${want}" >&2; fail=1
  fi
done < "$EXPECT"
for f in "$OUT/ios/AppIcon-1024.png" "$OUT/android/play-store-512.png" "$OUT/web/apple-touch-icon.png"; do
  file "$f" | grep -q RGBA && { echo "ALPHA in opaque file ${f#$OUT/}" >&2; fail=1; }
done
[ -f "$OUT/macos/AppIcon.icns" ] && echo "icns: $(du -h "$OUT/macos/AppIcon.icns" | cut -f1)"
if [ $fail -eq 0 ]; then
  echo "verified: $count PNGs at expected sizes; opaque files carry no alpha -> $OUT"
else
  exit 1
fi

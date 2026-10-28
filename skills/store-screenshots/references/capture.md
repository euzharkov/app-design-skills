# Capture troubleshooting

`export.sh` drives headless Chrome one frame per URL:

```sh
chrome --headless=new --force-device-scale-factor=3 --window-size=440,956 \
  --hide-scrollbars --virtual-time-budget=15000 \
  --screenshot=out.png "store.html?shot=0"
```

then resamples with `sips -z H W` (macOS) or
`magick in.png -resize WxH! -alpha remove out.png`. When something goes
wrong, it is almost always one of the cases below.

## Headlines wrap differently in the export than in the gallery

The capture window wasn't the authoring size. **Capture at the authoring
size × an integer scale, then resample** — never shrink or reshape the
window to hit a store size (1284 wide, say). A different viewport is a
different layout: `text-wrap: balance` re-balances, a word drops to a new
line, the copy band overflows into the device. A 1–3% resample of the
finished bitmap is invisible.

The same applies to `--force-device-scale-factor`: integer only. 2.9
produces subpixel layout and blurry hairlines.

## One frame per URL; never deep-scroll a long page

Capture each frame from its own `?shot=N` / `?sub=N` / `?feature` /
`?mac=N` URL, which renders only that frame at the page origin. Don't
capture the gallery and crop, and don't scroll a long page to a frame:
deep scrolls in headless mode stall or capture half-painted content.

## The capture hangs or comes back blank in a sandboxed browser

Some sandboxed or automated browsers stall on pages that combine CSS
`zoom` with wide horizontal-scrolling rails (the gallery has both). If you
must capture from the gallery (e.g. a review screenshot of one section),
**hide every sibling section except the target first** —
`?solo=<section-id>` does this — and keep zoom at 100%. Export mode avoids
the problem entirely: it puts exactly one frame in the DOM, no rails, no
zoom.

## Webfonts missing (system serif/sans in the PNG)

`--screenshot` fires at load; webfonts may arrive later.
`--virtual-time-budget=15000` lets virtual time run until network and
timers settle — keep it, and raise it on slow connections. Still wrong?
Check the font `<link>` is in `store.html`'s head (copied from the mockup
pages), that the family name matches `--font-display`, and that the
machine is online — or self-host the font files beside the page.

Icon fonts (an icon library loaded by script) need the same budget; a
missing icon renders as an empty box.

## Wrong pixel size

Read the size report `export.sh` prints (`sips -g pixelWidth -g
pixelHeight`). Common causes: a non-integer scale; the window size not
matching the frame's authoring size (the page then has margins or
scrollbars — `--hide-scrollbars` handles the latter); a frame whose CSS
size changed without updating the size table.

## Right size, wrong picture

A blank, half-loaded or error-page capture still has the right
dimensions. Open several PNGs and look. Then: check the URL in a normal
browser; check the console (a template-literal typo blanks the whole
page); for `file://` capture, check relative paths (`../mobile/design-
system.css` resolves against the page, not the shell's cwd). Set
`STORE_PAGE=http://localhost:PORT/store.html` to capture over http.

## Transparency rejected by the store

Both stores reject alpha in screenshots and Play's feature graphic. The
frames are opaque and Chrome writes RGB, but check with
`sips -g hasAlpha file.png`; the ImageMagick path in `export.sh` flattens
with `-alpha remove`.

## Dark set

`&theme=dark` works on every export URL. For a separate dark set, run the
capture loop again with the param into a sibling folder — stores don't have
a dark slot, so pick one set per listing; the night frame mid-rail usually
does the job.

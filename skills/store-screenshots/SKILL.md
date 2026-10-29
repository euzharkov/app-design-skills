---
name: store-screenshots
description: >-
  Lay out store listing screenshots from an existing HTML mockup: place the
  mockup's screens into store-size canvases (App Store iPhone, Google Play
  phone and feature graphic, Mac App Store, in-app purchase images), name
  and order the shots, check the text on each canvas for contrast and fit,
  and export PNGs at the exact pixel sizes each store accepts. Use whenever
  the user wants App Store or Play Store screenshots, a feature graphic, IAP
  or subscription images, "marketing screenshots", or store assets for a
  launch or update, even if they never mention mockups or HTML. The
  headlines, captions and shot order are the user's; the skill owns the
  canvases and the export. Needs a mockup from mobile-mockups or
  desktop-mockups.
---

# Store Screenshots

A store screenshot is a mockup screen placed on a store-size canvas with a
line or two of text above it. This skill owns the canvas and the export: the
frame sizes, how screens are placed and scaled, how each shot is named and
ordered, how the text is checked against its background, and how every shot
becomes a PNG at the exact size a store accepts.

It does not decide what the shots say. The headlines, captions, eyebrows,
which screens to show and in what order: those come from the person. Take
them as given. Where they leave a gap (a missing caption, an unnamed shot),
fill it with the plainest wording that describes the screen, and say which
ones you filled. Don't rewrite their headlines, propose a story, or coach
the listing unless asked. Listing text (name, subtitle, keywords,
descriptions) is out of scope.

The output is a `store.html` page next to the mockup, `export.sh` beside it,
and folders of PNGs:

```
out/apple/iphone-6.9/   out/apple/iphone-6.5/   out/apple/iap/
out/google/phone/       out/google/feature-graphic.png
out/mac/2880x1800/      out/mac/1280x800/
```

Part of a family that shares the canvas engine (`mockup-core.*`):
**mobile-mockups** (phone screens) and **desktop-mockups** (macOS and
Windows windows). Store shots place screens built there; they don't build
new ones.

## Phase 0: detect the source mockup

This skill needs an existing mockup directory: `tokens.css` and pages of
screens built with `phone()` or `win()`, with `mockup-core.js` beside them.
Older mockups have `design-system.css` (and `DESIGN-SYSTEM.md`) instead; use
them the same way. Look in `design/mockup/`, `mockup/`, or wherever the
token file lives.

- Found: read `MOCKUP.md` (or `DESIGN-SYSTEM.md`) and the pages whose
  screens the shots will use. Note their screen ids
  (`<section-id>--<name>[--<tag>]`, see `references/canvas.md` in the
  mockup skills).
- Not found: stop and say so. Point to **mobile-mockups** (phone apps) or
  **desktop-mockups** (Mac and Windows apps) to lay out the screens first.

## Phase 1: setup questions

One batched round, only about the canvases and the export:

- Stores: App Store, Google Play, Mac App Store (only if a desktop mockup
  exists).
- Sizes: the defaults in `references/store-specs.md`, or specific slots the
  person needs (iPad and Play tablet need a tablet frame the engine doesn't
  ship).
- In-app purchase images, and Play's feature graphic: wanted or not.
- Locales: one set per locale; the headlines for each come from the person.
- Light, dark, or both; which frames, if any, are forced dark.
- The shots, in upload order: for each, the screen id to place and the
  eyebrow, headline and caption they want.

If they give screens but no wording, use each screen's name as the headline
and leave eyebrow and caption empty, and say so. If they give neither, stop
and ask; choosing the shots is theirs. Default stores: App Store, plus Play
when the mockup has Android screens.

## Phase 2: build the shots

1. Copy from this skill's `assets/` into the mockup directory (or a sibling
   `store/` folder): `store.html`, `store.css`, `store.js`, `export.sh`, and
   `mockup-core.*`, `phone.*`, `window.*` if there are no current copies.
2. Give `store.html` the same `<head>` as the mockup pages: fonts, icon
   library, and the same token file (`tokens.css`, or `../mobile/tokens.css`
   from a sibling folder). Copy the screen CSS the placed screens need,
   unchanged.
3. Copy each placed screen's template literal into `store.html` unchanged.
   Make phone screens a function of platform,
   `(platform) => phone(…, { platform })`, so the Play cut gets Android
   chrome from one source. Platform-specific words that already differ in
   the mockup's Android screen come from that screen.
4. Declare frames as data and call `renderStorePage(cfg)`:

   ```js
   renderStorePage({
     title, intro,
     shots: [{ id, eyebrow, headline, caption, device, scale, y,
               hero, night, overlay, label, android: { …overrides } }],
     subs: [{ id, word, tag, glyph, long }],
     feature: { mark, headline, art },
     mac: [{ id, eyebrow, headline, caption, device, scale, y, night }],
     pageNotes: [note(…)],
   });
   ```

   `device` is any rendered frame HTML (`phone(…)`, `win(…)`) or a function
   of platform. `scale` (default 1) and `y` place the device in the frame;
   `overlay` is an element above the device; `hero` gives the frame a taller
   copy band; `night` forces it dark in both themes; `android: {…}`
   overrides any field for the Play cut only.
5. Frame layout for this page only (a glow position, an overlay, the
   feature graphic's art) goes in the page's `<style>`, using token values.
6. Record in `pageNotes` which screen id each shot places, and any wording
   you filled in.

## Naming

| Thing | Format | Example |
| --- | --- | --- |
| Shot `id` | kebab-case, stable | `hero`, `look-back`, `mac-today` |
| Export name | `NN-<id>`, NN = 1-based position in its array | `01-hero` |
| IAP image | its `id`, no number | `plus-monthly` |
| Feature graphic | fixed | `feature-graphic` |
| Gallery screen id | `<section>--<export name>[--<tag>]` | `iphone--01-hero`, `android--01-hero--android`, `mac--01-mac-today--macos` |
| PNG | `out/<store>/<slot>/<export name>.png` | `out/apple/iphone-6.9/01-hero.png` |

- The array order is the upload order; reordering renumbers the files, so
  delete old PNGs in `out/` after a reorder.
- Each shot's iPhone and Play versions share the export name; the folder
  tells them apart.
- Gallery sections are `iphone`, `android`, `subs`, `feature`, `mac`,
  `contrast`. Columns are named by export name, so a screen id matches its
  PNG. iOS is the page's primary platform, so Play and feature-graphic
  columns carry the `Android` tag and Mac columns `macOS`; hero and night
  are frame options shown in the label, never tags.
- Per locale, keep one `store.html` per locale (`store.de.html`) or one
  `OUT` folder per locale; file names stay the same across locales.

## URL modes

| URL | Renders |
| --- | --- |
| `store.html` | gallery: every set + store-text contrast audit |
| `?solo=<section>` | one gallery section (`iphone`, `android`, …) |
| `?shot=N` | iPhone frame N alone at the page origin, 440×956 |
| `?shot=N&platform=android` | the same frame cut to Play 9:16, 440×782 |
| `?sub=N` | IAP / subscription square, 512×512 |
| `?feature` | Play feature graphic, 512×250 |
| `?mac=N` | Mac App Store frame, 1440×900 |
| `&theme=dark` | any of the above with dark tokens |
| `?manifest` | `kind index name` lines for `export.sh` |

## Phase 3: capture and check

Follow `references/review.md` for serving and the console. Then check the
canvases:

1. **Console** is clean; every frame renders its device.
2. **Placement**: each shot shows the screen id it was given, unchanged;
   nothing important cut off by the frame edge unless asked.
3. **Copy band**: the contrast section reports `fits` for every frame. An
   overflowing band means the text runs into the device; report it with the
   line count and let the person choose (shorter text, a smaller `scale`,
   or a larger `y`).
4. **Contrast**: every eyebrow, headline and caption against its frame
   background, light and dark. Report failures; the values live in
   `tokens.css` and are the product's call.
5. **Platform chrome**: Play frames show Android chrome; Mac frames a macOS
   window.
6. **Names**: shot ids kebab-case and unique; the manifest lists them in
   the intended order.

Show the person the gallery sections, two to four frames at a time, each
with its export name. Don't critique the wording or the order unless asked.

## Phase 4: export

Serve the page over http and run
`STORE_PAGE=http://localhost:PORT/store.html ./export.sh [apple|google|mac|all]`.
It reads `?manifest`, captures each frame at its authoring size × an integer
scale, resamples to each store size, and prints every PNG's real pixel size.
Check the sizes against `references/store-specs.md`, then open a few PNGs:
a blank or half-loaded capture still has the right pixel size.
`references/capture.md` covers headless-browser failures.

## Rules

- No mockup, no store shots. Screens are placed, never redrawn.
- Wording and order are the person's. Fill gaps plainly and say so.
- The store page uses the mockup's token file; it adds layout, never new
  colors or fonts.
- Authoring size × integer scale, then resample. Never capture at store
  size.
- One frame per URL. Never capture by scrolling the gallery.
- The contrast audit reports; the person decides.
- Store sizes change: verify against App Store Connect and Play Console
  before each submission.

## Files

| Path | What it is |
| --- | --- |
| `assets/store.html` | Starter page: head, screen CSS slot, placeholder frames |
| `assets/store.css` | Frame sizes and anatomy for every store kind, export mode |
| `assets/store.js` | `renderStorePage()`, frame builders, URL modes, manifest, contrast audit |
| `assets/export.sh` | Headless Chrome capture, `sips`/ImageMagick resample, size report |
| `assets/mockup-core.*`, `phone.*`, `window.*` | Shared engine and device frames (synced copies) |
| `references/store-specs.md` | Store sizes, limits and formats, and what to verify |
| `references/capture.md` | Headless capture troubleshooting |
| `references/tokens.md` | Token file structure (shared) |
| `references/review.md` | Serving, URLs, capturing (shared) |

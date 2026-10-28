---
name: app-icon
description: >-
  Design, explore, and export app icons as SVG masters in a plain-HTML
  workbench instead of Figma: run a concept round (letterform, symbol,
  abstract) side by side, judge it at real home-screen sizes, on a competitor
  shelf, and in one color, then render the chosen master into every platform
  context — iOS light/dark/clear/tinted, Android adaptive layers with safe
  zone and themed monochrome, macOS dock icon, favicon set — and export all
  the PNG/ICNS files with one script. Use whenever the user wants an app icon,
  launcher icon, adaptive icon, macOS or iOS icon, icon concepts or variants,
  a dark/tinted icon, a favicon set, a PWA manifest icon, or says things like
  "we need an icon", "the icon looks bad on Android", "make the icon work in
  dark mode", or "explore some logo marks for the app" — even if they never
  mention SVG or HTML.
---

# App Icon

An icon is seen at 60 px on a crowded home screen thousands of times for
every time it is seen large. Figma flatters it: one big artboard, no
neighbours, no masks, no dark mode. This skill puts the icon where it will
actually live — a static HTML workbench that renders **one SVG master** into
every platform context and size, so an agent can draw it, screenshot it,
critique it, and export it without a design tool.

Same method as the mockup skills: plain files, deterministic URLs
(`?solo=`, `?concept=`, `?theme=dark`), screenshot, critique, iterate.

## The model

- **One master, a 1024 grid.** Each concept is a JS object in `icon.html`
  with palettes and an `art(p)` function returning SVG. That square is the
  iOS icon, the Play icon, and the visible 72dp viewport of the Android
  adaptive icon.
- **Android layers are the same drawing through a wider window**
  (`viewBox="-256 -256 1536 1536"` = 108dp / 72dp). Backgrounds bleed; the
  essential mark stays inside the **circle r 469 around (512, 512)** — the
  66dp safe zone, which also clears every corner mask.
- **Appearances are palettes, not redraws.** `light`, `dark`, `mono`
  (grayscale for tinted; the engine derives Android's alpha-only
  monochrome from it). Detail that must survive transparency is a **mask
  cut-out**, never a background-colored stroke.
- **No live text in masters.** Letterforms are explored as live `<text>`
  (typeface study) and outlined to paths before export; the export script
  refuses masters that still contain `<text>`.

## Phase 0 — Detect state

Look for an existing icon workbench (`icon.html` + `icon.js` + `icon.css`).
If found, read its concept list and notes; continue the round instead of
restarting it. Look for a mockup directory (`design-system.css`) — if one
exists, the icon reuses its color roles.

## Phase 1 — Brief

One batched round of questions (fill gaps with stated assumptions):

1. Product in one sentence, and who opens it how often.
2. Three tone words (reuse the design system's if it has them).
3. Platforms: iOS / iPadOS, Android, macOS, web.
4. Existing brand: name, wordmark, colors, a mark to keep?
5. The field: which apps sit next to it — **described** as color + motif
   ("navy book", "pink dots"), never collected as real artwork.
6. Hard no's (motifs, colors, metaphors the team rejects).

Palette: if `design-system.css` exists, copy its color **roles by name**
into `R` in `icon.html` and set `designSystem:` to its path — the workbench
shows a drift warning when the two disagree. Otherwise choose a minimal
palette and say so.

## Phase 2 — Scaffold

Copy `assets/` into the project — default `design/icon/` (next to
`design/mockup/` if it exists): `icon.html`, `icon.js`, `icon.css`,
`mockup-core.css`, `export-icons.sh`, `outline-text.py`. Serve over http —
the drift check and the export step both need it:
`python3 -m http.server 4680 --directory design/icon` (or a launch-config
entry for a preview pane). Open it once: the starter renders three
placeholder concepts in every section. Screenshot section by section with
`?solo=<id>` (and `&theme=dark`), never by scrolling a full page.

## Phase 3 — Exploration

Follow `references/exploration.md`. In short:

- 3–6 directions, deliberately different: at least one **letterform**, one
  **symbol**, one **abstract**. One entry in `concepts` each, with a
  `note` that states the bet in a sentence.
- Judge at 60 / 40 / 29 / 16 before the hero. Squint test, silhouette,
  one-color test — all on the Concepts section.
- **Typeface study** for letterforms: `typefaces:` config renders the glyph
  in each candidate face, normalized to the same ink height.
- **Competitor shelf**: `shelf.competitors` are neutral placeholder tiles
  built from the user's description of the field. Never reproduce real
  marks or app names; label tiles by what they look like.
- Rejected directions stay on the page with the reason in their note. Mark
  the winner `chosen: true` — every platform section follows it (or
  `?concept=<id>`).

## Phase 4 — Refinement

Iterate the chosen concept only: optical centring, weight, the mask cut
widths, `artSmall` (a simplified drawing for ≤ 32 px and the favicon) if
detail closes up. Screenshot `?solo=sizes` after every change — small
sizes are where refinement pays.

## Phase 5 — Platform variants

Walk the platform sections for the chosen concept, light and dark
(`references/platform-specs.md` has the specs):

| `?solo=` | Checks |
| --- | --- |
| `ios` | Default, dark, clear (approx.), tinted (approx.) home screens + the three exported files |
| `android` | Background / foreground / composite with 108dp, 72dp, 66dp overlays; circle, squircle, rounded masks; themed icons light/dark |
| `macos` | 824 body in the 1024 canvas with shadow; dock light/dark |
| `web` | 16 px tab favicon light/dark, 32 / 180 / 192, maskable |
| `wallpapers` | light, dark, busy |
| `sizes` | 1024 → 16 actual pixels + 6× pixel zoom |

Fix in palettes (`dark`, `mono`) or masks — not by drawing a second icon.
Dark, clear and tinted previews approximate the OS; say so when you show
them, and recommend a device / Icon Composer check before shipping.

## Phase 6 — Export

1. If the chosen concept uses `<text>`, outline it:
   `python3 outline-text.py Font.ttf "F" --size 620 --x 512 --y 700 --anchor middle --fill '${p.ink}' --var wght=500`
   and replace the `<text>` in `art()` with the printed `<path>`. Recheck
   `?solo=concepts` against the study — outlines must match what was chosen.
2. With the workbench served:
   `./export-icons.sh http://localhost:4680/icon.html <concept-id> out`
   — pulls the masters from `?masters=<id>` (headless Chrome), renders with
   `rsvg-convert` (or a headless-Chrome fallback), writes iOS, Android,
   macOS `.iconset` + `.icns`, and web files, then verifies every size and
   that opaque files carry no alpha. The size table is at the top of the
   script.
3. Show the user a contact sheet of the outputs, then wire them in
   (`references/handoff.md`).

## Rules that hold it together

- One master per concept; variants are palettes and masks, not copies.
- Judge small first. A concept that only works at 180 px is not an icon.
- No live text in exports; no real competitor marks anywhere.
- Essential content inside r 469. Backgrounds bleed to the 1536 window.
- Ship square, unmasked art — the OS applies masks, plates and tints.
- Decisions live in concept notes and `pageNotes`, not in chat.
- `icon.js` / `icon.css` / `mockup-core.css` are the workbench: edit them
  rarely; product decisions belong in `icon.html`.

## Files

| Path | What it is |
| --- | --- |
| `assets/icon.html` | Starter workbench: palette roles, 3 placeholder concepts, typeface study, shelf |
| `assets/icon.js` | Engine: contexts, masks, appearances, small-size rasters, drift check, `?masters=` export mode |
| `assets/icon.css` | Workbench chrome: home screens, launchers, dock, tab bar, wallpapers |
| `assets/mockup-core.css` | Shared canvas/toolbar/section styles (synced from the family) |
| `assets/export-icons.sh` | Masters → every platform file, with verification (size table at top) |
| `assets/outline-text.py` | Outline 1–2 letters of a font to an SVG path (fontTools) |
| `references/exploration.md` | Running a concept round: directions, tests, shelf, typeface study |
| `references/platform-specs.md` | Grids, masks, safe zones, appearance variants per platform |
| `references/handoff.md` | Where the exported files go: Xcode, Android res, Expo, web manifest |

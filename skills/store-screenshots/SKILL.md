---
name: store-screenshots
description: >-
  Turn an existing HTML mockup directory into store-listing graphics: App
  Store iPhone screenshots, Google Play phone screenshots and feature
  graphic, Mac App Store shots, and in-app purchase / subscription promo
  images — composed from the product's own design-system.css and mockup
  screens, captured with headless Chrome, and resampled to exact store
  sizes. Also drafts the listing text (name, subtitle, promotional text,
  keywords, descriptions) within each store's character limits. Use whenever
  the user wants App Store screenshots, Play Store listing graphics, a
  feature graphic, IAP or subscription images, "marketing screenshots",
  store assets for a launch or update, or help writing the store listing —
  even if they don't mention mockups or HTML.
---

# Store Screenshots

A store listing is the product's first screen. This skill builds it the way
the product was designed: plain static HTML, the same `design-system.css`,
the same screens — so the listing can never drift into a different style
than the app it sells, and every frame is reproducible from a URL.

The output is a `store.html` page next to the mockup, an `export.sh` that
captures it, and folders of PNGs at exact store sizes:

```
out/apple/iphone-6.9/   out/apple/iphone-6.5/   out/apple/iap/
out/google/phone/       out/google/feature-graphic.png
out/mac/2880x1800/      out/mac/1280x800/
```

## Phase 0 — Detect the mockup

This skill **requires** an existing mockup directory: `design-system.css`
plus pages of screens built with `phone()` (mobile) or a window frame
(desktop), with `mockup-core.js` beside them. Look in `design/mockup/`,
`mockup/`, or wherever `design-system.css` lives.

- Found: read its `DESIGN-SYSTEM.md` (the contract) and the pages whose
  screens the story will use. You will copy screens, not invent them.
- Not found: stop and say so. Store graphics composed without a design
  system are a second, unmaintained art direction. Point the user to the
  **mobile-mockups** skill (phone apps) or **desktop-mockups** skill (Mac /
  desktop apps) to design the product first; come back after.

Ask (one batched round, defaults in brackets): which stores [App Store +
Play if both platforms exist], Mac App Store? [only if a desktop mockup
exists], IAP/subscription products [none], locales [English only].

## Phase 1 — Plan the story

Follow `references/storytelling.md`. Before writing any HTML, write the
shot list as a table — order, eyebrow, headline, caption, which screen
proves it — and agree it with the user. The rules that matter most:

- **Order is promise → evidence → explanation.** Frame 1 is the whole
  pitch; most people never swipe past frame 3.
- **One idea per shot.** If a frame needs "and", it is two frames.
- **Headlines: short, one line where possible, benefit not feature.**
  "Find any day in seconds", not "Full-text search".
- **The device shows real product copy**, copied from the mockup — never
  marketing paraphrase inside the screen.
- 5–8 frames; one **night shot** mid-rail if the product has a dark theme.

## Phase 2 — Build the shots

1. Copy from this skill's `assets/` into the mockup directory: `store.html`,
   `store.css`, `store.js`, `export.sh` (and `mockup-core.*`, `phone.*`,
   `window.*` if the mockup doesn't already have current copies).
2. Give `store.html` the **same `<head>`** as the mockup pages: fonts, icon
   library, `design-system.css`. Copy the screens' Layer-2 CSS block
   verbatim (or link a shared `screens.css`).
3. Copy each needed screen's template literal into `store.html` and make it
   a function of platform — `(platform) => phone(…, { platform })` — so the
   Play cut swaps status bar, camera cutout, back affordance and any
   platform words (biometrics, cloud backup) from one source.
4. Declare frames as data and call `renderStorePage(cfg)`:

   ```js
   renderStorePage({
     title, intro,
     shots: [{ id, eyebrow, headline, caption, device, scale, y,
               hero, night, overlay, android: { …overrides } }],
     subs: [{ id, word, tag, glyph }],
     feature: { mark, headline, art },
     mac: [{ id, eyebrow, headline, caption, device: win(…) }],
   });
   ```

   `device` accepts any rendered frame HTML — `phone(…)`, `win(…)`, a bare
   card stack — or a function of platform. `scale` (default 1) lets the
   device bleed off the bottom edge; `overlay` is a breakout element (a
   zoomed card) above the device.
5. Store-only composition (glow position, breakout cards, feature art)
   goes in the page's `<style>` using design-system values. No new hexes:
   frame backgrounds are the canvas role, washes are `--accent-tint`.

URL modes (all deterministic):

| URL | Renders |
| --- | --- |
| `store.html` | gallery: every set + marketing-text contrast audit |
| `?shot=N` | iPhone frame N alone at the page origin, 440×956 |
| `?shot=N&platform=android` | the same frame re-cut to Play 9:16, 440×782 |
| `?sub=N` | IAP / subscription square, 512×512 |
| `?feature` | Play feature graphic, 512×250 |
| `?mac=N` | Mac App Store frame, 1440×900 |
| `&theme=dark` | any of the above with dark screens |
| `?manifest` | frame names for `export.sh` |

## Phase 3 — Review

Follow `references/review.md`: serve over http, check the console,
screenshot the gallery and single frames (`?shot=N`), light and dark. Then
the store-specific checks:

- **Contrast audit** at the bottom of the gallery is green — every
  headline, caption and eyebrow against its frame background, both themes.
  Marketing text is text; fix failures in role values or the background.
- **Headline lines**: the audit counts them. Over two (three on the hero)
  means the headline is too long — rewrite it, don't shrink it.
- **Copy band fits**: no headline pushes into the device.
- **Thumbnail test**: view the gallery at 50% zoom. Can you still read
  frame 1's headline and see what the device shows?
- **Platform truth**: Android frames say Android things (no Face ID, no
  iCloud, no Dynamic Island).

## Phase 4 — Export

Run `./export.sh [apple|google|mac|all]` and read its size report. The rule
it encodes, learned the hard way: **capture at the authoring size × an
integer scale, then resample to the exact store size.** Shrinking or
reshaping the capture window instead reflows the page and re-wraps
headlines. Sizes and their sources are in `references/store-specs.md`;
`references/capture.md` covers headless-browser failures. Always open a
few output PNGs and look at them — a blank or half-loaded capture still has
the right pixel size.

## Phase 5 — Listing text

Follow `references/listing-text.md`: fill its template for each store,
count characters, and keep the voice of the headlines. Save it beside the
graphics (`out/` or a `listing.md`) so text and images ship together.

## Rules

- No mockup, no store graphics. Design the product first.
- One style: the product's `design-system.css`. The store page adds layout,
  never a palette.
- In-device copy is product copy, verbatim. Headlines are the only
  marketing words.
- Authoring size × integer scale → resample. Never capture at store size.
- One frame per URL. Never deep-scroll a long gallery for a capture.
- Store sizes change: verify against App Store Connect / Play Console
  before each submission.

## Files

| Path | What it is |
| --- | --- |
| `assets/store.html` | Starter page: head, Layer-2 slot, placeholder frames |
| `assets/store.css` | Frame anatomy for every store kind + export mode (roles only) |
| `assets/store.js` | `renderStorePage()`, frame builders, URL modes, contrast audit, manifest |
| `assets/export.sh` | Headless Chrome capture + `sips`/ImageMagick resample, size table |
| `assets/mockup-core.*`, `phone.*`, `window.*` | Shared engine and device frames (synced copies) |
| `references/storytelling.md` | Shot order, headline writing, localization, marketing contrast |
| `references/store-specs.md` | Required sizes per store and what to verify |
| `references/listing-text.md` | Metadata template with character limits |
| `references/capture.md` | Headless capture troubleshooting |
| `references/review.md` | Shared review loop: serving, screenshots, critique |

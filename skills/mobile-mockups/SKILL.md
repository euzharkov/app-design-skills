---
name: mobile-mockups
description: >-
  Lay out phone app mockups (iOS and Android) as plain HTML pages: a
  workbench canvas that groups screens into pages and sections, names every
  screen, tags platforms and variants, draws the phone frame at production
  size, wires the product's values through a token file with a live tokens
  section and contrast audit, and captures any section or screen from a
  deterministic URL. Use whenever the user wants phone app mockups, screen
  mockups, wireframes, a flow laid out as screens, a mockup gallery, or says
  "mock up this feature", "show the onboarding as screens", "put these
  screens side by side" for a phone app, even if they never mention HTML.
  Also use to extend, reorganize or capture an existing mockup directory
  built this way. What goes inside each screen is the user's; the skill
  owns the canvas around it. Desktop apps belong to desktop-mockups; store
  listing graphics to store-screenshots.
---

# Mobile Mockups

A mockup has two parts: the screens, and the canvas they sit on. This skill
owns the canvas. It decides how screens are grouped, what each one is
called, how platforms and variants are tagged, how the phone is framed, how
the product's values reach every screen, and how any of it is captured.

It does not decide what is inside a screen. Layout, copy, colors, which
states to show, how the product behaves: those come from the person. Build
what they describe. Where they leave a gap, fill it with the plainest
plausible content and record the assumption in a note. Don't redesign or
critique screen content unless asked.

The canvas is a directory of static HTML. No build step, no component
library. An agent can write it, diff it, version it, and screenshot it.

Part of a family that shares the canvas engine (`mockup-core.*`):
**desktop-mockups** (macOS and Windows windows, menu-bar panels) and
**store-screenshots** (store listing graphics built from these screens).

## Phase 0: detect state

Look for an existing mockup directory: `mockup-core.js` next to `tokens.css`
and `MOCKUP.md`. Older directories have `design-system.css`,
`DESIGN-SYSTEM.md`, and sometimes `mockup.js` instead; they are the same
method. Leave the old names alone unless the person asks to upgrade.

If one exists, read `MOCKUP.md`, follow its naming and page list, and go to
the phase the request needs (usually Phase 3). Don't touch screens you
weren't asked to touch.

If a sibling mockup exists for another surface of the same product (a
desktop mockup, say), take its color tokens verbatim; see
`references/tokens.md`.

## Phase 1: setup questions

One batched round, only about the canvas:

- Platforms: iOS, Android, or both, and which is primary.
- Where token values come from: a production theme to import (path), a
  sibling mockup, or values they'll give (brand colors, fonts).
- Light and dark, or light only.
- Fonts and the icon library the product uses.
- Where the mockup directory should live (default `design/mockup/`).
- The areas and flows to lay out first.

If the person is brief, take the defaults (iOS primary, light and dark,
starter placeholders, system fonts) and say which you took.

## Phase 2: scaffold

1. Copy every file from this skill's `assets/` into the mockup directory:
   `tokens.css`, `mockup-core.css`, `mockup-core.js`, `phone.css`,
   `phone.js`, `index.html`, `flow.html`, `MOCKUP.md`.
2. Wire up serving (any static server; the tokens section needs http, not
   `file://`). See `references/review.md` § Serving.
3. Open the page once: the tokens section and one example section should
   render.

## Phase 3: tokens

Follow `references/tokens.md`: import or enter the product's values into
`tokens.css`, keeping its structure (color tokens, `--font-*`, `--weight-*`,
`--space-*`, `--radius-*`, `.t-*` type roles, one dark block). List the
color pairs screens will use in `contrastPairs`. Fill the token tables in
`MOCKUP.md`. Open `?solo=tokens` in light and dark and check that nothing is
unresolved. Show the person the tokens section and any failing contrast
pairs; the values are theirs to change.

## Phase 4: lay out screens

Follow `references/canvas.md` for grouping, naming, tags and notes, and
`references/frame.md` for the phone frame:

- One page per product area (copy `flow.html`); one section per flow; one
  column per screen state, in the order the user meets them.
- Every column has a `name`: the product's name for the screen, then the
  state after a comma (`Today, empty`). That gives it the id
  `<section-id>--today-empty`.
- Platform tags (`iOS`, `Android`) on every column off the page's primary
  platform; variant tags (`Free`, `Plus`) for variants. States go in the
  name, not a tag.
- `phone(html, {platform, tab, back, footer, night, bare})` frames each
  screen; set `PHONE_PLATFORM` once for an Android-first page.
- Inside frames, values come from tokens: `var(--…)` and `.t-*` classes.
- Notes record decisions the person made, and assumptions you made.
- Delete the starter's example section once real sections exist.

## Phase 5: capture and check

Follow `references/review.md`: check the console, capture each new section
via `?solo=<id>` in light and dark, name captures by screen id, and run the
canvas checklist (grouping, names, tags, frames, tokens, labels). Show the
person two to four captures at a time, each with its screen id.

## Phase 6: handoff (when asked)

Follow `references/handoff.md`: tokens and type roles map to production by
name, screen ids name states everywhere (tickets, tests, parity snapshots),
canvas and frame code never transfers.

## Rules

- The canvas is neutral and the same for every product. Never edit
  `mockup-core.*` or `phone.*` for one product.
- Frames are 390×844 at 1:1. Display size changes only through `?zoom=`.
- Nothing product-shaped outside a frame; explanations go in labels and
  notes.
- Every screen has a name; section ids never change once shared.
- `tokens.css`, the token tables in `MOCKUP.md`, and `contrastPairs` change
  in the same edit.
- The contrast audit reports; the person decides.

## Files

| Path | What it is |
| --- | --- |
| `assets/tokens.css` | Token file: structure to keep, placeholder values to replace |
| `assets/mockup-core.css` / `.js` | Canvas engine: page head, sections, named columns, tags, notes, tokens section, audit, `?solo/theme/zoom` (shared by the family) |
| `assets/phone.css` / `.js` | Phone frame: `phone()`, `tabbar()`, status bar, iOS and Android chrome |
| `assets/index.html` | Starter page: tokens section and a deletable example section |
| `assets/flow.html` | Blank page for further areas |
| `assets/MOCKUP.md` | Contract template: surfaces, pages, naming, token tables |
| `references/canvas.md` | Skeleton, grouping, naming, tags, notes, canvas style rules |
| `references/tokens.md` | Token sources, file structure, naming, dark theme, contrast pairs |
| `references/frame.md` | The phone frame API and platform chrome |
| `references/review.md` | Serving, URLs, capturing, the canvas checklist |
| `references/handoff.md` | What transfers to production and how |

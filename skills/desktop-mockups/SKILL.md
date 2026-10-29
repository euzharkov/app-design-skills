---
name: desktop-mockups
description: >-
  Lay out desktop app mockups (macOS and Windows) as plain HTML pages: a
  workbench canvas that groups windows, menu-bar and tray panels, sheets,
  alerts and settings windows into pages and sections, names every screen,
  tags platforms and variants, draws each window at its declared production
  size, wires the product's values through a token file with a live tokens
  section and contrast audit, and captures any section or screen from a
  deterministic URL. Use whenever the user wants mockups or wireframes of a
  Mac or Windows app, a menu-bar or tray utility, a settings window, or says
  "mock up the Mac app", "lay out the settings window", "show the popover
  states side by side", even if they never mention HTML. Also use to extend,
  reorganize or capture an existing desktop mockup directory built this way.
  What goes inside each window is the user's; the skill owns the canvas
  around it. Phone apps belong to mobile-mockups; store listing graphics to
  store-screenshots.
---

# Desktop Mockups

A mockup has two parts: the screens, and the canvas they sit on. This skill
owns the canvas. It decides how windows are grouped, what each one is
called, how platforms and variants are tagged, how each window is framed
and sized, how the product's values reach every screen, and how any of it
is captured.

It does not decide what is inside a window. Layout, copy, colors, which
states to show, how the product behaves, which platform conventions it
follows: those come from the person. Build what they describe. Where they
leave a gap, fill it with the plainest plausible content and record the
assumption in a note. Don't redesign or critique window content unless
asked.

The canvas is a directory of static HTML. No build step, no component
library. An agent can write it, diff it, version it, and screenshot it.

Part of a family that shares the canvas engine (`mockup-core.*`):
**mobile-mockups** (iOS and Android phone screens) and
**store-screenshots** (store listing graphics built from these screens).

## Phase 0: detect state

Look for an existing mockup directory: `mockup-core.js` and `window.js` next
to `tokens.css` and `MOCKUP.md`. Older directories have `design-system.css`
and `DESIGN-SYSTEM.md` instead; they are the same method. Leave the old
names alone unless the person asks to upgrade.

If one exists, read `MOCKUP.md`, follow its naming, page list and window
sizes, and go to the phase the request needs (usually Phase 4). Don't touch
screens you weren't asked to touch.

If a sibling mobile mockup exists for the same product, copy its color
tokens (light and dark) verbatim, under the same names; see
`references/tokens.md`.

## Phase 1: setup questions

One batched round, only about the canvas:

- Platforms: macOS, Windows, or both, and which is primary.
- Where token values come from: a production theme to import (path), a
  sibling mobile mockup (path), or values they'll give (brand colors,
  fonts).
- Light and dark, or light only.
- Fonts and the icon library the product uses.
- Where the mockup directory should live (default `design/mockup/`).
- The areas and windows to lay out first, and their sizes if known.

If the person is brief, take the defaults (macOS primary, light and dark,
starter placeholders, system fonts) and say which you took.

## Phase 2: scaffold

1. Copy every file from this skill's `assets/` into the mockup directory:
   `tokens.css`, `mockup-core.css`, `mockup-core.js`, `window.css`,
   `window.js`, `index.html`, `flow.html`, `MOCKUP.md`.
2. Wire up serving (any static server; the tokens section needs http, not
   `file://`). See `references/review.md` § Serving.
3. Open the page once: the tokens section and one example section should
   render.

## Phase 3: tokens

Follow `references/tokens.md`: import or enter the product's values into
`tokens.css`, keeping its structure (color tokens, `--font-*`, `--weight-*`,
`--space-*`, `--radius-*`, `.t-*` type roles, one dark block). From a
sibling mobile mockup, copy the color tokens verbatim and set type roles,
spacing, radii and insets for desktop. List the color pairs screens will
use in `contrastPairs`. Fill the token tables in `MOCKUP.md`. Open
`?solo=tokens` in light and dark and check that nothing is unresolved. Show
the person the tokens section and any failing contrast pairs; the values
are theirs to change.

## Phase 4: lay out windows

Follow `references/canvas.md` for grouping, naming, tags and notes, and
`references/frame.md` for the window frames:

- One page per product area (copy `flow.html`); one section per flow or
  window; one column per state, in the order the user meets them.
- Every column has a `name`: the product's name for the window or screen,
  then the state after a comma (`Journal, empty`). That gives it the id
  `<section-id>--journal-empty`.
- Platform tags (`macOS`, `Windows`) on every column off the page's primary
  platform; variant tags (`Free`, `Plus`) for variants. States are never
  tags.
- `win()`, `panel()`, `sheet()`, `alert()`, `settingsWin()`, `menubar()`,
  `menu()`, `tooltip()`, `pointer()` and `ctl.*` frame each screen; set
  `WINDOW_PLATFORM` once for a Windows-first page.
- Every window declares its `size` in points and is drawn 1:1 at it;
  resizable windows declare `minSize` when the person has decided one.
  Record sizes in `MOCKUP.md`.
- Inside frames, values come from tokens: `var(--…)` and `.t-*` classes.
- Notes record decisions the person made, and assumptions you made.
- Delete the starter's example section once real sections exist.

## Phase 5: capture and check

Follow `references/review.md`: check the console, capture each new section
via `?solo=<id>` in light and dark, name captures by screen id, and run the
canvas checklist (grouping, names, tags, frames, sizes, tokens, labels).
Show the person two to four captures at a time, each with its screen id.

## Phase 6: handoff (when asked)

Follow `references/handoff.md`: tokens and type roles map to production by
name, screen ids name states everywhere (tickets, tests, parity snapshots),
canvas and frame code never transfers. `ctl.*` controls are stand-ins;
production uses the platform's real controls (`references/frame.md`).

## Rules

- The canvas is neutral and the same for every product. Never edit
  `mockup-core.*` or `window.*` for one product.
- Windows are drawn 1:1 at their declared size. Display size changes only
  through `?zoom=` and `defaultZoom`.
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
| `assets/window.css` / `.js` | Window frames: `win()`, panels, sheets, alerts, settings, menus, `ctl.*`, `keys()`, macOS and Windows chrome |
| `assets/index.html` | Starter page: tokens section and a deletable example section |
| `assets/flow.html` | Blank page for further areas |
| `assets/MOCKUP.md` | Contract template: surfaces, pages, window sizes, naming, token tables |
| `references/canvas.md` | Skeleton, grouping, naming, tags, notes, canvas style rules |
| `references/tokens.md` | Token sources, file structure, naming, dark theme, contrast pairs |
| `references/frame.md` | The window frame API, sizes, and platform chrome |
| `references/review.md` | Serving, URLs, capturing, the canvas checklist |
| `references/handoff.md` | What transfers to production and how |

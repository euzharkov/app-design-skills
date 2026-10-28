---
name: desktop-mockups
description: >-
  Design desktop app UI in plain HTML instead of Figma: a per-project design
  system (semantic color roles, desktop type roles, spacing — CSS custom
  properties with a live WCAG contrast audit) plus window-frame mockups an
  AI agent can create, screenshot, critique, and iterate on in the browser.
  Use whenever the user wants mockups, wireframes, screen designs, or a
  design review for a desktop application — macOS or Windows apps, Mac
  menu-bar / status-bar apps, tray utilities, popovers, main windows with
  sidebars, settings or preferences windows, sheets, alerts and confirm
  dialogs, onboarding or installer windows, Electron/Tauri/SwiftUI/AppKit/
  WinUI app screens — or says "mock up the Mac app", "how should the
  settings window look", "design the menu bar popover", even without the
  words "mockup" or "HTML". Also use to extend an existing desktop mockup
  directory built with this method. Phone and tablet UI belongs to the
  mobile-mockups skill, not this one.
---

# Desktop Mockups

Design in the medium you ship. This skill turns a plain directory of static
HTML into a design tool an agent can actually use: read it, write it, diff
it, screenshot it, and audit its accessibility. It is the desktop sibling of
the mobile-mockups method — same two layers, same contract, same review
loop — with window frames instead of a phone.

The method has exactly two layers:

1. **Flat shared design values** — `design-system.css`: semantic colors, type
   roles (`.t-*` classes), spacing, radii. One file, both themes. Desktop
   metrics: macOS body text is 13 pt, not mobile's 17.
2. **Windows** — HTML pages that compose those values with page-local CSS and
   JS template helpers. **No component library, no tokens-of-tokens, no build
   step.** The only shared helpers are the frames and the OS's own native
   controls (`window.js`), because production uses the OS's real ones.

`DESIGN-SYSTEM.md` is the written contract; the workbench
(`mockup-core.js`) auto-renders a foundations page — palette, type ramp,
spacing, radii, live contrast audit — straight from the CSS.

## Phase 0 — Detect state

Look for an existing mockup directory (`design-system.css` +
`DESIGN-SYSTEM.md` + `mockup-core.js` together). If found: read
`DESIGN-SYSTEM.md` fully and treat it as the contract, then jump to the phase
the request needs (usually 4). Never rebuild a system that exists; never
normalize screens you weren't asked to touch.

**Sibling system.** If the product already has a *mobile* mockup directory,
copy its color roles (both themes) into this `design-system.css`
**verbatim** and re-derive only type scale, spacing, radii, and insets for
desktop. Keep the role *names* identical so the two map role-for-role; note
the sibling's path in both contracts. A color change then happens in one
place first and is copied — never forked.

## Phase 1 — Discovery

Read `references/design-system.md` § Discovery and run its interview in one
batched round. Desktop adds three questions: **which platforms** (macOS,
Windows, both — and which is primary), **which surfaces** (menu-bar/tray
popover, main window, settings, sheets/alerts, onboarding/installer), and
**the icon source** (on macOS the honest default is SF Symbols, on Windows
Segoe Fluent Icons — see `references/platforms/`). If the user is brief,
choose defaults from context and state your assumptions.

## Phase 2 — Scaffold

1. Copy every file from this skill's `assets/` into the project — default
   `design/mockup/`: `design-system.css`, `mockup-core.css`,
   `mockup-core.js`, `window.css`, `window.js`, `index.html`, `flow.html`,
   `DESIGN-SYSTEM.md`.
2. Serve over http (foundations can't read CSS from `file://`) — see
   `references/review.md` § Serving.
3. Open the page once: foundations plus one example section ("Fieldnote").

The starter palette is a neutral placeholder, not a recommendation.

## Phase 3 — Design the system

Follow `references/design-system.md` §2–7, with desktop metrics:

1. Role values in `design-system.css` — surfaces, ink scale, the interactive
   / decorative accent split, status colors, both themes (or the sibling's
   roles verbatim).
2. Desktop type roles: body 13/18 on macOS (14 on Windows-first products),
   captions 11, titles 20–22, display ~26–28. Same ten role names as mobile.
3. `contrastPairs` in `index.html` cover every fg/bg pair the product uses.
4. Fill `DESIGN-SYSTEM.md`, including the **per-window rules** section.
5. `?solo=foundations`, light and dark, until the audit is green. Get
   sign-off on foundations screenshots before building windows.

## Phase 4 — Build windows

Follow `references/screens.md` and the platform file(s) in
`references/platforms/`. The short version:

- **Sections are window types, frames are states.** One section per surface
  (popover, main window, sheet, settings, onboarding…); every UI state gets
  its own column — empty, loading, error, locked, edge content, hover, menu
  open.
- Frames: `win()`, `panel()`, `sheet()`, `alert()`, `settingsWin()`,
  `menubar()`, `menu()`, `tooltip()`, `pointer()`, native controls `ctl.*`,
  shortcuts via `keys("mod+N")`. Set `WINDOW_PLATFORM` once per page.
- **Authoring is 1:1 in points at the declared window size.** A 1080×700
  window is written at 1080×700; the page zoom only changes display size.
- Desktop is pointer + keyboard: mock hover, focus, and menus; show
  shortcuts in menus and tooltips; declare min sizes for resizable windows.
- **Copy is spec, data is plausible** — and where the product computes
  numbers, take them from a real run, not imagination.

## Phase 5 — Review loop

Follow `references/review.md`: console clean, screenshot each section via
`?solo=<id>` light and dark, run the critique (with the desktop additions in
`references/screens.md` § Desktop critique), fix in source, show the user
curated screenshots with a specific question. Once the app exists, put its
own snapshots beside the mockup states (§ Parity with the app).

## Phase 6 — Handoff (when asked)

`references/handoff.md`: values and type roles map by role name, copy
transfers verbatim, layout by intent, mockup classes never. Native controls
map to the platform's real controls (NSSwitch / ToggleSwitch, not a custom
view). Keep the mockup alive: UI changes land in the mockup in the same
change as the app.

## The rules that hold the method together

- Two layers only. Frames and native-control stand-ins are workbench, not a
  component library; product composition stays page-local.
- Semantic roles, never colors by appearance. Interactive accent ≠
  decorative accent.
- Mockup px = production pt at the window's declared size. No scaled math.
- Rules are recorded **per window** in DESIGN-SYSTEM.md — main window,
  popover, sheets, alerts, settings, onboarding — not as one flat list.
- Every value change keeps `design-system.css`, `DESIGN-SYSTEM.md`, and
  `contrastPairs` in sync in the same edit. The audit is a gate.
- `mockup-core.*` / `window.*` are the workbench — raw colors allowed,
  product values forbidden; you should rarely edit them.

## Files

| Path | What it is |
| --- | --- |
| `assets/design-system.css` | Starter values + desktop `.t-*` roles + dark block (placeholder palette) |
| `assets/mockup-core.css` / `.js` | Workbench engine: canvas, notes, foundations, audit, `?solo/theme/zoom` |
| `assets/window.css` / `.js` | Desktop frames, native controls, menus, shortcuts, `WINDOW_PLATFORM` |
| `assets/index.html` | Starter canvas: foundations + deletable "Fieldnote" example |
| `assets/flow.html` | Blank template for more pages |
| `assets/DESIGN-SYSTEM.md` | Contract template with per-window rules |
| `references/design-system.md` | Interview, roles, dark theme, type, contrast |
| `references/screens.md` | Desktop page anatomy, frame API, states, parity with the app |
| `references/platforms/macos.md` | macOS chrome, metrics, materials, SF Symbols in mockups |
| `references/platforms/windows.md` | Windows 11 chrome, metrics, Mica, Segoe Fluent Icons |
| `references/review.md` | Serving, solo screenshots, critique checklist |
| `references/handoff.md` | Role mapping, theme export, keeping mockups alive |

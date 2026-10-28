# Building desktop windows

Desktop apps are not one screen at a time. A product is a handful of
surfaces — a main window, a popover, a sheet, a settings window, maybe an
installer — each with its own size, chrome, and rules. The page structure
mirrors that.

## Page anatomy

One HTML page per product area (`index.html` for foundations + the main
surfaces, `onboarding.html`, `settings.html`, …). Every page:

- links `design-system.css`, `mockup-core.css`, `window.css`,
  `mockup-core.js`, `window.js` and any fonts/icons in an identical `<head>`
  (copy `flow.html`);
- declares its content as data and calls `renderMockupPage(cfg)`, usually
  with `defaultZoom: 70` — desktop frames are wide;
- keeps its own Layer-2 CSS in a `<style>` block.

Within a page: **sections are window types, frames are states.** One section
per surface — "Menu-bar popover", "Main window", "Delete sheet",
"Settings" — and one column per UI state of that surface. A typical
product page:

| Section | Columns (states) |
| --- | --- |
| Menu-bar / tray popover | empty · typing · saved · error · already-done edge case |
| Main window | default selection · secondary view · first run (empty) · loading / offline |
| Menus and shortcuts | app menu open · context menu + hover · toolbar tooltip |
| Search | results · no results |
| Sheets / alerts | each confirmation, over its parent window |
| Settings | one column per pane, plus what a setting *does* (e.g. locked) |
| Installer / onboarding | one column per step |
| Platform variant | the same surfaces on the secondary platform |

**Every UI state gets its own column.** If the app can be in a state, the
mockup shows it; a state that exists only in code is a design decision
nobody made.

## Rules grouped per window

DESIGN-SYSTEM.md records rules per surface, not as one flat list: main
window, popover, sheets, alerts, settings, installer/onboarding. Each entry
covers size (default, min, whether height follows content), what opens and
closes it, its chrome (sidebar width, toolbar items), density, and what it
must never show. Section notes in the page carry the *why*; the contract
carries the rule. When a decision changes, both change in the same edit.

## The frame API (window.js)

```js
WINDOW_PLATFORM = "macos";            // or "windows" — once per page

win(inner, { title, subtitle, size: [1080, 700], minSize: [820, 520],
             sidebar: sideNav(items, "week"), sidebarWidth: 220,
             toolbar: ctl.search("Search") + ctl.tool(icon("plus")),
             status, controls: "all"|"no-zoom"|"close"|"none",
             inactive, night, pad: false, overlay, meta })
panel(inner, { width: 340, height, glyph, context: true, arrow })
sheet(inner, { width, title, actions: [{label, kind}], over: { inner, ...winOpts } })
alert({ icon, title, body, buttons, suppress }, { over: { inner, ...winOpts } })
settingsWin(inner, { tabs: [{key, icon, label}], active, size: [580, null] })
menubar(["App","File","Edit"], { open: "File", items })   // macOS
menu(items, { width, style })   tooltip(text, { keys })   pointer(x, y, kind)
keys("mod+shift+N")             // ⇧⌘N on macOS, Ctrl+Shift+N on Windows
ctl.button / toggle / check / radio / popup / field / search / segmented / tool
dialogButtons(buttons)          // platform button order
```

- `size` is the window frame in points, title bar included; `[w, null]`
  lets height follow content (settings panes, onboarding).
- `minSize` prints above the frame — a resizable window's minimum is a
  design decision, record it.
- `over` puts a sheet/alert on its parent window, dimmed; omit it to show
  the surface alone on the desktop stage.
- `overlay` layers anything over a window: an open context menu, a
  tooltip, a `pointer()` showing where the mouse is.
- `ctl.*` are stand-ins for the OS's own controls, sized per platform. They
  are the one place shared helpers are allowed, because production uses the
  real native control, not a custom one. Product composition (cards, rows,
  chips) stays in page-local helpers.

Grow page-local helpers freely (`journal(inner, opts)` wrapping `win()` with
the product's defaults, `entryRow(...)`, `formRow(label, control)`); they are
conveniences for this page, not an API production must mirror.

### Layer-2 CSS rules

Same as mobile: screen CSS owns layout, takes every color, size, radius, and
space from design-system values, and never re-specifies a role's metrics.
Pages may override the frame's derived chrome tints on `.wscreen`
(`--win-bg`, `--win-sidebar`) to assign surfaces by role — e.g. sidebar on
`--canvas`, reading pane on `--card`.

## Desktop specifics

- **Density.** Desktop is denser than mobile: 13 pt body, 28 pt sidebar
  rows (36 on Windows), 20 pt content insets. Don't port mobile spacing; a
  mobile-sized desktop app reads as a phone app on a big screen.
- **Pointer, hover, focus.** Mock hover states (row tint, control raise)
  and keyboard focus (ring) as their own columns where they carry meaning.
  Use `pointer()` so the reader knows what is hovered.
- **Keyboard shortcuts.** Every command lives in a menu with its shortcut;
  toolbar tooltips repeat the shortcut; context-menu wording matches the
  menu bar exactly. Write shortcuts once with `keys("mod+…")`.
- **Resizable windows.** Declare default and minimum size. If the layout
  changes below a width (sidebar collapses, inspector hides), mock that
  width as its own column.
- **Sidebar widths.** Pick one and record it (macOS ~200–260, Windows
  NavigationView ~260–320). A sidebar that must truncate its labels at the
  chosen width is the wrong width.
- **Popovers are as tall as their content**, capped at the screen; they
  never become scrolling windows by accident.
- **Sheets vs. alerts.** Sheets for decisions with context to show (what
  will be deleted); alerts for short, irreversible, blocking questions.
  Destructive buttons name the action ("Delete Note"), never "OK".

## States and copy

The states discipline from mobile applies unchanged: empty / first run,
loading, error / offline, edge content (long names, 200 items, zero), and
variants (free vs paid, platform). Copy is spec — real words, product voice,
no lorem — and data is plausible: names, dates, and counts that agree
across every window on the page (the sidebar badge, the search count, and
the export button all say 42).

**Where the product computes numbers, take them from a real run.** Sizes,
durations, counts, percentages, summaries: run the product (or its engine)
on realistic input and paste the result. Invented numbers hide layout
problems — real ones are longer, odder, and have more digits.

## Parity with the app

Once implementation starts, the mockup and the app drift unless someone can
put them side by side cheaply. Build that in:

- **Debug snapshot hook.** The app exposes a debug-only way to render a
  named state to PNG — a URL scheme (`app-debug://snapshot?state=main.empty
  &appearance=dark`), a CLI flag (`--snapshot main.empty --out x.png`), or a
  test target. State names match mockup section/column ids.
- **Every UI state has a mockup state.** When the app gains a state (a new
  error, a permission prompt), it gets a column before it ships.
- **Review side by side.** At review, capture the mockup state
  (`?solo=<id>&theme=dark`) and the app snapshot for the same state; differ-
  ences are either a bug in the app or a decision to back-port to the
  mockup by role and intent.
- **Same change, both places.** A UI change lands in the app and the mockup
  in the same change; DESIGN-SYSTEM.md's per-window rules update with it.

## Desktop critique (additions to review.md)

After the seven-point checklist, check:

1. **Chrome is right for the platform** — lights left / caption buttons
   right, title placement, menu bar vs. in-window menus.
2. **Density** — 13 pt body, desktop row heights; nothing mobile-sized.
3. **Pointer & keyboard** — hover and focus mocked where they matter;
   every command has a menu home and a shortcut where it should.
4. **Sizes** — default and minimum declared; content survives the minimum.
5. **Both platforms** (if shipping both) — button order, wording ("Mac" /
   "PC"), shortcuts translated by `keys()`.

## Icons and images

The icon source is the project's choice (see `platforms/macos.md` and
`platforms/windows.md` for SF Symbols and Segoe Fluent Icons in mockups).
Define a page-local `icon()` shorthand so swapping sources is one function's
diff; keep a mockup-icon → production-symbol table in DESIGN-SYSTEM.md if
you use a stand-in library. OS chrome is already inline SVG in `window.js`.

# macOS conventions for mockups

Generalized from current macOS (the Liquid Glass era) and still true of the
few releases before it. Numbers are points; author them 1:1. When a detail
changes between releases, match the release the product targets and note it
in DESIGN-SYSTEM.md.

## Window chrome

- **Traffic lights** top-left: 12 pt circles, 8 pt apart, close / minimize /
  zoom (`#ff5f57`, `#febc2e`, `#28c840`). Gray when the window is inactive
  or a button is unavailable — settings windows disable zoom
  (`controls: "no-zoom"`), utility/about windows often enable close only.
- **Title bar** without toolbar: ~28–32 pt, title centered, 13 pt semibold.
- **Unified toolbar**: ~52 pt, title leading at 15 pt bold with an optional
  11 pt subtitle; toolbar items trailing, as capsules ~32 pt tall.
- **Sidebar**: full height with the lights inside it; current macOS draws it
  as an inset floating panel (`inset: true`). Typical width 200–260;
  source-list rows 28 pt, 13 pt text, accent-tinted symbols, section headers
  11 pt semibold in tertiary ink, selection a rounded tint.
- **Window corners** ~10–16 pt depending on release and toolbar.
- **Status / bottom bar** is optional and rare; 11 pt secondary text.

## Surfaces

- **Menu-bar extra (popover)**: hangs under its status item, as tall as its
  content, capped at the visible screen. No arrow for window-style menu-bar
  extras; an arrow only for NSPopover. Typical width 300–380.
- **Sheet**: attached to its window, horizontally centered, near the top;
  window content dims slightly. Buttons bottom-right, default (Return)
  rightmost, Cancel to its left (Esc).
- **Alert**: ~260 pt wide, centered, app icon 64, bold 13 pt title, 11 pt
  body; two buttons side by side, three or more stacked. Over a window it is
  window-modal (a sheet). Destructive actions: red label, and Cancel is the
  default when the action cannot be undone.
- **Settings window**: title = the selected pane's name; pane tabs as
  icon-over-label toolbar items; fixed width, height follows the pane; zoom
  disabled. Content as grouped forms: label left, control right.
- **Menus**: 13 pt items ~22 pt tall, shortcuts right-aligned in symbols
  (⌃⌥⇧⌘ order), separators between groups, ellipsis when a dialog follows.
  The highlighted row takes the system accent with white text.

## Controls and hit targets

| Control | Regular size |
| --- | --- |
| Push button | 22–24 pt tall (28 in alerts / large), capsule in current macOS |
| Switch | ~32×18 (small) – 38×22 (regular) |
| Checkbox / radio | 14 pt |
| Pop-up button | 22–24 pt, up/down chevron |
| Text field | 22–24 pt, 6 pt radius |
| Search field (toolbar) | 28–32 pt capsule |
| Segmented control | 22–24 pt |

Pointer targets ≥ 24×24; toolbar items ≥ 28. Focus ring: accent, ~3 pt,
outside the control. Hover is subtle (a tint), not a color change.

## Type

System font (SF Pro): body 13, callout 12, subheadline/caption 11,
headline 13 semibold, title3 15, title2 17, title1 22, large title 26. The
product's design-system roles may use a display face for titles and reading
text, but OS-drawn text (menus, alerts, title bars) stays in the system font.

## Materials and vibrancy

Sidebars, popovers, menus, and the menu bar are translucent materials. In a
static mockup, approximate them with an opaque surface derived from the
product roles (`--win-sidebar`, `--win-popover`) — translucency over a
mockup gallery only shows the gallery through and hurts contrast. If the
product depends on vibrancy, mock one column on a wallpaper (`panel()` does)
and describe the material in a note. Dark windows get a faint light inner
edge; `window.css` draws it.

## Symbols (SF Symbols in mockups)

SF Symbols is the honest icon source for a Mac app, but it isn't a web font.
Two workable approaches:

1. **Generated CSS** (most faithful): a small build-time script on a Mac
   renders the symbols the product uses (e.g. via AppKit's
   `NSImage(systemSymbolName:)`) to PNG/SVG and writes a stylesheet of
   `mask-image` classes — `.sf { background: currentColor; mask-size:
   contain }` plus one `.sf-<name>` per symbol, sized in `em` so a symbol
   follows its text size and color. Regenerate when the symbol list
   changes; commit the generated file. Check the symbols' license terms
   before publishing mockups outside the team.
2. **Inline SVG stand-ins** or an open library with a similar regular
   weight, plus a mapping table (mockup icon → SF Symbol name) in
   DESIGN-SYSTEM.md so implementation picks the real symbol.

Either way: one default weight, one rendering mode for active states, and
never hand-drawn approximations mixed with real symbols.

## Wording

"Settings" (not Preferences) on current macOS; "Move to Trash"; "this Mac";
shortcuts in symbols; title case for menu items and buttons.

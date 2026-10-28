# Windows 11 conventions for mockups

Generalized from Windows 11 and WinUI 3 (Fluent). Numbers are effective
pixels (epx); author them 1:1. `platform: "windows"` or
`WINDOW_PLATFORM = "windows"` switches every frame and native control.

## Window chrome

- **Title bar** 32 epx (48 when it hosts tabs or search): 16 epx app icon at
  the left, 12 epx title, caption buttons right.
- **Caption buttons** minimize / maximize / close, 46×32 each, thin 10 epx
  glyphs; close hovers red (`#c42b1c`) with a white glyph.
- **Window corners** 8 epx; a 1 epx border and a soft shadow.
- **Menus** (if any) are a row inside the window under the title bar
  (`menus: ["File", "Edit"]`) — there is no global menu bar.
- **Command bar** (`toolbar`) sits under the title bar: icon buttons
  40×40, optionally labeled, 14 epx text; search usually at the right.
- **Navigation pane** (`sidebar`): 260–320 wide on the Mica base, 36 epx
  rows, 16 epx icons, 14 epx labels, the selected row tinted with a 3×16
  accent pill at its left edge. Content sits on a raised layer whose
  top-left corner rounds into the pane.

## Surfaces

- **Tray flyout**: opens above the taskbar, anchored to its notification-
  area icon near the clock; 8 epx corners; as tall as its content.
- **ContentDialog** (sheets and alerts alike): centered over a smoke layer;
  title 20 semibold, body 14; buttons in a footer band, equal width,
  **primary first (left), Close/Cancel last**. Don't make a destructive
  button the default.
- **Settings**: usually a page in the main window (navigation pane item)
  or a window with a navigation pane listing the panes; page title 28
  semibold; settings as cards/rows with label left, control right.
- **Menus / context menus**: 14 epx items ~32 epx tall, shortcuts in
  `Ctrl+Shift+N` form right-aligned in secondary ink, hover a subtle tint
  (not accent), 8 epx corners.
- **Tooltips**: 12 epx, 4 epx corners, shortcut after the label.

## Controls and hit targets

| Control | Size |
| --- | --- |
| Button | 32 tall, 4 radius, 14 epx text, min width ~96 in dialogs |
| ToggleSwitch | 40×20, knob 12 (accent fill when on) |
| CheckBox / RadioButton | 20 |
| ComboBox / TextBox | 32 tall; focused TextBox gets a 2 epx accent bottom edge |
| AutoSuggestBox (search) | 32 tall, glyph at the right |

Pointer targets ≥ 32×32; 40×40 where touch is plausible (many Windows
devices have touch). Keyboard focus: a 2 epx high-contrast outline.

## Type

Segoe UI Variable: caption 12, body 14, body strong 14 semibold, subtitle
20 semibold, title 28 semibold, title large 40, display 68. Windows-first
products usually bump the design system's body/callout/caption one step
(14/13/12) relative to the macOS scale; record the choice.

## Materials

Mica (window base, tinted by the wallpaper) and Acrylic (flyouts, menus).
Approximate both with opaque role-derived surfaces: `--win-sidebar` for the
Mica base, `--win-bg` for the content layer, `--win-popover` for flyouts.
Note the material in DESIGN-SYSTEM.md so implementation applies it.

## Icons

Segoe Fluent Icons is the system icon font (installed on Windows 11, not
redistributable to the web). In mockups, use an open library with a similar
thin outline weight or inline SVG, and keep a mapping table (mockup icon →
Segoe Fluent glyph name) in DESIGN-SYSTEM.md. Filled variants mark
selection only where the platform does (navigation pane, toggled commands).

## Wording

"Settings", "this PC", "Recycle Bin"; Ctrl-based shortcuts written
`Ctrl+Shift+N` (via `keys()`); sentence case for buttons and menu items.

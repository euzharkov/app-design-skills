# The window frames

`window.js` and `window.css` draw the operating system around a screen:
windows, menu-bar panels and tray flyouts, sheets and dialogs, menus,
tooltips, a pointer. The frames own the chrome the OS draws (title bar,
window controls, menu bar, taskbar, dialog button order) and nothing the
product draws.

## Sizes

Every window declares its size in points, title bar included:
`win(…, { size: [1080, 700] })` is a 1080×700 window. Mockup px =
production pt on macOS and epx on Windows, 1:1. The page zoom
(`defaultZoom`, usually 70 for desktop pages, and `?zoom=`) changes display
size only; `?zoom=100` shows a frame at its true size. Never scale the
authored numbers to make a window fit.

- `size: [w, null]` lets height follow content (settings panes, dialogs).
- `minSize: [w, h]` prints above the frame with the size, for a resizable
  window whose minimum the person has decided. `meta: true` prints the size
  alone.
- When a window is shown at more than one size (default and minimum, say),
  each size is its own column, named for the state (`Journal, minimum
  width`).

## Platform

`WINDOW_PLATFORM = "windows"` once at the top of a page script makes every
frame on it a Windows frame (default `"macos"`). Any frame also takes
`platform: "macos" | "windows"` to override it for one column; tag that
column per canvas.md.

## API

```js
win(inner, {
  platform,                 // default WINDOW_PLATFORM
  title, subtitle,          // "" hides the title; subtitle is macOS unified toolbar only
  size: [960, 640],         // pt, title bar included; [w, null] = content height
  minSize,                  // [w, h], printed above the frame
  meta,                     // true prints the size above the frame
  sidebar,                  // sidebar / navigation-pane HTML, e.g. sideNav(...)
  sidebarWidth,             // default 220 macOS, 280 Windows
  inset,                    // macOS floating sidebar
  toolbar,                  // macOS: unified with the title bar; Windows: a row below it
  menus,                    // Windows only: in-window menu row, ["File", "Edit"]
  titlebarCenter,           // Windows only: HTML centered in the title bar
  status,                   // bottom bar HTML
  icon,                     // Windows title-bar app icon HTML (default placeholder tile)
  controls,                 // "all" | "no-zoom" | "close" | "none"
  inactive,                 // draw as an unfocused window
  scroll,                   // content region scrolls (default true)
  pad,                      // pad content with --screen-inset (default true)
  night,                    // force dark tokens on this frame
  overlay, scrim, overlayAt // HTML over the window; "sheet" | "dialog" dimming; "top" | "center"
});

panel(inner, { platform, width: 340, height, glyph, context: true, arrow, night, pad });
sheet(inner, { platform, width, title, actions: [{ label, kind }], over: { inner, ...winOpts } });
alert({ icon, title, body, buttons: [{ label, kind }], suppress }, { platform, width, over });
settingsWin(inner, { platform, tabs: [{ key, icon, label }], active, title, size, sidebarWidth, controls, night });
menubar(names, { open, items, width: 720, height: 340, menuWidth: 260, night });  // macOS
menu(items, { platform, width, style, night });
tooltip(text, { platform, keys, style, night });
pointer(x, y, "arrow" | "hand" | "text");
keys("mod+shift+N");        // ⇧⌘N on macOS, Ctrl+Shift+N on Windows
sideNav(items, activeKey);  // items: [{ key, icon, label, badge }] or { header }
dialogButtons(buttons, platform);
ctl.button(label, { kind: "default" | "normal" | "danger" | "plain", state, icon, wide });
ctl.toggle(on, { state });  ctl.check(on, label, { state });  ctl.radio(on, label);
ctl.popup(value, { width, state });
ctl.field(value, { placeholder, width, focused, secure });
ctl.search(placeholder, { value, width, focused });
ctl.segmented(items, active);
ctl.tool(icon, { label, on, state });
```

- `panel()` is a menu-bar extra on macOS and a tray flyout on Windows.
  `context: true` draws the menu bar or taskbar around it; `false` shows the
  panel alone. `height` omitted means as tall as its content.
- `sheet()` and `alert()` take `over`, the parent window's content and
  `win()` options; the frame draws the parent dimmed underneath. Without
  `over` they stand alone on the desktop stage. On Windows both render as a
  content dialog.
- `settingsWin()` is a `win()` with pane tabs: toolbar tabs on macOS (title
  = the active pane), a navigation pane on Windows.
- `overlay` layers anything over a window: an open `menu()`, a `tooltip()`,
  a `pointer()` showing what is hovered.
- `menubar()` is macOS only; the first name renders as the app menu.
  Windows menus go inside the window via `win({ menus })`.
- `keys()` writes a shortcut once and renders it in each platform's
  notation; `menu()` items and `tooltip()` take `keys` and use it.
- `dialogButtons()` arranges `[{label, kind}]` in the platform's order;
  `sheet()` and `alert()` call it for `actions` and `buttons`. Which buttons
  exist and what they say is the product's.
- `ctl.*` are stand-ins for the OS's own controls, drawn in each platform's
  shape and colored from tokens. They are part of the frame, not a
  component library: production uses the real native control. `state`
  takes `"hover" | "pressed" | "disabled" | "focus"` where the control
  supports it.
- `sideNav()` draws sidebar rows in the platform's shape. What the sidebar
  lists is the product's.
- `icon`, `glyph` and tab icons take rendered HTML from the product's icon
  library. Without one, frames draw a neutral placeholder tile.

## Platform chrome

| | macOS | Windows |
| --- | --- | --- |
| Title bar | title centered; with a toolbar, title leading and toolbar unified into the bar | app icon and title left, 32 epx bar |
| Window controls | close, minimize, zoom at top left; gray when inactive; `controls` disables some | minimize, maximize, close at top right; close hovers red |
| Menus | global menu bar at the top of the screen (`menubar()`) | in-window menu row under the title bar (`menus`) |
| Toolbar | unified with the title bar | command bar row under the title bar |
| Sidebar | full height, window controls inside it; `inset` floats it | navigation pane beside a raised content layer |
| Panels | hangs under its menu-bar item; `arrow` for popover style | opens above the taskbar near the clock |
| Sheets and alerts | sheet attached under the title bar; alert centered | content dialog centered over a smoke layer |
| Dialog button order | right-aligned, default button last | primary first, Cancel last, equal widths |
| Shortcuts | symbols, ⌃⌥⇧⌘ order | `Ctrl+Shift+N` |
| Corners | `--win-radius` 14 | `--win-radius` 8 |

The platform switch changes only this table. Whether the product has a
sidebar, a toolbar, tabs, an inspector or a status bar is the product's
decision and lives in the options and inside the screen.

## Materials

Sidebars, panels, menus and dialogs are translucent materials on both
platforms (vibrancy on macOS, Mica and Acrylic on Windows). The frame draws
them opaque, derived from tokens: `--win-bg` (content), `--win-sidebar`,
`--win-popover`, `--win-raise`. A page may override these on `.wscreen` to
assign different tokens (`--win-sidebar: var(--canvas)`). If the product
depends on a material, say so in a note; the frame does not imitate
translucency.

## Things that are system UI

Permission prompts, the Dock, the Start menu, notifications, file pickers,
the desktop around a panel: draw them as placeholders in the frame or inside
the screen, and label the column so it is clear the OS draws that part
(`label: "System prompt, drawn for placement."`). They mark where system UI
appears, not a reproduction of it.

## Screen markup

Screens are template literals; repeated product chrome (a sidebar, a
toolbar) goes in a page-local constant or function:

```js
const sidebar = sideNav([{ key: "week", icon: icon("calendar"), label: "This week" }], "week");
const journal = (inner, opts = {}) =>
  win(inner, { title: "This week", size: [1000, 620], minSize: [760, 480], sidebar, pad: false, ...opts });
```

Page-local helpers are conveniences for one page, not a component library:
don't share them between pages, and don't treat their names as something
production must mirror. Screen CSS lives in the page's `<style>` and takes
its values from tokens (see tokens.md).

## Icons

The icon library is the product's, loaded in every page head and recorded
in MOCKUP.md. System symbol sets (SF Symbols, Segoe Fluent Icons) are not
web fonts; use inline SVG or a stand-in library and record the mapping in
MOCKUP.md if the product needs one. Define one page-local shorthand
(`const icon = (name, fill) => …`) so a library change is one function's
diff. The frame's own chrome is inline SVG and needs no library.

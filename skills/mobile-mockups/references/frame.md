# The phone frame

`phone.js` and `phone.css` draw the device around a screen. The frame owns
the chrome the operating system draws (status bar, camera cutout, home
indicator, back affordance) and nothing the product draws.

## Baseline

390×844, both platforms. Mockup px = production pt on iOS and dp on
Android, 1:1. A typical Android phone is 390–412 dp wide; one baseline keeps
two-platform pages comparable column by column. `?zoom=100` shows the frame
at its true size.

## API

```js
phone(innerHTML, {
  platform: "ios" | "android",  // default PHONE_PLATFORM ("ios")
  tab: tabbar(TABS, "home"),    // rendered tab bar, or null
  scroll: true,                 // content region scrolls
  back: false,                  // back affordance top-left
  footer: "",                   // pinned area below the scroll region
  night: false,                 // force dark tokens on this frame
  bare: false,                  // no status bar or body wrapper
});

tabbar(items, activeKey)        // items: [{ key, icon, iconActive, label }]
statusBar(platform)             // used by phone(); exposed for bare frames
```

- `PHONE_PLATFORM = "android"` once at the top of a page script sets the
  default for every frame on it.
- `tabbar()` takes rendered icon HTML from whatever library the product
  uses (or emoji, or inline SVG). Render it once per page into a constant.
  Its look is a neutral placeholder; a product with its own tab bar builds
  it page-locally and passes the HTML as `tab`.
- `footer` pins content above the home indicator, outside the scroll
  region; with a `tab`, it sits above the tab bar.
- `bare` gives the full 390×844 to the content: home screen, lock screen,
  widgets, splash, system sheets. The cutout and home indicator stay.

## Platform chrome

| | iOS | Android |
| --- | --- | --- |
| Status bar | time 9:41 left; signal, Wi-Fi, battery right | time 9:30 left; Wi-Fi, signal, battery right |
| Camera | Dynamic Island, centered | punch-hole, centered |
| Back (`back: true`) | chevron | arrow |
| Bottom | home indicator | gesture handle |
| System space | status bar region, bottom ~34 pt | status bar region, gesture area |

The platform switch changes only this table. Whether the product uses a tab
bar, a navigation bar, a top app bar, sheets or dialogs is the product's
decision and lives inside the screen.

## Things that are system UI

Permission alerts, share sheets, keyboards, notification banners, the home
screen around a widget: draw them inside a `bare` frame or inside the screen,
and label the column so it is clear the system draws that part
(`label: "System alert, drawn for placement."`). They are placeholders for
where the system UI appears, not a reproduction of it.

## Screen markup

Screens are template literals; repeated chrome (tab bar, a header the
product repeats) goes in a page-local constant or function:

```js
const TABS = [
  { key: "home", icon: icon("house"), iconActive: icon("house", true), label: "Home" },
  { key: "you", icon: icon("user"), iconActive: icon("user", true), label: "You" },
];
const today = phone(`<h2 class="t-title">Today</h2> …`, { tab: tabbar(TABS, "home") });
const todayEmpty = phone(`<h2 class="t-title">Today</h2> …`, { tab: tabbar(TABS, "home") });
```

Page-local helpers (`row()`, `chip()`) are conveniences for one page, not a
component library: don't share them between pages, and don't treat their
names as something production must mirror. Screen CSS lives in the page's
`<style>` and takes its values from tokens (see tokens.md).

## Icons

The icon library is the product's, loaded in every page head and recorded
in MOCKUP.md. Define one page-local shorthand
(`const icon = (name, fill) => …`) so a library change is one function's
diff. The frame's own chrome (status bar, back) is inline SVG and needs no
library.

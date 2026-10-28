# iOS conventions for mockups

What changes when the frame is an iPhone. Mock the conventions, not the
pixels: the goal is that an iOS engineer recognizes every pattern and never
has to invent one. Verify specifics against Apple's Human Interface
Guidelines when a decision hinges on them — platform details move every
release.

## Frame

- `phone(html)` — 390×844 pt, Dynamic Island, status bar at 9:41, home
  indicator. Mockup px = pt, 1:1.
- Safe areas: the status bar region and the bottom ~34 pt are system space.
  Content may scroll under them; controls never sit in them.
- `?zoom=100` shows the true size; review type there at least once.

## Navigation

- **Tab bar** for 2–5 top-level destinations. Labels always, icons from one
  family with a filled active state. `tabbar()` draws the current floating,
  opaque style; a classic edge-to-edge bar is a page-local variant.
- **Push navigation** for drill-down: back affordance top-left
  (`phone(html, {back: true})`), the title of the pushed screen in content
  or a nav bar, never both.
- **Sheets** for focused tasks that return (compose, filter, confirm). Mock
  the sheet over a dimmed parent screen; show the grabber, and say in a note
  whether it is medium-detent or full.
- **Alerts** only for decisions that block: two buttons, the destructive one
  styled as such, a title that states the consequence.

## Type and sizing

- Body 17 pt is the system default; going below 15 pt for reading text needs
  a reason in a note. Large titles (34 pt) belong to top-level screens.
- Dynamic Type: mock at least one key screen at a large accessibility size
  (scale the type roles in a page-local `.xl` override and tag the column
  "AX size") — layouts that only survive the default size are not done.
- Hit targets ≥ 44×44 pt.

## Platform patterns worth mocking explicitly

- Permission prompts (notifications, health, location): mock your pre-prompt
  screen AND a column showing the system alert's place in the flow (`bare`
  phone, a plain rendering of the alert — clearly labeled as system UI).
- Widgets and Live Activities: home-screen and lock-screen context matter
  more than the widget alone; mock them in place with `bare: true`.
- Empty, offline, and denied-permission states for every feature that
  depends on them.
- Swipe actions and context menus: show the revealed state as its own
  column; gestures are invisible in a static mockup unless you draw them.

## Icons

SF Symbols match the platform, but the license limits them to Apple-platform
UI; a cross-platform product often picks a neutral library (Phosphor,
Lucide, Material Symbols) and uses it on both. Record the choice in
DESIGN-SYSTEM.md either way.

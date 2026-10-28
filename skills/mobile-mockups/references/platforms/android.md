# Android conventions for mockups

What changes when the frame is an Android phone. Same method, same design
system; different navigation grammar. Verify specifics against the current
Material 3 guidelines when a decision hinges on them.

## Frame

- `phone(html, {platform: "android"})`, or `PHONE_PLATFORM = "android"`
  once per page. Same 390×844 baseline — mockup px = dp, 1:1 (a typical
  phone is ~390–412 dp wide; the difference rarely changes a layout, and
  keeping one baseline keeps two-platform pages comparable).
- Punch-hole camera, compact status bar, gesture handle. Apps draw
  edge-to-edge: content runs under the status and navigation bars; controls
  keep clear of them.

## Navigation

- **Navigation bar** (bottom) for 3–5 destinations. Material's active state
  is a pill indicator behind the icon; implement it as a page-local
  `tabbar` variant if the product follows Material closely, or keep the
  shared tab bar if the product has its own cross-platform identity — and
  say which in DESIGN-SYSTEM.md.
- **Top app bar** with title and actions; the back arrow is an arrow, not a
  chevron (`phone(html, {platform: "android", back: true})` draws it).
- **System back** exists everywhere. Every pushed screen, sheet, and dialog
  must say in a note what back does — especially in multi-step flows where
  back might discard input.
- **Bottom sheets** and **dialogs** follow the same rules as iOS sheets and
  alerts; dialogs put actions bottom-right, text buttons by default.
- FABs only for a single, dominant creation action.

## Type and sizing

- Material's body is 14–16 sp; products with their own type system usually
  keep their mobile scale on both platforms. Mock one key screen at a large
  font scale (tag "Font 200%").
- Hit targets ≥ 48×48 dp.

## Two-platform products

Mock the shared flow once. Add Android columns, tagged "Android", only where
the platforms genuinely diverge: navigation chrome, permission flows,
widgets, share sheets, back behavior. A full second copy of every screen
doubles review work and drifts within a week.

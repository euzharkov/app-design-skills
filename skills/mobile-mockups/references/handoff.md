# Handoff: from mockup to production

The mockup is the design source of truth — production implements what the
pages show. Handoff is cheap here because both sides are code, but a few
rules keep the translation honest.

## What transfers, and how

- **Design values** → the production theme, by role name. `--ink-600` becomes
  the theme's secondary text color whatever production calls it. Sizes map
  1:1: mockup px = production pt/dp at the frame's baseline (390×844 for
  phones, the declared window size for desktop).
- **Type roles** → the production type system, role by role, metrics intact.
  A mockup `.t-title` (28/34, semibold) becomes the `title` text style with
  the same numbers — not "whatever h2 renders as".
- **Copy** → 1:1. User-facing text is taken from the mockup verbatim into
  code or translation files. Do not silently rewrite mockup copy for
  implementation convenience; if copy must change, change the mockup in the
  same commit so it stays true.
- **Layout intent** → reproduced, not transliterated. The mockup's flexbox is
  evidence of the intended result; production uses its own idiomatic layout
  to achieve the same result.
- **What does NOT transfer**: mockup class names, page-local helpers, DOM
  structure, anything in `mockup-core.css` or the frame files. They are presentation hooks of the
  workbench. Production owning its own component architecture is a feature of
  this method, not a gap.

### Example: exporting the theme

Generate the production theme from `design-system.css` mechanically. E.g.
React Native:

```ts
export const color = {
  canvas: "#f4f2ee",
  card: "#ffffff",
  inkPrimary: "#1f2126",   // --ink-900
  inkSecondary: "#4b4e57", // --ink-600
  accentInteractive: "#4653c8",
  // …one entry per role, both themes
};
export const type = {
  title: { fontFamily: "…", fontWeight: "600", fontSize: 28, lineHeight: 34, letterSpacing: -0.2 },
  // …one entry per .t-* role
};
```

Tailwind: map roles into `theme.extend.colors` / `fontSize`; web CSS: import
the custom-property block directly. Whatever the target, keep role names
recognizable so diffs stay reviewable.

## Keeping the mockup alive

A mockup that rots is worse than none — people stop trusting all of it.

- Design changes flow mockup-first when possible: adjust the mockup, review,
  then implement. The mockup stays the place where design is cheap.
- When implementation legitimately deviates (platform constraints, a11y
  findings, performance), back-port the deviation to the mockup — by role and
  intent, not by copying pixel workarounds (see "Translating to and from
  production" in the project's DESIGN-SYSTEM.md).
- When a flow ships and stabilizes, either keep its section maintained or
  mark it explicitly ("Shipped v1.4 — see app") — never leave a stale section
  that silently looks authoritative.
- The contrast audit keeps working forever; re-check it whenever a role hex
  changes post-launch.

## Parity checks

Once screens ship, put the real thing next to the mockup. The cheapest
route is a debug-only snapshot hook in the app — a URL scheme, launch
argument, or CLI flag that renders a named state to a PNG (for example
`myapp://snapshot?state=empty&out=/tmp/empty.png`). Name the states after
the mockup's section and column ids, and a parity review becomes "open both
images side by side" instead of "click around until you find it".

Where the product computes numbers (sizes, totals, durations), take mockup
data from a real run rather than inventing it; invented numbers hide layout
problems (a 7-digit total the design never planned for).

## Handoff package

When handing to another team or agent, the complete package is the mockup
directory itself: pages + `design-system.css` + `DESIGN-SYSTEM.md` (the
contract, including the translation rules) + this method's conventions. A
receiving agent should be able to implement any screen from the mockup alone,
asking only product questions — if it can't, the gap is usually a missing
note or state, and fixing that improves the mockup for everyone.

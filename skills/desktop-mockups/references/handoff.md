# Handoff: what moves from the mockup to the app

Both sides are code, so handoff is a lookup, not an interpretation. What
transfers and what doesn't is decided by which layer a thing lives in.

## What transfers

- **Tokens**, by name. Each token maps to one production theme value with
  the same name (or the name it was imported from). Sizes are 1:1: mockup
  px = production pt or dp at the frame's baseline (390×844 for phones, the
  declared window size on desktop).
- **Type roles**, role by role with metrics intact: `.t-title` (28/34,
  semibold) becomes the production `title` style with the same numbers.
- **Copy**, verbatim, when the person treats the mockup as the copy source.
  If copy changes during implementation, change the mockup in the same
  commit so the two don't drift.
- **Screen ids**: `<section-id>--<screen>` names the state everywhere: in
  tickets, in test names, in parity snapshots.

## What doesn't transfer

Canvas and frame files, page-local helpers, mockup class names, DOM
structure. They exist to present screens. Production owns its own component
architecture; the mockup's markup is evidence of the intended result, not
code to port.

## Exporting tokens

Generate the production theme mechanically from `tokens.css`, keeping names
recognizable so diffs stay reviewable. React Native, for example:

```ts
export const color = {
  canvas: "#f4f2ee",       // --canvas
  inkSecondary: "#4b4e57", // --ink-600
  // one entry per color token, both themes
};
export const type = {
  title: { fontFamily: "…", fontWeight: "600", fontSize: 28, lineHeight: 34, letterSpacing: -0.2 },
  // one entry per .t-* role
};
```

Tailwind: map tokens into `theme.extend.colors` and `fontSize`. Web: import
the custom-property block as it is. When the tokens were imported from
production in the first place, the export is the reverse of the import and
should produce no diff.

## Parity checks

Once screens ship, put the real thing next to the mockup. The cheapest route
is a debug-only snapshot hook in the app (a URL scheme, launch argument, or
CLI flag that renders a named state to a PNG) whose state names are the
mockup's screen ids. A parity review is then "open both images side by
side":

```
mockup:  index/daily-loop--today-empty.png
app:     snapshots/daily-loop--today-empty.png
```

## Keeping the mockup current

- When implementation changes a token value, change `tokens.css` too; the
  audit keeps checking it.
- When a section has shipped and nobody maintains it, say so in its
  description (`Shipped in 1.4; the app is the reference now`) instead of
  leaving it to look authoritative.
- The complete handoff package is the mockup directory itself: pages,
  `tokens.css`, `MOCKUP.md`, and the captures named by screen id.

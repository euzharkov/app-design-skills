# Tokens: how values reach the screens

`tokens.css` holds the product's values. The values are the person's (or
their production theme's); the skill owns the structure: how tokens are
named, grouped, themed, documented, and audited, so that one edit reaches
every screen and the tokens section can show what exists.

The starter values are placeholders that let the canvas render on day one.
They are not a recommendation; replace them with the product's.

## Where values come from

Ask once, in this order:

1. **A production theme exists** (Tailwind config, a React Native or Flutter
   theme file, Android `colors.xml`/`themes.xml`, an asset catalog, CSS
   custom properties, a Figma variables export). Import it: one token per
   production value, under the production name, kebab-cased
   (`colors.textSecondary` → `--text-secondary`). Don't rename, merge, or
   "clean up" during import; the mockup mirrors production so handoff is a
   lookup.
2. **A sibling mockup exists** for another surface of the same product (a
   desktop mockup next to a phone one). Copy its color tokens, both themes,
   verbatim. Re-derive only what the surface changes: type sizes, spacing,
   radii, insets. One product, one set of color names.
3. **Nothing exists yet.** Keep the starter structure and ask the person for
   the values they have (brand colors, fonts). Leave the rest as the
   placeholder and list it in MOCKUP.md as unset. Don't invent a palette and
   present it as theirs.

## The file

One stylesheet, four parts, in this order:

```css
:root {
  /* color tokens */      --canvas: …; --ink-900: …; --accent-interactive: …;
  /* font tokens */       --font-display: …; --font-body: …; --weight-regular: 400;
  /* spacing */           --space-1: 4px; … ;
  /* shape */             --radius-small: 8px; … ;
  /* other */             --screen-inset: 24px;
}
.t-title { font-family: …; font-weight: …; font-size: …; line-height: …; letter-spacing: …; color: …; }
/* … one class per type role … */
.theme-dark .screen,
.screen.night { /* every color token that differs in dark, nothing else */ }
```

The tokens section reads the file by these conventions; keep them when the
names change:

| Kind | Convention | Shown as |
| --- | --- | --- |
| Color | any custom property whose value parses as a color | swatch, light over dark |
| Font family | `--font-*` | listed |
| Weight | `--weight-*` | listed |
| Spacing | `--space-*` | bar at true length |
| Radius | `--radius-*` | rounded chip |
| Type role | a `.t-<role>` class | live sample with its metrics |

The engine finds the stylesheet by its file name (`tokens.css`; older
mockups call it `design-system.css` and still work).

## Naming tokens

- **Production names win.** If the product has names, use them.
- **Otherwise name by role, not by appearance**: `--ink-600` or
  `--text-secondary`, never `--gray` or `--blue-light`. A role keeps its name
  when its value changes, and dark mode re-resolves the same role.
- **Flat, one level.** A token holds a value; it doesn't point at another
  token, and there are no component tokens (`--button-bg`). Screens compose
  values directly, so the mockup never grows a private component API that
  production would be pushed to mirror.
- **Type roles are classes**, `.t-<role>`, and each one sets family, weight,
  size, line height, tracking, and default color together. Screens put the
  class on the element; they don't restate the metrics.

## Dark theme

- The dark block is scoped to `.screen`, not the page: the canvas stays
  light so labels and notes stay readable while screens go dark.
- `.theme-dark` on `<body>` (the toolbar and `?theme=dark`) flips every
  frame; `.screen.night` (`night: true` on a frame) forces one frame dark in
  both themes.
- The dark block redefines color tokens only. Type, spacing, and shape don't
  change between themes.
- A product with no dark theme deletes the block; the toolbar's Dark button
  then shows the same values, and MOCKUP.md says the product is light only.

## Contrast pairs

`contrastPairs` in `index.html`'s config lists the foreground/background
combinations screens actually use:

```js
contrastPairs: [
  ["--ink-900", "--card"],
  ["--accent-interactive", "--canvas"],
  ["--ink-600", "--accent-tint", "--card"],  // translucent bg over a base
],
```

The tokens section computes the WCAG 2.1 ratio of each pair in light and
dark. The audit reports; it doesn't decide. A failing pair is shown to the
person with its ratio, and what to do about it is their call.

## Keeping it in sync

These change in the same edit, or not at all:

- `tokens.css`,
- the token table in `MOCKUP.md`,
- `contrastPairs`, when a new color pair appears on a screen.

Inside frames, values come from tokens: `var(--…)` for colors, spacing and
radii, `.t-*` classes for type. A raw hex or pixel size inside a screen is
invisible to the tokens section and won't follow a token change. When a
screen needs a value that doesn't exist yet, add the token (with its dark
value) rather than hard-coding it. Canvas and frame files are the exception:
they hold raw values by design, because they belong to the canvas.

## Checks

Open `?solo=tokens` in light and dark after any token change:

- no `unresolved` rows in the audit (a misspelled token name, or a comment
  that swallowed a rule: `*/` inside a CSS comment ends it early, silently);
- every type role sample renders in the intended font, not a system
  fallback (a missing font link in the page head);
- swatches show the dark value under the light one for every color the
  dark block redefines.

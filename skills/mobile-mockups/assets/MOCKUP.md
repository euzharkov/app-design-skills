# {{PRODUCT}} — mockup

<!-- The contract for this mockup directory. Fill every {{placeholder}} and
     delete these comments. When tokens.css or the page list changes, this
     file changes in the same commit. -->

Phone mockups of {{PRODUCT}}, built with the `mobile-mockups` skill. Screens
show what the product team decided; the canvas around them (grouping,
names, tags, frames, tokens section) follows the skill's rules and isn't
edited per product.

## Surfaces

| | |
| --- | --- |
| Platforms | {{iOS / Android / both; primary first}} |
| Frame | phone, 390×844, mockup px = pt (iOS) / dp (Android) |
| Themes | {{light and dark / light only}} |
| Sibling mockups | {{path to the desktop mockup, or none}} |
| Token source | {{imported from <production theme path> / set by hand / placeholders}} |
| Fonts | {{families, and where they load from}} |
| Icons | {{library and version, or inline SVG}} |

## Pages

| Page | Area | Sections |
| --- | --- | --- |
| `index.html` | tokens + {{main area}} | {{section ids}} |

## Naming

- Section ids are kebab-case and never change once shared.
- Columns have a `name`: the screen's name in the product, then the state
  after a comma (`Today, empty`). Screen ids are
  `<section-id>--<name>[--<tag>]`.
- Platform tags: `iOS`, `Android`. Variant tags: {{the team's words, e.g.
  Free, Plus}}.
- Captures are named by screen id.

## Tokens

`tokens.css` is the only place product values live. Screens use `var(--…)`
and `.t-*` classes; no raw colors or sizes inside frames.

| Token | Light | Dark | Production name |
| --- | --- | --- | --- |
| `--canvas` | {{hex}} | {{hex}} | {{name}} |
| `--card` | {{hex}} | {{hex}} | {{name}} |
| {{…one row per color token}} | | | |

| Type role | Family / weight | Size / line | Tracking | Production name |
| --- | --- | --- | --- | --- |
| `.t-title` | {{…}} | {{28/34}} | {{…}} | {{name}} |
| {{…one row per .t-* class}} | | | | |

Spacing `--space-*`: {{values}}. Radii `--radius-*`: {{values}}.

Unset (still the starter placeholder): {{tokens nobody has decided yet, or
"none"}}.

## Decisions

<!-- Product decisions recorded in this file rather than in a note on a page,
     when they span pages. Leave empty until there are some. -->

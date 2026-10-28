# {{PRODUCT}} — Desktop Mockup Design System

<!-- This file is the written contract for the design system in design-system.css.
     Fill every {{placeholder}}, delete instruction comments, and keep it honest:
     when the CSS changes, this file changes in the same commit. -->

This document governs `design-system.css` and every mockup page beside it. The
mockups are the design source of truth for {{PRODUCT}}; production implements
what these pages show, and user-facing copy is taken from them 1:1.

## Model: two layers only

1. **Flat shared values** live in `design-system.css`: semantic colors, type
   roles, spacing, radii, and screen insets.
2. **Screen CSS** lives with each HTML page and controls composition,
   positioning, and exceptional screen-specific presentation.

There is intentionally no component-token tier, component library, or shared
runtime. CSS classes in pages are ordinary presentation hooks, not a component
API that production must mirror.

## Product context

<!-- Two or three sentences: audience, tone words, platform. Everything below
     should be explainable from this paragraph. -->

{{Audience, the three tone words chosen during discovery, target platforms
(macOS / Windows, which is primary), and anything about context of use that
shapes the system — e.g. "glanced at from the menu bar between meetings" or
"dense pro tool used all day on a 27-inch display".}}

**Sibling system:** {{path to the mobile mockup directory, or "none"}}. If
present, the color roles below are copied from it verbatim; only type,
spacing, radii, and insets are desktop-specific.

## Colors

Use semantic roles, never colors by appearance:

| Role | Light | Dark | Rule |
| --- | --- | --- | --- |
| `--canvas` | {{hex}} | {{hex}} | App background. Must stay visibly distinct from card. |
| `--card` | {{hex}} | {{hex}} | Raised surface for primary content. |
| `--functional` | {{hex}} | {{hex}} | Quieter surface: form fields, secondary containers. |
| `--selected` | {{hex}} | {{hex}} | Chosen/pressed fill. |
| `--accent-tint` | {{hex}} | {{hex}} | Soft wash for highlighted containers. Never carries body text alone — pair with ink. |
| `--ink-900/600/400` | {{hex}} ×3 | {{hex}} ×3 | Primary / secondary / tertiary text. Each step passes its contrast target on canvas AND card. |
| `--accent-interactive` | {{hex}} | {{hex}} | Links, active states — must pass 4.5:1 where it carries text. |
| `--accent-decorative` | {{hex}} | {{hex}} | Fills and illustration; never carries text. The two accent hexes may swap roles between themes so interactive stays the readable one. |
| `--danger` | {{hex}} | {{hex}} | Serious, not alarmist. |

Raw colors are reserved for preview-only material (window chrome, traffic
lights, menu bar, taskbar, wallpaper, gallery) — that is workbench territory
(`mockup-core.css`, `window.css`). Chrome tints the frames derive
(`--win-sidebar`, `--win-hover`, …) follow the roles automatically; if one
carries text that matters, promote it to a role here so the audit sees it.

Dark mode is a re-resolution of roles, not an inversion of hexes: surfaces
rise instead of going pure black, ink softens instead of going pure white.
{{Note any screens that are light-only or dark-only, e.g. onboarding.}}

## Typography

A role owns its family, weight, size, line height, tracking, and default color
together, as a `.t-*` class. Mockup px = production pt, 1:1 at each window's
declared size. Desktop scale: macOS body is 13 pt (Windows: 14 px).

| Role | Family / weight | Size / line | Tracking | Default color | Intended use |
| --- | --- | --- | --- | --- | --- |
| `.t-display` | {{family}} {{weight}} | {{26/32}} | {{-0.3}} | Primary | Emotional opening or highest-emphasis heading |
| `.t-title` | {{…}} | {{20/26}} | {{…}} | Primary | Functional screen title |
| `.t-heading` | {{…}} | {{15/20}} | {{…}} | Primary | Section or strong card heading |
| `.t-subheading` | {{…}} | {{13/16}} | 0 | Primary | Compact section heading |
| `.t-body-lg` | {{…}} | {{12/16}} | 0 | Primary | Prominent supporting copy |
| `.t-body` | {{…}} | {{11/14}} | 0 | Primary | Default reading copy |
| `.t-callout` | {{…}} | {{15/22}} | 0 | Secondary | Compact supporting or control copy |
| `.t-caption` | {{…}} | {{13/18}} | +0.1 | Secondary | Metadata and secondary labels |
| `.t-link` | {{…}} | {{17/26}} | 0 | Interactive | Text action or inline link |
| `.t-on-accent` | {{…}} | {{13/16}} | 0 | On-accent | Label on a filled primary action |

<!-- Rename, add, or remove roles to fit the product — then keep this table
     and the .t-* classes in perfect sync. Ten roles is usually plenty. -->

Family rules:

- At most two families: {{display family}} for `display`/`title`, {{body
  family}} for everything else.
- Only weights {{400, 500, 600}} are loaded. Do not request or synthesize
  others.
- Do not rely on browser-default `h1`–`h6`, `strong`, or button typography;
  assign a role class explicitly.
- Italics are not a hierarchy tool.

Screen CSS may change alignment, wrapping, truncation, or an explicitly
semantic color. It must not partially override a role's family, weight, size,
line height, or tracking to solve a layout problem. Let text wrap; avoid
fixed-height text containers so longer copy stays visible.

## Icons

{{SF Symbols via generated CSS / Segoe Fluent Icons / a library and version /
"inline SVG only"}} — the user's choice at discovery, loaded identically in
every page head. If the mockup uses a stand-in library, keep a mapping table
(mockup icon → production symbol name) here. Default weight
{{outline/regular}}; active or selected states use {{filled variant / weight
change}}. Icons never substitute for labels on primary navigation.

## Spacing

4px scale (`--space-1` … `--space-10`). {{Note any half-step policy.}}
Negative spacing is an explicit optical adjustment and needs a short comment
explaining why layout structure cannot express the result.

## Radius and sizing

Four shared radii: small {{6}}, control {{8}}, card {{12}}, pill. Window
corner radii and OS chrome geometry are preview geometry, not product values.
Pointer targets: at least 24×24 pt on macOS, 32×32 on Windows (40 for
touch-capable Windows devices); spacing between targets keeps misclicks rare.

## Interaction states

Desktop is pointer + keyboard. Every interactive element defines: rest,
hover {{e.g. ink tint / raise}}, pressed, focus ring {{accent ring, 3 pt}},
disabled {{45% opacity}}. Every command has a menu home; shortcuts appear in
menus and tooltips: {{list the product-wide shortcuts}}.

## Rules per window

Record decisions per surface, not as one flat list — a rule about the
popover rarely holds for the main window. Delete surfaces the product doesn't
have; add the ones it does.

### Main window
- Size {{w × h}} default, minimum {{w × h}}; what happens at the minimum.
- Sidebar {{width, fixed or collapsible, sections}}; toolbar items {{…}}.
- Selection, hover, and empty-content rules.

### Menu-bar / tray popover
- Width {{340}}; height follows content up to {{max}}, then {{scrolls}}.
- What opens it (click, global shortcut), what closes it, what it never shows.

### Sheets and dialogs
- When a sheet vs. an alert vs. inline confirmation; default-button rules for
  destructive actions; button wording matches the menu command.

### Alerts
- Reserved for {{irreversible / blocking}} decisions; title is a question,
  the destructive button names the action and count.

### Settings
- Panes {{…}}; window width {{…}}, height follows the pane; zoom disabled.

### Installer / onboarding
- Steps {{…}}; one decision per screen; what is skippable.

## Screen-specific CSS

Screen selectors may define display mode, flex/grid direction, order,
wrapping, scrolling, positioning, and responsive behavior. They consume shared
values for typography, spacing, color, and shape. An intentional exception
must be obvious from its location and comment; do not silently promote an
exception into a new convention.

## Incremental migration

Older pages may contain legacy one-off values. Do not normalize a whole file
while making an unrelated change: clean the declarations you touch, leave
unrelated screens stable.

## Parity with the app

The app exposes a debug snapshot hook ({{e.g. a URL scheme or CLI flag that
renders a named state to PNG}}). Every UI state in the app has a section or
column here; app snapshots sit next to mockup states at review. Numbers in
mockups come from a real run of the product where it computes them.

## Translating to and from production

Production code is evidence of intended results, not a second source of design
values. Translate by role and intent:

- A typography change maps to the closest existing type role.
- A palette change updates the flat semantic color, both themes considered.
- A screen layout change stays in that screen's CSS on the spacing scale.
- A one-off implementation workaround is not copied back unless it represents
  an intentional design decision.

If a change requires a new shared value, it must be reusable beyond the
current screen or map to an established product-wide role.

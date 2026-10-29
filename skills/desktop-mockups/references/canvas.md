# The canvas

A mockup is two things: the screens, and the canvas they sit on. This skill
owns the canvas. What happens inside a screen (layout, copy, palette values,
which states exist, how the product behaves) belongs to the person whose
product it is. The canvas is everything around the screens: how they are
grouped, what each one is called, how it is tagged, how it is framed, how
values reach it, and how it is captured.

Keep that line in both directions. Build the canvas strictly, by the rules
below. Inside a frame, build what the person describes, and where they leave
a gap, fill it with the plainest plausible content and say so in a note. Don't
critique or redesign screen content unless asked.

## Skeleton

```
mockup/
├── tokens.css          the product's values (theirs; structure is ours)
├── MOCKUP.md           the contract: platforms, pages, naming, token table
├── mockup-core.css/js  the canvas engine (never edited per product)
├── phone.* / window.*  the frame for this surface
├── index.html          the tokens section + the first area
└── <area>.html         one page per further area
```

Every page has the same `<head>` (tokens.css, mockup-core.css, the frame
CSS, mockup-core.js, the frame JS, and whatever fonts or icon library the
product loads), a `<div id="app">`, and one script that builds screens and
calls `renderMockupPage(cfg)`. Start new pages by copying `flow.html`.

```js
renderMockupPage({
  title: "Settings",                 // page title, also the tab title
  intro: "Account, privacy, data.",  // one line; link sibling pages here
  foundations: false,                // true only on index.html (tokens section)
  contrastPairs: [...],              // index.html only, see tokens.md
  sections: [
    {
      id: "delete-account",
      title: "Delete account",
      desc: "From the settings row to the confirmation email.",
      cols: [
        { name: "Account", html: account },
        { name: "Delete, confirm", label: "Type-to-confirm sheet.", html: confirm },
        { name: "Delete, confirm", tag: "Android", tagAccent: true, html: confirmAndroid },
      ],
      notes: [note("Grace period", "Deletion runs after 30 days.")],
    },
  ],
  pageNotes: [],                     // notes that apply to the whole page
});
```

## Grouping: page → section → column

| Level | Is | Holds |
| --- | --- | --- |
| Page | one area of the product (onboarding, settings, editor) | sections |
| Section | one flow or one moment in the product | columns, notes |
| Column | one screen in one state | one frame |

- Columns in a section read left to right in the order the user meets them.
  A section is a storyboard, not a catalog.
- One frame per column. Two states of one screen are two columns.
- The same screen may appear in several sections; it is built once (a
  variable or a page-local function) and placed where it is needed.
- Split a page when it passes about a dozen sections; long pages render and
  capture slowly. Link siblings from the intro line.
- `index.html` holds the tokens section first, then the product's main area.

## Naming

Names are the interface between the mockup and everything that refers to it:
chat, captures, tickets, parity snapshots. Pick them once and keep them.

| Thing | Format | Example |
| --- | --- | --- |
| Page file | kebab-case area | `settings.html`, `onboarding.html` |
| Page title | the area, as the product calls it | `Settings` |
| Section id | kebab-case, stable | `delete-account` |
| Section title | sentence case | `Delete account` |
| Section desc | one sentence: what the section covers | `From the settings row to the confirmation email.` |
| Column `name` | the screen's name in the product, then the state after a comma | `Today`, `Today, empty`, `Delete, confirm` |
| Column `label` | optional; one short line under the name | `Type-to-confirm sheet.` |

- A column with a `name` gets the id `<section-id>--<name>`, plus
  `--<tag>` when it has a tag: `delete-account--delete-confirm`,
  `delete-account--delete-confirm--android`. Every screen has an address:
  `settings.html?solo=delete-account#delete-account--delete-confirm`.
  Refer to screens by that id in conversation, in capture file names
  (`delete-account--delete-confirm.png`), and in parity snapshot names.
- Names are unique within a section, except platform or variant twins:
  the iOS and Android versions of a screen share the name and the tag
  tells them apart.
- The screen name uses the product's own word for the screen: what its title
  bar says, or what the team calls it. No "Screen 3", no "Mockup A".
- Never rename a section id after it has been shared or captured. Retitle
  freely; the id stays.
- Older pages put the name in the label as `<b>Name.</b> text`. That still
  renders; use `name` for new columns.

## Tags

The tag slot sits above every frame, empty or not, so frames stay aligned.

- **Platform tags** mark every column that isn't on the page's primary
  platform: exactly `iOS`, `Android`, `iPadOS`, `macOS`, `Windows`, `Web`.
- **Variant tags** mark a column that shows a variant of a screen named
  elsewhere: a short noun the team uses (`Free`, `Plus`, `B`, `Large text`).
- States are not tags. "Empty", "offline", "error" go in the name, after
  the comma: `Search, no results`.
- Both at once: `Android · Plus`.
- `tagAccent: true` colors the tag, for the columns that depart from the
  page's primary platform or default variant, so they stand out in a rail.
- A page that is entirely one platform carries no platform tags; say the
  platform in the page intro instead.
- A tag that starts with a platform name gets that platform's glyph in
  front of it automatically (Apple for iOS, iPadOS and macOS; the Android
  robot; the Windows squares; a globe for Web). Otherwise tags are plain
  canvas text: no icons, no emoji, no product colors.

## Platforms

The frame's platform switch changes the chrome only: status bar, camera
cutout, back affordance, title bar, window controls. It never changes what is
inside the screen; that is the product's call.

- Set the page default once (`PHONE_PLATFORM = "android"`,
  `WINDOW_PLATFORM = "windows"`) and override per frame when a section mixes
  platforms.
- A product on two platforms: mock the shared flow once on the primary
  platform, then add tagged columns for the other platform only where its
  screens actually differ. When most of a flow differs, give the other
  platform its own section (`Daily loop on Android`, id `daily-loop-android`).

## Notes

- `note(title, body)` in a section's `notes` records a decision about that
  section; `pageNotes` record decisions that span the page.
- Notes record what the person decided and why, in their words. Don't invent
  rationale for choices nobody made; when you filled a gap with an
  assumption, a note says so (`Assumed: sign-in is email only`).
- The column `label` is not a note: it says what to look at in that one
  screen, in one line.

## Canvas style rules

- The canvas is neutral and identical for every product: gray paper, system
  font, fixed label and tag styles. It never takes the product's colors,
  fonts, or radii, so screens are judged against the same ground every time.
- Never edit `mockup-core.*` or the frame files for one product. If the
  canvas lacks something, it is a change to the skill, not to the mockup.
- Frames are authored at production size, 1:1 (390×844 pt phone; desktop
  windows at their declared size). Display size changes only through the
  zoom control (`?zoom=`); never scale or transform a frame by hand.
- Nothing product-shaped lives outside a frame: no floating buttons, product
  type, or brand art on the canvas. Explanations go in labels and notes.
- Inside a frame, values come from `tokens.css` (see tokens.md). That is the
  one rule the canvas sets for screen content, because it is what lets a
  token change reach every screen and the audit see every pair.
- Light and dark are a canvas switch (`?theme=dark`). The product's dark
  values live in the dark block of `tokens.css`; `night: true` forces one
  frame dark in both themes.

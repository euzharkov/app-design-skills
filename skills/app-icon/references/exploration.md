# Running a concept round

The goal of a round is not a pretty icon; it is a **decision** — one
direction chosen for stated reasons, the others rejected for stated reasons,
all of it written into the page.

## 1. Directions: 3–6, genuinely different

Fewer than three and you are refining, not exploring. More than six and the
round turns into a mood board nobody can decide on. Cover the three families
at least once:

| Family | What it bets on | Typical failure |
| --- | --- | --- |
| **Letterform / monogram** | The name will be known; the letter becomes the brand | At 29 px it is "a letter", indistinguishable from every other letter icon |
| **Symbol** | One object carries the product's idea | Literal feature pictograms (a pen for a notes app) blend into the category |
| **Abstract** | Shape + color become ownable through repetition | Means nothing until the brand is known; can read as a generic UI glyph |

Write each concept's `note` as a bet plus a risk: *what it says, and what
could sink it*. Rejected concepts keep their note with the verdict — the
next round should not re-propose them.

Ideas worth trying inside a direction: crop a shape with the icon edge (it
reads as entering the frame, not placed in it); a single cut-out detail in an
otherwise solid mark; one accent color against one neutral; a letterform
whose counter or terminal carries the symbol.

## 2. Judge small first

Open `?solo=concepts`. Look at the 60 / 40 / 29 / 16 strip **before** the
hero. In order:

1. **Recognition at 29–60 px** — can you tell what it is (or at least that
   it is *this* app) at a glance? 60 is the home screen, 40 is Spotlight
   and notifications, 29 is settings and search results.
2. **Squint test** (the blurred tile) — one dominant shape and one clear
   value contrast should survive. If the blur is an even smudge, the icon
   has no hierarchy.
3. **Silhouette / one-color test** — the mark in one ink on white. This is
   also roughly what tinted iOS and Android themed icons will do to it. If
   the idea lives only in a color difference, it dies here.
4. **Dark** — does the mark still have edge contrast on the dark plate?
5. Only then the 180 px hero: craft, proportion, character.

Then `?solo=sizes&concept=<id>` for the 6× pixel view of 16 / 29 / 40.
Hairlines under ~1.5 px at 60 px (≈ 26 units on the 1024 grid) will
shimmer or vanish; gaps narrower than that close up. If a detail is
essential, give the concept an `artSmall` with wider cuts rather than
compromising the large drawing.

## 3. Text: one or two letters, maximum

Words do not survive 29 px, and the store listing already shows the name
underneath. A letterform icon uses 1–2 letters. For letterforms:

- Run the **typeface study** (`typefaces:` in `icon.html`): the same glyph in
  4–6 candidate faces, normalized to equal ink height so you compare form,
  not size. Weight matters more than family at small sizes — test the
  weight you would actually ship.
- Check the face's license covers logo/icon use before committing.
- Keep the study live (`<text>` + webfonts) — but **outline** the winner
  with `outline-text.py` before it enters a master. Live text in an exported
  SVG renders with whatever fonts the exporting machine happens to have.
  The export script refuses masters containing `<text>`.

## 4. The competitor shelf

Ask the user what sits next to the app: category leaders, the apps their
audience already has. Record the field as **descriptions** — color + motif
family ("navy book", "teal leaf", "yellow letter J") — and add them to
`shelf.competitors` using the neutral glyph library (circle, ring, bars,
book, pen, leaf, moon, bubble, check, dots, wave, letter:X…). Never copy
real icons, marks, or app names into the page; the tiles exist to test
*distinctiveness of color and silhouette*, which descriptions capture.

Read the shelf for:

- **Find-it time** — on the 60 px light row, does the eye land on the
  candidate within a second?
- **Color clusters** — if half the field is one hue family, that hue is
  camouflage. An unclaimed hue is a cheap, durable differentiator.
- **Motif clusters** — the category's default metaphor (books for
  journals, pills for health, charts for finance) is usually the one to
  avoid, or to subvert.
- **The dark row** — many fields are distinct in light and collapse into
  sameness in dark.

## 5. Decide, then record

Mark the winner `chosen: true`, update its note with *why it won* in terms
of the tests above, and add `pageNotes` for decisions that span concepts
(palette, construction rules such as "detail is a cut-out, never a painted
stroke"). Show the user 2–4 screenshots — concepts, shelf, sizes — with one
specific question ("Is the leaf too literal for a journal?"), not "thoughts?".

## Review loop (every iteration)

1. Reload; check the console — a template-literal typo kills the whole render.
2. Screenshot `?solo=<section>` for what changed, light and `&theme=dark`.
3. Critique: recognition at 29–60, squint, one-color, edge contrast on
   light/dark/busy wallpapers, safe zone (Android composite), no live text
   in the chosen concept.
4. Fix in the concept (palette, mask, `artSmall`), never with a one-off
   override in a single section.

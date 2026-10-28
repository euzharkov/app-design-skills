# Telling the story in frames

A screenshot set is read like a poster series, mostly as thumbnails, mostly
only the first three. Plan it as a story before building a single frame.

## Shot order: promise → evidence → explanation

1. **Promise (frame 1, the hero).** The whole pitch in one line: what life
   looks like with the product. Poster-scale headline, the product's most
   characteristic screen. If someone sees only this frame, they should know
   what the app is for.
2. **Evidence (frames 2–4).** The core loop, shown working: the screen a
   user lives in, the moment the product pays off. Each frame proves one
   claim with real content.
3. **Explanation (frames 5+).** What makes it trustworthy or different:
   privacy, platform integration, what it deliberately doesn't do, pricing
   honesty. These answer objections; they don't open the pitch.

Write the shot list as a table first — order, eyebrow, headline, caption,
screen — and get it approved. Reordering a table is free; reordering
built frames is not.

**One idea per shot.** A frame that needs "and" is two frames, or one idea
too many. A frame that can't name its screen is a slogan, not evidence.

**The night beat.** If the product has a dark theme, put one fully dark
frame mid-rail (`night: true`): background, copy and device all dark. It
breaks the rhythm of a light rail and proves the dark theme in one move.
Keep it one frame; a fully dark set is a separate, optional variant
(`&theme=dark`).

**Continuity.** Shared copy band height, shared glow placement, the same
device scale unless a frame earns a crop — the rail should read as one
family when the store lays the frames side by side.

## Headlines

- **Short.** One line where possible; two at most; the hero may take three
  at poster size. The gallery's audit counts lines — over the limit means
  rewrite, never shrink the type.
- **Benefit, not feature.** What changes for the user, in their words.
  "Find any day in seconds", not "Full-text search with filters".
- **Concrete over clever.** Puns don't survive thumbnails or translation.
- **Eyebrow = the feature name**, small and in the accent role: it carries
  the noun so the headline can carry the benefit.
- **Caption optional**: one sentence that earns its place, or nothing.
- **Product voice**: the tone words from DESIGN-SYSTEM.md apply here too.
  A calm product doesn't shout in its listing.

## Inside the device

- Real screens from the mockup, with their real copy, verbatim. Marketing
  words belong in the headline; the screen is the proof.
- Plausible, flattering-but-honest data: a full week, a good result, names
  and dates that agree with each other across frames.
- **Crop to the story.** Default the device to bleed off the bottom edge
  (`scale` ≥ 1) so the content that matters sits large; show the whole
  device only when its full height is the point.
- **Breakout** (`overlay`): when the key detail is tiny on the phone, show
  it again larger, overlapping the device. Use sparingly — once per set.
- Platform truth: the Play cut must not show Face ID, iCloud, the Dynamic
  Island or iOS sheets. Make screens functions of platform.

## Localization

- Write headlines for translation: no idioms, no wordplay, room to grow —
  German and Russian run 30–40% longer, CJK shorter but needs its own
  font stack.
- Keep every string in the frame data (`shots[]`), not in markup, so a
  locale is a copy of the data array. A `?lang=` param that picks a
  translated array is a few lines of page script.
- Re-run the gallery audit per locale: line counts and copy-band overflow
  are where translations break.
- In-device copy comes from the product's own translations, not from a
  marketing translator.

## Accessibility of marketing text

Marketing text is text. Store screenshots are viewed small, on phones, in
sunlight; low contrast there costs installs.

- Every headline, caption and eyebrow is measured against its frame
  background by the **marketing-text contrast audit** at the bottom of the
  gallery, in light and dark. Headlines (≥ 24 px) need 3:1, captions and
  eyebrows 4.5:1 — aim higher for thumbnails.
- The audit measures the frame's **plain background role**. Decorative
  washes, glows and gradients must stay close to it behind text; if a wash
  darkens or lightens the copy zone, move it or measure the real pixel.
- Text over device screenshots or imagery isn't audited — avoid it.
- Fix failures in role values or the background choice, never by hiding
  the row.
- Don't encode meaning in color alone (a red "before" vs green "after"
  frame); say it in words.

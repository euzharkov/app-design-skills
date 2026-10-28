# Listing text

The screenshots and the text are one listing. Write the text after the
shot list, in the same voice, reusing the headlines as the backbone of the
description. Count characters for every field — consoles reject overflow,
and some truncate silently on smaller surfaces.

Limits current as of writing; verify in App Store Connect / Play Console.

## Template

Copy this into `listing.md` beside the exported graphics and fill it.
Keep each field in a fenced block so it can be pasted without formatting.

````markdown
# Listing — {{Product}} ({{locale}})

## App Store

### Name (30)
```
{{Product – short descriptor}}
```

### Subtitle (30)
```
{{The promise, compressed}}
```

### Promotional text (170) — editable without a new build
```
{{Timely line: what's new or why now}}
```

### Keywords (100) — comma-separated, no spaces after commas
```
{{term,term,term}}
```

### Description (4000)
```
{{Opening paragraph: the promise in plain words.}}

{{HEADLINE OF FRAME 2, IN CAPS}}
{{Two or three sentences of evidence.}}

{{…one block per story beat…}}

{{Pricing honesty: what's free, what Plus adds.}}
```

### What's New (4000)
```
{{Short, human release note}}
```

### In-app purchases — display name (35 subscription / 30 one-time), description (55 / 45)
```
{{Product Plus Monthly}}
{{What it includes — no price, Apple appends it}}
```

## Google Play

### App name (30)
```
{{Product – short descriptor}}
```

### Short description (80)
```
{{The promise, one sentence}}
```

### Full description (4000)
```
{{Same structure as the App Store description, adapted}}
```
````

## Field guidance

**Name (30 / 30).** The product name, optionally a short descriptor after
an en dash. The descriptor is indexed for search on both stores — use the
term people actually search for, not a tagline.

**App Store subtitle (30).** Shown under the name everywhere. Benefit, not
feature list; don't repeat words from the name (wasted index space).

**Promotional text (170).** Above the description, editable any time
without review. Use it for what's timely: a new feature, a season.

**Keywords (100, App Store only).** Comma-separated, no spaces, singular
forms, no words already in the name or subtitle, no competitor names, no
"app". Every character counts — "journal,diary" beats "journal, diary".

**Play short description (80).** Play's equivalent of subtitle +
promotional text; also indexed. One plain sentence.

**Descriptions (4000 / 4000).** Most readers see the first two or three
lines before "more" — put the promise there, not a welcome. Then one block
per story beat, mirroring the screenshot order and reusing their
headlines, then pricing honesty, then who it's for. Plain text: neither
store renders Markdown; Play allows limited HTML, the App Store none. Avoid
claims the app can't back ("#1", "best"), and on Play avoid keyword
stuffing and calls to action ("download now") — both are policy issues.

**IAP / subscription text.** Display name and a short description; never
include price or billing period — the store appends them. Keep names
discreet if the purchase appears on receipts.

## Checks before submission

- Character counts within limits (count, don't eyeball — `wc -m` or a
  one-liner).
- Headlines in the description match the screenshots' headlines.
- Platform words are right per store (biometrics, cloud, widgets).
- Same voice as the product's DESIGN-SYSTEM.md tone words.
- Localized fields reviewed by someone who reads the language.

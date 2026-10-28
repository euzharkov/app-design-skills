# Store specs

Sizes below are current as of this skill's writing (late 2026). **Stores
change them** — new devices add slots, old slots become optional. Before a
submission, check the live requirements:

- App Store Connect Help → "Screenshot specifications" and "App preview
  specifications"; the upload slot itself rejects wrong sizes.
- Play Console Help → "Add preview assets to showcase your app".

When a spec here disagrees with the console, the console wins: update the
size table at the top of `export.sh` and this file together.

## Authoring sizes and the export rule

Each frame kind has one authoring size in CSS px. `export.sh` captures it
at an integer device scale (pixel-true, no reflow), then resamples to every
store size it feeds. Resampling a finished bitmap by a percent or two is
invisible; capturing at a different window size re-wraps headlines.

| Frame | Authoring | Scale | Capture | Store outputs |
| --- | --- | --- | --- | --- |
| iPhone (`.shot`) | 440×956 | 3 | 1320×2868 | 6.9″ as captured; 6.5″ 1284×2778 |
| Play phone (`.shot.android`) | 440×782 | 3 | 1320×2346 | 1080×1920 |
| IAP square (`.subshot`) | 512×512 | 2 | 1024×1024 | as captured |
| Play feature (`.featshot`) | 512×250 | 2 | 1024×500 | as captured |
| Mac (`.macshot`) | 1440×900 | 2 | 2880×1800 | as captured; 1280×800 |

## Apple App Store

**iPhone** — portrait (landscape also accepted, rarely worth it):

| Display class | Accepted sizes (portrait) | Notes |
| --- | --- | --- |
| 6.9″ | 1320×2868, 1290×2796, 1260×2736 | The required set. Apple scales it down for smaller devices. |
| 6.5″ | 1284×2778, 1242×2688 | Only required if no 6.9″ set is provided; still useful as a fallback. |

Up to 10 screenshots per localization; the first 3 show in search results.

**iPad** (only if the app runs on iPad): 13″ — 2064×2752 or 2048×2732
portrait. iPad frames need their own authoring (≈3:4) and a tablet device
frame; don't stretch phone shots. The engine ships no tablet frame yet —
author one in the page or skip iPad.

**Mac App Store**: 16:10, one of 1280×800, 1440×900, 2560×1600,
2880×1800. 1–10 screenshots. Export the largest; downscale for others.

**In-app purchase / subscription image** ("Image" / promotional image in
the IAP's App Store promotion section): 1024×1024. Shown small (≈60pt)
beside Apple's own name, price and billing text — a brand card, not a
feature pitch. Optional for most purchases; used for promoted IAPs, win-back
offers and offer codes.

**App icon**: 1024×1024 in the Xcode asset catalog, opaque, no rounded
corners (the system masks it). Comes from the app-icon workflow, not here.

**Format**: PNG or JPEG, RGB, no transparency. `export.sh` flattens.

## Google Play

**Phone screenshots**: JPEG or 24-bit PNG (no alpha). Each side 320–3840
px, long side ≤ 2× short side. 2–8 per device type. **For promotion
eligibility** (recommendations, "Apps & games" surfaces) Play asks for at
least 4 screenshots at **16:9 or 9:16** with each side **≥ 1080 px** —
hence 1080×1920. Other aspects upload but lose eligibility.

**Tablet screenshots** (7″ and 10″): same format rules; 16:9 / 9:16, each
side ≥ 1080 px (10″: ≥ 1080 short side) for eligibility. Needs a tablet
frame — not covered by the engine yet.

**Feature graphic**: exactly **1024×500**, JPEG or 24-bit PNG, no alpha.
Shown atop the listing, behind a promo video's play button, and cropped on
some surfaces: keep the promise in the left/center safe area, no small
text, no device screenshots.

**Hi-res icon**: **512×512**, 32-bit PNG (alpha allowed), ≤ 1 MB. Full
square — Play applies its own mask and shadow. Pass `ICON=path` to
`export.sh` to resample a 1024 master.

**Format**: Play rejects alpha in screenshots and the feature graphic.

## Text limits

See `listing-text.md` — they live with the template.

# Platform specs

State of the platforms as of this skill's writing (late 2026). Icon specs
change with OS releases — **verify against the current Apple Human Interface
Guidelines (App icons), Apple's Icon Composer docs, and Android's adaptive
icon documentation** before shipping, and update the workbench if a number
moved. Numbers below are expressed on the workbench's 1024 master grid where
that helps.

## The master grid (workbench convention)

| Thing | On the 1024 grid |
| --- | --- |
| iOS / Play / web square | `0 0 1024 1024` |
| Android adaptive layer (108dp) | `viewBox -256 -256 1536 1536` |
| Android visible viewport (72dp) | the 1024 square itself |
| Android safe zone (66dp) | circle r ≈ 469 around (512, 512) |
| macOS body | 824 × 824 at (100, 100), corner r ≈ 185 |
| Hairline floor at 60 px | ≈ 26 units (1.5 px) |

## iOS / iPadOS

- **Deliverable:** one 1024 × 1024 PNG per appearance ("single size"); Xcode
  derives the rest. Square, **unmasked**, no transparency in the light
  (default) icon — App Store processing rejects alpha in the marketing icon.
- **Mask:** a continuous-corner rounded square (squircle) applied by the
  system. Never bake the mask or a drop shadow into the artwork.
- **Appearances** (iOS 18 introduced dark and tinted; iOS 26 reworked icons
  around layered "Liquid Glass" with Icon Composer):
  - *Default / light* — the full-color icon.
  - *Dark* — supply a dark variant; Apple recommends a **transparent
    background** so the system provides its dark plate. Lighten the mark if
    it relies on dark-on-light contrast.
  - *Tinted* — supply a **grayscale** variant; the system maps luminance to
    the user's tint color. Lighter = more tint. Keep the silhouette strong;
    color distinctions vanish.
  - *Clear* (iOS 26) — the system renders a frosted, translucent version
    from the icon's layers. Not separately exported from this workbench;
    preview is an approximation.
- **Icon Composer (Xcode 26+)** builds a layered `.icon` file (up to a few
  groups of layers: background + foreground elements) and renders all
  appearances, including glass specular/blur effects. The workbench's
  master maps onto it as: background = `bg` + `bgArt`, foreground layers =
  the parts of `art()`. Export the layers as SVG (the `masters/` folder) and
  rebuild them in Icon Composer when targeting the layered pipeline.
- **Sizes on device** (points): home screen ~60–64 (iPhone), 76–83.5
  (iPad), Spotlight 40, Settings 29, notifications 20. Judge at these.

## Android (adaptive, API 26+; themed, API 33+)

- **Layers:** foreground + background, each **108 × 108 dp**. The launcher
  masks to a shape inside the central **72 × 72 dp** and may move or scale
  layers (parallax, pulse) — keep the essential mark inside the **66 dp
  safe-zone circle**.
- **Masks** vary by OEM and user setting: circle, squircle, rounded square,
  teardrop, and others. Design for the circle (tightest) and check the rest.
- **Densities** (108 dp × scale): mdpi 108 px, hdpi 162, xhdpi 216, xxhdpi
  324, xxxhdpi 432. Vector drawables are an alternative to PNGs for simple
  marks.
- **Monochrome (themed icons):** a third layer, `<monochrome>`. The launcher
  uses **only its alpha** and tints it from the wallpaper palette (light
  tonal background + dark tonal mark, inverted in dark). Grays in the
  master become partial opacity.
- **Google Play:** 512 × 512 PNG, full square, no rounding or shadow baked
  in (Play applies its own mask), 32-bit, ≤ 1 MB.
- Legacy (pre-26) `ic_launcher.png` per density is only needed for very
  old `minSdk`; most projects can skip it.

## macOS

- **Classic grid (`.icns`):** the image is a 1024 canvas with a rounded-rect
  **body ~824 × 824** centred (≈ 100 margin), corner radius ≈ 185, and a
  soft drop shadow inside the canvas. The margin and shadow are part of the
  image. `.iconset` sizes: 16, 32, 128, 256, 512 at @1x and @2x.
- **macOS 26 (Tahoe)** adopted the same layered Icon Composer pipeline as
  iOS, with system-applied shape and light/dark/clear/tinted appearances;
  icons that don't conform are shown inside a system plate. For new apps
  targeting it, prefer an Icon Composer `.icon` built from the same layers;
  keep the `.icns` for older systems.
- Small sizes (16, 32) appear in Finder lists and menus — if the mark
  closes up, consider a simplified drawing for those slots.

## Web

| File | Size | Use |
| --- | --- | --- |
| `favicon.svg` | vector | `<link rel="icon" type="image/svg+xml">` — modern browsers |
| `favicon-32.png` | 32 | PNG fallback (`<link rel="icon" sizes="32x32">`); add a `.ico` only for very old clients |
| `apple-touch-icon.png` | 180 | iOS "Add to Home Screen" — opaque, square; iOS rounds it |
| `icon-192.png`, `icon-512.png` | 192, 512 | Web app manifest `purpose: "any"` |
| `icon-maskable-512.png` | 512 | Manifest `purpose: "maskable"` — full bleed; keep the mark inside the central 80 % circle (the workbench's adaptive geometry satisfies this) |

Favicons render at 16 px on light **and** dark browser chrome; check both
in `?solo=web`. An SVG favicon may include a
`@media (prefers-color-scheme: dark)` style block if the mark needs it.

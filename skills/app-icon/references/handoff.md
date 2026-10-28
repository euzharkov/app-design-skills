# Handoff: where the exported files go

`export-icons.sh` writes one folder per platform. Copy (don't symlink) into
the app; keep `out/masters/*.svg` in the repo next to the workbench as the
source of truth — PNGs are build artifacts and can always be re-rendered.

```
out/
  masters/   ios-light|dark|tinted.svg, android-*.svg, macos.svg, favicon.svg, maskable.svg
  ios/       AppIcon-1024.png, AppIcon-1024-dark.png, AppIcon-1024-tinted.png
  android/   mipmap-{mdpi…xxxhdpi}/ic_launcher_{foreground,background,monochrome}.png
             mipmap-anydpi-v26/ic_launcher.xml, ic_launcher_round.xml
             play-store-512.png
  macos/     AppIcon.iconset/, AppIcon.icns
  web/       favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192/512.png, icon-maskable-512.png
```

## iOS / iPadOS — Xcode

**Asset catalog (single size):** `Assets.xcassets/AppIcon.appiconset` → set
"iOS: Single Size", then drop `AppIcon-1024.png` in *Any Appearance*,
`AppIcon-1024-dark.png` in *Dark*, `AppIcon-1024-tinted.png` in *Tinted*.
Xcode writes `Contents.json` with `appearances` entries for luminosity
`dark` / `tinted`.

**Icon Composer (Xcode 26+):** create an `.icon` file, import the layer
SVGs (background from `android-background.svg`'s content or the `bg` color;
foreground parts from the concept's `art`), then tune glass, specular and
per-appearance fills inside Icon Composer. Point the target's App Icon
setting at the `.icon`. Re-check the result in the workbench's iOS section
mentally against what Icon Composer previews — its renders are the truth.

## Android — `res/`

Copy `android/mipmap-*` into `app/src/main/res/`. The generated
`mipmap-anydpi-v26/ic_launcher.xml` wires background, foreground and
monochrome:

```xml
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>
```

`AndroidManifest.xml`: `android:icon="@mipmap/ic_launcher"` and
`android:roundIcon="@mipmap/ic_launcher_round"`. A flat background color can
instead be a `@color/` resource. Upload `play-store-512.png` in Play Console
→ Store listing → App icon.

## Expo / React Native (`app.json` / `app.config`)

```json
{
  "expo": {
    "icon": "./assets/icon/AppIcon-1024.png",
    "ios": {
      "icon": {
        "light": "./assets/icon/AppIcon-1024.png",
        "dark": "./assets/icon/AppIcon-1024-dark.png",
        "tinted": "./assets/icon/AppIcon-1024-tinted.png"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon/android/ic_launcher_foreground.png",
        "backgroundImage": "./assets/icon/android/ic_launcher_background.png",
        "monochromeImage": "./assets/icon/android/ic_launcher_monochrome.png"
      }
    },
    "web": { "favicon": "./assets/icon/web/favicon-32.png" }
  }
}
```

Use the xxxhdpi (432 px) layers for Expo — prebuild generates the other
densities. Newer SDKs also accept an Icon Composer `.icon` path for
`ios.icon`; check the current Expo docs. Rebuild native projects
(`npx expo prebuild --clean` or a new dev build) — icons are baked at build
time, not hot-reloaded.

## Web

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
```

```json
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## macOS

Classic: add `AppIcon.icns` (or the `.iconset` images into an asset catalog
`AppIcon` with the macOS slots) and set it as the target's app icon. For
macOS 26+ layered icons, use the same Icon Composer `.icon` as iOS.

## Keeping it alive

Icon changes go workbench-first: edit the concept, re-screenshot, re-run
`export-icons.sh`, copy outputs. Never hand-edit an exported PNG — the next
export silently reverts it.

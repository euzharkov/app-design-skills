/*
 * icon.js — the app-icon workbench engine. Not product design: this file
 * renders ONE master (declared per concept in icon.html) into every context
 * the icon will live in, and emits the export masters.
 *
 * Coordinate contract (the whole skill rests on it):
 *   - Every concept is drawn on a 1024 × 1024 grid. That square IS the iOS
 *     icon, the Play icon, and the visible 72dp viewport of an Android
 *     adaptive icon.
 *   - Android layers are the same drawing seen through viewBox
 *     "-256 -256 1536 1536" — 1536 / 1024 = 108dp / 72dp — so backgrounds
 *     must bleed to −256…1280 (the engine's bg rect already does).
 *   - The Android 66dp safe zone is the circle r ≈ 469 centred on (512, 512).
 *     Keep everything essential inside it; that also keeps it clear of the
 *     iOS corner mask.
 *
 * Concept shape (one object per direction; adding a concept is one entry):
 *   {
 *     id: "leaf", name: "Leaf as page", direction: "symbol",
 *     chosen: true,                      // optional; at most one
 *     note: "Why this direction exists / what it is betting on.",
 *     palettes: {
 *       light: { bg: "#…", mark: "#…", … },   // bg = full-bleed background
 *       dark:  { bg: null, mark: "#…" },      // bg null → system dark plate
 *       mono:  { mark: "#ffffff", detail: "#8a8a8a" } // grays for tinted
 *     },
 *     art:   (p) => `<path fill="${p.mark}" … />`,  // foreground layer
 *     bgArt: (p) => `…`,                // optional background decoration
 *     artSmall: (p) => `…`,             // optional simplified art ≤ 32px
 *   }
 *
 * URL params: ?solo=<section> ?concept=<id> ?theme=dark ?masters=<id>
 * (?masters renders only the export masters as <script type="image/svg+xml">
 * blocks for export-icons.sh to extract).
 */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ svg */

  const VB_ICON = "0 0 1024 1024";
  const VB_ADAPTIVE = "-256 -256 1536 1536";
  const SAFE_R = 469; // 66dp of 108dp, in master units (66/72 × 512)
  const BLEED = `x="-256" y="-256" width="1536" height="1536"`;

  let uid = 0;
  /* Inline SVGs share one id namespace: url(#m) resolves to the FIRST #m in
     the document. Suffix every id per instance so masks never cross-talk. */
  function uniq(svg) {
    const n = ++uid;
    return svg
      .replace(/\bid="([^"]+)"/g, (_, id) => `id="${id}-u${n}"`)
      .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${id}-u${n})`)
      .replace(/href="#([^"]+)"/g, (_, id) => `href="#${id}-u${n}"`);
  }

  function svgDoc(viewBox, inner, size) {
    const wh = size ? ` width="${size}" height="${size}"` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${wh}>${inner}</svg>`;
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
  }

  /* Superellipse path centred in the 1024 viewport — iOS uses a continuous-
     corner squircle (≈ n 5), Android launchers often a softer one (≈ n 4). */
  function superellipse(n, r = 512, cx = 512, cy = 512) {
    const pts = [];
    for (let i = 0; i < 128; i++) {
      const t = (i / 128) * Math.PI * 2;
      const c = Math.cos(t), s = Math.sin(t);
      const x = cx + r * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
      const y = cy + r * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
      pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return `M${pts.join("L")}Z`;
  }

  const SHAPES = {
    ios: `<path d="${superellipse(5)}"/>`,
    square: `<rect width="1024" height="1024"/>`,
    circle: `<circle cx="512" cy="512" r="512"/>`,
    squircle: `<path d="${superellipse(4)}"/>`,
    rounded: `<rect width="1024" height="1024" rx="205"/>`,
    favicon: `<rect width="1024" height="1024" rx="225"/>`,
  };

  /* ------------------------------------------------------------- palettes */

  function palette(c, mode) {
    const L = c.palettes.light;
    if (mode === "light") return { ...L };
    if (mode === "dark") return { ...L, ...(c.palettes.dark || {}) };
    const mono = {};
    for (const k of Object.keys(L)) mono[k] = "#ffffff";
    Object.assign(mono, c.palettes.mono || {});
    mono.bg = null;
    if (mode === "mono") return mono;
    // "alpha": Android monochrome reads ONLY alpha — grays become white at
    // an opacity equal to their lightness.
    const a = {};
    for (const [k, v] of Object.entries(mono)) {
      if (!v || v === "none" || !/^#/.test(v)) { a[k] = v; continue; }
      const [r, g, b] = hexToRgb(v);
      a[k] = `rgba(255,255,255,${((r + g + b) / 765).toFixed(3)})`;
    }
    a.bg = null;
    return a;
  }

  function back(c, p) {
    if (!p.bg) return "";
    return `<rect ${BLEED} fill="${p.bg}"/>` + (c.bgArt ? c.bgArt(p) : "");
  }
  function front(c, p, small) {
    return (small && c.artSmall ? c.artSmall : c.art)(p);
  }

  /* System plates the OS draws behind transparent dark/tinted artwork.
     Approximations for preview only — never exported. */
  const PLATE_DARK = `<defs><linearGradient id="plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#313134"/><stop offset="1" stop-color="#141416"/></linearGradient></defs><rect ${BLEED} fill="url(#plate)"/>`;

  function tintFilter(color) {
    return `<filter id="tint" filterUnits="userSpaceOnUse" ${BLEED} color-interpolation-filters="sRGB">
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .333 .333 .333 0 0" result="lum"/>
      <feComposite in="lum" in2="SourceAlpha" operator="in" result="lum2"/>
      <feFlood flood-color="${color}"/>
      <feComposite in2="lum2" operator="in"/></filter>`;
  }

  /* --------------------------------------------------------------- render */

  /* The inner drawing (1024 viewport) for an appearance.
     mode: light | dark | tinted | clear | mono-ink | themed-light | themed-dark */
  function drawing(c, mode, opt = {}) {
    const small = opt.small;
    switch (mode) {
      case "dark": {
        const p = palette(c, "dark");
        return (p.bg ? back(c, p) : PLATE_DARK) + front(c, p, small);
      }
      case "tinted": {
        const tint = opt.tint || "#f2c46d";
        return `${PLATE_DARK}<defs>${tintFilter(tint)}</defs><g filter="url(#tint)">${front(c, palette(c, "mono"), small)}</g>`;
      }
      case "clear": // iOS 26 clear: frosted plate comes from the wrapper (CSS backdrop blur)
        return `<defs>${tintFilter("#ffffff")}</defs><g filter="url(#tint)" opacity=".92">${front(c, palette(c, "mono"), small)}</g>`;
      case "mono-ink": // one-color test: silhouette in ink on white
        return `<rect ${BLEED} fill="#ffffff"/><defs>${tintFilter("#1d1d1f")}</defs><g filter="url(#tint)">${front(c, palette(c, "mono"), small)}</g>`;
      case "themed-light":
        return `<rect ${BLEED} fill="#dfe5d3"/><defs>${tintFilter("#2c3a1e")}</defs><g filter="url(#tint)">${front(c, palette(c, "alpha"), small)}</g>`;
      case "themed-dark":
        return `<rect ${BLEED} fill="#2c3324"/><defs>${tintFilter("#d3dcc4")}</defs><g filter="url(#tint)">${front(c, palette(c, "alpha"), small)}</g>`;
      default: {
        const p = palette(c, "light");
        return back(c, p) + front(c, p, small);
      }
    }
  }

  /* A masked icon as an SVG string at `size` px. */
  function iconSVG(c, { mode = "light", shape = "ios", size = 60, small } = {}) {
    const clip = `<defs><clipPath id="mask">${SHAPES[shape]}</clipPath></defs>`;
    return svgDoc(VB_ICON, `${clip}<g clip-path="url(#mask)">${drawing(c, mode, { small: small ?? size <= 32 })}</g>`, size);
  }

  function icon(c, opts = {}) {
    const size = opts.size || 60;
    const cls = ["ic", opts.mode === "clear" ? "glass" : "", opts.shadow === false ? "" : "lift", opts.cls || ""].join(" ");
    const radius = opts.shape === "circle" ? "50%" : opts.shape === "square" ? "0" : "22.5%";
    return `<span class="${cls}" style="width:${size}px;height:${size}px;border-radius:${radius}">${uniq(iconSVG(c, { ...opts, size }))}</span>`;
  }

  /* macOS: body 824 at (100,100), r 185.4, soft shadow, inside the 1024 canvas. */
  function macSVG(c, size, mode = "light") {
    const inner = drawing(c, mode === "dark" ? "dark" : "light");
    return svgDoc(
      VB_ICON,
      `<defs><clipPath id="body"><rect x="100" y="100" width="824" height="824" rx="185.4"/></clipPath>
       <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="14"/><feOffset dy="12" result="b"/><feComponentTransfer><feFuncA type="linear" slope=".32"/></feComponentTransfer></filter></defs>
       <rect x="100" y="100" width="824" height="824" rx="185.4" filter="url(#sh)"/>
       <g clip-path="url(#body)"><g transform="translate(100 100) scale(.8046875)">${inner}</g></g>`,
      size
    );
  }

  /* ------------------------------------------------------------ masters */

  function masters(c) {
    const L = palette(c, "light"), D = palette(c, "dark"), M = palette(c, "mono"), A = palette(c, "alpha");
    const ios = (inner) => svgDoc(VB_ICON, inner, 1024);
    const ad = (inner) => svgDoc(VB_ADAPTIVE, inner, 1024);
    return {
      "ios-light.svg": ios(back(c, L) + front(c, L)),
      // Dark: transparent unless the concept declares its own dark plate.
      "ios-dark.svg": ios((D.bg ? back(c, D) : "") + front(c, D)),
      // Tinted: grayscale artwork, transparent; the OS colourises by luminance.
      "ios-tinted.svg": ios(front(c, M)),
      "android-background.svg": ad(back(c, L)),
      "android-foreground.svg": ad(front(c, L)),
      "android-monochrome.svg": ad(front(c, A)),
      "maskable.svg": ad(back(c, L) + front(c, L)),
      "macos.svg": macSVG(c, 1024),
      "favicon.svg": svgDoc(VB_ICON, `<defs><clipPath id="r">${SHAPES.favicon}</clipPath></defs><g clip-path="url(#r)">${back(c, L)}${front(c, L, true)}</g>`),
    };
  }

  /* ------------------------------------------------------ placeholder tiles
     Neutral stand-ins for "other apps": home-screen neighbours and the
     competitor shelf. Generic shapes only — never reproduce a real mark. */

  const GLYPHS = {
    circle: (f) => `<circle cx="512" cy="512" r="230" fill="${f}"/>`,
    ring: (f) => `<circle cx="512" cy="512" r="215" fill="none" stroke="${f}" stroke-width="80"/>`,
    bars: (f) => `<g fill="${f}"><rect x="272" y="330" width="480" height="76" rx="38"/><rect x="272" y="474" width="480" height="76" rx="38"/><rect x="272" y="618" width="320" height="76" rx="38"/></g>`,
    tri: (f) => `<path d="M512 270 L770 720 H254 Z" fill="${f}"/>`,
    square: (f) => `<rect x="322" y="322" width="380" height="380" rx="60" fill="${f}" transform="rotate(45 512 512)"/>`,
    plus: (f) => `<g fill="${f}"><rect x="462" y="262" width="100" height="500" rx="50"/><rect x="262" y="462" width="500" height="100" rx="50"/></g>`,
    wave: (f) => `<path d="M232 560 C 352 400, 432 400, 512 512 S 672 624, 792 464" fill="none" stroke="${f}" stroke-width="84" stroke-linecap="round"/>`,
    book: (f) => `<g fill="${f}"><path d="M240 300 Q 380 270 494 330 V 760 Q 380 700 240 730 Z"/><path d="M784 300 Q 644 270 530 330 V 760 Q 644 700 784 730 Z"/></g>`,
    pen: (f) => `<g fill="${f}" transform="rotate(45 512 512)"><rect x="452" y="200" width="120" height="480" rx="24"/><path d="M452 700 H572 L512 830 Z"/></g>`,
    leaf: (f) => `<ellipse cx="512" cy="512" rx="170" ry="300" fill="${f}" transform="rotate(40 512 512)"/>`,
    moon: (f) => `<path d="M600 250 A 270 270 0 1 0 780 640 A 230 230 0 1 1 600 250 Z" fill="${f}"/>`,
    bubble: (f) => `<path d="M250 300 h524 a60 60 0 0 1 60 60 v270 a60 60 0 0 1 -60 60 H470 l-130 110 v-110 h-90 a60 60 0 0 1 -60 -60 V360 a60 60 0 0 1 60 -60 Z" fill="${f}"/>`,
    check: (f) => `<path d="M300 530 L450 680 L740 360" fill="none" stroke="${f}" stroke-width="96" stroke-linecap="round" stroke-linejoin="round"/>`,
    dots: (f) => `<g fill="${f}"><circle cx="352" cy="512" r="70"/><circle cx="512" cy="512" r="70"/><circle cx="672" cy="512" r="70"/></g>`,
  };

  function tile(t) {
    const glyph = t.glyph || "circle";
    const draw = glyph.startsWith("letter:")
      ? (f) => `<text x="512" y="690" text-anchor="middle" font-family="Georgia, serif" font-weight="600" font-size="520" fill="${f}">${glyph.slice(7)}</text>`
      : GLYPHS[glyph] || GLYPHS.circle;
    return {
      id: "tile",
      name: t.name || "",
      palettes: {
        light: { bg: t.bg, fg: t.fg },
        dark: { bg: t.darkBg || t.bg, fg: t.fg },
        mono: { fg: "#ffffff" },
      },
      art: (p) => draw(p.fg),
    };
  }

  const NEIGHBOURS = [
    { name: "Weather", bg: "#d9dde3", fg: "#5b6472", glyph: "circle", darkBg: "#2a2e35" },
    { name: "Notes", bg: "#e9e2d3", fg: "#8a6f3c", glyph: "bars", darkBg: "#33302a" },
    { name: "Maps", bg: "#cfe0da", fg: "#2f5d50", glyph: "tri", darkBg: "#203029" },
    { name: "Music", bg: "#5a4b6b", fg: "#efe8f5", glyph: "wave" },
    { name: "Clock", bg: "#26292e", fg: "#d0d4da", glyph: "ring" },
    { name: "Photos", bg: "#f0d9cf", fg: "#9a4f37", glyph: "plus", darkBg: "#3a2a24" },
    { name: "Mail", bg: "#3a4a5c", fg: "#e8edf2", glyph: "square" },
    { name: "Health", bg: "#efe9f2", fg: "#7a5a8c", glyph: "dots", darkBg: "#2e2733" },
    { name: "Tasks", bg: "#e3e8c9", fg: "#5b6630", glyph: "check", darkBg: "#2c301c" },
    { name: "Chat", bg: "#2f6f8f", fg: "#e9f3f8", glyph: "bubble" },
    { name: "Books", bg: "#b5543c", fg: "#fbefe6", glyph: "book" },
  ].map(tile);

  /* ----------------------------------------------------------- contexts */

  function grid(c, appName, { mode, shape = "ios", size = 60, count = 11, at = 5, cls = "" }) {
    const items = NEIGHBOURS.slice(0, count);
    items.splice(at, 0, c);
    return `<div class="home-grid ${cls}">${items
      .map((t) => `<div class="app"><span class="ic-wrap">${icon(t, { mode, shape, size })}</span><span class="app-label">${t === c ? appName : t.name}</span></div>`)
      .join("")}</div>`;
  }

  function iosHome(c, appName, mode, wall, label) {
    return `<div class="col"><div class="tag-slot"><span class="tag">${label}</span></div>
      <div class="device-home wall-${wall}"><div class="status"><span>9:41</span><span>● ● ●</span></div>
      ${grid(c, appName, { mode, size: 60, count: 11, at: 5 })}
      <div class="dock-ios">${[6, 7, 8, 9].map((i) => icon(NEIGHBOURS[i], { mode, size: 60 })).join("")}</div></div></div>`;
  }

  function checker(inner, size) {
    return `<span class="checker" style="width:${size}px;height:${size}px">${inner}</span>`;
  }

  function adaptiveOverlay() {
    return `<rect x="-256" y="-256" width="1536" height="1536" fill="none" stroke="#e0457b" stroke-width="6"/>
      <rect x="0" y="0" width="1024" height="1024" fill="none" stroke="#2b7de9" stroke-width="6" stroke-dasharray="24 16"/>
      <circle cx="512" cy="512" r="${SAFE_R}" fill="none" stroke="#14a37f" stroke-width="7" stroke-dasharray="18 12"/>`;
  }

  /* ---------------------------------------------------------- sections */

  function secConcepts(cfg) {
    const cols = cfg.concepts
      .map((c) => {
        const live = /<text\b/.test(c.art(palette(c, "light")));
        const tag = c.chosen ? `<span class="tag accent">Chosen</span>` : `<span class="tag">${c.direction || "concept"}</span>`;
        return `<div class="col concept-col"><div class="tag-slot">${tag}</div>
          <a class="hero" href="?concept=${c.id}">${icon(c, { size: 180 })}</a>
          <div class="strip">${icon(c, { size: 60 })}${icon(c, { size: 40 })}${icon(c, { size: 29 })}${icon(c, { size: 16, shadow: false })}</div>
          <div class="strip tests">
            <figure>${icon(c, { size: 60, mode: "dark" })}<figcaption>dark</figcaption></figure>
            <figure>${icon(c, { size: 60, mode: "mono-ink" })}<figcaption>one-color</figcaption></figure>
            <figure class="squint">${icon(c, { size: 60 })}<figcaption>squint</figcaption></figure>
          </div>
          <div class="col-label"><b>${c.name}</b>${live ? `<span class="live-warn">live text — outline before export</span>` : ""}</div>
          <p class="concept-note">${c.note || ""}</p></div>`;
      })
      .join("");
    return {
      id: "concepts",
      title: "Concepts",
      intro: "Every direction side by side. Judge the 60 / 40 / 29 / 16 strip before the hero — the hero flatters everything. Squint and one-color tests sit underneath. Click a hero to focus it in every other section.",
      body: `<div class="rail">${cols}</div>`,
    };
  }

  function secTypefaces(cfg) {
    const t = cfg.typefaces;
    const tiles = t.fonts
      .map((f) => {
        const p = { ...t.palette };
        const c = {
          palettes: { light: p, mono: {} },
          art: (q) => `<text class="tf" x="512" y="512" text-anchor="middle" font-family="'${f.family}'" font-weight="${f.weight || 400}" font-size="600" fill="${q.fg}">${t.glyph}</text>`,
        };
        return `<div class="col"><div class="tag-slot"><span class="tag">${f.weight || 400}</span></div>
          ${icon(c, { size: 180, cls: "tf-icon" })}
          <div class="strip">${icon(c, { size: 60, cls: "tf-icon" })}${icon(c, { size: 29, cls: "tf-icon" })}</div>
          <div class="col-label"><b>${f.family}</b>${f.label ? `<br>${f.label}` : ""}</div></div>`;
      })
      .join("");
    return {
      id: "typefaces",
      title: "Typeface study",
      intro: `“${t.glyph}” set in each candidate and normalized to the same cap height, so you compare letterform, not size. Live webfont text — a study only. The chosen face gets outlined to paths (outline-text.py) before it enters a master.`,
      body: `<div class="rail">${tiles}</div>`,
    };
  }

  function secShelf(cfg, c) {
    const s = cfg.shelf;
    const comps = s.competitors.map(tile);
    const row = (mode, size, wall) => {
      const items = comps.slice();
      items.splice(Math.floor(items.length / 2), 0, c);
      return `<div class="shelf wall-${wall}">${items
        .map((t) => `<div class="app">${icon(t, { mode, size })}<span class="app-label">${t === c ? cfg.appName : t.name}</span></div>`)
        .join("")}</div>`;
    };
    return {
      id: "shelf",
      title: "Competitor shelf",
      intro: s.intro || "The candidate among placeholder tiles that describe the field (colors and motif families, never real marks). Can you find it in one glance? Would you tap it?",
      body: `<div class="shelf-stack">
        <div class="shelf-row"><span class="row-label">60 px · light</span>${row("light", 60, "light")}</div>
        <div class="shelf-row"><span class="row-label">60 px · dark</span>${row("dark", 60, "dark")}</div>
        <div class="shelf-row"><span class="row-label">29 px · search results</span>${row("light", 29, "light")}</div></div>`,
    };
  }

  function secSizes(cfg, c) {
    const sizes = [60, 40, 29, 16];
    const real = sizes
      .map((s) => `<figure>${icon(c, { size: s, shadow: false })}<figcaption>${s}</figcaption></figure>`)
      .join("");
    const zoomed = [16, 29, 40]
      .map((s) => {
        const idx = RASTERS.push(iconSVG(c, { size: s })) - 1;
        return `<figure><canvas class="px" data-raster="${idx}" data-size="${s}" style="width:${s * 6}px;height:${s * 6}px"></canvas><figcaption>${s} px · 6× pixels</figcaption></figure>`;
      })
      .join("");
    return {
      id: "sizes",
      title: "Small-size legibility",
      intro: "Actual pixels. The icon is seen at 60 and below thousands of times for every time it is seen large. Sizes ≤ 32 use artSmall when a concept declares one.",
      body: `<div class="sizes-row">
        <figure class="big">${icon(c, { size: 256, shadow: false })}<figcaption>1024 master · shown at 256</figcaption></figure>
        <div class="real">${real}</div>
        <div class="real dark-strip">${sizes.map((s) => icon(c, { size: s, mode: "dark", shadow: false })).join("")}</div></div>
        <div class="sizes-row zoom">${zoomed}</div>`,
    };
  }

  function secIOS(cfg, c) {
    const M = masters(c);
    const exp = `<div class="col"><div class="tag-slot"><span class="tag">exported files</span></div>
      <div class="export-trio">
        <figure>${checker(uniq(M["ios-light.svg"].replace('width="1024" height="1024"', 'width="120" height="120"')), 120)}<figcaption>light · opaque</figcaption></figure>
        <figure>${checker(uniq(M["ios-dark.svg"].replace('width="1024" height="1024"', 'width="120" height="120"')), 120)}<figcaption>dark · ${palette(c, "dark").bg ? "own plate" : "transparent"}</figcaption></figure>
        <figure>${checker(uniq(M["ios-tinted.svg"].replace('width="1024" height="1024"', 'width="120" height="120"')), 120)}<figcaption>tinted · grayscale</figcaption></figure>
      </div><div class="col-label">The system adds the mask, the dark plate, and the tint. Ship square, unmasked art.</div></div>`;
    return {
      id: "ios",
      title: "iOS / iPadOS home screen",
      intro: "The same master in each home-screen appearance. Dark, clear, and tinted are previews of what the OS does to the exported files — approximate by design; confirm in Icon Composer / on device.",
      body: `<div class="rail">
        ${iosHome(c, cfg.appName, "light", "light", "Default")}
        ${iosHome(c, cfg.appName, "dark", "dark", "Dark")}
        ${iosHome(c, cfg.appName, "clear", "photo", "Clear (approx.)")}
        ${iosHome(c, cfg.appName, "tinted", "dark", "Tinted (approx.)")}</div>
      <div class="rail">${exp}</div>`,
    };
  }

  function secAndroid(cfg, c) {
    const M = masters(c);
    const ov = (svg, size) => {
      const withOv = svg.replace("</svg>", `${adaptiveOverlay()}</svg>`).replace('width="1024" height="1024"', `width="${size}" height="${size}"`);
      return checker(uniq(withOv), size);
    };
    const comp = svgDoc(VB_ADAPTIVE, drawing(c, "light") + adaptiveOverlay(), 180);
    const masks = ["circle", "squircle", "rounded"]
      .map((sh) => `<figure>${icon(c, { size: 96, shape: sh })}<figcaption>${sh}</figcaption></figure>`)
      .join("");
    const themed = ["themed-light", "themed-dark"]
      .map((m) => `<div class="android-home wall-${m === "themed-dark" ? "dark" : "light"}">${grid(c, cfg.appName, { mode: m, shape: "circle", size: 56, count: 7, at: 2 })}</div>`)
      .join("");
    return {
      id: "android",
      title: "Android adaptive icon",
      intro: "108dp layers (pink), the 72dp visible viewport (blue dashed = the master square), and the 66dp safe zone (green circle). Launchers mask, move, and scale the layers — anything outside the green circle may be cut.",
      body: `<div class="rail">
        <div class="col"><div class="tag-slot"><span class="tag">background</span></div>${ov(M["android-background.svg"], 180)}</div>
        <div class="col"><div class="tag-slot"><span class="tag">foreground</span></div>${ov(M["android-foreground.svg"], 180)}</div>
        <div class="col"><div class="tag-slot"><span class="tag">composite + zones</span></div>${checker(uniq(comp), 180)}</div>
        <div class="col"><div class="tag-slot"><span class="tag">monochrome layer</span></div>${checker(uniq(M["android-monochrome.svg"].replace('width="1024" height="1024"', 'width="180" height="180"')), 180).replace("checker", "checker dark")}</div>
      </div>
      <div class="rail"><div class="col"><div class="tag-slot"><span class="tag">launcher masks</span></div><div class="masks">${masks}</div></div>
        <div class="col"><div class="tag-slot"><span class="tag">launcher · circle</span></div><div class="android-home wall-photo">${grid(c, cfg.appName, { mode: "light", shape: "circle", size: 56, count: 7, at: 2 })}</div></div>
        <div class="col"><div class="tag-slot"><span class="tag">themed icons (light / dark)</span></div><div class="themed-pair">${themed}</div></div></div>`,
    };
  }

  function secMac(cfg, c) {
    const dock = (mode) => {
      const items = NEIGHBOURS.slice(0, 6);
      items.splice(3, 0, c);
      return `<div class="mac-desk wall-${mode === "dark" ? "dark" : "light"}"><div class="mac-dock ${mode}">${items
        .map((t) => `<span class="mac-ic">${uniq(macSVG(t, 64, mode))}</span>`)
        .join("")}</div></div>`;
    };
    const canvas = macSVG(c, 300).replace(
      "</svg>",
      `<rect x="100" y="100" width="824" height="824" rx="185.4" fill="none" stroke="#2b7de9" stroke-width="4" stroke-dasharray="18 12"/><rect x="0.5" y="0.5" width="1023" height="1023" fill="none" stroke="#e0457b" stroke-width="4"/></svg>`
    );
    return {
      id: "macos",
      title: "macOS",
      intro: "Classic grid: an 824 rounded-rect body (r 185.4) centred in the 1024 canvas with a soft drop shadow; the margin is part of the image. Pink = canvas, blue = body.",
      body: `<div class="rail">
        <div class="col"><div class="tag-slot"><span class="tag">1024 canvas</span></div>${checker(uniq(canvas), 300)}</div>
        <div class="col"><div class="tag-slot"><span class="tag">dock · light</span></div>${dock("light")}</div>
        <div class="col"><div class="tag-slot"><span class="tag">dock · dark</span></div>${dock("dark")}</div></div>`,
    };
  }

  function secWeb(cfg, c) {
    const fav = (size) => {
      const svg = masters(c)["favicon.svg"].replace("<svg ", `<svg width="${size}" height="${size}" `);
      return `<span class="fav" style="width:${size}px;height:${size}px">${uniq(svg)}</span>`;
    };
    const tabs = (mode) => `<div class="tabbar ${mode}">
        <span class="btab">${GLYPH_FAV("#9aa3ad")}<span>Inbox</span></span>
        <span class="btab on">${fav(16)}<span>${cfg.appName}</span></span>
        <span class="btab">${GLYPH_FAV("#c4774f")}<span>Docs</span></span></div>`;
    const maskable = svgDoc(VB_ADAPTIVE, `<defs><clipPath id="mc"><circle cx="512" cy="512" r="614"/></clipPath></defs><g clip-path="url(#mc)">${drawing(c, "light")}</g>`, 128);
    return {
      id: "web",
      title: "Web: favicon, touch icon, manifest",
      intro: "favicon.svg uses artSmall when present. apple-touch-icon is the opaque light master (iOS rounds it). The maskable manifest icon reuses the adaptive geometry, previewed in a circle.",
      body: `<div class="rail">
        <div class="col"><div class="tag-slot"><span class="tag">tab bar 16px</span></div>${tabs("light")}${tabs("dark")}</div>
        <div class="col"><div class="tag-slot"><span class="tag">32 · 180 · 192</span></div><div class="web-sizes">${fav(32)}<span class="ic lift" style="width:90px;height:90px;border-radius:22.5%">${uniq(iconSVG(c, { shape: "square", size: 90 }))}</span>${fav(96)}</div></div>
        <div class="col"><div class="tag-slot"><span class="tag">maskable 512</span></div>${checker(uniq(maskable), 128)}</div></div>`,
    };
  }

  function GLYPH_FAV(color) {
    return `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="${color}"/></svg>`;
  }

  function secWalls(cfg, c) {
    const panel = (wall, mode, label) => `<div class="col"><div class="tag-slot"><span class="tag">${label}</span></div>
      <div class="device-home wall-${wall}">${grid(c, cfg.appName, { mode, size: 60, count: 7, at: 2 })}</div></div>`;
    return {
      id: "wallpapers",
      title: "On wallpapers",
      intro: "Edge contrast against the three backgrounds that break icons: pale, near-black, and busy photographic noise.",
      body: `<div class="rail">${panel("light", "light", "light")}${panel("dark", "dark", "dark")}${panel("busy", "light", "busy")}${panel("busy", "dark", "busy · dark mode")}</div>`,
    };
  }

  /* ------------------------------------------------------------- raster */

  const RASTERS = [];
  function drawRasters() {
    document.querySelectorAll("canvas[data-raster]").forEach((cv) => {
      const s = +cv.dataset.size;
      cv.width = s;
      cv.height = s;
      const img = new Image();
      img.onload = () => cv.getContext("2d").drawImage(img, 0, 0, s, s);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(RASTERS[+cv.dataset.raster]);
    });
  }

  /* Normalize typeface-study glyphs to one INK height (cap height for
     capitals) after fonts load. SVG getBBox measures the em box, not the
     ink, so measure the glyph on a canvas instead. */
  function normalizeType() {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.textAlign = "center";
    const run = () =>
      document.querySelectorAll("text.tf").forEach((t) => {
        ctx.font = `${t.getAttribute("font-weight")} 600px ${t.getAttribute("font-family")}`;
        const m = ctx.measureText(t.textContent);
        const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        if (!h) return;
        const k = 560 / h;
        // text-anchor middle: ink centre x is offset by (right − left) / 2
        const cx = (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
        const cy = (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2;
        t.setAttribute("x", "0");
        t.setAttribute("y", "0");
        t.setAttribute("font-size", "600");
        t.setAttribute("transform", `translate(512 512) scale(${k.toFixed(4)}) translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})`);
      });
    run();
    if (document.fonts) {
      document.fonts.ready.then(run);
      document.fonts.addEventListener("loadingdone", run);
    }
  }

  /* Warn when the icon palette drifts from the product's design-system.css. */
  function driftCheck(cfg) {
    if (!cfg.designSystem || !cfg.roles) return;
    fetch(cfg.designSystem)
      .then((r) => r.text())
      .then((css) => {
        const root = css.split(/\n\.|\n\}/)[0];
        const found = {};
        root.replace(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})/g, (_, k, v) => (found[k] = v.toLowerCase()));
        const bad = Object.entries(cfg.roles).filter(([k, v]) => found[k] && found[k] !== v.toLowerCase());
        const el = document.getElementById("drift");
        if (!el) return;
        el.innerHTML = bad.length
          ? `<div class="solo-banner">Palette drift vs ${cfg.designSystem}: ${bad.map(([k, v]) => `--${k} is ${found[k]} there, ${v} here`).join("; ")}</div>`
          : `<p class="drift-ok">Icon roles match <code>${cfg.designSystem}</code> (${Object.keys(cfg.roles).length} roles checked).</p>`;
      })
      .catch(() => {});
  }

  /* -------------------------------------------------------------- page */

  function renderIconWorkbench(cfg) {
    const params = new URLSearchParams(location.search);
    const solo = params.get("solo");
    const theme = params.get("theme");
    const want = params.get("concept");
    const exportId = params.get("masters");

    if (exportId) {
      const c = cfg.concepts.find((x) => x.id === exportId);
      document.body.className = "masters";
      document.body.innerHTML = c
        ? Object.entries(masters(c)).map(([f, s]) => `<script type="image/svg+xml" data-file="${f}">${s}</` + `script>`).join("\n")
        : `<p id="error">No concept “${exportId}”</p>`;
      return;
    }

    if (theme === "dark") document.body.classList.add("theme-dark");
    const current = cfg.concepts.find((c) => c.id === want) || cfg.concepts.find((c) => c.chosen) || cfg.concepts[0];

    const sections = [secConcepts(cfg)];
    if (cfg.typefaces) sections.push(secTypefaces(cfg));
    if (cfg.shelf) sections.push(secShelf(cfg, current));
    sections.push(secSizes(cfg, current), secIOS(cfg, current), secAndroid(cfg, current), secMac(cfg, current), secWeb(cfg, current), secWalls(cfg, current));

    const shown = solo ? sections.filter((s) => s.id === solo) : sections;
    const keep = (k, v) => {
      const p = new URLSearchParams(location.search);
      v == null ? p.delete(k) : p.set(k, v);
      const q = p.toString();
      return q ? `?${q}` : location.pathname;
    };

    const conceptBtns = cfg.concepts
      .map((c) => `<a class="tb-btn ${c === current ? "on" : ""}" href="${keep("concept", c.id)}" title="${c.name}">${c.id}</a>`)
      .join("");

    let html = `<div class="toolbar">
        <a class="tb-btn ${theme !== "dark" ? "on" : ""}" href="${keep("theme", null)}">Light</a>
        <a class="tb-btn ${theme === "dark" ? "on" : ""}" href="${keep("theme", "dark")}">Dark</a>
        <span class="tb-sep"></span>${conceptBtns}</div>
      <header class="page-head"><h1>${cfg.title}</h1><p>${cfg.intro || ""}</p>
        <nav class="section-index">${sections.map((s) => `<a href="${keep("solo", s.id)}">${s.title}</a>`).join("")}</nav>
        <div id="drift"></div></header>`;
    if (solo)
      html += shown.length
        ? `<div class="solo-banner">Solo view: <b>${shown[0].title}</b> · concept <b>${current.name}</b> — <a href="${keep("solo", null)}">show all sections</a></div>`
        : `<div class="solo-banner">No section with id “${solo}” — <a href="${keep("solo", null)}">show all</a></div>`;

    for (const s of shown) {
      const focus = s.id === "concepts" || s.id === "typefaces" ? "" : ` <span class="focus">· ${current.name}</span>`;
      html += `<section class="sec" id="${s.id}"><div class="sec-inner"><div class="sec-head"><h2>${s.title}${focus}</h2><a class="solo-link" href="${keep("solo", s.id)}">solo</a></div><p>${s.intro}</p></div>${s.body}</section>`;
    }

    if (!solo && cfg.pageNotes && cfg.pageNotes.length)
      html += `<div id="pagenote"><div class="pn-title">Decisions</div><div class="note">${cfg.pageNotes.map(([t, b]) => `<div class="n"><b>${t}</b>${b}</div>`).join("")}</div></div>`;

    document.body.insertAdjacentHTML("beforeend", html);
    drawRasters();
    normalizeType();
    driftCheck(cfg);
  }

  window.renderIconWorkbench = renderIconWorkbench;
  window.iconMasters = masters;
})();

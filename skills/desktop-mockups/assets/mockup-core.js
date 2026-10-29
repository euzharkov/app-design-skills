/*
 * mockup-core.js — the mockup workbench engine, shared by every mockup skill.
 *
 * Pages declare content (sections of frame columns) and call renderMockupPage().
 * Device frames live in their own files loaded after this one (phone.js,
 * window.js); the core never assumes which device is being mocked.
 * This file renders the canvas around that content — page head, section
 * index, sections, named columns, platform/variant tags, notes — and
 * auto-documents the tokens:
 *
 *   - tokens section: color roles, type roles, spacing, radii — read live
 *     from tokens.css (design-system.css in older mockups), so it can't drift
 *   - contrast audit: WCAG 2.1 ratios for declared fg/bg pairs, light & dark
 *   - toolbar: light/dark toggle and frame zoom
 *   - solo mode: ?solo=<section-id> renders one section only (fast loads,
 *     reliable screenshots on long pages)
 *
 * Deterministic URL params (useful for screenshots):
 *   ?solo=<section-id>   render a single section (?solo=tokens for the tokens)
 *   ?theme=dark          start in dark mode
 *   ?zoom=50|70|85|100   frame display size (authoring stays 1:1 with the
 *                        frame's production baseline; pages pick a default
 *                        with renderMockupPage({defaultZoom}))
 *
 * This file is workbench code, not product code. You should rarely edit it.
 */

/* ================= annotation helpers ================= */

/** A rationale note card: note("Why the bar is opaque", "Translucency ghosts…"). */
function note(title, body) {
  return `<div class="n"><b>${title}</b>${body}</div>`;
}

/* ================= color math (WCAG 2.1) ================= */

function parseColor(value) {
  if (!value) return null;
  const probe = document.createElement("i");
  probe.style.color = "rgb(1, 2, 3)";
  probe.style.color = value;
  document.body.appendChild(probe);
  const s = getComputedStyle(probe).color;
  probe.remove();
  if (s === "rgb(1, 2, 3)" && value.trim() !== "rgb(1, 2, 3)") return null;
  const m = s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
}

function compositeOver(fg, bg) {
  const a = fg[3];
  if (a >= 1) return fg.slice(0, 3);
  return [0, 1, 2].map((i) => Math.round(a * fg[i] + (1 - a) * bg[i]));
}

function luminance(rgb) {
  const lin = rgb.map((c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(fg, bg, base) {
  const bgFlat = bg[3] < 1 && base ? compositeOver(bg, base.slice(0, 3)) : bg.slice(0, 3);
  const fgFlat = compositeOver(fg, bgFlat);
  const L1 = luminance(fgFlat);
  const L2 = luminance(bgFlat);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

function toHex(rgb) {
  const h = rgb
    .slice(0, 3)
    .map((c) => Math.round(c).toString(16).padStart(2, "0"))
    .join("");
  return `#${h}${rgb[3] < 1 ? Math.round(rgb[3] * 255).toString(16).padStart(2, "0") : ""}`;
}

function cssColor(rgb) {
  return rgb[3] < 1 ? `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${rgb[3]})` : `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

/* ================= token introspection ================= */

/* tokens.css; design-system.css is the name older mockups used. */
const SYSTEM_SHEET = /(tokens|design-system)\.css/;

/** Custom property names + .t-* type role classes, in declaration order. */
function readSystemSheet() {
  const props = [];
  const typeRoles = [];
  const seen = new Set();
  for (const sheet of document.styleSheets) {
    if (!sheet.href || !SYSTEM_SHEET.test(sheet.href)) continue;
    let rules;
    try {
      rules = sheet.cssRules;
    } catch (e) {
      return null; // opened over file:// — foundations needs an http server
    }
    for (const rule of rules) {
      if (!rule.style) continue;
      if (/^\.t-[a-z0-9-]+$/.test(rule.selectorText)) typeRoles.push(rule.selectorText.slice(1));
      for (const p of rule.style) {
        if (p.startsWith("--") && !seen.has(p)) {
          seen.add(p);
          props.push(p);
        }
      }
    }
  }
  return { props, typeRoles };
}

/** Resolve custom properties inside a light or dark screen context. */
function resolveVars(names, dark) {
  const probe = document.createElement("div");
  probe.className = dark ? "screen night" : "screen";
  probe.style.cssText = "position:fixed;left:-9999px;visibility:hidden";
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const out = {};
  for (const n of names) out[n] = cs.getPropertyValue(n).trim();
  probe.remove();
  return out;
}

/* ================= foundations rendering ================= */

function groupProps(props) {
  const g = { color: [], font: [], space: [], radius: [], other: [] };
  for (const p of props) {
    if (/^--(font|weight)-/.test(p)) g.font.push(p);
    else if (/^--space-/.test(p)) g.space.push(p);
    else if (/^--radius-/.test(p)) g.radius.push(p);
    else g.other.push(p); // colors + anything else; filtered by parseability below
  }
  return g;
}

function renderFoundations(container, contrastPairs) {
  const sheet = readSystemSheet();
  if (!sheet) {
    container.innerHTML = `<p style="font-size:13px;color:#a8332a">The tokens section needs the page served over http (CSS rules are unreadable from file://). Run a static server and reload.</p>`;
    return;
  }
  const { props, typeRoles } = sheet;
  const light = resolveVars(props, false);
  const dark = resolveVars(props, true);
  const hasDark = props.some((p) => light[p] !== dark[p]);
  const groups = groupProps(props);
  let html = "";

  /* palette */
  const colorProps = groups.other.filter((p) => parseColor(light[p]));
  if (colorProps.length) {
    html += `<div class="fd-block"><h3>Color roles${hasDark ? " (top: light · bottom: dark)" : ""}</h3><div class="fd-swatches">`;
    for (const p of colorProps) {
      const lc = parseColor(light[p]);
      const dc = parseColor(dark[p]);
      const chip = hasDark
        ? `<div class="fd-chip" style="background:linear-gradient(to bottom, ${cssColor(lc)} 50%, ${cssColor(dc)} 50%)"></div>`
        : `<div class="fd-chip" style="background:${cssColor(lc)}"></div>`;
      html += `<div class="fd-swatch">${chip}<div class="meta"><b>${p}</b>${toHex(lc)}${hasDark && light[p] !== dark[p] ? ` · ${toHex(dc)}` : ""}</div></div>`;
    }
    html += `</div></div>`;
  }

  /* type ramp */
  if (typeRoles.length) {
    html += `<div class="fd-block"><h3>Type roles</h3>`;
    for (const cls of typeRoles) {
      const probe = document.createElement("div");
      probe.className = cls;
      probe.style.cssText = "position:fixed;left:-9999px;visibility:hidden";
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      const fam = cs.fontFamily.split(",")[0].replace(/["']/g, "");
      const spec = `${parseFloat(cs.fontSize)}/${parseFloat(cs.lineHeight) || "–"} · ${cs.fontWeight} · ${cs.letterSpacing === "normal" ? "0" : cs.letterSpacing} · ${fam}`;
      probe.remove();
      html += `<div class="fd-type-row"><div class="spec"><b>.${cls}</b>${spec}</div><div class="fd-type-sample"><span class="${cls}">Sphinx of black quartz, judge my vow</span></div></div>`;
    }
    html += `</div>`;
  }

  /* spacing */
  if (groups.space.length) {
    html += `<div class="fd-block"><h3>Spacing</h3>`;
    for (const p of groups.space)
      html += `<div class="fd-space-row"><span class="lbl">${p} · ${light[p]}</span><div class="bar" style="width:${parseFloat(light[p]) * 4}px"></div></div>`;
    html += `</div>`;
  }

  /* radii */
  if (groups.radius.length) {
    html += `<div class="fd-block"><h3>Radii</h3><div class="fd-radius-row">`;
    for (const p of groups.radius)
      html += `<div class="fd-radius-chip" style="border-radius:${light[p]}">${p}<br>${light[p]}</div>`;
    html += `</div></div>`;
  }

  /* contrast audit */
  if (contrastPairs && contrastPairs.length) {
    const row = (pair, vars, themeLabel) => {
      const [fgName, bgName, baseName] = pair;
      const fg = parseColor(vars[fgName]);
      const bg = parseColor(vars[bgName]);
      const base = baseName ? parseColor(vars[baseName]) : null;
      if (!fg || !bg) return `<tr><td>${fgName} on ${bgName}</td><td>${themeLabel}</td><td colspan="3">unresolved</td></tr>`;
      const r = contrastRatio(fg, bg, base);
      const bgFlat = bg[3] < 1 && base ? compositeOver(bg, base.slice(0, 3)) : bg.slice(0, 3);
      const badge =
        r >= 7
          ? `<span class="ok">AAA</span>`
          : r >= 4.5
            ? `<span class="ok">AA</span>`
            : r >= 3
              ? `<span class="large-only">AA large only</span>`
              : `<span class="fail">✕ fail</span>`;
      return `<tr><td>${fgName} on ${bgName}${baseName ? ` over ${baseName}` : ""}</td><td>${themeLabel}</td><td><span class="pair-demo" style="background:${cssColor(bgFlat.concat(1))};color:${cssColor(fg)}">Sample</span></td><td>${r.toFixed(2)}:1</td><td>${badge}</td></tr>`;
    };
    html += `<div class="fd-block"><h3>Contrast audit — WCAG 2.1</h3><div class="fd-scroll"><table class="fd-audit"><tr><th>Pair</th><th>Theme</th><th>Demo</th><th>Ratio</th><th>Verdict</th></tr>`;
    for (const pair of contrastPairs) {
      html += row(pair, light, "light");
      if (hasDark) html += row(pair, dark, "dark");
    }
    html += `</table></div><p class="fd-pair-note">WCAG 2.1: body text needs ≥ 4.5:1; "AA large only" covers text ≥ 24px (or ≥ 18.5px bold) and non-text UI. The audit reports; the values are the product's call.</p></div>`;
  }

  container.innerHTML = html;
}

/* ================= page rendering ================= */

/* Platform glyphs for tags. A tag that starts with a platform name
   (iOS, iPadOS, macOS, Android, Windows, Web) gets its glyph in front, so
   platform columns read at a glance. Simple drawn marks, currentColor. */
const APPLE_GLYPH = `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.3 8.6c0-1.6 1.3-2.4 1.4-2.5-.8-1.1-2-1.3-2.4-1.3-1-.1-2 .6-2.5.6-.5 0-1.3-.6-2.2-.6-1.1 0-2.2.7-2.8 1.7-1.2 2.1-.3 5.2.9 6.9.6.8 1.2 1.7 2.1 1.7.8 0 1.2-.5 2.2-.5s1.3.5 2.2.5c.9 0 1.5-.8 2-1.7.6-.9.9-1.8.9-1.8s-1.8-.7-1.8-3z"/><path d="M9.7 3.6c.5-.6.8-1.4.7-2.1-.7 0-1.5.5-2 1.1-.4.5-.8 1.3-.7 2 .8.1 1.5-.4 2-1z"/></svg>`;
const PLATFORM_GLYPHS = {
  ios: APPLE_GLYPH,
  ipados: APPLE_GLYPH,
  macos: APPLE_GLYPH,
  android: `<svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1.8 12.5a6.2 6.2 0 0 1 12.4 0zM5.9 9.4a.85.85 0 1 1-1.7 0 .85.85 0 0 1 1.7 0zm5.9 0a.85.85 0 1 1-1.7 0 .85.85 0 0 1 1.7 0z"/><path d="M4.5 6.3 3.2 4.1M11.5 6.3l1.3-2.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  windows: `<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1.5" y="1.5" width="6" height="6"/><rect x="8.5" y="1.5" width="6" height="6"/><rect x="1.5" y="8.5" width="6" height="6"/><rect x="8.5" y="8.5" width="6" height="6"/></svg>`,
  web: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.3"/><path d="M1.7 8h12.6M8 1.7c2 2 2 10.6 0 12.6M8 1.7c-2 2-2 10.6 0 12.6"/></svg>`,
};

function tagHTML(tag) {
  const platform = tag.split(/[\s·]/)[0].toLowerCase();
  return (PLATFORM_GLYPHS[platform] || "") + tag;
}

/** "Week, empty" → "week-empty": screen names become stable ids. */
function slug(text) {
  return text
    .replace(/<[^>]*>/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function renderMockupPage(cfg) {
  const params = new URLSearchParams(location.search);
  /* "foundations" is the tokens section's id in older mockups. */
  const solo = params.get("solo") === "foundations" ? "tokens" : params.get("solo");
  const theme = params.get("theme");
  const zoom = params.get("zoom");

  const defaultZoom = cfg.defaultZoom || 85;
  const zoomPct = parseInt(zoom, 10) || defaultZoom;

  if (theme === "dark") document.body.classList.add("theme-dark");
  document.documentElement.style.setProperty("--frame-zoom", zoomPct / 100);
  document.title = cfg.title;

  const app = document.getElementById("app") || document.body;
  const sections = [];
  if (cfg.foundations !== false)
    sections.push({ id: "tokens", title: "Tokens", desc: "Read live from the token stylesheet: color roles, type roles, spacing, radii, and a contrast audit of the declared pairs.", foundations: true });
  sections.push(...(cfg.sections || []));

  const shown = solo ? sections.filter((s) => s.id === solo) : sections;
  const soloBanner =
    solo && shown.length
      ? `<div class="solo-banner">Solo view: <b>${shown[0].title}</b> — <a href="${location.pathname}">show all sections</a></div>`
      : solo
        ? `<div class="solo-banner">No section with id “${solo}” — <a href="${location.pathname}">show all</a></div>`
        : "";

  const index = sections
    .map((s) => `<a href="?solo=${s.id}">${s.title}</a>`)
    .join("");

  let html = `
    <div class="toolbar">
      <span class="tb-btn theme-b ${theme !== "dark" ? "on" : ""}" data-theme="light">Light</span>
      <span class="tb-btn theme-b ${theme === "dark" ? "on" : ""}" data-theme="dark">Dark</span>
      <span class="tb-sep"></span>
      ${[50, 70, 85, 100].map((z) => `<span class="tb-btn zoom-b ${zoomPct === z ? "on" : ""}" data-zoom="${z}">${z}%</span>`).join("")}
    </div>
    <div class="page-head">
      <h1>${cfg.title}</h1>
      <p>${cfg.intro || ""}</p>
      <div class="section-index">${index}</div>
    </div>
    ${soloBanner}`;

  for (const sec of shown) {
    /* Section text lives in the reading column (.sec-inner); the rail sits
       outside it so the scroll area can span the full window width. */
    html += `<div class="sec" id="${sec.id}">
      <div class="sec-inner">
        <div class="sec-head"><h2>${sec.title}</h2><a class="solo-link" href="?solo=${sec.id}">solo</a></div>
        <p>${sec.desc || ""}</p>`;
    if (sec.foundations) {
      html += `<div id="fd-root"></div></div></div>`;
      continue;
    }
    html += `</div><div class="rail">`;
    for (const col of sec.cols || []) {
      /* Every column gets the tag slot, filled or empty, so frames share the
         same top line whether or not a tag is present. A named column also
         gets an id, <section-id>--<name>[--<tag>], so each screen is
         addressable and platform twins sharing a name stay distinct. */
      const screenId = col.name ? [sec.id, slug(col.name), col.tag ? slug(col.tag) : ""].filter(Boolean).join("--") : "";
      const label = (col.name ? `<b class="col-name">${col.name}</b>` : "") + (col.label || "");
      html += `<div class="col"${screenId ? ` id="${screenId}"` : ""}><div class="tag-slot">${col.tag ? `<span class="tag${col.tagAccent ? " accent" : ""}">${tagHTML(col.tag)}</span>` : ""}</div>${col.html}<div class="col-label">${label}</div></div>`;
    }
    html += `</div>`;
    if (sec.notes && sec.notes.length) html += `<div class="note insec">${sec.notes.join("")}</div>`;
    html += `</div>`;
  }

  if (!solo && cfg.pageNotes && cfg.pageNotes.length)
    html += `<div id="pagenote"><div class="pn-title">Global notes</div><div class="note">${cfg.pageNotes.join("")}</div></div>`;

  app.innerHTML = html;

  const fdRoot = document.getElementById("fd-root");
  if (fdRoot) renderFoundations(fdRoot, cfg.contrastPairs || []);

  /* toolbar behavior — theme/zoom rewrite the URL so screenshots are reproducible */
  const setParam = (k, v, dflt) => {
    const p = new URLSearchParams(location.search);
    if (v === dflt) p.delete(k);
    else p.set(k, v);
    const q = p.toString();
    location.href = location.pathname + (q ? "?" + q : "");
  };
  document.querySelectorAll(".theme-b").forEach((b) => (b.onclick = () => setParam("theme", b.dataset.theme, "light")));
  document.querySelectorAll(".zoom-b").forEach((b) => (b.onclick = () => setParam("zoom", b.dataset.zoom, String(defaultZoom))));
}

/*
 * store.js — store-listing frames for the mockup workbench.
 *
 * Load after mockup-core.js and the device frame files (phone.js, window.js).
 * A store page declares its frames as data and calls renderStorePage(cfg):
 *
 *   renderStorePage({
 *     title, intro,
 *     shots:   [{ id, eyebrow, headline, caption, device, scale, y, hero,
 *                 night, overlay, label, android: { …overrides } }],
 *     subs:    [{ id, word, tag, glyph, long }],
 *     feature: { mark, headline, art },
 *     mac:     [{ id, eyebrow, headline, caption, device, scale, y, night,
 *                 overlay, label }],
 *     pageNotes: [note(…)],
 *   })
 *
 * `device` is any rendered frame HTML — phone(…), win(…), a bare card stack —
 * or a function (platform) => HTML. Use the function form for phone shots:
 * the Play cut calls it with "android" (and sets PHONE_PLATFORM while it
 * runs), so status bar, camera cutout and back affordance swap for free.
 * `android: {…}` overrides any field for the Play cut only (a different
 * scale, a platform-specific headline, a different device).
 *
 * URL modes (deterministic, for capture):
 *   (none)                     gallery: every frame + marketing-text contrast audit
 *   ?shot=N                    iPhone frame N alone at the page origin
 *   ?shot=N&platform=android   the same frame cut to the Play 9:16 aspect
 *   ?sub=N                     IAP / subscription promo square N
 *   ?feature                   Play feature graphic
 *   ?mac=N                     Mac App Store frame N
 *   &theme=dark                any of the above with dark screens
 *   ?manifest                  plain-text list "kind index name" for export.sh
 *
 * This file is workbench code, not product code. You should rarely edit it.
 */

const STORE_SPARKLE = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.8c.5 4.9 2.6 8.1 9.2 10.2-6.6 2.1-8.7 5.3-9.2 10.2-.5-4.9-2.6-8.1-9.2-10.2C9.4 9.9 11.5 6.7 12 1.8Z"/></svg>`;

/* ================= frame builders ================= */

function storeDevice(device, platform) {
  if (typeof device !== "function") return device || "";
  const hasPlatform = typeof PHONE_PLATFORM !== "undefined";
  const prev = hasPlatform ? PHONE_PLATFORM : undefined;
  if (hasPlatform) PHONE_PLATFORM = platform;
  try {
    return device(platform);
  } finally {
    if (hasPlatform) PHONE_PLATFORM = prev;
  }
}

function storeCopy(f) {
  return `<div class="copy">
    ${f.eyebrow ? `<div class="store-eyebrow">${f.eyebrow}</div>` : ""}
    <div class="store-headline">${f.headline || ""}</div>
    ${f.caption ? `<div class="store-caption">${f.caption}</div>` : ""}
  </div>`;
}

function stageVars(f) {
  const v = [];
  if (f.scale != null) v.push(`--device-scale:${f.scale}`);
  if (f.y != null) v.push(`--device-y:${f.y}px`);
  return v.join(";");
}

/** One phone frame. platform "ios" (App Store, 440×956) or "android" (Play, 440×782). */
function storeShot(shot, platform = "ios") {
  const android = platform === "android";
  const f = android ? { ...shot, ...(shot.android || {}) } : shot;
  const cls = ["shot", "screen", android && "android", f.hero && "hero", f.night && "night"].filter(Boolean).join(" ");
  return `<div class="${cls}" data-id="${f.id || ""}">
    ${f.glow === false ? "" : `<div class="glow"></div>`}
    ${storeCopy(f)}
    <div class="stage" style="${stageVars(f)}"><div class="holder">${storeDevice(f.device, platform)}</div></div>
    ${f.overlay ? `<div class="overlay">${f.overlay}</div>` : ""}
  </div>`;
}

/** One Mac App Store frame (1440×900, 16:10). device = any rendered window HTML. */
function storeMac(shot) {
  const cls = ["macshot", "screen", shot.night && "night"].filter(Boolean).join(" ");
  return `<div class="${cls}" data-id="${shot.id || ""}">
    ${shot.glow === false ? "" : `<div class="glow"></div>`}
    ${storeCopy(shot)}
    <div class="stage" style="${stageVars(shot)}"><div class="holder">${storeDevice(shot.device, "mac")}</div></div>
    ${shot.overlay ? `<div class="overlay">${shot.overlay}</div>` : ""}
  </div>`;
}

/** IAP / subscription promo square (512×512 → 1024×1024). */
function storeSub(sub, thumb = false) {
  return `<div class="subshot screen${sub.night ? " night" : ""}${thumb ? " thumb" : ""}" data-id="${sub.id || ""}">
    <div class="glow"></div>
    <div class="subcopy">
      <div class="subglyph">${sub.glyph || STORE_SPARKLE}</div>
      <div class="subword${sub.long ? " long" : ""}">${sub.word}</div>
      ${sub.tag ? `<div class="subtag">${sub.tag}</div>` : ""}
    </div>
  </div>`;
}

/** Play feature graphic (512×250 → 1024×500). */
function storeFeature(feat) {
  return `<div class="featshot screen${feat.night ? " night" : ""}" data-id="feature-graphic">
    <div class="glow"></div>
    <div class="featcopy">
      ${feat.mark ? `<div class="featmark">${feat.mark}</div>` : ""}
      <div class="store-headline">${feat.headline}</div>
    </div>
    ${feat.art ? `<div class="featart">${feat.art}</div>` : ""}
  </div>`;
}

/* ================= export names ================= */

const pad2 = (n) => String(n).padStart(2, "0");
const storeName = (item, i, fallback) => `${pad2(i + 1)}-${item.id || fallback}`;

function storeManifest(cfg) {
  const lines = [];
  (cfg.shots || []).forEach((s, i) => lines.push(`shot ${i} ${storeName(s, i, "shot")}`));
  (cfg.subs || []).forEach((s, i) => lines.push(`sub ${i} ${s.id || "sub-" + pad2(i + 1)}`));
  if (cfg.feature) lines.push(`feature 0 feature-graphic`);
  (cfg.mac || []).forEach((s, i) => lines.push(`mac ${i} ${storeName(s, i, "mac")}`));
  return lines.join("\n");
}

/* ================= marketing-text contrast audit ================= */

/* Headlines sit on marketing backgrounds the product audit never sees, so
   they get their own pass: every frame's text against the frame's plain
   background role, in light and dark. Also reports headline line count —
   the "one line where possible" rule, made visible. */
function storeAudit(root) {
  const frames = [...root.querySelectorAll(".shot, .subshot:not(.thumb), .featshot, .macshot")];
  const TEXT = [
    [".store-headline, .subword", "headline"],
    [".store-caption", "caption"],
    [".store-eyebrow, .subtag, .featmark", "accent"],
  ];
  const measure = () =>
    frames.map((fr) => {
      const bg = parseColor(getComputedStyle(fr).backgroundColor);
      const cells = TEXT.map(([sel]) => {
        const el = fr.querySelector(sel);
        if (!el || !bg) return null;
        const cs = getComputedStyle(el);
        const fg = parseColor(cs.color);
        const size = parseFloat(cs.fontSize);
        const large = size >= 24 || (size >= 18.5 && +cs.fontWeight >= 600);
        const r = contrastRatio(fg, bg);
        const lh = parseFloat(cs.lineHeight) || size * 1.2;
        /* rects are post-zoom, computed metrics pre-zoom (gallery rails zoom) */
        const lines = Math.round(el.getBoundingClientRect().height / (lh * (el.currentCSSZoom || 1)));
        return { r, need: large ? 3 : 4.5, lines };
      });
      const copy = fr.querySelector(".copy");
      const overflow = copy ? copy.scrollHeight > copy.clientHeight + 1 : false;
      return { cells, overflow };
    });
  const dark = document.body.classList.contains("theme-dark");
  document.body.classList.toggle("theme-dark", false);
  const light = measure();
  document.body.classList.toggle("theme-dark", true);
  const darkM = measure();
  document.body.classList.toggle("theme-dark", dark);

  const cell = (c) => (c ? `<td class="${c.r < c.need ? "bad" : ""}">${c.r.toFixed(2)}:1${c.r < c.need ? " ✕" : ""}</td>` : `<td>–</td>`);
  let html = `<div class="fd-scroll"><table class="fd-audit store-audit"><tr><th>Frame</th><th>Theme</th><th>Headline</th><th>Caption</th><th>Eyebrow / tag</th><th>Headline lines</th><th>Copy band</th></tr>`;
  frames.forEach((fr, i) => {
    const name = fr.closest(".sec").querySelector("h2").textContent + " · " + (fr.dataset.id || i + 1);
    for (const [theme, m] of [["light", light[i]], ["dark", darkM[i]]]) {
      if (theme === "dark" && fr.classList.contains("night")) continue; // night frames are dark in both
      const h = m.cells[0];
      const maxLines = fr.classList.contains("hero") ? 3 : 2;
      html += `<tr><td>${name}</td><td>${fr.classList.contains("night") ? "night" : theme}</td>${cell(m.cells[0])}${cell(m.cells[1])}${cell(m.cells[2])}<td class="${h && h.lines > maxLines ? "bad" : ""}">${h ? h.lines : "–"}</td><td class="${m.overflow ? "bad" : ""}">${m.overflow ? "overflows ✕" : "fits"}</td></tr>`;
    }
  });
  html += `</table></div><p class="fd-pair-note">Text against the frame's plain background role (the wash is decoration and must stay close to it). Headlines ≥ 24px need 3:1; captions and eyebrows need 4.5:1. A headline over two lines (three on the hero) is a headline that should be shorter. Fix colors in design-system.css roles, copy in the page.</p>`;
  return html;
}

/* ================= page rendering ================= */

function renderStorePage(cfg) {
  const params = new URLSearchParams(location.search);
  const platform = params.get("platform") === "android" ? "android" : "ios";
  const shots = cfg.shots || [];
  const subs = cfg.subs || [];
  const mac = cfg.mac || [];

  /* ---- manifest: what export.sh should capture, in order ---- */
  if (params.has("manifest")) {
    document.body.innerHTML = `<pre id="manifest">${storeManifest(cfg)}</pre>`;
    return;
  }

  /* ---- export modes: one frame, page origin, nothing else rendered ----
     Only the target frame exists in the DOM: no rails, no zoom, no siblings
     for a headless browser to lay out or stall on. */
  let one = null;
  if (params.has("shot")) one = shots[+params.get("shot")] && storeShot(shots[+params.get("shot")], platform);
  else if (params.has("sub")) one = subs[+params.get("sub")] && storeSub(subs[+params.get("sub")]);
  else if (params.has("feature")) one = cfg.feature && storeFeature(cfg.feature);
  else if (params.has("mac")) one = mac[+params.get("mac")] && storeMac(mac[+params.get("mac")]);
  if (params.has("shot") || params.has("sub") || params.has("feature") || params.has("mac")) {
    document.body.classList.add("exporting");
    if (params.get("theme") === "dark") document.body.classList.add("theme-dark");
    document.title = cfg.title;
    document.body.innerHTML = one || `<p style="padding:20px;font:14px system-ui">No such frame.</p>`;
    return;
  }

  /* ---- gallery ---- */
  const col = (html, label, tag) => ({ html, label, tag });
  const tagFor = (s) => (s.hero ? "Hero" : s.night ? "Night" : "");
  const sections = [];
  if (shots.length)
    sections.push({
      id: "iphone",
      title: "App Store · iPhone",
      desc: "Authored 440×956, captured ×3 → 1320×2868 (6.9″), resampled → 1284×2778 (6.5″). Order is the story: promise → evidence → explanation.",
      cols: shots.map((s, i) => col(storeShot(s, "ios"), s.label || `<b>${i + 1}.</b> ${s.id || ""}`, tagFor(s))),
    });
  if (shots.length && cfg.android !== false)
    sections.push({
      id: "android",
      title: "Google Play · phone",
      desc: "The same frames cut to 9:16 (440×782 → ×3 → 1080×1920). Android chrome and any per-shot overrides applied.",
      cols: shots.map((s, i) => col(storeShot(s, "android"), s.label || `<b>${i + 1}.</b> ${s.id || ""}`, tagFor({ ...s, ...(s.android || {}) }))),
    });
  if (subs.length)
    sections.push({
      id: "subs",
      title: "In-app purchase images",
      desc: "512×512 → ×2 → 1024×1024. Each square is shown next to the ~64px thumbnail the store actually renders beside its own price text.",
      cols: subs.flatMap((s) => [col(storeSub(s), `<b>${s.word}</b> ${s.tag || ""}`), col(storeSub(s, true), "thumbnail")]),
    });
  if (cfg.feature)
    sections.push({
      id: "feature",
      title: "Play feature graphic",
      desc: "512×250 → ×2 → 1024×500. Play crops it and may overlay a play button; keep the promise in the left half.",
      cols: [col(storeFeature(cfg.feature), "Feature graphic")],
    });
  if (mac.length)
    sections.push({
      id: "mac",
      title: "Mac App Store",
      desc: "Authored 1440×900, captured ×2 → 2880×1800 (16:10); resampled to 1440×900 / 1280×800 if wanted.",
      cols: mac.map((s, i) => col(storeMac(s), s.label || `<b>${i + 1}.</b> ${s.id || ""}`, tagFor(s))),
    });
  sections.push({
    id: "contrast",
    title: "Marketing text contrast",
    desc: "Every frame's headline, caption and eyebrow against its background role, light and dark — measured from the rendered frames above.",
    cols: [],
  });

  renderMockupPage({
    title: cfg.title,
    intro: cfg.intro,
    foundations: false,
    defaultZoom: cfg.defaultZoom || 70,
    sections,
    pageNotes: cfg.pageNotes,
  });

  const auditSec = document.querySelector("#contrast .sec-inner");
  if (auditSec) {
    /* The audit measures rendered frames; in ?solo=contrast it renders its
       own off-screen copies so the numbers still exist. */
    let root = document.getElementById("app") || document.body;
    if (!document.querySelector(".shot, .subshot, .featshot, .macshot")) {
      root = document.createElement("div");
      root.style.cssText = "position:absolute;left:-99999px;top:0";
      root.innerHTML = [
        ...shots.map((s) => storeShot(s, "ios")),
        ...shots.map((s) => storeShot(s, "android")),
        ...subs.map((s) => storeSub(s)),
        cfg.feature ? storeFeature(cfg.feature) : "",
        ...mac.map(storeMac),
      ]
        .map((h) => `<div class="sec"><h2>frame</h2>${h}</div>`)
        .join("");
      document.body.appendChild(root);
    }
    const run = () => {
      auditSec.querySelector(".store-audit-wrap")?.remove();
      const wrap = document.createElement("div");
      wrap.className = "fd-block store-audit-wrap";
      wrap.innerHTML = storeAudit(root);
      auditSec.appendChild(wrap);
    };
    run();
    /* Webfonts change line counts; measure again once they land. */
    if (document.fonts) document.fonts.ready.then(run);
  }
}

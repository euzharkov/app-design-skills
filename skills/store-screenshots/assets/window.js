/*
 * window.js — desktop frames for the mockup workbench (the phone frame's
 * desktop sibling).
 *
 * Load after mockup-core.js. Provides:
 *
 *   win(inner, opts)          standard window: title bar, optional unified
 *                             toolbar, optional sidebar split, status bar
 *   panel(inner, opts)        menu-bar popover (macOS) / tray flyout (Windows)
 *   sheet(inner, opts)        sheet (macOS) / content dialog (Windows),
 *                             attached to a parent window via opts.over
 *   alert(spec, opts)         alert / confirm, standalone or over a window
 *   settingsWin(inner, opts)  settings window with pane tabs
 *   menubar(names, opts)      macOS menu bar with one menu open
 *   menu(items, opts)         a menu surface (app, context, popup menus)
 *   tooltip(text, opts)       a tooltip, with its keyboard shortcut
 *   pointer(x, y, kind)       a mouse cursor, to mock hover states
 *   keys("mod+shift+N")       a shortcut in the platform's own notation
 *   sideNav(items, active)    sidebar / navigation-pane rows
 *   ctl.*                     native controls (button, toggle, check, radio,
 *                             popup, field, search, segmented, tool)
 *
 * Authoring is 1:1 with production points at the window's declared size:
 * win(…, {size: [1080, 700]}) is a 1080×700 pt window, title bar included.
 * Display size is the workbench zoom (?zoom=, cfg.defaultZoom), never the
 * authored numbers.
 *
 * Every frame wraps product content in .screen (the core's contract), so
 * the dark palette, `night`, and token probes work exactly as in
 * phone.js. OS chrome (traffic lights, caption buttons, menu bar, tray) is
 * dependency-free inline SVG. Native controls (ctl.*) stand in for the OS's
 * own controls — production uses the real ones, so these mirror the OS,
 * not a private component API.
 *
 * This file is workbench code, not product code. You should rarely edit it.
 */

/* Page-wide default platform. Set WINDOW_PLATFORM = "windows" once in a page
   script (before building screens) instead of passing it to every frame. */
var WINDOW_PLATFORM = typeof WINDOW_PLATFORM === "undefined" ? "macos" : WINDOW_PLATFORM;

/* ================= OS glyphs (inline SVG, no icon library) ================= */

const WG = {
  min: `<svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10" stroke="currentColor" stroke-width="1"/></svg>`,
  max: `<svg width="10" height="10" viewBox="0 0 10 10"><rect x=".5" y=".5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1"/></svg>`,
  close: `<svg width="10" height="10" viewBox="0 0 10 10"><path d="M.5.5l9 9M9.5.5l-9 9" stroke="currentColor" stroke-width="1"/></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5 13 13"/></svg>`,
  chevDown: `<svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5 5 6.5l3-3"/></svg>`,
  chevRight: `<svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 2 6.5 5l-3 3"/></svg>`,
  chevUp: `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5 5 3.5l3 3"/></svg>`,
  updown: `<svg width="8" height="12" viewBox="0 0 8 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 4.5 4 2l2.5 2.5M1.5 7.5 4 10l2.5-2.5"/></svg>`,
  check: `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M1.8 5.3 4 7.5l4.2-5"/></svg>`,
  wifi: `<svg width="16" height="12" viewBox="0 0 16 12"><path d="M2 4.5a8.5 8.5 0 0 1 12 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M4.6 7.2a5 5 0 0 1 6.8 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="10" r="1.4" fill="currentColor"/></svg>`,
  battery: `<svg width="24" height="12" viewBox="0 0 24 12"><rect x=".5" y=".5" width="20" height="11" rx="3" fill="none" stroke="currentColor" opacity=".5"/><rect x="2" y="2" width="14" height="8" rx="1.6" fill="currentColor"/><rect x="22" y="4" width="1.6" height="4" rx=".8" fill="currentColor" opacity=".5"/></svg>`,
  toggles: `<svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="1" width="14" height="5" rx="2.5"/><rect x="1" y="8" width="14" height="5" rx="2.5"/><circle cx="12.5" cy="3.5" r="1.3" fill="currentColor"/><circle cx="3.5" cy="10.5" r="1.3" fill="currentColor"/></svg>`,
  speaker: `<svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5h2.5L8 2v10L4.5 9H2z"/><path d="M10.5 4.5a3.5 3.5 0 0 1 0 5M12.5 2.5a6.3 6.3 0 0 1 0 9"/></svg>`,
  cursorArrow: `<svg width="18" height="24" viewBox="0 0 18 24"><path d="M1.5 1.5v18l4.6-4.4 3 7 3.2-1.4-3-6.8h6.4z" fill="#000" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  cursorHand: `<svg width="20" height="22" viewBox="0 0 20 22"><path d="M7 1.8c-.9 0-1.6.7-1.6 1.6v8.8L3.9 10.7c-.7-.7-1.8-.7-2.4 0-.6.6-.6 1.5-.1 2.2l4.4 5.9c1.2 1.6 3 2.4 5 2.4h1.6c3 0 5.4-2.4 5.4-5.4v-5c0-.9-.7-1.6-1.6-1.6s-1.5.7-1.5 1.6v-.8c0-.9-.7-1.6-1.6-1.6s-1.6.7-1.6 1.6V9c0-.9-.7-1.6-1.6-1.6S8.6 8.1 8.6 9V3.4c0-.9-.7-1.6-1.6-1.6z" fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
  cursorText: `<svg width="10" height="20" viewBox="0 0 10 20"><path d="M1.5 1.5c2 0 3.5.6 3.5 2v13c0 1.4-1.5 2-3.5 2M8.5 1.5c-2 0-3.5.6-3.5 2v13c0 1.4 1.5 2 3.5 2M3 10h4" fill="none" stroke="#000" stroke-width="1.4"/></svg>`,
};

/* A neutral app-icon placeholder (rounded tile in the decorative accent).
   Pass the product's real icon HTML wherever a frame takes `icon`. */
const APP_ICON_PLACEHOLDER = `<span class="w-appicon"></span>`;

/* ================= shortcuts ================= */

/**
 * keys("mod+shift+N") → "⇧⌘N" on macOS, "Ctrl+Shift+N" on Windows.
 * Write shortcuts once, platform-neutral; `mod` is ⌘ on macOS and Ctrl on
 * Windows. Modifier order follows each platform (macOS: ⌃⌥⇧⌘).
 */
function keys(spec, platform = WINDOW_PLATFORM) {
  const mac = platform !== "windows";
  const parts = spec.split("+").map((s) => s.trim());
  const key = parts.pop();
  const mods = parts.map((m) => m.toLowerCase());
  const has = (m) => mods.includes(m);
  const named = {
    enter: ["↩", "Enter"], return: ["↩", "Enter"], esc: ["⎋", "Esc"], delete: ["⌫", "Backspace"],
    backspace: ["⌫", "Backspace"], del: ["⌦", "Del"], tab: ["⇥", "Tab"], space: ["Space", "Space"],
    up: ["↑", "Up"], down: ["↓", "Down"], left: ["←", "Left"], right: ["→", "Right"],
  };
  const k = named[key.toLowerCase()] ? named[key.toLowerCase()][mac ? 0 : 1] : key.length === 1 ? key.toUpperCase() : key;
  if (mac) {
    let s = "";
    if (has("ctrl")) s += "⌃";
    if (has("alt") || has("opt") || has("option")) s += "⌥";
    if (has("shift")) s += "⇧";
    if (has("mod") || has("cmd")) s += "⌘";
    return s + k;
  }
  const out = [];
  if (has("mod") || has("ctrl")) out.push("Ctrl");
  if (has("alt") || has("opt") || has("option")) out.push("Alt");
  if (has("shift")) out.push("Shift");
  if (has("cmd")) out.push("Win");
  out.push(k);
  return out.join("+");
}

/* ================= title-bar chrome ================= */

/** Traffic lights. mode: "all" | "no-zoom" (settings, fixed-size windows) |
    "close" (only close enabled) | "none". Inactive windows draw them gray. */
function lights(mode = "all", inactive = false) {
  if (mode === "none") return "";
  const on = { all: [1, 1, 1], "no-zoom": [1, 1, 0], close: [1, 0, 0] }[mode] || [1, 1, 1];
  const cls = ["tl-close", "tl-min", "tl-zoom"];
  return `<div class="w-lights${inactive ? " inactive" : ""}">${cls.map((c, i) => `<span class="${on[i] ? c : "tl-off"}"></span>`).join("")}</div>`;
}

/** Windows caption buttons (minimize, maximize, close), 46×32 each. */
function captionButtons(mode = "all") {
  if (mode === "none") return "";
  const b = (g, c = "") => `<span class="w-cap${c}">${g}</span>`;
  if (mode === "close") return `<div class="w-caps">${b(WG.close, " cap-close")}</div>`;
  return `<div class="w-caps">${b(WG.min)}${mode === "no-zoom" ? b(WG.max, " cap-off") : b(WG.max)}${b(WG.close, " cap-close")}</div>`;
}

/* ================= sidebar rows ================= */

/**
 * Sidebar / navigation-pane rows with platform metrics (macOS source list:
 * 28 pt rows, rounded selection; Windows NavigationView: 36 pt rows, accent
 * pill indicator).
 * items: [{key, icon, label, badge}] or {header: "Section"} for a group title.
 */
function sideNav(items, active) {
  return `<div class="w-nav">${items
    .map((it) =>
      it.header !== undefined
        ? `<div class="w-nav-h">${it.header}</div>`
        : `<div class="w-nav-i${it.key === active ? " on" : ""}">${it.icon ? `<span class="w-nav-ic">${it.icon}</span>` : ""}<span class="w-nav-l">${it.label}</span>${it.badge !== undefined ? `<span class="w-nav-b">${it.badge}</span>` : ""}</div>`,
    )
    .join("")}</div>`;
}

/* ================= native controls ================= */

/* Native controls take their platform from the frame they sit in (CSS keys
   off .p-macos / .p-windows on the frame), so they need no platform arg.
   Accent and surfaces derive from token roles: --accent-interactive
   for "on", --btn-label for its label, --card / ink tints for the rest. */
const ctl = {
  /** kind: "default" (accent, the Return-key action) | "normal" | "danger"
      (destructive label) | "plain" (borderless). state: "hover" | "pressed" |
      "disabled" | "focus". */
  button(label, { kind = "normal", state = "", icon = "", wide = false } = {}) {
    return `<span class="wc-btn k-${kind}${state ? " s-" + state : ""}${wide ? " wide" : ""}">${icon}${label ? `<span>${label}</span>` : ""}</span>`;
  },
  toggle(on = false, { state = "" } = {}) {
    return `<span class="wc-toggle${on ? " on" : ""}${state ? " s-" + state : ""}"><i></i></span>`;
  },
  check(on = false, label = "", { state = "" } = {}) {
    return `<span class="wc-check${on ? " on" : ""}${state ? " s-" + state : ""}"><i>${on ? WG.check : ""}</i>${label ? `<span>${label}</span>` : ""}</span>`;
  },
  radio(on = false, label = "") {
    return `<span class="wc-radio${on ? " on" : ""}"><i></i>${label ? `<span>${label}</span>` : ""}</span>`;
  },
  /** Pop-up button (macOS) / ComboBox (Windows). */
  popup(value, { width = 0, state = "" } = {}) {
    return `<span class="wc-popup${state ? " s-" + state : ""}"${width ? ` style="width:${width}px"` : ""}><span>${value}</span><b class="wc-pop-g">${WINDOW_PLATFORM === "windows" ? WG.chevDown : WG.updown}</b></span>`;
  },
  field(value = "", { placeholder = "", width = 0, focused = false, secure = false } = {}) {
    const shown = secure && value ? "•".repeat(value.length) : value;
    return `<span class="wc-field${focused ? " s-focus" : ""}"${width ? ` style="width:${width}px"` : ""}>${shown ? `<span>${shown}</span>` : `<span class="wc-ph">${placeholder}</span>`}${focused ? `<i class="caret"></i>` : ""}</span>`;
  },
  search(placeholder = "Search", { value = "", width = 0, focused = false } = {}) {
    return `<span class="wc-search${focused ? " s-focus" : ""}"${width ? ` style="width:${width}px"` : ""}><b>${WG.search}</b>${value ? `<span>${value}</span>` : `<span class="wc-ph">${placeholder}</span>`}${focused ? `<i class="caret"></i>` : ""}</span>`;
  },
  segmented(items, active) {
    return `<span class="wc-seg">${items.map((it) => `<span class="${it === active ? "on" : ""}">${it}</span>`).join("")}</span>`;
  },
  /** Toolbar item: icon-only or icon + label. */
  tool(icon, { label = "", on = false, state = "" } = {}) {
    return `<span class="wc-tool${on ? " on" : ""}${label ? " lab" : ""}${state ? " s-" + state : ""}">${icon}${label ? `<span>${label}</span>` : ""}</span>`;
  },
};

/** Arrange dialog buttons by platform convention.
    buttons: [{label, kind: "default"|"cancel"|"danger"|"normal"}] in
    logical order. macOS: right-aligned, the default (Return) button last.
    Windows: primary first, Cancel (Close) last, equal widths. */
function dialogButtons(buttons, platform = WINDOW_PLATFORM) {
  const btn = (b) => ctl.button(b.label, { kind: b.kind === "cancel" ? "normal" : b.kind || "normal", state: b.state || "" });
  if (platform === "windows") {
    const order = [...buttons.filter((b) => b.kind !== "cancel"), ...buttons.filter((b) => b.kind === "cancel")];
    return `<div class="w-actions win">${order.map(btn).join("")}</div>`;
  }
  const rank = (b) => (b.kind === "default" ? 3 : b.kind === "cancel" ? 2 : b.kind === "danger" && !buttons.some((x) => x.kind === "default") ? 3 : 1);
  const order = [...buttons].sort((a, b) => rank(a) - rank(b));
  return `<div class="w-actions mac">${order.map(btn).join("")}</div>`;
}

/* ================= the standard window ================= */

/**
 * win(innerHTML, {
 *   platform:  "macos" | "windows" (default WINDOW_PLATFORM)
 *   title:     window title ("" hides it)
 *   subtitle:  macOS unified-toolbar subtitle under the title
 *   size:      [w, h] in pt, title bar included; h null = height follows content
 *   minSize:   [w, h] — printed above the frame for handoff
 *   sidebar:   sidebar / navigation-pane HTML (e.g. sideNav(...)), or ""
 *   sidebarWidth: pt (default 220 macOS, 280 Windows)
 *   inset:     macOS floating "inset" sidebar (current macOS style)
 *   toolbar:   toolbar HTML (macOS: unified with the title bar; Windows: a
 *              command bar row under the title bar)
 *   menus:     Windows only — in-window menu bar, e.g. ["File","Edit","View"]
 *   status:    bottom status/footer bar HTML
 *   icon:      Windows title-bar app icon HTML (default placeholder tile)
 *   controls:  "all" | "no-zoom" | "close" | "none" — lights / caption buttons
 *   inactive:  draw as a background (unfocused) window
 *   scroll:    content region scrolls (default true)
 *   pad:       pad the content region with --screen-inset (default true)
 *   night:     force the dark palette on this window in both themes
 *   overlay:   HTML layered over the window (sheets, dialogs, menus, cursor)
 *   scrim:     "sheet" | "dialog" | "" — dims content under the overlay
 *   overlayAt: "top" | "center" — overlay anchor (default top on macOS
 *              sheets, center otherwise)
 *   meta:      true prints size (and minSize) above the frame
 * })
 */
function win(inner, o = {}) {
  const p = o.platform || WINDOW_PLATFORM;
  const mac = p !== "windows";
  const [w, h] = o.size || [960, 640];
  const sw = o.sidebarWidth || (mac ? 220 : 280);
  const controls = o.controls || "all";
  const style = `width:${w}px;${h ? `height:${h}px;` : ""}--win-sidebar-w:${sw}px;`;
  const scroll = o.scroll !== false;
  const pad = o.pad !== false;
  const body = `<div class="w-body${scroll ? " scrolly" : ""}${pad ? " pad" : ""}">${inner}</div>`;
  const status = o.status ? `<div class="w-status">${o.status}</div>` : "";
  const overlay = o.overlay
    ? `<div class="w-overlay${o.scrim ? " scrim-" + o.scrim : ""} at-${o.overlayAt || (mac && o.scrim === "sheet" ? "top" : "center")}">${o.overlay}</div>`
    : "";
  const meta =
    o.meta || o.minSize
      ? `<div class="w-meta">${w} × ${h || "auto"} pt${o.minSize ? ` · min ${o.minSize[0]} × ${o.minSize[1]}` : ""}${o.sidebar ? ` · sidebar ${sw}` : ""}</div>`
      : "";
  const cls = `screen wscreen${o.night ? " night" : ""}`;
  const frame = `dframe win p-${mac ? "macos" : "windows"}${o.inactive ? " inactive" : ""}${h ? "" : " autoh"}`;
  const title = o.title || "";

  if (mac) {
    const unified = !!o.toolbar;
    const titleHTML = title
      ? `<div class="w-title${unified ? " lead" : ""}">${title}${o.subtitle ? `<small>${o.subtitle}</small>` : ""}</div>`
      : "";
    const tb = `<div class="w-titlebar${unified ? " unified" : ""}">${o.sidebar ? "" : lights(controls, o.inactive)}${titleHTML}${unified ? `<div class="w-toolbar">${o.toolbar}</div>` : ""}</div>`;
    const side = o.sidebar
      ? `<aside class="w-side${o.inset ? " inset" : ""}"><div class="w-side-top${unified ? " unified" : ""}">${lights(controls, o.inactive)}</div><div class="w-side-body">${o.sidebar}</div></aside>`
      : "";
    return `${meta}<div class="${frame}" style="${style}"><div class="${cls}">${side}<div class="w-main">${tb}${body}${status}</div>${overlay}</div></div>`;
  }

  /* Windows 11: title bar on top (icon + title left, caption buttons
     right), optional menus and command bar, then the navigation pane on the
     Mica base with content on a raised layer (rounded top-left corner). */
  const tb = `<div class="w-titlebar"><span class="w-ticon">${o.icon || APP_ICON_PLACEHOLDER}</span><div class="w-title">${title}</div><div class="w-tb-mid">${o.titlebarCenter || ""}</div>${captionButtons(controls)}</div>`;
  const menus = o.menus ? `<div class="w-menus">${o.menus.map((m) => `<span>${m}</span>`).join("")}</div>` : "";
  const toolbar = o.toolbar ? `<div class="w-toolbar">${o.toolbar}</div>` : "";
  const split = o.sidebar
    ? `<div class="w-split"><aside class="w-side">${o.sidebar}</aside><div class="w-layer">${body}${status}</div></div>`
    : `<div class="w-split solo"><div class="w-layer">${body}${status}</div></div>`;
  return `${meta}<div class="${frame}" style="${style}"><div class="${cls}">${tb}${menus}${toolbar}${split}${overlay}</div></div>`;
}

/* ================= menu-bar popover / tray flyout ================= */

/**
 * panel(innerHTML, {
 *   platform: "macos" | "windows"
 *   width:    panel width in pt (default 340)
 *   height:   panel height in pt; omit = as tall as its content
 *   glyph:    the product's status-item / tray icon HTML
 *   context:  draw the menu bar (macOS) or taskbar (Windows) around the
 *             panel (default true); false = the panel alone
 *   arrow:    macOS NSPopover-style arrow (default false: menu-bar-extra
 *             windows have none)
 *   night:    force dark on this panel in both themes
 *   pad:      pad the panel content (default true)
 * })
 */
function panel(inner, o = {}) {
  const p = o.platform || WINDOW_PLATFORM;
  const mac = p !== "windows";
  const w = o.width || 340;
  const glyph = o.glyph || `<span class="w-glyph-ph"></span>`;
  const ctx = o.context !== false;
  const surface = `<div class="screen w-panel${o.night ? " night" : ""}${o.pad !== false ? " pad" : ""}${o.arrow && mac ? " arrow" : ""}" style="width:${w}px;${o.height ? `height:${o.height}px;` : ""}">${inner}</div>`;
  const stageW = w + (mac ? 120 : 96);
  const night = o.night ? " night" : "";
  if (!ctx) return `<div class="dframe dstage bare p-${mac ? "macos" : "windows"}${night}">${surface}</div>`;
  if (mac)
    return `<div class="dframe dstage p-macos${night}" style="width:${stageW}px"><div class="d-menubar"><span class="mb-gap"></span><span class="mb-item on">${glyph}</span><span class="mb-item">${WG.wifi}</span><span class="mb-item">${WG.battery}</span><span class="mb-item">${WG.toggles}</span><span class="mb-item mb-clock">Wed Oct 28&nbsp;&nbsp;9:41</span></div><div class="d-anchor">${surface}</div></div>`;
  return `<div class="dframe dstage p-windows${night}" style="width:${stageW}px"><div class="d-anchor">${surface}</div><div class="d-taskbar"><span class="mb-gap"></span><span class="tb-item">${WG.chevUp}</span><span class="tb-item on">${glyph}</span><span class="tb-item tb-sys">${WG.wifi}${WG.speaker}${WG.battery}</span><span class="tb-item tb-clock"><span>9:41 AM</span><span>10/28/2026</span></span></div></div>`;
}

/* ================= sheets, dialogs, alerts ================= */

/**
 * sheet(innerHTML, {
 *   platform, width (default 440), actions: [{label, kind}] (see
 *   dialogButtons), title (Windows dialog title / macOS optional heading),
 *   over: {inner, ...win options} — the parent window; omit for the sheet
 *         alone on the desktop stage
 * })
 * macOS: a sheet attached to its window, hanging under the toolbar, window
 * content dimmed slightly. Windows: a ContentDialog centered over a smoke
 * layer, buttons in a footer band.
 */
function sheet(inner, o = {}) {
  const p = o.platform || (o.over && o.over.platform) || WINDOW_PLATFORM;
  const mac = p !== "windows";
  const w = o.width || (mac ? 440 : 480);
  const head = o.title ? `<div class="w-dlg-title">${o.title}</div>` : "";
  const acts = o.actions ? dialogButtons(o.actions, p) : "";
  const box = mac
    ? `<div class="w-sheet" style="width:${w}px">${head}${inner}${acts}</div>`
    : `<div class="w-dialog" style="width:${w}px"><div class="w-dlg-body">${head}${inner}</div>${acts}</div>`;
  return attachOver(box, o.over, p, mac ? "sheet" : "dialog");
}

/**
 * alert({icon, title, body, buttons: [{label, kind}], suppress}, {platform, over})
 * macOS: compact centered alert (app icon, bold title, small body, buttons
 * side by side when two, stacked when three). Over a window it is window-
 * modal (drawn as a sheet). Windows: a ContentDialog.
 */
function alert(spec, o = {}) {
  const p = o.platform || (o.over && o.over.platform) || WINDOW_PLATFORM;
  const mac = p !== "windows";
  const buttons = spec.buttons || [{ label: "OK", kind: "default" }];
  const suppress = spec.suppress ? `<div class="w-alert-sup">${ctl.check(false, spec.suppress)}</div>` : "";
  if (!mac) {
    return sheet(`<div class="w-dlg-text">${spec.body || ""}</div>${suppress}`, { platform: p, title: spec.title, actions: buttons, width: o.width || 440, over: o.over });
  }
  const stacked = buttons.length > 2;
  const btns = (stacked ? buttons : dialogButtonsOrder(buttons)).map((b) => ctl.button(b.label, { kind: b.kind === "cancel" ? "normal" : b.kind || "normal", wide: true })).join("");
  const box = `<div class="w-alert">
    <div class="w-alert-icon">${spec.icon || APP_ICON_PLACEHOLDER}</div>
    <div class="w-alert-title">${spec.title}</div>
    ${spec.body ? `<div class="w-alert-body">${spec.body}</div>` : ""}
    ${suppress}
    <div class="w-alert-btns${stacked ? " stacked" : ""}">${btns}</div>
  </div>`;
  return attachOver(box, o.over, p, o.over ? "sheet" : "dialog", "center");
}

/* Two-button macOS alerts read Cancel left, default right. */
function dialogButtonsOrder(buttons) {
  return [...buttons].sort((a, b) => (a.kind === "cancel" ? 0 : 1) - (b.kind === "cancel" ? 0 : 1));
}

function attachOver(box, over, platform, scrim, at) {
  if (!over) return `<div class="dframe dstage bare p-${platform !== "windows" ? "macos" : "windows"}"><div class="screen w-float">${box}</div></div>`;
  const { inner = "", ...wo } = over;
  return win(inner, { ...wo, platform, overlay: box, scrim, overlayAt: at || wo.overlayAt });
}

/* ================= settings window ================= */

/**
 * settingsWin(innerHTML, {
 *   platform, tabs: [{key, icon, label}], active, title (app name, used on
 *   Windows), size: [w, h] (h null = content height), night
 * })
 * macOS: title = the selected pane's name, icon-over-label pane tabs in the
 * toolbar, zoom disabled. Windows: a navigation pane listing the panes.
 */
function settingsWin(inner, o = {}) {
  const p = o.platform || WINDOW_PLATFORM;
  const mac = p !== "windows";
  const tabs = o.tabs || [];
  const cur = tabs.find((t) => t.key === o.active) || tabs[0] || { label: "Settings" };
  if (mac) {
    const strip = `<div class="w-ptabs">${tabs.map((t) => `<span class="w-ptab${t.key === cur.key ? " on" : ""}">${t.icon || ""}<span>${t.label}</span></span>`).join("")}</div>`;
    return win(strip + `<div class="w-pbody">${inner}</div>`, { ...o, platform: p, title: cur.label, controls: o.controls || "no-zoom", toolbar: "", sidebar: "", pad: false, size: o.size || [640, null] });
  }
  return win(`<div class="w-pagehead">${cur.label}</div>${inner}`, {
    ...o,
    platform: p,
    title: o.title || "Settings",
    sidebar: sideNav(tabs, cur.key),
    sidebarWidth: o.sidebarWidth || 240,
    controls: o.controls || "all",
    size: o.size || [860, 600],
  });
}

/* ================= menus, tooltips, cursor ================= */

/**
 * menu(items, {platform, width})
 * items: "-" for a separator, {header} for a section title, or
 * {label, keys: "mod+N", checked, disabled, danger, sub, hi, icon}
 * (hi = the highlighted row under the pointer). Shortcuts render in the
 * platform's notation via keys().
 */
function menu(items, o = {}) {
  const p = o.platform || WINDOW_PLATFORM;
  const rows = items
    .map((it) => {
      if (it === "-") return `<div class="w-menu-sep"></div>`;
      if (it.header !== undefined) return `<div class="w-menu-h">${it.header}</div>`;
      const c = `w-menu-i${it.hi ? " hi" : ""}${it.disabled ? " off" : ""}${it.danger ? " danger" : ""}`;
      return `<div class="${c}"><span class="w-menu-ck">${it.checked ? WG.check : ""}</span>${it.icon ? `<span class="w-menu-ic">${it.icon}</span>` : ""}<span class="w-menu-l">${it.label}</span>${it.keys ? `<span class="w-menu-k">${keys(it.keys, p)}</span>` : ""}${it.sub ? `<span class="w-menu-k">${WG.chevRight}</span>` : ""}</div>`;
    })
    .join("");
  return `<div class="screen w-menu${o.night ? " night" : ""} p-${p !== "windows" ? "macos" : "windows"}" style="${o.width ? `width:${o.width}px;` : ""}${o.style || ""}">${rows}</div>`;
}

/** tooltip("New note", {keys: "mod+N", platform}) */
function tooltip(text, o = {}) {
  const p = o.platform || WINDOW_PLATFORM;
  return `<div class="screen w-tip${o.night ? " night" : ""} p-${p !== "windows" ? "macos" : "windows"}" style="${o.style || ""}">${text}${o.keys ? `<span class="w-tip-k">${keys(o.keys, p)}</span>` : ""}</div>`;
}

/** A mouse cursor at (x, y) inside the nearest frame — for hover states.
    kind: "arrow" | "hand" | "text". Place it in a window's overlay or
    directly in panel content (frames are position: relative). */
function pointer(x, y, kind = "arrow") {
  const g = { arrow: WG.cursorArrow, hand: WG.cursorHand, text: WG.cursorText }[kind];
  return `<span class="w-cursor" style="left:${x}px;top:${y}px">${g}</span>`;
}

/**
 * macOS menu bar with one menu open, for showing app menus and their
 * shortcuts: menubar(["Fieldnote","File","Edit","View"], {open: "File",
 * items: [...menu items], width: 760}). The first name is the app menu
 * (bold). Windows apps put menus in the window: win({menus}).
 */
function menubar(names, o = {}) {
  const w = o.width || 720;
  const h = o.height || 340;
  const idx = names.indexOf(o.open);
  const drop = idx >= 0 && o.items ? menu(o.items, { platform: "macos", width: o.menuWidth || 260, night: o.night }) : "";
  const labels = names
    .map((n, i) => `<span class="mb-menu${i === 0 ? " app" : ""}${i === idx ? " on" : ""}">${n}${i === idx ? `<div class="mb-drop">${drop}</div>` : ""}</span>`)
    .join("");
  return `<div class="dframe dstage p-macos menus${o.night ? " night" : ""}" style="width:${w}px;height:${h}px"><div class="d-menubar left">${labels}<span class="mb-gap"></span><span class="mb-item">${WG.wifi}</span><span class="mb-item">${WG.battery}</span><span class="mb-item mb-clock">Wed Oct 28&nbsp;&nbsp;9:41</span></div></div>`;
}

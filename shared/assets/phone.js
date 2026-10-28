/*
 * phone.js — the phone frame for the mockup workbench.
 *
 * Load after mockup-core.js. Provides phone(), tabbar() and the status bar.
 * The baseline is 390×844: mockup px = production pt, 1:1. Android products
 * use the same frame with platform: "android" (status bar and nav handle
 * change; the 1:1 rule maps px to dp instead of pt).
 *
 * This file is workbench code, not product code. You should rarely edit it.
 */

/* ================= screen-building helpers ================= */

/* OS chrome (status bar, back chevron) uses inline SVG so the workbench has
   no icon-library dependency — the ICON LIBRARY IS THE PROJECT'S CHOICE,
   made during discovery and loaded by each page's <head>. */
const SB_SIGNAL = `<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>`;
const SB_WIFI = `<svg width="16" height="12" viewBox="0 0 16 12"><path d="M2 4.5a8.5 8.5 0 0 1 12 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4.6 7.2a5 5 0 0 1 6.8 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="8" cy="10" r="1.6" fill="currentColor"/></svg>`;
const SB_BATTERY = `<svg width="22" height="11" viewBox="0 0 22 11"><rect x="0.5" y="0.5" width="18" height="10" rx="2.5" fill="none" stroke="currentColor" opacity="0.5"/><rect x="2" y="2" width="15" height="7" rx="1.5" fill="currentColor"/><rect x="20" y="3.5" width="2" height="4" rx="1" fill="currentColor" opacity="0.5"/></svg>`;
const BACK_CHEVRON = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 3.5 6 9l5.5 5.5"/></svg>`;

const BACK_ARROW = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 9H3.5M8.5 4 3.5 9l5 5"/></svg>`;

/* Page-wide default platform. Set PHONE_PLATFORM = "android" once in a page
   script (before building screens) instead of passing it to every phone(). */
var PHONE_PLATFORM = typeof PHONE_PLATFORM === "undefined" ? "ios" : PHONE_PLATFORM;

/** Status bar (dependency-free inline SVG). iOS: centered island, time left.
    Android: punch-hole camera, compact time left. */
function statusBar(platform = PHONE_PLATFORM) {
  if (platform === "android")
    return `<div class="statusbar android"><span>9:30</span><div class="sb-right">${SB_WIFI}${SB_SIGNAL}${SB_BATTERY}</div></div>`;
  return `<div class="statusbar"><span>9:41</span><div class="sb-right">${SB_SIGNAL}${SB_WIFI}${SB_BATTERY}</div></div>`;
}

/**
 * Generic tab bar.
 * items: [{key, icon, iconActive, label}] where icon/iconActive are rendered
 * HTML strings from whatever icon library (or emoji) the project chose —
 * define a page-local shorthand for your library. iconActive falls back to
 * icon when omitted.
 * Render once per page into a constant and pass it to phone({tab}).
 */
function tabbar(items, activeKey) {
  const t = items
    .map((it) => {
      const on = it.key === activeKey;
      return `<div class="ti ${on ? "on" : ""}">${on ? it.iconActive || it.icon : it.icon}<span>${it.label}</span></div>`;
    })
    .join("");
  return `<div class="tabbar">${t}</div>`;
}

/**
 * Phone shell at the 390×844 baseline (mockup px = production pt/dp, 1:1).
 *
 * phone(innerHTML, {
 *   platform: "ios" | "android" (default PHONE_PLATFORM) — status bar,
 *           camera cutout, back affordance, and the system nav handle
 *   tab:    rendered tabbar string, or null
 *   scroll: content region scrolls (default true)
 *   back:   show a back affordance (default false)
 *   footer: pinned footer HTML below the scroll region (e.g. a primary CTA)
 *   night:  force dark palette on this screen in both themes
 *   bare:   no status bar / body wrapper — for full-bleed art or OS scenes
 * })
 */
function phone(inner, { platform = PHONE_PLATFORM, tab = null, scroll = true, back = false, footer = "", night = false, bare = false } = {}) {
  const android = platform === "android";
  const cls = `screen${night ? " night" : ""}`;
  const frame = `phone${android ? " android" : ""}`;
  const cutout = `<div class="${android ? "punch" : "notch"}"></div>`;
  const navHandle = `<div class="home-indicator"></div>`;
  if (bare) return `<div class="${frame}"><div class="${cls}">${cutout}${inner}${navHandle}</div></div>`;
  return `<div class="${frame}"><div class="${cls}">${cutout}${statusBar(platform)}
    <div class="body ${scroll ? "scrolly" : ""}${tab && !footer ? " floatpad" : ""}">${back ? `<div class="navback">${android ? BACK_ARROW : BACK_CHEVRON}</div>` : ""}${inner}</div>
    ${footer ? `<div class="footer${tab ? " floatpad" : ""}">${footer}</div>` : ""}
    ${tab || ""}
    ${navHandle}
  </div></div>`;
}


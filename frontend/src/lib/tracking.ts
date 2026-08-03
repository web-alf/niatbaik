// Ads tracking helpers for the public donation site. Ported from lib/tracking.jsx.
// Pixels (fbq/ttq/gtag/dataLayer) are real runtime globals on window — typed in
// types/globals.d.ts — injected on demand here.
import type { Campaign, Settings } from '@/types/api';
import { readAttribution, writeAttribution } from './attribution-store.mjs';
import { parseTrackers } from './tracking-config.mjs';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'];
// Ad click-IDs captured from the landing URL alongside utm_*. These are what let Meta /
// TikTok attribute a server-side (CAPI/Events API) conversion back to the paid click.
const CLICK_KEYS = ['fbclid', 'ttclid', 'gclid', 'gbraid', 'wbraid'];

// readCookie returns a browser cookie value (or ''). Used for the Meta _fbc/_fbp and
// TikTok _ttp cookies the pixels set — these are the correctly-formatted click/browser
// ids the Conversions/Events APIs expect.
function readCookie(name: string): string {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  } catch { return ''; }
}

// _loadedIds tracks every pixel/container id initialized this page load so GLOBAL
// pixels (initPixels) and a campaign's OWN pixels COEXIST — add the campaign id
// alongside the global one rather than skipping because window.fbq already exists,
// while never double-loading the SAME id.
const _loadedIds = new Set<string>();

// Global Google Ads conversions (id + label) captured from public settings in initPixels.
// An ARRAY so a domain can carry MULTIPLE Ads accounts — fireConversion's success fallback
// fires every one. Without this Google Ads never receives a conversion for a Default
// campaign that carries no per-campaign gads config → "tag belum terverifikasi" forever.
let _globalGads: { id: string; label: string }[] = [];

// awId normalizes a Google Ads conversion id to the "AW-<digits>" form gtag requires.
// Admins routinely paste just the numeric id (e.g. "334842554"); gtag('config','334842554')
// silently no-ops, so the tag never fires.
function awId(raw: unknown): string {
  const v = String(raw || '').trim();
  if (!v) return '';
  return /^AW-/i.test(v) ? v : 'AW-' + v;
}

// fireGads sends ONE Google Ads conversion via gtag. Needs both the AW id and the
// conversion-action label (send_to: AW-<id>/<label>) — a bare id can't fire a conversion.
function fireGads(id: unknown, label: unknown, val: number, eventId?: string): boolean {
  const aw = awId(id);
  const lbl = String(label || '').trim();
  if (!window.gtag || !aw || !lbl) return false;
  window.gtag('event', 'conversion', {
    send_to: aw + '/' + lbl,
    value: val,
    currency: 'IDR',
    ...(eventId ? { transaction_id: eventId } : {}),
  });
  return true;
}

// Seed with the STATIC GTM container injected by index.html (<head>) so neither
// initPixels nor initCampaignPixels re-injects it (double gtm.js → duplicate tags).
try {
  if (typeof window !== 'undefined' && window.__NB_STATIC_GTM) _loadedIds.add('gtm:' + window.__NB_STATIC_GTM);
} catch { /* ignore */ }

// loadGtm adds one GTM container, deduped. Multiple containers coexist.
function loadGtm(id: string) {
  if (!id || _loadedIds.has('gtm:' + id)) return;
  _loadedIds.add('gtm:' + id);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  // id is validated against ^GTM-[A-Z0-9]+$ before reaching here, but encode anyway
  // so nothing user-derived can alter the script URL.
  injectScript('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id));
}

// loadMeta adds one Meta pixel. fbq('init') fans out subsequent track() to all
// pixels, so bootstrap the base once then init each additional id.
function loadMeta(id: string) {
  if (!id || _loadedIds.has('fb:' + id)) return;
  _loadedIds.add('fb:' + id);
  if (!window.fbq) injectFbq(id);
  else { window.fbq('init', id); window.fbq('track', 'PageView'); }
}

// loadTiktok adds one TikTok pixel (ttq.load registers a per-id instance).
function loadTiktok(id: string) {
  if (!id || _loadedIds.has('tt:' + id)) return;
  _loadedIds.add('tt:' + id);
  if (!window.ttq) injectTtq(id);
  else { try { window.ttq.load(id); window.ttq.page(); } catch { /* ignore */ } }
}

// loadGtagTarget adds one gtag config target (GA4 or Google Ads AW-). gtag supports
// many config targets; each additional id is just another gtag('config', id).
function loadGtagTarget(id: string) {
  if (!id || _loadedIds.has('aw:' + id)) return;
  _loadedIds.add('aw:' + id);
  if (!window.gtag) injectGtag(id);
  else window.gtag('config', id);
}

// initPixels injects the GLOBAL pixel base scripts once, driven by the unified
// tracking_config array (falling back to the legacy discrete fields). Supports
// MULTIPLE ids of the same type.
export function initPixels(s: Settings | null | undefined) {
  if (!s) return;
  const groups = parseTrackers((s as any).tracking_config, s as any);
  groups.gtm.forEach(loadGtm);
  groups.meta.forEach(loadMeta);
  groups.ga4.forEach(loadGtagTarget);
  groups.googleAds.forEach((g) => loadGtagTarget(g.id));
  groups.tiktok.forEach(loadTiktok);
  _globalGads = groups.googleAds.slice();
}

// initCampaignPixels injects the campaign's OWN tracking scripts ADDITIVELY.
export function initCampaignPixels(c: Campaign | null | undefined) {
  if (!c) return;
  try {
    if (c.meta_pixel_id && !_loadedIds.has('fb:' + c.meta_pixel_id)) {
      _loadedIds.add('fb:' + c.meta_pixel_id);
      if (!window.fbq) injectFbq(c.meta_pixel_id as string);
      else { window.fbq('init', c.meta_pixel_id); window.fbq('track', 'PageView'); }
    }
    if (c.tiktok_pixel_id && !_loadedIds.has('tt:' + c.tiktok_pixel_id)) {
      _loadedIds.add('tt:' + c.tiktok_pixel_id);
      if (!window.ttq) injectTtq(c.tiktok_pixel_id as string);
      else { try { window.ttq.load(c.tiktok_pixel_id as string); window.ttq.page(); } catch { /* ignore */ } }
    }
    if (c.gtm_id && !_loadedIds.has('gtm:' + c.gtm_id)) {
      _loadedIds.add('gtm:' + c.gtm_id);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      injectScript('https://www.googletagmanager.com/gtm.js?id=' + c.gtm_id);
    }
    const cfg = parseConversion(c.conversion_config);
    const adsId = cfg.gads && cfg.gads.enabled && awId(cfg.gads.conversion_id);
    if (adsId && !_loadedIds.has('aw:' + adsId)) {
      _loadedIds.add('aw:' + adsId);
      if (!window.gtag) injectGtag(adsId);
      else window.gtag('config', adsId);
    }
  } catch { /* pixel init must never break the page */ }
}

// parseConversion safely parses campaign.conversion_config into {meta,tiktok,gads}.
function parseConversion(raw: unknown): any {
  try {
    if (raw && typeof raw === 'object') return raw;
    if (typeof raw === 'string' && raw.trim()) return JSON.parse(raw) || {};
  } catch { /* fall through */ }
  return {};
}

// fireConversion fires the per-campaign conversion event for a funnel phase
// (phase ∈ {'submit','success'}) to every configured platform. Never throws.
export function fireConversion(c: Campaign | null | undefined, phase: 'submit' | 'success', value: number, eventId?: string): { googleAdsAttempted: boolean } {
  try {
    const cfg = parseConversion(c && c.conversion_config);
    const val = Number(value) || 0;
    const payload = { value: val, currency: 'IDR', content_name: (c && c.title) || '' };
    // Dedup id (invoice number) for the 'success'/Purchase event so the browser pixel and
    // the server CAPI/Events API event collapse into ONE conversion instead of two.
    const fbOpts = eventId ? { eventID: eventId } : undefined;
    const ttOpts = eventId ? { event_id: eventId } : undefined;

    pushDL(phase === 'success' ? 'donation_success' : 'donation_submit', {
      ...payload, campaign_slug: (c && (c.slug || c.id)) || '',
    });

    // Resolve the event name per platform. A per-campaign Fire Event config wins; ABSENT
    // that config we fall back to the STANDARD funnel event for the phase so EVERY campaign
    // — including a plain Default one — reports the step. The funnel (matching the admin
    // panel's Default map) is: PageView → Lead (form opened, fired in the campaign page) →
    // InitiateCheckout (invoice created = this 'submit' phase) → Purchase (paid). So the
    // 'submit' default is InitiateCheckout on BOTH platforms — NOT Lead (Lead already fired
    // on form-open; firing it again here would put the funnel out of order). success keeps
    // NO default so the single Purchase/CompletePayment fallback below owns settlement.
    const metaEvt = (cfg.meta && cfg.meta.enabled && cfg.meta.events && cfg.meta.events[phase])
      || (phase === 'submit' ? 'InitiateCheckout' : '');
    if (window.fbq && metaEvt) fbOpts ? window.fbq('track', metaEvt, payload, fbOpts) : window.fbq('track', metaEvt, payload);

    const ttEvt = (cfg.tiktok && cfg.tiktok.enabled && cfg.tiktok.events && cfg.tiktok.events[phase])
      || (phase === 'submit' ? 'InitiateCheckout' : '');
    if (window.ttq && ttEvt) ttOpts ? window.ttq.track(ttEvt, payload, ttOpts) : window.ttq.track(ttEvt, payload);

    // Google Ads conversion. A per-campaign gads config wins (its own id/label per phase);
    // absent that, a Default campaign falls back to the GLOBAL id+label on the SUCCESS
    // phase so Google Ads still gets a conversion (otherwise its tag never verifies). No
    // submit-phase global fallback — Google Ads has no standard "initiate checkout"
    // conversion action, so firing one there would just report noise.
    const gads = cfg.gads;
    const label = gads && gads.enabled && gads.labels && gads.labels[phase];
    let gadsFired = false;
    if (gads && gads.enabled && gads.conversion_id && label) {
      gadsFired = fireGads(gads.conversion_id, label, val, eventId);
    } else if (phase === 'success') {
      // Fire EVERY globally-configured Ads conversion (a domain may run multiple Ads
      // accounts). gadsFired is true if at least one fired — the server-side ack still
      // means "client already reported", so it stands down for all.
      for (const g of _globalGads) {
        if (fireGads(g.id, g.label, val, eventId)) gadsFired = true;
      }
    }

    // Fallback (success only): a Default campaign with no per-campaign config still
    // reports a conversion to whatever global pixels loaded. No submit fallback —
    // InitiateCheckout/AddPaymentInfo already fire, so it would double-count.
    if (phase === 'success' && !metaEvt && !ttEvt && !gadsFired) {
      track('Purchase', payload, eventId);
    }
    return { googleAdsAttempted: gadsFired };
  } catch { /* conversion fire must never break the donation UX */ }
  return { googleAdsAttempted: false };
}

// captureUTM reads utm_* from the URL once on landing → durable storage, so the
// donation POST (possibly on a different route) still carries attribution.
export function captureUTM() {
  try {
    const params = new URLSearchParams(window.location.search);
    // Merge into any already-captured values so a later in-app navigation without the
    // query string doesn't wipe the landing attribution. readStored() reads the raw
    // persisted record (no live-cookie enrichment) so we round-trip only the URL params.
    const found: Record<string, string> = readStored();
    let any = Object.keys(found).length > 0;
    [...UTM_KEYS, ...CLICK_KEYS].forEach((k) => {
      const v = params.get(k);
      if (v) { found[k] = v; any = true; }
    });
    if (any) writeAttribution(found);
  } catch { /* storage unavailable — attribution silently absent */ }
}

// readStored returns the persisted utm_*/click-id record (durable, TTL-checked),
// without the live pixel-cookie enrichment getUTM adds. Used by captureUTM's merge.
function readStored(): Record<string, string> {
  return readAttribution();
}

// trackVisit records a public page view server-side (POST /api/track/visit) so the
// analytics "visits" figure reflects REAL traffic, not a proxy off paid invoices. Uses
// sendBeacon (non-blocking, survives navigation) with a fetch keepalive fallback. Fired
// once per page load from the public layout. campaignSlug optional (landing has none).
let _visitSent = false;
export function trackVisit(campaignSlug?: string) {
  if (_visitSent) return;
  _visitSent = true;
  try {
    const utm = getUTM();
    const body = JSON.stringify({ campaign_slug: campaignSlug || '', utm_source: utm.utm_source || '' });
    const url = '/api/track/visit';
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch { /* visit tracking must never break the page */ }
}

// getUTM returns the captured utm_* + click-id params (or {}). Merged into the donation
// body. Also reads the live Meta/TikTok pixel cookies (_fbc/_fbp/_ttp) at call time so the
// server-side CAPI/Events API can forward correctly-formatted click/browser ids — these
// cookies are set by the pixels after they load, so they may not exist at landing.
export function getUTM(): Record<string, string> {
  const stored: Record<string, string> = readStored();
  const fbc = readCookie('_fbc');
  const fbp = readCookie('_fbp');
  const ttp = readCookie('_ttp');
  // fbclid stored → build fbc fallback handled server-side; prefer the real _fbc cookie.
  if (fbc) stored.fbclid = fbc;           // _fbc is already fb.1.<ts>.<fbclid>
  if (fbp) stored.fbp = fbp;
  if (ttp) stored.ttp = ttp;
  // GA4 client id: the _ga cookie is "GA1.1.<clientId>" where clientId is "<rand>.<ts>".
  // Strip the "GAx.y." version/scope prefix to get the exact client_id the server-side
  // Measurement Protocol purchase must send for GA4 session/Ads attribution stitching.
  const ga = readCookie('_ga');
  if (ga) { const cid = ga.replace(/^GA\d+\.\d+\./, ''); if (cid && cid !== ga) stored.ga_client_id = cid; }
  return stored;
}

// pushDL pushes a semantic event onto dataLayer so GTM can read it via a Custom
// Event trigger (the SPA flow has no native form submit for GTM's built-in triggers).
function pushDL(event: string, payload: Record<string, unknown> = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    // `event` LAST so a stray payload.event can't clobber the trigger name.
    window.dataLayer.push({ ...payload, event });
  } catch { /* dataLayer unavailable — non-fatal */ }
}

// track fires a client-side event to every configured pixel AND the GTM dataLayer.
// When eventId is given (the invoice number for Purchase), it's passed as Meta's eventID
// and TikTok's event_id so the browser event DEDUPS against the server-side CAPI/Events
// API event that carries the same id — otherwise the same conversion is counted twice.
export function track(name: string, payload: Record<string, unknown> = {}, eventId?: string) {
  try {
    if (window.fbq) eventId ? window.fbq('track', name, payload, { eventID: eventId }) : window.fbq('track', name, payload);
    if (window.gtag) window.gtag('event', name, payload);
    if (window.ttq) eventId ? window.ttq.track(name, payload, { event_id: eventId }) : window.ttq.track(name, payload);
  } catch { /* pixel fire must never break the UX */ }
  pushDL(name, payload);
}

// --- private injectors ---

function injectScript(src: string) {
  const el = document.createElement('script');
  el.async = true;
  el.src = src;
  document.head.appendChild(el);
}

function injectFbq(pixelId: string) {
  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ?
      n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq!('init', pixelId);
  window.fbq!('track', 'PageView');
}

function injectGtag(measurementId: string) {
  injectScript('https://www.googletagmanager.com/gtag/js?id=' + measurementId);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer!.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

function injectTtq(pixelId: string) {
  /* eslint-disable */
  (function (w: any, d: any, t: any) {
    w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
    ttq.setAndDefer = function (t: any, e: any) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t: any) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
    ttq.load = function (e: any, n?: any) { var i = "https://analytics.tiktok.com/i18n/pixel/events.js"; ttq._i = ttq._i || {}, ttq._i[e] = [], ttq._i[e]._u = i, ttq.t = ttq.t || {}, ttq.t[e] = +new Date, ttq.t[e]; var o = d.createElement("script"); o.type = "text/javascript", o.async = !0, o.src = i + "?sdkid=" + e + "&lib=" + t; var a = d.getElementsByTagName("script")[0]; a.parentNode.insertBefore(o, a); };
    ttq.load(pixelId); ttq.page();
  })(window, document, 'ttq');
  /* eslint-enable */
}

export const NBTracking = { initPixels, initCampaignPixels, fireConversion, captureUTM, getUTM, track, trackVisit };

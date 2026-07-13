// Ads tracking helpers for the public donation site. Ported from lib/tracking.jsx.
// Pixels (fbq/ttq/gtag/dataLayer) are real runtime globals on window — typed in
// types/globals.d.ts — injected on demand here.
import type { Campaign, Settings } from '@/types/api';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'];
// Ad click-IDs captured from the landing URL alongside utm_*. These are what let Meta /
// TikTok attribute a server-side (CAPI/Events API) conversion back to the paid click.
const CLICK_KEYS = ['fbclid', 'ttclid', 'gclid'];
const STORE_KEY = 'nb_utm';

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

// Seed with the STATIC GTM container injected by index.html (<head>) so neither
// initPixels nor initCampaignPixels re-injects it (double gtm.js → duplicate tags).
try {
  if (typeof window !== 'undefined' && window.__NB_STATIC_GTM) _loadedIds.add('gtm:' + window.__NB_STATIC_GTM);
} catch { /* ignore */ }

// initPixels injects the GLOBAL pixel base scripts once. s is the public settings.
export function initPixels(s: Settings | null | undefined) {
  if (!s) return;
  if (s.gtm_id && !_loadedIds.has('gtm:' + s.gtm_id)) {
    _loadedIds.add('gtm:' + s.gtm_id);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    injectScript('https://www.googletagmanager.com/gtm.js?id=' + s.gtm_id);
  }
  if (s.meta_pixel_id && !window.fbq) {
    injectFbq(s.meta_pixel_id);
    _loadedIds.add('fb:' + s.meta_pixel_id);
  }
  if (s.ga4_measurement_id && !window.gtag && !s.gtm_id) {
    injectGtag(s.ga4_measurement_id as string);
    _loadedIds.add('aw:' + s.ga4_measurement_id);
  }
  if (s.google_ads_conversion_id && window.gtag) {
    window.gtag('config', s.google_ads_conversion_id);
    _loadedIds.add('aw:' + s.google_ads_conversion_id);
  }
  if (s.tiktok_pixel_id && !window.ttq) {
    injectTtq(s.tiktok_pixel_id as string);
    _loadedIds.add('tt:' + s.tiktok_pixel_id);
  }
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
    const adsId = cfg.gads && cfg.gads.enabled && cfg.gads.conversion_id;
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
export function fireConversion(c: Campaign | null | undefined, phase: 'submit' | 'success', value: number, eventId?: string) {
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

    const metaEvt = cfg.meta && cfg.meta.enabled && cfg.meta.events && cfg.meta.events[phase];
    if (window.fbq && metaEvt) fbOpts ? window.fbq('track', metaEvt, payload, fbOpts) : window.fbq('track', metaEvt, payload);

    const ttEvt = cfg.tiktok && cfg.tiktok.enabled && cfg.tiktok.events && cfg.tiktok.events[phase];
    if (window.ttq && ttEvt) ttOpts ? window.ttq.track(ttEvt, payload, ttOpts) : window.ttq.track(ttEvt, payload);

    const gads = cfg.gads;
    const label = gads && gads.enabled && gads.labels && gads.labels[phase];
    if (window.gtag && gads && gads.conversion_id && label) {
      window.gtag('event', 'conversion', {
        send_to: gads.conversion_id + '/' + label,
        value: val,
        currency: 'IDR',
      });
    }

    // Fallback (success only): a Default campaign with no per-campaign config still
    // reports a conversion to whatever global pixels loaded. No submit fallback —
    // InitiateCheckout/AddPaymentInfo already fire, so it would double-count.
    if (phase === 'success' && !metaEvt && !ttEvt && !(gads && gads.enabled)) {
      track('Purchase', payload, eventId);
    }
  } catch { /* conversion fire must never break the donation UX */ }
}

// captureUTM reads utm_* from the URL once on landing → sessionStorage, so the
// donation POST (possibly on a different route) still carries attribution.
export function captureUTM() {
  try {
    const params = new URLSearchParams(window.location.search);
    // Merge into any already-captured values so a later in-app navigation without the
    // query string doesn't wipe the landing attribution.
    const found: Record<string, string> = getUTM();
    let any = Object.keys(found).length > 0;
    [...UTM_KEYS, ...CLICK_KEYS].forEach((k) => {
      const v = params.get(k);
      if (v) { found[k] = v; any = true; }
    });
    if (any) sessionStorage.setItem(STORE_KEY, JSON.stringify(found));
  } catch { /* sessionStorage unavailable — attribution silently absent */ }
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
  let stored: Record<string, string> = {};
  try { stored = JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}'); } catch { /* ignore */ }
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

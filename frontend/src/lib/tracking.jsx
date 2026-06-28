// Ads tracking helpers for the public donation site.
// Exposed on window.NBTracking (this file is concatenated + IIFE-wrapped by build.mjs,
// so cross-file access is via globals — no ESM imports).
//
// - initPixels: injects Meta/GA4/GAds/TikTok/GTM scripts from /settings/public.
// - captureUTM / getUTM: grab utm_* from the URL into sessionStorage so they survive
//   navigation from the campaign page to the invoice/confirmation page.
// - track: fires a client-side funnel event to every configured pixel.

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'];
const STORE_KEY = 'nb_utm';

// initPixels injects the GLOBAL pixel base scripts once. s is the public settings object.
// Each loaded id is recorded in _loadedIds so that a campaign reusing the SAME id (via
// initCampaignPixels) won't re-init it and double-fire — while a campaign with a DIFFERENT
// id still loads additively. (Global + per-campaign coexistence.)
function initPixels(s) {
  if (!s) return;
  // GTM loads other tags (incl. GA4/GAds) if configured in its container. Dedup by id
  // (not by window.dataLayer) because the static <head> GTM already created dataLayer —
  // a DIFFERENT global container from settings should still load alongside it.
  if (s.gtm_id && !_loadedIds.has('gtm:' + s.gtm_id)) {
    _loadedIds.add('gtm:' + s.gtm_id);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    injectScript('https://www.googletagmanager.com/gtm.js?id=' + s.gtm_id);
  }
  // Meta Pixel
  if (s.meta_pixel_id && !window.fbq) {
    injectFbq(s.meta_pixel_id);
    _loadedIds.add('fb:' + s.meta_pixel_id);
  }
  // GA4 standalone (only when GTM isn't handling it)
  if (s.ga4_measurement_id && !window.gtag && !s.gtm_id) {
    injectGtag(s.ga4_measurement_id);
    _loadedIds.add('aw:' + s.ga4_measurement_id);
  }
  // Google Ads conversion (standalone gtag only)
  if (s.google_ads_conversion_id && window.gtag) {
    window.gtag('config', s.google_ads_conversion_id);
    _loadedIds.add('aw:' + s.google_ads_conversion_id);
  }
  // TikTok Pixel
  if (s.tiktok_pixel_id && !window.ttq) {
    injectTtq(s.tiktok_pixel_id);
    _loadedIds.add('tt:' + s.tiktok_pixel_id);
  }
}

// _loadedIds tracks every pixel/container id we've already initialized this page load, so
// the GLOBAL pixels (from initPixels) and a campaign's OWN pixels COEXIST: we add the
// campaign's id alongside the global one instead of skipping it because window.fbq already
// exists, while still never double-loading the SAME id (e.g. on re-render or when the
// campaign id equals the global one). Meta/TikTok/Google all support multiple pixels.
const _loadedIds = new Set();

// Seed with the STATIC GTM container injected by index.html (<head>), so neither the global
// initPixels nor a per-campaign initCampaignPixels re-injects the same container (double
// gtm.js load → duplicate tags). window.__NB_STATIC_GTM is set by the static snippet.
try {
  if (typeof window !== 'undefined' && window.__NB_STATIC_GTM) _loadedIds.add('gtm:' + window.__NB_STATIC_GTM);
} catch { /* ignore */ }

// initCampaignPixels injects the campaign's OWN tracking scripts ADDITIVELY on top of the
// global pixels. A campaign can carry its own Meta Pixel, TikTok Pixel, GTM container, and
// Google Ads conversion id (Berdu-style "Fire Event"). `c` is the campaign detail object.
function initCampaignPixels(c) {
  if (!c) return;
  try {
    // Meta: bootstrap the fbq snippet if absent, otherwise add this pixel to the existing
    // fbq (multi-pixel). injectFbq early-returns when fbq exists, so init the id directly.
    if (c.meta_pixel_id && !_loadedIds.has('fb:' + c.meta_pixel_id)) {
      _loadedIds.add('fb:' + c.meta_pixel_id);
      if (!window.fbq) injectFbq(c.meta_pixel_id);
      else { window.fbq('init', c.meta_pixel_id); window.fbq('track', 'PageView'); }
    }
    // TikTok: ttq.load() supports multiple pixel instances on the same ttq object.
    if (c.tiktok_pixel_id && !_loadedIds.has('tt:' + c.tiktok_pixel_id)) {
      _loadedIds.add('tt:' + c.tiktok_pixel_id);
      if (!window.ttq) injectTtq(c.tiktok_pixel_id);
      else { try { window.ttq.load(c.tiktok_pixel_id); window.ttq.page(); } catch {} }
    }
    // GTM: a second container loads alongside the global one (shared dataLayer).
    if (c.gtm_id && !_loadedIds.has('gtm:' + c.gtm_id)) {
      _loadedIds.add('gtm:' + c.gtm_id);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      injectScript('https://www.googletagmanager.com/gtm.js?id=' + c.gtm_id);
    }
    // Google Ads: bootstrap gtag if absent, then register the campaign's conversion id so
    // gtag('event','conversion',{send_to:'AW-…/label'}) works later. parseConversion guards
    // a malformed JSON blob.
    const cfg = parseConversion(c.conversion_config);
    const adsId = cfg.gads && cfg.gads.enabled && cfg.gads.conversion_id;
    if (adsId && !_loadedIds.has('aw:' + adsId)) {
      _loadedIds.add('aw:' + adsId);
      if (!window.gtag) injectGtag(adsId);
      else window.gtag('config', adsId);
    }
  } catch { /* pixel init must never break the page */ }
}

// parseConversion safely parses the campaign.conversion_config JSON envelope into
// {meta,tiktok,gads}. Returns {} on any error so callers can optional-chain.
function parseConversion(raw) {
  try {
    if (raw && typeof raw === 'object') return raw;
    if (typeof raw === 'string' && raw.trim()) return JSON.parse(raw) || {};
  } catch { /* fall through */ }
  return {};
}

// fireConversion fires the per-campaign conversion event for a funnel phase
// (phase ∈ {'submit','success'}) to every platform the campaign configured. `value` is the
// actual donation nominal (IDR). Falls back to the global track() so a campaign with no
// per-campaign override still reports a sensible default event. Never throws.
function fireConversion(c, phase, value) {
  try {
    const cfg = parseConversion(c && c.conversion_config);
    const val = Number(value) || 0;
    const payload = { value: val, currency: 'IDR', content_name: (c && c.title) || '' };

    // GTM dataLayer: always announce the funnel phase so a Tag Manager Custom Event
    // trigger ("donation_submit" / "donation_success") fires regardless of which direct
    // pixels are configured. Includes the campaign slug for GTM-side filtering.
    pushDL(phase === 'success' ? 'donation_success' : 'donation_submit', {
      ...payload, campaign_slug: (c && (c.slug || c.id)) || '',
    });

    // Meta Pixel
    const metaEvt = cfg.meta && cfg.meta.enabled && cfg.meta.events && cfg.meta.events[phase];
    if (window.fbq && metaEvt) window.fbq('track', metaEvt, payload);

    // TikTok Pixel
    const ttEvt = cfg.tiktok && cfg.tiktok.enabled && cfg.tiktok.events && cfg.tiktok.events[phase];
    if (window.ttq && ttEvt) window.ttq.track(ttEvt, payload);

    // Google Ads conversion (send_to = "AW-XXXX/label")
    const gads = cfg.gads;
    const label = gads && gads.enabled && gads.labels && gads.labels[phase];
    if (window.gtag && gads && gads.conversion_id && label) {
      window.gtag('event', 'conversion', {
        send_to: gads.conversion_id + '/' + label,
        value: val,
        currency: 'IDR',
      });
    }

    // Fallback (success only): a Default campaign with no per-campaign config still never
    // fired a Purchase/conversion on payment success (the long-standing gap). Fire one to
    // whatever global pixels loaded so global tracking reports the conversion. We do NOT
    // fall back on 'submit' — InitiateCheckout already fires on form-open + AddPaymentInfo
    // on method pick, so a submit fallback would double-count.
    if (phase === 'success' && !metaEvt && !ttEvt && !(gads && gads.enabled)) {
      track('Purchase', payload);
    }
  } catch { /* conversion fire must never break the donation UX */ }
}

// captureUTM reads utm_* from the current URL once on first landing. Stored so the
// donation POST (which may happen on a different route) still carries attribution.
function captureUTM() {
  try {
    const params = new URLSearchParams(window.location.search);
    const found = {};
    let any = false;
    UTM_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) { found[k] = v; any = true; }
    });
    if (any) sessionStorage.setItem(STORE_KEY, JSON.stringify(found));
  } catch { /* sessionStorage unavailable — attribution silently absent */ }
}

// getUTM returns the captured utm params (or {}). Merged into the donation body.
function getUTM() {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}');
  } catch { return {}; }
}

// pushDL pushes a semantic event onto window.dataLayer so GOOGLE TAG MANAGER can read it
// via a Custom Event trigger. This is the piece that was missing: the donation form is a
// SPA flow (onClick + fetch, not a native <form> submit), so GTM's built-in Form/Click
// triggers never fire, AND we previously only called fbq/gtag/ttq directly — none of which
// GTM "sees". Without a dataLayer.push, filling the form was invisible in Tag Manager.
// Every funnel step now lands here as {event:'<name>', ...payload} for the user's triggers.
function pushDL(event, payload = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    // `event` LAST so a stray payload.event can never clobber the semantic event name
    // GTM triggers on (later keys win in an object literal).
    window.dataLayer.push({ ...payload, event });
  } catch { /* dataLayer unavailable — non-fatal */ }
}

// track fires a client-side event to every configured pixel AND pushes it to the GTM
// dataLayer. Non-fatal if a pixel isn't loaded — it just no-ops for that platform.
function track(name, payload = {}) {
  try {
    if (window.fbq) window.fbq('track', name, payload);
    if (window.gtag) window.gtag('event', name, payload);
    if (window.ttq) window.ttq.track(name, payload);
  } catch { /* pixel fire must never break the UX */ }
  // Always mirror to dataLayer so GTM can trigger on the event even when no direct pixel
  // is configured (GTM itself may host the GA4/Ads/Meta tags). Runs regardless of the
  // pixel try/catch above.
  pushDL(name, payload);
}

// --- private injectors ---

function injectScript(src) {
  const el = document.createElement('script');
  el.async = true;
  el.src = src;
  document.head.appendChild(el);
}

function injectFbq(pixelId) {
  /* eslint-disable */
  (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

function injectGtag(measurementId) {
  injectScript('https://www.googletagmanager.com/gtag/js?id=' + measurementId);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

function injectTtq(pixelId) {
  /* eslint-disable */
  (function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
  ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq.t=ttq.t||{},ttq.t[e]=+new Date,ttq.t[e];var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load(pixelId);ttq.page()})(window,document,'ttq');
  /* eslint-enable */
}

window.NBTracking = { initPixels, initCampaignPixels, fireConversion, captureUTM, getUTM, track };

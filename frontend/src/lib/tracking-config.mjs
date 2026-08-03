// Parse + validate the unified domain tracking array into per-platform groups the
// injector loops over. The backend already validates on save; this re-validates at
// render as defense-in-depth (an id here becomes a gtag/fbq/ttq argument or a GTM
// script URL, so a bad value must never reach injection). Kept as plain .mjs so
// node:test covers it without a build step; tracking.ts imports it via a .d.ts.

const PATTERN = {
  gtm: /^GTM-[A-Z0-9]+$/,
  google_ads: /^AW-\d+$/,
  ga4: /^G-[A-Z0-9]+$/,
  meta: /^\d{6,20}$/,
  tiktok: /^[A-Z0-9]+$/,
};
const LABEL = /^[A-Za-z0-9_-]+$/;

function emptyGroups() {
  return { gtm: [], meta: [], ga4: [], googleAds: [], tiktok: [] };
}

function awId(raw) {
  const v = String(raw || '').trim();
  if (!v) return '';
  return /^AW-/i.test(v) ? v : 'AW-' + v;
}

// pushValid validates one tracker into the groups, deduping by (type,value).
function pushValid(groups, seen, type, value, label) {
  const t = String(type || '').trim().toLowerCase();
  let v = String(value || '').trim();
  if (t === 'google_ads') v = awId(v);
  const pattern = PATTERN[t];
  if (!pattern || !pattern.test(v)) return;
  const key = t + '|' + v;
  if (seen.has(key)) return;

  if (t === 'google_ads') {
    const lbl = String(label || '').trim();
    if (!LABEL.test(lbl)) return; // a conversion tag without a valid label can't fire
    seen.add(key);
    groups.googleAds.push({ id: v, label: lbl });
    return;
  }
  seen.add(key);
  ({ gtm: groups.gtm, meta: groups.meta, ga4: groups.ga4, tiktok: groups.tiktok })[t].push(v);
}

// parseTrackers turns the JSON array (or, when absent, the legacy discrete fields)
// into validated per-platform groups. Never throws.
export function parseTrackers(raw, fallbackSettings) {
  const groups = emptyGroups();
  const seen = new Set();

  let items = null;
  try {
    const parsed = typeof raw === 'string' && raw.trim() ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) items = parsed;
  } catch { /* fall through to fallback */ }

  if (items && items.length) {
    for (const it of items) {
      if (it && typeof it === 'object') pushValid(groups, seen, it.type, it.value, it.label);
    }
    return groups;
  }

  // Backward-compat: derive from the discrete settings fields.
  const s = fallbackSettings || {};
  pushValid(groups, seen, 'gtm', s.gtm_id, '');
  pushValid(groups, seen, 'meta', s.meta_pixel_id, '');
  pushValid(groups, seen, 'ga4', s.ga4_measurement_id, '');
  pushValid(groups, seen, 'tiktok', s.tiktok_pixel_id, '');
  pushValid(groups, seen, 'google_ads', s.google_ads_conversion_id, s.google_ads_conversion_label);
  return groups;
}

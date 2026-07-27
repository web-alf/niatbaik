// Durable storage for utm_* and ad click ids (gclid/gbraid/wbraid/fbclid/ttclid).
//
// These used to live in sessionStorage, which dies with the tab. A donor who clicks
// an ad, gets a VA number, closes the tab and pays from m-banking an hour later
// came back with no gclid at all — so neither the client tag nor the server-side
// upload could attribute the conversion. localStorage keeps it across sessions.
//
// Plain .mjs (not .ts) so the node:test suite can import it without a build step;
// tracking.ts consumes it through a small .d.ts.

export const STORE_KEY = 'nb_utm';

// 90 days matches the longest Google Ads click-attribution window, so we never
// discard a click id that Google would still credit — and never keep one it would not.
export const ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const STAMP_KEY = '_ts';

function safeGet(store, key) {
  try { return store ? store.getItem(key) : null; } catch { return null; }
}

function safeSet(store, key, value) {
  try {
    if (!store) return false;
    store.setItem(key, value);
    return true;
  } catch { return false; }
}

function parse(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch { return null; }
}

function defaults(opts) {
  const o = opts || {};
  const g = typeof globalThis !== 'undefined' ? globalThis : {};
  return {
    durable: o.durable !== undefined ? o.durable : g.localStorage,
    session: o.session !== undefined ? o.session : g.sessionStorage,
    now: typeof o.now === 'number' ? o.now : Date.now(),
  };
}

// readAttribution returns the stored params, or {} when absent, corrupt or expired.
// Never throws: storage can be disabled entirely (private mode, embedded webviews)
// and attribution must never break the donation flow.
export function readAttribution(opts) {
  const { durable, session, now } = defaults(opts);

  // Prefer durable; fall back to the legacy session copy so donors already
  // mid-journey when this ships keep their attribution.
  const record = parse(safeGet(durable, STORE_KEY)) || parse(safeGet(session, STORE_KEY));
  if (!record) return {};

  const stamp = record[STAMP_KEY];
  // A legacy payload has no stamp. Treat it as current rather than dropping it.
  if (typeof stamp === 'number' && now - stamp >= ATTRIBUTION_TTL_MS) return {};

  const { [STAMP_KEY]: _omit, ...values } = record;
  return values;
}

// writeAttribution persists params to durable storage, mirroring into session
// storage when durable is unavailable so the current tab still works.
export function writeAttribution(values, opts) {
  const { durable, session, now } = defaults(opts);
  const payload = JSON.stringify({ ...values, [STAMP_KEY]: now });
  if (!safeSet(durable, STORE_KEY, payload)) safeSet(session, STORE_KEY, payload);
}

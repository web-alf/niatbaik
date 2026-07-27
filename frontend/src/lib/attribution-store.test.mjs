// Run: node src/lib/attribution-store.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readAttribution, writeAttribution, ATTRIBUTION_TTL_MS } from './attribution-store.mjs';

// memStore is a minimal Storage stand-in. The real bug this module fixes is that
// click ids lived in sessionStorage, so a donor who closed the tab before paying
// lost the gclid entirely — server-side upload then had nothing to attribute.
function memStore(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    _dump: () => data,
  };
}

function throwingStore() {
  return {
    getItem() { throw new Error('storage disabled'); },
    setItem() { throw new Error('storage disabled'); },
    removeItem() { throw new Error('storage disabled'); },
  };
}

test('survives a tab close: value written to durable store is read back', () => {
  const durable = memStore();
  writeAttribution({ gclid: 'abc123' }, { durable, session: memStore(), now: 1000 });

  // Fresh session store models a brand-new tab; durable store persists.
  const got = readAttribution({ durable, session: memStore(), now: 2000 });
  assert.equal(got.gclid, 'abc123');
});

test('expires after the TTL so a months-old click is not credited', () => {
  const durable = memStore();
  writeAttribution({ gclid: 'stale' }, { durable, session: memStore(), now: 0 });

  const got = readAttribution({ durable, session: memStore(), now: ATTRIBUTION_TTL_MS + 1 });
  assert.deepEqual(got, {});
});

test('keeps a value that is still inside the TTL', () => {
  const durable = memStore();
  writeAttribution({ gclid: 'fresh' }, { durable, session: memStore(), now: 0 });

  const got = readAttribution({ durable, session: memStore(), now: ATTRIBUTION_TTL_MS - 1 });
  assert.equal(got.gclid, 'fresh');
});

test('migrates a legacy sessionStorage payload that has no timestamp', () => {
  // Donors mid-journey when this ships already have the old shape stored.
  const session = memStore({ nb_utm: JSON.stringify({ gclid: 'legacy', utm_source: 'ig' }) });
  const durable = memStore();

  const got = readAttribution({ durable, session, now: 5000 });
  assert.equal(got.gclid, 'legacy');
  assert.equal(got.utm_source, 'ig');
});

test('falls back to session storage when durable storage throws', () => {
  // Safari private mode and embedded webviews can reject localStorage writes.
  const session = memStore();
  writeAttribution({ gclid: 'private' }, { durable: throwingStore(), session, now: 0 });

  const got = readAttribution({ durable: throwingStore(), session, now: 1 });
  assert.equal(got.gclid, 'private');
});

test('returns empty object rather than throwing when both stores fail', () => {
  const got = readAttribution({ durable: throwingStore(), session: throwingStore(), now: 0 });
  assert.deepEqual(got, {});
});

test('write survives both stores failing', () => {
  assert.doesNotThrow(() => {
    writeAttribution({ gclid: 'x' }, { durable: throwingStore(), session: throwingStore(), now: 0 });
  });
});

test('ignores corrupt JSON instead of propagating a parse error', () => {
  const durable = memStore({ nb_utm: '{not json' });
  const got = readAttribution({ durable, session: memStore(), now: 0 });
  assert.deepEqual(got, {});
});

test('later capture merges into earlier attribution without wiping it', () => {
  const durable = memStore();
  writeAttribution({ utm_source: 'fb' }, { durable, session: memStore(), now: 0 });

  const existing = readAttribution({ durable, session: memStore(), now: 10 });
  writeAttribution({ ...existing, gclid: 'g1' }, { durable, session: memStore(), now: 10 });

  const got = readAttribution({ durable, session: memStore(), now: 20 });
  assert.equal(got.utm_source, 'fb');
  assert.equal(got.gclid, 'g1');
});

test('does not persist the internal timestamp key back to callers', () => {
  const durable = memStore();
  writeAttribution({ gclid: 'a' }, { durable, session: memStore(), now: 777 });
  const got = readAttribution({ durable, session: memStore(), now: 800 });
  assert.deepEqual(Object.keys(got), ['gclid']);
});

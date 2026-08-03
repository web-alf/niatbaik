// Run: node src/lib/tracking-config.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTrackers } from './tracking-config.mjs';

test('groups multiple ids of the same type', () => {
  const raw = JSON.stringify([
    { type: 'gtm', value: 'GTM-AAAA111' },
    { type: 'gtm', value: 'GTM-BBBB222' },
    { type: 'google_ads', value: 'AW-100', label: 'abc-DEF_1' },
    { type: 'google_ads', value: 'AW-200', label: 'xyz-9' },
    { type: 'meta', value: '123456789' },
    { type: 'ga4', value: 'G-ABCDE12' },
    { type: 'tiktok', value: 'CABC123' },
  ]);
  const g = parseTrackers(raw, null);
  assert.deepEqual(g.gtm, ['GTM-AAAA111', 'GTM-BBBB222']);
  assert.equal(g.googleAds.length, 2);
  assert.deepEqual(g.googleAds[0], { id: 'AW-100', label: 'abc-DEF_1' });
  assert.deepEqual(g.meta, ['123456789']);
  assert.deepEqual(g.ga4, ['G-ABCDE12']);
  assert.deepEqual(g.tiktok, ['CABC123']);
});

test('falls back to discrete settings when array is empty', () => {
  const g = parseTrackers('', {
    gtm_id: 'GTM-LEGACY1',
    meta_pixel_id: '999888777',
    ga4_measurement_id: 'G-LEG123',
    tiktok_pixel_id: 'TTLEG',
    google_ads_conversion_id: 'AW-555',
    google_ads_conversion_label: 'leg-LABEL',
  });
  assert.deepEqual(g.gtm, ['GTM-LEGACY1']);
  assert.deepEqual(g.meta, ['999888777']);
  assert.deepEqual(g.ga4, ['G-LEG123']);
  assert.deepEqual(g.tiktok, ['TTLEG']);
  assert.deepEqual(g.googleAds, [{ id: 'AW-555', label: 'leg-LABEL' }]);
});

test('array wins over discrete fields when both present', () => {
  const raw = JSON.stringify([{ type: 'gtm', value: 'GTM-ARRAY1' }]);
  const g = parseTrackers(raw, { gtm_id: 'GTM-LEGACY1' });
  assert.deepEqual(g.gtm, ['GTM-ARRAY1']);
});

test('normalizes bare-numeric google_ads id to AW- prefix', () => {
  const raw = JSON.stringify([{ type: 'google_ads', value: '404040', label: 'lbl' }]);
  const g = parseTrackers(raw, null);
  assert.deepEqual(g.googleAds, [{ id: 'AW-404040', label: 'lbl' }]);
});

test('drops invalid ids (XSS defense-in-depth at the client too)', () => {
  const raw = JSON.stringify([
    { type: 'gtm', value: '"><script>alert(1)</script>' },
    { type: 'gtm', value: 'GTM-OK1' },
    { type: 'google_ads', value: 'AW-1' },              // missing label
    { type: 'google_ads', value: 'AW-2', label: 'bad space' },
    { type: 'meta', value: 'not-a-number' },
    { type: 'weird', value: 'x' },                       // unknown type
  ]);
  const g = parseTrackers(raw, null);
  assert.deepEqual(g.gtm, ['GTM-OK1']);
  assert.deepEqual(g.googleAds, []);
  assert.deepEqual(g.meta, []);
});

test('dedupes exact repeats', () => {
  const raw = JSON.stringify([
    { type: 'gtm', value: 'GTM-DUP' },
    { type: 'gtm', value: 'GTM-DUP' },
  ]);
  assert.deepEqual(parseTrackers(raw, null).gtm, ['GTM-DUP']);
});

test('never throws on garbage input', () => {
  for (const bad of ['not json', '{}', '42', null, undefined]) {
    const g = parseTrackers(bad, null);
    assert.deepEqual(g.gtm, []);
    assert.deepEqual(g.googleAds, []);
  }
});

test('scope=global included by default and off excluded', () => {
  const raw = JSON.stringify([
    { type: 'gtm', value: 'GTM-AAAA111' },                              // global default
    { type: 'meta', value: '123456789', scope: 'off' },                 // never injected
    { type: 'gtm', value: 'GTM-BBBB222', scope: 'campaigns', campaigns: ['wakaf-sumur'] },
  ]);
  // No campaign context => only global trackers.
  const g = parseTrackers(raw, null);
  assert.deepEqual(g.gtm, ['GTM-AAAA111']);
  assert.deepEqual(g.meta, []);
});

test('scope=campaigns only included when the active campaign matches', () => {
  const raw = JSON.stringify([
    { type: 'gtm', value: 'GTM-AAAA111', scope: 'campaigns', campaigns: ['wakaf-sumur', 'yatim'] },
  ]);
  assert.deepEqual(parseTrackers(raw, null, 'wakaf-sumur').gtm, ['GTM-AAAA111']);
  assert.deepEqual(parseTrackers(raw, null, 'bencana').gtm, []);
  // no campaign given => scoped tracker excluded
  assert.deepEqual(parseTrackers(raw, null).gtm, []);
});

test('global tracker still injected on a campaign page (scope additive)', () => {
  const raw = JSON.stringify([
    { type: 'gtm', value: 'GTM-GLOB' },                                  // global
    { type: 'gtm', value: 'GTM-CAMP', scope: 'campaigns', campaigns: ['a'] },
  ]);
  const g = parseTrackers(raw, null, 'a');
  assert.deepEqual(g.gtm, ['GTM-GLOB', 'GTM-CAMP']);
});

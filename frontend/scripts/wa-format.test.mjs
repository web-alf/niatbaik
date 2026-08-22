// Self-check for the donor WhatsApp helpers in src/lib/format.ts.
// Run with bun (it imports the TypeScript source directly, no build step):
//   bun test scripts/wa-format.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeWaID, formatWaID, isValidWaID } from '../src/lib/format.ts';

test('normalizeWaID collapses every Indonesian input shape to 62-form', () => {
  for (const input of [
    '081234567890',
    '+62 812-3456-7890',
    '62 812 3456 7890',
    '81234567890',
    '(0812) 3456-7890',
    ' 0812 3456 7890 ',
  ]) {
    assert.equal(normalizeWaID(input), '6281234567890', input);
  }
  assert.equal(normalizeWaID(''), '');
  assert.equal(normalizeWaID('   '), '');
});

test('normalizeWaID keeps a foreign country code typed with +', () => {
  assert.equal(normalizeWaID('+1 202 555 0123'), '12025550123');
  assert.equal(normalizeWaID('+65 8123 4567'), '6581234567');
});

test('formatWaID renders the display form', () => {
  assert.equal(formatWaID('081234567890'), '+62 812-3456-7890');
  assert.equal(formatWaID(''), '');
  assert.equal(formatWaID('+1 202 555 0123'), '+12025550123');
});

test('isValidWaID accepts real mobiles and rejects malformed input', () => {
  for (const ok of ['081234567890', '+62 812-3456-7890', '8123456789', '62812345678901']) {
    assert.equal(isValidWaID(ok), true, ok);
  }
  for (const bad of [
    '',
    '0812345',             // too short
    '02112345678',         // landline: national part starts with 2, not 8
    '6281234567890123456', // too long
    'abcdefgh',            // no digits
  ]) {
    assert.equal(isValidWaID(bad), false, bad);
  }
});

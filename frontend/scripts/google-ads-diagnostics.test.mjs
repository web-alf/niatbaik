import test from 'node:test';
import assert from 'node:assert/strict';

import { sanitizeText } from './google-ads-diagnostics.mjs';

test('sanitizeText removes secrets and PII while retaining diagnostics', () => {
  const input = `Bearer abc.def.ghi
Cookie: session=secret-cookie
client_secret=oauth-secret
refresh_token=refresh-secret
user@example.com +6281234567890 customer 3067980562
PERMISSION_DENIED: account access denied`;
  const output = sanitizeText(input);

  for (const secret of ['abc.def.ghi', 'secret-cookie', 'oauth-secret', 'refresh-secret', 'user@example.com', '+6281234567890', '3067980562']) {
    assert.equal(output.includes(secret), false, secret);
  }
  assert.match(output, /PERMISSION_DENIED/);
  assert.match(output, /account access denied/);
});

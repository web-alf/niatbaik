// interpolate replaces {{token}} placeholders in CMS strings with live totals so admin copy
// like "{{donors}}+ donatur" renders with the real number. Unknown tokens are left as-is.
// Values are formatted by the caller-supplied map (already-formatted strings).
export function interpolate(str: unknown, vars: Record<string, string | number>): string {
  if (typeof str !== 'string') return '';
  return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => {
    const v = vars[key];
    return v === undefined || v === null ? m : String(v);
  });
}

// Formatting helpers + SVG placeholder generators + shared constants.
// Ported from data.jsx.

export const fmtIDR = (n: number) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');

export const fmtIDRShort = (n: number) => {
  if (n >= 1e9) return 'Rp ' + (n / 1e9).toFixed(1).replace(/\.0$/, '') + ' M';
  if (n >= 1e6) return 'Rp ' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + ' jt';
  if (n >= 1e3) return 'Rp ' + (n / 1e3).toFixed(0) + ' rb';
  return 'Rp ' + (n || 0);
};
// Alias kept for the views that imported window.fmtShort.
export const fmtShort = fmtIDRShort;

export const fmtNum = (n: number) => (n || 0).toLocaleString('id-ID');

export const fmtPct = (n: number) => (n * 100).toFixed(1) + '%';

export function placeholderImg(seed: number, label?: string) {
  const solids = ['#2E4191', '#2563eb', '#0e7490', '#1e40af', '#0369a1', '#1e3a8a'];
  const fill = solids[seed % solids.length];
  return `data:image/svg+xml;utf8,` + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>
      <rect width='800' height='500' fill='${fill}'/>
      <g transform='translate(400 250)' fill='rgba(255,255,255,0.9)' text-anchor='middle' font-family='system-ui'>
        <text font-size='28' font-weight='700'>${label || 'DONASI'}</text>
      </g>
    </svg>`,
  );
}

export function avatarSvg(initials: string, seed: number) {
  const hues = ['#2E4191', '#38B6FF', '#0e83c8', '#4762bd', '#1aa1ee', '#125883'];
  const bg = hues[seed % hues.length];
  return `data:image/svg+xml;utf8,` + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'>
      <rect width='80' height='80' rx='40' fill='${bg}'/>
      <text x='40' y='48' text-anchor='middle' fill='#fff' font-family='system-ui' font-size='30' font-weight='700'>${initials}</text>
    </svg>`,
  );
}

// ---- Indonesian WhatsApp number handling ----
// Donors type the same number half a dozen ways ("0812…", "+62 812-…", "62812…",
// "812…"). Everything is normalized to bare E.164 digits ("62812…") because
// donor_phone is what the backend dedups invoices on and what the donor stat's
// COUNT(DISTINCT donor_phone) groups by — mixed formats count one person twice.

// normalizeWaID converts an Indonesian input to bare E.164 digits ("62812…").
// A non-62 number typed with a leading "+" keeps its own country code so a donor
// abroad isn't rewritten into an Indonesian number. Empty input → ''.
export function normalizeWaID(raw: string): string {
  const s = String(raw || '').replace(/[^\d+]/g, '');
  if (!s) return '';
  const intl = s.startsWith('+');
  const d = s.replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('62')) return d;                // 62812… / +62 812…
  if (intl) return d;                              // +1…, +65… → keep as typed
  if (d.startsWith('0')) return '62' + d.slice(1); // 0812…  → 62812…
  if (d.startsWith('8')) return '62' + d;          // 812…   → 62812… (dropped 0)
  return d;
}

// formatWaID renders a number for display: "+62 812-3456-7890". Non-Indonesian
// numbers fall back to a plain "+<digits>" since their grouping differs.
export function formatWaID(raw: string): string {
  const d = normalizeWaID(raw);
  if (!d) return '';
  if (!d.startsWith('62')) return '+' + d;
  const rest = d.slice(2);
  if (!rest) return '+62';
  const groups = [rest.slice(0, 3), rest.slice(3, 7), rest.slice(7, 11), rest.slice(11)].filter(Boolean);
  return '+62 ' + groups.join('-');
}

// isValidWaID checks the national number. Indonesian mobiles start with 8 and run
// 9–13 digits after the 62 prefix; foreign numbers only get a length sanity check.
export function isValidWaID(raw: string): boolean {
  const d = normalizeWaID(raw);
  if (!d) return false;
  if (!d.startsWith('62')) return d.length >= 8 && d.length <= 15;
  return /^8\d{8,12}$/.test(d.slice(2));
}

export const paymentMethods = ['QRIS', 'BCA VA', 'Mandiri VA', 'BNI VA', 'GoPay', 'OVO', 'Dana', 'ShopeePay'];
export const autoConfirmMethods = ['BCA VA', 'Mandiri VA', 'BNI VA'];
export const isAutoConfirmMethod = (m: string) => autoConfirmMethods.some((a) => m && m.includes(a));
export const NOMINAL_PRESETS = [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

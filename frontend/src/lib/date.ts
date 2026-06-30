// Date helpers + the shared dashboard date-range state. Ported from components.jsx.
// The range used to live on window.__nb_dateRange; it's now module state with a
// get/set pair (views that don't pass a setter still read the latest via getDateRange
// and the 'nb-range-change' event the DateRangePill broadcasts).

export interface DateRange { start: Date | null; end: Date | null }

export const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
export const sameDay = (a: Date | null, b: Date | null) => !!a && !!b && a.toDateString() === b.toDateString();
export const inRange = (d: Date, s: Date | null, e: Date | null) => !!s && !!e && d >= s && d <= e;

export function formatRangeLabel(start: Date | null, end: Date | null) {
  if (!start) return 'Pilih tanggal';
  if (!end || sameDay(start, end)) return fmtDate(start);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS_SHORT[start.getMonth()]} ${start.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${start.getFullYear()}`;
  }
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

export const DEFAULT_RANGE: DateRange = { start: new Date(2026, 4, 1), end: new Date(2026, 4, 31) };

let _currentRange: DateRange = { ...DEFAULT_RANGE };
export const getDateRange = (): DateRange => _currentRange;
export const setDateRange = (r: DateRange) => { _currentRange = r; };

export const rangeStamp = (r: DateRange | null) => {
  if (!r || !r.start) return 'all';
  const f = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return f(r.start) + '-' + f(r.end || r.start);
};

// parseTxnDate parses an API ISO date ("2026-05-01T08:00:00Z") or the legacy
// "1 Mei 2026, 08:00" form into a LOCAL-midnight Date. Building from the calendar
// components (not new Date(iso)) avoids the UTC 'Z' shift that dropped evening
// transactions from same-day range filters in UTC+7.
export const parseTxnDate = (s: unknown): Date | null => {
  if (!s) return null;
  if (s instanceof Date) return s;
  if (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    const ymd = s.slice(0, 10).split('-');
    const y = +ymd[0], mo = +ymd[1], da = +ymd[2];
    if (!y || !mo || !da) return null;
    return new Date(y, mo - 1, da);
  }
  const m = /(\d+)\s+(\w+)\s+(\d{4})/.exec((s as string) || '');
  if (!m) return null;
  const monIdx = MONTHS_ID.findIndex((x) => x.toLowerCase().startsWith(m[2].toLowerCase().slice(0, 3)));
  if (monIdx < 0) return null;
  return new Date(+m[3], monIdx, +m[1]);
};

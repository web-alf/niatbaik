// Functional date-range calendar + the toolbar pill. Ported from components.jsx.
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import {
  MONTHS_ID, DAYS_ID, fmtDate, sameDay, inRange, formatRangeLabel,
  DEFAULT_RANGE, getDateRange, setDateRange, type DateRange,
} from '@/lib/date';

const CalendarGrid = ({ cursor, range, hover, onPick, onHover, minDate, maxDate }: any) => {
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_ID.map((d) => <div key={d} className="text-[10px] font-bold uppercase text-mute text-center py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const disabled = (minDate && d < minDate) || (maxDate && d > maxDate);
          const isStart = sameDay(d, range.start);
          const isEnd = sameDay(d, range.end || (range.start && hover ? hover : null));
          const previewEnd = range.start && !range.end && hover && hover > range.start ? hover : null;
          const isInRange = inRange(d, range.start, range.end) ||
            (range.start && previewEnd && d > range.start && d < previewEnd) ||
            (range.start && previewEnd && sameDay(d, previewEnd));
          const isToday = sameDay(d, today);
          const cls = isStart || isEnd
            ? 'bg-brand-600 text-white font-extrabold shadow'
            : isInRange
              ? 'bg-brand-100 text-brand-700 font-semibold'
              : isToday
                ? 'bg-bg2 text-brand-600 font-bold ring-1 ring-brand-200'
                : 'hover:bg-bg2 text-ink';
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => !disabled && onPick(d)}
              onMouseEnter={() => onHover(d)}
              className={`h-8 w-full rounded-md text-xs transition-colors relative ${cls} ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${isInRange && !isStart && !isEnd ? 'rounded-none' : ''} ${isStart && !sameDay(range.start, range.end || previewEnd) ? 'rounded-r-none' : ''} ${isEnd && !sameDay(range.start, range.end || previewEnd) ? 'rounded-l-none' : ''}`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const DateRangePicker = ({ open, onClose, value, onChange }: any) => {
  const [draft, setDraft] = useState<DateRange>({ start: value?.start || null, end: value?.end || null });
  const [hover, setHover] = useState<Date | null>(null);
  const [cursorL, setCursorL] = useState(() => {
    const d = value?.start ? new Date(value.start) : new Date();
    d.setDate(1);
    return d;
  });
  const cursorR = useMemo(() => {
    const d = new Date(cursorL); d.setMonth(d.getMonth() + 1); return d;
  }, [cursorL]);

  useEffect(() => {
    if (open) setDraft({ start: value?.start || null, end: value?.end || null });
  }, [open]);

  if (!open) return null;

  const pick = (d: Date) => {
    if (!draft.start || (draft.start && draft.end)) {
      setDraft({ start: d, end: null });
    } else {
      if (d < draft.start) setDraft({ start: d, end: draft.start });
      else setDraft({ start: draft.start, end: d });
    }
  };

  const presets = [
    { label: 'Hari ini', range: () => { const d = new Date(); d.setHours(0, 0, 0, 0); return { start: d, end: d }; } },
    { label: 'Kemarin', range: () => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(0, 0, 0, 0); return { start: d, end: d }; } },
    { label: '7 hari terakhir', range: () => { const e = new Date(); e.setHours(0, 0, 0, 0); const s = new Date(e); s.setDate(e.getDate() - 6); return { start: s, end: e }; } },
    { label: '14 hari terakhir', range: () => { const e = new Date(); e.setHours(0, 0, 0, 0); const s = new Date(e); s.setDate(e.getDate() - 13); return { start: s, end: e }; } },
    { label: '30 hari terakhir', range: () => { const e = new Date(); e.setHours(0, 0, 0, 0); const s = new Date(e); s.setDate(e.getDate() - 29); return { start: s, end: e }; } },
    { label: 'Bulan ini', range: () => { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 1); const e = new Date(d.getFullYear(), d.getMonth() + 1, 0); return { start: s, end: e }; } },
    { label: 'Bulan lalu', range: () => { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth() - 1, 1); const e = new Date(d.getFullYear(), d.getMonth(), 0); return { start: s, end: e }; } },
    { label: 'Quarter ini', range: () => { const d = new Date(); const q = Math.floor(d.getMonth() / 3); const s = new Date(d.getFullYear(), q * 3, 1); const e = new Date(d.getFullYear(), q * 3 + 3, 0); return { start: s, end: e }; } },
    { label: 'Tahun ini', range: () => { const d = new Date(); const s = new Date(d.getFullYear(), 0, 1); const e = new Date(d.getFullYear(), 11, 31); return { start: s, end: e }; } },
    { label: 'Sepanjang waktu', range: () => ({ start: new Date(2024, 0, 1), end: new Date() }) },
  ];

  const apply = () => {
    if (draft.start && draft.end) { onChange(draft); onClose(); }
    else if (draft.start) { onChange({ start: draft.start, end: draft.start }); onClose(); }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 mt-2 right-0 bg-white rounded-2xl shadow-pop border border-line overflow-hidden w-[640px] max-w-[calc(100vw-2rem)]">
        <div className="flex">
          <div className="w-40 border-r border-line bg-bg2/50 py-2 px-2 hidden sm:block">
            {presets.map((p) => (
              <button key={p.label} onClick={() => setDraft(p.range())}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold text-ink/80 hover:bg-white hover:text-brand-600">
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex-1 p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <button onClick={() => { const d = new Date(cursorL); d.setMonth(d.getMonth() - 1); setCursorL(d); }}
                className="h-7 w-7 rounded-md hover:bg-bg2 text-mute flex items-center justify-center"><Icon name="chevronL" size={14} /></button>
              <div className="grid grid-cols-2 gap-8 flex-1 mx-2 text-center">
                <div className="text-sm font-extrabold text-ink">{MONTHS_ID[cursorL.getMonth()]} {cursorL.getFullYear()}</div>
                <div className="text-sm font-extrabold text-ink">{MONTHS_ID[cursorR.getMonth()]} {cursorR.getFullYear()}</div>
              </div>
              <button onClick={() => { const d = new Date(cursorL); d.setMonth(d.getMonth() + 1); setCursorL(d); }}
                className="h-7 w-7 rounded-md hover:bg-bg2 text-mute flex items-center justify-center"><Icon name="chevronR" size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4" onMouseLeave={() => setHover(null)}>
              <CalendarGrid cursor={cursorL} range={draft} hover={hover} onPick={pick} onHover={setHover} />
              <CalendarGrid cursor={cursorR} range={draft} hover={hover} onPick={pick} onHover={setHover} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-line bg-bg2/40">
          <div className="text-xs">
            <span className="text-mute">Mulai:</span>{' '}
            <b className="text-ink">{draft.start ? fmtDate(draft.start) : '—'}</b>
            <span className="mx-2 text-mute">→</span>
            <span className="text-mute">Akhir:</span>{' '}
            <b className="text-ink">{draft.end ? fmtDate(draft.end) : '—'}</b>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-md text-xs font-bold text-ink hover:bg-white border border-line">Batal</button>
            <button onClick={apply} disabled={!draft.start} className={`px-4 py-1.5 rounded-md text-xs font-bold text-white ${draft.start ? 'bg-brand-600 hover:bg-brand-700' : 'bg-slate-300 cursor-not-allowed'}`}>Terapkan</button>
          </div>
        </div>
      </div>
    </>
  );
};

export const DateRangePill = ({ value, onChange, label }: any) => {
  const [open, setOpen] = useState(false);
  const cur = value || getDateRange() || DEFAULT_RANGE;

  const handleChange = (r: DateRange) => {
    setDateRange(r);
    onChange && onChange(r);
    window.dispatchEvent(new CustomEvent('nb-range-change', { detail: r }));
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-line bg-white text-sm font-medium hover:bg-bg2">
        <Icon name="calendar" size={14} className="text-mute" />
        <span>{label || formatRangeLabel(cur.start, cur.end)}</span>
        <Icon name="chevronD" size={14} className={`text-mute transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <DateRangePicker open={open} onClose={() => setOpen(false)} value={cur} onChange={handleChange} />
    </div>
  );
};

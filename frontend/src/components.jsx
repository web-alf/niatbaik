// Shared UI components: Card, Stat, Badge, Progress, Pills, DateRange, etc.
const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;
const { fmtIDR, fmtIDRShort, fmtNum, fmtPct } = window.NB;

// Hook aliases used across the design-ported view files. In the original
// (babel/standalone, shared scope) these leaked from app.jsx; under the
// IIFE-per-file build each file is isolated, so expose them as window globals.
// Bare references like `useStateA(...)` resolve to window.useStateA in browser.
window.useStateA = React.useState;
window.useEffectA = React.useEffect;
window.useMemoA = React.useMemo;
window.useRefA = React.useRef;

// --------- App context (role, view, modal) ---------
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// --------- Card ---------
const Card = ({ children, className = '', as = 'div', ...rest }) => {
  const Tag = as;
  return (
    <Tag className={'bg-white rounded-2xl border border-line shadow-card ' + className} {...rest}>
      {children}
    </Tag>
  );
};

// --------- Stat card ---------
const StatCard = ({ icon, label, value, delta, deltaTone = 'up', accent = 'brand', sub }) => {
  const accents = {
    brand:  'bg-brand-50  text-brand-600',
    sky:    'bg-sky2-50   text-sky2-500',
    ok:     'bg-emerald-50 text-emerald-600',
    warn:   'bg-amber-50  text-amber-600',
    bad:    'bg-rose-50   text-rose-600',
    ink:    'bg-slate-100 text-slate-700',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-mute uppercase tracking-wider">{label}</div>
          <div className="mt-2 text-2xl font-bold text-ink">{value}</div>
          {sub && <div className="mt-1 text-xs text-mute">{sub}</div>}
        </div>
        <div className={'h-10 w-10 rounded-xl flex items-center justify-center ' + (accents[accent] || accents.brand)}>
          <Icon name={icon} size={20} strokeWidth={2}/>
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className={'inline-flex items-center gap-1 font-semibold ' + (deltaTone === 'up' ? 'text-emerald-600' : 'text-rose-600')}>
            <Icon name={deltaTone === 'up' ? 'arrowUp' : 'arrowDown'} size={12} strokeWidth={2.4}/>
            {delta}
          </span>
          <span className="text-mute">vs minggu lalu</span>
        </div>
      )}
    </Card>
  );
};

// --------- Badge ---------
const Badge = ({ tone = 'slate', children, dot = false, size = 'md', className = '' }) => {
  const tones = {
    slate:    'bg-slate-100 text-slate-700',
    brand:    'bg-brand-50  text-brand-700',
    sky:      'bg-sky2-50   text-sky2-600',
    ok:       'bg-emerald-50 text-emerald-700',
    warn:     'bg-amber-50  text-amber-700',
    bad:      'bg-rose-50   text-rose-700',
    purple:   'bg-violet-50 text-violet-700',
    outline:  'border border-line text-ink bg-white',
  };
  const sizes = { sm: 'text-[10px] px-1.5 py-0.5', md: 'text-xs px-2 py-1', lg: 'text-sm px-2.5 py-1' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${tones[tone]} ${sizes[size]} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current"/>}
      {children}
    </span>
  );
};

const StatusBadge = ({ status, size }) => {
  const map = {
    Draft:     { tone:'slate',  label:'Draft' },
    Published: { tone:'sky',    label:'Published' },
    Running:   { tone:'ok',     label:'Running', dot:true },
    Ended:     { tone:'slate',  label:'Ended' },
    Paid:      { tone:'ok',     label:'Paid', dot:true },
    Pending:   { tone:'warn',   label:'Pending', dot:true },
    Failed:    { tone:'bad',    label:'Failed', dot:true },
    active:    { tone:'ok',     label:'Active', dot:true },
    inactive:  { tone:'slate',  label:'Inactive' },
    pending:   { tone:'warn',   label:'Pending', dot:true },
    paid:      { tone:'ok',     label:'Paid', dot:true },
  };
  const m = map[status] || { tone:'slate', label: status };
  return <Badge tone={m.tone} size={size} dot={m.dot}>{m.label}</Badge>;
};

const RoleBadge = ({ role }) => {
  const map = {
    Admin: 'brand',
    CS: 'sky',
    Advertiser: 'purple',
  };
  return <Badge tone={map[role]}>{role}</Badge>;
};

// --------- Progress bar ---------
const Progress = ({ value, max, height = 'h-2', showLabel = false, tone = 'brand' }) => {
  const pct = Math.min(100, (value / max) * 100);
  const toneCls = tone === 'brand'
    ? 'bg-gradient-to-r from-brand-600 to-sky2-400'
    : tone === 'ok' ? 'bg-emerald-500'
    : 'bg-slate-400';
  return (
    <div>
      <div className={`relative w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
        <div className={`absolute inset-y-0 left-0 ${toneCls} rounded-full transition-all`} style={{ width: pct + '%' }}/>
      </div>
      {showLabel && (
        <div className="mt-1.5 flex justify-between text-xs text-mute">
          <span><b className="text-ink">{Math.round(pct)}%</b> tercapai</span>
          <span>dari {fmtIDRShort(max)}</span>
        </div>
      )}
    </div>
  );
};

// --------- Button ---------
const Btn = ({ children, variant='solid', tone='brand', size='md', icon, iconRight, className='', ...rest }) => {
  const sizes = { sm:'text-xs px-2.5 py-1.5 gap-1.5', md:'text-sm px-3.5 py-2 gap-2', lg:'text-base px-5 py-3 gap-2'};
  const tones = {
    brand: {
      solid:   'bg-brand-600 hover:bg-brand-700 text-white shadow-sm',
      outline: 'border border-brand-600 text-brand-600 hover:bg-brand-50',
      ghost:   'text-brand-600 hover:bg-brand-50',
    },
    sky: {
      solid:   'bg-sky2-400 hover:bg-sky2-500 text-white',
      outline: 'border border-sky2-400 text-sky2-500 hover:bg-sky2-50',
      ghost:   'text-sky2-500 hover:bg-sky2-50',
    },
    ink: {
      solid:   'bg-ink hover:bg-slate-800 text-white',
      outline: 'border border-line text-ink hover:bg-bg2',
      ghost:   'text-ink hover:bg-slate-100',
    },
    bad: {
      solid: 'bg-rose-600 hover:bg-rose-700 text-white',
      outline: 'border border-rose-200 text-rose-600 hover:bg-rose-50',
      ghost: 'text-rose-600 hover:bg-rose-50',
    },
    ok: {
      solid: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      outline: 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50',
      ghost: 'text-emerald-600 hover:bg-emerald-50',
    },
  };
  return (
    <button className={`inline-flex items-center justify-center font-semibold rounded-lg transition-colors ${sizes[size]} ${tones[tone][variant]} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16}/>}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 18 : 16}/>}
    </button>
  );
};

// --------- Searchbox ---------
const SearchInput = ({ placeholder = 'Cari…', value, onChange, className='', size='md' }) => {
  const sz = size === 'sm' ? 'h-9 text-sm' : 'h-10 text-sm';
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute"/>
      <input
        className={`w-full ${sz} rounded-lg border border-line bg-white pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600`}
        placeholder={placeholder} value={value} onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  );
};

// --------- Toolbar select / filter chips ---------
const Select = ({ value, onChange, options, className='', icon }) => (
  <div className={`relative ${className}`}>
    {icon && <Icon name={icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none"/>}
    <select
      value={value} onChange={(e) => onChange && onChange(e.target.value)}
      className={`appearance-none w-full h-10 rounded-lg border border-line bg-white ${icon ? 'pl-9' : 'pl-3'} pr-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600`}>
      {options.map((o) => typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <Icon name="chevronD" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none"/>
  </div>
);

// --------- Date Range Picker (functional calendar) ---------
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const DAYS_ID = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

const fmtDate = (d) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
const inRange = (d, s, e) => s && e && d >= s && d <= e;

function formatRangeLabel(start, end) {
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

// Default global range exposed for export functions
const DEFAULT_RANGE = { start: new Date(2026, 4, 1), end: new Date(2026, 4, 31) };
window.__nb_dateRange = { ...DEFAULT_RANGE };

const CalendarGrid = ({ cursor, range, hover, onPick, onHover, minDate, maxDate }) => {
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);

  const cells = [];
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
          if (!d) return <div key={i}/>;
          const disabled = (minDate && d < minDate) || (maxDate && d > maxDate);
          const isStart = sameDay(d, range.start);
          const isEnd   = sameDay(d, range.end || (range.start && hover ? hover : null));
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

const DateRangePicker = ({ open, anchor, onClose, value, onChange }) => {
  const [draft, setDraft] = useState({ start: value?.start || null, end: value?.end || null });
  const [hover, setHover] = useState(null);
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

  const pick = (d) => {
    if (!draft.start || (draft.start && draft.end)) {
      setDraft({ start: d, end: null });
    } else {
      if (d < draft.start) setDraft({ start: d, end: draft.start });
      else setDraft({ start: draft.start, end: d });
    }
  };

  const presets = [
    { label: 'Hari ini', range: () => { const d = new Date(); d.setHours(0,0,0,0); return { start: d, end: d }; } },
    { label: 'Kemarin', range: () => { const d = new Date(); d.setDate(d.getDate()-1); d.setHours(0,0,0,0); return { start: d, end: d }; } },
    { label: '7 hari terakhir', range: () => { const e = new Date(); e.setHours(0,0,0,0); const s = new Date(e); s.setDate(e.getDate()-6); return { start: s, end: e }; } },
    { label: '14 hari terakhir', range: () => { const e = new Date(); e.setHours(0,0,0,0); const s = new Date(e); s.setDate(e.getDate()-13); return { start: s, end: e }; } },
    { label: '30 hari terakhir', range: () => { const e = new Date(); e.setHours(0,0,0,0); const s = new Date(e); s.setDate(e.getDate()-29); return { start: s, end: e }; } },
    { label: 'Bulan ini', range: () => { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 1); const e = new Date(d.getFullYear(), d.getMonth()+1, 0); return { start: s, end: e }; } },
    { label: 'Bulan lalu', range: () => { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth()-1, 1); const e = new Date(d.getFullYear(), d.getMonth(), 0); return { start: s, end: e }; } },
    { label: 'Quarter ini', range: () => { const d = new Date(); const q = Math.floor(d.getMonth()/3); const s = new Date(d.getFullYear(), q*3, 1); const e = new Date(d.getFullYear(), q*3+3, 0); return { start: s, end: e }; } },
    { label: 'Tahun ini', range: () => { const d = new Date(); const s = new Date(d.getFullYear(), 0, 1); const e = new Date(d.getFullYear(), 11, 31); return { start: s, end: e }; } },
    { label: 'Sepanjang waktu', range: () => ({ start: new Date(2024, 0, 1), end: new Date() }) },
  ];

  const apply = () => {
    if (draft.start && draft.end) { onChange(draft); onClose(); }
    else if (draft.start) { onChange({ start: draft.start, end: draft.start }); onClose(); }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}/>
      <div className="absolute z-50 mt-2 left-0 bg-white rounded-2xl shadow-pop border border-line overflow-hidden w-[640px] max-w-[calc(100vw-2rem)]">
        <div className="flex">
          {/* Presets */}
          <div className="w-40 border-r border-line bg-bg2/50 py-2 px-2 hidden sm:block">
            {presets.map((p) => (
              <button key={p.label} onClick={() => setDraft(p.range())}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold text-ink/80 hover:bg-white hover:text-brand-600">
                {p.label}
              </button>
            ))}
          </div>
          {/* Calendars */}
          <div className="flex-1 p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <button onClick={() => { const d = new Date(cursorL); d.setMonth(d.getMonth()-1); setCursorL(d); }}
                className="h-7 w-7 rounded-md hover:bg-bg2 text-mute flex items-center justify-center"><Icon name="chevronL" size={14}/></button>
              <div className="grid grid-cols-2 gap-8 flex-1 mx-2 text-center">
                <div className="text-sm font-extrabold text-ink">{MONTHS_ID[cursorL.getMonth()]} {cursorL.getFullYear()}</div>
                <div className="text-sm font-extrabold text-ink">{MONTHS_ID[cursorR.getMonth()]} {cursorR.getFullYear()}</div>
              </div>
              <button onClick={() => { const d = new Date(cursorL); d.setMonth(d.getMonth()+1); setCursorL(d); }}
                className="h-7 w-7 rounded-md hover:bg-bg2 text-mute flex items-center justify-center"><Icon name="chevronR" size={14}/></button>
            </div>
            <div className="grid grid-cols-2 gap-4" onMouseLeave={() => setHover(null)}>
              <CalendarGrid cursor={cursorL} range={draft} hover={hover} onPick={pick} onHover={setHover}/>
              <CalendarGrid cursor={cursorR} range={draft} hover={hover} onPick={pick} onHover={setHover}/>
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

const DateRangePill = ({ value, onChange, label }) => {
  const [open, setOpen] = useState(false);
  // value may be omitted by callers — fall back to global default
  const cur = value || window.__nb_dateRange || DEFAULT_RANGE;

  const handleChange = (r) => {
    window.__nb_dateRange = r;
    onChange && onChange(r);
    // broadcast for views that didn't pass a setter
    window.dispatchEvent(new CustomEvent('nb-range-change', { detail: r }));
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-line bg-white text-sm font-medium hover:bg-bg2">
        <Icon name="calendar" size={14} className="text-mute"/>
        <span>{label || formatRangeLabel(cur.start, cur.end)}</span>
        <Icon name="chevronD" size={14} className={`text-mute transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      <DateRangePicker open={open} onClose={() => setOpen(false)} value={cur} onChange={handleChange}/>
    </div>
  );
};

// --------- Export utilities (CSV + Excel-compatible) ---------
const downloadBlob = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
};

const csvEscape = (v) => {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
};

const rangeStamp = (r) => {
  if (!r || !r.start) return 'all';
  const f = (d) => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return f(r.start) + '-' + f(r.end || r.start);
};

const exportCSV = (rows, filename, range) => {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(csvEscape).join(',')];
  for (const r of rows) lines.push(headers.map(h => csvEscape(r[h])).join(','));
  // Excel UTF-8 BOM
  const content = '\uFEFF' + lines.join('\r\n');
  downloadBlob(content, `${filename}_${rangeStamp(range)}.csv`, 'text/csv;charset=utf-8;');
};

// Excel-compatible export via SpreadsheetML XML (opens cleanly in Excel/Numbers)
const exportExcel = (rows, filename, range, sheetName = 'Data') => {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const xmlEsc = (v) => String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const typeOf = (v) => typeof v === 'number' && isFinite(v) ? 'Number' : 'String';
  const rowsXml = rows.map(r => '<Row>' + headers.map(h => {
    const v = r[h];
    return `<Cell><Data ss:Type="${typeOf(v)}">${xmlEsc(v)}</Data></Cell>`;
  }).join('') + '</Row>').join('');
  const headerXml = '<Row>' + headers.map(h =>
    `<Cell ss:StyleID="hdr"><Data ss:Type="String">${xmlEsc(h)}</Data></Cell>`
  ).join('') + '</Row>';

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="hdr"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2E4191" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="${xmlEsc(sheetName)}">
  <Table>${headerXml}${rowsXml}</Table>
 </Worksheet>
</Workbook>`;
  downloadBlob(xml, `${filename}_${rangeStamp(range)}.xls`, 'application/vnd.ms-excel');
};

// Filter helper: parse "1 Mei 2026, 08:00" style dates from dummy data into proper Date
const parseTxnDate = (s) => {
  const m = /(\d+)\s+(\w+)\s+(\d{4})/.exec(s || '');
  if (!m) return null;
  const monIdx = MONTHS_ID.findIndex(x => x.toLowerCase().startsWith(m[2].toLowerCase().slice(0,3)));
  if (monIdx < 0) return null;
  return new Date(+m[3], monIdx, +m[1]);
};

const filterByRange = (rows, range, dateKey = 'date') => {
  if (!range || !range.start) return rows;
  const s = new Date(range.start); s.setHours(0,0,0,0);
  const e = new Date(range.end || range.start); e.setHours(23,59,59,999);
  return rows.filter(r => {
    const d = parseTxnDate(r[dateKey]);
    return d ? (d >= s && d <= e) : true;
  });
};

// --------- Sparkline / mini bar chart ---------
const BarChart = ({ data, height = 160, accent='brand', labels }) => {
  const max = Math.max(...data);
  return (
    <div className="w-full">
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((v, i) => {
          const h = (v / max) * (height - 24);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="invisible group-hover:visible absolute -top-7 bg-ink text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                {fmtIDRShort(v)}
              </div>
              <div
                className={'w-full rounded-t-md transition-all group-hover:opacity-80 ' + (accent === 'brand' ? 'bg-gradient-to-t from-brand-600 to-sky2-400' : 'bg-brand-600')}
                style={{ height: h }}/>
            </div>
          );
        })}
      </div>
      {labels && (
        <div className="mt-2 flex gap-1 text-[10px] text-mute">
          {labels.map((l, i) => <div key={i} className="flex-1 text-center">{l}</div>)}
        </div>
      )}
    </div>
  );
};

// Simple line chart svg
let _lcId = 0;
const LineChart = ({ data, height = 180, color = '#2E4191', secondary = '#38B6FF', fill = true }) => {
  const gradId = useMemo(() => 'lc-g' + (++_lcId), []);
  const w = 600, h = height;
  const max = Math.max(...data) * 1.15;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - (v / max) * (h - 30) - 10]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const dArea = d + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={secondary} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={secondary} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* grid */}
      {[0,1,2,3].map(i => (
        <line key={i} x1="0" x2={w} y1={10 + i*(h-30)/3} y2={10 + i*(h-30)/3} stroke="#E2E8F0" strokeDasharray="3 4"/>
      ))}
      {fill && <path d={dArea} fill={`url(#${gradId})`}/>}
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      {pts.filter((_,i)=>i%4===0).map((p,i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="white" stroke={color} strokeWidth="2"/>
      ))}
    </svg>
  );
};

// Donut chart
const Donut = ({ data, size = 160, thickness = 22 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size/2 - thickness/2;
  const c = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={thickness}/>
      {data.map((d, i) => {
        const len = (d.value / total) * c;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${len} ${c}`} strokeDashoffset={-off}
            transform={`rotate(-90 ${size/2} ${size/2})`}/>
        );
        off += len;
        return el;
      })}
      <text x={size/2} y={size/2 - 4} textAnchor="middle" className="fill-ink" style={{fontSize: 18, fontWeight: 700}}>
        {fmtNum(total)}
      </text>
      <text x={size/2} y={size/2 + 14} textAnchor="middle" className="fill-mute" style={{fontSize: 10}}>
        TOTAL
      </text>
    </svg>
  );
};

// --------- Campaign thumbnail (gradient placeholder w/ icon) ---------
const CampaignThumb = ({ c, className = '' }) => (
  <div className={'relative rounded-xl overflow-hidden ' + className} style={{ background: c.thumb }}>
    <div className="absolute inset-0 flex items-center justify-center text-white/80">
      <Icon name={c.icon} size={56} strokeWidth={1.2}/>
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"/>
    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
      <Badge tone="outline" size="sm" className="bg-white/90 backdrop-blur">
        {c.category}
      </Badge>
      <Badge tone={c.status === 'Running' ? 'ok' : c.status === 'Ended' ? 'slate' : c.status === 'Published' ? 'sky' : 'warn'} size="sm" className="bg-white/90 backdrop-blur">
        {c.status}
      </Badge>
    </div>
  </div>
);

// --------- UTM Grid (label : value rows, styled per spec) ---------
const UtmGrid = ({ utm = {}, editable = false, onChange }) => {
  const fields = [
    { key: 'source',   label: 'utm_source'   },
    { key: 'medium',   label: 'utm_medium'   },
    { key: 'content',  label: 'utm_content'  },
    { key: 'campaign', label: 'utm_campaign' },
    { key: 'term',     label: 'utm_term'     },
    { key: 'id',       label: 'utm_id'       },
  ];
  return (
    <div className="grid grid-cols-1 gap-2.5">
      {fields.map((f) => {
        const v = utm[f.key];
        return (
          <div key={f.key} className="grid grid-cols-[110px_12px_1fr] sm:grid-cols-[140px_12px_1fr] items-center gap-2">
            <div className="text-sm font-bold text-ink/85">{f.label}</div>
            <div className="text-sm text-mute">:</div>
            <div className="relative">
              {editable ? (
                <input
                  value={v || ''}
                  onChange={(e) => onChange && onChange(f.key, e.target.value)}
                  placeholder={v ? '' : '—'}
                  className="w-full rounded-md bg-brand-50/70 border border-brand-100 px-3 py-2 text-sm font-mono text-brand-700 placeholder:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:bg-white"
                />
              ) : (
                <div className="w-full rounded-md bg-brand-50/70 border border-brand-100 px-3 py-2 text-sm font-mono text-brand-700 min-h-[36px]">
                  {v || <span className="text-brand-300">—</span>}
                </div>
              )}
              <span className="absolute bottom-0.5 right-1 text-brand-300 pointer-events-none">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
const Modal = ({ open, onClose, title, children, size='md', footer }) => {
  if (!open) return null;
  const sizes = { sm:'max-w-md', md:'max-w-xl', lg:'max-w-3xl', xl:'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm"/>
      <div className={`relative bg-white rounded-2xl shadow-pop w-full ${sizes[size]} max-h-[92vh] flex flex-col`} onMouseDown={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-bg2 flex items-center justify-center text-mute">
            <Icon name="close" size={18}/>
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-line bg-bg2 rounded-b-2xl flex items-center justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
};

// --------- Invoice Modal ---------
const InvoiceModal = ({ txn, onClose, onCopy }) => {
  if (!txn) return null;
  const Field = ({ label, value, mono }) => (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-mute font-medium">{label}</div>
      <div className={'mt-0.5 text-sm text-ink ' + (mono ? 'font-mono' : 'font-medium')}>{value || '—'}</div>
    </div>
  );
  return (
    <Modal open={true} onClose={onClose} title="Detail Invoice" size="lg"
      footer={<>
        <Btn variant="outline" tone="ink" icon="copy" onClick={() => onCopy && onCopy(txn.id)}>Salin invoice</Btn>
        <Btn variant="outline" tone="ink" icon="refresh">Update status</Btn>
        <Btn icon="wa">Kirim follow-up WA</Btn>
      </>}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-line">
          <div>
            <div className="text-xs text-mute">Kode Invoice</div>
            <div className="mt-1 font-mono text-2xl font-bold text-ink">{txn.id}</div>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={txn.status}/>
              <span className="text-xs text-mute">{txn.date}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-mute">Nominal Donasi</div>
            <div className="mt-1 text-3xl font-bold text-brand-600">{fmtIDR(txn.amount)}</div>
            <div className="mt-1 text-xs text-mute">via {txn.method}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Donatur" value={txn.anon ? 'Anonim (Hamba Allah)' : txn.donor}/>
          <Field label="Campaign" value={txn.campaign}/>
          <Field label="WhatsApp" value={txn.whatsapp} mono/>
          <Field label="Email" value={txn.email} mono/>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-mute font-semibold mb-2">Pesan / Doa Donatur</div>
          <div className="bg-bg2 rounded-xl p-3 text-sm text-ink italic">"{txn.message}"</div>
        </div>

        <div className="rounded-xl border border-line p-4">
          <div className="text-xs uppercase tracking-wider text-mute font-semibold mb-3">UTM & Ads Tracking</div>
          <UtmGrid utm={txn.utm}/>

          <div className="mt-4 pt-4 border-t border-line">
            <div className="text-[11px] uppercase tracking-wider text-mute font-semibold mb-2">Click IDs</div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="fbclid" value={txn.utm.source === 'facebook' ? 'IwAR0…xy3' : '—'} mono/>
              <Field label="gclid"  value={txn.utm.source === 'google'   ? 'CjwK…aBc'  : '—'} mono/>
              <Field label="ttclid" value={txn.utm.source === 'tiktok'   ? 'E.C.P…29'   : '—'} mono/>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-mute font-semibold mb-2">Catatan CS</div>
          <textarea defaultValue={txn.note}
            className="w-full min-h-[80px] rounded-xl border border-line bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
            placeholder="Tambahkan catatan internal untuk transaksi ini…"/>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="outline">Sudah dihubungi WA</Badge>
            <Badge tone="outline">Menunggu transfer</Badge>
            <Badge tone="outline">Donasi berulang</Badge>
            <Badge tone="outline">+ Tag</Badge>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// --------- Toast ---------
const Toast = ({ message, tone='ok' }) => {
  if (!message) return null;
  const tones = { ok:'bg-emerald-600', bad:'bg-rose-600', ink:'bg-ink' };
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`${tones[tone]} text-white px-4 py-2.5 rounded-xl shadow-pop text-sm font-medium flex items-center gap-2`}>
        <Icon name="check" size={16} strokeWidth={2.4}/>
        {message}
      </div>
    </div>
  );
};

// --------- Page header ---------
const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
    <div>
      <h1 className="text-2xl font-bold text-ink tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

// --------- Empty state ---------
const Empty = ({ icon='inbox', title='Belum ada data', sub='', action }) => (
  <div className="text-center py-12">
    <div className="mx-auto h-14 w-14 rounded-2xl bg-bg2 flex items-center justify-center text-mute mb-3">
      <Icon name={icon} size={26}/>
    </div>
    <div className="font-semibold text-ink">{title}</div>
    {sub && <div className="mt-1 text-sm text-mute">{sub}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// --------- Tabs ---------
const Tabs = ({ tabs, value, onChange, variant='pill' }) => {
  if (variant === 'underline') {
    return (
      <div className="flex items-center gap-6 border-b border-line">
        {tabs.map((t) => (
          <button key={t.value} onClick={() => onChange(t.value)}
            className={`relative py-2.5 text-sm font-semibold transition-colors ${value === t.value ? 'text-brand-600' : 'text-mute hover:text-ink'}`}>
            {t.label}{t.count !== undefined && <span className={`ml-1.5 text-xs ${value === t.value ? 'text-brand-600' : 'text-mute'}`}>({t.count})</span>}
            {value === t.value && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-600 rounded-full"/>}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="inline-flex p-1 bg-bg2 rounded-lg border border-line">
      {tabs.map((t) => (
        <button key={t.value} onClick={() => onChange(t.value)}
          className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${value === t.value ? 'bg-white text-ink shadow-sm' : 'text-mute hover:text-ink'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
};

// --------- Toggle ---------
const Toggle = ({ value, onChange, label, sub }) => (
  <label className="flex items-start justify-between gap-3 cursor-pointer">
    <div>
      {label && <div className="text-sm font-semibold text-ink">{label}</div>}
      {sub && <div className="text-xs text-mute mt-0.5">{sub}</div>}
    </div>
    <button type="button" onClick={() => onChange(!value)} className={`relative shrink-0 h-6 w-11 rounded-full transition-colors ${value ? 'bg-brand-600' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-all ${value ? 'left-[22px]' : 'left-0.5'}`}/>
    </button>
  </label>
);

// --------- Source pill (Meta/Google/Tiktok) ---------
const SourcePill = ({ source }) => {
  const map = {
    facebook:  { label:'Meta Ads',  bg:'bg-[#1877F2]', tx:'text-white' },
    instagram: { label:'Instagram', bg:'bg-gradient-to-br from-pink-500 via-rose-500 to-amber-400', tx:'text-white' },
    google:    { label:'Google',    bg:'bg-white border border-line', tx:'text-ink' },
    tiktok:    { label:'TikTok',    bg:'bg-black', tx:'text-white' },
    '(direct)':{ label:'Direct',    bg:'bg-slate-100', tx:'text-slate-700' },
    organic:   { label:'Organic',   bg:'bg-emerald-50 text-emerald-700' },
  };
  const m = map[source] || map['(direct)'];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.bg} ${m.tx}`}>{m.label}</span>;
};

// --------- Logo ---------
const Logo = ({ size = 28 }) => (
  <div className="flex items-center gap-2">
    <img src="/assets/logo-niatbaik.png" alt="NIATBAIK.ORG" style={{ height: size }} className="block"/>
  </div>
);

// expose
Object.assign(window, {
  AppCtx, useApp, Card, StatCard, Badge, StatusBadge, RoleBadge, Progress,
  Btn, SearchInput, Select, DateRangePill, DateRangePicker, BarChart, LineChart, Donut,
  CampaignThumb, Modal, InvoiceModal, Toast, PageHeader, Empty, Tabs, Toggle, SourcePill, Logo, UtmGrid,
  exportCSV, exportExcel, filterByRange, parseTxnDate, formatRangeLabel, DEFAULT_RANGE,
});

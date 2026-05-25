// Shared UI components — merged design + real API integration
const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

// ===================== Formatters =====================
// Primary formatters live in data.jsx (fmtIDR, fmtShort, fmtNum).
// We add aliases + extras here so every view can import from one place.
const fmtIDRShort = (n) => {
  if (n >= 1e9) return 'Rp' + (n/1e9).toFixed(1).replace(/\.0$/,'') + 'M';
  if (n >= 1e6) return 'Rp' + (n/1e6).toFixed(1).replace(/\.0$/,'') + 'jt';
  if (n >= 1e3) return 'Rp' + (n/1e3).toFixed(0) + 'rb';
  return 'Rp' + (n||0);
};
const fmtPct = (n) => (n*100).toFixed(1).replace(/\.0$/,'') + '%';

// ===================== App context =====================
const AppCtx = createContext({});
const useApp = () => useContext(AppCtx);

// ===================== Logo =====================
function Logo({ size=28, full=true, white=false }){
  return (
    <div className="flex items-center gap-2">
      <img src="assets/logo-niatbaik.png" alt="NIATBAIK.ORG" style={{height: size}} />
    </div>
  );
}

// ===================== Badge =====================
function Badge({ children, tone='slate', size='sm', dot, className='' }){
  const tones = {
    slate:'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
    brand:'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
    cyan:'bg-cyan2-50 text-cyan2-700 dark:bg-cyan2-900/40 dark:text-cyan2-200',
    sky:'bg-sky2-50 text-sky2-600 dark:bg-sky2-900/40 dark:text-sky2-200',
    green:'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    ok:'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    amber:'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    warn:'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    red:'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    bad:'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    gray:'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    purple:'bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    outline:'border border-line text-ink bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  };
  const sizes = { sm:'text-[10px] px-1.5 py-0.5', md:'text-xs px-2 py-1', lg:'text-sm px-2.5 py-1' };
  const dotColors = { brand:'#2E4191', cyan:'#38B6FF', sky:'#38B6FF', green:'#16A34A', ok:'#16A34A', amber:'#F59E0B', warn:'#F59E0B', red:'#DC2626', bad:'#DC2626', slate:'#64748B', gray:'#64748B', purple:'#7C3AED', outline:'currentColor' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${tones[tone]||tones.slate} ${sizes[size]||sizes.sm} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{background:dotColors[tone]||'currentColor'}}/>}
      {children}
    </span>
  );
}

// ===================== StatusBadge =====================
function StatusBadge({ status, size }){
  const map = {
    'Draft':     { tone:'slate',  label:'Draft' },
    'Published': { tone:'sky',    label:'Published' },
    'Running':   { tone:'ok',     label:'Running', dot:true },
    'Ended':     { tone:'slate',  label:'Ended' },
    'Sukses':    { tone:'ok',     label:'Sukses', dot:true },
    'Pending':   { tone:'warn',   label:'Pending', dot:true },
    'Gagal':     { tone:'bad',    label:'Gagal', dot:true },
    'Paid':      { tone:'ok',     label:'Paid', dot:true },
    'paid':      { tone:'ok',     label:'Paid', dot:true },
    'Failed':    { tone:'bad',    label:'Failed', dot:true },
    'pending':   { tone:'warn',   label:'Pending', dot:true },
    'active':    { tone:'ok',     label:'Active', dot:true },
    'Active':    { tone:'ok',     label:'Active', dot:true },
    'inactive':  { tone:'slate',  label:'Inactive' },
    'Not Connected':{ tone:'gray', label:'Not Connected' },
    'Error':     { tone:'bad',    label:'Error', dot:true },
  };
  const m = map[status] || { tone:'slate', label: status };
  return <Badge tone={m.tone} size={size} dot={m.dot}>{m.label}</Badge>;
}

// ===================== RoleBadge =====================
function RoleBadge({ role }){
  const m = { Admin:'brand', CS:'sky', Advertiser:'purple' };
  return <Badge tone={m[role]||'slate'}>{role}</Badge>;
}

// ===================== Button (legacy) =====================
function Button({ children, variant='primary', size='md', as='button', icon, iconRight, full, className='', ...rest }){
  const sizes = { sm:'h-9 px-3 text-sm', md:'h-10 px-4 text-sm', lg:'h-12 px-5 text-[15px]', xl:'h-14 px-6 text-base' };
  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm',
    cyan: 'bg-cyan2-400 hover:bg-cyan2-500 text-white shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 border border-line text-ink dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700',
    ghost: 'hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-200',
    soft: 'bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200 dark:hover:bg-brand-900/60',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  };
  const Cmp = as;
  return (
    <Cmp className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition ${sizes[size]} ${variants[variant]} ${full?'w-full':''} ${className}`} {...rest}>
      {icon && <span className="-ml-0.5">{icon}</span>}
      {children}
      {iconRight && <span className="-mr-0.5">{iconRight}</span>}
    </Cmp>
  );
}

// ===================== Btn (design system) =====================
function Btn({ children, variant='solid', tone='brand', size='md', icon, iconRight, full, className='', ...rest }){
  const sizes = { sm:'text-xs px-2.5 py-1.5 gap-1.5', md:'text-sm px-3.5 py-2 gap-2', lg:'text-base px-5 py-3 gap-2' };
  const tones = {
    brand: {
      solid:   'bg-brand-600 hover:bg-brand-700 text-white shadow-sm dark:bg-brand-500 dark:hover:bg-brand-600',
      outline: 'border border-brand-600 text-brand-600 hover:bg-brand-50 dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-900/30',
      ghost:   'text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/30',
    },
    sky: {
      solid:   'bg-sky2-400 hover:bg-sky2-500 text-white dark:bg-sky2-500 dark:hover:bg-sky2-600',
      outline: 'border border-sky2-400 text-sky2-500 hover:bg-sky2-50 dark:border-sky2-500 dark:text-sky2-300 dark:hover:bg-sky2-900/30',
      ghost:   'text-sky2-500 hover:bg-sky2-50 dark:text-sky2-300 dark:hover:bg-sky2-900/30',
    },
    ink: {
      solid:   'bg-ink hover:bg-slate-800 text-white dark:bg-slate-200 dark:hover:bg-slate-100 dark:text-ink',
      outline: 'border border-line text-ink hover:bg-bg2 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
      ghost:   'text-ink hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
    },
    bad: {
      solid:   'bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-500 dark:hover:bg-rose-600',
      outline: 'border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/30',
      ghost:   'text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/30',
    },
    ok: {
      solid:   'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600',
      outline: 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30',
      ghost:   'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30',
    },
  };
  const toneCfg = tones[tone] || tones.brand;
  return (
    <button className={`inline-flex items-center justify-center font-semibold rounded-lg transition-colors ${sizes[size]} ${toneCfg[variant]||toneCfg.solid} ${full?'w-full':''} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size==='lg'?18:16}/>}
      {children}
      {iconRight && <Icon name={iconRight} size={size==='lg'?18:16}/>}
    </button>
  );
}

// ===================== IconBtn =====================
function IconBtn({ children, className='', ...rest }){
  return (
    <button className={`h-10 w-10 inline-flex items-center justify-center rounded-xl border border-line bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-200 ${className}`} {...rest}>
      {children}
    </button>
  );
}

// ===================== Card =====================
function Card({ children, className='', as='div', padded=true, ...rest }){
  const Cmp = as;
  return <Cmp className={`bg-white rounded-2xl border border-line shadow-card dark:bg-slate-900 dark:border-slate-800 ${padded?'p-5':''} ${className}`} {...rest}>{children}</Cmp>;
}

// ===================== StatCard =====================
function StatCard({ icon, label, value, delta, deltaTone='up', accent='brand', sub }){
  const accents = {
    brand:  'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300',
    sky:    'bg-sky2-50 text-sky2-500 dark:bg-sky2-900/40 dark:text-sky2-300',
    cyan:   'bg-cyan2-50 text-cyan2-600 dark:bg-cyan2-900/40 dark:text-cyan2-300',
    ok:     'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
    green:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
    warn:   'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
    amber:  'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
    bad:    'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
    red:    'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
    ink:    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    slate:  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted uppercase tracking-wider dark:text-slate-400">{label}</div>
          <div className="mt-2 text-2xl font-bold text-ink dark:text-slate-100 tnum truncate">{value}</div>
          {sub && <div className="mt-1 text-xs text-muted dark:text-slate-400">{sub}</div>}
        </div>
        {icon && (
          <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${accents[accent]||accents.brand}`}>
            {typeof icon === 'string' ? <Icon name={icon} size={20} strokeWidth={2}/> : icon}
          </div>
        )}
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1 font-semibold ${deltaTone==='up'?'text-emerald-600 dark:text-emerald-400':'text-rose-600 dark:text-rose-400'}`}>
            <Icon name={deltaTone==='up'?'arrowUp':'arrowDown'} size={12} strokeWidth={2.4}/>
            {delta}
          </span>
          <span className="text-muted dark:text-slate-400">vs minggu lalu</span>
        </div>
      )}
    </Card>
  );
}

// ===================== Stat (legacy, wraps StatCard) =====================
function Stat({ label, value, sub, icon, tone='brand', trend }){
  return (
    <StatCard
      label={label}
      value={value}
      sub={sub}
      icon={icon}
      accent={tone}
      delta={trend?.value}
      deltaTone={trend?.up ? 'up' : 'down'}
    />
  );
}

// ===================== Field / Input =====================
function Field({ label, hint, required, children }){
  return (
    <label className="block">
      {label && <div className="mb-1.5 text-sm font-medium text-ink dark:text-slate-200">{label} {required && <span className="text-rose-500">*</span>}</div>}
      {children}
      {hint && <div className="mt-1 text-xs text-muted dark:text-slate-400">{hint}</div>}
    </label>
  );
}

function Input({ icon, suffix, className='', ...rest }){
  return (
    <div className={`relative flex items-center ${className}`}>
      {icon && <span className="absolute left-3 text-slate-400">{icon}</span>}
      <input className={`w-full h-11 ${icon?'pl-10':'pl-3.5'} ${suffix?'pr-12':'pr-3.5'} rounded-xl bg-white border border-line text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100`} {...rest}/>
      {suffix && <span className="absolute right-3 text-xs text-muted dark:text-slate-400">{suffix}</span>}
    </div>
  );
}

// ===================== SearchInput =====================
function SearchInput({ placeholder='Cari...', value, onChange, className='', size='md' }){
  const sz = size==='sm' ? 'h-9 text-sm' : 'h-10 text-sm';
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-slate-400"/>
      <input
        className={`w-full ${sz} rounded-lg border border-line bg-white pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100`}
        placeholder={placeholder} value={value} onChange={(e)=>onChange&&onChange(e.target.value)}
      />
    </div>
  );
}

// ===================== Select =====================
function Select({ value, onChange, options, children, className='', icon, ...rest }){
  // Supports both options array prop (design) and children (legacy)
  if (options) {
    return (
      <div className={`relative ${className}`}>
        {icon && <Icon name={icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none dark:text-slate-400"/>}
        <select
          value={value} onChange={(e)=>onChange&&onChange(e.target.value)}
          className={`appearance-none w-full h-10 rounded-lg border border-line bg-white ${icon?'pl-9':'pl-3'} pr-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100`} {...rest}>
          {options.map((o)=> typeof o==='string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Icon name="chevronD" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none dark:text-slate-400"/>
      </div>
    );
  }
  return (
    <div className={`relative ${className}`}>
      <select className="appearance-none w-full h-11 pl-3.5 pr-10 rounded-xl bg-white border border-line text-ink focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" {...rest}>
        {children}
      </select>
      <Icon name="chevronD" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none dark:text-slate-400"/>
    </div>
  );
}

// ===================== Toggle =====================
function Toggle({ checked, value, onChange, label, sub }){
  // Support both checked (legacy) and value (design) props
  const isOn = checked !== undefined ? checked : value;
  return (
    <label className="flex items-start justify-between gap-3 cursor-pointer">
      {(label||sub) && <div className="flex-1">
        {label && <div className="text-sm font-semibold text-ink dark:text-slate-200">{label}</div>}
        {sub && <div className="text-xs text-muted mt-0.5 dark:text-slate-400">{sub}</div>}
      </div>}
      <button onClick={()=>onChange&&onChange(!isOn)} type="button" className={`relative shrink-0 w-11 h-6 rounded-full transition ${isOn?'bg-brand-600':'bg-slate-200 dark:bg-slate-700'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isOn?'left-[22px]':'left-0.5'}`}/>
      </button>
    </label>
  );
}

// ===================== Progress / ProgressBar =====================
function Progress({ value, max, height='h-2', showLabel=false, tone='brand' }){
  const pct = Math.min(100, (value/max)*100);
  const toneCls = tone==='brand'
    ? 'bg-gradient-to-r from-brand-600 to-sky2-400'
    : tone==='ok'||tone==='green' ? 'bg-emerald-500'
    : tone==='cyan' ? 'bg-cyan2-400'
    : 'bg-slate-400';
  return (
    <div>
      <div className={`relative w-full ${height} bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden`}>
        <div className={`absolute inset-y-0 left-0 ${toneCls} rounded-full transition-all`} style={{width: pct+'%'}}/>
      </div>
      {showLabel && (
        <div className="mt-1.5 flex justify-between text-xs text-muted dark:text-slate-400">
          <span><b className="text-ink dark:text-slate-200">{Math.round(pct)}%</b> tercapai</span>
          <span>dari {fmtIDRShort(max)}</span>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ value, max, color='brand', size='md', label }){
  const pct = Math.min(100, Math.round((value/max)*100));
  const colors = { brand:'bg-brand-600', cyan:'bg-cyan2-400', green:'bg-emerald-500', ok:'bg-emerald-500' };
  const h = size==='sm'?'h-1.5':size==='lg'?'h-3':'h-2';
  return (
    <div>
      <div className={`w-full ${h} bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden`}>
        <div className={`${h} ${colors[color]||colors.brand} rounded-full relative`} style={{width: pct+'%'}}>
          <div className="absolute inset-0 shimmer"></div>
        </div>
      </div>
      {label && <div className="mt-1.5 text-xs text-muted dark:text-slate-400">{label}</div>}
    </div>
  );
}

// ===================== Avatar =====================
function Avatar({ name, initials, size=32, anon }){
  const seed = (name||'').charCodeAt(0) + (name||'').length;
  const init = anon ? 'HA' : (initials || (name||'?').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase());
  return <img src={avatarSvg(init, seed)} alt={name} style={{width:size,height:size}} className="rounded-full"/>;
}

// ===================== DateRange helpers =====================
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const DAYS_ID = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

const fmtDate = (d) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
const inRange = (d, s, e) => s && e && d >= s && d <= e;

function formatRangeLabel(start, end){
  if (!start) return 'Pilih tanggal';
  if (!end || sameDay(start, end)) return fmtDate(start);
  if (start.getMonth()===end.getMonth() && start.getFullYear()===end.getFullYear()){
    return `${start.getDate()}–${end.getDate()} ${MONTHS_SHORT[start.getMonth()]} ${start.getFullYear()}`;
  }
  if (start.getFullYear()===end.getFullYear()){
    return `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${start.getFullYear()}`;
  }
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

const DEFAULT_RANGE = { start: new Date(2026, 4, 1), end: new Date(2026, 4, 31) };
window.__nb_dateRange = { ...DEFAULT_RANGE };

// Parse "1 Mei 2026, 08:00" style dates
function parseTxnDate(s){
  const m = /(\d+)\s+(\w+)\s+(\d{4})/.exec(s||'');
  if (!m) return null;
  const monIdx = MONTHS_ID.findIndex(x => x.toLowerCase().startsWith(m[2].toLowerCase().slice(0,3)));
  if (monIdx < 0) return null;
  return new Date(+m[3], monIdx, +m[1]);
}

function filterByRange(rows, range, dateKey='date'){
  if (!range || !range.start) return rows;
  const s = new Date(range.start); s.setHours(0,0,0,0);
  const e = new Date(range.end || range.start); e.setHours(23,59,59,999);
  return rows.filter(r => {
    const d = parseTxnDate(r[dateKey]);
    return d ? (d >= s && d <= e) : true;
  });
}

// ===================== CalendarGrid =====================
function CalendarGrid({ cursor, range, hover, onPick, onHover, minDate, maxDate }){
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);
  const cells = [];
  for (let i=0; i<startDay; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_ID.map((d)=><div key={d} className="text-[10px] font-bold uppercase text-muted text-center py-1 dark:text-slate-400">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d,i)=>{
          if (!d) return <div key={i}/>;
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
              ? 'bg-brand-100 text-brand-700 font-semibold dark:bg-brand-900/40 dark:text-brand-200'
              : isToday
                ? 'bg-bg2 text-brand-600 font-bold ring-1 ring-brand-200 dark:bg-slate-800 dark:text-brand-300'
                : 'hover:bg-bg2 text-ink dark:text-slate-200 dark:hover:bg-slate-800';
          return (
            <button key={i} disabled={disabled} onClick={()=>!disabled&&onPick(d)} onMouseEnter={()=>onHover(d)}
              className={`h-8 w-full rounded-md text-xs transition-colors relative ${cls} ${disabled?'opacity-30 cursor-not-allowed':'cursor-pointer'} ${isInRange && !isStart && !isEnd ? 'rounded-none' : ''} ${isStart && !sameDay(range.start, range.end||previewEnd) ? 'rounded-r-none' : ''} ${isEnd && !sameDay(range.start, range.end||previewEnd) ? 'rounded-l-none' : ''}`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===================== DateRangePicker =====================
function DateRangePicker({ open, anchor, onClose, value, onChange }){
  const [draft, setDraft] = useState({ start: value?.start||null, end: value?.end||null });
  const [hover, setHover] = useState(null);
  const [cursorL, setCursorL] = useState(()=>{
    const d = value?.start ? new Date(value.start) : new Date();
    d.setDate(1);
    return d;
  });
  const cursorR = useMemo(()=>{
    const d = new Date(cursorL); d.setMonth(d.getMonth()+1); return d;
  }, [cursorL]);

  useEffect(()=>{
    if (open) setDraft({ start: value?.start||null, end: value?.end||null });
  }, [open]);

  if (!open) return null;

  const pick = (d)=>{
    if (!draft.start || (draft.start && draft.end)){
      setDraft({ start: d, end: null });
    } else {
      if (d < draft.start) setDraft({ start: d, end: draft.start });
      else setDraft({ start: draft.start, end: d });
    }
  };

  const presets = [
    { label:'Hari ini', range:()=>{ const d=new Date(); d.setHours(0,0,0,0); return {start:d,end:d}; }},
    { label:'Kemarin', range:()=>{ const d=new Date(); d.setDate(d.getDate()-1); d.setHours(0,0,0,0); return {start:d,end:d}; }},
    { label:'7 hari terakhir', range:()=>{ const e=new Date(); e.setHours(0,0,0,0); const s=new Date(e); s.setDate(e.getDate()-6); return {start:s,end:e}; }},
    { label:'14 hari terakhir', range:()=>{ const e=new Date(); e.setHours(0,0,0,0); const s=new Date(e); s.setDate(e.getDate()-13); return {start:s,end:e}; }},
    { label:'30 hari terakhir', range:()=>{ const e=new Date(); e.setHours(0,0,0,0); const s=new Date(e); s.setDate(e.getDate()-29); return {start:s,end:e}; }},
    { label:'90 hari terakhir', range:()=>{ const e=new Date(); e.setHours(0,0,0,0); const s=new Date(e); s.setDate(e.getDate()-89); return {start:s,end:e}; }},
    { label:'Bulan ini', range:()=>{ const d=new Date(); return {start:new Date(d.getFullYear(),d.getMonth(),1),end:new Date(d.getFullYear(),d.getMonth()+1,0)}; }},
    { label:'Bulan lalu', range:()=>{ const d=new Date(); return {start:new Date(d.getFullYear(),d.getMonth()-1,1),end:new Date(d.getFullYear(),d.getMonth(),0)}; }},
    { label:'Quarter ini', range:()=>{ const d=new Date(); const q=Math.floor(d.getMonth()/3); return {start:new Date(d.getFullYear(),q*3,1),end:new Date(d.getFullYear(),q*3+3,0)}; }},
    { label:'Tahun ini', range:()=>{ const d=new Date(); return {start:new Date(d.getFullYear(),0,1),end:new Date(d.getFullYear(),11,31)}; }},
    { label:'Sepanjang waktu', range:()=>({start:new Date(2024,0,1),end:new Date()}) },
  ];

  const apply = ()=>{
    if (draft.start && draft.end){ onChange(draft); onClose(); }
    else if (draft.start){ onChange({start:draft.start,end:draft.start}); onClose(); }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}/>
      <div className="fixed sm:absolute z-50 inset-x-0 bottom-0 sm:inset-auto sm:mt-2 sm:right-0 sm:left-auto bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-pop border border-line dark:border-slate-700 overflow-hidden sm:w-[640px] max-h-[85vh] sm:max-h-none overflow-y-auto">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center py-2"><div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600"/></div>
        {/* Mobile presets row */}
        <div className="sm:hidden px-3 pb-2 flex gap-1.5 overflow-x-auto nice-scroll">
          {presets.slice(0,6).map((p)=>(
            <button key={p.label} onClick={()=>setDraft(p.range())}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-ink dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600">
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex">
          <div className="w-40 border-r border-line dark:border-slate-700 bg-bg2/50 dark:bg-slate-800/50 py-2 px-2 hidden sm:block">
            {presets.map((p)=>(
              <button key={p.label} onClick={()=>setDraft(p.range())}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold text-ink/80 hover:bg-white hover:text-brand-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-brand-300">
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex-1 p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <button onClick={()=>{const d=new Date(cursorL);d.setMonth(d.getMonth()-1);setCursorL(d);}}
                className="h-7 w-7 rounded-md hover:bg-bg2 dark:hover:bg-slate-800 text-muted dark:text-slate-400 flex items-center justify-center"><Icon name="chevronL" size={14}/></button>
              <div className="hidden sm:grid grid-cols-2 gap-8 flex-1 mx-2 text-center">
                <div className="text-sm font-extrabold text-ink dark:text-slate-100">{MONTHS_ID[cursorL.getMonth()]} {cursorL.getFullYear()}</div>
                <div className="text-sm font-extrabold text-ink dark:text-slate-100">{MONTHS_ID[cursorR.getMonth()]} {cursorR.getFullYear()}</div>
              </div>
              <div className="sm:hidden flex-1 text-center text-sm font-extrabold text-ink dark:text-slate-100">{MONTHS_ID[cursorL.getMonth()]} {cursorL.getFullYear()}</div>
              <button onClick={()=>{const d=new Date(cursorL);d.setMonth(d.getMonth()+1);setCursorL(d);}}
                className="h-7 w-7 rounded-md hover:bg-bg2 dark:hover:bg-slate-800 text-muted dark:text-slate-400 flex items-center justify-center"><Icon name="chevronR" size={14}/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" onMouseLeave={()=>setHover(null)}>
              <CalendarGrid cursor={cursorL} range={draft} hover={hover} onPick={pick} onHover={setHover}/>
              <div className="hidden sm:block"><CalendarGrid cursor={cursorR} range={draft} hover={hover} onPick={pick} onHover={setHover}/></div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-line dark:border-slate-700 bg-bg2/40 dark:bg-slate-800/40">
          <div className="text-xs dark:text-slate-300">
            <span className="text-muted dark:text-slate-400">Mulai:</span>{' '}
            <b className="text-ink dark:text-slate-100">{draft.start ? fmtDate(draft.start) : '—'}</b>
            <span className="mx-2 text-muted dark:text-slate-400">→</span>
            <span className="text-muted dark:text-slate-400">Akhir:</span>{' '}
            <b className="text-ink dark:text-slate-100">{draft.end ? fmtDate(draft.end) : '—'}</b>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-md text-xs font-bold text-ink hover:bg-white border border-line dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700">Batal</button>
            <button onClick={apply} disabled={!draft.start} className={`px-4 py-1.5 rounded-md text-xs font-bold text-white ${draft.start?'bg-brand-600 hover:bg-brand-700':'bg-slate-300 cursor-not-allowed dark:bg-slate-600'}`}>Terapkan</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ===================== DateRangePill =====================
function DateRangePill({ value, onChange, label }){
  const [open, setOpen] = useState(false);
  const cur = value || window.__nb_dateRange || DEFAULT_RANGE;
  const handleChange = (r)=>{
    window.__nb_dateRange = r;
    onChange && onChange(r);
    window.dispatchEvent(new CustomEvent('nb-range-change',{detail:r}));
  };
  return (
    <div className="relative">
      <button onClick={()=>setOpen(!open)} className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-line bg-white text-sm font-medium hover:bg-bg2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
        <Icon name="calendar" size={14} className="text-muted dark:text-slate-400"/>
        <span>{label || formatRangeLabel(cur.start, cur.end)}</span>
        <Icon name="chevronD" size={14} className={`text-muted dark:text-slate-400 transition-transform ${open?'rotate-180':''}`}/>
      </button>
      <DateRangePicker open={open} onClose={()=>setOpen(false)} value={cur} onChange={handleChange}/>
    </div>
  );
}

// ===================== Charts =====================
function BarChart({ data, height=160, accent='brand', labels, color='#38B6FF' }){
  // Support both array-of-numbers (design) and array-of-objects (legacy)
  const isNumArr = typeof data[0] === 'number';
  const values = isNumArr ? data : data.map(d=>d.value||d);
  const lbls = isNumArr ? labels : data.map(d=>d.label);
  const max = Math.max(...values) * 1.1;

  if (isNumArr) {
    // Design style: flex bar chart with tooltips
    return (
      <div className="w-full">
        <div className="flex items-end gap-1" style={{height}}>
          {values.map((v,i)=>{
            const h = (v/max)*(height-24);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="invisible group-hover:visible absolute -top-7 bg-ink text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap dark:bg-slate-200 dark:text-ink z-10">
                  {fmtIDRShort(v)}
                </div>
                <div className={'w-full rounded-t-md transition-all group-hover:opacity-80 ' + (accent==='brand'?'bg-gradient-to-t from-brand-600 to-sky2-400':'bg-brand-600')}
                  style={{height:h}}/>
              </div>
            );
          })}
        </div>
        {lbls && (
          <div className="mt-2 flex gap-1 text-[10px] text-muted dark:text-slate-400">
            {lbls.map((l,i)=><div key={i} className="flex-1 text-center">{l}</div>)}
          </div>
        )}
      </div>
    );
  }

  // Legacy style: SVG bar chart
  const w=600, h2=height;
  const pad={l:40,r:10,t:10,b:24};
  const ww=w-pad.l-pad.r, hh=h2-pad.t-pad.b;
  const bw = ww/data.length*0.6;
  const gap = ww/data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h2}`} className="w-full h-auto">
      {[0,.5,1].map((t,i)=>(<line key={i} x1={pad.l} x2={pad.l+ww} y1={pad.t+hh-t*hh} y2={pad.t+hh-t*hh} stroke="currentColor" strokeOpacity=".08"/>))}
      {data.map((d,i)=>{
        const bh=(d.value/max)*hh;
        const x=pad.l+i*gap+(gap-bw)/2;
        const y=pad.t+hh-bh;
        return <g key={i}>
          <rect x={x} y={y} width={bw} height={bh} fill={d.color||color} rx="4"/>
          <text x={x+bw/2} y={h2-6} textAnchor="middle" fontSize="10" fill="currentColor" opacity=".65">{d.label}</text>
        </g>;
      })}
    </svg>
  );
}

function LineChart({ data, height=180, color='#2E4191', secondary='#38B6FF', fill=true, showAxis=true, formatY }){
  // Support both array-of-numbers (design) and array-of-objects (legacy)
  const isNumArr = typeof data[0] === 'number';

  if (isNumArr) {
    const w=600, h=height;
    const max=Math.max(...data)*1.15;
    const step=w/(data.length-1);
    const pts=data.map((v,i)=>[i*step, h-(v/max)*(h-30)-10]);
    const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
    const dArea=d+` L ${w} ${h} L 0 ${h} Z`;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{height}}>
        <defs>
          <linearGradient id="lg1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={secondary} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={secondary} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0,1,2,3].map(i=>(
          <line key={i} x1="0" x2={w} y1={10+i*(h-30)/3} y2={10+i*(h-30)/3} stroke="#E2E8F0" strokeDasharray="3 4"/>
        ))}
        {fill && <path d={dArea} fill="url(#lg1)"/>}
        <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.filter((_,i)=>i%4===0).map((p,i)=>(
          <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="white" stroke={color} strokeWidth="2"/>
        ))}
      </svg>
    );
  }

  // Legacy: array-of-objects with {date, amount}
  const w=600, h=height;
  const pad={l:40,r:10,t:10,b:24};
  const ww=w-pad.l-pad.r, hh=h-pad.t-pad.b;
  const max=Math.max(...data.map(d=>d.amount))*1.1;
  const step=ww/Math.max(1,(data.length-1));
  const points=data.map((d,i)=>[pad.l+i*step, pad.t+hh-(d.amount/max)*hh]);
  const linePath=points.map((p,i)=>(i===0?'M':'L')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const areaPath=linePath+` L ${pad.l+ww} ${pad.t+hh} L ${pad.l} ${pad.t+hh} Z`;
  const yticks=[0,.25,.5,.75,1].map(t=>({y:pad.t+hh-t*hh, v:max*t}));
  const fmtY = formatY || fmtShort;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
      {showAxis && yticks.map((t,i)=>(
        <g key={i}>
          <line x1={pad.l} x2={pad.l+ww} y1={t.y} y2={t.y} stroke="currentColor" strokeOpacity=".08"/>
          <text x={pad.l-6} y={t.y+3} textAnchor="end" fontSize="10" fill="currentColor" opacity=".55">{fmtY(t.v)}</text>
        </g>
      ))}
      {fill && <path d={areaPath} fill={typeof fill==='string'?fill:'rgba(46,65,145,0.12)'}/>}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.2"/>
      {points.map((p,i)=>(
        i%5===0||i===points.length-1 ? <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} stroke="#fff" strokeWidth="1.5"/> : null
      ))}
      {showAxis && data.map((d,i)=>{
        if (i%6!==0 && i!==data.length-1) return null;
        const dt = d.date instanceof Date ? d.date : new Date(d.date);
        return <text key={i} x={pad.l+i*step} y={h-6} textAnchor="middle" fontSize="10" fill="currentColor" opacity=".55">{dt.getDate()}/{dt.getMonth()+1}</text>;
      })}
    </svg>
  );
}

function Donut({ data, segments, size=160, thickness=22, center }){
  // Support both data (design) and segments (legacy) props
  const segs = data || segments || [];
  const total = segs.reduce((s,x)=>s+x.value,0);
  const r = size/2 - thickness/2;
  const C = 2*Math.PI*r;
  let offset = 0;
  return (
    <div className="relative inline-block" style={{width:size,height:size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth={thickness}/>
        {segs.map((seg,i)=>{
          const len = (seg.value/total)*C;
          const el = <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${len} ${C}`} strokeDashoffset={-offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}/>;
          offset += len;
          return el;
        })}
        {!center && <>
          <text x={size/2} y={size/2-4} textAnchor="middle" className="fill-ink dark:fill-slate-100" style={{fontSize:18,fontWeight:700}}>{fmtNum(total)}</text>
          <text x={size/2} y={size/2+14} textAnchor="middle" className="fill-muted dark:fill-slate-400" style={{fontSize:10}}>TOTAL</text>
        </>}
      </svg>
      {center && <div className="absolute inset-0 flex items-center justify-center text-center"><div>{center}</div></div>}
    </div>
  );
}

// ===================== CampaignThumb =====================
function CampaignThumb({ c, className='' }){
  return (
    <div className={'relative rounded-xl overflow-hidden '+className} style={{background: c.thumb || c.img}}>
      {c.img && !c.thumb && <img src={c.img} alt="" className="absolute inset-0 w-full h-full object-cover"/>}
      <div className="absolute inset-0 flex items-center justify-center text-white/80">
        {c.icon && <Icon name={c.icon} size={56} strokeWidth={1.2}/>}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"/>
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <Badge tone="outline" size="sm" className="bg-white/90 backdrop-blur">{c.category}</Badge>
        <StatusBadge status={c.status} size="sm"/>
      </div>
    </div>
  );
}

// ===================== UtmGrid =====================
function UtmGrid({ utm={}, editable=false, onChange }){
  const fields = [
    {key:'source',  label:'utm_source'},
    {key:'medium',  label:'utm_medium'},
    {key:'content', label:'utm_content'},
    {key:'campaign',label:'utm_campaign'},
    {key:'term',    label:'utm_term'},
    {key:'id',      label:'utm_id'},
  ];
  return (
    <div className="grid grid-cols-1 gap-2.5">
      {fields.map((f)=>{
        const v = utm[f.key];
        return (
          <div key={f.key} className="grid grid-cols-[110px_12px_1fr] sm:grid-cols-[140px_12px_1fr] items-center gap-2">
            <div className="text-sm font-bold text-ink/85 dark:text-slate-200">{f.label}</div>
            <div className="text-sm text-muted dark:text-slate-400">:</div>
            <div className="relative">
              {editable ? (
                <input value={v||''} onChange={(e)=>onChange&&onChange(f.key,e.target.value)}
                  placeholder={v?'':'—'}
                  className="w-full rounded-md bg-brand-50/70 border border-brand-100 px-3 py-2 text-sm font-mono text-brand-700 placeholder:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:bg-white dark:bg-brand-900/30 dark:border-brand-800 dark:text-brand-200 dark:placeholder:text-brand-700"/>
              ) : (
                <div className="w-full rounded-md bg-brand-50/70 border border-brand-100 px-3 py-2 text-sm font-mono text-brand-700 min-h-[36px] dark:bg-brand-900/30 dark:border-brand-800 dark:text-brand-200">
                  {v || <span className="text-brand-300 dark:text-brand-700">{'—'}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===================== Modal =====================
function Modal({ open, onClose, title, children, maxW, size='md', footer }){
  if (!open) return null;
  const sizes = { sm:'max-w-md', md:'max-w-xl', lg:'max-w-3xl', xl:'max-w-5xl' };
  const mw = maxW || sizes[size] || sizes.md;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm fadeup" onMouseDown={onClose}>
      <div onMouseDown={e=>e.stopPropagation()} className={`relative w-full ${mw} bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-pop max-h-[92vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-line dark:border-slate-700 shrink-0">
            <h3 className="font-bold text-ink dark:text-slate-100">{title}</h3>
            <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-bg2 dark:hover:bg-slate-800 flex items-center justify-center text-muted dark:text-slate-400">
              <Icon name="close" size={18}/>
            </button>
          </div>
        )}
        {!title && (
          <button onClick={onClose} className="absolute top-4 right-4 z-10 h-9 w-9 rounded-xl bg-white/80 backdrop-blur hover:bg-slate-100 flex items-center justify-center text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700">
            <Icon name="close" size={18}/>
          </button>
        )}
        <div className="overflow-y-auto nice-scroll p-5 flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-line dark:border-slate-700 bg-bg2/40 dark:bg-slate-800/40 rounded-b-2xl flex items-center justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

// ===================== InvoiceModal =====================
function InvoiceModal({ txn, onClose, onCopy }){
  if (!txn) return null;
  const InvField = ({label, value, mono})=>(
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted font-medium dark:text-slate-400">{label}</div>
      <div className={'mt-0.5 text-sm text-ink dark:text-slate-200 '+(mono?'font-mono':'font-medium')}>{value||'—'}</div>
    </div>
  );
  return (
    <Modal open={true} onClose={onClose} title="Detail Invoice" size="lg"
      footer={<>
        <Btn variant="outline" tone="ink" icon="copy" onClick={()=>onCopy&&onCopy(txn.id)}>Salin invoice</Btn>
        <Btn variant="outline" tone="ink" icon="refresh">Update status</Btn>
        <Btn icon="wa">Kirim follow-up WA</Btn>
      </>}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-line dark:border-slate-700">
          <div>
            <div className="text-xs text-muted dark:text-slate-400">Kode Invoice</div>
            <div className="mt-1 font-mono text-2xl font-bold text-ink dark:text-slate-100">{txn.id}</div>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={txn.status}/>
              <span className="text-xs text-muted dark:text-slate-400">{txn.date}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted dark:text-slate-400">Nominal Donasi</div>
            <div className="mt-1 text-3xl font-bold text-brand-600 dark:text-brand-300">{fmtIDR(txn.amount)}</div>
            <div className="mt-1 text-xs text-muted dark:text-slate-400">via {txn.method}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InvField label="Donatur" value={txn.anon ? 'Anonim (Hamba Allah)' : txn.donor}/>
          <InvField label="Campaign" value={txn.campaign}/>
          <InvField label="WhatsApp" value={txn.whatsapp} mono/>
          <InvField label="Email" value={txn.email} mono/>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2 dark:text-slate-400">Pesan / Doa Donatur</div>
          <div className="bg-bg2 dark:bg-slate-800 rounded-xl p-3 text-sm text-ink dark:text-slate-200 italic">&ldquo;{txn.message}&rdquo;</div>
        </div>
        <div className="rounded-xl border border-line dark:border-slate-700 p-4">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-3 dark:text-slate-400">UTM & Ads Tracking</div>
          <UtmGrid utm={txn.utm||{}}/>
          <div className="mt-4 pt-4 border-t border-line dark:border-slate-700">
            <div className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-2 dark:text-slate-400">Click IDs</div>
            <div className="grid grid-cols-3 gap-3">
              <InvField label="fbclid" value={txn.utm?.source==='facebook'?'IwAR0…xy3':'—'} mono/>
              <InvField label="gclid" value={txn.utm?.source==='google'?'CjwK…aBc':'—'} mono/>
              <InvField label="ttclid" value={txn.utm?.source==='tiktok'?'E.C.P…29':'—'} mono/>
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2 dark:text-slate-400">Catatan CS</div>
          <textarea defaultValue={txn.note}
            className="w-full min-h-[80px] rounded-xl border border-line bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
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
}

// ===================== Toast =====================
function Toast({ toast, message, tone='ok', onClose }){
  // Support both object-style (legacy) and string-style (design)
  const t = toast || (message ? {title:message, tone} : null);
  if (!t) return null;
  const tones = { ok:'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', error:'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300', bad:'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300', ink:'bg-slate-800 text-white dark:bg-slate-200 dark:text-ink' };
  if (typeof t === 'object' && t.title) {
    return (
      <div className="fixed bottom-6 right-6 z-[60] slideIn">
        <div className="flex items-start gap-3 bg-white border border-line rounded-2xl shadow-pop p-3 pr-4 max-w-sm dark:bg-slate-800 dark:border-slate-700">
          <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${t.tone==='error'||t.tone==='bad'?'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300':'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
            <Icon name={t.tone==='error'||t.tone==='bad'?'close':'check'} size={18}/>
          </div>
          <div className="text-sm flex-1">
            <div className="font-semibold text-ink dark:text-slate-100">{t.title}</div>
            {t.sub && <div className="text-muted text-xs mt-0.5 dark:text-slate-400">{t.sub}</div>}
          </div>
          {onClose && <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><Icon name="close" size={14}/></button>}
        </div>
      </div>
    );
  }
  // Simple string toast
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`${tones[t.tone||tone]||tones.ok} px-4 py-2.5 rounded-xl shadow-pop text-sm font-medium flex items-center gap-2`}>
        <Icon name="check" size={16} strokeWidth={2.4}/>
        {t.title || t}
      </div>
    </div>
  );
}

// ===================== PageHeader =====================
function PageHeader({ title, subtitle, actions, breadcrumb }){
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        {breadcrumb && <div className="text-xs text-muted mb-1 dark:text-slate-400">{breadcrumb}</div>}
        <h1 className="text-2xl font-bold text-ink dark:text-slate-100 tracking-tight">{title}</h1>
        {subtitle && <div className="text-sm text-muted mt-1 dark:text-slate-400">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ===================== Skeleton =====================
function Skeleton({ w='100%', h=16, r=8, className='' }){
  return <div className={`bg-slate-200 dark:bg-slate-700 animate-pulse ${className}`} style={{width:w,height:h,borderRadius:r}}/>;
}

function SkeletonText({ lines=3, className='' }){
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({length:lines},(_,i)=>(
        <Skeleton key={i} h={12} w={i===lines-1?'60%':'100%'}/>
      ))}
    </div>
  );
}

function StatCardSkeleton(){
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton w={100} h={12}/>
          <Skeleton w={140} h={28} r={6}/>
          <Skeleton w={80} h={10}/>
        </div>
        <Skeleton w={44} h={44} r={12}/>
      </div>
    </div>
  );
}

function TableSkeleton({ rows=5, cols=5 }){
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 shadow-card overflow-hidden">
      <div className="p-4 border-b border-line dark:border-slate-800 flex items-center gap-3">
        <Skeleton w={200} h={20} r={6}/>
        <div className="flex-1"/>
        <Skeleton w={120} h={36} r={8}/>
      </div>
      <div className="divide-y divide-line dark:divide-slate-800">
        {Array.from({length:rows},(_,ri)=>(
          <div key={ri} className="px-4 py-3 flex items-center gap-4">
            {Array.from({length:cols},(_,ci)=>(
              <Skeleton key={ci} w={ci===0?'30%':'15%'} h={14}/>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton({ h=200 }){
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <Skeleton w={160} h={18} r={6}/>
        <div className="flex gap-2"><Skeleton w={60} h={28} r={6}/><Skeleton w={60} h={28} r={6}/></div>
      </div>
      <Skeleton w="100%" h={h} r={12}/>
    </div>
  );
}

function HeaderSkeleton({ hasActions=true }){
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
      <div className="space-y-2"><Skeleton w={240} h={28} r={6}/><Skeleton w={180} h={14}/></div>
      {hasActions && <div className="flex gap-2"><Skeleton w={120} h={40} r={10}/><Skeleton w={100} h={40} r={10}/></div>}
    </div>
  );
}

function TabsSkeleton({ count=4 }){
  return <div className="flex gap-2 mb-4">{Array.from({length:count},(_,i)=><Skeleton key={i} w={70+Math.random()*30} h={36} r={18}/>)}</div>;
}

function CardGridSkeleton({ count=6, cols='lg:grid-cols-3' }){
  return (
    <div className={`grid sm:grid-cols-2 ${cols} gap-4`}>
      {Array.from({length:count},(_,i)=>(
        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 shadow-card overflow-hidden">
          <Skeleton w="100%" h={160} r={0}/>
          <div className="p-4 space-y-3">
            <Skeleton w="80%" h={16} r={4}/>
            <Skeleton w="100%" h={8} r={4}/>
            <div className="flex justify-between"><Skeleton w={80} h={12}/><Skeleton w={60} h={12}/></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InboxSkeleton(){
  return (
    <div className="space-y-4">
      <HeaderSkeleton/>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:4},(_,i)=><StatCardSkeleton key={i}/>)}</div>
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 shadow-card p-4 space-y-3">
          <Skeleton w="100%" h={36} r={8}/>
          <TabsSkeleton count={3}/>
          {Array.from({length:6},(_,i)=>(
            <div key={i} className="flex items-center gap-3 py-3 border-b border-line dark:border-slate-800">
              <Skeleton w={40} h={40} r={20}/>
              <div className="flex-1 space-y-1.5"><Skeleton w="70%" h={14}/><Skeleton w="50%" h={10}/></div>
              <Skeleton w={60} h={14}/>
            </div>
          ))}
        </div>
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 shadow-card p-6 space-y-4">
          <div className="flex items-center gap-3"><Skeleton w={48} h={48} r={24}/><div className="space-y-1.5"><Skeleton w={140} h={16}/><Skeleton w={100} h={12}/></div></div>
          <Skeleton w="100%" h={1}/>
          {Array.from({length:4},(_,i)=><div key={i} className="flex justify-between py-2"><Skeleton w={100} h={14}/><Skeleton w={120} h={14}/></div>)}
          <Skeleton w="100%" h={1}/>
          <div className="flex gap-2"><Skeleton w={120} h={40} r={10}/><Skeleton w={120} h={40} r={10}/></div>
        </div>
      </div>
    </div>
  );
}

function SettingsSkeleton(){
  return (
    <div className="space-y-5">
      <HeaderSkeleton hasActions={false}/>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-3 shadow-card space-y-1">
          {Array.from({length:8},(_,i)=><Skeleton key={i} w="100%" h={40} r={8}/>)}
        </div>
        <div className="lg:col-span-4 space-y-4">
          {Array.from({length:3},(_,i)=>(
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-6 shadow-card space-y-4">
              <div className="space-y-1"><Skeleton w={160} h={18} r={4}/><Skeleton w={240} h={12}/></div>
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({length:4},(_,j)=><div key={j} className="space-y-2"><Skeleton w={80} h={12}/><Skeleton w="100%" h={40} r={8}/></div>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton(){
  return (
    <div className="space-y-6">
      <HeaderSkeleton hasActions={false}/>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-6 shadow-card">
        <div className="flex items-center gap-5">
          <Skeleton w={80} h={80} r={40}/>
          <div className="space-y-2 flex-1"><Skeleton w={180} h={20} r={4}/><Skeleton w={140} h={14}/><Skeleton w={100} h={24} r={12}/></div>
          <Skeleton w={100} h={40} r={10}/>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-6 shadow-card space-y-4">
          {Array.from({length:4},(_,i)=><div key={i} className="space-y-2"><Skeleton w={80} h={12}/><Skeleton w="100%" h={40} r={8}/></div>)}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-6 shadow-card space-y-4">
          <Skeleton w={140} h={18} r={4}/>
          {Array.from({length:3},(_,i)=><div key={i} className="space-y-2"><Skeleton w={100} h={12}/><Skeleton w="100%" h={40} r={8}/></div>)}
        </div>
      </div>
    </div>
  );
}

function CampaignEditorSkeleton(){
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-4"><Skeleton w={32} h={32} r={8}/><Skeleton w={200} h={24} r={6}/></div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-6 shadow-card space-y-4">
            {Array.from({length:3},(_,i)=><div key={i} className="space-y-2"><Skeleton w={80} h={12}/><Skeleton w="100%" h={i===1?160:40} r={8}/></div>)}
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-6 shadow-card space-y-4">
            <Skeleton w={140} h={18} r={4}/>
            <div className="grid grid-cols-3 gap-3">{Array.from({length:6},(_,i)=><Skeleton key={i} w="100%" h={80} r={12}/>)}</div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-5 shadow-card space-y-3">
            <Skeleton w="100%" h={180} r={12}/>
            <Skeleton w={100} h={12}/>
            <Skeleton w="100%" h={36} r={8}/>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-5 shadow-card space-y-3">
            {Array.from({length:4},(_,i)=><div key={i} className="flex justify-between items-center"><Skeleton w={100} h={14}/><Skeleton w={44} h={24} r={12}/></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsSkeleton(){
  return (
    <div className="space-y-6">
      <HeaderSkeleton/>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:8},(_,i)=><StatCardSkeleton key={i}/>)}</div>
      <TabsSkeleton count={5}/>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><ChartSkeleton h={240}/></div>
        <ChartSkeleton h={240}/>
      </div>
      <TableSkeleton rows={5} cols={7}/>
    </div>
  );
}

function DataStudioSkeleton(){
  return (
    <div className="space-y-4 -mx-4 lg:-mx-6 -my-6 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-line dark:border-slate-800 px-4 lg:px-6 py-3">
        <div className="flex items-center gap-3"><Skeleton w={28} h={28} r={6}/><div className="space-y-1"><Skeleton w={80} h={10}/><Skeleton w={240} h={16}/></div></div>
      </div>
      <div className="bg-white dark:bg-slate-900 border-b border-line dark:border-slate-800 px-4 lg:px-6 flex gap-2 py-2">
        {Array.from({length:6},(_,i)=><Skeleton key={i} w={80} h={32} r={4}/>)}
      </div>
      <div className="px-4 lg:px-6 flex gap-2">{Array.from({length:5},(_,i)=><Skeleton key={i} w={120} h={32} r={6}/>)}</div>
      <div className="px-4 lg:px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:8},(_,i)=><StatCardSkeleton key={i}/>)}</div>
      <div className="px-4 lg:px-6 grid lg:grid-cols-2 gap-4"><ChartSkeleton h={200}/><ChartSkeleton h={200}/></div>
    </div>
  );
}

function CampaignsSkeleton(){
  return (
    <div className="space-y-6">
      <HeaderSkeleton/>
      <TabsSkeleton count={5}/>
      <div className="flex items-center gap-3 mb-2"><Skeleton w={200} h={40} r={10}/><div className="flex-1"/><Skeleton w={80} h={36} r={8}/><Skeleton w={80} h={36} r={8}/></div>
      <CardGridSkeleton count={6} cols="lg:grid-cols-3"/>
    </div>
  );
}

function MembersSkeleton(){
  return (
    <div className="space-y-6">
      <HeaderSkeleton/>
      <TabsSkeleton count={4}/>
      <TableSkeleton rows={6} cols={5}/>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-5 shadow-card">
        <Skeleton w={160} h={18} r={4} className="mb-4"/>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({length:16},(_,i)=><Skeleton key={i} w="100%" h={32} r={6}/>)}
        </div>
      </div>
    </div>
  );
}

function NotificationSkeleton(){
  return (
    <div className="space-y-6">
      <HeaderSkeleton/>
      <TabsSkeleton count={5}/>
      <div className="space-y-2">
        {Array.from({length:6},(_,i)=>(
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-line dark:border-slate-800 p-4 flex items-start gap-3 shadow-card">
            <Skeleton w={40} h={40} r={10}/>
            <div className="flex-1 space-y-1.5"><Skeleton w="60%" h={14}/><Skeleton w="40%" h={11}/></div>
            <Skeleton w={50} h={11}/>
          </div>
        ))}
      </div>
    </div>
  );
}

function FundraiserSkeleton(){
  return (
    <div className="space-y-6">
      <HeaderSkeleton/>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:4},(_,i)=><StatCardSkeleton key={i}/>)}</div>
      <TabsSkeleton count={3}/>
      <TableSkeleton rows={6} cols={6}/>
    </div>
  );
}

function ShortcodeSkeleton(){
  return (
    <div className="space-y-6">
      <HeaderSkeleton hasActions={false}/>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-6 shadow-card space-y-4">
          <div className="space-y-2"><Skeleton w={100} h={12}/><Skeleton w="100%" h={40} r={8}/></div>
          <div className="space-y-2"><Skeleton w={100} h={12}/><div className="flex gap-2">{Array.from({length:3},(_,i)=><Skeleton key={i} w={80} h={36} r={8}/>)}</div></div>
          <Skeleton w="100%" h={120} r={8}/>
          <Skeleton w={120} h={40} r={10}/>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-6 shadow-card">
          <Skeleton w={120} h={16} r={4} className="mb-3"/>
          <Skeleton w="100%" h={300} r={12}/>
        </div>
      </div>
    </div>
  );
}

function TrashSkeleton(){
  return (
    <div className="space-y-6">
      <HeaderSkeleton/>
      <TabsSkeleton count={3}/>
      <TableSkeleton rows={5} cols={4}/>
    </div>
  );
}

function PageSkeleton({ type='dashboard' }){
  const skeletons = {
    dashboard: ()=>(
      <div className="space-y-6">
        <HeaderSkeleton/>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:8},(_,i)=><StatCardSkeleton key={i}/>)}</div>
        <div className="grid lg:grid-cols-3 gap-4"><div className="lg:col-span-2"><ChartSkeleton h={220}/></div><ChartSkeleton h={220}/></div>
        <TableSkeleton rows={6} cols={6}/>
      </div>
    ),
    campaigns: CampaignsSkeleton,
    'campaign-editor': CampaignEditorSkeleton,
    analytics: AnalyticsSkeleton,
    'data-studio': DataStudioSkeleton,
    'cs-inbox': InboxSkeleton,
    fundraiser: FundraiserSkeleton,
    shortcode: ShortcodeSkeleton,
    members: MembersSkeleton,
    profile: ProfileSkeleton,
    settings: SettingsSkeleton,
    notification: NotificationSkeleton,
    trash: TrashSkeleton,
    'adv-dashboard': AnalyticsSkeleton,
    table: ()=>(<div className="space-y-6"><HeaderSkeleton/><TabsSkeleton/><TableSkeleton rows={8} cols={6}/></div>),
    form: ()=>(<div className="space-y-6"><HeaderSkeleton hasActions={false}/><div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-6 shadow-card space-y-5">{Array.from({length:5},(_,i)=><div key={i} className="space-y-2"><Skeleton w={100} h={12}/><Skeleton w="100%" h={40} r={8}/></div>)}</div></div>),
  };
  const Comp = skeletons[type] || skeletons.dashboard;
  return typeof Comp === 'function' ? <Comp/> : Comp;
}

// ===================== Empty =====================
function Empty({ icon='inbox', title='Belum ada data', sub='', action }){
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-bg2 dark:bg-slate-800 flex items-center justify-center text-muted dark:text-slate-400 mb-3">
        <Icon name={icon} size={26}/>
      </div>
      <div className="font-semibold text-ink dark:text-slate-100">{title}</div>
      {sub && <div className="mt-1 text-sm text-muted dark:text-slate-400">{sub}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ===================== Tabs =====================
function Tabs({ tabs, value, onChange, variant='pill' }){
  if (variant==='underline') {
    return (
      <div className="flex items-center gap-6 border-b border-line dark:border-slate-700">
        {tabs.map((t)=>(
          <button key={t.value} onClick={()=>onChange(t.value)}
            className={`relative py-2.5 text-sm font-semibold transition-colors ${value===t.value?'text-brand-600 dark:text-brand-300':'text-muted hover:text-ink dark:text-slate-400 dark:hover:text-slate-200'}`}>
            {t.label}{t.count!==undefined && <span className={`ml-1.5 text-xs ${value===t.value?'text-brand-600 dark:text-brand-300':'text-muted dark:text-slate-400'}`}>({t.count})</span>}
            {value===t.value && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-600 dark:bg-brand-400 rounded-full"/>}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="inline-flex p-1 bg-bg2 dark:bg-slate-800 rounded-lg border border-line dark:border-slate-700">
      {tabs.map((t)=>(
        <button key={t.value} onClick={()=>onChange(t.value)}
          className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${value===t.value?'bg-white dark:bg-slate-700 text-ink dark:text-slate-100 shadow-sm':'text-muted hover:text-ink dark:text-slate-400 dark:hover:text-slate-200'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ===================== SourcePill =====================
function SourcePill({ source }){
  const map = {
    facebook:   {label:'Meta Ads',  bg:'bg-[#1877F2]',tx:'text-white'},
    instagram:  {label:'Instagram', bg:'bg-gradient-to-br from-pink-500 via-rose-500 to-amber-400',tx:'text-white'},
    google:     {label:'Google',    bg:'bg-white border border-line dark:bg-slate-800 dark:border-slate-700',tx:'text-ink dark:text-slate-200'},
    tiktok:     {label:'TikTok',    bg:'bg-black dark:bg-white',tx:'text-white dark:text-black'},
    '(direct)': {label:'Direct',    bg:'bg-slate-100 dark:bg-slate-700',tx:'text-slate-700 dark:text-slate-200'},
    organic:    {label:'Organic',   bg:'bg-emerald-50 dark:bg-emerald-900/30',tx:'text-emerald-700 dark:text-emerald-300'},
  };
  const m = map[source] || map['(direct)'];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.bg} ${m.tx}`}>{m.label}</span>;
}

// ===================== Campaign Card =====================
function CampaignCard({ c, onOpen, compact }){
  const pct = Math.min(100, Math.round((c.raised/c.target)*100));
  return (
    <Card padded={false} className="overflow-hidden group hover:-translate-y-0.5 transition cursor-pointer" onClick={onOpen}>
      <div className="relative aspect-[16/10] overflow-hidden">
        {c.img
          ? <img src={c.img} alt="" className="absolute inset-0 w-full h-full object-cover"/>
          : <div className="absolute inset-0 flex items-center justify-center text-white/80" style={{background:c.thumb||'linear-gradient(135deg,#2E4191,#38B6FF)'}}><Icon name={c.icon||'heart'} size={40} strokeWidth={1.2}/></div>
        }
        <div className="absolute top-3 left-3"><Badge tone="cyan" size="sm">{c.category}</Badge></div>
        <div className="absolute bottom-3 right-3"><StatusBadge status={c.status}/></div>
      </div>
      <div className="p-4">
        <div className="font-semibold text-ink dark:text-slate-100 line-clamp-2 leading-snug min-h-[44px]">{c.title}</div>
        <div className="mt-3 flex items-baseline justify-between text-sm">
          <span className="text-muted dark:text-slate-400">Terkumpul</span>
          <span className="font-bold text-brand-700 dark:text-brand-300 tnum">{fmtShort(c.raised)}</span>
        </div>
        <div className="mt-2"><ProgressBar value={c.raised} max={c.target} size="sm"/></div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted dark:text-slate-400">
          <span><span className="font-semibold text-ink dark:text-slate-200 tnum">{pct}%</span> dari {fmtShort(c.target)}</span>
          <span className="tnum">{c.days>0 ? `${c.days} hari lagi` : 'Selesai'}</span>
        </div>
        {!compact && (
          <div className="mt-3 pt-3 border-t border-line dark:border-slate-700 flex items-center justify-between">
            <div className="text-xs text-muted dark:text-slate-400">
              <span className="font-semibold text-ink dark:text-slate-200 tnum">{fmtNum(c.donors)}</span> donatur
            </div>
            <span className="text-xs text-brand-600 dark:text-brand-300 font-medium inline-flex items-center gap-1">Lihat <Icon name="arrowR" size={14}/></span>
          </div>
        )}
      </div>
    </Card>
  );
}

// ===================== Social proof popup =====================
function SocialProofPopup(){
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(()=>{
    let t1, t2;
    const cycle = ()=>{
      setVisible(true);
      t1 = setTimeout(()=>{setVisible(false); t2=setTimeout(()=>{setIdx(i=>(i+1)%6); cycle();}, 1500);}, 5000);
    };
    const init = setTimeout(cycle, 2500);
    return ()=>{ clearTimeout(init); clearTimeout(t1); clearTimeout(t2); };
  },[]);
  const items = [
    {name:'Ahmad F.',amount:250_000,c:'Beasiswa 1000 Anak Dhuafa',city:'Jakarta'},
    {name:'Hamba Allah',amount:1_000_000,c:'Bangun Sekolah NTT',city:'Surabaya'},
    {name:'Siti N.',amount:50_000,c:'Paket Sekolah Yatim',city:'Bandung'},
    {name:'Rina M.',amount:500_000,c:'Beasiswa Tahfidz',city:'Yogyakarta'},
    {name:'Budi S.',amount:100_000,c:'Beasiswa 1000 Anak Dhuafa',city:'Medan'},
    {name:'Hamba Allah',amount:2_000_000,c:'Bangun Sekolah NTT',city:'Makassar'},
  ];
  if (!visible) return null;
  const it = items[idx];
  return (
    <div className="fixed bottom-24 sm:bottom-6 left-4 sm:left-6 z-40 slideIn">
      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow-pop border border-line dark:border-slate-700 p-3 pr-4 max-w-sm">
        <Avatar name={it.name} size={40}/>
        <div className="text-sm">
          <div className="text-ink dark:text-slate-200"><span className="font-semibold">{it.name}</span> dari {it.city} baru saja berdonasi</div>
          <div className="text-brand-700 dark:text-brand-300 font-bold tnum">{fmtIDR(it.amount)} <span className="text-muted dark:text-slate-400 text-xs font-normal">&middot; {it.c}</span></div>
        </div>
      </div>
    </div>
  );
}

// ===================== Trust badges =====================
function TrustBadges({ dark }){
  const items = [
    {icon:'shield', t:'Berizin Kemensos', s:'No. 480/HUK/2023'},
    {icon:'lock',   t:'Transaksi aman',   s:'SSL · 256-bit'},
    {icon:'check',  t:'Laporan transparan',s:'Audit publik'},
    {icon:'heart',  t:'120.000+ donatur', s:'sejak 2019'},
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((it,i)=>(
        <div key={i} className={`rounded-2xl p-3 flex items-center gap-3 ${dark?'bg-white/10 text-white':'bg-white border border-line dark:bg-slate-800 dark:border-slate-700'}`}>
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${dark?'bg-white/15 text-cyan2-300':'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'}`}>
            <Icon name={it.icon} size={20}/>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">{it.t}</div>
            <div className={`text-xs ${dark?'text-white/70':'text-muted dark:text-slate-400'}`}>{it.s}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===================== Export utilities =====================
const downloadBlob = (content, filename, mime)=>{
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{document.body.removeChild(a); URL.revokeObjectURL(url);}, 100);
};

const csvEscape = (v)=>{
  if (v==null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return '"'+s.replace(/"/g,'""')+'"';
  return s;
};

const rangeStamp = (r)=>{
  if (!r||!r.start) return 'all';
  const f=(d)=>`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return f(r.start)+'-'+f(r.end||r.start);
};

function exportCSV(rows, filename, range){
  if (!rows||!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(csvEscape).join(',')];
  for (const r of rows) lines.push(headers.map(h=>csvEscape(r[h])).join(','));
  const content = '﻿'+lines.join('\r\n');
  downloadBlob(content, `${filename}_${rangeStamp(range)}.csv`, 'text/csv;charset=utf-8;');
}

function exportExcel(rows, filename, range, sheetName='Data'){
  if (!rows||!rows.length) return;
  const headers = Object.keys(rows[0]);
  const xmlEsc=(v)=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const typeOf=(v)=>typeof v==='number'&&isFinite(v)?'Number':'String';
  const rowsXml = rows.map(r=>'<Row>'+headers.map(h=>{
    const v=r[h];
    return `<Cell><Data ss:Type="${typeOf(v)}">${xmlEsc(v)}</Data></Cell>`;
  }).join('')+'</Row>').join('');
  const headerXml = '<Row>'+headers.map(h=>
    `<Cell ss:StyleID="hdr"><Data ss:Type="String">${xmlEsc(h)}</Data></Cell>`
  ).join('')+'</Row>';
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
}

// ===================== Sidebar =====================
const NAV_BY_ROLE = {
  Admin: ['dashboard','campaigns','analytics','data-studio','cs-inbox','fundraiser','shortcode','members','notification','trash','profile','settings'],
  CS: ['dashboard','campaigns','cs-inbox','fundraiser','notification','profile'],
  Advertiser: ['dashboard','campaigns','analytics','data-studio','shortcode','notification','profile'],
};

const NAV_DEFS = {
  dashboard:    {label:'Dashboard', icon:'home', section:'main'},
  campaigns:    {label:'Campaigns', icon:'megaphone', section:'main'},
  analytics:    {label:'Analytics', icon:'chart', section:'main'},
  'data-studio':{label:'Data Studio', icon:'sparkle', section:'main'},
  fundraiser:   {label:'Fundraiser', icon:'handshake', section:'main'},
  shortcode:    {label:'Shortcode', icon:'code', section:'main'},
  members:      {label:'Members / User', icon:'users', section:'main'},
  profile:      {label:'Profile', icon:'user', section:'akun'},
  settings:     {label:'Settings', icon:'cog', section:'akun'},
  notification: {label:'Notification', icon:'bell', badge:4, section:'main'},
  trash:        {label:'Trash', icon:'trash', section:'main'},
  'cs-inbox':   {label:'Inbox Donatur', icon:'inbox', badge:12, section:'main'},
  transactions: {label:'Transaksi', icon:'briefcase', section:'main'},
  'adv-dashboard':{label:'Dashboard Iklan', icon:'home', section:'main'},
  tracking:     {label:'Tracking & Pixel', icon:'eye', section:'main'},
  'campaign-editor':{label:'Campaign Editor', icon:'edit', section:'main'},
};

function Sidebar({ open, onClose }){
  const { route, navigate, role, tweaks } = useApp();
  const collapsed = tweaks.sidebar === 'collapsed';
  const navKeys = NAV_BY_ROLE[role] || NAV_BY_ROLE.Admin;
  const mainKeys = navKeys.filter(k=>!NAV_DEFS[k]||NAV_DEFS[k].section!=='akun');
  const akunKeys = navKeys.filter(k=>NAV_DEFS[k]&&NAV_DEFS[k].section==='akun');

  return (
    <>
      <div className={`lg:hidden fixed inset-0 z-40 bg-slate-900/40 transition ${open?'opacity-100':'pointer-events-none opacity-0'}`} onClick={onClose}/>
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen ${collapsed?'lg:w-[76px]':'lg:w-[256px]'} w-[260px] shrink-0 bg-white dark:bg-slate-900 border-r border-line dark:border-slate-800 flex flex-col transition-transform ${open?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className={`h-16 flex items-center ${collapsed?'justify-center':'px-5'} border-b border-line dark:border-slate-800 shrink-0`}>
          {collapsed
            ? <div className="w-10 h-10 rounded-xl bg-cyan2-100 dark:bg-cyan2-900/40 flex items-center justify-center"><img src="assets/logo-niatbaik.png" className="h-7" alt=""/></div>
            : <Logo size={28}/>
          }
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-5 py-3 border-b border-line dark:border-slate-800">
            <RoleBadge role={role}/>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto nice-scroll px-3 py-4 space-y-0.5">
          {!collapsed && mainKeys.length > 0 && <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted dark:text-slate-500">Menu Utama</div>}
          {mainKeys.map(key=>{
            const d = NAV_DEFS[key];
            if (!d) return null;
            const active = route === key;
            return (
              <button key={key} onClick={()=>{navigate(key); onClose&&onClose();}}
                className={`w-full flex items-center ${collapsed?'justify-center px-2':'px-3'} h-11 rounded-xl text-sm font-medium transition ${active?'bg-brand-600 text-white shadow-sm':'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`} title={d.label}>
                <Icon name={d.icon} size={20}/>
                {!collapsed && <span className="ml-3 flex-1 text-left">{d.label}</span>}
                {!collapsed && d.badge && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active?'bg-white/20 text-white':'bg-rose-500 text-white'}`}>{d.badge}</span>}
              </button>
            );
          })}

          {!collapsed && akunKeys.length > 0 && <div className="px-3 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted dark:text-slate-500">Akun</div>}
          {akunKeys.map(key=>{
            const d = NAV_DEFS[key];
            if (!d) return null;
            const active = route === key;
            return (
              <button key={key} onClick={()=>{navigate(key); onClose&&onClose();}}
                className={`w-full flex items-center ${collapsed?'justify-center px-2':'px-3'} h-11 rounded-xl text-sm font-medium transition ${active?'bg-brand-600 text-white shadow-sm':'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`} title={d.label}>
                <Icon name={d.icon} size={20}/>
                {!collapsed && <span className="ml-3 flex-1 text-left">{d.label}</span>}
                {!collapsed && d.badge && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active?'bg-white/20 text-white':'bg-rose-500 text-white'}`}>{d.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Lihat situs publik */}
        {!collapsed && (
          <div className="px-3 py-2 border-t border-line dark:border-slate-800">
            <button onClick={()=>{navigate('landing'); onClose&&onClose();}}
              className="w-full flex items-center gap-2 px-3 h-10 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/30 transition">
              <Icon name="arrowR" size={16}/>
              <span>Lihat situs publik</span>
            </button>
          </div>
        )}

        {/* Tips card */}
        {!collapsed && (
          <div className="p-3 border-t border-line dark:border-slate-800">
            <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-cyan2-400 text-white p-4 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10"></div>
              <Icon name="heart" size={22}/>
              <div className="mt-2 text-sm font-bold">Niat baik dimulai dari satu donasi</div>
              <div className="text-xs opacity-80 mt-1">Lihat panduan onboarding untuk admin baru.</div>
              <button className="mt-3 text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg">Pelajari &rarr;</button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// ===================== Topbar =====================
function Topbar({ onMenu, title, subtitle, actions, role }){
  const { tweaks, setTweak, user, logout, navigate } = useApp();
  const [openNotif, setOpenNotif] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const notifCount = (typeof NOTIFICATIONS !== 'undefined' && NOTIFICATIONS?.length) || 0;

  // Close dropdowns on outside click
  const notifRef = useRef(null);
  const profRef = useRef(null);
  useEffect(()=>{
    const handler = (e)=>{
      if (notifRef.current && !notifRef.current.contains(e.target)) setOpenNotif(false);
      if (profRef.current && !profRef.current.contains(e.target)) setOpenProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return ()=>document.removeEventListener('mousedown', handler);
  },[]);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-line dark:border-slate-800">
      <div className="h-16 px-4 lg:px-6 flex items-center gap-3">
        {/* Hamburger (mobile) */}
        <button className="lg:hidden h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" onClick={onMenu}>
          <Icon name="menu" size={20}/>
        </button>

        <div className="flex-1 min-w-0">
          {title && <div className="font-bold text-ink dark:text-slate-100 leading-tight truncate">{title}</div>}
          {subtitle && <div className="text-xs text-muted dark:text-slate-400 truncate">{subtitle}</div>}
        </div>

        {/* Search */}
        <div className="hidden md:block relative w-[260px]">
          <SearchInput placeholder="Cari campaign, donatur, invoice…"/>
        </div>

        {/* Role badge */}
        <div className="hidden sm:block">
          <RoleBadge role={role}/>
        </div>

        {/* Dark toggle */}
        <button onClick={()=>setTweak('dark',!tweaks.dark)} className="hidden sm:flex h-10 w-10 rounded-xl items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
          <Icon name={tweaks.dark?'sparkle':'moon'} size={18}/>
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button onClick={()=>setOpenNotif(!openNotif)} className="relative h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Icon name="bell" size={18}/>
            {notifCount > 0 && <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">{notifCount > 9 ? '9+' : notifCount}</span>}
          </button>
          {openNotif && (
            <div className="absolute right-0 top-12 w-[320px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-pop border border-line dark:border-slate-700 p-2 z-50">
              <div className="px-3 py-2 flex items-center justify-between">
                <div className="font-semibold text-sm text-ink dark:text-slate-100">Notifikasi</div>
                <button className="text-xs text-brand-600 dark:text-brand-300 font-medium">Tandai dibaca</button>
              </div>
              <div className="max-h-[320px] overflow-auto nice-scroll">
                {(typeof NOTIFICATIONS !== 'undefined' ? NOTIFICATIONS : []).map((n,i)=>(
                  <div key={n.id||i} className="px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <div className="text-sm font-medium text-ink dark:text-slate-100">{n.title}</div>
                    <div className="text-xs text-muted dark:text-slate-400">{n.sub}</div>
                    <div className="text-[11px] text-muted dark:text-slate-500 mt-0.5">{n.ts}</div>
                  </div>
                ))}
                {notifCount === 0 && <div className="py-6 text-center text-sm text-muted dark:text-slate-400">Tidak ada notifikasi</div>}
              </div>
            </div>
          )}
        </div>

        {/* User avatar/dropdown */}
        <div className="relative" ref={profRef}>
          <button onClick={()=>setOpenProfile(!openProfile)} className="flex items-center gap-2 h-10 pl-1 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <Avatar name={userName} size={32}/>
            <div className="hidden md:block text-left">
              <div className="text-[13px] font-semibold leading-tight text-ink dark:text-slate-100">{userName}</div>
              <div className="text-[11px] text-muted dark:text-slate-400 leading-tight">{role}</div>
            </div>
          </button>
          {openProfile && (
            <div className="absolute right-0 top-12 w-[220px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-pop border border-line dark:border-slate-700 p-2 z-50">
              <div className="px-3 py-2 border-b border-line dark:border-slate-700 mb-1">
                <div className="font-semibold text-sm text-ink dark:text-slate-100">{userName}</div>
                <div className="text-xs text-muted dark:text-slate-400">{userEmail}</div>
              </div>
              <button onClick={()=>{setOpenProfile(false); navigate&&navigate('profile');}} className="w-full flex items-center gap-2 px-3 h-10 rounded-xl text-sm font-medium text-ink dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <Icon name="user" size={16}/> Profile
              </button>
              <button onClick={()=>{setOpenProfile(false); navigate&&navigate('settings');}} className="w-full flex items-center gap-2 px-3 h-10 rounded-xl text-sm font-medium text-ink dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <Icon name="cog" size={16}/> Settings
              </button>
              <button onClick={()=>setTweak('dark',!tweaks.dark)} className="w-full flex items-center gap-2 px-3 h-10 rounded-xl text-sm font-medium text-ink dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition sm:hidden">
                <Icon name={tweaks.dark?'sparkle':'moon'} size={16}/> {tweaks.dark?'Light mode':'Dark mode'}
              </button>
              <div className="border-t border-line dark:border-slate-700 mt-1 pt-1">
                <button onClick={()=>{setOpenProfile(false); logout&&logout();}} className="w-full flex items-center gap-2 px-3 h-10 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                  <Icon name="close" size={16}/> Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {actions && <div className="px-4 lg:px-6 pb-3">{actions}</div>}
    </header>
  );
}

// ===================== AppShell =====================
function AppShell({ children, title, subtitle }){
  const [mobOpen, setMobOpen] = useState(false);
  const { role } = useApp();
  return (
    <div className="flex min-h-screen">
      <Sidebar open={mobOpen} onClose={()=>setMobOpen(false)}/>
      <div className="flex-1 min-w-0">
        <Topbar onMenu={()=>setMobOpen(true)} title={title} subtitle={subtitle} role={role}/>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

// ===================== Router =====================
function Router(){
  const { route } = useApp();
  if (route==='landing') return <LandingPage/>;
  if (route==='campaign-detail') return <CampaignDetailWrap/>;
  const def = NAV_DEFS[route] || NAV_DEFS.dashboard;
  return (
    <AppShell title={def.label} subtitle="">
      {route==='dashboard' && <AdminDashboard/>}
      {route==='campaigns' && <CampaignsPage/>}
      {route==='campaign-editor' && <CampaignEditorView/>}
      {route==='analytics' && <AnalyticsPage/>}
      {route==='data-studio' && <DataStudioView/>}
      {route==='fundraiser' && <FundraiserPage/>}
      {route==='shortcode' && <ShortcodePage/>}
      {route==='members' && <MembersPage/>}
      {route==='profile' && <ProfilePage/>}
      {route==='settings' && <SettingsPage/>}
      {route==='notification' && <NotificationPage/>}
      {route==='trash' && <TrashPage/>}
      {route==='cs-inbox' && typeof CsInbox!=='undefined' && <CsInbox/>}
      {route==='adv-dashboard' && typeof AdvertiserDashboard!=='undefined' && <AdvertiserDashboard/>}
    </AppShell>
  );
}

// ===================== Window exports =====================
Object.assign(window, {
  // Context
  AppCtx, useApp,
  // Atoms
  Logo, Badge, StatusBadge, RoleBadge, Button, Btn, IconBtn,
  Card, StatCard, Stat,
  Field, Input, SearchInput, Select, Toggle,
  Progress, ProgressBar, Avatar,
  // Date
  DateRangePicker, DateRangePill, DEFAULT_RANGE, formatRangeLabel,
  // Charts
  LineChart, BarChart, Donut,
  // Campaign
  CampaignThumb, CampaignCard,
  // UTM
  UtmGrid,
  // Modal / Toast
  Modal, InvoiceModal, Toast,
  // Skeleton
  Skeleton, SkeletonText, StatCardSkeleton, TableSkeleton, ChartSkeleton, PageSkeleton,
  HeaderSkeleton, TabsSkeleton, CardGridSkeleton, InboxSkeleton, SettingsSkeleton,
  ProfileSkeleton, CampaignEditorSkeleton, AnalyticsSkeleton, DataStudioSkeleton,
  CampaignsSkeleton, MembersSkeleton, NotificationSkeleton, FundraiserSkeleton,
  ShortcodeSkeleton, TrashSkeleton,
  // Page chrome
  PageHeader, Empty, Tabs, SourcePill,
  Sidebar, Topbar, AppShell, Router,
  SocialProofPopup, TrustBadges,
  // Nav config
  NAV_BY_ROLE, NAV_DEFS,
  // Export utilities
  exportCSV, exportExcel,
  // Date helpers
  filterByRange, parseTxnDate,
  // Formatters
  fmtIDRShort, fmtPct,
});

// Shared UI components
const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

// Theme context — exposes role + tweaks
const AppCtx = createContext({});
const useApp = () => useContext(AppCtx);

// ===================== Atoms =====================

function Logo({ size=28, full=true, white=false }){
  return (
    <div className="flex items-center gap-2">
      <img src="assets/logo-niatbaik.png" alt="NIATBAIK.ORG" style={{height: size}} />
    </div>
  );
}

function Badge({ children, tone='slate', size='sm', dot }){
  const tones = {
    slate:'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
    brand:'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
    cyan:'bg-cyan2-50 text-cyan2-700 dark:bg-cyan2-900/40 dark:text-cyan2-200',
    green:'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    amber:'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    red:'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    gray:'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };
  const dotColors = { brand:'#2E4191', cyan:'#38B6FF', green:'#16A34A', amber:'#F59E0B', red:'#DC2626', slate:'#64748B', gray:'#64748B' };
  return (
    <span className={`inline-flex items-center gap-1.5 ${size==='sm'?'text-xs px-2 py-0.5':'text-[13px] px-2.5 py-1'} rounded-full font-medium ${tones[tone]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{background:dotColors[tone]}}/>}
      {children}
    </span>
  );
}

function StatusBadge({ status }){
  const map = {
    'Draft':['gray','Draft'],'Published':['cyan','Published'],'Running':['green','Running'],'Ended':['slate','Ended'],
    'Sukses':['green','Sukses'],'Pending':['amber','Pending'],'Gagal':['red','Gagal'],
    'active':['green','Active'],'inactive':['slate','Inactive'],
    'paid':['green','Paid'],'pending':['amber','Pending'],
    'Active':['green','Active'],'Not Connected':['gray','Not Connected'],'Error':['red','Error'],
  };
  const [tone,label] = map[status] || ['slate', status];
  return <Badge tone={tone} dot>{label}</Badge>;
}

function RoleBadge({ role }){
  const m = { Admin:'brand', CS:'cyan', Advertiser:'amber' };
  return <Badge tone={m[role]||'slate'}>{role}</Badge>;
}

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

function IconBtn({ children, ...rest }){
  return <button className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-line bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-200" {...rest}>{children}</button>;
}

function Card({ children, className='', as='div', padded=true, ...rest }){
  const Cmp = as;
  return <Cmp className={`surface rounded-2xl shadow-card ${padded?'p-5':''} ${className}`} {...rest}>{children}</Cmp>;
}

function Field({ label, hint, required, children }){
  return (
    <label className="block">
      {label && <div className="mb-1.5 text-sm font-medium text-ink dark:text-slate-200">{label} {required && <span className="text-rose-500">*</span>}</div>}
      {children}
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </label>
  );
}

function Input({ icon, suffix, className='', ...rest }){
  return (
    <div className={`relative flex items-center ${className}`}>
      {icon && <span className="absolute left-3 text-slate-400">{icon}</span>}
      <input className={`w-full h-11 ${icon?'pl-10':'pl-3.5'} ${suffix?'pr-12':'pr-3.5'} rounded-xl bg-white border border-line text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100`} {...rest}/>
      {suffix && <span className="absolute right-3 text-xs text-muted">{suffix}</span>}
    </div>
  );
}

function Select({ children, className='', ...rest }){
  return (
    <div className={`relative ${className}`}>
      <select className="appearance-none w-full h-11 pl-3.5 pr-10 rounded-xl bg-white border border-line text-ink focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" {...rest}>
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        <Icons.ChevronDown w={16} h={16}/>
      </span>
    </div>
  );
}

function Toggle({ checked, onChange, label, sub }){
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button onClick={()=>onChange&&onChange(!checked)} type="button" className={`mt-0.5 relative w-11 h-6 rounded-full transition ${checked?'bg-brand-600':'bg-slate-200 dark:bg-slate-700'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked?'translate-x-5':''}`}/>
      </button>
      {(label||sub) && <span className="flex-1">
        {label && <div className="text-sm font-medium text-ink dark:text-slate-200">{label}</div>}
        {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
      </span>}
    </label>
  );
}

function ProgressBar({ value, max, color='brand', size='md', label }){
  const pct = Math.min(100, Math.round((value/max)*100));
  const colors = { brand:'bg-brand-600', cyan:'bg-cyan2-400', green:'bg-emerald-500' };
  const h = size==='sm'?'h-1.5':size==='lg'?'h-3':'h-2';
  return (
    <div>
      <div className={`w-full ${h} bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden`}>
        <div className={`${h} ${colors[color]} rounded-full relative`} style={{width: pct+'%'}}>
          <div className="absolute inset-0 shimmer"></div>
        </div>
      </div>
      {label && <div className="mt-1.5 text-xs text-muted">{label}</div>}
    </div>
  );
}

function Stat({ label, value, sub, icon, tone='brand', trend }){
  const tones = {
    brand:'text-brand-600 bg-brand-50 dark:bg-brand-900/40 dark:text-brand-300',
    cyan:'text-cyan2-600 bg-cyan2-50 dark:bg-cyan2-900/40 dark:text-cyan2-300',
    green:'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300',
    amber:'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300',
    red:'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-300',
    slate:'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
  };
  return (
    <Card padded={false} className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted uppercase tracking-wider">{label}</div>
          <div className="mt-1.5 text-2xl font-bold text-ink dark:text-slate-100 tnum truncate">{value}</div>
          {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
        </div>
        {icon && <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>{icon}</div>}
      </div>
      {trend && (
        <div className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${trend.up?'text-emerald-600':'text-rose-600'}`}>
          {trend.up ? <Icons.ArrowUp w={14} h={14}/> : <Icons.ArrowDown w={14} h={14}/>}
          {trend.value} <span className="text-muted font-normal">vs minggu lalu</span>
        </div>
      )}
    </Card>
  );
}

// Donor avatar
function Avatar({ name, initials, size=32, anon }){
  const seed = (name||'').charCodeAt(0) + (name||'').length;
  const init = anon ? 'HA' : (initials || (name||'?').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase());
  return <img src={avatarSvg(init, seed)} alt={name} style={{width:size,height:size}} className="rounded-full"/>;
}

// ===================== Charts (SVG) =====================
function LineChart({ data, height=180, color='#2E4191', fill='rgba(46,65,145,0.12)', showAxis=true, formatY=fmtShort }){
  const w = 600;
  const h = height;
  const pad = { l:40, r:10, t:10, b:24 };
  const ww = w - pad.l - pad.r;
  const hh = h - pad.t - pad.b;
  const max = Math.max(...data.map(d=>d.amount)) * 1.1;
  const step = ww / Math.max(1,(data.length-1));
  const points = data.map((d,i) => [pad.l + i*step, pad.t + hh - (d.amount/max)*hh]);
  const linePath = points.map((p,i)=> (i===0?'M':'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const areaPath = linePath + ` L ${pad.l+ww} ${pad.t+hh} L ${pad.l} ${pad.t+hh} Z`;
  const yticks = [0, .25, .5, .75, 1].map(t => ({ y: pad.t + hh - t*hh, v: max*t }));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
      {showAxis && yticks.map((t,i)=>(
        <g key={i}>
          <line x1={pad.l} x2={pad.l+ww} y1={t.y} y2={t.y} stroke="currentColor" strokeOpacity=".08"/>
          <text x={pad.l-6} y={t.y+3} textAnchor="end" fontSize="10" fill="currentColor" opacity=".55">{formatY(t.v)}</text>
        </g>
      ))}
      <path d={areaPath} fill={fill}/>
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.2"/>
      {points.map((p,i)=>(
        i % 5 === 0 || i===points.length-1 ? <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} stroke="#fff" strokeWidth="1.5"/> : null
      ))}
      {showAxis && data.map((d,i)=> (
        (i%6===0 || i===data.length-1) ? <text key={i} x={pad.l+i*step} y={h-6} textAnchor="middle" fontSize="10" fill="currentColor" opacity=".55">{d.date.getDate()}/{d.date.getMonth()+1}</text> : null
      ))}
    </svg>
  );
}

function BarChart({ data, height=180, color='#38B6FF' }){
  const w = 600, h = height;
  const pad = { l:40, r:10, t:10, b:24 };
  const ww = w-pad.l-pad.r, hh = h-pad.t-pad.b;
  const max = Math.max(...data.map(d=>d.value))*1.1;
  const bw = ww / data.length * 0.6;
  const gap = ww / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      {[0,.5,1].map((t,i)=>(<line key={i} x1={pad.l} x2={pad.l+ww} y1={pad.t+hh-t*hh} y2={pad.t+hh-t*hh} stroke="currentColor" strokeOpacity=".08"/>))}
      {data.map((d,i)=>{
        const bh = (d.value/max)*hh;
        const x = pad.l + i*gap + (gap-bw)/2;
        const y = pad.t + hh - bh;
        return <g key={i}>
          <rect x={x} y={y} width={bw} height={bh} fill={d.color||color} rx="4"/>
          <text x={x+bw/2} y={h-6} textAnchor="middle" fontSize="10" fill="currentColor" opacity=".65">{d.label}</text>
        </g>;
      })}
    </svg>
  );
}

function Donut({ segments, size=160, thickness=22, center }){
  const total = segments.reduce((s,x)=>s+x.value,0);
  const r = size/2 - thickness/2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative inline-block" style={{width:size,height:size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth={thickness}/>
        {segments.map((seg,i)=>{
          const len = (seg.value/total) * C;
          const el = <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={seg.color} strokeWidth={thickness} strokeDasharray={`${len} ${C-len}`} strokeDashoffset={-offset} strokeLinecap="butt"/>;
          offset += len;
          return el;
        })}
      </svg>
      {center && <div className="absolute inset-0 flex items-center justify-center text-center"><div>{center}</div></div>}
    </div>
  );
}

// ===================== Modal / Toast =====================
function Modal({ open, onClose, children, maxW='max-w-2xl' }){
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm fadeup" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className={`relative w-full ${maxW} surface rounded-t-3xl sm:rounded-3xl shadow-pop max-h-[92vh] overflow-auto nice-scroll`}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 h-9 w-9 rounded-xl bg-white/80 backdrop-blur hover:bg-slate-100 flex items-center justify-center text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700"><Icons.X w={18} h={18}/></button>
        {children}
      </div>
    </div>
  );
}

function Toast({ toast, onClose }){
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[60] slideIn">
      <div className="flex items-start gap-3 bg-white border border-line rounded-2xl shadow-pop p-3 pr-4 max-w-sm dark:bg-slate-800 dark:border-slate-700">
        <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${toast.tone==='error'?'bg-rose-100 text-rose-600':'bg-emerald-100 text-emerald-700'}`}>
          {toast.tone==='error'? <Icons.X w={18} h={18}/> : <Icons.Check w={18} h={18}/>}
        </div>
        <div className="text-sm">
          <div className="font-semibold text-ink dark:text-slate-100">{toast.title}</div>
          {toast.sub && <div className="text-muted text-xs mt-0.5">{toast.sub}</div>}
        </div>
        <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600"><Icons.X w={14} h={14}/></button>
      </div>
    </div>
  );
}

// ===================== Sidebar / Topbar =====================
const NAV_BY_ROLE = {
  Admin: ['dashboard','campaigns','analytics','fundraiser','shortcode','members','profile','settings','notification','trash'],
  CS: ['cs-inbox','transactions','dashboard','notification','profile'],
  Advertiser: ['adv-dashboard','analytics','campaigns','tracking','profile'],
};

const NAV_DEFS = {
  dashboard: { label:'Dashboard', icon:'Dashboard' },
  campaigns: { label:'Campaigns', icon:'Megaphone' },
  analytics: { label:'Analytics', icon:'Chart' },
  fundraiser: { label:'Fundraiser', icon:'Users' },
  shortcode: { label:'Shortcode', icon:'Code' },
  members: { label:'Members / User', icon:'User' },
  profile: { label:'Profile', icon:'User' },
  settings: { label:'Settings', icon:'Settings' },
  notification: { label:'Notification', icon:'Bell', badge: 4 },
  trash: { label:'Trash', icon:'Trash' },
  'cs-inbox': { label:'Inbox Donatur', icon:'Mail', badge: 12 },
  transactions: { label:'Transaksi', icon:'Wallet' },
  'adv-dashboard': { label:'Dashboard Iklan', icon:'Dashboard' },
  tracking: { label:'Tracking & Pixel', icon:'Pixel' },
};

function Sidebar({ open, onClose }){
  const { route, navigate, role, tweaks } = useApp();
  const collapsed = tweaks.sidebar === 'collapsed';
  const navKeys = NAV_BY_ROLE[role] || NAV_BY_ROLE.Admin;
  return (
    <>
      {/* mobile overlay */}
      <div className={`lg:hidden fixed inset-0 z-40 bg-slate-900/40 transition ${open?'opacity-100':'pointer-events-none opacity-0'}`} onClick={onClose}/>
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen ${collapsed?'lg:w-[76px]':'lg:w-[256px]'} w-[260px] shrink-0 surface border-r border-line flex flex-col transition-transform ${open?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>
        <div className={`h-16 flex items-center ${collapsed?'justify-center':'px-5'} border-b border-line shrink-0`}>
          {collapsed
            ? <div className="w-10 h-10 rounded-xl bg-cyan2-100 dark:bg-cyan2-900/40 flex items-center justify-center"><img src="assets/logo-niatbaik.png" className="h-7" alt=""/></div>
            : <Logo size={28}/>
          }
        </div>
        <nav className="flex-1 overflow-y-auto nice-scroll px-3 py-4 space-y-0.5">
          {!collapsed && <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Menu utama</div>}
          {navKeys.map(key => {
            const d = NAV_DEFS[key];
            if (!d) return null;
            const Ic = Icons[d.icon] || Icons.Dashboard;
            const active = route === key;
            return (
              <button key={key} onClick={()=>{navigate(key); onClose&&onClose();}} className={`w-full flex items-center ${collapsed?'justify-center px-2':'px-3'} h-11 rounded-xl text-sm font-medium transition ${active?'bg-brand-600 text-white shadow-sm':'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`} title={d.label}>
                <Ic w={20} h={20}/>
                {!collapsed && <span className="ml-3 flex-1 text-left">{d.label}</span>}
                {!collapsed && d.badge && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active?'bg-white/20 text-white':'bg-rose-500 text-white'}`}>{d.badge}</span>}
              </button>
            );
          })}
        </nav>
        {!collapsed && (
          <div className="p-3 border-t border-line">
            <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-cyan2-400 text-white p-4 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10"></div>
              <Icons.Heart w={22} h={22}/>
              <div className="mt-2 text-sm font-bold">Niat baik dimulai dari satu donasi</div>
              <div className="text-xs opacity-80 mt-1">Lihat panduan onboarding untuk admin baru.</div>
              <button className="mt-3 text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg">Pelajari →</button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function Topbar({ onMenu, title, subtitle, actions, role }){
  const { setRole, tweaks, setTweak, notifs } = useApp();
  const [openNotif, setOpenNotif] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-line">
      <div className="h-16 px-4 lg:px-6 flex items-center gap-3">
        <button className="lg:hidden h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onMenu}><Icons.Menu w={20} h={20}/></button>
        <div className="flex-1 min-w-0">
          {title && <div className="font-bold text-ink dark:text-slate-100 leading-tight truncate">{title}</div>}
          {subtitle && <div className="text-xs text-muted truncate">{subtitle}</div>}
        </div>

        {/* Search (hidden sm) */}
        <div className="hidden md:block relative w-[260px]">
          <Input icon={<Icons.Search w={18} h={18}/>} placeholder="Cari campaign, donatur, invoice…"/>
        </div>

        {/* Role switcher */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {['Admin','CS','Advertiser'].map(r=>(
            <button key={r} onClick={()=>setRole(r)} className={`px-3 h-8 rounded-lg text-xs font-semibold transition ${role===r?'bg-white dark:bg-slate-900 text-ink dark:text-white shadow-sm':'text-slate-500 hover:text-ink dark:hover:text-white'}`}>{r}</button>
          ))}
        </div>

        {/* Dark toggle */}
        <button onClick={()=>setTweak('dark', !tweaks.dark)} className="hidden sm:flex h-10 w-10 rounded-xl items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
          {tweaks.dark ? <Icons.Sun w={18} h={18}/> : <Icons.Moon w={18} h={18}/>}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={()=>setOpenNotif(!openNotif)} className="relative h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Icons.Bell w={18} h={18}/>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>
          {openNotif && (
            <div className="absolute right-0 top-12 w-[320px] surface rounded-2xl shadow-pop p-2 z-50">
              <div className="px-3 py-2 flex items-center justify-between">
                <div className="font-semibold text-sm">Notifikasi</div>
                <button className="text-xs text-brand-600 font-medium">Tandai dibaca</button>
              </div>
              <div className="max-h-[320px] overflow-auto nice-scroll">
                {NOTIFICATIONS.map(n=>(
                  <div key={n.id} className="px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <div className="text-sm font-medium text-ink dark:text-slate-100">{n.title}</div>
                    <div className="text-xs text-muted">{n.sub}</div>
                    <div className="text-[11px] text-muted mt-0.5">{n.ts}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <button onClick={()=>setOpenProfile(!openProfile)} className="flex items-center gap-2 h-10 pl-1 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
          <Avatar name={role==='Admin'?'Admin Pusat':role==='CS'?'Sari Maharani':'Dimas Iklan'} size={32}/>
          <div className="hidden md:block text-left">
            <div className="text-[13px] font-semibold leading-tight text-ink dark:text-slate-100">{role==='Admin'?'Admin Pusat':role==='CS'?'Sari Maharani':'Dimas Iklan'}</div>
            <div className="text-[11px] text-muted leading-tight">{role}</div>
          </div>
        </button>
      </div>
      {actions && <div className="px-4 lg:px-6 pb-3">{actions}</div>}
    </header>
  );
}

// ===================== Page chrome =====================
function PageHeader({ title, subtitle, actions, breadcrumb }){
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        {breadcrumb && <div className="text-xs text-muted mb-1">{breadcrumb}</div>}
        <h1 className="text-2xl font-bold text-ink dark:text-slate-100 tracking-tight">{title}</h1>
        {subtitle && <div className="text-sm text-muted mt-1">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// Campaign card (used in admin list & landing)
function CampaignCard({ c, onOpen, compact }){
  const pct = Math.min(100, Math.round((c.raised/c.target)*100));
  return (
    <Card padded={false} className="overflow-hidden group hover:-translate-y-0.5 transition cursor-pointer" onClick={onOpen}>
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={c.img} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute top-3 left-3"><Badge tone="cyan" size="sm">{c.category}</Badge></div>
        <div className="absolute bottom-3 right-3"><StatusBadge status={c.status}/></div>
      </div>
      <div className="p-4">
        <div className="font-semibold text-ink dark:text-slate-100 line-clamp-2 leading-snug min-h-[44px]">{c.title}</div>
        <div className="mt-3 flex items-baseline justify-between text-sm">
          <span className="text-muted">Terkumpul</span>
          <span className="font-bold text-brand-700 dark:text-brand-300 tnum">{fmtShort(c.raised)}</span>
        </div>
        <div className="mt-2"><ProgressBar value={c.raised} max={c.target} size="sm"/></div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span><span className="font-semibold text-ink dark:text-slate-200 tnum">{Math.min(100,Math.round(c.raised/c.target*100))}%</span> dari {fmtShort(c.target)}</span>
          <span className="tnum">{c.days>0 ? `${c.days} hari lagi` : 'Selesai'}</span>
        </div>
        {!compact && (
          <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
            <div className="text-xs text-muted">
              <span className="font-semibold text-ink dark:text-slate-200 tnum">{fmtNum(c.donors)}</span> donatur
            </div>
            <span className="text-xs text-brand-600 font-medium inline-flex items-center gap-1">Lihat <Icons.ArrowRight w={14} h={14}/></span>
          </div>
        )}
      </div>
    </Card>
  );
}

// Social proof popup
function SocialProofPopup(){
  const { tweaks } = useApp();
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(()=>{
    let t1, t2;
    const cycle = () => {
      setVisible(true);
      t1 = setTimeout(()=>{ setVisible(false); t2 = setTimeout(()=>{ setIdx(i=>(i+1)%6); cycle(); }, 1500); }, 5000);
    };
    const init = setTimeout(cycle, 2500);
    return ()=>{ clearTimeout(init); clearTimeout(t1); clearTimeout(t2); };
  },[]);
  const items = [
    { name:'Ahmad F.', amount:250_000, c:'Beasiswa 1000 Anak Dhuafa', city:'Jakarta' },
    { name:'Hamba Allah', amount:1_000_000, c:'Bangun Sekolah NTT', city:'Surabaya' },
    { name:'Siti N.', amount:50_000, c:'Paket Sekolah Yatim', city:'Bandung' },
    { name:'Rina M.', amount:500_000, c:'Beasiswa Tahfidz', city:'Yogyakarta' },
    { name:'Budi S.', amount:100_000, c:'Beasiswa 1000 Anak Dhuafa', city:'Medan' },
    { name:'Hamba Allah', amount:2_000_000, c:'Bangun Sekolah NTT', city:'Makassar' },
  ];
  if (!visible) return null;
  const it = items[idx];
  return (
    <div className="fixed bottom-24 sm:bottom-6 left-4 sm:left-6 z-40 slideIn">
      <div className="flex items-center gap-3 bg-white rounded-2xl shadow-pop border border-line p-3 pr-4 max-w-sm">
        <Avatar name={it.name} size={40}/>
        <div className="text-sm">
          <div className="text-ink"><span className="font-semibold">{it.name}</span> dari {it.city} baru saja berdonasi</div>
          <div className="text-brand-700 font-bold tnum">{fmtIDR(it.amount)} <span className="text-muted text-xs font-normal">· {it.c}</span></div>
        </div>
      </div>
    </div>
  );
}

// Trust badges row
function TrustBadges({ dark }){
  const items = [
    { icon:<Icons.Shield w={20} h={20}/>, t:'Berizin Kemensos', s:'No. 480/HUK/2023' },
    { icon:<Icons.Lock w={20} h={20}/>, t:'Transaksi aman', s:'SSL · 256-bit' },
    { icon:<Icons.Check w={20} h={20}/>, t:'Laporan transparan', s:'Audit publik' },
    { icon:<Icons.Heart w={20} h={20}/>, t:'120.000+ donatur', s:'sejak 2019' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((it,i)=>(
        <div key={i} className={`rounded-2xl p-3 flex items-center gap-3 ${dark?'bg-white/10 text-white':'bg-white border border-line'}`}>
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${dark?'bg-white/15 text-cyan2-300':'bg-brand-50 text-brand-700'}`}>{it.icon}</div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">{it.t}</div>
            <div className={`text-xs ${dark?'text-white/70':'text-muted'}`}>{it.s}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Page wrapper (with sidebar + topbar)
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

Object.assign(window, {
  AppCtx, useApp,
  Logo, Badge, StatusBadge, RoleBadge, Button, IconBtn, Card, Field, Input, Select, Toggle, ProgressBar, Stat, Avatar,
  LineChart, BarChart, Donut, Modal, Toast,
  Sidebar, Topbar, PageHeader, CampaignCard, SocialProofPopup, TrustBadges, AppShell,
  NAV_BY_ROLE, NAV_DEFS,
});

// Shared UI primitives. Ported from components.jsx → named exports.
import { useMemo, type ReactNode, type CSSProperties } from 'react';
import { Icon } from '@/components/Icon';
import { fmtIDR, fmtIDRShort, fmtNum } from '@/lib/format';
import { mediaUrl } from '@/lib/api';
import { useDataStore } from '@/store/data';

export const Card = ({ children, className = '', as: Tag = 'div', ...rest }: any) => (
  <Tag className={'bg-white rounded-2xl border border-line shadow-card ' + className} {...rest}>
    {children}
  </Tag>
);

export const StatCard = ({ icon, label, value, delta, deltaTone = 'up', accent = 'brand', sub }: any) => {
  const accents: Record<string, string> = {
    brand: 'bg-brand-50  text-brand-600',
    sky: 'bg-sky2-50   text-sky2-500',
    ok: 'bg-emerald-50 text-emerald-600',
    warn: 'bg-amber-50  text-amber-600',
    bad: 'bg-rose-50   text-rose-600',
    ink: 'bg-slate-100 text-slate-700',
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
          <Icon name={icon} size={20} strokeWidth={2} />
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className={'inline-flex items-center gap-1 font-semibold ' + (deltaTone === 'up' ? 'text-emerald-600' : 'text-rose-600')}>
            <Icon name={deltaTone === 'up' ? 'arrowUp' : 'arrowDown'} size={12} strokeWidth={2.4} />
            {delta}
          </span>
          <span className="text-mute">vs minggu lalu</span>
        </div>
      )}
    </Card>
  );
};

export const Badge = ({ tone = 'slate', children, dot = false, size = 'md', className = '' }: any) => {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    brand: 'bg-brand-50  text-brand-700',
    sky: 'bg-sky2-50   text-sky2-600',
    ok: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50  text-amber-700',
    bad: 'bg-rose-50   text-rose-700',
    purple: 'bg-violet-50 text-violet-700',
    outline: 'border border-line text-ink bg-white',
  };
  const sizes: Record<string, string> = { sm: 'text-[10px] px-1.5 py-0.5', md: 'text-xs px-2 py-1', lg: 'text-sm px-2.5 py-1' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${tones[tone]} ${sizes[size]} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
};

export const StatusBadge = ({ status, size }: any) => {
  const map: Record<string, any> = {
    Draft: { tone: 'slate', label: 'Draft' },
    Published: { tone: 'sky', label: 'Published' },
    Running: { tone: 'ok', label: 'Running', dot: true },
    Ended: { tone: 'slate', label: 'Ended' },
    Paid: { tone: 'ok', label: 'Paid', dot: true },
    Pending: { tone: 'warn', label: 'Pending', dot: true },
    Failed: { tone: 'bad', label: 'Failed', dot: true },
    active: { tone: 'ok', label: 'Active', dot: true },
    inactive: { tone: 'slate', label: 'Inactive' },
    pending: { tone: 'warn', label: 'Pending', dot: true },
    paid: { tone: 'ok', label: 'Paid', dot: true },
  };
  const m = map[status] || { tone: 'slate', label: status };
  return <Badge tone={m.tone} size={size} dot={m.dot}>{m.label}</Badge>;
};

export const RoleBadge = ({ role }: any) => {
  const map: Record<string, string> = { Admin: 'brand', CS: 'sky', Advertiser: 'purple', Fundraiser: 'ok' };
  return <Badge tone={map[role] || 'slate'}>{role}</Badge>;
};

export const Progress = ({ value, max, height = 'h-2', showLabel = false, tone = 'brand' }: any) => {
  const pct = Math.min(100, (value / max) * 100);
  const toneCls = tone === 'brand' ? 'bg-brand-600' : tone === 'ok' ? 'bg-emerald-500' : 'bg-slate-400';
  return (
    <div>
      <div className={`relative w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
        <div className={`absolute inset-y-0 left-0 ${toneCls} rounded-full transition-all`} style={{ width: pct + '%' }} />
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

export const Btn = ({ children, variant = 'solid', tone = 'brand', size = 'md', icon, iconRight, className = '', ...rest }: any) => {
  const sizes: Record<string, string> = { sm: 'text-xs px-2.5 py-1.5 gap-1.5', md: 'text-sm px-3.5 py-2 gap-2', lg: 'text-base px-5 py-3 gap-2' };
  const tones: Record<string, Record<string, string>> = {
    brand: {
      solid: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm',
      outline: 'border border-brand-600 text-brand-600 hover:bg-brand-50',
      ghost: 'text-brand-600 hover:bg-brand-50',
    },
    sky: {
      solid: 'bg-sky2-400 hover:bg-sky2-500 text-white',
      outline: 'border border-sky2-400 text-sky2-500 hover:bg-sky2-50',
      ghost: 'text-sky2-500 hover:bg-sky2-50',
    },
    ink: {
      solid: 'bg-ink hover:bg-slate-800 text-white',
      outline: 'border border-line text-ink hover:bg-bg2',
      ghost: 'text-ink hover:bg-slate-100',
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
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 18 : 16} />}
    </button>
  );
};

export const SearchInput = ({ placeholder = 'Cari…', value, onChange, className = '', size = 'md' }: any) => {
  const sz = size === 'sm' ? 'h-9 text-sm' : 'h-10 text-sm';
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
      <input
        className={`w-full ${sz} rounded-lg border border-line bg-white pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600`}
        placeholder={placeholder} value={value} onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  );
};

export const Select = ({ value, onChange, options, className = '', icon }: any) => (
  <div className={`relative ${className}`}>
    {icon && <Icon name={icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />}
    <select
      value={value} onChange={(e) => onChange && onChange(e.target.value)}
      className={`appearance-none w-full h-10 rounded-lg border border-line bg-white ${icon ? 'pl-9' : 'pl-3'} pr-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600`}>
      {options.map((o: any) => typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <Icon name="chevronD" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
  </div>
);

export const BarChart = ({ data: rawData, height = 160, labels }: any) => {
  const data = (Array.isArray(rawData) ? rawData : []).map((d: any) => typeof d === 'object' ? (d.amount || d.value || 0) : (Number(d) || 0));
  const max = Math.max(...data) || 1;
  return (
    <div className="w-full">
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((v: number, i: number) => {
          const h = (v / max) * (height - 24);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="invisible group-hover:visible absolute -top-7 bg-ink text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                {fmtIDRShort(v)}
              </div>
              <div className="w-full rounded-t-md transition-all group-hover:opacity-80 bg-brand-600" style={{ height: h }} />
            </div>
          );
        })}
      </div>
      {labels && (
        <div className="mt-2 flex gap-1 text-[10px] text-mute">
          {labels.map((l: any, i: number) => <div key={i} className="flex-1 text-center">{l}</div>)}
        </div>
      )}
    </div>
  );
};

let _lcId = 0;
export const LineChart = ({ data: rawData, height = 180, color = '#2E4191', secondary = '#38B6FF', fill = true }: any) => {
  const gradId = useMemo(() => 'lc-g' + (++_lcId), []);
  const data = (Array.isArray(rawData) ? rawData : []).map((d: any) => typeof d === 'object' ? (d.amount || d.value || 0) : (Number(d) || 0));
  if (data.length < 2) return <div className="text-xs text-mute text-center py-8">Data belum tersedia</div>;
  const w = 600, h = height;
  const max = Math.max(...data) * 1.15 || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v: number, i: number) => [i * step, h - (v / max) * (h - 30) - 10]);
  const d = pts.map((p: number[], i: number) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const dArea = d + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={secondary} stopOpacity="0.25" />
          <stop offset="100%" stopColor={secondary} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="0" x2={w} y1={10 + i * (h - 30) / 3} y2={10 + i * (h - 30) / 3} stroke="#E2E8F0" strokeDasharray="3 4" />
      ))}
      {fill && <path d={dArea} fill={`url(#${gradId})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.filter((_: number[], i: number) => i % 4 === 0).map((p: number[], i: number) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="white" stroke={color} strokeWidth="2" />
      ))}
    </svg>
  );
};

export const Donut = ({ data, size = 160, thickness = 22 }: any) => {
  const total = data.reduce((s: number, d: any) => s + d.value, 0);
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={thickness} />
      {data.map((d: any, i: number) => {
        const len = (d.value / total) * c;
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${len} ${c}`} strokeDashoffset={-off}
            transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        );
        off += len;
        return el;
      })}
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" className="fill-ink" style={{ fontSize: 18, fontWeight: 700 }}>
        {fmtNum(total)}
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" className="fill-mute" style={{ fontSize: 10 }}>
        TOTAL
      </text>
    </svg>
  );
};

export const CampaignThumb = ({ c, className = '' }: any) => (
  <div className={'relative rounded-xl overflow-hidden bg-bg2 ' + className} style={c.img ? {} : { background: c.thumb }}>
    {c.img ? (
      <img src={mediaUrl(c.img)} alt={c.title || ''} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center text-white/80">
        <Icon name={c.icon || 'heart'} size={56} strokeWidth={1.2} />
      </div>
    )}
    <div className="absolute inset-0 bg-black/30" />
    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
      <Badge tone="outline" size="sm" className="bg-white/90 backdrop-blur">{c.category}</Badge>
      <Badge tone={c.status === 'Running' ? 'ok' : c.status === 'Ended' ? 'slate' : c.status === 'Published' ? 'sky' : 'warn'} size="sm" className="bg-white/90 backdrop-blur">
        {c.status}
      </Badge>
    </div>
  </div>
);

export const UtmGrid = ({ utm = {}, editable = false, onChange }: any) => {
  const fields = [
    { key: 'source', label: 'utm_source' },
    { key: 'medium', label: 'utm_medium' },
    { key: 'content', label: 'utm_content' },
    { key: 'campaign', label: 'utm_campaign' },
    { key: 'term', label: 'utm_term' },
    { key: 'id', label: 'utm_id' },
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
                <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Modal = ({ open, onClose, title, children, size = 'md', footer }: any) => {
  if (!open) return null;
  const sizes: Record<string, string> = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-start pt-[5vh] lg:items-center lg:pt-0 justify-center p-4 overflow-y-auto" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
      <div className={`relative bg-white rounded-2xl shadow-pop w-full ${sizes[size]} max-h-[92vh] flex flex-col`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-bg2 flex items-center justify-center text-mute">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-line bg-bg2 rounded-b-2xl flex items-center justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
};

export const InvoiceModal = ({ txn, onClose, onCopy }: any) => {
  if (!txn) return null;
  const Field = ({ label, value, mono }: any) => (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-mute font-medium">{label}</div>
      <div className={'mt-0.5 text-sm text-ink ' + (mono ? 'font-mono' : 'font-medium')}>{value || '—'}</div>
    </div>
  );
  return (
    <Modal open onClose={onClose} title="Detail Invoice" size="lg"
      footer={
        <Btn variant="outline" tone="ink" icon="copy" onClick={() => onCopy && onCopy(txn.id)}>Salin invoice</Btn>
      }>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-line">
          <div>
            <div className="text-xs text-mute">Kode Invoice</div>
            <div className="mt-1 font-mono text-2xl font-bold text-ink">{txn.id}</div>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={txn.status} />
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
          <Field label="Donatur" value={txn.anon ? 'Anonim (Hamba Allah)' : txn.donor} />
          <Field label="Campaign" value={txn.campaign} />
          <Field label="WhatsApp" value={txn.whatsapp} mono />
          <Field label="Email" value={txn.email} mono />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-mute font-semibold mb-2">Pesan / Doa Donatur</div>
          <div className="bg-bg2 rounded-xl p-3 text-sm text-ink italic">"{txn.message}"</div>
        </div>
        <div className="rounded-xl border border-line p-4">
          <div className="text-xs uppercase tracking-wider text-mute font-semibold mb-3">UTM & Ads Tracking</div>
          <UtmGrid utm={txn.utm} />
          <div className="mt-4 pt-4 border-t border-line">
            <div className="text-[11px] uppercase tracking-wider text-mute font-semibold mb-2">Click ID</div>
            <Field label={txn.utm?.source ? `${txn.utm.source} click id` : 'click id'} value={txn.clickId} mono />
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-mute font-semibold mb-2">Catatan CS</div>
          {/* Read-only here — this modal is a viewer (opened from search/dashboard).
              Notes are edited in the CS Inbox panel which has the save handler. */}
          <div className="w-full min-h-[60px] rounded-xl border border-line bg-bg2 p-3 text-sm text-ink whitespace-pre-wrap">
            {txn.note ? txn.note : <span className="text-mute">Belum ada catatan. Tambahkan dari CS Inbox.</span>}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const Toast = ({ message, tone = 'ok' }: any) => {
  if (!message) return null;
  const tones: Record<string, string> = { ok: 'bg-emerald-600', bad: 'bg-rose-600', ink: 'bg-ink' };
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`${tones[tone]} text-white px-4 py-2.5 rounded-xl shadow-pop text-sm font-medium flex items-center gap-2`}>
        <Icon name="check" size={16} strokeWidth={2.4} />
        {message}
      </div>
    </div>
  );
};

export const PageHeader = ({ title, subtitle, actions }: any) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
    <div>
      <h1 className="text-2xl font-bold text-ink tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Empty = ({ icon = 'inbox', title = 'Belum ada data', sub = '', action }: any) => (
  <div className="text-center py-12">
    <div className="mx-auto h-14 w-14 rounded-2xl bg-bg2 flex items-center justify-center text-mute mb-3">
      <Icon name={icon} size={26} />
    </div>
    <div className="font-semibold text-ink">{title}</div>
    {sub && <div className="mt-1 text-sm text-mute">{sub}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Tabs = ({ tabs, value, onChange, variant = 'pill' }: any) => {
  if (variant === 'underline') {
    return (
      <div className="flex items-center gap-6 border-b border-line">
        {tabs.map((t: any) => (
          <button key={t.value} onClick={() => onChange(t.value)}
            className={`relative py-2.5 text-sm font-semibold transition-colors ${value === t.value ? 'text-brand-600' : 'text-mute hover:text-ink'}`}>
            {t.label}{t.count !== undefined && <span className={`ml-1.5 text-xs ${value === t.value ? 'text-brand-600' : 'text-mute'}`}>({t.count})</span>}
            {value === t.value && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-600 rounded-full" />}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="inline-flex p-1 bg-bg2 rounded-lg border border-line">
      {tabs.map((t: any) => (
        <button key={t.value} onClick={() => onChange(t.value)}
          className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${value === t.value ? 'bg-white text-ink shadow-sm' : 'text-mute hover:text-ink'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
};

export const Toggle = ({ value, onChange, label, sub }: any) => (
  <label className="flex items-start justify-between gap-3 cursor-pointer">
    <div>
      {label && <div className="text-sm font-semibold text-ink">{label}</div>}
      {sub && <div className="text-xs text-mute mt-0.5">{sub}</div>}
    </div>
    <button type="button" onClick={() => onChange(!value)} className={`relative shrink-0 h-6 w-11 rounded-full transition-colors ${value ? 'bg-brand-600' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </label>
);

export const SourcePill = ({ source }: any) => {
  const map: Record<string, any> = {
    facebook: { label: 'Meta Ads', bg: 'bg-[#1877F2]', tx: 'text-white' },
    instagram: { label: 'Instagram', bg: 'bg-[#E1306C]', tx: 'text-white' },
    google: { label: 'Google', bg: 'bg-white border border-line', tx: 'text-ink' },
    tiktok: { label: 'TikTok', bg: 'bg-black', tx: 'text-white' },
    '(direct)': { label: 'Direct', bg: 'bg-slate-100', tx: 'text-slate-700' },
    organic: { label: 'Organic', bg: 'bg-emerald-50 text-emerald-700', tx: '' },
  };
  const m = map[source] || map['(direct)'];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.bg} ${m.tx}`}>{m.label}</span>;
};

// Logo renders the admin-uploaded logo (Settings → Branding, publicSettings.logo). No
// bundled default image — when none is uploaded it falls back to a text wordmark so the
// brand stays consistent with whatever is configured in Settings.
export const Logo = ({ size = 28, light = false }: { size?: number; light?: boolean }) => {
  const logo = useDataStore((s) => s.publicSettings)?.logo;
  if (logo) return <img src={mediaUrl(logo)} alt="NIATBAIK.ORG" style={{ height: size }} className="block" />;
  // `light` = wordmark for a dark background (e.g. the login side panel).
  return (
    <span className={`font-extrabold tracking-tight ${light ? 'text-white' : 'text-brand-600'}`} style={{ fontSize: size * 0.6 }}>
      NIATBAIK<span className={light ? 'text-white/70' : 'text-ink'}>.ORG</span>
    </span>
  );
};

export type { CSSProperties, ReactNode };

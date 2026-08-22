// Public-facing landing + campaign + donation flow — internal helpers + sections.
// Ported from _legacy_src/public/public-app.jsx. Donation submit / gateway-routing
// / invoice-poll logic kept byte-identical except for the window.* → import swaps
// documented in PORT_CONTRACT.md.
import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { fmtIDR, fmtIDRShort, fmtNum, NOMINAL_PRESETS } from '@/lib/format';
import { api, mediaUrl, sanitizeHTML, normalizeRichTextColors } from '@/lib/api';
import { NBTracking } from '@/lib/tracking';
import { Icon, Logo } from '@/components';
import { useDataStore } from '@/store/data';
import { useAuth } from '@/context/AuthContext';
import { interpolate } from '@/lib/interpolate';

export const getCampaigns = (): any[] => {
  const list = useDataStore.getState().campaigns;
  return (list && list.length) ? list : [];
};
export const getFirstCampaign = () => getCampaigns()[0] || { id:'', title:'', category:'', target:1, raised:0, donors:0, daysLeft:0, thumb:'', icon:'heart' };
// socialProofLines was a legacy global never populated in the new store; returns [].
const getSocialProof = (): any[] => [];

// pctLabel avoids Math.round collapsing a tiny-but-nonzero progress (e.g. 0.25%) to "0%",
// which reads as "nothing raised". Shows "<1%" for 0<pct<1, else the rounded integer.
const pctLabel = (raised: number, target: number): string => {
  if (!target || target <= 0) return '0%';
  const pct = (raised / target) * 100;
  if (pct <= 0) return '0%';
  if (pct < 1) return '<1%';
  return Math.min(100, Math.round(pct)) + '%';
};
// hasDeadline: a campaign with a positive daysLeft OR a real duration shows a countdown;
// otherwise it's open-ended ("tanpa batas waktu", shown with an infinity indicator).
const hasDeadline = (c: any): boolean => Number(c?.daysLeft) > 0 || Number(c?.duration_days) > 0 || Number(c?.durationDays) > 0;

// timeAgoID: relative time in Indonesian ("7 jam yang lalu", "3 hari yang lalu") for the
// prayer list. Falls back to '' on unparseable input.
const timeAgoID = (v: unknown): string => {
  if (!v) return '';
  const t = new Date(v as any).getTime();
  if (isNaN(t)) return '';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'baru saja';
  const m = Math.floor(s / 60); if (m < 60) return `${m} menit yang lalu`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} jam yang lalu`;
  const d = Math.floor(h / 24); if (d < 30) return `${d} hari yang lalu`;
  const mo = Math.floor(d / 30); if (mo < 12) return `${mo} bulan yang lalu`;
  return `${Math.floor(mo / 12)} tahun yang lalu`;
};

// Parse a campaign's form_fields_config JSON (button labels etc.) safely.
const parseFormFieldsConfig = (ffc: any) => {
  try { return ffc ? JSON.parse(ffc) : {}; } catch { return {}; }
};

// donorPaymentMethods returns the list of payment methods the donor can use for a campaign:
// the per-campaign override (campaign.payment_config) when present, else the global public
// list. Single source of truth shared by CampaignPage (for submit-time routing) and
// DonationForm (for the picker) so they never disagree.
const donorPaymentMethods = (c: any) => {
  try {
    const parsed = c && c.payment_config ? JSON.parse(c.payment_config) : null;
    if (Array.isArray(parsed) && parsed.length) {
      const rows = parsed.filter((r: any) => r && (r.bank || r.account)).map((r: any, i: number) => ({
        id: r.id || ('camp-' + i),
        bank_name: r.bank || '', bank_number: r.account || '', account_name: r.holder || '',
        type: r.method || 'va',
        category: r.method === 'ewallet' ? 'ewallet' : (r.method === 'qris' ? 'qris' : 'bank_transfer'),
        admin_fee: 0,
      }));
      if (rows.length) return rows;
    }
  } catch { /* fall through to global list */ }
  const pm = useDataStore.getState().paymentMethodsPublic;
  return (Array.isArray(pm) && pm.length) ? pm : null;
};

// firstGatewayMethod returns the first method that settles via a HOSTED gateway
// (flip/moota/xendit) from a method list, or null if all are manual. When non-null the
// donor form hides its picker and routes straight to that gateway.
const firstGatewayMethod = (methods: any) => {
  if (!Array.isArray(methods)) return null;
  return methods.find((m: any) => m && ['flip', 'moota', 'xendit'].includes(String(m.gateway || '').toLowerCase())) || null;
};

// Resolve the CS contact(s) from public settings. In 'rotator' mode a contact is
// picked pseudo-randomly so load spreads across numbers; otherwise the first is used.
const getCsContacts = () => {
  const s = useDataStore.getState().publicSettings || {};
  let list: any[] = [];
  try { const p = s.cs_contacts ? JSON.parse(s.cs_contacts) : []; if (Array.isArray(p)) list = p; } catch {}
  list = list.filter((x: any) => x && (x.phone || '').trim());
  return { list, mode: s.cs_rotator_mode || 'default' };
};
const pickCsContact = () => {
  const { list, mode } = getCsContacts();
  if (!list.length) return null;
  if (mode === 'rotator') return list[Math.floor(Math.random() * list.length)];
  return list[0];
};
// Normalize an Indonesian WA number to wa.me form (digits, country code 62). Mirrors the
// backend normalizeWA so a stored cs_phone and a freshly-typed number resolve identically:
// "08…"→"628…", bare "8…"→"628…", already-"62…" kept as-is.
const normalizeWa = (n: any) => {
  const d = String(n || '').replace(/[^0-9]/g, '');
  if (!d) return '';
  if (d.startsWith('62')) return d;
  if (d.startsWith('0')) return '62' + d.slice(1);
  if (d.startsWith('8')) return '62' + d;
  return d;
};
// Shared WhatsApp contact href (configured CS contact — rotator-aware — else the admin
// WhatsApp). Used by the footer contact link and the mobile bottom nav's Bantuan tab.
export const getKontakHref = () => {
  const publicSettings = useDataStore.getState().publicSettings;
  const cs = pickCsContact();
  const waNum = normalizeWa((cs && cs.phone) || (publicSettings && publicSettings.whatsapp_admin) || '');
  return waNum ? `https://wa.me/${waNum}` : '';
};

// Resolve a campaign's display image: the dedicated uploaded `img`, else any image
// path stuffed into `thumb`. Returns '' when there's only a gradient/no image.
const campaignImage = (c: any) => {
  if (!c) return '';
  if (c.img) return c.img;
  const t = c.thumb;
  if (typeof t === 'string' && t && !t.startsWith('linear')) return t;
  return '';
};
// True when the campaign has a real uploaded image (so the placeholder Icon should
// be hidden — previously it was drawn ON TOP of the photo, covering it).
const hasThumbImage = (c: any) => !!campaignImage(c);

// Background style for a campaign thumb box. Uses the uploaded image as a cover
// background when present, otherwise the saved gradient, otherwise a brand gradient.
const thumbStyle = (c: any) => {
  // Backwards-compat: callers may pass the campaign object (preferred) or a bare
  // thumb string. Normalize to a campaign-like shape.
  const camp = (c && typeof c === 'object') ? c : { thumb: c };
  const img = campaignImage(camp);
  if (img) {
    const url = mediaUrl(img);
    return { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  const t = camp.thumb;
  if (typeof t === 'string' && t.startsWith('linear')) return { background: t };
  return { background: '#2E4191' };
};

// -------- Helpers --------
const PrimaryBtn = ({ children, size = 'md', className = '', ...rest }: any) => {
  const sizes: any = { sm:'text-sm px-4 py-2', md:'text-base px-5 py-3', lg:'text-lg px-7 py-4', xl:'text-lg px-8 py-4.5' };
  return (
    <button {...rest} className={`inline-flex items-center justify-center gap-2 font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

const Progress = ({ value, max, className = 'h-2' }: any) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={`relative w-full ${className} bg-slate-100 rounded-full overflow-hidden`}>
      <div className="absolute inset-y-0 left-0 bg-brand-600 rounded-full" style={{ width: pct + '%' }}/>
    </div>
  );
};

// -------- Dark mode helper (public pages) --------
export function usePublicDark(): [boolean, () => void] {
  const [dark, setDarkRaw] = useState(() => document.documentElement.classList.contains('dark'));
  const toggle = () => {
    const v = !dark;
    setDarkRaw(v);
    document.documentElement.classList.toggle('dark', v);
    document.body.classList.toggle('dark', v);
    try { localStorage.setItem('niatbaik_dark', v ? '1' : '0'); } catch {}
  };
  return [dark, toggle];
}

// -------- Navbar --------
// Navbar is the shared public header used on BOTH the landing page and the campaign page,
// so the donor sees one consistent navbar (no stripped-down variant). `onHome` controls
// what the logo / section links do: on the landing page they're in-page anchors; on a
// campaign page (onHome provided) they first return to the landing route, then scroll to
// the section so the link still lands the donor in the right place.
export function Navbar({ onNav, onHome }: any) {
  const [open, setOpen] = useState(false);
  const [dark, toggleDark] = usePublicDark();
  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  // Admin-uploaded logo (Settings → Branding) with the static asset as fallback.
  const navLogo = useDataStore((s) => s.publicSettings)?.logo;
  // CMS-editable nav links / labels (Settings → Homepage), falling back to the defaults.
  const cms = useDataStore((s) => s.siteContent)?.navbar || {};
  const links = (Array.isArray(cms.links) && cms.links.length ? cms.links : [
    { label:'Campaign', href:'#campaigns' },
    { label:'Bagaimana?', href:'#how' },
    { label:'Testimoni', href:'#testi' },
    { label:'FAQ', href:'#faq' },
  ]).map((x: any) => ({ l: x.label, h: x.href }));
  const ctaPrimary = cms.ctaPrimary || 'Donasi Sekarang';
  // Section-link click. On the landing page let the native anchor jump handle it. On a
  // campaign page, go home first, then scroll to the target section after it renders.
  const goSection = (e: any, hash: string) => {
    if (!onHome) return; // landing → default anchor behavior
    e.preventDefault();
    setOpen(false);
    onHome();
    const id = hash.replace('#', '');
    setTimeout(() => { try { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); } catch {} }, 120);
  };
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center gap-4">
        <button onClick={() => onNav('home')} className="flex items-center">
          {navLogo ? <img src={mediaUrl(navLogo)} alt="NIATBAIK.ORG" className="h-8"/> : <Logo size={32}/>}
        </button>
        <nav className="hidden lg:flex items-center gap-1 ml-6">
          {links.map((l) => (
            <a key={l.l} href={l.h} onClick={(e) => goSection(e, l.h)} className="px-3 py-2 rounded-lg text-sm font-semibold text-ink/80 hover:bg-bg2 hover:text-ink">{l.l}</a>
          ))}
        </nav>
        <div className="flex-1"/>
        {/* Desktop-only: on mobile the drawer already has a Dark Mode item. */}
        <button onClick={toggleDark} aria-label="Toggle dark mode"
          className="hidden lg:flex h-9 w-9 rounded-lg border border-line bg-white hover:bg-bg2 items-center justify-center text-ink">
          <Icon name={dark ? 'sun' : 'moon'} size={16}/>
        </button>
        {/* No login button here: public-facing pages deliberately don't advertise the
            dashboard. Staff reach it via the discreet "Masuk" link in the footer. */}
        <PrimaryBtn size="sm" onClick={() => onNav('campaign', getFirstCampaign())}>
          <Icon name="heart" size={16}/> {ctaPrimary}
        </PrimaryBtn>
        <button onClick={() => setOpen(!open)} className="lg:hidden h-9 w-9 rounded-lg hover:bg-bg2 flex items-center justify-center"><Icon name="menu" size={20}/></button>
      </div>
      {/* Mobile drawer: slides in from the RIGHT. Kept mounted so the CSS
          transform transition animates both open and close. Portaled to <body>:
          the sticky z-30 header creates a stacking context, so without the portal
          the drawer's z-50 is trapped inside it and paints BEHIND the hero /
          other sticky sections. */}
      {createPortal(<>
      <div className={`lg:hidden fixed inset-0 z-[90] bg-ink/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)} aria-hidden="true"/>
      <aside className={`lg:hidden fixed top-0 right-0 z-[100] h-full w-72 max-w-[85vw] bg-white shadow-pop flex flex-col
        transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog" aria-label="Menu">
        <div className="h-16 px-4 flex items-center justify-between border-b border-line">
          {navLogo ? <img src={mediaUrl(navLogo)} alt="NIATBAIK.ORG" className="h-7"/> : <Logo size={28}/>}
          <button onClick={() => setOpen(false)} aria-label="Tutup menu" className="h-9 w-9 rounded-lg hover:bg-bg2 flex items-center justify-center">
            <Icon name="close" size={18}/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
          {links.map((l) => (
            <a key={l.l} href={l.h} className="px-3 py-2.5 rounded-lg text-sm font-semibold text-ink/80 hover:bg-bg2" onClick={(e) => { if (onHome) goSection(e, l.h); else setOpen(false); }}>{l.l}</a>
          ))}
          <button onClick={toggleDark} className="px-3 py-2.5 rounded-lg text-sm font-semibold text-ink/80 hover:bg-bg2 text-left flex items-center gap-2">
            <Icon name={dark ? 'sun' : 'moon'} size={16}/> {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
        <div className="p-4 border-t border-line">
          <PrimaryBtn size="md" className="w-full justify-center" onClick={() => { setOpen(false); onNav('campaign', getFirstCampaign()); }}>
            <Icon name="heart" size={16}/> {ctaPrimary}
          </PrimaryBtn>
        </div>
      </aside>
      </>, document.body)}
    </header>
  );
}

// -------- Mobile bottom navigation --------
// App-style bottom tab bar (mobile-first pattern popularized by donation platforms like
// adaorangbaik.com): Beranda / Campaign / raised center Donasi FAB / Cara / Bantuan.
// Desktop keeps the top navbar only — this bar is hidden ≥lg. `onDonate` is contextual:
// landing scrolls to the campaign list, a campaign page opens the donation form. When
// omitted (e.g. the invoice page) the FAB slot collapses into four even tabs.
// `trackSections` (landing) highlights the tab whose section is in view.
export function MobileBottomNav({ onHome, onDonate, goSection, waHref, trackSections }: any) {
  // '#' is the campaign page's "no CS number" sentinel — treat it as absent so the tab
  // falls back to FAQ instead of linking to a dead hash.
  const helpHref = (typeof waHref === 'string' && waHref && waHref !== '#') ? waHref : '';
  const [active, setActive] = useState('home');
  useEffect(() => {
    if (!trackSections) return;
    const ids = ['campaigns', 'how', 'testi', 'faq'];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    // A section counts as "current" while it crosses the middle band of the viewport.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id === 'testi' ? 'how' : e.target.id); });
    }, { rootMargin: '-40% 0px -50% 0px' });
    els.forEach((el) => io.observe(el));
    const onScroll = () => { if (window.scrollY < 240) setActive('home'); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, [trackSections]);

  const item = (key: string, icon: string, label: string, onClick: any, href?: string) => {
    const cls = `flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
      active === key ? 'text-brand-600' : 'text-mute'}`;
    const inner = <><Icon name={icon} size={20}/><span className="text-[10px] font-bold leading-none">{label}</span></>;
    return href
      ? <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={label}>{inner}</a>
      : <button key={key} onClick={onClick} aria-label={label} className={cls}>{inner}</button>;
  };
  return (
    <nav aria-label="Navigasi utama"
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-line shadow-[0_-6px_24px_rgba(15,23,42,.09)] pb-safe">
      <div className="flex items-stretch h-16 max-w-md mx-auto px-1">
        {item('home', 'home', 'Beranda', onHome)}
        {item('campaigns', 'megaphone', 'Campaign', () => goSection('#campaigns'))}
        {onDonate ? (
          <div className="relative flex-1">
            <button onClick={onDonate} aria-label="Donasi sekarang"
              className="absolute left-1/2 -translate-x-1/2 -top-5 h-14 w-14 rounded-2xl bg-brand-600 text-white shadow-pop flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform">
              <Icon name="heart" size={20}/>
              <span className="text-[9px] font-extrabold leading-none">Donasi</span>
            </button>
          </div>
        ) : item('donasi', 'heart', 'Donasi', () => goSection('#campaigns'))}
        {item('how', 'book', 'Cara', () => goSection('#how'))}
        {helpHref
          ? item('help', 'wa', 'Bantuan', null, helpHref)
          : item('faq', 'quote', 'FAQ', () => goSection('#faq'))}
      </div>
    </nav>
  );
}

// -------- Hero --------
export function Hero({ onNav }: any) {
  const totals = useDataStore((s) => s.totals);
  const cms = useDataStore((s) => s.siteContent)?.hero || {};
  const tvars = { donors: fmtNum(totals.donors || 0), raised: fmtIDRShort(totals.raised || 0), activeCampaigns: fmtNum(totals.activeCampaigns || 0) };
  const badge = interpolate(cms.badge, tvars) || `${fmtNum(totals.donors || 0)} donatur aktif`;
  const paragraph = cms.paragraph
    ? interpolate(cms.paragraph, tvars)
    : `Donasi terverifikasi untuk kemanusiaan, kesehatan, pendidikan, dan wakaf. Transparan, mudah, dan dipercaya${(totals.donors > 0) ? ` oleh ${fmtNum(totals.donors)}+ donatur` : ''} di Indonesia.`;
  const trustLines = (Array.isArray(cms.trustLines) && cms.trustLines.length ? cms.trustLines : ['SSL Aman', 'Berizin Kemensos', 'Audit publik bulanan']);
  const ctaPrimary = cms.ctaPrimary || 'Mulai Donasi';
  const ctaSecondary = cms.ctaSecondary || 'Lihat Campaign';
  return (
    <section className="relative overflow-hidden bg-bg2 border-b border-line">
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-50 opacity-60 blur-3xl"/>
      <div className="absolute top-40 -left-32 h-72 w-72 rounded-full bg-brand-100 opacity-50 blur-3xl"/>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-12 lg:py-20 text-center relative flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-line shadow-card text-xs font-bold text-ink">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/>
          <span>{badge}</span>
          {cms.badgeSub !== '' && <span className="text-mute font-normal hidden sm:inline">{cms.badgeSub || '· Update real-time'}</span>}
        </div>

        <h1 className="mt-5 text-3xl sm:text-4xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-ink max-w-2xl">
          {cms.headline || 'Salurkan'} <span className="text-brand-600">{cms.headlineAccent || 'Niat Baik'}</span> {cms.headlineTail || 'Anda, wujudkan kebaikan nyata.'}
        </h1>
        <p className="mt-5 text-lg text-mute max-w-xl leading-relaxed">{paragraph}</p>

        {/* Mobile: stacked full-width pair (identical size); ≥sm: side by side. */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-md sm:max-w-none sm:w-auto">
          <PrimaryBtn size="lg" className="ctaPulse w-full sm:w-auto" onClick={() => {
            const el = document.getElementById('campaigns');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}>
            <Icon name="heart" size={18}/> {ctaPrimary}
          </PrimaryBtn>
          {/* Sizing mirrors PrimaryBtn lg so the CTA pair reads as one set. */}
          <button onClick={() => document.getElementById('campaigns')?.scrollIntoView({behavior:'smooth'})} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-lg font-bold text-ink hover:bg-white ring-1 ring-inset ring-line bg-white/60">
            <Icon name="eye" size={18}/> {ctaSecondary}
          </button>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-3 w-full max-w-lg">
          {[
            { v: fmtIDRShort(totals.raised || 0), l:'Donasi tersalurkan' },
            { v: fmtNum(totals.donors || 0) + '+', l:'Donatur bersama' },
            { v: fmtNum(totals.activeCampaigns || 0), l:'Campaign aktif' },
          ].map((s, i) => (
            <div key={i} className="bg-white/80 backdrop-blur border border-line rounded-xl p-3">
              <div className="text-xl lg:text-2xl font-extrabold text-brand-600 leading-none">{s.v}</div>
              <div className="text-[11px] text-mute mt-1.5 leading-tight">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-mute">
          {trustLines.map((t: string, i: number) => (
            <span key={i} className="inline-flex items-center gap-1.5"><Icon name={i === 0 ? 'shield' : 'check'} size={14} className="text-emerald-600"/> {t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------- Logo strip (trust) --------
// Official logos bundled as static assets (frontend/public/trust/, sourced from Wikimedia
// Commons). On hover-capable devices (desktop) logos are grayscale and colorize on hover;
// touch devices (mobile/tablet) can't hover, so they show full color from the start.
// If an image fails to load the item falls back to the institution name so the strip
// never shows a broken image.
const TRUST_LOGOS = [
  { name: 'Kementerian Sosial RI', src: '/trust/kemensos.svg' },
  { name: 'BAZNAS', src: '/trust/baznas.svg' },
  { name: 'PWNU', src: '/trust/nu.svg' },
  { name: 'Muhammadiyah', src: '/trust/muhammadiyah.svg' },
  { name: 'detikcom', src: '/trust/detik.png' },
  { name: 'CNN Indonesia', src: '/trust/cnn-indonesia.svg' },
  { name: 'Tempo', src: '/trust/tempo.svg' },
  { name: 'Liputan6', src: '/trust/liputan6.svg' },
  { name: 'Kompas', src: '/trust/kompas.svg' },
  { name: 'OJK', src: '/trust/ojk.png' },
];

export function TrustStrip() {
  const cms = useDataStore((s) => s.siteContent)?.trust_strip || {};
  const logos = (Array.isArray(cms.items) && cms.items.length ? cms.items : TRUST_LOGOS);
  const caption = cms.caption || 'Diliput & dipercaya oleh';
  return (
    <section className="py-8 border-y border-line bg-bg2/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center text-xs font-semibold uppercase tracking-widest text-mute mb-4">{caption}</div>
        <div className="relative">
          <div className="marquee flex gap-4 items-stretch">
            {[...logos, ...logos].map((l: any, i: number) => (
              <div key={i} className="shrink-0 flex items-center px-6 py-3 rounded-lg bg-white border border-line" title={l.name}>
                <img src={l.src} alt={l.name} loading="lazy"
                  className="h-7 max-w-[130px] w-auto object-contain transition duration-200 [@media(hover:hover)]:grayscale [@media(hover:hover)]:opacity-75 [@media(hover:hover)]:hover:grayscale-0 [@media(hover:hover)]:hover:opacity-100"
                  onError={(e: any) => {
                    // Swap the broken image for the plain-text name (previous behavior).
                    const span = document.createElement('span');
                    span.className = 'text-ink/70 font-bold text-sm whitespace-nowrap';
                    span.textContent = l.name;
                    e.target.replaceWith(span);
                  }}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// -------- Stats --------
export function StatsSection() {
  // Real platform stats from /stats. No more hardcoded "Rp 1,84 M+ / 412 / 34 Provinsi"
  // literals that contradicted the actual numbers.
  const totals = useDataStore((s) => s.totals);
  const stats = [
    { icon:'wallet',    v:fmtIDRShort(totals.raised || 0), l:'Donasi tersalurkan' },
    { icon:'users',     v:fmtNum(totals.donors || 0), l:'Donatur bersama' },
    { icon:'megaphone', v:fmtNum(totals.activeCampaigns || 0), l:'Campaign aktif' },
    { icon:'check',     v:fmtNum(totals.totalCampaigns || 0), l:'Total campaign' },
  ];
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl bg-brand-600 p-5 text-white">
              <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center mb-3"><Icon name={s.icon} size={20}/></div>
              <div className="text-2xl lg:text-3xl font-extrabold">{s.v}</div>
              <div className="text-sm text-white/85 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------- Campaigns --------
export function CampaignsSection({ onNav }: any) {
  const filterTabs = [{v:'all',l:'Semua'},{v:'Medis',l:'Medis'},{v:'Pendidikan',l:'Pendidikan'},{v:'Wakaf',l:'Wakaf'},{v:'Bencana',l:'Bencana'},{v:'Ramadan',l:'Ramadan'}];
  const [tab, setTab] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const src = useDataStore((s) => s.campaigns);
  const campaigns = src.filter((c: any) => c.status === 'Running' || c.status === 'Published' || c.status === 'Berjalan');
  const filteredAll = tab === 'all' ? campaigns : campaigns.filter((c: any) => c.category === tab);
  // Show only the 6 newest by default; "Lihat semua" reveals the rest in place.
  const filtered = showAll ? filteredAll : filteredAll.slice(0, 6);

  return (
    <section id="campaigns" className="py-14 lg:py-20 bg-bg2">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Mobile-first: heading stacks above a single-row, edge-to-edge scrollable chip
            rail (wrapping chips ate two rows on phones); ≥lg it goes back beside the
            heading. -mx-4/px-4 matches the section padding so chips scroll under it. */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Campaign aktif</div>
            <h2 className="mt-2 text-2xl sm:text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">Mari bersama wujudkan kebaikan</h2>
            <p className="mt-2 text-mute">Pilih salah satu campaign terverifikasi di bawah ini.</p>
          </div>
          <div className="-mx-4 px-4 lg:mx-0 lg:px-0 flex gap-2 overflow-x-auto no-scrollbar lg:flex-wrap lg:overflow-visible pb-1">
            {filterTabs.map((t) => (
              <button key={t.v} onClick={() => setTab(t.v)}
                className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${tab===t.v ? 'bg-ink text-white' : 'bg-white text-ink border border-line hover:bg-brand-50'}`}>
                {t.l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c: any) => <PublicCampaignCard key={c.id} c={c} onNav={onNav}/>)}
        </div>

        {!showAll && filteredAll.length > 6 && (
          <div className="mt-8 text-center">
            <button onClick={() => setShowAll(true)} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-ink bg-white border border-line hover:bg-bg2">
              Lihat semua campaign ({filteredAll.length}) <Icon name="arrowR" size={16}/>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function PublicCampaignCard({ c, onNav }: any) {
  return (
    <div onClick={() => onNav('campaign', c)} className="group cursor-pointer rounded-2xl bg-white border border-line shadow-card hover:shadow-pop transition-all hover:-translate-y-1 overflow-hidden">
      <div className="relative aspect-[16/10] bg-cover bg-center" style={thumbStyle(c)}>
        {!hasThumbImage(c) && <div className="absolute inset-0 flex items-center justify-center text-white/85"><Icon name={c.icon} size={70} strokeWidth={1.2}/></div>}
        {/* Keep the photo bright: only soft top+bottom gradients for badge legibility,
            not a flat dark veil over the whole image (that made covers look "redup"). */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent"/>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent"/>
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-white/95 text-[11px] font-bold text-ink">{c.category}</span>
          {c.isUrgent && <span className="px-2 py-0.5 rounded-md bg-rose-500 text-[11px] font-bold text-white">URGENT</span>}
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur text-[11px] font-bold text-white inline-flex items-center gap-1">
          <Icon name="calendar" size={11}/> {c.daysLeft} hari
        </div>
      </div>
      <div className="p-4">
        <div className="font-bold text-ink line-clamp-2 min-h-[2.8rem] leading-snug group-hover:text-brand-600 transition-colors">{c.title}</div>
        <div className="mt-3"><Progress value={c.raised} max={c.target}/></div>
        <div className="mt-2 flex items-baseline justify-between text-xs">
          <span><span className="text-mute">Terkumpul</span> <b className="text-brand-600 text-sm">{fmtIDRShort(c.raised)}</b></span>
          <span className="text-mute">{fmtNum(c.donors)} donatur</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-mute">Target {fmtIDRShort(c.target)}</div>
          <span className="text-sm font-bold text-brand-600 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Donasi <Icon name="arrowR" size={14}/></span>
        </div>
      </div>
    </div>
  );
}

// -------- How-to-donate --------
export function HowToSection() {
  const cms = useDataStore((s) => s.siteContent)?.how_to || {};
  const steps = (Array.isArray(cms.steps) && cms.steps.length ? cms.steps : [
    { title:'Pilih campaign', desc:'Pilih campaign sesuai niat baik Anda dari daftar terverifikasi.', icon:'megaphone' },
    { title:'Tentukan nominal', desc:'Isi nominal donasi. Mulai dari Rp 10.000.', icon:'wallet' },
    { title:'Pilih pembayaran', desc:'Bayar via QRIS, VA Bank, atau e-wallet favorit Anda.', icon:'creditcard' },
    { title:'Doakan & sebar', desc:'Donasi tersalurkan. Ajak teman ikut dalam kebaikan.', icon:'heart' },
  ]);
  const eyebrow = cms.eyebrow || 'Cara berdonasi';
  const heading = cms.heading || 'Mudah · Hanya 60 detik';
  const sub = cms.sub || 'Donasi via NIATBAIK.ORG bisa dilakukan kapan saja, tanpa perlu daftar akun.';
  return (
    <section id="how" className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-600">{eyebrow}</div>
          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">{heading}</h2>
          <p className="mt-2 text-mute">{sub}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s: any, i: number) => (
            <div key={i} className="relative">
              <div className="rounded-2xl bg-white border border-line p-6 hover:border-brand-200 hover:shadow-card transition-all h-full">
                <div className="h-12 w-12 rounded-xl bg-brand-600 text-white flex items-center justify-center"><Icon name={s.icon || 'heart'} size={22}/></div>
                <div className="mt-4 text-xs font-bold text-mute">LANGKAH {i + 1}</div>
                <div className="font-extrabold text-ink text-lg mt-0.5">{s.title}</div>
                <div className="mt-1.5 text-sm text-mute leading-relaxed">{s.desc}</div>
              </div>
              {i < steps.length - 1 && <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 text-mute"><Icon name="arrowR" size={20}/></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------- Testimonials --------
export function TestimonialsSection() {
  const totals = useDataStore((s) => s.totals);
  const cms = useDataStore((s) => s.siteContent)?.testimonials || {};
  const items = (Array.isArray(cms.items) && cms.items.length ? cms.items : [
    { name:'Ibu Sari, Bekasi',   rating:'⭐⭐⭐⭐⭐', quote:'Alhamdulillah, donasi saya untuk Aira dilaporkan transparan. Bahkan saya dikirim foto setelah operasinya. Sangat amanah.', color:'#2E4191' },
    { name:'Pak Burhan, Bandung', rating:'⭐⭐⭐⭐⭐', quote:'Sudah 3 tahun rutin sedekah lewat NIATBAIK. Donasi via QRIS, cepat dan langsung dapat kuitansi via WhatsApp.', color:'#38B6FF' },
    { name:'Hamba Allah',         rating:'⭐⭐⭐⭐⭐', quote:'Donasi anonim juga dilayani. Yang penting niatnya baik, sampai ke yang membutuhkan. Terima kasih NIATBAIK.', color:'#16A34A' },
    { name:'Andini, Surabaya',    rating:'⭐⭐⭐⭐⭐', quote:'Saya jadi fundraiser di NIATBAIK. Mudah dipakai, dan komisi bisa saya donasikan lagi. Berkah!', color:'#F59E0B' },
  ]);
  const eyebrow = cms.eyebrow || 'Apa kata donatur';
  const heading = (totals.donors > 0)
    ? interpolate(cms.headingTpl, { donors: fmtNum(totals.donors) }) || `Bergabung bersama ${fmtNum(totals.donors)}+ donatur Indonesia`
    : (cms.headingFallback || 'Bergabung bersama para donatur Indonesia');
  const sub = cms.sub || 'Cerita nyata dari donatur yang mempercayakan niat baiknya melalui NIATBAIK.ORG.';
  return (
    <section id="testi" className="py-14 lg:py-20 bg-brand-700 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-sky2-100">{eyebrow}</div>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">{heading}</h2>
            <p className="mt-3 text-white/85">{sub}</p>
            <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
              <div><div className="text-2xl font-extrabold">{fmtNum(totals.donors || 0)}</div><div className="text-xs text-white/75">Donatur</div></div>
              <div><div className="text-2xl font-extrabold">{fmtIDRShort(totals.raised || 0)}</div><div className="text-xs text-white/75">Tersalurkan</div></div>
              <div><div className="text-2xl font-extrabold">{fmtNum(totals.activeCampaigns || 0)}</div><div className="text-xs text-white/75">Campaign aktif</div></div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((t: any, i: number) => (
              <div key={i} className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-5">
                <div className="text-amber-300 text-sm">{t.rating || '⭐⭐⭐⭐⭐'}</div>
                <p className="mt-3 text-sm text-white/90 leading-relaxed">"{t.quote}"</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: t.color || '#2E4191' }}>{(t.name || '?')[0]}</div>
                  <div className="text-sm font-bold">{t.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// -------- FAQ --------
export function FAQ() {
  const cms = useDataStore((s) => s.siteContent)?.faq || {};
  const items = (Array.isArray(cms.items) && cms.items.length ? cms.items : [
    { question:'Apakah donasi saya terverifikasi dan aman?', answer:'Setiap campaign di NIATBAIK.ORG melalui proses verifikasi tim kami: kunjungan lapangan, dokumen pengaju, hingga update rutin. Donatur juga menerima laporan transparan tiap minggu.' },
    { question:'Bagaimana saya tahu donasi sudah diterima?', answer:'Setelah pembayaran sukses, Anda akan menerima notifikasi & kuitansi otomatis via WhatsApp dan email. Riwayat donasi juga tampil di halaman campaign.' },
    { question:'Apa metode pembayaran yang didukung?', answer:'QRIS, Virtual Account BCA/Mandiri/BNI/BRI, GoPay, OVO, Dana, ShopeePay, hingga kartu kredit. Tinggal pilih yang paling nyaman.' },
    { question:'Apakah saya bisa donasi sebagai Hamba Allah?', answer:'Tentu. Centang "Donasi sebagai anonim" pada form, dan nama Anda akan tampil sebagai Hamba Allah di halaman publik.' },
    { question:'Apakah donasi saya bisa dijadikan zakat?', answer:'Ya. Campaign tertentu dapat menjadi penyaluran zakat. Anda akan mendapatkan bukti penyaluran zakat untuk pengurang pajak.' },
    { question:'Apakah ada minimum donasi?', answer:'Minimum donasi Rp 10.000. Tidak ada batas maksimum.' },
  ]);
  const eyebrow = cms.eyebrow || 'Pertanyaan umum';
  const heading = cms.heading || 'Hal-hal yang sering ditanyakan';
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-14 lg:py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 lg:px-6">
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-600">{eyebrow}</div>
          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">{heading}</h2>
        </div>
        <div className="mt-8 space-y-3">
          {items.map((f: any, i: number) => (
            <div key={i} className={`rounded-2xl border ${open === i ? 'border-brand-200 bg-brand-50/40 shadow-card' : 'border-line bg-white'} transition-all`}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full px-5 py-4 flex items-center justify-between text-left">
                <span className="font-bold text-ink">{f.question}</span>
                <Icon name="chevronD" size={18} className={`text-mute transition-transform ${open === i ? 'rotate-180 text-brand-600' : ''}`}/>
              </button>
              {open === i && <div className="px-5 pb-4 text-sm text-ink/80 leading-relaxed">{f.answer}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------- Final CTA --------
export function FinalCTA({ onNav }: any) {
  const cms = useDataStore((s) => s.siteContent)?.final_cta || {};
  const headline = cms.headline || 'Setiap niat baik, sekecil apapun, berdampak besar.';
  const sub = cms.sub || 'Mulai donasi sekarang dan jadilah bagian dari kebaikan yang nyata.';
  const buttonLabel = cms.buttonLabel || 'Donasi Sekarang';
  return (
    <section className="py-14 lg:py-20 bg-bg2">
      <div className="max-w-5xl mx-auto px-4 lg:px-6">
        <div className="relative rounded-3xl bg-brand-600 p-8 lg:p-12 text-white overflow-hidden">
          <div className="relative grid lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">{headline}</h3>
              <p className="mt-3 text-white/85">{sub}</p>
            </div>
            <button onClick={() => onNav('campaign', getFirstCampaign())} className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-extrabold bg-white text-brand-600 hover:scale-[1.02] transition-transform shadow-pop">
              <Icon name="heart" size={20}/> {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// -------- Footer --------
export function Footer() {
  // Real contact link from configured CS/admin WhatsApp (same source the donation flow
  // uses). Footer link targets that don't have a real destination yet are rendered as
  // plain non-clickable text instead of deceptive href="#" dead links — on a donation
  // site, a "Kebijakan privasi" link that goes nowhere erodes trust (and is a legal gap).
  const publicSettings = useDataStore((s) => s.publicSettings);
  const cms = useDataStore((s) => s.siteContent)?.footer || {};
  const kontakHref = useMemo(getKontakHref, [publicSettings]);

  const blurb = cms.blurb || 'Platform donasi & crowdfunding terpercaya. Salurkan zakat, sedekah, wakaf, dan donasi kemanusiaan dengan mudah.';
  const waCtaLabel = cms.waCtaLabel || 'Hubungi kami via WhatsApp';
  const copyright = cms.copyright || '© 2026 Yayasan NIATBAIK.';
  const sslNote = cms.sslNote || 'Koneksi terenkripsi (SSL)';
  // Default columns mirror the previous hardcoded footer. The "wa" sentinel href resolves
  // to the live WhatsApp contact link.
  const columns = (Array.isArray(cms.columns) && cms.columns.length ? cms.columns : [
    { title: 'Platform', links: [{ label: 'Donasi', href: '#campaigns' }, { label: 'Fundraiser', href: '#how' }, { label: 'Laporan transparansi', href: '#testi' }] },
    { title: 'Tentang', links: [{ label: 'Profil Yayasan' }, { label: 'Disklaimer', href: '/disklaimer' }] },
    { title: 'Bantuan', links: [{ label: 'FAQ', href: '#faq' }, { label: 'Kontak', href: 'wa' }, { label: 'Syarat & ketentuan', href: '/syarat-ketentuan' }, { label: 'Kebijakan privasi', href: '/kebijakan-privasi' }] },
  ]);
  const resolveHref = (h?: string) => (h === 'wa' ? kontakHref : h);

  // Render an anchor when a destination exists, else dim plain text ("coming soon").
  const FLink = ({ href, children }: any) => href
    ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="hover:text-white cursor-pointer">{children}</a>
    : <span className="text-white/45" title="Segera hadir">{children}</span>;

  return (
    <footer className="bg-ink text-white pt-14 pb-28 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 grid grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="col-span-2">
          {/* Logo on a white chip so its real brand colors stay correct on the dark footer
              (the old invert/brightness hack washed the navy wordmark out). */}
          <div className="inline-flex items-center rounded-xl bg-white px-3 py-2 shadow-sm">
            {publicSettings?.logo ? <img src={mediaUrl(publicSettings.logo)} alt="NIATBAIK.ORG" className="h-7"/> : <Logo size={28}/>}
          </div>
          <p className="mt-4 text-sm text-white/70 max-w-sm leading-relaxed">{blurb}</p>
          {kontakHref && (
            <a href={kontakHref} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
              <Icon name="wa" size={16}/> {waCtaLabel}
            </a>
          )}
        </div>
        {columns.map((col: any, ci: number) => (
          <div key={ci}>
            <div className="font-bold mb-3">{col.title}</div>
            <ul className="space-y-2 text-sm text-white/75">
              {(col.links || []).map((lnk: any, li: number) => (
                <li key={li}><FLink href={resolveHref(lnk.href)}>{lnk.label}</FLink></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/55">
        <div>{copyright}</div>
        <div className="flex items-center gap-4">
          {/* Discreet staff entry point — deliberately low-contrast so the login panel
              isn't advertised to donors (replaces the old navbar Masuk button). */}
          <a href="/login" className="text-white/40 hover:text-white/80 font-semibold transition-colors">Masuk</a>
          <span className="inline-flex items-center gap-1.5"><Icon name="shield" size={14}/> {sslNote}</span>
        </div>
      </div>
    </footer>
  );
}

// -------- Social proof popup --------
// Read the admin's social-proof config (Settings → Social Proof). Returns the
// resolved {enabled, intervalMs, posClass, template}. Defaults match the panel.
const POS_CLASS = ['top-4 left-4', 'top-4 right-4', 'left-4 bottom-4', 'right-4 bottom-4'];
function getSocialProofConfig() {
  const s: any = useDataStore.getState().publicSettings || {};
  const raw = s && s.social_proof_config;
  let cfg: any = {};
  if (typeof raw === 'string' && raw.trim()) { try { cfg = JSON.parse(raw) || {}; } catch {} }
  else if (raw && typeof raw === 'object') { cfg = raw; }
  // social_proof_enabled is the authoritative toggle; config.enabled mirrors it.
  const enabledTop = s && s.social_proof_enabled;
  const enabled = (cfg.enabled != null ? !!cfg.enabled : (enabledTop != null ? !!enabledTop : true));
  const secs = parseInt(cfg.interval, 10);
  const intervalMs = (secs > 0 ? secs : 8) * 1000;
  const posIdx = (typeof cfg.position === 'number' && cfg.position >= 0 && cfg.position < 4) ? cfg.position : 2;
  return { enabled, intervalMs, posClass: POS_CLASS[posIdx], template: (cfg.template || '').trim() };
}

export function SocialPopup() {
  const cfg = getSocialProofConfig();
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!cfg.enabled) return;
    const t1 = setTimeout(() => setVisible(true), 4000);
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx((i) => { const sp = getSocialProof(); return sp.length ? (i + 1) % sp.length : 0; }); setVisible(true); }, 400);
    }, cfg.intervalMs);
    return () => { clearTimeout(t1); clearInterval(id); };
  }, [cfg.enabled, cfg.intervalMs]);
  // Respect the admin toggle: when disabled, render nothing.
  if (!cfg.enabled) return null;
  const sp = getSocialProof();
  if (!sp.length) return null;
  const p = sp[idx] || sp[0];
  // If the admin set a custom template, render it with {{nama}}/{{nominal}}/{{campaign}}
  // substituted; otherwise use the default structured layout.
  const customLine = cfg.template
    ? cfg.template.replace(/\{\{\s*nama\s*\}\}/gi, p.name || '').replace(/\{\{\s*nominal\s*\}\}/gi, fmtIDR(p.amount)).replace(/\{\{\s*campaign\s*\}\}/gi, p.campaign || '')
    : '';
  return (
    <div className={`hidden lg:flex fixed ${cfg.posClass} z-30 transition-all ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
      <div className="bg-white rounded-xl shadow-pop border border-line p-3 flex items-center gap-3 max-w-xs">
        <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center"><Icon name="heart" size={18}/></div>
        <div className="min-w-0">
          {customLine ? (
            <div className="text-xs font-semibold text-ink">{customLine}</div>
          ) : (
            <>
              <div className="text-xs font-semibold text-ink"><b>{p.name}</b> baru saja berdonasi</div>
              <div className="text-sm font-bold text-brand-600">{fmtIDR(p.amount)}</div>
              <div className="text-[10px] text-mute truncate">untuk "{p.campaign}" · {p.when}</div>
            </>
          )}
        </div>
        <button onClick={() => setVisible(false)} className="self-start text-mute hover:text-ink"><Icon name="close" size={12}/></button>
      </div>
    </div>
  );
}

// ====================================================================
// CAMPAIGN DETAIL PAGE (public-facing)
// ====================================================================
// Parse campaign nominal presets: NOMINAL_PRESETS or c.opt_nominal (JSON array).
function getNominalPresets(c: any) {
  try {
    if (c && c.opt_nominal) {
      const parsed = JSON.parse(c.opt_nominal);
      if (Array.isArray(parsed) && parsed.length) return parsed.map(Number).filter(Boolean);
    }
  } catch {}
  if (Array.isArray(NOMINAL_PRESETS) && NOMINAL_PRESETS.length) return NOMINAL_PRESETS;
  return [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];
}

const PAYMENT_FALLBACK = ['QRIS','BCA','Mandiri','BNI','GoPay','OVO','Dana','ShopeePay'];

// Effective minimum donation for a campaign. Driven by config, not a hardcoded 10.000:
// the per-campaign min_donation wins when set, else the global min_donation_global, else
// a 10.000 default. Lets admins lower the floor (e.g. Rp 1 for production smoke-tests)
// without a code change, and keeps the frontend in lockstep with the backend's two checks.
function effectiveMin(c: any) {
  const campMin = Number(c && c.min_donation) || 0;
  if (campMin > 0) return campMin;
  const ps = useDataStore.getState().publicSettings;
  const globalMin = Number(ps && ps.min_donation_global) || 0;
  if (globalMin > 0) return globalMin;
  return 10000;
}

// ShareCampaign renders the top-right "Bagikan" button on a campaign page. On devices with
// the native Web Share API (most mobiles) it opens the OS share sheet; otherwise it toggles
// a small menu with WhatsApp / Facebook / Telegram / X + Copy-link. The shared URL is the
// canonical /c/<slug> permalink (origin + path), so it deep-links straight to this campaign.
function ShareCampaign({ c, slug }: any) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const boxRef = useRef<any>(null);

  const shareUrl = (() => {
    const s = slug || (c && c.slug) || '';
    try {
      const origin = window.location.origin;
      return origin + (s ? `/c/${s}` : window.location.pathname);
    } catch { return s ? `/c/${s}` : ''; }
  })();
  const title = (c && c.title) || 'Campaign donasi';
  const shareText = `Yuk bantu donasi: ${title}`;

  // Close the menu on an outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: any) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, text: shareText, url: shareUrl }); return true; }
      catch { return false; } // user cancelled / not allowed → fall back to menu
    }
    return false;
  };
  const onClick = async () => {
    const ok = await nativeShare();
    if (!ok) setOpen((v) => !v);
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const enc = encodeURIComponent;
  // Real brand marks with their brand colors (glyphs in Icon.tsx: wa/fb/tg/x).
  const links = [
    { key: 'wa', label: 'WhatsApp', icon: 'wa', color: 'text-[#25D366]', href: `https://wa.me/?text=${enc(shareText + ' ' + shareUrl)}` },
    { key: 'fb', label: 'Facebook', icon: 'fb', color: 'text-[#1877F2]', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}` },
    { key: 'tg', label: 'Telegram', icon: 'tg', color: 'text-[#229ED9]', href: `https://t.me/share/url?url=${enc(shareUrl)}&text=${enc(shareText)}` },
    { key: 'x', label: 'X / Twitter', icon: 'x', color: 'text-ink', href: `https://twitter.com/intent/tweet?url=${enc(shareUrl)}&text=${enc(shareText)}` },
  ];

  return (
    <div className="relative" ref={boxRef}>
      <button onClick={onClick}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-white text-sm font-bold text-ink hover:border-brand-300 hover:text-brand-600 transition-colors">
        <Icon name="link" size={16}/> Bagikan
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-white shadow-pop z-20 p-1.5">
          {links.map((l) => (
            <a key={l.key} href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-bg2">
              <Icon name={l.icon} size={16} className={l.color}/> {l.label}
            </a>
          ))}
          <button onClick={copyLink}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-bg2">
            <Icon name={copied ? 'check' : 'copy'} size={16} className={copied ? 'text-emerald-600' : 'text-brand-600'}/>
            {copied ? 'Link tersalin!' : 'Salin link'}
          </button>
        </div>
      )}
    </div>
  );
}

export function CampaignPage({ c: listItem, onNav }: any) {
  // A donor who picked a nominal on the hero card lands here with _seedAmount set —
  // honor it (and jump straight to the form) instead of resetting to the default, so the
  // amount they chose isn't silently dropped.
  const seededAmount = Number(listItem && listItem._seedAmount) || 0;
  const [view, setViewRaw] = useState(seededAmount > 0 ? 'form' : 'content'); // 'content' | 'form'
  // Opening the donation form is the funnel's LEAD step (admin Default map:
  // PageView → Lead [form opened] → InitiateCheckout [invoice created] → Purchase [paid]).
  // Fire a standard Lead ONCE per page so Events Manager sees it in order, right after
  // PageView and before the InitiateCheckout that fires on invoice-create. Guarded so
  // re-opening the form (content↔form toggling) doesn't double-fire.
  const leadFiredRef = useRef(false);
  const fireFormOpenLead = () => {
    if (leadFiredRef.current) return;
    leadFiredRef.current = true;
    try {
      NBTracking.track('Lead', {
        value: Number(amount) || 0, currency: 'IDR', content_name: (c && c.title) || '',
      });
    } catch { /* pixel fire must never break the page */ }
  };
  // Scroll to top on every view switch: on mobile the sidebar CTA stacks BELOW the
  // whole story, so tapping "Donasi Sekarang" while scrolled down would otherwise
  // render the form at the same offset and land the donor at the footer.
  const setView = (v: any) => {
    if (v === 'form') fireFormOpenLead();
    setViewRaw(v);
    try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {}
  };
  const [tab, setTab] = useState('story');
  const [amount, setAmountRaw] = useState(seededAmount > 0 ? seededAmount : 100_000);
  // No pixel event on amount pick: filling the form is not a funnel step. Lead
  // fires only once the invoice is created (see handleSubmit).
  const setAmount = (a: any) => setAmountRaw(a);

  const [paymentMethod, setPaymentMethodRaw] = useState('QRIS');
  // No pixel event on payment-method pick either — same reason as setAmount.
  const setPaymentMethod = (m: any) => setPaymentMethodRaw(m);
  const [anon, setAnon] = useState(false);
  const [donor, setDonor] = useState<any>({ name:'', wa:'', email:'', message:'' });
  const [paid, setPaid] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  // Field-level validation errors keyed by field name ('wa'|'name'|'email'|'amount'|
  // 'form'). Rendered inline under each field instead of blocking alert() dialogs,
  // which on a payment page read as broken/scammy and hide which field is wrong.
  const [errors, setErrors] = useState<any>({});
  // Track mount so a deferred setSubmitting (idempotency retry hold) doesn't fire on
  // an unmounted component if the donor navigates away during the 5s window.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // The landing list only carries summary fields (short_description, no story /
  // donors / updates). Fetch the full detail by slug and merge it over the list
  // item so the page shows this campaign's real content instead of placeholders.
  const [detail, setDetail] = useState<any>(null);
  const c: any = detail || listItem;
  const slug = listItem && (listItem.slug || listItem.id);
  // Resolve the hosted-gateway method for THIS campaign (recomputed when detail loads).
  // Used in handleSubmit so a gateway donation always sends the gateway method's id —
  // never falls back to manual just because the picker is hidden.
  const gatewayMethod = useMemo(() => firstGatewayMethod(donorPaymentMethods(c)), [c, detail]);
  useEffect(() => {
    let cancelled = false;
    if (!slug) return;
    // Scroll to top on open / campaign switch. React Router keeps the previous scroll
    // offset on SPA nav, so opening a campaign from a scrolled landing page (or after the
    // async detail fetch grows the page) otherwise lands the donor at the footer.
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch {}
    try { window.scrollTo(0, 0); } catch {}
    setDetail(null); // reset when switching campaigns so stale detail isn't shown
    (async () => {
      try {
        const res = await api.campaign(slug);
        const d = res && res.data;
        if (!cancelled && d) {
          // Normalize the detail payload onto the shape the page already uses.
          setDetail({
            ...listItem,
            ...d,
            raised: d.total_raised ?? listItem.raised ?? 0,
            donors: d.donor_count ?? listItem.donors ?? 0,
            daysLeft: d.days_left ?? listItem.daysLeft ?? 0,
            thumb: listItem.thumb || (d.image ? '/uploads/' + d.image : ''),
            category: d.category || listItem.category,
            icon: d.icon || listItem.icon,
          });
          // Load this campaign's OWN pixels (Meta/TikTok/GTM/Google Ads) so per-campaign
          // "Fire Event" tracking actually fires — initPixels() only loaded the GLOBAL ones.
          try { NBTracking.initCampaignPixels(d, useDataStore.getState().publicSettings); } catch {}
          // No ViewContent/view_campaign here — landing on a campaign already fires the
          // pixel's own PageView (injectFbq / initCampaignPixels). Firing extra standard
          // events on top just duplicated the hit in Meta Pixel Helper (funnel: PageView →
          // Lead → Contact → Purchase). GTM/dataLayer view tracking, if wanted, belongs in
          // a GTM tag off the PageView, not a second pixel event.
        }
      } catch { /* keep list item as fallback */ }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // Capture a fundraiser referral code from the share link (?ref=<username>, legacy
  // ?ref=<user_id>) once, so it can be attached to the donation and credit the referrer's
  // commission.
  const referralCode = useMemo(() => {
    try { return new URLSearchParams(window.location.search).get('ref') || ''; } catch { return ''; }
  }, []);

  // Record a fundraiser link click (total_clicks) once per session per (campaign, ref) —
  // a sessionStorage guard keeps re-renders/reloads from inflating the count. Best-effort:
  // the endpoint always 200s and we swallow errors so a share visit is never blocked.
  useEffect(() => {
    const cid = c && c.id;
    if (!referralCode || !cid) return;
    const key = `nb-refhit-${cid}-${referralCode}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch { /* ignore */ }
    api.refHit(cid, referralCode).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c && c.id, referralCode]);

  // A seeded deep-link (?amount=… or a nominal share link) mounts straight into the form
  // view without going through setView, so fire the form-open Lead once on mount in that
  // case too — otherwise those donors would skip the Lead step in the pixel funnel.
  useEffect(() => {
    if (view === 'form') fireFormOpenLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CS "need help" link: use the configured CS contact (rotator-aware), falling
  // back to the admin WhatsApp from public settings. Avoids the old hardcoded
  // placeholder number that sent every donor to a dead test contact.
  const csHelpHref = useMemo(() => {
    const cs = pickCsContact();
    const ps = useDataStore.getState().publicSettings;
    const num = normalizeWa((cs && cs.phone) || (ps && ps.whatsapp_admin) || '');
    const text = encodeURIComponent(`Halo, saya butuh bantuan terkait campaign "${(c && c.title) || ''}"`);
    return num ? `https://wa.me/${num}?text=${text}` : '#';
  }, [c && c.title]);

  const presets = useMemo(() => {
    const base = getNominalPresets(c);
    // When the admin has lowered the floor to a testing value (≤ Rp 1), surface a Rp 1
    // quick-pick so prod smoke-tests don't need manual typing. Self-gating: normal
    // campaigns keep a real floor, so live donors never see the Rp 1 chip.
    if (effectiveMin(c) <= 1 && !base.includes(1)) return [1, ...base];
    return base;
  }, [c]);
  // Prefer the campaign's own paid-donor list from the detail endpoint; fall back
  // to the global recent-transactions feed only when detail hasn't loaded.
  const detailDonors = (detail && Array.isArray(detail.donors)) ? detail.donors : null;
  const txFeed = useDataStore((s) => s.transactions);
  // Fallback feed is GLOBAL (all campaigns) — scope it to THIS campaign or another
  // campaign's donors/doa would show here while the detail fetch is in flight.
  const recentDonors = detailDonors
    || (txFeed || []).filter((t: any) => t.isPaid && t.campaignId && t.campaignId === (listItem && listItem.id)).slice(0, 8);
  const updates = (detail && Array.isArray(detail.updates)) ? detail.updates : null;

  // Admin-customizable CTA label for the campaign page (button1). The form's
  // confirm CTA (button2) is handled inside DonationForm. Falls back gracefully.
  const ctaLabel = useMemo(() => {
    const cfg = parseFormFieldsConfig(c?.form_fields_config);
    return (cfg.button1 || '').trim() || 'Donasi Sekarang';
  }, [c]);

  const updateCount = updates ? updates.length : 0;
  const tabs = [
    { v:'story', l:'Cerita' },
    { v:'updates', l:`Update (${updateCount})` },
    { v:'donors', l:`Donatur (${recentDonors.length})` },
    { v:'faq', l:'FAQ' },
  ];

  const handleSubmit = async () => {
    // Lead fires AFTER invoice creation (see below) with event_id = invoice number for
    // CAPI dedup — not here on raw click, which would double-count against that one.
    // Client-side validation mirrors the server rules so the donor gets immediate,
    // Indonesian feedback (the flowchart's "Form valid? Tidak → Pesan error" path)
    // instead of a round-trip + generic error. Errors render INLINE under each field
    // (not blocking alert() dialogs) so the donor sees exactly what to fix.
    const errs: any = {};
    const wa = (donor.wa || '').trim();
    const digits = wa.replace(/[^0-9]/g, '');
    if (!wa) errs.wa = 'No. WhatsApp wajib diisi';
    else if (digits.length < 8 || digits.length > 15) errs.wa = 'No. WhatsApp tidak valid (8–15 digit)';
    if (!anon) {
      const nm = (donor.name || '').trim();
      if (nm && nm.length < 2) errs.name = 'Nama minimal 2 karakter';
    }
    if (donor.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donor.email.trim())) errs.email = 'Format email tidak valid';
    const minAmt = effectiveMin(c);
    if (!amount || amount < minAmt) errs.amount = `Minimal donasi ${fmtIDR(minAmt)}`;
    else if (amount > 1000000000) errs.amount = 'Nominal donasi maksimal Rp 1.000.000.000';

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      // Resolve the method to send AT SUBMIT TIME. When a hosted gateway is active for this
      // campaign (gatewayMethod != null) the picker is hidden, so force the gateway method
      // object even if paymentMethod is still the default 'QRIS' string — otherwise no
      // payment_method_id is sent and the backend routes to manual (the "Xendit ga ke-load"
      // bug). Falls back to whatever the donor picked when there's no gateway (manual only).
      const effectiveMethod = gatewayMethod || paymentMethod;
      const res = await api.createDonation({
        campaign_slug: c.slug || c.id,
        donor_name: anon ? 'Hamba Allah' : (donor.name || 'Hamba Allah'),
        donor_phone: donor.wa,
        donor_email: donor.email || '',
        amount: Number(amount),
        message: donor.message || '',
        is_anonymous: anon,
        payment_method: typeof effectiveMethod === 'object' ? (effectiveMethod.bank_name || effectiveMethod.type) : effectiveMethod,
        // Send the method's UUID/synthetic id when chosen so the backend derives the channel
        // + records the exact method on the invoice (admin dashboard + correct gateway route).
        payment_method_id: (typeof effectiveMethod === 'object' && effectiveMethod) ? effectiveMethod.id : undefined,
        referral_code: referralCode || undefined,
        // Attribution: merge captured UTM (source/medium/campaign/content/term/id) so the
        // invoice carries ad-source attribution feeding the Data Studio + Advertiser views.
        ...NBTracking.getUTM(),
      });
      if (res?.data) {
        // InitiateCheckout = invoice created (donor pressed "Lanjut ke Pembayaran"). This
        // is the 'submit' funnel phase, AFTER the Lead that fired when the form opened. It
        // is admin-driven: the event name comes from the campaign's Fire Event → Submit
        // setting (conversion_config.meta.events.submit), defaulting to InitiateCheckout for
        // a Default campaign. event_id = invoice number so the browser event dedups against
        // the server-side CAPI/Events API event carrying the same id.
        try { NBTracking.fireConversion(c, 'submit', Number(amount) || 0, res.data.invoice_number); } catch {}
        // HOSTED GATEWAY (Flip / Moota / Xendit): the donor pays on the gateway's own
        // hosted page (we only get a redirect URL — VA/QRIS can't be rendered inline). Go
        // STRAIGHT there instead of showing an intermediate confirmation page that just
        // re-redirects (that intermediate page caused a redirect loop on return). The
        // backend put the hosted page in qr_url / url_alternative. Manual / inline-QRIS
        // invoices have NO http(s) gateway URL → fall through to the confirmation page,
        // which is where the bank account / QR actually needs to render.
        const gwUrl = res.data.qr_url || res.data.url_alternative || '';
        if (/^https?:\/\//i.test(gwUrl)) {
          window.location.href = gwUrl; // leave the SPA → gateway hosted checkout
          return;
        }
        setSubmitting(false); setInvoice(res.data); return; // manual/QRIS → confirmation
      }
      setErrors({ form: res?.message || 'Gagal membuat donasi' });
    } catch (e: any) {
      const msg = e?.message || 'Periksa koneksi';
      // Duplicate-donation guard (server idempotency, 60s window): hold the button
      // disabled a few seconds so an impatient donor on a slow connection can't fire
      // a second request that escapes the window and creates a duplicate invoice.
      if (/serupa baru saja|terlalu banyak|duplicate/i.test(msg)) {
        setErrors({ form: msg + ' — mohon tunggu beberapa detik sebelum mencoba lagi.' });
        setTimeout(() => { if (mountedRef.current) setSubmitting(false); }, 5000);
        return;
      }
      // Surface the backend's UNPAYABLE rejection (no payable method configured) clearly.
      setErrors({ form: 'Gagal: ' + msg });
    }
    setSubmitting(false);
  };
  void paid; void setPaid;

  return (
    <>
      {/* Sub-bar under the shared navbar: breadcrumb back (left) + share (top-right). The
          main home navigation lives in the Navbar above; this keeps the campaign-scoped
          "kembali" + the Bagikan button close to the content. */}
      {/* backdrop-blur makes this section a stacking context even when lg:static, which
          trapped the share dropdown's z-20 under the lg:sticky donation card. Keep the
          section positioned with a z above the content column on desktop instead. */}
      <section className="bg-white/90 backdrop-blur border-b border-line sticky top-0 z-30 lg:relative lg:z-40 lg:bg-bg2">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={() => onNav('home')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink">
            <Icon name="chevronL" size={16}/> Kembali ke beranda
          </button>
          <ShareCampaign c={c} slug={slug}/>
        </div>
      </section>

      {view === 'content' ? (
        <section className="bg-bg2">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-10 grid lg:grid-cols-5 gap-6">
            {/* Left main */}
            <div className="lg:col-span-3">
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-cover bg-center" style={thumbStyle(c)}>
                {!hasThumbImage(c) && <div className="absolute inset-0 flex items-center justify-center text-white/85"><Icon name={c.icon} size={140} strokeWidth={1}/></div>}
                {/* Only the top gradient remains — it keeps the category/LIVE badges legible.
                    The title no longer overlays the photo (it sits below), so the bottom
                    darkening band was removed. */}
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent"/>
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-white/95 text-[11px] font-bold text-ink">{c.category}</span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-[11px] font-bold text-white inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"/>LIVE</span>
                  {c.isUrgent && <span className="px-2.5 py-1 rounded-md bg-rose-500 text-[11px] font-bold text-white">URGENT</span>}
                </div>
              </div>

              {/* Title always sits BELOW the cover (all breakpoints) — no overlap with the
                  photo, readable on the page background in light + dark. */}
              <div className="mt-3 lg:mt-4">
                <div className="text-[11px] lg:text-xs font-semibold uppercase tracking-wide text-mute">Yayasan Niat Baik · Terverifikasi</div>
                <h1 className="mt-1 text-xl lg:text-3xl font-extrabold leading-snug lg:leading-tight text-ink">{c.title}</h1>
              </div>

              {/* Mobile-only top CTA: the full progress+donate card is in the sidebar,
                  which on phones stacks BELOW the whole story. This compact block puts a
                  donate button + progress within reach right under the title so donors
                  don't have to scroll past the entire story to act. */}
              <div className="lg:hidden mt-4 rounded-2xl bg-white border border-line shadow-card p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-mute">Donasi terkumpul</div>
                    <div className="mt-0.5 text-2xl font-extrabold text-brand-600 leading-none">{fmtIDR(c.raised)}</div>
                    <div className="text-xs text-mute mt-0.5">dari target <b>{fmtIDR(c.target)}</b></div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-extrabold text-emerald-600 text-base leading-none">{pctLabel(c.raised, c.target)}</div>
                    <div className="text-mute mt-0.5 inline-flex items-center gap-1">
                      {hasDeadline(c) ? `${c.daysLeft} hari lagi` : <><Icon name="infinity" size={12}/> Tanpa batas</>}
                    </div>
                  </div>
                </div>
                <Progress value={c.raised} max={c.target} className="h-2 mt-3"/>
                <PrimaryBtn size="lg" className="w-full mt-3" onClick={() => setView('form')}>
                  <Icon name="heart" size={18}/> {ctaLabel}
                </PrimaryBtn>
              </div>

              <div className="mt-5 rounded-2xl bg-white border border-line p-5 lg:p-6">
                <div className="flex items-center gap-3 border-b border-line pb-4">
                  <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm">YN</div>
                  <div>
                    <div className="text-sm font-bold text-ink flex items-center gap-1.5">Yayasan Niat Baik <Icon name="check" size={14} className="text-emerald-600"/></div>
                    <div className="text-xs text-mute">Pengelola campaign · Terverifikasi Kemensos</div>
                  </div>
                  <div className="ml-auto inline-flex items-center gap-2 text-xs text-mute">
                    <span className="inline-flex items-center gap-1"><Icon name="calendar" size={12}/> Dibuka 2 Mei 2026</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 border-b border-line">
                  {tabs.map((t) => (
                    <button key={t.v} onClick={() => setTab(t.v)}
                      className={`relative pb-2.5 text-sm font-bold ${tab === t.v ? 'text-brand-600' : 'text-mute hover:text-ink'}`}>
                      {t.l}
                      {tab === t.v && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-600 rounded-full"/>}
                    </button>
                  ))}
                </div>

                <div className="mt-5">
                  {tab === 'story' && <><CampaignStory c={c}/><FundraiserCTA c={c}/><FundraiserSection c={c}/><DonorPrayers donors={recentDonors}/></>}
                  {tab === 'updates' && <CampaignUpdates updates={updates}/>}
                  {tab === 'donors' && <CampaignDonors donors={recentDonors}/>}
                  {tab === 'faq' && <CampaignFAQ/>}
                </div>
              </div>
            </div>

            {/* Right progress + CTA */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-20">
                <div className="rounded-2xl bg-white border border-line shadow-card p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-mute">Donasi terkumpul</div>
                  <div className="mt-1 text-3xl font-extrabold text-brand-600">{fmtIDR(c.raised)}</div>
                  <div className="text-sm text-mute">dari target <b>{fmtIDR(c.target)}</b></div>
                  <Progress value={c.raised} max={c.target} className="h-2.5 mt-3"/>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-bg2"><div className="text-mute">Donatur</div><div className="font-extrabold text-ink">{fmtNum(c.donors)}</div></div>
                    <div className="p-2 rounded-lg bg-bg2"><div className="text-mute">Sisa hari</div><div className="font-extrabold text-rose-600">{hasDeadline(c) ? c.daysLeft : <Icon name="infinity" size={16} className="inline"/>}</div></div>
                    <div className="p-2 rounded-lg bg-bg2"><div className="text-mute">Tercapai</div><div className="font-extrabold text-emerald-600">{pctLabel(c.raised, c.target)}</div></div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-line">
                    <PrimaryBtn size="lg" className="w-full" onClick={() => setView('form')}>
                      <Icon name="heart" size={18}/> {ctaLabel}
                    </PrimaryBtn>
                    <div className="mt-2 text-center text-[11px] text-mute">
                      <Icon name="shield" size={12} className="inline mr-1 text-emerald-600"/> Pembayaran aman melalui QRIS, VA, dan e-wallet
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-line flex items-center justify-around text-[10px] font-bold text-mute">
                    <span className="inline-flex items-center gap-1"><Icon name="shield" size={12} className="text-emerald-600"/>SSL Aman</span>
                    <span className="inline-flex items-center gap-1"><Icon name="check"  size={12} className="text-emerald-600"/>Terverifikasi</span>
                    <span className="inline-flex items-center gap-1"><Icon name="heart"  size={12} className="text-rose-500"/>Donasi Aman</span>
                  </div>
                </div>

                <div className="hidden lg:block mt-3 text-center text-xs text-mute">
                  Butuh bantuan? <a href={csHelpHref} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-600 hover:underline cursor-pointer">Hubungi CS via WhatsApp</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-bg2">
          <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 lg:py-10">
            {!invoice ? (
              <DonationForm
                c={c} presets={presets}
                amount={amount} setAmount={setAmount}
                donor={donor} setDonor={setDonor}
                anon={anon} setAnon={setAnon}
                paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                submitting={submitting}
                errors={errors} setErrors={setErrors}
                onBack={() => setView('content')}
                onSubmit={handleSubmit}
              />
            ) : (
              <InvoiceConfirmation
                c={c} invoice={invoice} amount={amount} paymentMethod={paymentMethod}
                onReset={() => { setInvoice(null); setView('content'); }}
              />
            )}
          </div>
        </section>
      )}

      <SocialPopup/>
      {/* Sticky "Donasi Sekarang" bar removed per feedback — donors use the CTA on the
          donation card; the compensating bottom padding was reduced accordingly. The
          mobile bottom nav carries the same contextual action via its center FAB. */}

      <Footer/>
      {/* Bottom nav only on the content view: during the form/invoice the submit button
          is the single action and a fixed bar would collide with the mobile keyboard. */}
      {view === 'content' && (
        <MobileBottomNav
          onHome={() => onNav('home')}
          onDonate={() => setView('form')}
          goSection={(hash: string) => {
            onNav('home');
            const id = hash.replace('#', '');
            setTimeout(() => { try { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); } catch {} }, 200);
          }}
          waHref={csHelpHref}
        />
      )}
    </>
  );
}

// parseFormItemsConfig safely parses campaign.form_items_config into {kind, items, calc}.
// Empty/invalid → empty so the donor form falls back to plain nominal presets.
function parseFormItemsConfig(raw: any) {
  let o: any = {};
  if (raw && typeof raw === 'object') o = raw;
  else if (typeof raw === 'string' && raw.trim()) { try { o = JSON.parse(raw) || {}; } catch { o = {}; } }
  return {
    kind: o.kind || '',
    items: Array.isArray(o.items) ? o.items : [],
    calc: (o.calc && typeof o.calc === 'object') ? o.calc : {},
  };
}

// itemImg resolves a stored item image filename to a display URL (mediaUrl, dev-aware).
function itemImg(image: any) {
  if (!image) return '';
  const path = String(image).startsWith('/uploads/') || /^https?:\/\//.test(image) ? image : '/uploads/' + image;
  return mediaUrl(path);
}

// ItemSelect renders the donor-facing item picker for qurban / package2 / zfitrah. Each
// card shows image + name + price (+ qurban subtitle). Selecting sets the donation amount
// to the item's price.
function ItemSelect({ c, kind, items, amount, setAmount, customInput }: any) {
  const heading = kind === 'qurban' ? 'Pilih hewan qurban' : kind === 'zfitrah' ? 'Pilih paket zakat fitrah' : 'Pilih paket donasi';
  // Track the chosen item by IDENTITY (two items can share a price) and a quantity — the
  // donor buys N units and the donation amount = price × qty. selectedKey='' = none.
  const [selectedKey, setSelectedKey] = useState('');
  const [qty, setQty] = useState(1);
  void c;
  const MAX_QTY = 99;
  const choose = (key: string, price: number) => { setSelectedKey(key); setQty(1); setAmount(price); };
  const setUnits = (price: number, n: number) => { const q = Math.max(1, Math.min(MAX_QTY, n)); setQty(q); setAmount(price * q); };
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">{heading}</div>
      <div className="space-y-2.5">
        {items.map((it: any, i: number) => {
          const price = Number(it.price) || 0;
          const key = it.id || String(i);
          const selected = selectedKey === key && price > 0;
          const img = itemImg(it.image);
          const sub = kind === 'qurban'
            ? [it.animal_type, it.share && it.share !== '1' ? `Patungan ${it.share}` : (it.share === '1' ? 'Full' : ''), it.weight].filter(Boolean).join(' · ')
            : (it.desc || '');
          return (
            <div key={key}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border-2 text-left transition-all ${selected ? 'border-brand-600 bg-brand-50 shadow-card' : 'border-line bg-white hover:border-brand-200'}`}>
              {/* Left content = the selector (click to pick this item). */}
              <button type="button" onClick={() => choose(key, price)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                <div className="shrink-0 h-16 w-16 rounded-xl overflow-hidden bg-bg2 flex items-center justify-center">
                  {img ? <img src={img} alt="" className="h-full w-full object-cover" onError={(e: any)=>{e.target.style.display='none';}}/> : <Icon name="heart" size={22} className="text-brand-300"/>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-ink leading-tight truncate">{it.name || 'Paket'}</div>
                  {sub && <div className="text-[11px] text-mute truncate">{sub}</div>}
                  <div className="text-sm font-extrabold text-brand-600 mt-0.5">{fmtIDR(price)}</div>
                  {selected && qty > 1 && (
                    <div className="text-[11px] text-mute mt-0.5">{qty} × {fmtIDR(price)} = <b className="text-ink">{fmtIDR(price * qty)}</b></div>
                  )}
                </div>
              </button>
              {/* Right = 'Pilih' pill (unselected) OR a −/+ quantity stepper (selected). */}
              {selected ? (
                <div className="shrink-0 inline-flex items-center rounded-lg border-2 border-brand-600 overflow-hidden">
                  <button type="button" onClick={() => setUnits(price, qty - 1)} disabled={qty <= 1}
                    className="h-8 w-8 inline-flex items-center justify-center text-brand-600 font-extrabold disabled:opacity-40 hover:bg-brand-50">−</button>
                  <span className="w-8 text-center text-sm font-extrabold text-ink tabular-nums">{qty}</span>
                  <button type="button" onClick={() => setUnits(price, qty + 1)} disabled={qty >= MAX_QTY}
                    className="h-8 w-8 inline-flex items-center justify-center text-brand-600 font-extrabold disabled:opacity-40 hover:bg-brand-50">+</button>
                </div>
              ) : (
                <button type="button" onClick={() => choose(key, price)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 border-brand-200 text-brand-600 hover:bg-brand-50">
                  Pilih
                </button>
              )}
            </div>
          );
        })}
      </div>
      {customInput}
    </div>
  );
}

// ZakatCalc renders the donor zakat calculator (Maal/Profesi/Emas/Pertanian). The donor
// enters their base (harta / gram emas / hasil panen kg); the computed zakat becomes the
// donation amount.
function ZakatCalc({ calc, amount, setAmount }: any) {
  const [base, setBase] = useState(0);
  const type = calc.type || 'maal';
  const rate = Number(calc.rate) || 2.5;
  void amount;

  let computed = 0, label = '', placeholder = '';
  if (type === 'emas') {
    label = 'Berat emas (gram)';
    placeholder = 'cth 100';
    computed = Math.round((Number(base) || 0) * (Number(calc.gold_price_per_gram) || 0) * 0.025);
  } else if (type === 'pertanian') {
    label = 'Hasil panen (kg)';
    placeholder = 'cth 1000';
    const pct = calc.agri_irrigation === 'mandiri' ? 0.05 : 0.10;
    const kg = Number(base) || 0;
    const nisab = Number(calc.agri_nisab_kg) || 520;
    computed = kg >= nisab ? Math.round(kg * (Number(calc.agri_price_per_kg) || 0) * pct) : 0;
  } else {
    label = type === 'profesi' ? 'Penghasilan (Rp)' : 'Total harta (Rp)';
    placeholder = 'cth 50.000.000';
    computed = Math.round((Number(base) || 0) * (rate / 100));
  }

  useEffect(() => { setAmount(computed > 0 ? computed : 0); /* eslint-disable-next-line */ }, [computed]);

  const typeLabel: any = { maal:'Zakat Maal', profesi:'Zakat Penghasilan', emas:'Zakat Emas', pertanian:'Zakat Pertanian' }[type] || 'Zakat';
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">{typeLabel}</div>
      <div className="rounded-2xl border-2 border-line bg-white p-4 space-y-3">
        <div>
          <label className="text-xs font-bold text-mute">{label}</label>
          <div className="mt-1 flex items-center rounded-xl border-2 border-line bg-white focus-within:border-brand-600">
            {type !== 'emas' && type !== 'pertanian' && <span className="pl-3 text-mute font-bold">Rp</span>}
            <input type="number" min="0" inputMode="numeric" value={base} onChange={(e) => setBase(Math.max(0, Math.floor(+e.target.value || 0)))} placeholder={placeholder}
              className="flex-1 px-3 py-3 outline-none font-bold text-ink bg-transparent"/>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-line">
          <span className="text-sm font-bold text-ink">Zakat yang ditunaikan</span>
          <span className="text-lg font-extrabold text-brand-600">{fmtIDR(computed)}</span>
        </div>
        {type === 'pertanian' && (
          <div className="text-[11px] text-mute leading-relaxed">
            Nisab {Number(calc.agri_nisab_kg) || 520} kg · rate {calc.agri_irrigation === 'mandiri' ? '5% (mandiri)' : '10% (tadah hujan)'}. Zakat wajib bila hasil ≥ nisab.
          </div>
        )}
        {(type === 'maal' || type === 'profesi') && (
          <div className="text-[11px] text-mute leading-relaxed">
            Rate {rate}% dari nilai harta/penghasilan. Zakat wajib bila telah mencapai <b>nisab</b> (setara 85 gram emas) dan haul 1 tahun.
          </div>
        )}
        {type === 'emas' && <div className="text-[11px] text-mute leading-relaxed">Harga emas Rp {fmtNum(Number(calc.gold_price_per_gram)||0)}/gram × 2.5%. Nisab emas 85 gram.</div>}
      </div>
    </div>
  );
}

// -------- Nominal selector: 6 form_style variants --------
// Card | List | Typing | Package | Package2 | Qurban (from c.form_style)
function NominalSelect({ c, presets, amount, setAmount }: any) {
  const style = (c && c.form_style) || 'Card';
  const minHint = `Minimal donasi ${fmtIDR(effectiveMin(c))}. Tidak ada batas maksimum.`;

  // Custom-form items / calculator (form_items_config). When configured, these REPLACE the
  // plain nominal presets with a real item picker / zakat calculator. Falls back to the
  // preset rendering below when empty/invalid, so existing campaigns are unaffected.
  const fic = parseFormItemsConfig(c && c.form_items_config);
  if (fic.kind === 'zakat_calc') {
    return <ZakatCalc calc={fic.calc} amount={amount} setAmount={setAmount}/>;
  }
  if (fic.items.length > 0 && (fic.kind === 'qurban' || fic.kind === 'package2' || fic.kind === 'zfitrah')) {
    return <ItemSelect c={c} kind={fic.kind} items={fic.items} amount={amount} setAmount={setAmount} customInput={null}/>;
  }
  const customInput = (
    <div className="mt-3">
      <label className="text-xs font-bold text-mute">Atau masukkan nominal lain</label>
      <div className="mt-1 flex items-center rounded-xl border-2 border-line bg-white focus-within:border-brand-600">
        <span className="pl-3 text-mute font-bold">Rp</span>
        <input type="number" min="0" step="1000" inputMode="numeric" value={amount} onChange={(e) => setAmount(Math.max(0, Math.floor(+e.target.value || 0)))} className="flex-1 px-2 py-3 outline-none font-bold text-ink bg-transparent"/>
      </div>
    </div>
  );

  if (style === 'Typing') {
    return (
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Masukkan nominal donasi</div>
        <div className="flex items-center rounded-2xl border-2 border-line bg-white focus-within:border-brand-600">
          <span className="pl-4 text-mute font-extrabold text-xl">Rp</span>
          <input type="number" min="0" step="1000" inputMode="numeric" value={amount} onChange={(e) => setAmount(Math.max(0, Math.floor(+e.target.value || 0)))} placeholder="0"
            className="flex-1 px-3 py-4 outline-none font-extrabold text-ink text-2xl bg-transparent"/>
        </div>
        <div className="mt-2 text-xs text-mute">{minHint}</div>
      </div>
    );
  }

  if (style === 'List') {
    return (
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Pilih nominal donasi</div>
        <div className="space-y-2">
          {presets.map((p: any) => (
            <button key={p} onClick={() => setAmount(p)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${amount===p ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink hover:border-brand-200'}`}>
              <span className="font-extrabold">{fmtIDRShort(p)}</span>
              <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${amount===p ? 'border-brand-600 bg-brand-600 text-white' : 'border-line'}`}>
                {amount===p && <Icon name="check" size={12}/>}
              </span>
            </button>
          ))}
        </div>
        {customInput}
      </div>
    );
  }

  if (style === 'Package') {
    return (
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Pilih paket donasi</div>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((p: any, i: number) => (
            <button key={p} onClick={() => setAmount(p)}
              className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${amount===p ? 'border-brand-600 bg-brand-50' : 'border-line bg-white hover:border-brand-200'}`}>
              <div className={`text-[11px] font-bold uppercase tracking-wider ${amount===p ? 'text-brand-600' : 'text-mute'}`}>Paket {i+1}</div>
              <div className="font-extrabold text-ink text-lg mt-0.5">{fmtIDRShort(p)}</div>
              <div className="text-[11px] text-mute mt-0.5 leading-tight">Donasi {fmtIDR(p)} untuk campaign ini</div>
            </button>
          ))}
        </div>
        {customInput}
      </div>
    );
  }

  if (style === 'Package2') {
    return (
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Pilih paket donasi</div>
        <div className="grid grid-cols-2 gap-3">
          {presets.map((p: any, i: number) => (
            <button key={p} onClick={() => setAmount(p)}
              className={`rounded-2xl border-2 overflow-hidden transition-all text-left ${amount===p ? 'border-brand-600 shadow-card' : 'border-line hover:border-brand-200'}`}>
              <div className="relative aspect-[16/10] flex items-center justify-center text-white/85" style={thumbStyle(c)}>
                {!hasThumbImage(c) && <Icon name={c.icon} size={44} strokeWidth={1.2}/>}
                {amount===p && <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-brand-600 text-white flex items-center justify-center"><Icon name="check" size={14}/></span>}
              </div>
              <div className="p-3">
                <div className={`text-[11px] font-bold uppercase tracking-wider ${amount===p ? 'text-brand-600' : 'text-mute'}`}>Paket {i+1}</div>
                <div className="font-extrabold text-ink mt-0.5">{fmtIDRShort(p)}</div>
              </div>
            </button>
          ))}
        </div>
        {customInput}
      </div>
    );
  }

  if (style === 'Qurban') {
    return (
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Pilih paket qurban</div>
        <div className="space-y-2">
          {presets.map((p: any) => (
            <div key={p}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${amount===p ? 'border-brand-600 bg-brand-50' : 'border-line bg-white'}`}>
              <div className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0"><Icon name="heart" size={18}/></div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-ink leading-tight">Patungan Qurban</div>
                <div className="text-sm font-extrabold text-brand-600">{fmtIDR(p)}</div>
              </div>
              <button onClick={() => setAmount(p)}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-extrabold border-2 transition-all ${amount===p ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-200 text-brand-600 hover:bg-brand-50'}`}>
                {amount===p ? 'Dipilih ✓' : 'Pilih'}
              </button>
            </div>
          ))}
        </div>
        {customInput}
      </div>
    );
  }

  // Default: Card — 3-col grid of preset buttons + custom input.
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Pilih nominal donasi</div>
      <div className="grid grid-cols-3 gap-2">
        {presets.map((p: any) => (
          <button key={p} onClick={() => setAmount(p)}
            className={`py-2.5 rounded-xl text-sm font-extrabold border-2 transition-all ${amount===p ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink hover:border-brand-200'}`}>
            {fmtIDRShort(p)}
          </button>
        ))}
      </div>
      {customInput}
    </div>
  );
}

// -------- Donation form (form view, before invoice) --------
// PaymentSelector renders the payment-method picker in the admin-chosen display style
// (Settings → Payment → payment_display_style). 'card' = the original box grid; 'dropdown'
// = a single <select> with grouped <optgroup>s. Both call setPaymentMethod with the SAME
// method OBJECT so downstream routing (synthetic-id gateway resolution, fee note) is
// unchanged. `grouped` is {TYPE: [method,...]} or null (no API methods → string fallback).
// Human-friendly heading for a payment-method group key. Manual bank accounts carry
// type "va" (a back-compat default in donorPaymentMethods), but to the donor these are
// plain bank transfers, not virtual accounts — so show "Transfer Bank", not "VA".
const PAY_GROUP_LABEL: Record<string, string> = {
  VA: 'Transfer Bank',
  BANK_TRANSFER: 'Transfer Bank',
  BANK: 'Transfer Bank',
  MANUAL: 'Transfer Bank',
  QRIS: 'QRIS',
  EWALLET: 'E-Wallet',
};
const payGroupLabel = (key: string) => PAY_GROUP_LABEL[String(key).toUpperCase()] || key;

function PaymentSelector({ grouped, paymentMethod, setPaymentMethod, isSelected, style, fieldCls }: any) {
  // Flatten grouped methods so the dropdown can resolve a picked id back to its object.
  const flat = useMemo(() => {
    if (!grouped) return [];
    return Object.values(grouped).flat();
  }, [grouped]);

  if (style === 'dropdown') {
    if (grouped) {
      const selectedId = (typeof paymentMethod === 'object' && paymentMethod) ? paymentMethod.id : '';
      return (
        <select
          className={fieldCls}
          value={selectedId}
          onChange={(e) => {
            const m = flat.find((x: any) => String(x.id) === e.target.value);
            if (m) setPaymentMethod(m);
          }}>
          <option value="" disabled>— Pilih metode pembayaran —</option>
          {Object.entries(grouped).map(([type, list]: any) => (
            <optgroup key={type} label={payGroupLabel(type)}>
              {list.map((m: any) => <option key={m.id} value={m.id}>{m.bank_name}</option>)}
            </optgroup>
          ))}
        </select>
      );
    }
    // No API methods → fallback string list as a plain dropdown.
    return (
      <select className={fieldCls} value={typeof paymentMethod === 'string' ? paymentMethod : ''} onChange={(e) => setPaymentMethod(e.target.value)}>
        <option value="" disabled>— Pilih metode pembayaran —</option>
        {PAYMENT_FALLBACK.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    );
  }

  // Default: card / box grid. Renders each method's logo (m.image) when present —
  // structured manual banks carry a per-account logo, which makes the dropdown of
  // destination accounts scannable for donors.
  if (grouped) {
    return (
      <div className="space-y-3">
        {Object.entries(grouped).map(([type, list]: any) => (
          <div key={type}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-mute mb-1.5">{payGroupLabel(type)}</div>
            <div className="grid grid-cols-3 gap-2">
              {list.map((m: any) => (
                <button key={m.id} onClick={() => setPaymentMethod(m)}
                  className={`h-16 px-2 rounded-lg border-2 flex flex-col items-center justify-center gap-1 text-center text-[10px] font-extrabold leading-tight ${isSelected(m) ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink hover:border-brand-200'}`}>
                  {m.image ? <img src={mediaUrl(m.image)} alt={m.bank_name} className="h-5 max-w-[56px] object-contain"/> : null}
                  <span className="line-clamp-1">{m.bank_name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      {PAYMENT_FALLBACK.map((m) => (
        <button key={m} onClick={() => setPaymentMethod(m)}
          className={`h-12 rounded-lg border-2 flex items-center justify-center text-[10px] font-extrabold ${paymentMethod===m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink hover:border-brand-200'}`}>
          {m}
        </button>
      ))}
    </div>
  );
}

export function DonationForm({ c, presets, amount, setAmount, donor, setDonor, anon, setAnon, paymentMethod, setPaymentMethod, submitting, errors = {}, setErrors, onBack, onSubmit }: any) {
  const clearErr = (k: any) => { if (setErrors && errors[k]) setErrors({ ...errors, [k]: undefined }); };
  // Per-campaign payment override (campaign.payment_config) else the global public list —
  // via the shared donorPaymentMethods() so this picker and CampaignPage's submit-time
  // routing use the exact same list (otherwise they can disagree and route to manual).
  const methods = useMemo(() => donorPaymentMethods(c), [c?.payment_config]);

  // The campaign editor lets admins customize the donate-button labels (button1 on
  // the campaign page, button2 = the confirm/submit CTA), stored in form_fields_config.
  const formCfg = parseFormFieldsConfig(c?.form_fields_config);
  const submitLabel = (formCfg.button2 || '').trim() || 'Lanjut ke Pembayaran';
  // Field visibility from the admin's custom toggles. Only enforce hiding when the admin
  // explicitly authored a custom config (_custom); otherwise show all (back-compat).
  const customForm = !!formCfg._custom;
  const showEmail = !customForm || formCfg.email !== false;
  const showAnonim = !customForm || formCfg.anonim !== false;
  const showComment = !customForm || formCfg.comment !== false;

  // Group API methods by type; fallback to flat string list.
  const grouped = useMemo(() => {
    if (!methods) return null;
    const g: any = {};
    methods.forEach((m: any) => {
      const key = (m.type || m.category || 'lainnya').toUpperCase();
      (g[key] = g[key] || []).push(m);
    });
    return g;
  }, [methods]);

  const isSelected = (m: any) => {
    if (typeof paymentMethod === 'object' && paymentMethod) return paymentMethod.id === m.id;
    return false;
  };

  // Global display styles (admin Settings → Payment). boldForm thickens font/border;
  // payStyle switches the payment-method selector between card grid and dropdown.
  const ps0 = useDataStore((s) => s.publicSettings) || {};
  const boldForm = ps0.form_display_style === 'bold';
  const payStyle = ps0.payment_display_style === 'dropdown' ? 'dropdown' : 'card';
  const fieldCls = `field ${boldForm ? 'field-bold' : ''}`;

  // Admin fee is MERCHANT-borne (deducted from the campaign's share in
  // payment_service.go: campaignReceives = Subtotal - adminFee), so the donor never pays
  // it — Total = Amount (+ unique code for manual/Moota). Don't surface any "biaya admin"
  // to the donor; showing it was misleading (a fee they're never charged).
  // The unique-code note applies whenever the chosen method does NOT settle via Flip
  // (Flip disambiguates on its own; Moota-gateway + manual transfer rely on the unique
  // code). Read the per-item gateway from the chosen method; fall back to the global
  // flip_enabled flag for the legacy string-method path.
  const chosenGateway = (typeof paymentMethod === 'object' && paymentMethod && paymentMethod.gateway) || '';
  const settlesViaFlip = chosenGateway ? chosenGateway === 'flip'
    : !!(ps0 && ps0.flip_enabled);
  const subtotalNum = Number(amount) || 0;
  const totalNum = subtotalNum;

  // A hosted payment gateway (Flip / Moota / Xendit) lets the donor pick the channel on
  // the GATEWAY's own page — so showing our own method picker here is redundant and
  // confusing. When any available method routes to a hosted gateway, hide the selector and
  // auto-select a representative gateway method so submit goes straight to the gateway
  // (handleSubmit redirects on the returned hosted URL). If ALL methods are manual, keep
  // the selector (the donor must pick a bank to transfer to).
  const gatewayMethod = useMemo(() => firstGatewayMethod(methods), [methods]);
  const hideSelector = !!gatewayMethod;
  // NOTE: we deliberately do NOT auto-select the gateway method into state here. Routing is
  // guaranteed at submit time by CampaignPage's effectiveMethod = gatewayMethod || paymentMethod,
  // which always sends the gateway method's id when one exists. Mutating paymentMethod from an
  // effect would couple two components' state for no functional gain.

  return (
    <div className="rounded-2xl bg-white border border-line shadow-card p-5 lg:p-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink mb-4">
        <Icon name="chevronL" size={16}/> Kembali ke campaign
      </button>

      <div className="flex items-center gap-3 pb-4 border-b border-line">
        <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0" style={thumbStyle(c)}>
          {!hasThumbImage(c) && <div className="w-full h-full flex items-center justify-center text-white/85"><Icon name={c.icon} size={24} strokeWidth={1.5}/></div>}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-mute">Donasi untuk</div>
          <div className="font-extrabold text-ink leading-tight line-clamp-2">{c.title}</div>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {/* Nominal — 6 form_style variants */}
        <NominalSelect c={c} presets={presets} amount={amount} setAmount={setAmount}/>

        {/* Identitas */}
        <div className="pt-4 border-t border-line space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-mute">Identitas donatur</div>
          <div>
            <input className={`${fieldCls} ${errors.name ? 'border-rose-400' : ''}`} placeholder="Nama (cth: Hamba Allah)" value={donor.name} onChange={(e) => { setDonor({...donor, name:e.target.value}); clearErr('name'); }} disabled={anon}/>
            {errors.name && <div className="mt-1 text-xs text-rose-600">{errors.name}</div>}
          </div>
          <div>
            <input className={`${fieldCls} ${errors.wa ? 'border-rose-400' : ''}`} placeholder="No. WhatsApp · cth 08123… (wajib)" value={donor.wa} onChange={(e) => { setDonor({...donor, wa:e.target.value}); clearErr('wa'); }}/>
            {errors.wa
              ? <div className="mt-1 text-xs text-rose-600">{errors.wa}</div>
              : <div className="mt-1 text-[11px] text-mute">Untuk kirim bukti &amp; verifikasi donasi; tidak ditampilkan publik.</div>}
          </div>
          {/* Email / anonim / comment honor the admin's Advanced > Form > Custom field
              toggles (form_fields_config). When _custom is set, hidden fields are omitted;
              otherwise everything shows (back-compat for campaigns with no custom config). */}
          {showEmail && (
            <div>
              <input className={`${fieldCls} ${errors.email ? 'border-rose-400' : ''}`} placeholder="Email (opsional)" value={donor.email} onChange={(e) => { setDonor({...donor, email:e.target.value}); clearErr('email'); }}/>
              {errors.email && <div className="mt-1 text-xs text-rose-600">{errors.email}</div>}
            </div>
          )}
          {showAnonim && (
            <label className="flex items-center gap-2 text-sm text-ink/80">
              <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="rounded border-line"/>
              Donasi sebagai anonim (Hamba Allah)
            </label>
          )}
          {showComment && (
            <textarea className={fieldCls} rows={2} placeholder="Doa / pesan donatur (opsional)" value={donor.message} onChange={(e) => setDonor({...donor, message:e.target.value})}/>
          )}
        </div>

        {/* Pembayaran — hidden when a hosted gateway handles channel selection on its own
            page (donor picks QRIS/VA/e-wallet there). Only shown for manual transfer. */}
        {hideSelector ? (
          <div className="pt-4 border-t border-line">
            <div className="rounded-xl border border-brand-100 bg-brand-50 p-3 flex items-start gap-2 text-[12px] text-brand-800 leading-relaxed">
              <Icon name="shield" size={15} className="text-brand-600 shrink-0 mt-0.5"/>
              <span>Metode pembayaran (QRIS / Virtual Account / e-wallet) akan Anda pilih di halaman pembayaran yang aman setelah menekan tombol di bawah.</span>
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-line space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-mute">Metode pembayaran</div>
            <PaymentSelector
              grouped={grouped} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
              isSelected={isSelected} style={payStyle} fieldCls={fieldCls}
            />
          </div>
        )}

        {/* Fee disclosure — show the donor exactly what they'll pay BEFORE submitting. */}
        <div className="pt-4 border-t border-line">
          <div className="rounded-xl bg-bg2 p-4 text-sm space-y-1.5">
            <div className="flex justify-between"><span className="font-bold text-ink">Total donasi</span><b className="text-brand-600 text-lg">{fmtIDR(totalNum)}</b></div>
            {!settlesViaFlip && !hideSelector && (
              <div className="text-[11px] text-mute pt-1 leading-relaxed">
                Sistem menambahkan <b>kode unik</b> (beberapa rupiah) ke total agar pembayaran terverifikasi otomatis. Nominal final ditampilkan di halaman berikutnya.
              </div>
            )}
          </div>
          {errors.amount && <div className="mt-2 text-xs text-rose-600">{errors.amount}</div>}
        </div>

        {/* Submit-level error (API failure / UNPAYABLE rejection). */}
        {errors.form && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 leading-relaxed">
            {errors.form}
          </div>
        )}

        {/* Submit */}
        <PrimaryBtn size="lg" className="w-full" onClick={onSubmit} disabled={submitting}>
          <Icon name="heart" size={16}/> {submitting ? 'Memproses…' : submitLabel}
        </PrimaryBtn>
        <div className="text-center text-[11px] text-mute">
          <Icon name="shield" size={12} className="inline mr-1 text-emerald-600"/> Pembayaran aman melalui QRIS, VA, dan e-wallet
        </div>
      </div>
    </div>
  );
}

// -------- Invoice confirmation (after createDonation) --------
export function InvoiceConfirmation({ c, invoice: invoiceProp, amount, paymentMethod, onReset }: any) {
  const [invoice, setInvoiceState] = useState(invoiceProp);
  const [status, setStatus] = useState(invoiceProp.status || 'Menunggu Pembayaran');
  const [checking, setChecking] = useState(false);
  const [csChatOpen, setCsChatOpen] = useState(false);
  const [copied, setCopied] = useState('');
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [now, setNow] = useState(Date.now());
  // Countdown before auto-redirecting the donor to the CS WhatsApp on success (3→0).
  // null = no countdown running / cancelled (donor clicked "Lewati" or there's no CS).
  const [waCountdown, setWaCountdown] = useState<any>(null);

  // Sandbox flag from public settings: true only in non-production. Gates the tester
  // "Simulasikan Pembayaran" button, which advances QRIS/VA/manual invoices (no hosted
  // link to follow) to a paid state via the non-production-only backend endpoint.
  const psPublic = useDataStore((s) => s.publicSettings);
  const sandboxMode = !!(psPublic && psPublic.sandbox_mode);

  const total = invoice.amount ?? invoice.total ?? amount ?? 0;
  const subtotal = invoice.subtotal ?? total;
  const uniqueCode = total - subtotal;

  const pmObj = typeof paymentMethod === 'object' ? paymentMethod : null;
  const pmType = (pmObj?.type || pmObj?.category || (typeof paymentMethod === 'string' ? paymentMethod : '')).toLowerCase();

  // Hosted-gateway invoice: backend sets type_payment="Flip" or "Moota" and puts the
  // gateway's hosted payment_url in qr_url (Flip also fills url_alternative). The donor is
  // redirected there — it is NOT a scannable QRIS image. Fallback: treat any http(s) qr_url
  // as a gateway link even if type_payment is absent (older API responses). Both gateways
  // share the same redirect UX; only the label differs.
  const typePay = (invoice.type_payment || '').toLowerCase();
  const gatewayUrl = invoice.qr_url || invoice.url_alternative || '';
  const isMoota = typePay === 'moota';
  const isFlip = typePay === 'flip' || (!isMoota && /^https?:\/\//i.test(gatewayUrl));
  const isHostedGateway = isFlip || isMoota || /^https?:\/\//i.test(gatewayUrl);
  const flipUrl = gatewayUrl; // kept name for the redirect effect below
  const gatewayLabel = isMoota ? 'Moota' : 'Flip';

  // QRIS only when we have a real QR (not a hosted gateway redirect URL).
  const isQRIS = !isHostedGateway && (pmType.includes('qris') || (invoice.payment_method || '').toLowerCase().includes('qris') || (!!invoice.qr_url && !/^https?:\/\//i.test(invoice.qr_url)));
  const isPaid = invoice.is_paid || /paid|berhasil|lunas|success/i.test(status);

  // The CS contact for THIS donation. The backend assigns it once at creation (rotator /
  // least-loaded) and returns it on the invoice — so it's STICKY: identical on the success
  // + waiting screens and after a /donations/INV- reload, and load-balanced (not the old
  // per-render Math.random() that could show two different numbers in one session). Falls
  // back to a client-side pick only for legacy invoices created before this field existed.
  const assignedCs = (invoice.cs_phone || invoice.cs_name)
    ? { phone: invoice.cs_phone || '', name: invoice.cs_name || '' }
    : pickCsContact();

  // WhatsApp confirmation link shown on the success screen. Pre-fills a thank-you/confirm
  // message (invoice + nominal) to the assigned CS number (falls back to whatsapp_admin).
  // Empty when no number is configured → the button is hidden.
  const successWaHref = useMemo(() => {
    const num = normalizeWa((assignedCs && assignedCs.phone) || (psPublic && psPublic.whatsapp_admin) || '');
    if (!num) return '';
    const campTitle = (c && c.title) || '';
    const msg = encodeURIComponent(`Halo, saya sudah berdonasi.\nInvoice: ${invoice.invoice_number}\nNominal: ${fmtIDR(subtotal)}${campTitle ? `\nCampaign: ${campTitle}` : ''}\nMohon konfirmasi. Terima kasih 🙏`);
    return `https://wa.me/${num}?text=${msg}`;
  }, [invoice.invoice_number, subtotal, c && c.title, invoice.cs_phone, invoice.cs_name]);

  // The bank the donor PICKED is snapshotted onto the invoice at creation
  // (payment_instructions JSON: {bank_name, account_number, account_name, logo}). That
  // is the source of truth on the confirmation page so the donor sees exactly the
  // account they chose — not a generic org account. Tolerate string or object.
  const payInstr = useMemo(() => {
    const raw = (invoice as any).payment_instructions;
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch { return null; }
  }, [invoice]);

  // Manual-transfer destination. Order: donor's chosen bank (payment_instructions) →
  // gateway pay_code → invoice fields → single org account from public settings.
  const ps = psPublic || {};
  const bankNumber = payInstr?.account_number || invoice.pay_code || invoice.bank_number || pmObj?.bank_number || ps.bank_number || '';
  const accountName = payInstr?.account_name || pmObj?.account_name || invoice.account_name || ps.bank_account_name || 'Yayasan Niat Baik';
  const bankName = payInstr?.bank_name || pmObj?.bank_name || invoice.payment_method || ps.bank_name || (typeof paymentMethod === 'string' ? paymentMethod : 'Transfer Bank');
  const bankLogo = payInstr?.logo ? mediaUrl(payInstr.logo) : '';

  // A manual/VA invoice with NO payable destination (no Flip link, no QR, no account
  // number) is the UNPAYABLE dead-end. The backend now rejects creating these, but guard
  // the display too so any legacy/edge invoice surfaces a clear error + CS path instead of
  // a passive "we'll contact you" that looks intentional.
  const noPayableDestination = !isHostedGateway && !isQRIS && !bankNumber;

  // Expiry countdown for time-sensitive manual transfers. expired_at comes from the
  // invoice; show remaining time and turn urgent under 1h so a donor doesn't pay late
  // into an expired invoice (orphan payment / unique-code mismatch).
  const expiresAt = invoice.expired_at ? new Date(invoice.expired_at).getTime() : 0;
  const msLeft = expiresAt ? expiresAt - now : 0;
  const isExpired = expiresAt > 0 && msLeft <= 0;
  const fmtCountdown = (ms: any) => {
    if (ms <= 0) return '0 detik';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h} jam ${m} menit`;
    if (m > 0) return `${m} menit ${sec} detik`;
    return `${sec} detik`;
  };

  // QRIS image source: a real gateway QR (qr_url) or an admin-uploaded static QRIS
  // image (pmObj.image). We do NOT synthesize a client-side QR from a pipe-delimited
  // string anymore — that produced a scannable-looking code that is NOT a valid EMVCo
  // QRIS payload, so no banking app could pay it (it just errored). When there's no real
  // QR we fall back to manual-transfer instructions instead of a fake QR.
  const qrisImage = invoice.qr_url
    ? invoice.qr_url
    : (pmObj && pmObj.image ? mediaUrl(pmObj.image) : '');

  // NOTE: we intentionally do NOT auto-redirect to the hosted gateway here. Submit-time
  // (handleSubmit) already sends the donor straight to the gateway page, and the gateway's
  // success/failure redirect lands the donor BACK on this page (/donations/INV-). Auto-
  // redirecting again from here while the webhook hasn't settled yet (isPaid still false)
  // bounced the donor back to the gateway in a loop. This page now only SHOWS status; the
  // "Lanjutkan ke Pembayaran" button below remains as a manual way back to the gateway.

  // Poll status until paid. Check IMMEDIATELY on mount (a donor returning from a hosted
  // gateway may already be settled by the webhook — without an instant check they'd stare
  // at "Menunggu Pembayaran" for up to a full interval), then poll fast for the first
  // minute (every 4s — gateway webhooks usually land within seconds) and back off to 12s
  // after. Cap total runtime so a never-settling invoice eventually stops + shows a CS path.
  useEffect(() => {
    if (isPaid || pollTimedOut) return;
    let stopped = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 80; // ~ first 60s @4s (15) + ~13 min @12s
    const check = async () => {
      try {
        const res = await api.paymentStatus(invoice.invoice_number);
        if (!stopped && res?.data) {
          setStatus(res.data.status || status);
          setInvoiceState((prev) => ({ ...prev, ...res.data }));
          if (res.data.is_paid) { stopped = true; return true; }
        }
      } catch {}
      return false;
    };
    let timer: any;
    const tick = async () => {
      if (stopped) return;
      attempts += 1;
      if (attempts > MAX_ATTEMPTS) { setPollTimedOut(true); return; }
      const done = await check();
      if (done || stopped) return;
      timer = setTimeout(tick, attempts <= 15 ? 4000 : 12000);
    };
    // Immediate first check, then schedule.
    check().then((done) => { if (!done && !stopped) timer = setTimeout(tick, 4000); });
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [invoice.invoice_number, isPaid, pollTimedOut]);

  // Tick once a second to drive the expiry countdown (only while unpaid + not expired).
  useEffect(() => {
    if (isPaid) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isPaid]);

  // Fire the per-campaign "success" conversion exactly ONCE on the first paid transition.
  // The 12s poller mutates invoice state repeatedly, so guard with a ref to avoid
  // double-counting the ad conversion. value = subtotal (the actual donation nominal,
  // excluding the unique code). This is the Purchase/conversion that was never firing.
  const successFiredRef = useRef(false);
  useEffect(() => {
    if (isPaid && !successFiredRef.current) {
      successFiredRef.current = true;
      // Pass the invoice number as the dedup event_id so this browser Purchase collapses
      // with the server-side CAPI/Events API Purchase (same id) — one conversion, not two.
      try {
        const result = NBTracking.fireConversion(c, 'success', subtotal, invoice.invoice_number);
        if (result.googleAdsAttempted) {
          void api.acknowledgeGoogleAdsClientDispatch(invoice.invoice_number).catch(() => {});
        }
      } catch {}
    }
  }, [isPaid]);

  // Auto-redirect to the CS WhatsApp on success: count 3→0 then navigate. Guarded by a ref
  // so the repeated poll re-renders can't restart it. Same-tab location.href (NOT
  // window.open) so it isn't treated as a popup — survives iOS Safari + popup blockers; the
  // manual "Buka sekarang" / "Lewati" buttons cover the case where the donor wants control.
  const waRedirectedRef = useRef(false);
  const waIntervalRef = useRef<any>(null);
  useEffect(() => {
    if (!isPaid || !successWaHref || waRedirectedRef.current) return;
    setWaCountdown(3);
    const id = setInterval(() => {
      setWaCountdown((n) => {
        if (n === null) return null;          // cancelled by "Lewati"
        if (n <= 1) {
          clearInterval(id);
          if (!waRedirectedRef.current) { waRedirectedRef.current = true; window.location.href = successWaHref; }
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    waIntervalRef.current = id;
    return () => clearInterval(id);
  }, [isPaid, successWaHref]);

  // Donor takes control: open WA immediately ("Buka sekarang") — sets the ref so the timer
  // tick won't double-navigate.
  const goWaNow = () => {
    // Contact: donor clicked "Konfirmasi ke WhatsApp" / "Buka WhatsApp sekarang".
    try { NBTracking.track('Contact', { content_name: (c && c.title) || '', value: subtotal, currency: 'IDR' }, invoice.invoice_number); } catch {}
    if (successWaHref) { waRedirectedRef.current = true; window.location.href = successWaHref; }
  };
  // Cancel the auto-redirect and go back to the campaign ("Lewati"). Clear the interval
  // directly (don't rely on onReset triggering unmount) and stop the countdown so the UI
  // never flashes "0 detik".
  const skipWa = () => {
    waRedirectedRef.current = true;
    if (waIntervalRef.current) { clearInterval(waIntervalRef.current); waIntervalRef.current = null; }
    setWaCountdown(null);
    onReset && onReset();
  };

  const checkNow = async () => {
    setChecking(true);
    setPollTimedOut(false); // a manual check re-arms the automatic poller below
    try {
      const res = await api.paymentStatus(invoice.invoice_number);
      if (res?.data) { setStatus(res.data.status || status); setInvoiceState((prev) => ({ ...prev, ...res.data })); }
    } catch {}
    setChecking(false);
  };

  // Sandbox-only: ask the backend to settle this invoice without a real transfer.
  const simulatePay = async () => {
    setSimulating(true);
    try {
      const res = await api.simulatePayment(invoice.invoice_number);
      const d: any = res?.data;
      if (d) { setStatus(d.status || 'Terbayar'); setInvoiceState((prev: any) => ({ ...prev, ...d, is_paid: true })); }
    } catch (e: any) {
      setStatus('Gagal simulasi: ' + (e?.message || 'error'));
    }
    setSimulating(false);
  };

  const copy = (text: any, key: any) => {
    try { navigator.clipboard.writeText(String(text)); setCopied(key); setTimeout(() => setCopied(''), 1500); } catch {}
  };
  void checking;
  void checkNow; // Cek Status button disabled (commented out); keep handler + auto-poller warm.

  // ---- Success terminal state: once paid, replace ALL pay instructions with a clear
  // "done" screen so a donor who just paid isn't still staring at QR / VA / transfer
  // steps wondering whether it worked.
  if (isPaid) {
    return (
      <div className="rounded-2xl bg-white border border-line shadow-card p-5 lg:p-6 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <Icon name="check" size={36} className="text-emerald-600"/>
        </div>
        <div className="mt-4 font-extrabold text-2xl text-ink">Terima kasih! 🙏</div>
        <div className="mt-1 text-sm text-mute">Donasi Anda sudah kami terima.</div>
        <div className="mt-5 rounded-xl bg-bg2 p-4 text-sm space-y-1.5 text-left">
          <div className="flex justify-between"><span className="text-mute">No. Invoice</span><b className="font-mono text-ink">{invoice.invoice_number}</b></div>
          <div className="flex justify-between"><span className="text-mute">Nominal donasi</span><b className="text-ink">{fmtIDR(subtotal)}</b></div>
          <div className="flex justify-between pt-1.5 border-t border-line"><span className="font-bold text-ink">Status</span><b className="text-emerald-600">Pembayaran Diterima</b></div>
        </div>
        {/* Donasi belum selesai sampai donatur konfirmasi ke CS — so push them there. */}
        {successWaHref ? (
          <>
            <div className="mt-4 text-sm font-semibold text-ink">
              Satu langkah lagi — konfirmasi ke tim CS NIATBAIK
            </div>
            {waCountdown != null && (
              <div className="mt-1 text-[12px] text-mute leading-relaxed">
                Mengarahkan ke WhatsApp dalam <b className="text-emerald-600">{waCountdown}</b> detik
                untuk mengirim bukti &amp; ucapan terima kasih{invoice.donor_email ? ' (juga via email)' : ''}.
              </div>
            )}
            {/* Primary CTA — same-tab nav, survives popup blockers. */}
            <button onClick={goWaNow}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700">
              <Icon name="wa" size={16}/> Buka WhatsApp sekarang
            </button>
            <button onClick={skipWa}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-mute hover:text-ink hover:bg-bg2">
              Lewati &amp; kembali ke campaign →
            </button>
          </>
        ) : (
          <>
            <div className="mt-4 text-[12px] text-mute leading-relaxed">
              Bukti donasi &amp; ucapan terima kasih akan dikirim ke WhatsApp{invoice.donor_email ? ' & email' : ''} Anda.
            </div>
            <button onClick={onReset} className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700">
              Kembali ke campaign
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-line shadow-card p-5 lg:p-6">
      <div className="text-center">
        <div className="font-extrabold text-2xl text-ink">Selesaikan Pembayaran</div>
        <div className="mt-1 text-sm text-mute">No. Invoice <span className="font-mono font-bold text-ink">{invoice.invoice_number}</span></div>
        <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isExpired ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
          <span className={`h-2 w-2 rounded-full ${isExpired ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`}/>
          {isExpired ? 'Kadaluarsa' : (status || 'Menunggu Pembayaran')}
        </div>
        {/* Expiry countdown — time-sensitive manual transfers. */}
        {expiresAt > 0 && !isExpired && (
          <div className={`mt-2 text-xs font-semibold ${msLeft < 3600000 ? 'text-rose-600' : 'text-mute'}`}>
            Selesaikan dalam <b>{fmtCountdown(msLeft)}</b>
          </div>
        )}
      </div>

      {/* Hosted-gateway donor returning from the payment page: the webhook settles
          asynchronously (usually seconds), so reassure them we're verifying instead of
          showing a bare "Menunggu Pembayaran". Hidden once paid (success screen takes over)
          or after the poll times out. */}
      {isHostedGateway && !isExpired && !pollTimedOut && (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 p-3 flex items-center gap-2.5 text-sm text-brand-800">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-600 animate-pulse shrink-0"/>
          <span>Memverifikasi pembayaran Anda secara otomatis… Jika sudah membayar, halaman ini akan berpindah ke konfirmasi dalam beberapa detik.</span>
        </div>
      )}

      {/* Sandbox tester banner + simulate button. Only visible in non-production. */}
      {sandboxMode && (
        <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Mode Sandbox</div>
          <div className="mt-1 text-xs text-amber-800 leading-relaxed">
            Untuk pengujian: tandai invoice ini sebagai <b>terbayar</b> tanpa transfer nyata (semua metode — QRIS, VA, transfer manual).
          </div>
          <button onClick={simulatePay} disabled={simulating}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60">
            <Icon name="check" size={16}/> {simulating ? 'Menyimulasikan…' : 'Simulasikan Pembayaran (Sandbox)'}
          </button>
        </div>
      )}

      {/* UNPAYABLE dead-end: no payable destination at all. Explicit error + CS, not a
          passive "we'll contact you" that looks intentional. */}
      {noPayableDestination && (
        <div className="mt-5 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 leading-relaxed">
          <b>Metode pembayaran belum tersedia.</b> Mohon maaf, saat ini belum ada tujuan pembayaran yang aktif untuk invoice ini. Donasi Anda <b>belum</b> terproses — silakan hubungi CS via WhatsApp di bawah agar kami bantu menyelesaikan.
        </div>
      )}

      {/* Amount breakdown */}
      <div className="mt-5 rounded-xl bg-bg2 p-4 text-sm space-y-1.5">
        <div className="flex justify-between"><span className="text-mute">Subtotal donasi</span><b className="text-ink">{fmtIDR(subtotal)}</b></div>
        {uniqueCode > 0 && <div className="flex justify-between"><span className="text-mute">Kode unik</span><b className="text-ink">{fmtIDR(uniqueCode)}</b></div>}
        <div className="flex justify-between pt-1.5 border-t border-line"><span className="font-bold text-ink">Total transfer</span><b className="text-brand-600 text-lg">{fmtIDR(total)}</b></div>
      </div>

      {/* QRIS */}
      {noPayableDestination ? null : isHostedGateway ? (
        <div className="mt-5 flex flex-col items-center text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-mute mb-3">Pembayaran via {gatewayLabel}</div>
          <div className="w-full rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800 leading-relaxed">
            Belum selesai membayar? Lanjutkan ke halaman pembayaran {gatewayLabel} (QRIS / Virtual Account / e-wallet). Setelah membayar, status di halaman ini akan otomatis diperbarui.
          </div>
          {flipUrl ? (
            <a href={flipUrl} target="_self"
               className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors">
              <Icon name="arrowR" size={16}/> Lanjutkan ke Pembayaran
            </a>
          ) : (
            <div className="mt-4 w-full rounded-xl border border-line p-3 text-xs text-mute">
              Menyiapkan halaman pembayaran… Jika tidak muncul, tekan <b>Cek Status Pembayaran</b> atau hubungi CS.
            </div>
          )}
        </div>
      ) : isQRIS && qrisImage ? (
        <div className="mt-5 flex flex-col items-center">
          <div className="text-xs font-bold uppercase tracking-wider text-mute mb-3">Scan QRIS untuk membayar</div>
          <img src={qrisImage} alt="QRIS" className="w-52 h-52 rounded-xl border border-line object-contain bg-white" onError={(e: any)=>{e.target.style.display='none';}}/>
          {/* Static admin QRIS isn't amount-bound, so the donor must key the exact total. */}
          <div className="mt-2 text-xs text-mute text-center">Masukkan nominal <b className="text-ink">{fmtIDR(total)}</b> (tepat) saat scan. Gunakan e-wallet / m-banking apa pun.</div>
        </div>
      ) : (
        /* Bank VA / transfer */
        <div className="mt-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-mute">Transfer ke rekening berikut</div>
          {bankName && (
            <div className="flex items-center justify-between rounded-xl border border-line p-3">
              <div><div className="text-[11px] text-mute">Bank / Metode</div><div className="font-bold text-ink">{bankName}</div></div>
              {bankLogo && <img src={bankLogo} alt={bankName} className="h-7 max-w-[80px] object-contain"/>}
            </div>
          )}
          {bankNumber ? (
            <div className="flex items-center justify-between rounded-xl border border-line p-3">
              <div><div className="text-[11px] text-mute">No. Rekening / VA</div><div className="font-mono font-extrabold text-ink text-lg">{bankNumber}</div></div>
              <button onClick={() => copy(bankNumber, 'rek')} className="text-xs font-bold text-brand-600 hover:underline">{copied==='rek' ? 'Tersalin ✓' : 'Salin'}</button>
            </div>
          ) : (
            <div className="rounded-xl border border-line p-3 text-xs text-mute">
              No. rekening akan dikirim ke WhatsApp & email Anda. Admin/CS kami akan menghubungi untuk instruksi pembayaran.
            </div>
          )}
          <div className="flex items-center justify-between rounded-xl border border-line p-3">
            <div><div className="text-[11px] text-mute">Atas Nama</div><div className="font-bold text-ink">{accountName}</div></div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line p-3">
            <div><div className="text-[11px] text-mute">Total Transfer</div><div className="font-extrabold text-brand-600 text-lg">{fmtIDR(total)}</div></div>
            <button onClick={() => copy(total, 'total')} className="text-xs font-bold text-brand-600 hover:underline">{copied==='total' ? 'Tersalin ✓' : 'Salin'}</button>
          </div>
          {/* Berita/note transfer = the invoice number. This is the most RELIABLE way for
              Moota to auto-match the transfer (the INV- tag is the primary matcher); without
              it, settlement falls back to amount+unique-code only. Make it copy-able and
              explain why. Closes the reconciliation gap (donors never told to tag transfers). */}
          <div className="flex items-center justify-between rounded-xl border-2 border-brand-200 bg-brand-50 p-3">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-brand-700">Berita / Catatan Transfer (penting)</div>
              <div className="font-mono font-extrabold text-ink text-lg truncate">{invoice.invoice_number}</div>
              <div className="text-[11px] text-mute mt-0.5">Cantumkan kode ini di berita transfer agar otomatis terverifikasi.</div>
            </div>
            <button onClick={() => copy(invoice.invoice_number, 'inv')} className="shrink-0 ml-2 text-xs font-bold text-brand-600 hover:underline">{copied==='inv' ? 'Tersalin ✓' : 'Salin'}</button>
          </div>
        </div>
      )}

      {/* Admin-configured greeting message shown to the donor (Settings → General). */}
      {(() => {
        const greeting = ((psPublic && psPublic.donor_greeting) || '').trim();
        if (!greeting) return null;
        return (
          <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 p-3 text-sm text-brand-800 leading-relaxed whitespace-pre-line">
            {greeting}
          </div>
        );
      })()}

      <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 leading-relaxed">
        Transfer tepat sesuai nominal termasuk kode unik agar otomatis terverifikasi.
      </div>

      {!isPaid && pollTimedOut && (
        <div className="mt-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700 leading-relaxed">
          Status belum otomatis terverifikasi. Jika Anda sudah membayar, konfirmasi ke CS via WhatsApp — kami akan bantu verifikasi manual.
        </div>
      )}

      {/* 'Cek Status Pembayaran' dinonaktifkan sementara — verifikasi manual dialihkan ke
          konfirmasi WhatsApp di bawah. Auto-poller (useEffect) tetap jalan di background.
      <PrimaryBtn size="md" className="w-full mt-4" onClick={checkNow} disabled={checking}>
        <Icon name="check" size={16}/> {checking ? 'Memeriksa…' : 'Cek Status Pembayaran'}
      </PrimaryBtn>
      */}
      {(() => {
        // Konfirmasi ke WhatsApp — CTA utama pada layar pending (Cek Status dinonaktifkan).
        // Pakai CS yang di-assign ke invoice ini (server rotator), sticky lintas reload;
        // fallback ke whatsapp_admin untuk invoice lama.
        const fallback = (psPublic && psPublic.whatsapp_admin) || '';
        const num = normalizeWa((assignedCs && assignedCs.phone) || fallback);
        if (!num) return null;
        // Generic label — never expose the individual CS member's name publicly.
        const label = 'Konfirmasi ke WhatsApp';
        const msg = encodeURIComponent(`Halo admin, saya sudah donasi. Invoice: ${invoice.invoice_number}, nominal: ${fmtIDR(total)}. Mohon konfirmasi.`);
        const waHref = `https://wa.me/${num}?text=${msg}`;
        return (
          <>
            <a href={waHref} target="_blank" rel="noopener noreferrer"
               onClick={() => { try { NBTracking.track('Contact', { content_name: c?.title, value: invoice?.amount || 0, currency: 'IDR' }, invoice?.invoice_number); } catch {} }}
               className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600">
              <Icon name="wa" size={16}/> {label}
            </a>
            {/* AI-first CS: bila Cekat Ai aktif, tawarkan chat AI sebagai opsi sekunder. */}
            {psPublic?.cekat_ai_enabled && (
              <button onClick={() => setCsChatOpen(true)}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-white border-2 border-brand-500 text-brand-600 hover:bg-brand-50">
                <Icon name="sparkle" size={16}/> Tanya CS (AI)
              </button>
            )}
            {csChatOpen && <CekatChatModal onClose={() => setCsChatOpen(false)} waHref={waHref} invoiceNumber={invoice.invoice_number} campaignTitle={c?.title}/>}
          </>
        );
      })()}
      <button onClick={onReset} className="mt-2 w-full text-xs font-semibold text-mute hover:text-ink">Kembali ke campaign</button>

      <div className="mt-4 pt-4 border-t border-line text-center text-[11px] text-mute leading-relaxed">
        Setelah pembayaran, status diperbarui otomatis. Bila perlu, admin / CS kami akan mengkonfirmasi donasi Anda via WhatsApp & email.
      </div>
    </div>
  );
}

// FundraiserCTA shows a "Jadi Fundraiser" share panel UNDER the campaign story — but only
// to a logged-in user whose RAW backend role is 'fundraiser' (toDesignRole collapses
// unknown roles to Admin, so we must read user.role directly). It surfaces the existing
// referral share link (/c/<slug>?ref=<user_id>) that the public form + backend already
// understand; no new API. Non-fundraisers see nothing.
function FundraiserCTA({ c }: any) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  // The link is hidden until the fundraiser explicitly opts in by pressing the button —
  // it reads as a deliberate action ("generate my link") rather than a link dumped on load.
  const [revealed, setRevealed] = useState(false);
  const isFundraiser = String((user as any)?.role || '').toLowerCase() === 'fundraiser' || !!(user as any)?.fundraiser_enabled;
  if (!isFundraiser || !c) return null;
  const origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : 'https://donasi.niatbaik.org';
  // Referral handle = username (?ref=budi), falling back to the user id for accounts that
  // predate the username backfill.
  const refCode = (user as any).username || (user as any).id;
  const link = `${origin}/c/${c.slug || c.id}?ref=${refCode}`;
  const waText = encodeURIComponent(`Bantu sebarkan campaign "${c.title}" 🙏\nDonasi lewat tautan ini: ${link}`);
  const copy = () => { try { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  return (
    <div className="mt-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 p-5">
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold"><Icon name="handshake" size={18}/> Jadi Fundraiser Campaign Ini</div>
      <div className="text-sm text-ink mt-1 leading-relaxed">Bagikan tautan khusus Anda — setiap donasi yang masuk lewat tautan ini tercatat sebagai kontribusi Anda. Barakallahu fiikum 🤝</div>

      {!revealed ? (
        <button onClick={() => setRevealed(true)}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
          <Icon name="handshake" size={16}/> Jadi Fundraiser
        </button>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-slate-900 px-3 py-2">
            <span className="flex-1 min-w-0 truncate text-xs font-mono text-ink">{link}</span>
            <button onClick={copy} className="shrink-0 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">{copied ? 'Tersalin ✓' : 'Salin'}</button>
          </div>
          <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
            <Icon name="wa" size={16}/> Bagikan ke WhatsApp
          </a>
        </>
      )}
    </div>
  );
}

// JadiFundraiserButton is the public "Jadi Fundraiser" CTA with a 3-state gate:
//   • not logged in            → warning "login dulu" + link to /login (return-to campaign)
//   • logged in, role≠fundraiser → "akses ditolak" showing the current role (becoming a
//                                  fundraiser stays admin/CS-driven; no self-signup)
//   • logged in, role=fundraiser → not rendered (they get the FundraiserCTA share panel)
// `variant` matches the two placements (solid in empty state, outline in the list footer).
function JadiFundraiserButton({ c, variant }: { c: any; variant: 'solid' | 'outline' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState<{ tone: 'warn' | 'bad'; text: string } | null>(null);
  const isFundraiser = String((user as any)?.role || '').toLowerCase() === 'fundraiser' || !!(user as any)?.fundraiser_enabled;
  if (isFundraiser) return null; // share panel handles them

  const role = (user as any)?.role;
  const cls = variant === 'solid'
    ? 'bg-brand-600 text-white hover:bg-brand-700 px-5'
    : 'border border-brand-600 text-brand-600 hover:bg-brand-50 px-4';

  const onClick = () => {
    if (!user) {
      const back = (c?.slug || c?.id) ? `/c/${c.slug || c.id}` : '/';
      setMsg({ tone: 'warn', text: 'Silakan login terlebih dahulu untuk menjadi fundraiser.' });
      setTimeout(() => navigate(`/login?next=${encodeURIComponent(back)}`), 900);
      return;
    }
    // Logged in but not a fundraiser → access denied (no in-app enrollment).
    setMsg({ tone: 'bad', text: `Akses ditolak — role Anda saat ini: ${role || 'user'}. Hubungi admin untuk menjadi fundraiser.` });
  };

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <button onClick={onClick}
        className={`inline-flex items-center gap-2 py-2.5 rounded-xl text-sm font-bold ${cls}`}>
        <Icon name="handshake" size={16}/> Jadi Fundraiser
      </button>
      {msg && (
        <div className={`text-xs font-semibold px-3 py-2 rounded-lg max-w-xs text-center ${msg.tone === 'bad' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

// FundraiserSection lists the fundraisers backing THIS campaign (from the detail
// endpoint's `fundraisers`, name/avatar/stats only). Empty state invites visitors to
// become one via the gated JadiFundraiserButton. Logged-in fundraisers already get the
// share panel (FundraiserCTA) above, so the button hides itself for them.
function FundraiserSection({ c }: any) {
  const [frShown, setFrShown] = useState(5);
  // Greet a visitor who arrived via a fundraiser's ?ref=<username> link by showing the
  // referrer's name (matches username, falls back to the legacy uuid user-id ref).
  const ref = useMemo(() => {
    try { return (new URLSearchParams(window.location.search).get('ref') || '').toLowerCase(); } catch { return ''; }
  }, []);
  // undefined = detail not fetched yet → render nothing (avoids "Belum ada" flash).
  if (!Array.isArray(c?.fundraisers)) return null;
  const list = c.fundraisers;
  const referrer = ref ? (list.find((f: any) => (f.username || '').toLowerCase() === ref || String(f.user_id || '').toLowerCase() === ref)) : null;
  return (
    <div className="mt-6 rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center gap-2 font-bold text-ink">
        <Icon name="handshake" size={18} className="text-brand-600"/> Fundraiser
        {list.length > 0 && <span className="text-mute font-semibold">({list.length})</span>}
      </div>
      {referrer && (
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 px-3 py-2 text-sm">
          <Icon name="heart" size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0"/>
          <span className="text-ink">Anda direkomendasikan oleh <b className="text-emerald-700 dark:text-emerald-400">{referrer.name}</b> 🤝</span>
        </div>
      )}
      {list.length === 0 ? (
        <div className="mt-4 flex flex-col items-center text-center py-4">
          <div className="h-16 w-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
            <Icon name="handshake" size={32} strokeWidth={1.5}/>
          </div>
          <div className="mt-3 font-bold text-ink">Belum ada Fundraiser</div>
          <p className="mt-1 text-sm text-mute max-w-xs">Mari jadi Fundraiser dan berikan manfaat bagi program ini.</p>
          <JadiFundraiserButton c={c} variant="solid"/>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {list.slice(0, frShown).map((f: any, i: number) => {
              const name = f.name || 'Fundraiser';
              return (
                <div key={i} className="rounded-xl border border-line p-4">
                  <div className="font-bold text-brand-700">{name}</div>
                  <div className="text-xs text-ink/70 mt-0.5">
                    Berhasil mengajak <b className="text-ink">{fmtNum(f.total_donors || 0)}</b> orang untuk berdonasi.
                  </div>
                  <div className="mt-1.5 font-extrabold text-ink">{fmtIDR(f.total_raised || 0)}</div>
                </div>
              );
            })}
          </div>
          {list.length > frShown && (
            <div className="mt-3 flex justify-center">
              <button onClick={() => setFrShown((n: number) => n + 5)}
                className="px-5 py-2 rounded-full border border-line text-sm font-semibold text-ink hover:bg-bg2">Load more</button>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-line text-center">
            <p className="text-sm text-mute max-w-xs mx-auto">Mari jadi Fundraiser dan berikan manfaat bagi program ini.</p>
            <div className="flex justify-center"><JadiFundraiserButton c={c} variant="solid"/></div>
          </div>
        </>
      )}
    </div>
  );
}

// DonorPrayers renders donors' "doa" messages UNDER the story so every visitor sees
// them without opening the Donatur tab. Anonymous donations arrive with message
// stripped server-side, so no identifying text can leak here. Handles both the
// detail-endpoint shape ({name, message, created_at}) and the legacy tx feed
// ({donor, message, date}). Hidden entirely when no donor left a message.
function DonorPrayers({ donors }: any) {
  const [shownN, setShownN] = useState(5);
  const list = (Array.isArray(donors) ? donors : []).filter((d: any) => (d.message || '').trim());
  const shown = list.slice(0, shownN);
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 font-bold text-ink">
        <Icon name="heart" size={18} className="text-rose-500"/> Doa-doa orang baik {list.length > 0 && <span className="text-mute font-semibold">({list.length})</span>}
      </div>
      {list.length === 0 && (
        <p className="mt-3 text-sm text-mute italic">Belum ada doa. Jadilah yang pertama berdonasi dan kirimkan doa terbaik untuk program ini.</p>
      )}
      <div className="mt-3 space-y-3">
        {shown.map((d: any, i: number) => {
          const anon = d.is_anonymous ?? d.anon ?? false;
          const name = anon ? 'Hamba Allah' : (d.name || d.donor || 'Hamba Allah');
          const when = timeAgoID(d.created_at || d.date);
          return <PrayerCard key={i} name={name} when={when} message={(d.message || '').trim()}/>;
        })}
      </div>
      {list.length > shownN && (
        <button onClick={() => setShownN((n) => n + 5)}
          className="mt-3 w-full py-2 rounded-xl border border-line text-sm font-bold text-brand-600 hover:bg-bg2">
          Load more
        </button>
      )}
    </div>
  );
}

// PrayerCard = one "doa" row matching the reference: name + relative time on the header,
// the message, then an "Aamiin" affordance. Aamiin is a client-side gesture (there is no
// per-prayer count on the backend, so we don't invent one) — it persists the visitor's own
// tap in localStorage and shows a running local tally, seeded at 1 so a fresh prayer reads
// "1 Aamiin" like the reference rather than a bare 0.
function PrayerCard({ name, when, message }: any) {
  const key = `nb-aamiin-${when}-${(message || '').slice(0, 24)}`;
  const [amin, setAmin] = useState(false);
  useEffect(() => { try { setAmin(!!localStorage.getItem(key)); } catch { /* ignore */ } }, [key]);
  const count = (amin ? 1 : 0) + 1; // local seed of 1 + this visitor's tap
  const toggle = () => {
    setAmin((v) => {
      const next = !v;
      try { next ? localStorage.setItem(key, '1') : localStorage.removeItem(key); } catch { /* ignore */ }
      return next;
    });
  };
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="font-bold text-ink">{name}</div>
        {when && <div className="text-[11px] text-mute shrink-0">{when}</div>}
      </div>
      <p className="mt-1.5 text-sm text-ink/85 leading-relaxed">{message}</p>
      <button onClick={toggle}
        className={`mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${amin ? 'text-rose-600' : 'text-mute hover:text-rose-500'}`}>
        <Icon name="pray" size={14}/> {count} Aamiin
      </button>
    </div>
  );
}

function CampaignStory({ c }: any) {
  // Render the campaign's real story. `description` is rich HTML authored in the
  // admin editor; sanitize it (same allow-list used on save) before injecting so stored
  // content can't carry active markup. Fall back to the short description, then to a
  // neutral message when a campaign has no story yet.
  const rawHtml = (c && typeof c.description === 'string' && c.description.trim()) ? c.description : '';
  const shortText = (c && (c.short_description || c.shortDescription) || '').trim();

  // Only inject HTML when there is rich content; the sanitizer is imported directly
  // (sanitizeHTML from @/lib/api). Fail safe to the plain-text path below if empty.
  if (rawHtml) {
    // Sanitize first (XSS), then normalize pasted inline colors (near-black text /
    // near-white highlight) so the story follows the light/dark theme instead of
    // rendering dark-on-dark.
    const clean = normalizeRichTextColors(sanitizeHTML(rawHtml) as string);
    return (
      <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-ink/85"
        dangerouslySetInnerHTML={{ __html: clean }}/>
    );
  }

  return (
    <div className="prose prose-slate prose-sm max-w-none">
      {shortText
        ? <p className="text-ink/85 leading-relaxed">{shortText}</p>
        : <p className="text-mute italic">Cerita campaign ini belum ditambahkan.</p>}
    </div>
  );
}

function CampaignUpdates({ updates }: any) {
  const items = Array.isArray(updates) ? updates : [];
  if (!items.length) {
    return <div className="text-sm text-mute italic py-2">Belum ada update untuk campaign ini.</div>;
  }
  const fmtDate = (s: any) => {
    try { return new Date(s).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }); }
    catch { return ''; }
  };
  return (
    <div className="space-y-4">
      {items.map((u: any, i: number) => (
        <div key={i} className="flex gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name="pin" size={16}/></div>
          <div>
            <div className="text-xs text-mute">{fmtDate(u.created_at)}</div>
            <div className="font-bold text-ink">{u.title}</div>
            <div className="text-sm text-ink/85 mt-0.5 leading-relaxed">{u.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignDonors({ donors }: any) {
  const list = Array.isArray(donors) ? donors : [];
  if (!list.length) {
    return <div className="text-sm text-mute italic py-2">Jadilah donatur pertama untuk campaign ini.</div>;
  }
  // Donors may come from the campaign detail endpoint ({name, amount,
  // is_anonymous, created_at}) or the legacy transactions feed ({donor, anon,
  // message, date}). Normalize both into one shape before rendering.
  const norm = (d: any) => {
    const anon = d.is_anonymous ?? d.anon ?? false;
    const name = anon ? 'Hamba Allah' : (d.name || d.donor || 'Hamba Allah');
    let when = '';
    if (d.created_at) { try { when = new Date(d.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short' }); } catch {} }
    else if (typeof d.date === 'string') when = d.date.split(',')[0];
    return { anon, name, amount: d.amount || 0, message: d.message || '', when };
  };
  return (
    <div className="space-y-2">
      {list.map((raw: any, i: number) => {
        const d = norm(raw);
        const initials = d.anon ? 'HA' : d.name.split(' ').map((s: any) => s[0]).join('').slice(0, 2);
        return (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg2">
            <div className="h-9 w-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">{initials}</div>
            <div className="flex-1">
              <div className="text-sm font-bold text-ink">{d.name}</div>
              {d.message && <div className="text-xs text-mute italic line-clamp-1">"{d.message}"</div>}
            </div>
            <div className="text-right">
              <div className="font-extrabold text-brand-600">{fmtIDR(d.amount)}</div>
              {d.when && <div className="text-[10px] text-mute">{d.when}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CampaignFAQ() {
  return (
    <div className="space-y-2">
      {[
        { q:'Bagaimana donasi disalurkan?', a:'Donasi langsung disalurkan ke mitra lokal di lapangan. Laporan transparan setiap minggu.' },
        { q:'Apakah saya mendapat bukti donasi?', a:'Ya, kuitansi resmi otomatis dikirim via email & WhatsApp.' },
        { q:'Apa yang terjadi bila donasi melebihi target?', a:'Kelebihan akan dialokasikan untuk program serupa yang masih membutuhkan, sesuai persetujuan donatur.' },
      ].map((f, i) => (
        <details key={i} className="rounded-xl border border-line bg-white" open={i===0}>
          <summary className="cursor-pointer p-3 font-bold text-ink list-none flex items-center justify-between">
            {f.q}<Icon name="chevronD" size={16} className="text-mute"/>
          </summary>
          <div className="px-3 pb-3 text-sm text-ink/80">{f.a}</div>
        </details>
      ))}
    </div>
  );
}

// CekatChatModal — AI-first donor CS chat. Calls POST /cs/chat; on handoff=true (AI
// unavailable, misconfigured, or the donor asked for a human) it surfaces the WhatsApp
// CS button so the conversation continues with a human. Pre-seeds context with the
// invoice number so the AI can help with payment confirmation.
function CekatChatModal({ onClose, waHref, invoiceNumber, campaignTitle }: any) {
  const [messages, setMessages] = useState<any[]>(() => ([
    { role: 'assistant', content: `Halo! Saya CS virtual NIATBAIK.ORG 🙏 Ada yang bisa saya bantu soal donasi Anda${invoiceNumber ? ` (invoice ${invoiceNumber})` : ''}?` },
  ]));
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const scrollRef = useRef<any>(null);

  useEffect(() => { try { scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }); } catch {} }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const history = messages.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-10);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);
    try {
      const res: any = await api.csChat(text, history);
      const data = res?.data || res || {};
      if (data.handoff) {
        setHandoff(true);
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Baik, saya sambungkan ke CS kami via WhatsApp ya 🙏' }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || '...' }]);
      }
    } catch {
      setHandoff(true);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Maaf, koneksi CS AI sedang bermasalah. Silakan lanjut ke CS kami via WhatsApp 🙏' }]);
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line">
          <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center"><Icon name="sparkle" size={16}/></div>
          <div className="flex-1">
            <div className="font-bold text-ink text-sm leading-tight">CS Virtual</div>
            <div className="text-[11px] text-mute">{campaignTitle ? campaignTitle.slice(0, 40) : 'NIATBAIK.ORG'}</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-md hover:bg-bg2 text-mute flex items-center justify-center"><Icon name="close" size={16}/></button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-brand-600 text-white rounded-br-md' : 'bg-bg2 text-ink rounded-bl-md'}`}>{m.content}</div>
            </div>
          ))}
          {sending && <div className="flex justify-start"><div className="px-3 py-2 rounded-2xl rounded-bl-md bg-bg2 text-mute text-sm">mengetik…</div></div>}
        </div>
        {handoff && waHref && waHref !== '#' && (
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="mx-4 mb-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600">
            <Icon name="wa" size={16}/> Lanjut ke CS WhatsApp
          </a>
        )}
        <div className="flex items-center gap-2 p-3 border-t border-line">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Tulis pesan…" className="flex-1 px-3 py-2 rounded-xl border border-line bg-white text-sm outline-none focus:border-brand-600"/>
          <button onClick={send} disabled={sending || !input.trim()} className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-brand-700">
            <Icon name="send" size={16}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// Public-facing landing + campaign + donation flow.
const { useState, useEffect, useRef, useMemo } = React;
const { fmtIDR, fmtIDRShort, fmtNum } = window.NB;
const getCampaigns = () => (window.CAMPAIGNS && window.CAMPAIGNS.length) ? window.CAMPAIGNS : [];
const getFirstCampaign = () => getCampaigns()[0] || { id:'', title:'', category:'', target:1, raised:0, donors:0, daysLeft:0, thumb:'', icon:'heart' };
const getSocialProof = () => window.socialProofLines && window.socialProofLines.length ? window.socialProofLines : [];

// Parse a campaign's form_fields_config JSON (button labels etc.) safely.
const parseFormFieldsConfig = (ffc) => {
  try { return ffc ? JSON.parse(ffc) : {}; } catch { return {}; }
};

// Resolve the CS contact(s) from public settings. In 'rotator' mode a contact is
// picked pseudo-randomly so load spreads across numbers; otherwise the first is used.
const getCsContacts = () => {
  const s = window.PUBLIC_SETTINGS || {};
  let list = [];
  try { const p = s.cs_contacts ? JSON.parse(s.cs_contacts) : []; if (Array.isArray(p)) list = p; } catch {}
  list = list.filter(x => x && (x.phone || '').trim());
  return { list, mode: s.cs_rotator_mode || 'default' };
};
const pickCsContact = () => {
  const { list, mode } = getCsContacts();
  if (!list.length) return null;
  if (mode === 'rotator') return list[Math.floor(Math.random() * list.length)];
  return list[0];
};
const normalizeWa = (n) => String(n || '').replace(/[^0-9]/g, '').replace(/^0/, '62');

// Resolve a campaign's display image: the dedicated uploaded `img`, else any image
// path stuffed into `thumb`. Returns '' when there's only a gradient/no image.
const campaignImage = (c) => {
  if (!c) return '';
  if (c.img) return c.img;
  const t = c.thumb;
  if (typeof t === 'string' && t && !t.startsWith('linear')) return t;
  return '';
};
// True when the campaign has a real uploaded image (so the placeholder Icon should
// be hidden — previously it was drawn ON TOP of the photo, covering it).
const hasThumbImage = (c) => !!campaignImage(c);

// Background style for a campaign thumb box. Uses the uploaded image as a cover
// background when present, otherwise the saved gradient, otherwise a brand gradient.
const thumbStyle = (c) => {
  // Backwards-compat: callers may pass the campaign object (preferred) or a bare
  // thumb string. Normalize to a campaign-like shape.
  const camp = (c && typeof c === 'object') ? c : { thumb: c };
  const img = campaignImage(camp);
  if (img) {
    const url = window.mediaUrl ? window.mediaUrl(img) : img;
    return { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  const t = camp.thumb;
  if (typeof t === 'string' && t.startsWith('linear')) return { background: t };
  return { background: '#2E4191' };
};

// -------- Helpers --------
const PrimaryBtn = ({ children, size='md', className='', ...rest }) => {
  const sizes = { sm:'text-sm px-4 py-2', md:'text-base px-5 py-3', lg:'text-lg px-7 py-4', xl:'text-lg px-8 py-4.5' };
  return (
    <button {...rest} className={`inline-flex items-center justify-center gap-2 font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

const Progress = ({ value, max, className='h-2' }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={`relative w-full ${className} bg-slate-100 rounded-full overflow-hidden`}>
      <div className="absolute inset-y-0 left-0 bg-brand-600 rounded-full" style={{ width: pct + '%' }}/>
    </div>
  );
};

// -------- Dark mode helper (public pages) --------
function usePublicDark() {
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
function Navbar({ onNav }) {
  const [open, setOpen] = useState(false);
  const [dark, toggleDark] = usePublicDark();
  const { navigate } = useApp();
  const links = [
    { l:'Campaign', h:'#campaigns' },
    { l:'Bagaimana?', h:'#how' },
    { l:'Testimoni', h:'#testi' },
    { l:'FAQ', h:'#faq' },
  ];
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center gap-4">
        <button onClick={() => onNav('home')} className="flex items-center">
          <img src="/assets/logo-niatbaik.png" alt="NIATBAIK.ORG" className="h-8"/>
        </button>
        <nav className="hidden lg:flex items-center gap-1 ml-6">
          {links.map((l) => (
            <a key={l.l} href={l.h} className="px-3 py-2 rounded-lg text-sm font-semibold text-ink/80 hover:bg-bg2 hover:text-ink">{l.l}</a>
          ))}
        </nav>
        <div className="flex-1"/>
        <button onClick={toggleDark} aria-label="Toggle dark mode"
          className="h-9 w-9 rounded-lg border border-line bg-white hover:bg-bg2 flex items-center justify-center text-ink">
          <Icon name={dark ? 'sun' : 'moon'} size={16}/>
        </button>
        <button onClick={() => navigate('dashboard')} className="hidden lg:inline-flex items-center gap-1 text-sm font-semibold text-mute hover:text-ink">
          <Icon name="user" size={16}/> Masuk
        </button>
        <PrimaryBtn size="sm" onClick={() => onNav('campaign', getFirstCampaign())}>
          <Icon name="heart" size={16}/> Donasi Sekarang
        </PrimaryBtn>
        <button onClick={() => setOpen(!open)} className="lg:hidden h-9 w-9 rounded-lg hover:bg-bg2 flex items-center justify-center"><Icon name="menu" size={20}/></button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-line bg-white">
          <div className="px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <a key={l.l} href={l.h} className="px-3 py-2.5 rounded-lg text-sm font-semibold text-ink/80 hover:bg-bg2" onClick={() => setOpen(false)}>{l.l}</a>
            ))}
            <button onClick={toggleDark} className="px-3 py-2.5 rounded-lg text-sm font-semibold text-ink/80 hover:bg-bg2 text-left flex items-center gap-2">
              <Icon name={dark ? 'sun' : 'moon'} size={16}/> {dark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button onClick={() => { setOpen(false); navigate('dashboard'); }} className="px-3 py-2.5 rounded-lg text-sm font-semibold text-mute text-left">Masuk Dashboard</button>
          </div>
        </div>
      )}
    </header>
  );
}

// -------- Hero --------
function Hero({ onNav }) {
  return (
    <section className="relative overflow-hidden bg-bg2 border-b border-line">

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-20 grid lg:grid-cols-2 gap-10 items-center relative">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-line shadow-card text-xs font-bold text-ink">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/>
            <span>{fmtNum(window.TOTAL_DONORS || 0)} donatur aktif</span>
            <span className="text-mute font-normal hidden sm:inline">· Update real-time</span>
          </div>

          <h1 className="mt-5 text-4xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-ink">
            Salurkan <span className="text-brand-600">Niat Baik</span> Anda, wujudkan kebaikan nyata.
          </h1>
          <p className="mt-5 text-lg text-mute max-w-xl leading-relaxed">
            Donasi terverifikasi untuk kemanusiaan, kesehatan, pendidikan, dan wakaf.
            Transparan, mudah, dan dipercaya{(window.TOTAL_DONORS > 0) ? <> oleh <b className="text-ink">{fmtNum(window.TOTAL_DONORS)}+ donatur</b></> : ''} di Indonesia.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PrimaryBtn size="lg" className="ctaPulse" onClick={() => onNav('campaign', getFirstCampaign())}>
              <Icon name="heart" size={18}/> Mulai Donasi
            </PrimaryBtn>
            <button onClick={() => document.getElementById('campaigns')?.scrollIntoView({behavior:'smooth'})} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-base font-bold text-ink hover:bg-white border border-line bg-white/60">
              <Icon name="eye" size={18}/> Lihat Campaign
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { v: fmtIDRShort(window.TOTAL_RAISED || 0), l:'Donasi tersalurkan' },
              { v: fmtNum(window.TOTAL_DONORS || 0) + '+', l:'Donatur bersama' },
              { v: fmtNum(window.ACTIVE_CAMPAIGNS || 0), l:'Campaign aktif' },
            ].map((s, i) => (
              <div key={i} className="bg-white/80 backdrop-blur border border-line rounded-xl p-3">
                <div className="text-xl lg:text-2xl font-extrabold text-brand-600 leading-none">{s.v}</div>
                <div className="text-[11px] text-mute mt-1.5 leading-tight">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-mute">
            <span className="inline-flex items-center gap-1.5"><Icon name="shield" size={14} className="text-emerald-600"/> SSL Aman</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14} className="text-emerald-600"/> Berizin Kemensos</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14} className="text-emerald-600"/> Audit publik bulanan</span>
          </div>
        </div>

        {/* Hero campaign card */}
        <HeroCard c={getFirstCampaign()} onNav={onNav}/>
      </div>
    </section>
  );
}

function HeroCard({ c, onNav }) {
  const [amount, setAmount] = useState(100_000);
  const presets = [50_000, 100_000, 250_000];
  // Only show URGENT when the campaign is genuinely near its end (real daysLeft), with
  // the real remaining-days count — not a hardcoded "6 hari lagi" that lied on every card.
  const daysLeft = Number(c?.daysLeft) || 0;
  const isUrgent = daysLeft > 0 && daysLeft <= 10;
  return (
    <div className="relative float-in">
      {isUrgent && <div className="absolute -top-3 -left-3 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-pop rotate-[-6deg] z-10">URGENT · {daysLeft} hari lagi</div>}
      <div className="rounded-3xl bg-white border border-line shadow-pop overflow-hidden">
        <div className="relative aspect-[16/10]" style={thumbStyle(c)}>
          {!hasThumbImage(c) && <div className="absolute inset-0 flex items-center justify-center text-white/85"><Icon name={c.icon} size={120} strokeWidth={1}/></div>}
          <div className="absolute inset-0 bg-black/30"/>
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2 py-0.5 rounded-md bg-white/95 text-[11px] font-bold text-ink">{c.category}</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-[11px] font-bold text-white inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"/>LIVE</span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <div className="text-xs font-semibold uppercase opacity-90">Featured Campaign</div>
            <div className="font-extrabold text-xl lg:text-2xl leading-tight mt-1">{c.title}</div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-extrabold text-brand-600">{fmtIDR(c.raised)}</div>
              <div className="text-xs text-mute">terkumpul dari {fmtIDR(c.target)}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-ink">{c.target ? Math.round(c.raised/c.target*100) : 0}%</div>
              <div className="text-xs text-mute">tercapai</div>
            </div>
          </div>
          <Progress value={c.raised} max={c.target || 1} className="h-2.5 mt-3"/>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-bg2"><div className="text-mute">Donatur</div><div className="font-extrabold text-ink">{fmtNum(c.donors)}</div></div>
            <div className="p-2 rounded-lg bg-bg2"><div className="text-mute">Sisa hari</div><div className="font-extrabold text-rose-600">{c.daysLeft}</div></div>
            <div className="p-2 rounded-lg bg-bg2"><div className="text-mute">Sisa</div><div className="font-extrabold text-ink">{fmtIDRShort(c.target - c.raised)}</div></div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Pilih nominal donasi</div>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => (
                <button key={p} onClick={() => setAmount(p)}
                  className={`py-2.5 rounded-xl text-sm font-extrabold border-2 transition-all ${amount === p ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink hover:border-brand-200'}`}>
                  {fmtIDRShort(p)}
                </button>
              ))}
            </div>
            <PrimaryBtn size="lg" className="w-full mt-3" onClick={() => onNav('campaign', { ...c, _seedAmount: amount })}>
              <Icon name="heart" size={18}/> Donasi {fmtIDR(amount)}
            </PrimaryBtn>
            <div className="mt-2 text-center text-[11px] text-mute">
              <Icon name="shield" size={12} className="inline mr-1 text-emerald-600"/> Pembayaran aman melalui QRIS, VA, dan e-wallet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------- Logo strip (trust) --------
function TrustStrip() {
  const items = ['Kementerian Sosial RI', 'Baznas', 'PWNU', 'Muhammadiyah', 'Detik.com', 'CNN Indonesia', 'Tempo', 'Liputan6', 'Kompas', 'OJK'];
  return (
    <section className="py-8 border-y border-line bg-bg2/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center text-xs font-semibold uppercase tracking-widest text-mute mb-4">Diliput & dipercaya oleh</div>
        <div className="relative">
          <div className="marquee flex gap-4">
            {[...items, ...items].map((s, i) => (
              <div key={i} className="shrink-0 px-6 py-3 rounded-lg bg-white border border-line text-ink/70 font-bold text-sm">{s}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// -------- Stats --------
function StatsSection() {
  // Real platform stats from /stats (window globals set in data.jsx). No more hardcoded
  // "Rp 1,84 M+ / 412 / 34 Provinsi" literals that contradicted the actual numbers.
  const stats = [
    { icon:'wallet',    v:fmtIDRShort(window.TOTAL_RAISED || 0), l:'Donasi tersalurkan' },
    { icon:'users',     v:fmtNum(window.TOTAL_DONORS || 0), l:'Donatur bersama' },
    { icon:'megaphone', v:fmtNum(window.ACTIVE_CAMPAIGNS || 0), l:'Campaign aktif' },
    { icon:'check',     v:fmtNum(window.TOTAL_CAMPAIGNS || 0), l:'Total campaign' },
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
function CampaignsSection({ onNav }) {
  const filterTabs = [{v:'all',l:'Semua'},{v:'Medis',l:'Medis'},{v:'Pendidikan',l:'Pendidikan'},{v:'Wakaf',l:'Wakaf'},{v:'Bencana',l:'Bencana'},{v:'Ramadan',l:'Ramadan'}];
  const [tab, setTab] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const src = (window.CAMPAIGNS && window.CAMPAIGNS.length) ? window.CAMPAIGNS : getCampaigns();
  const campaigns = src.filter(c => c.status === 'Running' || c.status === 'Published' || c.status === 'Berjalan');
  const filteredAll = tab === 'all' ? campaigns : campaigns.filter(c => c.category === tab);
  // Show only the 6 newest by default; "Lihat semua" reveals the rest in place.
  const filtered = showAll ? filteredAll : filteredAll.slice(0, 6);

  return (
    <section id="campaigns" className="py-14 lg:py-20 bg-bg2">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Campaign aktif</div>
            <h2 className="mt-2 text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">Mari bersama wujudkan kebaikan</h2>
            <p className="mt-2 text-mute">Pilih salah satu campaign terverifikasi di bawah ini.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
            {filterTabs.map((t) => (
              <button key={t.v} onClick={() => setTab(t.v)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${tab===t.v ? 'bg-ink text-white' : 'bg-white text-ink border border-line hover:bg-brand-50'}`}>
                {t.l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => <PublicCampaignCard key={c.id} c={c} onNav={onNav}/>)}
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

function PublicCampaignCard({ c, onNav }) {
  return (
    <div onClick={() => onNav('campaign', c)} className="group cursor-pointer rounded-2xl bg-white border border-line shadow-card hover:shadow-pop transition-all hover:-translate-y-1 overflow-hidden">
      <div className="relative aspect-[16/10]" style={thumbStyle(c)}>
        {!hasThumbImage(c) && <div className="absolute inset-0 flex items-center justify-center text-white/85"><Icon name={c.icon} size={70} strokeWidth={1.2}/></div>}
        <div className="absolute inset-0 bg-black/30"/>
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-white/95 text-[11px] font-bold text-ink">{c.category}</span>
          {c.daysLeft <= 10 && <span className="px-2 py-0.5 rounded-md bg-rose-500 text-[11px] font-bold text-white">URGENT</span>}
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
function HowToSection() {
  const steps = [
    { n:1, t:'Pilih campaign', d:'Pilih campaign sesuai niat baik Anda dari daftar terverifikasi.', icon:'megaphone' },
    { n:2, t:'Tentukan nominal', d:'Isi nominal donasi. Mulai dari Rp 10.000.', icon:'wallet' },
    { n:3, t:'Pilih pembayaran', d:'Bayar via QRIS, VA Bank, atau e-wallet favorit Anda.', icon:'creditcard' },
    { n:4, t:'Doakan & sebar', d:'Donasi tersalurkan. Ajak teman ikut dalam kebaikan.', icon:'heart' },
  ];
  return (
    <section id="how" className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Cara berdonasi</div>
          <h2 className="mt-2 text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">Mudah · Hanya 60 detik</h2>
          <p className="mt-2 text-mute">Donasi via NIATBAIK.ORG bisa dilakukan kapan saja, tanpa perlu daftar akun.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={i} className="relative">
              <div className="rounded-2xl bg-white border border-line p-6 hover:border-brand-200 hover:shadow-card transition-all h-full">
                <div className="h-12 w-12 rounded-xl bg-brand-600 text-white flex items-center justify-center"><Icon name={s.icon} size={22}/></div>
                <div className="mt-4 text-xs font-bold text-mute">LANGKAH {s.n}</div>
                <div className="font-extrabold text-ink text-lg mt-0.5">{s.t}</div>
                <div className="mt-1.5 text-sm text-mute leading-relaxed">{s.d}</div>
              </div>
              {i < 3 && <div className="hidden lg:block absolute top-12 -right-3 text-mute"><Icon name="arrowR" size={20}/></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------- Testimonials --------
function TestimonialsSection() {
  const items = [
    { n:'Ibu Sari, Bekasi',   r:'⭐⭐⭐⭐⭐', t:'Alhamdulillah, donasi saya untuk Aira dilaporkan transparan. Bahkan saya dikirim foto setelah operasinya. Sangat amanah.', tone:'#2E4191' },
    { n:'Pak Burhan, Bandung', r:'⭐⭐⭐⭐⭐', t:'Sudah 3 tahun rutin sedekah lewat NIATBAIK. Donasi via QRIS, cepat dan langsung dapat kuitansi via WhatsApp.', tone:'#38B6FF' },
    { n:'Hamba Allah',         r:'⭐⭐⭐⭐⭐', t:'Donasi anonim juga dilayani. Yang penting niatnya baik, sampai ke yang membutuhkan. Terima kasih NIATBAIK.', tone:'#16A34A' },
    { n:'Andini, Surabaya',    r:'⭐⭐⭐⭐⭐', t:'Saya jadi fundraiser di NIATBAIK. Mudah dipakai, dan komisi bisa saya donasikan lagi. Berkah!', tone:'#F59E0B' },
  ];
  return (
    <section id="testi" className="py-14 lg:py-20 bg-brand-700 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-sky2-100">Apa kata donatur</div>
            <h2 className="mt-2 text-3xl lg:text-4xl font-extrabold tracking-tight">{(window.TOTAL_DONORS > 0) ? `Bergabung bersama ${fmtNum(window.TOTAL_DONORS)}+ donatur Indonesia` : 'Bergabung bersama para donatur Indonesia'}</h2>
            <p className="mt-3 text-white/85">Cerita nyata dari donatur yang mempercayakan niat baiknya melalui NIATBAIK.ORG.</p>
            <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
              <div><div className="text-2xl font-extrabold">{fmtNum(window.TOTAL_DONORS || 0)}</div><div className="text-xs text-white/75">Donatur</div></div>
              <div><div className="text-2xl font-extrabold">{fmtIDRShort(window.TOTAL_RAISED || 0)}</div><div className="text-xs text-white/75">Tersalurkan</div></div>
              <div><div className="text-2xl font-extrabold">{fmtNum(window.ACTIVE_CAMPAIGNS || 0)}</div><div className="text-xs text-white/75">Campaign aktif</div></div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((t, i) => (
              <div key={i} className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-5">
                <div className="text-amber-300 text-sm">{t.r}</div>
                <p className="mt-3 text-sm text-white/90 leading-relaxed">"{t.t}"</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: t.tone }}>{t.n[0]}</div>
                  <div className="text-sm font-bold">{t.n}</div>
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
function FAQ() {
  const items = [
    { q:'Apakah donasi saya terverifikasi dan aman?', a:'Setiap campaign di NIATBAIK.ORG melalui proses verifikasi tim kami: kunjungan lapangan, dokumen pengaju, hingga update rutin. Donatur juga menerima laporan transparan tiap minggu.' },
    { q:'Bagaimana saya tahu donasi sudah diterima?', a:'Setelah pembayaran sukses, Anda akan menerima notifikasi & kuitansi otomatis via WhatsApp dan email. Riwayat donasi juga tampil di halaman campaign.' },
    { q:'Apa metode pembayaran yang didukung?', a:'QRIS, Virtual Account BCA/Mandiri/BNI/BRI, GoPay, OVO, Dana, ShopeePay, hingga kartu kredit. Tinggal pilih yang paling nyaman.' },
    { q:'Apakah saya bisa donasi sebagai Hamba Allah?', a:'Tentu. Centang "Donasi sebagai anonim" pada form, dan nama Anda akan tampil sebagai Hamba Allah di halaman publik.' },
    { q:'Apakah donasi saya bisa dijadikan zakat?', a:'Ya. Campaign tertentu dapat menjadi penyaluran zakat. Anda akan mendapatkan bukti penyaluran zakat untuk pengurang pajak.' },
    { q:'Apakah ada minimum donasi?', a:'Minimum donasi Rp 10.000. Tidak ada batas maksimum.' },
  ];
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-14 lg:py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 lg:px-6">
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Pertanyaan umum</div>
          <h2 className="mt-2 text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">Hal-hal yang sering ditanyakan</h2>
        </div>
        <div className="mt-8 space-y-3">
          {items.map((f, i) => (
            <div key={i} className={`rounded-2xl border ${open === i ? 'border-brand-200 bg-brand-50/40 shadow-card' : 'border-line bg-white'} transition-all`}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full px-5 py-4 flex items-center justify-between text-left">
                <span className="font-bold text-ink">{f.q}</span>
                <Icon name="chevronD" size={18} className={`text-mute transition-transform ${open === i ? 'rotate-180 text-brand-600' : ''}`}/>
              </button>
              {open === i && <div className="px-5 pb-4 text-sm text-ink/80 leading-relaxed">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------- Final CTA --------
function FinalCTA({ onNav }) {
  return (
    <section className="py-14 lg:py-20 bg-bg2">
      <div className="max-w-5xl mx-auto px-4 lg:px-6">
        <div className="relative rounded-3xl bg-brand-600 p-8 lg:p-12 text-white overflow-hidden">
          <div className="relative grid lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2">
              <h3 className="text-3xl lg:text-4xl font-extrabold leading-tight">Setiap niat baik, sekecil apapun, berdampak besar.</h3>
              <p className="mt-3 text-white/85">Mulai donasi sekarang dan jadilah bagian dari kebaikan yang nyata.</p>
            </div>
            <button onClick={() => onNav('campaign', getFirstCampaign())} className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-extrabold bg-white text-brand-600 hover:scale-[1.02] transition-transform shadow-pop">
              <Icon name="heart" size={20}/> Donasi Sekarang
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// -------- Footer --------
function Footer() {
  // Real contact link from configured CS/admin WhatsApp (same source the donation flow
  // uses). Footer link targets that don't have a real destination yet are rendered as
  // plain non-clickable text instead of deceptive href="#" dead links — on a donation
  // site, a "Kebijakan privasi" link that goes nowhere erodes trust (and is a legal gap).
  const cs = pickCsContact();
  const waNum = normalizeWa((cs && cs.phone) || (window.PUBLIC_SETTINGS && window.PUBLIC_SETTINGS.whatsapp_admin) || '');
  const kontakHref = waNum ? `https://wa.me/${waNum}` : '';

  // Render an anchor when an in-page section exists, else dim plain text ("coming soon").
  const FLink = ({ href, children }) => href
    ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="hover:text-white cursor-pointer">{children}</a>
    : <span className="text-white/45" title="Segera hadir">{children}</span>;

  return (
    <footer className="bg-ink text-white pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 grid grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2"><img src="/assets/logo-niatbaik.png" alt="" className="h-7 invert brightness-200"/></div>
          <p className="mt-3 text-sm text-white/70 max-w-sm leading-relaxed">Platform donasi & crowdfunding terpercaya. Salurkan zakat, sedekah, wakaf, dan donasi kemanusiaan dengan mudah.</p>
          {kontakHref && (
            <a href={kontakHref} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
              <Icon name="wa" size={16}/> Hubungi kami via WhatsApp
            </a>
          )}
        </div>
        <div>
          <div className="font-bold mb-3">Platform</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><FLink href="#campaigns">Donasi</FLink></li>
            <li><FLink href="#how">Fundraiser</FLink></li>
            <li><FLink href="#testi">Laporan transparansi</FLink></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-3">Tentang</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><FLink>Profil Yayasan</FLink></li>
            <li><FLink>Pers & media</FLink></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-3">Bantuan</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><FLink href="#faq">FAQ</FLink></li>
            <li><FLink href={kontakHref}>Kontak</FLink></li>
            <li><FLink>Syarat & ketentuan</FLink></li>
            <li><FLink>Kebijakan privasi</FLink></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/55">
        <div>© 2026 Yayasan NIATBAIK.</div>
        <div className="flex gap-3">
          <span className="inline-flex items-center gap-1.5"><Icon name="shield" size={14}/> Koneksi terenkripsi (SSL)</span>
        </div>
      </div>
    </footer>
  );
}

// -------- Sticky mobile CTA --------
function StickyCTA({ onClick, label = 'Donasi Sekarang' }) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-line p-3 shadow-pop">
      <PrimaryBtn size="md" className="w-full" onClick={onClick}>
        <Icon name="heart" size={18}/> {label}
      </PrimaryBtn>
    </div>
  );
}

// -------- Social proof popup --------
// Read the admin's social-proof config (Settings → Social Proof). Returns the
// resolved {enabled, intervalMs, posClass, template}. Defaults match the panel.
const POS_CLASS = ['top-4 left-4', 'top-4 right-4', 'left-4 bottom-4', 'right-4 bottom-4'];
function getSocialProofConfig() {
  const raw = window.PUBLIC_SETTINGS && window.PUBLIC_SETTINGS.social_proof_config;
  let cfg = {};
  if (typeof raw === 'string' && raw.trim()) { try { cfg = JSON.parse(raw) || {}; } catch {} }
  else if (raw && typeof raw === 'object') { cfg = raw; }
  // social_proof_enabled is the authoritative toggle; config.enabled mirrors it.
  const enabledTop = window.PUBLIC_SETTINGS && window.PUBLIC_SETTINGS.social_proof_enabled;
  const enabled = (cfg.enabled != null ? !!cfg.enabled : (enabledTop != null ? !!enabledTop : true));
  const secs = parseInt(cfg.interval, 10);
  const intervalMs = (secs > 0 ? secs : 8) * 1000;
  const posIdx = (typeof cfg.position === 'number' && cfg.position >= 0 && cfg.position < 4) ? cfg.position : 2;
  return { enabled, intervalMs, posClass: POS_CLASS[posIdx], template: (cfg.template || '').trim() };
}

function SocialPopup() {
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
// Parse campaign nominal presets: window.NB.NOMINAL_PRESETS or c.opt_nominal (JSON array).
function getNominalPresets(c) {
  try {
    if (c && c.opt_nominal) {
      const parsed = JSON.parse(c.opt_nominal);
      if (Array.isArray(parsed) && parsed.length) return parsed.map(Number).filter(Boolean);
    }
  } catch {}
  if (window.NB && Array.isArray(window.NB.NOMINAL_PRESETS) && window.NB.NOMINAL_PRESETS.length) return window.NB.NOMINAL_PRESETS;
  return [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];
}

const PAYMENT_FALLBACK = ['QRIS','BCA','Mandiri','BNI','GoPay','OVO','Dana','ShopeePay'];

// Effective minimum donation for a campaign. Driven by config, not a hardcoded 10.000:
// the per-campaign min_donation wins when set, else the global min_donation_global, else
// a 10.000 default. Lets admins lower the floor (e.g. Rp 1 for production smoke-tests)
// without a code change, and keeps the frontend in lockstep with the backend's two checks.
function effectiveMin(c) {
  const campMin = Number(c && c.min_donation) || 0;
  if (campMin > 0) return campMin;
  const globalMin = Number(window.PUBLIC_SETTINGS && window.PUBLIC_SETTINGS.min_donation_global) || 0;
  if (globalMin > 0) return globalMin;
  return 10000;
}

function CampaignPage({ c: listItem, onNav }) {
  // A donor who picked a nominal on the hero card lands here with _seedAmount set —
  // honor it (and jump straight to the form) instead of resetting to the default, so the
  // amount they chose isn't silently dropped.
  const seededAmount = Number(listItem && listItem._seedAmount) || 0;
  const [view, setViewRaw] = useState(seededAmount > 0 ? 'form' : 'content'); // 'content' | 'form'
  // Wrap setView to fire the InitiateCheckout pixel event when the donor opens the
  // donation form — the one transition that matters for the funnel.
  const setView = (v) => {
    if (v === 'form' && view !== 'form' && window.NBTracking) {
      try { window.NBTracking.track('InitiateCheckout', { content_name: c.title, value: amount || 0, currency: 'IDR' }); } catch {}
    }
    setViewRaw(v);
  };
  const [tab, setTab] = useState('story');
  const [amount, setAmount] = useState(seededAmount > 0 ? seededAmount : 100_000);

  const [paymentMethod, setPaymentMethodRaw] = useState('QRIS');
  // Wrap setPaymentMethod to fire AddPaymentInfo once the donor picks how they'll pay.
  const setPaymentMethod = (m) => {
    setPaymentMethodRaw(m);
    if (window.NBTracking) {
      try { window.NBTracking.track('AddPaymentInfo', { content_name: c.title, value: amount, currency: 'IDR' }); } catch {}
    }
  };
  const [anon, setAnon] = useState(false);
  const [donor, setDonor] = useState({ name:'', wa:'', email:'', message:'' });
  const [paid, setPaid] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Field-level validation errors keyed by field name ('wa'|'name'|'email'|'amount'|
  // 'form'). Rendered inline under each field instead of blocking alert() dialogs,
  // which on a payment page read as broken/scammy and hide which field is wrong.
  const [errors, setErrors] = useState({});
  // Track mount so a deferred setSubmitting (idempotency retry hold) doesn't fire on
  // an unmounted component if the donor navigates away during the 5s window.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // The landing list only carries summary fields (short_description, no story /
  // donors / updates). Fetch the full detail by slug and merge it over the list
  // item so the page shows this campaign's real content instead of placeholders.
  const [detail, setDetail] = useState(null);
  const c = detail || listItem;
  const slug = listItem && (listItem.slug || listItem.id);
  useEffect(() => {
    let cancelled = false;
    if (!slug || !window.api) return;
    setDetail(null); // reset when switching campaigns so stale detail isn't shown
    (async () => {
      try {
        const res = await window.api.campaign(slug);
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
          // ViewContent funnel event: a donor landed on a campaign detail page.
          if (window.NBTracking) {
            try { window.NBTracking.track('ViewContent', { content_name: d.title || listItem.title, content_ids: [listItem.id], value: d.target_amount || 0, currency: 'IDR' }); } catch {}
          }
        }
      } catch { /* keep list item as fallback */ }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // Capture a fundraiser referral code from the share link (?ref=<user_id>) once,
  // so it can be attached to the donation and credit the referrer's commission.
  const referralCode = useMemo(() => {
    try { return new URLSearchParams(window.location.search).get('ref') || ''; } catch { return ''; }
  }, []);

  // CS "need help" link: use the configured CS contact (rotator-aware), falling
  // back to the admin WhatsApp from public settings. Avoids the old hardcoded
  // placeholder number that sent every donor to a dead test contact.
  const csHelpHref = useMemo(() => {
    const cs = pickCsContact();
    const num = normalizeWa((cs && cs.phone) || (window.PUBLIC_SETTINGS && window.PUBLIC_SETTINGS.whatsapp_admin) || '');
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
  const recentDonors = detailDonors || (window.TRANSACTIONS || []).slice(0, 8);
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
    // Client-side validation mirrors the server rules so the donor gets immediate,
    // Indonesian feedback (the flowchart's "Form valid? Tidak → Pesan error" path)
    // instead of a round-trip + generic error. Errors render INLINE under each field
    // (not blocking alert() dialogs) so the donor sees exactly what to fix.
    const errs = {};
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
      const res = await window.api.createDonation({
        campaign_slug: c.slug || c.id,
        donor_name: anon ? 'Hamba Allah' : (donor.name || 'Hamba Allah'),
        donor_phone: donor.wa,
        donor_email: donor.email || '',
        amount: Number(amount),
        message: donor.message || '',
        is_anonymous: anon,
        payment_method: typeof paymentMethod === 'object' ? (paymentMethod.bank_name || paymentMethod.type) : paymentMethod,
        // Send the method's UUID when chosen from the API list so the backend records
        // the exact method on the invoice (admin dashboard + correct confirmation info).
        payment_method_id: (typeof paymentMethod === 'object' && paymentMethod) ? paymentMethod.id : undefined,
        referral_code: referralCode || undefined,
        // Attribution: merge captured UTM (source/medium/campaign/content/term/id) so the
        // invoice carries ad-source attribution feeding the Data Studio + Advertiser views.
        ...(window.NBTracking ? window.NBTracking.getUTM() : {}),
      });
      if (res?.data) { setSubmitting(false); setInvoice(res.data); return; } // view swaps to confirmation
      setErrors({ form: res?.message || 'Gagal membuat donasi' });
    } catch (e) {
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

  return (
    <>
      {/* Hero header */}
      <section className="bg-bg2 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          <button onClick={() => onNav('home')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink">
            <Icon name="chevronL" size={16}/> Kembali ke beranda
          </button>
        </div>
      </section>

      {view === 'content' ? (
        <section className="bg-bg2">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-10 grid lg:grid-cols-5 gap-6">
            {/* Left main */}
            <div className="lg:col-span-3">
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden" style={thumbStyle(c)}>
                {!hasThumbImage(c) && <div className="absolute inset-0 flex items-center justify-center text-white/85"><Icon name={c.icon} size={140} strokeWidth={1}/></div>}
                <div className="absolute inset-0 bg-black/30"/>
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-white/95 text-[11px] font-bold text-ink">{c.category}</span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-[11px] font-bold text-white inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"/>LIVE</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-semibold uppercase opacity-90">Yayasan Niat Baik · Terverifikasi</div>
                  <h1 className="mt-1 text-2xl lg:text-4xl font-extrabold leading-tight">{c.title}</h1>
                </div>
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
                  {tab === 'story' && <CampaignStory c={c}/>}
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
                    <div className="p-2 rounded-lg bg-bg2"><div className="text-mute">Sisa hari</div><div className="font-extrabold text-rose-600">{c.daysLeft}</div></div>
                    <div className="p-2 rounded-lg bg-bg2"><div className="text-mute">Tercapai</div><div className="font-extrabold text-emerald-600">{c.target ? Math.round(c.raised/c.target*100) : 0}%</div></div>
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
      {view === 'content' && <StickyCTA label="Donasi Sekarang" onClick={() => setView('form')}/>}

      <Footer/>
    </>
  );
}

// parseFormItemsConfig safely parses campaign.form_items_config into {kind, items, calc}.
// Empty/invalid → empty so the donor form falls back to plain nominal presets.
function parseFormItemsConfig(raw) {
  let o = {};
  if (raw && typeof raw === 'object') o = raw;
  else if (typeof raw === 'string' && raw.trim()) { try { o = JSON.parse(raw) || {}; } catch { o = {}; } }
  return {
    kind: o.kind || '',
    items: Array.isArray(o.items) ? o.items : [],
    calc: (o.calc && typeof o.calc === 'object') ? o.calc : {},
  };
}

// itemImg resolves a stored item image filename to a display URL (mediaUrl, dev-aware).
function itemImg(image) {
  if (!image) return '';
  const path = String(image).startsWith('/uploads/') || /^https?:\/\//.test(image) ? image : '/uploads/' + image;
  return window.mediaUrl ? window.mediaUrl(path) : path;
}

// ItemSelect renders the donor-facing item picker for qurban / package2 / zfitrah. Each
// card shows image + name + price (+ qurban subtitle). Selecting sets the donation amount
// to the item's price.
function ItemSelect({ c, kind, items, amount, setAmount, customInput }) {
  const heading = kind === 'qurban' ? 'Pilih hewan qurban' : kind === 'zfitrah' ? 'Pilih paket zakat fitrah' : 'Pilih paket donasi';
  // Track the chosen item by IDENTITY, not by price — two items can share a price, and
  // matching on amount===price would highlight ALL of them at once.
  const [selectedKey, setSelectedKey] = useState('');
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">{heading}</div>
      <div className="space-y-2.5">
        {items.map((it, i) => {
          const price = Number(it.price) || 0;
          const key = it.id || String(i);
          const selected = selectedKey === key && amount === price && price > 0;
          const img = itemImg(it.image);
          const sub = kind === 'qurban'
            ? [it.animal_type, it.share && it.share !== '1' ? `Patungan ${it.share}` : (it.share === '1' ? 'Full' : ''), it.weight].filter(Boolean).join(' · ')
            : (it.desc || '');
          return (
            <button key={key} onClick={() => { setSelectedKey(key); setAmount(price); }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border-2 text-left transition-all ${selected ? 'border-brand-600 bg-brand-50 shadow-card' : 'border-line bg-white hover:border-brand-200'}`}>
              <div className="shrink-0 h-16 w-16 rounded-xl overflow-hidden bg-bg2 flex items-center justify-center">
                {img ? <img src={img} alt="" className="h-full w-full object-cover" onError={(e)=>{e.target.style.display='none';}}/> : <Icon name="heart" size={22} className="text-brand-300"/>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-ink leading-tight truncate">{it.name || 'Paket'}</div>
                {sub && <div className="text-[11px] text-mute truncate">{sub}</div>}
                <div className="text-sm font-extrabold text-brand-600 mt-0.5">{fmtIDR(price)}</div>
              </div>
              <span className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 ${selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-200 text-brand-600'}`}>
                {selected ? 'Dipilih ✓' : 'Pilih'}
              </span>
            </button>
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
function ZakatCalc({ calc, amount, setAmount }) {
  const [base, setBase] = useState(0);
  const type = calc.type || 'maal';
  const rate = Number(calc.rate) || 2.5;

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

  const typeLabel = { maal:'Zakat Maal', profesi:'Zakat Penghasilan', emas:'Zakat Emas', pertanian:'Zakat Pertanian' }[type] || 'Zakat';
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
function NominalSelect({ c, presets, amount, setAmount }) {
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
          {presets.map((p) => (
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
          {presets.map((p, i) => (
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
          {presets.map((p, i) => (
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
          {presets.map((p) => (
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
        {presets.map((p) => (
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
function DonationForm({ c, presets, amount, setAmount, donor, setDonor, anon, setAnon, paymentMethod, setPaymentMethod, submitting, errors = {}, setErrors, onBack, onSubmit }) {
  const clearErr = (k) => { if (setErrors && errors[k]) setErrors({ ...errors, [k]: undefined }); };
  // Per-campaign payment override: the editor's Advanced → Payment "Custom" rows are
  // persisted in campaign.payment_config (shape {bank, account, holder, method}). When
  // present, the donor sees THIS campaign's configured methods instead of the global
  // public list — honoring the admin's per-campaign choice (previously a dead-end: the
  // override was saved but never surfaced publicly).
  const campaignMethods = useMemo(() => {
    let rows = null;
    try {
      const parsed = c?.payment_config ? JSON.parse(c.payment_config) : null;
      if (Array.isArray(parsed) && parsed.length) {
        rows = parsed
          .filter((r) => r && (r.bank || r.account))
          .map((r, i) => ({
            id: r.id || ('camp-' + i),
            bank_name: r.bank || '',
            bank_number: r.account || '',
            account_name: r.holder || '',
            type: r.method || 'va',
            category: r.method === 'ewallet' ? 'ewallet' : (r.method === 'qris' ? 'qris' : 'bank_transfer'),
            admin_fee: 0,
          }));
      }
    } catch { rows = null; }
    return (rows && rows.length) ? rows : null;
  }, [c?.payment_config]);

  const methods = campaignMethods
    || (Array.isArray(window.PAYMENT_METHODS_PUBLIC) && window.PAYMENT_METHODS_PUBLIC.length
      ? window.PAYMENT_METHODS_PUBLIC : null);

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
    const g = {};
    methods.forEach((m) => {
      const key = (m.type || m.category || 'lainnya').toUpperCase();
      (g[key] = g[key] || []).push(m);
    });
    return g;
  }, [methods]);

  const isSelected = (m) => {
    if (typeof paymentMethod === 'object' && paymentMethod) return paymentMethod.id === m.id;
    return false;
  };

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
    : !!(window.PUBLIC_SETTINGS && window.PUBLIC_SETTINGS.flip_enabled);
  const subtotalNum = Number(amount) || 0;
  const totalNum = subtotalNum;

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
            <input className={`field ${errors.name ? 'border-rose-400' : ''}`} placeholder="Nama (cth: Hamba Allah)" value={donor.name} onChange={(e) => { setDonor({...donor, name:e.target.value}); clearErr('name'); }} disabled={anon}/>
            {errors.name && <div className="mt-1 text-xs text-rose-600">{errors.name}</div>}
          </div>
          <div>
            <input className={`field ${errors.wa ? 'border-rose-400' : ''}`} placeholder="No. WhatsApp · cth 08123… (wajib)" value={donor.wa} onChange={(e) => { setDonor({...donor, wa:e.target.value}); clearErr('wa'); }}/>
            {errors.wa
              ? <div className="mt-1 text-xs text-rose-600">{errors.wa}</div>
              : <div className="mt-1 text-[11px] text-mute">Untuk kirim bukti &amp; verifikasi donasi; tidak ditampilkan publik.</div>}
          </div>
          {/* Email / anonim / comment honor the admin's Advanced > Form > Custom field
              toggles (form_fields_config). When _custom is set, hidden fields are omitted;
              otherwise everything shows (back-compat for campaigns with no custom config). */}
          {showEmail && (
            <div>
              <input className={`field ${errors.email ? 'border-rose-400' : ''}`} placeholder="Email (opsional)" value={donor.email} onChange={(e) => { setDonor({...donor, email:e.target.value}); clearErr('email'); }}/>
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
            <textarea className="field" rows="2" placeholder="Doa / pesan donatur (opsional)" value={donor.message} onChange={(e) => setDonor({...donor, message:e.target.value})}/>
          )}
        </div>

        {/* Pembayaran */}
        <div className="pt-4 border-t border-line space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-mute">Metode pembayaran</div>
          {grouped ? (
            <div className="space-y-3">
              {Object.entries(grouped).map(([type, list]) => (
                <div key={type}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-mute mb-1.5">{type}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {list.map((m) => (
                      <button key={m.id} onClick={() => setPaymentMethod(m)}
                        className={`h-14 px-2 rounded-lg border-2 flex flex-col items-center justify-center text-center text-[10px] font-extrabold leading-tight ${isSelected(m) ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink hover:border-brand-200'}`}>
                        <span>{m.bank_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_FALLBACK.map((m) => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`h-12 rounded-lg border-2 flex items-center justify-center text-[10px] font-extrabold ${paymentMethod===m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink hover:border-brand-200'}`}>
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fee disclosure — show the donor exactly what they'll pay BEFORE submitting. */}
        <div className="pt-4 border-t border-line">
          <div className="rounded-xl bg-bg2 p-4 text-sm space-y-1.5">
            <div className="flex justify-between"><span className="font-bold text-ink">Total donasi</span><b className="text-brand-600 text-lg">{fmtIDR(totalNum)}</b></div>
            {!settlesViaFlip && (
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
function InvoiceConfirmation({ c, invoice: invoiceProp, amount, paymentMethod, onReset }) {
  const [invoice, setInvoiceState] = useState(invoiceProp);
  const [status, setStatus] = useState(invoiceProp.status || 'Menunggu Pembayaran');
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState('');
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Sandbox flag from public settings: true only in non-production. Gates the tester
  // "Simulasikan Pembayaran" button, which advances QRIS/VA/manual invoices (no hosted
  // link to follow) to a paid state via the non-production-only backend endpoint.
  const sandboxMode = !!(window.PUBLIC_SETTINGS && window.PUBLIC_SETTINGS.sandbox_mode);

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
  const isQRIS = !isHostedGateway && (pmType.includes('qris') || (!!invoice.qr_url && !/^https?:\/\//i.test(invoice.qr_url)));
  const isPaid = invoice.is_paid || /paid|berhasil|lunas|success/i.test(status);

  const autoRedirect = !!(typeof window !== 'undefined' && window.PUBLIC_SETTINGS && window.PUBLIC_SETTINGS.flip_auto_redirect);

  // Manual-transfer destination. Flip (gateway) returns a pay_code; otherwise the
  // donor transfers to the single org account configured in Settings → Payment
  // (exposed via public settings). Order: gateway pay_code → invoice → org settings.
  const ps = (typeof window !== 'undefined' && window.PUBLIC_SETTINGS) || {};
  const bankNumber = invoice.pay_code || invoice.bank_number || pmObj?.bank_number || ps.bank_number || '';
  const accountName = pmObj?.account_name || invoice.account_name || ps.bank_account_name || 'Yayasan Niat Baik';
  const bankName = pmObj?.bank_name || invoice.payment_method || ps.bank_name || (typeof paymentMethod === 'string' ? paymentMethod : 'Transfer Bank');

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
  const fmtCountdown = (ms) => {
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
    : (pmObj && pmObj.image ? (window.mediaUrl ? window.mediaUrl(pmObj.image) : pmObj.image) : '');

  // Flip auto-redirect: when the admin enabled "Auto Redirect" and this is a Flip
  // invoice that's not yet paid, send the donor straight to Flip's payment page.
  // The manual "Lanjutkan ke Pembayaran" button stays as a fallback if the redirect
  // is blocked (popup blockers don't affect same-tab location changes).
  useEffect(() => {
    if (isHostedGateway && autoRedirect && flipUrl && !isPaid) {
      try { window.location.href = flipUrl; } catch {}
    }
  }, [isHostedGateway, autoRedirect, flipUrl, isPaid]);

  // Poll status every 12s until paid, but cap at ~12 min (60 attempts). Without a
  // cap, an invoice that never settles (e.g. a stuck webhook) polls forever with
  // no signal to the donor. After the cap we stop and surface a "contact CS" path.
  useEffect(() => {
    if (isPaid || pollTimedOut) return;
    let attempts = 0;
    const MAX_ATTEMPTS = 60;
    const id = setInterval(async () => {
      attempts += 1;
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(id);
        setPollTimedOut(true);
        return;
      }
      try {
        const res = await window.api.paymentStatus(invoice.invoice_number);
        if (res?.data) {
          setStatus(res.data.status || status);
          setInvoiceState((prev) => ({ ...prev, ...res.data }));
          if (res.data.is_paid) clearInterval(id);
        }
      } catch {}
    }, 12000);
    return () => clearInterval(id);
  }, [invoice.invoice_number, isPaid, pollTimedOut]);

  // Tick once a second to drive the expiry countdown (only while unpaid + not expired).
  useEffect(() => {
    if (isPaid) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isPaid]);

  const checkNow = async () => {
    setChecking(true);
    setPollTimedOut(false); // a manual check re-arms the automatic poller below
    try {
      const res = await window.api.paymentStatus(invoice.invoice_number);
      if (res?.data) { setStatus(res.data.status || status); setInvoiceState((prev) => ({ ...prev, ...res.data })); }
    } catch {}
    setChecking(false);
  };

  // Sandbox-only: ask the backend to settle this invoice without a real transfer.
  const simulatePay = async () => {
    setSimulating(true);
    try {
      const res = await window.api.simulatePayment(invoice.invoice_number);
      if (res?.data) { setStatus(res.data.status || 'Terbayar'); setInvoiceState((prev) => ({ ...prev, ...res.data, is_paid: true })); }
    } catch (e) {
      setStatus('Gagal simulasi: ' + (e?.message || 'error'));
    }
    setSimulating(false);
  };

  const copy = (text, key) => {
    try { navigator.clipboard.writeText(String(text)); setCopied(key); setTimeout(() => setCopied(''), 1500); } catch {}
  };

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
        <div className="mt-4 text-[12px] text-mute leading-relaxed">
          Bukti donasi &amp; ucapan terima kasih akan dikirim ke WhatsApp{invoice.donor_email ? ' & email' : ''} Anda.
        </div>
        <button onClick={onReset} className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700">
          Kembali ke campaign
        </button>
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
            {autoRedirect
              ? `Anda akan dialihkan ke halaman pembayaran ${gatewayLabel}. Jika tidak otomatis, tekan tombol di bawah.`
              : `Lanjutkan ke halaman pembayaran ${gatewayLabel} (QRIS / Virtual Account / e-wallet) untuk menyelesaikan donasi.`}
          </div>
          {flipUrl ? (
            <a href={flipUrl} target="_blank" rel="noopener noreferrer"
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
          <img src={qrisImage} alt="QRIS" className="w-52 h-52 rounded-xl border border-line object-contain bg-white" onError={(e)=>{e.target.style.display='none';}}/>
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
        const greeting = (window.PUBLIC_SETTINGS && window.PUBLIC_SETTINGS.donor_greeting || '').trim();
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
          Status belum otomatis terverifikasi. Jika Anda sudah membayar, tekan <b>Cek Status Pembayaran</b> di bawah atau konfirmasi ke CS via WhatsApp — kami akan bantu verifikasi manual.
        </div>
      )}

      <PrimaryBtn size="md" className="w-full mt-4" onClick={checkNow} disabled={checking}>
        <Icon name="check" size={16}/> {checking ? 'Memeriksa…' : 'Cek Status Pembayaran'}
      </PrimaryBtn>
      {(() => {
        // Prefer the configured CS contacts (rotator-aware); fall back to whatsapp_admin.
        const cs = pickCsContact();
        const fallback = (window.PUBLIC_SETTINGS && window.PUBLIC_SETTINGS.whatsapp_admin) || '';
        const num = normalizeWa(cs ? cs.phone : fallback);
        if (!num) return null;
        const label = cs && cs.name ? `Konfirmasi via WhatsApp (${cs.name})` : 'Konfirmasi via WhatsApp';
        const msg = encodeURIComponent(`Halo admin, saya sudah donasi. Invoice: ${invoice.invoice_number}, nominal: ${fmtIDR(total)}. Mohon konfirmasi.`);
        return (
          <a href={`https://wa.me/${num}?text=${msg}`} target="_blank" rel="noopener noreferrer"
             className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600">
            <Icon name="wa" size={16}/> {label}
          </a>
        );
      })()}
      <button onClick={onReset} className="mt-2 w-full text-xs font-semibold text-mute hover:text-ink">Kembali ke campaign</button>

      <div className="mt-4 pt-4 border-t border-line text-center text-[11px] text-mute leading-relaxed">
        Setelah pembayaran, status diperbarui otomatis. Bila perlu, admin / CS kami akan mengkonfirmasi donasi Anda via WhatsApp & email.
      </div>
    </div>
  );
}

function CampaignStory({ c }) {
  // Render the campaign's real story. `description` is rich HTML authored in the
  // admin editor; sanitize it (window.sanitizeHTML, same allow-list used on save)
  // before injecting so stored content can't carry active markup. Fall back to the
  // short description, then to a neutral message when a campaign has no story yet.
  const rawHtml = (c && typeof c.description === 'string' && c.description.trim()) ? c.description : '';
  const shortText = (c && (c.short_description || c.shortDescription) || '').trim();

  // Only inject HTML when the sanitizer is actually available. If it somehow isn't,
  // fail safe to the plain-text path below rather than dumping raw HTML into the DOM.
  if (rawHtml && typeof window.sanitizeHTML === 'function') {
    const clean = window.sanitizeHTML(rawHtml);
    return (
      <div className="prose prose-slate prose-sm max-w-none text-ink/85"
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

function CampaignUpdates({ updates }) {
  const items = Array.isArray(updates) ? updates : [];
  if (!items.length) {
    return <div className="text-sm text-mute italic py-2">Belum ada update untuk campaign ini.</div>;
  }
  const fmtDate = (s) => {
    try { return new Date(s).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }); }
    catch { return ''; }
  };
  return (
    <div className="space-y-4">
      {items.map((u, i) => (
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

function CampaignDonors({ donors }) {
  const list = Array.isArray(donors) ? donors : [];
  if (!list.length) {
    return <div className="text-sm text-mute italic py-2">Jadilah donatur pertama untuk campaign ini.</div>;
  }
  // Donors may come from the campaign detail endpoint ({name, amount,
  // is_anonymous, created_at}) or the legacy transactions feed ({donor, anon,
  // message, date}). Normalize both into one shape before rendering.
  const norm = (d) => {
    const anon = d.is_anonymous ?? d.anon ?? false;
    const name = anon ? 'Hamba Allah' : (d.name || d.donor || 'Hamba Allah');
    let when = '';
    if (d.created_at) { try { when = new Date(d.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short' }); } catch {} }
    else if (typeof d.date === 'string') when = d.date.split(',')[0];
    return { anon, name, amount: d.amount || 0, message: d.message || '', when };
  };
  return (
    <div className="space-y-2">
      {list.map((raw, i) => {
        const d = norm(raw);
        const initials = d.anon ? 'HA' : d.name.split(' ').map(s => s[0]).join('').slice(0, 2);
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

// ====================================================================
// App entry
// ====================================================================
function PublicApp() {
  const [page, setPage] = useState({ name: 'home', data: null });
  const onNav = (name, data) => {
    setPage({ name, data });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar onNav={onNav}/>
      <main className="flex-1 pb-24 lg:pb-0">
        {page.name === 'home' ? (
          <>
            <Hero onNav={onNav}/>
            <TrustStrip/>
            <StatsSection/>
            <CampaignsSection onNav={onNav}/>
            <HowToSection/>
            <TestimonialsSection/>
            <FAQ/>
            <FinalCTA onNav={onNav}/>
            <Footer/>
          </>
        ) : (
          <CampaignPage c={page.data || getFirstCampaign()} onNav={onNav}/>
        )}
      </main>
      {page.name === 'home' && (
        <>
          <SocialPopup/>
          <StickyCTA onClick={() => onNav('campaign', getFirstCampaign())}/>
        </>
      )}
    </div>
  );
}

// -------- SPA exports (single-page app integration) --------
// LandingPage hosts the full public site (self-routes home ↔ campaign internally).
window.LandingPage = PublicApp;

// CampaignDetail: used by app.jsx for the `campaign-detail` route. Resolves the
// campaign by slug/id from live CAMPAIGNS (else seed) and renders the public
// CampaignPage; onBack returns to the landing route.
function CampaignDetail({ id, onBack }) {
  const [dark, toggleDark] = usePublicDark();
  const list = window.CAMPAIGNS || getCampaigns();
  // Resolve strictly by exact slug/id — NO fallback to another campaign (a wrong
  // slug like /c/anjay must not silently show a different program).
  const fromList = (id && list.find(x => x.slug === id || x.id === id)) || null;

  // 'loading' until we know; then either the campaign object or null (not found).
  const [resolved, setResolved] = useState(fromList);
  const [state, setState] = useState(fromList ? 'ok' : (id ? 'loading' : 'notfound'));

  useEffect(() => {
    let alive = true;
    if (fromList || !id) { return; }
    // Not in the in-memory list (e.g. a direct deep-link before the list loaded, or
    // a paused/non-listed campaign). Try fetching it by slug from the API.
    if (window.api && window.api.campaign) {
      window.api.campaign(id)
        .then(r => {
          if (!alive) return;
          if (r && r.data) { setResolved(window.mapCampaign ? window.mapCampaign(r.data) : r.data); setState('ok'); }
          else setState('notfound');
        })
        .catch(() => { if (alive) setState('notfound'); });
    } else {
      setState('notfound');
    }
    return () => { alive = false; };
  }, [id]);

  const Header = (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center gap-4">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-ink">
          <Icon name="chevronL" size={16}/> Kembali
        </button>
        <div className="flex-1"/>
        <button onClick={toggleDark} aria-label="Toggle dark mode"
          className="h-9 w-9 rounded-lg border border-line bg-white hover:bg-bg2 flex items-center justify-center text-ink">
          <Icon name={dark ? 'sun' : 'moon'} size={16}/>
        </button>
        <img src="/assets/logo-niatbaik.png" alt="NIATBAIK.ORG" className="h-7"/>
      </div>
    </header>
  );

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {Header}
        <main className="flex-1 flex items-center justify-center text-mute text-sm">
          <span className="h-5 w-5 mr-3 rounded-full border-2 border-brand-600 border-t-transparent animate-spin"/>
          Memuat campaign…
        </main>
      </div>
    );
  }

  if (state === 'notfound' || !resolved) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {Header}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
          <div className="h-16 w-16 rounded-2xl bg-bg2 flex items-center justify-center text-mute mb-4"><Icon name="search" size={28}/></div>
          <div className="text-xl font-extrabold text-ink">Campaign tidak ditemukan</div>
          <div className="mt-1 text-sm text-mute max-w-sm">Tautan mungkin salah atau campaign sudah tidak tersedia.</div>
          <button onClick={onBack} className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700">
            <Icon name="home" size={16}/> Kembali ke beranda
          </button>
        </main>
        <Footer/>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {Header}
      <main className="flex-1 pb-24 lg:pb-0">
        <CampaignPage c={resolved} onNav={(name) => { if (name === 'home') onBack(); }}/>
      </main>
      <SocialPopup/>
    </div>
  );
}
window.CampaignDetail = CampaignDetail;

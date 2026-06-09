// Public-facing landing + campaign + donation flow.
const { useState, useEffect, useRef, useMemo } = React;
const { fmtIDR, fmtIDRShort, fmtNum } = window.NB;
const getCampaigns = () => (window.CAMPAIGNS && window.CAMPAIGNS.length) ? window.CAMPAIGNS : [];
const getFirstCampaign = () => getCampaigns()[0] || { id:'', title:'', category:'', target:1, raised:0, donors:0, daysLeft:0, thumb:'linear-gradient(135deg,#2E4191,#38B6FF)', icon:'heart' };
const getSocialProof = () => window.socialProofLines && window.socialProofLines.length ? window.socialProofLines : [];

// -------- Helpers --------
const PrimaryBtn = ({ children, size='md', className='', ...rest }) => {
  const sizes = { sm:'text-sm px-4 py-2', md:'text-base px-5 py-3', lg:'text-lg px-7 py-4', xl:'text-lg px-8 py-4.5' };
  return (
    <button {...rest} className={`inline-flex items-center justify-center gap-2 font-bold rounded-xl text-white bg-gradient-to-r from-brand-600 to-sky2-500 hover:from-brand-700 hover:to-sky2-500 shadow-glow transition-all ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

const Progress = ({ value, max, className='h-2' }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={`relative w-full ${className} bg-slate-100 rounded-full overflow-hidden`}>
      <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-600 to-sky2-400 rounded-full" style={{ width: pct + '%' }}/>
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
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sky2-50">
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sky2-100 opacity-60 blur-3xl"/>
      <div className="absolute top-40 -left-32 h-72 w-72 rounded-full bg-brand-100 opacity-50 blur-3xl"/>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-20 grid lg:grid-cols-2 gap-10 items-center relative">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-line shadow-card text-xs font-bold text-ink">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/>
            <span>{fmtNum(window.TOTAL_DONORS || 0)} donatur aktif</span>
            <span className="text-mute font-normal hidden sm:inline">· Update real-time</span>
          </div>

          <h1 className="mt-5 text-4xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-ink">
            Salurkan <span className="bg-gradient-to-r from-brand-600 to-sky2-500 bg-clip-text text-transparent">Niat Baik</span> Anda, wujudkan kebaikan nyata.
          </h1>
          <p className="mt-5 text-lg text-mute max-w-xl leading-relaxed">
            Donasi terverifikasi untuk kemanusiaan, kesehatan, pendidikan, dan wakaf.
            Transparan, mudah, dan dipercaya <b className="text-ink">182.000+ donatur</b> Indonesia.
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
              { v:'4,9★',   l:'Trust rating' },
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
  return (
    <div className="relative float-in">
      <div className="absolute -top-3 -left-3 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-pop rotate-[-6deg] z-10">URGENT · 6 hari lagi</div>
      <div className="rounded-3xl bg-white border border-line shadow-pop overflow-hidden">
        <div className="relative aspect-[16/10]" style={{ background: c.thumb }}>
          <div className="absolute inset-0 flex items-center justify-center text-white/85"><Icon name={c.icon} size={120} strokeWidth={1}/></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent"/>
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
              <div className="text-2xl font-extrabold text-ink">{Math.round(c.raised/c.target*100)}%</div>
              <div className="text-xs text-mute">tercapai</div>
            </div>
          </div>
          <Progress value={c.raised} max={c.target} className="h-2.5 mt-3"/>
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
            <PrimaryBtn size="lg" className="w-full mt-3" onClick={() => onNav('campaign', c)}>
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
  const stats = [
    { icon:'wallet',    v:'Rp 1,84 M+', l:'Donasi tersalurkan' },
    { icon:'users',     v:fmtNum(window.TOTAL_DONORS || 0), l:'Donatur bersama' },
    { icon:'megaphone', v:'412',        l:'Campaign aktif' },
    { icon:'pin',       v:'34 Provinsi',l:'Jangkauan program' },
  ];
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl bg-gradient-to-br from-brand-600 to-sky2-500 p-5 text-white">
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
  const src = (window.CAMPAIGNS && window.CAMPAIGNS.length) ? window.CAMPAIGNS : getCampaigns();
  const campaigns = src.filter(c => c.status === 'Running' || c.status === 'Published' || c.status === 'Berjalan');
  const filtered = tab === 'all' ? campaigns : campaigns.filter(c => c.category === tab);

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

        {filtered.length >= 6 && (
          <div className="mt-8 text-center">
            <button onClick={() => setTab('all')} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-ink bg-white border border-line hover:bg-bg2">
              Lihat semua campaign <Icon name="arrowR" size={16}/>
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
      <div className="relative aspect-[16/10]" style={{ background: c.thumb }}>
        <div className="absolute inset-0 flex items-center justify-center text-white/85"><Icon name={c.icon} size={70} strokeWidth={1.2}/></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"/>
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
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-600 to-sky2-500 text-white flex items-center justify-center"><Icon name={s.icon} size={22}/></div>
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
    <section id="testi" className="py-14 lg:py-20 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white relative overflow-hidden">
      <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-sky2-400/30 blur-3xl"/>
      <div className="absolute -bottom-24 -left-32 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl"/>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-sky2-100">Apa kata donatur</div>
            <h2 className="mt-2 text-3xl lg:text-4xl font-extrabold tracking-tight">Bergabung bersama 182.000+ donatur Indonesia</h2>
            <p className="mt-3 text-white/85">Cerita nyata dari donatur yang mempercayakan niat baiknya melalui NIATBAIK.ORG.</p>
            <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
              <div><div className="text-2xl font-extrabold">4.9★</div><div className="text-xs text-white/75">Trust rating</div></div>
              <div><div className="text-2xl font-extrabold">98%</div><div className="text-xs text-white/75">Donatur puas</div></div>
              <div><div className="text-2xl font-extrabold">412</div><div className="text-xs text-white/75">Mitra fundraiser</div></div>
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
        <div className="relative rounded-3xl bg-gradient-to-br from-brand-600 to-sky2-500 p-8 lg:p-12 text-white overflow-hidden">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"/>
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
  return (
    <footer className="bg-ink text-white pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 grid grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2"><img src="/assets/logo-niatbaik.png" alt="" className="h-7 invert brightness-200"/></div>
          <p className="mt-3 text-sm text-white/70 max-w-sm leading-relaxed">Platform donasi & crowdfunding terpercaya. Salurkan zakat, sedekah, wakaf, dan donasi kemanusiaan dengan mudah.</p>
          <div className="mt-4 flex gap-2">
            {[
              { n:'Instagram', icon:'camera' },
              { n:'TikTok',    icon:'play' },
              { n:'Facebook',  icon:'users' },
              { n:'YouTube',   icon:'play' },
            ].map((s) => (
              <a key={s.n} href="#" onClick={(e) => e.preventDefault()} title={s.n}
                className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <Icon name={s.icon} size={16}/>
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="font-bold mb-3">Platform</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><a href="#campaigns" className="hover:text-white cursor-pointer">Donasi</a></li>
            <li><a href="#campaigns" className="hover:text-white cursor-pointer">Buat Campaign</a></li>
            <li><a href="#how" className="hover:text-white cursor-pointer">Fundraiser</a></li>
            <li><a href="#testi" className="hover:text-white cursor-pointer">Laporan transparansi</a></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-3">Tentang</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><a href="#" className="hover:text-white cursor-pointer">Profil Yayasan</a></li>
            <li><a href="#" className="hover:text-white cursor-pointer">Tim</a></li>
            <li><a href="#" className="hover:text-white cursor-pointer">Karir</a></li>
            <li><a href="#" className="hover:text-white cursor-pointer">Pers & media</a></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-3">Bantuan</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><a href="#faq" className="hover:text-white cursor-pointer">FAQ</a></li>
            <li><a href="#" className="hover:text-white cursor-pointer">Kontak</a></li>
            <li><a href="#" className="hover:text-white cursor-pointer">Syarat & ketentuan</a></li>
            <li><a href="#" className="hover:text-white cursor-pointer">Kebijakan privasi</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/55">
        <div>© 2026 Yayasan NIATBAIK. Berizin Kemensos RI · Audit publik bulanan.</div>
        <div className="flex gap-3">
          <span className="inline-flex items-center gap-1.5"><Icon name="shield" size={14}/> SSL Secure</span>
          <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14}/> ISO 27001</span>
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
function SocialPopup() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 4000);
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx((i) => { const sp = getSocialProof(); return sp.length ? (i + 1) % sp.length : 0; }); setVisible(true); }, 400);
    }, 8000);
    return () => { clearTimeout(t1); clearInterval(id); };
  }, []);
  const sp = getSocialProof();
  if (!sp.length) return null;
  const p = sp[idx] || sp[0];
  return (
    <div className={`hidden lg:flex fixed left-4 bottom-4 z-30 transition-all ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
      <div className="bg-white rounded-xl shadow-pop border border-line p-3 flex items-center gap-3 max-w-xs">
        <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center"><Icon name="heart" size={18}/></div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-ink"><b>{p.name}</b> baru saja berdonasi</div>
          <div className="text-sm font-bold text-brand-600">{fmtIDR(p.amount)}</div>
          <div className="text-[10px] text-mute truncate">untuk "{p.campaign}" · {p.when}</div>
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

function CampaignPage({ c, onNav }) {
  const [view, setView] = useState('content'); // 'content' | 'form'
  const [tab, setTab] = useState('story');
  const [amount, setAmount] = useState(100_000);

  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [anon, setAnon] = useState(false);
  const [donor, setDonor] = useState({ name:'', wa:'', email:'', message:'' });
  const [paid, setPaid] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const presets = useMemo(() => getNominalPresets(c), [c]);
  const recentDonors = (window.TRANSACTIONS || []).slice(0, 8);

  const updateCount = 4;
  const tabs = [
    { v:'story', l:'Cerita' },
    { v:'updates', l:`Update (${updateCount})` },
    { v:'donors', l:`Donatur (${recentDonors.length})` },
    { v:'faq', l:'FAQ' },
  ];

  const handleSubmit = async () => {
    if (!donor.wa.trim()) { alert('No. WhatsApp wajib diisi'); return; }
    if (!amount || amount < 10000) { alert('Minimal donasi Rp 10.000'); return; }
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
        payment_method: typeof paymentMethod === 'object' ? (paymentMethod.type || paymentMethod.bank_name) : paymentMethod,
      });
      if (res?.data) { setInvoice(res.data); }
      else alert(res?.message || 'Gagal membuat donasi');
    } catch (e) { alert('Gagal: ' + (e?.message || 'Periksa koneksi')); }
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
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden" style={{ background: c.thumb }}>
                <div className="absolute inset-0 flex items-center justify-center text-white/85"><Icon name={c.icon} size={140} strokeWidth={1}/></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent"/>
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
                  {tab === 'updates' && <CampaignUpdates/>}
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
                      <Icon name="heart" size={18}/> Donasi Sekarang
                    </PrimaryBtn>
                    <div className="mt-2 text-center text-[11px] text-mute">
                      <Icon name="shield" size={12} className="inline mr-1 text-emerald-600"/> Pembayaran aman melalui QRIS, VA, dan e-wallet
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-line flex items-center justify-around text-[10px] font-bold text-mute">
                    <span className="inline-flex items-center gap-1"><Icon name="shield" size={12} className="text-emerald-600"/>SSL Aman</span>
                    <span className="inline-flex items-center gap-1"><Icon name="check"  size={12} className="text-emerald-600"/>Terverifikasi</span>
                    <span className="inline-flex items-center gap-1"><Icon name="star"   size={12} className="text-amber-500"/>4.9★ Trust</span>
                  </div>
                </div>

                <div className="hidden lg:block mt-3 text-center text-xs text-mute">
                  Butuh bantuan? <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="font-bold text-brand-600 hover:underline cursor-pointer">Hubungi CS via WhatsApp</a>
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

// -------- Nominal selector: 6 form_style variants --------
// Card | List | Typing | Package | Package2 | Qurban (from c.form_style)
function NominalSelect({ c, presets, amount, setAmount }) {
  const style = (c && c.form_style) || 'Card';
  const customInput = (
    <div className="mt-3">
      <label className="text-xs font-bold text-mute">Atau masukkan nominal lain</label>
      <div className="mt-1 flex items-center rounded-xl border-2 border-line bg-white focus-within:border-brand-600">
        <span className="pl-3 text-mute font-bold">Rp</span>
        <input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} className="flex-1 px-2 py-3 outline-none font-bold text-ink bg-transparent"/>
      </div>
    </div>
  );

  if (style === 'Typing') {
    return (
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Masukkan nominal donasi</div>
        <div className="flex items-center rounded-2xl border-2 border-line bg-white focus-within:border-brand-600">
          <span className="pl-4 text-mute font-extrabold text-xl">Rp</span>
          <input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} placeholder="0"
            className="flex-1 px-3 py-4 outline-none font-extrabold text-ink text-2xl bg-transparent"/>
        </div>
        <div className="mt-2 text-xs text-mute">Minimal donasi Rp 10.000. Tidak ada batas maksimum.</div>
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
              <div className="relative aspect-[16/10] flex items-center justify-center text-white/85" style={{ background: c.thumb }}>
                <Icon name={c.icon} size={44} strokeWidth={1.2}/>
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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-sky2-500 text-white flex items-center justify-center shrink-0"><Icon name="heart" size={18}/></div>
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
function DonationForm({ c, presets, amount, setAmount, donor, setDonor, anon, setAnon, paymentMethod, setPaymentMethod, submitting, onBack, onSubmit }) {
  const methods = (Array.isArray(window.PAYMENT_METHODS_PUBLIC) && window.PAYMENT_METHODS_PUBLIC.length)
    ? window.PAYMENT_METHODS_PUBLIC : null;

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

  return (
    <div className="rounded-2xl bg-white border border-line shadow-card p-5 lg:p-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink mb-4">
        <Icon name="chevronL" size={16}/> Kembali ke campaign
      </button>

      <div className="flex items-center gap-3 pb-4 border-b border-line">
        <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0" style={{ background: c.thumb }}>
          <div className="w-full h-full flex items-center justify-center text-white/85"><Icon name={c.icon} size={24} strokeWidth={1.5}/></div>
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
          <input className="field" placeholder="Nama (cth: Hamba Allah)" value={donor.name} onChange={(e) => setDonor({...donor, name:e.target.value})} disabled={anon}/>
          <input className="field" placeholder="No. WhatsApp · cth 08123… (wajib)" value={donor.wa} onChange={(e) => setDonor({...donor, wa:e.target.value})}/>
          <input className="field" placeholder="Email · untuk kuitansi" value={donor.email} onChange={(e) => setDonor({...donor, email:e.target.value})}/>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="rounded border-line"/>
            Donasi sebagai anonim (Hamba Allah)
          </label>
          <textarea className="field" rows="2" placeholder="Doa / pesan donatur (opsional)" value={donor.message} onChange={(e) => setDonor({...donor, message:e.target.value})}/>
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
                        {m.admin_fee ? <span className="text-[9px] font-semibold text-mute">+{fmtIDRShort(m.admin_fee)}</span> : null}
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

        {/* Submit */}
        <PrimaryBtn size="lg" className="w-full" onClick={onSubmit} disabled={submitting}>
          <Icon name="heart" size={16}/> {submitting ? 'Memproses…' : 'Lanjut ke Pembayaran'}
        </PrimaryBtn>
        <div className="text-center text-[11px] text-mute">
          <Icon name="shield" size={12} className="inline mr-1 text-emerald-600"/> Pembayaran aman melalui QRIS, VA, dan e-wallet
        </div>
      </div>
    </div>
  );
}

// -------- Invoice confirmation (after createDonation) --------
function InvoiceConfirmation({ c, invoice, amount, paymentMethod, onReset }) {
  const [status, setStatus] = useState(invoice.status || 'Menunggu Pembayaran');
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState('');
  const qrRef = useRef();

  const total = invoice.amount ?? invoice.total ?? amount ?? 0;
  const subtotal = invoice.subtotal ?? total;
  const uniqueCode = total - subtotal;

  const pmObj = typeof paymentMethod === 'object' ? paymentMethod : null;
  const pmType = (pmObj?.type || pmObj?.category || (typeof paymentMethod === 'string' ? paymentMethod : '')).toLowerCase();
  const isQRIS = pmType.includes('qris') || !!invoice.qr_url;
  const isPaid = invoice.is_paid || /paid|berhasil|lunas|success/i.test(status);

  // VA / account number: gateway returns it in pay_code; manual transfer uses the
  // selected method's bank_number. Fall back to invoice.bank_number if backend adds it.
  const bankNumber = invoice.pay_code || invoice.bank_number || pmObj?.bank_number || '';
  const accountName = pmObj?.account_name || invoice.account_name || 'Yayasan Niat Baik';
  const bankName = pmObj?.bank_name || invoice.payment_method || (typeof paymentMethod === 'string' ? paymentMethod : 'Transfer Bank');

  // Generate QR client-side if no qr_url provided.
  useEffect(() => {
    if (!isQRIS || invoice.qr_url) return;
    if (window.QRCode && qrRef.current) {
      qrRef.current.innerHTML = '';
      const qrPayload = invoice.pay_code || `${bankName}|${invoice.invoice_number}|${total}`;
      try { new window.QRCode(qrRef.current, { text: qrPayload, width: 200, height: 200 }); } catch {}
    }
  }, [isQRIS, invoice.qr_url, invoice.pay_code, invoice.invoice_number]);

  // Poll status every 12s until paid.
  useEffect(() => {
    if (isPaid) return;
    const id = setInterval(async () => {
      try {
        const res = await window.api.paymentStatus(invoice.invoice_number);
        if (res?.data) {
          setStatus(res.data.status || status);
          if (res.data.is_paid) clearInterval(id);
        }
      } catch {}
    }, 12000);
    return () => clearInterval(id);
  }, [invoice.invoice_number, isPaid]);

  const checkNow = async () => {
    setChecking(true);
    try {
      const res = await window.api.paymentStatus(invoice.invoice_number);
      if (res?.data) setStatus(res.data.status || status);
    } catch {}
    setChecking(false);
  };

  const copy = (text, key) => {
    try { navigator.clipboard.writeText(String(text)); setCopied(key); setTimeout(() => setCopied(''), 1500); } catch {}
  };

  return (
    <div className="rounded-2xl bg-white border border-line shadow-card p-5 lg:p-6">
      <div className="text-center">
        <div className="font-extrabold text-2xl text-ink">Selesaikan Pembayaran</div>
        <div className="mt-1 text-sm text-mute">No. Invoice <span className="font-mono font-bold text-ink">{invoice.invoice_number}</span></div>
        <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          <span className={`h-2 w-2 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}/>
          {isPaid ? 'Pembayaran Diterima' : (status || 'Menunggu Pembayaran')}
        </div>
      </div>

      {/* Amount breakdown */}
      <div className="mt-5 rounded-xl bg-bg2 p-4 text-sm space-y-1.5">
        <div className="flex justify-between"><span className="text-mute">Subtotal donasi</span><b className="text-ink">{fmtIDR(subtotal)}</b></div>
        {uniqueCode > 0 && <div className="flex justify-between"><span className="text-mute">Kode unik</span><b className="text-ink">{fmtIDR(uniqueCode)}</b></div>}
        <div className="flex justify-between pt-1.5 border-t border-line"><span className="font-bold text-ink">Total transfer</span><b className="text-brand-600 text-lg">{fmtIDR(total)}</b></div>
      </div>

      {/* QRIS */}
      {isQRIS ? (
        <div className="mt-5 flex flex-col items-center">
          <div className="text-xs font-bold uppercase tracking-wider text-mute mb-3">Scan QRIS untuk membayar</div>
          {invoice.qr_url ? (
            <img src={invoice.qr_url} alt="QRIS" className="w-52 h-52 rounded-xl border border-line"/>
          ) : (
            <div ref={qrRef} className="p-3 rounded-xl border border-line bg-white"/>
          )}
          <div className="mt-2 text-xs text-mute">Gunakan aplikasi e-wallet / m-banking apa pun</div>
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
        </div>
      )}

      <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 leading-relaxed">
        Transfer tepat sesuai nominal termasuk kode unik agar otomatis terverifikasi.
      </div>

      <PrimaryBtn size="md" className="w-full mt-4" onClick={checkNow} disabled={checking}>
        <Icon name="check" size={16}/> {checking ? 'Memeriksa…' : 'Cek Status Pembayaran'}
      </PrimaryBtn>
      {(() => {
        const waNum = (window.PUBLIC_SETTINGS && window.PUBLIC_SETTINGS.whatsapp_admin) || '';
        if (!waNum) return null;
        const num = String(waNum).replace(/[^0-9]/g,'').replace(/^0/, '62');
        const msg = encodeURIComponent(`Halo admin, saya sudah donasi. Invoice: ${invoice.invoice_number}, nominal: ${fmtIDR(total)}. Mohon konfirmasi.`);
        return (
          <a href={`https://wa.me/${num}?text=${msg}`} target="_blank" rel="noopener noreferrer"
             className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600">
            <Icon name="wa" size={16}/> Konfirmasi via WhatsApp
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
  return (
    <div className="prose prose-slate prose-sm max-w-none">
      <p className="text-ink/85 leading-relaxed">
        Saudara/i pejuang kebaikan, di Desa Lengkong, NTT, anak-anak harus berjalan 4 km setiap
        pagi hanya untuk mendapatkan seember air keruh. Air yang sama digunakan untuk minum,
        masak, dan mencuci — menyebabkan diare berulang dan kasus stunting yang terus meningkat.
      </p>
      <p className="text-ink/85 leading-relaxed">
        Bersama NIATBAIK.ORG, kita berikhtiar membangun <b>sumur bor + filtrasi bersih</b> yang
        dapat melayani 380 keluarga. Dengan donasi <b>Rp 100.000</b>, satu keluarga bisa
        mengakses air bersih selama 1 tahun penuh.
      </p>

      <div className="not-prose grid grid-cols-3 gap-3 my-5">
        {[
          { s:'Pengeboran',  v:100 },
          { s:'Filtrasi',    v:65 },
          { s:'Distribusi',  v:12 },
        ].map((t, i) => (
          <div key={i} className="rounded-xl border border-line p-3">
            <div className="text-[10px] font-bold uppercase text-mute">Tahap {i+1}</div>
            <div className="font-bold text-ink text-sm">{t.s}</div>
            <Progress value={t.v} max={100} className="h-1.5 mt-2"/>
            <div className="text-[10px] text-mute mt-1">{t.v}% selesai</div>
          </div>
        ))}
      </div>

      <h4 className="font-bold text-ink">Rincian penggunaan dana</h4>
      <ul className="text-sm text-ink/85">
        <li>Pengeboran sumur 60m + casing — <b>Rp 80 jt</b></li>
        <li>Instalasi filter & pompa — <b>Rp 65 jt</b></li>
        <li>Tower + pipa distribusi 4 titik desa — <b>Rp 70 jt</b></li>
        <li>Pelatihan kader pemelihara — <b>Rp 15 jt</b></li>
        <li>Cadangan + monitoring 6 bulan — <b>Rp 20 jt</b></li>
      </ul>

      <p className="text-ink/85 leading-relaxed">
        Setiap donasi akan dilaporkan transparan setiap minggu di halaman ini dan kanal WhatsApp.
        <b> InsyaAllah</b> niat baik kita menjadi penolong di akhirat.
      </p>
    </div>
  );
}

function CampaignUpdates() {
  const items = [
    { d:'18 Mei 2026', t:'Tim sudah tiba di lokasi 🚛', body:'Survey geologi selesai, titik bor ditentukan. Pengeboran dimulai esok pagi.' },
    { d:'10 Mei 2026', t:'Donasi tembus 50% target 🎉', body:'Alhamdulillah, semua proses pengadaan dimulai. Kami targetkan groundbreaking akhir Mei.' },
    { d:'02 Mei 2026', t:'Kampanye resmi dibuka',     body:'Terima kasih atas dukungan awal 312 donatur pertama. Mari kita ajak lebih banyak teman!' },
    { d:'28 Apr 2026', t:'Verifikasi lapangan',        body:'Tim NIATBAIK.ORG menyelesaikan verifikasi lapangan & pemerintah desa.' },
  ];
  return (
    <div className="space-y-4">
      {items.map((u, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name="pin" size={16}/></div>
          <div>
            <div className="text-xs text-mute">{u.d}</div>
            <div className="font-bold text-ink">{u.t}</div>
            <div className="text-sm text-ink/85 mt-0.5 leading-relaxed">{u.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignDonors({ donors }) {
  return (
    <div className="space-y-2">
      {donors.map((d, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg2">
          <div className="h-9 w-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
            {(d.anon ? 'HA' : d.donor.split(' ').map(s=>s[0]).join('')).slice(0,2)}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-ink">{d.anon ? 'Hamba Allah' : d.donor}</div>
            <div className="text-xs text-mute italic line-clamp-1">"{d.message}"</div>
          </div>
          <div className="text-right">
            <div className="font-extrabold text-brand-600">{fmtIDR(d.amount)}</div>
            <div className="text-[10px] text-mute">{d.date.split(',')[0]}</div>
          </div>
        </div>
      ))}
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
  const list = window.CAMPAIGNS || getCampaigns();
  const c = list.find(x => x.slug === id || x.id === id) || list[1] || list[0];
  const [dark, toggleDark] = usePublicDark();
  return (
    <div className="min-h-screen flex flex-col bg-white">
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
      <main className="flex-1 pb-24 lg:pb-0">
        <CampaignPage c={c} onNav={(name) => { if (name === 'home') onBack(); }}/>
      </main>
      <SocialPopup/>
    </div>
  );
}
window.CampaignDetail = CampaignDetail;

// Public-facing landing + campaign + donation flow.
const { useState, useEffect, useRef, useMemo } = React;
const { fmtIDR, fmtIDRShort, fmtNum, campaignSeed, socialProofLines } = window.NB;

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

// -------- Navbar --------
function Navbar({ onNav }) {
  const [open, setOpen] = useState(false);
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
          <img src="assets/logo.png" alt="NIATBAIK.ORG" className="h-8"/>
        </button>
        <nav className="hidden lg:flex items-center gap-1 ml-6">
          {links.map((l) => (
            <a key={l.l} href={l.h} className="px-3 py-2 rounded-lg text-sm font-semibold text-ink/80 hover:bg-bg2 hover:text-ink">{l.l}</a>
          ))}
        </nav>
        <div className="flex-1"/>
        <a href="index.html" className="hidden lg:inline-flex items-center gap-1 text-sm font-semibold text-mute hover:text-ink">
          <Icon name="user" size={16}/> Masuk
        </a>
        <PrimaryBtn size="sm" onClick={() => onNav('campaign', campaignSeed[1])}>
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
            <a href="index.html" className="px-3 py-2.5 rounded-lg text-sm font-semibold text-mute">Masuk Dashboard</a>
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
            <span>2.412 donatur aktif hari ini</span>
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
            <PrimaryBtn size="lg" className="ctaPulse" onClick={() => onNav('campaign', campaignSeed[1])}>
              <Icon name="heart" size={18}/> Mulai Donasi
            </PrimaryBtn>
            <button onClick={() => document.getElementById('campaigns')?.scrollIntoView({behavior:'smooth'})} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-base font-bold text-ink hover:bg-white border border-line bg-white/60">
              <Icon name="eye" size={18}/> Lihat Campaign
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { v:'1,8 M+', l:'Donasi tersalurkan' },
              { v:'182 rb+', l:'Donatur bersama' },
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
        <HeroCard c={campaignSeed[1]} onNav={onNav}/>
      </div>
    </section>
  );
}

function HeroCard({ c, onNav }) {
  const [amount, setAmount] = useState(100_000);
  const presets = [50_000, 100_000, 250_000];
  return (
    <div className="relative">
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
          <div className="marquee">
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
    { icon:'users',     v:'182.412',    l:'Donatur bersama' },
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
  const campaigns = campaignSeed.filter(c => c.status === 'Running' || c.status === 'Published');
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

        <div className="mt-8 text-center">
          <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-ink bg-white border border-line hover:bg-bg2">
            Lihat semua campaign <Icon name="arrowR" size={16}/>
          </button>
        </div>
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
            <button onClick={() => onNav('campaign', campaignSeed[1])} className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-extrabold bg-white text-brand-600 hover:scale-[1.02] transition-transform shadow-pop">
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
          <div className="flex items-center gap-2"><img src="assets/logo.png" alt="" className="h-7 invert brightness-200"/></div>
          <p className="mt-3 text-sm text-white/70 max-w-sm leading-relaxed">Platform donasi & crowdfunding terpercaya. Salurkan zakat, sedekah, wakaf, dan donasi kemanusiaan dengan mudah.</p>
          <div className="mt-4 flex gap-2">
            {['Instagram','TikTok','Facebook','YouTube'].map((s) => (
              <a key={s} className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm font-bold">{s[0]}</a>
            ))}
          </div>
        </div>
        <div>
          <div className="font-bold mb-3">Platform</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><a className="hover:text-white">Donasi</a></li>
            <li><a className="hover:text-white">Buat Campaign</a></li>
            <li><a className="hover:text-white">Fundraiser</a></li>
            <li><a className="hover:text-white">Laporan transparansi</a></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-3">Tentang</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><a className="hover:text-white">Profil Yayasan</a></li>
            <li><a className="hover:text-white">Tim</a></li>
            <li><a className="hover:text-white">Karir</a></li>
            <li><a className="hover:text-white">Pers & media</a></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-3">Bantuan</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><a className="hover:text-white">FAQ</a></li>
            <li><a className="hover:text-white">Kontak</a></li>
            <li><a className="hover:text-white">Syarat & ketentuan</a></li>
            <li><a className="hover:text-white">Kebijakan privasi</a></li>
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
      setTimeout(() => { setIdx((i) => (i + 1) % socialProofLines.length); setVisible(true); }, 400);
    }, 8000);
    return () => { clearTimeout(t1); clearInterval(id); };
  }, []);
  const p = socialProofLines[idx];
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
function CampaignPage({ c, onNav }) {
  const [tab, setTab] = useState('story');
  const [amount, setAmount] = useState(100_000);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [anon, setAnon] = useState(false);
  const [donor, setDonor] = useState({ name:'', wa:'', email:'', message:'' });
  const [paid, setPaid] = useState(false);
  const presets = [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

  const recentDonors = window.NB.txns.slice(0, 8);
  const formRef = useRef();

  const tabs = [
    { v:'story', l:'Cerita' },
    { v:'updates', l:'Update (4)' },
    { v:'donors', l:'Donatur' },
    { v:'faq', l:'FAQ' },
  ];

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

          {/* Right donation card */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20">
              <div className="rounded-2xl bg-white border border-line shadow-card p-5" ref={formRef}>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-mute">Donasi terkumpul</div>
                  <div className="mt-1 text-3xl font-extrabold text-brand-600">{fmtIDR(c.raised)}</div>
                  <div className="text-sm text-mute">dari target <b>{fmtIDR(c.target)}</b></div>
                  <Progress value={c.raised} max={c.target} className="h-2.5 mt-3"/>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-bg2"><div className="text-mute">Donatur</div><div className="font-extrabold text-ink">{fmtNum(c.donors)}</div></div>
                    <div className="p-2 rounded-lg bg-bg2"><div className="text-mute">Sisa hari</div><div className="font-extrabold text-rose-600">{c.daysLeft}</div></div>
                    <div className="p-2 rounded-lg bg-bg2"><div className="text-mute">Tercapai</div><div className="font-extrabold text-emerald-600">{Math.round(c.raised/c.target*100)}%</div></div>
                  </div>
                </div>

                {!paid ? (
                  <div className="mt-5 pt-5 border-t border-line">
                    {/* Step indicator */}
                    <div className="flex items-center justify-between mb-4 text-[11px] font-bold">
                      {['Nominal','Identitas','Pembayaran'].map((s, i) => (
                        <div key={s} className="flex items-center gap-1.5">
                          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step > i ? 'bg-emerald-500 text-white' : step === i+1 ? 'bg-brand-600 text-white' : 'bg-bg2 text-mute'}`}>
                            {step > i ? <Icon name="check" size={10} strokeWidth={3}/> : i+1}
                          </span>
                          <span className={step === i+1 ? 'text-ink' : 'text-mute'}>{s}</span>
                        </div>
                      ))}
                    </div>

                    {step === 1 && (
                      <div className="float-in">
                        <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Pilih nominal donasi</div>
                        <div className="grid grid-cols-3 gap-2">
                          {presets.map((p) => (
                            <button key={p} onClick={() => setAmount(p)}
                              className={`py-2.5 rounded-xl text-sm font-extrabold border-2 transition-all ${amount===p ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink hover:border-brand-200'}`}>
                              {fmtIDRShort(p)}
                            </button>
                          ))}
                        </div>
                        <div className="mt-3">
                          <label className="text-xs font-bold text-mute">Atau masukkan nominal lain</label>
                          <div className="mt-1 flex items-center rounded-xl border-2 border-line bg-white focus-within:border-brand-600">
                            <span className="pl-3 text-mute font-bold">Rp</span>
                            <input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} className="flex-1 px-2 py-3 outline-none font-bold text-ink"/>
                          </div>
                        </div>
                        <PrimaryBtn size="lg" className="w-full mt-4" onClick={() => setStep(2)}>
                          Lanjut <Icon name="arrowR" size={18}/>
                        </PrimaryBtn>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="float-in space-y-3">
                        <div className="rounded-xl bg-brand-50 border border-brand-100 p-3 text-sm text-brand-700 font-semibold flex items-center justify-between">
                          <span>Nominal donasi</span><b>{fmtIDR(amount)}</b>
                        </div>
                        <input className="field" placeholder="Nama (cth: Hamba Allah)" value={donor.name} onChange={(e) => setDonor({...donor, name:e.target.value})} disabled={anon}/>
                        <input className="field" placeholder="No. WhatsApp · cth 08123…" value={donor.wa} onChange={(e) => setDonor({...donor, wa:e.target.value})}/>
                        <input className="field" placeholder="Email · untuk kuitansi" value={donor.email} onChange={(e) => setDonor({...donor, email:e.target.value})}/>
                        <label className="flex items-center gap-2 text-sm text-ink/80">
                          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="rounded border-line"/>
                          Donasi sebagai anonim (Hamba Allah)
                        </label>
                        <textarea className="field" rows="2" placeholder="Doa / pesan donatur (opsional)" value={donor.message} onChange={(e) => setDonor({...donor, message:e.target.value})}/>
                        <div className="flex gap-2">
                          <button onClick={() => setStep(1)} className="flex-1 px-4 py-3 rounded-xl text-sm font-bold border border-line bg-white hover:bg-bg2">Kembali</button>
                          <PrimaryBtn size="md" className="flex-1" onClick={() => setStep(3)}>Lanjut</PrimaryBtn>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="float-in space-y-3">
                        <div className="rounded-xl bg-brand-50 border border-brand-100 p-3 text-sm flex items-center justify-between">
                          <span className="font-semibold text-brand-700">Total donasi</span><b className="text-brand-700">{fmtIDR(amount)}</b>
                        </div>

                        <div className="text-xs font-bold uppercase tracking-wider text-mute mt-1">Metode pembayaran</div>
                        <div className="grid grid-cols-4 gap-2">
                          {['QRIS','BCA','Mandiri','BNI','GoPay','OVO','Dana','ShopeePay'].map((m) => (
                            <button key={m} onClick={() => setPaymentMethod(m)}
                              className={`h-12 rounded-lg border-2 flex items-center justify-center text-[10px] font-extrabold ${paymentMethod===m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink hover:border-brand-200'}`}>
                              {m}
                            </button>
                          ))}
                        </div>

                        <div className="rounded-xl bg-bg2 p-3 text-xs text-ink/80">
                          <div className="flex items-center gap-2 mb-1.5 text-emerald-700"><Icon name="shield" size={14}/><b>Pembayaran aman & terenkripsi</b></div>
                          Anda akan diarahkan ke gateway resmi {paymentMethod} untuk menyelesaikan pembayaran.
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => setStep(2)} className="flex-1 px-4 py-3 rounded-xl text-sm font-bold border border-line bg-white hover:bg-bg2">Kembali</button>
                          <PrimaryBtn size="md" className="flex-1" onClick={() => setPaid(true)}>
                            <Icon name="heart" size={16}/> Bayar {fmtIDR(amount)}
                          </PrimaryBtn>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-5 pt-5 border-t border-line text-center">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Icon name="check" size={32} strokeWidth={3}/></div>
                    <div className="mt-3 font-extrabold text-xl text-ink">Terima kasih atas niat baik Anda!</div>
                    <div className="mt-1 text-sm text-mute">Donasi Anda sebesar <b className="text-brand-600">{fmtIDR(amount)}</b> sedang diproses. Kuitansi akan dikirim via WhatsApp & email.</div>
                    <div className="mt-4 rounded-xl bg-bg2 p-3 text-xs text-mute text-left">
                      <div className="flex justify-between"><span>Kode donasi</span><span className="font-mono font-bold text-ink">INV-2026-{Math.floor(Math.random()*9000+1000)}</span></div>
                      <div className="flex justify-between mt-1"><span>Metode</span><b className="text-ink">{paymentMethod}</b></div>
                    </div>
                    <PrimaryBtn size="md" className="w-full mt-4" onClick={() => { setPaid(false); setStep(1); }}>Donasi lagi</PrimaryBtn>
                    <button className="mt-2 text-xs font-semibold text-mute hover:text-ink">Bagikan campaign ini →</button>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-line flex items-center justify-around text-[10px] font-bold text-mute">
                  <span className="inline-flex items-center gap-1"><Icon name="shield" size={12} className="text-emerald-600"/>SSL Aman</span>
                  <span className="inline-flex items-center gap-1"><Icon name="check"  size={12} className="text-emerald-600"/>Terverifikasi</span>
                  <span className="inline-flex items-center gap-1"><Icon name="star"   size={12} className="text-amber-500"/>4.9★ Trust</span>
                </div>
              </div>

              <div className="hidden lg:block mt-3 text-center text-xs text-mute">
                Butuh bantuan? <a className="font-bold text-brand-600 hover:underline">Hubungi CS via WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SocialPopup/>
      <StickyCTA label={`Donasi ${fmtIDRShort(amount)}`} onClick={() => formRef.current?.scrollIntoView({ behavior:'smooth' })}/>

      <Footer/>
    </>
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
          <CampaignPage c={page.data || campaignSeed[1]} onNav={onNav}/>
        )}
      </main>
      {page.name === 'home' && (
        <>
          <SocialPopup/>
          <StickyCTA onClick={() => onNav('campaign', campaignSeed[1])}/>
        </>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PublicApp/>);

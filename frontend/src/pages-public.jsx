// Public pages: Landing + Campaign detail + Donation form + Social proof
const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR } = React;

// ===================== CSS Animations (injected once) =====================
(function injectPublicCSS(){
  if (document.getElementById('nb-public-css')) return;
  const style = document.createElement('style');
  style.id = 'nb-public-css';
  style.textContent = `
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .marquee-track { display: flex; gap: 1rem; animation: marquee 30s linear infinite; width: max-content; }
    .marquee-track:hover { animation-play-state: paused; }
    @keyframes float-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .float-in { animation: float-in .35s ease-out both; }
    @keyframes ctaPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(46,65,145,.35); }
      50%     { box-shadow: 0 0 0 10px rgba(46,65,145,0); }
    }
    .ctaPulse { animation: ctaPulse 2.5s ease-in-out infinite; }
    html { scroll-behavior: smooth; }
  `;
  document.head.appendChild(style);
})();

// ===================== Public Navbar =====================
function PublicNav({ onAdmin, onDonate }){
  const [scrolled, setScrolled] = uS(false);
  const [mobileOpen, setMobileOpen] = uS(false);
  const { navigate, dark, setDark } = useApp();

  uE(()=>{
    const fn = ()=>setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn);
    return ()=>window.removeEventListener('scroll', fn);
  },[]);

  const links = [
    { l:'Campaign', h:'#campaigns' },
    { l:'Bagaimana?', h:'#how' },
    { l:'Testimoni', h:'#testi' },
    { l:'FAQ', h:'#faq' },
  ];

  return (
    <header className={`sticky top-0 z-30 transition ${scrolled?'bg-white dark:bg-slate-900/90 backdrop-blur border-b border-line dark:border-slate-800 shadow-sm':'bg-white dark:bg-slate-900/85 backdrop-blur border-b border-line dark:border-slate-800'}`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center gap-4">
        <Logo size={32}/>
        <nav className="hidden lg:flex items-center gap-1 ml-6">
          {links.map(x=>(
            <a key={x.l} href={x.h} className="px-3 py-2 text-sm font-semibold text-ink dark:text-slate-300 rounded-lg hover:bg-bg2 dark:hover:bg-slate-800 hover:text-ink dark:hover:text-slate-100">{x.l}</a>
          ))}
        </nav>
        <div className="flex-1"/>
        <button onClick={()=>setDark(!dark)} className="h-9 w-9 rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-bg2 dark:hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-ink dark:text-slate-200" title="Toggle dark mode">
          <Icon name={dark?'sun':'moon'} size={16}/>
        </button>
        <button onClick={onAdmin} className="hidden lg:inline-flex items-center gap-1 text-sm font-semibold text-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200">
          <Icon name="user" size={16}/> Masuk
        </button>
        <Button variant="primary" size="md" icon={<Icon name="heart" size={16}/>} onClick={()=>onDonate ? onDonate() : document.getElementById('campaigns')?.scrollIntoView({behavior:'smooth'})}>Donasi Sekarang</Button>
        <button onClick={()=>setMobileOpen(!mobileOpen)} className="lg:hidden h-9 w-9 rounded-lg hover:bg-bg2 dark:hover:bg-slate-800 flex items-center justify-center">
          <Icon name="menu" size={20}/>
        </button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden border-t border-line dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="px-4 py-3 flex flex-col gap-1">
            {links.map(x=>(
              <a key={x.l} href={x.h} className="px-3 py-2.5 rounded-lg text-sm font-semibold text-ink dark:text-slate-300 hover:bg-bg2 dark:hover:bg-slate-800" onClick={()=>setMobileOpen(false)}>{x.l}</a>
            ))}
            <button onClick={()=>{setMobileOpen(false); onAdmin&&onAdmin();}} className="px-3 py-2.5 rounded-lg text-sm font-semibold text-muted dark:text-slate-400 text-left">Masuk Dashboard</button>
          </div>
        </div>
      )}
    </header>
  );
}

// ===================== Hero Section =====================
function HeroSection({ onCampaign }){
  const featured = CAMPAIGNS.filter(c=>c.status==='Running').slice(0,1)[0] || CAMPAIGNS[0];
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-cyan2-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-cyan2-100 dark:bg-cyan2-900/30 opacity-60 blur-3xl"/>
      <div className="absolute top-40 -left-32 h-72 w-72 rounded-full bg-brand-100 dark:bg-brand-900/30 opacity-50 blur-3xl"/>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-20 grid lg:grid-cols-2 gap-10 items-center relative">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-line dark:border-slate-700 shadow-card text-xs font-bold text-ink dark:text-slate-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/>
            <span>2.412 donatur aktif hari ini</span>
            <span className="text-muted dark:text-slate-400 font-normal hidden sm:inline">· Update real-time</span>
          </div>

          <h1 className="mt-5 text-4xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-ink dark:text-slate-100">
            Salurkan <span className="bg-gradient-to-r from-brand-600 to-cyan2-500 bg-clip-text text-transparent">niat baik</span> Anda, wujudkan kebaikan nyata.
          </h1>
          <p className="mt-5 text-lg text-muted dark:text-slate-400 max-w-xl leading-relaxed">
            Donasi terverifikasi untuk kemanusiaan, kesehatan, pendidikan, dan wakaf.
            Transparan, mudah, dan dipercaya <b className="text-ink dark:text-slate-100">182.000+ donatur</b> Indonesia.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="xl" className="ctaPulse" icon={<Icon name="heart" size={18}/>} onClick={()=>onCampaign&&onCampaign(featured)}>Mulai Donasi</Button>
            <button onClick={()=>document.getElementById('campaigns')?.scrollIntoView({behavior:'smooth'})} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-base font-bold text-ink dark:text-slate-100 hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900 border border-line dark:border-slate-700 bg-white dark:bg-slate-900/60">
              <Icon name="eye" size={18}/> Lihat Campaign
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { v:'1,8 M+', l:'Donasi tersalurkan' },
              { v:'182 rb+', l:'Donatur bersama' },
              { v:'4,9 ★',  l:'Trust rating' },
            ].map((s,i)=>(
              <div key={i} className="bg-white dark:bg-slate-900/80 backdrop-blur border border-line dark:border-slate-700 rounded-xl p-3">
                <div className="text-xl lg:text-2xl font-extrabold text-brand-600 leading-none">{s.v}</div>
                <div className="text-[11px] text-muted dark:text-slate-400 mt-1.5 leading-tight">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5"><Icon name="shield" size={14} className="text-emerald-600"/> SSL Aman</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14} className="text-emerald-600"/> Berizin Kemensos</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14} className="text-emerald-600"/> Audit publik bulanan</span>
          </div>
        </div>

        {/* Hero campaign card */}
        <HeroCard c={featured} onCampaign={onCampaign}/>
      </div>
    </section>
  );
}

function HeroCard({ c, onCampaign }){
  const [amount, setAmount] = uS(100_000);
  const presets = [50_000, 100_000, 250_000];
  const pct = Math.min(100, Math.round((c.raised/c.target)*100));
  return (
    <div className="relative">
      {c.daysLeft <= 10 && (
        <div className="absolute -top-3 -left-3 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-pop rotate-[-6deg] z-10">URGENT · {c.daysLeft} hari lagi</div>
      )}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-line dark:border-slate-700 shadow-pop overflow-hidden">
        <div className="relative aspect-[16/10]" style={{background: c.thumb || 'linear-gradient(135deg, #2E4191, #38B6FF)'}}>
          <div className="absolute inset-0 flex items-center justify-center text-white/85"><Icon name={c.icon || 'heart'} size={120} strokeWidth={1}/></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent"/>
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900/95 text-[11px] font-bold text-ink dark:text-slate-100">{c.category}</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-[11px] font-bold text-white inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-slate-900 animate-pulse"/>LIVE</span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <div className="text-xs font-semibold uppercase opacity-90">Featured Campaign</div>
            <div className="font-extrabold text-xl lg:text-2xl leading-tight mt-1">{c.title}</div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-extrabold text-brand-600 tnum">{fmtIDR(c.raised)}</div>
              <div className="text-xs text-muted dark:text-slate-400">terkumpul dari {fmtIDR(c.target)}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-ink dark:text-slate-100 tnum">{pct}%</div>
              <div className="text-xs text-muted dark:text-slate-400">tercapai</div>
            </div>
          </div>
          <ProgressBar value={c.raised} max={c.target} size="lg" />
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-bg2 dark:bg-slate-950"><div className="text-muted dark:text-slate-400">Donatur</div><div className="font-extrabold text-ink dark:text-slate-100 tnum">{fmtNum(c.donors)}</div></div>
            <div className="p-2 rounded-lg bg-bg2 dark:bg-slate-950"><div className="text-muted dark:text-slate-400">Sisa hari</div><div className="font-extrabold text-rose-600 tnum">{c.daysLeft}</div></div>
            <div className="p-2 rounded-lg bg-bg2 dark:bg-slate-950"><div className="text-muted dark:text-slate-400">Sisa</div><div className="font-extrabold text-ink dark:text-slate-100 tnum">{fmtShort(c.target - c.raised)}</div></div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400 mb-2">Pilih nominal donasi</div>
            <div className="grid grid-cols-3 gap-2">
              {presets.map(p=>(
                <button key={p} onClick={()=>setAmount(p)}
                  className={`py-2.5 rounded-xl text-sm font-extrabold border-2 transition-all ${amount===p?'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300':'border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-ink dark:text-slate-100 hover:border-brand-200'}`}>
                  {fmtShort(p)}
                </button>
              ))}
            </div>
            <Button variant="primary" size="lg" full className="mt-3" icon={<Icon name="heart" size={18}/>} onClick={()=>onCampaign&&onCampaign(c)}>
              Donasi {fmtIDR(amount)}
            </Button>
            <div className="mt-2 text-center text-[11px] text-muted dark:text-slate-400">
              <Icon name="shield" size={12} className="inline mr-1 text-emerald-600"/> Pembayaran aman melalui QRIS, VA, dan e-wallet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== Trust Strip (marquee) =====================
function TrustStrip(){
  const items = ['Kementerian Sosial RI', 'Baznas', 'PWNU', 'Muhammadiyah', 'Detik.com', 'CNN Indonesia', 'Tempo', 'Liputan6', 'Kompas', 'OJK'];
  return (
    <section className="py-8 border-y border-line dark:border-slate-700 bg-bg2 dark:bg-slate-950/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center text-xs font-semibold uppercase tracking-widest text-muted dark:text-slate-400 mb-4">Diliput & dipercaya oleh</div>
        <div className="relative overflow-hidden">
          <div className="marquee-track">
            {[...items, ...items].map((s,i)=>(
              <div key={i} className="shrink-0 px-6 py-3 rounded-lg bg-white dark:bg-slate-900 border border-line dark:border-slate-700 text-ink dark:text-slate-100/70 font-bold text-sm">{s}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ===================== Stats Section =====================
function StatsSection(){
  const [publicStats, setPublicStats] = uS(null);
  uE(()=>{ api.publicStats().then(r=>r?.data && setPublicStats(r.data)).catch(()=>{}); },[]);
  const stats = [
    { icon:'wallet',    v: publicStats?.total_distributed || 'Rp 1,84 M+', l:'Donasi tersalurkan' },
    { icon:'users',     v: publicStats?.active_donors || '182.412',         l:'Donatur bersama' },
    { icon:'megaphone', v: publicStats?.successful_campaigns || '412',      l:'Campaign aktif' },
    { icon:'pin',       v: publicStats?.cities_reached || '34 Provinsi',    l:'Jangkauan program' },
  ];
  return (
    <section className="py-12 lg:py-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s,i)=>(
            <div key={i} className="rounded-2xl bg-gradient-to-br from-brand-600 to-cyan2-500 p-5 text-white">
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900/15 flex items-center justify-center mb-3"><Icon name={s.icon} size={20}/></div>
              <div className="text-2xl lg:text-3xl font-extrabold">{s.v}</div>
              <div className="text-sm text-white/85 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===================== Campaigns Section =====================
function CampaignsSection({ onCampaign }){
  const filterTabs = [{v:'all',l:'Semua'},{v:'Medis',l:'Medis'},{v:'Pendidikan',l:'Pendidikan'},{v:'Wakaf',l:'Wakaf'},{v:'Bencana',l:'Bencana'},{v:'Ramadan',l:'Ramadan'}];
  const [tab, setTab] = uS('all');
  const [apiCampaigns, setApiCampaigns] = uS(null);

  uE(()=>{
    api.campaigns().then(r=>{
      if (r?.data && Array.isArray(r.data)) setApiCampaigns(r.data.map(mapCampaign));
    }).catch(()=>{});
  },[]);

  const campaigns = uM(()=>{
    const src = apiCampaigns || CAMPAIGNS;
    const running = src.filter(c=> c.status==='Running' || c.status==='Published');
    return tab==='all' ? running : running.filter(c=>c.category===tab);
  },[tab, apiCampaigns]);

  return (
    <section id="campaigns" className="py-14 lg:py-20 bg-bg2 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Campaign aktif</div>
            <h2 className="mt-2 text-3xl lg:text-4xl font-extrabold text-ink dark:text-slate-100 tracking-tight">Mari bersama wujudkan kebaikan</h2>
            <p className="mt-2 text-muted dark:text-slate-400">Pilih salah satu campaign terverifikasi di bawah ini.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
            {filterTabs.map(t=>(
              <button key={t.v} onClick={()=>setTab(t.v)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${tab===t.v?'bg-ink text-white':'bg-white dark:bg-slate-900 text-ink dark:text-slate-100 border border-line dark:border-slate-700 hover:bg-brand-50 dark:bg-brand-900/30'}`}>
                {t.l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map(c=><PublicCampaignCard key={c.id} c={c} onClick={()=>onCampaign&&onCampaign(c)}/>)}
        </div>

        <div className="mt-8 text-center">
          <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-ink dark:text-slate-100 bg-white dark:bg-slate-900 border border-line dark:border-slate-700 hover:bg-bg2 dark:hover:bg-slate-800">
            Lihat semua campaign <Icon name="arrowR" size={16}/>
          </button>
        </div>
      </div>
    </section>
  );
}

function PublicCampaignCard({ c, onClick }){
  const pct = Math.min(100, Math.round((c.raised/c.target)*100));
  return (
    <div onClick={onClick} className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-line dark:border-slate-700 shadow-card hover:shadow-pop transition-all hover:-translate-y-1 overflow-hidden">
      {c.img ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <img src={c.img} alt="" className="absolute inset-0 w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"/>
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900/95 text-[11px] font-bold text-ink dark:text-slate-100">{c.category}</span>
            {c.daysLeft <= 10 && c.daysLeft > 0 && <span className="px-2 py-0.5 rounded-md bg-rose-500 text-[11px] font-bold text-white">URGENT</span>}
          </div>
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur text-[11px] font-bold text-white inline-flex items-center gap-1">
            <Icon name="calendar" size={11}/> {c.daysLeft || c.days} hari
          </div>
        </div>
      ) : (
        <div className="relative aspect-[16/10] overflow-hidden" style={{background: c.thumb || 'linear-gradient(135deg,#2E4191,#38B6FF)'}}>
          <div className="absolute inset-0 flex items-center justify-center text-white/85"><Icon name={c.icon || 'heart'} size={70} strokeWidth={1.2}/></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"/>
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900/95 text-[11px] font-bold text-ink dark:text-slate-100">{c.category}</span>
            {c.daysLeft <= 10 && c.daysLeft > 0 && <span className="px-2 py-0.5 rounded-md bg-rose-500 text-[11px] font-bold text-white">URGENT</span>}
          </div>
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur text-[11px] font-bold text-white inline-flex items-center gap-1">
            <Icon name="calendar" size={11}/> {c.daysLeft || c.days} hari
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="font-bold text-ink dark:text-slate-100 line-clamp-2 min-h-[2.8rem] leading-snug group-hover:text-brand-600 transition-colors">{c.title}</div>
        <div className="mt-3"><ProgressBar value={c.raised} max={c.target} size="sm"/></div>
        <div className="mt-2 flex items-baseline justify-between text-xs">
          <span><span className="text-muted dark:text-slate-400">Terkumpul</span> <b className="text-brand-600 text-sm tnum">{fmtShort(c.raised)}</b></span>
          <span className="text-muted dark:text-slate-400 tnum">{fmtNum(c.donors)} donatur</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-muted dark:text-slate-400">Target {fmtShort(c.target)}</div>
          <span className="text-sm font-bold text-brand-600 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Donasi <Icon name="arrowR" size={14}/></span>
        </div>
      </div>
    </div>
  );
}

// ===================== How-to Section =====================
function HowToSection(){
  const steps = [
    { n:1, t:'Pilih campaign', d:'Pilih campaign sesuai niat baik Anda dari daftar terverifikasi.', icon:'megaphone' },
    { n:2, t:'Tentukan nominal', d:'Isi nominal donasi. Mulai dari Rp 10.000.', icon:'wallet' },
    { n:3, t:'Pilih pembayaran', d:'Bayar via QRIS, VA Bank, atau e-wallet favorit Anda.', icon:'creditcard' },
    { n:4, t:'Doakan & sebar', d:'Donasi tersalurkan. Ajak teman ikut dalam kebaikan.', icon:'heart' },
  ];
  return (
    <section id="how" className="py-14 lg:py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Cara berdonasi</div>
          <h2 className="mt-2 text-3xl lg:text-4xl font-extrabold text-ink dark:text-slate-100 tracking-tight">Mudah · Hanya 60 detik</h2>
          <p className="mt-2 text-muted dark:text-slate-400">Donasi via NIATBAIK.ORG bisa dilakukan kapan saja, tanpa perlu daftar akun.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s,i)=>(
            <div key={i} className="relative">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-line dark:border-slate-700 p-6 hover:border-brand-200 hover:shadow-card transition-all h-full">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-600 to-cyan2-500 text-white flex items-center justify-center"><Icon name={s.icon} size={22}/></div>
                <div className="mt-4 text-xs font-bold text-muted dark:text-slate-400">LANGKAH {s.n}</div>
                <div className="font-extrabold text-ink dark:text-slate-100 text-lg mt-0.5">{s.t}</div>
                <div className="mt-1.5 text-sm text-muted dark:text-slate-400 leading-relaxed">{s.d}</div>
              </div>
              {i < 3 && <div className="hidden lg:block absolute top-12 -right-3 text-muted dark:text-slate-400"><Icon name="arrowR" size={20}/></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===================== Testimonials Section =====================
function TestimonialsSection(){
  const items = [
    { n:'Ibu Sari, Bekasi',   t:'Alhamdulillah, donasi saya untuk Aira dilaporkan transparan. Bahkan saya dikirim foto setelah operasinya. Sangat amanah.', tone:'#2E4191' },
    { n:'Pak Burhan, Bandung', t:'Sudah 3 tahun rutin sedekah lewat NIATBAIK. Donasi via QRIS, cepat dan langsung dapat kuitansi via WhatsApp.', tone:'#38B6FF' },
    { n:'Hamba Allah',         t:'Donasi anonim juga dilayani. Yang penting niatnya baik, sampai ke yang membutuhkan. Terima kasih NIATBAIK.', tone:'#16A34A' },
    { n:'Andini, Surabaya',    t:'Saya jadi fundraiser di NIATBAIK. Mudah dipakai, dan komisi bisa saya donasikan lagi. Berkah!', tone:'#F59E0B' },
  ];
  return (
    <section id="testi" className="py-14 lg:py-20 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white relative overflow-hidden">
      <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-cyan2-400/30 blur-3xl"/>
      <div className="absolute -bottom-24 -left-32 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl"/>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-cyan2-100">Apa kata donatur</div>
            <h2 className="mt-2 text-3xl lg:text-4xl font-extrabold tracking-tight">Bergabung bersama 182.000+ donatur Indonesia</h2>
            <p className="mt-3 text-white/85">Cerita nyata dari donatur yang mempercayakan niat baiknya melalui NIATBAIK.ORG.</p>
            <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
              <div><div className="text-2xl font-extrabold">4.9 ★</div><div className="text-xs text-white/75">Trust rating</div></div>
              <div><div className="text-2xl font-extrabold">98%</div><div className="text-xs text-white/75">Donatur puas</div></div>
              <div><div className="text-2xl font-extrabold">412</div><div className="text-xs text-white/75">Mitra fundraiser</div></div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((t,i)=>(
              <div key={i} className="rounded-2xl bg-white dark:bg-slate-900/10 backdrop-blur border border-white/15 p-5">
                <div className="text-amber-300 text-sm flex gap-0.5">
                  {[1,2,3,4,5].map(j=><Icon key={j} name="star" size={14}/>)}
                </div>
                <p className="mt-3 text-sm text-white/90 leading-relaxed">"{t.t}"</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{background:t.tone}}>{t.n[0]}</div>
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

// ===================== FAQ Section =====================
function FAQSection(){
  const items = [
    { q:'Apakah donasi saya terverifikasi dan aman?', a:'Setiap campaign di NIATBAIK.ORG melalui proses verifikasi tim kami: kunjungan lapangan, dokumen pengaju, hingga update rutin. Donatur juga menerima laporan transparan tiap minggu.' },
    { q:'Bagaimana saya tahu donasi sudah diterima?', a:'Setelah pembayaran sukses, Anda akan menerima notifikasi & kuitansi otomatis via WhatsApp dan email. Riwayat donasi juga tampil di halaman campaign.' },
    { q:'Apa metode pembayaran yang didukung?', a:'QRIS, Virtual Account BCA/Mandiri/BNI/BRI, GoPay, OVO, Dana, ShopeePay, hingga kartu kredit. Tinggal pilih yang paling nyaman.' },
    { q:'Apakah saya bisa donasi sebagai Hamba Allah?', a:'Tentu. Centang "Donasi sebagai anonim" pada form, dan nama Anda akan tampil sebagai Hamba Allah di halaman publik.' },
    { q:'Apakah donasi saya bisa dijadikan zakat?', a:'Ya. Campaign tertentu dapat menjadi penyaluran zakat. Anda akan mendapatkan bukti penyaluran zakat untuk pengurang pajak.' },
    { q:'Apakah ada minimum donasi?', a:'Minimum donasi Rp 10.000. Tidak ada batas maksimum.' },
  ];
  const [open, setOpen] = uS(0);
  return (
    <section id="faq" className="py-14 lg:py-20 bg-white dark:bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 lg:px-6">
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-600">Pertanyaan umum</div>
          <h2 className="mt-2 text-3xl lg:text-4xl font-extrabold text-ink dark:text-slate-100 tracking-tight">Hal-hal yang sering ditanyakan</h2>
        </div>
        <div className="mt-8 space-y-3">
          {items.map((f,i)=>(
            <div key={i} className={`rounded-2xl border ${open===i?'border-brand-200 bg-brand-50 dark:bg-brand-900/40 shadow-card':'border-line dark:border-slate-700 bg-white dark:bg-slate-900'} transition-all`}>
              <button onClick={()=>setOpen(open===i?-1:i)} className="w-full px-5 py-4 flex items-center justify-between text-left">
                <span className="font-bold text-ink dark:text-slate-100">{f.q}</span>
                <Icon name="chevronD" size={18} className={`text-muted dark:text-slate-400 transition-transform ${open===i?'rotate-180 text-brand-600':''}`}/>
              </button>
              {open===i && <div className="px-5 pb-4 text-sm text-ink dark:text-slate-300 leading-relaxed">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Reusable FAQ list (for campaign detail)
function FAQList({ items }){
  const [open, setOpen] = uS(0);
  return (
    <div className="space-y-2">
      {items.map((f,i)=>(
        <div key={i} className={`rounded-xl border ${open===i?'border-brand-200 bg-brand-50 dark:bg-brand-900/40':'border-line dark:border-slate-700 bg-white dark:bg-slate-900'} transition-all`}>
          <button onClick={()=>setOpen(open===i?-1:i)} className="w-full p-3 flex items-center justify-between text-left">
            <span className="font-bold text-ink dark:text-slate-100 text-sm">{f.q}</span>
            <Icon name="chevronD" size={16} className={`text-muted dark:text-slate-400 transition-transform ${open===i?'rotate-180':''}`}/>
          </button>
          {open===i && <div className="px-3 pb-3 text-sm text-ink dark:text-slate-300">{f.a}</div>}
        </div>
      ))}
    </div>
  );
}

// ===================== Final CTA =====================
function FinalCTA({ onCampaign }){
  return (
    <section className="py-14 lg:py-20 bg-bg2 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 lg:px-6">
        <div className="relative rounded-3xl bg-gradient-to-br from-brand-600 to-cyan2-500 p-8 lg:p-12 text-white overflow-hidden">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white dark:bg-slate-900/10 blur-3xl"/>
          <div className="absolute right-32 -bottom-12 w-48 h-48 rounded-full bg-white dark:bg-slate-900/10"/>
          <div className="relative grid lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2">
              <h3 className="text-3xl lg:text-4xl font-extrabold leading-tight">Setiap niat baik, sekecil apapun, berdampak besar.</h3>
              <p className="mt-3 text-white/85">Mulai donasi sekarang dan jadilah bagian dari kebaikan yang nyata.</p>
            </div>
            <button onClick={()=>onCampaign&&onCampaign(CAMPAIGNS.find(c=>c.status==='Running')||CAMPAIGNS[0])} className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-extrabold bg-white dark:bg-slate-900 text-brand-600 hover:scale-[1.02] transition-transform shadow-pop">
              <Icon name="heart" size={20}/> Donasi Sekarang
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===================== Footer =====================
function PublicFooter(){
  return (
    <footer className="bg-ink text-white pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 grid grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <img src="assets/logo-niatbaik.png" alt="NIATBAIK.ORG" className="h-7 invert brightness-200"/>
          </div>
          <p className="mt-3 text-sm text-white/70 max-w-sm leading-relaxed">Platform donasi & crowdfunding terpercaya. Salurkan zakat, sedekah, wakaf, dan donasi kemanusiaan dengan mudah.</p>
          <div className="mt-4 flex gap-2">
            {['Instagram','TikTok','Facebook','YouTube'].map(s=>(
              <a key={s} className="h-9 w-9 rounded-lg bg-white dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-sm font-bold cursor-pointer">{s[0]}</a>
            ))}
          </div>
        </div>
        <div>
          <div className="font-bold mb-3">Platform</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><a className="hover:text-white cursor-pointer">Donasi</a></li>
            <li><a className="hover:text-white cursor-pointer">Buat Campaign</a></li>
            <li><a className="hover:text-white cursor-pointer">Fundraiser</a></li>
            <li><a className="hover:text-white cursor-pointer">Laporan transparansi</a></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-3">Tentang</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><a className="hover:text-white cursor-pointer">Profil Yayasan</a></li>
            <li><a className="hover:text-white cursor-pointer">Tim</a></li>
            <li><a className="hover:text-white cursor-pointer">Karir</a></li>
            <li><a className="hover:text-white cursor-pointer">Pers & media</a></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-3">Bantuan</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><a className="hover:text-white cursor-pointer">FAQ</a></li>
            <li><a className="hover:text-white cursor-pointer">Kontak</a></li>
            <li><a className="hover:text-white cursor-pointer">Syarat & ketentuan</a></li>
            <li><a className="hover:text-white cursor-pointer">Kebijakan privasi</a></li>
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

// ===================== Social Proof Popup =====================
function SocialPopup(){
  const [idx, setIdx] = uS(0);
  const [visible, setVisible] = uS(false);
  const proofItems = window.socialProofLines || [
    { name:'Ahmad F.', amount:250_000, campaign:'Sumur Bersih NTT', when:'2 menit lalu' },
    { name:'Hamba Allah', amount:1_000_000, campaign:'Bantuan Operasi Aira', when:'5 menit lalu' },
    { name:'Siti N.', amount:50_000, campaign:'Buka Puasa 5000 Yatim', when:'8 menit lalu' },
    { name:'Rina M.', amount:500_000, campaign:'Renovasi Madrasah', when:'12 menit lalu' },
    { name:'Budi S.', amount:100_000, campaign:'Beasiswa 1000 Anak', when:'15 menit lalu' },
    { name:'Hamba Allah', amount:2_000_000, campaign:'Sumur Bersih NTT', when:'18 menit lalu' },
  ];

  uE(()=>{
    const t1 = setTimeout(()=>setVisible(true), 4000);
    const id = setInterval(()=>{
      setVisible(false);
      setTimeout(()=>{ setIdx(i=>(i+1)%proofItems.length); setVisible(true); }, 400);
    }, 8000);
    return ()=>{ clearTimeout(t1); clearInterval(id); };
  },[]);

  const p = proofItems[idx];
  if (!p) return null;

  return (
    <div className={`hidden lg:flex fixed left-4 bottom-4 z-30 transition-all duration-300 ${visible?'opacity-100 translate-y-0':'opacity-0 translate-y-3 pointer-events-none'}`}>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-pop border border-line dark:border-slate-700 p-3 flex items-center gap-3 max-w-xs float-in">
        <div className="h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center"><Icon name="heart" size={18}/></div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-ink dark:text-slate-100"><b>{p.name}</b> baru saja berdonasi</div>
          <div className="text-sm font-bold text-brand-600 tnum">{fmtIDR(p.amount)}</div>
          <div className="text-[10px] text-muted dark:text-slate-400 truncate">untuk "{p.campaign}" · {p.when}</div>
        </div>
        <button onClick={()=>setVisible(false)} className="self-start text-muted dark:text-slate-400 hover:text-ink dark:text-slate-100"><Icon name="close" size={12}/></button>
      </div>
    </div>
  );
}

// ===================== Sticky Mobile CTA =====================
function StickyCTA({ onClick, label }){
  const [show, setShow] = uS(false);
  uE(()=>{
    const fn = ()=>setShow(window.scrollY > 400);
    window.addEventListener('scroll', fn);
    return ()=>window.removeEventListener('scroll', fn);
  },[]);

  if (!show) return null;
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-line dark:border-slate-700 p-3 shadow-pop">
      <Button variant="primary" size="lg" full icon={<Icon name="heart" size={18}/>} onClick={onClick}>
        {label || 'Donasi Sekarang'}
      </Button>
    </div>
  );
}

// ===================== Landing Page (main) =====================
function LandingPage(){
  const { navigate, openCampaign } = useApp();

  const handleCampaign = (c)=>{
    if (c?.id) openCampaign(c.id);
    else if (c?.slug) openCampaign(c.slug);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-ink dark:text-slate-100">
      <PublicNav onAdmin={()=>navigate('dashboard')} onDonate={()=>document.getElementById('campaigns')?.scrollIntoView({behavior:'smooth'})}/>

      <main className="flex-1 pb-24 lg:pb-0">
        <HeroSection onCampaign={handleCampaign}/>
        <TrustStrip/>
        <StatsSection/>
        <CampaignsSection onCampaign={handleCampaign}/>
        <HowToSection/>
        <TestimonialsSection/>
        <FAQSection/>
        <FinalCTA onCampaign={handleCampaign}/>
        <PublicFooter/>
      </main>

      <SocialPopup/>
      <StickyCTA onClick={()=>handleCampaign(CAMPAIGNS.find(c=>c.status==='Running')||CAMPAIGNS[0])}/>
    </div>
  );
}

// ===================== Campaign Detail Page =====================
function CampaignDetail({ id, onBack }){
  const [campaignData, setCampaignData] = uS(null);
  const [loading, setLoading] = uS(true);
  const { navigate } = useApp();

  // Try API first, fall back to seed data
  uE(()=>{
    setLoading(true);
    const slug = id;
    api.campaign(slug).then(r=>{
      if (r?.data) setCampaignData(mapCampaign(r.data));
      else setCampaignData(CAMPAIGNS.find(x=>x.id===id || x.slug===id) || CAMPAIGNS[0]);
    }).catch(()=>{
      setCampaignData(CAMPAIGNS.find(x=>x.id===id || x.slug===id) || CAMPAIGNS[0]);
    }).finally(()=>setLoading(false));
  },[id]);

  const c = campaignData || CAMPAIGNS.find(x=>x.id===id) || CAMPAIGNS[0];
  const pct = Math.min(100, Math.round((c.raised/c.target)*100));
  const days = c.daysLeft || c.days || 0;

  const [tab, setTab] = uS('story');
  const [step, setStep] = uS(1);
  const [amount, setAmount] = uS(100_000);
  const [payMethod, setPayMethod] = uS('QRIS');
  const [anon, setAnon] = uS(false);
  const [donor, setDonor] = uS({ name:'', wa:'', email:'', message:'' });
  const [paid, setPaid] = uS(false);
  const [submitting, setSubmitting] = uS(false);
  const [error, setError] = uS('');
  const [invoice, setInvoice] = uS('');
  const formRef = uR();
  const presets = NOMINAL_PRESETS;

  const tabs = [
    { v:'story', l:'Cerita' },
    { v:'updates', l:'Update (4)' },
    { v:'donors', l:'Donatur' },
    { v:'faq', l:'FAQ' },
  ];

  const recentDonors = (window.TRANSACTIONS || []).slice(0, 8);

  const handleSubmitDonation = async ()=>{
    if (step === 1) {
      if (amount < 10000) { setError('Minimum donasi Rp 10.000'); return; }
      setError(''); setStep(2); return;
    }
    if (step === 2) {
      if (!anon && !donor.name.trim()) { setError('Nama wajib diisi'); return; }
      if (!donor.wa.trim()) { setError('No. WhatsApp wajib diisi'); return; }
      setError(''); setStep(3); return;
    }
    // Step 3: submit
    setSubmitting(true); setError('');
    try {
      const res = await api.createDonation({
        campaign_slug: c.slug || c.id,
        donor_name: anon ? 'Hamba Allah' : donor.name,
        donor_phone: donor.wa,
        donor_email: donor.email,
        amount: amount,
        message: donor.message,
        is_anonymous: anon,
        payment_method: payMethod,
      });
      if (res?.data) {
        setInvoice(res.data.invoice_number || 'INV-2026-' + Math.floor(Math.random()*9000+1000));
        setPaid(true);
      } else {
        setError(res?.message || 'Gagal memproses donasi');
      }
    } catch(e) {
      setError('Error: ' + (e.message || 'Gagal memproses donasi'));
    }
    setSubmitting(false);
  };

  const resetForm = ()=>{
    setStep(1); setAmount(100_000); setPayMethod('QRIS'); setAnon(false);
    setDonor({name:'',wa:'',email:'',message:''}); setPaid(false);
    setSubmitting(false); setError(''); setInvoice('');
  };

  return (
    <div className="min-h-screen bg-bg2 dark:bg-slate-950">
      <PublicNav onAdmin={()=>navigate('dashboard')} onDonate={()=>document.getElementById('campaigns')?.scrollIntoView({behavior:'smooth'})}/>

      {/* Back link */}
      <section className="bg-bg2 dark:bg-slate-950 border-b border-line dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted dark:text-slate-400 hover:text-ink dark:text-slate-100">
            <Icon name="chevronL" size={16}/> Kembali ke beranda
          </button>
        </div>
      </section>

      <section className="bg-bg2 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-10 grid lg:grid-cols-5 gap-6">
          {/* LEFT main content */}
          <div className="lg:col-span-3">
            {/* Campaign banner */}
            {c.img ? (
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
                <img src={c.img} alt="" className="absolute inset-0 w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent"/>
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900/95 text-[11px] font-bold text-ink dark:text-slate-100">{c.category}</span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-[11px] font-bold text-white inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-slate-900 animate-pulse"/>LIVE</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-semibold uppercase opacity-90">Yayasan Niat Baik · Terverifikasi</div>
                  <h1 className="mt-1 text-2xl lg:text-4xl font-extrabold leading-tight">{c.title}</h1>
                </div>
              </div>
            ) : (
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden" style={{background: c.thumb || 'linear-gradient(135deg,#2E4191,#38B6FF)'}}>
                <div className="absolute inset-0 flex items-center justify-center text-white/85"><Icon name={c.icon||'heart'} size={140} strokeWidth={1}/></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent"/>
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900/95 text-[11px] font-bold text-ink dark:text-slate-100">{c.category}</span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-[11px] font-bold text-white inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-slate-900 animate-pulse"/>LIVE</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-semibold uppercase opacity-90">Yayasan Niat Baik · Terverifikasi</div>
                  <h1 className="mt-1 text-2xl lg:text-4xl font-extrabold leading-tight">{c.title}</h1>
                </div>
              </div>
            )}

            {/* Organization + tabs content */}
            <div className="mt-5 rounded-2xl bg-white dark:bg-slate-900 border border-line dark:border-slate-700 p-5 lg:p-6">
              <div className="flex items-center gap-3 border-b border-line dark:border-slate-700 pb-4">
                <div className="h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center font-bold text-sm">YN</div>
                <div>
                  <div className="text-sm font-bold text-ink dark:text-slate-100 flex items-center gap-1.5">Yayasan Niat Baik <Icon name="check" size={14} className="text-emerald-600"/></div>
                  <div className="text-xs text-muted dark:text-slate-400">Pengelola campaign · Terverifikasi Kemensos</div>
                </div>
                <div className="ml-auto inline-flex items-center gap-2 text-xs text-muted dark:text-slate-400 hidden sm:flex">
                  <span className="inline-flex items-center gap-1"><Icon name="calendar" size={12}/> Dibuka 2 Mei 2026</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 border-b border-line dark:border-slate-700">
                {tabs.map(t=>(
                  <button key={t.v} onClick={()=>setTab(t.v)}
                    className={`relative pb-2.5 text-sm font-bold ${tab===t.v?'text-brand-600':'text-muted dark:text-slate-400 hover:text-ink dark:text-slate-100'}`}>
                    {t.l}
                    {tab===t.v && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-600 rounded-full"/>}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                {tab==='story' && <CampaignStoryTab c={c}/>}
                {tab==='updates' && <CampaignUpdatesTab/>}
                {tab==='donors' && <CampaignDonorsTab donors={recentDonors}/>}
                {tab==='faq' && <CampaignFAQTab/>}
              </div>
            </div>
          </div>

          {/* RIGHT donation card */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-line dark:border-slate-700 shadow-card p-5" ref={formRef}>
                {/* Progress stats */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400">Donasi terkumpul</div>
                  <div className="mt-1 text-3xl font-extrabold text-brand-600 tnum">{fmtIDR(c.raised)}</div>
                  <div className="text-sm text-muted dark:text-slate-400">dari target <b className="tnum">{fmtIDR(c.target)}</b></div>
                  <ProgressBar value={c.raised} max={c.target} size="lg"/>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-bg2 dark:bg-slate-950"><div className="text-muted dark:text-slate-400">Donatur</div><div className="font-extrabold text-ink dark:text-slate-100 tnum">{fmtNum(c.donors)}</div></div>
                    <div className="p-2 rounded-lg bg-bg2 dark:bg-slate-950"><div className="text-muted dark:text-slate-400">Sisa hari</div><div className="font-extrabold text-rose-600 tnum">{days}</div></div>
                    <div className="p-2 rounded-lg bg-bg2 dark:bg-slate-950"><div className="text-muted dark:text-slate-400">Tercapai</div><div className="font-extrabold text-emerald-600 tnum">{pct}%</div></div>
                  </div>
                </div>

                {/* Donation form */}
                {!paid ? (
                  <div className="mt-5 pt-5 border-t border-line dark:border-slate-700">
                    {/* Step indicator */}
                    <div className="flex items-center justify-between mb-4 text-[11px] font-bold">
                      {['Nominal','Identitas','Pembayaran'].map((s,i)=>(
                        <div key={s} className="flex items-center gap-1.5">
                          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step>i+1?'bg-emerald-500 text-white':step===i+1?'bg-brand-600 text-white':'bg-bg2 dark:bg-slate-950 text-muted dark:text-slate-400'}`}>
                            {step>i+1 ? <Icon name="check" size={10} strokeWidth={3}/> : i+1}
                          </span>
                          <span className={step===i+1?'text-ink dark:text-slate-100':'text-muted dark:text-slate-400'}>{s}</span>
                        </div>
                      ))}
                    </div>

                    {/* Step 1: Nominal */}
                    {step===1 && (
                      <div className="float-in">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400 mb-2">Pilih nominal donasi</div>
                        <div className="grid grid-cols-3 gap-2">
                          {presets.map(p=>(
                            <button key={p} onClick={()=>setAmount(p)}
                              className={`py-2.5 rounded-xl text-sm font-extrabold border-2 transition-all ${amount===p?'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300':'border-line dark:border-slate-700 text-ink dark:text-slate-100 hover:border-brand-200'}`}>
                              {fmtShort(p)}
                            </button>
                          ))}
                        </div>
                        <div className="mt-3">
                          <label className="text-xs font-bold text-muted dark:text-slate-400">Atau masukkan nominal lain</label>
                          <div className="mt-1 flex items-center rounded-xl border-2 border-line dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-brand-600">
                            <span className="pl-3 text-muted dark:text-slate-400 font-bold">Rp</span>
                            <input type="number" value={amount} onChange={e=>setAmount(+e.target.value||0)} className="flex-1 px-2 py-3 outline-none font-bold text-ink dark:text-slate-100 bg-transparent"/>
                          </div>
                        </div>
                        {error && <div className="mt-2 text-sm text-rose-600 font-medium">{error}</div>}
                        <Button variant="primary" size="lg" full className="mt-4" iconRight={<Icon name="arrowR" size={18}/>} onClick={handleSubmitDonation}>Lanjut</Button>
                      </div>
                    )}

                    {/* Step 2: Donor identity */}
                    {step===2 && (
                      <div className="float-in space-y-3">
                        <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 border border-brand-100 p-3 text-sm text-brand-700 dark:text-brand-300 font-semibold flex items-center justify-between">
                          <span>Nominal donasi</span><b className="tnum">{fmtIDR(amount)}</b>
                        </div>
                        <input className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-line dark:border-slate-700 text-ink dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400" placeholder="Nama (cth: Hamba Allah)" value={donor.name} onChange={e=>setDonor({...donor, name:e.target.value})} disabled={anon}/>
                        <input className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-line dark:border-slate-700 text-ink dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400" placeholder="No. WhatsApp · cth 08123..." value={donor.wa} onChange={e=>setDonor({...donor, wa:e.target.value})}/>
                        <input className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-line dark:border-slate-700 text-ink dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400" placeholder="Email · untuk kuitansi" value={donor.email} onChange={e=>setDonor({...donor, email:e.target.value})}/>
                        <label className="flex items-center gap-2 text-sm text-ink dark:text-slate-300">
                          <input type="checkbox" checked={anon} onChange={e=>setAnon(e.target.checked)} className="w-4 h-4 rounded border-line dark:border-slate-700 text-brand-600 focus:ring-brand-300"/>
                          Donasi sebagai anonim (Hamba Allah)
                        </label>
                        <textarea className="w-full px-3.5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-line dark:border-slate-700 text-ink dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 text-sm" rows="2" placeholder="Doa / pesan donatur (opsional)" value={donor.message} onChange={e=>setDonor({...donor, message:e.target.value})}/>
                        {error && <div className="text-sm text-rose-600 font-medium">{error}</div>}
                        <div className="flex gap-2">
                          <button onClick={()=>{setError(''); setStep(1);}} className="flex-1 px-4 py-3 rounded-xl text-sm font-bold border border-line dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-bg2 dark:hover:bg-slate-800">Kembali</button>
                          <Button variant="primary" size="md" full onClick={handleSubmitDonation} iconRight={<Icon name="arrowR" size={16}/>}>Lanjut</Button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Payment method */}
                    {step===3 && (
                      <div className="float-in space-y-3">
                        <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 border border-brand-100 p-3 text-sm flex items-center justify-between">
                          <span className="font-semibold text-brand-700 dark:text-brand-300">Total donasi</span><b className="text-brand-700 dark:text-brand-300 tnum">{fmtIDR(amount)}</b>
                        </div>

                        <div className="text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400 mt-1">Metode pembayaran</div>
                        <div className="grid grid-cols-4 gap-2">
                          {['QRIS','BCA','Mandiri','BNI','GoPay','OVO','Dana','ShopeePay'].map(m=>(
                            <button key={m} onClick={()=>setPayMethod(m)}
                              className={`h-12 rounded-lg border-2 flex items-center justify-center text-[10px] font-extrabold transition-all ${payMethod===m?'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300':'border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-ink dark:text-slate-100 hover:border-brand-200'}`}>
                              {m}
                            </button>
                          ))}
                        </div>

                        <div className="rounded-xl bg-bg2 dark:bg-slate-950 p-3 text-xs text-ink dark:text-slate-300">
                          <div className="flex items-center gap-2 mb-1.5 text-emerald-700 dark:text-emerald-300"><Icon name="shield" size={14}/><b>Pembayaran aman & terenkripsi</b></div>
                          Anda akan diarahkan ke gateway resmi {payMethod} untuk menyelesaikan pembayaran.
                        </div>

                        {error && <div className="text-sm text-rose-600 font-medium">{error}</div>}
                        <div className="flex gap-2">
                          <button onClick={()=>{setError(''); setStep(2);}} className="flex-1 px-4 py-3 rounded-xl text-sm font-bold border border-line dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-bg2 dark:hover:bg-slate-800">Kembali</button>
                          <Button variant="primary" size="lg" full disabled={submitting} icon={<Icon name="heart" size={16}/>} onClick={handleSubmitDonation}>
                            {submitting ? 'Memproses...' : 'Bayar ' + fmtShort(amount)}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Success screen */
                  <div className="mt-5 pt-5 border-t border-line dark:border-slate-700 text-center">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center"><Icon name="check" size={32} strokeWidth={3}/></div>
                    <div className="mt-3 font-extrabold text-xl text-ink dark:text-slate-100">Terima kasih atas niat baik Anda!</div>
                    <div className="mt-1 text-sm text-muted dark:text-slate-400">Donasi Anda sebesar <b className="text-brand-600 tnum">{fmtIDR(amount)}</b> sedang diproses. Kuitansi akan dikirim via WhatsApp & email.</div>
                    <div className="mt-4 rounded-xl bg-bg2 dark:bg-slate-950 p-3 text-xs text-muted dark:text-slate-400 text-left">
                      <div className="flex justify-between"><span>Kode donasi</span><span className="font-mono font-bold text-ink dark:text-slate-100">{invoice}</span></div>
                      <div className="flex justify-between mt-1"><span>Metode</span><b className="text-ink dark:text-slate-100">{payMethod}</b></div>
                    </div>
                    <Button variant="primary" size="lg" full className="mt-4" onClick={resetForm}>Donasi lagi</Button>
                    <button className="mt-2 text-xs font-semibold text-muted dark:text-slate-400 hover:text-ink dark:text-slate-100">Bagikan campaign ini →</button>
                  </div>
                )}

                {/* Trust footer */}
                <div className="mt-4 pt-4 border-t border-line dark:border-slate-700 flex items-center justify-around text-[10px] font-bold text-muted dark:text-slate-400">
                  <span className="inline-flex items-center gap-1"><Icon name="shield" size={12} className="text-emerald-600"/>SSL Aman</span>
                  <span className="inline-flex items-center gap-1"><Icon name="check" size={12} className="text-emerald-600"/>Terverifikasi</span>
                  <span className="inline-flex items-center gap-1"><Icon name="star" size={12} className="text-amber-500"/>4.9 ★ Trust</span>
                </div>
              </div>

              <div className="hidden lg:block mt-3 text-center text-xs text-muted dark:text-slate-400">
                Butuh bantuan? <a className="font-bold text-brand-600 hover:underline cursor-pointer">Hubungi CS via WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <StickyCTA label={'Donasi ' + fmtShort(amount)} onClick={()=>formRef.current?.scrollIntoView({behavior:'smooth'})}/>
      <SocialPopup/>
      <PublicFooter/>
    </div>
  );
}

// ===================== Campaign Tab Components =====================
function CampaignStoryTab({ c }){
  return (
    <div className="prose prose-slate prose-sm max-w-none">
      <p className="text-ink dark:text-slate-100/85 leading-relaxed">
        {c.description || `Saudara/i pejuang kebaikan, di Desa Lengkong, NTT, anak-anak harus berjalan 4 km setiap
        pagi hanya untuk mendapatkan seember air keruh. Air yang sama digunakan untuk minum,
        masak, dan mencuci — menyebabkan diare berulang dan kasus stunting yang terus meningkat.`}
      </p>
      <p className="text-ink dark:text-slate-100/85 leading-relaxed">
        Bersama NIATBAIK.ORG, kita berikhtiar membangun infrastruktur yang
        dapat melayani ratusan keluarga. Dengan donasi <b>Rp 100.000</b>, satu keluarga bisa
        terbantu selama 1 tahun penuh.
      </p>

      <div className="not-prose grid grid-cols-3 gap-3 my-5">
        {[
          { s:'Pengeboran',  v:100 },
          { s:'Filtrasi',    v:65 },
          { s:'Distribusi',  v:12 },
        ].map((t,i)=>(
          <div key={i} className="rounded-xl border border-line dark:border-slate-700 p-3">
            <div className="text-[10px] font-bold uppercase text-muted dark:text-slate-400">Tahap {i+1}</div>
            <div className="font-bold text-ink dark:text-slate-100 text-sm">{t.s}</div>
            <ProgressBar value={t.v} max={100} size="sm"/>
            <div className="text-[10px] text-muted dark:text-slate-400 mt-1">{t.v}% selesai</div>
          </div>
        ))}
      </div>

      <h4 className="font-bold text-ink dark:text-slate-100">Rincian penggunaan dana</h4>
      <ul className="text-sm text-ink dark:text-slate-100/85">
        <li>Pengeboran sumur 60m + casing — <b>Rp 80 jt</b></li>
        <li>Instalasi filter & pompa — <b>Rp 65 jt</b></li>
        <li>Tower + pipa distribusi 4 titik desa — <b>Rp 70 jt</b></li>
        <li>Pelatihan kader pemelihara — <b>Rp 15 jt</b></li>
        <li>Cadangan + monitoring 6 bulan — <b>Rp 20 jt</b></li>
      </ul>

      <p className="text-ink dark:text-slate-100/85 leading-relaxed">
        Setiap donasi akan dilaporkan transparan setiap minggu di halaman ini dan kanal WhatsApp.
        <b> InsyaAllah</b> niat baik kita menjadi penolong di akhirat.
      </p>
    </div>
  );
}

function CampaignUpdatesTab(){
  const items = [
    { d:'18 Mei 2026', t:'Tim sudah tiba di lokasi', body:'Survey geologi selesai, titik bor ditentukan. Pengeboran dimulai esok pagi.' },
    { d:'10 Mei 2026', t:'Donasi tembus 50% target', body:'Alhamdulillah, semua proses pengadaan dimulai. Kami targetkan groundbreaking akhir Mei.' },
    { d:'02 Mei 2026', t:'Kampanye resmi dibuka', body:'Terima kasih atas dukungan awal 312 donatur pertama. Mari kita ajak lebih banyak teman!' },
    { d:'28 Apr 2026', t:'Verifikasi lapangan', body:'Tim NIATBAIK.ORG menyelesaikan verifikasi lapangan & pemerintah desa.' },
  ];
  return (
    <div className="space-y-4">
      {items.map((u,i)=>(
        <div key={i} className="flex gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center shrink-0"><Icon name="pin" size={16}/></div>
          <div>
            <div className="text-xs text-muted dark:text-slate-400">{u.d}</div>
            <div className="font-bold text-ink dark:text-slate-100">{u.t}</div>
            <div className="text-sm text-ink dark:text-slate-100/85 mt-0.5 leading-relaxed">{u.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignDonorsTab({ donors }){
  const list = donors && donors.length > 0 ? donors : DONORS.slice(0,8).map((name,i)=>({
    donor: name, anon: name === 'Hamba Allah', amount: NOMINAL_PRESETS[i%6],
    message: 'Semoga bermanfaat.', date: (i+2) + ' menit lalu',
  }));
  return (
    <div className="space-y-2">
      {list.map((d,i)=>(
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg2 dark:hover:bg-slate-800">
          <div className="h-9 w-9 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center font-bold text-xs">
            {(d.anon ? 'HA' : (d.donor||d.name||'?').split(' ').map(s=>s[0]).join('')).slice(0,2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-ink dark:text-slate-100">{d.anon ? 'Hamba Allah' : (d.donor||d.name)}</div>
            <div className="text-xs text-muted dark:text-slate-400 italic line-clamp-1">"{d.message || 'Semoga bermanfaat'}"</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-extrabold text-brand-600 tnum">{fmtIDR(d.amount)}</div>
            <div className="text-[10px] text-muted dark:text-slate-400">{typeof d.date === 'string' ? d.date.split(',')[0] : ''}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignFAQTab(){
  return (
    <FAQList items={[
      { q:'Bagaimana donasi disalurkan?', a:'Donasi langsung disalurkan ke mitra lokal di lapangan. Laporan transparan setiap minggu.' },
      { q:'Apakah saya mendapat bukti donasi?', a:'Ya, kuitansi resmi otomatis dikirim via email & WhatsApp.' },
      { q:'Apa yang terjadi bila donasi melebihi target?', a:'Kelebihan akan dialokasikan untuk program serupa yang masih membutuhkan, sesuai persetujuan donatur.' },
    ]}/>
  );
}

// ===================== Donation Modal (for inline use from landing) =====================
function DonationModal({ open, onClose, campaign }){
  const [step, setStep] = uS(1);
  const [amount, setAmount] = uS(100000);
  const [custom, setCustom] = uS(false);
  const [method, setMethod] = uS('QRIS');
  const [anon, setAnon] = uS(false);
  const [success, setSuccess] = uS(false);
  const [name, setName] = uS('');
  const [phone, setPhone] = uS('');
  const [email, setEmail] = uS('');
  const [prayer, setPrayer] = uS('');
  const [loading, setLoading] = uS(false);
  const [error, setError] = uS('');
  const [invoice, setInvoice] = uS('');

  const reset = ()=>{
    setStep(1); setAmount(100000); setCustom(false); setMethod('QRIS'); setAnon(false);
    setSuccess(false); setName(''); setPhone(''); setEmail(''); setPrayer('');
    setLoading(false); setError(''); setInvoice('');
  };

  return (
    <Modal open={open} onClose={()=>{onClose(); setTimeout(reset,300);}} maxW="max-w-xl">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 border-b border-line dark:border-slate-700">
        <div className="text-xs text-muted dark:text-slate-400">Donasi untuk</div>
        <div className="mt-0.5 font-bold text-ink dark:text-slate-100 line-clamp-1">{campaign?.title}</div>
        <div className="mt-4 flex items-center gap-1.5">
          {[1,2,3].map(s=>(
            <div key={s} className={`h-1.5 rounded-full transition flex-1 ${s<=step?'bg-brand-600':'bg-slate-200'}`}/>
          ))}
        </div>
        <div className="mt-2 text-xs text-muted dark:text-slate-400">Langkah {step} dari 3 · {step===1?'Pilih nominal':step===2?'Identitas donatur':'Pilih pembayaran'}</div>
      </div>

      <div className="p-6">
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Icon name="check" size={32}/></div>
            <div className="mt-4 text-xl font-bold text-ink dark:text-slate-100">Terima kasih atas niat baikmu!</div>
            <p className="text-muted dark:text-slate-400 mt-1 text-sm">Donasi <span className="font-semibold text-ink dark:text-slate-100 tnum">{fmtIDR(amount)}</span> via <span className="font-semibold">{method}</span> sedang diproses. Bukti transaksi telah dikirim ke email & WhatsApp.</p>
            <div className="mt-5 bg-bg2 dark:bg-slate-950 rounded-2xl p-4 text-left">
              <div className="text-xs text-muted dark:text-slate-400">Kode Invoice</div>
              <div className="font-mono font-bold text-brand-700 dark:text-brand-300">{invoice || 'INV-...'}</div>
            </div>
            <Button variant="primary" size="lg" full className="mt-5" onClick={()=>{onClose(); setTimeout(reset,300);}}>Selesai</Button>
          </div>
        ) : step===1 ? (
          <div>
            <Field label="Pilih nominal donasi">
              <div className="grid grid-cols-3 gap-2.5">
                {NOMINAL_PRESETS.map(n=>(
                  <button key={n} onClick={()=>{setAmount(n); setCustom(false);}} className={`h-14 rounded-xl border-2 font-bold tnum transition ${!custom&&amount===n?'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300':'border-line dark:border-slate-700 text-ink dark:text-slate-100 hover:border-brand-300'}`}>{fmtShort(n)}</button>
                ))}
              </div>
            </Field>
            <div className="mt-4">
              <Field label="Nominal lain">
                <Input type="number" value={custom?amount:''} onChange={e=>{setAmount(+e.target.value||0); setCustom(true);}} placeholder="Masukkan nominal donasi..." icon={<span className="text-sm font-semibold">Rp</span>}/>
              </Field>
            </div>
            <div className="mt-5 bg-bg2 dark:bg-slate-950 rounded-2xl p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted dark:text-slate-400">Donasi</span><span className="font-bold text-ink dark:text-slate-100 tnum">{fmtIDR(amount)}</span></div>
              <div className="flex justify-between mt-1.5"><span className="text-muted dark:text-slate-400">Biaya admin</span><span className="text-emerald-600 font-semibold">Gratis</span></div>
              <div className="border-t border-line dark:border-slate-700 mt-3 pt-3 flex justify-between"><span className="font-semibold">Total</span><span className="font-extrabold text-brand-700 dark:text-brand-300 tnum">{fmtIDR(amount)}</span></div>
            </div>
            {error && <div className="mt-2 text-sm text-rose-600 font-medium">{error}</div>}
            <Button variant="primary" size="lg" full className="mt-5" onClick={()=>{
              if (amount < 10000) { setError('Minimum donasi Rp10.000'); return; }
              setError(''); setStep(2);
            }} iconRight={<Icon name="arrowR" size={16}/>}>Lanjut</Button>
          </div>
        ) : step===2 ? (
          <div className="space-y-4">
            <Field label="Nama lengkap" required>
              <Input placeholder="Nama Anda" value={name} onChange={e=>setName(e.target.value)}/>
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="No. WhatsApp" required>
                <Input placeholder="08xx" icon={<Icon name="wa" size={16}/>} value={phone} onChange={e=>setPhone(e.target.value)}/>
              </Field>
              <Field label="Email">
                <Input placeholder="email@contoh.com" icon={<Icon name="mail" size={16}/>} value={email} onChange={e=>setEmail(e.target.value)}/>
              </Field>
            </div>
            <Field label="Doa / pesan untuk penerima manfaat (opsional)">
              <textarea rows="3" className="w-full px-3.5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-line dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 text-sm" placeholder="Semoga bermanfaat dan barokah..." value={prayer} onChange={e=>setPrayer(e.target.value)}/>
            </Field>
            <label className="flex items-center gap-2 select-none">
              <input type="checkbox" checked={anon} onChange={e=>setAnon(e.target.checked)} className="w-4 h-4 rounded border-line dark:border-slate-700 text-brand-600 focus:ring-brand-300"/>
              <span className="text-sm text-ink dark:text-slate-100">Tampilkan sebagai "Hamba Allah" (anonim)</span>
            </label>
            {error && <div className="text-sm text-rose-600 font-medium">{error}</div>}
            <div className="flex gap-2">
              <Button variant="secondary" size="lg" onClick={()=>setStep(1)}>Kembali</Button>
              <Button variant="primary" size="lg" full onClick={()=>{
                if (!name.trim() && !anon) { setError('Nama wajib diisi'); return; }
                if (!phone.trim()) { setError('No. WhatsApp wajib diisi'); return; }
                setError(''); setStep(3);
              }} iconRight={<Icon name="arrowR" size={16}/>}>Lanjut</Button>
            </div>
          </div>
        ) : (
          <div>
            <Field label="Metode pembayaran">
              <div className="space-y-2">
                {[
                  { k:'QRIS', d:'Bayar pakai aplikasi mobile banking / e-wallet', tag:'Tercepat', emoji:'QR' },
                  { k:'BCA VA', d:'Transfer ke Virtual Account BCA', emoji:'BCA' },
                  { k:'BNI VA', d:'Transfer ke Virtual Account BNI', emoji:'BNI' },
                  { k:'GoPay', d:'Bayar pakai saldo GoPay', emoji:'GP' },
                  { k:'OVO', d:'Bayar pakai saldo OVO', emoji:'OVO' },
                  { k:'DANA', d:'Bayar pakai saldo DANA', emoji:'DA' },
                ].map(m=>(
                  <button key={m.k} onClick={()=>setMethod(m.k)} className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border-2 transition ${method===m.k?'border-brand-600 bg-brand-50 dark:bg-brand-900/30':'border-line dark:border-slate-700 hover:border-brand-300'}`}>
                    <div className="w-12 h-9 rounded-lg bg-white dark:bg-slate-900 border border-line dark:border-slate-700 flex items-center justify-center text-[11px] font-bold text-brand-700 dark:text-brand-300">{m.emoji}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-ink dark:text-slate-100 flex items-center gap-2">{m.k} {m.tag && <Badge tone="cyan" size="sm">{m.tag}</Badge>}</div>
                      <div className="text-xs text-muted dark:text-slate-400">{m.d}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method===m.k?'border-brand-600 bg-brand-600':'border-line dark:border-slate-700'}`}>
                      {method===m.k && <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-900"/>}
                    </div>
                  </button>
                ))}
              </div>
            </Field>
            <div className="mt-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-2.5 rounded-xl text-sm">
              <Icon name="shield" size={16}/>
              Transaksi aman dengan enkripsi SSL 256-bit
            </div>
            {error && <div className="mt-2 text-sm text-rose-600 font-medium">{error}</div>}
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" size="lg" onClick={()=>setStep(2)}>Kembali</Button>
              <Button variant="primary" size="lg" full disabled={loading} onClick={async ()=>{
                setLoading(true); setError('');
                try {
                  const res = await api.createDonation({
                    campaign_slug: campaign?.slug || campaign?.id,
                    donor_name: anon ? 'Hamba Allah' : name,
                    donor_phone: phone,
                    donor_email: email,
                    amount: amount,
                    message: prayer,
                    is_anonymous: anon,
                    payment_method: method,
                  });
                  if (res?.data) {
                    setInvoice(res.data.invoice_number || '');
                    setSuccess(true);
                  } else {
                    setError(res?.message || 'Gagal memproses donasi');
                  }
                } catch(e) { setError('Error: ' + (e.message || 'Gagal memproses donasi')); }
                setLoading(false);
              }} icon={<Icon name="heart" size={16}/>}>{loading ? 'Memproses...' : 'Bayar ' + fmtShort(amount)}</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ===================== Window exports =====================
Object.assign(window, { PublicNav, LandingPage, CampaignDetail, DonationModal, FAQList, SocialPopup, StickyCTA, PublicFooter });

// Public pages: Landing + Campaign detail + Donation form
const { useState: uS_pub, useEffect: uE_pub, useMemo: uM_pub } = React;

// Public navbar
function PublicNav({ onAdmin }){
  const [scrolled, setScrolled] = uS_pub(false);
  uE_pub(()=>{
    const fn = ()=>setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn);
    return ()=>window.removeEventListener('scroll', fn);
  },[]);
  return (
    <header className={`sticky top-0 z-30 transition ${scrolled?'bg-white/95 backdrop-blur border-b border-line shadow-sm':'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center gap-4">
        <Logo size={32}/>
        <nav className="hidden lg:flex items-center gap-1 ml-6">
          {['Beasiswa','Sekolah','Yatim','Tahfidz','Cerita Donatur','Tentang'].map(x=>(
            <a key={x} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-700 rounded-lg hover:bg-slate-50">{x}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button className="hidden sm:inline-flex h-10 px-4 items-center text-sm font-medium text-slate-600 hover:text-brand-700">Galang Dana</button>
          <button onClick={onAdmin} className="hidden sm:inline-flex h-10 px-4 items-center text-sm font-medium text-slate-600 hover:text-brand-700">Masuk Admin</button>
          <Button variant="primary" size="md" icon={<Icons.Heart w={16} h={16}/>}>Donasi Sekarang</Button>
        </div>
      </div>
    </header>
  );
}

// Landing page — conversion-optimized
function LandingPage(){
  const { navigate, openCampaign, setRole } = useApp();
  const featured = CAMPAIGNS.slice(0,6);
  const stats = [
    { v:'Rp48,7 M', l:'Total tersalurkan' },
    { v:'120.430', l:'Donatur aktif' },
    { v:'247', l:'Campaign sukses' },
    { v:'58', l:'Kota terdampak' },
  ];

  return (
    <div className="min-h-screen bg-white text-ink">
      <PublicNav onAdmin={()=>{ setRole('Admin'); navigate('dashboard'); }}/>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-cyan2-500"></div>
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3), transparent 40%)'}}></div>
        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-3 py-1 text-xs font-medium ring-1 ring-white/20">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Live · 1.482 donatur berdonasi hari ini
            </div>
            <h1 className="mt-5 text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Niat baikmu, <br/>
              <span className="text-cyan2-200">masa depan mereka.</span>
            </h1>
            <p className="mt-5 text-lg text-white/85 max-w-xl">
              Wujudkan pendidikan untuk anak-anak prasejahtera lewat program beasiswa, paket sekolah, dan pembangunan ruang belajar di pelosok Indonesia.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="cyan" size="xl" icon={<Icons.Heart w={18} h={18}/>}>Mulai Donasi</Button>
              <button className="inline-flex items-center gap-2 h-14 px-5 rounded-xl bg-white/10 backdrop-blur text-white font-medium hover:bg-white/20 ring-1 ring-white/20">
                Lihat campaign
                <Icons.ArrowRight w={18} h={18}/>
              </button>
            </div>
            <div className="mt-8 grid grid-cols-4 gap-4 max-w-xl">
              {stats.map((s,i)=>(
                <div key={i}>
                  <div className="text-2xl lg:text-3xl font-extrabold tnum">{s.v}</div>
                  <div className="text-xs text-white/75 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* hero card preview */}
          <div className="relative">
            <div className="absolute -inset-6 bg-cyan2-300/30 rounded-[2.5rem] blur-2xl"></div>
            <Card padded={false} className="relative overflow-hidden">
              <div className="aspect-[16/10] relative">
                <img src={featured[0].img} alt="" className="absolute inset-0 w-full h-full object-cover"/>
                <div className="absolute top-3 left-3 flex gap-2"><Badge tone="cyan">Beasiswa</Badge><Badge tone="red" dot>4 hari lagi</Badge></div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-ink leading-snug">{featured[2].title}</h3>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-brand-700 tnum">{fmtShort(featured[2].raised)}</span>
                    <span className="text-sm text-muted">dari {fmtShort(featured[2].target)}</span>
                  </div>
                  <div className="mt-2"><ProgressBar value={featured[2].raised} max={featured[2].target}/></div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex -space-x-2">
                      {[1,2,3,4].map(i=><Avatar key={i} name={DONORS[i].name} size={28}/>)}
                      <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold flex items-center justify-center border-2 border-white">+5K</div>
                    </div>
                    <span className="text-muted tnum">{fmtNum(featured[2].donors)} donatur</span>
                  </div>
                  <Button variant="primary" size="lg" full className="mt-4" icon={<Icons.Heart w={18} h={18}/>} onClick={()=>openCampaign(featured[2].id)}>Donasi Sekarang</Button>
                </div>
              </div>
            </Card>
            {/* Floating donation chip */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-pop p-3 pr-5 flex items-center gap-3 ring-1 ring-line">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Icons.Check w={18} h={18}/></div>
              <div className="text-sm">
                <div className="font-bold tnum text-ink">Rp1.000.000</div>
                <div className="text-xs text-muted">baru saja · Hamba Allah</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 -mt-6 relative z-10">
        <TrustBadges/>
      </section>

      {/* Featured campaigns */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">Campaign Pilihan</div>
            <h2 className="text-2xl lg:text-3xl font-bold mt-1">Mari jadi bagian dari perubahan</h2>
          </div>
          <button className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-brand-700">Lihat semua <Icons.ArrowRight w={16} h={16}/></button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map(c=><CampaignCard key={c.id} c={c} onOpen={()=>openCampaign(c.id)}/>)}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-bg2 py-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">Cara Berdonasi</div>
            <h2 className="text-2xl lg:text-3xl font-bold mt-1">3 langkah saja, donasi tersalurkan</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n:'01', t:'Pilih program', s:'Pilih campaign pendidikan yang menggerakkan hatimu.', i:<Icons.Heart w={22} h={22}/>, c:'brand'},
              { n:'02', t:'Donasi mudah', s:'Bayar via QRIS, transfer, e-wallet, atau virtual account.', i:<Icons.Wallet w={22} h={22}/>, c:'cyan'},
              { n:'03', t:'Laporan transparan', s:'Pantau distribusi donasi & kabar penerima manfaat.', i:<Icons.Shield w={22} h={22}/>, c:'green'},
            ].map((s,i)=>(
              <Card key={i} className="relative overflow-hidden">
                <div className="absolute top-3 right-4 text-6xl font-extrabold text-slate-100 tnum">{s.n}</div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.c==='brand'?'bg-brand-100 text-brand-700':s.c==='cyan'?'bg-cyan2-100 text-cyan2-700':'bg-emerald-100 text-emerald-700'}`}>{s.i}</div>
                <div className="mt-4 font-bold text-lg">{s.t}</div>
                <div className="text-muted text-sm mt-1">{s.s}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">Cerita Donatur</div>
          <h2 className="text-2xl lg:text-3xl font-bold mt-1">Mereka yang sudah berdonasi</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n:'Bu Hasanah', r:'Donatur sejak 2021', q:'Pertama kali donasi via NIATBAIK.ORG dan rasanya tenang karena ada laporan distribusi yang jelas. Sekarang rutin tiap bulan.', s:5 },
            { n:'Pak Wahyu', r:'Donatur', q:'Saya kira berdonasi itu ribet. Ternyata via QRIS langsung sampai. Anak saya juga ikut donasi dari uang jajannya.', s:5 },
            { n:'Mbak Indah', r:'Fundraiser komunitas', q:'Saya menggalang dana untuk pembangunan sekolah di NTT. Dashboard fundraisernya membantu sekali, jelas dan transparan.', s:5 },
          ].map((t,i)=>(
            <Card key={i}>
              <div className="flex items-center gap-1 text-amber-400">{[...Array(t.s)].map((_,j)=><Icons.Star key={j} w={16} h={16} fill="currentColor"/>)}</div>
              <p className="mt-3 text-ink leading-relaxed">"{t.q}"</p>
              <div className="mt-4 flex items-center gap-3 pt-4 border-t border-line">
                <Avatar name={t.n} size={40}/>
                <div>
                  <div className="font-semibold text-sm">{t.n}</div>
                  <div className="text-xs text-muted">{t.r}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-bg2 py-16">
        <div className="max-w-3xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">FAQ</div>
            <h2 className="text-2xl lg:text-3xl font-bold mt-1">Pertanyaan yang sering ditanyakan</h2>
          </div>
          <FAQList items={[
            { q:'Apakah donasi saya aman?', a:'Ya, NIATBAIK.ORG telah berizin Kemensos RI No. 480/HUK/2023, transaksi terenkripsi SSL 256-bit, dan disetujui Bank Indonesia melalui payment gateway resmi.' },
            { q:'Bagaimana cara mengetahui donasi saya tersalurkan?', a:'Setiap campaign memiliki halaman update berkala dan laporan distribusi. Kami juga mengirim email + WhatsApp ketika program selesai.' },
            { q:'Apakah donasi bisa dipotong dari pajak?', a:'Untuk program tertentu yang masuk daftar BAZNAS resmi, bukti donasi dapat digunakan sebagai zakat pengurang pajak (sesuai PMK 76/2007).' },
            { q:'Berapa minimum donasi?', a:'Minimum donasi adalah Rp10.000. Nominal lebih besar tentu sangat membantu agar campaign bisa tercapai tepat waktu.' },
            { q:'Metode pembayaran apa saja yang tersedia?', a:'Virtual Account semua bank besar (BCA, BNI, Mandiri, BSI), QRIS, GoPay, OVO, DANA, ShopeePay, dan transfer manual.' },
          ]}/>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-cyan2-500 p-8 lg:p-14 text-white">
          <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-white/10"></div>
          <div className="absolute right-32 -top-12 w-48 h-48 rounded-full bg-white/10"></div>
          <div className="relative max-w-2xl">
            <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight">Satu donasi hari ini, satu masa depan terselamatkan.</h2>
            <p className="mt-3 text-white/85 text-lg">Bergabunglah dengan 120.000+ donatur yang sudah memulai niat baiknya.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="secondary" size="xl">Mulai dari Rp25.000</Button>
              <button className="inline-flex items-center gap-2 h-14 px-5 rounded-xl bg-white/15 hover:bg-white/25 ring-1 ring-white/20 font-medium">Pelajari program</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-900 text-white/80">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><img src="assets/logo-niatbaik.png" className="h-7" alt=""/></div>
              <div className="font-extrabold text-white text-lg">NIATBAIK.ORG</div>
            </div>
            <p className="mt-3 text-sm text-white/65 max-w-xs">Platform donasi pendidikan terpercaya untuk anak Indonesia.</p>
            <div className="mt-4 flex gap-2">
              {['F','T','I','Y'].map(s=><div key={s} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold">{s}</div>)}
            </div>
          </div>
          <div>
            <div className="font-semibold text-white text-sm mb-3">Program</div>
            <ul className="space-y-2 text-sm">{['Beasiswa Dhuafa','Sekolah Pelosok','Paket Sekolah','Tahfidz Qur’an','Laptop Mahasiswa'].map(x=><li key={x}><a className="hover:text-white">{x}</a></li>)}</ul>
          </div>
          <div>
            <div className="font-semibold text-white text-sm mb-3">Tentang</div>
            <ul className="space-y-2 text-sm">{['Tentang Kami','Laporan Keuangan','Tim','Karir','Press Kit'].map(x=><li key={x}><a className="hover:text-white">{x}</a></li>)}</ul>
          </div>
          <div>
            <div className="font-semibold text-white text-sm mb-3">Hubungi</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Icons.Whatsapp w={16} h={16}/> +62 811-1000-1000</li>
              <li className="flex items-center gap-2"><Icons.Mail w={16} h={16}/> halo@niatbaik.org</li>
              <li className="flex items-center gap-2"><Icons.Home w={16} h={16}/> Jl. Pendidikan No. 1, Jakarta</li>
            </ul>
            <div className="mt-4 text-xs text-white/55">Berizin Kemensos RI<br/>No. 480/HUK/2023</div>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-white/55">© 2026 NIATBAIK.ORG · Yayasan Niat Baik Indonesia</div>
      </footer>
    </div>
  );
}

function FAQList({ items }){
  const [open, setOpen] = uS_pub(0);
  return (
    <div className="space-y-3">
      {items.map((it,i)=>(
        <button key={i} onClick={()=>setOpen(open===i?-1:i)} className="w-full text-left bg-white border border-line rounded-2xl px-5 py-4 hover:border-brand-300 transition">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-ink">{it.q}</div>
            <Icons.ChevronDown w={18} h={18} className={`text-slate-400 transition ${open===i?'rotate-180':''}`}/>
          </div>
          {open===i && <p className="mt-2 text-sm text-muted leading-relaxed">{it.a}</p>}
        </button>
      ))}
    </div>
  );
}

// ===================== Public Campaign Detail =====================
function CampaignDetail({ id, onBack }){
  const c = CAMPAIGNS.find(x=>x.id===id) || CAMPAIGNS[0];
  const pct = Math.min(100, Math.round(c.raised/c.target*100));
  const [tab, setTab] = uS_pub('cerita');
  const [donate, setDonate] = uS_pub(false);
  const { navigate, setRole } = useApp();
  return (
    <div className="min-h-screen bg-bg2">
      <PublicNav onAdmin={()=>{ setRole('Admin'); navigate('dashboard'); }}/>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted hover:text-brand-700 mb-4"><Icons.ChevronLeft w={16} h={16}/> Kembali ke beranda</button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Banner */}
            <Card padded={false} className="overflow-hidden">
              <div className="aspect-[16/9] relative">
                <img src={c.img} alt="" className="absolute inset-0 w-full h-full object-cover"/>
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge tone="cyan">{c.category}</Badge>
                  <StatusBadge status={c.status}/>
                </div>
              </div>
              <div className="p-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-ink leading-tight">{c.title}</h1>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <div className="flex items-center gap-2">
                    <Avatar name="Yayasan NIATBAIK" size={28}/>
                    <span>Penggalang: <span className="font-semibold text-ink">Yayasan NIATBAIK</span></span>
                  </div>
                  <span>·</span>
                  <span>{c.days} hari lagi</span>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <Card padded={false}>
              <div className="border-b border-line px-4 flex gap-1 overflow-x-auto nice-scroll">
                {[
                  ['cerita','Cerita'],['update','Update'],['donatur','Donatur'],['doa','Doa']
                ].map(([k,l])=>(
                  <button key={k} onClick={()=>setTab(k)} className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${tab===k?'border-brand-600 text-brand-700':'border-transparent text-muted hover:text-ink'}`}>{l}</button>
                ))}
              </div>
              <div className="p-6">
                {tab==='cerita' && (
                  <div className="prose prose-sm max-w-none text-slate-700">
                    <p className="text-base leading-relaxed">{c.description}</p>
                    <p>Setiap tahun, ribuan anak di Indonesia harus mengubur cita-citanya hanya karena tidak mampu membayar biaya sekolah. Padahal, pendidikan adalah satu-satunya tangga yang bisa membawa mereka keluar dari lingkaran kemiskinan.</p>
                    <p>Dengan donasi Anda, kami akan:</p>
                    <ul>
                      <li>Membayar uang sekolah & SPP selama 1 tahun untuk 1.000 anak SD–SMA</li>
                      <li>Memberikan paket perlengkapan sekolah (tas, sepatu, seragam, buku)</li>
                      <li>Menyalurkan uang saku bulanan untuk transportasi dan makan siang</li>
                      <li>Mendampingi siswa dengan mentor sukarelawan setiap minggu</li>
                    </ul>
                    <p>Mari ringankan langkah mereka menuju masa depan yang lebih cerah. Niat baikmu adalah harapan mereka.</p>
                  </div>
                )}
                {tab==='update' && (
                  <div className="space-y-4">
                    {[
                      { d:'2 hari lalu', t:'Distribusi paket sekolah tahap 3', s:'Hari ini paket sekolah telah didistribusikan ke 220 anak di wilayah Sukabumi & Cianjur. Terima kasih atas niat baik Anda semua.' },
                      { d:'1 minggu lalu', t:'Verifikasi 350 penerima manfaat baru', s:'Tim survey lapangan telah memverifikasi 350 calon penerima manfaat di 5 kota. Distribusi akan dimulai minggu depan.' },
                      { d:'3 minggu lalu', t:'Campaign dimulai', s:'Campaign resmi dibuka dengan target Rp1,5 miliar untuk 1.000 anak.' },
                    ].map((u,i)=>(
                      <div key={i} className="flex gap-4">
                        <div className="shrink-0 w-2 h-2 rounded-full bg-brand-600 mt-2"></div>
                        <div className="flex-1 pb-4 border-b border-line last:border-0">
                          <div className="text-xs text-muted">{u.d}</div>
                          <div className="mt-0.5 font-semibold text-ink">{u.t}</div>
                          <div className="mt-1 text-sm text-slate-600">{u.s}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {tab==='donatur' && (
                  <div className="space-y-2">
                    {DONORS.slice(0,8).map((d,i)=>(
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
                        <Avatar name={d.name} initials={d.initials} anon={d.anon} size={40}/>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-ink">{d.anon?'Hamba Allah':d.name}</div>
                          <div className="text-xs text-muted">{i+2} menit lalu · {PRAYERS[i%PRAYERS.length].slice(0,60)}…</div>
                        </div>
                        <div className="font-bold text-sm text-brand-700 tnum">{fmtIDR(NOMINAL_PRESETS[i%6])}</div>
                      </div>
                    ))}
                  </div>
                )}
                {tab==='doa' && (
                  <div className="space-y-3">
                    {PRAYERS.concat(PRAYERS).slice(0,8).map((p,i)=>(
                      <div key={i} className="bg-bg2 rounded-2xl p-4 border border-line">
                        <div className="flex items-center gap-2">
                          <Avatar name={DONORS[i%DONORS.length].name} size={28}/>
                          <span className="text-xs font-semibold text-ink">{DONORS[i%DONORS.length].anon?'Hamba Allah':DONORS[i%DONORS.length].name}</span>
                          <span className="text-xs text-muted">· {i+1} jam lalu</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">"{p}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* FAQ */}
            <Card>
              <h3 className="font-bold text-ink mb-3">Pertanyaan tentang campaign ini</h3>
              <FAQList items={[
                { q:'Berapa minimal donasi?', a:'Minimal Rp10.000. Setiap rupiah berarti.' },
                { q:'Apakah dana yang terkumpul digaransi tersalurkan?', a:'Ya, 100% disalurkan ke program. Biaya operasional ditanggung oleh donatur khusus.' },
                { q:'Bisakah saya menjadi mentor?', a:'Tentu, hubungi kami via WhatsApp untuk program volunteer.' },
              ]}/>
            </Card>
          </div>

          {/* RIGHT — sticky donation card */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 space-y-4">
              <Card>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-brand-700 tnum">{fmtShort(c.raised)}</span>
                  <span className="text-sm text-muted tnum">{pct}%</span>
                </div>
                <div className="mt-1 text-xs text-muted">Terkumpul dari <span className="font-semibold text-ink tnum">{fmtShort(c.target)}</span></div>
                <div className="mt-3"><ProgressBar value={c.raised} max={c.target} size="lg"/></div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="bg-bg2 rounded-xl p-2.5">
                    <div className="font-extrabold text-ink tnum">{fmtNum(c.donors)}</div>
                    <div className="text-[11px] text-muted">Donatur</div>
                  </div>
                  <div className="bg-bg2 rounded-xl p-2.5">
                    <div className="font-extrabold text-ink tnum">{c.days}</div>
                    <div className="text-[11px] text-muted">Hari lagi</div>
                  </div>
                  <div className="bg-bg2 rounded-xl p-2.5">
                    <div className="font-extrabold text-ink tnum">2.1K</div>
                    <div className="text-[11px] text-muted">Doa</div>
                  </div>
                </div>
                <Button variant="primary" size="xl" full className="mt-5" icon={<Icons.Heart w={18} h={18}/>} onClick={()=>setDonate(true)}>Donasi Sekarang</Button>
                <button className="mt-2 w-full h-11 rounded-xl border border-line text-sm font-medium hover:bg-slate-50 inline-flex items-center justify-center gap-2"><Icons.Send w={16} h={16}/>Bagikan campaign</button>
              </Card>

              {/* Quick donate */}
              <Card>
                <div className="font-semibold text-sm text-ink">Donasi cepat</div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {NOMINAL_PRESETS.map(n=>(
                    <button key={n} className="rounded-xl border border-line py-2 text-sm font-semibold text-ink hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700">{fmtShort(n)}</button>
                  ))}
                </div>
                <Button variant="cyan" full className="mt-3" onClick={()=>setDonate(true)}>Lanjut bayar</Button>
              </Card>

              <TrustBadges/>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="lg:hidden sticky bottom-0 left-0 right-0 z-30 bg-white border-t border-line p-3 cta-shadow">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-muted">Terkumpul</div>
            <div className="font-bold text-brand-700 tnum">{fmtShort(c.raised)} <span className="text-muted text-xs">/ {pct}%</span></div>
          </div>
          <Button variant="primary" size="lg" icon={<Icons.Heart w={16} h={16}/>} onClick={()=>setDonate(true)}>Donasi</Button>
        </div>
      </div>

      <SocialProofPopup/>

      {/* Donation Modal */}
      <DonationModal open={donate} onClose={()=>setDonate(false)} campaign={c}/>
    </div>
  );
}

// ===================== Donation Modal =====================
function DonationModal({ open, onClose, campaign }){
  const [step, setStep] = uS_pub(1);
  const [amount, setAmount] = uS_pub(100000);
  const [custom, setCustom] = uS_pub(false);
  const [method, setMethod] = uS_pub('QRIS');
  const [anon, setAnon] = uS_pub(false);
  const [success, setSuccess] = uS_pub(false);

  const reset = () => { setStep(1); setAmount(100000); setCustom(false); setMethod('QRIS'); setAnon(false); setSuccess(false); };

  return (
    <Modal open={open} onClose={()=>{ onClose(); setTimeout(reset, 300); }} maxW="max-w-xl">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 border-b border-line">
        <div className="text-xs text-muted">Donasi untuk</div>
        <div className="mt-0.5 font-bold text-ink line-clamp-1">{campaign?.title}</div>
        {/* steps */}
        <div className="mt-4 flex items-center gap-1.5">
          {[1,2,3].map(s=>(
            <div key={s} className={`h-1.5 rounded-full transition flex-1 ${s<=step?'bg-brand-600':'bg-slate-200'}`}/>
          ))}
        </div>
        <div className="mt-2 text-xs text-muted">Langkah {step} dari 3 · {step===1?'Pilih nominal':step===2?'Identitas donatur':'Pilih pembayaran'}</div>
      </div>

      <div className="p-6">
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Icons.Check w={32} h={32}/></div>
            <div className="mt-4 text-xl font-bold text-ink">Terima kasih atas niat baikmu!</div>
            <p className="text-muted mt-1 text-sm">Donasi <span className="font-semibold text-ink tnum">{fmtIDR(amount)}</span> via <span className="font-semibold">{method}</span> sedang diproses. Bukti transaksi telah dikirim ke email & WhatsApp.</p>
            <div className="mt-5 bg-bg2 rounded-2xl p-4 text-left">
              <div className="text-xs text-muted">Kode Invoice</div>
              <div className="font-mono font-bold text-brand-700">INV-2026100{Math.floor(Math.random()*900+100)}</div>
            </div>
            <Button variant="primary" size="lg" full className="mt-5" onClick={()=>{ onClose(); setTimeout(reset,300); }}>Selesai</Button>
          </div>
        ) : step===1 ? (
          <div>
            <Field label="Pilih nominal donasi">
              <div className="grid grid-cols-3 gap-2.5">
                {NOMINAL_PRESETS.map(n=>(
                  <button key={n} onClick={()=>{setAmount(n); setCustom(false);}} className={`h-14 rounded-xl border-2 font-bold tnum transition ${!custom&&amount===n?'border-brand-600 bg-brand-50 text-brand-700':'border-line text-ink hover:border-brand-300'}`}>{fmtShort(n)}</button>
                ))}
              </div>
            </Field>
            <div className="mt-4">
              <Field label="Nominal lain">
                <Input type="number" value={custom?amount:''} onChange={e=>{setAmount(+e.target.value||0); setCustom(true);}} placeholder="Masukkan nominal donasi…" icon={<span className="text-sm font-semibold">Rp</span>}/>
              </Field>
            </div>
            <div className="mt-5 bg-bg2 rounded-2xl p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted">Donasi</span><span className="font-bold text-ink tnum">{fmtIDR(amount)}</span></div>
              <div className="flex justify-between mt-1.5"><span className="text-muted">Biaya admin</span><span className="text-emerald-600 font-semibold">Gratis</span></div>
              <div className="border-t border-line mt-3 pt-3 flex justify-between"><span className="font-semibold">Total</span><span className="font-extrabold text-brand-700 tnum">{fmtIDR(amount)}</span></div>
            </div>
            <Button variant="primary" size="lg" full className="mt-5" onClick={()=>setStep(2)} iconRight={<Icons.ArrowRight w={16} h={16}/>}>Lanjut</Button>
          </div>
        ) : step===2 ? (
          <div className="space-y-4">
            <Field label="Nama lengkap" required>
              <Input placeholder="Nama Anda" defaultValue="Ahmad Fauzi"/>
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="No. WhatsApp" required>
                <Input placeholder="08xx" icon={<Icons.Whatsapp w={16} h={16}/>} defaultValue="0812 3456 7890"/>
              </Field>
              <Field label="Email">
                <Input placeholder="email@contoh.com" icon={<Icons.Mail w={16} h={16}/>} defaultValue="ahmad@gmail.com"/>
              </Field>
            </div>
            <Field label="Doa / pesan untuk penerima manfaat (opsional)">
              <textarea rows="3" className="w-full px-3.5 py-3 rounded-xl bg-white border border-line focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 text-sm" placeholder="Semoga bermanfaat dan barokah…"/>
            </Field>
            <label className="flex items-center gap-2 select-none">
              <input type="checkbox" checked={anon} onChange={e=>setAnon(e.target.checked)} className="w-4 h-4 rounded border-line text-brand-600 focus:ring-brand-300"/>
              <span className="text-sm text-ink">Tampilkan sebagai "Hamba Allah" (anonim)</span>
            </label>
            <div className="flex gap-2">
              <Button variant="secondary" size="lg" onClick={()=>setStep(1)}>Kembali</Button>
              <Button variant="primary" size="lg" full onClick={()=>setStep(3)} iconRight={<Icons.ArrowRight w={16} h={16}/>}>Lanjut</Button>
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
                  { k:'DANA', d:'Bayar pakai saldo DANA', emoji:'DANA' },
                ].map(m=>(
                  <button key={m.k} onClick={()=>setMethod(m.k)} className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border-2 transition ${method===m.k?'border-brand-600 bg-brand-50':'border-line hover:border-brand-300'}`}>
                    <div className="w-12 h-9 rounded-lg bg-white border border-line flex items-center justify-center text-[11px] font-bold text-brand-700">{m.emoji}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-ink flex items-center gap-2">{m.k} {m.tag && <Badge tone="cyan" size="sm">{m.tag}</Badge>}</div>
                      <div className="text-xs text-muted">{m.d}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method===m.k?'border-brand-600 bg-brand-600':'border-line'}`}>
                      {method===m.k && <div className="w-2 h-2 rounded-full bg-white"/>}
                    </div>
                  </button>
                ))}
              </div>
            </Field>
            <div className="mt-4 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2.5 rounded-xl text-sm">
              <Icons.Shield w={16} h={16}/>
              Transaksi aman dengan enkripsi SSL 256-bit
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" size="lg" onClick={()=>setStep(2)}>Kembali</Button>
              <Button variant="primary" size="lg" full onClick={()=>setSuccess(true)} icon={<Icons.Heart w={16} h={16}/>}>Bayar {fmtShort(amount)}</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

Object.assign(window, { PublicNav, LandingPage, CampaignDetail, DonationModal, FAQList });

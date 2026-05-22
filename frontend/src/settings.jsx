// Settings page with tabs
const { useState: uS_set } = React;

function SettingsPage(){
  const [tab, setTab] = uS_set('tracking');
  const tabs = [
    ['themes','Themes','Sparkles'],
    ['form','Form','Edit'],
    ['payment','Payment','Wallet'],
    ['tracking','Tracking & Ads','Pixel'],
    ['notif','Notification','Bell'],
    ['social','Social Proof','Heart'],
    ['fund','Fundraising','Users'],
    ['general','General','Globe'],
  ];
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Konfigurasi platform NIATBAIK.ORG"/>

      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        {/* Tabs */}
        <Card padded={false} className="p-2 lg:sticky lg:top-20 h-fit">
          <nav className="space-y-0.5">
            {tabs.map(([k,l,ic])=>{
              const Ic = Icons[ic] || Icons.Settings;
              return (
                <button key={k} onClick={()=>setTab(k)} className={`w-full flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition ${tab===k?'bg-brand-600 text-white shadow-sm':'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                  <Ic w={18} h={18}/>{l}
                </button>
              );
            })}
          </nav>
        </Card>

        <div className="space-y-5">
          {tab==='tracking' && <TrackingSettings/>}
          {tab==='themes' && <ThemesSettings/>}
          {tab==='form' && <FormSettings/>}
          {tab==='payment' && <PaymentSettings/>}
          {tab==='notif' && <NotifSettings/>}
          {tab==='social' && <SocialProofSettings/>}
          {tab==='fund' && <FundraisingSettings/>}
          {tab==='general' && <GeneralSettings/>}
        </div>
      </div>
    </div>
  );
}

// ===== Tracking & Ads =====
function PixelCard({ name, badge, status, idLabel, idValue, extras }){
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center"><Icons.Pixel w={22} h={22}/></div>
          <div>
            <div className="font-bold text-ink dark:text-slate-100">{name}</div>
            <div className="text-xs text-muted">{badge}</div>
          </div>
        </div>
        <StatusBadge status={status}/>
      </div>
      <Field label={idLabel}>
        <Input defaultValue={idValue} suffix="ID"/>
      </Field>
      {extras}
      <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
        <button className="text-xs text-brand-600 font-medium hover:underline">Tes koneksi</button>
        <Button variant="secondary" size="sm">Simpan</Button>
      </div>
    </Card>
  );
}

function TrackingSettings(){
  return (
    <>
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><Icons.Shield w={22} h={22}/></div>
          <div className="flex-1">
            <div className="font-bold text-ink dark:text-slate-100">Tracking aktif & sehat</div>
            <div className="text-xs text-muted">5 dari 6 event terkirim sukses dalam 24 jam terakhir.</div>
          </div>
          <Button variant="secondary" size="sm" icon={<Icons.Refresh w={14} h={14}/>}>Tes Semua</Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <PixelCard name="Meta Pixel" badge="Facebook · Instagram Ads" status="Active" idLabel="Meta Pixel ID" idValue="3849510482001234"
          extras={<><div className="mt-3"><Toggle checked label="Aktifkan Conversions API" sub="Server-side tracking untuk akurasi iOS 14+"/></div>
                   <Field label="Access Token (CAPI)" hint="Token rahasia untuk Server Event"><Input placeholder="EAAJ…" defaultValue="EAAJ•••••••••••••••••"/></Field></>}/>
        <PixelCard name="Google Tag Manager" badge="GTM Container" status="Active" idLabel="GTM Container ID" idValue="GTM-MX5K9PW"/>
        <PixelCard name="Google Ads" badge="Conversion tracking" status="Active" idLabel="Conversion ID / Label" idValue="AW-1098765432 / abcDEFghiJK"/>
        <PixelCard name="Google Analytics 4" badge="GA4 Measurement" status="Active" idLabel="Measurement ID" idValue="G-XYZW1234AB"/>
        <PixelCard name="TikTok Pixel" badge="TikTok Ads" status="Error" idLabel="TikTok Pixel ID" idValue="CK8FAS3C77UC2C1QO2P0"
          extras={<><div className="mt-3"><Toggle checked label="Aktifkan Events API" sub="Server-side event untuk attribution lebih baik"/></div>
                   <div className="mt-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-900/40 rounded-xl p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                     <Icons.X w={14} h={14} className="mt-0.5"/>
                     <div><b>Webhook gagal</b> (2x dalam 1 jam terakhir). Cek access token TikTok Business API.</div>
                   </div></>}/>
        <PixelCard name="Custom Webhook" badge="Server-side" status="Not Connected" idLabel="URL Endpoint" idValue=""/>
      </div>

      {/* Events */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-ink dark:text-slate-100">Event Tracking</div>
            <div className="text-xs text-muted">Atur event yang dikirim ke pixel</div>
          </div>
          <Button variant="secondary" size="sm" icon={<Icons.Refresh w={14} h={14}/>}>Tes Event</Button>
        </div>
        <div className="overflow-x-auto nice-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-2.5 font-semibold">Event</th>
                <th className="px-4 py-2.5 font-semibold">Trigger</th>
                <th className="px-4 py-2.5 font-semibold">Meta</th>
                <th className="px-4 py-2.5 font-semibold">Google</th>
                <th className="px-4 py-2.5 font-semibold">TikTok</th>
                <th className="px-4 py-2.5 font-semibold">24 jam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-slate-800">
              {[
                ['PageView','Saat halaman dibuka', true, true, false, 124800],
                ['ViewContent','Buka detail campaign', true, true, true, 84120],
                ['Lead','Form donasi mulai diisi', true, true, true, 18420],
                ['InitiateCheckout','Klik tombol bayar', true, true, true, 9840],
                ['AddPaymentInfo','Pilih payment method', true, true, true, 7240],
                ['CompleteDonation','Transaksi sukses', true, true, false, 4920],
              ].map(([e,t,m,g,tk,n],i)=>(
                <tr key={i}>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-ink dark:text-slate-100">{e}</td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{t}</td>
                  <td className="px-4 py-2.5">{m?<Icons.Check w={16} h={16} className="text-emerald-600"/>:<Icons.X w={16} h={16} className="text-slate-300"/>}</td>
                  <td className="px-4 py-2.5">{g?<Icons.Check w={16} h={16} className="text-emerald-600"/>:<Icons.X w={16} h={16} className="text-slate-300"/>}</td>
                  <td className="px-4 py-2.5">{tk?<Icons.Check w={16} h={16} className="text-emerald-600"/>:<Icons.X w={16} h={16} className="text-rose-500"/>}</td>
                  <td className="px-4 py-2.5 font-bold tnum">{fmtNum(n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* UTM helper */}
      <Card>
        <div className="font-bold text-ink dark:text-slate-100">UTM Builder</div>
        <div className="text-xs text-muted mb-3">Buat link iklan terlacak dengan cepat</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="utm_source"><Input defaultValue="facebook"/></Field>
          <Field label="utm_medium"><Input defaultValue="cpc"/></Field>
          <Field label="utm_campaign"><Input defaultValue="ramadhan-2026"/></Field>
          <Field label="utm_content"><Input defaultValue="hero-video-v3"/></Field>
        </div>
        <div className="mt-4 bg-slate-900 text-cyan2-300 rounded-xl p-3 text-xs font-mono break-all">
          https://niatbaik.org/c/beasiswa-1000-anak?utm_source=facebook&amp;utm_medium=cpc&amp;utm_campaign=ramadhan-2026&amp;utm_content=hero-video-v3
        </div>
      </Card>
    </>
  );
}

// ===== Themes =====
function ThemesSettings(){
  return (
    <>
      <Card>
        <div className="font-bold text-ink dark:text-slate-100 mb-1">Tampilan & Branding</div>
        <div className="text-xs text-muted mb-4">Sesuaikan tampilan website publik</div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <Field label="Logo website">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-bg2 border border-line flex items-center justify-center p-2">
                  <img src="assets/logo-niatbaik.png" className="max-w-full max-h-full"/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button variant="secondary" size="sm" icon={<Icons.Upload w={14} h={14}/>}>Upload Logo</Button>
                  <button className="text-xs text-rose-600 hover:underline text-left">Hapus</button>
                </div>
              </div>
            </Field>

            <Field label="Primary color">
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-xl border border-line" style={{background:'#2E4191'}}/>
                <Input defaultValue="#2E4191" className="flex-1"/>
              </div>
              <div className="mt-2 flex gap-2">
                {['#2E4191','#1d4ed8','#16a34a','#dc2626','#0e7490','#7c3aed'].map(c=>(
                  <button key={c} className="w-7 h-7 rounded-lg ring-2 ring-transparent hover:ring-brand-300" style={{background:c}}/>
                ))}
              </div>
            </Field>

            <Field label="Secondary color">
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-xl border border-line" style={{background:'#38B6FF'}}/>
                <Input defaultValue="#38B6FF" className="flex-1"/>
              </div>
            </Field>

            <Field label="Font keluarga">
              <Select defaultValue="DM Sans"><option>DM Sans</option><option>Inter</option><option>Plus Jakarta Sans</option><option>Poppins</option></Select>
            </Field>

            <Field label="Border radius">
              <div className="grid grid-cols-4 gap-2">
                {[['sm','sm','6px'],['md','md','10px'],['lg','xl','14px'],['xl','2xl','20px']].map(([k,n,r])=>(
                  <button key={k} className={`h-14 border-2 ${k==='lg'?'border-brand-600 bg-brand-50':'border-line'} flex flex-col items-center justify-center text-xs font-medium`} style={{borderRadius:r}}>{n}<span className="text-muted text-[10px]">{r}</span></button>
                ))}
              </div>
            </Field>

            <Field label="Button style">
              <div className="grid grid-cols-3 gap-2">
                <button className="h-10 bg-brand-600 text-white rounded-xl text-sm font-semibold">Solid</button>
                <button className="h-10 bg-brand-50 text-brand-700 rounded-xl text-sm font-semibold">Soft</button>
                <button className="h-10 border-2 border-brand-600 text-brand-700 rounded-xl text-sm font-semibold">Outline</button>
              </div>
            </Field>
          </div>

          {/* Preview */}
          <div>
            <div className="text-sm font-semibold mb-2">Preview tema</div>
            <div className="rounded-2xl border border-line overflow-hidden">
              <div className="h-10 bg-bg2 border-b border-line flex items-center px-3 gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"/>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"/>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"/>
                <span className="text-xs text-muted ml-3">niatbaik.org</span>
              </div>
              <div className="p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <img src="assets/logo-niatbaik.png" className="h-6"/>
                </div>
                <div className="aspect-[16/9] rounded-xl overflow-hidden mb-3"><img src={CAMPAIGNS[0].img} className="w-full h-full object-cover"/></div>
                <div className="font-bold text-ink line-clamp-1">{CAMPAIGNS[0].title}</div>
                <ProgressBar value={CAMPAIGNS[0].raised} max={CAMPAIGNS[0].target} size="sm"/>
                <div className="mt-2 flex justify-between text-xs"><span className="text-muted">Terkumpul</span><span className="font-bold tnum text-brand-700">{fmtShort(CAMPAIGNS[0].raised)}</span></div>
                <Button variant="primary" size="md" full className="mt-3" icon={<Icons.Heart w={14} h={14}/>}>Donasi Sekarang</Button>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="primary" size="sm" full>Simpan Tema</Button>
              <Button variant="secondary" size="sm">Reset</Button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

// ===== Form =====
function FormSettings(){
  return (
    <Card>
      <div className="font-bold text-ink dark:text-slate-100 mb-1">Pengaturan Form Donasi</div>
      <div className="text-xs text-muted mb-4">Atur field & nominal default untuk semua campaign</div>
      <div className="space-y-4">
        <Field label="Field wajib (required)">
          <div className="space-y-2">
            <Toggle checked label="Nama lengkap" sub="Selalu diminta"/>
            <Toggle checked label="No. WhatsApp" sub="Untuk konfirmasi pembayaran"/>
            <Toggle label="Email" sub="Opsional, untuk e-receipt"/>
            <Toggle checked label="Tampilkan opsi anonim" sub="Donatur dapat memilih 'Hamba Allah'"/>
            <Toggle checked label="Tampilkan doa / pesan" sub="Donatur bisa kirim doa ke penerima manfaat"/>
          </div>
        </Field>
        <Field label="Nominal preset (Rp)">
          <div className="grid grid-cols-3 gap-2">
            {NOMINAL_PRESETS.map(n=>(<Input key={n} defaultValue={n} type="number"/>))}
          </div>
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Minimum donasi"><Input defaultValue="10000" type="number" suffix="IDR"/></Field>
          <Field label="Maksimum donasi"><Input defaultValue="100000000" type="number" suffix="IDR"/></Field>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary">Reset</Button>
        <Button variant="primary">Simpan</Button>
      </div>
    </Card>
  );
}

// ===== Payment =====
function PaymentSettings(){
  const methods = [
    { n:'BCA Virtual Account', t:'Transfer', a:true, fee:'4.000' },
    { n:'BNI Virtual Account', t:'Transfer', a:true, fee:'4.000' },
    { n:'Mandiri Virtual Account', t:'Transfer', a:true, fee:'4.000' },
    { n:'BSI Virtual Account', t:'Transfer Syariah', a:true, fee:'4.000' },
    { n:'QRIS', t:'Universal', a:true, fee:'0.7%' },
    { n:'GoPay', t:'E-wallet', a:true, fee:'2.0%' },
    { n:'OVO', t:'E-wallet', a:true, fee:'2.0%' },
    { n:'DANA', t:'E-wallet', a:true, fee:'2.0%' },
    { n:'ShopeePay', t:'E-wallet', a:false, fee:'2.0%' },
    { n:'Bank Transfer Manual', t:'Manual', a:true, fee:'-' },
  ];
  return (
    <>
      <Card>
        <div className="font-bold text-ink dark:text-slate-100 mb-1">Payment Gateway</div>
        <div className="text-xs text-muted mb-4">Aktifkan / nonaktifkan metode pembayaran</div>
        <div className="space-y-2">
          {methods.map((m,i)=>(
            <div key={i} className="flex items-center justify-between gap-3 p-3 surface-2 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-line flex items-center justify-center font-bold text-xs text-brand-700">{m.n.split(' ').map(s=>s[0]).slice(0,2).join('')}</div>
                <div>
                  <div className="font-semibold text-sm text-ink dark:text-slate-100">{m.n}</div>
                  <div className="text-xs text-muted">{m.t} · Fee {m.fee}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={m.a?'Active':'inactive'}/>
                <Toggle checked={m.a}/>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="font-bold text-ink dark:text-slate-100 mb-1">Payment Report</div>
        <div className="text-xs text-muted mb-3">Download laporan transaksi berdasarkan payment method</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {['BCA VA','BNI VA','QRIS','GoPay','OVO','DANA'].map(m=>(
            <button key={m} className="flex items-center justify-between p-3 surface-2 rounded-xl hover:border-brand-300">
              <span className="font-medium text-sm">{m}</span>
              <Icons.Download w={16} h={16} className="text-brand-600"/>
            </button>
          ))}
        </div>
      </Card>
    </>
  );
}

// ===== Notification =====
function NotifSettings(){
  return (
    <Card>
      <div className="font-bold text-ink dark:text-slate-100 mb-3">Notifikasi</div>
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          ['WhatsApp notifikasi donatur','Konfirmasi otomatis ke nomor WA',true],
          ['Email notifikasi donatur','E-receipt ke email donatur',true],
          ['WhatsApp notifikasi admin','Notif setiap donasi masuk',true],
          ['Email notifikasi admin','Notif harian via email',false],
          ['Donor follow-up otomatis','Reminder pending payment 1 jam',true],
          ['Notifikasi pembayaran sukses','Notif ke donor & admin',true],
          ['Notifikasi pembayaran gagal','Notif retry payment',true],
          ['Notifikasi campaign 90%','Saat campaign hampir tercapai',true],
        ].map(([t,s,c],i)=>(
          <div key={i} className="surface-2 rounded-xl p-3">
            <Toggle checked={c} label={t} sub={s}/>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <Field label="WhatsApp sender number"><Input defaultValue="+62 811 1000 1000"/></Field>
        <div className="mt-3">
          <Field label="Template WA donasi sukses">
            <textarea rows="3" className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-line text-sm font-mono" defaultValue="Terima kasih, {nama}! Donasi {nominal} untuk {campaign} telah kami terima 🙏 Invoice: {invoice}"/>
          </Field>
        </div>
      </div>
    </Card>
  );
}

// ===== Social proof =====
function SocialProofSettings(){
  const [enabled, setE] = uS_set(true);
  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-ink dark:text-slate-100">Social Proof Popup</div>
            <div className="text-xs text-muted">Notifikasi donasi terbaru di halaman publik</div>
          </div>
          <Toggle checked={enabled} onChange={setE}/>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Interval kemunculan"><Select><option>5 detik</option><option>10 detik</option><option>15 detik</option></Select></Field>
          <Field label="Durasi tampil"><Select><option>3 detik</option><option>5 detik</option><option>7 detik</option></Select></Field>
          <Field label="Posisi"><Select><option>Bawah kiri</option><option>Bawah kanan</option><option>Atas kiri</option><option>Atas kanan</option></Select></Field>
          <Field label="Tampilkan max."><Input defaultValue="10" type="number" suffix="popup/sesi"/></Field>
        </div>
        <Field label="Template kalimat">
          <textarea rows="2" className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-line text-sm font-mono" defaultValue="{nama} dari {kota} baru saja berdonasi {nominal} untuk {campaign}"/>
        </Field>
        <div className="mt-4 flex items-start gap-3 bg-cyan2-50 dark:bg-cyan2-900/30 border border-cyan2-100 dark:border-cyan2-900/40 rounded-2xl p-3">
          <Icons.Sparkles w={20} h={20} className="text-cyan2-700 dark:text-cyan2-300 mt-0.5"/>
          <div className="flex-1 text-sm">
            <b className="text-cyan2-700 dark:text-cyan2-300">Tip:</b>
            <span className="text-slate-700 dark:text-slate-300"> Aktifkan social proof untuk meningkatkan konversi hingga 12–18%.</span>
          </div>
        </div>
      </Card>
    </>
  );
}

// ===== Fundraising =====
function FundraisingSettings(){
  return (
    <Card>
      <div className="font-bold text-ink dark:text-slate-100 mb-3">Pengaturan Fundraiser</div>
      <Toggle checked label="Aktifkan program fundraiser" sub="Donatur bisa menjadi fundraiser dengan link referral"/>
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <Field label="Default komisi (%)"><Input defaultValue="5" type="number" suffix="%"/></Field>
        <Field label="Minimum payout"><Input defaultValue="100000" type="number" suffix="IDR"/></Field>
      </div>
      <Field label="Aturan komisi">
        <textarea rows="3" className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-line text-sm" defaultValue="5% untuk fundraiser umum, 7% untuk top 10 fundraiser bulan ini"/>
      </Field>
      <Toggle checked label="Auto payout mingguan" sub="Pencairan otomatis tiap hari Jumat"/>
    </Card>
  );
}

// ===== General =====
function GeneralSettings(){
  return (
    <>
      <Card>
        <div className="font-bold text-ink dark:text-slate-100 mb-3">Pengaturan Umum</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nama website"><Input defaultValue="NIATBAIK.ORG"/></Field>
          <Field label="Domain"><Input defaultValue="niatbaik.org"/></Field>
          <Field label="Timezone"><Select><option>Asia/Jakarta (WIB)</option><option>Asia/Makassar (WITA)</option><option>Asia/Jayapura (WIT)</option></Select></Field>
          <Field label="Mata Uang"><Select><option>IDR — Rupiah</option><option>USD</option></Select></Field>
        </div>
      </Card>
      <Card>
        <div className="font-bold text-ink dark:text-slate-100 mb-3">SEO</div>
        <Field label="SEO Title"><Input defaultValue="NIATBAIK.ORG — Platform Donasi Pendidikan Anak Indonesia"/></Field>
        <Field label="SEO Description"><textarea rows="3" className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-line text-sm" defaultValue="Donasi mudah untuk beasiswa, paket sekolah, dan pembangunan ruang belajar di pelosok Indonesia. Transparan, aman, berizin Kemensos."/></Field>
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-ink dark:text-slate-100">Mode Maintenance</div>
            <div className="text-xs text-muted">Sementara matikan akses publik</div>
          </div>
          <Toggle/>
        </div>
      </Card>
    </>
  );
}

Object.assign(window, { SettingsPage });

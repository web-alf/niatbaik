// Misc pages: Fundraiser, Shortcode, Members, Profile, Notification, Trash
const { useState: uS_mi } = React;

// ====================== Fundraiser ======================
function FundraiserPage(){
  const [copiedId, setCopiedId] = uS_mi(null);
  return (
    <div className="space-y-5">
      <PageHeader title="Fundraiser" subtitle={`${TOTAL_FUNDRAISER} fundraiser terdaftar · 24 aktif minggu ini`}
        actions={<><Button variant="secondary" icon={<Icons.Download w={16} h={16}/>}>Export</Button><Button variant="primary" icon={<Icons.Plus w={16} h={16}/>}>Tambah Fundraiser</Button></>}/>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Fundraiser" value={fmtNum(TOTAL_FUNDRAISER)} sub="Aktif" tone="brand" icon={<Icons.Users w={20} h={20}/>}/>
        <Stat label="Total Komisi" value={fmtShort(28_400_000)} sub="Bulan ini" tone="amber" icon={<Icons.Wallet w={20} h={20}/>}/>
        <Stat label="Komisi Pending" value={fmtShort(8_900_000)} sub="Belum dibayar" tone="red" icon={<Icons.Refresh w={20} h={20}/>}/>
        <Stat label="Dana via Referral" value={fmtShort(842_000_000)} sub="Bulan ini" tone="green" icon={<Icons.Heart w={20} h={20}/>}/>
      </div>

      <Card padded={false}>
        <div className="p-4 flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px]"><Input icon={<Icons.Search w={16} h={16}/>} placeholder="Cari nama fundraiser…"/></div>
          <Select className="w-44"><option>Semua status</option><option>Paid</option><option>Pending</option></Select>
          <DateRangePicker/>
        </div>
        <div className="overflow-x-auto nice-scroll border-t border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                <th className="px-5 py-3 font-semibold">Fundraiser</th>
                <th className="px-5 py-3 font-semibold">Campaign</th>
                <th className="px-5 py-3 font-semibold">Dana Terkumpul</th>
                <th className="px-5 py-3 font-semibold">Tx</th>
                <th className="px-5 py-3 font-semibold">Komisi</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Referral Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-slate-800">
              {FUNDRAISERS.map(f=>{
                const url = 'niatbaik.org/r/'+f.ref;
                return (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={f.name} size={36}/>
                        <div>
                          <div className="font-semibold text-ink dark:text-slate-100">{f.name}</div>
                          <div className="text-xs text-muted">@{f.ref.toLowerCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">{f.campaign}</td>
                    <td className="px-5 py-3 font-bold text-brand-700 dark:text-brand-300 tnum">{fmtShort(f.raised)}</td>
                    <td className="px-5 py-3 tnum">{fmtNum(f.tx)}</td>
                    <td className="px-5 py-3 font-semibold tnum">{fmtShort(f.commission)}</td>
                    <td className="px-5 py-3"><StatusBadge status={f.status}/></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{url}</code>
                        <button onClick={()=>{navigator.clipboard?.writeText('https://'+url); setCopiedId(f.id); setTimeout(()=>setCopiedId(null),1500);}} className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center">
                          {copiedId===f.id ? <Icons.Check w={14} h={14} className="text-emerald-600"/> : <Icons.Copy w={14} h={14}/>}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ====================== Shortcode ======================
function ShortcodePage(){
  const [type, setType] = uS_mi('embed');
  const [campaign, setCampaign] = uS_mi(CAMPAIGNS[0].slug);
  const [style, setStyle] = uS_mi('primary');
  const [copied, setCopied] = uS_mi(false);
  const code = type==='embed'
    ? `<iframe src="https://niatbaik.org/embed/${campaign}" width="100%" height="640" frameborder="0"></iframe>`
    : type==='form'
    ? `[niatbaik_form campaign="${campaign}" theme="${style}"]`
    : `<a href="https://niatbaik.org/c/${campaign}" class="nb-button nb-${style}">Donasi Sekarang</a>`;
  return (
    <div className="space-y-5">
      <PageHeader title="Shortcode" subtitle="Embed campaign atau tombol donasi di website Anda"/>

      <div className="grid lg:grid-cols-[360px_1fr] gap-5">
        <Card>
          <div className="font-bold text-ink dark:text-slate-100 mb-3">Konfigurasi</div>
          <Field label="Tipe shortcode">
            <div className="space-y-2">
              {[
                ['embed','Embed Campaign','Tampilkan campaign lengkap'],
                ['form','Form Donasi','Form donasi langsung'],
                ['button','Tombol Donasi','Single CTA button'],
              ].map(([k,n,d])=>(
                <button key={k} onClick={()=>setType(k)} className={`w-full text-left p-3 rounded-xl border-2 ${type===k?'border-brand-600 bg-brand-50 dark:bg-brand-900/30':'border-line'}`}>
                  <div className="font-semibold text-sm text-ink dark:text-slate-100">{n}</div>
                  <div className="text-xs text-muted">{d}</div>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Campaign tujuan">
            <Select value={campaign} onChange={e=>setCampaign(e.target.value)}>
              {CAMPAIGNS.map(c=><option key={c.id} value={c.slug}>{c.title}</option>)}
            </Select>
          </Field>
          <Field label="Style tombol">
            <div className="grid grid-cols-3 gap-2">
              {[['primary','Solid'],['cyan','Cyan'],['outline','Outline']].map(([k,l])=>(
                <button key={k} onClick={()=>setStyle(k)} className={`h-10 rounded-xl text-sm font-semibold border-2 ${style===k?'border-brand-600':'border-line'}`}>{l}</button>
              ))}
            </div>
          </Field>
        </Card>

        <div className="space-y-4">
          {/* Code */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-ink dark:text-slate-100">Kode</div>
              <button onClick={()=>{navigator.clipboard?.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),1500);}} className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-brand-600 text-white text-sm font-semibold">
                {copied?<><Icons.Check w={14} h={14}/>Tersalin</>:<><Icons.Copy w={14} h={14}/>Salin</>}
              </button>
            </div>
            <div className="bg-slate-900 text-cyan2-300 rounded-xl p-4 text-xs font-mono break-all leading-relaxed">{code}</div>
          </Card>

          {/* Preview */}
          <Card>
            <div className="font-bold text-ink dark:text-slate-100 mb-3">Preview</div>
            <div className="bg-bg2 rounded-2xl p-6 border border-line min-h-[200px] flex items-center justify-center">
              {type==='button' && (
                <button className={`px-6 h-12 rounded-xl font-semibold text-sm inline-flex items-center gap-2 ${style==='primary'?'bg-brand-600 text-white':style==='cyan'?'bg-cyan2-400 text-white':'border-2 border-brand-600 text-brand-700 bg-white'}`}>
                  <Icons.Heart w={16} h={16}/> Donasi Sekarang
                </button>
              )}
              {type==='embed' && (
                <div className="w-full max-w-md mx-auto">
                  <CampaignCard c={CAMPAIGNS.find(c=>c.slug===campaign)||CAMPAIGNS[0]} compact/>
                </div>
              )}
              {type==='form' && (
                <div className="w-full max-w-sm mx-auto bg-white rounded-2xl p-4 border border-line">
                  <div className="text-sm font-bold mb-3">Donasi Cepat</div>
                  <div className="grid grid-cols-3 gap-2 mb-3">{NOMINAL_PRESETS.slice(0,3).map(n=><button key={n} className="h-10 rounded-lg border border-line text-xs font-semibold">{fmtShort(n)}</button>)}</div>
                  <Button variant={style==='cyan'?'cyan':'primary'} full size="md" icon={<Icons.Heart w={14} h={14}/>}>Donasi</Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ====================== Members ======================
function MembersPage(){
  const [showAdd, setShowAdd] = uS_mi(false);
  return (
    <div className="space-y-5">
      <PageHeader title="Members / User" subtitle={`${USERS.length} user · ${USERS.filter(u=>u.status==='active').length} aktif`}
        actions={<><Button variant="secondary" icon={<Icons.Filter w={16} h={16}/>}>Filter</Button><Button variant="primary" icon={<Icons.Plus w={16} h={16}/>} onClick={()=>setShowAdd(true)}>Tambah User</Button></>}/>

      <Card padded={false}>
        <div className="overflow-x-auto nice-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Last Login</th>
                <th className="px-5 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-slate-800">
              {USERS.map(u=>(
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} initials={u.initials} size={36}/>
                      <div className="font-semibold text-ink dark:text-slate-100">{u.name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{u.email}</td>
                  <td className="px-5 py-3"><RoleBadge role={u.role}/></td>
                  <td className="px-5 py-3"><StatusBadge status={u.status}/></td>
                  <td className="px-5 py-3 text-muted text-xs">{u.last}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"><Icons.Edit w={16} h={16}/></button>
                      <button className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center justify-center text-rose-500"><Icons.Trash w={16} h={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Permission matrix */}
      <Card>
        <div className="font-bold text-ink dark:text-slate-100 mb-1">Permission Matrix</div>
        <div className="text-xs text-muted mb-3">Akses per role</div>
        <div className="overflow-x-auto nice-scroll">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs text-muted uppercase tracking-wider">
                <th className="py-2 pr-3 font-semibold">Modul</th>
                <th className="py-2 px-3 font-semibold text-center">Admin</th>
                <th className="py-2 px-3 font-semibold text-center">CS</th>
                <th className="py-2 px-3 font-semibold text-center">Advertiser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-slate-800">
              {[
                ['Dashboard',[1,1,1]],
                ['Buat / Edit Campaign',[1,0,0]],
                ['Lihat Donatur & Invoice',[1,1,0]],
                ['Follow-up CS',[1,1,0]],
                ['Update Status Payment',[1,1,0]],
                ['Export Data Lengkap',[1,0,0]],
                ['Export Terbatas',[1,1,1]],
                ['Analytics & UTM',[1,0,1]],
                ['Pixel & Tracking',[1,0,1]],
                ['Manajemen User',[1,0,0]],
                ['Settings Sistem',[1,0,0]],
                ['Payment Method',[1,0,0]],
              ].map(([m,p],i)=>(
                <tr key={i}>
                  <td className="py-2.5 pr-3 font-medium text-ink dark:text-slate-100">{m}</td>
                  {p.map((v,j)=>(
                    <td key={j} className="py-2.5 px-3 text-center">
                      {v?<span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center"><Icons.Check w={12} h={12}/></span>:<span className="inline-flex w-5 h-5 rounded-full bg-slate-100 text-slate-400 items-center justify-center"><Icons.X w={12} h={12}/></span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showAdd} onClose={()=>setShowAdd(false)} maxW="max-w-md">
        <div className="p-6">
          <div className="font-bold text-lg text-ink dark:text-slate-100 mb-4">Tambah User Baru</div>
          <div className="space-y-3">
            <Field label="Nama lengkap" required><Input placeholder="Nama"/></Field>
            <Field label="Email" required><Input placeholder="email@niatbaik.org"/></Field>
            <Field label="Role" required>
              <Select><option>Admin</option><option>CS</option><option>Advertiser</option></Select>
            </Field>
            <Field label="Password sementara"><Input placeholder="Min. 8 karakter" type="password"/></Field>
            <Toggle checked label="Kirim email undangan" sub="User akan menerima link untuk set password"/>
          </div>
          <div className="mt-5 flex gap-2 justify-end">
            <Button variant="secondary" onClick={()=>setShowAdd(false)}>Batal</Button>
            <Button variant="primary">Tambah User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ====================== Profile ======================
function ProfilePage(){
  const { role } = useApp();
  const me = role==='Admin'?{name:'Admin Pusat',email:'admin@niatbaik.org',initials:'AP'}:role==='CS'?{name:'Sari Maharani',email:'sari@niatbaik.org',initials:'SM'}:{name:'Dimas Iklan',email:'dimas@niatbaik.org',initials:'DI'};
  return (
    <div className="space-y-5">
      <PageHeader title="Profile" subtitle="Kelola akun & keamanan"/>
      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <div className="flex flex-col items-center text-center">
            <Avatar name={me.name} initials={me.initials} size={88}/>
            <div className="mt-3 font-bold text-lg">{me.name}</div>
            <div className="text-sm text-muted">{me.email}</div>
            <div className="mt-2"><RoleBadge role={role}/></div>
            <Button variant="secondary" size="sm" className="mt-4" icon={<Icons.Upload w={14} h={14}/>}>Ganti Foto</Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="font-bold text-ink dark:text-slate-100 mb-3">Informasi Akun</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nama lengkap"><Input defaultValue={me.name}/></Field>
            <Field label="Email"><Input defaultValue={me.email}/></Field>
            <Field label="No. WhatsApp"><Input defaultValue="+62 811 1234 5678"/></Field>
            <Field label="Bahasa"><Select><option>Bahasa Indonesia</option><option>English</option></Select></Field>
          </div>
          <div className="mt-5 pt-5 border-t border-line">
            <div className="font-bold text-ink dark:text-slate-100 mb-3">Ubah Password</div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Password lama"><Input type="password" placeholder="••••••••"/></Field>
              <Field label="Password baru"><Input type="password" placeholder="Min. 8 karakter"/></Field>
              <Field label="Konfirmasi password"><Input type="password" placeholder="Ulang password baru"/></Field>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2"><Button variant="secondary">Batal</Button><Button variant="primary">Simpan Perubahan</Button></div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <div className="font-bold text-ink dark:text-slate-100 mb-3">Activity Log</div>
          <div className="space-y-3">
            {[
              ['baru saja','Mengubah status invoice INV-2026123','update'],
              ['1 jam lalu','Membuat campaign "Sahabat Sekolah"','create'],
              ['3 jam lalu','Export laporan transaksi (CSV)','export'],
              ['kemarin','Mengubah pengaturan Meta Pixel','settings'],
              ['2 hari lalu','Menambah fundraiser baru','create'],
            ].map(([t,a,k],i)=>(
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-line last:border-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${k==='update'?'bg-amber-100 text-amber-700':k==='create'?'bg-emerald-100 text-emerald-700':k==='export'?'bg-cyan2-100 text-cyan2-700':'bg-slate-100 text-slate-700'}`}>
                  {k==='update'?<Icons.Edit w={14} h={14}/>:k==='create'?<Icons.Plus w={14} h={14}/>:k==='export'?<Icons.Download w={14} h={14}/>:<Icons.Settings w={14} h={14}/>}
                </div>
                <div className="flex-1 text-sm">
                  <div className="text-ink dark:text-slate-100">{a}</div>
                  <div className="text-xs text-muted">{t}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="font-bold text-ink dark:text-slate-100 mb-3">Login History</div>
          <div className="space-y-3">
            {[
              ['Saat ini','Jakarta, ID','Chrome · macOS','aktif'],
              ['kemarin 09:21','Jakarta, ID','Chrome · macOS',''],
              ['2 hari lalu 14:08','Bandung, ID','Safari · iOS',''],
              ['1 minggu lalu','Jakarta, ID','Chrome · Windows',''],
            ].map(([t,loc,d,s],i)=>(
              <div key={i} className="flex items-center gap-3 pb-3 border-b border-line last:border-0">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center"><Icons.Globe w={16} h={16}/></div>
                <div className="flex-1 text-sm">
                  <div className="text-ink dark:text-slate-100">{loc} <span className="text-xs text-muted">· {d}</span></div>
                  <div className="text-xs text-muted">{t}</div>
                </div>
                {s==='aktif' && <Badge tone="green" dot>aktif</Badge>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ====================== Notification ======================
function NotificationPage(){
  return (
    <div className="space-y-5">
      <PageHeader title="Notification" subtitle="Pusat notifikasi sistem"
        actions={<><Button variant="secondary" size="md">Tandai semua dibaca</Button></>}/>
      <Card padded={false}>
        <div className="divide-y divide-line dark:divide-slate-800">
          {[...NOTIFICATIONS, ...NOTIFICATIONS, ...NOTIFICATIONS].map((n,i)=>(
            <div key={i} className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type==='donation'?'bg-emerald-100 text-emerald-700':n.type==='campaign'?'bg-brand-100 text-brand-700':n.type==='system'?'bg-amber-100 text-amber-700':'bg-cyan2-100 text-cyan2-700'}`}>
                {n.type==='donation'?<Icons.Heart w={18} h={18}/>:n.type==='campaign'?<Icons.Megaphone w={18} h={18}/>:n.type==='system'?<Icons.Pixel w={18} h={18}/>:<Icons.Users w={18} h={18}/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink dark:text-slate-100">{n.title}</div>
                <div className="text-sm text-muted">{n.sub}</div>
                <div className="text-xs text-muted mt-1">{n.ts}</div>
              </div>
              {i<3 && <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-2"/>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ====================== Trash ======================
function TrashPage(){
  return (
    <div className="space-y-5">
      <PageHeader title="Trash" subtitle="Data yang dihapus dalam 30 hari terakhir"
        actions={<Button variant="danger" icon={<Icons.Trash w={16} h={16}/>}>Hapus permanen semua</Button>}/>
      <Card padded={false} className="p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Input icon={<Icons.Search w={16} h={16}/>} placeholder="Cari…" className="flex-1 min-w-[200px]"/>
          <Select className="w-40"><option>Semua tipe</option><option>Campaign</option><option>User</option><option>Transaksi</option></Select>
          <DateRangePicker/>
        </div>
      </Card>
      <Card padded={false}>
        <div className="overflow-x-auto nice-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                <th className="px-5 py-3 font-semibold">Item</th>
                <th className="px-5 py-3 font-semibold">Tipe</th>
                <th className="px-5 py-3 font-semibold">Dihapus</th>
                <th className="px-5 py-3 font-semibold">Oleh</th>
                <th className="px-5 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-slate-800">
              {TRASH.map(t=>(
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.kind==='campaign'?'bg-brand-100 text-brand-700':t.kind==='user'?'bg-cyan2-100 text-cyan2-700':'bg-amber-100 text-amber-700'}`}>
                        {t.kind==='campaign'?<Icons.Megaphone w={16} h={16}/>:t.kind==='user'?<Icons.User w={16} h={16}/>:<Icons.Wallet w={16} h={16}/>}
                      </div>
                      <div className="font-semibold text-ink dark:text-slate-100">{t.title}</div>
                    </div>
                  </td>
                  <td className="px-5 py-3 capitalize"><Badge tone="slate">{t.kind}</Badge></td>
                  <td className="px-5 py-3 text-muted text-xs">{t.deleted}</td>
                  <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{t.by}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <Button variant="secondary" size="sm" icon={<Icons.Refresh w={14} h={14}/>}>Restore</Button>
                      <Button variant="danger" size="sm" icon={<Icons.Trash w={14} h={14}/>}>Hapus</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { FundraiserPage, ShortcodePage, MembersPage, ProfilePage, NotificationPage, TrashPage });

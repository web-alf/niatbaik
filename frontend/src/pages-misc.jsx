// Misc pages: Fundraiser, Shortcode, Members, Profile, Notification, Trash
const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR } = React;

// ====================== Fundraiser ======================
function FundraiserPage(){
  const { showToast } = useApp();
  const [tab, setTab] = uS('all');
  const [search, setSearch] = uS('');
  const [copiedId, setCopiedId] = uS(null);
  const [fundraisers, setFundraisers] = uS(FUNDRAISERS);
  const [stats, setStats] = uS({ total: TOTAL_FUNDRAISER, commission: 28_400_000, pending: 8_900_000, referral: 842_000_000 });

  uE(()=>{
    api.fundraisers().then(r => {
      if (r?.data) {
        setFundraisers(r.data);
        if (r.meta) setStats({ total: r.meta.total || r.data.length, commission: r.meta.total_commission || 28_400_000, pending: r.meta.pending_commission || 8_900_000, referral: r.meta.referral_amount || 842_000_000 });
      }
    }).catch(()=>{});
  }, []);

  const total = fundraisers.reduce((s, f) => s + (f.raised||0), 0);
  const totalComm = fundraisers.reduce((s, f) => s + (f.commission||0), 0);

  const filtered = uM(()=>{
    let list = fundraisers;
    if (tab !== 'all') list = list.filter(f => f.status === tab);
    if (search.trim()) list = list.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [fundraisers, tab, search]);

  const copyRef = (f) => {
    const url = 'https://niatbaik.org/r/' + f.ref;
    navigator.clipboard?.writeText(url);
    setCopiedId(f.id);
    showToast('Link referral disalin');
    setTimeout(()=>setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Fundraiser" subtitle="Mitra fundraiser yang mempromosikan campaign NIATBAIK.ORG."
        actions={<>
          <Btn variant="outline" tone="ink" icon="download">Export komisi</Btn>
          <Btn icon="plus">Undang Fundraiser</Btn>
        </>}/>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="handshake" label="Total Fundraiser" value={fmtNum(fundraisers.length)} accent="brand" sub="aktif bulan ini"/>
        <StatCard icon="wallet" label="Total Donasi (FR)" value={fmtIDRShort(total)} delta="+19.2%" accent="ok"/>
        <StatCard icon="creditcard" label="Total Komisi" value={fmtIDRShort(totalComm)} accent="sky" sub="10% dari raised"/>
        <StatCard icon="bolt" label="Pending Payout" value={fmtIDRShort(totalComm * 0.6)} accent="warn" sub="butuh diproses"/>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
            { value:'all', label:'Semua', count: fundraisers.length },
            { value:'pending', label:'Komisi Pending', count: fundraisers.filter(f => f.status==='pending').length },
            { value:'paid', label:'Komisi Paid', count: fundraisers.filter(f => f.status==='paid').length },
          ]}/>
          <div className="ml-auto flex items-center gap-2">
            <SearchInput placeholder="Cari nama fundraiser…" className="w-64" value={search} onChange={e=>setSearch(e.target?.value ?? e)}/>
            <Select value="all" onChange={()=>{}} icon="filter" options={[{value:'all', label:'Semua campaign'}, ...CAMPAIGNS.map(c=>({value:c.slug||c.id, label:c.title}))]}/>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-mute dark:text-slate-400 border-b border-line dark:border-slate-700 bg-bg2/60 dark:bg-slate-800/60">
              <th className="px-5 py-3 font-semibold">Fundraiser</th>
              <th className="py-3 font-semibold">Campaign</th>
              <th className="py-3 font-semibold">Transaksi</th>
              <th className="py-3 font-semibold">Terkumpul</th>
              <th className="py-3 font-semibold">Komisi</th>
              <th className="py-3 font-semibold">Status</th>
              <th className="py-3 font-semibold">Referral Link</th>
              <th className="pr-5 py-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.id} className="border-b border-line dark:border-slate-700 last:border-0 hover:bg-bg2/60 dark:hover:bg-slate-800/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                      {f.name.split(' ').map(s=>s[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="font-semibold text-ink dark:text-slate-100">{f.name}</div>
                      <div className="text-[11px] text-mute dark:text-slate-400">{f.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-ink/90 dark:text-slate-200 max-w-[200px] truncate">{f.campaign}</td>
                <td className="py-3 tnum">{fmtNum(f.txn || f.tx || 0)}</td>
                <td className="py-3 font-bold text-ink dark:text-slate-100 tnum">{fmtIDRShort(f.raised)}</td>
                <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400 tnum">{fmtIDRShort(f.commission)}</td>
                <td className="py-3"><StatusBadge status={f.status}/></td>
                <td className="py-3">
                  <button onClick={()=>copyRef(f)} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg2 dark:bg-slate-800 border border-line dark:border-slate-700 text-xs font-mono text-ink dark:text-slate-100 hover:bg-white dark:hover:bg-slate-700">
                    niatbaik.org/r/{f.ref}
                    <Icon name={copiedId===f.id ? 'check' : 'copy'} size={12} className={copiedId===f.id ? 'text-emerald-600' : ''}/>
                  </button>
                </td>
                <td className="pr-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={()=>showToast('Detail fundraiser '+f.name)} className="h-8 w-8 rounded-md hover:bg-bg2 dark:hover:bg-slate-800 text-mute dark:text-slate-400 hover:text-ink dark:hover:text-slate-100" title="Lihat detail"><Icon name="eye" size={16}/></button>
                    <button onClick={()=>showToast(f.status==='pending'?'Proses payout untuk '+f.name:'Sudah dibayar')} className="h-8 w-8 rounded-md hover:bg-bg2 dark:hover:bg-slate-800 text-mute dark:text-slate-400 hover:text-ink dark:hover:text-slate-100" title="Payout"><Icon name="wallet" size={16}/></button>
                    <button onClick={()=>showToast('Menu lainnya')} className="h-8 w-8 rounded-md hover:bg-bg2 dark:hover:bg-slate-800 text-mute dark:text-slate-400 hover:text-ink dark:hover:text-slate-100" title="Lainnya"><Icon name="more" size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-ink dark:text-slate-100">Riwayat Komisi Terbaru</div>
          <Btn size="sm" variant="ghost" tone="ink" iconRight="arrowR">Lihat semua</Btn>
        </div>
        <div className="space-y-2">
          {fundraisers.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg2 dark:hover:bg-slate-800">
              <div className={`h-8 w-8 rounded-md flex items-center justify-center ${f.status==='paid' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                <Icon name={f.status==='paid' ? 'check' : 'refresh'} size={14}/>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink dark:text-slate-100">{f.name} · komisi {fmtIDRShort(f.commission)}</div>
                <div className="text-xs text-mute dark:text-slate-400">Periode 1–31 Mei 2026 · {f.campaign}</div>
              </div>
              <StatusBadge status={f.status}/>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ====================== Shortcode ======================
function ShortcodePage(){
  const { showToast } = useApp();
  const [type, setType] = uS('button');
  const [campaign, setCampaign] = uS(CAMPAIGNS[0]?.slug || CAMPAIGNS[0]?.id || '');
  const [btnStyle, setBtnStyle] = uS('solid');
  const [btnColor, setBtnColor] = uS('brand');
  const [label, setLabel] = uS('Donasi Sekarang');
  const [copied, setCopied] = uS(false);

  const c = CAMPAIGNS.find(x => (x.slug||x.id) === campaign) || CAMPAIGNS[0];

  const codes = {
    button: `<a href="https://niatbaik.org/c/${campaign}?utm_source=embed" class="nb-btn nb-${btnColor}">${label}</a>\n<script src="https://niatbaik.org/embed.js"></script>`,
    form: `<div class="nb-embed-form" data-campaign="${campaign}"></div>\n<script src="https://niatbaik.org/embed.js"></script>`,
    campaign: `<iframe src="https://niatbaik.org/embed/c/${campaign}" width="100%" height="640" frameborder="0"></iframe>`,
  };

  const copy = () => {
    navigator.clipboard?.writeText(codes[type]);
    setCopied(true);
    showToast('Shortcode disalin ke clipboard');
    setTimeout(()=>setCopied(false), 1500);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Shortcode" subtitle="Embed campaign, form donasi, atau tombol donasi di website / blog Anda."/>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: config */}
        <Card className="lg:col-span-2 p-5 space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-mute dark:text-slate-400 mb-2">Tipe Embed</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v:'button', label:'Tombol', icon:'bolt', desc:'Cocok untuk CTA' },
                { v:'form', label:'Form', icon:'edit', desc:'Form donasi lengkap' },
                { v:'campaign', label:'Campaign', icon:'megaphone', desc:'Halaman campaign penuh' },
              ].map(o => (
                <button key={o.v} onClick={()=>setType(o.v)}
                  className={`p-3 rounded-xl border text-left transition-colors ${type===o.v ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 ring-2 ring-brand-600/20' : 'border-line dark:border-slate-700 hover:bg-bg2 dark:hover:bg-slate-800'}`}>
                  <Icon name={o.icon} size={18} className={type===o.v ? 'text-brand-600 dark:text-brand-400' : 'text-mute dark:text-slate-400'}/>
                  <div className={'mt-2 font-bold text-sm ' + (type===o.v ? 'text-brand-700 dark:text-brand-300' : 'text-ink dark:text-slate-100')}>{o.label}</div>
                  <div className="text-[10px] text-mute dark:text-slate-400 leading-tight mt-0.5">{o.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-mute dark:text-slate-400 mb-2">Campaign Tujuan</div>
            <Select value={campaign} onChange={setCampaign} options={CAMPAIGNS.map(x => ({ value: x.slug||x.id, label: x.title }))}/>
          </div>

          {type === 'button' && (
            <>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-mute dark:text-slate-400 mb-2">Label Tombol</div>
                <input value={label} onChange={e=>setLabel(e.target.value)} className="field"/>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-mute dark:text-slate-400 mb-2">Style</div>
                <div className="grid grid-cols-3 gap-2">
                  {['solid','outline','ghost'].map(s => (
                    <button key={s} onClick={()=>setBtnStyle(s)}
                      className={`py-2 rounded-lg text-xs font-bold capitalize border ${btnStyle===s ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'border-line dark:border-slate-700 text-ink dark:text-slate-100 hover:bg-bg2 dark:hover:bg-slate-800'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-mute dark:text-slate-400 mb-2">Warna</div>
                <div className="flex gap-2">
                  {[
                    { v:'brand', cls:'bg-brand-600' },
                    { v:'sky', cls:'bg-sky2-400' },
                    { v:'ok', cls:'bg-emerald-600' },
                    { v:'warn', cls:'bg-amber-500' },
                    { v:'bad', cls:'bg-rose-600' },
                    { v:'ink', cls:'bg-ink' },
                  ].map(o => (
                    <button key={o.v} onClick={()=>setBtnColor(o.v)}
                      className={`h-9 w-9 rounded-lg ${o.cls} ${btnColor===o.v ? 'ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-brand-600' : ''}`}/>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="rounded-xl border border-line dark:border-slate-700 bg-bg2 dark:bg-slate-800 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-mute dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Icon name="shield" size={12} className="text-emerald-600 dark:text-emerald-400"/> Tracking otomatis
            </div>
            <div className="text-xs text-ink/80 dark:text-slate-300">UTM source & medium akan dikirim otomatis. Pixel Meta, Google, TikTok yang aktif di Settings akan ditembakkan saat donasi sukses.</div>
          </div>
        </Card>

        {/* Right: preview + code */}
        <div className="lg:col-span-3 space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-mute dark:text-slate-400">Preview</div>
              <Badge tone="ok" dot>Live data</Badge>
            </div>
            <div className="rounded-xl bg-bg2 dark:bg-slate-800 border border-dashed border-line dark:border-slate-700 min-h-[280px] p-6 flex items-center justify-center">
              {type === 'button' && (
                <button className={`px-6 py-3 rounded-xl font-bold transition-all text-base shadow-card ${
                  btnStyle === 'solid' ? 'bg-brand-600 text-white hover:bg-brand-700' :
                  btnStyle === 'outline' ? 'border-2 border-brand-600 text-brand-600 bg-white dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-brand-900/30' :
                  'text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 bg-white dark:bg-slate-900 border border-transparent'
                }`} style={btnColor !== 'brand' ? {
                  background: btnStyle==='solid' ? ({sky:'#38B6FF',ok:'#16A34A',warn:'#F59E0B',bad:'#DC2626',ink:'#1E293B'}[btnColor]) : undefined,
                  color: btnStyle!=='solid' ? ({sky:'#0E89CC',ok:'#16A34A',warn:'#B45309',bad:'#DC2626',ink:'#1E293B'}[btnColor]) : undefined,
                  borderColor: btnStyle==='outline' ? ({sky:'#38B6FF',ok:'#16A34A',warn:'#F59E0B',bad:'#DC2626',ink:'#1E293B'}[btnColor]) : undefined,
                } : {}}>
                  <span className="inline-flex items-center gap-2"><Icon name="heart" size={18}/> {label}</span>
                </button>
              )}
              {type === 'form' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-700 p-5 w-full max-w-sm">
                  <div className="text-xs font-bold uppercase text-mute dark:text-slate-400">{c?.category}</div>
                  <div className="font-bold text-ink dark:text-slate-100 mt-1 line-clamp-2">{c?.title}</div>
                  <Progress value={c?.raised || 0} max={c?.target || 1} height="h-1.5"/>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[50_000, 100_000, 250_000].map(p => (
                      <button key={p} className="py-1.5 rounded-md border border-line dark:border-slate-700 text-xs font-bold dark:text-slate-100">{fmtIDRShort(p)}</button>
                    ))}
                  </div>
                  <Btn size="md" className="w-full mt-3" icon="heart">Donasi Sekarang</Btn>
                </div>
              )}
              {type === 'campaign' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-line dark:border-slate-700 w-full max-w-md overflow-hidden">
                  <div className="aspect-[16/9]" style={{background: c?.thumb}}>
                    <div className="h-full flex items-center justify-center text-white/80"><Icon name={c?.icon || 'heart'} size={50}/></div>
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-ink dark:text-slate-100 line-clamp-2">{c?.title}</div>
                    <div className="mt-2"><Progress value={c?.raised} max={c?.target} height="h-1.5"/></div>
                    <div className="mt-1 flex justify-between text-xs"><span className="text-brand-600 dark:text-brand-400 font-bold">{fmtIDRShort(c?.raised)}</span><span className="text-mute dark:text-slate-400">dari {fmtIDRShort(c?.target)}</span></div>
                    <Btn className="w-full mt-2" size="sm" icon="heart">Donasi</Btn>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-mute dark:text-slate-400">Kode Embed</div>
              <Btn size="sm" tone="ink" variant="outline" icon={copied ? 'check' : 'copy'} onClick={copy}>{copied ? 'Tersalin' : 'Salin Code'}</Btn>
            </div>
            <pre className="rounded-xl bg-ink text-emerald-300 text-xs font-mono p-4 overflow-x-auto leading-relaxed">{codes[type]}</pre>
            <div className="mt-3 text-xs text-mute dark:text-slate-400">
              Pasang di tag <code className="bg-bg2 dark:bg-slate-800 px-1 rounded">&lt;body&gt;</code> halaman Anda.
              Script akan otomatis menjalankan tracking pixel & responsive layout.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ====================== Members ======================
function MembersPage(){
  const { showToast } = useApp();
  const [tab, setTab] = uS('all');
  const [search, setSearch] = uS('');
  const [showAdd, setShowAdd] = uS(false);
  const [users, setUsers] = uS(USERS);
  const [newName, setNewName] = uS('');
  const [newEmail, setNewEmail] = uS('');
  const [newRole, setNewRole] = uS('Admin');
  const [newPassword, setNewPassword] = uS('');

  const refreshUsers = () => api.users().then(r => r?.data && setUsers(r.data)).catch(()=>{});
  uE(()=>{ refreshUsers(); }, []);

  const filtered = uM(()=>{
    let list = users;
    if (tab !== 'all') list = list.filter(m => m.role === tab);
    if (search.trim()) list = list.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || (m.email||'').toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [users, tab, search]);

  const handleAddUser = async () => {
    if (!newName.trim() || !newEmail.trim()) { showToast('Nama dan email wajib diisi'); return; }
    try {
      const res = await api.createUser({ name: newName, email: newEmail, role: newRole, password: newPassword });
      if (res?.success || res?.data) {
        setShowAdd(false); setNewName(''); setNewEmail(''); setNewRole('Admin'); setNewPassword('');
        refreshUsers(); showToast('User berhasil ditambah');
      } else showToast(res?.message || 'Gagal menambah user');
    } catch(e) { showToast('Error: ' + e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Nonaktifkan user ini?')) return;
    try {
      const res = await api.updateUser(id, { status: 'inactive' });
      if (res?.success || res?.data) { refreshUsers(); showToast('User dinonaktifkan'); }
      else showToast(res?.message || 'Gagal menonaktifkan user');
    } catch(e) { showToast('Error: ' + e.message); }
  };

  const permMatrix = [
    { p:'Dashboard', a:1, c:1, ad:1 },
    { p:'Kelola Campaign', a:1, c:0, ad:0 },
    { p:'Publish/Edit Campaign', a:1, c:0, ad:0 },
    { p:'Lihat Transaksi', a:1, c:1, ad:1 },
    { p:'Lihat data sensitif donatur (full)', a:1, c:1, ad:0 },
    { p:'Update status invoice', a:1, c:1, ad:0 },
    { p:'Kirim follow-up WA', a:1, c:1, ad:0 },
    { p:'Kelola Payment Method', a:1, c:0, ad:0 },
    { p:'Akses Analytics & UTM', a:1, c:0, ad:1 },
    { p:'Manage Tracking Pixel', a:1, c:0, ad:1 },
    { p:'Export full data', a:1, c:0, ad:0 },
    { p:'Export terbatas (CSV ringkas)', a:1, c:1, ad:1 },
    { p:'Kelola Members & Role', a:1, c:0, ad:0 },
    { p:'Akses Trash & Restore', a:1, c:0, ad:0 },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Members / User" subtitle="Tim NIATBAIK.ORG · Admin, CS, dan Advertiser."
        actions={<>
          <Btn variant="outline" tone="ink" icon="download">Export</Btn>
          <Btn icon="plus" onClick={()=>setShowAdd(true)}>Add User</Btn>
        </>}/>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
            { value:'all', label:'Semua', count: users.length },
            { value:'Admin', label:'Admin', count: users.filter(m=>m.role==='Admin').length },
            { value:'CS', label:'CS', count: users.filter(m=>m.role==='CS').length },
            { value:'Advertiser', label:'Advertiser', count: users.filter(m=>m.role==='Advertiser').length },
          ]}/>
          <div className="ml-auto"><SearchInput placeholder="Cari nama / email…" className="w-64" value={search} onChange={e=>setSearch(e.target?.value ?? e)}/></div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-mute dark:text-slate-400 border-b border-line dark:border-slate-700 bg-bg2/60 dark:bg-slate-800/60">
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="py-3 font-semibold">Role</th>
              <th className="py-3 font-semibold">Status</th>
              <th className="py-3 font-semibold">Last Login</th>
              <th className="pr-5 py-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-b border-line dark:border-slate-700 last:border-0 hover:bg-bg2/60 dark:hover:bg-slate-800/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full text-white font-bold text-xs flex items-center justify-center ${m.role==='Admin' ? 'bg-brand-600' : m.role==='CS' ? 'bg-sky2-500' : 'bg-violet-600'}`}>
                      {(m.initials || m.name.split(' ').map(s=>s[0]).join('').slice(0,2))}
                    </div>
                    <div>
                      <div className="font-semibold text-ink dark:text-slate-100">{m.name}</div>
                      <div className="text-xs text-mute dark:text-slate-400">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3"><RoleBadge role={m.role}/></td>
                <td className="py-3"><StatusBadge status={m.status}/></td>
                <td className="py-3 text-mute dark:text-slate-400">{m.lastLogin || m.last}</td>
                <td className="pr-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={()=>showToast('Edit: ' + m.name)} className="h-8 w-8 rounded-md hover:bg-bg2 dark:hover:bg-slate-800 text-mute dark:text-slate-400 hover:text-ink dark:hover:text-slate-100"><Icon name="edit" size={16}/></button>
                    <button className="h-8 w-8 rounded-md hover:bg-bg2 dark:hover:bg-slate-800 text-mute dark:text-slate-400 hover:text-ink dark:hover:text-slate-100"><Icon name="shield" size={16}/></button>
                    <button onClick={()=>handleDelete(m.id)} className="h-8 w-8 rounded-md hover:bg-bg2 dark:hover:bg-slate-800 text-mute dark:text-slate-400 hover:text-rose-600"><Icon name="trash" size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Permission matrix */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-ink dark:text-slate-100">Permission Matrix</div>
            <div className="text-xs text-mute dark:text-slate-400 mt-0.5">Akses per role · klik untuk mengubah.</div>
          </div>
          <Btn size="sm" variant="ghost" tone="ink" icon="edit">Edit permissions</Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-mute dark:text-slate-400">
                <th className="py-2 font-semibold">Permission</th>
                <th className="py-2 font-semibold text-center">Admin</th>
                <th className="py-2 font-semibold text-center">CS</th>
                <th className="py-2 font-semibold text-center">Advertiser</th>
              </tr>
            </thead>
            <tbody>
              {permMatrix.map((r, i) => (
                <tr key={i} className="border-t border-line dark:border-slate-700">
                  <td className="py-2.5 text-ink dark:text-slate-100 font-medium">{r.p}</td>
                  {[r.a, r.c, r.ad].map((v, j) => (
                    <td key={j} className="py-2.5 text-center">
                      {v ? <span className="inline-flex h-6 w-6 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 items-center justify-center"><Icon name="check" size={14} strokeWidth={2.5}/></span>
                         : <span className="inline-flex h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 items-center justify-center"><Icon name="close" size={14}/></span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Tambah User Baru" size="md"
        footer={<><Btn variant="outline" tone="ink" onClick={()=>setShowAdd(false)}>Batal</Btn><Btn onClick={handleAddUser}>Kirim Undangan</Btn></>}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-mute dark:text-slate-400">Nama lengkap</label>
            <input className="field mt-1" placeholder="Nama user" value={newName} onChange={e=>setNewName(e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute dark:text-slate-400">Email</label>
            <input className="field mt-1" placeholder="email@niatbaik.org" value={newEmail} onChange={e=>setNewEmail(e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute dark:text-slate-400">Role</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {['Admin','CS','Advertiser'].map(r => (
                <button key={r} onClick={()=>setNewRole(r)}
                  className={`py-2 rounded-lg border text-sm font-bold ${newRole===r ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'border-line dark:border-slate-700 hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-300 dark:text-slate-100'}`}>{r}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute dark:text-slate-400">Password sementara</label>
            <input className="field mt-1" placeholder="Min. 8 karakter" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/>
          </div>
          <Toggle checked label="Kirim email undangan" sub="User akan menerima link untuk set password"/>
        </div>
      </Modal>
    </div>
  );
}

// ====================== Profile helpers ======================
function ProfileField({ label, editing, value, display, onChange, error, type='text', placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold text-mute dark:text-slate-400">{label}</label>
      {editing ? (
        <>
          <input type={type} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={`field mt-1 ${error ? 'border-rose-400 ring-2 ring-rose-300/30' : ''}`}/>
          {error && <div className="text-[11px] text-rose-600 font-semibold mt-1">{error}</div>}
        </>
      ) : (
        <div className="mt-1 h-10 px-3 rounded-lg border border-line dark:border-slate-700 bg-bg2 dark:bg-slate-800 text-sm font-semibold text-ink dark:text-slate-100 flex items-center">
          {display || '—'}
        </div>
      )}
    </div>
  );
}

function PasswordField({ label, value, onChange, error, show, onToggle }) {
  return (
    <div>
      <label className="text-xs font-semibold text-mute dark:text-slate-400">{label}</label>
      <div className="mt-1 relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          className={`field pr-9 ${error ? 'border-rose-400 ring-2 ring-rose-300/30' : ''}`}
          placeholder="••••••••"/>
        <button type="button" onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-bg2 dark:hover:bg-slate-800 flex items-center justify-center text-mute dark:text-slate-400">
          <Icon name="eye" size={13}/>
        </button>
      </div>
      {error && <div className="text-[11px] text-rose-600 font-semibold mt-1">{error}</div>}
    </div>
  );
}

// ====================== Profile ======================
function ProfilePage(){
  const { role, user, logout, updateUser, showToast } = useApp();

  const defaults = {
    Admin:      { wa: '+62 812 3456 7890', joined: '12 Jan 2025' },
    CS:         { wa: '+62 813 9876 5432', joined: '08 Mar 2025' },
    Advertiser: { wa: '+62 821 5566 7788', joined: '21 Apr 2025' },
  };
  const meBase = user || { name:'-', email:'-', role: role, initial:'??' };
  const fb = defaults[role] || defaults.Admin;
  const display = {
    name:   meBase.name,
    email:  meBase.email,
    wa:     meBase.wa || fb.wa,
    avatar: meBase.avatar || null,
    joined: meBase.joined || fb.joined,
    initial: meBase.initial || (meBase.name||'?').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase(),
  };

  const [editing, setEditing] = uS(false);
  const [form, setForm] = uS({ name: display.name, email: display.email, wa: display.wa, avatar: display.avatar });
  const [errors, setErrors] = uS({});
  const [saving, setSaving] = uS(false);
  const fileRef = uR();

  uE(()=>{
    if (!editing) setForm({ name: display.name, email: display.email, wa: display.wa, avatar: display.avatar });
  }, [editing, user?.email]);

  uE(()=>{
    api.profile().then(r => {
      if (r?.data && updateUser) updateUser(r.data);
    }).catch(()=>{});
  }, []);

  const initialsFrom = n => (n||'').split(' ').map(s=>s[0]).filter(Boolean).slice(0,2).join('').toUpperCase() || '??';

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nama wajib diisi';
    else if (form.name.trim().length < 3) e.name = 'Minimal 3 karakter';
    if (!form.email.trim()) e.email = 'Email wajib diisi';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = 'Format email tidak valid';
    if (!form.wa.trim()) e.wa = 'No. WhatsApp wajib diisi';
    else if (form.wa.replace(/\D/g,'').length < 9) e.wa = 'No. WhatsApp tidak valid';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) { showToast('Periksa kembali isian Anda'); return; }
    setSaving(true);
    try {
      const res = await api.updateProfile({ name: form.name.trim(), email: form.email.trim(), wa: form.wa.trim() });
      if ((res?.success || res?.data) && updateUser) {
        updateUser({ name: form.name.trim(), email: form.email.trim(), wa: form.wa.trim(), avatar: form.avatar, initial: initialsFrom(form.name) });
      }
      setSaving(false); setEditing(false);
      showToast('Profil berhasil disimpan');
    } catch(e) {
      setSaving(false);
      showToast('Error: ' + e.message);
    }
  };

  const cancel = () => {
    setForm({ name: display.name, email: display.email, wa: display.wa, avatar: display.avatar });
    setErrors({});
    setEditing(false);
  };

  const pickAvatar = file => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('File harus berupa gambar'); return; }
    if (file.size > 2 * 1024 * 1024) { showToast('Ukuran maks 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = e => setForm(f => ({ ...f, avatar: e.target.result }));
    reader.readAsDataURL(file);
  };

  // Password
  const [pwd, setPwd] = uS({ old: '', neu: '', con: '' });
  const [pwdErrors, setPwdErrors] = uS({});
  const [pwdShow, setPwdShow] = uS({ old:false, neu:false, con:false });

  const pwdStrength = uM(()=>{
    const p = pwd.neu;
    if (!p) return { score: 0, label: '—', color: 'bg-slate-200 dark:bg-slate-700' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const labels = ['Sangat lemah','Lemah','Cukup','Bagus','Kuat','Sangat kuat'];
    const colors = ['bg-rose-400','bg-rose-400','bg-amber-400','bg-yellow-400','bg-emerald-400','bg-emerald-600'];
    return { score, label: labels[score], color: colors[score] };
  }, [pwd.neu]);

  const updatePassword = async () => {
    const e = {};
    if (!pwd.old) e.old = 'Password lama wajib diisi';
    if (!pwd.neu) e.neu = 'Password baru wajib diisi';
    else if (pwd.neu.length < 8) e.neu = 'Minimal 8 karakter';
    else if (pwdStrength.score < 3) e.neu = 'Password terlalu lemah';
    if (!pwd.con) e.con = 'Konfirmasi password wajib diisi';
    else if (pwd.con !== pwd.neu) e.con = 'Konfirmasi tidak cocok';
    setPwdErrors(e);
    if (Object.keys(e).length > 0) { showToast('Periksa kembali password Anda'); return; }
    try {
      const res = await api.changePassword({ current_password: pwd.old, new_password: pwd.neu, password_confirm: pwd.con });
      if (res?.success || res?.data) {
        setPwd({ old:'', neu:'', con:'' });
        showToast('Password berhasil diubah');
      } else showToast(res?.message || 'Gagal mengubah password');
    } catch(err) { showToast('Error: ' + err.message); }
  };

  const avatarBgClass = role==='Admin' ? 'bg-brand-600' : role==='CS' ? 'bg-sky2-500' : 'bg-violet-600';

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" subtitle="Akun & aktivitas Anda."
        actions={editing ? (
          <>
            <Btn variant="outline" tone="ink" onClick={cancel}>Batal</Btn>
            <Btn icon="check" onClick={save} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan Perubahan'}</Btn>
          </>
        ) : (
          <Btn variant="outline" tone="ink" icon="edit" onClick={()=>setEditing(true)}>Edit Profile</Btn>
        )}/>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6 text-center lg:col-span-1">
          {/* Avatar */}
          <div className="relative inline-block">
            {(editing ? form.avatar : display.avatar) ? (
              <img src={editing ? form.avatar : display.avatar} alt={display.name}
                className="mx-auto h-24 w-24 rounded-3xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-card"/>
            ) : (
              <div className={`mx-auto h-24 w-24 rounded-3xl text-white font-bold text-3xl flex items-center justify-center ${avatarBgClass}`}>
                {editing ? initialsFrom(form.name) : display.initial}
              </div>
            )}
            {editing && (
              <>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => pickAvatar(e.target.files?.[0])}/>
                <button onClick={()=>fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-brand-600 hover:bg-brand-700 text-white border-4 border-white dark:border-slate-900 shadow-pop flex items-center justify-center transition-colors"
                  title="Ganti foto">
                  <Icon name="upload" size={14}/>
                </button>
                {form.avatar && (
                  <button onClick={()=>setForm({...form, avatar:null})}
                    className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white border-2 border-white dark:border-slate-900 shadow flex items-center justify-center"
                    title="Hapus foto">
                    <Icon name="close" size={12} strokeWidth={2.4}/>
                  </button>
                )}
              </>
            )}
          </div>
          <div className="mt-3 font-bold text-lg text-ink dark:text-slate-100">{editing ? (form.name || 'Nama…') : display.name}</div>
          <div className="text-sm text-mute dark:text-slate-400">{editing ? form.email : display.email}</div>
          <div className="mt-2 flex justify-center"><RoleBadge role={role}/></div>
          {editing && <div className="mt-3 text-[11px] text-mute dark:text-slate-400">JPG / PNG · maks 2 MB</div>}

          <div className="mt-5 flex gap-2 justify-center">
            {!editing && <Btn size="sm" variant="outline" tone="ink" icon="edit" onClick={()=>setEditing(true)}>Edit Profile</Btn>}
            {logout && <Btn size="sm" variant="ghost" tone="bad" icon="logout" onClick={logout}>Sign Out</Btn>}
          </div>

          <div className="mt-6 pt-5 border-t border-line dark:border-slate-700 text-left space-y-3">
            <div className="text-xs uppercase font-semibold text-mute dark:text-slate-400">Statistik</div>
            <div className="flex justify-between text-sm"><span className="text-mute dark:text-slate-400">Total tindakan</span><span className="font-bold text-ink dark:text-slate-100">2.418</span></div>
            <div className="flex justify-between text-sm"><span className="text-mute dark:text-slate-400">Sejak bergabung</span><span className="font-bold text-ink dark:text-slate-100">{display.joined}</span></div>
            <div className="flex justify-between text-sm"><span className="text-mute dark:text-slate-400">Login terakhir</span><span className="font-bold text-ink dark:text-slate-100">baru saja · Chrome / macOS</span></div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-ink dark:text-slate-100">Informasi Akun</div>
                <div className="text-xs text-mute dark:text-slate-400 mt-0.5">{editing ? 'Mode edit aktif — ubah lalu Simpan Perubahan.' : 'Klik "Edit Profile" untuk mengubah data.'}</div>
              </div>
              {!editing && (
                <button onClick={()=>setEditing(true)} className="text-xs font-bold text-brand-600 hover:underline inline-flex items-center gap-1">
                  <Icon name="edit" size={12}/> Ubah data
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <ProfileField label="Nama lengkap" editing={editing} value={form.name} display={display.name}
                onChange={v => setForm({...form, name:v})} error={errors.name}/>
              <ProfileField label="Email" type="email" editing={editing} value={form.email} display={display.email}
                onChange={v => setForm({...form, email:v})} error={errors.email}/>
              <ProfileField label="No. WhatsApp" editing={editing} value={form.wa} display={display.wa}
                onChange={v => setForm({...form, wa:v})} error={errors.wa} placeholder="+62 812 …"/>
              <div>
                <label className="text-xs font-semibold text-mute dark:text-slate-400">Role</label>
                <div className="mt-1 h-10 px-3 rounded-lg border border-line dark:border-slate-700 bg-bg2 dark:bg-slate-800 text-sm font-semibold text-ink dark:text-slate-100 flex items-center justify-between">
                  <span>{role}</span>
                  <Icon name="shield" size={14} className="text-mute dark:text-slate-400" title="Role tidak dapat diubah dari sini"/>
                </div>
                <div className="text-[10px] text-mute dark:text-slate-400 mt-1">Hanya dapat diubah oleh Admin di Members / User.</div>
              </div>
            </div>
            {editing && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Btn size="md" icon="check" onClick={save} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan Perubahan'}</Btn>
                <Btn size="md" variant="outline" tone="ink" onClick={cancel}>Batal</Btn>
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-line dark:border-slate-700">
            <div className="font-bold text-ink dark:text-slate-100">Ubah Password</div>
            <div className="text-xs text-mute dark:text-slate-400 mt-0.5">Gunakan kombinasi huruf, angka, dan simbol. Min 8 karakter.</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <PasswordField label="Password lama" value={pwd.old} show={pwdShow.old}
                onToggle={()=>setPwdShow({...pwdShow, old:!pwdShow.old})}
                onChange={v=>setPwd({...pwd, old:v})} error={pwdErrors.old}/>
              <div className="hidden sm:block"/>
              <PasswordField label="Password baru" value={pwd.neu} show={pwdShow.neu}
                onToggle={()=>setPwdShow({...pwdShow, neu:!pwdShow.neu})}
                onChange={v=>setPwd({...pwd, neu:v})} error={pwdErrors.neu}/>
              <PasswordField label="Konfirmasi password" value={pwd.con} show={pwdShow.con}
                onToggle={()=>setPwdShow({...pwdShow, con:!pwdShow.con})}
                onChange={v=>setPwd({...pwd, con:v})} error={pwdErrors.con}/>
            </div>

            {pwd.neu && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-mute dark:text-slate-400">Kekuatan password</span>
                  <span className="font-bold text-ink dark:text-slate-100">{pwdStrength.label}</span>
                </div>
                <div className="mt-1 grid grid-cols-5 gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-1.5 rounded-full ${i <= pwdStrength.score ? pwdStrength.color : 'bg-slate-100 dark:bg-slate-800'}`}/>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <Btn size="md" variant="outline" tone="ink" icon="shield" onClick={updatePassword}>Update Password</Btn>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-ink dark:text-slate-100">Activity Log</div>
            <div className="text-xs text-mute dark:text-slate-400">30 aktivitas terakhir</div>
          </div>
          <Btn size="sm" variant="ghost" tone="ink" icon="download">Export log</Btn>
        </div>
        <div className="space-y-2">
          {[
            { t:'Update status invoice INV-20251123 → Paid', when:'baru saja', icon:'check', tone:'ok' },
            { t:'Kirim follow-up WhatsApp ke +62812-3456-7890', when:'5 menit lalu', icon:'wa', tone:'sky' },
            { t:'Publish campaign "Wakaf Quran untuk Pesantren Pelosok"', when:'1 jam lalu', icon:'megaphone', tone:'brand' },
            { t:'Export CSV transaksi (1–18 Mei 2026)', when:'2 jam lalu', icon:'download', tone:'slate' },
            { t:'Tambah pixel Meta · PXL-928374', when:'kemarin', icon:'pixel', tone:'purple' },
            { t:'Login dari Chrome · macOS · IP 36.84.xx.xx', when:'kemarin', icon:'shield', tone:'ok' },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg2 dark:hover:bg-slate-800">
              <div className={`h-8 w-8 rounded-md flex items-center justify-center ${
                a.tone==='ok'?'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400':
                a.tone==='sky'?'bg-sky2-50 dark:bg-sky-900/30 text-sky2-500 dark:text-sky-400':
                a.tone==='brand'?'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400':
                a.tone==='purple'?'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400':
                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                <Icon name={a.icon} size={14}/>
              </div>
              <div className="flex-1 text-sm text-ink dark:text-slate-100">{a.t}</div>
              <div className="text-xs text-mute dark:text-slate-400">{a.when}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-ink dark:text-slate-100">Login History</div>
          <Badge tone="ok" dot>5 sesi aktif</Badge>
        </div>
        <div className="space-y-2">
          {[
            { d:'Chrome · macOS Sonoma', ip:'36.84.182.21 · Jakarta, ID', when:'baru saja', current:true },
            { d:'Safari · iPhone 15', ip:'114.10.55.7 · Jakarta, ID', when:'2 jam lalu' },
            { d:'Chrome · Windows 11', ip:'180.244.8.92 · Bandung, ID', when:'kemarin' },
            { d:'Edge · Windows 10', ip:'202.43.144.10 · Surabaya, ID', when:'3 hari lalu' },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-line dark:border-slate-700">
              <div className="h-8 w-8 rounded-md bg-bg2 dark:bg-slate-800 text-mute dark:text-slate-400 flex items-center justify-center"><Icon name="globe" size={14}/></div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink dark:text-slate-100 flex items-center gap-2">{l.d} {l.current && <Badge tone="ok" size="sm" dot>Aktif</Badge>}</div>
                <div className="text-xs text-mute dark:text-slate-400">{l.ip}</div>
              </div>
              <div className="text-xs text-mute dark:text-slate-400">{l.when}</div>
              {!l.current && <Btn size="sm" variant="ghost" tone="bad">Logout</Btn>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ====================== Notification ======================
function NotificationPage(){
  const { showToast } = useApp();
  const [tab, setTab] = uS('all');

  const seedItems = [
    { id:1, icon:'heart', tone:'ok', title:'Donasi baru diterima', body:'Hamba Allah berdonasi Rp 1.000.000 untuk "Bantuan Aira"', when:'baru saja', unread:true, type:'donation' },
    { id:2, icon:'wa', tone:'sky', title:'Donatur balas WhatsApp', body:'Rizky H. — "Sudah saya transfer kak, tolong dicek."', when:'5 menit lalu', unread:true, type:'cs' },
    { id:3, icon:'shield', tone:'bad', title:'Pixel TikTok error', body:'Token TikTok Events API expired. Hubungkan ulang.', when:'12 menit lalu', unread:true, type:'system' },
    { id:4, icon:'flame', tone:'warn', title:'Campaign mendekati target', body:'"Bantuan Aira" tinggal 9% lagi mencapai Rp 180.000.000.', when:'1 jam lalu', unread:true, type:'campaign' },
    { id:5, icon:'creditcard', tone:'brand', title:'Payout fundraiser diproses', body:'Komisi Mei 2026 untuk Ust. Ahmad Fauzi sebesar Rp 8.432.000 telah dijadwalkan.', when:'2 jam lalu', unread:false, type:'system' },
    { id:6, icon:'bolt', tone:'sky', title:'Conversion rate naik', body:'CVR campaign "Sumur Bersih NTT" naik dari 3.4% → 4.8% (24 jam terakhir).', when:'3 jam lalu', unread:false, type:'campaign' },
    { id:7, icon:'megaphone', tone:'brand', title:'Campaign baru dipublish', body:'"Modal Usaha untuk Janda Kepala Keluarga" telah dipublish.', when:'kemarin', unread:false, type:'campaign' },
    { id:8, icon:'check', tone:'ok', title:'Donatur menyelesaikan pembayaran', body:'INV-20251123 — Rp 500.000 via QRIS.', when:'kemarin', unread:false, type:'donation' },
  ];

  const [items, setItems] = uS(seedItems);

  uE(()=>{
    api.notifications().then(r => {
      const list = r?.data?.notifications || r?.data;
      if (Array.isArray(list) && list.length > 0) setItems(list);
    }).catch(()=>{});
  }, []);

  const tones = {
    ok:'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    sky:'bg-sky2-50 dark:bg-sky-900/30 text-sky2-500 dark:text-sky-400',
    bad:'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    warn:'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    brand:'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
  };

  const filtered = uM(()=>{
    if (tab === 'all') return items;
    if (tab === 'unread') return items.filter(i => i.unread);
    return items.filter(i => i.type === tab);
  }, [items, tab]);

  const handleMarkAllRead = async () => {
    try {
      const res = await api.markAllNotificationsRead();
      if (res?.success || res?.data) {
        setItems(prev => prev.map(n => ({...n, unread:false})));
        showToast('Semua notifikasi ditandai dibaca');
      } else showToast(res?.message || 'Gagal menandai notifikasi');
    } catch(e) { showToast('Error: ' + e.message); }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setItems(prev => prev.map(n => n.id === id ? {...n, unread:false} : n));
    } catch(e) {}
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Notification" subtitle="Aktivitas terbaru pada akun & platform Anda."
        actions={<>
          <Btn variant="outline" tone="ink" icon="check" onClick={handleMarkAllRead}>Tandai semua dibaca</Btn>
          <Btn variant="ghost" tone="ink" icon="cog">Pengaturan</Btn>
        </>}/>

      <Card className="p-4">
        <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
          { value:'all', label:'Semua', count: items.length },
          { value:'unread', label:'Belum dibaca', count: items.filter(i=>i.unread).length },
          { value:'donation', label:'Donasi' },
          { value:'campaign', label:'Campaign' },
          { value:'cs', label:'CS' },
          { value:'system', label:'Sistem' },
        ]}/>
      </Card>

      <Card className="divide-y divide-line dark:divide-slate-700">
        {filtered.length === 0 && (
          <Empty icon="bell" title="Tidak ada notifikasi" sub="Semua sudah terbaca atau tidak ada data."/>
        )}
        {filtered.map(n => (
          <div key={n.id} onClick={()=>n.unread && handleMarkRead(n.id)}
            className={`flex items-start gap-3 p-4 hover:bg-bg2/60 dark:hover:bg-slate-800/60 cursor-pointer ${n.unread ? 'bg-bg2/30 dark:bg-slate-800/30' : ''}`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${tones[n.tone] || tones.brand}`}>
              <Icon name={n.icon} size={18}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-bold text-ink dark:text-slate-100">{n.title}</div>
                {n.unread && <span className="h-2 w-2 rounded-full bg-brand-600"/>}
              </div>
              <div className="text-sm text-ink/80 dark:text-slate-300 mt-0.5">{n.body || n.sub}</div>
              <div className="text-xs text-mute dark:text-slate-400 mt-1">{n.when || n.ts}</div>
            </div>
            <button className="text-mute dark:text-slate-400 hover:text-ink dark:hover:text-slate-100"><Icon name="more" size={16}/></button>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ====================== Trash ======================
function TrashPage(){
  const { showToast } = useApp();
  const [tab, setTab] = uS('all');
  const [search, setSearch] = uS('');
  const [confirmDelete, setConfirmDelete] = uS(null);

  const seedItems = [
    { id:1, type:'Campaign', name:'Berbagi Sembako Idul Adha 2024', meta:'14 hari lagi dihapus permanen', icon:'megaphone', tone:'brand', size:'thumbnail + 12 update', kind:'campaign' },
    { id:2, type:'User', name:'Hasan Pratama (Advertiser)', meta:'7 hari lagi dihapus permanen', icon:'user', tone:'sky', size:'hasan@niatbaik.org', kind:'user' },
    { id:3, type:'Transaksi', name:'INV-20251078 · Rp 250.000', meta:'24 hari lagi dihapus permanen', icon:'creditcard', tone:'ok', size:'soft-deleted oleh admin', kind:'transaksi' },
    { id:4, type:'Campaign', name:'Tebus Donasi Yatim Q1', meta:'29 hari lagi dihapus permanen', icon:'megaphone', tone:'brand', size:'4 update · 412 donasi', kind:'campaign' },
    { id:5, type:'User', name:'Lina Marlina (CS)', meta:'21 hari lagi dihapus permanen', icon:'user', tone:'sky', size:'lina@niatbaik.org', kind:'user' },
    { id:6, type:'Transaksi', name:'INV-20251022 · Rp 1.000.000', meta:'2 hari lagi dihapus permanen', icon:'creditcard', tone:'ok', size:'soft-deleted oleh CS', kind:'transaksi' },
    { id:7, type:'Campaign', name:'Bantuan Korban Gempa Cianjur', meta:'sudah lewat masa retensi · permanen besok', icon:'megaphone', tone:'brand', size:'arsipkan?', kind:'campaign' },
  ];

  const [trashItems, setTrashItems] = uS(seedItems);

  uE(()=>{
    api.trash().then(r => r?.data && setTrashItems(r.data)).catch(()=>{});
  }, []);

  const refreshTrash = () => api.trash().then(r => r?.data && setTrashItems(r.data)).catch(()=>{});

  const tones = { brand:'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400', sky:'bg-sky2-50 dark:bg-sky-900/30 text-sky2-500 dark:text-sky-400', ok:'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' };

  const filtered = uM(()=>{
    let list = trashItems;
    if (tab !== 'all') list = list.filter(i => (i.kind || i.type).toLowerCase() === tab);
    if (search.trim()) list = list.filter(i => (i.name||i.title||'').toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [trashItems, tab, search]);

  const handleRestore = async (item) => {
    if (!confirm('Restore item ini?')) return;
    try {
      const res = await api.restoreTrash(item.kind || item.type, item.id);
      if (res?.success || res?.data) { showToast('Item berhasil direstore'); refreshTrash(); }
      else showToast(res?.message || 'Gagal restore item');
    } catch(e) { showToast('Error: ' + e.message); }
  };

  const handlePermDelete = async (item) => {
    setConfirmDelete(item);
  };

  const doPermDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await api.del('/trash/' + (confirmDelete.kind||confirmDelete.type) + '/' + confirmDelete.id);
      if (res?.success || res?.data) { showToast('Item dihapus permanen'); refreshTrash(); }
      else showToast(res?.message || 'Gagal menghapus');
    } catch(e) { showToast('Error: ' + e.message); }
    setConfirmDelete(null);
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Kosongkan seluruh trash? Semua data akan dihapus permanen.')) return;
    if (!confirm('Yakin? Tindakan ini TIDAK dapat dikembalikan.')) return;
    try {
      const res = await api.del('/trash/all');
      if (res?.success || res?.data) { showToast('Trash dikosongkan'); setTrashItems([]); }
      else showToast(res?.message || 'Gagal mengosongkan trash');
    } catch(e) { showToast('Error: ' + e.message); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Trash" subtitle="Data yang dihapus akan disimpan selama 30 hari sebelum dihapus permanen."
        actions={<Btn variant="ghost" tone="bad" icon="trash" onClick={handleEmptyTrash}>Kosongkan trash</Btn>}/>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
            { value:'all', label:'Semua', count: trashItems.length },
            { value:'campaign', label:'Campaigns', count: trashItems.filter(i=>(i.kind||i.type)==='Campaign'||i.kind==='campaign').length },
            { value:'user', label:'Users', count: trashItems.filter(i=>(i.kind||i.type)==='User'||i.kind==='user').length },
            { value:'transaksi', label:'Transaksi', count: trashItems.filter(i=>(i.kind||i.type)==='Transaksi'||i.kind==='transaksi').length },
          ]}/>
          <div className="ml-auto flex items-center gap-2">
            <SearchInput placeholder="Cari di trash…" className="w-64" value={search} onChange={e=>setSearch(e.target?.value ?? e)}/>
            <Select value="recent" onChange={()=>{}} options={[{value:'recent',label:'Terbaru'},{value:'expire',label:'Mendekati expired'}]}/>
          </div>
        </div>
      </Card>

      <Card className="divide-y divide-line dark:divide-slate-700">
        {filtered.length === 0 && (
          <Empty icon="trash" title="Trash kosong" sub="Tidak ada data yang dihapus."/>
        )}
        {filtered.map((item, k) => (
          <div key={item.id || k} className="flex items-center gap-3 p-4 hover:bg-bg2/60 dark:hover:bg-slate-800/60">
            <input type="checkbox" className="rounded border-line dark:border-slate-700"/>
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${tones[item.tone] || tones.brand}`}>
              <Icon name={item.icon} size={18}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge tone="slate" size="sm">{item.type}</Badge>
                <span className="font-bold text-ink dark:text-slate-100">{item.name || item.title}</span>
              </div>
              <div className="text-xs text-mute dark:text-slate-400 mt-0.5">{item.size} · <span className="text-amber-600 dark:text-amber-400 font-semibold">{item.meta || item.deleted}</span></div>
            </div>
            <Btn size="sm" variant="outline" tone="ink" icon="refresh" onClick={()=>handleRestore(item)}>Restore</Btn>
            <Btn size="sm" variant="ghost" tone="bad" icon="trash" onClick={()=>handlePermDelete(item)}>Hapus permanen</Btn>
          </div>
        ))}
      </Card>

      {/* Double-confirm permanent delete modal */}
      <Modal open={!!confirmDelete} onClose={()=>setConfirmDelete(null)} title="Hapus Permanen" size="sm"
        footer={<>
          <Btn variant="outline" tone="ink" onClick={()=>setConfirmDelete(null)}>Batal</Btn>
          <Btn variant="outline" tone="bad" icon="trash" onClick={doPermDelete}>Ya, hapus permanen</Btn>
        </>}>
        <div className="text-sm text-ink dark:text-slate-100">
          <p>Anda akan menghapus <strong>{confirmDelete?.name || confirmDelete?.title}</strong> secara permanen.</p>
          <p className="mt-2 text-rose-600 dark:text-rose-400 font-semibold">Tindakan ini tidak dapat dikembalikan.</p>
        </div>
      </Modal>
    </div>
  );
}

Object.assign(window, { FundraiserPage, ShortcodePage, MembersPage, ProfilePage, NotificationPage, TrashPage });

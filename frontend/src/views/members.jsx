function MembersView() {
  const members = (window.USERS && window.USERS.length) ? window.USERS : window.NB.members;
  const [tab, setTab] = useStateA('all');
  const [showAdd, setShowAdd] = useStateA(false);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Members / User"
        subtitle="Tim NIATBAIK.ORG · Admin, CS, dan Advertiser."
        actions={<>
          <Btn variant="outline" tone="ink" icon="download">Export</Btn>
          <Btn icon="plus" onClick={() => setShowAdd(true)}>Add User</Btn>
        </>}
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
            { value:'all',        label:'Semua', count: members.length },
            { value:'Admin',      label:'Admin', count: members.filter(m=>m.role==='Admin').length },
            { value:'CS',         label:'CS',    count: members.filter(m=>m.role==='CS').length },
            { value:'Advertiser', label:'Advertiser', count: members.filter(m=>m.role==='Advertiser').length },
          ]}/>
          <div className="ml-auto"><SearchInput placeholder="Cari nama / email…" className="w-64"/></div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-mute border-b border-line bg-bg2/60">
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="py-3 font-semibold">Role</th>
              <th className="py-3 font-semibold">Status</th>
              <th className="py-3 font-semibold">Last Login</th>
              <th className="pr-5 py-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {members.filter(m => tab==='all' || m.role===tab).map((m) => (
              <tr key={m.id} className="border-b border-line last:border-0 hover:bg-bg2/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full text-white font-bold text-xs flex items-center justify-center ${m.role==='Admin' ? 'bg-brand-600' : m.role==='CS' ? 'bg-sky2-500' : 'bg-violet-600'}`}>
                      {m.name.split(' ').map(s=>s[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="font-semibold text-ink">{m.name}</div>
                      <div className="text-xs text-mute">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3"><RoleBadge role={m.role}/></td>
                <td className="py-3"><StatusBadge status={m.status}/></td>
                <td className="py-3 text-mute">{m.lastLogin}</td>
                <td className="pr-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink"><Icon name="edit" size={16}/></button>
                    <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink"><Icon name="shield" size={16}/></button>
                    <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-rose-600"><Icon name="trash" size={16}/></button>
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
            <div className="font-bold text-ink">Permission Matrix</div>
            <div className="text-xs text-mute mt-0.5">Akses per role · klik untuk mengubah.</div>
          </div>
          <Btn size="sm" variant="ghost" tone="ink" icon="edit">Edit permissions</Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-mute">
                <th className="py-2 font-semibold">Permission</th>
                <th className="py-2 font-semibold text-center">Admin</th>
                <th className="py-2 font-semibold text-center">CS</th>
                <th className="py-2 font-semibold text-center">Advertiser</th>
              </tr>
            </thead>
            <tbody>
              {[
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
              ].map((r, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="py-2.5 text-ink font-medium">{r.p}</td>
                  {[r.a, r.c, r.ad].map((v, j) => (
                    <td key={j} className="py-2.5 text-center">
                      {v ? <span className="inline-flex h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center"><Icon name="check" size={14} strokeWidth={2.5}/></span>
                         : <span className="inline-flex h-6 w-6 rounded-full bg-slate-100 text-slate-400 items-center justify-center"><Icon name="close" size={14}/></span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah User Baru" size="md"
        footer={<><Btn variant="outline" tone="ink" onClick={() => setShowAdd(false)}>Batal</Btn><Btn>Kirim Undangan</Btn></>}>
        <div className="space-y-3">
          <div><label className="text-xs font-semibold text-mute">Nama lengkap</label><input className="field mt-1" placeholder="Nama user"/></div>
          <div><label className="text-xs font-semibold text-mute">Email</label><input className="field mt-1" placeholder="email@niatbaik.org"/></div>
          <div>
            <label className="text-xs font-semibold text-mute">Role</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {['Admin','CS','Advertiser'].map((r) => (
                <button key={r} className="py-2 rounded-lg border border-line text-sm font-bold hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700">{r}</button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

window.MembersView = MembersView;

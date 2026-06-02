function TrashView() {
  const items = [
    { type:'Campaign', name:'Berbagi Sembako Idul Adha 2024', meta:'14 hari lagi dihapus permanen', icon:'megaphone', tone:'brand', size:'thumbnail + 12 update' },
    { type:'User',     name:'Hasan Pratama (Advertiser)',     meta:'7 hari lagi dihapus permanen',   icon:'user', tone:'sky',  size:'hasan@niatbaik.org' },
    { type:'Transaksi', name:'INV-20251078 · Rp 250.000',     meta:'24 hari lagi dihapus permanen',  icon:'creditcard', tone:'ok',   size:'soft-deleted oleh admin' },
    { type:'Campaign', name:'Tebus Donasi Yatim Q1',           meta:'29 hari lagi dihapus permanen',  icon:'megaphone', tone:'brand', size:'4 update · 412 donasi' },
    { type:'User',     name:'Lina Marlina (CS)',               meta:'21 hari lagi dihapus permanen', icon:'user', tone:'sky',  size:'lina@niatbaik.org' },
    { type:'Transaksi', name:'INV-20251022 · Rp 1.000.000',    meta:'2 hari lagi dihapus permanen',   icon:'creditcard', tone:'ok', size:'soft-deleted oleh CS' },
    { type:'Campaign', name:'Bantuan Korban Gempa Cianjur',    meta:'sudah lewat masa retensi · permanen besok', icon:'megaphone', tone:'brand', size:'arsipkan?' },
  ];
  const [tab, setTab] = useStateA('all');
  const tones = { brand:'bg-brand-50 text-brand-600', sky:'bg-sky2-50 text-sky2-500', ok:'bg-emerald-50 text-emerald-600' };
  const filtered = items.filter(i => tab === 'all' || i.type.toLowerCase() === tab);
  return (
    <div className="space-y-5">
      <PageHeader
        title="Trash"
        subtitle="Data yang dihapus akan disimpan selama 30 hari sebelum dihapus permanen."
        actions={<><Btn variant="ghost" tone="bad" icon="trash">Kosongkan trash</Btn></>}
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
            { value:'all', label:'Semua', count: items.length },
            { value:'campaign', label:'Campaigns', count: items.filter(i=>i.type==='Campaign').length },
            { value:'user', label:'Users', count: items.filter(i=>i.type==='User').length },
            { value:'transaksi', label:'Transaksi', count: items.filter(i=>i.type==='Transaksi').length },
          ]}/>
          <div className="ml-auto flex items-center gap-2">
            <SearchInput placeholder="Cari di trash…" className="w-64"/>
            <Select value="recent" onChange={()=>{}} options={[{value:'recent',label:'Terbaru'},{value:'expire',label:'Mendekati expired'}]}/>
          </div>
        </div>
      </Card>

      <Card className="divide-y divide-line">
        {filtered.map((i, k) => (
          <div key={k} className="flex items-center gap-3 p-4 hover:bg-bg2/60">
            <input type="checkbox" className="rounded border-line"/>
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${tones[i.tone]}`}><Icon name={i.icon} size={18}/></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge tone="slate" size="sm">{i.type}</Badge>
                <span className="font-bold text-ink">{i.name}</span>
              </div>
              <div className="text-xs text-mute mt-0.5">{i.size} · <span className="text-amber-600 font-semibold">{i.meta}</span></div>
            </div>
            <Btn size="sm" variant="outline" tone="ink" icon="refresh">Restore</Btn>
            <Btn size="sm" variant="ghost" tone="bad" icon="trash">Hapus permanen</Btn>
          </div>
        ))}
      </Card>
    </div>
  );
}

window.TrashView = TrashView;

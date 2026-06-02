function FundraiserView() {
  const fundraisers = (window.FUNDRAISERS && window.FUNDRAISERS.length) ? window.FUNDRAISERS : window.NB.fundraisers;
  const { showToast } = useApp();
  const [tab, setTab] = useStateA('all');

  const total = fundraisers.reduce((s, f) => s + f.raised, 0);
  const totalComm = fundraisers.reduce((s, f) => s + f.commission, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fundraiser"
        subtitle="Mitra fundraiser yang mempromosikan campaign NIATBAIK.ORG."
        actions={<>
          <Btn variant="outline" tone="ink" icon="download">Export komisi</Btn>
          <Btn icon="plus">Undang Fundraiser</Btn>
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="handshake" label="Total Fundraiser"    value={fmtNum(fundraisers.length)} accent="brand" sub="aktif bulan ini"/>
        <StatCard icon="wallet"    label="Total Donasi (FR)"   value={fmtIDRShort(total)} delta="+19.2%" accent="ok"/>
        <StatCard icon="creditcard" label="Total Komisi"       value={fmtIDRShort(totalComm)} accent="sky" sub="10% dari raised"/>
        <StatCard icon="bolt"      label="Pending Payout"      value={fmtIDRShort(totalComm * 0.6)} accent="warn" sub="butuh diproses"/>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
            { value:'all',     label:'Semua', count: fundraisers.length },
            { value:'pending', label:'Komisi Pending', count: fundraisers.filter(f => f.status==='pending').length },
            { value:'paid',    label:'Komisi Paid',    count: fundraisers.filter(f => f.status==='paid').length },
          ]}/>
          <div className="ml-auto flex items-center gap-2">
            <SearchInput placeholder="Cari nama fundraiser…" className="w-64"/>
            <Select value="all" onChange={()=>{}} icon="filter" options={[{value:'all', label:'Semua campaign'}, {value:'aira', label:'Bantuan Aira'}, {value:'air', label:'Sumur Bersih'}]}/>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-mute border-b border-line bg-bg2/60">
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
            {fundraisers
              .filter(f => tab==='all' || f.status===tab)
              .map((f) => (
              <tr key={f.id} className="border-b border-line last:border-0 hover:bg-bg2/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                      {f.name.split(' ').map(s=>s[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="font-semibold text-ink">{f.name}</div>
                      <div className="text-[11px] text-mute">{f.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-ink/90">{f.campaign}</td>
                <td className="py-3">{fmtNum(f.txn)}</td>
                <td className="py-3 font-bold text-ink">{fmtIDRShort(f.raised)}</td>
                <td className="py-3 font-semibold text-emerald-600">{fmtIDRShort(f.commission)}</td>
                <td className="py-3"><StatusBadge status={f.status}/></td>
                <td className="py-3">
                  <button onClick={() => showToast('Link referral disalin')} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg2 border border-line text-xs font-mono text-ink hover:bg-white">
                    niatbaik.org/r/{f.ref}
                    <Icon name="copy" size={12}/>
                  </button>
                </td>
                <td className="pr-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink"><Icon name="eye" size={16}/></button>
                    <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink"><Icon name="wallet" size={16}/></button>
                    <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink"><Icon name="more" size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-ink">Riwayat Komisi Terbaru</div>
          <Btn size="sm" variant="ghost" tone="ink" iconRight="arrowR">Lihat semua</Btn>
        </div>
        <div className="space-y-2">
          {fundraisers.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg2">
              <div className={`h-8 w-8 rounded-md flex items-center justify-center ${f.status==='paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <Icon name={f.status==='paid' ? 'check' : 'refresh'} size={14}/>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink">{f.name} · komisi {fmtIDRShort(f.commission)}</div>
                <div className="text-xs text-mute">Periode 1–31 Mei 2026 · {f.campaign}</div>
              </div>
              <StatusBadge status={f.status}/>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

window.FundraiserView = FundraiserView;

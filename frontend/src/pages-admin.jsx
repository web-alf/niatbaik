// Admin pages: Dashboard, Campaigns, Analytics
const { useState: uS_adm, useEffect: uE_adm } = React;

// ====================== Admin Dashboard ======================
function AdminDashboard(){
  const { setEditingCampaign, setView: navTo, showToast } = useApp();
  const [apiStats, setApiStats] = uS_adm(null);
  const [dailyData, setDailyData] = uS_adm([]);
  const [allTx, setAllTx] = uS_adm([]);
  const [range, setRange] = uS_adm(null);
  const [txTw, setTxTw] = uS_adm({ density:'regular', striped:false, anonymize:false, showDonatur:true, showCampaign:true, showMetode:true, showStatus:true, showTanggal:true, rowCount:8 });

  uE_adm(()=>{
    api.dashboardStats().then(r => r?.data && setApiStats(r.data));
    api.dailyChart(30).then(r => { if(r?.data) setDailyData(r.data.map(d=>({date:new Date(d.date),amount:d.amount,count:d.count}))); });
    api.recentTransactions(8).then(r => { if(r?.data) setAllTx(r.data); });
  },[]);

  const recentTx = typeof filterByRange==='function' ? filterByRange(allTx, range, 'date') : allTx;

  const s_ = apiStats;
  const stats = [
    { l:'Total Donasi', v:fmtShort(s_?s_.total_raised:TOTAL_RAISED), s:'Sepanjang waktu', tone:'brand', i:<Icon name="heart" size={20}/>, t:{up:true,value:s_?.total_raised_trend??'+12.4%'} },
    { l:'Total Transaksi', v:fmtNum(s_?s_.total_transactions:TOTAL_TX), s:'Sepanjang waktu', tone:'cyan', i:<Icon name="wallet" size={20}/>, t:{up:true,value:s_?.total_tx_trend??'+8.1%'} },
    { l:'Campaign Aktif', v:(s_?s_.active_campaigns:ACTIVE_CAMPAIGNS)+' / '+(s_?s_.total_campaigns??CAMPAIGNS.length:CAMPAIGNS.length), s:'Running sekarang', tone:'green', i:<Icon name="megaphone" size={20}/> },
    { l:'Total Fundraiser', v:fmtNum(s_?s_.total_fundraisers:TOTAL_FUNDRAISER), s:'24 aktif minggu ini', tone:'amber', i:<Icon name="users" size={20}/> },
    { l:'Total Leads Iklan', v:fmtNum(s_?s_.total_leads:TOTAL_LEADS), s:'30 hari terakhir', tone:'cyan', i:<Icon name="sparkle" size={20}/>, t:{up:true,value:s_?.leads_trend??'+24.6%'} },
    { l:'Conversion Rate', v:(s_?s_.conversion_rate:CONV_RATE)+'%', s:'Visitor → Donatur', tone:'green', i:<Icon name="chart" size={20}/>, t:{up:true,value:s_?.conv_rate_trend??'+0.4%'} },
    { l:'Donasi Hari Ini', v:fmtShort(s_?s_.today_raised:TODAY_RAISED), s:'Update real-time', tone:'brand', i:<Icon name="sun" size={20}/>, t:{up:true,value:s_?.today_trend??'+18%'} },
    { l:'Donasi Bulan Ini', v:fmtShort(s_?s_.month_raised:MONTH_RAISED), s:'Bulan ini', tone:'cyan', i:<Icon name="calendar" size={20}/>, t:{up:false,value:s_?.month_trend??'-2.1%'} },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Selamat datang, Admin 👋"
        subtitle="Ringkasan donasi & performa NIATBAIK.ORG"
        actions={<>
          <DateRangePill value={range} onChange={setRange}/>
          <Button variant="secondary" icon={<Icon name="download" size={16}/>} onClick={()=>{if(typeof exportExcel==='function')exportExcel(recentTx,'dashboard',range);else showToast('Export Excel');}}>Excel</Button>
          <Button variant="secondary" icon={<Icon name="download" size={16}/>} onClick={()=>{if(typeof exportCSV==='function')exportCSV(recentTx,'dashboard',range);else showToast('Export CSV');}}>CSV</Button>
          <Button variant="primary" icon={<Icon name="plus" size={16}/>} onClick={()=>{setEditingCampaign(null);navTo('campaign-editor');}}>Buat Campaign</Button>
        </>}
      />

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s,i)=><Stat key={i} label={s.l} value={s.v} sub={s.s} tone={s.tone} icon={s.i} trend={s.t}/>)}
      </div>

      {/* Chart + payment breakdown */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-bold text-ink dark:text-slate-100">Grafik Donasi Harian</div>
              <div className="text-xs text-muted dark:text-slate-400">30 hari terakhir</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                {['7H','30H','90H','12B'].map((t,i)=>(
                  <button key={t} className={`px-3 h-8 rounded-md text-xs font-semibold ${i===1?'bg-white dark:bg-slate-700 shadow-sm':'text-muted dark:text-slate-400'}`}>{t}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="text-slate-700 dark:text-slate-300">
            <LineChart data={dailyData} height={220}/>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-bold text-ink dark:text-slate-100">Sumber Donasi</div>
              <div className="text-xs text-muted dark:text-slate-400">Per payment method</div>
            </div>
            <button className="text-xs text-brand-600 font-medium">Download</button>
          </div>
          <div className="flex items-center justify-center my-2">
            <Donut size={170} thickness={26} segments={[
              { value: 38, color: '#2E4191' },
              { value: 24, color: '#38B6FF' },
              { value: 18, color: '#0e83c8' },
              { value: 12, color: '#1aa1ee' },
              { value: 8, color: '#94a3b8' },
            ]} center={<><div className="text-2xl font-extrabold tnum text-ink dark:text-slate-100">{fmtShort(apiStats?apiStats.total_raised:TOTAL_RAISED)}</div><div className="text-xs text-muted">Total</div></>}/>
          </div>
          <div className="mt-2 space-y-1.5 text-sm">
            {[
              ['BCA VA','38%','#2E4191'],['QRIS','24%','#38B6FF'],['GoPay','18%','#0e83c8'],['OVO','12%','#1aa1ee'],['Lainnya','8%','#94a3b8']
            ].map(([n,v,c])=>(
              <div key={n} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{background:c}}/>
                <span className="flex-1 text-slate-600 dark:text-slate-400">{n}</span>
                <span className="font-semibold tnum">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card padded={false}>
        <div className="p-5 flex items-center justify-between relative">
          <div>
            <div className="font-bold text-ink dark:text-slate-100">Transaksi Terbaru</div>
            <div className="text-xs text-muted dark:text-slate-400">Update real-time · {recentTx.length} baris</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Icon name="filter" size={14}/>}>Filter</Button>
            <TxTweaks tw={txTw} setTw={setTxTw}/>
          </div>
        </div>
        <TxTable rows={recentTx.slice(0, txTw.rowCount||8)} density={txTw.density} striped={txTw.striped} anonymize={txTw.anonymize}
          showDonatur={txTw.showDonatur} showCampaign={txTw.showCampaign} showMetode={txTw.showMetode} showStatus={txTw.showStatus} showTanggal={txTw.showTanggal}/>
      </Card>

      {/* Top campaigns */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="font-bold text-ink dark:text-slate-100 mb-3">Top Campaign (Bulan Ini)</div>
          <div className="space-y-3">
            {CAMPAIGNS.slice(0,4).map((c,i)=>(
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">{c.img ? <img src={c.img} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-white/80" style={{background:c.thumb||'linear-gradient(135deg,#2E4191,#38B6FF)'}}><Icon name={c.icon||'heart'} size={18}/></div>}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate text-ink dark:text-slate-100">{c.title}</div>
                  <ProgressBar value={c.raised} max={c.target} size="sm"/>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-brand-700 dark:text-brand-300 tnum">{fmtShort(c.raised)}</div>
                  <div className="text-xs text-muted dark:text-slate-400">{Math.round(c.raised/c.target*100)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-ink dark:text-slate-100">Sumber Traffic Iklan</div>
            <Badge tone="green" dot>Real-time</Badge>
          </div>
          <BarChart data={[
            { label:'Meta', value:5240, color:'#2E4191' },
            { label:'Google', value:3120, color:'#38B6FF' },
            { label:'TikTok', value:1840, color:'#0e83c8' },
            { label:'Organic', value:980, color:'#94a3b8' },
          ]} height={180}/>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-muted dark:text-slate-400 text-xs">Cost / Lead</div><div className="font-bold tnum">Rp4.870</div></div>
            <div><div className="text-muted dark:text-slate-400 text-xs">Cost / Donation</div><div className="font-bold tnum">Rp17.500</div></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ====================== Date Range Picker (visual) ======================
// DateRangePicker removed — use DateRangePill from components.jsx

// ====================== Transaction Table ======================
function TxTable({ rows, onInvoice, density='regular', striped=false, showDonatur=true, showCampaign=true, showMetode=true, showStatus=true, showTanggal=true, anonymize=false }){
  const { openInvoice } = useApp();
  const py = density==='compact'?'py-1.5':density==='comfy'?'py-4':'py-3';
  const stripe = (i) => striped && i%2===1 ? 'bg-slate-50/50 dark:bg-slate-800/20' : '';
  return (
    <div className="overflow-x-auto nice-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
            <th className="px-5 py-3 font-semibold">Invoice</th>
            {showDonatur && <th className="px-5 py-3 font-semibold">Donatur</th>}
            {showCampaign && <th className="px-5 py-3 font-semibold">Campaign</th>}
            <th className="px-5 py-3 font-semibold">Nominal</th>
            {showMetode && <th className="px-5 py-3 font-semibold">Metode</th>}
            {showStatus && <th className="px-5 py-3 font-semibold">Status</th>}
            {showTanggal && <th className="px-5 py-3 font-semibold">Tanggal</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line dark:divide-slate-800">
          {rows.map((r,i)=>(
            <tr key={r.id||i} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${stripe(i)}`}>
              <td className={`px-5 ${py}`}><button onClick={()=>(onInvoice||openInvoice)(r)} className="font-mono text-brand-700 dark:text-brand-300 hover:underline font-semibold text-xs">{r.id||r.invoice_number}</button></td>
              {showDonatur && <td className={`px-5 ${py}`}>
                <div className="flex items-center gap-2.5">
                  <Avatar name={anonymize||r.anon?'Hamba Allah':r.donor} anon={anonymize||r.anon} size={28}/>
                  <div>
                    <div className="font-medium text-ink dark:text-slate-100">{anonymize||r.anon?'Hamba Allah':r.donor||r.donor_name}</div>
                  </div>
                </div>
              </td>}
              {showCampaign && <td className={`px-5 ${py} max-w-[200px]`}><div className="truncate text-slate-700 dark:text-slate-300">{r.campaign||r.campaign_title}</div></td>}
              <td className={`px-5 ${py} font-bold text-ink dark:text-slate-100 tnum`}>{fmtIDR(r.amount||r.total)}</td>
              {showMetode && <td className={`px-5 ${py} text-slate-700 dark:text-slate-300`}>{r.method||r.payment_method_name}</td>}
              {showStatus && <td className={`px-5 ${py}`}><StatusBadge status={r.status}/></td>}
              {showTanggal && <td className={`px-5 ${py} text-muted dark:text-slate-400 text-xs whitespace-nowrap`}>{r.date||r.ts||(r.paid_at&&new Date(r.paid_at).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}))||''}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ====================== Tx Table Tweaks ======================
function TxTweaks({ tw, setTw }){
  const [open, setOpen] = uS_adm(false);
  if (!open) return <button onClick={()=>setOpen(true)} className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-muted dark:text-slate-400" title="Tweaks"><Icon name="cog" size={16}/></button>;
  return (
    <div className="absolute right-0 top-full mt-2 z-40 w-72 rounded-xl bg-white dark:bg-slate-800 border border-line dark:border-slate-700 shadow-pop p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-ink dark:text-slate-100">Tweaks · Tabel</div>
        <button onClick={()=>setOpen(false)} className="text-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-100"><Icon name="close" size={14}/></button>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-slate-400 mb-2">Tampilan</div>
        <div className="flex gap-1">
          {['compact','regular','comfy'].map(d=>(
            <button key={d} onClick={()=>setTw({...tw,density:d})} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold ${tw.density===d?'bg-brand-600 text-white':'bg-slate-100 dark:bg-slate-700 text-ink dark:text-slate-200'}`}>{d.charAt(0).toUpperCase()+d.slice(1)}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 mt-2 text-sm text-ink dark:text-slate-200">
          <input type="checkbox" checked={tw.striped} onChange={e=>setTw({...tw,striped:e.target.checked})} className="rounded border-line"/>
          Striped rows
        </label>
        <label className="flex items-center gap-2 mt-1 text-sm text-ink dark:text-slate-200">
          <input type="checkbox" checked={tw.anonymize} onChange={e=>setTw({...tw,anonymize:e.target.checked})} className="rounded border-line"/>
          Anonimkan semua donatur
        </label>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-slate-400 mb-2">Kolom</div>
        {[['showDonatur','Donatur'],['showCampaign','Campaign'],['showMetode','Metode'],['showStatus','Status'],['showTanggal','Tanggal']].map(([k,l])=>(
          <label key={k} className="flex items-center gap-2 mt-1 text-sm text-ink dark:text-slate-200">
            <input type="checkbox" checked={tw[k]!==false} onChange={e=>setTw({...tw,[k]:e.target.checked})} className="rounded border-line"/>
            {l}
          </label>
        ))}
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-slate-400 mb-2">Baris</div>
        <div className="flex items-center gap-2">
          <input type="range" min={3} max={15} value={tw.rowCount||8} onChange={e=>setTw({...tw,rowCount:+e.target.value})} className="flex-1"/>
          <span className="text-xs font-bold tnum text-ink dark:text-slate-100 w-6 text-right">{tw.rowCount||8}</span>
        </div>
      </div>
    </div>
  );
}

// ====================== Campaigns Page ======================
function CampaignsPage(){
  const [view, setView] = uS_adm('grid');
  const [filter, setFilter] = uS_adm('all');
  const [search, setSearch] = uS_adm('');
  const [campaigns, setCampaigns] = uS_adm([]);
  const [range, setRange] = uS_adm(null);
  const activeCampaigns = campaigns.filter(c=>c.status==='Running'||c.status==='Berjalan').length;

  uE_adm(()=>{
    api.adminCampaigns().then(r => {
      if(r?.data && Array.isArray(r.data)) setCampaigns(r.data.map(mapCampaign));
    }).catch(()=>{});
  },[]);

  const [previewCampaign, setPreviewCampaign] = uS_adm(null);
  const ranged = typeof filterByRange==='function' ? filterByRange(campaigns, range, 'createdAt') : campaigns;
  const filtered = ranged.filter(c=>(filter==='all'||(c.status||'').toLowerCase()===filter) && (c.title||'').toLowerCase().includes(search.toLowerCase()));
  const { setEditingCampaign, setView: navigateTo, showToast } = useApp();
  const editCampaign = (c) => { setEditingCampaign(c); navigateTo('campaign-editor'); };
  const deleteCampaign = async (c) => {
    if (!confirm('Hapus campaign "'+c.title+'"?')) return;
    try { await api.deleteCampaign(c.id); showToast('Campaign dihapus'); setCampaigns(prev=>prev.filter(x=>x.id!==c.id)); } catch(e) { showToast('Gagal menghapus: '+(e.message||'')); }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Campaigns"
        subtitle={`${campaigns.length} campaign · ${activeCampaigns} sedang berjalan`}
        actions={<>
          <Button variant="secondary" icon={<Icon name="download" size={16}/>} onClick={()=>{if(typeof exportCSV==='function')exportCSV(filtered,'campaigns',range);else showToast('Export');}}>Export</Button>
          <Button variant="primary" icon={<Icon name="plus" size={16}/>} onClick={()=>{setEditingCampaign(null);navigateTo('campaign-editor');}}>Buat Campaign</Button>
        </>}
      />

      {/* Filter bar */}
      <Card padded={false} className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px]">
            <Input icon={<Icon name="search" size={16}/>} placeholder="Cari campaign…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
            {[['all','Semua'],['draft','Draft'],['published','Published'],['running','Running'],['ended','Ended']].map(([k,l])=>(
              <button key={k} onClick={()=>setFilter(k)} className={`px-3 h-9 rounded-lg text-sm font-medium ${filter===k?'bg-white dark:bg-slate-700 shadow-sm':'text-muted dark:text-slate-400'}`}>{l}</button>
            ))}
          </div>
          <DateRangePill value={range} onChange={setRange}/>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
            <button onClick={()=>setView('grid')} className={`px-3 h-9 rounded-lg ${view==='grid'?'bg-white dark:bg-slate-700 shadow-sm':'text-muted dark:text-slate-400'}`}><Icon name="home" size={16}/></button>
            <button onClick={()=>setView('list')} className={`px-3 h-9 rounded-lg ${view==='list'?'bg-white dark:bg-slate-700 shadow-sm':'text-muted dark:text-slate-400'}`}><Icon name="menu" size={16}/></button>
          </div>
        </div>
      </Card>

      {/* View */}
      {view==='grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(c=>(
            <CampaignAdminCard key={c.id} c={c} onOpen={()=>setPreviewCampaign(c)} onEdit={()=>editCampaign(c)}/>
          ))}
        </div>
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto nice-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-5 py-3 font-semibold">Campaign</th>
                  <th className="px-5 py-3 font-semibold">Target</th>
                  <th className="px-5 py-3 font-semibold">Terkumpul</th>
                  <th className="px-5 py-3 font-semibold">Progress</th>
                  <th className="px-5 py-3 font-semibold">Donatur</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line dark:divide-slate-800">
                {filtered.map(c=>(
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0">{c.img ? <img src={c.img} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-white/80" style={{background:c.thumb||'linear-gradient(135deg,#2E4191,#38B6FF)'}}><Icon name={c.icon||'heart'} size={16}/></div>}</div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate max-w-[280px] text-ink dark:text-slate-100">{c.title}</div>
                          <div className="text-xs text-muted dark:text-slate-400">{c.category} · {c.days>0?`${c.days} hari lagi`:'Selesai'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium tnum">{fmtShort(c.target)}</td>
                    <td className="px-5 py-3 font-bold text-brand-700 dark:text-brand-300 tnum">{fmtShort(c.raised)}</td>
                    <td className="px-5 py-3 w-[180px]"><ProgressBar value={c.raised} max={c.target} size="sm"/></td>
                    <td className="px-5 py-3 tnum">{fmtNum(c.donors)}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.status}/></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={()=>setPreviewCampaign(c)} className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300" title="Preview"><Icon name="eye" size={16}/></button>
                        <button onClick={()=>editCampaign(c)} className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300" title="Edit"><Icon name="edit" size={16}/></button>
                        <CampaignOptionMenu c={c} onEdit={()=>editCampaign(c)} onPreview={()=>setPreviewCampaign(c)}/>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Preview Modal */}
      {previewCampaign && <CampaignPreviewModal campaign={previewCampaign} onClose={()=>setPreviewCampaign(null)} onEdit={()=>{setPreviewCampaign(null);editCampaign(previewCampaign);}}/>}
    </div>
  );
}

function CampaignPreviewModal({ campaign, onClose, onEdit }){
  const c = campaign;
  const pct = c.target ? Math.min(100, Math.round((c.raised/c.target)*100)) : 0;
  const slug = c.slug || c.id;
  return (
    <Modal open={true} onClose={onClose} title="Preview Halaman Campaign" size="xl">
      <div className="bg-bg2 dark:bg-slate-950 -m-5 p-5">
        <div className="rounded-2xl border border-line dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Browser chrome */}
          <div className="h-9 px-3 flex items-center gap-2 border-b border-line dark:border-slate-700 bg-bg2 dark:bg-slate-800">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-400"/>
              <span className="h-3 w-3 rounded-full bg-amber-400"/>
              <span className="h-3 w-3 rounded-full bg-emerald-400"/>
            </div>
            <div className="ml-2 flex-1 h-6 rounded-md bg-white dark:bg-slate-900 border border-line dark:border-slate-700 flex items-center px-2.5 text-[11px] font-mono text-muted dark:text-slate-400">
              <Icon name="shield" size={12} className="mr-1.5 text-emerald-600"/>
              niatbaik.org/c/{slug}
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-0">
            {/* Left: banner + info */}
            <div className="lg:col-span-3">
              <div className="relative aspect-[16/9]" style={{background:c.thumb||'linear-gradient(135deg,#2E4191,#38B6FF)'}}>
                {c.img ? <img src={c.img} className="absolute inset-0 w-full h-full object-cover" alt=""/> : <div className="absolute inset-0 flex items-center justify-center text-white/90"><Icon name={c.icon||'heart'} size={100} strokeWidth={1}/></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent"/>
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-2 py-1 rounded-md bg-white/90 text-[11px] font-bold text-ink">{c.category||'Uncategorized'}</span>
                  <span className="px-2 py-1 rounded-md bg-emerald-600 text-[11px] font-bold text-white">{c.status}</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-semibold opacity-80">YAYASAN NIAT BAIK · KAMPANYE TERVERIFIKASI</div>
                  <h2 className="mt-1 text-xl font-extrabold leading-tight">{c.title}</h2>
                </div>
              </div>
              <div className="p-5">
                <div className="text-sm text-muted dark:text-slate-400">{c.short_description||c.shortDesc||''}</div>
                <div className="mt-3 prose prose-sm max-w-none text-ink dark:text-slate-200" dangerouslySetInnerHTML={{__html:c.description||c.content||'<p>Belum ada deskripsi.</p>'}}/>
              </div>
            </div>

            {/* Right: donation card */}
            <div className="lg:col-span-2 p-5 border-l border-line dark:border-slate-700">
              <div className="text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400">Donasi terkumpul</div>
              <div className="mt-1 text-2xl font-extrabold text-brand-600 tnum">{fmtIDR(c.raised||0)}</div>
              <div className="text-sm text-muted dark:text-slate-400">dari target <b className="tnum">{fmtIDR(c.target||0)}</b></div>
              <ProgressBar value={c.raised||0} max={c.target||1} size="lg"/>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-bg2 dark:bg-slate-800"><div className="text-muted dark:text-slate-400">Donatur</div><div className="font-bold tnum">{fmtNum(c.donors||0)}</div></div>
                <div className="p-2 rounded-lg bg-bg2 dark:bg-slate-800"><div className="text-muted dark:text-slate-400">Sisa hari</div><div className="font-bold tnum">{c.days||c.daysLeft||0}</div></div>
                <div className="p-2 rounded-lg bg-bg2 dark:bg-slate-800"><div className="text-muted dark:text-slate-400">Tercapai</div><div className="font-bold text-emerald-600 tnum">{pct}%</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-4 flex items-center gap-2 justify-end">
          <span className="text-xs text-muted dark:text-slate-400 mr-auto flex items-center gap-1.5"><Icon name="globe" size={14}/> niatbaik.org/c/{slug}</span>
          <Button variant="secondary" size="sm" icon={<Icon name="edit" size={14}/>} onClick={onEdit}>Edit campaign</Button>
          <Button variant="primary" size="sm" icon={<Icon name="eye" size={14}/>} onClick={()=>window.open('/donasi/'+slug,'_blank')}>Buka di tab baru</Button>
        </div>
      </div>
    </Modal>
  );
}

function CampaignOptionMenu({ c, onEdit, onPreview }){
  const [open, setOpen] = uS_adm(false);
  const [pos, setPos] = uS_adm('down');
  const btnRef = React.useRef();
  const menuRef = React.useRef();
  const { showToast } = useApp();

  uE_adm(()=>{
    if (!open) return;
    const click = (e) => { if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', click);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', esc); };
  }, [open]);

  uE_adm(()=>{
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos(window.innerHeight - r.bottom < 280 ? 'up' : 'down');
  }, [open]);

  const items = [
    { l:'Edit Campaign', icon:'edit', onClick:()=>{ setOpen(false); onEdit&&onEdit(); } },
    { l:'Preview', icon:'eye', onClick:()=>{ setOpen(false); onPreview&&onPreview(); } },
    { l:'Salin URL', icon:'copy', onClick:()=>{ setOpen(false); navigator.clipboard?.writeText('https://niatbaik.org/c/'+(c.slug||c.id)); showToast('URL disalin'); } },
    { sep:true },
    { l:'Delete', icon:'trash', onClick:()=>{ setOpen(false); showToast('Campaign dipindahkan ke trash'); }, danger:true },
  ];

  return (
    <div className="relative">
      <button ref={btnRef} onClick={()=>setOpen(!open)} className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors ${open?'bg-brand-50 dark:bg-brand-900/30 border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-300':'border-line dark:border-slate-700 text-muted dark:text-slate-400 hover:bg-bg2 dark:hover:bg-slate-800 hover:text-ink dark:hover:text-slate-100'}`}>
        <Icon name="more" size={16}/>
      </button>
      {open && (
        <div ref={menuRef} className={`absolute z-50 w-52 rounded-xl bg-white dark:bg-slate-800 border border-line dark:border-slate-700 shadow-pop overflow-hidden ${pos==='up'?'bottom-full mb-2':'top-full mt-2'} right-0`}>
          <div className="px-3 py-2 border-b border-line dark:border-slate-700 bg-bg2/60 dark:bg-slate-900/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-slate-400">Option</div>
            <div className="text-xs font-bold text-ink dark:text-slate-100 line-clamp-1 mt-0.5">{c?.title||'Campaign'}</div>
          </div>
          <div className="p-1.5">
            {items.map((it,i) => it.sep
              ? <div key={i} className="my-1 h-px bg-line dark:bg-slate-700"/>
              : <button key={i} onClick={it.onClick} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-semibold text-left transition-colors ${it.danger?'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30':'text-ink/85 dark:text-slate-200 hover:bg-bg2 dark:hover:bg-slate-700 hover:text-ink dark:hover:text-slate-100'}`}>
                  <Icon name={it.icon} size={15} className={it.danger?'text-rose-500':'text-muted dark:text-slate-400'}/>
                  <span className="flex-1">{it.l}</span>
                </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignAdminCard({ c, onOpen, onEdit }){
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="relative aspect-[16/10]">
        {c.img
          ? <img src={c.img} className="absolute inset-0 w-full h-full object-cover" alt=""/>
          : <div className="absolute inset-0 flex items-center justify-center text-white/80" style={{background:c.thumb||'linear-gradient(135deg,#2E4191,#38B6FF)'}}><Icon name={c.icon||'heart'} size={48} strokeWidth={1.2}/></div>
        }
        <div className="absolute top-3 left-3 flex gap-2"><Badge tone="cyan" size="sm">{c.category}</Badge></div>
        <div className="absolute top-3 right-3"><StatusBadge status={c.status}/></div>
      </div>
      <div className="p-4">
        <div className="font-semibold leading-snug line-clamp-2 min-h-[44px] text-ink dark:text-slate-100">{c.title}</div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-bold text-brand-700 dark:text-brand-300 tnum">{fmtShort(c.raised)}</span>
          <span className="text-xs text-muted dark:text-slate-400 tnum">{fmtShort(c.target)}</span>
        </div>
        <div className="mt-2"><ProgressBar value={c.raised} max={c.target} size="sm"/></div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted dark:text-slate-400">
          <span><span className="font-bold text-ink dark:text-slate-200 tnum">{fmtNum(c.donors)}</span> donatur</span>
          <span className="tnum">{c.days>0?`${c.days} hari`:'Selesai'}</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <Button variant="soft" size="sm" full onClick={onOpen} icon={<Icon name="eye" size={14}/>}>Preview</Button>
          <CampaignOptionMenu c={c} onEdit={()=>onEdit&&onEdit(c)} onPreview={onOpen}/>
        </div>
      </div>
    </Card>
  );
}

// ====================== Analytics ======================
function AnalyticsPage(){
  const [platform, setPlatform] = uS_adm('all');
  const [overview, setOverview] = uS_adm(null);
  const [trafficSources, setTrafficSources] = uS_adm([]);
  const [chartData, setChartData] = uS_adm([]);
  const [campaignPerf, setCampaignPerf] = uS_adm(null);
  const [utmData, setUtmData] = uS_adm(null);
  const [range, setRange] = uS_adm(null);

  uE_adm(()=>{
    api.analyticsOverview().then(r => r?.data && setOverview(r.data));
    api.analyticsTraffic().then(r => { if(r?.data && r.data.length > 0) setTrafficSources(r.data); });
    api.analyticsCampaigns().then(r => r?.data && setCampaignPerf(r.data));
    api.analyticsUTM().then(r => r?.data && setUtmData(r.data));
    api.dailyChart(30).then(r => { if(r?.data) setChartData(r.data.map(d=>({date:new Date(d.date),amount:d.amount,count:d.count}))); });
  },[]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        subtitle="Performance campaign & ads tracking"
        actions={<>
          <DateRangePill value={range} onChange={setRange}/>
          <Button variant="secondary" icon={<Icon name="download" size={16}/>} onClick={()=>{if(typeof exportCSV==='function'&&campaignPerf)exportCSV(campaignPerf,'analytics',range);}}>Export</Button>
        </>}
      />

      {/* Platform tabs */}
      <Card padded={false} className="p-1.5">
        <div className="flex flex-wrap gap-1">
          {[
            ['all','Semua Platform','#64748B'],
            ['meta','Meta Ads','#2E4191'],
            ['google','Google Ads','#38B6FF'],
            ['tiktok','TikTok Ads','#0e83c8'],
            ['organic','Organic','#94a3b8'],
          ].map(([k,l,c])=>(
            <button key={k} onClick={()=>setPlatform(k)} className={`px-4 h-10 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition ${platform===k?'bg-brand-600 text-white':'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <span className="w-2 h-2 rounded-full" style={{background:c}}/>
              {l}
            </button>
          ))}
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Visitor" value={overview?.visitors || '314.700'} sub="30 hari" tone="brand" icon={<Icon name="eye" size={20}/>} trend={{up:true,value:overview?.visitors_trend || '+14.2%'}}/>
        <Stat label="Leads" value={overview?.leads || '11.180'} sub="Form view" tone="cyan" icon={<Icon name="sparkle" size={20}/>} trend={{up:true,value:overview?.leads_trend || '+8.6%'}}/>
        <Stat label="Donation" value={overview?.donations || '4.920'} sub="Tx sukses" tone="green" icon={<Icon name="heart" size={20}/>} trend={{up:true,value:overview?.donations_trend || '+22.1%'}}/>
        <Stat label="Conv. Rate" value={overview?.conv_rate || '4.7%'} sub="Visitor → Donatur" tone="amber" icon={<Icon name="chart" size={20}/>} trend={{up:true,value:overview?.conv_rate_trend || '+0.6%'}}/>
        <Stat label="Cost / Lead" value={overview?.cpl || 'Rp4.870'} sub="CPL rata-rata" tone="cyan" icon={<Icon name="wallet" size={20}/>}/>
        <Stat label="Cost / Donation" value={overview?.cpa || 'Rp17.500'} sub="CPA rata-rata" tone="amber" icon={<Icon name="wallet" size={20}/>}/>
        <Stat label="Revenue / Campaign" value={overview?.rev_per_campaign ? fmtShort(overview.rev_per_campaign) : fmtShort(348_500_000)} sub="Rata-rata" tone="brand" icon={<Icon name="star" size={20}/>}/>
        <Stat label="ROAS Estimasi" value={overview?.roas || '4.8×'} sub="Return on ad spend" tone="green" icon={<Icon name="chart" size={20}/>} trend={{up:true,value:overview?.roas_trend || '+0.3×'}}/>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Performance line */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold text-ink dark:text-slate-100">Performa Campaign</div>
              <div className="text-xs text-muted dark:text-slate-400">Donasi vs Spend iklan · 30 hari</div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-brand-600"></span>Donasi</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-cyan2-400"></span>Spend</span>
            </div>
          </div>
          <div className="text-slate-700 dark:text-slate-300">
            <LineChart data={chartData} height={220}/>
          </div>
        </Card>

        {/* Traffic source donut */}
        <Card>
          <div className="font-bold text-ink dark:text-slate-100 mb-2">Sumber Traffic</div>
          <div className="flex items-center justify-center my-2">
            <Donut size={170} thickness={26} segments={trafficSources.map(s=>({value:s.visits, color:s.color}))} center={<><div className="text-xl font-extrabold tnum">{fmtNum(trafficSources.reduce((a,b)=>a+b.visits,0))}</div><div className="text-xs text-muted dark:text-slate-400">Visitor</div></>}/>
          </div>
          <div className="space-y-1.5 text-sm">
            {trafficSources.map(s=>(
              <div key={s.src} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{background:s.color}}/>
                <span className="flex-1 text-slate-600 dark:text-slate-400">{s.src}</span>
                <span className="font-semibold tnum">{fmtNum(s.visits)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Campaign performance table */}
      <Card padded={false}>
        <div className="p-5 flex items-center justify-between">
          <div>
            <div className="font-bold text-ink dark:text-slate-100">Campaign Performance</div>
            <div className="text-xs text-muted dark:text-slate-400">Klik kolom untuk sort</div>
          </div>
          <Button variant="secondary" size="sm" icon={<Icon name="filter" size={14}/>}>Filter</Button>
        </div>
        <div className="overflow-x-auto nice-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                <th className="px-5 py-3 font-semibold">Campaign</th>
                <th className="px-5 py-3 font-semibold">Visitor</th>
                <th className="px-5 py-3 font-semibold">Leads</th>
                <th className="px-5 py-3 font-semibold">Donation</th>
                <th className="px-5 py-3 font-semibold">CR</th>
                <th className="px-5 py-3 font-semibold">Revenue</th>
                <th className="px-5 py-3 font-semibold">Spend</th>
                <th className="px-5 py-3 font-semibold">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-slate-800">
              {(campaignPerf || CAMPAIGNS.slice(0,6).map((c,i)=>{
                const vis = 18000 + i*4200;
                const leads = Math.round(vis * (0.04 + i*0.005));
                const don = Math.round(leads * (0.3 + i*0.04));
                return { id:c.id, title:c.title, img:c.img, visitors:vis, leads, donations:don, revenue:c.raised, spend:Math.round(c.raised/(3+i*0.3)) };
              })).map(cp=>{
                const roas = cp.spend > 0 ? (cp.revenue/cp.spend).toFixed(1)+'×' : '∞';
                const cr = cp.visitors > 0 ? (cp.donations/cp.visitors*100).toFixed(1)+'%' : '0%';
                return (
                  <tr key={cp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 rounded-md overflow-hidden shrink-0"><img src={cp.img || placeholderImg(0,'')} className="w-full h-full object-cover" alt=""/></div>
                        <div className="font-medium text-ink dark:text-slate-100 truncate max-w-[220px]">{cp.title}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3 tnum">{fmtNum(cp.visitors)}</td>
                    <td className="px-5 py-3 tnum">{fmtNum(cp.leads)}</td>
                    <td className="px-5 py-3 tnum">{fmtNum(cp.donations)}</td>
                    <td className="px-5 py-3 tnum">{cr}</td>
                    <td className="px-5 py-3 font-bold text-brand-700 dark:text-brand-300 tnum">{fmtShort(cp.revenue)}</td>
                    <td className="px-5 py-3 tnum">{fmtShort(cp.spend)}</td>
                    <td className="px-5 py-3"><Badge tone={parseFloat(roas)>=3?'green':'amber'}>{roas}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* UTM tracking */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-ink dark:text-slate-100">UTM Tracking</div>
            <div className="text-xs text-muted dark:text-slate-400">Parameter pelacakan iklan yang aktif</div>
          </div>
          <Badge tone="green" dot>Tersinkron</Badge>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(utmData || [
            ['utm_source','facebook','3.240 sesi'],
            ['utm_medium','cpc','5.180 sesi'],
            ['utm_campaign','ramadhan-2026','2.120 sesi'],
            ['utm_content','hero-video-v3','1.640 sesi'],
            ['utm_term','beasiswa-anak','920 sesi'],
            ['fbclid','✓ tertangkap','2.180 klik'],
            ['gclid','✓ tertangkap','1.420 klik'],
            ['ttclid','✓ tertangkap','680 klik'],
          ]).map(([k,v,sub])=>(
            <div key={k} className="surface-2 rounded-xl p-3">
              <div className="text-[11px] font-mono text-muted dark:text-slate-400">{k}</div>
              <div className="font-bold text-sm text-ink dark:text-slate-100 truncate mt-0.5">{v}</div>
              <div className="text-xs text-muted dark:text-slate-400">{sub}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ====================== Campaign Editor View ======================
function CampaignEditorView() {
  const { editingCampaign, setView, setEditingCampaign, showToast } = useApp();
  const isEdit = !!editingCampaign;
  const c = editingCampaign;

  const [title, setTitle] = uS_adm(c?.title || '');
  const [shortDesc, setShortDesc] = uS_adm(c?.short_description || c?.shortDesc || '');
  const [content, setContent] = uS_adm(c?.description || c?.content || '');
  const [target, setTarget] = uS_adm(c?.target || 0);
  const [durationDays, setDurationDays] = uS_adm(c?.duration_days || 90);
  const [location, setLocation] = uS_adm(c?.location_name || c?.location || '');
  const [gmaps, setGmaps] = uS_adm(c?.location_gmaps || c?.gmaps || '');
  const [categoryId, setCategoryId] = uS_adm(c?.category_id || '');
  const [categories, setCategories] = uS_adm([]);
  const [status, setStatus] = uS_adm(c?.status || 'Draft');
  const [thumb, setThumb] = uS_adm(c?.image || c?.thumb || null);

  uE_adm(()=>{ api.categories().then(r=>{ if(r?.data) setCategories(r.data); }).catch(()=>{}); },[]);

  const autoSlug = (title || c?.title || 'kampanye-baru').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const [longSlug, setLongSlug] = uS_adm(c?.id ? autoSlug : autoSlug);
  const [shortSlug, setShortSlug] = uS_adm(c?.id || 'djag7hj20pg');
  const [longTouched, setLongTouched] = uS_adm(false);
  uE_adm(() => {
    if (!longTouched) setLongSlug((title || 'kampanye-baru').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''));
  }, [title]);

  const [formMode, setFormMode] = uS_adm('Donation');
  const [formStyle, setFormStyle] = uS_adm('Card');

  const [adv, setAdv] = uS_adm({
    payment: 'Default', form: 'Default', fundraising: 'Default', wa: 'Default',
    followup: 'Default', metaPixel: 'Default', tiktokPixel: 'Default', gtm: 'Default',
    socialProof: 'Hide', popupInfo: 'Hide', waFlying: 'Default', extLink: 'Default', general: 'Default',
  });

  const [formCustom, setFormCustom] = uS_adm({
    button1: 'Tunaikan Fidyah', button2: 'Tunaikan Fidyah Sekarang',
    smallTitleCampaign: '', smallTitleDonate: '',
    anonim: true, email: false, comment: true,
  });

  const [nominals, setNominals] = uS_adm([
    { amount: 45000,  label: '1 Hari : 45k',  fav: false },
    { amount: 90000,  label: '2 Hari : 90K',  fav: false },
    { amount: 135000, label: '3 Hari : 135K', fav: false },
    { amount: 225000, label: '5 Hari : 225K', fav: true  },
  ]);
  const [minDonasi, setMinDonasi] = uS_adm(45000);
  const [maxDonasi, setMaxDonasi] = uS_adm(0);
  const [advOpen, setAdvOpen] = uS_adm(true);

  const back = () => { setEditingCampaign(null); setView('campaigns'); };

  const handleSave = (publish) => {
    if (!title.trim()) { showToast('Judul campaign wajib diisi'); return; }
    if (!shortDesc.trim()) { showToast('Deskripsi singkat wajib diisi'); return; }
    if (!content.trim()) { showToast('Deskripsi lengkap wajib diisi'); return; }
    const data = {
      title, short_description: shortDesc, description: content, target: Number(target),
      duration_days: Number(durationDays), location_name: location, location_gmaps: gmaps,
      category_id: categoryId, status: publish ? 'Published' : 'Draft',
      form_type: formMode.toLowerCase(), form_style: formStyle,
      opt_nominal: JSON.stringify(nominals), min_donation: minDonasi, max_donation: maxDonasi,
      slug: longSlug, image: thumb || '',
      socialproof: adv.socialProof !== 'Hide', fundraiser_setting: adv.fundraising !== 'Default',
      wa_notification: adv.wa !== 'Default', followup_enabled: adv.followup !== 'Default',
      popup_info: adv.popupInfo !== 'Hide', wa_flying_button: adv.waFlying !== 'Default',
    };
    const promise = isEdit ? api.updateCampaign(c.id, data) : api.createCampaign(data);
    promise.then((res) => {
      if (res?.success === false) { showToast(res.message || 'Gagal menyimpan'); return; }
      showToast(publish ? 'Campaign berhasil dipublish' : 'Campaign disimpan sebagai draft');
      setTimeout(back, 700);
    }).catch((e) => showToast('Gagal: ' + (e.message || 'Error')));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-slate-100 tracking-tight">{isEdit ? 'Edit Campaign' : 'Add New Campaign'}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <button onClick={back} className="text-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-100 font-medium">Data Campaign</button>
            <Icon name="chevronR" size={12} className="text-mute dark:text-slate-400"/>
            <span className="text-brand-600 font-semibold">{isEdit ? 'Edit Campaign' : 'Add New'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<Icon name="chevronL" size={16}/>} onClick={back}>Kembali</Button>
          {isEdit && <Button variant="secondary" icon={<Icon name="eye" size={16}/>} onClick={()=>window.open('/donasi/'+(c.slug||c.id),'_blank')}>View Public</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Campaign card + Advanced Option */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5 lg:p-6">
            <div className="font-bold text-ink dark:text-slate-100 text-lg mb-5">Campaign</div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-5">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-ink dark:text-slate-100">Title / Judul <span className="text-rose-600">*</span></label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm text-ink dark:text-slate-100" placeholder="Cth: Lunasi Hutang Puasamu, Bayar Fidyahmu!"/>
                </div>
                <div>
                  <label className="text-sm font-semibold text-ink dark:text-slate-100">Deskripsi Singkat <span className="text-rose-600">*</span></label>
                  <input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm text-ink dark:text-slate-100" placeholder="Ringkasan 1-2 kalimat untuk tampil di daftar campaign"/>
                </div>
              </div>
              <CEditorThumb thumb={thumb} onChange={setThumb}/>
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-ink dark:text-slate-100">Deskripsi Lengkap <span className="text-rose-600">*</span></label>
              <RichEditor value={content} onChange={setContent}/>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-ink dark:text-slate-100">Target donasi <span className="text-rose-600">*</span></label>
                <div className="mt-1.5 flex items-center rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
                  <span className="pl-3 text-brand-600 font-bold">Rp</span>
                  <input type="number" value={target} onChange={(e) => setTarget(+e.target.value)} className="flex-1 px-2 py-2.5 outline-none font-bold text-ink dark:text-slate-100 text-right bg-transparent" placeholder="1.000.000"/>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-ink dark:text-slate-100">Durasi (hari) <span className="text-rose-600">*</span></label>
                <input type="number" value={durationDays} onChange={(e) => setDurationDays(+e.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm text-ink dark:text-slate-100" placeholder="90"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-ink dark:text-slate-100">Location / Lokasi</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm text-ink dark:text-slate-100" placeholder="Contoh: Bandung, Jawa Barat"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-ink dark:text-slate-100">Link Gmaps</label>
                <input value={gmaps} onChange={(e) => setGmaps(e.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm text-ink dark:text-slate-100" placeholder="https://maps.google.com/..."/>
              </div>
            </div>
            <div className="mt-4 text-xs text-muted"><b className="text-ink dark:text-slate-100">Note:</b> <span className="text-rose-600">*</span> Wajib diisi</div>
          </Card>

          {/* Advanced option */}
          <Card className="p-5 lg:p-6">
            <button onClick={() => setAdvOpen(!advOpen)} className="w-full flex items-center justify-between">
              <div className="font-bold text-ink dark:text-slate-100 text-lg">Advanced Option</div>
              <Icon name="chevronD" size={18} className={"text-mute dark:text-slate-400 transition-transform "+(advOpen?"rotate-180":"")}/>
            </button>
            {advOpen && (
              <div className="mt-5 space-y-6">
                <CEditorAdvRadio label="Payment" value={adv.payment} options={['Default','Custom']} onChange={(v) => setAdv({...adv, payment:v})}/>
                <div>
                  <CEditorAdvRadio label="Form" value={adv.form} options={['Default','Custom']} onChange={(v) => setAdv({...adv, form:v})}/>
                  {adv.form === 'Custom' && (
                    <div className="mt-4 p-4 lg:p-5 rounded-xl surface-2 border border-line dark:border-slate-700 space-y-5">
                      <div>
                        <div className="font-bold text-ink dark:text-slate-100 mb-3">Page Campaign</div>
                        <div>
                          <label className="text-xs font-semibold text-muted dark:text-slate-400">Button 1</label>
                          <input value={formCustom.button1} onChange={(e) => setFormCustom({...formCustom, button1:e.target.value})} className="mt-1 w-full h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm"/>
                        </div>
                      </div>
                      <div className="pt-5 border-t border-line dark:border-slate-700">
                        <div className="font-bold text-ink dark:text-slate-100 mb-3">Page Form</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div><label className="text-xs font-semibold text-muted dark:text-slate-400">Button 2</label><input value={formCustom.button2} onChange={(e) => setFormCustom({...formCustom, button2:e.target.value})} className="mt-1 w-full h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm"/></div>
                          <div><label className="text-xs font-semibold text-muted dark:text-slate-400">Small Title Campaign</label><input value={formCustom.smallTitleCampaign} onChange={(e) => setFormCustom({...formCustom, smallTitleCampaign:e.target.value})} className="mt-1 w-full h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm"/></div>
                          <div><label className="text-xs font-semibold text-muted dark:text-slate-400">Small Title Donate</label><input value={formCustom.smallTitleDonate} onChange={(e) => setFormCustom({...formCustom, smallTitleDonate:e.target.value})} className="mt-1 w-full h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm"/></div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <CEditorFieldToggle label="Anonim" value={formCustom.anonim} onChange={(v) => setFormCustom({...formCustom, anonim:v})}/>
                          <CEditorFieldToggle label="Email" value={formCustom.email} onChange={(v) => setFormCustom({...formCustom, email:v})}/>
                          <CEditorFieldToggle label="Comment" value={formCustom.comment} onChange={(v) => setFormCustom({...formCustom, comment:v})}/>
                        </div>
                      </div>
                      <div className="pt-5 border-t border-line dark:border-slate-700">
                        <div className="font-bold text-ink dark:text-slate-100 mb-3">Pilihan Nominal Donasi</div>
                        <div className="space-y-2">
                          {nominals.map((n, i) => (
                            <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-center">
                              <input type="number" value={n.amount} onChange={(e) => { const arr = [...nominals]; arr[i].amount = +e.target.value; setNominals(arr); }} className="w-full h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm"/>
                              <input value={n.label} onChange={(e) => { const arr = [...nominals]; arr[i].label = e.target.value; setNominals(arr); }} className="w-full h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm"/>
                              <label className="inline-flex items-center gap-2 text-xs font-semibold text-ink dark:text-slate-100 whitespace-nowrap pl-2">
                                <input type="radio" checked={n.fav} onChange={() => setNominals(nominals.map((x, j) => ({ ...x, fav: i === j })))} className="accent-emerald-600 h-4 w-4"/>
                                Sering di Pilih
                              </label>
                              <button onClick={() => setNominals(nominals.filter((_, j) => j !== i))} className="h-9 w-9 rounded-md text-muted dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center justify-center">
                                <Icon name="trash" size={14}/>
                              </button>
                            </div>
                          ))}
                          <button onClick={() => setNominals([...nominals, { amount:0, label:'', fav:false }])} className="mt-2 px-3 py-2 rounded-lg border border-dashed border-line dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-700">+ Tambah Nominal</button>
                        </div>
                      </div>
                      <div className="pt-5 border-t border-line dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="font-bold text-ink dark:text-slate-100 mb-1">Minimum Donasi</div>
                          <input type="number" value={minDonasi} onChange={(e) => setMinDonasi(+e.target.value)} className="w-full h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm"/>
                          <div className="text-[11px] text-muted dark:text-slate-400 mt-1">Minimum Donasi yang diperbolehkan ketika donatur mengetik donasi pada form.</div>
                        </div>
                        <div>
                          <div className="font-bold text-ink dark:text-slate-100 mb-1">Maximum Donasi</div>
                          <input type="number" value={maxDonasi} onChange={(e) => setMaxDonasi(+e.target.value)} className="w-full h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm"/>
                          <div className="text-[11px] text-muted dark:text-slate-400 mt-1">Maximum Donasi yang diperbolehkan. (0 = tanpa batas)</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <CEditorAdvRadio label="Fundraising" value={adv.fundraising} options={['Default','Custom']} onChange={(v) => setAdv({...adv, fundraising:v})}/>
                <CEditorAdvRadio label="Whatsapp Notification" value={adv.wa} options={['Default','Custom']} onChange={(v) => setAdv({...adv, wa:v})}/>
                <CEditorAdvRadio label="Multiple Follow-Up & Payment Success Message" sub="( Trigger by Button Follow-up & Payment Status Button )" value={adv.followup} options={['Default','Custom']} onChange={(v) => setAdv({...adv, followup:v})}/>
                <CEditorAdvRadio label="Meta Pixel (Facebook)" value={adv.metaPixel} options={['Default','Custom']} onChange={(v) => setAdv({...adv, metaPixel:v})}/>
                <CEditorAdvRadio label="Tiktok Pixel" value={adv.tiktokPixel} options={['Default','Custom']} onChange={(v) => setAdv({...adv, tiktokPixel:v})}/>
                <CEditorAdvRadio label="Google Tag Manager" value={adv.gtm} options={['Default','Custom']} onChange={(v) => setAdv({...adv, gtm:v})}/>
                <CEditorAdvRadio label="Social Proof" value={adv.socialProof} options={['Hide','Show']} onChange={(v) => setAdv({...adv, socialProof:v})}/>
                <CEditorAdvRadio label="Popup Info (Form)" value={adv.popupInfo} options={['Hide','Show']} onChange={(v) => setAdv({...adv, popupInfo:v})}/>
                <CEditorAdvRadio label="Whatsapp Flying Button" value={adv.waFlying} options={['Default','Custom']} onChange={(v) => setAdv({...adv, waFlying:v})}/>
                <CEditorAdvRadio label="External Link Button" value={adv.extLink} options={['Default','Custom']} onChange={(v) => setAdv({...adv, extLink:v})}/>
                <CEditorAdvRadio label="General" value={adv.general} options={['Default','Custom']} onChange={(v) => setAdv({...adv, general:v})}/>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT: Form Type + Publish */}
        <div className="lg:col-span-1 space-y-5">
          <Card className="p-5">
            <div className="font-bold text-ink dark:text-slate-100 text-lg mb-4">Form Type</div>
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-line dark:border-slate-700 w-full">
              {['Donation','Zakat'].map((m) => (
                <button key={m} onClick={() => setFormMode(m)}
                  className={`flex-1 px-3 py-2 text-sm font-bold rounded-md transition-all ${formMode === m ? 'bg-brand-600 text-white shadow-sm' : 'text-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-100'}`}>
                  {m}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5">
              {['List','Typing','Package','Card','Package2','Qurban'].map((s) => (
                <label key={s} className="inline-flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" checked={formStyle === s} onChange={() => setFormStyle(s)} className="accent-emerald-600 h-4 w-4"/>
                  <span className={formStyle === s ? 'font-bold text-ink dark:text-slate-100' : 'text-ink/85 dark:text-slate-300'}>{s === 'Package2' ? 'Package 2' : s}</span>
                </label>
              ))}
            </div>
            <CEditorFormPreview style={formStyle}/>
          </Card>

          <Card className="p-5">
            <div className="font-bold text-ink dark:text-slate-100 text-lg mb-4">Publish</div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                <div className="text-muted dark:text-slate-400">Category</div>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-10 px-3 rounded-xl border border-line bg-white dark:bg-slate-800 dark:border-slate-700 text-sm text-ink dark:text-slate-100">
                  <option value="">Pilih kategori</option>
                  {categories.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                <div className="text-muted dark:text-slate-400">Status</div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={status}/>
                </div>
              </div>
              {isEdit && (
                <>
                  <CEditorUrlRow label="Long URL" prefix="https://niatbaik.org/c/" value={longSlug}
                    onChange={(v) => { setLongSlug(v); setLongTouched(true); }} onCopy={() => showToast('Long URL disalin')}
                    sanitize={(v) => v.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-+|-+$/g,'')} helper="Hanya huruf kecil, angka, dan tanda strip (-)." minLen={3}/>
                  <CEditorUrlRow label="Short URL" prefix="https://niatbaik.org/c/" value={shortSlug}
                    onChange={setShortSlug} onCopy={() => showToast('Short URL disalin')}
                    sanitize={(v) => v.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0, 16)} helper="Maks 16 karakter alfanumerik." minLen={4} maxLen={16}/>
                </>
              )}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => handleSave(false)} className="px-3 py-2.5 rounded-lg border-2 border-brand-600 text-brand-600 font-bold text-sm hover:bg-brand-50">
                {isEdit ? 'View' : 'Save to Draft'}
              </button>
              <button onClick={() => handleSave(true)} className="px-3 py-2.5 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 shadow-sm">
                {isEdit ? 'Update' : 'Publish'}
              </button>
            </div>
          </Card>

          {isEdit && (
            <Card className="p-5">
              <div className="font-bold text-ink dark:text-slate-100 text-lg mb-3">CS Rotator</div>
              <div className="space-y-2">
                {['Putri Maharani', 'Bagus Santoso'].map((n, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-line dark:border-slate-700">
                    <div className="h-8 w-8 rounded-full bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 flex items-center justify-center font-bold text-xs">{n.split(' ').map(s=>s[0]).join('')}</div>
                    <div className="flex-1 text-sm font-semibold text-ink dark:text-slate-100">{n}</div>
                    <Badge tone="green" size="sm" dot>aktif</Badge>
                  </div>
                ))}
              </div>
              <button className="mt-3 w-full px-3 py-2 rounded-lg border border-dashed border-line dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-700">+ Add CS</button>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom sticky action bar on mobile */}
      <div className="lg:hidden sticky bottom-0 -mx-4 px-4 py-3 bg-white dark:bg-slate-900 border-t border-line dark:border-slate-700 flex gap-2">
        <button onClick={() => handleSave(false)} className="flex-1 px-3 py-2.5 rounded-lg border-2 border-brand-600 text-brand-600 font-bold text-sm">Save Draft</button>
        <button onClick={() => handleSave(true)} className="flex-1 px-3 py-2.5 rounded-lg bg-brand-600 text-white font-bold text-sm">Publish</button>
      </div>
    </div>
  );
}

// -- Rich Text Editor --
function RichEditor({ value, onChange }){
  const editorRef = React.useRef();
  const [mode, setMode] = uS_adm('visual');

  const exec = (cmd, val) => { document.execCommand(cmd, false, val); editorRef.current?.focus(); onChange(editorRef.current?.innerHTML || ''); };

  const toolbar = [
    { cmd:'bold', icon:'B', cls:'font-bold' },
    { cmd:'italic', icon:'I', cls:'italic' },
    { sep:true },
    { cmd:'formatBlock', val:'H2', icon:'H2', cls:'font-bold text-xs' },
    { cmd:'formatBlock', val:'H3', icon:'H3', cls:'font-bold text-xs' },
    { cmd:'formatBlock', val:'P', icon:'P', cls:'text-xs' },
    { cmd:'formatBlock', val:'BLOCKQUOTE', icon:'"', cls:'font-serif' },
    { sep:true },
    { cmd:'insertUnorderedList', icon:'UL', cls:'text-xs' },
    { cmd:'insertOrderedList', icon:'OL', cls:'text-xs' },
    { sep:true },
    { cmd:'createLink', prompt:true, icon:'Link', cls:'text-xs underline' },
  ];

  const handleInput = () => { onChange(editorRef.current?.innerHTML || ''); };

  uE_adm(()=>{
    if (editorRef.current && mode === 'visual' && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [mode]);

  return (
    <div className="mt-1.5 rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex-wrap">
        {toolbar.map((t,i) => t.sep
          ? <div key={i} className="w-px h-5 bg-line dark:bg-slate-700 mx-1"/>
          : <button key={i} type="button" onMouseDown={(e)=>{
              e.preventDefault();
              if (t.prompt) { const v = prompt('URL:'); if(v) exec(t.cmd, v); }
              else exec(t.cmd, t.val);
            }}
            className={`h-7 min-w-[28px] px-1.5 rounded-md text-sm hover:bg-slate-200 dark:hover:bg-slate-700 text-ink dark:text-slate-200 ${t.cls||''}`}>
            {t.icon}
          </button>
        )}
        <div className="flex-1"/>
        <div className="flex bg-slate-200 dark:bg-slate-700 rounded-md p-0.5">
          <button type="button" onClick={()=>setMode('visual')} className={`px-2 py-0.5 rounded text-[10px] font-bold ${mode==='visual'?'bg-white dark:bg-slate-600 shadow-sm text-ink dark:text-slate-100':'text-muted dark:text-slate-400'}`}>Visual</button>
          <button type="button" onClick={()=>setMode('html')} className={`px-2 py-0.5 rounded text-[10px] font-bold ${mode==='html'?'bg-white dark:bg-slate-600 shadow-sm text-ink dark:text-slate-100':'text-muted dark:text-slate-400'}`}>HTML</button>
        </div>
      </div>
      {mode === 'visual' ? (
        <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={handleInput}
          className="min-h-[240px] px-4 py-3 text-sm text-ink dark:text-slate-100 prose prose-sm dark:prose-invert max-w-none focus:outline-none"
          dangerouslySetInnerHTML={{__html: value || ''}}/>
      ) : (
        <textarea value={value} onChange={(e)=>onChange(e.target.value)} rows={12}
          className="w-full px-4 py-3 text-sm font-mono text-ink dark:text-slate-100 bg-transparent focus:outline-none resize-none"/>
      )}
    </div>
  );
}

// -- CampaignEditor subcomponents --
function CEditorThumb({ thumb, onChange }) {
  return (
    <div>
      <div className="aspect-[13/7] rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-line dark:border-slate-700 hover:border-brand-400 cursor-pointer overflow-hidden relative" style={thumb ? { background: thumb } : {}}>
        {!thumb && <div className="h-full w-full flex items-center justify-center text-muted dark:text-slate-400 text-xs font-semibold">650 x 350</div>}
        <div className="absolute top-2 right-2 h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-pop">
          <Icon name="upload" size={14}/>
        </div>
      </div>
      <button onClick={() => onChange(thumb ? null : 'linear-gradient(135deg, #38B6FF 0%, #2E4191 100%)')} className="mt-2 w-full text-xs font-semibold text-brand-600 hover:underline">
        {thumb ? 'Hapus gambar' : 'Pilih dari galeri'}
      </button>
    </div>
  );
}

function CEditorUrlRow({ label, prefix, value, onChange, onCopy, sanitize, helper, minLen = 3, maxLen }) {
  const [editing, setEditing] = uS_adm(false);
  const [draft, setDraft] = uS_adm(value);
  const inputRef = React.useRef();
  uE_adm(() => { if (editing) { setDraft(value); setTimeout(() => inputRef.current?.focus(), 0); } }, [editing]);
  const save = () => { const clean = sanitize ? sanitize(draft.trim()) : draft.trim(); if (clean.length < minLen) return; onChange(clean); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };
  const cleaned = sanitize ? sanitize(draft) : draft;
  const tooShort = cleaned.length < minLen;
  const tooLong = maxLen && cleaned.length > maxLen;
  return (
    <div className="grid grid-cols-[80px_1fr] items-start gap-3 pt-2 border-t border-line dark:border-slate-700">
      <div className="text-muted dark:text-slate-400 pt-0.5">{label}</div>
      <div>
        {!editing ? (
          <div className="flex items-start gap-1">
            <div className="text-xs font-mono text-ink dark:text-slate-100 leading-snug break-all flex-1">
              <span className="text-muted dark:text-slate-400">{prefix}</span>
              <span className="bg-brand-50 text-brand-700 dark:text-brand-300 px-1 rounded font-bold">{value}</span>
            </div>
            <button onClick={() => setEditing(true)} className="shrink-0 h-7 w-7 rounded-md hover:bg-brand-50 text-muted dark:text-slate-400 hover:text-brand-600 flex items-center justify-center"><Icon name="edit" size={13}/></button>
            <button onClick={onCopy} className="shrink-0 h-7 w-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-100 flex items-center justify-center"><Icon name="copy" size={13}/></button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-lg border-2 border-brand-600 bg-white dark:bg-slate-800 overflow-hidden ring-2 ring-brand-600/15">
              <div className="px-2 py-1.5 text-[11px] font-mono text-muted dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-b border-line dark:border-slate-700 break-all">{prefix}</div>
              <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }} placeholder="slug-campaign" className="w-full px-2.5 py-1.5 font-mono text-sm text-ink dark:text-slate-100 focus:outline-none bg-transparent"/>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px]">
                {tooShort && <span className="text-rose-600 font-semibold">Minimal {minLen} karakter</span>}
                {tooLong && <span className="text-rose-600 font-semibold">Maksimal {maxLen} karakter</span>}
                {!tooShort && !tooLong && helper && <span className="text-muted dark:text-slate-400">{helper}</span>}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={cancel} className="px-2 py-1 rounded-md text-xs font-bold text-ink dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-line dark:border-slate-700">Batal</button>
                <button onClick={save} disabled={tooShort || tooLong} className={`px-2.5 py-1 rounded-md text-xs font-bold text-white ${tooShort || tooLong ? 'bg-slate-300 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700'}`}>Simpan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CEditorAdvRadio({ label, sub, value, options, onChange }) {
  return (
    <div className="pb-5 border-b border-line dark:border-slate-700 last:border-0 last:pb-0">
      <div className="font-bold text-ink dark:text-slate-100">{label}</div>
      {sub && <div className="text-xs text-muted dark:text-slate-400 mt-0.5">{sub}</div>}
      <div className="mt-2.5 flex flex-wrap items-center gap-5">
        {options.map((o) => (
          <label key={o} className="inline-flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" checked={value === o} onChange={() => onChange(o)} className="h-4 w-4 accent-emerald-600"/>
            <span className={value === o ? 'font-bold text-ink dark:text-slate-100' : 'text-ink/80 dark:text-slate-400'}>{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function CEditorFieldToggle({ label, value, onChange }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted dark:text-slate-400 mb-1.5">{label}</div>
      <button onClick={() => onChange(!value)} className="inline-flex items-center gap-2">
        <span className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-all ${value ? 'left-[22px]' : 'left-0.5'}`}/>
        </span>
        <span className={`text-sm font-bold ${value ? 'text-ink dark:text-slate-100' : 'text-muted'}`}>{value ? 'Show' : 'Hide'}</span>
      </button>
    </div>
  );
}

function CEditorFormPreview({ style }) {
  return (
    <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-line dark:border-slate-700 p-4">
      {style === 'List' && <div className="space-y-2">{[1,2,3,4].map(i=><div key={i} className="h-10 rounded-lg bg-white dark:bg-slate-700 border border-line dark:border-slate-700 flex items-center px-3 text-xs font-bold text-muted dark:text-slate-400">Rp</div>)}</div>}
      {style === 'Typing' && <div className="h-12 rounded-lg bg-white dark:bg-slate-700 border border-line dark:border-slate-700 flex items-center px-3 text-xs font-bold text-muted dark:text-slate-400">Rp [ ketik nominal... ]</div>}
      {style === 'Package' && <div className="grid grid-cols-2 gap-2">{[1,2,3,4].map(i=><div key={i} className="aspect-[3/2] rounded-lg bg-white dark:bg-slate-700 border border-line dark:border-slate-700 flex items-center justify-center text-xs font-bold text-muted dark:text-slate-400">Paket {i}</div>)}</div>}
      {style === 'Card' && <div className="grid grid-cols-3 gap-2">{['Rp','Rp','Rp','Rp'].map((p,i)=><div key={i} className="h-9 rounded-md bg-white dark:bg-slate-700 border border-line dark:border-slate-700 flex items-center justify-center text-xs font-bold text-muted dark:text-slate-400">{p}</div>)}<div className="col-span-2 h-9 rounded-md bg-white dark:bg-slate-700 border border-line dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-muted dark:text-slate-400">OTHER NOMINAL</div></div>}
      {style === 'Package2' && <div className="grid grid-cols-2 gap-2">{[1,2,3,4].map(i=><div key={i} className="aspect-square rounded-lg bg-white dark:bg-slate-700 border border-line dark:border-slate-700 p-2 flex flex-col"><div className="h-3/5 bg-slate-100 dark:bg-slate-600 rounded-md"/><div className="mt-1 text-[10px] font-bold text-muted dark:text-slate-400">Paket {i}</div></div>)}</div>}
      {style === 'Qurban' && <div className="space-y-2">{[{n:'Kambing',p:'Rp 2.500.000',d:'Bobot 28-32 kg'},{n:'Sapi (1/7)',p:'Rp 3.200.000',d:'Per kavling'}].map((q,i)=><div key={i} className="rounded-lg bg-white dark:bg-slate-700 border border-line dark:border-slate-700 p-3 flex items-center gap-2"><div className="h-10 w-10 rounded-md bg-slate-100 dark:bg-slate-600"/><div className="flex-1"><div className="text-xs font-bold text-ink dark:text-slate-100">{q.n} -- {q.p}</div><div className="text-[10px] text-muted">{q.d}</div></div><div className="text-[10px] font-bold text-brand-600">QURBAN</div></div>)}</div>}
    </div>
  );
}

// ====================== Data Studio View ======================
function DataStudioView() {
  const NB = window.NB || {};
  const dailyDonations = NB.dailyDonations || DAILY.map(d=>d.amount);
  const trafficSources = NB.trafficSources || TRAFFIC_SOURCES;
  const campaignSeed = NB.campaignSeed || CAMPAIGNS;
  const [page, setPage] = uS_adm('overview');
  const [dateRange, setDateRange] = uS_adm('Last 30 days');

  const pages = [
    { v:'overview', l:'Overview' },
    { v:'meta',     l:'Meta Ads' },
    { v:'google',   l:'Google Ads + GA4' },
    { v:'tiktok',   l:'TikTok Funnel' },
    { v:'geo',      l:'Geographic' },
    { v:'funnel',   l:'Conversion Funnel' },
  ];

  return (
    <div className="space-y-4 -mx-4 lg:-mx-6 -my-6 min-h-screen bg-[#F8F9FA] dark:bg-slate-950">
      {/* Data Studio top bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-line dark:border-slate-700">
        <div className="px-4 lg:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <DSLogo/>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-slate-400 leading-none">Looker Studio</div>
              <div className="font-extrabold text-ink dark:text-slate-100 text-base leading-tight">NIATBAIK.ORG -- Overview Donasi (Master)</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 ml-2 text-[10px] text-muted dark:text-slate-400">
            <Icon name="refresh" size={12}/> Refreshed 2m ago
          </div>
          <div className="flex-1"/>
          <button className="h-8 w-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-muted dark:text-slate-400"><Icon name="refresh" size={14}/></button>
          <button className="h-8 w-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-muted dark:text-slate-400"><Icon name="download" size={14}/></button>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#1A73E8] hover:bg-[#1666D5] text-white text-xs font-bold">
            <Icon name="link" size={14}/> Share
          </button>
        </div>
        <div className="px-4 lg:px-6 flex items-center gap-1 overflow-x-auto border-t border-line dark:border-slate-700">
          {pages.map((p) => (
            <button key={p.v} onClick={() => setPage(p.v)}
              className={`relative px-3 py-2.5 text-xs font-bold whitespace-nowrap transition-colors ${page === p.v ? 'text-[#1A73E8]' : 'text-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-100'}`}>
              {p.l}
              {page === p.v && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-[#1A73E8] rounded-full"/>}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-4 lg:px-6 flex flex-wrap items-center gap-2">
        <DSFilterPill label="Date range" value={dateRange} onChange={setDateRange} options={['Today','Last 7 days','Last 30 days','Last 90 days','Custom']}/>
        <DSFilterPill label="Platform" value="All" options={['All','Meta','Google','TikTok','Organic']}/>
        <DSFilterPill label="Campaign" value="All Campaigns" options={['All Campaigns', ...campaignSeed.map(c => (c.title||'').slice(0,30))]}/>
        <DSFilterPill label="Country" value="Indonesia" options={['Indonesia','Malaysia','Singapore','Global']}/>
        <DSFilterPill label="Device" value="All devices" options={['All devices','Mobile','Desktop','Tablet']}/>
        <div className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted dark:text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/>
          Live data
        </div>
      </div>

      <div className="px-4 lg:px-6 pb-8">
        {page === 'overview' && <DSPageOverview daily={dailyDonations} sources={trafficSources} campaigns={campaignSeed}/>}
        {page === 'meta'     && <DSPageMeta daily={dailyDonations}/>}
        {page === 'google'   && <DSPageGoogle daily={dailyDonations}/>}
        {page === 'tiktok'   && <DSPageTiktok daily={dailyDonations}/>}
        {page === 'geo'      && <DSPageGeo/>}
        {page === 'funnel'   && <DSPageFunnel sources={trafficSources}/>}
      </div>
    </div>
  );
}

function DSLogo() {
  return <svg width="32" height="32" viewBox="0 0 36 36" className="shrink-0"><circle cx="11" cy="14" r="6" fill="#4285F4"/><circle cx="22" cy="11" r="5" fill="#0F9D58"/><circle cx="20" cy="24" r="7" fill="#F4B400"/><circle cx="11" cy="14" r="6" fill="#4285F4" opacity="0.85"/></svg>;
}

function DSFilterPill({ label, value, options = [], onChange }) {
  return (
    <div className="inline-flex items-center gap-1.5 h-8 pl-2.5 pr-1 rounded-md bg-white dark:bg-slate-800 border border-line dark:border-slate-700 hover:border-[#1A73E8] cursor-pointer">
      <span className="text-[10px] uppercase tracking-wider font-bold text-muted dark:text-slate-400">{label}</span>
      <select value={value} onChange={(e) => onChange && onChange(e.target.value)} className="appearance-none bg-transparent pr-5 text-xs font-bold text-ink dark:text-slate-100 focus:outline-none cursor-pointer">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function DSScore({ label, value, delta, deltaTone = 'up', color = '#1A73E8' }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-md border border-[#DADCE0] dark:border-slate-700 p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-slate-400">{label}</div>
      <div className="mt-2 text-2xl lg:text-3xl font-extrabold leading-none" style={{ color }}>{value}</div>
      {delta && (
        <div className={`mt-2 inline-flex items-center gap-1 text-[11px] font-bold ${deltaTone === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {deltaTone === 'up' ? '+' : ''}{delta}
        </div>
      )}
    </div>
  );
}

function DSPanel({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-md border border-[#DADCE0] dark:border-slate-700 ${className}`}>
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div>
          <div className="text-[13px] font-bold text-ink dark:text-slate-100">{title}</div>
          {subtitle && <div className="text-[10px] text-muted dark:text-slate-400 mt-0.5">{subtitle}</div>}
        </div>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

function DSSeries({ daily }) {
  const w = 600, h = 200;
  const arr = Array.isArray(daily) ? daily : [];
  if (!arr.length) return <div className="h-[220px] flex items-center justify-center text-muted dark:text-slate-400 text-sm">No data</div>;
  const vals = arr.map(v => typeof v === 'object' ? (v.amount || 0) : (v || 0));
  const max = Math.max(...vals) * 1.2 || 1;
  const step = w / Math.max(vals.length - 1, 1);
  const path = vals.map((v, i) => `${i ? 'L' : 'M'} ${i*step} ${h - (v/max)*(h-20) - 5}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 220 }}>
      <defs><linearGradient id="dsg0" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1A73E8" stopOpacity="0.15"/><stop offset="100%" stopColor="#1A73E8" stopOpacity="0"/></linearGradient></defs>
      {[0,1,2,3].map(i => <line key={i} x1="0" x2={w} y1={5 + i*(h-20)/3} y2={5 + i*(h-20)/3} stroke="#DADCE0" strokeDasharray="2 3"/>)}
      <path d={path + ` L ${w} ${h} L 0 ${h} Z`} fill="url(#dsg0)"/>
      <path d={path} fill="none" stroke="#1A73E8" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}

function DSHeatmapChart() {
  const days = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const cell = (d, h) => { const p = Math.exp(-Math.pow((h - 20) / 4, 2)); const df = d === 4 || d === 5 ? 1.2 : 1; const n = ((d * 31 + h * 17) % 20) / 60; return Math.min(1, p * df + n); };
  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="flex pl-8 gap-0.5 text-[9px] text-muted dark:text-slate-400 mb-1">{hours.map(h=><div key={h} className="w-5 text-center">{h}</div>)}</div>
        {days.map((d, di) => (
          <div key={d} className="flex items-center gap-0.5 mb-0.5">
            <div className="w-8 text-[10px] font-bold text-muted dark:text-slate-400">{d}</div>
            {hours.map(h => <div key={h} className="w-5 h-5 rounded-sm" style={{ background: `rgba(26,115,232,${0.06 + cell(di,h)*0.85})` }}/>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function DSPageOverview({ daily, sources, campaigns }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <DSScore label="Sessions" value={fmtNum(184290)} delta="+24.1%"/>
        <DSScore label="Donors" value={fmtNum(13072)} delta="+18.0%" color="#0F9D58"/>
        <DSScore label="Donations" value={fmtNum(4558)} delta="+12.4%" color="#F4B400"/>
        <DSScore label="Revenue" value={fmtIDRShort(1842315500)} delta="+22.1%" color="#EA4335"/>
        <DSScore label="ROAS" value="3.8x" delta="+0.3x" color="#4285F4"/>
        <DSScore label="CVR" value="2.47%" delta="+0.4pp" color="#9C27B0"/>
      </div>
      <div className="col-span-12 lg:col-span-8">
        <DSPanel title="Sessions, Donations & Revenue" subtitle="Daily - Last 30 days">
          <DSSeries daily={daily}/>
        </DSPanel>
      </div>
      <div className="col-span-12 lg:col-span-4">
        <DSPanel title="Sessions by Source">
          <div className="flex items-center justify-center my-2">
            <Donut size={170} thickness={26} segments={(sources||[]).map(s => ({ value: s.visits||s.value||0, color: s.color }))}/>
          </div>
          <div className="space-y-1.5 mt-2">
            {(sources||[]).map((s,i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }}/>
                <span className="flex-1 font-semibold text-ink dark:text-slate-100">{s.src||s.name}</span>
                <span className="text-muted dark:text-slate-400">{fmtNum(s.visits||0)}</span>
              </div>
            ))}
          </div>
        </DSPanel>
      </div>
      <div className="col-span-12 lg:col-span-8">
        <DSPanel title="Donation activity heatmap" subtitle="Donations per hour x day of week">
          <DSHeatmapChart/>
        </DSPanel>
      </div>
      <div className="col-span-12 lg:col-span-4">
        <DSPanel title="Top KPI vs target Q2">
          <div className="space-y-3">
            {[{l:'Revenue',v:1842,t:2500,suf:' jt',color:'#1A73E8'},{l:'Donors',v:13072,t:18000,suf:'',color:'#0F9D58'},{l:'CVR',v:2.47,t:3.5,suf:'%',color:'#F4B400'},{l:'ROAS',v:3.8,t:4.0,suf:'x',color:'#EA4335'}].map((k,i) => {
              const pct = Math.min(100, (k.v / k.t) * 100);
              return (<div key={i}><div className="flex justify-between text-xs"><span className="font-bold text-ink dark:text-slate-100">{k.l}</span><span className="text-muted">{fmtNum(k.v)}{k.suf} / {fmtNum(k.t)}{k.suf}</span></div><div className="mt-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: pct + '%', background: k.color }}/></div></div>);
            })}
          </div>
        </DSPanel>
      </div>
      <div className="col-span-12 lg:col-span-7">
        <DSPanel title="Channel Performance" subtitle="Last 30 days - sorted by Revenue">
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[10px] uppercase tracking-wider text-muted dark:text-slate-400 border-b border-[#DADCE0] dark:border-slate-700">
                <th className="px-4 py-2 font-bold">Source / Medium</th><th className="py-2 font-bold text-right">Sessions</th><th className="py-2 font-bold text-right">Donors</th><th className="py-2 font-bold text-right">CVR</th><th className="py-2 font-bold text-right">Revenue</th><th className="pr-4 py-2 font-bold text-right">ROAS</th>
              </tr></thead>
              <tbody>
                {[{sm:'facebook / paid',s:48230,d:5612,rev:520400000,roas:3.6,color:'#1877F2'},{sm:'google / cpc',s:22150,d:2840,rev:412300000,roas:4.1,color:'#34A853'},{sm:'tiktok / paid',s:31840,d:3210,rev:298200000,roas:2.9,color:'#000'},{sm:'instagram / social',s:9120,d:870,rev:118400000,roas:'inf',color:'#E4405F'},{sm:'(direct) / (none)',s:13770,d:1410,rev:284010000,roas:'inf',color:'#94A3B8'},{sm:'google / organic',s:18920,d:1240,rev:209005500,roas:'inf',color:'#34A853'}].map((r,i)=>(
                  <tr key={i} className="border-b border-[#DADCE0]/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2.5"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{background:r.color}}/><span className="font-mono">{r.sm}</span></span></td>
                    <td className="py-2.5 text-right">{fmtNum(r.s)}</td><td className="py-2.5 text-right">{fmtNum(r.d)}</td>
                    <td className="py-2.5 text-right">{(r.d/r.s*100).toFixed(2)}%</td><td className="py-2.5 text-right font-bold">{fmtIDRShort(r.rev)}</td>
                    <td className="pr-4 py-2.5 text-right"><span className={`font-bold ${typeof r.roas==='number'&&r.roas<3?'text-amber-600':'text-emerald-600'}`}>{typeof r.roas==='number'?r.roas+'x':'inf'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DSPanel>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <DSPanel title="Top Campaigns" subtitle="Revenue - Last 30 days">
          <div className="space-y-2">
            {(campaigns||[]).slice(0,5).map((c,i)=>{
              const rev = (c.raised||0) + i*1000;
              const pct = (rev / 600000000) * 100;
              return (<div key={c.id||i} className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-md shrink-0 overflow-hidden">{c.img ? <img src={c.img} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-white/80" style={{background:c.thumb||'linear-gradient(135deg,#2E4191,#38B6FF)'}}><Icon name={c.icon||'heart'} size={14}/></div>}</div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-ink dark:text-slate-100 line-clamp-1">{c.title}</div><div className="mt-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#1A73E8] to-[#0F9D58]" style={{width:Math.min(100,pct)+'%'}}/></div></div><div className="text-right shrink-0"><div className="text-xs font-extrabold text-ink dark:text-slate-100">{fmtIDRShort(rev)}</div><div className="text-[10px] text-muted">{fmtNum(c.donors||0)} donors</div></div></div>);
            })}
          </div>
        </DSPanel>
      </div>
      <div className="col-span-12 mt-2 text-[10px] text-muted dark:text-slate-400 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5"><DSLogo/> Powered by Looker Studio</span>
        <span>Data freshness: 15 minutes</span>
        <span className="ml-auto">Owner: andre@niatbaik.org</span>
      </div>
    </div>
  );
}

function DSPageMeta({ daily }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-5 gap-3">
        <DSScore label="Ad Spend" value={fmtIDRShort(92400000)} delta="+12%" color="#1877F2"/>
        <DSScore label="Impressions" value={fmtNum(2840120)} delta="+8%" color="#1877F2"/>
        <DSScore label="CTR" value="3.42%" delta="+0.4pp" color="#1877F2"/>
        <DSScore label="Donations" value={fmtNum(1842)} delta="+18%" color="#0F9D58"/>
        <DSScore label="ROAS" value="3.6x" delta="+0.2x" color="#EA4335"/>
      </div>
      <div className="col-span-12 lg:col-span-8"><DSPanel title="Meta Ads -- Spend vs Revenue" subtitle="Daily"><DSSeries daily={daily}/></DSPanel></div>
      <div className="col-span-12 lg:col-span-4">
        <DSPanel title="Placement Performance">
          <div className="space-y-2">{[{n:'Feed',v:48,c:'#1877F2'},{n:'Stories',v:24,c:'#42A5F5'},{n:'Reels',v:18,c:'#0288D1'},{n:'Marketplace',v:6,c:'#01579B'},{n:'Audience Network',v:4,c:'#7C9CB8'}].map((p,i)=>(<div key={i} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 rounded-sm" style={{background:p.c}}/><span className="flex-1 font-semibold">{p.n}</span><div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-sm overflow-hidden"><div className="h-full" style={{width:(p.v*2)+'%',background:p.c}}/></div><span className="w-8 text-right font-bold">{p.v}%</span></div>))}</div>
        </DSPanel>
      </div>
      <div className="col-span-12">
        <DSPanel title="Ad Sets" subtitle="Top 5 - Sorted by ROAS">
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[10px] uppercase tracking-wider text-muted dark:text-slate-400 border-b border-[#DADCE0] dark:border-slate-700">
                <th className="px-4 py-2 font-bold">Ad Set</th><th className="py-2 font-bold text-right">Reach</th><th className="py-2 font-bold text-right">Clicks</th><th className="py-2 font-bold text-right">CTR</th><th className="py-2 font-bold text-right">Spend</th><th className="py-2 font-bold text-right">Donations</th><th className="pr-4 py-2 font-bold text-right">ROAS</th>
              </tr></thead>
              <tbody>
                {[['Aira-Jantung Reels 25-44 F',184220,14820,3.59,18410000,412,4.2],['Sumur-NTT Feed Indonesia',142180,10240,3.20,12980000,318,3.8],['Bukber-Yatim Stories 30-50',120440,9120,3.26,11320000,294,3.6],['Wakaf-Quran Lookalike 1%',98120,6824,3.10,9870000,184,2.9],['Madrasah Carousel',82310,5210,2.89,8240000,142,2.6]].map((r,i)=>(
                  <tr key={i} className="border-b border-[#DADCE0]/60 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2 font-mono">{r[0]}</td><td className="py-2 text-right">{fmtNum(r[1])}</td><td className="py-2 text-right">{fmtNum(r[2])}</td><td className="py-2 text-right">{r[3]}%</td><td className="py-2 text-right font-bold">{fmtIDRShort(r[4])}</td><td className="py-2 text-right">{fmtNum(r[5])}</td><td className="pr-4 py-2 text-right"><span className={`font-bold ${r[6]>=3?'text-emerald-600':'text-amber-600'}`}>{r[6]}x</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DSPanel>
      </div>
    </div>
  );
}

function DSPageGoogle({ daily }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-5 gap-3">
        <DSScore label="Ad Spend" value={fmtIDRShort(58300000)} delta="+9%" color="#34A853"/>
        <DSScore label="Impr." value={fmtNum(1820140)} delta="+12%" color="#34A853"/>
        <DSScore label="CTR" value="4.18%" delta="+0.6pp" color="#34A853"/>
        <DSScore label="GA4 Sessions" value={fmtNum(82440)} delta="+14%" color="#4285F4"/>
        <DSScore label="ROAS" value="4.1x" delta="+0.3x" color="#EA4335"/>
      </div>
      <div className="col-span-12 lg:col-span-7"><DSPanel title="GA4 Sessions & Conversions" subtitle="Daily"><DSSeries daily={daily}/></DSPanel></div>
      <div className="col-span-12 lg:col-span-5">
        <DSPanel title="Top Search Keywords">
          <div className="space-y-1.5 text-xs">
            {[{k:'donasi sumur bersih',v:8420,c:1.8},{k:'wakaf quran online',v:5210,c:2.2},{k:'donasi anak yatim',v:4180,c:1.5},{k:'zakat fitrah online',v:3820,c:1.3},{k:'sedekah jariyah',v:3120,c:1.9},{k:'donasi medis terpercaya',v:2510,c:2.8}].map((r,i)=>(<div key={i} className="flex items-center gap-2"><span className="font-mono flex-1 truncate">{r.k}</span><span className="w-12 text-right text-muted dark:text-slate-400">{fmtNum(r.v)}</span><span className="w-12 text-right font-bold text-emerald-600">{r.c}%</span></div>))}
          </div>
        </DSPanel>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <DSPanel title="Landing Page Performance">
          <div className="space-y-2 text-xs">
            {[{l:'/c/aira-jantung-q2',s:18420,b:0.42,t:'01:24'},{l:'/c/sumur-bersih-ntt',s:14820,b:0.38,t:'01:48'},{l:'/c/wakaf-quran',s:11240,b:0.51,t:'00:58'},{l:'/c/bukber-yatim',s:8820,b:0.34,t:'02:12'},{l:'/',s:21340,b:0.62,t:'00:42'}].map((r,i)=>(<div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center border-b border-[#DADCE0]/40 pb-1.5"><span className="font-mono text-ink dark:text-slate-100 truncate">{r.l}</span><span className="text-muted">{fmtNum(r.s)} sess</span><span className={`font-bold ${r.b>0.5?'text-rose-600':'text-emerald-600'}`}>{(r.b*100).toFixed(0)}% BR</span><span className="text-muted">{r.t}</span></div>))}
          </div>
        </DSPanel>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <DSPanel title="Conversion Path">
          <div className="space-y-2">
            {[{path:['Direct'],v:14,conv:412},{path:['Google Organic'],v:12,conv:382},{path:['Google Paid'],v:18,conv:524},{path:['Google Paid','Direct'],v:9,conv:296},{path:['Google Organic','Google Paid'],v:7,conv:212},{path:['Facebook','Google Paid','Direct'],v:4,conv:148}].map((p,i)=>(<div key={i} className="flex items-center gap-1.5 text-xs">{p.path.map((step,j)=>(<React.Fragment key={j}><span className="px-1.5 py-0.5 rounded bg-[#E8F0FE] text-[#1A73E8] font-mono text-[10px] font-bold">{step}</span>{j<p.path.length-1&&<span className="text-muted dark:text-slate-400">-&gt;</span>}</React.Fragment>))}<span className="ml-auto text-muted dark:text-slate-400">{p.v}%</span><span className="font-bold w-14 text-right">{p.conv} conv</span></div>))}
          </div>
        </DSPanel>
      </div>
    </div>
  );
}

function DSPageTiktok({ daily }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 rounded-md bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 px-4 py-3 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
        <Icon name="shield" size={14}/> Connection error: TikTok Events API token expired
        <button className="ml-auto font-bold hover:underline">Reconnect</button>
      </div>
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-5 gap-3">
        <DSScore label="Ad Spend" value={fmtIDRShort(41800000)} delta="+22%" color="#000"/>
        <DSScore label="Views" value={fmtNum(8240000)} delta="+34%" color="#FF0050"/>
        <DSScore label="VTR (3s)" value="62.4%" delta="+4pp" color="#00F2EA"/>
        <DSScore label="Donations" value={fmtNum(980)} delta="+18%" color="#0F9D58"/>
        <DSScore label="ROAS" value="2.9x" delta="-0.1x" deltaTone="down" color="#EA4335"/>
      </div>
      <div className="col-span-12 lg:col-span-7"><DSPanel title="TikTok -- Spend vs Donations"><DSSeries daily={daily}/></DSPanel></div>
      <div className="col-span-12 lg:col-span-5">
        <DSPanel title="Top Performing Creatives">
          <div className="space-y-2">
            {[{n:'bantu-rans (UGC story)',cvr:5.8,v:840120},{n:'aira-story-30s',cvr:4.2,v:620140},{n:'sumur-impact-video',cvr:3.9,v:512320},{n:'wakaf-testimonial',cvr:3.1,v:412120}].map((r,i)=>(<div key={i} className="flex items-center gap-2.5"><div className="h-10 w-7 rounded bg-gradient-to-br from-[#FF0050] to-[#00F2EA] shrink-0"/><div className="flex-1 min-w-0"><div className="text-xs font-bold text-ink dark:text-slate-100 truncate">{r.n}</div><div className="text-[10px] text-muted">{fmtNum(r.v)} views</div></div><span className="text-xs font-extrabold text-emerald-600">{r.cvr}%</span></div>))}
          </div>
        </DSPanel>
      </div>
    </div>
  );
}

function DSPageGeo() {
  const provinces = [{p:'DKI Jakarta',v:412,pct:28},{p:'Jawa Barat',v:318,pct:22},{p:'Jawa Timur',v:240,pct:16},{p:'Banten',v:142,pct:10},{p:'Yogyakarta',v:98,pct:7},{p:'Sumatera Utara',v:82,pct:5},{p:'Bali',v:64,pct:4},{p:'Sulawesi Selatan',v:52,pct:3.5},{p:'Kalimantan Timur',v:40,pct:2.5},{p:'Lainnya',v:28,pct:2}];
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-8">
        <DSPanel title="Donations by Province" subtitle="Indonesia - Last 30 days">
          <DSMapVis/>
        </DSPanel>
      </div>
      <div className="col-span-12 lg:col-span-4">
        <DSPanel title="Top Provinces">
          <div className="space-y-1.5">
            {provinces.map((r,i)=>(<div key={i} className="flex items-center gap-2 text-xs"><span className="w-32 truncate">{r.p}</span><div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-sm overflow-hidden"><div className="h-full bg-[#1A73E8]" style={{width:r.pct*3+'%'}}/></div><span className="w-8 text-right font-bold">{r.v}</span></div>))}
          </div>
        </DSPanel>
      </div>
    </div>
  );
}

function DSMapVis() {
  const pts = [{n:'JKT',x:42,y:62,v:0.95},{n:'JBR',x:36,y:67,v:0.85},{n:'JTG',x:46,y:65,v:0.55},{n:'JTM',x:55,y:67,v:0.75},{n:'BTN',x:34,y:64,v:0.5},{n:'BAL',x:62,y:73,v:0.4},{n:'SUM',x:13,y:30,v:0.35},{n:'KLT',x:60,y:42,v:0.25},{n:'SLS',x:72,y:55,v:0.28},{n:'PAP',x:92,y:55,v:0.12}];
  return (
    <div className="relative w-full bg-[#E8F0FE] dark:bg-slate-800 rounded-md overflow-hidden" style={{aspectRatio:'2/1'}}>
      {pts.map((p,i)=>(<div key={i} className="absolute" style={{left:p.x+'%',top:p.y+'%',transform:'translate(-50%,-50%)'}}><div className="rounded-full" style={{width:16+p.v*22,height:16+p.v*22,background:`rgba(26,115,232,${0.4+p.v*0.55})`}}/><div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#1A73E8] whitespace-nowrap">{p.n}</div></div>))}
      <div className="absolute bottom-2 right-2 bg-white dark:bg-slate-800 border border-line dark:border-slate-700 rounded px-2 py-1 text-[10px] flex items-center gap-1.5"><span className="text-muted dark:text-slate-400">Donations:</span><span className="h-2 w-2 rounded-full bg-[#1A73E8]/30"/><span className="h-2.5 w-2.5 rounded-full bg-[#1A73E8]/60"/><span className="h-3 w-3 rounded-full bg-[#1A73E8]"/></div>
    </div>
  );
}

function DSPageFunnel({ sources }) {
  const steps = [{l:'Sessions',v:184290,c:'#1A73E8'},{l:'View Content',v:121140,c:'#4285F4'},{l:'Initiate Checkout',v:38280,c:'#0F9D58'},{l:'Add Payment Info',v:18240,c:'#F4B400'},{l:'Lead (form submit)',v:13072,c:'#FB8C00'},{l:'Complete Donation',v:4558,c:'#EA4335'}];
  const max = steps[0].v;
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-8">
        <DSPanel title="Conversion Funnel" subtitle="Last 30 days - all sources">
          <div className="space-y-3 py-2">
            {steps.map((s,i) => {
              const w = (s.v / max) * 100;
              const drop = i > 0 ? (1 - s.v / steps[i-1].v) * 100 : 0;
              return (<div key={i}><div className="flex items-center justify-between text-xs mb-1"><span className="font-bold text-ink dark:text-slate-100">{i+1}. {s.l}</span><span className="text-muted">{fmtNum(s.v)} - {((s.v/max)*100).toFixed(1)}% of top</span></div><div className="h-9 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden relative"><div className="h-full rounded flex items-center justify-end px-3 text-white text-xs font-extrabold" style={{width:w+'%',background:s.c}}>{fmtNum(s.v)}</div></div>{i>0&&<div className="mt-1 text-[10px] text-rose-600 font-semibold">Drop-off {drop.toFixed(1)}%</div>}</div>);
            })}
          </div>
        </DSPanel>
      </div>
      <div className="col-span-12 lg:col-span-4 space-y-4">
        <DSPanel title="Funnel by Source">
          <div className="space-y-2 text-xs">
            {(sources||[]).map((s,i) => {
              const cvr = s.visits ? ((s.donations||0)/s.visits*100).toFixed(2) : '0.00';
              return (<div key={i}><div className="flex justify-between"><span className="font-bold text-ink dark:text-slate-100">{s.src||s.name}</span><span className="text-muted">{cvr}%</span></div><div className="mt-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-sm overflow-hidden"><div className="h-full" style={{width:Math.min(100,parseFloat(cvr)*30)+'%',background:s.color}}/></div></div>);
            })}
          </div>
        </DSPanel>
        <DSPanel title="Recommendations">
          <ul className="space-y-2 text-xs text-ink/85 dark:text-slate-300">
            <li>Drop-off terbesar di <b>Initiate Checkout -> Add Payment</b> (52%). Cek loading speed gateway.</li>
            <li><b>TikTok funnel</b> punya VTR tinggi tapi CVR rendah -- tambah retargeting via Meta.</li>
            <li>Mobile sessions 66% tapi konversi 48% -- uji A/B form mobile.</li>
          </ul>
        </DSPanel>
      </div>
    </div>
  );
}

// ====================== Ads Guide Modal ======================
function AdsGuideModal({ open, onClose }) {
  const [tab, setTab] = uS_adm('meta');
  if (!open) return null;

  const tabs = [
    { v:'meta',    l:'Meta Ads',    color:'#1877F2', sub:'Facebook + Instagram' },
    { v:'google',  l:'Google Ads',  color:'#34A853', sub:'Search + Display + YouTube' },
    { v:'tiktok',  l:'TikTok Ads',  color:'#FF0050', sub:'For You + Spark Ads' },
    { v:'organic', l:'Organik',     color:'#16A34A', sub:'SEO + Sosmed + Komunitas' },
  ];

  return (
    <Modal open={open} onClose={onClose} size="xl"
      title={<span className="flex items-center gap-2">
        <span className="h-7 w-7 rounded-md bg-gradient-to-br from-brand-600 to-cyan-400 text-white flex items-center justify-center"><Icon name="sparkle" size={14}/></span>
        Panduan Platform Iklan & Organik
      </span>}
      footer={<>
        <span className="mr-auto text-xs text-muted dark:text-slate-400">Update: Mei 2026</span>
        <Button variant="secondary" icon={<Icon name="download" size={16}/>}>Unduh PDF</Button>
        <Button variant="primary" onClick={onClose}>Tutup</Button>
      </>}>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-5">
        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto -mx-1 px-1 lg:m-0 lg:p-0">
          {tabs.map((t) => (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors text-left ${tab === t.v ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'text-ink/85 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <div className="h-7 w-7 rounded-md flex items-center justify-center text-white shrink-0" style={{ background: t.color }}>
                <Icon name="sparkle" size={14}/>
              </div>
              <div className="min-w-0">
                <div className="text-sm leading-tight">{t.l}</div>
                <div className="text-[10px] font-medium text-muted dark:text-slate-400 leading-tight">{t.sub}</div>
              </div>
            </button>
          ))}
          <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 hidden lg:block">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1"><Icon name="shield" size={12}/> Disclaimer</div>
            <div className="text-[11px] text-amber-800 dark:text-amber-200 leading-snug mt-1">Rules tiap platform berubah berkala. Selalu rujuk dokumentasi resmi sebelum scale-up budget besar.</div>
          </div>
        </nav>

        <div className="min-h-[480px]">
          {tab === 'meta' && <AGMeta/>}
          {tab === 'google' && <AGGoogle/>}
          {tab === 'tiktok' && <AGTiktok/>}
          {tab === 'organic' && <AGOrganic/>}
        </div>
      </div>
    </Modal>
  );
}

function AGHero({ color, title, sub, kpi }) {
  return (
    <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }}>
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/15 blur-2xl"/>
      <div className="relative">
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-90">Panduan Platform</div>
        <h2 className="mt-1 text-2xl font-extrabold">{title}</h2>
        <p className="mt-1 text-sm text-white/90 max-w-2xl">{sub}</p>
        {kpi && <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">{kpi.map((k,i)=>(<div key={i} className="rounded-lg bg-white/15 backdrop-blur p-2.5"><div className="text-lg font-extrabold">{k.v}</div><div className="text-[10px] text-white/85 leading-tight mt-0.5">{k.l}</div></div>))}</div>}
      </div>
    </div>
  );
}

function AGSection({ icon, title, sub, tone='brand', children }) {
  const tones = { brand:'bg-brand-50 dark:bg-brand-900/30 text-brand-600', ok:'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600', warn:'bg-amber-50 dark:bg-amber-900/30 text-amber-600', bad:'bg-rose-50 dark:bg-rose-900/30 text-rose-600', sky:'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600', slate:'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' };
  return (
    <div className="rounded-xl border border-line dark:border-slate-700 p-4">
      <div className="flex items-start gap-2.5 mb-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]||tones.brand}`}>{icon}</div>
        <div><div className="font-bold text-ink dark:text-slate-100">{title}</div>{sub && <div className="text-xs text-muted">{sub}</div>}</div>
      </div>
      {children}
    </div>
  );
}

function AGChecks({ items, tone='ok' }) {
  const c = tone === 'ok' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : tone === 'bad' ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/30';
  return (
    <ul className="space-y-2 text-sm text-ink/85 dark:text-slate-300">
      {items.map((it,i) => <li key={i} className="flex items-start gap-2"><span className={`h-5 w-5 rounded-full ${c} flex items-center justify-center shrink-0 mt-0.5`}>{tone==='bad'?'x':'v'}</span><span dangerouslySetInnerHTML={{ __html: it }}/></li>)}
    </ul>
  );
}

function AGCode({ children }) {
  return <pre className="rounded-lg bg-slate-900 text-emerald-300 text-[11px] font-mono p-3 overflow-x-auto leading-relaxed">{children}</pre>;
}

function AGMeta() {
  return (
    <div className="space-y-4">
      <AGHero color="#1877F2" title="Meta Ads -- Facebook + Instagram"
        sub="Untuk campaign donasi, manfaatkan Special Ad Category 'Social Issues' bila menargetkan isu sensitif, dan optimasi Purchase + Donate via Conversions API."
        kpi={[{v:'~4.2x',l:'ROAS rata-rata charity ID'},{v:'< 24j',l:'Window attribusi'},{v:'5 act.',l:'Min event Purchase'},{v:'CAPI',l:'Wajib aktif 2026'}]}/>
      <AGSection icon={<Icon name="check" size={16}/>} tone="ok" title="Wajib di-setup" sub="Sebelum spend pertama">
        <AGChecks items={['Pasang <b>Meta Pixel</b> di seluruh halaman + event minimum: PageView, ViewContent, InitiateCheckout, AddPaymentInfo, Purchase','Aktifkan <b>Conversions API (CAPI)</b> via server-side dengan parameter fbclid, fbp, fbc, dan user data (email/phone) yang sudah di-hash SHA-256','Verifikasi <b>domain niatbaik.org</b> di Business Manager','Setup <b>Aggregated Event Measurement (AEM)</b> -- pilih max 8 event prioritas','Buat <b>Custom Audience</b>: All visitors 30d, Add Payment Info 14d, Purchasers 180d']}/>
      </AGSection>
      <AGSection icon={<Icon name="close" size={16}/>} tone="bad" title="Yang dilarang (Disapproval triggers)">
        <AGChecks tone="bad" items={['Klaim emosional ekstrem -- langgar <b>Sensational Content policy</b>','Gambar close-up wajah anak yatim / pasien terminal -- <b>Personal Attributes</b>','Klaim <i>"100% sampai"</i> tanpa bukti audit -- <b>Misleading Claims</b>','Iklan minta donasi via DM/WhatsApp tanpa landing page']}/>
      </AGSection>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AGSection icon={<Icon name="target" size={16}/>} tone="brand" title="Struktur kampanye optimal">
          <AGChecks items={['Objective: <b>Sales</b> -- optimasi event Purchase','CBO untuk min 3 ad set','<b>Advantage+ Audience</b>','Min budget per ad set: <b>Rp 200rb/hari</b>','Frequency cap: 2/7-hari cold, 4/7-hari retargeting']}/>
        </AGSection>
        <AGSection icon={<Icon name="sparkle" size={16}/>} tone="warn" title="Creative best-practice 2026">
          <AGChecks tone="warn" items={['Format <b>9:16 vertical</b> untuk Reels & Stories','Hook 3 detik pertama: masalah konkret','UGC / talking-head > stock footage (CTR +60-120%)','Caption text >= 80% closed caption','CTA button: <b>Donasi Sekarang</b>']}/>
        </AGSection>
      </div>
      <AGSection icon={<Icon name="code" size={16}/>} tone="slate" title="Snippet Pixel -- wajib dipasang">
        <AGCode>{`fbq('track', 'Purchase', {\n  value: 100000,\n  currency: 'IDR',\n  content_type: 'donation',\n  content_ids: ['c-002'],\n  eventID: 'INV-20261234'\n});`}</AGCode>
      </AGSection>
    </div>
  );
}

function AGGoogle() {
  return (
    <div className="space-y-4">
      <AGHero color="#34A853" title="Google Ads -- Search + Display + YouTube"
        sub="Manfaatkan Google Ad Grants kalau yayasan eligible (USD $10k/bulan gratis). Untuk paid, fokus Performance Max + Search dengan offline conversion."
        kpi={[{v:'~3.8x',l:'ROAS rata-rata'},{v:'90 hr',l:'Conversion window'},{v:'>= 30',l:'Min konversi/30d'},{v:'GA4',l:'Sumber tunggal 2026'}]}/>
      <AGSection icon={<Icon name="check" size={16}/>} tone="ok" title="Wajib di-setup">
        <AGChecks items={['<b>Google Ads Conversion</b> + <b>GA4 Enhanced Measurement</b>','Setup <b>Consent Mode v2</b>','Pasang <b>Google Tag Manager</b> sebagai container utama','Upload <b>Enhanced Conversions</b>','<b>Ad Grants</b> -- apply via Google for Nonprofits']}/>
      </AGSection>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AGSection icon={<Icon name="target" size={16}/>} tone="brand" title="Tipe campaign efektif">
          <AGChecks items={['<b>Performance Max</b> -- multi-channel automated','<b>Search</b> -- keyword high intent + Broad Match + Smart Bidding','<b>YouTube In-Stream Skippable</b>','<b>Demand Gen</b> (ex-Discovery)']}/>
        </AGSection>
        <AGSection icon={<Icon name="close" size={16}/>} tone="bad" title="Yang dilarang">
          <AGChecks tone="bad" items={['Klaim deduksi pajak tanpa bukti','Trademark organisasi lain di copy iklan','Landing page tanpa kontak fisik + akta yayasan','Doxxing penerima manfaat']}/>
        </AGSection>
      </div>
      <AGSection icon={<Icon name="code" size={16}/>} tone="slate" title="Snippet Conversion + Enhanced Conversions">
        <AGCode>{`gtag('event', 'conversion', {\n  send_to: 'AW-1029384/AbC-D_efG',\n  value: 100000,\n  currency: 'IDR',\n  transaction_id: 'INV-20261234',\n  user_data: {\n    email: 'donatur@mail.com',\n    phone_number: '+628123456789'\n  }\n});`}</AGCode>
      </AGSection>
    </div>
  );
}

function AGTiktok() {
  return (
    <div className="space-y-4">
      <AGHero color="#FF0050" title="TikTok Ads -- For You + Spark Ads"
        sub="Native-first creative wajib. Spark Ads (boost organic post) biasanya CPM 30-50% lebih murah. Charity policy ketat."
        kpi={[{v:'~2.9x',l:'ROAS rata-rata'},{v:'7 hari',l:'Default attribusi'},{v:'50+',l:'Min event/7d'},{v:'EAPI',l:'Wajib aktif untuk iOS'}]}/>
      <AGSection icon={<Icon name="check" size={16}/>} tone="ok" title="Wajib di-setup">
        <AGChecks items={['<b>TikTok Pixel</b> + <b>Events API (EAPI)</b> server-side','Verifikasi domain di TikTok Business Center','Pilih max 10 web event prioritas','Aktifkan <b>Advanced Matching</b>','Daftar di <b>TikTok for Good</b>']}/>
      </AGSection>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AGSection icon={<Icon name="sparkle" size={16}/>} tone="warn" title="Creative rules -- strict">
          <AGChecks tone="warn" items={['<b>9:16 vertical</b> wajib, 1080x1920 min','Audio harus jelas','<b>UGC / talking head</b> wins','Hook < 3 detik','Gunakan <b>trending sound</b> berlisensi commercial']}/>
        </AGSection>
        <AGSection icon={<Icon name="close" size={16}/>} tone="bad" title="Yang dilarang">
          <AGChecks tone="bad" items={['Gambar penderita medis ekstrem','<b>Shocking imagery</b> (kematian, kelaparan)','Anak < 13 tahun tanpa wali eksplisit','Mengarahkan ke WhatsApp pribadi tanpa landing page']}/>
        </AGSection>
      </div>
      <AGSection icon={<Icon name="code" size={16}/>} tone="slate" title="Snippet Pixel + EAPI dedup">
        <AGCode>{`ttq.track('CompletePayment', {\n  value: 100000,\n  currency: 'IDR',\n  content_type: 'donation',\n  content_id: 'c-002',\n  event_id: 'INV-20261234'\n});`}</AGCode>
      </AGSection>
    </div>
  );
}

function AGOrganic() {
  return (
    <div className="space-y-4">
      <AGHero color="#16A34A" title="Organik -- SEO + Sosmed + Komunitas"
        sub="Sumber donasi paling 'sehat' (no spend, retensi tertinggi). Investasi 6-12 bulan, tapi compound."
        kpi={[{v:'~38%',l:'Donatur repeat'},{v:'inf ROAS',l:'No ad spend'},{v:'> 70%',l:'Mobile share'},{v:'< 3d',l:'Best update cadence'}]}/>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AGSection icon={<Icon name="globe" size={16}/>} tone="brand" title="SEO -- Onpage & Technical">
          <AGChecks items={['<b>Core Web Vitals</b>: LCP < 2.5s, INP < 200ms, CLS < 0.1','Schema.org markup: NonprofitOrganization, DonateAction','Setiap campaign = landing page dedicated','Internal linking dari blog edukatif ke campaign','Mobile-first design','Image: WebP/AVIF + lazy load + alt text']}/>
        </AGSection>
        <AGSection icon={<Icon name="megaphone" size={16}/>} tone="ok" title="Sosial Media organik">
          <AGChecks items={['<b>Instagram Reels</b> -- native edit + tren audio','<b>TikTok</b> -- 3-5x/minggu konsisten','YouTube <b>Shorts</b>','WhatsApp Channel (broadcast)','Telegram group donatur','80% edukasi, 20% promosi']}/>
        </AGSection>
        <AGSection icon={<Icon name="users" size={16}/>} tone="warn" title="Komunitas & PR">
          <AGChecks tone="warn" items={['Kolaborasi <b>influencer mikro</b> (10-50K followers)','Liputan media nasional','Program <b>Fundraiser referral</b>','Kerja sama masjid / pesantren / kampus','Public audit bulanan']}/>
        </AGSection>
        <AGSection icon={<Icon name="sparkle" size={16}/>} tone="sky" title="Email & Notifikasi">
          <AGChecks items={['Welcome series 5 email setelah donasi pertama','Email update progress per campaign','WhatsApp template terverifikasi','<b>Donor monthly digest</b>','Reactivation untuk lapsed donor 90+ hari']}/>
        </AGSection>
      </div>
      <AGSection icon={<Icon name="check" size={16}/>} tone="ok" title="Quick wins minggu ini">
        <AGChecks items={['Audit kecepatan situs di <b>PageSpeed Insights</b>','Buat 3 konten edukatif evergreen','Setup Google My Business yayasan','Aktifkan share-to-WA di halaman campaign','Tambah testimoni donatur dengan foto + nama']}/>
      </AGSection>
    </div>
  );
}

Object.assign(window, { AdminDashboard, CampaignsPage, AnalyticsPage, TxTable, CampaignEditorView, DataStudioView, AdsGuideModal });

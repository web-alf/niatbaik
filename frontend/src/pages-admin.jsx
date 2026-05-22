// Admin pages: Dashboard, Campaigns, Analytics
const { useState: uS_adm, useEffect: uE_adm } = React;

// ====================== Admin Dashboard ======================
function AdminDashboard(){
  const [apiStats, setApiStats] = uS_adm(null);
  const [dailyData, setDailyData] = uS_adm(DAILY);
  const [recentTx, setRecentTx] = uS_adm(TRANSACTIONS.slice(0,8));

  uE_adm(()=>{
    api.dashboardStats().then(r => r?.data && setApiStats(r.data));
    api.dailyChart(30).then(r => { if(r?.data) setDailyData(r.data.map(d=>({date:new Date(d.date),amount:d.amount,count:d.count}))); });
    api.recentTransactions(8).then(r => { if(r?.data) setRecentTx(r.data); });
  },[]);

  const stats = [
    { l:'Total Donasi', v:fmtShort(apiStats?.total_raised || TOTAL_RAISED), s:'Sepanjang waktu', tone:'brand', i:<Icons.Heart w={20} h={20}/>, t:{up:true,value:apiStats?.total_raised_trend || '+12.4%'} },
    { l:'Total Transaksi', v:fmtNum(apiStats?.total_tx || TOTAL_TX), s:'Sepanjang waktu', tone:'cyan', i:<Icons.Wallet w={20} h={20}/>, t:{up:true,value:apiStats?.total_tx_trend || '+8.1%'} },
    { l:'Campaign Aktif', v:(apiStats?.active_campaigns || ACTIVE_CAMPAIGNS)+' / '+(apiStats?.total_campaigns || CAMPAIGNS.length), s:'Running sekarang', tone:'green', i:<Icons.Megaphone w={20} h={20}/> },
    { l:'Total Fundraiser', v:fmtNum(apiStats?.total_fundraiser || TOTAL_FUNDRAISER), s:'24 aktif minggu ini', tone:'amber', i:<Icons.Users w={20} h={20}/> },
    { l:'Total Leads Iklan', v:fmtNum(apiStats?.total_leads || TOTAL_LEADS), s:'30 hari terakhir', tone:'cyan', i:<Icons.Sparkles w={20} h={20}/>, t:{up:true,value:apiStats?.leads_trend || '+24.6%'} },
    { l:'Conversion Rate', v:(apiStats?.conv_rate || CONV_RATE)+'%', s:'Visitor → Donatur', tone:'green', i:<Icons.Chart w={20} h={20}/>, t:{up:true,value:apiStats?.conv_rate_trend || '+0.4%'} },
    { l:'Donasi Hari Ini', v:fmtShort(apiStats?.today_raised || TODAY_RAISED), s:'Update real-time', tone:'brand', i:<Icons.Sun w={20} h={20}/>, t:{up:true,value:apiStats?.today_trend || '+18%'} },
    { l:'Donasi Bulan Ini', v:fmtShort(apiStats?.month_raised || MONTH_RAISED), s:'November 2026', tone:'cyan', i:<Icons.Calendar w={20} h={20}/>, t:{up:false,value:apiStats?.month_trend || '-2.1%'} },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Selamat datang, Admin 👋"
        subtitle="Ringkasan donasi & performa NIATBAIK.ORG"
        actions={<>
          <DateRangePicker/>
          <Button variant="secondary" icon={<Icons.Download w={16} h={16}/>}>Excel</Button>
          <Button variant="secondary" icon={<Icons.Download w={16} h={16}/>}>CSV</Button>
          <Button variant="secondary" icon={<Icons.Upload w={16} h={16}/>}>Import</Button>
          <Button variant="primary" icon={<Icons.Plus w={16} h={16}/>}>Buat Campaign</Button>
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
              <div className="text-xs text-muted">30 hari terakhir</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                {['7H','30H','90H','12B'].map((t,i)=>(
                  <button key={t} className={`px-3 h-8 rounded-md text-xs font-semibold ${i===1?'bg-white dark:bg-slate-700 shadow-sm':'text-muted'}`}>{t}</button>
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
              <div className="text-xs text-muted">Per payment method</div>
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
            ]} center={<><div className="text-2xl font-extrabold tnum text-ink dark:text-slate-100">{fmtShort(apiStats?.total_raised || TOTAL_RAISED)}</div><div className="text-xs text-muted">Total</div></>}/>
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
        <div className="p-5 flex items-center justify-between">
          <div>
            <div className="font-bold text-ink dark:text-slate-100">Transaksi Terbaru</div>
            <div className="text-xs text-muted">Update real-time</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Icons.Filter w={14} h={14}/>}>Filter</Button>
            <button className="text-xs text-brand-600 font-medium">Lihat semua</button>
          </div>
        </div>
        <TxTable rows={recentTx}/>
      </Card>

      {/* Top campaigns */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="font-bold text-ink dark:text-slate-100 mb-3">Top Campaign (Bulan Ini)</div>
          <div className="space-y-3">
            {CAMPAIGNS.slice(0,4).map((c,i)=>(
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0"><img src={c.img} className="w-full h-full object-cover" alt=""/></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate text-ink dark:text-slate-100">{c.title}</div>
                  <ProgressBar value={c.raised} max={c.target} size="sm"/>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-brand-700 dark:text-brand-300 tnum">{fmtShort(c.raised)}</div>
                  <div className="text-xs text-muted">{Math.round(c.raised/c.target*100)}%</div>
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
            <div><div className="text-muted text-xs">Cost / Lead</div><div className="font-bold tnum">Rp4.870</div></div>
            <div><div className="text-muted text-xs">Cost / Donation</div><div className="font-bold tnum">Rp17.500</div></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ====================== Date Range Picker (visual) ======================
function DateRangePicker({ label="01 Nov – 30 Nov 2026" }){
  const [open, setOpen] = uS_adm(false);
  return (
    <div className="relative">
      <button onClick={()=>setOpen(!open)} className="h-10 inline-flex items-center gap-2 px-3 rounded-xl border border-line bg-white hover:bg-slate-50 text-sm font-medium text-ink dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
        <Icons.Calendar w={16} h={16}/>{label}<Icons.ChevronDown w={14} h={14}/>
      </button>
      {open && (
        <div className="absolute right-0 top-12 surface rounded-2xl shadow-pop p-3 z-30 w-[280px]">
          <div className="grid grid-cols-2 gap-1 text-xs">
            {['Hari ini','Kemarin','7 hari','30 hari','Bulan ini','Bulan lalu','Tahun ini','Custom'].map(t=>(
              <button key={t} onClick={()=>setOpen(false)} className="h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-left px-2">{t}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ====================== Transaction Table ======================
function TxTable({ rows, onInvoice }){
  const { openInvoice } = useApp();
  return (
    <div className="overflow-x-auto nice-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
            <th className="px-5 py-3 font-semibold">Invoice</th>
            <th className="px-5 py-3 font-semibold">Donatur</th>
            <th className="px-5 py-3 font-semibold">Campaign</th>
            <th className="px-5 py-3 font-semibold">Nominal</th>
            <th className="px-5 py-3 font-semibold">Metode</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Tanggal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line dark:divide-slate-800">
          {rows.map(r=>(
            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
              <td className="px-5 py-3"><button onClick={()=>(onInvoice||openInvoice)(r)} className="font-mono text-brand-700 dark:text-brand-300 hover:underline font-semibold text-xs">{r.id}</button></td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={r.donor} initials={r.initials} anon={r.anon} size={28}/>
                  <div>
                    <div className="font-medium text-ink dark:text-slate-100">{r.anon?'Hamba Allah':r.donor}</div>
                    <div className="text-xs text-muted">{r.phone}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 max-w-[200px]"><div className="truncate text-slate-700 dark:text-slate-300">{r.campaign}</div></td>
              <td className="px-5 py-3 font-bold text-ink dark:text-slate-100 tnum">{fmtIDR(r.amount)}</td>
              <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{r.method}</td>
              <td className="px-5 py-3"><StatusBadge status={r.status}/></td>
              <td className="px-5 py-3 text-muted text-xs whitespace-nowrap">{new Date(r.ts).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ====================== Campaigns Page ======================
function CampaignsPage(){
  const [view, setView] = uS_adm('grid');
  const [filter, setFilter] = uS_adm('all');
  const [search, setSearch] = uS_adm('');
  const [campaigns, setCampaigns] = uS_adm(CAMPAIGNS);
  const activeCampaigns = campaigns.filter(c=>c.status==='Running'||c.status==='Berjalan').length;

  uE_adm(()=>{
    api.adminCampaigns().then(r => {
      if(r?.data && r.data.length > 0) setCampaigns(r.data.map(c=>({
        id: c.id, slug: c.slug, title: c.title, target: c.target,
        raised: c.total_raised || 0, donors: c.donor_count || 0,
        days: c.days_left || 0, status: c.status,
        category: c.category || '', description: c.short_description || c.description || '',
        img: c.image ? '/uploads/' + c.image : placeholderImg(0, c.title?.substring(0,12) || 'CAMPAIGN'),
      })));
    });
  },[]);

  const filtered = campaigns.filter(c=>(filter==='all'||c.status.toLowerCase()===filter) && c.title.toLowerCase().includes(search.toLowerCase()));
  const { openCampaign } = useApp();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Campaigns"
        subtitle={`${campaigns.length} campaign · ${activeCampaigns} sedang berjalan`}
        actions={<>
          <Button variant="secondary" icon={<Icons.Download w={16} h={16}/>}>Export</Button>
          <Button variant="primary" icon={<Icons.Plus w={16} h={16}/>}>Buat Campaign</Button>
        </>}
      />

      {/* Filter bar */}
      <Card padded={false} className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px]">
            <Input icon={<Icons.Search w={16} h={16}/>} placeholder="Cari campaign…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
            {[['all','Semua'],['draft','Draft'],['published','Published'],['running','Running'],['ended','Ended']].map(([k,l])=>(
              <button key={k} onClick={()=>setFilter(k)} className={`px-3 h-9 rounded-lg text-sm font-medium ${filter===k?'bg-white dark:bg-slate-700 shadow-sm':'text-muted'}`}>{l}</button>
            ))}
          </div>
          <DateRangePicker/>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
            <button onClick={()=>setView('grid')} className={`px-3 h-9 rounded-lg ${view==='grid'?'bg-white dark:bg-slate-700 shadow-sm':'text-muted'}`}><Icons.Dashboard w={16} h={16}/></button>
            <button onClick={()=>setView('list')} className={`px-3 h-9 rounded-lg ${view==='list'?'bg-white dark:bg-slate-700 shadow-sm':'text-muted'}`}><Icons.Menu w={16} h={16}/></button>
          </div>
        </div>
      </Card>

      {/* View */}
      {view==='grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(c=>(
            <CampaignAdminCard key={c.id} c={c} onOpen={()=>openCampaign(c.id)}/>
          ))}
        </div>
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto nice-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
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
                        <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0"><img src={c.img} className="w-full h-full object-cover" alt=""/></div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate max-w-[280px] text-ink dark:text-slate-100">{c.title}</div>
                          <div className="text-xs text-muted">{c.category} · {c.days>0?`${c.days} hari lagi`:'Selesai'}</div>
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
                        <button onClick={()=>openCampaign(c.id)} className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300" title="Preview"><Icons.Eye w={16} h={16}/></button>
                        <button className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300" title="Edit"><Icons.Edit w={16} h={16}/></button>
                        <button className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center justify-center text-rose-500" title="Trash"><Icons.Trash w={16} h={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function CampaignAdminCard({ c, onOpen }){
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="relative aspect-[16/10]">
        <img src={c.img} className="absolute inset-0 w-full h-full object-cover" alt=""/>
        <div className="absolute top-3 left-3 flex gap-2"><Badge tone="cyan" size="sm">{c.category}</Badge></div>
        <div className="absolute top-3 right-3"><StatusBadge status={c.status}/></div>
      </div>
      <div className="p-4">
        <div className="font-semibold leading-snug line-clamp-2 min-h-[44px] text-ink dark:text-slate-100">{c.title}</div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-bold text-brand-700 dark:text-brand-300 tnum">{fmtShort(c.raised)}</span>
          <span className="text-xs text-muted tnum">{fmtShort(c.target)}</span>
        </div>
        <div className="mt-2"><ProgressBar value={c.raised} max={c.target} size="sm"/></div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span><span className="font-bold text-ink dark:text-slate-200 tnum">{fmtNum(c.donors)}</span> donatur</span>
          <span className="tnum">{c.days>0?`${c.days} hari`:'Selesai'}</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <Button variant="soft" size="sm" full onClick={onOpen} icon={<Icons.Eye w={14} h={14}/>}>Preview</Button>
          <Button variant="secondary" size="sm" icon={<Icons.Edit w={14} h={14}/>}>Edit</Button>
        </div>
      </div>
    </Card>
  );
}

// ====================== Analytics ======================
function AnalyticsPage(){
  const [platform, setPlatform] = uS_adm('all');
  const [overview, setOverview] = uS_adm(null);
  const [trafficSources, setTrafficSources] = uS_adm(TRAFFIC_SOURCES);
  const [chartData, setChartData] = uS_adm(DAILY);
  const [campaignPerf, setCampaignPerf] = uS_adm(null);
  const [utmData, setUtmData] = uS_adm(null);

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
          <DateRangePicker/>
          <Button variant="secondary" icon={<Icons.Download w={16} h={16}/>}>Export</Button>
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
        <Stat label="Visitor" value={overview?.visitors || '314.700'} sub="30 hari" tone="brand" icon={<Icons.Eye w={20} h={20}/>} trend={{up:true,value:overview?.visitors_trend || '+14.2%'}}/>
        <Stat label="Leads" value={overview?.leads || '11.180'} sub="Form view" tone="cyan" icon={<Icons.Sparkles w={20} h={20}/>} trend={{up:true,value:overview?.leads_trend || '+8.6%'}}/>
        <Stat label="Donation" value={overview?.donations || '4.920'} sub="Tx sukses" tone="green" icon={<Icons.Heart w={20} h={20}/>} trend={{up:true,value:overview?.donations_trend || '+22.1%'}}/>
        <Stat label="Conv. Rate" value={overview?.conv_rate || '4.7%'} sub="Visitor → Donatur" tone="amber" icon={<Icons.Chart w={20} h={20}/>} trend={{up:true,value:overview?.conv_rate_trend || '+0.6%'}}/>
        <Stat label="Cost / Lead" value={overview?.cpl || 'Rp4.870'} sub="CPL rata-rata" tone="cyan" icon={<Icons.Wallet w={20} h={20}/>}/>
        <Stat label="Cost / Donation" value={overview?.cpa || 'Rp17.500'} sub="CPA rata-rata" tone="amber" icon={<Icons.Wallet w={20} h={20}/>}/>
        <Stat label="Revenue / Campaign" value={overview?.rev_per_campaign ? fmtShort(overview.rev_per_campaign) : fmtShort(348_500_000)} sub="Rata-rata" tone="brand" icon={<Icons.Star w={20} h={20}/>}/>
        <Stat label="ROAS Estimasi" value={overview?.roas || '4.8×'} sub="Return on ad spend" tone="green" icon={<Icons.Chart w={20} h={20}/>} trend={{up:true,value:overview?.roas_trend || '+0.3×'}}/>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Performance line */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold text-ink dark:text-slate-100">Performa Campaign</div>
              <div className="text-xs text-muted">Donasi vs Spend iklan · 30 hari</div>
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
            <Donut size={170} thickness={26} segments={trafficSources.map(s=>({value:s.visits, color:s.color}))} center={<><div className="text-xl font-extrabold tnum">{fmtNum(trafficSources.reduce((a,b)=>a+b.visits,0))}</div><div className="text-xs text-muted">Visitor</div></>}/>
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
            <div className="text-xs text-muted">Klik kolom untuk sort</div>
          </div>
          <Button variant="secondary" size="sm" icon={<Icons.Filter w={14} h={14}/>}>Filter</Button>
        </div>
        <div className="overflow-x-auto nice-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
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
            <div className="text-xs text-muted">Parameter pelacakan iklan yang aktif</div>
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
              <div className="text-[11px] font-mono text-muted">{k}</div>
              <div className="font-bold text-sm text-ink dark:text-slate-100 truncate mt-0.5">{v}</div>
              <div className="text-xs text-muted">{sub}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { AdminDashboard, CampaignsPage, AnalyticsPage, TxTable, DateRangePicker });

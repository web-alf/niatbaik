// Dashboard view - varies per role
// Hardcoded table tweaks (the design-tool Tweaks panel is dropped in production).
const TW = {
  txnRowCount: 8, txnDensity: 'regular', txnStriped: false, txnShowToolbar: true,
  txnShowDonatur: true, txnShowCampaign: true, txnShowMetode: true, txnShowSumber: true,
  txnShowStatus: true, txnShowTanggal: true, txnAnonymizeAll: false, txnAccent: '#2E4191',
  txnTitle: '10 transaksi paling baru', txnAutoConfirmMoota: true, txnShowMethodFilter: true,
  txnHighlightAutoConfirm: true,
};

function DashboardView() {
  const { role, user, setView, setInvoiceTxn, showToast } = useApp();
  // Live data when API loaded it; else seed.
  const txns = (window.TRANSACTIONS && window.TRANSACTIONS.length) ? window.TRANSACTIONS : window.NB.txns;
  const campaignSeed = (window.CAMPAIGNS && window.CAMPAIGNS.length) ? window.CAMPAIGNS : window.NB.campaignSeed;
  // dailyDonations may be [{amount,...}] (API) or [number] (seed) — normalize to numbers.
  const dailyRaw = (window.DAILY_DONATIONS && window.DAILY_DONATIONS.length) ? window.DAILY_DONATIONS : window.NB.dailyDonations;
  const dailyDonations = dailyRaw.map(d => typeof d === 'object' ? (d.amount || 0) : d);
  // Live KPI stats overlay (snake_case from API) with seed fallback.
  const S = window.DASHBOARD_STATS || {};

  // Role-specific dashboards
  if (role === 'Advertiser') return <AdvertiserView/>;
  if (role === 'CS') return <CSDashboard/>;

  const [range, setRange] = useStateA(window.__nb_dateRange || window.DEFAULT_RANGE);
  const tw = TW;
  const [txnQuery, setTxnQuery] = useStateA('');
  const [txnStatusFilter, setTxnStatusFilter] = useStateA('all');
  const [txnMethodFilter, setTxnMethodFilter] = useStateA('all');

  // Apply Moota/Flip auto-confirm on Pending rows when the tweak is on.
  // We tag the rows we changed so the table can pulse them.
  const processedTxns = useMemoA(() => {
    if (!tw.txnAutoConfirmMoota) return txns;
    return txns.map((t) => {
      if (t.status === 'Pending' && window.NB.isAutoConfirmMethod(t.method)) {
        return { ...t, status: 'Paid', _autoConfirmed: true };
      }
      return t;
    });
  }, [tw.txnAutoConfirmMoota]);

  const visibleTxns = useMemoA(() => {
    const q = txnQuery.trim().toLowerCase();
    return processedTxns.filter((t) => {
      if (txnStatusFilter !== 'all' && t.status !== txnStatusFilter) return false;
      if (txnMethodFilter !== 'all' && t.method !== txnMethodFilter) return false;
      if (!q) return true;
      const donor = t.anon ? 'hamba allah' : (t.donor || '').toLowerCase();
      return t.id.toLowerCase().includes(q) || donor.includes(q) || (t.campaign||'').toLowerCase().includes(q);
    });
  }, [processedTxns, txnQuery, txnStatusFilter, txnMethodFilter]);

  const filteredTxns = useMemoA(() => filterByRange(txns, range), [range]);

  const exportRows = () => filteredTxns.map(t => ({
    invoice: t.id,
    tanggal: t.date,
    donatur: t.anon ? 'Hamba Allah' : t.donor,
    campaign: t.campaign,
    nominal: t.amount,
    metode: t.method,
    status: t.status,
    whatsapp: t.whatsapp,
    email: t.email,
    utm_source: t.utm.source,
    utm_medium: t.utm.medium,
    utm_campaign: t.utm.campaign,
    utm_content: t.utm.content || '',
    utm_term: t.utm.term || '',
    utm_id: t.utm.id || '',
    pesan: t.message,
  }));

  const handleExport = (kind) => {
    const rows = exportRows();
    if (!rows.length) { showToast('Tidak ada data pada rentang tanggal'); return; }
    if (kind === 'csv') exportCSV(rows, 'niatbaik_transaksi', range);
    else exportExcel(rows, 'niatbaik_transaksi', range, 'Transaksi');
    showToast(`${rows.length} baris diekspor ke ${kind.toUpperCase()}`);
  };

  // Admin dashboard — live stats overlay (S) with seed fallback values.
  const stats = [
    { icon:'wallet', label:'Total Donasi',         value: fmtIDRShort(S.total_raised ?? 1_842_315_500), delta:'+18.4%', sub:'sepanjang waktu', accent:'brand' },
    { icon:'creditcard', label:'Total Transaksi',  value: fmtNum(S.total_transactions ?? 24_812), delta:'+12.1%', sub:'transaksi sukses', accent:'sky' },
    { icon:'megaphone', label:'Campaign Aktif',    value: String(S.active_campaigns ?? 14), delta:'+3', deltaTone:'up', sub:'sedang berjalan', accent:'ok' },
    { icon:'handshake', label:'Total Fundraiser',  value: String(S.total_fundraisers ?? 38), delta:'+5', sub:'mitra aktif', accent:'warn' },
    { icon:'target', label:'Leads dari Iklan',     value: fmtNum(S.total_leads ?? 13_072), delta:'+22.6%', sub:'30 hari terakhir', accent:'brand' },
    { icon:'bolt',  label:'Conversion Rate',       value: (S.conversion_rate != null ? S.conversion_rate.toFixed(1) : '4.8') + '%', delta:'+0.6pp', sub:'lead → donasi', accent:'sky' },
    { icon:'sun',   label:'Donasi Hari Ini',       value: fmtIDRShort(S.today_raised ?? 34_280_000), delta:'+8.1%', sub:'transaksi hari ini', accent:'ok' },
    { icon:'flame', label:'Donasi Bulan Ini',      value: fmtIDRShort(S.month_raised ?? 412_460_000), delta:'+14.3%', sub:'Mei 2026', accent:'bad' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat datang kembali, ${(user?.name || 'Admin').split(' ')[0]} 👋`}
        subtitle="Ringkasan performa platform NIATBAIK.ORG."
        actions={<>
          <DateRangePill value={range} onChange={setRange}/>
          <Btn variant="outline" tone="ink" icon="upload">Import</Btn>
          <Btn variant="outline" tone="ink" icon="download" onClick={() => handleExport('csv')}>Export CSV</Btn>
          <Btn icon="download" onClick={() => handleExport('xls')}>Export Excel</Btn>
        </>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={i} {...s}/>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-mute">Grafik Donasi Harian</div>
              <div className="mt-1 text-xl font-bold text-ink">{fmtIDRShort(dailyDonations.reduce((a,b)=>a+b,0))}</div>
              <div className="text-xs text-mute">30 hari terakhir · rata-rata {fmtIDRShort(dailyDonations.reduce((a,b)=>a+b,0)/30)} / hari</div>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value="30" onChange={()=>{}} tabs={[
                { value:'7', label:'7 hari' },
                { value:'30', label:'30 hari' },
                { value:'90', label:'90 hari' },
              ]}/>
            </div>
          </div>
          <LineChart data={dailyDonations} height={220}/>
          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-bg2"><div className="text-mute">Hari tertinggi</div><div className="font-bold text-ink mt-1">{fmtIDRShort(Math.max(...dailyDonations))}</div></div>
            <div className="p-3 rounded-lg bg-bg2"><div className="text-mute">Hari terendah</div><div className="font-bold text-ink mt-1">{fmtIDRShort(Math.min(...dailyDonations))}</div></div>
            <div className="p-3 rounded-lg bg-bg2"><div className="text-mute">Median harian</div><div className="font-bold text-ink mt-1">{fmtIDRShort(dailyDonations.slice().sort((a,b)=>a-b)[15])}</div></div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-mute">Donasi per Payment Method</div>
              <div className="mt-1 text-xl font-bold text-ink">Mei 2026</div>
            </div>
            <button className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
              <Icon name="download" size={14}/> Unduh
            </button>
          </div>
          <div className="flex items-center justify-center my-3">
            <Donut size={170}
              data={[
                { value: 4820, color: '#2E4191' },
                { value: 3210, color: '#38B6FF' },
                { value: 2104, color: '#16A34A' },
                { value: 1480, color: '#F59E0B' },
                { value:  840, color: '#DC2626' },
                { value:  612, color: '#94A3B8' },
              ]}
            />
          </div>
          <div className="space-y-2 mt-2">
            {[
              { label:'QRIS', n: 4820, pct: 38, color:'#2E4191' },
              { label:'Bank Transfer (VA)', n: 3210, pct: 25, color:'#38B6FF' },
              { label:'GoPay', n: 2104, pct: 17, color:'#16A34A' },
              { label:'OVO',   n: 1480, pct: 12, color:'#F59E0B' },
              { label:'Dana',  n:  840, pct: 7, color:'#DC2626' },
              { label:'Lainnya', n: 612, pct: 1, color:'#94A3B8' },
            ].map((p) => (
              <div key={p.label} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }}/>
                <span className="flex-1 text-ink font-medium">{p.label}</span>
                <span className="text-mute">{fmtNum(p.n)}</span>
                <span className="w-10 text-right font-bold text-ink">{p.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-mute">Transaksi Terbaru</div>
            <div className="mt-1 font-bold text-ink flex items-center gap-2 flex-wrap">
              <span>{tw.txnTitle}</span>
              {tw.txnAutoConfirmMoota && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                  Auto-confirm Moota/Flip
                </span>
              )}
            </div>
          </div>
          {tw.txnShowToolbar && (
            <div className="flex items-center gap-2 flex-wrap">
              <SearchInput placeholder="Cari invoice / donatur…" className="w-64" value={txnQuery} onChange={setTxnQuery}/>
              <Select value={txnStatusFilter} onChange={setTxnStatusFilter} icon="filter" options={[{value:'all',label:'Semua status'},{value:'Paid',label:'Paid'},{value:'Pending',label:'Pending'},{value:'Failed',label:'Failed'}]}/>
              {tw.txnShowMethodFilter && (
                <Select value={txnMethodFilter} onChange={setTxnMethodFilter} icon="creditcard" options={[
                  {value:'all', label:'Semua metode'},
                  ...window.NB.paymentMethods.map((m) => ({ value: m, label: m })),
                ]}/>
              )}
              <Btn variant="ghost" tone="ink" size="sm" onClick={() => setView('inbox')} iconRight="arrowR">Lihat semua</Btn>
            </div>
          )}
        </div>
        {visibleTxns.length === 0 ? (
          <div className="py-12 text-center text-sm text-mute">
            Tidak ada transaksi yang cocok dengan filter.
          </div>
        ) : (
          <TxnTable
            rows={visibleTxns.slice(0, tw.txnRowCount)}
            onOpen={setInvoiceTxn}
            density={tw.txnDensity}
            striped={tw.txnStriped}
            accent={tw.txnAccent}
            anonymizeAll={tw.txnAnonymizeAll}
            highlightAutoConfirm={tw.txnHighlightAutoConfirm}
            showDonatur={tw.txnShowDonatur}
            showCampaign={tw.txnShowCampaign}
            showMetode={tw.txnShowMetode}
            showSumber={tw.txnShowSumber}
            showStatus={tw.txnShowStatus}
            showTanggal={tw.txnShowTanggal}
          />
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-ink">Top Campaign Hari Ini</div>
            <Btn size="sm" variant="ghost" tone="ink" iconRight="arrowR" onClick={() => setView('campaigns')}>Lihat semua</Btn>
          </div>
          <div className="space-y-3">
            {campaignSeed.filter(c => c.status === 'Running').slice(0,4).map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-bg2">
                <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden" style={{background: c.thumb}}>
                  <div className="h-full flex items-center justify-center text-white/90"><Icon name={c.icon} size={20}/></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-ink truncate">{c.title}</div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-mute">
                    <span>{fmtIDRShort(c.raised)} / {fmtIDRShort(c.target)}</span>
                    <span>·</span>
                    <span>{fmtNum(c.donors)} donatur</span>
                  </div>
                  <div className="mt-1.5"><Progress value={c.raised} max={c.target} height="h-1.5"/></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-ink">Sumber Traffic & Lead</div>
            <Btn size="sm" variant="ghost" tone="ink" iconRight="arrowR" onClick={() => setView('analytics')}>Detail</Btn>
          </div>
          <div className="space-y-3">
            {window.NB.trafficSources.map((t) => (
              <div key={t.name}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{background: t.color}}/>
                    <span className="font-semibold text-ink">{t.name}</span>
                  </div>
                  <div className="text-xs text-mute">{fmtNum(t.visits)} visits · {fmtNum(t.leads)} leads · <b className="text-ink">{fmtNum(t.donations)}</b> donasi</div>
                </div>
                <div className="mt-1.5"><Progress value={t.donations} max={2000} height="h-1.5"/></div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-bg2"><div className="text-xs text-mute">Cost / Lead</div><div className="text-lg font-bold text-ink">{fmtIDRShort(15_400)}</div></div>
            <div className="p-3 rounded-lg bg-bg2"><div className="text-xs text-mute">Cost / Donation</div><div className="text-lg font-bold text-ink">{fmtIDRShort(48_900)}</div></div>
            <div className="p-3 rounded-lg bg-bg2"><div className="text-xs text-mute">ROAS</div><div className="text-lg font-bold text-emerald-600">3.8x</div></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ----- CS Dashboard (lighter) -----
function CSDashboard() {
  const { txns } = window.NB;
  const { user, setInvoiceTxn, setView } = useApp();
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat datang, ${(user?.name || 'CS').split(' ')[0]} 👋`}
        subtitle="Dashboard Customer Service · prioritaskan donatur yang menunggu follow-up."
        actions={<><DateRangePill/><Btn variant="outline" tone="ink" icon="download">Export terbatas</Btn></>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="inbox"   label="Menunggu follow-up" value="24" delta="+6" deltaTone="up" accent="warn" sub="donatur pending"/>
        <StatCard icon="check"   label="Selesai hari ini"   value="58" delta="+12" accent="ok" sub="follow-up tuntas"/>
        <StatCard icon="wa"      label="Pesan WA terkirim"  value="412" delta="+3.2%" accent="sky" sub="bulan ini"/>
        <StatCard icon="creditcard" label="Pending payment" value={fmtIDRShort(42_180_000)} delta="-8%" deltaTone="down" accent="bad" sub="butuh ditindaklanjuti"/>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-ink">Antrian Follow-up</div>
          <Btn size="sm" variant="ghost" tone="ink" iconRight="arrowR" onClick={() => setView('inbox')}>Buka inbox</Btn>
        </div>
        <TxnTable rows={txns.filter(t => t.status !== 'Paid').slice(0,8)} onOpen={setInvoiceTxn}/>
      </Card>
    </div>
  );
}

// ----- Transactions table component -----
function TxnTable({
  rows, onOpen, compact = false,
  density = 'regular',
  striped = false,
  accent,
  anonymizeAll = false,
  highlightAutoConfirm = true,
  showDonatur = true,
  showCampaign = true,
  showMetode = true,
  showSumber = true,
  showStatus = true,
  showTanggal = true,
}) {
  const padY = density === 'compact' ? 'py-1.5' : density === 'comfy' ? 'py-4' : 'py-3';
  const headPad = density === 'compact' ? 'py-2' : density === 'comfy' ? 'py-3' : 'py-2.5';
  const stripe = (i) => striped && i % 2 === 1 ? 'bg-bg2/40' : '';
  const accentStyle = accent ? { color: accent } : undefined;
  const autoCls = (r) => (highlightAutoConfirm && r._autoConfirmed) ? 'bg-emerald-50/40' : '';
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-mute border-y border-line bg-bg2/60">
            <th className={`px-5 ${headPad} font-semibold`}>Invoice</th>
            {showDonatur && <th className={`${headPad} font-semibold`}>Donatur</th>}
            {showCampaign && <th className={`${headPad} font-semibold`}>Campaign</th>}
            <th className={`${headPad} font-semibold`}>Nominal</th>
            {showMetode && <th className={`${headPad} font-semibold`}>Metode</th>}
            {showSumber && <th className={`${headPad} font-semibold`}>Sumber</th>}
            {showStatus && <th className={`${headPad} font-semibold`}>Status</th>}
            {showTanggal && <th className={`pr-5 ${headPad} font-semibold text-right`}>Tanggal</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className={`border-b border-line last:border-0 hover:bg-bg2/60 cursor-pointer ${stripe(i)} ${autoCls(r)}`} onClick={() => onOpen && onOpen(r)}>
              <td className={`px-5 ${padY} font-mono font-semibold text-brand-600`} style={accentStyle}>{r.id}</td>
              {showDonatur && <td className={padY}>{(anonymizeAll || r.anon) ? <span className="italic text-mute">Hamba Allah</span> : r.donor}</td>}
              {showCampaign && <td className={`${padY} max-w-[240px] truncate text-ink/90`}>{r.campaign}</td>}
              <td className={`${padY} font-semibold text-ink`}>{fmtIDR(r.amount)}</td>
              {showMetode && <td className={`${padY} text-xs`}>
                <Badge tone={window.NB.isAutoConfirmMethod(r.method) ? 'sky' : 'outline'}>{r.method}</Badge>
              </td>}
              {showSumber && <td className={padY}><SourcePill source={r.utm.source}/></td>}
              {showStatus && <td className={padY}>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={r.status}/>
                  {highlightAutoConfirm && r._autoConfirmed && (
                    <span title="Status otomatis dari webhook Moota/Flip" className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                      <Icon name="bolt" size={11}/> auto
                    </span>
                  )}
                </div>
              </td>}
              {showTanggal && <td className={`pr-5 ${padY} text-right text-xs text-mute`}>{r.date}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

window.DashboardView = DashboardView;
window.TxnTable = TxnTable;

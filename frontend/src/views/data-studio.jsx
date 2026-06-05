// Data Studio (Looker Studio) embed page — consolidated analytics dashboard
function DataStudioView() {
  const { dailyDonations, trafficSources, campaignSeed } = window.NB;
  const [page, setPage] = useStateA('overview');
  const [dateRange, setDateRange] = useStateA('Last 30 days');
  const [platform, setPlatform] = useStateA('All');
  const [dsCampaign, setDsCampaign] = useStateA('All Campaigns');
  const [country, setCountry] = useStateA('Indonesia');
  const [device, setDevice] = useStateA('All devices');
  const [dsData, setDsData] = useStateA({});
  const [dsLoading, setDsLoading] = useStateA(false);

  useEffectA(() => {
    (async () => {
      setDsLoading(true);
      try {
        const loaders = {
          overview: api.dataStudioOverview,
          meta: api.dataStudioMeta,
          google: api.dataStudioGoogle,
          tiktok: api.dataStudioTiktok,
          geo: api.dataStudioGeo,
          funnel: api.dataStudioFunnel,
        };
        const fn = loaders[page];
        if (fn) {
          const res = await fn();
          setDsData(prev => ({...prev, [page]: res?.data || {}}));
        }
      } catch {}
      setDsLoading(false);
    })();
  }, [page]);

  const pages = [
    { v:'overview', l:'Overview' },
    { v:'meta',     l:'Meta Ads' },
    { v:'google',   l:'Google Ads + GA4' },
    { v:'tiktok',   l:'TikTok Funnel' },
    { v:'geo',      l:'Geographic' },
    { v:'funnel',   l:'Conversion Funnel' },
  ];

  return (
    <div className="space-y-4 -mx-4 lg:-mx-6 -my-6 min-h-screen bg-[#F8F9FA]">
      {/* Data Studio top bar */}
      <div className="bg-white border-b border-line">
        <div className="px-4 lg:px-6 py-3 flex items-center gap-3">
          {/* DS logo */}
          <div className="flex items-center gap-2">
            <DataStudioLogo/>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-mute leading-none">Looker Studio</div>
              <div className="font-extrabold text-ink text-base leading-tight">NIATBAIK.ORG · Overview Donasi (Master)</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 ml-2 text-[10px] text-mute">
            <Icon name="refresh" size={12}/> Refreshed 2m ago
          </div>
          <div className="flex-1"/>
          <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute"><Icon name="refresh" size={14}/></button>
          <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute"><Icon name="download" size={14}/></button>
          <button className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-md hover:bg-bg2 text-ink text-xs font-bold">
            <Icon name="eye" size={14}/> Edit
          </button>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#1A73E8] hover:bg-[#1666D5] text-white text-xs font-bold">
            <Icon name="link" size={14}/> Share
          </button>
        </div>
        {/* Page tabs */}
        <div className="px-4 lg:px-6 flex items-center gap-1 overflow-x-auto border-t border-line">
          {pages.map((p) => (
            <button key={p.v} onClick={() => setPage(p.v)}
              className={`relative px-3 py-2.5 text-xs font-bold whitespace-nowrap transition-colors ${page === p.v ? 'text-[#1A73E8]' : 'text-mute hover:text-ink'}`}>
              {p.l}
              {page === p.v && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-[#1A73E8] rounded-full"/>}
            </button>
          ))}
          <button className="px-2.5 py-2.5 text-mute hover:text-ink"><Icon name="plus" size={12}/></button>
        </div>
      </div>

      {/* Filter / control bar */}
      <div className="px-4 lg:px-6 flex flex-wrap items-center gap-2">
        <DSControl label="Date range" value={dateRange} onChange={setDateRange} options={['Today','Last 7 days','Last 30 days','Last 90 days','Custom']}/>
        <DSControl label="Platform"   value={platform} onChange={setPlatform} options={['All','Meta','Google','TikTok','Organic']}/>
        <DSControl label="Campaign"   value={dsCampaign} onChange={setDsCampaign} options={['All Campaigns', ...campaignSeed.map(c => c.title.slice(0,30)+'…')]}/>
        <DSControl label="Country"    value={country} onChange={setCountry} options={['Indonesia','Malaysia','Singapore','Global']}/>
        <DSControl label="Device"     value={device} onChange={setDevice} options={['All devices','Mobile','Desktop','Tablet']}/>
        <div className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-mute">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/>
          Live data · Sumber: Meta Ads · Google Ads · GA4 · TikTok Ads · NIATBAIK.ORG
        </div>
      </div>

      <div className="px-4 lg:px-6 pb-8 relative">
        {dsLoading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <div className="h-8 w-8 border-3 border-[#1A73E8] border-t-transparent rounded-full animate-spin"/>
          </div>
        )}
        {page === 'overview' && <DSOverview daily={dsData.overview?.daily_donations || dailyDonations} sources={dsData.overview?.traffic_sources || trafficSources} campaigns={dsData.overview?.campaigns || campaignSeed}/>}
        {page === 'meta'     && <DSMeta data={dsData.meta}/>}
        {page === 'google'   && <DSGoogle daily={dsData.google?.daily_donations || dailyDonations} data={dsData.google}/>}
        {page === 'tiktok'   && <DSTiktok data={dsData.tiktok}/>}
        {page === 'geo'      && <DSGeo data={dsData.geo}/>}
        {page === 'funnel'   && <DSFunnel data={dsData.funnel}/>}
      </div>
    </div>
  );
}

// -------- Logo --------
function DataStudioLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" className="shrink-0">
      <circle cx="11" cy="14" r="6" fill="#4285F4"/>
      <circle cx="22" cy="11" r="5" fill="#0F9D58"/>
      <circle cx="20" cy="24" r="7" fill="#F4B400"/>
      <circle cx="11" cy="14" r="6" fill="#4285F4" opacity="0.85"/>
    </svg>
  );
}

// -------- Filter control --------
function DSControl({ label, value, options = [], onChange }) {
  return (
    <div className="inline-flex items-center gap-1.5 h-8 pl-2.5 pr-1 rounded-md bg-white border border-line hover:border-[#1A73E8] cursor-pointer">
      <span className="text-[10px] uppercase tracking-wider font-bold text-mute">{label}</span>
      <div className="relative">
        <select value={value} onChange={(e) => onChange && onChange(e.target.value)}
          className="appearance-none bg-transparent pr-5 text-xs font-bold text-ink focus:outline-none cursor-pointer">
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <Icon name="chevronD" size={11} className="absolute right-0 top-1/2 -translate-y-1/2 text-mute pointer-events-none"/>
      </div>
    </div>
  );
}

// -------- DS Card wrapper --------
function DSCard({ title, subtitle, children, className = '', actions, span }) {
  return (
    <div className={`bg-white rounded-md border border-[#DADCE0] ${className}`} style={ span ? { gridColumn: `span ${span}` } : {} }>
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div>
          <div className="text-[13px] font-bold text-ink">{title}</div>
          {subtitle && <div className="text-[10px] text-mute mt-0.5">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-1">
          {actions}
          <button className="h-6 w-6 rounded hover:bg-bg2 text-mute flex items-center justify-center"><Icon name="more" size={13}/></button>
        </div>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

// -------- DS Scorecard --------
function DSScorecard({ label, value, delta, deltaTone = 'up', color = '#1A73E8', sub }) {
  return (
    <div className="bg-white rounded-md border border-[#DADCE0] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-mute">{label}</div>
      <div className="mt-2 text-2xl lg:text-3xl font-extrabold leading-none" style={{ color }}>{value}</div>
      {sub && <div className="mt-1 text-[10px] text-mute">{sub}</div>}
      {delta && (
        <div className={`mt-2 inline-flex items-center gap-1 text-[11px] font-bold ${deltaTone === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
          <Icon name={deltaTone === 'up' ? 'arrowUp' : 'arrowDown'} size={11} strokeWidth={2.5}/>
          {delta}
        </div>
      )}
    </div>
  );
}

// =============================================================
// OVERVIEW PAGE
// =============================================================
function DSOverview({ daily, sources, campaigns }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Scorecards */}
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <DSScorecard label="Sessions"      value={fmtNum(184_290)}   delta="+24.1%" color="#1A73E8"/>
        <DSScorecard label="Donors"        value={fmtNum(13_072)}    delta="+18.0%" color="#0F9D58"/>
        <DSScorecard label="Donations"     value={fmtNum(4_558)}     delta="+12.4%" color="#F4B400"/>
        <DSScorecard label="Revenue"       value={fmtIDRShort(1_842_315_500)} delta="+22.1%" color="#EA4335"/>
        <DSScorecard label="ROAS"          value="3.8x"              delta="+0.3x"  color="#4285F4"/>
        <DSScorecard label="CVR"           value="2.47%"             delta="+0.4pp" color="#9C27B0"/>
      </div>

      {/* Time series + Source mix */}
      <div className="col-span-12 lg:col-span-8">
        <DSCard title="Sessions, Donations & Revenue" subtitle="Daily · Last 30 days">
          <DSStackedSeries daily={daily}/>
          <DSLegend items={[
            { c:'#1A73E8', l:'Sessions' },
            { c:'#0F9D58', l:'Donations' },
            { c:'#F4B400', l:'Revenue (Rp jt)' },
          ]}/>
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-4">
        <DSCard title="Sessions by Source" subtitle="Compared to previous period">
          <div className="flex items-center justify-center my-2">
            <Donut size={170} data={sources.map(s => ({ value: s.visits, color: s.color }))}/>
          </div>
          <div className="space-y-1.5 mt-2">
            {sources.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }}/>
                <span className="flex-1 font-semibold text-ink">{s.name}</span>
                <span className="text-mute">{fmtNum(s.visits)}</span>
              </div>
            ))}
          </div>
        </DSCard>
      </div>

      {/* Hourly heatmap */}
      <div className="col-span-12 lg:col-span-8">
        <DSCard title="Donation activity heatmap" subtitle="Donations per hour × day of week">
          <DSHeatmap/>
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-4">
        <DSCard title="Top KPI dibanding target Q2">
          <div className="space-y-3">
            {[
              { l:'Revenue',  v:1842, t:2500, suf:' jt', color:'#1A73E8' },
              { l:'Donors',   v:13072, t:18000, suf:'',   color:'#0F9D58' },
              { l:'CVR',      v:2.47, t:3.5, suf:'%',     color:'#F4B400' },
              { l:'ROAS',     v:3.8, t:4.0, suf:'x',     color:'#EA4335' },
            ].map((k, i) => {
              const pct = Math.min(100, (k.v / k.t) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-ink">{k.l}</span>
                    <span className="text-mute">{fmtNum(k.v)}{k.suf} / {fmtNum(k.t)}{k.suf}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: pct + '%', background: k.color }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </DSCard>
      </div>

      {/* Channel performance table */}
      <div className="col-span-12 lg:col-span-7">
        <DSCard title="Channel Performance" subtitle="Last 30 days · sorted by Revenue">
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-mute border-b border-[#DADCE0]">
                  <th className="px-4 py-2 font-bold">Source / Medium</th>
                  <th className="py-2 font-bold text-right">Sessions</th>
                  <th className="py-2 font-bold text-right">Donors</th>
                  <th className="py-2 font-bold text-right">CVR</th>
                  <th className="py-2 font-bold text-right">Revenue</th>
                  <th className="pr-4 py-2 font-bold text-right">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { sm:'facebook / paid',  s:48230, d:5612, rev:520_400_000, roas:3.6, color:'#1877F2' },
                  { sm:'google / cpc',     s:22150, d:2840, rev:412_300_000, roas:4.1, color:'#34A853' },
                  { sm:'tiktok / paid',    s:31840, d:3210, rev:298_200_000, roas:2.9, color:'#000000' },
                  { sm:'instagram / social', s:9120, d:870, rev:118_400_000, roas:'∞', color:'#E4405F' },
                  { sm:'(direct) / (none)',  s:13770, d:1410, rev:284_010_000, roas:'∞', color:'#94A3B8' },
                  { sm:'google / organic',   s:18920, d:1240, rev:209_005_500, roas:'∞', color:'#34A853' },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-[#DADCE0]/60 last:border-0 hover:bg-bg2/60">
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: r.color }}/>
                        <span className="font-mono">{r.sm}</span>
                      </span>
                    </td>
                    <td className="py-2.5 text-right">{fmtNum(r.s)}</td>
                    <td className="py-2.5 text-right">{fmtNum(r.d)}</td>
                    <td className="py-2.5 text-right">{(r.d/r.s*100).toFixed(2)}%</td>
                    <td className="py-2.5 text-right font-bold">{fmtIDRShort(r.rev)}</td>
                    <td className="pr-4 py-2.5 text-right">
                      <span className={`font-bold ${typeof r.roas === 'number' && r.roas < 3 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.roas}{typeof r.roas === 'number' ? 'x' : ''}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <DSCard title="Top Campaigns" subtitle="Revenue · Last 30 days">
          <div className="space-y-2">
            {campaigns.slice(0, 5).map((c, i) => {
              const rev = c.raised + i * 1000;
              const pct = (rev / 600_000_000) * 100;
              return (
                <div key={c.id} className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md shrink-0" style={{ background: c.thumb }}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-ink line-clamp-1">{c.title}</div>
                    <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#1A73E8] to-[#0F9D58]" style={{ width: Math.min(100, pct) + '%' }}/>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold text-ink">{fmtIDRShort(rev)}</div>
                    <div className="text-[10px] text-mute">{fmtNum(c.donors)} donors</div>
                  </div>
                </div>
              );
            })}
          </div>
        </DSCard>
      </div>

      {/* Geo + device */}
      <div className="col-span-12 lg:col-span-6">
        <DSCard title="Sessions by Country" subtitle="Top 10">
          <div className="space-y-1.5">
            {[
              { n:'🇮🇩 Indonesia', v: 142_300, pct: 78 },
              { n:'🇲🇾 Malaysia',  v: 18_120,  pct: 10 },
              { n:'🇸🇬 Singapore', v: 8_140,   pct: 4.5 },
              { n:'🇸🇦 Saudi Arabia', v: 5_280, pct: 3 },
              { n:'🇺🇸 United States', v: 4_220, pct: 2.5 },
              { n:'🇦🇪 UAE',       v: 3_220, pct: 1.8 },
              { n:'🇳🇱 Belanda',   v: 1_510, pct: 0.8 },
              { n:'🇦🇺 Australia', v: 1_500, pct: 0.4 },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-32 truncate">{c.n}</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-sm overflow-hidden">
                  <div className="h-full bg-[#4285F4]" style={{ width: c.pct + '%' }}/>
                </div>
                <span className="w-16 text-right text-mute">{fmtNum(c.v)}</span>
                <span className="w-10 text-right font-bold">{c.pct}%</span>
              </div>
            ))}
          </div>
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-3">
        <DSCard title="Device Category">
          <div className="flex items-center justify-center my-2">
            <Donut size={140} data={[
              { value: 8420, color: '#1A73E8' },
              { value: 3140, color: '#0F9D58' },
              { value: 1280, color: '#F4B400' },
            ]}/>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-[#1A73E8]"/><span className="flex-1">Mobile</span><span className="font-bold">66%</span></div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-[#0F9D58]"/><span className="flex-1">Desktop</span><span className="font-bold">24%</span></div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-[#F4B400]"/><span className="flex-1">Tablet</span><span className="font-bold">10%</span></div>
          </div>
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-3">
        <DSCard title="Payment Method">
          <div className="space-y-1.5 text-xs">
            {[
              { n:'QRIS', v:38, c:'#1A73E8' },
              { n:'Bank VA', v:25, c:'#0F9D58' },
              { n:'GoPay', v:17, c:'#F4B400' },
              { n:'OVO', v:12, c:'#EA4335' },
              { n:'Dana', v:7, c:'#9C27B0' },
              { n:'Other', v:1, c:'#94A3B8' },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm" style={{ background: p.c }}/>
                <span className="flex-1 truncate">{p.n}</span>
                <div className="w-16 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                  <div className="h-full" style={{ width: (p.v * 2.6) + '%', background: p.c }}/>
                </div>
                <span className="w-8 text-right font-bold">{p.v}%</span>
              </div>
            ))}
          </div>
        </DSCard>
      </div>

      {/* Footer info */}
      <div className="col-span-12 mt-2 text-[10px] text-mute flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5"><DataStudioLogo/> Powered by Looker Studio</span>
        <span>·</span>
        <span>Data freshness: 15 minutes</span>
        <span>·</span>
        <span>Last update: 2 menit lalu</span>
        <span className="ml-auto">Owner: andre@niatbaik.org</span>
      </div>
    </div>
  );
}

// =============================================================
// META ADS PAGE
// =============================================================
function DSMeta() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-5 gap-3">
        <DSScorecard label="Ad Spend"   value={fmtIDRShort(92_400_000)}  delta="+12%" color="#1877F2"/>
        <DSScorecard label="Impressions" value={fmtNum(2_840_120)}        delta="+8%"  color="#1877F2"/>
        <DSScorecard label="CTR"        value="3.42%"                     delta="+0.4pp" color="#1877F2"/>
        <DSScorecard label="Donations"  value={fmtNum(1_842)}             delta="+18%" color="#0F9D58"/>
        <DSScorecard label="ROAS"       value="3.6x"                      delta="+0.2x" color="#EA4335"/>
      </div>

      <div className="col-span-12 lg:col-span-8">
        <DSCard title="Meta Ads — Spend vs Revenue" subtitle="Daily">
          <DSStackedSeries daily={window.NB.dailyDonations}/>
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-4">
        <DSCard title="Placement Performance">
          <div className="space-y-2">
            {[
              { n:'Feed', v:48, c:'#1877F2' },
              { n:'Stories', v:24, c:'#42A5F5' },
              { n:'Reels',   v:18, c:'#0288D1' },
              { n:'Marketplace', v:6, c:'#01579B' },
              { n:'Audience Network', v:4, c:'#7C9CB8' },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.c }}/>
                <span className="flex-1 font-semibold">{p.n}</span>
                <div className="w-20 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                  <div className="h-full" style={{ width: (p.v * 2) + '%', background: p.c }}/>
                </div>
                <span className="w-8 text-right font-bold">{p.v}%</span>
              </div>
            ))}
          </div>
        </DSCard>
      </div>

      <div className="col-span-12">
        <DSCard title="Ad Sets" subtitle="Top 10 · Sorted by ROAS">
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-mute border-b border-[#DADCE0]">
                  <th className="px-4 py-2 font-bold">Ad Set</th>
                  <th className="py-2 font-bold text-right">Reach</th>
                  <th className="py-2 font-bold text-right">Impressions</th>
                  <th className="py-2 font-bold text-right">Clicks</th>
                  <th className="py-2 font-bold text-right">CTR</th>
                  <th className="py-2 font-bold text-right">CPC</th>
                  <th className="py-2 font-bold text-right">Spend</th>
                  <th className="py-2 font-bold text-right">Donations</th>
                  <th className="pr-4 py-2 font-bold text-right">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Aira-Jantung · Reels · 25-44 F', 184_220, 412_300, 14820, 3.59, 6234, 18_410_000, 412, 4.2],
                  ['Sumur-NTT · Feed · Indonesia',   142_180, 320_180, 10240, 3.20, 5840, 12_980_000, 318, 3.8],
                  ['Bukber-Yatim · Stories · 30-50', 120_440, 280_120, 9120,  3.26, 6210,  11_320_000, 294, 3.6],
                  ['Wakaf-Quran · Lookalike 1%',     98_120,  220_410, 6824,  3.10, 7280,   9_870_000, 184, 2.9],
                  ['Madrasah · Carousel',             82_310,  180_220, 5210,  2.89, 7912,   8_240_000, 142, 2.6],
                ].map((r, i) => (
                  <tr key={i} className="border-b border-[#DADCE0]/60 hover:bg-bg2/60">
                    <td className="px-4 py-2 font-mono">{r[0]}</td>
                    <td className="py-2 text-right">{fmtNum(r[1])}</td>
                    <td className="py-2 text-right">{fmtNum(r[2])}</td>
                    <td className="py-2 text-right">{fmtNum(r[3])}</td>
                    <td className="py-2 text-right">{r[4]}%</td>
                    <td className="py-2 text-right">{fmtIDRShort(r[5])}</td>
                    <td className="py-2 text-right font-bold">{fmtIDRShort(r[6])}</td>
                    <td className="py-2 text-right">{fmtNum(r[7])}</td>
                    <td className="pr-4 py-2 text-right"><span className={'font-bold ' + (r[8] >= 3 ? 'text-emerald-600' : 'text-amber-600')}>{r[8]}x</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DSCard>
      </div>
    </div>
  );
}

// =============================================================
// GOOGLE PAGE
// =============================================================
function DSGoogle({ daily }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-5 gap-3">
        <DSScorecard label="Ad Spend"    value={fmtIDRShort(58_300_000)} delta="+9%" color="#34A853"/>
        <DSScorecard label="Impr."        value={fmtNum(1_820_140)}        delta="+12%" color="#34A853"/>
        <DSScorecard label="CTR"          value="4.18%"                    delta="+0.6pp" color="#34A853"/>
        <DSScorecard label="GA4 Sessions" value={fmtNum(82_440)}           delta="+14%" color="#4285F4"/>
        <DSScorecard label="ROAS"         value="4.1x"                     delta="+0.3x" color="#EA4335"/>
      </div>
      <div className="col-span-12 lg:col-span-7">
        <DSCard title="GA4 · Sessions & Conversions" subtitle="Daily">
          <DSStackedSeries daily={daily}/>
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <DSCard title="Top Search Keywords">
          <div className="space-y-1.5 text-xs">
            {[
              { k:'donasi sumur bersih', v:8420, c:1.8 },
              { k:'wakaf quran online', v:5210, c:2.2 },
              { k:'donasi anak yatim', v:4180, c:1.5 },
              { k:'zakat fitrah online', v:3820, c:1.3 },
              { k:'sedekah jariyah', v:3120, c:1.9 },
              { k:'donasi medis terpercaya', v:2510, c:2.8 },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-mono flex-1 truncate">{r.k}</span>
                <span className="w-12 text-right text-mute">{fmtNum(r.v)}</span>
                <span className="w-12 text-right font-bold text-emerald-600">{r.c}%</span>
              </div>
            ))}
          </div>
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <DSCard title="Landing Page Performance">
          <div className="space-y-2 text-xs">
            {[
              { l:'/c/aira-jantung-q2', s:18420, b:0.42, t:'01:24' },
              { l:'/c/sumur-bersih-ntt', s:14820, b:0.38, t:'01:48' },
              { l:'/c/wakaf-quran', s:11240, b:0.51, t:'00:58' },
              { l:'/c/bukber-yatim', s:8820, b:0.34, t:'02:12' },
              { l:'/', s:21340, b:0.62, t:'00:42' },
            ].map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center border-b border-[#DADCE0]/40 pb-1.5">
                <span className="font-mono text-ink truncate">{r.l}</span>
                <span className="text-mute">{fmtNum(r.s)} sess</span>
                <span className={'font-bold ' + (r.b > 0.5 ? 'text-rose-600' : 'text-emerald-600')}>{(r.b*100).toFixed(0)}% BR</span>
                <span className="text-mute">{r.t}</span>
              </div>
            ))}
          </div>
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <DSCard title="Conversion Path">
          <div className="space-y-2">
            {[
              { path:['Direct'], v:14, conv:412 },
              { path:['Google Organic'], v:12, conv:382 },
              { path:['Google Paid'], v:18, conv:524 },
              { path:['Google Paid','Direct'], v:9, conv:296 },
              { path:['Google Organic','Google Paid'], v:7, conv:212 },
              { path:['Facebook','Google Paid','Direct'], v:4, conv:148 },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                {p.path.map((step, j) => (
                  <React.Fragment key={j}>
                    <span className="px-1.5 py-0.5 rounded bg-[#E8F0FE] text-[#1A73E8] font-mono text-[10px] font-bold">{step}</span>
                    {j < p.path.length - 1 && <Icon name="arrowR" size={10} className="text-mute"/>}
                  </React.Fragment>
                ))}
                <span className="ml-auto text-mute">{p.v}%</span>
                <span className="font-bold w-14 text-right">{p.conv} conv</span>
              </div>
            ))}
          </div>
        </DSCard>
      </div>
    </div>
  );
}

// =============================================================
// TIKTOK PAGE
// =============================================================
function DSTiktok() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 flex items-center gap-2 text-rose-700 text-xs font-semibold">
        <Icon name="shield" size={14}/> Connection error: <code className="bg-white px-1.5 py-0.5 rounded">TikTok Events API token expired</code> — sebagian data mungkin belum tersinkron.
        <button className="ml-auto text-rose-700 font-bold hover:underline">Reconnect</button>
      </div>
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-5 gap-3">
        <DSScorecard label="Ad Spend"   value={fmtIDRShort(41_800_000)} delta="+22%" color="#000000"/>
        <DSScorecard label="Views"      value={fmtNum(8_240_000)}       delta="+34%" color="#FF0050"/>
        <DSScorecard label="VTR (3s)"   value="62.4%"                   delta="+4pp" color="#00F2EA"/>
        <DSScorecard label="Donations"  value={fmtNum(980)}              delta="+18%" color="#0F9D58"/>
        <DSScorecard label="ROAS"       value="2.9x"                    delta="-0.1x" deltaTone="down" color="#EA4335"/>
      </div>
      <div className="col-span-12 lg:col-span-7">
        <DSCard title="TikTok — Spend vs Donations">
          <DSStackedSeries daily={window.NB.dailyDonations}/>
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <DSCard title="Top Performing Creatives">
          <div className="space-y-2">
            {[
              { n:'bantu-rans (UGC story)', cvr:5.8, v:840_120 },
              { n:'aira-story-30s',          cvr:4.2, v:620_140 },
              { n:'sumur-impact-video',      cvr:3.9, v:512_320 },
              { n:'wakaf-testimonial',       cvr:3.1, v:412_120 },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="h-10 w-7 rounded bg-gradient-to-br from-[#FF0050] to-[#00F2EA] shrink-0"/>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-ink truncate">{r.n}</div>
                  <div className="text-[10px] text-mute">{fmtNum(r.v)} views</div>
                </div>
                <span className="text-xs font-extrabold text-emerald-600">{r.cvr}%</span>
              </div>
            ))}
          </div>
        </DSCard>
      </div>
    </div>
  );
}

// =============================================================
// GEO PAGE
// =============================================================
function DSGeo() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-8">
        <DSCard title="Donations by Province" subtitle="Indonesia · Last 30 days">
          <DSIndonesiaMap/>
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-4">
        <DSCard title="Top Provinces">
          <div className="space-y-1.5">
            {[
              { p:'DKI Jakarta', v: 412, pct: 28 },
              { p:'Jawa Barat',  v: 318, pct: 22 },
              { p:'Jawa Timur',  v: 240, pct: 16 },
              { p:'Banten',      v: 142, pct: 10 },
              { p:'Yogyakarta',  v: 98,  pct: 7 },
              { p:'Sumatera Utara', v: 82, pct: 5 },
              { p:'Bali',        v: 64,  pct: 4 },
              { p:'Sulawesi Selatan', v: 52, pct: 3.5 },
              { p:'Kalimantan Timur', v: 40, pct: 2.5 },
              { p:'Lainnya',     v: 28,  pct: 2 },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-32 truncate">{r.p}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-sm overflow-hidden">
                  <div className="h-full bg-[#1A73E8]" style={{ width: r.pct * 3 + '%' }}/>
                </div>
                <span className="w-8 text-right font-bold">{r.v}</span>
              </div>
            ))}
          </div>
        </DSCard>
      </div>
    </div>
  );
}

// =============================================================
// FUNNEL PAGE
// =============================================================
function DSFunnel() {
  const steps = [
    { l:'Sessions',          v: 184_290, c:'#1A73E8' },
    { l:'View Content',      v: 121_140, c:'#4285F4' },
    { l:'Initiate Checkout', v: 38_280,  c:'#0F9D58' },
    { l:'Add Payment Info',  v: 18_240,  c:'#F4B400' },
    { l:'Lead (form submit)',v: 13_072,  c:'#FB8C00' },
    { l:'Complete Donation', v: 4_558,   c:'#EA4335' },
  ];
  const max = steps[0].v;
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-8">
        <DSCard title="Conversion Funnel" subtitle="Last 30 days · all sources">
          <div className="space-y-3 py-2">
            {steps.map((s, i) => {
              const w = (s.v / max) * 100;
              const drop = i > 0 ? (1 - s.v / steps[i-1].v) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-ink">{i+1}. {s.l}</span>
                    <span className="text-mute">{fmtNum(s.v)} · {((s.v/max)*100).toFixed(1)}% of top</span>
                  </div>
                  <div className="h-9 bg-slate-100 rounded overflow-hidden relative">
                    <div className="h-full rounded flex items-center justify-end px-3 text-white text-xs font-extrabold" style={{ width: w + '%', background: s.c }}>
                      {fmtNum(s.v)}
                    </div>
                  </div>
                  {i > 0 && (
                    <div className="mt-1 text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                      <Icon name="arrowDown" size={10}/> Drop-off {drop.toFixed(1)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-4 space-y-4">
        <DSCard title="Funnel by Source">
          <div className="space-y-2 text-xs">
            {window.NB.trafficSources.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between">
                  <span className="font-bold text-ink">{s.name}</span>
                  <span className="text-mute">{(s.donations/s.visits*100).toFixed(2)}%</span>
                </div>
                <div className="mt-1 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                  <div className="h-full" style={{ width: Math.min(100, (s.donations/s.visits*100)*30) + '%', background: s.color }}/>
                </div>
              </div>
            ))}
          </div>
        </DSCard>
        <DSCard title="Recommendations">
          <ul className="space-y-2 text-xs text-ink/85">
            <li className="flex gap-2"><Icon name="sparkle" size={12} className="text-amber-500 mt-0.5"/><span>Drop-off terbesar di <b>Initiate Checkout → Add Payment</b> (52%). Cek loading speed gateway.</span></li>
            <li className="flex gap-2"><Icon name="sparkle" size={12} className="text-amber-500 mt-0.5"/><span><b>TikTok funnel</b> punya VTR tinggi tapi CVR rendah — tambah retargeting via Meta.</span></li>
            <li className="flex gap-2"><Icon name="sparkle" size={12} className="text-amber-500 mt-0.5"/><span>Mobile sessions 66% tapi konversi 48% — uji A/B form mobile.</span></li>
          </ul>
        </DSCard>
      </div>
    </div>
  );
}

// =============================================================
// Reusable chart components
// =============================================================
function DSStackedSeries({ daily }) {
  const w = 600, h = 200;
  const max = Math.max(...daily) * 1.2;
  const step = w / (daily.length - 1);
  const series = [
    daily,
    daily.map(v => v * 0.45),
    daily.map(v => v * 0.25),
  ];
  const colors = ['#1A73E8', '#0F9D58', '#F4B400'];
  const paths = series.map((s) => s.map((v, i) => `${i ? 'L' : 'M'} ${i*step} ${h - (v/max)*(h-20) - 5}`).join(' '));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 220 }}>
      <defs>
        {colors.map((c, i) => (
          <linearGradient key={i} id={`dsg${i}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.15"/>
            <stop offset="100%" stopColor={c} stopOpacity="0"/>
          </linearGradient>
        ))}
      </defs>
      {[0,1,2,3].map(i => <line key={i} x1="0" x2={w} y1={5 + i*(h-20)/3} y2={5 + i*(h-20)/3} stroke="#DADCE0" strokeDasharray="2 3"/>)}
      {paths.map((d, i) => (
        <g key={i}>
          <path d={d + ` L ${w} ${h} L 0 ${h} Z`} fill={`url(#dsg${i})`}/>
          <path d={d} fill="none" stroke={colors[i]} strokeWidth="2" strokeLinejoin="round"/>
        </g>
      ))}
    </svg>
  );
}

function DSLegend({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-mute">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: it.c }}/>{it.l}</div>
      ))}
    </div>
  );
}

function DSHeatmap() {
  const days = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  // synthetic intensity
  const cell = (d, h) => {
    const peakHour = Math.exp(-Math.pow((h - 20) / 4, 2));
    const dayFactor = d === 4 || d === 5 ? 1.2 : 1;
    const noise = ((d * 31 + h * 17) % 20) / 60;
    return Math.min(1, peakHour * dayFactor + noise);
  };
  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="flex pl-8 gap-0.5 text-[9px] text-mute mb-1">
          {hours.map((h) => <div key={h} className="w-5 text-center">{h}</div>)}
        </div>
        {days.map((d, di) => (
          <div key={d} className="flex items-center gap-0.5 mb-0.5">
            <div className="w-8 text-[10px] font-bold text-mute">{d}</div>
            {hours.map((h) => {
              const v = cell(di, h);
              return <div key={h} className="w-5 h-5 rounded-sm" style={{ background: `rgba(26,115,232,${0.06 + v*0.85})` }} title={`${d} ${h}:00 · intensitas ${Math.round(v*100)}%`}/>;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DSIndonesiaMap() {
  // Stylized province cells with intensity
  const provinces = [
    { n:'JKT', x:42, y:62, v:0.95, l:'DKI Jakarta' },
    { n:'JBR', x:36, y:67, v:0.85, l:'Jawa Barat' },
    { n:'JTG', x:46, y:65, v:0.55, l:'Jawa Tengah' },
    { n:'YGY', x:46, y:71, v:0.4, l:'Yogyakarta' },
    { n:'JTM', x:55, y:67, v:0.75, l:'Jawa Timur' },
    { n:'BTN', x:34, y:64, v:0.5, l:'Banten' },
    { n:'BAL', x:62, y:73, v:0.4, l:'Bali' },
    { n:'NTB', x:68, y:75, v:0.25, l:'NTB' },
    { n:'NTT', x:78, y:76, v:0.3, l:'NTT' },
    { n:'SUM',x:13, y:30, v:0.35, l:'Sumatera Utara' },
    { n:'SUS',x:21, y:48, v:0.3,  l:'Sumatera Selatan' },
    { n:'ACH',x:6,  y:18, v:0.18, l:'Aceh' },
    { n:'RIA',x:18, y:36, v:0.22, l:'Riau' },
    { n:'KLB',x:50, y:36, v:0.18, l:'Kalimantan Barat' },
    { n:'KLT',x:60, y:42, v:0.25, l:'Kalimantan Timur' },
    { n:'KLS',x:60, y:55, v:0.2,  l:'Kalimantan Selatan' },
    { n:'SLU',x:73, y:38, v:0.18, l:'Sulawesi Utara' },
    { n:'SLS',x:72, y:55, v:0.28, l:'Sulawesi Selatan' },
    { n:'PAP',x:92, y:55, v:0.12, l:'Papua' },
    { n:'MAL',x:84, y:46, v:0.1,  l:'Maluku' },
  ];
  return (
    <div className="relative w-full bg-bg2 rounded-md overflow-hidden" style={{ aspectRatio: '2 / 1' }}>
      {/* Background ocean */}
      <div className="absolute inset-0 bg-[#E8F0FE]"/>
      {/* faint land outline */}
      <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <path d="M 5 22 Q 9 14 18 16 L 25 22 L 30 18 L 38 24 L 45 22 L 52 28 L 60 22 L 68 26 L 75 22 L 82 28 L 92 24" stroke="#B8C7E0" strokeWidth="0.5" fill="none" strokeDasharray="0.5 0.5"/>
      </svg>
      {provinces.map((p, i) => (
        <div key={i}
          className="absolute group cursor-pointer"
          style={{ left: p.x + '%', top: p.y + '%', transform: 'translate(-50%, -50%)' }}>
          <div className="rounded-full transition-all group-hover:scale-110 shadow"
            style={{
              width: 16 + p.v * 22,
              height: 16 + p.v * 22,
              background: `rgba(26,115,232,${0.4 + p.v*0.55})`,
              boxShadow: `0 0 0 2px rgba(26,115,232,${p.v*0.2})`
            }}>
          </div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#1A73E8] whitespace-nowrap pointer-events-none">{p.n}</div>
          <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-ink text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-opacity">
            {p.l} · {Math.round(p.v * 412)} donasi
          </div>
        </div>
      ))}

      {/* legend */}
      <div className="absolute bottom-2 right-2 bg-white border border-line rounded px-2 py-1 text-[10px] flex items-center gap-1.5">
        <span className="text-mute">Donations:</span>
        <span className="h-2 w-2 rounded-full bg-[#1A73E8]/30"/>
        <span className="h-2.5 w-2.5 rounded-full bg-[#1A73E8]/60"/>
        <span className="h-3 w-3 rounded-full bg-[#1A73E8]"/>
      </div>
    </div>
  );
}

window.DataStudioView = DataStudioView;

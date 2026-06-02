function AdvertiserView() {
  const { trafficSources, campaignSeed, dailyDonations } = window.NB;
  const [costInputs, setCostInputs] = useStateA({ meta: 92_400_000, google: 58_300_000, tiktok: 41_800_000 });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard Advertiser"
        subtitle="Pantau performa iklan, UTM, pixel & rekomendasi optimasi."
        actions={<>
          <Select value="meta" onChange={()=>{}} icon="filter" options={[
            {value:'all', label:'Semua platform'},
            {value:'meta', label:'Meta Ads'},
            {value:'google', label:'Google Ads'},
            {value:'tiktok', label:'TikTok Ads'},
          ]}/>
          <DateRangePill/>
          <Btn variant="outline" tone="ink" icon="download">Export</Btn>
        </>}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="eye"    label="Visitor Iklan" value={fmtNum(102220)} delta="+22.4%" accent="brand"/>
        <StatCard icon="target" label="Lead Tertangkap" value={fmtNum(11662)} delta="+18%" accent="sky"/>
        <StatCard icon="heart"  label="Donasi via Ads" value={fmtNum(3946)} delta="+9.8%" accent="ok"/>
        <StatCard icon="sparkle" label="ROAS Gabungan" value="3.8x" delta="+0.3x" accent="warn"/>
      </div>

      {/* Per-platform performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {trafficSources.filter(t => t.name !== 'Organic').map((t) => {
          const cpd = Math.round(t.spend / Math.max(1,t.donations));
          const rev = t.donations * 285_000;
          const roas = (rev / Math.max(1, t.spend)).toFixed(1);
          return (
            <Card key={t.name} className="p-5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: t.color }}>
                  {t.name === 'Meta Ads' ? 'M' : t.name === 'TikTok Ads' ? 'TT' : 'G'}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-ink">{t.name}</div>
                  <div className="text-xs text-mute">last 30 days</div>
                </div>
                <Badge tone="ok" dot>active</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-mute text-xs">Visits</div><div className="font-bold text-ink">{fmtNum(t.visits)}</div></div>
                <div><div className="text-mute text-xs">Leads</div><div className="font-bold text-ink">{fmtNum(t.leads)}</div></div>
                <div><div className="text-mute text-xs">Donasi</div><div className="font-bold text-ink">{fmtNum(t.donations)}</div></div>
                <div><div className="text-mute text-xs">CVR</div><div className="font-bold text-ink">{(t.donations/t.leads*100).toFixed(1)}%</div></div>
                <div><div className="text-mute text-xs">Spend</div><div className="font-bold text-ink">{fmtIDRShort(t.spend)}</div></div>
                <div><div className="text-mute text-xs">CPD</div><div className="font-bold text-ink">{fmtIDRShort(cpd)}</div></div>
              </div>
              <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                <div className="text-xs text-mute">ROAS</div>
                <div className={'font-bold text-lg ' + (roas >= 3 ? 'text-emerald-600' : 'text-amber-600')}>{roas}x</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Cost tracking + recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="font-bold text-ink mb-3">Performance Campaign · 30 hari</div>
          <LineChart data={dailyDonations} height={240} color="#7C3AED" secondary="#38B6FF"/>
        </Card>

        <Card className="p-5 space-y-4">
          <div>
            <div className="font-bold text-ink">Cost Tracking (Manual Input)</div>
            <div className="text-xs text-mute mt-0.5">Input total spend ads dari masing-masing platform.</div>
          </div>
          {[
            { k:'meta',   label:'Meta Ads',   color:'#1877F2' },
            { k:'google', label:'Google Ads', color:'#34A853' },
            { k:'tiktok', label:'TikTok Ads', color:'#000' },
          ].map((p) => (
            <div key={p.k}>
              <label className="text-xs font-semibold text-mute flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }}/> {p.label}
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-line bg-white focus-within:border-brand-600">
                <span className="pl-3 text-mute">Rp</span>
                <input type="number" value={costInputs[p.k]} onChange={(e) => setCostInputs({ ...costInputs, [p.k]: +e.target.value })} className="flex-1 px-2 py-2 outline-none font-semibold text-ink"/>
              </div>
            </div>
          ))}
          <Btn className="w-full" size="md">Simpan & Hitung ROAS</Btn>
        </Card>
      </div>

      {/* UTM + Pixel snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-ink">Status Pixel</div>
            <Btn size="sm" variant="ghost" tone="ink" iconRight="arrowR">Settings</Btn>
          </div>
          <div className="space-y-2">
            {[
              { n:'Meta Pixel · CAPI', s:'Active', tone:'ok' },
              { n:'Google Tag Manager', s:'Active', tone:'ok' },
              { n:'GA4', s:'Active', tone:'ok' },
              { n:'Google Ads Conversion', s:'Not Connected', tone:'slate' },
              { n:'TikTok Pixel', s:'Error', tone:'bad' },
            ].map((p) => (
              <div key={p.n} className="flex items-center gap-3 p-2.5 rounded-lg border border-line">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${p.tone==='ok' ? 'bg-emerald-50 text-emerald-600' : p.tone==='bad' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}><Icon name="pixel" size={14}/></div>
                <div className="flex-1 font-semibold text-ink text-sm">{p.n}</div>
                <Badge tone={p.tone} dot={p.tone!=='slate'}>{p.s}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-ink">Conversion Events (24 jam)</div>
            <Badge tone="ok" dot>Real-time</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { n:'PageView', v:12340, color:'#2E4191' },
              { n:'ViewContent', v:8120, color:'#38B6FF' },
              { n:'InitiateCheckout', v:3420, color:'#F59E0B' },
              { n:'AddPaymentInfo', v:2104, color:'#DC2626' },
              { n:'Lead', v:1810, color:'#16A34A' },
              { n:'CompleteDonation', v:842, color:'#7C3AED' },
              { n:'Purchase', v:824, color:'#16A34A' },
            ].map((e) => (
              <div key={e.n} className="p-3 rounded-lg bg-bg2 border border-line">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{background:e.color}}/><div className="text-xs text-mute">{e.n}</div></div>
                <div className="mt-1 text-xl font-bold text-ink">{fmtNum(e.v)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-ink flex items-center gap-2"><Icon name="sparkle" size={18} className="text-brand-600"/> Rekomendasi Campaign</div>
          <Badge tone="brand">AI Insight</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { c: campaignSeed[1], reason:'CVR tertinggi 6.8% · gandakan budget 30%', tone:'ok' },
            { c: campaignSeed[0], reason:'CPL turun -22% minggu ini · scale ke TikTok', tone:'sky' },
            { c: campaignSeed[2], reason:'ROAS 4.2x · stable performer · pertahankan', tone:'brand' },
          ].map((r, i) => (
            <div key={i} className="rounded-xl border border-line p-4">
              <div className="h-24 rounded-lg mb-3" style={{ background: r.c.thumb }}>
                <div className="h-full flex items-center justify-center text-white/90"><Icon name={r.c.icon} size={28}/></div>
              </div>
              <div className="font-bold text-ink line-clamp-2 leading-tight">{r.c.title}</div>
              <div className="mt-2 text-xs text-ink/80">{r.reason}</div>
              <div className="mt-3 flex items-center justify-between">
                <Badge tone={r.tone}>Rekomendasi</Badge>
                <button className="text-xs font-semibold text-brand-600 hover:underline">Lihat detail →</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Landing page preview */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-ink">Landing Page Preview</div>
            <div className="text-xs text-mute">Halaman publik aktif yang menerima traffic iklan.</div>
          </div>
          <a href="public.html" target="_blank" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline">Buka tab baru <Icon name="arrowR" size={12}/></a>
        </div>
        <div className="rounded-xl overflow-hidden border border-line bg-bg2">
          <div className="h-8 px-3 flex items-center gap-1.5 border-b border-line bg-white">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400"/><span className="h-2.5 w-2.5 rounded-full bg-amber-400"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/>
            <div className="ml-2 flex-1 h-5 rounded-md bg-bg2 text-[10px] font-mono text-mute flex items-center px-2">niatbaik.org</div>
          </div>
          <iframe src="public.html" className="w-full h-[480px] block" title="Landing preview"/>
        </div>
      </Card>
    </div>
  );
}

window.AdvertiserView = AdvertiserView;

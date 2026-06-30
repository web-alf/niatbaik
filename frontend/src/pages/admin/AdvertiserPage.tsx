import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useDataStore } from '@/store/data';
import { fmtNum, fmtIDRShort } from '@/lib/format';
import { campaignBgStyle } from '@/lib/mappers';
import { Card, PageHeader, Select, DateRangePill, Btn, StatCard, Badge, LineChart, Icon } from '@/components';

export default function AdvertiserPage() {
  const analyticsTraffic = useDataStore((s) => s.analyticsTraffic);
  const trafficSourcesRaw = useDataStore((s) => s.trafficSources);
  const trafficSources = analyticsTraffic || trafficSourcesRaw || [];
  const dailyDonations = useDataStore((s) => s.dailyDonations) || [];
  const campaigns = useDataStore((s) => s.campaigns) || [];
  const ov = useDataStore((s) => s.analyticsOverview) || {};
  const [costInputs, setCostInputs] = useState<any>({ meta: 0, google: 0, tiktok: 0 });
  // Per-platform pixel/connection status from the backend (config + last dispatch log),
  // replacing the hardcoded "Active/Error" mock badges. Empty until fetched.
  const [trackingStatus, setTrackingStatus] = useState<any>(null);
  useEffect(() => {
    if (!api?.trackingStatus) return;
    api.trackingStatus()
      .then((res: any) => setTrackingStatus(res?.data?.platforms || []))
      .catch(() => setTrackingStatus([]));
  }, []);

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
        <StatCard icon="eye"    label="Visitor Iklan" value={fmtNum(ov.total_visitors || 0)} delta={ov.visitors_delta || ''} accent="brand"/>
        <StatCard icon="target" label="Lead Tertangkap" value={fmtNum(ov.total_leads || 0)} delta={ov.leads_delta || ''} accent="sky"/>
        <StatCard icon="heart"  label="Donasi via Ads" value={fmtNum(ov.total_donations || 0)} delta={ov.donations_delta || ''} accent="ok"/>
        <StatCard icon="sparkle" label="ROAS Gabungan" value={ov.roas ? ov.roas + 'x' : '—'} delta={ov.roas_delta || ''} accent="warn"/>
      </div>

      {/* Per-platform performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {trafficSources.filter((t: any) => t.name !== 'Organic').map((t: any) => {
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
                <div className={'font-bold text-lg ' + ((roas as any) >= 3 ? 'text-emerald-600' : 'text-amber-600')}>{roas}x</div>
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
                <input type="number" value={costInputs[p.k]} onChange={(e: any) => setCostInputs({ ...costInputs, [p.k]: +e.target.value })} className="flex-1 px-2 py-2 outline-none font-semibold text-ink"/>
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
            {(trackingStatus || []).length === 0 && (
              <div className="text-xs text-mute p-3">Memuat status pixel…</div>
            )}
            {(trackingStatus || []).map((p: any) => {
              const tone = p.status === 'active' ? 'ok' : p.status === 'error' ? 'bad' : p.status === 'configured' ? 'warn' : 'slate';
              const label = p.status === 'active' ? 'Active' : p.status === 'error' ? 'Error' : p.status === 'configured' ? 'Configured' : 'Not Connected';
              const nameMap: any = { meta: 'Meta Pixel · CAPI', google: 'Google Ads · GA4', tiktok: 'TikTok Pixel · EAPI' };
              return (
                <div key={p.platform} className="flex items-center gap-3 p-2.5 rounded-lg border border-line">
                  <div className={`h-8 w-8 rounded-md flex items-center justify-center ${tone==='ok' ? 'bg-emerald-50 text-emerald-600' : tone==='bad' ? 'bg-rose-50 text-rose-600' : tone==='warn' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}><Icon name="pixel" size={14}/></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink text-sm">{nameMap[p.platform] || p.platform}</div>
                    {p.status === 'error' && p.last_event && p.last_event.error && (
                      <div className="text-[10px] text-rose-600 truncate" title={p.last_event.error}>
                        HTTP {p.last_event.http_status || '?'} · {String(p.last_event.error).slice(0, 60)}
                      </div>
                    )}
                  </div>
                  <Badge tone={tone} dot={p.status !== 'not_connected'}>{label}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-ink">Conversion Events (24 jam)</div>
            <Badge tone="ok" dot>Server-side</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(trackingStatus || []).map((p: any) => {
              const colorMap: any = { meta: '#1877F2', google: '#34A853', tiktok: '#000000' };
              return (
                <div key={p.platform} className="p-3 rounded-lg bg-bg2 border border-line">
                  <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{background: colorMap[p.platform] || '#94A3B8'}}/><div className="text-xs text-mute capitalize">{p.platform}</div></div>
                  <div className="mt-1 text-xl font-bold text-ink">{fmtNum(p.recent_count_24h || 0)}</div>
                </div>
              );
            })}
            {(trackingStatus || []).length === 0 && (
              <div className="col-span-2 text-xs text-mute p-3 text-center">Belum ada event conversion tercatat.</div>
            )}
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
            { c: campaigns[0], reason:'Campaign teratas · pertahankan performa', tone:'ok' },
            { c: campaigns[1], reason:'Campaign kedua · evaluasi optimasi', tone:'sky' },
            { c: campaigns[2], reason:'Campaign aktif · monitor ROAS', tone:'brand' },
          ].map((r, i) => (
            <div key={i} className="rounded-xl border border-line p-4">
              <div className="h-24 rounded-lg mb-3 overflow-hidden bg-bg2" style={campaignBgStyle ? campaignBgStyle(r.c) : { background: r.c.thumb }}>
                {!(r.c && r.c.img) && <div className="h-full flex items-center justify-center text-white/90"><Icon name={r.c.icon} size={28}/></div>}
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
          <iframe src="public.html" className="w-full h-[60vh] sm:h-[480px] block" title="Landing preview"/>
        </div>
      </Card>
    </div>
  );
}

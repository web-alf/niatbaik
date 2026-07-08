import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useDataStore } from '@/store/data';
import { useUiStore } from '@/store/ui';
import { fmtNum, fmtIDRShort } from '@/lib/format';
import { campaignBgStyle } from '@/lib/mappers';
import { exportCSV, exportExcel } from '@/lib/export';
import { Card, PageHeader, Select, DateRangePill, Btn, StatCard, Badge, LineChart, Icon } from '@/components';

// utm_source values that map to each ad platform (used for the platform filter).
const PLATFORM_SOURCES: Record<string, string[]> = {
  meta: ['facebook', 'instagram', 'meta'],
  google: ['google'],
  tiktok: ['tiktok'],
};

export default function AdvertiserPage() {
  const showToast = useUiStore((s) => s.showToast);
  const analyticsTraffic = useDataStore((s) => s.analyticsTraffic);
  const trafficSourcesRaw = useDataStore((s) => s.trafficSources);
  const allTraffic = (analyticsTraffic || trafficSourcesRaw || []) as any[];
  const dailyDonations = useDataStore((s) => s.dailyDonations) || [];
  const campaigns = useDataStore((s) => s.campaigns) || [];
  const ov = useDataStore((s) => s.analyticsOverview) || {};
  const [platform, setPlatform] = useState('all');
  const [costInputs, setCostInputs] = useState<any>({ meta: 0, google: 0, tiktok: 0 });
  const [saving, setSaving] = useState(false);

  // Apply the platform filter to the per-source cards. 'all' shows every source.
  const trafficSources = platform === 'all'
    ? allTraffic
    : allTraffic.filter((t: any) => PLATFORM_SOURCES[platform]?.includes((t.source || t.name || '').toLowerCase()));

  const saveAdCosts = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const entries = Object.entries(costInputs).filter(([, v]) => Number(v) > 0);
    if (!entries.length) { showToast('Isi minimal satu nominal spend'); return; }
    setSaving(true);
    try {
      for (const [plat, amount] of entries) {
        await api.createAdCost({ platform: plat, amount: Number(amount), date: today });
      }
      showToast('Ad spend tersimpan · ROAS akan terhitung ulang');
      await useDataStore.getState().refreshAnalytics();
    } catch (err: any) { showToast('Gagal menyimpan: ' + (err?.message || '')); }
    setSaving(false);
  };

  const exportCosts = (kind: 'csv' | 'xls' = 'csv') => {
    const rows = trafficSources.map((t: any) => ({
      source: t.name || t.source, visits: t.visits, leads: t.leads,
      donations: t.donations, spend: t.spend || 0, revenue: t.revenue || 0,
    }));
    if (!rows.length) { showToast('Tidak ada data'); return; }
    if (kind === 'csv') exportCSV(rows, 'niatbaik_advertiser');
    else exportExcel(rows, 'niatbaik_advertiser', undefined, 'Advertiser');
    showToast(rows.length + ' baris diekspor');
  };
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
          <Select value={platform} onChange={setPlatform} icon="filter" options={[
            {value:'all', label:'Semua platform'},
            {value:'meta', label:'Meta Ads'},
            {value:'google', label:'Google Ads'},
            {value:'tiktok', label:'TikTok Ads'},
          ]}/>
          <DateRangePill/>
          <Btn variant="outline" tone="ink" icon="download" onClick={() => exportCosts('csv')}>CSV</Btn>
          <Btn tone="ink" icon="download" onClick={() => exportCosts('xls')}>Excel</Btn>
        </>}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="eye"    label="Visitor Iklan" value={fmtNum(ov.total_visitors || 0)} sub="estimasi (leads ×3)" accent="brand"/>
        <StatCard icon="target" label="Lead Tertangkap" value={fmtNum(ov.total_leads || 0)} accent="sky"/>
        <StatCard icon="heart"  label="Donasi via Ads" value={fmtNum(ov.total_transactions || 0)} accent="ok"/>
        <StatCard icon="sparkle" label="ROAS Gabungan" value={ov.roas ? ov.roas.toFixed(1) + 'x' : '—'} accent="warn"/>
      </div>

      {/* Per-platform performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {trafficSources.length === 0 && (
          <Card className="p-5 text-sm text-mute lg:col-span-3 text-center">Belum ada data sumber traffic berbayar.</Card>
        )}
        {trafficSources.filter((t: any) => (t.source || t.name || '').toLowerCase() !== 'organic').map((t: any) => {
          const src = (t.source || t.name || '').toLowerCase();
          const dispName = src === 'facebook' || src === 'meta' ? 'Meta Ads' : src === 'instagram' ? 'Instagram Ads' : src === 'tiktok' ? 'TikTok Ads' : src === 'google' ? 'Google Ads' : (t.name || t.source);
          const initial = src.startsWith('t') ? 'TT' : src.startsWith('g') ? 'G' : src.startsWith('i') ? 'IG' : 'M';
          const visits = t.visits || 0, leads = t.leads || 0, donations = t.donations || 0;
          const revenue = t.revenue || 0;
          // Spend isn't part of traffic data; pull from the manual cost input if entered.
          const platKey = (src === 'facebook' || src === 'instagram' || src === 'meta') ? 'meta' : src === 'google' ? 'google' : src === 'tiktok' ? 'tiktok' : null;
          const spend = platKey ? Number(costInputs[platKey] || 0) : 0;
          const cvr = leads > 0 ? (donations / leads * 100).toFixed(1) + '%' : '—';
          const cpd = spend > 0 && donations > 0 ? Math.round(spend / donations) : 0;
          const roas = spend > 0 ? (revenue / spend) : 0;
          return (
            <Card key={t.source || t.name} className="p-5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: t.color || '#2E4191' }}>
                  {initial}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-ink">{dispName}</div>
                  <div className="text-xs text-mute">total tercatat</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-mute text-xs">Visits</div><div className="font-bold text-ink">{fmtNum(visits)}</div></div>
                <div><div className="text-mute text-xs">Leads</div><div className="font-bold text-ink">{fmtNum(leads)}</div></div>
                <div><div className="text-mute text-xs">Donasi</div><div className="font-bold text-ink">{fmtNum(donations)}</div></div>
                <div><div className="text-mute text-xs">CVR</div><div className="font-bold text-ink">{cvr}</div></div>
                <div><div className="text-mute text-xs">Revenue</div><div className="font-bold text-ink">{fmtIDRShort(revenue)}</div></div>
                <div><div className="text-mute text-xs">CPD</div><div className="font-bold text-ink">{cpd ? fmtIDRShort(cpd) : '—'}</div></div>
              </div>
              <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                <div className="text-xs text-mute">ROAS {spend > 0 ? '' : '(isi spend)'}</div>
                <div className={'font-bold text-lg ' + (roas >= 3 ? 'text-emerald-600' : roas >= 1 ? 'text-amber-600' : 'text-mute')}>{roas > 0 ? roas.toFixed(1) + 'x' : '—'}</div>
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
          <Btn className="w-full" size="md" onClick={saveAdCosts} loading={saving}>Simpan & Hitung ROAS</Btn>
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

      {/* Top campaigns — ranked by real funds raised (was 3 canned "AI Insight" strings
          mapped onto whatever campaigns[0..2] happened to be, in no meaningful order). */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-ink flex items-center gap-2"><Icon name="sparkle" size={18} className="text-brand-600"/> Campaign Berperforma Teratas</div>
          <Badge tone="brand">by Donasi</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {campaigns.length === 0 && (
            <div className="md:col-span-3 text-sm text-mute text-center py-6">Belum ada campaign untuk dianalisa.</div>
          )}
          {[...campaigns]
            .sort((a: any, b: any) => (b.raised || 0) - (a.raised || 0))
            .slice(0, 3)
            .map((c: any, i: number) => {
              const pct = c.target ? Math.min(100, Math.round(((c.raised || 0) / c.target) * 100)) : 0;
              const rank = ['Teratas', 'Kedua', 'Ketiga'][i];
              return (
            <div key={c.id || i} className="rounded-xl border border-line p-4">
              <div className="h-24 rounded-lg mb-3 overflow-hidden bg-bg2" style={campaignBgStyle ? campaignBgStyle(c) : { background: c.thumb }}>
                {!(c && c.img) && <div className="h-full flex items-center justify-center text-white/90"><Icon name={c.icon || 'heart'} size={28}/></div>}
              </div>
              <div className="font-bold text-ink line-clamp-2 leading-tight">{c.title}</div>
              <div className="mt-2 text-xs text-ink/80">{fmtIDRShort(c.raised || 0)} terkumpul · {pct}% target</div>
              <div className="mt-3 flex items-center justify-between">
                <Badge tone={i === 0 ? 'ok' : i === 1 ? 'sky' : 'brand'}>#{i + 1} {rank}</Badge>
                <a href={`/c/${c.slug}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-600 hover:underline">Lihat detail →</a>
              </div>
            </div>
              );
            })}
        </div>
      </Card>

      {/* Landing page preview */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-ink">Landing Page Preview</div>
            <div className="text-xs text-mute">Halaman publik aktif yang menerima traffic iklan.</div>
          </div>
          <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline">Buka tab baru <Icon name="arrowR" size={12}/></a>
        </div>
        <div className="rounded-xl overflow-hidden border border-line bg-bg2">
          <div className="h-8 px-3 flex items-center gap-1.5 border-b border-line bg-white">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400"/><span className="h-2.5 w-2.5 rounded-full bg-amber-400"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/>
            <div className="ml-2 flex-1 h-5 rounded-md bg-bg2 text-[10px] font-mono text-mute flex items-center px-2">niatbaik.org</div>
          </div>
          <iframe src="/" className="w-full h-[60vh] sm:h-[480px] block" title="Landing preview"/>
        </div>
      </Card>
    </div>
  );
}

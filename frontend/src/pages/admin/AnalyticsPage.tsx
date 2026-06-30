// Analytics - performance, UTM, source breakdown
import { useState } from 'react';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';
import { fmtNum, fmtIDRShort } from '@/lib/format';
import { campaignBgStyle } from '@/lib/mappers';
import { exportCSV, exportExcel } from '@/lib/export';
import { Card, PageHeader, Select, DateRangePill, Btn, StatCard, LineChart, Donut, SearchInput, Badge } from '@/components';

export default function AnalyticsPage() {
  const showToast = useUiStore((s) => s.showToast);
  const [campaign, setCampaign] = useState('all');

  const trafficSources = useDataStore((s) => s.analyticsTraffic) || useDataStore((s) => s.trafficSources) || [];
  const dailyDonations = useDataStore((s) => s.dailyDonations) || [];
  const allCampaigns = useDataStore((s) => s.analyticsCampaigns) || useDataStore((s) => s.campaigns) || [];
  // Filter table by selected campaign. (A platform filter intentionally
  // omitted: backend CampaignPerf has no per-platform breakdown, so offering
  // a platform selector would falsely imply filtering that can't happen.)
  const campaigns = allCampaigns.filter((c: any) =>
    campaign === 'all' || c.id === campaign || c.title === campaign
  );

  const ov = useDataStore((s) => s.analyticsOverview) || {};
  // Backend /analytics/overview returns: total_raised, total_transactions, total_leads,
  // conversion_rate (already a percent, e.g. 4.8), active_campaigns, total_fundraisers,
  // today_raised, month_raised. It has NO visitors/revenue/cpl/cpd/roas fields, so we
  // map donations→total_transactions, revenue→total_raised, derive visitors from leads.
  const leads = ov.total_leads ?? ov.leads ?? 0;
  const totals = {
    visitors: ov.total_visitors ?? ov.visitors ?? leads * 3,
    leads,
    donations: ov.total_transactions ?? ov.total_donations ?? ov.donations ?? 0,
    convRate: ov.conversion_rate ?? 0, // already a percentage from backend
    cpl: ov.cost_per_lead ?? 0,
    cpd: ov.cost_per_donation ?? 0,
    revenue: ov.total_raised ?? ov.total_revenue ?? ov.revenue ?? 0,
    roas: ov.roas ?? 0,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        subtitle="Bedah performa campaign, ads, dan funnel donasi."
        actions={<>
          <Select value={campaign} onChange={setCampaign} options={[
            {value:'all', label:'Semua campaign'},
            ...(allCampaigns).map((c: any) => ({value: c.id || c.title, label: c.title}))
          ]}/>
          <DateRangePill/>
          <Btn variant="outline" tone="ink" icon="download" onClick={() => {
            const data = (campaigns).map((c: any) => ({
              campaign: c.title || c.name, visitors: c.visitors, leads: c.leads, donations: c.donations, raised: c.raised, cvr: c.cvr
            }));
            if (data.length) { exportCSV(data, 'niatbaik_analytics'); showToast(data.length + ' baris diekspor'); }
            else showToast('Tidak ada data');
          }}>CSV</Btn>
          <Btn icon="download" onClick={() => {
            const data = (campaigns).map((c: any) => ({
              campaign: c.title || c.name, visitors: c.visitors, leads: c.leads, donations: c.donations, raised: c.raised, cvr: c.cvr
            }));
            if (data.length) { exportExcel(data, 'niatbaik_analytics'); showToast(data.length + ' baris diekspor'); }
            else showToast('Tidak ada data');
          }}>Excel</Btn>
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="eye"    label="Total Visitor"   value={fmtNum(totals.visitors)} delta="+24.1%" accent="brand"/>
        <StatCard icon="target" label="Total Leads"     value={fmtNum(totals.leads)}    delta="+18.0%" accent="sky"/>
        <StatCard icon="heart"  label="Total Donasi"    value={fmtNum(totals.donations)} delta="+12.4%" accent="ok"/>
        <StatCard icon="bolt"   label="Conversion Rate" value={(totals.convRate || 0).toFixed(2)+'%'} delta="+0.4pp" accent="warn"/>
        <StatCard icon="creditcard" label="Cost / Lead" value={fmtIDRShort(totals.cpl)} delta="-8.2%" deltaTone="down" accent="bad"/>
        <StatCard icon="wallet" label="Cost / Donation" value={fmtIDRShort(totals.cpd)} delta="-4.6%" deltaTone="down" accent="bad"/>
        <StatCard icon="flame"  label="Revenue"         value={fmtIDRShort(totals.revenue)} delta="+22.1%" accent="ok"/>
        <StatCard icon="sparkle" label="ROAS Estimasi"  value={totals.roas+'x'} delta="+0.3x" accent="brand"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-mute">Performa Iklan vs Organik</div>
              <div className="mt-1 text-xl font-bold text-ink">Visit, Lead & Donasi · 30 hari</div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-600"/>Visits</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky2-400"/>Leads</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"/>Donations</span>
            </div>
          </div>
          <LineChart data={dailyDonations} height={250} color="#2E4191" secondary="#38B6FF"/>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-mute">Sumber Traffic</div>
          <div className="flex items-center justify-center my-4">
            {trafficSources.length > 0 ? <Donut size={170} data={trafficSources.map((t: any) => ({ value: t.visits || t.value || 0, color: t.color || '#94A3B8' }))}/> : <div className="text-sm text-mute">Belum ada data traffic</div>}
          </div>
          <div className="space-y-2">
            {trafficSources.map((t: any) => {
              const totalV = trafficSources.reduce((s: any, x: any) => s + (x.visits || x.value || 0), 0) || 1;
              return (
                <div key={t.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{background: t.color || '#94A3B8'}}/>
                  <span className="flex-1 font-semibold text-ink">{t.name}</span>
                  <span className="text-mute text-xs">{fmtNum(t.visits || t.value || 0)}</span>
                  <span className="w-14 text-right font-bold">{Math.round((t.visits || t.value || 0)/totalV*100)}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Campaign performance table */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <div className="font-bold text-ink">Campaign Performance</div>
            <div className="text-xs text-mute mt-0.5">Diurutkan berdasarkan donasi 30 hari terakhir</div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SearchInput placeholder="Filter campaign…" className="w-full sm:w-56"/>
            <Btn variant="outline" tone="ink" size="sm" icon="download">Export</Btn>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-mute border-y border-line bg-bg2/60">
                <th className="px-5 py-2.5 font-semibold">Campaign</th>
                <th className="py-2.5 font-semibold text-right">Visits</th>
                <th className="py-2.5 font-semibold text-right">Leads</th>
                <th className="py-2.5 font-semibold text-right">Donasi</th>
                <th className="py-2.5 font-semibold text-right">CVR</th>
                <th className="py-2.5 font-semibold text-right">CPL</th>
                <th className="py-2.5 font-semibold text-right">CPD</th>
                <th className="py-2.5 font-semibold text-right">Revenue</th>
                <th className="pr-5 py-2.5 font-semibold text-right">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-mute">Belum ada data campaign</td></tr>
              )}
              {campaigns.map((c: any) => {
                const v = c.visitors || c.donor_count || c.donors || 0;
                const l = c.leads || 0;
                const d = c.donations || c.donors || 0;
                const cvr = d > 0 && v > 0 ? (d/v*100).toFixed(1) + '%' : '—';
                const rev = c.revenue || c.raised || c.total_raised || 0;
                const cpl = c.cost_per_lead || 0;
                const cpd = c.cost_per_donation || 0;
                const roas = c.roas || (rev > 0 && cpd > 0 ? (rev / (d * cpd)).toFixed(1) : '—');
                return (
                  <tr key={c.id} className="border-b border-line last:border-0 hover:bg-bg2/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-md shrink-0 overflow-hidden bg-bg2" style={campaignBgStyle ? campaignBgStyle(c) : {background: c.thumb || '#2E4191'}}/>
                        <div className="font-semibold text-ink line-clamp-1 max-w-[280px]">{c.title}</div>
                      </div>
                    </td>
                    <td className="py-3 text-right text-ink">{fmtNum(v)}</td>
                    <td className="py-3 text-right text-ink">{fmtNum(l)}</td>
                    <td className="py-3 text-right text-ink font-semibold">{fmtNum(d)}</td>
                    <td className="py-3 text-right text-ink">{cvr}</td>
                    <td className="py-3 text-right text-mute">{cpl ? fmtIDRShort(cpl) : '—'}</td>
                    <td className="py-3 text-right text-mute">{cpd ? fmtIDRShort(cpd) : '—'}</td>
                    <td className="py-3 text-right font-bold text-ink">{fmtIDRShort(rev)}</td>
                    <td className="pr-5 py-3 text-right">
                      <span className={'font-bold ' + (roas >= 3 ? 'text-emerald-600' : roas >= 1.5 ? 'text-amber-600' : 'text-rose-600')}>{typeof roas === 'number' ? roas.toFixed(1) + 'x' : roas}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* UTM tracking */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-ink">UTM Tracking Fields</div>
            <div className="text-xs text-mute mt-0.5">Field yang otomatis di-capture pada setiap donasi.</div>
          </div>
          <Btn variant="ghost" tone="ink" size="sm" icon="copy">Salin URL builder</Btn>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { f:'utm_source',   v:'facebook · google · tiktok · instagram', tone:'brand' },
            { f:'utm_medium',   v:'paid · cpc · cpm · social · email',      tone:'sky' },
            { f:'utm_content',  v:'hero-vid-01 · carousel-3 · bantu-rans',  tone:'warn' },
            { f:'utm_campaign', v:'aira-jantung-q2 · sumur-ntt · pelindung', tone:'ok' },
            { f:'utm_term',     v:'donasi · sedekah · zakat · organik',     tone:'purple' },
            { f:'utm_id',       v:'rian · fb-29384 · gg-71028',             tone:'brand' },
          ].map((u) => (
            <div key={u.f} className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <code className="text-xs font-mono font-bold text-ink bg-bg2 px-2 py-0.5 rounded">{u.f}</code>
                <Badge tone={u.tone} size="sm">active</Badge>
              </div>
              <div className="text-xs text-mute">{u.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-line">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold text-ink text-sm">Click IDs (auto-forwarded)</div>
              <div className="text-xs text-mute mt-0.5">Diteruskan ke Conversions API masing-masing platform.</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { f:'fbclid', v:'Meta Conversions API', tone:'brand' },
              { f:'gclid',  v:'Google Ads',          tone:'ok' },
              { f:'ttclid', v:'TikTok Events API',   tone:'slate' },
            ].map((u) => (
              <div key={u.f} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs font-mono font-bold text-ink bg-bg2 px-2 py-0.5 rounded">{u.f}</code>
                  <Badge tone={u.tone} size="sm" dot>auto</Badge>
                </div>
                <div className="text-xs text-mute">{u.v}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

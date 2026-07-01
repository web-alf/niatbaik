import { useState, useEffect, useMemo } from 'react';
import { api, mediaUrl } from '@/lib/api';
import { fmtIDR, fmtIDRShort, fmtNum } from '@/lib/format';
import { getDateRange, fmtDate } from '@/lib/date';
import { exportCSV } from '@/lib/export';
import { useUiStore } from '@/store/ui';
import { useAdminSync } from '@/lib/useAdminSync';
import { Card, PageHeader, StatCard, Select, DateRangePill, Btn, Icon, Progress } from '@/components';

// Per-campaign earnings report with campaign + date-range filters. Backed by
// GET /dashboard/campaign-earnings?from=&to= (leads/donations/donors/revenue scoped to
// the window; total_raised is all-time for the progress bar).
export default function CampaignEarningsPage() {
  const showToast = useUiStore((s) => s.showToast);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [range, setRange] = useState<any>(getDateRange());

  const toISODate = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : '');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (range?.start) params.set('from', toISODate(range.start));
      if (range?.end) params.set('to', toISODate(range.end));
      const res = await api.campaignEarnings(params.toString());
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      setRows([]);
      showToast('Gagal memuat data campaign: ' + (e?.message || ''));
    }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [range]);
  useAdminSync(load);

  const filtered = useMemo(
    () => (campaignFilter === 'all' ? rows : rows.filter((r) => r.campaign_id === campaignFilter)),
    [rows, campaignFilter],
  );

  const totals = useMemo(() => filtered.reduce(
    (a, r) => ({
      revenue: a.revenue + (r.revenue || 0),
      donations: a.donations + (r.donations || 0),
      donors: a.donors + (r.donors || 0),
      leads: a.leads + (r.leads || 0),
    }),
    { revenue: 0, donations: 0, donors: 0, leads: 0 },
  ), [filtered]);

  const convRate = totals.leads > 0 ? (totals.donations / totals.leads * 100) : 0;
  const rangeLabel = range?.start && range?.end ? `${fmtDate(range.start)} – ${fmtDate(range.end)}` : 'Semua waktu';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Perolehan Campaign"
        subtitle="Rekap perolehan per campaign — filter berdasarkan campaign & rentang tanggal."
        actions={<>
          <DateRangePill value={range} onChange={setRange} />
          <Btn variant="outline" tone="ink" icon="download" onClick={() => {
            const data = filtered.map((r) => ({
              campaign: r.title, status: r.status, leads: r.leads, donasi: r.donations,
              donatur: r.donors, perolehan: r.revenue, target: r.target, total_raised_all_time: r.total_raised,
            }));
            if (!data.length) { showToast('Tidak ada data'); return; }
            exportCSV(data, 'niatbaik_perolehan_campaign');
            showToast(data.length + ' campaign diekspor');
          }}>Export</Btn>
        </>}
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={campaignFilter} onChange={setCampaignFilter} icon="megaphone" options={[
            { value: 'all', label: 'Semua campaign' },
            ...rows.map((r) => ({ value: r.campaign_id, label: r.title })),
          ]}/>
          <span className="text-xs text-mute ml-auto flex items-center gap-1.5">
            <Icon name="calendar" size={13}/> {rangeLabel}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="wallet" label="Total Perolehan" value={fmtIDRShort(totals.revenue)} accent="ok" sub={rangeLabel}/>
        <StatCard icon="heart" label="Donasi Berhasil" value={fmtNum(totals.donations)} accent="brand"/>
        <StatCard icon="users" label="Total Donatur" value={fmtNum(totals.donors)} accent="sky"/>
        <StatCard icon="bolt" label="Conversion Rate" value={convRate.toFixed(1) + '%'} accent="warn" sub={`${fmtNum(totals.leads)} lead`}/>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-mute border-b border-line bg-bg2/60">
              <th className="px-5 py-3 font-semibold">Campaign</th>
              <th className="py-3 font-semibold text-right">Lead</th>
              <th className="py-3 font-semibold text-right">Donasi</th>
              <th className="py-3 font-semibold text-right">Donatur</th>
              <th className="py-3 font-semibold text-right">Perolehan</th>
              <th className="pr-5 py-3 font-semibold w-52">Progress (all-time)</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-5 py-10 text-center text-mute">Memuat…</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-mute">Belum ada perolehan pada rentang ini.</td></tr>
            )}
            {!loading && filtered.map((r) => {
              const pct = r.target > 0 ? Math.min(100, Math.round((r.total_raised || 0) / r.target * 100)) : 0;
              return (
                <tr key={r.campaign_id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-md shrink-0 overflow-hidden bg-bg2" style={r.image ? { backgroundImage: `url(${mediaUrl(r.image)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: '#2E4191' }}/>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink line-clamp-1 max-w-[260px]">{r.title}</div>
                        <div className="text-[11px] text-mute">{r.status}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right text-ink">{fmtNum(r.leads)}</td>
                  <td className="py-3 text-right text-ink font-semibold">{fmtNum(r.donations)}</td>
                  <td className="py-3 text-right text-ink">{fmtNum(r.donors)}</td>
                  <td className="py-3 text-right font-bold text-emerald-600">{fmtIDR(r.revenue)}</td>
                  <td className="pr-5 py-3">
                    {r.target > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1"><Progress value={r.total_raised || 0} max={r.target} height="h-1.5"/></div>
                        <span className="text-[11px] font-bold text-ink w-9 text-right">{pct}%</span>
                      </div>
                    ) : <span className="text-[11px] text-mute">tanpa target</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

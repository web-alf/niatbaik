import { useState, useEffect } from 'react';
import { fmtNum, fmtIDRShort } from '@/lib/format';
import { campaignBgStyle } from '@/lib/mappers';
import { getDateRange } from '@/lib/date';
import { api } from '@/lib/api';
import { exportCSV } from '@/lib/export';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';
import { Icon, Donut, DateRangePill } from '@/components';

// Data Studio — consolidated analytics dashboard. Every number here is DB-backed:
// /datastudio/overview (scorecard, daily series, source mix), /datastudio/{meta,google,tiktok}
// (per-platform spend/sessions/donations/revenue/roas), /datastudio/geo (per-region),
// /datastudio/funnel (per-step). Sections without a backing endpoint show an honest
// empty state rather than fabricated figures.
const SRC_COLORS = ['#1A73E8', '#0F9D58', '#F4B400', '#EA4335', '#9C27B0', '#FB8C00', '#94A3B8'];
const colorFor = (i: number) => SRC_COLORS[i % SRC_COLORS.length];

export default function DataStudioPage() {
  const campaignSeed = useDataStore((s) => s.campaigns) || [];
  const [page, setPage] = useState('overview');
  const [dateRangeObj, setDateRangeObj] = useState<any>(getDateRange());
  const [dsData, setDsData] = useState<any>({});
  const [dsLoading, setDsLoading] = useState(false);
  const showToast = useUiStore((s) => s.showToast);

  const fetchPage = async (p: any) => {
    setDsLoading(true);
    try {
      // Bind as arrow thunks so `this` stays the api object — `api.method` detached
      // and called bare loses its receiver and crashes (every method uses this.get).
      const loaders: any = {
        overview: () => api.dataStudioOverview(),
        meta: () => api.dataStudioMeta(),
        google: () => api.dataStudioGoogle(),
        tiktok: () => api.dataStudioTiktok(),
        geo: () => api.dataStudioGeo(),
        funnel: () => api.dataStudioFunnel(),
      };
      const fn = loaders[p || page];
      if (fn) {
        const res = await fn();
        setDsData((prev: any) => ({ ...prev, [p || page]: res?.data ?? {} }));
      }
    } catch { /* network errors degrade to empty states */ }
    setDsLoading(false);
  };

  useEffect(() => { fetchPage(page); }, [page]);

  // Export whatever the current page has loaded as CSV.
  const exportCurrent = () => {
    const d = dsData[page];
    let rows: any[] = [];
    if (page === 'overview') rows = (d?.sources || []).map((s: any) => ({ source: s.source, sessions: s.sessions, revenue: s.revenue }));
    else if (page === 'geo') rows = (Array.isArray(d) ? d : d?.regions || []).map((g: any) => ({ region: g.region, donations: g.donations, revenue: g.revenue }));
    else if (page === 'funnel') rows = (Array.isArray(d) ? d : d?.steps || []).map((f: any) => ({ step: f.step, count: f.count }));
    else if (d) rows = [{ platform: d.platform, spend: d.spend, sessions: d.sessions, donations: d.donations, revenue: d.revenue, roas: d.roas }];
    if (rows.length) { exportCSV(rows, 'niatbaik_datastudio_' + page); showToast(rows.length + ' baris diekspor'); }
    else showToast('Tidak ada data untuk diekspor');
  };

  const pages = [
    { v: 'overview', l: 'Overview' },
    { v: 'meta', l: 'Meta Ads' },
    { v: 'google', l: 'Google Ads + GA4' },
    { v: 'tiktok', l: 'TikTok' },
    { v: 'geo', l: 'Geographic' },
    { v: 'funnel', l: 'Conversion Funnel' },
  ];

  return (
    <div className="space-y-4 -mx-4 lg:-mx-6 -my-6 min-h-screen bg-bg2">
      {/* Top bar */}
      <div className="bg-white border-b border-line">
        <div className="px-4 lg:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <DataStudioLogo />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-mute leading-none">Analytics</div>
              <div className="font-extrabold text-ink text-base leading-tight">NIATBAIK.ORG · Overview Donasi</div>
            </div>
          </div>
          <div className="flex-1" />
          <button title="Muat ulang" className="h-8 w-8 rounded-md hover:bg-bg2 text-mute" onClick={() => fetchPage(page)}><Icon name="refresh" size={14} /></button>
          <button title="Export CSV" className="h-8 w-8 rounded-md hover:bg-bg2 text-mute" onClick={exportCurrent}><Icon name="download" size={14} /></button>
        </div>
        {/* Page tabs */}
        <div className="px-4 lg:px-6 flex items-center gap-1 overflow-x-auto border-t border-line">
          {pages.map((p) => (
            <button key={p.v} onClick={() => setPage(p.v)}
              className={`relative px-3 py-2.5 text-xs font-bold whitespace-nowrap transition-colors ${page === p.v ? 'text-[#1A73E8]' : 'text-mute hover:text-ink'}`}>
              {p.l}
              {page === p.v && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-[#1A73E8] rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar (date range only — the backend endpoints aggregate all-time;
          per-range filtering needs query params not yet supported server-side). */}
      <div className="px-4 lg:px-6 flex flex-wrap items-center gap-2">
        <div className="[&_.absolute]:left-0 [&_.absolute]:right-auto">
          <DateRangePill value={dateRangeObj} onChange={(r: any) => setDateRangeObj(r)} />
        </div>
        <div className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-mute">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Sumber: data donasi NIATBAIK.ORG + ad spend tercatat
        </div>
      </div>

      <div className="px-4 lg:px-6 pb-8 relative">
        {dsLoading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <div className="h-8 w-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {page === 'overview' && <DSOverview data={dsData.overview} campaigns={campaignSeed} />}
        {page === 'meta' && <DSPlatformPage data={dsData.meta} label="Meta Ads" accent="#1877F2" />}
        {page === 'google' && <DSPlatformPage data={dsData.google} label="Google Ads + GA4" accent="#34A853" />}
        {page === 'tiktok' && <DSPlatformPage data={dsData.tiktok} label="TikTok" accent="#000000" />}
        {page === 'geo' && <DSGeo data={dsData.geo} />}
        {page === 'funnel' && <DSFunnel data={dsData.funnel} />}
      </div>
    </div>
  );
}

// -------- Logo --------
function DataStudioLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="11" width="4" height="9" rx="1" fill="#1A73E8" />
      <rect x="9" y="6" width="4" height="14" rx="1" fill="#34A853" />
      <rect x="16" y="2" width="4" height="18" rx="1" fill="#F4B400" />
    </svg>
  );
}

// =============================================================
// OVERVIEW PAGE — backend: { scorecard, series[], sources[] }
// =============================================================
function DSOverview({ data, campaigns }: any) {
  const d = data || {};
  const s = d.scorecard || {};
  const series: any[] = Array.isArray(d.series) ? d.series : [];
  const sources: any[] = (Array.isArray(d.sources) ? d.sources : []).map((x: any, i: number) => ({ ...x, color: colorFor(i) }));
  const totalSess = sources.reduce((sum, x) => sum + (x.sessions || 0), 0) || 1;

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Scorecards */}
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <DSScorecard label="Sessions" value={fmtNum(s.sessions || 0)} color="#1A73E8" />
        <DSScorecard label="Donors" value={fmtNum(s.donors || 0)} color="#0F9D58" />
        <DSScorecard label="Donations" value={fmtNum(s.donations || 0)} color="#F4B400" />
        <DSScorecard label="Revenue" value={fmtIDRShort(s.revenue || 0)} color="#EA4335" />
        <DSScorecard label="ROAS" value={s.roas ? s.roas.toFixed(1) + 'x' : '—'} color="#4285F4" />
        <DSScorecard label="CVR" value={s.cvr ? s.cvr.toFixed(2) + '%' : '—'} color="#9C27B0" />
      </div>

      {/* Time series + source mix */}
      <div className="col-span-12 lg:col-span-8">
        <DSCard title="Sessions, Donations & Revenue" subtitle="Harian">
          <DSSeries series={series} />
          <DSLegend items={[
            { c: '#1A73E8', l: 'Sessions' },
            { c: '#0F9D58', l: 'Donations' },
            { c: '#F4B400', l: 'Revenue' },
          ]} />
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-4">
        <DSCard title="Sessions by Source">
          {sources.length === 0 ? <DSEmpty /> : <>
            <div className="flex items-center justify-center my-2">
              <Donut size={170} data={sources.map((x: any) => ({ value: x.sessions || 0, color: x.color }))} />
            </div>
            <div className="space-y-1.5 mt-2">
              {sources.map((x: any) => (
                <div key={x.source} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: x.color }} />
                  <span className="flex-1 font-semibold text-ink">{x.source || '(direct)'}</span>
                  <span className="text-mute">{fmtNum(x.sessions || 0)}</span>
                  <span className="w-10 text-right font-bold">{Math.round((x.sessions || 0) / totalSess * 100)}%</span>
                </div>
              ))}
            </div>
          </>}
        </DSCard>
      </div>

      {/* Channel performance table (from sources) */}
      <div className="col-span-12 lg:col-span-7">
        <DSCard title="Channel Performance" subtitle="Diurutkan berdasarkan Revenue">
          {sources.length === 0 ? <DSEmpty /> : (
            <div className="overflow-x-auto -mx-4">
              <table className="w-full min-w-[480px] text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-mute border-b border-line">
                    <th className="px-4 py-2 font-bold">Source</th>
                    <th className="py-2 font-bold text-right">Sessions</th>
                    <th className="py-2 font-bold text-right">CVR</th>
                    <th className="pr-4 py-2 font-bold text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sources].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).map((r: any, i: number) => {
                    const sess = r.sessions || 0;
                    // CVR needs paid count; the source row may not carry `donations`. Show '—'
                    // when it can't be computed rather than rendering NaN%.
                    const cvr = sess > 0 && r.donations ? (r.donations / sess * 100).toFixed(2) + '%' : '—';
                    return (
                      <tr key={i} className="border-b border-line/60 last:border-0 hover:bg-bg2/60">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                            <span className="font-mono">{r.source || '(direct)'}</span>
                          </span>
                        </td>
                        <td className="py-2.5 text-right">{fmtNum(sess)}</td>
                        <td className="py-2.5 text-right">{cvr}</td>
                        <td className="pr-4 py-2.5 text-right font-bold">{fmtIDRShort(r.revenue || 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <DSCard title="Top Campaigns" subtitle="Berdasarkan dana terkumpul">
          {(!campaigns || campaigns.length === 0) ? <DSEmpty /> : (
            <div className="space-y-2">
              {(() => {
                const top = [...campaigns].sort((a: any, b: any) => (b.raised || 0) - (a.raised || 0)).slice(0, 5);
                const maxRaised = Math.max(...top.map((c: any) => c.raised || 0), 1);
                return top.map((c: any) => {
                  const rev = c.raised || 0;
                  const pct = (rev / maxRaised) * 100;
                  return (
                    <div key={c.id} className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-md shrink-0 overflow-hidden bg-bg2" style={campaignBgStyle ? campaignBgStyle(c) : { background: c.thumb }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-ink line-clamp-1">{c.title}</div>
                        <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#1A73E8]" style={{ width: Math.min(100, pct) + '%' }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold text-ink">{fmtIDRShort(rev)}</div>
                        <div className="text-[10px] text-mute">{fmtNum(c.donors || 0)} donor</div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </DSCard>
      </div>
    </div>
  );
}

// =============================================================
// PLATFORM PAGE (Meta / Google / TikTok) — backend DSPlatform:
// { platform, spend, sessions, donations, revenue, roas }
// =============================================================
function DSPlatformPage({ data, label, accent }: any) {
  const m = data || {};
  const hasData = (m.spend || 0) > 0 || (m.sessions || 0) > 0 || (m.donations || 0) > 0;
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 grid grid-cols-2 md:grid-cols-5 gap-3">
        <DSScorecard label="Ad Spend" value={fmtIDRShort(m.spend || 0)} color={accent} />
        <DSScorecard label="Sessions" value={fmtNum(m.sessions || 0)} color={accent} />
        <DSScorecard label="Donations" value={fmtNum(m.donations || 0)} color="#0F9D58" />
        <DSScorecard label="Revenue" value={fmtIDRShort(m.revenue || 0)} color="#F4B400" />
        <DSScorecard label="ROAS" value={m.roas ? m.roas.toFixed(1) + 'x' : '—'} color="#EA4335" />
      </div>
      <div className="col-span-12">
        <DSCard title={label + ' — Ringkasan'} subtitle="Dari ad spend tercatat + UTM donasi">
          {!hasData ? (
            <div className="py-10 text-center text-sm text-mute">
              Belum ada data {label}. Catat ad spend di halaman <b>Advertiser</b> dan pastikan donasi membawa <code>utm_source</code> platform ini.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
              <DSStat label="Total Spend" value={fmtIDRShort(m.spend || 0)} />
              <DSStat label="Sessions" value={fmtNum(m.sessions || 0)} />
              <DSStat label="Donations" value={fmtNum(m.donations || 0)} />
              <DSStat label="Revenue" value={fmtIDRShort(m.revenue || 0)} />
            </div>
          )}
        </DSCard>
      </div>
    </div>
  );
}

// =============================================================
// GEO PAGE — backend DSGeoEntry[]: { region, donations, revenue }
// =============================================================
function DSGeo({ data }: any) {
  const rows: any[] = Array.isArray(data) ? data : (data?.regions || []);
  const total = rows.reduce((s, r) => s + (r.donations || 0), 0); // real sum (may be 0)
  const max = Math.max(...rows.map((r) => r.donations || 0), 1);
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-7">
        <DSCard title="Donasi per Wilayah" subtitle="Berdasarkan data donatur">
          {rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-mute">Belum ada data wilayah. Wilayah diturunkan dari data donatur saat tersedia.</div>
          ) : (
            <div className="space-y-1.5">
              {[...rows].sort((a, b) => (b.donations || 0) - (a.donations || 0)).map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-32 truncate font-semibold">{r.region || '—'}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-sm overflow-hidden">
                    <div className="h-full bg-[#1A73E8]" style={{ width: ((r.donations || 0) / max * 100) + '%' }} />
                  </div>
                  <span className="w-16 text-right text-mute">{fmtIDRShort(r.revenue || 0)}</span>
                  <span className="w-10 text-right font-bold">{Math.round((r.donations || 0) / (total || 1) * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </DSCard>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <DSCard title="Ringkasan">
          <div className="grid grid-cols-2 gap-4">
            <DSStat label="Total wilayah" value={fmtNum(rows.length)} />
            <DSStat label="Total donasi" value={fmtNum(total)} />
          </div>
        </DSCard>
      </div>
    </div>
  );
}

// =============================================================
// FUNNEL PAGE — backend DSFunnelStep[]: { step, count }
// =============================================================
function DSFunnel({ data }: any) {
  const steps: any[] = Array.isArray(data) ? data : (data?.steps || []);
  const max = steps[0]?.count || 1;
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-8">
        <DSCard title="Conversion Funnel" subtitle="Semua sumber">
          {steps.length === 0 ? <DSEmpty /> : (
            <div className="space-y-3 py-2">
              {steps.map((s: any, i: number) => {
                const w = (s.count / max) * 100;
                const drop = i > 0 && steps[i - 1].count > 0 ? (1 - s.count / steps[i - 1].count) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-ink">{i + 1}. {s.step}</span>
                      <span className="text-mute">{fmtNum(s.count)} · {((s.count / max) * 100).toFixed(1)}% of top</span>
                    </div>
                    <div className="h-9 bg-slate-100 rounded overflow-hidden relative">
                      <div className="h-full rounded flex items-center justify-end px-3 text-white text-xs font-extrabold" style={{ width: Math.max(2, w) + '%', background: colorFor(i) }}>
                        {fmtNum(s.count)}
                      </div>
                    </div>
                    {i > 0 && (
                      <div className="mt-1 text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                        <Icon name="arrowDown" size={10} /> Drop-off {drop.toFixed(1)}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DSCard>
      </div>
    </div>
  );
}

// =============================================================
// Reusable bits
// =============================================================
function DSSeries({ series }: any) {
  const pts: any[] = Array.isArray(series) ? series : [];
  if (pts.length < 2) {
    return <div className="h-[220px] flex items-center justify-center text-mute text-xs">Belum ada data deret waktu</div>;
  }
  const w = 600, h = 200;
  const sessions = pts.map((p) => p.sessions || 0);
  const donations = pts.map((p) => p.donations || 0);
  const revenue = pts.map((p) => p.revenue || 0);
  const allMax = Math.max(...sessions, ...donations, ...revenue.map((r) => r / 1e6), 1) * 1.2;
  const step = w / (pts.length - 1);
  const lines = [
    { data: sessions, c: '#1A73E8' },
    { data: donations, c: '#0F9D58' },
    { data: revenue.map((r) => r / 1e6), c: '#F4B400' }, // revenue scaled to Rp-juta to share the axis
  ];
  const pathFor = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'} ${i * step} ${h - (v / allMax) * (h - 20) - 5}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 220 }}>
      <defs>
        {lines.map((ln, i) => (
          <linearGradient key={i} id={`dsg${i}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={ln.c} stopOpacity="0.15" />
            <stop offset="100%" stopColor={ln.c} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2={w} y1={5 + i * (h - 20) / 3} y2={5 + i * (h - 20) / 3} stroke="#DADCE0" strokeDasharray="2 3" />)}
      {lines.map((ln, i) => {
        const d = pathFor(ln.data);
        return (
          <g key={i}>
            <path d={d + ` L ${w} ${h} L 0 ${h} Z`} fill={`url(#dsg${i})`} />
            <path d={d} fill="none" stroke={ln.c} strokeWidth="2" strokeLinejoin="round" />
          </g>
        );
      })}
    </svg>
  );
}

function DSLegend({ items }: any) {
  return (
    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-mute">
      {items.map((it: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: it.c }} />{it.l}</div>
      ))}
    </div>
  );
}

function DSCard({ title, subtitle, children }: any) {
  return (
    <div className="bg-white rounded-md border border-line p-4 h-full">
      <div className="mb-3">
        <div className="font-bold text-ink text-sm">{title}</div>
        {subtitle && <div className="text-[11px] text-mute mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function DSScorecard({ label, value, color }: any) {
  return (
    <div className="bg-white rounded-md border border-line p-3">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
        <div className="text-[10px] uppercase tracking-wider text-mute font-bold">{label}</div>
      </div>
      <div className="mt-1.5 text-lg font-extrabold text-ink">{value}</div>
    </div>
  );
}

function DSStat({ label, value }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-mute font-bold">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-ink">{value}</div>
    </div>
  );
}

function DSEmpty() {
  return <div className="py-10 text-center text-sm text-mute">Belum ada data.</div>;
}

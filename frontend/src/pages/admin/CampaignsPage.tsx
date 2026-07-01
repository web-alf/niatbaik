import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, mediaUrl } from '@/lib/api';
import { campaignBgStyle } from '@/lib/mappers';
import { fmtIDR, fmtIDRShort, fmtNum } from '@/lib/format';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';
import {
  Card, PageHeader, Tabs, Btn, Icon, SearchInput, Select, DateRangePill,
  Progress, StatusBadge, Badge, Modal, CampaignThumb,
} from '@/components';

// Campaign share helpers. The public campaign page lives at <origin>/c/<slug>.
// Prefer the human slug; fall back to id; return '' when neither exists so callers
// can disable share actions instead of producing a ".../c/undefined" dead link.
function campaignSlugOrId(c: any) {
  return (c && (c.slug || c.id)) || '';
}
function campaignShareUrl(c: any) {
  const s = campaignSlugOrId(c);
  if (!s) return '';
  // Use the current origin so the link is correct on any host (prod/staging/local),
  // not hardcoded to donasi.niatbaik.org.
  const origin = (typeof window !== 'undefined' && window.location && window.location.origin) || 'https://donasi.niatbaik.org';
  return origin + '/c/' + s;
}

// Campaigns list + detail preview modal
export default function CampaignsPage() {
  const showToast = useUiStore((s) => s.showToast);
  const navigate = useNavigate();
  const goCreate = () => { navigate('/campaigns/new'); };
  const goEdit = (c: any) => { navigate('/campaigns/' + c.id + '/edit'); };
  // Clicking a campaign's hero/thumbnail opens the dashboard with leads pre-filtered to it.
  const goLeads = (c: any) => { navigate('/dashboard?campaign=' + c.id); };
  // Detail preview modal state (formerly app-level setCampaignDetail).
  const [campaignDetail, setCampaignDetail] = useState<any>(null);
  // Live campaigns when API loaded them; else seed. Normalize backend status → design labels.
  const STATUS_NORM: Record<string, string> = { Berjalan: 'Running', Selesai: 'Ended', Aktif: 'Running' };
  const [ver, setVer] = useState(0);
  // Re-render when categories change in Settings so the filter dropdown stays in sync.
  useEffect(() => {
    const onCats = () => setVer(v => v + 1);
    window.addEventListener('nb-categories-updated', onCats);
    return () => window.removeEventListener('nb-categories-updated', onCats);
  }, []);
  const campaigns = useDataStore((s) => s.campaigns);
  const categories = useDataStore((s) => s.categories);
  const src = campaigns;
  const all = useMemo(() => src.map((c: any) => ({ ...c, status: STATUS_NORM[c.status] || c.status })), [src, ver]);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [view, setViewMode] = useState('cards');
  const [catFilter, setCatFilter] = useState('all');

  const counts = useMemo(() => ({
    all: all.length,
    Draft: all.filter((c: any) => c.status==='Draft').length,
    Published: all.filter((c: any) => c.status==='Published').length,
    Running: all.filter((c: any) => c.status==='Running').length,
    Ended: all.filter((c: any) => c.status==='Ended').length,
  }), [all]);

  const filtered = all.filter((c: any) =>
    (tab === 'all' || c.status === tab) &&
    (catFilter === 'all' || c.category === catFilter) &&
    (!q || c.title.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Campaigns"
        subtitle="Kelola seluruh campaign donasi NIATBAIK.ORG."
        actions={<>
          <Btn icon="plus" onClick={goCreate}>Create Campaign</Btn>
        </>}
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
            { value:'all', label:'Semua', count: counts.all },
            { value:'Draft', label:'Draft', count: counts.Draft },
            { value:'Published', label:'Published', count: counts.Published },
            { value:'Running', label:'Running', count: counts.Running },
            { value:'Ended', label:'Ended', count: counts.Ended },
          ]}/>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Cari judul campaign…" value={q} onChange={setQ} className="flex-1 min-w-[220px] max-w-md"/>
          <Select value={catFilter} onChange={setCatFilter} icon="filter" options={[
            {value:'all', label:'Semua kategori'},
            // Categories come from the API (window.CATEGORIES) so the filter matches
            // the categories actually assigned to campaigns. Value = name because
            // mapCampaign stores c.category as the category name string.
            ...((categories || []).map((cat: any) => ({ value: cat.name, label: cat.name }))),
            {value:'', label:'Tanpa kategori'}, // campaigns whose category is empty
          ]}/>
          <DateRangePill/>
          <div className="ml-auto inline-flex p-1 bg-bg2 rounded-lg border border-line">
            <button onClick={() => setViewMode('cards')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold ${view==='cards'?'bg-white shadow-sm text-ink':'text-mute'}`}>Cards</button>
            <button onClick={() => setViewMode('table')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold ${view==='table'?'bg-white shadow-sm text-ink':'text-mute'}`}>Table</button>
          </div>
        </div>
      </Card>

      {view === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c: any) => <CampaignCard key={c.id} c={c} onLeads={() => goLeads(c)} onOpen={() => setCampaignDetail(c)} onEdit={() => goEdit(c)} onDelete={async () => {
            if (!confirm('Hapus campaign "' + c.title + '"? Campaign akan dipindah ke Trash.')) return;
            try {
              await api.deleteCampaign(c.id);
              await useDataStore.getState().refreshAdmin();
              showToast('Campaign dipindah ke trash');
              setVer(v => v + 1);
            } catch (e) { showToast('Gagal menghapus campaign'); }
          }}/>)}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-mute border-b border-line bg-bg2/60">
                <th className="px-5 py-3 font-semibold">Campaign</th>
                <th className="py-3 font-semibold">Target</th>
                <th className="py-3 font-semibold">Terkumpul</th>
                <th className="py-3 font-semibold w-[260px]">Progress</th>
                <th className="py-3 font-semibold">Donatur</th>
                <th className="py-3 font-semibold">Status</th>
                <th className="pr-5 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-bg2/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => goLeads(c)} title="Lihat leads campaign ini di dashboard"
                        className="h-10 w-14 rounded-md overflow-hidden shrink-0 bg-bg2 relative group focus:outline-none focus:ring-2 focus:ring-brand-600/40" style={c.img ? {} : {background:c.thumb}}>
                        {c.img ? (
                          <img src={mediaUrl ? mediaUrl(c.img) : c.img} alt={c.title||''} className="h-full w-full object-cover" onError={(e: any)=>{e.target.style.display='none';}}/>
                        ) : (
                          <div className="h-full flex items-center justify-center text-white/90"><Icon name={c.icon} size={16}/></div>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"><Icon name="chart" size={14} className="text-white"/></span>
                      </button>
                      <div>
                        <div className="font-semibold text-ink leading-tight">{c.title}</div>
                        <div className="text-xs text-mute mt-0.5">{c.category} · {c.daysLeft} hari lagi</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-mute">{fmtIDRShort(c.target)}</td>
                  <td className="py-3 font-bold text-ink">{fmtIDRShort(c.raised)}</td>
                  <td className="py-3 pr-4"><Progress value={c.raised} max={c.target}/></td>
                  <td className="py-3">{fmtNum(c.donors)}</td>
                  <td className="py-3"><StatusBadge status={c.status}/></td>
                  <td className="pr-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink" onClick={() => setCampaignDetail(c)}><Icon name="eye" size={16}/></button>
                      <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink" onClick={() => goEdit(c)}><Icon name="edit" size={16}/></button>
                      <CampaignOptionMenu c={c} onEdit={() => goEdit(c)} onPreview={() => setCampaignDetail(c)} onDelete={async () => {
                        if (!confirm('Hapus campaign "' + c.title + '"? Campaign akan dipindah ke Trash.')) return;
                        try {
                          await api.deleteCampaign(c.id);
                          await useDataStore.getState().refreshAdmin();
                          showToast('Campaign dipindah ke trash');
                          setVer(v => v + 1);
                        } catch (e) { showToast('Gagal menghapus campaign'); }
                      }}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {campaignDetail && (
        <CampaignDetailModal campaign={campaignDetail} onClose={() => setCampaignDetail(null)}/>
      )}
    </div>
  );
}

function CampaignCard({ c, onLeads, onOpen, onEdit, onDelete }: any) {
  return (
    <Card className="overflow-hidden hover:shadow-pop transition-shadow group">
      <button type="button" onClick={onLeads} title="Lihat leads campaign ini di dashboard"
        className="block w-full aspect-[16/9] relative focus:outline-none focus:ring-2 focus:ring-brand-600/40">
        <CampaignThumb c={c} className="h-full"/>
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-ink text-xs font-bold shadow">
            <Icon name="chart" size={14}/> Lihat Leads
          </span>
        </span>
      </button>
      <div className="p-4">
        <div className="font-bold text-ink leading-snug line-clamp-2 min-h-[2.6rem]">{c.title}</div>
        <div className="mt-3 flex items-baseline justify-between text-sm">
          <div>
            <div className="text-mute text-xs">Terkumpul</div>
            <div className="font-bold text-brand-600">{fmtIDRShort(c.raised)}</div>
          </div>
          <div className="text-right">
            <div className="text-mute text-xs">Target</div>
            <div className="font-semibold text-ink">{fmtIDRShort(c.target)}</div>
          </div>
        </div>
        <div className="mt-2"><Progress value={c.raised} max={c.target}/></div>
        <div className="mt-3 flex items-center justify-between text-xs text-mute">
          <span><b className="text-ink">{fmtNum(c.donors)}</b> donatur</span>
          <span>{c.daysLeft > 0 ? `${c.daysLeft} hari lagi` : 'selesai'}</span>
          <span>·</span>
          <span>{c.updatedAt}</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Btn size="sm" variant="outline" tone="ink" icon="eye" onClick={onOpen} className="flex-1">Preview</Btn>
          <Btn size="sm" tone="brand" icon="edit" className="flex-1" onClick={onEdit}>Edit</Btn>
          <CampaignOptionMenu c={c} onEdit={onEdit} onPreview={onOpen} onDelete={onDelete}/>
        </div>
      </div>
    </Card>
  );
}

// ---------- Option dropdown menu (3-dot) ----------
function CampaignOptionMenu({ c, onEdit, onPreview, onDelete, align = 'right' }: any) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<any>(null);   // 'up' | 'down'
  const btnRef = useRef<any>(null);
  const menuRef = useRef<any>(null);
  const showToast = useUiStore((s) => s.showToast);

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const click = (e: any) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false);
    };
    const esc = (e: any) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', click);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', esc); };
  }, [open]);

  // Decide direction (up or down) so menu doesn't get clipped
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    setPos(spaceBelow < 280 ? 'up' : 'down');
  }, [open]);

  const updateCount = c?.updates || 0;

  const items: any[] = [
    { l: 'Edit Campaign',              icon: 'edit',     onClick: () => { setOpen(false); onEdit && onEdit(); } },
    { l: `Add Info Update (${updateCount})`, icon: 'pin',      onClick: () => { setOpen(false); showToast('Form update campaign dibuka'); } },
    { l: 'Data Donasi',                icon: 'wallet',   onClick: () => { setOpen(false); showToast('Membuka data donasi'); } },
    { l: 'Preview',                    icon: 'eye',      onClick: () => { setOpen(false); onPreview && onPreview(); } },
    { l: 'Buka di Tab Baru',            icon: 'eye',      onClick: () => { setOpen(false); const u = campaignShareUrl(c); if (u) window.open(u, '_blank'); else showToast('URL campaign belum tersedia'); } },
    { l: 'Salin URL',                  icon: 'copy',     onClick: () => { setOpen(false); const u = campaignShareUrl(c); if (u) { navigator.clipboard?.writeText(u); showToast('URL campaign disalin'); } else showToast('URL campaign belum tersedia'); } },
    { sep: true },
    { l: 'Delete Data',                icon: 'trash',    onClick: () => { setOpen(false); onDelete && onDelete(); }, danger: true },
    { l: 'Delete All',                 icon: 'trash',    onClick: () => { setOpen(false); showToast('Semua data terkait dihapus'); }, danger: true },
  ];

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        aria-label="Opsi campaign"
        aria-expanded={open}
        className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors ${open ? 'bg-brand-50 border-brand-200 text-brand-700' : 'border-line text-mute hover:bg-bg2 hover:text-ink'}`}>
        <Icon name="more" size={16}/>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={`absolute z-50 w-56 rounded-xl bg-white border border-line shadow-pop overflow-hidden ${pos === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="px-3 py-2 border-b border-line bg-bg2/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-mute">Option</div>
            <div className="text-xs font-bold text-ink line-clamp-1 mt-0.5">{c?.title || 'Campaign'}</div>
          </div>
          <div className="p-1.5">
            {items.map((it, i) => it.sep
              ? <div key={i} className="my-1 h-px bg-line"/>
              : (
                <button
                  key={i}
                  role="menuitem"
                  onClick={it.onClick}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-semibold text-left transition-colors ${it.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-ink/85 hover:bg-bg2 hover:text-ink'}`}>
                  <Icon name={it.icon} size={15} className={it.danger ? 'text-rose-500' : 'text-mute'}/>
                  <span className="flex-1">{it.l}</span>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Campaign Detail / Preview Modal (rendered as in-browser preview) ----------
function CampaignDetailModal({ campaign, onClose }: any) {
  const [amount, setAmount] = useState(100_000);
  const [tab, setTab] = useState('story');
  const navigate = useNavigate();
  const showToast = useUiStore((s) => s.showToast);
  const transactions = useDataStore((s) => s.transactions);
  const c = campaign;
  const presets = [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

  const recentDonors = (transactions || []).slice(0, 6);
  return (
    <Modal open={true} onClose={onClose} title="Preview Halaman Campaign" size="xl"
      footer={<>
        <span className="text-xs text-mute mr-auto flex items-center gap-1.5">
          <Icon name="globe" size={14}/> {(campaignShareUrl(c) || 'URL belum tersedia').replace(/^https?:\/\//, '')}
        </span>
        <Btn variant="outline" tone="ink" icon="copy" onClick={() => { const u = campaignShareUrl(c); if (u) { navigator.clipboard?.writeText(u); showToast('URL disalin'); } else showToast('URL campaign belum tersedia'); }}>Salin URL</Btn>
        <Btn variant="outline" tone="ink" icon="edit" onClick={() => { onClose(); navigate('/campaigns/' + c.id + '/edit'); }}>Edit campaign</Btn>
        <Btn icon="eye" onClick={() => { const u = campaignShareUrl(c); if (u) window.open(u, '_blank'); else showToast('URL campaign belum tersedia'); }}>Buka di tab baru</Btn>
      </>}>
      <div className="bg-bg2 -m-5 p-5">
        <div className="rounded-2xl border border-line bg-white overflow-hidden">
          {/* Browser chrome */}
          <div className="h-9 px-3 flex items-center gap-2 border-b border-line bg-bg2">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-400"/>
              <span className="h-3 w-3 rounded-full bg-amber-400"/>
              <span className="h-3 w-3 rounded-full bg-emerald-400"/>
            </div>
            <div className="ml-2 flex-1 h-6 rounded-md bg-white border border-line flex items-center px-2.5 text-[11px] font-mono text-mute">
              <Icon name="shield" size={12} className="mr-1.5 text-emerald-600"/>
              {(campaignShareUrl(c) || 'donasi.niatbaik.org/c/…').replace(/^https?:\/\//, '')}
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-0">
            <div className="lg:col-span-3">
              {/* Banner */}
              <div className="relative aspect-[16/9] overflow-hidden" style={campaignBgStyle ? campaignBgStyle(c) : { background: c.thumb }}>
                {!(c && c.img) && <div className="absolute inset-0 flex items-center justify-center text-white/90"><Icon name={c.icon} size={120} strokeWidth={1}/></div>}
                <div className="absolute inset-0 bg-black/30"/>
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge tone="outline" className="bg-white/90 backdrop-blur">{c.category}</Badge>
                  <Badge tone="ok" className="bg-white/90 backdrop-blur">{c.status}</Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-semibold opacity-80">YAYASAN NIAT BAIK · KAMPANYE TERVERIFIKASI</div>
                  <h2 className="mt-1 text-2xl font-extrabold leading-tight">{c.title}</h2>
                </div>
              </div>

              <div className="p-5">
                <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
                  { value:'story',  label:'Cerita' },
                  { value:'updates',label:'Update (4)' },
                  { value:'donors', label:'Donatur' },
                  { value:'faq',    label:'FAQ' },
                ]}/>

                <div className="mt-4">
                  {tab === 'story' && (
                    <div className="prose prose-slate prose-sm max-w-none">
                      <p className="text-ink/85 leading-relaxed">
                        Saudara/i pejuang kebaikan, di Desa Lengkong, NTT, anak-anak harus berjalan
                        4 km setiap pagi hanya untuk mendapatkan seember air keruh. Air yang sama
                        digunakan untuk minum, masak, dan mencuci — menyebabkan diare berulang dan
                        kasus stunting yang terus meningkat.
                      </p>
                      <p className="text-ink/85 leading-relaxed">
                        Bersama NIATBAIK.ORG, kita berikhtiar membangun <b>sumur bor + filtrasi
                        bersih</b> yang dapat melayani 380 keluarga. Dengan donasi <b>Rp 100.000</b>,
                        satu keluarga bisa mengakses air bersih selama 1 tahun penuh.
                      </p>
                      <div className="not-prose grid grid-cols-3 gap-3 my-4">
                        {['Pengeboran', 'Filtrasi', 'Distribusi'].map((s, i) => (
                          <div key={i} className="p-3 rounded-xl border border-line">
                            <div className="text-xs text-mute uppercase font-semibold">Tahap {i+1}</div>
                            <div className="font-bold text-ink mt-0.5">{s}</div>
                            <Progress value={[100, 65, 12][i]} max={100} height="h-1.5"/>
                          </div>
                        ))}
                      </div>
                      <p className="text-ink/85 leading-relaxed">
                        Setiap donasi akan dilaporkan transparan setiap minggu lewat halaman ini
                        dan WhatsApp. <b>InsyaAllah</b> niat baik kita menjadi penolong di akhirat.
                      </p>
                    </div>
                  )}
                  {tab === 'updates' && (
                    <div className="space-y-4">
                      {[
                        { d:'18 Mei 2026', t:'Tim sudah tiba di lokasi', body:'Survey geologi selesai, titik bor ditentukan…' },
                        { d:'10 Mei 2026', t:'Donasi tembus 50% target', body:'Alhamdulillah, semua proses pengadaan dimulai…' },
                        { d:'02 Mei 2026', t:'Kampanye resmi dibuka', body:'Terima kasih atas dukungan awal 312 donatur pertama.' },
                      ].map((u, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name="pin" size={16}/></div>
                          <div>
                            <div className="text-xs text-mute">{u.d}</div>
                            <div className="font-bold text-ink">{u.t}</div>
                            <div className="text-sm text-ink/80 mt-0.5">{u.body}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {tab === 'donors' && (
                    <div className="space-y-2">
                      {recentDonors.map((d: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg2">
                          <div className="h-9 w-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
                            {(d.anon ? 'HA' : d.donor.split(' ').map((s: any)=>s[0]).join('')).slice(0,2)}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-ink">{d.anon ? 'Hamba Allah' : d.donor}</div>
                            <div className="text-xs text-mute italic">"{d.message}"</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-brand-600">{fmtIDR(d.amount)}</div>
                            <div className="text-[10px] text-mute">{d.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {tab === 'faq' && (
                    <div className="space-y-2">
                      {[
                        { q:'Apakah donasi saya aman dan terverifikasi?', a:'Ya. Semua campaign diverifikasi tim NIATBAIK.ORG dan dilaporkan secara transparan.' },
                        { q:'Apakah saya bisa mendapatkan bukti donasi?', a:'Bukti otomatis terkirim via email & WhatsApp.' },
                        { q:'Apa yang terjadi bila donasi melebihi target?', a:'Kelebihan akan dialokasikan untuk program serupa yang masih membutuhkan.' },
                      ].map((f, i) => (
                        <details key={i} className="rounded-xl border border-line bg-white">
                          <summary className="cursor-pointer p-3 font-semibold text-ink list-none flex items-center justify-between">
                            {f.q}<Icon name="chevronD" size={16} className="text-mute"/>
                          </summary>
                          <div className="px-3 pb-3 text-sm text-ink/80">{f.a}</div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Donation form sidebar */}
            <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-line bg-bg2/60">
              <div className="p-5 space-y-4 sticky top-0">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-mute">Donasi terkumpul</div>
                  <div className="mt-1 text-3xl font-extrabold text-brand-600">{fmtIDR(c.raised)}</div>
                  <div className="text-sm text-mute">dari target {fmtIDR(c.target)}</div>
                  <div className="mt-2"><Progress value={c.raised} max={c.target || 1} height="h-2.5"/></div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-white border border-line">
                      <div className="text-mute">Donatur</div><div className="font-bold text-ink">{fmtNum(c.donors)}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-line">
                      <div className="text-mute">Sisa hari</div><div className="font-bold text-ink">{c.daysLeft}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-line">
                      <div className="text-mute">Tercapai</div><div className="font-bold text-emerald-600">{c.target ? Math.round(c.raised/c.target*100) : 0}%</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-line p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-mute">Donasi cepat</div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {presets.map((p) => (
                      <button key={p} onClick={() => setAmount(p)}
                        className={`py-2 rounded-lg text-sm font-bold border transition-all ${amount === p ? 'bg-brand-50 border-brand-600 text-brand-700' : 'bg-white border-line text-ink hover:border-brand-300'}`}>
                        {fmtIDRShort(p)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-mute">Atau masukkan nominal lain</label>
                    <div className="mt-1 flex items-center rounded-lg border border-line bg-white focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
                      <span className="pl-3 text-mute">Rp</span>
                      <input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} className="flex-1 px-2 py-2 outline-none"/>
                    </div>
                  </div>
                  <input className="field mt-3" placeholder="Nama (opsional)"/>
                  <input className="field mt-2" placeholder="No. WhatsApp"/>
                  <input className="field mt-2" placeholder="Email"/>
                  <label className="mt-2 flex items-center gap-2 text-xs text-ink/80">
                    <input type="checkbox" className="rounded border-line"/> Donasi sebagai anonim
                  </label>
                  <textarea className="field mt-2" rows={2} placeholder="Doa / pesan donatur…"/>
                  <Btn size="lg" className="w-full mt-3" icon="heart">Donasi Sekarang</Btn>
                  <div className="mt-2 flex items-center justify-center gap-3 text-[10px] font-semibold text-mute">
                    <span className="inline-flex items-center gap-1"><Icon name="shield" size={12} className="text-emerald-600"/> SSL Secure</span>
                    <span className="inline-flex items-center gap-1"><Icon name="check" size={12} className="text-emerald-600"/> Terverifikasi</span>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-line p-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Metode pembayaran</div>
                  <div className="grid grid-cols-4 gap-2">
                    {['QRIS','BCA','GoPay','OVO','Dana','Mandiri','BNI','ShopeePay'].map((m) => (
                      <div key={m} className="h-9 rounded-md border border-line bg-bg2 flex items-center justify-center text-[10px] font-bold text-ink/70">{m}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

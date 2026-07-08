import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';
import { fmtIDR, fmtIDRShort, fmtNum } from '@/lib/format';
import { parseTxnDate, formatRangeLabel, getDateRange } from '@/lib/date';
import { exportCSV, exportExcel } from '@/lib/export';
import { Card, StatCard, Badge, StatusBadge, Btn, SearchInput, Modal, PageHeader, Empty, Toggle, SourcePill, Icon, DateRangePill } from '@/components';

export default function CsInboxPage() {
  // Live invoices when API loaded them; else seed.
  const transactions = useDataStore((s) => s.transactions);
  const seedTxns = transactions;
  const openInvoice = useUiStore((s) => s.openInvoice);
  const showToast = useUiStore((s) => s.showToast);

  // local stateful copy so we can mutate status
  const [txns, setTxns] = useState<any[]>(() => seedTxns.map((t: any) => ({ ...t })));
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(txns[0]);
  const [advFilterOpen, setAdvFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Advanced filter state
  const [adv, setAdv] = useState<any>({
    statuses: [],            // ['Paid','Pending','Failed']
    methods: [],             // ['QRIS','BCA VA',...]
    sources: [],             // ['facebook','google',...]
    minAmount: '',
    maxAmount: '',
    range: null,             // { start, end }
    anonOnly: false,
    hasMessage: false,
    hasNote: false,
  });

  const activeAdvCount = useMemo(() => {
    let n = 0;
    if (adv.statuses.length) n++;
    if (adv.methods.length) n++;
    if (adv.sources.length) n++;
    if (adv.minAmount) n++;
    if (adv.maxAmount) n++;
    if (adv.range?.start) n++;
    if (adv.anonOnly) n++;
    if (adv.hasMessage) n++;
    if (adv.hasNote) n++;
    return n;
  }, [adv]);

  const filtered = useMemo(() => txns.filter((t: any) => {
    if (filter === 'pending' && t.status !== 'Pending') return false;
    if (filter === 'failed'  && t.status !== 'Failed') return false;
    if (filter === 'paid'    && t.status !== 'Paid') return false;
    if (search && !(String(t.donor||'') + String(t.id||'') + String(t.campaign||'') + String(t.whatsapp||'') + String(t.email||'')).toLowerCase().includes(search.toLowerCase())) return false;
    if (adv.statuses.length && !adv.statuses.includes(t.status)) return false;
    if (adv.methods.length  && !adv.methods.includes(t.method))  return false;
    if (adv.sources.length  && !adv.sources.includes(t.utm.source)) return false;
    if (adv.minAmount && t.amount < +adv.minAmount) return false;
    if (adv.maxAmount && t.amount > +adv.maxAmount) return false;
    if (adv.anonOnly && !t.anon) return false;
    if (adv.hasMessage && (!t.message || t.message === '-')) return false;
    if (adv.hasNote && !t.note) return false;
    if (adv.range?.start) {
      const d = parseTxnDate(t.date);
      if (d) {
        const s = new Date(adv.range.start); s.setHours(0,0,0,0);
        const e = new Date(adv.range.end || adv.range.start); e.setHours(23,59,59,999);
        if (d < s || d > e) return false;
      }
    }
    return true;
  }), [filter, search, adv, txns]);

  // Update status to paid — optimistic local + best-effort API. The backend expects
  // a real PaymentStatus *code* (e.g. "Terbayar"), not the UI bucket "Paid"; pick the
  // first status flagged is_paid from the admin-managed list, falling back to "Terbayar".
  const updateStatusToPaid = async (t: any) => {
    if (!t.uuid) { showToast('UUID invoice tidak tersedia, tidak bisa update status'); return; }
    // The backend expects a real PaymentStatus *code* (e.g. "Terbayar"), not the UI
    // bucket "Paid". Require the master list to be loaded so we send a code the backend
    // recognizes — guessing "Terbayar" 422s silently if that status doesn't exist.
    const paidStatus = (useDataStore.getState().paymentStatuses || []).find((s: any) => s.is_paid);
    if (!paidStatus) { showToast('Daftar status pembayaran belum dimuat. Refresh lalu coba lagi.'); return; }

    const prevStatus = t.status;
    // Optimistic update, then await the API and roll back on failure so the UI can't
    // silently show "Paid" while the backend rejected it.
    setTxns((prev) => prev.map((x: any) => x.id === t.id ? { ...x, status: 'Paid' } : x));
    setSelected((prev: any) => prev && prev.id === t.id ? { ...prev, status: 'Paid' } : prev);
    try {
      await api.updateInvoiceStatus(t.uuid, paidStatus.code);
      showToast(`Invoice ${t.id} → Paid`);
    } catch (e: any) {
      setTxns((prev) => prev.map((x: any) => x.id === t.id ? { ...x, status: prevStatus } : x));
      setSelected((prev: any) => prev && prev.id === t.id ? { ...prev, status: prevStatus } : prev);
      showToast('Gagal update status: ' + (e?.message || 'Error'));
    }
  };

  // Persist a CS internal note. Uses the DB UUID (t.uuid) — the note endpoint parses its
  // path param as a UUID. Optimistic local update so the panel reflects the save
  // immediately; surfaces a failure toast instead of pretending it saved.
  const saveNote = async (t: any, noteText: string, setNoteSaving: any) => {
    if (!t.uuid) { showToast('UUID invoice tidak tersedia, tidak bisa menyimpan catatan'); return; }
    setNoteSaving(true);
    try {
      await api.addInvoiceNote(t.uuid, noteText);
      setTxns((prev) => prev.map((x: any) => x.id === t.id ? { ...x, note: noteText } : x));
      setSelected((prev: any) => prev && prev.id === t.id ? { ...prev, note: noteText } : prev);
      showToast('Catatan tersimpan');
    } catch (e: any) {
      showToast('Gagal menyimpan catatan: ' + (e?.message || ''));
    } finally {
      setNoteSaving(false);
    }
  };

  const copyInvoice = (t: any) => {
    navigator.clipboard?.writeText(t.id);
    showToast('Invoice ' + t.id + ' disalin');
  };

  // "Selesai bulan ini" — computed from the loaded invoices (the backend dashboardStats
  // payload has no completed_month field), counting Paid invoices dated this month.
  const completedThisMonth = useMemo(() => {
    const now = new Date();
    return txns.filter((t: any) => {
      if (t.status !== 'Paid') return false;
      const d = parseTxnDate(t.date);
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [txns]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="CS Inbox"
        subtitle="Pusat follow-up donatur & manajemen invoice."
        actions={<>
          <button onClick={() => setAdvFilterOpen(true)}
            className={`inline-flex items-center gap-2 h-10 px-3 rounded-lg border text-sm font-semibold transition-colors ${activeAdvCount > 0 ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink hover:bg-bg2'}`}>
            <Icon name="filter" size={14}/>
            Filter Lanjutan
            {activeAdvCount > 0 && <span className="h-5 min-w-[20px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">{activeAdvCount}</span>}
          </button>
          <Btn variant="outline" tone="ink" icon="download" onClick={() => setExportOpen(true)}>Export terbatas</Btn>
        </>}
      />

      {/* Active filter chips */}
      {activeAdvCount > 0 && <ActiveFilterChips adv={adv} onChange={setAdv}/>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="inbox"  label="Total hasil filter" value={fmtNum(filtered.length)} accent="brand" sub={`dari ${fmtNum(txns.length)} transaksi`}/>
        <StatCard icon="bolt"   label="Menunggu follow-up" value={fmtNum(txns.filter((t: any)=>t.status==='Pending').length)} accent="warn"/>
        <StatCard icon="close"  label="Pembayaran gagal"   value={fmtNum(txns.filter((t: any)=>t.status==='Failed').length)} accent="bad"/>
        <StatCard icon="check"  label="Selesai bulan ini"  value={fmtNum(completedThisMonth)} accent="ok"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* List */}
        <Card className="lg:col-span-1 p-0 overflow-hidden flex flex-col max-h-[45vh] lg:max-h-[70vh]">
          <div className="p-4 border-b border-line space-y-2 shrink-0">
            <SearchInput placeholder="Cari donatur / invoice / WA…" value={search} onChange={setSearch}/>
            <div className="inline-flex p-1 bg-bg2 rounded-lg border border-line w-full">
              {[
                {v:'all', l:'Semua'},
                {v:'pending', l:'Pending'},
                {v:'paid', l:'Paid'},
                {v:'failed', l:'Failed'},
              ].map((o) => (
                <button key={o.v} onClick={() => setFilter(o.v)}
                  className={`flex-1 px-2 py-1 text-xs font-bold rounded-md ${filter===o.v ? 'bg-white text-ink shadow-sm' : 'text-mute'}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-line">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-mute">Tidak ada transaksi sesuai filter.</div>
            ) : filtered.slice(0, 30).map((t: any) => (
              <button key={t.id} onClick={() => setSelected(t)}
                className={`w-full text-left p-3 hover:bg-bg2 ${selected?.id === t.id ? 'bg-brand-50/40 border-l-4 border-brand-600' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {String(t.anon?'HA':(t.donor||'')).split(' ').map((s: any)=>s[0]).join('').slice(0,2)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-ink truncate">{t.anon ? 'Hamba Allah' : t.donor}</div>
                      <div className="text-[11px] text-mute font-mono">{t.id}</div>
                    </div>
                  </div>
                  <StatusBadge status={t.status} size="sm"/>
                </div>
                <div className="mt-1.5 text-xs text-mute line-clamp-1">{String(t.campaign||'')}</div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-600">{fmtIDR(t.amount)}</span>
                  <span className="text-mute">{String(t.date||'').split(',')[0]}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Detail */}
        <Card className="lg:col-span-2 p-5">
          {selected ? <CSDetail key={selected?.id} t={selected} onOpen={() => openInvoice(selected)} onCopy={copyInvoice} onMarkPaid={updateStatusToPaid} onSaveNote={saveNote} showToast={showToast}/>
                    : <Empty title="Pilih percakapan" sub="Pilih donatur di sebelah kiri."/>}
        </Card>
      </div>

      <AdvFilterModal open={advFilterOpen} onClose={() => setAdvFilterOpen(false)} value={adv} onChange={setAdv} txns={txns}/>
      <ExportLimitedModal open={exportOpen} onClose={() => setExportOpen(false)} rows={filtered} showToast={showToast}/>
    </div>
  );
}

// =========================================================
// Active filter chips bar
// =========================================================
function ActiveFilterChips({ adv, onChange }: any) {
  const chips: any[] = [];
  adv.statuses.forEach((s: any) => chips.push({ k:'status:'+s, l:`Status: ${s}`, remove: () => onChange({ ...adv, statuses: adv.statuses.filter((x: any) => x !== s) }) }));
  adv.methods.forEach((m: any)  => chips.push({ k:'mth:'+m,    l:`Metode: ${m}`,  remove: () => onChange({ ...adv, methods:  adv.methods.filter((x: any) => x !== m) }) }));
  adv.sources.forEach((s: any)  => chips.push({ k:'src:'+s,    l:`Source: ${s}`,  remove: () => onChange({ ...adv, sources:  adv.sources.filter((x: any) => x !== s) }) }));
  if (adv.minAmount) chips.push({ k:'min', l:`Min ${fmtIDRShort(+adv.minAmount)}`, remove: () => onChange({ ...adv, minAmount:'' }) });
  if (adv.maxAmount) chips.push({ k:'max', l:`Max ${fmtIDRShort(+adv.maxAmount)}`, remove: () => onChange({ ...adv, maxAmount:'' }) });
  if (adv.range?.start) chips.push({ k:'rng', l:`Tanggal: ${formatRangeLabel(adv.range.start, adv.range.end)}`, remove: () => onChange({ ...adv, range:null }) });
  if (adv.anonOnly)   chips.push({ k:'anon', l:'Hanya anonim', remove: () => onChange({ ...adv, anonOnly:false }) });
  if (adv.hasMessage) chips.push({ k:'msg',  l:'Ada doa/pesan', remove: () => onChange({ ...adv, hasMessage:false }) });
  if (adv.hasNote)    chips.push({ k:'note', l:'Ada catatan CS', remove: () => onChange({ ...adv, hasNote:false }) });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-mute">Filter aktif:</span>
      {chips.map((c) => (
        <span key={c.k} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-100 text-xs font-bold text-brand-700">
          {c.l}
          <button onClick={c.remove} className="hover:text-rose-600"><Icon name="close" size={12} strokeWidth={2.4}/></button>
        </span>
      ))}
      <button onClick={() => onChange({ statuses:[], methods:[], sources:[], minAmount:'', maxAmount:'', range:null, anonOnly:false, hasMessage:false, hasNote:false })}
        className="text-xs font-bold text-rose-600 hover:underline">
        Reset semua
      </button>
    </div>
  );
}

// =========================================================
// Advanced Filter modal
// =========================================================
function AdvFilterModal({ open, onClose, value, onChange, txns }: any) {
  const [draft, setDraft] = useState<any>(value);
  useEffect(() => { if (open) setDraft(value); }, [open]);

  const allMethods = useMemo(() => Array.from(new Set(txns.map((t: any) => t.method))), [txns]);
  const allSources = useMemo(() => Array.from(new Set(txns.map((t: any) => t.utm.source))), [txns]);

  const toggle = (key: any, item: any) => {
    const arr = draft[key];
    setDraft({ ...draft, [key]: arr.includes(item) ? arr.filter((x: any) => x !== item) : [...arr, item] });
  };

  const apply = () => { onChange(draft); onClose(); };
  const reset = () => setDraft({ statuses:[], methods:[], sources:[], minAmount:'', maxAmount:'', range:null, anonOnly:false, hasMessage:false, hasNote:false });

  return (
    <Modal open={open} onClose={onClose} title="Filter Lanjutan" size="lg"
      footer={<>
        <button onClick={reset} className="mr-auto text-sm font-bold text-rose-600 hover:underline">Reset semua</button>
        <Btn variant="outline" tone="ink" onClick={onClose}>Batal</Btn>
        <Btn icon="filter" onClick={apply}>Terapkan Filter</Btn>
      </>}>
      <div className="space-y-5">
        <Group label="Status">
          <div className="flex flex-wrap gap-2">
            {['Paid','Pending','Failed'].map((s) => (
              <FilterChip key={s} active={draft.statuses.includes(s)} onClick={() => toggle('statuses', s)}>
                <StatusBadge status={s} size="sm"/>
              </FilterChip>
            ))}
          </div>
        </Group>

        <Group label="Metode Pembayaran">
          <div className="flex flex-wrap gap-2">
            {allMethods.map((m: any) => (
              <FilterChip key={m} active={draft.methods.includes(m)} onClick={() => toggle('methods', m)}>
                {m}
              </FilterChip>
            ))}
          </div>
        </Group>

        <Group label="Sumber Traffic (utm_source)">
          <div className="flex flex-wrap gap-2">
            {allSources.map((s: any) => (
              <FilterChip key={s} active={draft.sources.includes(s)} onClick={() => toggle('sources', s)}>
                <SourcePill source={s}/>
              </FilterChip>
            ))}
          </div>
        </Group>

        <Group label="Rentang Nominal">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-mute">Minimum</label>
              <div className="mt-1 flex items-center rounded-lg border border-line bg-white focus-within:border-brand-600">
                <span className="pl-3 text-mute">Rp</span>
                <input type="number" value={draft.minAmount} onChange={(e) => setDraft({ ...draft, minAmount:e.target.value })} className="flex-1 px-2 py-2 outline-none text-sm"/>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-mute">Maximum</label>
              <div className="mt-1 flex items-center rounded-lg border border-line bg-white focus-within:border-brand-600">
                <span className="pl-3 text-mute">Rp</span>
                <input type="number" value={draft.maxAmount} onChange={(e) => setDraft({ ...draft, maxAmount:e.target.value })} className="flex-1 px-2 py-2 outline-none text-sm"/>
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              { l:'≤ 100K', min:'', max:'100000' },
              { l:'100K–500K', min:'100000', max:'500000' },
              { l:'500K–1jt', min:'500000', max:'1000000' },
              { l:'≥ 1jt', min:'1000000', max:'' },
            ].map((p) => (
              <button key={p.l} onClick={() => setDraft({ ...draft, minAmount:p.min, maxAmount:p.max })}
                className="px-2.5 py-1 rounded-full bg-bg2 hover:bg-brand-50 hover:text-brand-700 text-xs font-bold text-ink/80 border border-line">
                {p.l}
              </button>
            ))}
          </div>
        </Group>

        <Group label="Rentang Tanggal">
          <DateRangePill value={draft.range} onChange={(r: any) => setDraft({ ...draft, range:r })} label={draft.range?.start ? undefined : 'Pilih tanggal'}/>
        </Group>

        <Group label="Atribut Donasi">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Toggle value={draft.anonOnly}   onChange={(v: any) => setDraft({ ...draft, anonOnly:v })}   label="Hanya donasi anonim" sub="Filter Hamba Allah"/>
            <Toggle value={draft.hasMessage} onChange={(v: any) => setDraft({ ...draft, hasMessage:v })} label="Punya doa/pesan"     sub="Skip yang kosong"/>
            <Toggle value={draft.hasNote}    onChange={(v: any) => setDraft({ ...draft, hasNote:v })}    label="Punya catatan CS"    sub="Sudah ada notes"/>
          </div>
        </Group>
      </div>
    </Modal>
  );
}

function Group({ label, children }: any) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">{label}</div>
      {children}
    </div>
  );
}

function FilterChip({ active, onClick, children }: any) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all inline-flex items-center gap-1.5 ${active ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20 text-brand-700' : 'border-line bg-white text-ink hover:bg-bg2'}`}>
      {active && <Icon name="check" size={11} strokeWidth={3} className="text-brand-600"/>}
      {children}
    </button>
  );
}

// =========================================================
// Export modal (Export terbatas - CS-safe fields only)
// =========================================================
function ExportLimitedModal({ open, onClose, rows, showToast }: any) {
  // Default: safe fields, NO payment method / email / WA
  const ALL_FIELDS: any[] = [
    { k:'invoice',      l:'Kode invoice',  always: true },
    { k:'tanggal',      l:'Tanggal',        always: true },
    { k:'donatur',      l:'Nama donatur',   default: true },
    { k:'campaign',     l:'Campaign',       default: true },
    { k:'nominal',      l:'Nominal',        default: true },
    { k:'status',       l:'Status',         default: true },
    { k:'whatsapp',     l:'No. WhatsApp',   sensitive: true },
    { k:'email',        l:'Email',          sensitive: true },
    { k:'metode',       l:'Metode pembayaran', sensitive: true },
    { k:'fundraiser',   l:'Fundraiser',     default: true },
    { k:'utm_source',   l:'Source iklan',   default: true },
    { k:'utm_campaign', l:'UTM campaign',   default: true },
    { k:'utm_medium',   l:'UTM medium' },
    { k:'utm_content',  l:'UTM content' },
    { k:'utm_term',     l:'UTM term' },
    { k:'utm_id',       l:'UTM id' },
    { k:'pesan',        l:'Doa / pesan donatur' },
    { k:'note',         l:'Catatan CS' },
  ];

  const [fields, setFields] = useState<any>(() => {
    const obj: any = {};
    ALL_FIELDS.forEach(f => obj[f.k] = !!(f.always || f.default));
    return obj;
  });
  const [format, setFormat] = useState('csv');
  const [limit, setLimit]   = useState<any>('filtered');  // 'filtered' | 100 | 500 | 1000

  const buildRows = () => {
    let src = rows;
    if (limit !== 'filtered') src = rows.slice(0, +limit);
    return src.map((t: any) => {
      const r: any = {};
      ALL_FIELDS.forEach(f => {
        if (!fields[f.k]) return;
        switch (f.k) {
          case 'invoice':      r[f.l] = t.id; break;
          case 'tanggal':      r[f.l] = t.date; break;
          case 'donatur':      r[f.l] = t.anon ? 'Hamba Allah' : t.donor; break;
          case 'campaign':     r[f.l] = t.campaign; break;
          case 'nominal':      r[f.l] = t.amount; break;
          case 'status':       r[f.l] = t.status; break;
          case 'whatsapp':     r[f.l] = t.whatsapp; break;
          case 'email':        r[f.l] = t.email; break;
          case 'metode':       r[f.l] = t.method; break;
          case 'fundraiser':   r[f.l] = t.referrer || ''; break;
          case 'utm_source':   r[f.l] = t.utm.source; break;
          case 'utm_campaign': r[f.l] = t.utm.campaign; break;
          case 'utm_medium':   r[f.l] = t.utm.medium || ''; break;
          case 'utm_content':  r[f.l] = t.utm.content || ''; break;
          case 'utm_term':     r[f.l] = t.utm.term || ''; break;
          case 'utm_id':       r[f.l] = t.utm.id || ''; break;
          case 'pesan':        r[f.l] = t.message || ''; break;
          case 'note':         r[f.l] = t.note || ''; break;
        }
      });
      return r;
    });
  };

  const doExport = () => {
    const out = buildRows();
    if (!out.length) { showToast('Tidak ada data untuk diekspor'); return; }
    if (format === 'csv') exportCSV(out, 'cs_inbox', getDateRange());
    else exportExcel(out, 'cs_inbox', getDateRange(), 'CS Inbox');
    showToast(`${out.length} baris diekspor sebagai ${format.toUpperCase()}`);
    onClose();
  };

  const selectedCount = Object.values(fields).filter(Boolean).length;
  const sensitiveSelected = ALL_FIELDS.filter(f => f.sensitive && fields[f.k]).length;

  return (
    <Modal open={open} onClose={onClose} title="Export Data CS (Terbatas)" size="lg"
      footer={<>
        <div className="mr-auto text-xs text-mute">
          {selectedCount} field · {limit === 'filtered' ? rows.length : Math.min(rows.length, +limit)} baris
        </div>
        <Btn variant="outline" tone="ink" onClick={onClose}>Batal</Btn>
        <Btn icon="download" onClick={doExport}>Download {format === 'csv' ? 'CSV' : 'Excel'}</Btn>
      </>}>
      <div className="space-y-5">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-xs">
          <Icon name="shield" size={14} className="text-amber-600 mt-0.5 shrink-0"/>
          <div className="text-amber-800">
            <b>Export terbatas</b> berarti data sensitif (no. WA, email, metode pembayaran) <b>opt-in saja</b>.
            Aktivitas export dicatat di Activity Log dan dapat diaudit Admin.
          </div>
        </div>

        <Group label="Format File">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v:'csv', l:'CSV', sub:'Universal · Excel/Google Sheets', icon:'download' },
              { v:'xls', l:'Excel (XLS)', sub:'Header bold + warna brand', icon:'download' },
            ].map((o) => (
              <button key={o.v} onClick={() => setFormat(o.v)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${format===o.v ? 'border-brand-600 bg-brand-50' : 'border-line hover:bg-bg2'}`}>
                <Icon name={o.icon} size={16} className={format===o.v ? 'text-brand-600' : 'text-mute'}/>
                <div className={`mt-1.5 font-extrabold text-sm ${format===o.v ? 'text-brand-700' : 'text-ink'}`}>{o.l}</div>
                <div className="text-[10px] text-mute mt-0.5">{o.sub}</div>
              </button>
            ))}
          </div>
        </Group>

        <Group label="Jumlah Baris">
          <div className="flex flex-wrap gap-2">
            {[
              { v:'filtered', l:`Semua hasil filter (${rows.length})` },
              { v:'100', l:'100 baris pertama' },
              { v:'500', l:'500 baris pertama' },
              { v:'1000', l:'1.000 baris pertama' },
            ].map((o) => (
              <button key={o.v} onClick={() => setLimit(o.v)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold ${limit==o.v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink hover:bg-bg2'}`}>
                {o.l}
              </button>
            ))}
          </div>
        </Group>

        <Group label="Field yang Disertakan">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ALL_FIELDS.map((f) => (
              <label key={f.k}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${fields[f.k] ? (f.sensitive ? 'border-amber-200 bg-amber-50/60' : 'border-brand-100 bg-brand-50/40') : 'border-line bg-white hover:bg-bg2'} ${f.always ? 'opacity-70 cursor-not-allowed' : ''}`}>
                <input type="checkbox"
                  checked={fields[f.k]}
                  disabled={f.always}
                  onChange={(e) => setFields({ ...fields, [f.k]: e.target.checked })}
                  className="rounded border-line h-4 w-4 accent-brand-600"/>
                <span className="text-sm font-semibold text-ink flex-1">{f.l}</span>
                {f.always && <Badge tone="slate" size="sm">wajib</Badge>}
                {f.sensitive && <Badge tone="warn" size="sm">sensitif</Badge>}
              </label>
            ))}
          </div>
          {sensitiveSelected > 0 && (
            <div className="mt-2 text-xs text-amber-700 font-semibold flex items-center gap-1.5">
              <Icon name="shield" size={12}/> {sensitiveSelected} field sensitif terpilih · audit log akan mencatat ini
            </div>
          )}
        </Group>
      </div>
    </Modal>
  );
}

// =========================================================
// CSDetail — wires up action buttons
// =========================================================
function CSDetail({ t, onOpen, onCopy, onMarkPaid, onSaveNote, showToast }: any) {
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  // Controlled internal note. Previously this was an uncontrolled defaultValue
  // textarea with no save wiring, so anything CS typed vanished on reload.
  const [note, setNote] = useState(t.note || '');
  const [noteSaving, setNoteSaving] = useState(false);

  // Normalize Indonesian WA number: drop non-digits, replace leading 0/8 → 628
  const normalizeWa = (raw: any) => {
    if (!raw) return '';
    let d = (raw + '').replace(/\D/g,'');
    if (d.startsWith('62')) return d;
    if (d.startsWith('0')) return '62' + d.slice(1);
    if (d.startsWith('8')) return '62' + d;
    return d;
  };
  const waNumber = normalizeWa(t.whatsapp);
  const waValid = waNumber.length >= 10 && waNumber.length <= 15;

  // Pre-built message templates
  const templates = (paid: any) => {
    const name = t.anon ? 'Bapak/Ibu' : String(t.donor||'').split(' ')[0];
    const amt = fmtIDR(t.amount);
    const camp = String(t.campaign||'');
    const inv = t.id;
    if (paid) return `Halo ${name}, Alhamdulillah donasi sebesar ${amt} untuk campaign "${camp}" telah kami terima. Kuitansi resmi (${inv}) akan kami kirimkan via email. Jazakallahu khairan atas niat baiknya 🤲 — Tim NIATBAIK.ORG`;
    if (t.status === 'Failed') return `Halo ${name}, kami melihat transaksi donasi ${amt} (${inv}) untuk "${camp}" gagal diproses. Apakah Bapak/Ibu butuh bantuan untuk mencoba ulang? Tim CS NIATBAIK.ORG siap membantu 🙏`;
    return `Halo ${name}, terima kasih sudah berniat baik 🙏\nMohon konfirmasi transfer untuk donasi ${amt} ke campaign "${camp}" (invoice ${inv}). Apakah pembayaran sudah dilakukan?\nKami siap bantu jika ada kendala. — Tim NIATBAIK.ORG`;
  };

  const [waVariant, setWaVariant] = useState('default');
  const [waMessage, setWaMessage] = useState(templates(false));
  useEffect(() => { setWaMessage(templates(waVariant === 'paid')); /* eslint-disable-next-line */ }, [t.id, waVariant]);

  const sendWa = () => {
    if (!waValid) { showToast('Nomor WA tidak valid'); return; }
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
    window.open(url, '_blank', 'noopener');
    setWaOpen(false);
    showToast(`WhatsApp dibuka untuk ${t.whatsapp}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
            {String(t.anon?'HA':(t.donor||'')).split(' ').map((s: any)=>s[0]).join('').slice(0,2)}
          </div>
          <div>
            <div className="font-bold text-ink">{t.anon ? 'Hamba Allah' : t.donor}</div>
            <div className="text-xs text-mute flex flex-wrap items-center gap-x-2">
              <span>{t.email}</span>
              <span>·</span>
              <a href={`tel:${t.whatsapp}`} className="text-brand-600 font-semibold hover:underline">{t.whatsapp}</a>
            </div>
            <div className="mt-1 flex items-center gap-2"><StatusBadge status={t.status}/><SourcePill source={t.utm.source}/></div>
          </div>
        </div>
        <div className="text-right">
          <button onClick={onOpen} className="font-mono text-sm font-bold text-brand-600 hover:underline">{t.id}</button>
          <div className="text-xs text-mute">{t.date}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-bg2 p-3"><div className="text-xs text-mute">Nominal</div><div className="font-bold text-ink">{fmtIDR(t.amount)}</div></div>
        <div className="rounded-lg bg-bg2 p-3"><div className="text-xs text-mute">Metode</div><div className="font-bold text-ink">{t.method}</div></div>
        <div className="rounded-lg bg-bg2 p-3"><div className="text-xs text-mute">utm_source</div><div className="font-bold text-ink">{t.utm.source}</div></div>
        <div className="rounded-lg bg-bg2 p-3"><div className="text-xs text-mute">utm_campaign</div><div className="font-bold text-ink text-xs">{t.utm.campaign}</div></div>
      </div>

      <div>
        <div className="text-xs uppercase font-semibold text-mute mb-1">Campaign</div>
        <div className="text-ink font-semibold">{String(t.campaign||'')}</div>
        <div className="text-xs italic text-mute mt-1">"{String(t.message||'')}"</div>
      </div>

      <div>
        <label className="text-xs uppercase font-semibold text-mute">Catatan CS</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tambahkan catatan internal…" className="field mt-1" rows={3}/>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button onClick={() => { if (onSaveNote) onSaveNote(t, note, setNoteSaving); }} disabled={noteSaving}
            className="px-3 py-1.5 rounded-lg border border-line bg-white text-xs font-bold text-brand-600 hover:bg-brand-50 disabled:opacity-50 inline-flex items-center gap-1.5">
            {noteSaving ? 'Menyimpan…' : 'Simpan catatan'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-line">
        <Btn icon="wa" tone="ok" onClick={() => setWaOpen(true)} disabled={!waValid}>Balas WhatsApp</Btn>
        {t.status !== 'Paid' && (
          <Btn variant="outline" tone="ink" icon="refresh" onClick={() => setConfirmPaid(true)}>Update status → Paid</Btn>
        )}
        {t.status === 'Paid' && (
          <Badge tone="ok" dot>Status Paid</Badge>
        )}
        <Btn variant="outline" tone="ink" icon="eye" onClick={onOpen}>Detail Invoice</Btn>
        <Btn variant="ghost" tone="ink" icon="copy" onClick={() => onCopy(t)}>Salin invoice</Btn>
      </div>

      {/* WhatsApp send modal */}
      <Modal open={waOpen} onClose={() => setWaOpen(false)} size="md"
        title={<span className="flex items-center gap-2"><span className="h-7 w-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center"><Icon name="wa" size={14}/></span>Kirim WhatsApp</span>}
        footer={<>
          <Btn variant="outline" tone="ink" onClick={() => setWaOpen(false)}>Batal</Btn>
          <Btn icon="wa" tone="ok" onClick={sendWa}>Buka WhatsApp</Btn>
        </>}>
        <div className="space-y-4">
          <div className="rounded-xl bg-bg2 p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">
              {String(t.anon?'HA':(t.donor||'')).split(' ').map((s: any)=>s[0]).join('').slice(0,2)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-ink">{t.anon ? 'Hamba Allah' : t.donor}</div>
              <div className="text-xs text-mute font-mono">
                {t.whatsapp} {waValid ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-rose-600 font-bold">⚠ tidak valid</span>}
              </div>
              <div className="text-[10px] text-mute mt-0.5">akan dikirim ke +{waNumber}</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Template Pesan</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v:'default', l:'Follow-up' },
                { v:'paid',    l:'Konfirmasi Paid' },
                { v:'custom',  l:'Tulis sendiri' },
              ].map((o) => (
                <button key={o.v} onClick={() => { setWaVariant(o.v); if (o.v !== 'custom') setWaMessage(templates(o.v === 'paid')); }}
                  className={`px-2 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${waVariant===o.v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink hover:bg-bg2'}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-mute mb-1.5">Pesan</div>
            <textarea
              value={waMessage}
              onChange={(e) => { setWaMessage(e.target.value); setWaVariant('custom'); }}
              rows={6}
              className="field font-medium leading-relaxed"/>
            <div className="text-[10px] text-mute mt-1">{waMessage.length} karakter · akan dibuka di tab baru WhatsApp Web/App</div>
          </div>
        </div>
      </Modal>

      {/* Confirm Paid modal */}
      <Modal open={confirmPaid} onClose={() => setConfirmPaid(false)} size="sm" title="Konfirmasi Update Status"
        footer={<>
          <Btn variant="outline" tone="ink" onClick={() => setConfirmPaid(false)}>Batal</Btn>
          <Btn tone="ok" icon="check" onClick={() => { setConfirmPaid(false); onMarkPaid(t); }}>Tandai Paid</Btn>
        </>}>
        <div className="text-sm text-ink/85">
          Tandai invoice <b className="font-mono text-brand-600">{t.id}</b> sebagai <b className="text-emerald-600">Paid</b>?
        </div>
        <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
          <Icon name="check" size={12} strokeWidth={2.4} className="inline mr-1"/>
          Donatur akan otomatis menerima kuitansi via email & WhatsApp. Webhook ke pixel <b>Purchase</b> akan di-fire.
        </div>
      </Modal>
    </div>
  );
}

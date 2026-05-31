// CS Inbox + Advertiser Dashboard
// Globals: Icon, Card, Badge, StatusBadge, Button, Stat, Input, Select, Toggle,
//          ProgressBar, Avatar, LineChart, Modal, Toast, PageHeader, Field,
//          fmtIDR, fmtIDRShort, fmtShort, fmtNum, fmtPct, useApp, AppCtx

const { useState: uS, useEffect: uE, useMemo: uM } = React;

/* ================================================================== */
/*  Use shared components from components.jsx (loaded before this)     */
/*  Btn, StatCard, SearchInput, SourcePill, Empty, DateRangePill,      */
/*  exportCSV, exportExcel, parseTxnDate, formatRangeLabel             */
/*  are all available as window globals                                */
/* ================================================================== */

/* ================================================================== */
/*  Group / FilterChip — shared by advanced filter modal               */
/* ================================================================== */

function Group({ label, children }) {
  return <div><div className="text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400 mb-2">{label}</div>{children}</div>;
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all inline-flex items-center gap-1.5 ${active ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20 text-brand-700' : 'border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-ink dark:text-slate-100 hover:bg-bg2 dark:hover:bg-slate-800'}`}>
      {active && <Icon name="check" size={11} strokeWidth={3} className="text-brand-600"/>}
      {children}
    </button>
  );
}

/* ================================================================== */
/*  Active Filter Chips Bar                                            */
/* ================================================================== */

function ActiveFilterChips({ adv, onChange }) {
  const chips = [];
  adv.statuses.forEach(s => chips.push({ k:'status:'+s, l:`Status: ${s}`, remove: () => onChange({ ...adv, statuses: adv.statuses.filter(x => x !== s) }) }));
  adv.methods.forEach(m  => chips.push({ k:'mth:'+m,    l:`Metode: ${m}`,  remove: () => onChange({ ...adv, methods:  adv.methods.filter(x => x !== m) }) }));
  adv.sources.forEach(s  => chips.push({ k:'src:'+s,    l:`Source: ${s}`,  remove: () => onChange({ ...adv, sources:  adv.sources.filter(x => x !== s) }) }));
  if (adv.minAmount) chips.push({ k:'min', l:`Min ${fmtIDRShort(+adv.minAmount)}`, remove: () => onChange({ ...adv, minAmount:'' }) });
  if (adv.maxAmount) chips.push({ k:'max', l:`Max ${fmtIDRShort(+adv.maxAmount)}`, remove: () => onChange({ ...adv, maxAmount:'' }) });
  if (adv.range?.start) chips.push({ k:'rng', l:`Tanggal: ${formatRangeLabel(adv.range.start, adv.range.end)}`, remove: () => onChange({ ...adv, range:null }) });
  if (adv.anonOnly)   chips.push({ k:'anon', l:'Hanya anonim', remove: () => onChange({ ...adv, anonOnly:false }) });
  if (adv.hasMessage) chips.push({ k:'msg',  l:'Ada doa/pesan', remove: () => onChange({ ...adv, hasMessage:false }) });
  if (adv.hasNote)    chips.push({ k:'note', l:'Ada catatan CS', remove: () => onChange({ ...adv, hasNote:false }) });

  const EMPTY_ADV = { statuses:[], methods:[], sources:[], minAmount:'', maxAmount:'', range:null, anonOnly:false, hasMessage:false, hasNote:false };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400">Filter aktif:</span>
      {chips.map(c => (
        <span key={c.k} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-100 text-xs font-bold text-brand-700">
          {c.l}
          <button onClick={c.remove} className="hover:text-rose-600"><Icon name="close" size={12} strokeWidth={2.4}/></button>
        </span>
      ))}
      <button onClick={() => onChange(EMPTY_ADV)} className="text-xs font-bold text-rose-600 hover:underline">Reset semua</button>
    </div>
  );
}

/* ================================================================== */
/*  Advanced Filter Modal                                              */
/* ================================================================== */

function AdvFilterModal({ open, onClose, value, onChange, txns }) {
  const [draft, setDraft] = uS(value);
  uE(() => { if (open) setDraft(value); }, [open]);

  const allMethods = uM(() => Array.from(new Set(txns.map(t => t.method))), [txns]);
  const allSources = uM(() => Array.from(new Set(txns.map(t => t.utm?.source || t.utm_source || ''))), [txns]);

  const toggle = (key, item) => {
    const arr = draft[key];
    setDraft({ ...draft, [key]: arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item] });
  };

  const EMPTY_ADV = { statuses:[], methods:[], sources:[], minAmount:'', maxAmount:'', range:null, anonOnly:false, hasMessage:false, hasNote:false };
  const apply = () => { onChange(draft); onClose(); };
  const reset = () => setDraft(EMPTY_ADV);

  return (
    <Modal open={open} onClose={onClose} maxW="max-w-2xl">
      <div className="p-5 border-b border-line dark:border-slate-700 flex items-center justify-between">
        <div className="font-bold text-lg text-ink dark:text-slate-100">Filter Lanjutan</div>
        <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"><Icon name="close" size={16}/></button>
      </div>
      <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
        <Group label="Status">
          <div className="flex flex-wrap gap-2">
            {['Paid','Pending','Failed'].map(s => (
              <FilterChip key={s} active={draft.statuses.includes(s)} onClick={() => toggle('statuses', s)}>
                <StatusBadge status={s}/>
              </FilterChip>
            ))}
          </div>
        </Group>

        <Group label="Metode Pembayaran">
          <div className="flex flex-wrap gap-2">
            {allMethods.map(m => (
              <FilterChip key={m} active={draft.methods.includes(m)} onClick={() => toggle('methods', m)}>{m}</FilterChip>
            ))}
          </div>
        </Group>

        <Group label="Sumber Traffic (utm_source)">
          <div className="flex flex-wrap gap-2">
            {allSources.filter(Boolean).map(s => (
              <FilterChip key={s} active={draft.sources.includes(s)} onClick={() => toggle('sources', s)}>
                <SourcePill source={s}/>
              </FilterChip>
            ))}
          </div>
        </Group>

        <Group label="Rentang Nominal">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted dark:text-slate-400">Minimum</label>
              <div className="mt-1 flex items-center rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-brand-600">
                <span className="pl-3 text-muted dark:text-slate-400 text-sm">Rp</span>
                <input type="number" value={draft.minAmount} onChange={e => setDraft({ ...draft, minAmount: e.target.value })} className="flex-1 px-2 py-2 outline-none text-sm bg-transparent"/>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted dark:text-slate-400">Maximum</label>
              <div className="mt-1 flex items-center rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-brand-600">
                <span className="pl-3 text-muted dark:text-slate-400 text-sm">Rp</span>
                <input type="number" value={draft.maxAmount} onChange={e => setDraft({ ...draft, maxAmount: e.target.value })} className="flex-1 px-2 py-2 outline-none text-sm bg-transparent"/>
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              { l:'≤ 100K', min:'', max:'100000' },
              { l:'100K–500K', min:'100000', max:'500000' },
              { l:'500K–1jt', min:'500000', max:'1000000' },
              { l:'≥ 1jt', min:'1000000', max:'' },
            ].map(p => (
              <button key={p.l} onClick={() => setDraft({ ...draft, minAmount:p.min, maxAmount:p.max })}
                className="px-2.5 py-1 rounded-full bg-bg2 dark:bg-slate-950 hover:bg-brand-50 hover:text-brand-700 text-xs font-bold text-ink/80 dark:text-slate-300 border border-line dark:border-slate-700">
                {p.l}
              </button>
            ))}
          </div>
        </Group>

        <Group label="Rentang Tanggal">
          <DateRangePill value={draft.range} onChange={r => setDraft({ ...draft, range: r })} label={draft.range?.start ? undefined : 'Pilih tanggal'}/>
        </Group>

        <Group label="Atribut Donasi">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Toggle checked={draft.anonOnly}   onChange={() => setDraft({ ...draft, anonOnly:!draft.anonOnly })}     label="Hanya donasi anonim"/>
            <Toggle checked={draft.hasMessage}  onChange={() => setDraft({ ...draft, hasMessage:!draft.hasMessage })} label="Punya doa/pesan"/>
            <Toggle checked={draft.hasNote}     onChange={() => setDraft({ ...draft, hasNote:!draft.hasNote })}       label="Punya catatan CS"/>
          </div>
        </Group>
      </div>
      <div className="p-4 border-t border-line dark:border-slate-700 flex items-center gap-2 justify-end">
        <button onClick={reset} className="mr-auto text-sm font-bold text-rose-600 hover:underline">Reset semua</button>
        <Btn variant="outline" tone="ink" onClick={onClose}>Batal</Btn>
        <Btn icon="filter" onClick={apply}>Terapkan Filter</Btn>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/*  Export Modal (CS-safe limited fields)                               */
/* ================================================================== */

function ExportLimitedModal({ open, onClose, rows, showToast }) {
  const ALL_FIELDS = [
    { k:'invoice',      l:'Kode invoice',       always: true },
    { k:'tanggal',      l:'Tanggal',            always: true },
    { k:'donatur',      l:'Nama donatur',       default: true },
    { k:'campaign',     l:'Campaign',           default: true },
    { k:'nominal',      l:'Nominal',            default: true },
    { k:'status',       l:'Status',             default: true },
    { k:'whatsapp',     l:'No. WhatsApp',       sensitive: true },
    { k:'email',        l:'Email',              sensitive: true },
    { k:'metode',       l:'Metode pembayaran',  sensitive: true },
    { k:'utm_source',   l:'Source iklan',       default: true },
    { k:'utm_campaign', l:'UTM campaign',       default: true },
    { k:'utm_content',  l:'UTM content' },
    { k:'utm_id',       l:'UTM id' },
    { k:'pesan',        l:'Doa / pesan donatur' },
    { k:'note',         l:'Catatan CS' },
  ];

  const [fields, setFields] = uS(() => {
    const obj = {};
    ALL_FIELDS.forEach(f => obj[f.k] = !!(f.always || f.default));
    return obj;
  });
  const [format, setFormat] = uS('csv');
  const [limit, setLimit]   = uS('filtered');

  const buildRows = () => {
    let src = rows;
    if (limit !== 'filtered') src = rows.slice(0, +limit);
    return src.map(t => {
      const r = {};
      const utm = t.utm || {};
      ALL_FIELDS.forEach(f => {
        if (!fields[f.k]) return;
        switch (f.k) {
          case 'invoice':      r[f.l] = t.id; break;
          case 'tanggal':      r[f.l] = t.date; break;
          case 'donatur':      r[f.l] = t.anon ? 'Hamba Allah' : t.donor; break;
          case 'campaign':     r[f.l] = t.campaign; break;
          case 'nominal':      r[f.l] = t.amount; break;
          case 'status':       r[f.l] = t.status; break;
          case 'whatsapp':     r[f.l] = t.whatsapp || t.phone || ''; break;
          case 'email':        r[f.l] = t.email; break;
          case 'metode':       r[f.l] = t.method; break;
          case 'utm_source':   r[f.l] = utm.source || t.utm_source || ''; break;
          case 'utm_campaign': r[f.l] = utm.campaign || t.utm_campaign || ''; break;
          case 'utm_content':  r[f.l] = utm.content || ''; break;
          case 'utm_id':       r[f.l] = utm.id || ''; break;
          case 'pesan':        r[f.l] = t.message || t.prayer || ''; break;
          case 'note':         r[f.l] = t.note || ''; break;
        }
      });
      return r;
    });
  };

  const doExport = () => {
    const out = buildRows();
    if (!out.length) { showToast('Tidak ada data untuk diekspor'); return; }
    if (format === 'csv') exportCSV(out, 'cs_inbox');
    else exportExcel(out, 'cs_inbox', null, 'CS Inbox');
    showToast(`${out.length} baris diekspor sebagai ${format.toUpperCase()}`);
    onClose();
  };

  const selectedCount = Object.values(fields).filter(Boolean).length;
  const sensitiveSelected = ALL_FIELDS.filter(f => f.sensitive && fields[f.k]).length;

  return (
    <Modal open={open} onClose={onClose} maxW="max-w-2xl">
      <div className="p-5 border-b border-line dark:border-slate-700 flex items-center justify-between">
        <div className="font-bold text-lg text-ink dark:text-slate-100">Export Data CS (Terbatas)</div>
        <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"><Icon name="close" size={16}/></button>
      </div>
      <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-xs dark:bg-amber-900/20 dark:border-amber-800">
          <Icon name="shield" size={14} className="text-amber-600 mt-0.5 shrink-0"/>
          <div className="text-amber-800 dark:text-amber-200">
            <b>Export terbatas</b> berarti data sensitif (no. WA, email, metode pembayaran) <b>opt-in saja</b>.
            Aktivitas export dicatat di Activity Log dan dapat diaudit Admin.
          </div>
        </div>

        <Group label="Format File">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v:'csv', l:'CSV', sub:'Universal · Excel/Google Sheets' },
              { v:'xls', l:'Excel (XLS)', sub:'Header bold + warna brand' },
            ].map(o => (
              <button key={o.v} onClick={() => setFormat(o.v)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${format===o.v ? 'border-brand-600 bg-brand-50' : 'border-line dark:border-slate-700 hover:bg-bg2 dark:hover:bg-slate-800'}`}>
                <Icon name="download" size={16} className={format===o.v ? 'text-brand-600' : 'text-muted dark:text-slate-400'}/>
                <div className={`mt-1.5 font-extrabold text-sm ${format===o.v ? 'text-brand-700' : 'text-ink dark:text-slate-100'}`}>{o.l}</div>
                <div className="text-[10px] text-muted dark:text-slate-400 mt-0.5">{o.sub}</div>
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
            ].map(o => (
              <button key={o.v} onClick={() => setLimit(o.v)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold ${limit==o.v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line dark:border-slate-700 text-ink dark:text-slate-100 hover:bg-bg2 dark:hover:bg-slate-800'}`}>
                {o.l}
              </button>
            ))}
          </div>
        </Group>

        <Group label="Field yang Disertakan">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ALL_FIELDS.map(f => (
              <label key={f.k}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${fields[f.k] ? (f.sensitive ? 'border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-900/20' : 'border-brand-100 bg-brand-50/40') : 'border-line dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-bg2 dark:hover:bg-slate-800'} ${f.always ? 'opacity-70 cursor-not-allowed' : ''}`}>
                <input type="checkbox"
                  checked={fields[f.k]}
                  disabled={f.always}
                  onChange={e => setFields({ ...fields, [f.k]: e.target.checked })}
                  className="rounded border-line dark:border-slate-700 h-4 w-4 accent-brand-600"/>
                <span className="text-sm font-semibold text-ink dark:text-slate-100 flex-1">{f.l}</span>
                {f.always && <Badge tone="slate" size="sm">wajib</Badge>}
                {f.sensitive && <Badge tone="amber" size="sm">sensitif</Badge>}
              </label>
            ))}
          </div>
          {sensitiveSelected > 0 && (
            <div className="mt-2 text-xs text-amber-700 font-semibold flex items-center gap-1.5 dark:text-amber-300">
              <Icon name="shield" size={12}/> {sensitiveSelected} field sensitif terpilih
            </div>
          )}
        </Group>
      </div>
      <div className="p-4 border-t border-line dark:border-slate-700 flex items-center gap-2 justify-end">
        <div className="mr-auto text-xs text-muted dark:text-slate-400">{selectedCount} field · {limit === 'filtered' ? rows.length : Math.min(rows.length, +limit)} baris</div>
        <Btn variant="outline" tone="ink" onClick={onClose}>Batal</Btn>
        <Btn icon="download" onClick={doExport}>Download {format === 'csv' ? 'CSV' : 'Excel'}</Btn>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/*  CS Detail panel — right side of inbox                              */
/* ================================================================== */

function CSDetail({ t, onOpen, onCopy, onMarkPaid, showToast }) {
  const [confirmPaid, setConfirmPaid] = uS(false);
  const [waOpen, setWaOpen] = uS(false);
  const [noteVal, setNoteVal] = uS(t.note || '');
  const [noteSaving, setNoteSaving] = uS(false);

  uE(() => { setNoteVal(t.note || ''); }, [t.id]);

  const normalizeWa = (raw) => {
    if (!raw) return '';
    let d = (raw + '').replace(/\D/g, '');
    if (d.startsWith('62')) return d;
    if (d.startsWith('0')) return '62' + d.slice(1);
    if (d.startsWith('8')) return '62' + d;
    return d;
  };
  const waNumber = normalizeWa(t.whatsapp || t.phone);
  const waValid = waNumber.length >= 10 && waNumber.length <= 15;

  const templates = (paid) => {
    const name = t.anon ? 'Bapak/Ibu' : (t.donor || '').split(' ')[0];
    const amt = fmtIDR(t.amount);
    const camp = t.campaign;
    const inv = t.id;
    if (paid) return `Halo ${name}, Alhamdulillah donasi sebesar ${amt} untuk campaign "${camp}" telah kami terima. Kuitansi resmi (${inv}) akan kami kirimkan via email. Jazakallahu khairan atas niat baiknya — Tim NIATBAIK.ORG`;
    if (t.status === 'Failed') return `Halo ${name}, kami melihat transaksi donasi ${amt} (${inv}) untuk "${camp}" gagal diproses. Apakah Bapak/Ibu butuh bantuan untuk mencoba ulang? Tim CS NIATBAIK.ORG siap membantu.`;
    return `Halo ${name}, terima kasih sudah berniat baik.\nMohon konfirmasi transfer untuk donasi ${amt} ke campaign "${camp}" (invoice ${inv}). Apakah pembayaran sudah dilakukan?\nKami siap bantu jika ada kendala. — Tim NIATBAIK.ORG`;
  };

  const [waVariant, setWaVariant] = uS('default');
  const [waMessage, setWaMessage] = uS(templates(false));
  uE(() => { setWaMessage(templates(waVariant === 'paid')); }, [t.id, waVariant]);

  const sendWa = () => {
    if (!waValid) { showToast('Nomor WA tidak valid'); return; }
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
    window.open(url, '_blank', 'noopener');
    setWaOpen(false);
    showToast(`WhatsApp dibuka untuk ${t.whatsapp || t.phone}`);
  };

  const saveNote = async () => {
    setNoteSaving(true);
    try { await api.addInvoiceNote(t.uid || t.id, noteVal); showToast('Catatan disimpan'); }
    catch(e) { console.error(e); showToast('Gagal menyimpan catatan'); }
    setNoteSaving(false);
  };

  const utmSource = t.utm?.source || t.utm_source || '';
  const utmCampaign = t.utm?.campaign || t.utm_campaign || '';
  const utmContent = t.utm?.content || '';
  const utmId = t.utm?.id || '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-line dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Avatar name={t.donor} initials={(t.anon?'HA':t.donor).split(' ').map(s=>s[0]).join('').slice(0,2)} anon={t.anon} size={48}/>
          <div>
            <div className="font-bold text-ink dark:text-slate-100">{t.anon ? 'Hamba Allah' : t.donor}</div>
            <div className="text-xs text-muted dark:text-slate-400 flex flex-wrap items-center gap-x-2">
              <span>{t.email}</span>
              <span>·</span>
              <a href={`tel:${t.whatsapp||t.phone}`} className="text-brand-600 font-semibold hover:underline">{t.whatsapp||t.phone}</a>
            </div>
            <div className="mt-1 flex items-center gap-2"><StatusBadge status={t.status}/>{utmSource && <SourcePill source={utmSource}/>}</div>
          </div>
        </div>
        <div className="text-right">
          <button onClick={onOpen} className="font-mono text-sm font-bold text-brand-600 hover:underline">{t.id}</button>
          <div className="text-xs text-muted dark:text-slate-400">{t.date}</div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-bg2 dark:bg-slate-800/40 p-3"><div className="text-xs text-muted dark:text-slate-400">Nominal</div><div className="font-bold text-ink dark:text-slate-100 tnum">{fmtIDR(t.amount)}</div></div>
        <div className="rounded-lg bg-bg2 dark:bg-slate-800/40 p-3"><div className="text-xs text-muted dark:text-slate-400">Metode</div><div className="font-bold text-ink dark:text-slate-100">{t.method}</div></div>
        <div className="rounded-lg bg-bg2 dark:bg-slate-800/40 p-3"><div className="text-xs text-muted dark:text-slate-400">utm_source</div><div className="font-bold text-ink dark:text-slate-100">{utmSource}</div></div>
        <div className="rounded-lg bg-bg2 dark:bg-slate-800/40 p-3"><div className="text-xs text-muted dark:text-slate-400">utm_campaign</div><div className="font-bold text-ink dark:text-slate-100 text-xs">{utmCampaign}</div></div>
      </div>

      {/* UTM detail grid */}
      {(utmContent || utmId) && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {utmContent && <div className="surface-2 rounded-lg px-2.5 py-1.5 dark:bg-slate-800/60"><div className="font-mono text-[10px] text-muted dark:text-slate-400">utm_content</div><div className="font-semibold text-ink dark:text-slate-100 truncate">{utmContent}</div></div>}
          {utmId && <div className="surface-2 rounded-lg px-2.5 py-1.5 dark:bg-slate-800/60"><div className="font-mono text-[10px] text-muted dark:text-slate-400">click_id</div><div className="font-semibold text-ink dark:text-slate-100 truncate">{utmId}</div></div>}
        </div>
      )}

      {/* Campaign + message */}
      <div>
        <div className="text-xs uppercase font-semibold text-muted dark:text-slate-400 mb-1">Campaign</div>
        <div className="text-ink dark:text-slate-100 font-semibold">{t.campaign}</div>
        {(t.message && t.message !== '-') && <div className="text-xs italic text-muted dark:text-slate-400 mt-1">"{t.message}"</div>}
      </div>

      {/* Conversation thread */}
      <div className="rounded-xl border border-line dark:border-slate-700 bg-bg2/60 dark:bg-slate-800/30 p-4 space-y-3">
        <div className="text-xs uppercase font-semibold text-muted dark:text-slate-400">Riwayat Komunikasi</div>
        <div className="flex gap-2">
          <div className="h-7 w-7 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0"><Icon name="wa" size={14}/></div>
          <div className="flex-1">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl rounded-tl-md px-3 py-2 inline-block max-w-md text-sm text-ink dark:text-slate-100">
              Halo, Kak. Terima kasih sudah berniat baik. Mohon konfirmasi transfer untuk donasi {fmtIDR(t.amount)} ke campaign "{(t.campaign||'').slice(0,40)}...". Apakah pembayaran sudah dilakukan?
            </div>
            <div className="text-[10px] text-muted dark:text-slate-400 mt-0.5">CS · 14:24</div>
          </div>
        </div>
        <div className="flex gap-2 flex-row-reverse">
          <div className="h-7 w-7 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">{(t.anon?'H':(t.donor||'D')[0])}</div>
          <div className="flex-1 text-right">
            <div className="bg-white dark:bg-slate-800 border border-line dark:border-slate-700 rounded-2xl rounded-tr-md px-3 py-2 inline-block max-w-md text-sm text-left text-ink dark:text-slate-100">
              Sudah saya transfer kak via BCA. Mohon dicek ya.
            </div>
            <div className="text-[10px] text-muted dark:text-slate-400 mt-0.5">Donatur · 14:31</div>
          </div>
        </div>
      </div>

      {/* CS Note */}
      <div>
        <label className="text-xs uppercase font-semibold text-muted dark:text-slate-400">Catatan CS</label>
        <textarea value={noteVal} onChange={e => setNoteVal(e.target.value)} placeholder="Tambahkan catatan internal..." className="w-full mt-1 px-3.5 py-3 rounded-xl bg-white border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 dark:bg-slate-900 dark:border-slate-700 resize-none" rows="2"/>
        {noteVal !== (t.note||'') && (
          <button onClick={saveNote} disabled={noteSaving} className="mt-1 text-xs font-bold text-brand-600 hover:underline disabled:opacity-50">
            {noteSaving ? 'Menyimpan...' : 'Simpan catatan'}
          </button>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="slate">Sudah dihubungi WA</Badge>
          <Badge tone="slate">Menunggu transfer</Badge>
          <Badge tone="slate">Donasi berulang</Badge>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-line dark:border-slate-700">
        <Btn icon="wa" tone="ok" onClick={() => setWaOpen(true)} disabled={!waValid}>Balas WhatsApp</Btn>
        {t.status !== 'Paid' && t.status !== 'Sukses' && (
          <Btn variant="outline" tone="ink" icon="refresh" onClick={() => setConfirmPaid(true)}>Mark as Paid</Btn>
        )}
        {(t.status === 'Paid' || t.status === 'Sukses') && (
          <Badge tone="green" dot>Status Paid</Badge>
        )}
        <Btn variant="outline" tone="ink" icon="eye" onClick={onOpen}>Detail Invoice</Btn>
        <Btn variant="ghost" tone="ink" icon="copy" onClick={() => onCopy(t)}>Salin invoice</Btn>
      </div>

      {/* WhatsApp send modal */}
      <Modal open={waOpen} onClose={() => setWaOpen(false)} maxW="max-w-lg">
        <div className="p-5 border-b border-line dark:border-slate-700">
          <div className="flex items-center gap-2 font-bold text-ink dark:text-slate-100">
            <span className="h-7 w-7 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center"><Icon name="wa" size={14}/></span>
            Kirim WhatsApp
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-bg2 dark:bg-slate-800/40 p-3 flex items-center gap-3">
            <Avatar name={t.donor} initials={(t.anon?'HA':t.donor).split(' ').map(s=>s[0]).join('').slice(0,2)} anon={t.anon} size={40}/>
            <div className="flex-1">
              <div className="text-sm font-bold text-ink dark:text-slate-100">{t.anon ? 'Hamba Allah' : t.donor}</div>
              <div className="text-xs text-muted dark:text-slate-400 font-mono">
                {t.whatsapp||t.phone} {waValid ? <span className="text-emerald-600 font-bold">OK</span> : <span className="text-rose-600 font-bold">tidak valid</span>}
              </div>
              <div className="text-[10px] text-muted dark:text-slate-400 mt-0.5">akan dikirim ke +{waNumber}</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400 mb-2">Template Pesan</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v:'default', l:'Follow-up' },
                { v:'paid',    l:'Konfirmasi Paid' },
                { v:'custom',  l:'Tulis sendiri' },
              ].map(o => (
                <button key={o.v} onClick={() => { setWaVariant(o.v); if (o.v !== 'custom') setWaMessage(templates(o.v === 'paid')); }}
                  className={`px-2 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${waVariant===o.v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line dark:border-slate-700 text-ink dark:text-slate-100 hover:bg-bg2 dark:hover:bg-slate-800'}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400 mb-1.5">Pesan</div>
            <textarea
              value={waMessage}
              onChange={e => { setWaMessage(e.target.value); setWaVariant('custom'); }}
              rows={6}
              className="w-full px-3.5 py-3 rounded-xl bg-white border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 dark:bg-slate-900 dark:border-slate-700 font-medium leading-relaxed resize-none"/>
            <div className="text-[10px] text-muted dark:text-slate-400 mt-1">{waMessage.length} karakter · akan dibuka di tab baru WhatsApp Web/App</div>
          </div>
        </div>
        <div className="p-4 border-t border-line dark:border-slate-700 flex items-center gap-2 justify-end">
          <Btn variant="outline" tone="ink" onClick={() => setWaOpen(false)}>Batal</Btn>
          <Btn icon="wa" tone="ok" onClick={sendWa}>Buka WhatsApp</Btn>
        </div>
      </Modal>

      {/* Confirm Paid modal */}
      <Modal open={confirmPaid} onClose={() => setConfirmPaid(false)} maxW="max-w-sm">
        <div className="p-5 border-b border-line dark:border-slate-700 font-bold text-ink dark:text-slate-100">Konfirmasi Update Status</div>
        <div className="p-5">
          <div className="text-sm text-ink/85 dark:text-slate-200">
            Tandai invoice <b className="font-mono text-brand-600">{t.id}</b> sebagai <b className="text-emerald-600">Paid</b>?
          </div>
          <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-200">
            <Icon name="check" size={12} strokeWidth={2.4} className="inline mr-1"/>
            Donatur akan otomatis menerima kuitansi via email & WhatsApp. Webhook ke pixel <b>Purchase</b> akan di-fire.
          </div>
        </div>
        <div className="p-4 border-t border-line dark:border-slate-700 flex items-center gap-2 justify-end">
          <Btn variant="outline" tone="ink" onClick={() => setConfirmPaid(false)}>Batal</Btn>
          <Btn tone="ok" icon="check" onClick={() => { setConfirmPaid(false); onMarkPaid(t); }}>Tandai Paid</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ================================================================== */
/*  CsInbox — main CS page                                            */
/* ================================================================== */

function CsInbox() {
  const { openInvoice, showToast: appToast } = useApp();
  const showToast = appToast || ((msg) => console.log('[toast]', msg));

  // Backend uses Indonesian status labels; normalize them to the canonical
  // UI buckets the filters / badges / stat cards expect.
  const normalizeStatus = (s) => {
    const v = (s || '').toLowerCase();
    if (v === 'terbayar' || v === 'sukses' || v === 'paid') return 'Paid';
    if (v === 'gagal' || v === 'failed' || v === 'expired' || v === 'kadaluarsa') return 'Failed';
    if (v === 'pending' || v === 'menunggu pembayaran' || v === 'menunggu') return 'Pending';
    return s || 'Pending';
  };

  const seedTxns = window.TRANSACTIONS || [];
  const [txns, setTxns] = uS(() => seedTxns.map(t => ({ ...t })));
  const [filter, setFilter] = uS('all');
  const [search, setSearch] = uS('');
  const [selected, setSelected] = uS(txns[1] || txns[0] || null);
  const [advFilterOpen, setAdvFilterOpen] = uS(false);
  const [exportOpen, setExportOpen] = uS(false);
  const [page, setPage] = uS(1);
  const PER_PAGE = 30;

  // Advanced filter state
  const EMPTY_ADV = { statuses:[], methods:[], sources:[], minAmount:'', maxAmount:'', range:null, anonOnly:false, hasMessage:false, hasNote:false };
  const [adv, setAdv] = uS(EMPTY_ADV);

  // Load from API
  uE(() => {
    api.invoices('limit=100&sort=created_at desc').then(r => {
      if (r?.data && r.data.length > 0) {
        const mapped = r.data.map(inv => ({
          uid: inv.id,                                  // real UUID — used for API calls
          id: inv.invoice_number || inv.id,             // human invoice code — used for display
          donor: inv.donor_name || 'Hamba Allah',
          anon: inv.is_anonymous || false,
          campaign: inv.campaign_title || '',
          campaignId: inv.campaign_id || '',
          amount: inv.amount || 0,
          method: inv.payment_method || '',
          status: normalizeStatus(inv.status),
          rawStatus: inv.status || '',
          date: inv.created_at ? new Date(inv.created_at).toLocaleString('id-ID') : '',
          ts: inv.created_at || Date.now(),
          whatsapp: inv.donor_phone || '',
          phone: inv.donor_phone || '',
          email: inv.donor_email || '',
          message: inv.message || '',
          note: inv.cs_note || '',
          utm: {
            source: inv.utm_source || '',
            medium: inv.utm_medium || '',
            campaign: inv.utm_campaign || '',
            content: inv.utm_content || '',
            id: inv.utm_id || inv.click_id || '',
          },
          utm_source: inv.utm_source || '',
          utm_medium: inv.utm_medium || '',
          utm_campaign: inv.utm_campaign || '',
        }));
        setTxns(mapped);
        setSelected(mapped[1] || mapped[0]);
      }
    }).catch(() => {});
  }, []);

  const activeAdvCount = uM(() => {
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

  const filtered = uM(() => txns.filter(t => {
    if (filter === 'pending' && t.status !== 'Pending') return false;
    if (filter === 'failed'  && t.status !== 'Failed')  return false;
    if (filter === 'paid'    && t.status !== 'Paid' && t.status !== 'Sukses') return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = (t.donor + t.id + t.campaign + (t.whatsapp||t.phone||'') + t.email).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (adv.statuses.length && !adv.statuses.includes(t.status)) return false;
    if (adv.methods.length  && !adv.methods.includes(t.method))  return false;
    const src = t.utm?.source || t.utm_source || '';
    if (adv.sources.length  && !adv.sources.includes(src)) return false;
    if (adv.minAmount && t.amount < +adv.minAmount) return false;
    if (adv.maxAmount && t.amount > +adv.maxAmount) return false;
    if (adv.anonOnly && !t.anon) return false;
    if (adv.hasMessage && (!t.message || t.message === '-')) return false;
    if (adv.hasNote && !t.note) return false;
    if (adv.range?.start) {
      const d = parseTxnDate(t.date) || parseTxnDate(t.ts);
      if (d) {
        const s = new Date(adv.range.start); s.setHours(0,0,0,0);
        const e = new Date(adv.range.end || adv.range.start); e.setHours(23,59,59,999);
        if (d < s || d > e) return false;
      }
    }
    return true;
  }), [filter, search, adv, txns]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const updateStatusToPaid = (t) => {
    setTxns(prev => prev.map(x => x.id === t.id ? { ...x, status: 'Paid', rawStatus: 'Terbayar' } : x));
    setSelected(prev => prev && prev.id === t.id ? { ...prev, status: 'Paid', rawStatus: 'Terbayar' } : prev);
    // Backend validates oneof=Sukses Pending Gagal Terbayar and keys off the
    // UUID, so send "Terbayar" against t.uid (fall back to t.id for seed data).
    api.updateInvoiceStatus(t.uid || t.id, 'Terbayar')
      .then(r => {
        if (r && r.success === false) {
          showToast('Gagal memperbarui status di server');
        } else {
          showToast(`Invoice ${t.id} -> Paid`);
        }
      })
      .catch(() => showToast('Gagal memperbarui status di server'));
  };

  const copyInvoice = (t) => {
    navigator.clipboard?.writeText(t.id);
    showToast('Invoice ' + t.id + ' disalin');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="CS Inbox"
        subtitle="Pusat follow-up donatur & manajemen invoice."
        actions={<>
          <button onClick={() => setAdvFilterOpen(true)}
            className={`inline-flex items-center gap-2 h-10 px-3 rounded-lg border text-sm font-semibold transition-colors ${activeAdvCount > 0 ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/30' : 'border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-ink dark:text-slate-100 hover:bg-bg2 dark:hover:bg-slate-800'}`}>
            <Icon name="filter" size={14}/>
            Filter Lanjutan
            {activeAdvCount > 0 && <span className="h-5 min-w-[20px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">{activeAdvCount}</span>}
          </button>
          <Btn variant="outline" tone="ink" icon="download" onClick={() => setExportOpen(true)}>Export</Btn>
        </>}
      />

      {/* Active filter chips */}
      {activeAdvCount > 0 && <ActiveFilterChips adv={adv} onChange={setAdv}/>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="inbox"  label="Total hasil filter" value={fmtNum(filtered.length)} accent="brand" sub={`dari ${fmtNum(txns.length)} transaksi`}/>
        <StatCard icon="bolt"   label="Menunggu follow-up" value={fmtNum(txns.filter(t=>t.status==='Pending').length)} accent="warn"/>
        <StatCard icon="close"  label="Pembayaran gagal"   value={fmtNum(txns.filter(t=>t.status==='Failed'||t.status==='Gagal').length)} accent="bad"/>
        <StatCard icon="check"  label="Selesai bulan ini"  value={fmtNum(txns.filter(t=>t.status==='Paid'||t.status==='Sukses').length)} accent="ok"/>
      </div>

      {/* Main layout: list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: transaction list */}
        <Card className="lg:col-span-1" padded={false}>
          <div className="flex flex-col max-h-[70vh] overflow-hidden">
            <div className="p-4 border-b border-line dark:border-slate-700 space-y-2 shrink-0">
              <SearchInput placeholder="Cari donatur / invoice / WA..." value={search} onChange={setSearch}/>
              <div className="inline-flex p-1 bg-bg2 dark:bg-slate-800 rounded-lg border border-line dark:border-slate-700 w-full">
                {[
                  {v:'all', l:'Semua'},
                  {v:'pending', l:'Pending'},
                  {v:'paid', l:'Paid'},
                  {v:'failed', l:'Failed'},
                ].map(o => (
                  <button key={o.v} onClick={() => { setFilter(o.v); setPage(1); }}
                    className={`flex-1 px-2 py-1 text-xs font-bold rounded-md transition ${filter===o.v ? 'bg-white dark:bg-slate-700 text-ink dark:text-slate-100 shadow-sm' : 'text-muted'}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-line dark:divide-slate-700">
              {paged.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted dark:text-slate-400">Tidak ada transaksi sesuai filter.</div>
              ) : paged.map(t => (
                <button key={t.id} onClick={() => setSelected(t)}
                  className={`w-full text-left p-3 hover:bg-bg2 dark:hover:bg-slate-800/50 transition ${selected?.id === t.id ? 'bg-brand-50/40 dark:bg-brand-900/30 border-l-4 border-brand-600' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={t.donor} initials={(t.anon?'HA':t.donor).split(' ').map(s=>s[0]).join('').slice(0,2)} anon={t.anon} size={36}/>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-ink dark:text-slate-100 truncate">{t.anon ? 'Hamba Allah' : t.donor}</div>
                        <div className="text-[11px] text-muted dark:text-slate-400 font-mono">{t.id}</div>
                      </div>
                    </div>
                    <StatusBadge status={t.status}/>
                  </div>
                  <div className="mt-1.5 text-xs text-muted dark:text-slate-400 line-clamp-1">{t.campaign}</div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-600 tnum">{fmtIDR(t.amount)}</span>
                    <span className="text-muted dark:text-slate-400">{(t.date||'').split(',')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-line dark:border-slate-700 flex items-center justify-between text-xs text-muted dark:text-slate-400 shrink-0">
                <span>{(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} dari {filtered.length}</span>
                <div className="flex gap-1">
                  <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="h-7 w-7 rounded-lg border border-line dark:border-slate-700 flex items-center justify-center disabled:opacity-30"><Icon name="chevronL" size={12}/></button>
                  {Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
                    <button key={p} onClick={() => setPage(p)} className={`h-7 px-2 rounded-lg text-xs font-bold ${p===page?'bg-brand-600 text-white':'border border-line dark:border-slate-700'}`}>{p}</button>
                  ))}
                  <button disabled={page>=totalPages} onClick={() => setPage(p=>p+1)} className="h-7 w-7 rounded-lg border border-line dark:border-slate-700 flex items-center justify-center disabled:opacity-30"><Icon name="chevronR" size={12}/></button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Right: detail */}
        <Card className="lg:col-span-2">
          {selected
            ? <CSDetail t={selected} onOpen={() => openInvoice?.(selected)} onCopy={copyInvoice} onMarkPaid={updateStatusToPaid} showToast={showToast}/>
            : <Empty title="Pilih percakapan" sub="Pilih donatur di sebelah kiri."/>}
        </Card>
      </div>

      <AdvFilterModal open={advFilterOpen} onClose={() => setAdvFilterOpen(false)} value={adv} onChange={setAdv} txns={txns}/>
      <ExportLimitedModal open={exportOpen} onClose={() => setExportOpen(false)} rows={filtered} showToast={showToast}/>
    </div>
  );
}

/* ================================================================== */
/*  AdvertiserDashboard                                                */
/* ================================================================== */

function AdvertiserDashboard() {
  const { showToast: appToast } = useApp();
  const showToast = appToast || ((msg) => console.log('[toast]', msg));

  const seedTraffic = window.TRAFFIC_SOURCES || [];
  const seedCampaigns = window.CAMPAIGNS || [];
  const seedDaily = window.DAILY || window.DAILY_DONATIONS || [];

  const [costInputs, setCostInputs] = uS({ meta: 92_400_000, google: 58_300_000, tiktok: 41_800_000 });
  const [advOverview, setAdvOverview] = uS(null);
  const [traffic, setTraffic] = uS(seedTraffic);
  const [chartData, setChartData] = uS(seedDaily);
  const [costSaving, setCostSaving] = uS(false);

  uE(() => {
    api.analyticsOverview?.().then(r => r?.data && setAdvOverview(r.data)).catch(() => {});
    api.analyticsTraffic?.().then(r => { if (r?.data && r.data.length > 0) setTraffic(r.data); }).catch(() => {});
    api.adCosts?.().then(r => {
      if (r?.data) {
        const c = r.data;
        setCostInputs({
          meta: c.meta || costInputs.meta,
          google: c.google || costInputs.google,
          tiktok: c.tiktok || costInputs.tiktok,
        });
      }
    }).catch(() => {});
    // chart data
    api.dailyChart?.(30).then(r => {
      if (r?.data) setChartData(r.data.map(d => ({ date: new Date(d.date), amount: d.amount, count: d.count })));
    }).catch(() => {});
  }, []);

  const totalVisitor = advOverview?.total_visitor || traffic.reduce((s,x)=>s+x.visits, 0);
  const totalLeads = advOverview?.total_leads || traffic.reduce((s,x)=>s+x.leads, 0);
  const totalDonations = advOverview?.total_donations || traffic.reduce((s,x)=>s+x.donations, 0);
  const totalSpend = advOverview?.total_spend || traffic.reduce((s,x)=>s+x.spend, 0);
  const totalRevenue = advOverview?.total_revenue || (window.TOTAL_RAISED || totalDonations * 285_000);
  const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(1) : '0';

  const saveCosts = async () => {
    setCostSaving(true);
    try {
      await api.createAdCost?.(costInputs);
      showToast('Spend disimpan, ROAS dihitung ulang');
    } catch(e) { showToast('Gagal menyimpan'); }
    setCostSaving(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard Advertiser"
        subtitle="Pantau performa iklan, UTM, pixel & rekomendasi optimasi."
        actions={<>
          <Btn variant="outline" tone="ink" icon="download">Export</Btn>
        </>}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="eye"    label="Visitor Iklan" value={fmtNum(totalVisitor)} delta="+22.4%" accent="brand"/>
        <StatCard icon="target" label="Lead Tertangkap" value={fmtNum(totalLeads)} delta="+18%" accent="sky"/>
        <StatCard icon="heart"  label="Donasi via Ads" value={fmtNum(totalDonations)} delta="+9.8%" accent="ok"/>
        <StatCard icon="sparkle" label="ROAS Gabungan" value={roas + 'x'} delta="+0.3x" accent="warn"/>
      </div>

      {/* Per-platform performance cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {traffic.filter(t => t.name !== 'Organic' && t.src !== 'Organic').map(t => {
          const name = t.name || t.src || '';
          const cpd = Math.round((t.spend || 0) / Math.max(1, t.donations));
          const rev = t.donations * 285_000;
          const platformRoas = ((t.spend||0) > 0 ? (rev / t.spend).toFixed(1) : '0');
          return (
            <Card key={name}>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: t.color }}>
                  {name.includes('Meta') ? 'M' : name.includes('TikTok') ? 'TT' : 'G'}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-ink dark:text-slate-100">{name}</div>
                  <div className="text-xs text-muted dark:text-slate-400">last 30 days</div>
                </div>
                <Badge tone="green" dot>active</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-muted dark:text-slate-400 text-xs">Visits</div><div className="font-bold text-ink dark:text-slate-100 tnum">{fmtNum(t.visits)}</div></div>
                <div><div className="text-muted dark:text-slate-400 text-xs">Leads</div><div className="font-bold text-ink dark:text-slate-100 tnum">{fmtNum(t.leads)}</div></div>
                <div><div className="text-muted dark:text-slate-400 text-xs">Donasi</div><div className="font-bold text-ink dark:text-slate-100 tnum">{fmtNum(t.donations)}</div></div>
                <div><div className="text-muted dark:text-slate-400 text-xs">CVR</div><div className="font-bold text-ink dark:text-slate-100 tnum">{(t.donations/Math.max(1,t.leads)*100).toFixed(1)}%</div></div>
                <div><div className="text-muted dark:text-slate-400 text-xs">Spend</div><div className="font-bold text-ink dark:text-slate-100 tnum">{fmtIDRShort(t.spend)}</div></div>
                <div><div className="text-muted dark:text-slate-400 text-xs">CPD</div><div className="font-bold text-ink dark:text-slate-100 tnum">{fmtIDRShort(cpd)}</div></div>
              </div>
              <div className="mt-3 pt-3 border-t border-line dark:border-slate-700 flex items-center justify-between">
                <div className="text-xs text-muted dark:text-slate-400">ROAS</div>
                <div className={'font-bold text-lg ' + (+platformRoas >= 3 ? 'text-emerald-600' : 'text-amber-600')}>{platformRoas}x</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Chart + cost tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="font-bold text-ink dark:text-slate-100 mb-3">Performance Campaign · 30 hari</div>
          <LineChart data={chartData} height={240} color="#7C3AED"/>
        </Card>

        <Card>
          <div className="font-bold text-ink dark:text-slate-100">Cost Tracking (Manual Input)</div>
          <div className="text-xs text-muted dark:text-slate-400 mt-0.5 mb-4">Input total spend ads dari masing-masing platform.</div>
          {[
            { k:'meta',   label:'Meta Ads',   color:'#1877F2' },
            { k:'google', label:'Google Ads',  color:'#34A853' },
            { k:'tiktok', label:'TikTok Ads',  color:'#000' },
          ].map(p => (
            <div key={p.k} className="mb-3">
              <label className="text-xs font-semibold text-muted dark:text-slate-400 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }}/> {p.label}
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-line bg-white focus-within:border-brand-600 dark:bg-slate-900 dark:border-slate-700">
                <span className="pl-3 text-muted dark:text-slate-400 text-sm">Rp</span>
                <input type="number" value={costInputs[p.k]} onChange={e => setCostInputs({ ...costInputs, [p.k]: +e.target.value })} className="flex-1 px-2 py-2 outline-none font-semibold text-ink dark:text-slate-100 text-sm bg-transparent"/>
              </div>
            </div>
          ))}
          <Btn className="w-full" onClick={saveCosts} disabled={costSaving}>{costSaving ? 'Menyimpan...' : 'Simpan & Hitung ROAS'}</Btn>
        </Card>
      </div>

      {/* Pixel status + Conversion events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-ink dark:text-slate-100">Status Pixel</div>
            <Btn size="sm" variant="ghost" tone="ink" iconRight="arrowR">Settings</Btn>
          </div>
          <div className="space-y-2">
            {[
              { n:'Meta Pixel · CAPI',       s:'Active',        tone:'green' },
              { n:'Google Tag Manager',       s:'Active',        tone:'green' },
              { n:'GA4',                      s:'Active',        tone:'green' },
              { n:'Google Ads Conversion',    s:'Not Connected', tone:'slate' },
              { n:'TikTok Pixel',             s:'Error',         tone:'red' },
            ].map(p => (
              <div key={p.n} className="flex items-center gap-3 p-2.5 rounded-lg border border-line dark:border-slate-700">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${p.tone==='green' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : p.tone==='red' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                  <Icon name="pixel" size={14}/>
                </div>
                <div className="flex-1 font-semibold text-ink dark:text-slate-100 text-sm">{p.n}</div>
                <Badge tone={p.tone} dot={p.tone!=='slate'}>{p.s}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-ink dark:text-slate-100">Conversion Events (24 jam)</div>
            <Badge tone="green" dot>Real-time</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { n:'PageView',         v:12340, color:'#2E4191' },
              { n:'ViewContent',      v:8120,  color:'#38B6FF' },
              { n:'InitiateCheckout', v:3420,  color:'#F59E0B' },
              { n:'AddPaymentInfo',   v:2104,  color:'#DC2626' },
              { n:'Lead',             v:1810,  color:'#16A34A' },
              { n:'CompleteDonation', v:842,   color:'#7C3AED' },
              { n:'Purchase',         v:824,   color:'#16A34A' },
            ].map(e => (
              <div key={e.n} className="p-3 rounded-lg bg-bg2 dark:bg-slate-800/40 border border-line dark:border-slate-700">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{background:e.color}}/><div className="text-xs text-muted dark:text-slate-400">{e.n}</div></div>
                <div className="mt-1 text-xl font-bold text-ink dark:text-slate-100 tnum">{fmtNum(e.v)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Conversion heatmap (7d x 24h) */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-ink dark:text-slate-100">Conversion Heatmap · 7 hari</div>
          <Badge tone="brand">Lead + Purchase</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                <th className="text-left text-muted dark:text-slate-400 font-semibold pb-1">Jam</th>
                {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d => <th key={d} className="text-center text-muted dark:text-slate-400 font-semibold pb-1 px-1">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {[0,3,6,9,12,15,18,21].map(h => (
                <tr key={h}>
                  <td className="text-muted dark:text-slate-400 pr-2 py-0.5">{h.toString().padStart(2,'0')}:00</td>
                  {[0,1,2,3,4,5,6].map(d => {
                    const v = Math.round(Math.sin((h+d)*0.5)*20 + 25 + Math.random()*15);
                    const op = Math.min(1, v / 50);
                    return <td key={d} className="px-0.5 py-0.5">
                      <div className="h-6 rounded" style={{background:`rgba(124,58,237,${op})`}} title={`${v} events`}>
                        <div className="h-full flex items-center justify-center text-white font-bold">{v}</div>
                      </div>
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-ink dark:text-slate-100 flex items-center gap-2"><Icon name="sparkle" size={18} className="text-brand-600"/> Rekomendasi Campaign</div>
          <Badge tone="brand">AI Insight</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { c: seedCampaigns[1], reason:'CVR tertinggi 6.8% · gandakan budget 30%', tone:'green' },
            { c: seedCampaigns[0], reason:'CPL turun -22% minggu ini · scale ke TikTok', tone:'sky' },
            { c: seedCampaigns[2], reason:'ROAS 4.2x · stable performer · pertahankan', tone:'brand' },
          ].filter(r => r.c).map((r, i) => (
            <div key={i} className="rounded-xl border border-line dark:border-slate-700 p-4">
              <div className="h-24 rounded-lg mb-3" style={{ background: r.c.thumb }}>
                <div className="h-full flex items-center justify-center text-white/90"><Icon name={r.c.icon} size={28}/></div>
              </div>
              <div className="font-bold text-ink dark:text-slate-100 line-clamp-2 leading-tight">{r.c.title}</div>
              <div className="mt-2 text-xs text-ink/80 dark:text-slate-300">{r.reason}</div>
              <div className="mt-3 flex items-center justify-between">
                <Badge tone={r.tone}>Rekomendasi</Badge>
                <button className="text-xs font-semibold text-brand-600 hover:underline">Lihat detail</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Landing page preview */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-ink dark:text-slate-100">Landing Page Preview</div>
            <div className="text-xs text-muted dark:text-slate-400">Halaman publik aktif yang menerima traffic iklan.</div>
          </div>
          <a href="public.html" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline">Buka tab baru <Icon name="arrowR" size={12}/></a>
        </div>
        <div className="rounded-xl overflow-hidden border border-line dark:border-slate-700 bg-bg2 dark:bg-slate-800/40">
          <div className="h-8 px-3 flex items-center gap-1.5 border-b border-line dark:border-slate-700 bg-white dark:bg-slate-900">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400"/><span className="h-2.5 w-2.5 rounded-full bg-amber-400"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/>
            <div className="ml-2 flex-1 h-5 rounded-md bg-bg2 dark:bg-slate-800 text-[10px] font-mono text-muted dark:text-slate-400 flex items-center px-2">niatbaik.org</div>
          </div>
          <iframe src="public.html" className="w-full h-[480px] block" title="Landing preview"/>
        </div>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  Window exports                                                     */
/* ================================================================== */

Object.assign(window, { CsInbox, AdvertiserDashboard });

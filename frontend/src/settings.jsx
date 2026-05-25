// Settings page — 8 tabs
const { useState: uS, useEffect: uE } = React;

// =========================================================
// Section helper
// =========================================================
function Section({ title, sub, children, actions }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="font-bold text-ink dark:text-slate-100">{title}</div>
          {sub && <div className="text-xs text-muted dark:text-slate-400 mt-0.5">{sub}</div>}
        </div>
        {actions}
      </div>
      {children}
    </Card>
  );
}

// =========================================================
// Main
// =========================================================
function SettingsPage() {
  const [tab, setTab] = uS('themes');
  const tabs = [
    { value:'themes',       label:'Themes',         icon:'palette' },
    { value:'form',         label:'Form',           icon:'edit' },
    { value:'payment',      label:'Payment',        icon:'creditcard' },
    { value:'tracking',     label:'Tracking & Ads', icon:'pixel' },
    { value:'notification', label:'Notification',   icon:'bell' },
    { value:'social',       label:'Social Proof',   icon:'smile' },
    { value:'fundraising',  label:'Fundraising',    icon:'handshake' },
    { value:'general',      label:'General',        icon:'cog' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Pengaturan platform NIATBAIK.ORG."/>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-1 p-3 h-fit lg:sticky top-20" padded={false}>
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button key={t.value} onClick={() => setTab(t.value)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${tab===t.value ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'text-ink/80 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                <Icon name={t.icon} size={16} className={tab===t.value ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}/>
                {t.label}
              </button>
            ))}
          </nav>
        </Card>

        <div className="lg:col-span-4 space-y-5">
          {tab === 'themes' && <ThemesPanel/>}
          {tab === 'form' && <FormPanel/>}
          {tab === 'payment' && <PaymentPanel/>}
          {tab === 'tracking' && <TrackingPanel/>}
          {tab === 'notification' && <NotificationPanel/>}
          {tab === 'social' && <SocialPanel/>}
          {tab === 'fundraising' && <FundraisingPanel/>}
          {tab === 'general' && <GeneralPanel/>}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// 1. Themes
// =========================================================
function useToast() { try { return useApp().showToast || function(){}; } catch { return function(){}; } }

function ThemesPanel() {
  const [color, setColor] = uS('#2E4191');
  const [secondary, setSecondary] = uS('#38B6FF');
  const [radius, setRadius] = uS(16);
  const [font, setFont] = uS('plus-jakarta');
  const [btnStyle, setBtnStyle] = uS('Solid');
  const [saving, setSaving] = uS(false);

  uE(() => {
    api.settings().then(r => {
      if (!r?.data) return;
      const d = r.data;
      if (d.primary_color) setColor(d.primary_color);
      if (d.secondary_color) setSecondary(d.secondary_color);
      if (d.border_radius != null) setRadius(d.border_radius);
      if (d.font_family) setFont(d.font_family);
      if (d.button_style) setBtnStyle(d.button_style);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateSettings({ primary_color: color, secondary_color: secondary, border_radius: radius, font_family: font, button_style: btnStyle });
      if (res?.success || res?.data) useToast()('Tema berhasil disimpan');
      else useToast()(res?.message || 'Gagal menyimpan tema');
    } catch(e) { useToast()('Error: ' + e.message); }
    setSaving(false);
  };

  return (
    <>
      <Section title="Logo & Brand" actions={<Button variant="primary" size="sm" onClick={handleSave}>{saving ? 'Menyimpan...' : 'Simpan Tema'}</Button>}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Upload area */}
          <div className="rounded-xl border border-dashed border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-6 flex items-center justify-center min-h-[140px]">
            <div className="text-center">
              <img src="assets/logo-niatbaik.png" alt="logo" className="mx-auto h-12"/>
              <Button variant="secondary" size="sm" icon={<Icon name="upload" size={14}/>} className="mt-3">Upload Logo</Button>
              <div className="text-xs text-muted dark:text-slate-400 mt-2">PNG / SVG — max 1MB</div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted dark:text-slate-400">Primary Color</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-10 rounded-lg border border-line dark:border-slate-700 cursor-pointer"/>
                <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1"/>
              </div>
              <div className="mt-2 flex gap-2">
                {['#2E4191','#1d4ed8','#16a34a','#dc2626','#0e7490','#7c3aed'].map(c => (
                  <button key={c} onClick={() => setColor(c)} className="w-7 h-7 rounded-lg ring-2 ring-transparent hover:ring-brand-300 transition" style={{background:c}}/>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted dark:text-slate-400">Secondary Color</label>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg border border-line dark:border-slate-700 shrink-0" style={{background: secondary}}/>
                <Input value={secondary} onChange={(e) => setSecondary(e.target.value)} className="flex-1"/>
              </div>
            </div>

            <Field label="Font">
              <Select value={font} onChange={(e) => setFont(e.target.value)}>
                <option value="plus-jakarta">Plus Jakarta Sans</option>
                <option value="inter">Inter</option>
                <option value="dm-sans">DM Sans</option>
                <option value="poppins">Poppins</option>
              </Select>
            </Field>

            <div>
              <label className="text-xs font-semibold text-muted flex items-center justify-between">Border Radius <span className="text-ink font-bold dark:text-slate-100">{radius}px</span></label>
              <input type="range" min="0" max="24" step="2" value={radius} onChange={(e) => setRadius(+e.target.value)} className="w-full mt-1 accent-brand-600"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted dark:text-slate-400">Button Style</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {['Solid','Outline','Ghost'].map((s) => (
                  <button key={s} onClick={() => setBtnStyle(s)}
                    className={`py-2 rounded-lg border-2 text-xs font-bold transition ${btnStyle===s ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-line dark:border-slate-700 hover:border-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Preview Theme" sub="Lihat tampilan komponen dengan tema saat ini.">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-line dark:border-slate-700 shadow-card max-w-md mx-auto" style={{ borderRadius: radius + 'px' }}>
            <div className="font-bold text-lg text-ink dark:text-slate-100">Donasi Hari Ini</div>
            <div className="text-muted dark:text-slate-400 text-sm">Bersama untuk Indonesia lebih baik.</div>
            <button className="mt-4 px-5 py-2.5 text-white font-bold w-full"
              style={{ background: color, borderRadius: radius + 'px' }}>
              Donasi Sekarang
            </button>
            <ProgressBar value={75} max={100} size="sm" className="mt-3"/>
          </div>
        </div>
      </Section>
    </>
  );
}

// =========================================================
// 2. Form
// =========================================================
function FormPanel() {
  const [fields, setFields] = uS([
    { label:'Nama donatur',        active:true,  required:true },
    { label:'No. WhatsApp',        active:true,  required:true },
    { label:'Email',               active:true,  required:false },
    { label:'Alamat',              active:false, required:false },
    { label:'NPWP (zakat)',        active:false, required:false },
    { label:'Doa / pesan donatur', active:true,  required:false },
    { label:'Checkbox anonim',     active:true,  required:false },
  ]);
  const [presets, setPresets] = uS([25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000]);
  const [minDonation, setMinDonation] = uS('10000');
  const [maxDonation, setMaxDonation] = uS('100000000');
  const [newPreset, setNewPreset] = uS('');
  const [saving, setSaving] = uS(false);

  uE(() => {
    api.settings().then(r => {
      if (!r?.data) return;
      const d = r.data;
      if (d.form_fields) setFields(d.form_fields);
      if (d.nominal_presets) setPresets(d.nominal_presets);
      if (d.min_donation != null) setMinDonation(String(d.min_donation));
      if (d.max_donation != null) setMaxDonation(String(d.max_donation));
    });
  }, []);

  const toggleField = (idx, key) => {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, [key]: !f[key] } : f));
  };

  const removePreset = (idx) => setPresets(prev => prev.filter((_, i) => i !== idx));

  const addPreset = () => {
    const v = parseInt(newPreset.replace(/\D/g, ''));
    if (v && !presets.includes(v)) {
      setPresets(prev => [...prev, v].sort((a, b) => a - b));
      setNewPreset('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateSettings({ form_fields: fields, nominal_presets: presets, min_donation: parseInt(minDonation) || 10000, max_donation: parseInt(maxDonation) || 100000000 });
      if (res?.success || res?.data) useToast()('Form berhasil disimpan');
      else useToast()(res?.message || 'Gagal menyimpan');
    } catch(e) { useToast()('Error: ' + e.message); }
    setSaving(false);
  };

  return (
    <>
      <Section title="Field Form Donasi" sub="Atur field yang muncul pada form donasi."
        actions={<Button variant="primary" size="sm" onClick={handleSave}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>}>
        <div className="space-y-3">
          {fields.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-line dark:border-slate-700">
              <div className="font-semibold text-ink dark:text-slate-100 flex-1">{f.label}</div>
              <label className="text-xs text-muted dark:text-slate-400 flex items-center gap-2 cursor-pointer">
                Required
                <input type="checkbox" checked={f.required} onChange={() => toggleField(i, 'required')} className="accent-brand-600"/>
              </label>
              <Toggle checked={f.active} onChange={() => toggleField(i, 'active')}/>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Nominal Preset & Batas Donasi">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-semibold text-muted dark:text-slate-400">Preset nominal</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {presets.map((p, i) => (
                <span key={p} className="px-2.5 py-1 rounded-md border border-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-ink dark:text-slate-100 inline-flex items-center gap-1">
                  {fmtIDR(p)}
                  <button onClick={() => removePreset(i)} className="text-muted dark:text-slate-400 hover:text-rose-600"><Icon name="close" size={12}/></button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input value={newPreset} onChange={(e) => setNewPreset(e.target.value)} placeholder="Nominal"
                  className="w-24 h-7 px-2 rounded-md border border-dashed border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" onKeyDown={(e) => e.key === 'Enter' && addPreset()}/>
                <button onClick={addPreset} className="px-2 py-1 rounded-md border border-dashed border-line dark:border-slate-700 text-xs font-bold text-muted dark:text-slate-400 hover:text-brand-600 hover:border-brand-300">+ Tambah</button>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Field label="Minimum donasi"><Input value={minDonation} onChange={(e) => setMinDonation(e.target.value)} type="number" suffix="IDR"/></Field>
            <Field label="Maksimum donasi"><Input value={maxDonation} onChange={(e) => setMaxDonation(e.target.value)} type="number" suffix="IDR"/></Field>
          </div>
        </div>
      </Section>
    </>
  );
}

// =========================================================
// 3. Payment
// =========================================================
function PaymentLogo({ provider }) {
  const palette = {
    'QRIS':         { bg:'bg-rose-50',     fg:'text-rose-700',     label:'QRIS' },
    'Bank BCA':     { bg:'bg-blue-50',     fg:'text-blue-700',     label:'BCA' },
    'Bank Mandiri': { bg:'bg-yellow-50',   fg:'text-amber-700',    label:'MAND' },
    'Bank BNI':     { bg:'bg-orange-50',   fg:'text-orange-700',   label:'BNI' },
    'Bank BRI':     { bg:'bg-sky-50',      fg:'text-sky-700',      label:'BRI' },
    'Bank Syariah Indonesia': { bg:'bg-emerald-50', fg:'text-emerald-700', label:'BSI' },
    'GoPay':        { bg:'bg-sky-50',      fg:'text-sky-700',      label:'GOPA' },
    'OVO':          { bg:'bg-violet-50',   fg:'text-violet-700',   label:'OVO' },
    'Dana':         { bg:'bg-blue-50',     fg:'text-blue-700',     label:'DANA' },
    'ShopeePay':    { bg:'bg-orange-50',   fg:'text-orange-700',   label:'SHPE' },
    'LinkAja':      { bg:'bg-red-50',      fg:'text-red-700',      label:'LINK' },
    'Visa/Master':  { bg:'bg-slate-100 dark:bg-slate-800',   fg:'text-slate-700 dark:text-slate-200',    label:'CC' },
  };
  const p = palette[provider] || { bg:'bg-slate-100 dark:bg-slate-800', fg:'text-ink/70 dark:text-slate-300', label: (provider || '??').slice(0,4).toUpperCase() };
  return (
    <div className={`h-10 w-14 rounded-md border border-line dark:border-slate-700 flex items-center justify-center text-[10px] font-extrabold tracking-wider shrink-0 ${p.bg} ${p.fg}`}>
      {p.label}
    </div>
  );
}

const PAYMENT_TYPES = ['Bank Transfer', 'Virtual Account (VA)', 'QRIS', 'E-wallet', 'Card (CC/Debit)'];
const BANKS = ['Bank BCA','Bank Mandiri','Bank BNI','Bank BRI','Bank Syariah Indonesia','CIMB Niaga','Permata Bank','BTN','Maybank'];
const EWALLETS = ['GoPay','OVO','Dana','ShopeePay','LinkAja'];

function PaymentEditorModal({ open, onClose, editing, onSave }) {
  const isEdit = !!editing;
  const [form, setForm] = uS({
    type: 'Bank Transfer', provider: 'Bank BCA', name: '', holder: 'Yayasan Niat Baik', account: '', fee: 'Rp 4.000',
  });
  const [error, setError] = uS({});

  uE(() => {
    if (open) {
      setForm({
        type:     editing?.type     || 'Bank Transfer',
        provider: editing?.provider || 'Bank BCA',
        name:     editing?.name     || '',
        holder:   editing?.holder   || 'Yayasan Niat Baik',
        account:  editing?.account  || '',
        fee:      editing?.fee      || 'Rp 4.000',
      });
      setError({});
    }
  }, [open, editing?.id]);

  const providerOptions = React.useMemo(() => {
    if (form.type === 'QRIS') return ['QRIS'];
    if (form.type === 'E-wallet') return EWALLETS;
    if (form.type === 'Card (CC/Debit)') return ['Visa/Master', 'JCB', 'AMEX'];
    return BANKS;
  }, [form.type]);

  uE(() => {
    if (!providerOptions.includes(form.provider)) {
      setForm(f => ({ ...f, provider: providerOptions[0] }));
    }
  }, [providerOptions]);

  uE(() => {
    if (!form.name || (editing && editing.name === form.name)) {
      let auto = form.provider;
      if (form.type === 'Virtual Account (VA)') auto = form.provider.replace(/^Bank\s+/i, '') + ' Virtual Account';
      else if (form.type === 'Bank Transfer') auto = form.provider.replace(/^Bank\s+/i, '') + ' Transfer';
      else if (form.type === 'Card (CC/Debit)') auto = 'Kartu Kredit / Debit';
      else if (form.type === 'QRIS') auto = 'QRIS';
      if (!isEdit) setForm(f => ({ ...f, name: auto }));
    }
  }, [form.type, form.provider]);

  const needsAccount = form.type === 'Bank Transfer' || form.type === 'Virtual Account (VA)' || form.type === 'E-wallet';
  const accountLabel = form.type === 'E-wallet' ? 'No. HP / akun e-wallet' : 'Nomor Rekening';

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nama metode wajib diisi';
    if (needsAccount) {
      if (!form.holder.trim()) e.holder = 'Atas nama wajib diisi';
      if (!form.account.trim()) e.account = 'Nomor rekening / akun wajib diisi';
      else if (form.account.replace(/\D/g,'').length < 6) e.account = 'Minimal 6 digit';
    }
    if (!form.fee.trim()) e.fee = 'Fee wajib diisi';
    setError(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSave({
      type:     form.type === 'Virtual Account (VA)' ? 'Bank Transfer' : form.type,
      provider: form.provider,
      name:     form.name.trim(),
      holder:   needsAccount ? form.holder.trim() : '-',
      account:  needsAccount ? form.account.replace(/\s|-/g, '') : '-',
      fee:      form.fee.trim(),
    });
  };

  return (
    <Modal open={open} onClose={onClose} maxW="max-w-2xl">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <span className="h-7 w-7 rounded-md bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 flex items-center justify-center"><Icon name={isEdit ? 'edit' : 'plus'} size={14}/></span>
          <div className="font-bold text-ink dark:text-slate-100 text-lg">{isEdit ? 'Edit Payment Method' : 'Add Payment Method'}</div>
        </div>

        <div className="space-y-5">
          {/* Type selector */}
          <div>
            <label className="text-sm font-semibold text-ink dark:text-slate-100">Tipe Pembayaran <span className="text-rose-600">*</span></label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PAYMENT_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                  className={`p-2.5 rounded-lg border-2 text-xs font-bold text-left transition-all ${form.type === t ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-line dark:border-slate-700 text-ink dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Icon name={t === 'QRIS' ? 'pix' : t.includes('Card') ? 'creditcard' : t === 'E-wallet' ? 'wallet' : 'briefcase'} size={14}
                    className={`${form.type === t ? 'text-brand-600' : 'text-slate-400'} mb-1`}/>
                  <div className="leading-tight">{t}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-ink dark:text-slate-100">
                {form.type === 'E-wallet' ? 'Provider E-wallet' : form.type === 'Card (CC/Debit)' ? 'Jaringan Kartu' : form.type === 'QRIS' ? 'Penerbit QRIS' : 'Nama Bank'}
                <span className="text-rose-600"> *</span>
              </label>
              <Select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="mt-1.5">
                {providerOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-ink dark:text-slate-100">Nama Tampilan <span className="text-rose-600">*</span></label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`mt-1.5 ${error.name ? 'ring-2 ring-rose-300/30' : ''}`}
                placeholder="cth: BCA Virtual Account"/>
              {error.name && <div className="text-[11px] text-rose-600 font-semibold mt-1">{error.name}</div>}
            </div>
          </div>

          {needsAccount && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-line dark:border-slate-700">
              <div className="sm:col-span-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400">Detail Rekening</div>
              <div>
                <label className="text-sm font-semibold text-ink dark:text-slate-100">Atas Nama <span className="text-rose-600">*</span></label>
                <Input value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })}
                  className={`mt-1.5 ${error.holder ? 'ring-2 ring-rose-300/30' : ''}`}
                  placeholder="cth: Yayasan Niat Baik"/>
                {error.holder && <div className="text-[11px] text-rose-600 font-semibold mt-1">{error.holder}</div>}
              </div>
              <div>
                <label className="text-sm font-semibold text-ink dark:text-slate-100">{accountLabel} <span className="text-rose-600">*</span></label>
                <Input value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })}
                  className={`mt-1.5 ${error.account ? 'ring-2 ring-rose-300/30' : ''}`}
                  placeholder={form.type === 'E-wallet' ? '081234567890' : '8901234567'}/>
                {error.account && <div className="text-[11px] text-rose-600 font-semibold mt-1">{error.account}</div>}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-line dark:border-slate-700">
            <label className="text-sm font-semibold text-ink dark:text-slate-100">Fee Transaksi <span className="text-rose-600">*</span></label>
            <Input value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })}
              className={`mt-1.5 ${error.fee ? 'ring-2 ring-rose-300/30' : ''}`}
              placeholder="cth: Rp 4.000 atau 2%"/>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {['Gratis','Rp 2.500','Rp 4.000','0.7%','2%','2.9% + Rp 2.000'].map(f => (
                <button key={f} type="button" onClick={() => setForm({ ...form, fee: f })}
                  className="px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/30 text-[10px] font-bold text-ink/80 dark:text-slate-300 border border-line dark:border-slate-700">{f}</button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div className="pt-4 border-t border-line dark:border-slate-700">
            <div className="text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400 mb-2">Preview</div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-line dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40">
              <PaymentLogo provider={form.provider}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-bold text-ink dark:text-slate-100">{form.name || 'Nama metode...'}</div>
                  <Badge tone="sky" size="sm">{form.type === 'Virtual Account (VA)' ? 'Bank Transfer' : form.type}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted dark:text-slate-400">
                  {needsAccount && form.account && <span className="font-mono">No. Rek: <b className="text-ink dark:text-slate-100">{form.account}</b></span>}
                  {needsAccount && form.holder && <span>a.n. {form.holder}</span>}
                  <span>fee {form.fee || '-'}</span>
                </div>
              </div>
              <Badge tone="ok" size="sm">active</Badge>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={submit} icon={<Icon name={isEdit ? 'check' : 'plus'} size={14}/>}>{isEdit ? 'Simpan perubahan' : 'Tambah Metode'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function PaymentPanel() {
  const [methods, setMethods] = uS([
    { id:'m1', name:'QRIS',                provider:'QRIS',         type:'QRIS',          holder:'Yayasan Niat Baik', account:'-',            fee:'0.7%',             active:true,  locked:true },
    { id:'m2', name:'BCA Virtual Account', provider:'Bank BCA',     type:'Bank Transfer', holder:'Yayasan Niat Baik', account:'8901234567',   fee:'Rp 4.000',         active:true },
    { id:'m3', name:'Mandiri VA',          provider:'Bank Mandiri', type:'Bank Transfer', holder:'Yayasan Niat Baik', account:'8908765432',   fee:'Rp 4.000',         active:true },
    { id:'m4', name:'BNI VA',              provider:'Bank BNI',     type:'Bank Transfer', holder:'Yayasan Niat Baik', account:'8901122334',   fee:'Rp 4.000',         active:true },
    { id:'m5', name:'GoPay',               provider:'GoPay',        type:'E-wallet',      holder:'Yayasan Niat Baik', account:'08123456789',  fee:'2%',               active:true,  locked:true },
    { id:'m6', name:'OVO',                 provider:'OVO',          type:'E-wallet',      holder:'Yayasan Niat Baik', account:'08129876543',  fee:'2%',               active:true,  locked:true },
    { id:'m7', name:'Dana',                provider:'Dana',         type:'E-wallet',      holder:'Yayasan Niat Baik', account:'08118887766',  fee:'2%',               active:true,  locked:true },
    { id:'m8', name:'ShopeePay',           provider:'ShopeePay',    type:'E-wallet',      holder:'Yayasan Niat Baik', account:'08113334455',  fee:'2%',               active:false, locked:true },
    { id:'m9', name:'Kartu Kredit',        provider:'Visa/Master',  type:'Card',          holder:'-',                 account:'-',            fee:'2.9% + Rp 2.000',  active:false, locked:true },
  ]);
  const [modalOpen, setModalOpen] = uS(false);
  const [editing, setEditing] = uS(null);
  const [confirmDel, setConfirmDel] = uS(null);

  // Moota
  const [mootaKey, setMootaKey] = uS('');
  const [mootaSecret, setMootaSecret] = uS('');
  const [mootaEnabled, setMootaEnabled] = uS(false);
  const [mootaConfigured, setMootaConfigured] = uS(false);
  // Flip
  const [flipKey, setFlipKey] = uS('');
  const [flipToken, setFlipToken] = uS('');
  const [flipUrl, setFlipUrl] = uS('https://bigflip.id/api/v3');
  const [flipEnabled, setFlipEnabled] = uS(false);
  const [flipConfigured, setFlipConfigured] = uS(false);
  // iPaymu
  const [ipaymuVA, setIpaymuVA] = uS('');
  const [ipaymuSecret, setIpaymuSecret] = uS('');
  const [ipaymuUrl, setIpaymuUrl] = uS('https://my.ipaymu.com/api/v2');
  const [saving, setSaving] = uS('');

  uE(() => {
    api.settings().then(r => {
      if (!r?.data) return;
      const d = r.data;
      setMootaEnabled(!!d.moota_enabled);
      setMootaConfigured(!!d.moota_configured);
      setFlipEnabled(!!d.flip_enabled);
      setFlipConfigured(!!d.flip_configured);
      setFlipUrl(d.flip_base_url || 'https://bigflip.id/api/v3');
      setIpaymuVA(d.ipaymu_va || '');
      setIpaymuUrl(d.ipaymu_url || 'https://my.ipaymu.com/api/v2');
    });
  }, []);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (m) => { setEditing(m); setModalOpen(true); };

  const handleSave = (data) => {
    if (editing) {
      setMethods(prev => prev.map(x => x.id === editing.id ? { ...x, ...data } : x));
      useToast()(`Payment "${data.name}" diperbarui`);
    } else {
      const id = 'm' + (Date.now() % 100000);
      setMethods(prev => [...prev, { id, active:true, ...data }]);
      useToast()(`Payment "${data.name}" ditambahkan`);
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    setMethods(prev => prev.filter(x => x.id !== confirmDel.id));
    useToast()(`Payment "${confirmDel.name}" dihapus`);
    setConfirmDel(null);
  };

  const toggle = (m) => setMethods(prev => prev.map(x => x.id === m.id ? { ...x, active: !x.active } : x));

  const saveMoota = async () => {
    setSaving('moota');
    try {
      const data = { moota_enabled: mootaEnabled };
      if (mootaKey) data.moota_api_key = mootaKey;
      if (mootaSecret) data.moota_webhook_secret = mootaSecret;
      const res = await api.updateSettings(data);
      useToast()(res?.success ? 'Moota berhasil disimpan' : (res?.message || 'Gagal'));
    } catch(e) { useToast()('Error: ' + e.message); }
    setSaving('');
  };

  const saveFlip = async () => {
    setSaving('flip');
    try {
      const data = { flip_enabled: flipEnabled, flip_base_url: flipUrl };
      if (flipKey) data.flip_secret_key = flipKey;
      if (flipToken) data.flip_validation_token = flipToken;
      const res = await api.updateSettings(data);
      useToast()(res?.success ? 'Flip berhasil disimpan' : (res?.message || 'Gagal'));
    } catch(e) { useToast()('Error: ' + e.message); }
    setSaving('');
  };

  const saveIpaymu = async () => {
    setSaving('ipaymu');
    try {
      const data = { ipaymu_va: ipaymuVA, ipaymu_url: ipaymuUrl };
      if (ipaymuSecret) data.ipaymu_secret = ipaymuSecret;
      const res = await api.updateSettings(data);
      useToast()(res?.success ? 'iPaymu berhasil disimpan' : (res?.message || 'Gagal'));
    } catch(e) { useToast()('Error: ' + e.message); }
    setSaving('');
  };

  return (
    <>
      {/* Payment methods list */}
      <Section title="Payment Gateway" sub="Kelola metode pembayaran yang tersedia bagi donatur."
        actions={<Button variant="primary" size="sm" icon={<Icon name="plus" size={14}/>} onClick={openAdd}>Add Payment</Button>}>
        <div className="space-y-2">
          {methods.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-line dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-800 transition-colors group">
              <PaymentLogo provider={m.provider}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-bold text-ink dark:text-slate-100">{m.name}</div>
                  <Badge tone={m.type==='QRIS'?'brand':m.type==='Bank Transfer'?'sky':m.type==='E-wallet'?'purple':'slate'} size="sm">{m.type}</Badge>
                  {m.locked && <Badge tone="outline" size="sm">default</Badge>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted dark:text-slate-400">
                  {m.account && m.account !== '-' && <span className="font-mono">No. Rek: <b className="text-ink dark:text-slate-100">{m.account}</b></span>}
                  {m.holder && m.holder !== '-' && <span>a.n. {m.holder}</span>}
                  <span>fee {m.fee}</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <StatusBadge status={m.active ? 'Active' : 'inactive'}/>
                <Toggle checked={m.active} onChange={() => toggle(m)}/>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(m)} title="Edit"
                  className="h-8 w-8 rounded-md text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30 flex items-center justify-center">
                  <Icon name="edit" size={14}/>
                </button>
                <button onClick={() => setConfirmDel(m)} disabled={m.locked} title={m.locked ? 'Default — tidak bisa dihapus' : 'Hapus'}
                  className={`h-8 w-8 rounded-md flex items-center justify-center ${m.locked ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30'}`}>
                  <Icon name="trash" size={14}/>
                </button>
              </div>
            </div>
          ))}
          <button onClick={openAdd}
            className="w-full px-3 py-3 rounded-xl border border-dashed border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-brand-600 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-brand-900/30 flex items-center justify-center gap-2">
            <Icon name="plus" size={14}/> Add Payment Method
          </button>
        </div>
      </Section>

      {/* Payment report */}
      <Section title="Payment Report" sub="Unduh laporan berdasarkan metode pembayaran.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['QRIS','Bank VA','GoPay','OVO','Dana','ShopeePay','Card','Lainnya'].map(p => (
            <button key={p} className="p-3 rounded-xl border border-line dark:border-slate-700 hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 text-left">
              <div className="text-xs text-muted dark:text-slate-400">Metode</div>
              <div className="font-bold text-ink dark:text-slate-100">{p}</div>
              <div className="mt-2 text-[11px] inline-flex items-center gap-1 text-brand-600 font-semibold"><Icon name="download" size={12}/> Unduh CSV</div>
            </button>
          ))}
        </div>
      </Section>

      {/* Moota */}
      <Section title="Moota" sub="Bank mutation monitoring — moota.co"
        actions={<div className="flex items-center gap-2">
          <StatusBadge status={mootaEnabled && mootaConfigured ? 'Active' : !mootaEnabled ? 'inactive' : 'Not Connected'}/>
          <Toggle checked={mootaEnabled} onChange={setMootaEnabled}/>
        </div>}>
        <div className="space-y-3">
          <Field label="API Key" hint="Dari moota.co → Settings → API">
            <Input type="password" placeholder={mootaConfigured ? '------------- (sudah diisi)' : 'Masukkan API Key'} value={mootaKey} onChange={e => setMootaKey(e.target.value)}/>
          </Field>
          <Field label="Webhook Secret" hint="Untuk verifikasi signature webhook">
            <Input type="password" placeholder={mootaConfigured ? '------------- (sudah diisi)' : 'Masukkan Webhook Secret'} value={mootaSecret} onChange={e => setMootaSecret(e.target.value)}/>
          </Field>
          <div className="bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-900/40 rounded-xl p-3 text-xs text-sky-700 dark:text-sky-300">
            <b>Webhook URL:</b> https://donasi.niatbaik.org/api/webhooks/moota
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-line dark:border-slate-700 flex justify-end">
          <Button variant="primary" size="sm" onClick={saveMoota}>{saving==='moota' ? 'Menyimpan...' : 'Simpan Moota'}</Button>
        </div>
      </Section>

      {/* Flip */}
      <Section title="Flip" sub="Payment gateway + disbursement — flip.id"
        actions={<div className="flex items-center gap-2">
          <StatusBadge status={flipEnabled && flipConfigured ? 'Active' : !flipEnabled ? 'inactive' : 'Not Connected'}/>
          <Toggle checked={flipEnabled} onChange={setFlipEnabled}/>
        </div>}>
        <div className="space-y-3">
          <Field label="Secret Key" hint="Dari flip.id → Dashboard → API Keys">
            <Input type="password" placeholder={flipConfigured ? '------------- (sudah diisi)' : 'Masukkan Secret Key'} value={flipKey} onChange={e => setFlipKey(e.target.value)}/>
          </Field>
          <Field label="Validation Token" hint="Untuk verifikasi webhook callback">
            <Input type="password" placeholder={flipConfigured ? '------------- (sudah diisi)' : 'Masukkan Validation Token'} value={flipToken} onChange={e => setFlipToken(e.target.value)}/>
          </Field>
          <Field label="Base URL">
            <Select value={flipUrl} onChange={e => setFlipUrl(e.target.value)}>
              <option value="https://bigflip.id/api/v3">Production (bigflip.id)</option>
              <option value="https://bigflip.id/big_sandbox_api/v3">Sandbox (testing)</option>
            </Select>
          </Field>
          <div className="bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-900/40 rounded-xl p-3 text-xs text-sky-700 dark:text-sky-300">
            <b>Webhook URL:</b> https://donasi.niatbaik.org/api/webhooks/flip
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-line dark:border-slate-700 flex justify-end">
          <Button variant="primary" size="sm" onClick={saveFlip}>{saving==='flip' ? 'Menyimpan...' : 'Simpan Flip'}</Button>
        </div>
      </Section>

      {/* iPaymu */}
      <Section title="iPaymu" sub="Payment gateway — ipaymu.com">
        <div className="space-y-3">
          <Field label="Virtual Account"><Input value={ipaymuVA} onChange={e => setIpaymuVA(e.target.value)} placeholder="Masukkan VA iPaymu"/></Field>
          <Field label="API Key (Secret)" hint="Secret key dari dashboard iPaymu">
            <Input type="password" value={ipaymuSecret} onChange={e => setIpaymuSecret(e.target.value)} placeholder="Masukkan Secret Key"/>
          </Field>
          <Field label="API URL">
            <Select value={ipaymuUrl} onChange={e => setIpaymuUrl(e.target.value)}>
              <option value="https://my.ipaymu.com/api/v2">Production</option>
              <option value="https://sandbox.ipaymu.com/api/v2">Sandbox</option>
            </Select>
          </Field>
        </div>
        <div className="mt-3 pt-3 border-t border-line dark:border-slate-700 flex justify-end">
          <Button variant="primary" size="sm" onClick={saveIpaymu}>{saving==='ipaymu' ? 'Menyimpan...' : 'Simpan iPaymu'}</Button>
        </div>
      </Section>

      {/* Modals */}
      <PaymentEditorModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} editing={editing} onSave={handleSave}/>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)}>
        <div className="p-5">
          <div className="font-bold text-ink dark:text-slate-100 text-lg mb-3">Hapus Metode Pembayaran</div>
          <div className="text-sm text-ink/85 dark:text-slate-300">
            Hapus <b>{confirmDel?.name}</b> dari daftar metode pembayaran?
          </div>
          {confirmDel?.account && confirmDel.account !== '-' && (
            <div className="mt-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-800 dark:text-rose-300">
              <Icon name="shield" size={12} className="inline mr-1"/>
              No. Rek <b className="font-mono">{confirmDel.account}</b> a.n. <b>{confirmDel.holder}</b> tidak akan tersedia lagi untuk donatur baru.
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDel(null)}>Batal</Button>
            <Button variant="primary" onClick={handleDelete} icon={<Icon name="trash" size={14}/>} className="!bg-rose-600 hover:!bg-rose-700">Hapus permanen</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// =========================================================
// 4. Tracking & Ads
// =========================================================
function TrackingPanel() {
  const pixels = [
    { name:'Meta Pixel',            id:'PXL-928374',  status:'active',  icon:'pixel',  color:'bg-[#1877F2]' },
    { name:'Meta Conversions API',  id:'CAPI Token',  status:'active',  icon:'shield', color:'bg-[#1877F2]' },
    { name:'Google Tag Manager',    id:'GTM-7K9XYZ',  status:'active',  icon:'code',   color:'bg-emerald-600' },
    { name:'Google Ads Conversion', id:'AW-1029384',  status:'not',     icon:'target', color:'bg-emerald-600' },
    { name:'Google Analytics 4',    id:'G-X8K2J9LM',  status:'active',  icon:'chart',  color:'bg-amber-500' },
    { name:'TikTok Pixel',          id:'CIK29JLM3',   status:'error',   icon:'pixel',  color:'bg-black dark:bg-slate-700' },
    { name:'TikTok Events API',     id:'EvT-29JM',    status:'not',     icon:'shield', color:'bg-black dark:bg-slate-700' },
    { name:'Looker Studio',         id:'a1b2c3d4-e5f6-7890', status:'active', icon:'chart', color:'bg-gradient-to-br from-[#4285F4] via-[#0F9D58] to-[#F4B400]' },
  ];
  const events = ['PageView','ViewContent','InitiateCheckout','AddPaymentInfo','Lead','CompleteDonation','Purchase'];
  const statusMap = {
    active: { label:'Active',        tone:'ok' },
    not:    { label:'Not Connected', tone:'slate' },
    error:  { label:'Error',         tone:'bad' },
  };

  return (
    <>
      <Section title="Pixel & Tracking Integrations" sub="Hubungkan Meta, Google, dan TikTok untuk optimasi iklan.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pixels.map(p => (
            <div key={p.name} className="rounded-xl border border-line dark:border-slate-700 p-4">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg ${p.color} text-white flex items-center justify-center shrink-0`}>
                  <Icon name={p.icon} size={18}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold text-ink dark:text-slate-100">{p.name}</div>
                    <Badge tone={statusMap[p.status].tone} size="sm">{statusMap[p.status].label}</Badge>
                  </div>
                  <Input className="mt-2" defaultValue={p.id} placeholder="Masukkan ID..."/>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted dark:text-slate-400">Last fired: 12 detik lalu</span>
                <button className="text-brand-600 font-semibold hover:underline">Test event</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Looker Studio Reports" sub="Hubungkan dashboard Looker Studio untuk konsolidasi data ads & donasi.">
        <div className="space-y-3">
          {[
            { name:'Overview Donasi (Master)',  url:'lookerstudio.google.com/reporting/a1b2-...', updated:'baru saja',    status:'active', dim:'47 widget' },
            { name:'Performa Meta Ads',         url:'lookerstudio.google.com/reporting/x9y8-...', updated:'5 menit lalu', status:'active', dim:'18 widget' },
            { name:'Performa Google Ads + GA4', url:'lookerstudio.google.com/reporting/k3l4-...', updated:'1 jam lalu',   status:'active', dim:'22 widget' },
            { name:'TikTok Ads Funnel',         url:'lookerstudio.google.com/reporting/p7q8-...', updated:'belum sync',   status:'error',  dim:'14 widget' },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-line dark:border-slate-700">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#4285F4] via-[#0F9D58] to-[#F4B400] text-white flex items-center justify-center shrink-0">
                <Icon name="chart" size={18}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink dark:text-slate-100 truncate">{r.name}</div>
                <div className="text-xs text-muted dark:text-slate-400 truncate">{r.url} - {r.dim}</div>
              </div>
              <div className="hidden sm:block text-xs text-muted dark:text-slate-400">{r.updated}</div>
              <StatusBadge status={r.status === 'active' ? 'Active' : 'inactive'}/>
              <button className="h-8 w-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-ink dark:hover:text-slate-100"><Icon name="refresh" size={14}/></button>
            </div>
          ))}
          <button className="w-full px-3 py-2.5 rounded-xl border border-dashed border-line dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30">
            + Tambah Looker Studio Report
          </button>
        </div>
      </Section>

      <Section title="Event Tracking" sub="Event yang otomatis dipicu di funnel donasi.">
        <div className="overflow-x-auto nice-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted dark:text-slate-400">
                <th className="py-2 font-semibold">Event</th>
                <th className="py-2 font-semibold text-center">Meta</th>
                <th className="py-2 font-semibold text-center">Google</th>
                <th className="py-2 font-semibold text-center">TikTok</th>
                <th className="py-2 font-semibold text-right">24h fired</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={e} className="border-t border-line dark:border-slate-700">
                  <td className="py-2.5"><code className="text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded text-ink dark:text-slate-100">{e}</code></td>
                  {[true, true, i !== 2].map((on, j) => (
                    <td key={j} className="py-2.5 text-center">
                      {on
                        ? <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600"/>ON</span>
                        : <span className="text-muted dark:text-slate-400 text-xs">OFF</span>}
                    </td>
                  ))}
                  <td className="py-2.5 text-right text-muted dark:text-slate-400 tnum">{fmtNum(12340 - i * 1820)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* UTM Builder */}
      <Section title="UTM Builder" sub="Buat link iklan terlacak dengan cepat.">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="utm_source"><Input defaultValue="facebook"/></Field>
          <Field label="utm_medium"><Input defaultValue="cpc"/></Field>
          <Field label="utm_campaign"><Input defaultValue="ramadhan-2026"/></Field>
          <Field label="utm_content"><Input defaultValue="hero-video-v3"/></Field>
        </div>
        <div className="mt-4 bg-slate-900 text-cyan-300 rounded-xl p-3 text-xs font-mono break-all">
          https://niatbaik.org/c/beasiswa-1000-anak?utm_source=facebook&amp;utm_medium=cpc&amp;utm_campaign=ramadhan-2026&amp;utm_content=hero-video-v3
        </div>
      </Section>
    </>
  );
}

// =========================================================
// 5. Notification
// =========================================================
function NotificationPanel() {
  const [waProvider, setWaProvider] = uS('fonnte');
  const [waToken, setWaToken] = uS('');
  const [waAdmin, setWaAdmin] = uS('');
  const [emailEnabled, setEmailEnabled] = uS(true);
  const [smtpHost, setSmtpHost] = uS('smtp.gmail.com');
  const [smtpEmail, setSmtpEmail] = uS('');
  const [smtpPassword, setSmtpPassword] = uS('');
  const [smtpPort, setSmtpPort] = uS('587');
  const [smtpSSL, setSmtpSSL] = uS(true);
  const [tgToken, setTgToken] = uS('');
  const [tgChatId, setTgChatId] = uS('');
  const [saving, setSaving] = uS('');

  uE(() => {
    api.settings().then(r => {
      if (!r?.data) return;
      const d = r.data;
      if (d.wa_provider) setWaProvider(d.wa_provider);
      if (d.wa_token) setWaToken('');
      if (d.wa_admin_number) setWaAdmin(d.wa_admin_number);
      setEmailEnabled(d.email_enabled !== false);
      setSmtpHost(d.smtp_host || 'smtp.gmail.com');
      setSmtpEmail(d.smtp_email || '');
      setSmtpPort(String(d.smtp_port || 587));
      setSmtpSSL(d.smtp_ssl !== false);
      if (d.telegram_chat_id) setTgChatId(d.telegram_chat_id);
    });
  }, []);

  const saveWA = async () => {
    setSaving('wa');
    try {
      const data = { wa_provider: waProvider, wa_admin_number: waAdmin };
      if (waToken) data.wa_token = waToken;
      const res = await api.updateSettings(data);
      useToast()(res?.success ? 'WhatsApp berhasil disimpan' : (res?.message || 'Gagal'));
    } catch(e) { useToast()('Error: ' + e.message); }
    setSaving('');
  };

  const saveSMTP = async () => {
    setSaving('smtp');
    try {
      const data = { email_enabled: emailEnabled, smtp_host: smtpHost, smtp_email: smtpEmail, smtp_port: parseInt(smtpPort) || 587, smtp_ssl: smtpSSL };
      if (smtpPassword) data.smtp_password = smtpPassword;
      const res = await api.updateSettings(data);
      useToast()(res?.success ? 'SMTP berhasil disimpan' : (res?.message || 'Gagal'));
    } catch(e) { useToast()('Error: ' + e.message); }
    setSaving('');
  };

  const saveTelegram = async () => {
    setSaving('tg');
    try {
      const data = { telegram_chat_id: tgChatId };
      if (tgToken) data.telegram_bot_token = tgToken;
      const res = await api.updateSettings(data);
      useToast()(res?.success ? 'Telegram berhasil disimpan' : (res?.message || 'Gagal'));
    } catch(e) { useToast()('Error: ' + e.message); }
    setSaving('');
  };

  return (
    <>
      {/* Channel toggles */}
      <Section title="Channel Notifikasi" sub="Atur channel notifikasi untuk admin & donatur.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label:'WhatsApp ke donatur',                sub:'Konfirmasi pembayaran via WA',            v:true },
            { label:'Email ke donatur',                   sub:'Kuitansi & terima kasih',                 v:true },
            { label:'Notifikasi admin (donasi sukses)',    sub:'Telegram bot ke channel admin',           v:true },
            { label:'Notifikasi admin (donasi pending)',   sub:'Pengingat ke tim CS',                     v:true },
            { label:'Notifikasi admin (donasi gagal)',     sub:'Alert ke channel admin',                  v:true },
            { label:'Weekly performance digest',           sub:'Email mingguan ringkasan performa',       v:false },
            { label:'Pengingat campaign berakhir',         sub:'5 hari sebelum campaign berakhir',        v:true },
            { label:'Alert pixel error',                   sub:'Saat Meta/Google/TikTok gagal merespons', v:true },
          ].map((n, i) => (
            <div key={i} className="p-3 rounded-xl border border-line dark:border-slate-700">
              <Toggle checked={n.v} label={n.label} sub={n.sub}/>
            </div>
          ))}
        </div>
      </Section>

      {/* WhatsApp */}
      <Section title="WhatsApp Gateway" sub="Kirim notifikasi via WhatsApp."
        actions={<Button variant="primary" size="sm" onClick={saveWA}>{saving==='wa' ? 'Menyimpan...' : 'Simpan WA'}</Button>}>
        <div className="space-y-3">
          <Field label="Provider WhatsApp">
            <Select value={waProvider} onChange={e => setWaProvider(e.target.value)}>
              <option value="fonnte">Fonnte</option>
              <option value="starsender">Starsender</option>
            </Select>
          </Field>
          <Field label="API Token / Key" hint="Token dari dashboard provider WA">
            <Input type="password" value={waToken} onChange={e => setWaToken(e.target.value)} placeholder="Masukkan token..."/>
          </Field>
          <Field label="No. WhatsApp Admin" hint="Nomor admin yang menerima notifikasi">
            <Input value={waAdmin} onChange={e => setWaAdmin(e.target.value)} placeholder="+62 811 1000 1000"/>
          </Field>
        </div>
      </Section>

      {/* Email / SMTP */}
      <Section title="Email SMTP" sub="Kirim email notifikasi, invoice, dan receipt."
        actions={<div className="flex items-center gap-2">
          <Toggle checked={emailEnabled} onChange={setEmailEnabled}/>
          <Button variant="primary" size="sm" onClick={saveSMTP}>{saving==='smtp' ? 'Menyimpan...' : 'Simpan SMTP'}</Button>
        </div>}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="SMTP Host"><Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com"/></Field>
          <Field label="SMTP Port"><Input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="587"/></Field>
          <Field label="Email"><Input value={smtpEmail} onChange={e => setSmtpEmail(e.target.value)} placeholder="noreply@niatbaik.org"/></Field>
          <Field label="Password" hint="Gmail: gunakan App Password"><Input type="password" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)} placeholder="App Password"/></Field>
        </div>
        <div className="mt-3">
          <Toggle checked={smtpSSL} onChange={setSmtpSSL} label="Gunakan SSL/TLS" sub="Wajib aktif untuk port 465 / 587"/>
        </div>
      </Section>

      {/* Telegram */}
      <Section title="Telegram Bot" sub="Notifikasi admin via Telegram."
        actions={<Button variant="primary" size="sm" onClick={saveTelegram}>{saving==='tg' ? 'Menyimpan...' : 'Simpan Telegram'}</Button>}>
        <div className="space-y-3">
          <Field label="Bot Token" hint="Dari @BotFather di Telegram">
            <Input type="password" value={tgToken} onChange={e => setTgToken(e.target.value)} placeholder="123456:ABC-DEF..."/>
          </Field>
          <Field label="Chat ID" hint="ID channel/group untuk notifikasi">
            <Input value={tgChatId} onChange={e => setTgChatId(e.target.value)} placeholder="-1001234567890"/>
          </Field>
        </div>
      </Section>
    </>
  );
}

// =========================================================
// 6. Social Proof
// =========================================================
function SocialPanel() {
  const [enabled, setEnabled] = uS(true);
  const [interval, setInterval_] = uS('8');
  const [position, setPosition] = uS(2); // 0=TL 1=TR 2=BL 3=BR
  const [maxItems, setMaxItems] = uS('10');
  const [template, setTemplate] = uS('{{nama}} baru saja berdonasi {{nominal}} untuk {{campaign}}');
  const [saving, setSaving] = uS(false);

  uE(() => {
    api.settings().then(r => {
      if (!r?.data) return;
      const d = r.data;
      if (d.socialproof_enabled != null) setEnabled(d.socialproof_enabled);
      if (d.socialproof_interval) setInterval_(String(d.socialproof_interval));
      if (d.socialproof_position != null) setPosition(d.socialproof_position);
      if (d.socialproof_max) setMaxItems(String(d.socialproof_max));
      if (d.socialproof_template) setTemplate(d.socialproof_template);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateSettings({
        socialproof_enabled: enabled,
        socialproof_interval: parseInt(interval) || 8,
        socialproof_position: position,
        socialproof_max: parseInt(maxItems) || 10,
        socialproof_template: template,
      });
      if (res?.success || res?.data) useToast()('Social proof berhasil disimpan');
      else useToast()(res?.message || 'Gagal menyimpan');
    } catch(e) { useToast()('Error: ' + e.message); }
    setSaving(false);
  };

  const positions = ['Top L','Top R','Bottom L','Bottom R'];

  return (
    <Section title="Popup Social Proof" sub="Tingkatkan kepercayaan donatur dengan notifikasi donasi terbaru."
      actions={<div className="flex items-center gap-2">
        <Toggle checked={enabled} onChange={setEnabled}/>
        <Button variant="primary" size="sm" onClick={handleSave}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
      </div>}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Controls */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted dark:text-slate-400">Interval muncul</label>
            <Select value={interval} onChange={e => setInterval_(e.target.value)} className="mt-1">
              <option value="5">Setiap 5 detik</option>
              <option value="8">Setiap 8 detik</option>
              <option value="15">Setiap 15 detik</option>
              <option value="30">Setiap 30 detik</option>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted dark:text-slate-400">Posisi popup</label>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {positions.map((p, i) => (
                <button key={p} onClick={() => setPosition(i)}
                  className={`py-2 rounded-lg border-2 text-xs font-bold transition ${position===i ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-line dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{p}</button>
              ))}
            </div>
          </div>

          <Field label="Max popup per sesi">
            <Input value={maxItems} onChange={e => setMaxItems(e.target.value)} type="number" suffix="popup"/>
          </Field>

          <div>
            <label className="text-xs font-semibold text-muted dark:text-slate-400">Template kalimat</label>
            <textarea className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-line dark:border-slate-700 text-sm font-mono mt-1" rows="3"
              value={template} onChange={e => setTemplate(e.target.value)}/>
            <div className="text-[11px] text-muted dark:text-slate-400 mt-1">Variabel: {'{{nama}}'}, {'{{nominal}}'}, {'{{campaign}}'}</div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted dark:text-slate-400">Data fallback (saat sepi)</label>
            <Input defaultValue="Hamba Allah, Rizky H., Siti N., Hamba Allah"/>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-6 flex items-end justify-start min-h-[260px] border border-dashed border-line dark:border-slate-700">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-line dark:border-slate-700 p-3 flex items-center gap-3 w-72">
            <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 flex items-center justify-center shrink-0"><Icon name="heart" size={18}/></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-ink dark:text-slate-100"><b>Hamba Allah</b> baru saja berdonasi</div>
              <div className="text-sm font-bold text-brand-600">Rp 250.000</div>
              <div className="text-[10px] text-muted dark:text-slate-400">untuk "Bantuan Aira" - 12 detik lalu</div>
            </div>
            <button className="self-start text-slate-400"><Icon name="close" size={12}/></button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-900/40 rounded-2xl p-3">
        <Icon name="sparkle" size={20} className="text-sky-700 dark:text-sky-300 mt-0.5 shrink-0"/>
        <div className="flex-1 text-sm">
          <b className="text-sky-700 dark:text-sky-300">Tip:</b>
          <span className="text-slate-700 dark:text-slate-300"> Aktifkan social proof untuk meningkatkan konversi hingga 12-18%.</span>
        </div>
      </div>
    </Section>
  );
}

// =========================================================
// 7. Fundraising
// =========================================================
function FundraisingPanel() {
  const [enabled, setEnabled] = uS(true);
  const [autoApprove, setAutoApprove] = uS(true);
  const [commission, setCommission] = uS('10');
  const [minPayout, setMinPayout] = uS('100000');
  const [payoutCycle, setPayoutCycle] = uS('month');
  const [saving, setSaving] = uS(false);

  uE(() => {
    api.settings().then(r => {
      if (!r?.data) return;
      const d = r.data;
      if (d.fundraiser_enabled != null) setEnabled(d.fundraiser_enabled);
      if (d.fundraiser_auto_approve != null) setAutoApprove(d.fundraiser_auto_approve);
      if (d.fundraiser_commission != null) setCommission(String(d.fundraiser_commission));
      if (d.fundraiser_min_payout != null) setMinPayout(String(d.fundraiser_min_payout));
      if (d.fundraiser_payout_cycle) setPayoutCycle(d.fundraiser_payout_cycle);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateSettings({
        fundraiser_enabled: enabled,
        fundraiser_auto_approve: autoApprove,
        fundraiser_commission: parseInt(commission) || 10,
        fundraiser_min_payout: parseInt(minPayout) || 100000,
        fundraiser_payout_cycle: payoutCycle,
      });
      if (res?.success || res?.data) useToast()('Fundraiser berhasil disimpan');
      else useToast()(res?.message || 'Gagal menyimpan');
    } catch(e) { useToast()('Error: ' + e.message); }
    setSaving(false);
  };

  return (
    <Section title="Program Fundraiser" sub="Aktifkan program afiliasi/fundraiser & atur skema komisi."
      actions={<Button variant="primary" size="sm" onClick={handleSave}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>}>
      <div className="space-y-3">
        <Toggle checked={enabled} onChange={setEnabled} label="Aktifkan fundraiser" sub="Izinkan mitra mempromosikan campaign dengan link referral."/>
        <Toggle checked={autoApprove} onChange={setAutoApprove} label="Otomatis hitung komisi" sub="Komisi dihitung tiap minggu, payout manual oleh admin."/>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          <Field label="Default komisi"><Input value={commission} onChange={e => setCommission(e.target.value)} type="number" suffix="%"/></Field>
          <Field label="Minimum payout"><Input value={minPayout} onChange={e => setMinPayout(e.target.value)} type="number" suffix="IDR"/></Field>
          <Field label="Periode payout">
            <Select value={payoutCycle} onChange={e => setPayoutCycle(e.target.value)}>
              <option value="week">Mingguan</option>
              <option value="month">Bulanan</option>
            </Select>
          </Field>
        </div>

        <div className="rounded-xl border border-line dark:border-slate-700 p-4 mt-3">
          <div className="font-semibold text-ink dark:text-slate-100 mb-2">Aturan khusus per campaign</div>
          <div className="space-y-2">
            {[
              { c:'Bantuan Aira', pct:12 },
              { c:'Sumur Bersih NTT', pct:10 },
              { c:'Wakaf Quran', pct:8 },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="flex-1 font-medium text-ink dark:text-slate-100">{r.c}</span>
                <span className="font-bold text-brand-600">{r.pct}%</span>
                <button className="text-slate-400 hover:text-ink dark:hover:text-slate-100"><Icon name="edit" size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        <Field label="Format referral link">
          <div className="bg-slate-900 text-cyan-300 rounded-xl p-3 text-xs font-mono break-all">
            https://niatbaik.org/c/campaign-slug?ref=FUNDRAISER_CODE
          </div>
        </Field>
      </div>
    </Section>
  );
}

// =========================================================
// 8. General
// =========================================================
function GeneralPanel() {
  const [siteName, setSiteName] = uS('NIATBAIK.ORG');
  const [siteDesc, setSiteDesc] = uS('');
  const [domain, setDomain] = uS('niatbaik.org');
  const [timezone, setTimezone] = uS('WIB');
  const [currency, setCurrency] = uS('IDR');
  const [seoTitle, setSeoTitle] = uS('');
  const [seoDesc, setSeoDesc] = uS('');
  const [footerCode, setFooterCode] = uS('');
  const [poweredBy, setPoweredBy] = uS(true);
  const [adminFee, setAdminFee] = uS('0');
  const [autoSlide, setAutoSlide] = uS('5');
  const [maintenance, setMaintenance] = uS(false);
  const [saving, setSaving] = uS('');

  uE(() => {
    api.settings().then(r => {
      if (!r?.data) return;
      const d = r.data;
      if (d.site_name) setSiteName(d.site_name);
      if (d.site_description) setSiteDesc(d.site_description);
      if (d.domain) setDomain(d.domain);
      if (d.timezone) setTimezone(d.timezone);
      if (d.currency) setCurrency(d.currency);
      if (d.seo_title) setSeoTitle(d.seo_title);
      if (d.seo_description) setSeoDesc(d.seo_description);
      if (d.footer_code) setFooterCode(d.footer_code);
      if (d.powered_by != null) setPoweredBy(d.powered_by);
      if (d.admin_fee != null) setAdminFee(String(d.admin_fee));
      if (d.auto_slide != null) setAutoSlide(String(d.auto_slide));
      setMaintenance(!!d.maintenance_mode);
    });
  }, []);

  const saveGeneral = async () => {
    setSaving('general');
    try {
      const res = await api.updateSettings({
        site_name: siteName, site_description: siteDesc, domain, timezone, currency,
        footer_code: footerCode, powered_by: poweredBy,
        admin_fee: parseInt(adminFee) || 0, auto_slide: parseInt(autoSlide) || 5,
      });
      if (res?.success || res?.data) useToast()('Pengaturan umum berhasil disimpan');
      else useToast()(res?.message || 'Gagal menyimpan');
    } catch(e) { useToast()('Error: ' + e.message); }
    setSaving('');
  };

  const saveSEO = async () => {
    setSaving('seo');
    try {
      const res = await api.updateSettings({ seo_title: seoTitle, seo_description: seoDesc });
      if (res?.success || res?.data) useToast()('SEO berhasil disimpan');
      else useToast()(res?.message || 'Gagal menyimpan');
    } catch(e) { useToast()('Error: ' + e.message); }
    setSaving('');
  };

  const handleMaintenance = async (val) => {
    setMaintenance(val);
    try {
      const res = await api.updateSettings({ maintenance_mode: val });
      if (res?.success || res?.data) useToast()(val ? 'Mode maintenance aktif' : 'Mode maintenance nonaktif');
      else useToast()(res?.message || 'Gagal mengubah mode');
    } catch(e) { useToast()('Error: ' + e.message); }
  };

  return (
    <>
      <Section title="Identitas Website"
        actions={<Button variant="primary" size="sm" onClick={saveGeneral}>{saving==='general' ? 'Menyimpan...' : 'Simpan'}</Button>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nama Website"><Input value={siteName} onChange={e => setSiteName(e.target.value)}/></Field>
          <Field label="Domain"><Input value={domain} onChange={e => setDomain(e.target.value)}/></Field>
          <Field label="Deskripsi singkat">
            <Input value={siteDesc} onChange={e => setSiteDesc(e.target.value)} placeholder="Platform donasi terpercaya..."/>
          </Field>
          <Field label="Timezone">
            <Select value={timezone} onChange={e => setTimezone(e.target.value)}>
              <option value="WIB">Asia/Jakarta (WIB) - GMT+7</option>
              <option value="WITA">Asia/Makassar (WITA) - GMT+8</option>
              <option value="WIT">Asia/Jayapura (WIT) - GMT+9</option>
            </Select>
          </Field>
          <Field label="Mata uang">
            <Select value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="IDR">IDR (Rp)</option>
              <option value="USD">USD ($)</option>
              <option value="MYR">MYR (RM)</option>
              <option value="SGD">SGD (S$)</option>
            </Select>
          </Field>
          <Field label="Admin fee"><Input value={adminFee} onChange={e => setAdminFee(e.target.value)} type="number" suffix="IDR"/></Field>
          <Field label="Auto-slide interval"><Input value={autoSlide} onChange={e => setAutoSlide(e.target.value)} type="number" suffix="detik"/></Field>
        </div>
        <div className="mt-3 space-y-3">
          <Toggle checked={poweredBy} onChange={setPoweredBy} label="Tampilkan 'Powered by NIATBAIK'" sub="Badge di footer halaman publik"/>
          <Field label="Footer code (custom script)">
            <textarea value={footerCode} onChange={e => setFooterCode(e.target.value)} rows="4"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-line dark:border-slate-700 text-sm font-mono text-ink dark:text-slate-100"
              placeholder="<!-- custom script -->"/>
          </Field>
        </div>
      </Section>

      <Section title="SEO"
        actions={<Button variant="primary" size="sm" onClick={saveSEO}>{saving==='seo' ? 'Menyimpan...' : 'Simpan SEO'}</Button>}>
        <div className="space-y-3">
          <Field label="SEO Title"><Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="NIATBAIK.ORG — Salurkan Kebaikan"/></Field>
          <Field label="SEO Description">
            <textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} rows="3"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-line dark:border-slate-700 text-sm text-ink dark:text-slate-100"
              placeholder="Platform donasi & crowdfunding terpercaya..."/>
          </Field>
        </div>
      </Section>

      <Section title="Maintenance Mode" sub="Aktifkan untuk menutup akses publik sementara.">
        <Toggle checked={maintenance} onChange={handleMaintenance} label="Aktifkan maintenance mode" sub="Pengunjung akan melihat halaman maintenance."/>
      </Section>
    </>
  );
}

// =========================================================
// Export
// =========================================================
Object.assign(window, { SettingsPage });

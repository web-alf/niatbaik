const parseArr = (v, fb) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) { try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch {} }
  return fb;
};

function SettingsView() {
  const { showToast } = useApp();
  const [tab, setTab] = useStateA('themes');
  const [settings, setSettings] = useStateA(null);
  const [settingsLoading, setSettingsLoading] = useStateA(true);
  const tabs = [
    { value:'themes',       label:'Branding',       icon:'palette' },
    { value:'form',         label:'Form',           icon:'edit' },
    { value:'payment',      label:'Payment',        icon:'creditcard' },
    { value:'tracking',     label:'Tracking & Ads', icon:'pixel' },
    { value:'notification', label:'Notification',   icon:'bell' },
    { value:'social',       label:'Social Proof',   icon:'smile' },
    { value:'fundraising',  label:'Fundraising',    icon:'handshake' },
    { value:'category',     label:'Kategori',       icon:'filter' },
    { value:'paystatus',    label:'Status Bayar',   icon:'creditcard' },
    { value:'general',      label:'General',        icon:'cog' },
  ];

  useEffectA(() => {
    (async () => {
      try {
        const res = await api.settings();
        setSettings(res?.data || {});
      } catch {}
      setSettingsLoading(false);
    })();
  }, []);

  const saveSettings = async (patch) => {
    try {
      // Send ONLY the patch — backend merges field-by-field. Spreading the full
      // GET response sent nested objects/strings that broke c.Bind ("invalid request body").
      await api.updateSettings(patch);
      setSettings(prev => ({ ...(prev || {}), ...patch }));
      showToast('Pengaturan berhasil disimpan');
    } catch (e) { showToast('Gagal menyimpan: ' + (e?.message || '')); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Pengaturan platform NIATBAIK.ORG."/>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-1 p-3 h-fit lg:sticky top-20">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button key={t.value} onClick={() => setTab(t.value)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${tab===t.value ? 'bg-brand-50 text-brand-700' : 'text-ink/80 hover:bg-bg2'}`}>
                <Icon name={t.icon} size={16} className={tab===t.value ? 'text-brand-600' : 'text-mute'}/>
                {t.label}
              </button>
            ))}
          </nav>
        </Card>

        <div className="lg:col-span-4 space-y-5">
          {settingsLoading && <Card className="p-8 text-center text-mute">Memuat pengaturan…</Card>}
          {!settingsLoading && tab === 'themes' && <ThemesPanel settings={settings} onSave={saveSettings}/>}
          {!settingsLoading && tab === 'form' && <FormPanel settings={settings} onSave={saveSettings}/>}
          {!settingsLoading && tab === 'payment' && <PaymentPanel settings={settings} onSave={saveSettings}/>}
          {!settingsLoading && tab === 'tracking' && <TrackingPanel settings={settings} onSave={saveSettings}/>}
          {!settingsLoading && tab === 'notification' && <NotificationPanel settings={settings} onSave={saveSettings}/>}
          {!settingsLoading && tab === 'social' && <SocialPanel settings={settings} onSave={saveSettings}/>}
          {!settingsLoading && tab === 'fundraising' && <FundraisingPanel settings={settings} onSave={saveSettings}/>}
          {!settingsLoading && tab === 'category' && <CategoryPanel/>}
          {!settingsLoading && tab === 'paystatus' && <PaymentStatusPanel/>}
          {!settingsLoading && tab === 'general' && <GeneralPanel settings={settings} onSave={saveSettings}/>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, sub, children, actions }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="font-bold text-ink">{title}</div>
          {sub && <div className="text-xs text-mute mt-0.5">{sub}</div>}
        </div>
        {actions}
      </div>
      {children}
    </Card>
  );
}

function ThemesPanel({ settings, onSave }) {
  const { dark, setDark, showToast } = useApp();
  const [color, setColor] = useStateA(settings?.primary_color || '#2E4191');
  const [secondaryColor, setSecondaryColor] = useStateA(settings?.secondary_color || '#38B6FF');
  const [radius, setRadius] = useStateA(settings?.border_radius ?? 16);
  const [fontFamily, setFontFamily] = useStateA(settings?.font_family || 'plus-jakarta');
  const [buttonStyle, setButtonStyle] = useStateA(settings?.button_style || 'Solid');
  const logoRef = useRefA();
  const DEFAULT_LOGO = 'assets/logo.png';
  const [logoSrc, setLogoSrc] = useStateA(settings?.logo || settings?.logo_url || DEFAULT_LOGO);
  useEffectA(() => { if (settings?.primary_color) setColor(settings.primary_color); }, [settings]);
  useEffectA(() => { if (settings?.secondary_color) setSecondaryColor(settings.secondary_color); }, [settings]);
  useEffectA(() => { if (settings?.border_radius != null) setRadius(settings.border_radius); }, [settings]);
  useEffectA(() => { if (settings?.font_family) setFontFamily(settings.font_family); }, [settings]);
  useEffectA(() => { if (settings?.button_style) setButtonStyle(settings.button_style); }, [settings]);
  useEffectA(() => { const l = settings?.logo || settings?.logo_url; if (l) setLogoSrc(l); }, [settings]);
  const applyTheme = (c) => {
    try {
      const root = document.documentElement;
      root.style.setProperty('--nb-brand', c);
      // Override tailwind brand utility usages by injecting a style tag
      let el = document.getElementById('nb-theme-vars');
      if (!el) { el = document.createElement('style'); el.id = 'nb-theme-vars'; document.head.appendChild(el); }
      el.textContent = `.text-brand-600{color:${c} !important}.bg-brand-600{background-color:${c} !important}.border-brand-600{border-color:${c} !important}.from-brand-600{--tw-gradient-from:${c} !important}.hover\\:bg-brand-700:hover{background-color:${c} !important}`;
    } catch {}
  };
  useEffectA(() => { if (settings?.primary_color) applyTheme(settings.primary_color); }, [settings]);
  const handleLogoUpload = async () => {
    const f = logoRef.current?.files?.[0];
    if (!f) return;
    if (f.size > 1024 * 1024) { showToast('File terlalu besar (max 1MB)'); return; }
    try {
      const res = await window.api.uploadImage(f);
      const url = res?.data?.url || res?.url;
      if (url) { setLogoSrc(url); showToast('Logo berhasil diupload. Klik Simpan untuk menerapkan.'); }
      else showToast('Upload gagal');
    } catch (e) { showToast('Upload gagal: ' + (e?.message||'')); }
  };
  return (
    <>
      <Section title="Dark Mode" sub="Tampilan gelap untuk dashboard dan situs publik.">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-bg2 flex items-center justify-center text-ink">
              <Icon name={dark ? 'sun' : 'moon'} size={20}/>
            </div>
            <div>
              <div className="text-sm font-bold text-ink">{dark ? 'Dark Mode aktif' : 'Light Mode aktif'}</div>
              <div className="text-xs text-mute">Mode berlaku untuk dashboard dan halaman publik.</div>
            </div>
          </div>
          <Toggle value={dark} onChange={(v) => setDark(v)} label=""/>
        </div>
      </Section>

      <Section title="Logo & Brand">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-dashed border-line bg-bg2 p-6 flex items-center justify-center min-h-[140px]">
            <div className="text-center">
              <img src={logoSrc || DEFAULT_LOGO} alt="logo" className="mx-auto h-12"/>
              <input ref={logoRef} type="file" accept="image/png,image/svg+xml" className="hidden" onChange={handleLogoUpload}/>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Btn size="sm" variant="outline" tone="ink" icon="upload" onClick={() => logoRef.current?.click()}>Upload Logo</Btn>
                {logoSrc && logoSrc !== DEFAULT_LOGO && (
                  <Btn size="sm" variant="outline" tone="ink" icon="trash" onClick={() => { setLogoSrc(''); showToast('Logo dihapus. Klik Simpan untuk menerapkan.'); }}>Hapus</Btn>
                )}
              </div>
              <div className="text-xs text-mute mt-2">PNG / SVG · max 1MB</div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-mute">Primary Color</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-10 rounded-lg border border-line cursor-pointer"/>
                <input value={color} onChange={(e) => setColor(e.target.value)} className="field font-mono"/>
                <Btn size="sm" variant="outline" tone="ink" onClick={() => { applyTheme(color); showToast('Warna diterapkan ke seluruh web'); }}>Apply</Btn>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-mute">Secondary Color</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-10 w-10 rounded-lg border border-line cursor-pointer"/>
                <input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="field font-mono"/>
                <Btn size="sm" variant="outline" tone="ink" onClick={() => { applyTheme(secondaryColor); showToast('Warna sekunder diterapkan'); }}>Apply</Btn>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-mute">Font</label>
              <Select value={fontFamily} onChange={setFontFamily} options={[
                {value:'plus-jakarta', label:'Plus Jakarta Sans'},
                {value:'inter', label:'Inter'},
                {value:'manrope', label:'Manrope'},
                {value:'poppins', label:'Poppins'},
              ]} className="mt-1"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-mute flex items-center justify-between">Border Radius <span className="text-ink font-bold">{radius}px</span></label>
              <input type="range" min="0" max="24" step="2" value={radius} onChange={(e) => setRadius(+e.target.value)} className="w-full mt-1 accent-brand-600"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-mute">Button Style</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {['Solid','Outline','Ghost'].map((s) => (
                  <button key={s} onClick={() => setButtonStyle(s)}
                    className={`py-2 rounded-lg border text-xs font-bold ${buttonStyle === s ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Preview Theme" sub="Lihat tampilan komponen dengan tema saat ini.">
        <div className="rounded-xl bg-bg2 p-6">
          <div className="bg-white rounded-2xl p-5 border border-line shadow-card max-w-md mx-auto" style={{ borderRadius: radius + 'px' }}>
            <div className="font-bold text-lg text-ink">Donasi Hari Ini</div>
            <div className="text-mute text-sm">Bersama untuk Indonesia lebih baik.</div>
            <button className="mt-4 px-5 py-2.5 rounded-xl text-white font-bold w-full"
              style={{ background: color, borderRadius: radius + 'px' }}>
              Donasi Sekarang
            </button>
            <Progress value={75} max={100} height="h-2" className="mt-3"/>
          </div>
        </div>
      </Section>

      <div className="flex justify-end mt-4">
        <Btn icon="check" onClick={() => { applyTheme(color); onSave({ primary_color: color, secondary_color: secondaryColor, border_radius: radius, logo: logoSrc === DEFAULT_LOGO ? '' : logoSrc, font_family: fontFamily, button_style: buttonStyle }); }}>Simpan Perubahan</Btn>
      </div>
    </>
  );
}

const DEFAULT_FIELDS = [
  { label:'Nama donatur',       enabled:true,  required:true },
  { label:'No. WhatsApp',       enabled:true,  required:true },
  { label:'Email',              enabled:true,  required:false },
  { label:'Alamat',             enabled:false, required:false },
  { label:'NPWP (zakat)',       enabled:false, required:false },
  { label:'Doa / pesan donatur', enabled:true, required:false },
  { label:'Checkbox anonim',    enabled:true,  required:false },
];
const DEFAULT_PRESETS = [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

function FormPanel({ settings, onSave }) {
  const { showToast } = useApp();
  const [fields, setFields] = useStateA(parseArr(settings?.form_fields_config, DEFAULT_FIELDS));
  const [presets, setPresets] = useStateA(parseArr(settings?.nominal_presets, DEFAULT_PRESETS));
  // Read the SAME keys the backend persists (min_donation_global / anonymous_default /
  // message_enabled). Previously this read non-existent keys, so saved toggles
  // appeared to revert on reload.
  const initMin = settings?.min_donation_global ? 'Rp ' + Number(settings.min_donation_global).toLocaleString('id-ID') : 'Rp 10.000';
  const [minDonation, setMinDonation] = useStateA(initMin);
  const [allowAnon, setAllowAnon] = useStateA(settings?.anonymous_default ?? true);
  const [allowDoa, setAllowDoa] = useStateA(settings?.message_enabled ?? true);
  const [newPreset, setNewPreset] = useStateA('');
  useEffectA(() => { setFields(parseArr(settings?.form_fields_config, DEFAULT_FIELDS)); }, [settings]);
  useEffectA(() => { setPresets(parseArr(settings?.nominal_presets, DEFAULT_PRESETS)); }, [settings]);
  useEffectA(() => { if (settings?.min_donation_global) setMinDonation('Rp ' + Number(settings.min_donation_global).toLocaleString('id-ID')); }, [settings]);
  useEffectA(() => { if (settings?.anonymous_default != null) setAllowAnon(settings.anonymous_default); }, [settings]);
  useEffectA(() => { if (settings?.message_enabled != null) setAllowDoa(settings.message_enabled); }, [settings]);

  const toggleField = (i, key) => setFields(prev => prev.map((f, j) => j === i ? { ...f, [key]: !f[key] } : f));
  const removePreset = (p) => setPresets(prev => prev.filter(x => x !== p));
  const addPreset = () => {
    const v = parseInt(String(newPreset).replace(/\D/g, ''), 10);
    if (v && v >= 1000 && !presets.includes(v)) {
      setPresets(prev => [...prev, v].sort((a, b) => a - b));
      setNewPreset('');
      showToast('Preset nominal ditambahkan');
    }
  };

  return (
    <>
      <Section title="Field Form Donasi" sub="Atur field yang muncul pada form donasi.">
        <div className="space-y-3">
          {(Array.isArray(fields)?fields:[]).map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-line">
              <div className="font-semibold text-ink flex-1">{f.label}</div>
              <label className="text-xs text-mute flex items-center gap-2">Required
                <input type="checkbox" checked={f.required} onChange={() => toggleField(i, 'required')} className="rounded border-line"/>
              </label>
              <Toggle value={f.enabled} onChange={() => toggleField(i, 'enabled')}/>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Nominal Preset & Minimum">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-mute">Preset nominal</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(Array.isArray(presets)?presets:[]).map((p) => (
                <span key={p} className="px-2.5 py-1 rounded-md border border-line bg-bg2 text-xs font-bold text-ink inline-flex items-center gap-1">
                  {fmtIDRShort(p)}
                  <button onClick={() => removePreset(p)} className="text-mute hover:text-rose-600"><Icon name="close" size={12}/></button>
                </span>
              ))}
              <span className="inline-flex items-center gap-1">
                <input value={newPreset} onChange={(e) => setNewPreset(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPreset()}
                  placeholder="50000" className="w-20 px-2 py-1 rounded-md border border-dashed border-line text-xs font-bold text-ink outline-none focus:border-brand-600"/>
                <button onClick={addPreset} className="px-2.5 py-1 rounded-md border border-dashed border-line text-xs font-bold text-mute hover:text-brand-600 hover:border-brand-300">+ Tambah</button>
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-mute">Minimum donasi</label>
              <input className="field mt-1" value={minDonation} onChange={(e) => setMinDonation(e.target.value)}/>
            </div>
            <Toggle value={allowAnon} onChange={setAllowAnon} label="Izinkan donasi anonim" sub="Donatur bisa tampil sebagai Hamba Allah."/>
            <Toggle value={allowDoa} onChange={setAllowDoa} label="Aktifkan doa / pesan donatur" sub="Field doa akan tampil di form donasi."/>
          </div>
        </div>
      </Section>

      <div className="flex justify-end mt-4">
        <Btn icon="check" onClick={() => onSave({
          form_fields_config: JSON.stringify(fields),
          nominal_presets: JSON.stringify(presets),
          min_donation_global: parseInt(String(minDonation).replace(/\D/g, ''), 10) || 10000,
          anonymous_default: allowAnon,
          message_enabled: allowDoa,
        })}>Simpan Perubahan</Btn>
      </div>
    </>
  );
}

function PaymentPanel({ settings, onSave }) {
  const { showToast } = useApp();
  const [methods, setMethods] = useStateA([
    { id:'m1', name:'QRIS',                provider:'QRIS',         type:'QRIS',          holder:'Yayasan Niat Baik', account:'-',                  fee:'0.7%',           active:true,  locked:true },
    { id:'m2', name:'BCA Virtual Account', provider:'Bank BCA',     type:'Bank Transfer', holder:'Yayasan Niat Baik', account:'8901234567',         fee:'Rp 4.000',       active:true },
    { id:'m3', name:'Mandiri VA',          provider:'Bank Mandiri', type:'Bank Transfer', holder:'Yayasan Niat Baik', account:'8908765432',         fee:'Rp 4.000',       active:true },
    { id:'m4', name:'BNI VA',              provider:'Bank BNI',     type:'Bank Transfer', holder:'Yayasan Niat Baik', account:'8901122334',         fee:'Rp 4.000',       active:true },
    { id:'m5', name:'GoPay',               provider:'GoPay',        type:'E-wallet',      holder:'Yayasan Niat Baik', account:'08123456789',        fee:'2%',             active:true,  locked:true },
    { id:'m6', name:'OVO',                 provider:'OVO',          type:'E-wallet',      holder:'Yayasan Niat Baik', account:'08129876543',        fee:'2%',             active:true,  locked:true },
    { id:'m7', name:'Dana',                provider:'Dana',         type:'E-wallet',      holder:'Yayasan Niat Baik', account:'08118887766',        fee:'2%',             active:true,  locked:true },
    { id:'m8', name:'ShopeePay',           provider:'ShopeePay',    type:'E-wallet',      holder:'Yayasan Niat Baik', account:'08113334455',        fee:'2%',             active:false, locked:true },
    { id:'m9', name:'Kartu Kredit',        provider:'Visa/Master',  type:'Card',          holder:'-',                 account:'-',                   fee:'2.9% + Rp 2.000', active:false, locked:true },
  ]);
  const [modalOpen, setModalOpen] = useStateA(false);
  const [editing, setEditing]     = useStateA(null);
  const [confirmDel, setConfirmDel] = useStateA(null);

  const typeMapReverse = { va:'Bank Transfer', ewallet:'E-wallet', qris:'QRIS', card:'Card' };
  const mapMethod = (m) => ({
    id: m.id,
    name: m.bank_name || m.name || '—',
    provider: m.bank_type || m.provider || m.bank_name || '—',
    type: typeMapReverse[m.type] || m.type || 'Bank Transfer',
    holder: m.account_name || m.holder || '-',
    account: m.bank_number || m.account || '-',
    fee: m.admin_fee ? ('Rp ' + fmtNum(m.admin_fee)) : (m.fee || '0'),
    image: m.image || '',
    active: m.active !== false,
    locked: false,
  });
  useEffectA(() => {
    api.paymentMethods().then(res => { if (res?.data?.length) setMethods(res.data.map(mapMethod)); }).catch(() => {});
  }, []);

  const openAdd  = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (m) => { setEditing(m);  setModalOpen(true); };

  const handleSave = async (data) => {
    try {
      if (editing) {
        await api.updatePaymentMethod(editing.id, data);
        showToast('Payment berhasil diupdate');
      } else {
        await api.createPaymentMethod(data);
        showToast('Payment berhasil ditambahkan');
      }
      try {
        const res = await api.paymentMethods();
        if (res?.data) setMethods(res.data.map(mapMethod));
      } catch {}
    } catch (e) { showToast('Gagal: ' + (e?.message || '')); }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    try {
      await api.deletePaymentMethod(confirmDel.id);
      setMethods((prev) => prev.filter(x => x.id !== confirmDel.id));
      showToast(`Payment "${confirmDel.name}" dihapus`);
    } catch (e) {
      showToast('Gagal menghapus: ' + (e?.message || ''));
    }
    setConfirmDel(null);
  };

  // Persist the active/inactive change, not just local UI state (was a no-op that
  // reverted on reload). Optimistically flip, then PUT; revert + toast on failure.
  // The update DTO requires bank_name + type, so reconstruct them from the row.
  const typeMapFwd = { 'Bank Transfer':'va', 'E-wallet':'ewallet', 'QRIS':'qris', 'Card':'card' };
  const toggle = async (m) => {
    const next = !m.active;
    setMethods((prev) => prev.map(x => x.id === m.id ? { ...x, active: next } : x));
    try {
      await api.updatePaymentMethod(m.id, {
        bank_name: m.name,
        bank_type: m.provider,
        bank_number: m.account === '-' ? '' : m.account,
        account_name: m.holder === '-' ? '' : m.holder,
        type: typeMapFwd[m.type] || 'va',
        image: m.image || '',
        active: next,
      });
      showToast(next ? 'Metode pembayaran diaktifkan' : 'Metode pembayaran dinonaktifkan');
    } catch (e) {
      setMethods((prev) => prev.map(x => x.id === m.id ? { ...x, active: m.active } : x)); // revert
      showToast('Gagal mengubah status: ' + (e?.message || ''));
    }
  };

  return (
    <>
      <Section title="Payment Gateway" sub="Kelola metode pembayaran yang tersedia bagi donatur. Tambah rekening bank tujuan, atau aktifkan/nonaktifkan metode existing."
        actions={<Btn size="sm" icon="plus" onClick={openAdd}>Add Payment</Btn>}>

        <div className="space-y-2">
          {methods.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-line hover:border-brand-200 transition-colors group">
              <PaymentLogo provider={m.provider}/>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-bold text-ink">{m.name}</div>
                  <Badge tone={m.type === 'QRIS' ? 'brand' : m.type === 'Bank Transfer' ? 'sky' : m.type === 'E-wallet' ? 'purple' : 'slate'} size="sm">
                    {m.type}
                  </Badge>
                  {m.locked && <Badge tone="outline" size="sm">default</Badge>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-mute">
                  {m.account && m.account !== '-' && (
                    <span className="font-mono">
                      <span className="text-mute">No. Rek:</span> <b className="text-ink">{m.account}</b>
                    </span>
                  )}
                  {m.holder && m.holder !== '-' && <span>a.n. {m.holder}</span>}
                  <span>fee {m.fee}</span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <StatusBadge status={m.active ? 'active' : 'inactive'}/>
                <Toggle value={m.active} onChange={() => toggle(m)}/>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(m)} title="Edit"
                  className="h-8 w-8 rounded-md text-mute hover:bg-brand-50 hover:text-brand-600 flex items-center justify-center">
                  <Icon name="edit" size={14}/>
                </button>
                <button onClick={() => setConfirmDel(m)} disabled={m.locked} title={m.locked ? 'Default · tidak bisa dihapus' : 'Hapus'}
                  className={`h-8 w-8 rounded-md flex items-center justify-center ${m.locked ? 'text-mute/40 cursor-not-allowed' : 'text-mute hover:bg-rose-50 hover:text-rose-600'}`}>
                  <Icon name="trash" size={14}/>
                </button>
              </div>
            </div>
          ))}

        </div>
      </Section>

      <Section title="Payment Report" sub="Unduh laporan berdasarkan metode pembayaran." actions={<Btn size="sm" icon="download">Download semua</Btn>}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['QRIS','Bank VA','GoPay','OVO','Dana','ShopeePay','Card','Lainnya'].map((p) => (
            <button key={p} className="p-3 rounded-xl border border-line hover:border-brand-600 hover:bg-brand-50 text-left">
              <div className="text-xs text-mute">Metode</div>
              <div className="font-bold text-ink">{p}</div>
              <div className="mt-2 text-[11px] inline-flex items-center gap-1 text-brand-600 font-semibold"><Icon name="download" size={12}/> Unduh CSV</div>
            </button>
          ))}
        </div>
      </Section>

      <PaymentEditorModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} editing={editing} onSave={handleSave}/>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Hapus Metode Pembayaran" size="sm"
        footer={<>
          <Btn variant="outline" tone="ink" onClick={() => setConfirmDel(null)}>Batal</Btn>
          <Btn tone="bad" icon="trash" onClick={handleDelete}>Hapus permanen</Btn>
        </>}>
        <div className="text-sm text-ink/85">
          Hapus <b>{confirmDel?.name}</b> dari daftar metode pembayaran?
        </div>
        {confirmDel?.account && confirmDel.account !== '-' && (
          <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
            <Icon name="shield" size={12} className="inline mr-1"/>
            No. Rek <b className="font-mono">{confirmDel.account}</b> a.n. <b>{confirmDel.holder}</b> tidak akan tersedia lagi untuk donatur baru.
          </div>
        )}
      </Modal>
    </>
  );
}

// =========================================================
// Payment provider logo / acronym tile
// =========================================================
function PaymentLogo({ provider }) {
  const brands = {
    'QRIS':         { label:'QRIS',  bg:'#E21A1A', fg:'#fff' },
    'Bank BCA':     { label:'BCA',   bg:'#003D79', fg:'#fff' },
    'Bank Mandiri': { label:'MANDIRI', bg:'#003B71', fg:'#F5A623' },
    'Bank BNI':     { label:'BNI',   bg:'#F05A22', fg:'#fff' },
    'Bank BRI':     { label:'BRI',   bg:'#00529C', fg:'#fff' },
    'Bank Syariah Indonesia': { label:'BSI', bg:'#00A651', fg:'#fff' },
    'CIMB Niaga':   { label:'CIMB',  bg:'#7B0C14', fg:'#fff' },
    'Permata Bank': { label:'PRMT',  bg:'#005C37', fg:'#fff' },
    'BTN':          { label:'BTN',   bg:'#F37021', fg:'#fff' },
    'Maybank':      { label:'MAY',   bg:'#FFC72C', fg:'#000' },
    'GoPay':        { label:'GoPay', bg:'#00AED6', fg:'#fff' },
    'OVO':          { label:'OVO',   bg:'#4C3494', fg:'#fff' },
    'Dana':         { label:'DANA',  bg:'#108EE9', fg:'#fff' },
    'ShopeePay':    { label:'SPay',  bg:'#EE4D2D', fg:'#fff' },
    'LinkAja':      { label:'LINK',  bg:'#E32127', fg:'#fff' },
    'Visa/Master':  { label:'VISA',  bg:'#1A1F71', fg:'#F7B600' },
    'Moota':        { label:'MOOTA', bg:'#4F46E5', fg:'#fff' },
    'Flip':         { label:'FLIP',  bg:'#FF6B35', fg:'#fff' },
  };
  const b = brands[provider] || { label: (provider || '??').slice(0,4).toUpperCase(), bg:'#94A3B8', fg:'#fff' };
  return (
    <div className="h-10 w-14 rounded-md border border-line flex items-center justify-center shrink-0"
      style={{ background: b.bg, color: b.fg }}>
      <span className="text-[9px] font-extrabold tracking-wider leading-none">{b.label}</span>
    </div>
  );
}

// =========================================================
// Payment Editor Modal
// =========================================================
const PAYMENT_TYPES = ['Bank Transfer', 'Virtual Account (VA)', 'QRIS', 'E-wallet', 'Card (CC/Debit)'];
const BANKS = [
  'Bank BCA', 'Bank Mandiri', 'Bank BNI', 'Bank BRI', 'Bank Syariah Indonesia',
  'CIMB Niaga', 'Permata Bank', 'BTN', 'Maybank', 'OCBC NISP', 'Danamon', 'Panin',
  'Bank Mega', 'Bank Jago', 'SeaBank', 'Jenius',
];
const EWALLETS = ['GoPay', 'OVO', 'Dana', 'ShopeePay', 'LinkAja'];
// Payment-gateway aggregators offered under the Virtual Account section
const VA_GATEWAYS = ['Moota', 'Flip'];

function PaymentEditorModal({ open, onClose, editing, onSave }) {
  const isEdit = !!editing;

  const blankMoota = () => ({
    signature:   true,
    endpoint:    'https://donasi.niatbaik.org/push',
    secretToken: '',
    dateRange:   2,
  });
  const blankFlip = () => ({
    mode:           'live',          // 'sandbox' | 'live'
    secretKey:      '',
    validationToken:'',
    callbackUrl:    'https://donasi.niatbaik.org/callback_flip/',
    autoRedirect:   false,
    chargeFee:      'merchant',      // 'merchant' | 'donatur'
  });

  const [form, setForm] = useStateA(() => ({
    type:     editing?.type     || 'Bank Transfer',
    provider: editing?.provider || 'Bank BCA',
    name:     editing?.name     || '',
    holder:   editing?.holder   || '',
    account:  editing?.account  || '',
    fee:      editing?.fee      || 'Rp 4.000',
    image:    editing?.image    || '',
    moota:    editing?.moota    || blankMoota(),
    flip:     editing?.flip     || blankFlip(),
  }));
  const [error, setError] = useStateA({});
  const [qrisUploading, setQrisUploading] = useStateA(false);
  const qrisRef = useRefA();

  useEffectA(() => {
    if (open) {
      setForm({
        type:     editing?.type     || 'Bank Transfer',
        provider: editing?.provider || 'Bank BCA',
        name:     editing?.name     || '',
        holder:   editing?.holder   || 'Yayasan Niat Baik',
        account:  editing?.account  || '',
        fee:      editing?.fee      || 'Rp 4.000',
        image:    editing?.image    || '',
        moota:    editing?.moota    || blankMoota(),
        flip:     editing?.flip     || blankFlip(),
      });
      setError({});
    }
  }, [open, editing?.id]);

  const handleQrisUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setQrisUploading(true);
    try {
      const res = await window.api.uploadImage(f);
      const url = res?.data?.url || res?.url;
      if (url) setForm((prev) => ({ ...prev, image: url }));
    } catch (err) { /* surfaced by global error handling */ }
    setQrisUploading(false);
    e.target.value = '';
  };

  // Provider options reflect type
  const providerOptions = useMemoA(() => {
    if (form.type === 'QRIS') return ['QRIS'];
    if (form.type === 'E-wallet') return EWALLETS;
    if (form.type === 'Card (CC/Debit)') return ['Visa/Master', 'JCB', 'AMEX'];
    if (form.type === 'Virtual Account (VA)') return [...VA_GATEWAYS, ...BANKS];
    return BANKS;
  }, [form.type]);

  // When type changes, snap provider to first valid option
  useEffectA(() => {
    if (!providerOptions.includes(form.provider)) {
      setForm((f) => ({ ...f, provider: providerOptions[0] }));
    }
  }, [providerOptions]);

  // Compute a display name from type+provider (used for auto-suggest AND as a
  // guaranteed non-empty fallback at submit, so backend never gets empty bank_name).
  const autoName = (type, provider) => {
    if (type === 'Virtual Account (VA)' && VA_GATEWAYS.includes(provider)) return provider + ' Payment Gateway';
    if (type === 'Virtual Account (VA)') return (provider || '').replace(/^Bank\s+/i, '') + ' Virtual Account';
    if (type === 'Bank Transfer') return (provider || '').replace(/^Bank\s+/i, '') + ' Transfer';
    if (type === 'Card (CC/Debit)') return 'Kartu Kredit / Debit';
    if (type === 'QRIS') return 'QRIS';
    return provider || 'Metode Pembayaran';
  };

  // Auto-suggest name into the field when empty.
  useEffectA(() => {
    if (!form.name || (editing && editing.name === form.name)) {
      if (!isEdit) setForm((f) => ({ ...f, name: autoName(f.type, f.provider) }));
    }
  }, [form.type, form.provider]);

  const isGateway = form.type === 'Virtual Account (VA)' && VA_GATEWAYS.includes(form.provider);
  const needsAccount = !isGateway && (form.type === 'Bank Transfer' || form.type === 'Virtual Account (VA)' || form.type === 'E-wallet');
  const setMoota = (patch) => setForm((f) => ({ ...f, moota: { ...f.moota, ...patch } }));
  const setFlip  = (patch) => setForm((f) => ({ ...f, flip:  { ...f.flip,  ...patch } }));
  const accountLabel = form.type === 'E-wallet' ? 'No. HP / akun e-wallet' : 'Nomor Rekening';
  const accountPattern = form.type === 'E-wallet' ? /^[0-9+]+$/ : /^\d+$/;

  const validate = () => {
    const e = {};
    // name is auto-derived at submit if blank — don't hard-block on it.
    if (isGateway) {
      if (form.provider === 'Moota' && !form.moota.secretToken.trim()) e.secretToken = 'Moota Secret Token wajib diisi';
      if (form.provider === 'Flip') {
        if (!form.flip.secretKey.trim()) e.secretKey = 'Flip API Secret Key wajib diisi';
        if (!form.flip.validationToken.trim()) e.validationToken = 'Flip Validation Token wajib diisi';
      }
    } else if (needsAccount) {
      if (!form.holder.trim()) e.holder = 'Atas nama wajib diisi';
      if (!form.account.trim()) e.account = 'Nomor rekening / akun wajib diisi';
      else if (!accountPattern.test(form.account.replace(/\s|-/g, ''))) e.account = 'Hanya angka diperbolehkan';
      else if (form.account.replace(/\D/g,'').length < 6) e.account = 'Minimal 6 digit';
    }
    if (!form.fee.trim()) e.fee = 'Fee wajib diisi';
    setError(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const typeMap = { 'Bank Transfer': 'va', 'Virtual Account (VA)': 'va', 'E-wallet': 'ewallet', 'QRIS': 'qris', 'Card (CC/Debit)': 'card' };
    // Guarantee non-empty bank_name (backend requires it) — derive from type+provider if blank.
    const bankName = form.name.trim() || autoName(form.type, form.provider);
    onSave({
      bank_name: bankName,
      type: typeMap[form.type] || 'va',
      account_name: (!isGateway && needsAccount) ? form.holder.trim() : '',
      bank_number: (!isGateway && needsAccount) ? form.account.replace(/\s|-/g, '') : '',
      bank_type: form.provider,
      admin_fee: parseInt(String(form.fee).replace(/[^\d]/g, ''), 10) || 0,
      active: true,
      // QRIS code image (stored as relative /uploads ref) shown on the donation page.
      image: form.type === 'QRIS' ? form.image : '',
      gateway_config: form.provider === 'Moota' ? JSON.stringify(form.moota) : form.provider === 'Flip' ? JSON.stringify(form.flip) : '',
    });
  };

  return (
    <Modal open={open} onClose={onClose} size="lg"
      title={<span className="flex items-center gap-2">
        <span className="h-7 w-7 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center"><Icon name={isEdit ? 'edit' : 'plus'} size={14}/></span>
        {isEdit ? 'Edit Payment Method' : 'Add Payment Method'}
      </span>}
      footer={<>
        <Btn variant="outline" tone="ink" onClick={onClose}>Batal</Btn>
        <Btn icon={isEdit ? 'check' : 'plus'} onClick={submit}>{isEdit ? 'Simpan perubahan' : 'Tambah Metode'}</Btn>
      </>}>

      <div className="space-y-5">
        {/* Type */}
        <div>
          <label className="text-sm font-semibold text-ink">Methode Pembayaran <span className="text-rose-600">*</span></label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PAYMENT_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                className={`p-2.5 rounded-lg border-2 text-xs font-bold text-left transition-all ${form.type === t ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink hover:bg-bg2'}`}>
                <Icon name={t === 'QRIS' ? 'pix' : t.includes('Card') ? 'creditcard' : t === 'E-wallet' ? 'wallet' : 'briefcase'} size={14}
                  className={form.type === t ? 'text-brand-600 mb-1' : 'text-mute mb-1'}/>
                <div className="leading-tight">{t}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Provider / Bank */}
          <div>
            <label className="text-sm font-semibold text-ink">
              {form.type === 'E-wallet' ? 'Provider E-wallet' : form.type === 'Card (CC/Debit)' ? 'Jaringan Kartu' : form.type === 'QRIS' ? 'Penerbit QRIS' : 'Nama Bank'}
              <span className="text-rose-600"> *</span>
            </label>
            <div className="mt-1.5 relative">
              <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="appearance-none w-full h-10 rounded-lg border border-line bg-white pl-3 pr-9 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600">
                {providerOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <Icon name="chevronD" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none"/>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-semibold text-ink">Nama Tampilan <span className="text-rose-600">*</span></label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`field mt-1.5 ${error.name ? 'border-rose-400 ring-2 ring-rose-300/30' : ''}`}
              placeholder="cth: BCA Virtual Account"/>
            {error.name && <div className="text-[11px] text-rose-600 font-semibold mt-1">{error.name}</div>}
          </div>
        </div>

        {needsAccount && (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-4 pt-4 border-t border-line">
            <div className="sm:col-span-2 text-xs font-bold uppercase tracking-wider text-mute">Detail Rekening</div>
            <div>
              <label className="text-sm font-semibold text-ink">Atas Nama <span className="text-rose-600">*</span></label>
              <input value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })}
                className={`field mt-1.5 ${error.holder ? 'border-rose-400 ring-2 ring-rose-300/30' : ''}`}
                placeholder="cth: Yayasan Niat Baik"/>
              {error.holder && <div className="text-[11px] text-rose-600 font-semibold mt-1">{error.holder}</div>}
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">{accountLabel} <span className="text-rose-600">*</span></label>
              <input value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })}
                className={`field mt-1.5 font-mono ${error.account ? 'border-rose-400 ring-2 ring-rose-300/30' : ''}`}
                placeholder={form.type === 'E-wallet' ? '081234567890' : '8901234567'}/>
              {error.account && <div className="text-[11px] text-rose-600 font-semibold mt-1">{error.account}</div>}
            </div>
          </div>
        )}

        {/* QRIS code image — uploaded here, shown on the public donation page when
            the donor selects QRIS. */}
        {form.type === 'QRIS' && (
          <div className="pt-4 border-t border-line">
            <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Gambar QRIS</div>
            <div className="flex items-center gap-4">
              <div className="h-28 w-28 rounded-xl border-2 border-dashed border-line bg-bg2 flex items-center justify-center overflow-hidden shrink-0">
                {form.image
                  ? <img src={window.mediaUrl ? window.mediaUrl(form.image) : form.image} alt="QRIS" className="h-full w-full object-contain" onError={(e)=>{e.target.style.display='none';}}/>
                  : <Icon name="image" size={28} className="text-mute"/>}
              </div>
              <div>
                <input ref={qrisRef} type="file" accept="image/*" className="hidden" onChange={handleQrisUpload}/>
                <Btn size="sm" variant="outline" tone="ink" icon="upload" onClick={() => qrisRef.current?.click()}>
                  {qrisUploading ? 'Mengupload…' : (form.image ? 'Ganti gambar QRIS' : 'Upload gambar QRIS')}
                </Btn>
                {form.image && <button onClick={() => setForm({...form, image:''})} className="ml-2 text-xs font-semibold text-rose-600 hover:underline">Hapus</button>}
                <div className="text-[11px] text-mute mt-2">PNG/JPG QR code. Tampil ke donatur saat memilih QRIS.</div>
              </div>
            </div>
          </div>
        )}

        {isGateway && form.provider === 'Moota' && <MootaConfig moota={form.moota} setMoota={setMoota} error={error}/>}
        {isGateway && form.provider === 'Flip'  && <FlipConfig  flip={form.flip}   setFlip={setFlip}   error={error}/>}

        <div className="pt-4 border-t border-line">
          <label className="text-sm font-semibold text-ink">Fee Transaksi <span className="text-rose-600">*</span></label>
          <input value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })}
            className={`field mt-1.5 ${error.fee ? 'border-rose-400 ring-2 ring-rose-300/30' : ''}`}
            placeholder="cth: Rp 4.000 atau 2%"/>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {['Gratis', 'Rp 2.500', 'Rp 4.000', '0.7%', '2%', '2.9% + Rp 2.000'].map((f) => (
              <button key={f} type="button" onClick={() => setForm({ ...form, fee: f })}
                className="px-2 py-0.5 rounded-full bg-bg2 hover:bg-brand-50 hover:text-brand-700 text-[10px] font-bold text-ink/80 border border-line">
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Live preview */}
        <div className="pt-4 border-t border-line">
          <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Preview Item</div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-line bg-bg2/40">
            <PaymentLogo provider={form.provider}/>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-bold text-ink">{form.name || 'Nama metode…'}</div>
                <Badge tone="sky" size="sm">{form.type === 'Virtual Account (VA)' ? 'Bank Transfer' : form.type}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-mute">
                {needsAccount && form.account && (
                  <span className="font-mono"><span>No. Rek:</span> <b className="text-ink">{form.account}</b></span>
                )}
                {needsAccount && form.holder && <span>a.n. {form.holder}</span>}
                <span>fee {form.fee || '—'}</span>
              </div>
            </div>
            <Badge tone="ok" dot>active</Badge>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// =========================================================
// Moota gateway config (Signature, URL Endpoint, Secret Token, Date Range)
// =========================================================
function MootaConfig({ moota, setMoota, error }) {
  const { showToast } = useApp();
  const copy = (txt) => { try { navigator.clipboard.writeText(txt); } catch{} showToast('URL endpoint disalin'); };
  return (
    <div className="pt-4 border-t border-line space-y-5">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center"><Icon name="shield" size={14}/></div>
        <div className="text-xs font-bold uppercase tracking-wider text-mute">Konfigurasi Moota</div>
      </div>

      {/* Signature */}
      <div>
        <label className="text-sm font-semibold text-ink">Signature Moota</label>
        <p className="text-xs text-mute mt-0.5 max-w-md">Default aktif untuk keamanan. Non-aktifkan jika website Anda mengalami kendala dengan pembuatan Signature Moota.</p>
        <div className="mt-2 flex items-center gap-2">
          <Toggle value={moota.signature} onChange={(v) => setMoota({ signature: v })}/>
          <span className={`text-sm font-semibold ${moota.signature ? 'text-emerald-600' : 'text-mute'}`}>{moota.signature ? 'Active' : 'Nonaktif'}</span>
        </div>
      </div>

      {/* URL Endpoint */}
      <div>
        <label className="text-sm font-semibold text-ink">URL Endpoint</label>
        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-bg2 px-3 h-10">
          <span className="flex-1 min-w-0 truncate text-sm text-mute font-mono">{moota.endpoint}</span>
          <button type="button" onClick={() => copy(moota.endpoint)}
            className="shrink-0 inline-flex items-center gap-1 text-brand-600 text-xs font-bold hover:underline">
            <Icon name="copy" size={12}/> Copy
          </button>
        </div>
        <p className="text-[11px] text-mute mt-1">Tambahkan URL ini sebagai webhook di dashboard Moota Anda.</p>
      </div>

      {/* Secret Token */}
      <div>
        <label className="text-sm font-semibold text-ink">Moota Secret Token <span className="text-rose-600">*</span></label>
        <input value={moota.secretToken} onChange={(e) => setMoota({ secretToken: e.target.value })}
          className={`field mt-1.5 font-mono ${error.secretToken ? 'border-rose-400 ring-2 ring-rose-300/30' : ''}`}
          placeholder="cth: RHRbv4xy"/>
        {error.secretToken && <div className="text-[11px] text-rose-600 font-semibold mt-1">{error.secretToken}</div>}
      </div>

      {/* Date Range */}
      <div>
        <label className="text-sm font-semibold text-ink">Moota Date Range</label>
        <input type="number" min={1} max={30} value={moota.dateRange}
          onChange={(e) => setMoota({ dateRange: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })}
          className="field mt-1.5 w-32"/>
        <p className="text-[11px] text-mute mt-1">Rentang hari pengecekan mutasi (1–30 hari).</p>
      </div>
    </div>
  );
}

// =========================================================
// Flip gateway config (Sandbox / LIVE Production)
// =========================================================
function FlipConfig({ flip, setFlip, error }) {
  const { showToast } = useApp();
  const isLive = flip.mode === 'live';
  const envLabel = isLive ? 'Production' : 'Sandbox';
  const copy = (txt) => { try { navigator.clipboard.writeText(txt); } catch{} showToast('URL callback disalin'); };
  return (
    <div className="pt-4 border-t border-line space-y-5">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center"><Icon name="creditcard" size={14}/></div>
        <div className="text-xs font-bold uppercase tracking-wider text-mute">Konfigurasi Flip</div>
      </div>

      {/* Flip Mode */}
      <div>
        <label className="text-sm font-semibold text-ink">Flip Mode</label>
        <p className="text-xs text-mute mt-0.5 max-w-md">Gunakan mode Sandbox (Development) untuk uji coba, dan LIVE jika sistem sudah berjalan.</p>
        <div className="mt-2 grid grid-cols-2 gap-2 max-w-sm">
          {[{ v:'sandbox', label:'Sandbox', sub:'Development' }, { v:'live', label:'LIVE', sub:'Production' }].map((o) => (
            <button key={o.v} type="button" onClick={() => setFlip({ mode: o.v })}
              className={`p-2.5 rounded-lg border-2 text-left transition-all ${flip.mode === o.v ? (o.v === 'live' ? 'border-emerald-500 bg-emerald-50' : 'border-amber-500 bg-amber-50') : 'border-line hover:bg-bg2'}`}>
              <div className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${flip.mode === o.v ? (o.v === 'live' ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-300'}`}/>
                <span className="text-sm font-bold text-ink">{o.label}</span>
              </div>
              <div className="text-[11px] text-mute mt-0.5 ml-4">{o.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* API Secret Key */}
      <div>
        <label className="text-sm font-semibold text-ink">Flip API Secret Key — {envLabel} <span className="text-rose-600">*</span></label>
        <input value={flip.secretKey} onChange={(e) => setFlip({ secretKey: e.target.value })}
          className={`field mt-1.5 font-mono text-xs ${error.secretKey ? 'border-rose-400 ring-2 ring-rose-300/30' : ''}`}
          placeholder={isLive ? 'JDJ5JDEzJExHYnIITUpRbFVqaEVlRlIPeGVT…' : 'sandbox_xxxxxxxxxxxxxxxxxxxx'}/>
        {error.secretKey && <div className="text-[11px] text-rose-600 font-semibold mt-1">{error.secretKey}</div>}
      </div>

      {/* Validation Token */}
      <div>
        <label className="text-sm font-semibold text-ink">Flip Validation Token — {envLabel} <span className="text-rose-600">*</span></label>
        <input value={flip.validationToken} onChange={(e) => setFlip({ validationToken: e.target.value })}
          className={`field mt-1.5 font-mono text-xs ${error.validationToken ? 'border-rose-400 ring-2 ring-rose-300/30' : ''}`}
          placeholder="cth: $2y$13$gE087s82sD7K8ze8P2G6…"/>
        {error.validationToken && <div className="text-[11px] text-rose-600 font-semibold mt-1">{error.validationToken}</div>}
      </div>

      {/* URL Callback */}
      <div>
        <label className="text-sm font-semibold text-ink">URL Callback — {envLabel}</label>
        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-bg2 px-3 h-10">
          <span className="flex-1 min-w-0 truncate text-sm text-mute font-mono">{flip.callbackUrl}</span>
          <button type="button" onClick={() => copy(flip.callbackUrl)}
            className="shrink-0 inline-flex items-center gap-1 text-brand-600 text-xs font-bold hover:underline">
            <Icon name="copy" size={12}/> Copy
          </button>
        </div>
      </div>

      {/* Auto Redirect */}
      <div>
        <label className="text-sm font-semibold text-ink">Flip Auto Redirect</label>
        <p className="text-xs text-mute mt-0.5">Hanya berlaku untuk metode Instant &amp; Transfer Flip.</p>
        <div className="mt-2 flex items-center gap-2">
          <Toggle value={flip.autoRedirect} onChange={(v) => setFlip({ autoRedirect: v })}/>
          <span className={`text-sm font-semibold ${flip.autoRedirect ? 'text-emerald-600' : 'text-mute'}`}>{flip.autoRedirect ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      {/* Charge Fee */}
      <div>
        <label className="text-sm font-semibold text-ink">Flip Charge Fee</label>
        <p className="text-xs text-mute mt-0.5 max-w-md">Biaya admin transaksi dapat dibebankan kepada Donatur atau ditanggung oleh Merchant.</p>
        <div className="mt-2 grid grid-cols-2 gap-2 max-w-sm">
          {[{ v:'merchant', label:'Merchant' }, { v:'donatur', label:'Donatur' }].map((o) => (
            <button key={o.v} type="button" onClick={() => setFlip({ chargeFee: o.v })}
              className={`p-2.5 rounded-lg border-2 text-sm font-bold transition-all ${flip.chargeFee === o.v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink hover:bg-bg2'}`}>
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${flip.chargeFee === o.v ? 'bg-brand-600' : 'bg-slate-300'}`}/>
                {o.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isLive && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-start gap-2">
          <Icon name="shield" size={13} className="mt-0.5 shrink-0"/>
          <div>Mode <b>LIVE (Production)</b> aktif — transaksi akan diproses secara nyata. Pastikan kredensial sudah benar.</div>
        </div>
      )}
    </div>
  );
}

function TrackingPanel({ settings, onSave }) {
  const { showToast } = useApp();
  const [pixelIds, setPixelIds] = useStateA({});
  // No demo IDs — each input is driven by real saved state (pixelIds, loaded from
  // settings below). Status starts neutral until a real ID is entered.
  const pixels = [
    { name:'Meta Pixel',            status:'not', icon:'pixel',  color:'bg-[#1877F2]' },
    { name:'Meta Conversions API',  status:'not', icon:'shield', color:'bg-[#1877F2]' },
    { name:'Google Tag Manager',    status:'not', icon:'code',   color:'bg-emerald-600' },
    { name:'Google Ads Conversion', status:'not', icon:'target', color:'bg-emerald-600' },
    { name:'Google Analytics 4',    status:'not', icon:'chart',  color:'bg-amber-500' },
    { name:'TikTok Pixel',          status:'not', icon:'pixel',  color:'bg-black' },
    { name:'TikTok Events API',     status:'not', icon:'shield', color:'bg-black' },
    { name:'Looker Studio (Data Studio)', status:'not', icon:'chart', color:'bg-gradient-to-br from-[#4285F4] via-[#0F9D58] to-[#F4B400]' },
  ];
  const events = ['PageView','ViewContent','InitiateCheckout','AddPaymentInfo','Lead','CompleteDonation','Purchase'];
  // Real verification of pixel events happens in each platform's official debug tool
  // (fired from the live public page), not from this admin form. Link there instead
  // of faking a "test event sent" toast.
  const PIXEL_VERIFY_URL = {
    'Meta Pixel': 'https://business.facebook.com/events_manager2',
    'Meta Conversions API': 'https://business.facebook.com/events_manager2',
    'Google Tag Manager': 'https://tagmanager.google.com/',
    'Google Ads Conversion': 'https://ads.google.com/aw/conversions',
    'Google Analytics 4': 'https://analytics.google.com/',
    'TikTok Pixel': 'https://ads.tiktok.com/i18n/events_manager',
    'TikTok Events API': 'https://ads.tiktok.com/i18n/events_manager',
    'Looker Studio (Data Studio)': 'https://lookerstudio.google.com/',
  };

  const DEFAULT_LOOKER = [
    { name:'Overview Donasi (Master)',   url:'lookerstudio.google.com/reporting/a1b2-…',  updated:'baru saja', status:'active', dim:'47 widget · 6 page', owner:'andre@niatbaik.org' },
    { name:'Performa Meta Ads',          url:'lookerstudio.google.com/reporting/x9y8-…',  updated:'5 menit lalu', status:'active', dim:'18 widget · 2 page', owner:'dewi@niatbaik.org' },
    { name:'Performa Google Ads + GA4',  url:'lookerstudio.google.com/reporting/k3l4-…',  updated:'1 jam lalu',  status:'active', dim:'22 widget · 3 page', owner:'dewi@niatbaik.org' },
    { name:'TikTok Ads Funnel',          url:'lookerstudio.google.com/reporting/p7q8-…',  updated:'belum sync',  status:'error',  dim:'14 widget · 2 page', owner:'rahmat@niatbaik.org' },
  ];
  const [lookerReports, setLookerReports] = useStateA(parseArr(settings?.looker_reports, DEFAULT_LOOKER));
  const [lookerModal, setLookerModal] = useStateA(false);
  const [lookerForm, setLookerForm] = useStateA({ name:'', url:'' });
  const [editingLooker, setEditingLooker] = useStateA(null);

  useEffectA(() => { setLookerReports(parseArr(settings?.looker_reports, DEFAULT_LOOKER)); }, [settings]);

  useEffectA(() => {
    if (!settings) return;
    setPixelIds({
      'Meta Pixel': settings.meta_pixel_id || '',
      'Google Tag Manager': settings.gtm_id || '',
      'Google Ads Conversion': settings.google_ads_conversion_id || '',
      'Google Analytics 4': settings.ga4_measurement_id || '',
      'TikTok Pixel': settings.tiktok_pixel_id || '',
      'Looker Studio (Data Studio)': settings.looker_studio_embed || '',
    });
  }, [settings]);

  // Global Meta Pixel: CAPI toggle + per-page event mapping (campaign editor inherits this on "Default").
  const DEFAULT_EVENTS = { campaign:'PageView', form:'InitiateCheckout', invoice:'Lead', success:'Purchase' };
  const parseObjSafe = (v, fb) => { if (v && typeof v === 'object') return v; if (typeof v === 'string' && v.trim()) { try { const p = JSON.parse(v); if (p && typeof p === 'object') return p; } catch {} } return fb; };
  const [capiEnabled, setCapiEnabled] = useStateA(!!settings?.meta_capi_enabled);
  const [metaEvents, setMetaEvents] = useStateA(parseObjSafe(settings?.event_tracking_config, DEFAULT_EVENTS));
  useEffectA(() => {
    setCapiEnabled(!!settings?.meta_capi_enabled);
    setMetaEvents(parseObjSafe(settings?.event_tracking_config, DEFAULT_EVENTS));
  }, [settings]);
  const EVENT_OPTS = ['', 'PageView','ViewContent','InitiateCheckout','AddPaymentInfo','Lead','Purchase','CompleteDonation'];

  const openAddLooker = () => { setEditingLooker(null); setLookerForm({ name:'', url:'' }); setLookerModal(true); };
  const openEditLooker = (r, i) => { setEditingLooker(i); setLookerForm({ name: r.name, url: r.url }); setLookerModal(true); };
  const saveLooker = () => {
    if (!lookerForm.name.trim() || !lookerForm.url.trim()) { showToast('Nama dan URL wajib diisi'); return; }
    let updated;
    if (editingLooker != null) {
      updated = lookerReports.map((r, i) => i === editingLooker ? { ...r, ...lookerForm } : r);
    } else {
      updated = [...lookerReports, { ...lookerForm, updated:'baru saja', status:'active', dim:'-', owner:'-' }];
    }
    setLookerReports(updated);
    onSave({ looker_reports: updated });
    setLookerModal(false);
  };

  const statusMap = {
    active: { label:'Active', tone:'ok', dot:true },
    not:    { label:'Not Connected', tone:'slate' },
    error:  { label:'Error', tone:'bad', dot:true },
  };
  return (
    <>
      <Section title="Pixel & Tracking Integrations" sub="Hubungkan Meta, Google, dan TikTok untuk optimasi iklan.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pixels.map((p) => (
            <div key={p.name} className="rounded-xl border border-line p-4">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg ${p.color} text-white flex items-center justify-center`}><Icon name={p.icon} size={18}/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-ink">{p.name}</div>
                    {(() => {
                      // Status reflects whether a real ID has been entered/saved.
                      const st = (pixelIds[p.name] || '').trim() ? 'active' : 'not';
                      return <Badge tone={statusMap[st].tone} dot={statusMap[st].dot} size="sm">{statusMap[st].label}</Badge>;
                    })()}
                  </div>
                  <input className="field mt-2 font-mono text-xs" value={pixelIds[p.name] ?? ''} onChange={(e) => setPixelIds(prev => ({...prev, [p.name]: e.target.value}))} placeholder="Masukkan ID…"/>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-mute">{(pixelIds[p.name] || '').trim() ? 'ID tersimpan — verifikasi event live di tool resmi' : 'Belum dikonfigurasi'}</span>
                <a className="text-brand-600 font-semibold hover:underline" href={PIXEL_VERIFY_URL[p.name] || '#'} target="_blank" rel="noopener noreferrer">Cara verifikasi</a>
              </div>
            </div>
          ))}
        </div>
        {/* Global Meta Pixel — CAPI + per-page event mapping (campaigns inherit on Default) */}
        <div className="mt-5 pt-4 border-t border-line">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-ink">Meta Pixel & Conversion API (Global)</div>
              <div className="text-xs text-mute mt-0.5">Berlaku untuk semua campaign yang memilih "Default" di editor.</div>
            </div>
            <Toggle value={capiEnabled} onChange={setCapiEnabled} label=""/>
          </div>
          <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[['campaign','Page Campaign'],['form','Page Form'],['invoice','Page Invoice'],['success','Page Success Payment']].map(([k,label]) => (
              <div key={k}>
                <label className="text-xs font-semibold text-mute">{label}</label>
                <select value={metaEvents[k] || ''} onChange={(e) => setMetaEvents({ ...metaEvents, [k]: e.target.value })} className="field mt-1">
                  {EVENT_OPTS.map(o => <option key={o} value={o}>{o || 'Pilih Event'}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Btn icon="check" onClick={() => onSave({
            meta_pixel_id: pixelIds['Meta Pixel'] || '',
            meta_capi_enabled: capiEnabled,
            event_tracking_config: JSON.stringify(metaEvents),
            gtm_id: pixelIds['Google Tag Manager'] || '',
            google_ads_conversion_id: pixelIds['Google Ads Conversion'] || '',
            ga4_measurement_id: pixelIds['Google Analytics 4'] || '',
            tiktok_pixel_id: pixelIds['TikTok Pixel'] || '',
            looker_studio_embed: pixelIds['Looker Studio (Data Studio)'] || '',
          })}>Simpan Semua Tracking</Btn>
        </div>
      </Section>

      <Section title="Looker Studio Reports" sub="Hubungkan dashboard Looker Studio (Data Studio) untuk konsolidasi semua data ads & donasi dalam satu tampilan."
        actions={<Btn size="sm" tone="brand" icon="chart" onClick={() => { try { window.dispatchEvent(new CustomEvent('nb-go-datastudio')); } catch{} }}>Buka Data Studio</Btn>}>
        <div className="space-y-3">
          {(Array.isArray(lookerReports)?lookerReports:[]).map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-line">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#4285F4] via-[#0F9D58] to-[#F4B400] text-white flex items-center justify-center shrink-0">
                <Icon name="chart" size={18}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink truncate">{r.name}</div>
                <div className="text-xs text-mute truncate">{r.url} · {r.dim}</div>
              </div>
              <div className="hidden sm:block text-xs text-mute">{r.updated}</div>
              <StatusBadge status={r.status === 'active' ? 'active' : 'inactive'}/>
              <button className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink"><Icon name="refresh" size={14}/></button>
              <button onClick={() => openEditLooker(r, i)} className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink"><Icon name="edit" size={14}/></button>
            </div>
          ))}
          <button onClick={openAddLooker} className="w-full px-3 py-2.5 rounded-xl border border-dashed border-line bg-white text-sm font-bold text-brand-600 hover:bg-brand-50">
            + Tambah Looker Studio Report
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-bg2 p-3 text-xs text-ink/80 flex items-start gap-2">
          <Icon name="shield" size={14} className="text-emerald-600 mt-0.5 shrink-0"/>
          <div>
            <b className="text-ink">Tip:</b> Hubungkan Looker Studio dengan akun Google yang memiliki akses ke <code>Meta Ads</code>, <code>Google Ads</code>, dan <code>GA4</code>.
            Setelah report tervalidasi, embed-nya akan otomatis tampil di halaman <a className="text-brand-600 font-bold cursor-pointer hover:underline" onClick={() => { try { window.dispatchEvent(new CustomEvent('nb-go-datastudio')); } catch{} }}>Data Studio</a>.
          </div>
        </div>
      </Section>

      <Section title="Event Tracking" sub="Event yang otomatis dipicu di funnel donasi.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-mute">
                <th className="py-2 font-semibold">Event</th>
                <th className="py-2 font-semibold text-center">Meta</th>
                <th className="py-2 font-semibold text-center">Google</th>
                <th className="py-2 font-semibold text-center">TikTok</th>
                <th className="py-2 font-semibold text-right">24h fired</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={e} className="border-t border-line">
                  <td className="py-2.5"><code className="text-xs font-mono font-bold bg-bg2 px-2 py-0.5 rounded text-ink">{e}</code></td>
                  {[true, true, i!==2].map((on, j) => (
                    <td key={j} className="py-2.5 text-center">
                      {on ? <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600"/>ON</span>
                          : <span className="text-mute text-xs">OFF</span>}
                    </td>
                  ))}
                  <td className="py-2.5 text-right text-mute">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Modal open={lookerModal} onClose={() => setLookerModal(false)} title={editingLooker != null ? 'Edit Looker Report' : 'Tambah Looker Report'} size="sm"
        footer={<>
          <Btn variant="outline" tone="ink" onClick={() => setLookerModal(false)}>Batal</Btn>
          <Btn icon="check" onClick={saveLooker}>{editingLooker != null ? 'Simpan' : 'Tambah'}</Btn>
        </>}>
        <div className="space-y-3">
          <div><label className="text-xs font-semibold text-mute">Nama Report</label><input className="field mt-1" value={lookerForm.name} onChange={(e) => setLookerForm(f => ({...f, name: e.target.value}))} placeholder="cth: Overview Donasi"/></div>
          <div><label className="text-xs font-semibold text-mute">URL Looker Studio</label><input className="field mt-1" value={lookerForm.url} onChange={(e) => setLookerForm(f => ({...f, url: e.target.value}))} placeholder="lookerstudio.google.com/reporting/…"/></div>
        </div>
      </Modal>
    </>
  );
}

function NotificationPanel({ settings, onSave }) {
  const INIT = [true, true, true, true, true, false, true, true];
  const labels = [
    { label:'WhatsApp ke donatur',          sub:'Konfirmasi pembayaran via WA' },
    { label:'Email ke donatur',             sub:'Kuitansi & terima kasih' },
    { label:'Notifikasi admin (donasi sukses)', sub:'Telegram bot ke channel admin' },
    { label:'Notifikasi admin (donasi pending)', sub:'Pengingat ke tim CS' },
    { label:'Notifikasi admin (donasi gagal)',  sub:'Alert ke channel admin' },
    { label:'Weekly performance digest',    sub:'Email mingguan ringkasan performa' },
    { label:'Pengingat campaign berakhir',  sub:'5 hari sebelum campaign berakhir' },
    { label:'Alert pixel error',            sub:'Saat Meta/Google/TikTok gagal merespons' },
  ];
  // notification_config is a JSON string column (backend). Parse map { label: bool }.
  const parseNotif = (raw) => {
    let obj = raw;
    if (typeof raw === 'string' && raw.trim()) { try { obj = JSON.parse(raw); } catch { obj = null; } }
    if (obj && typeof obj === 'object') return labels.map((n, i) => obj[n.label] ?? INIT[i]);
    return INIT;
  };
  const [vals, setVals] = useStateA(() => parseNotif(settings?.notification_config));
  useEffectA(() => { if (settings?.notification_config) setVals(parseNotif(settings.notification_config)); }, [settings]);
  const toggle = (i) => setVals(prev => prev.map((v, j) => j === i ? !v : v));
  return (
    <>
      <Section title="Notifikasi" sub="Atur channel notifikasi untuk admin & donatur.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {labels.map((n, i) => (
            <div key={i} className="p-3 rounded-xl border border-line">
              <Toggle value={vals[i]} onChange={() => toggle(i)} label={n.label} sub={n.sub}/>
            </div>
          ))}
        </div>
      </Section>
      <div className="flex justify-end mt-4">
        <Btn icon="check" onClick={() => onSave({ notification_config: JSON.stringify(Object.fromEntries(labels.map((n, i) => [n.label, vals[i]]))) })}>Simpan Perubahan</Btn>
      </div>
    </>
  );
}

function SocialPanel({ settings, onSave }) {
  // social_proof_config is a JSON string column (backend).
  const parseSP = (raw) => { let o = raw; if (typeof raw === 'string' && raw.trim()) { try { o = JSON.parse(raw); } catch { o = null; } } return (o && typeof o === 'object') ? o : {}; };
  const sp = parseSP(settings?.social_proof_config);
  const [spEnabled, setSpEnabled] = useStateA(sp.enabled ?? true);
  const [spInterval, setSpInterval] = useStateA(sp.interval || '8');
  const [spPosition, setSpPosition] = useStateA(sp.position ?? 2);
  const [spTemplate, setSpTemplate] = useStateA(sp.template || '{{nama}} baru saja berdonasi {{nominal}} untuk {{campaign}}');
  const [spFallback, setSpFallback] = useStateA(sp.fallback || 'Hamba Allah, Rizky H., Siti N., Hamba Allah');
  useEffectA(() => {
    const s = parseSP(settings?.social_proof_config);
    if (s && Object.keys(s).length) {
      if (s.enabled != null) setSpEnabled(s.enabled);
      if (s.interval) setSpInterval(s.interval);
      if (s.position != null) setSpPosition(s.position);
      if (s.template) setSpTemplate(s.template);
      if (s.fallback) setSpFallback(s.fallback);
    }
  }, [settings]);
  const positions = ['Top L','Top R','Bottom L','Bottom R'];
  return (
    <>
      <Section title="Popup Social Proof" sub="Tingkatkan kepercayaan donatur dengan notifikasi donasi terbaru.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            <Toggle value={spEnabled} onChange={setSpEnabled} label="Aktifkan popup social proof" sub="Tampil di landing & halaman campaign."/>
            <div>
              <label className="text-xs font-semibold text-mute">Interval muncul</label>
              <Select value={spInterval} onChange={setSpInterval} options={[
                {value:'5', label:'Setiap 5 detik'},
                {value:'8', label:'Setiap 8 detik'},
                {value:'15', label:'Setiap 15 detik'},
                {value:'30', label:'Setiap 30 detik'},
              ]} className="mt-1"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-mute">Posisi popup</label>
              <div className="mt-1 grid grid-cols-4 gap-2">
                {positions.map((p, i) => (
                  <button key={p} onClick={() => setSpPosition(i)} className={`py-2 rounded-lg border text-xs font-bold ${spPosition===i ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line hover:bg-bg2'}`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-mute">Template kalimat</label>
              <textarea className="field mt-1" rows="3" value={spTemplate} onChange={(e) => setSpTemplate(e.target.value)}/>
              <div className="text-[11px] text-mute mt-1">Variabel: <code>&#123;&#123;nama&#125;&#125;</code>, <code>&#123;&#123;nominal&#125;&#125;</code>, <code>&#123;&#123;campaign&#125;&#125;</code></div>
            </div>
            <div>
              <label className="text-xs font-semibold text-mute">Data fallback (saat sepi)</label>
              <input className="field mt-1" value={spFallback} onChange={(e) => setSpFallback(e.target.value)}/>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl bg-bg2 p-6 flex items-end justify-start min-h-[260px] border border-dashed border-line">
            <div className="bg-white rounded-xl shadow-pop border border-line p-3 flex items-center gap-3 w-72">
              <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center"><Icon name="heart" size={18}/></div>
              <div>
                <div className="text-xs font-semibold text-ink"><b>Hamba Allah</b> baru saja berdonasi</div>
                <div className="text-sm font-bold text-brand-600">Rp 250.000</div>
                <div className="text-[10px] text-mute">untuk "Bantuan Aira" · 12 detik lalu</div>
              </div>
              <button className="self-start text-mute"><Icon name="close" size={12}/></button>
            </div>
          </div>
        </div>
      </Section>

      <div className="flex justify-end mt-4">
        <Btn icon="check" onClick={() => onSave({ social_proof_config: JSON.stringify({ enabled: spEnabled, interval: spInterval, position: spPosition, template: spTemplate, fallback: spFallback }), social_proof_enabled: spEnabled })}>Simpan Perubahan</Btn>
      </div>
    </>
  );
}

const DEFAULT_RULES = [
  { c:'Bantuan Aira', pct:12 },
  { c:'Sumur Bersih NTT', pct:10 },
  { c:'Wakaf Quran', pct:8 },
];
const parseObj = (v) => {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) { try { const p = JSON.parse(v); if (p && typeof p === 'object') return p; } catch {} }
  return {};
};

function FundraisingPanel({ settings, onSave }) {
  const fr = parseObj(settings?.fundraising_config);
  const [enabled, setEnabled] = useStateA(fr.enabled ?? true);
  const [autoCalc, setAutoCalc] = useStateA(fr.auto_calc ?? true);
  const [commission, setCommission] = useStateA(fr.commission || '10');
  const [minPayout, setMinPayout] = useStateA(fr.min_payout || 'Rp 100.000');
  const [period, setPeriod] = useStateA(fr.period || 'month');
  const [rules, setRules] = useStateA(parseArr(fr.rules, DEFAULT_RULES));
  useEffectA(() => {
    const f = parseObj(settings?.fundraising_config);
    if (f && Object.keys(f).length) {
      if (f.enabled != null) setEnabled(f.enabled);
      if (f.auto_calc != null) setAutoCalc(f.auto_calc);
      if (f.commission) setCommission(f.commission);
      if (f.min_payout) setMinPayout(f.min_payout);
      if (f.period) setPeriod(f.period);
      setRules(parseArr(f.rules, DEFAULT_RULES));
    }
  }, [settings]);
  return (
    <>
      <Section title="Program Fundraiser" sub="Aktifkan program afiliasi/fundraiser & atur skema komisi.">
        <div className="space-y-3">
          <Toggle value={enabled} onChange={setEnabled} label="Aktifkan fundraiser" sub="Izinkan mitra mempromosikan campaign dengan link referral."/>
          <Toggle value={autoCalc} onChange={setAutoCalc} label="Otomatis hitung komisi" sub="Komisi dihitung tiap minggu, payout manual oleh admin."/>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="text-xs font-semibold text-mute">Default komisi</label><div className="mt-1 flex items-center gap-2"><input className="field" value={commission} onChange={(e) => setCommission(e.target.value)}/><span className="text-mute">%</span></div></div>
            <div><label className="text-xs font-semibold text-mute">Minimum payout</label><input className="field mt-1" value={minPayout} onChange={(e) => setMinPayout(e.target.value)}/></div>
            <div><label className="text-xs font-semibold text-mute">Periode payout</label><Select value={period} onChange={setPeriod} options={[{value:'week',label:'Mingguan'},{value:'month',label:'Bulanan'}]} className="mt-1"/></div>
          </div>
          <div className="rounded-xl border border-line p-4">
            <div className="font-semibold text-ink mb-2">Aturan khusus per campaign</div>
            <div className="space-y-2">
              {(Array.isArray(rules)?rules:[]).map((r, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 font-medium text-ink">{r.c}</span>
                  <input type="number" value={r.pct} onChange={e => setRules(prev => prev.map((x, j) => j === i ? {...x, pct: +e.target.value} : x))}
                    className="w-16 field text-right"/>
                  <span className="text-mute">%</span>
                  <button onClick={() => setRules(prev => prev.filter((_, j) => j !== i))} className="text-mute hover:text-rose-600"><Icon name="trash" size={14}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
      <div className="flex justify-end mt-4">
        <Btn icon="check" onClick={() => onSave({ fundraising_config: JSON.stringify({ enabled, auto_calc: autoCalc, commission, min_payout: minPayout, period, rules }), fundraiser_commission_percent: parseInt(String(commission).replace(/\D/g,''),10) || 0 })}>Simpan Perubahan</Btn>
      </div>
    </>
  );
}

function CategoryPanel() {
  const { showToast } = useApp();
  const [cats, setCats] = useStateA(() => (window.CATEGORIES || []).slice());
  const [name, setName] = useStateA('');
  const [editing, setEditing] = useStateA(null); // {id, name}
  const [busy, setBusy] = useStateA(false);

  const refresh = async () => {
    try {
      const r = await window.api.categories();
      if (r?.data && Array.isArray(r.data)) {
        window.CATEGORIES = r.data;
        setCats(r.data.slice());
        // Notify other views (campaign list filter, campaign editor) to re-render
        // so the category list stays in sync without a page reload.
        try { window.dispatchEvent(new CustomEvent('nb-categories-updated')); } catch {}
      }
    } catch {}
  };

  const submit = async () => {
    const nm = name.trim();
    if (!nm) { showToast('Nama kategori wajib diisi'); return; }
    setBusy(true);
    try {
      if (editing) { await window.api.updateCategory(editing.id, { name: nm }); showToast('Kategori diperbarui'); }
      else { await window.api.createCategory({ name: nm }); showToast('Kategori ditambahkan'); }
      setName(''); setEditing(null);
      await refresh();
    } catch (e) { showToast('Gagal: ' + (e?.message || 'coba lagi')); }
    setBusy(false);
  };

  const remove = async (cat) => {
    if (!confirm('Hapus kategori "' + cat.name + '"? Campaign yang memakainya akan menjadi tanpa kategori.')) return;
    setBusy(true);
    try { await window.api.deleteCategory(cat.id); showToast('Kategori dihapus'); await refresh(); }
    catch (e) { showToast('Gagal menghapus: ' + (e?.message || '')); }
    setBusy(false);
  };

  return (
    <Section title="Kategori Campaign" sub="Kelola kategori yang dipakai di filter campaign dan form editor. Perubahan langsung tersinkron.">
      <div className="flex flex-wrap items-end gap-2 mb-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-mute">{editing ? 'Edit nama kategori' : 'Nama kategori baru'}</label>
          <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="mis. Pendidikan"/>
        </div>
        <Btn icon={editing ? 'check' : 'plus'} onClick={submit} disabled={busy}>{editing ? 'Simpan' : 'Tambah'}</Btn>
        {editing && <Btn variant="outline" tone="ink" onClick={() => { setEditing(null); setName(''); }}>Batal</Btn>}
      </div>
      <div className="space-y-2">
        {cats.length === 0 && <div className="text-sm text-mute py-4 text-center">Belum ada kategori. Tambahkan di atas.</div>}
        {cats.map((cat) => (
          <div key={cat.id || cat.slug || cat.name} className="flex items-center gap-3 p-3 rounded-lg border border-line">
            <div className="font-semibold text-ink flex-1">{cat.name}</div>
            <span className="text-[11px] font-mono text-mute">{cat.slug}</span>
            <button onClick={() => { setEditing({ id: cat.id, name: cat.name }); setName(cat.name); }}
              className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink flex items-center justify-center"><Icon name="edit" size={14}/></button>
            <button onClick={() => remove(cat)} disabled={busy}
              className="h-8 w-8 rounded-md hover:bg-rose-50 text-mute hover:text-rose-600 flex items-center justify-center"><Icon name="trash" size={14}/></button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PaymentStatusPanel() {
  const { showToast } = useApp();
  const [rows, setRows] = useStateA(() => (window.PAYMENT_STATUSES || []).slice());
  const blank = { code:'', label:'', color:'#10B981', is_paid:false, is_default:false, sort_order:0 };
  const [form, setForm] = useStateA(blank);
  const [editing, setEditing] = useStateA(null);
  const [busy, setBusy] = useStateA(false);

  const refresh = async () => {
    try {
      const r = await window.api.paymentStatuses();
      if (r?.data && Array.isArray(r.data)) { window.PAYMENT_STATUSES = r.data; setRows(r.data.slice()); }
    } catch {}
  };

  const submit = async () => {
    const code = form.code.trim(), label = form.label.trim();
    if (!code || !label) { showToast('Code dan label wajib diisi'); return; }
    setBusy(true);
    try {
      const payload = { code, label, color: form.color, is_paid: !!form.is_paid, is_default: !!form.is_default, sort_order: Number(form.sort_order) || 0 };
      if (editing) { await window.api.updatePaymentStatus(editing, payload); showToast('Status diperbarui'); }
      else { await window.api.createPaymentStatus(payload); showToast('Status ditambahkan'); }
      setForm(blank); setEditing(null);
      await refresh();
    } catch (e) { showToast('Gagal: ' + (e?.message || 'coba lagi')); }
    setBusy(false);
  };

  const edit = (s) => { setEditing(s.id); setForm({ code:s.code, label:s.label, color:s.color || '#10B981', is_paid:!!s.is_paid, is_default:!!s.is_default, sort_order:s.sort_order || 0 }); };
  const remove = async (s) => {
    if (!confirm('Hapus status "' + s.label + '"? Invoice yang memakainya tetap menyimpan teks status lama.')) return;
    setBusy(true);
    try { await window.api.deletePaymentStatus(s.id); showToast('Status dihapus'); await refresh(); }
    catch (e) { showToast('Gagal menghapus: ' + (e?.message || '')); }
    setBusy(false);
  };

  return (
    <Section title="Status Pembayaran" sub="Kelola label status invoice (mis. Terbayar, Menunggu, Gagal). Status ber-tanda 'Lunas' akan otomatis mengkreditkan campaign saat dipilih CS.">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-2 items-end mb-4">
        <div>
          <label className="text-xs font-semibold text-mute">Code</label>
          <input className="field mt-1" value={form.code} onChange={(e)=>setForm({...form, code:e.target.value})} placeholder="Terbayar"/>
        </div>
        <div>
          <label className="text-xs font-semibold text-mute">Label tampilan</label>
          <input className="field mt-1" value={form.label} onChange={(e)=>setForm({...form, label:e.target.value})} placeholder="Terbayar"/>
        </div>
        <div>
          <label className="text-xs font-semibold text-mute">Warna</label>
          <input type="color" className="h-10 w-12 rounded-lg border border-line cursor-pointer mt-1 block" value={form.color} onChange={(e)=>setForm({...form, color:e.target.value})}/>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink pb-2.5">
          <input type="checkbox" checked={form.is_paid} onChange={(e)=>setForm({...form, is_paid:e.target.checked})} className="rounded border-line"/> Lunas
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink pb-2.5" title="Status default untuk invoice baru">
          <input type="checkbox" checked={form.is_default} onChange={(e)=>setForm({...form, is_default:e.target.checked})} className="rounded border-line"/> Default
        </label>
        <div className="flex gap-2">
          <Btn icon={editing ? 'check' : 'plus'} onClick={submit} disabled={busy}>{editing ? 'Simpan' : 'Tambah'}</Btn>
          {editing && <Btn variant="outline" tone="ink" onClick={()=>{ setEditing(null); setForm(blank); }}>Batal</Btn>}
        </div>
      </div>
      <div className="space-y-2">
        {rows.length === 0 && <div className="text-sm text-mute py-4 text-center">Belum ada status.</div>}
        {rows.map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-line">
            <span className="h-4 w-4 rounded-full shrink-0" style={{ background: s.color || '#94A3B8' }}/>
            <div className="font-semibold text-ink flex-1">{s.label}</div>
            <span className="text-[11px] font-mono text-mute">{s.code}</span>
            {s.is_paid && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">LUNAS</span>}
            <button onClick={()=>edit(s)} className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink flex items-center justify-center"><Icon name="edit" size={14}/></button>
            <button onClick={()=>remove(s)} disabled={busy} className="h-8 w-8 rounded-md hover:bg-rose-50 text-mute hover:text-rose-600 flex items-center justify-center"><Icon name="trash" size={14}/></button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function GeneralPanel({ settings, onSave }) {
  const { showToast } = useApp();
  const [siteName, setSiteName] = useStateA(settings?.site_name || 'NIATBAIK.ORG');
  const [domain, setDomain] = useStateA(settings?.domain || 'niatbaik.org');
  const [tz, setTz] = useStateA(settings?.timezone || 'Asia/Jakarta (WIB) · GMT+7');
  const [currency, setCurrency] = useStateA(settings?.currency || 'IDR (Rp)');
  const [seoTitle, setSeoTitle] = useStateA(settings?.seo_title || 'NIATBAIK.ORG — Salurkan Kebaikan, Wujudkan Niat Baik');
  const [seoDesc, setSeoDesc] = useStateA(settings?.seo_description || 'Platform donasi & crowdfunding terpercaya untuk kemanusiaan, pendidikan, dan kesehatan di seluruh Indonesia.');
  const [maintenance, setMaintenance] = useStateA(settings?.maintenance ?? false);
  const [smtpHost, setSmtpHost] = useStateA(settings?.smtp_host || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useStateA(settings?.smtp_port || 587);
  const [smtpEmail, setSmtpEmail] = useStateA(settings?.smtp_email || '');
  const [smtpPassword, setSmtpPassword] = useStateA('');
  const [smtpName, setSmtpName] = useStateA(settings?.smtp_name || 'NIATBAIK.ORG');
  const [smtpShowPwd, setSmtpShowPwd] = useStateA(false);
  const [testTo, setTestTo] = useStateA(settings?.smtp_email || '');
  const [testBusy, setTestBusy] = useStateA(false);
  const sendTest = async () => {
    const to = (testTo || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) { showToast('Masukkan email tujuan yang valid'); return; }
    setTestBusy(true);
    try {
      await window.api.testEmail(to);
      showToast('Email tes terkirim ke ' + to);
    } catch (e) { showToast('Gagal kirim tes: ' + (e?.message || 'periksa konfigurasi SMTP')); }
    setTestBusy(false);
  };
  const [formPageName, setFormPageName] = useStateA(settings?.form_page_name || 'donasi');
  const [typPageName, setTypPageName] = useStateA(settings?.thankyou_page_name || 'invoice');
  // Donor greeting message + CS contact rotator
  const [donorGreeting, setDonorGreeting] = useStateA(settings?.donor_greeting || '');
  const [csMode, setCsMode] = useStateA(settings?.cs_rotator_mode || 'default');
  const parseCsContacts = (v) => {
    try { const p = typeof v === 'string' && v ? JSON.parse(v) : v; return Array.isArray(p) ? p : []; } catch { return []; }
  };
  const [csContacts, setCsContacts] = useStateA(() => parseCsContacts(settings?.cs_contacts));
  useEffectA(() => {
    if (settings?.site_name) setSiteName(settings.site_name);
    if (settings?.domain) setDomain(settings.domain);
    if (settings?.timezone) setTz(settings.timezone);
    if (settings?.currency) setCurrency(settings.currency);
    if (settings?.seo_title) setSeoTitle(settings.seo_title);
    if (settings?.seo_description) setSeoDesc(settings.seo_description);
    if (settings?.maintenance != null) setMaintenance(settings.maintenance);
    if (settings?.smtp_host) setSmtpHost(settings.smtp_host);
    if (settings?.smtp_port) setSmtpPort(settings.smtp_port);
    if (settings?.smtp_email) setSmtpEmail(settings.smtp_email);
    if (settings?.smtp_name) setSmtpName(settings.smtp_name);
    if (settings?.form_page_name) setFormPageName(settings.form_page_name);
    if (settings?.thankyou_page_name) setTypPageName(settings.thankyou_page_name);
    if (settings?.donor_greeting != null) setDonorGreeting(settings.donor_greeting);
    if (settings?.cs_rotator_mode) setCsMode(settings.cs_rotator_mode);
    if (settings?.cs_contacts != null) setCsContacts(parseCsContacts(settings.cs_contacts));
  }, [settings]);
  return (
    <>
      <Section title="Identitas Website">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-xs font-semibold text-mute">Nama Website</label><input className="field mt-1" value={siteName} onChange={(e) => setSiteName(e.target.value)}/></div>
          <div><label className="text-xs font-semibold text-mute">Domain</label><input className="field mt-1" value={domain} onChange={(e) => setDomain(e.target.value)}/></div>
          <div><label className="text-xs font-semibold text-mute">Timezone</label><Select value={tz} onChange={setTz} options={['Asia/Jakarta (WIB) · GMT+7','Asia/Makassar (WITA) · GMT+8','Asia/Jayapura (WIT) · GMT+9']} className="mt-1"/></div>
          <div><label className="text-xs font-semibold text-mute">Mata uang</label><Select value={currency} onChange={setCurrency} options={['IDR (Rp)','USD ($)','MYR (RM)','SGD (S$)']} className="mt-1"/></div>
        </div>
      </Section>
      <Section title="URL Halaman" sub="Menentukan path URL publik campaign, mis. /campaign/{slug}/{form_page_name}.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-mute">Form Page Name</label>
            <input className="field mt-1" value={formPageName}
              onChange={(e) => setFormPageName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
              placeholder="donasi"/>
            <div className="text-[11px] text-mute mt-1">tanpa spasi, huruf kecil. Contoh: donasi, donasi-sekarang</div>
            <div className="text-[11px] text-mute mt-1">Link: <span className="font-mono text-brand-600">https://donasi.niatbaik.org/campaign/&lt;slug&gt;/{formPageName || 'donasi'}</span></div>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Thankyou/Invoice Page Name</label>
            <input className="field mt-1" value={typPageName}
              onChange={(e) => setTypPageName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
              placeholder="invoice"/>
            <div className="text-[11px] text-mute mt-1">tanpa spasi, huruf kecil. Contoh: invoice, terima-kasih</div>
            <div className="text-[11px] text-mute mt-1">Link: <span className="font-mono text-brand-600">https://donasi.niatbaik.org/campaign/&lt;slug&gt;/{typPageName || 'invoice'}</span></div>
          </div>
        </div>
      </Section>
      <Section title="SEO">
        <div className="space-y-3">
          <div><label className="text-xs font-semibold text-mute">SEO Title</label><input className="field mt-1" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)}/></div>
          <div><label className="text-xs font-semibold text-mute">SEO Description</label><textarea className="field mt-1" rows="3" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)}/></div>
        </div>
      </Section>
      <Section title="Email / SMTP" sub="Konfigurasi email untuk notifikasi donatur, kuitansi, dan reset password.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-mute">SMTP Host</label>
            <input className="field mt-1" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">SMTP Port</label>
            <input type="number" className="field mt-1" value={smtpPort} onChange={(e) => setSmtpPort(+e.target.value)} placeholder="587"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Email pengirim</label>
            <input type="email" className="field mt-1" value={smtpEmail} onChange={(e) => setSmtpEmail(e.target.value)} placeholder="noreply@niatbaik.org"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Nama pengirim</label>
            <input className="field mt-1" value={smtpName} onChange={(e) => setSmtpName(e.target.value)} placeholder="NIATBAIK.ORG"/>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-mute">Password / App Password</label>
            <div className="mt-1 relative">
              <input type={smtpShowPwd ? 'text' : 'password'} className="field pr-9 font-mono" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} placeholder="Isi untuk mengubah · kosongkan jika tidak ingin ganti"/>
              <button type="button" onClick={() => setSmtpShowPwd(!smtpShowPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-bg2 flex items-center justify-center text-mute">
                <Icon name="eye" size={13}/>
              </button>
            </div>
            <div className="text-[10px] text-mute mt-1">Untuk Gmail: aktifkan 2FA lalu buat App Password di myaccount.google.com/apppasswords</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-line">
          <label className="text-xs font-semibold text-mute">Tes konfigurasi SMTP</label>
          <div className="mt-1 flex flex-col sm:flex-row gap-2">
            <input type="email" className="field flex-1" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="email tujuan tes"/>
            <Btn variant="outline" tone="ink" icon="bell" onClick={sendTest} disabled={testBusy}>{testBusy ? 'Mengirim…' : 'Kirim Email Tes'}</Btn>
          </div>
          <div className="text-[11px] text-mute mt-1">Mengirim email tes memakai SMTP yang <b>sudah tersimpan</b>. Simpan dulu bila baru mengubah.</div>
        </div>
      </Section>
      <Section title="Greeting Donatur & CS" sub="Pesan sambutan ke donatur dan kontak CS (mode default atau rotator antar beberapa nomor).">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-mute">Pesan greeting donatur</label>
            <textarea className="field mt-1" rows="2" value={donorGreeting} onChange={(e) => setDonorGreeting(e.target.value)}
              placeholder="Terima kasih atas niat baik Anda 🙏 Tim kami siap membantu via WhatsApp."/>
            <div className="text-[11px] text-mute mt-1">Ditampilkan ke donatur setelah donasi / di halaman invoice.</div>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Mode kontak CS</label>
            <Select value={csMode} onChange={setCsMode} options={[
              {value:'default', label:'Default (satu nomor)'},
              {value:'rotator', label:'Rotator (bergilir antar nomor)'},
            ]} className="mt-1"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Nomor CS (WhatsApp)</label>
            <div className="space-y-2 mt-1">
              {csContacts.map((ct, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1">
                    <input className="field font-mono" value={ct.phone || ''} placeholder="628xxxxxxxxxx"
                      onChange={(e) => {
                        // Keep digits only, normalize leading 0 → 62 (Indonesia E.164-ish).
                        let v = e.target.value.replace(/[^0-9]/g, '');
                        if (v.startsWith('0')) v = '62' + v.slice(1);
                        setCsContacts(prev => prev.map((x, j) => j === i ? { ...x, phone: v } : x));
                      }}/>
                    {(ct.phone || '').length > 0 && ((ct.phone || '').length < 8 || (ct.phone || '').length > 15) && (
                      <div className="text-[10px] text-rose-600 mt-0.5">Nomor harus 8–15 digit (mis. 628123456789)</div>
                    )}
                  </div>
                  <input className="field flex-1" value={ct.name || ''} placeholder="Nama CS (opsional)"
                    onChange={(e) => setCsContacts(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}/>
                  <button onClick={() => setCsContacts(prev => prev.filter((_, j) => j !== i))}
                    className="h-9 w-9 rounded-md hover:bg-rose-50 text-mute hover:text-rose-600 flex items-center justify-center shrink-0"><Icon name="trash" size={14}/></button>
                </div>
              ))}
              <button onClick={() => setCsContacts(prev => [...prev, { phone:'', name:'' }])}
                className="text-xs font-bold text-brand-600 hover:underline">+ Tambah nomor CS</button>
            </div>
          </div>
        </div>
      </Section>
      <Section title="Maintenance Mode" sub="Aktifkan untuk menutup akses publik sementara saat update besar.">
        <Toggle value={maintenance} onChange={setMaintenance} label="Aktifkan maintenance mode" sub="Pengunjung akan melihat halaman maintenance."/>
      </Section>
      <div className="flex justify-end mt-4">
        <Btn icon="check" onClick={() => {
          const patch = { site_name: siteName, domain, timezone: tz, currency, seo_title: seoTitle, seo_description: seoDesc, maintenance, smtp_host: smtpHost, smtp_port: smtpPort, smtp_email: smtpEmail, smtp_name: smtpName, form_page_name: formPageName || 'donasi', thankyou_page_name: typPageName || 'invoice',
            donor_greeting: donorGreeting,
            cs_rotator_mode: csMode,
            cs_contacts: JSON.stringify(csContacts
              .map(x => ({ phone: (x.phone || '').replace(/[^0-9]/g, ''), name: (x.name || '').trim() }))
              .filter(x => x.phone.length >= 8 && x.phone.length <= 15)),
          };
          if (smtpPassword) patch.smtp_password = smtpPassword;
          onSave(patch);
        }}>Simpan Perubahan</Btn>
      </div>
    </>
  );
}

window.SettingsView = SettingsView;

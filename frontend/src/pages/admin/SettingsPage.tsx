import { useState, useEffect, useRef } from 'react';
import { api, mediaUrl } from '@/lib/api';
import { fmtIDRShort } from '@/lib/format';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';
import { Card, PageHeader, Icon, Toggle, Select, Btn, Progress, Badge, StatusBadge, Modal } from '@/components';

// parseArr parses a settings value that may be an array OR an object (both stored as a
// JSON string in the backend TEXT column). It previously accepted ONLY arrays, so the
// object-shaped configs (payment_channel_gateways {channel:gateway}, payment_method_types,
// flip_code_config) never round-tripped: JSON.parse succeeded but the Array.isArray gate
// rejected the object → the fallback was used → the routing matrix silently reverted to
// defaults on every reload/save ("balik ke semula"). Accept any non-null object (arrays
// are objects too), so both shapes round-trip. `fb` is returned only when v is absent or
// unparseable.
const parseArr = (v: any, fb: any) => {
  if (v && typeof v === 'object') return v;
  if (typeof v === 'string' && v.trim()) { try { const p = JSON.parse(v); if (p && typeof p === 'object') return p; } catch {} }
  return fb;
};

export default function SettingsPage() {
  const showToast = useUiStore((s) => s.showToast);
  const [tab, setTab] = useState('themes');
  const [settings, setSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  // Unsaved-changes guard. A panel is considered "dirty" once the user interacts
  // with a control inside it (captured on the panel container). Cleared on save or
  // when leaving the tab after confirmation. Avoids per-field wiring across 10 panels.
  const dirtyRef = useRef(false);
  const markDirty = () => { dirtyRef.current = true; };

  // Warn before a hard close/reload while there are unsaved edits.
  useEffect(() => {
    const onBeforeUnload = (e: any) => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const switchTab = (next: string) => {
    if (next === tab) return;
    if (dirtyRef.current && !confirm('Ada perubahan yang belum disimpan di tab ini. Pindah tab dan buang perubahan?')) return;
    dirtyRef.current = false;
    setTab(next);
  };
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

  useEffect(() => {
    (async () => {
      try {
        const res = await api.settings();
        setSettings(res?.data || {});
      } catch {}
      setSettingsLoading(false);
    })();
  }, []);

  // Returns true on success / false on failure so panels can drive a saving spinner
  // and avoid clearing their dirty flag on error.
  const saveSettings = async (patch: any) => {
    try {
      // Send ONLY the patch — backend merges field-by-field. Spreading the full
      // GET response sent nested objects/strings that broke c.Bind ("invalid request body").
      await api.updateSettings(patch);
      dirtyRef.current = false; // saved → no longer dirty
      // Refetch the FULL settings so server-computed fields stay in sync with what
      // was just persisted. Critical for Payment: flip_configured / moota_configured
      // are derived from the (masked, json:"-") secret keys, NOT included in the
      // patch, so an optimistic-only merge left them stale (badge stayed "Nonaktif"
      // right after a successful save — the "data hilang / seolah ga pernah input"
      // symptom). Optimistic patch first so the UI feels instant, then authoritative.
      setSettings((prev: any) => ({ ...(prev || {}), ...patch }));
      try {
        const fresh = await api.settings();
        if (fresh?.data) setSettings(fresh.data);
      } catch { /* optimistic state is already correct enough */ }
      showToast('Pengaturan berhasil disimpan');
      return true;
    } catch (e: any) { showToast('Gagal menyimpan: ' + (e?.message || '')); return false; }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Pengaturan platform NIATBAIK.ORG."/>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-1 p-3 h-fit lg:sticky top-20">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button key={t.value} onClick={() => switchTab(t.value)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${tab===t.value ? 'bg-brand-50 text-brand-700' : 'text-ink/80 hover:bg-bg2'}`}>
                <Icon name={t.icon} size={16} className={tab===t.value ? 'text-brand-600' : 'text-mute'}/>
                {t.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Capture any input/change inside the panel area to flag unsaved edits. */}
        <div className="lg:col-span-4 space-y-5" onInputCapture={markDirty} onChangeCapture={markDirty}>
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

function Section({ title, sub, children, actions }: any) {
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

// SaveButton wraps an async onClick with a saving state: shows a spinner label and
// disables itself while in flight, so admins get feedback and can't double-submit.
// onClick may return a Promise (and optionally a boolean); rejection is swallowed
// (the panel's own toast surfaces the error).
function SaveButton({ onClick, children, icon = 'check', disabled, ...rest }: any) {
  const [saving, setSaving] = useState(false);
  const run = async () => {
    if (saving) return;
    setSaving(true);
    try { await onClick(); } catch {} finally { setSaving(false); }
  };
  return (
    <Btn icon={icon} onClick={run} disabled={saving || disabled} {...rest}>
      {saving ? 'Menyimpan…' : children}
    </Btn>
  );
}

function ThemesPanel({ settings, onSave }: any) {
  const dark = useUiStore((s) => s.dark);
  const setDark = useUiStore((s) => s.setDark);
  const showToast = useUiStore((s) => s.showToast);
  const [color, setColor] = useState(settings?.primary_color || '#2E4191');
  const [secondaryColor, setSecondaryColor] = useState(settings?.secondary_color || '#38B6FF');
  const [radius, setRadius] = useState(settings?.border_radius ?? 16);
  const [fontFamily, setFontFamily] = useState(settings?.font_family || 'plus-jakarta');
  const [buttonStyle, setButtonStyle] = useState(settings?.button_style || 'Solid');
  const logoRef = useRef<any>(null);
  const DEFAULT_LOGO = 'assets/logo.png';
  const [logoSrc, setLogoSrc] = useState(settings?.logo || settings?.logo_url || DEFAULT_LOGO);
  useEffect(() => { if (settings?.primary_color) setColor(settings.primary_color); }, [settings]);
  useEffect(() => { if (settings?.secondary_color) setSecondaryColor(settings.secondary_color); }, [settings]);
  useEffect(() => { if (settings?.border_radius != null) setRadius(settings.border_radius); }, [settings]);
  useEffect(() => { if (settings?.font_family) setFontFamily(settings.font_family); }, [settings]);
  useEffect(() => { if (settings?.button_style) setButtonStyle(settings.button_style); }, [settings]);
  useEffect(() => { const l = settings?.logo || settings?.logo_url; if (l) setLogoSrc(l); }, [settings]);
  const applyTheme = (c: any) => {
    try {
      const root = document.documentElement;
      root.style.setProperty('--nb-brand', c);
      let el = document.getElementById('nb-theme-vars');
      if (!el) { el = document.createElement('style'); el.id = 'nb-theme-vars'; document.head.appendChild(el); }
      el.textContent = `.text-brand-600{color:${c} !important}.bg-brand-600{background-color:${c} !important}.border-brand-600{border-color:${c} !important}.hover\\:bg-brand-700:hover{background-color:${c} !important}`;
    } catch {}
  };
  useEffect(() => { if (settings?.primary_color) applyTheme(settings.primary_color); }, [settings]);
  const handleLogoUpload = async () => {
    const f = logoRef.current?.files?.[0];
    if (!f) return;
    if (f.size > 1024 * 1024) { showToast('File terlalu besar (max 1MB)'); return; }
    try {
      const res = await api.uploadImage(f);
      const url = res?.data?.url || res?.url;
      if (url) { setLogoSrc(url); showToast('Logo berhasil diupload. Klik Simpan untuk menerapkan.'); }
      else showToast('Upload gagal');
    } catch (e: any) { showToast('Upload gagal: ' + (e?.message||'')); }
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
          <Toggle value={dark} onChange={(v: any) => setDark(v)} label=""/>
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
        <SaveButton onClick={() => { applyTheme(color); return onSave({ primary_color: color, secondary_color: secondaryColor, border_radius: radius, logo: logoSrc === DEFAULT_LOGO ? '' : logoSrc, font_family: fontFamily, button_style: buttonStyle }); }}>Simpan Perubahan</SaveButton>
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

function FormPanel({ settings, onSave }: any) {
  const showToast = useUiStore((s) => s.showToast);
  const [fields, setFields] = useState<any>(parseArr(settings?.form_fields_config, DEFAULT_FIELDS));
  const [presets, setPresets] = useState<any>(parseArr(settings?.nominal_presets, DEFAULT_PRESETS));
  // Read the SAME keys the backend persists (min_donation_global / anonymous_default /
  // message_enabled). Previously this read non-existent keys, so saved toggles
  // appeared to revert on reload.
  const initMin = settings?.min_donation_global ? 'Rp ' + Number(settings.min_donation_global).toLocaleString('id-ID') : 'Rp 10.000';
  const [minDonation, setMinDonation] = useState(initMin);
  const [allowAnon, setAllowAnon] = useState(settings?.anonymous_default ?? true);
  const [allowDoa, setAllowDoa] = useState(settings?.message_enabled ?? true);
  const [newPreset, setNewPreset] = useState('');
  useEffect(() => { setFields(parseArr(settings?.form_fields_config, DEFAULT_FIELDS)); }, [settings]);
  useEffect(() => { setPresets(parseArr(settings?.nominal_presets, DEFAULT_PRESETS)); }, [settings]);
  useEffect(() => { if (settings?.min_donation_global) setMinDonation('Rp ' + Number(settings.min_donation_global).toLocaleString('id-ID')); }, [settings]);
  useEffect(() => { if (settings?.anonymous_default != null) setAllowAnon(settings.anonymous_default); }, [settings]);
  useEffect(() => { if (settings?.message_enabled != null) setAllowDoa(settings.message_enabled); }, [settings]);

  const toggleField = (i: number, key: string) => setFields((prev: any) => prev.map((f: any, j: number) => j === i ? { ...f, [key]: !f[key] } : f));
  const removePreset = (p: any) => setPresets((prev: any) => prev.filter((x: any) => x !== p));
  const addPreset = () => {
    const v = parseInt(String(newPreset).replace(/\D/g, ''), 10);
    if (v && v >= 1000 && !presets.includes(v)) {
      setPresets((prev: any) => [...prev, v].sort((a: number, b: number) => a - b));
      setNewPreset('');
      showToast('Preset nominal ditambahkan');
    }
  };

  return (
    <>
      <Section title="Field Form Donasi" sub="Atur field yang muncul pada form donasi.">
        <div className="space-y-3">
          {(Array.isArray(fields)?fields:[]).map((f: any, i: number) => (
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
              {(Array.isArray(presets)?presets:[]).map((p: any) => (
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
        <SaveButton onClick={() => onSave({
          form_fields_config: JSON.stringify(fields),
          nominal_presets: JSON.stringify(presets),
          min_donation_global: parseInt(String(minDonation).replace(/\D/g, ''), 10) || 10000,
          anonymous_default: allowAnon,
          message_enabled: allowDoa,
        })}>Simpan Perubahan</SaveButton>
      </div>
    </>
  );
}

// Reference constants for DonasiAja taxonomy
const METHOD_TYPES = [
  { key: 'instant', defaultTitle: 'Pembayaran Instan (Cepat & Mudah)' },
  { key: 'va', defaultTitle: 'Virtual Account (Verifikasi Otomatis)' },
  { key: 'transfer', defaultTitle: 'Transfer Bank (Verifikasi Manual 1x24jam)' }
];

const FLIP_CHANNELS: any = {
  instant: [
    { key: 'qris', name: 'QRIS' },
    { key: 'gopay', name: 'Gopay' },
    { key: 'ovo', name: 'Ovo' },
    { key: 'dana', name: 'Dana' },
    { key: 'linkaja', name: 'Linkaja' },
    { key: 'shopeepay', name: 'Shopeepay' },
    { key: 'doku', name: 'Doku' }
  ],
  va: [
    { key: 'bca', name: 'VA BCA' },
    { key: 'mandiri', name: 'VA Mandiri' },
    { key: 'bni', name: 'VA BNI' },
    { key: 'bri', name: 'VA BRI' },
    { key: 'bsi', name: 'VA BSI' },
    { key: 'muamalat', name: 'VA Muamalat' },
    { key: 'cimb', name: 'VA Cimb Niaga' },
    { key: 'danamon', name: 'VA Danamon' },
    { key: 'permata', name: 'VA Permata' }
  ],
  transfer: [
    { key: 'flip', name: 'FLIP Transfer' }
  ]
};

// Legacy/default per-channel gateway (must mirror backend channelDefaultGateway):
// VA→flip, QRIS/e-wallet→moota, transfer→manual. Used to seed the routing matrix when
// the admin hasn't configured payment_channel_gateways yet.
const CHANNEL_DEFAULT_GATEWAY: any = {
  bca: 'flip', mandiri: 'flip', bni: 'flip', bri: 'flip', bsi: 'flip',
  muamalat: 'flip', cimb: 'flip', danamon: 'flip', permata: 'flip',
  qris: 'moota', gopay: 'moota', ovo: 'moota', dana: 'moota',
  linkaja: 'moota', shopeepay: 'moota', doku: 'moota',
  flip: 'manual',
};
const GATEWAY_OPTIONS = [
  { value: 'flip', label: 'Flip' },
  { value: 'moota', label: 'Moota' },
  { value: 'xendit', label: 'Xendit' },
  { value: 'ipaymu', label: 'iPaymu' },
  { value: 'duitku', label: 'Duitku' },
  { value: 'manual', label: 'Manual' },
];

// Common Indonesian bank names for the manual-transfer account dropdown.
const MANUAL_BANK_OPTIONS = [
  'Bank BCA', 'Bank BRI', 'Bank BNI', 'Bank Syariah Indonesia (BSI)',
  'Bank CIMB Niaga', 'Bank Mandiri', 'Bank Danamon', 'Bank Muamalat', 'Bank Permata',
];

// normalizeBanks reads settings.manual_banks into the structured shape
// [{bank_name, account_number, account_name, logo}], migrating the legacy flat-label
// array (["BCA",…], all sharing the single org account) on the fly.
function normalizeBanks(s: any): any[] {
  const raw = parseArr(s?.manual_banks, []);
  if (!Array.isArray(raw) || raw.length === 0) {
    // No structured list yet: seed one row from the legacy single org account if present.
    if (s?.bank_number) return [{ bank_name: s.bank_name || '', account_number: s.bank_number || '', account_name: s.bank_account_name || '', logo: '' }];
    return [];
  }
  if (typeof raw[0] === 'string') {
    // Legacy: array of labels, all pointing at the single org account.
    return raw.map((label: string) => ({ bank_name: label, account_number: s?.bank_number || '', account_name: s?.bank_account_name || '', logo: '' }));
  }
  return raw.map((b: any) => ({ bank_name: b.bank_name || '', account_number: b.account_number || b.bank_number || '', account_name: b.account_name || '', logo: b.logo || '' }));
}

// ManualBankRow — one editable manual-transfer account (name, number, holder, logo).
function ManualBankRow({ bank, onChange, onRemove, onToast }: any) {
  const [uploading, setUploading] = useState(false);
  const uploadLogo = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const res = await api.uploadImage(f);
      const url = (res as any)?.data?.url || (res as any)?.url || '';
      if (url) onChange({ logo: url });
      else onToast?.('Upload logo gagal');
    } catch (err: any) { onToast?.('Upload gagal: ' + (err?.message || '')); }
    setUploading(false);
  };
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <div className="flex items-start gap-3">
        {/* Logo */}
        <label className="shrink-0 cursor-pointer">
          <div className="h-14 w-14 rounded-lg border border-dashed border-line bg-bg2 flex items-center justify-center overflow-hidden hover:border-brand-400">
            {bank.logo ? <img src={mediaUrl(bank.logo)} alt="logo" className="h-full w-full object-contain"/> : <Icon name={uploading ? 'refresh' : 'upload'} size={16} className="text-mute"/>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={uploadLogo}/>
        </label>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-mute block mb-1">Bank</label>
            <input list="manual-bank-names" className="field" value={bank.bank_name} onChange={(e) => onChange({ bank_name: e.target.value })} placeholder="Nama bank"/>
          </div>
          <div>
            <label className="text-[11px] text-mute block mb-1">No. Rekening</label>
            <input className="field font-mono" value={bank.account_number} onChange={(e) => onChange({ account_number: e.target.value })} placeholder="No. Rekening"/>
          </div>
          <div>
            <label className="text-[11px] text-mute block mb-1">Atas Nama</label>
            <input className="field" value={bank.account_name} onChange={(e) => onChange({ account_name: e.target.value })} placeholder="Atas Nama"/>
          </div>
        </div>
        <button type="button" title="Hapus rekening" onClick={onRemove} className="shrink-0 h-8 w-8 rounded-md hover:bg-rose-50 text-mute hover:text-rose-600 flex items-center justify-center">
          <Icon name="trash" size={16}/>
        </button>
      </div>
    </div>
  );
}

function PaymentPanel({ settings, onSave }: any) {
  const showToastSafe = useUiStore((s) => s.showToast);
  const [pTab, setPTab] = useState('general');

  // Per-sub-tab unsaved-changes guard. The parent SettingsView tracks a single global
  // dirty flag, but General/Flip/Moota are sub-tabs sharing one panel with SEPARATE save
  // buttons — saving Flip would clear the global flag and make unsaved General edits look
  // saved (then silently lost). Track dirtiness per sub-tab here and confirm before
  // switching away from a sub-tab with pending edits. markPDirty fires from an
  // onChangeCapture on each sub-tab's container, so every input is covered at one point.
  const pDirtyRef = useRef<any>({});
  const markPDirty = () => { pDirtyRef.current[pTab] = true; };
  const clearPDirty = (tab: string) => { pDirtyRef.current[tab] = false; };
  const switchPTab = (next: string) => {
    if (next === pTab) return;
    if (pDirtyRef.current[pTab] && !confirm('Ada perubahan yang belum disimpan di sub-tab ini. Pindah dan buang perubahan?')) return;
    pDirtyRef.current[pTab] = false;
    setPTab(next);
  };
  const flipConfigured = !!(settings?.flip_configured);
  const mootaConfigured = !!(settings?.moota_configured);
  const xenditConfigured = !!(settings?.xendit_configured);
  const ipaymuConfigured = !!(settings?.ipaymu_configured);
  const duitkuConfigured = !!(settings?.duitku_configured);

  // ---- Umum / Kode Unik ----
  const [ucMode, setUcMode] = useState(settings?.unique_code_mode || 'range');
  const [ucMin, setUcMin] = useState(settings?.unique_code_min ?? 1);
  const [ucMax, setUcMax] = useState(settings?.unique_code_max ?? 999);
  const [ucFixed, setUcFixed] = useState(settings?.unique_code_fixed ?? 0);
  const [adminFee, setAdminFee] = useState(settings?.admin_fee ?? 0);
  const [bankName, setBankName] = useState(settings?.bank_name || '');
  const [bankNumber, setBankNumber] = useState(settings?.bank_number || '');
  const [bankHolder, setBankHolder] = useState(settings?.bank_account_name || '');

  // Payment Method Types (Toggles + Title)
  const defaultMethodTypes = METHOD_TYPES.reduce((acc: any, mt) => ({ ...acc, [mt.key]: { active: true, title: mt.defaultTitle } }), {});
  const [methodTypes, setMethodTypes] = useState<any>(parseArr(settings?.payment_method_types, defaultMethodTypes));

  // Manual-transfer bank accounts (structured): [{bank_name, account_number,
  // account_name, logo}]. Migrates the legacy flat-label array (["BCA","BNI"]) — each
  // label shared the single org account — into one structured row per label.
  const [manualBanks, setManualBanks] = useState<any>(() => normalizeBanks(settings));

  // ---- Flip ----
  const [flipEnabled, setFlipEnabled] = useState(settings?.flip_enabled ?? false);
  const [flipMode, setFlipMode] = useState(settings?.flip_mode || 'sandbox');
  const [flipSecret, setFlipSecret] = useState('');        // secret: blank = keep
  const [flipToken, setFlipToken] = useState('');          // secret: blank = keep
  const [flipCallback, setFlipCallback] = useState(settings?.flip_base_url || '');
  const [flipRedirect, setFlipRedirect] = useState(settings?.flip_auto_redirect ?? true);
  const [flipFee, setFlipFee] = useState(settings?.flip_charge_fee || 'merchant');

  // Flip Code Matrix
  const defaultFlipCodes = Object.values(FLIP_CHANNELS).flat().reduce((acc: any, ch: any) => ({ ...acc, [ch.key]: { enabled: true, code: ch.key } }), {});
  const [flipCodes, setFlipCodes] = useState<any>(parseArr(settings?.flip_code_config, defaultFlipCodes));

  // Per-channel routing matrix: {channelKey: "flip"|"moota"|"manual"}. Seeded from the
  // saved map, falling back to CHANNEL_DEFAULT_GATEWAY for any channel not yet configured.
  const seedRouting = () => {
    const saved = parseArr(settings?.payment_channel_gateways, {});
    const out: any = {};
    Object.values(FLIP_CHANNELS).flat().forEach((ch: any) => {
      out[ch.key] = saved[ch.key] || CHANNEL_DEFAULT_GATEWAY[ch.key] || 'manual';
    });
    return out;
  };
  const [routing, setRouting] = useState<any>(seedRouting);

  // ---- Xendit ----
  const [xenditEnabled, setXenditEnabled] = useState(settings?.xendit_enabled ?? false);
  const [xenditMode, setXenditMode] = useState(settings?.xendit_mode || 'sandbox');
  const [xenditSecret, setXenditSecret] = useState('');     // secret: blank = keep
  const [xenditToken, setXenditToken] = useState('');       // secret (callback token): blank = keep

  // ---- iPaymu ----
  const [ipaymuEnabled, setIpaymuEnabled] = useState(settings?.ipaymu_enabled ?? false);
  const [ipaymuMode, setIpaymuMode] = useState(settings?.ipaymu_mode || 'sandbox');
  const [ipaymuVA, setIpaymuVA] = useState(settings?.ipaymu_va || '');
  const [ipaymuKey, setIpaymuKey] = useState('');           // secret: blank = keep
  const [ipaymuBase, setIpaymuBase] = useState(settings?.ipaymu_base_url || '');

  // ---- Duitku ----
  const [duitkuEnabled, setDuitkuEnabled] = useState(settings?.duitku_enabled ?? false);
  const [duitkuMode, setDuitkuMode] = useState(settings?.duitku_mode || 'sandbox');
  const [duitkuMerchant, setDuitkuMerchant] = useState(settings?.duitku_merchant || '');
  const [duitkuKey, setDuitkuKey] = useState('');           // secret: blank = keep
  const [duitkuCbKey, setDuitkuCbKey] = useState('');       // secret: blank = keep
  const [duitkuBase, setDuitkuBase] = useState(settings?.duitku_base_url || '');

  // ---- Public-form display styles (global) ----
  const [formDisplayStyle, setFormDisplayStyle] = useState(settings?.form_display_style || 'normal');
  const [paymentDisplayStyle, setPaymentDisplayStyle] = useState(settings?.payment_display_style || 'card');

  // ---- Moota ----
  const [mootaEnabled, setMootaEnabled] = useState(settings?.moota_enabled ?? false);
  const [mootaKey, setMootaKey] = useState('');            // secret: blank = keep
  const [mootaSecret, setMootaSecret] = useState('');      // secret: blank = keep
  const [mootaSignature, setMootaSignature] = useState(settings?.moota_signature_enabled ?? true);
  const [mootaEndpoint, setMootaEndpoint] = useState(settings?.moota_endpoint || '');
  const [mootaRange, setMootaRange] = useState(settings?.moota_date_range ?? 7);
  const [mootaBalances, setMootaBalances] = useState<any>(null);
  const [mootaBalLoading, setMootaBalLoading] = useState(false);
  // Moota as a payment gateway (outbound VA/QRIS create-transaction).
  const [mootaGwEnabled, setMootaGwEnabled] = useState(settings?.moota_gateway_enabled ?? false);
  const [mootaGwAccount, setMootaGwAccount] = useState(settings?.moota_gateway_account_id || '');
  const [mootaAccounts, setMootaAccounts] = useState<any>(null);
  const [mootaAccLoading, setMootaAccLoading] = useState(false);
  const fetchMootaAccounts = async () => {
    setMootaAccLoading(true);
    try {
      const res = await api.mootaAccounts();
      if (res?.data) setMootaAccounts(res.data); else setMootaAccounts([]);
    } catch (e: any) {
      showToastSafe((e && e.message) || 'Gagal memuat akun Moota.');
      setMootaAccounts([]);
    }
    setMootaAccLoading(false);
  };

  const [mootaBalErr, setMootaBalErr] = useState('');
  const fetchMootaBalance = async () => {
    setMootaBalLoading(true);
    setMootaBalErr('');
    try {
      const res = await api.mootaBalance();
      if (res?.data) { setMootaBalances(res.data); setMootaBalErr(''); }
      else { setMootaBalances([]); setMootaBalErr('Tidak ada saldo yang dikembalikan. Periksa koneksi atau API Key Moota.'); }
    } catch (e: any) {
      // Surface the backend's actionable message (e.g. "API Key Moota ditolak (401) —
      // buat ulang token di app.moota.co → Apps & API") instead of a generic line.
      const msg = (e && e.message) ? e.message : 'Gagal cek saldo Moota. Pastikan API Key benar.';
      setMootaBalErr(msg);
      showToastSafe(msg);
    } finally {
      setMootaBalLoading(false);
    }
  };

  useEffect(() => {
    const s = settings || {};
    setUcMode(s.unique_code_mode || 'range');
    if (s.unique_code_min != null) setUcMin(s.unique_code_min);
    if (s.unique_code_max != null) setUcMax(s.unique_code_max);
    if (s.unique_code_fixed != null) setUcFixed(s.unique_code_fixed);
    if (s.admin_fee != null) setAdminFee(s.admin_fee);
    setBankName(s.bank_name || '');
    setBankNumber(s.bank_number || '');
    setBankHolder(s.bank_account_name || '');
    setMethodTypes(parseArr(s.payment_method_types, defaultMethodTypes));
    setManualBanks(normalizeBanks(s));
    // Re-seed routing matrix from saved map + defaults.
    {
      const saved = parseArr(s.payment_channel_gateways, {});
      const out: any = {};
      Object.values(FLIP_CHANNELS).flat().forEach((ch: any) => {
        out[ch.key] = saved[ch.key] || CHANNEL_DEFAULT_GATEWAY[ch.key] || 'manual';
      });
      setRouting(out);
    }

    if (s.flip_enabled != null) setFlipEnabled(s.flip_enabled);
    setFlipMode(s.flip_mode || 'sandbox');
    setFlipCallback(s.flip_base_url || '');
    if (s.flip_auto_redirect != null) setFlipRedirect(s.flip_auto_redirect);
    setFlipFee(s.flip_charge_fee || 'merchant');
    setFlipCodes(parseArr(s.flip_code_config, defaultFlipCodes));

    if (s.xendit_enabled != null) setXenditEnabled(s.xendit_enabled);
    setXenditMode(s.xendit_mode || 'sandbox');
    setFormDisplayStyle(s.form_display_style || 'normal');
    setPaymentDisplayStyle(s.payment_display_style || 'card');

    if (s.moota_enabled != null) setMootaEnabled(s.moota_enabled);
    if (s.moota_signature_enabled != null) setMootaSignature(s.moota_signature_enabled);
    setMootaEndpoint(s.moota_endpoint || '');
    if (s.moota_date_range != null) setMootaRange(s.moota_date_range);
    if (s.moota_gateway_enabled != null) setMootaGwEnabled(s.moota_gateway_enabled);
    setMootaGwAccount(s.moota_gateway_account_id || '');

    if (s.ipaymu_enabled != null) setIpaymuEnabled(s.ipaymu_enabled);
    setIpaymuMode(s.ipaymu_mode || 'sandbox');
    setIpaymuVA(s.ipaymu_va || '');
    setIpaymuBase(s.ipaymu_base_url || '');

    if (s.duitku_enabled != null) setDuitkuEnabled(s.duitku_enabled);
    setDuitkuMode(s.duitku_mode || 'sandbox');
    setDuitkuMerchant(s.duitku_merchant || '');
    setDuitkuBase(s.duitku_base_url || '');
  }, [settings]);

  const callbackHint = `${(typeof window !== 'undefined' && window.location ? window.location.origin : 'https://donasi.niatbaik.org')}/api/webhooks/flip`;
  const gwBase = (typeof window !== 'undefined' && window.location ? window.location.origin : 'https://donasi.niatbaik.org');
  const mootaWebhook = `${gwBase}/api/webhooks/moota`;
  const xenditWebhook = `${gwBase}/api/webhooks/xendit`;
  const ipaymuWebhook = `${gwBase}/api/webhooks/ipaymu`;
  const duitkuWebhook = `${gwBase}/api/webhooks/duitku`;

  const saveGeneral = () => {
    // Sanitize the structured bank rows (drop blank-name rows; normalize numbers).
    const cleanBanks = (manualBanks || [])
      .map((b: any) => ({
        bank_name: (b.bank_name || '').trim(),
        account_number: (b.account_number || '').replace(/[^0-9]/g, ''),
        account_name: (b.account_name || '').trim(),
        logo: b.logo || '',
      }))
      .filter((b: any) => b.bank_name && b.account_number);
    // Keep the legacy single-account fields in sync from the first bank so the backend's
    // hasManualBank() guard (settings.bank_number != "") and any legacy reader still work.
    const primary = cleanBanks[0] || { bank_name: '', account_number: '', account_name: '' };
    const patch: any = {
      unique_code_mode: ucMode,
      admin_fee: parseInt(String(adminFee).replace(/\D/g, ''), 10) || 0,
      bank_name: primary.bank_name,
      bank_number: primary.account_number,
      bank_account_name: primary.account_name,
      payment_method_types: JSON.stringify(methodTypes),
      manual_banks: JSON.stringify(cleanBanks),
      payment_channel_gateways: JSON.stringify(routing),
      form_display_style: formDisplayStyle,
      payment_display_style: paymentDisplayStyle,
    };
    // unique_code_mode=none breaks auto-reconcile for manual + Moota-gateway channels
    // (no unique code → untagged transfers can't be disambiguated). Warn if any channel
    // routes to manual/moota while unique is off.
    if (ucMode === 'none' && Object.values(routing).some((g: any) => g === 'manual' || g === 'moota')) {
      showToastSafe('⚠ Kode unik = none: pembayaran manual & Moota tidak bisa terverifikasi otomatis. Pakai mode range/fixed.');
    }
    if (ucMode === 'fixed') patch.unique_code_fixed = parseInt(String(ucFixed).replace(/\D/g, ''), 10) || 0;
    if (ucMode === 'range') {
      patch.unique_code_min = parseInt(String(ucMin).replace(/\D/g, ''), 10) || 1;
      patch.unique_code_max = parseInt(String(ucMax).replace(/\D/g, ''), 10) || 999;
      if (patch.unique_code_min > patch.unique_code_max) { showToastSafe('Min kode unik tidak boleh lebih besar dari Max'); return; }
    }
    return onSave(patch).then((ok: any) => {
      if (ok) clearPDirty('general');
      // Warn (don't block — the admin may configure Flip on the next tab) if this leaves
      // no payable path at all, so the UNPAYABLE state can't slip out silently.
      if (ok && !flipEffective && !patch.bank_number) {
        showToastSafe('⚠ Belum ada metode bayar aktif — aktifkan Flip atau isi rekening bank, agar donasi bisa diproses.');
      }
      return ok;
    });
  };

  const saveFlip = () => {
    const patch: any = {
      flip_enabled: flipEnabled,
      flip_mode: flipMode,
      flip_base_url: flipCallback.trim(),
      flip_auto_redirect: flipRedirect,
      flip_charge_fee: flipFee,
      flip_code_config: JSON.stringify(flipCodes)
    };
    if (flipSecret.trim()) patch.flip_secret_key = flipSecret.trim();
    if (flipToken.trim()) patch.flip_validation_token = flipToken.trim();
    if (flipEnabled && !flipConfigured && !flipSecret.trim()) { showToastSafe('Isi Flip API Secret Key untuk mengaktifkan Flip'); return; }
    // Turning Flip OFF with no manual bank configured leaves donors no way to pay.
    if (!flipEnabled && !manualPath) {
      showToastSafe('⚠ Flip dimatikan & belum ada rekening manual — donasi tidak bisa diproses. Isi rekening bank di tab General.');
    }
    return onSave(patch).then((ok: any) => { if (ok) { setFlipSecret(''); setFlipToken(''); clearPDirty('flip'); } return ok; });
  };

  const saveXendit = () => {
    const patch: any = {
      xendit_enabled: xenditEnabled,
      xendit_mode: xenditMode,
    };
    if (xenditSecret.trim()) patch.xendit_secret_key = xenditSecret.trim();
    if (xenditToken.trim()) patch.xendit_callback_token = xenditToken.trim();
    if (xenditEnabled && !xenditConfigured && !xenditSecret.trim()) { showToastSafe('Isi Xendit Secret Key untuk mengaktifkan Xendit'); return; }
    return onSave(patch).then((ok: any) => { if (ok) { setXenditSecret(''); setXenditToken(''); clearPDirty('xendit'); } return ok; });
  };

  const saveMoota = () => {
    const patch: any = {
      moota_enabled: mootaEnabled,
      moota_signature_enabled: mootaSignature,
      moota_endpoint: mootaEndpoint.trim(),
      moota_date_range: parseInt(String(mootaRange).replace(/\D/g, ''), 10) || 7,
      moota_gateway_enabled: mootaGwEnabled,
      moota_gateway_account_id: mootaGwAccount.trim(),
    };
    if (mootaGwEnabled && !mootaGwAccount.trim()) {
      showToastSafe('Pilih Akun Gateway Moota dulu untuk mengaktifkan payment gateway Moota.');
      return;
    }
    if (mootaKey.trim()) patch.moota_api_key = mootaKey.trim();
    if (mootaSecret.trim()) patch.moota_webhook_secret = mootaSecret.trim();
    return onSave(patch).then((ok: any) => { if (ok) { setMootaKey(''); setMootaSecret(''); clearPDirty('moota'); } return ok; });
  };

  const saveIpaymu = () => {
    if (ipaymuEnabled && !ipaymuConfigured && (!ipaymuKey.trim() || !ipaymuVA.trim())) {
      showToastSafe('Isi VA + API Key iPaymu untuk mengaktifkan iPaymu'); return;
    }
    const patch: any = {
      ipaymu_enabled: ipaymuEnabled,
      ipaymu_mode: ipaymuMode,
      ipaymu_va: ipaymuVA.trim(),
      ipaymu_base_url: ipaymuBase.trim(),
    };
    if (ipaymuKey.trim()) patch.ipaymu_api_key = ipaymuKey.trim();
    return onSave(patch).then((ok: any) => { if (ok) { setIpaymuKey(''); clearPDirty('ipaymu'); } return ok; });
  };

  const saveDuitku = () => {
    if (duitkuEnabled && !duitkuConfigured && (!duitkuKey.trim() || !duitkuMerchant.trim())) {
      showToastSafe('Isi Merchant Code + API Key Duitku untuk mengaktifkan Duitku'); return;
    }
    const patch: any = {
      duitku_enabled: duitkuEnabled,
      duitku_mode: duitkuMode,
      duitku_merchant: duitkuMerchant.trim(),
      duitku_base_url: duitkuBase.trim(),
    };
    if (duitkuKey.trim()) patch.duitku_api_key = duitkuKey.trim();
    if (duitkuCbKey.trim()) patch.duitku_callback_key = duitkuCbKey.trim();
    return onSave(patch).then((ok: any) => { if (ok) { setDuitkuKey(''); setDuitkuCbKey(''); clearPDirty('duitku'); } return ok; });
  };

  const copy = (t: string) => { try { navigator.clipboard?.writeText(t); showToastSafe('Disalin'); } catch {} };

  // Is there ANY payable path? Flip (effectively enabled: toggle on AND either already
  // configured or a secret is being entered now) OR a manual bank account (number +
  // name). With neither, donors see no way to pay → donations are UNPAYABLE. This drives
  // a persistent warning banner and blocks the two saves that could create the dead state.
  const flipEffective = flipEnabled && (flipConfigured || !!flipSecret.trim());

  // Per-gateway color/status metadata for the routing matrix legend + color-coded rows.
  const GATEWAY_META: Record<string, { dot: string; cls: string }> = {
    flip:   { dot: 'bg-orange-500', cls: 'border-orange-200 bg-orange-50 text-orange-700' },
    moota:  { dot: 'bg-sky-500',    cls: 'border-sky-200 bg-sky-50 text-sky-700' },
    xendit: { dot: 'bg-indigo-500', cls: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
    ipaymu: { dot: 'bg-emerald-500',cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    duitku: { dot: 'bg-violet-500', cls: 'border-violet-200 bg-violet-50 text-violet-700' },
    manual: { dot: 'bg-slate-400',  cls: 'border-line bg-white text-ink' },
  };
  const GATEWAY_STATUS = [
    { key: 'flip',   label: 'Flip',   on: flipEnabled && flipConfigured,     cls: 'bg-orange-50 text-orange-700 border-orange-200',  dot: 'bg-orange-500' },
    { key: 'moota',  label: 'Moota',  on: mootaGwEnabled && mootaConfigured, cls: 'bg-sky-50 text-sky-700 border-sky-200',           dot: 'bg-sky-500' },
    { key: 'xendit', label: 'Xendit', on: xenditEnabled && xenditConfigured, cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',   dot: 'bg-indigo-500' },
    { key: 'ipaymu', label: 'iPaymu', on: ipaymuEnabled && ipaymuConfigured, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',dot: 'bg-emerald-500' },
    { key: 'duitku', label: 'Duitku', on: duitkuEnabled && duitkuConfigured, cls: 'bg-violet-50 text-violet-700 border-violet-200',    dot: 'bg-violet-500' },
    { key: 'manual', label: 'Manual', on: true,                              cls: 'bg-slate-100 text-slate-700 border-slate-200',     dot: 'bg-slate-500' },
  ];
  // Payable manual path = at least one configured account NUMBER to transfer to.
  // Read from the live structured manualBanks rows (the new editor only writes there;
  // the legacy single bankNumber is derived from row 0 on save, so checking bankNumber
  // would be stale while editing). Matches backend hasManualPath (ParseManualBanks > 0).
  const manualPath = (manualBanks || []).some((b: any) => (b.account_number || '').replace(/[^0-9]/g, '').length >= 6);
  const noPayablePath = !flipEffective && !manualPath;

  return (
    <Section title="Payment" sub="Silahkan diatur sesuai kebutuhan pembayaran anda.">
      {/* UNPAYABLE-config warning — persistent across all sub-tabs. The known prod bug:
          Flip off (or unconfigured) AND no manual bank → donations cannot be completed. */}
      {noPayablePath && (
        <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 leading-relaxed">
          <b>⚠ Tidak ada metode pembayaran aktif.</b> Donasi tidak bisa diproses: aktifkan Flip
          (isi kredensial) <b>atau</b> isi rekening bank manual (No. Rekening + Nama Bank di tab General).
        </div>
      )}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {[{v:'general', l:'General'},{v:'flip', l:'Flip'},{v:'xendit', l:'Xendit'},{v:'moota', l:'Moota'},{v:'ipaymu', l:'iPaymu'},{v:'duitku', l:'Duitku'}].map((t) => (
          <button key={t.v} onClick={() => switchPTab(t.v)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${pTab===t.v ? 'bg-brand-600 text-white' : 'bg-transparent text-ink/70 hover:bg-bg2'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {pTab === 'general' && (
        <div onChangeCapture={markPDirty}>
        <div className="space-y-8">
          {/* Unique Number */}
          <div>
            <label className="text-sm font-bold text-ink mb-1 block">Unique Number / Kode Unik</label>
            <div className="text-[11px] text-mute mb-3">Gunakan sesuai kebutuhan, pilih 'None' jika tidak ingin ada tambahan kode unik pada total.</div>
            <div className="flex items-center gap-4 mb-3">
              {[{v:'none',l:'None'},{v:'fixed',l:'Fixed'},{v:'range',l:'Range'}].map((o) => (
                <label key={o.v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="ucMode" value={o.v} checked={ucMode === o.v} onChange={() => setUcMode(o.v)} className="w-4 h-4 text-brand-600 border-line focus:ring-brand-600"/>
                  <span className="text-sm text-ink">{o.l}</span>
                </label>
              ))}
            </div>
            {ucMode === 'fixed' && (
              <input type="number" min="0" className="field max-w-[120px]" value={ucFixed} onChange={(e) => setUcFixed(e.target.value)}/>
            )}
            {ucMode === 'range' && (
              <div className="flex items-center gap-2">
                <input type="number" min="0" className="field w-24" value={ucMin} onChange={(e) => setUcMin(e.target.value)}/>
                <span className="text-mute">:</span>
                <input type="number" min="0" className="field w-24" value={ucMax} onChange={(e) => setUcMax(e.target.value)}/>
              </div>
            )}
          </div>

          {/* Payment Method Types */}
          <div>
            <label className="text-sm font-bold text-ink mb-1 block">Payment Method</label>
            <div className="text-[11px] text-mute mb-3">Aktifkan sesuai kebutuhan agar tampil pada list metode pembayaran.</div>
            <div className="space-y-3">
              {METHOD_TYPES.map(mt => (
                <div key={mt.key} className="flex items-center gap-3 border border-line rounded-lg p-3 bg-white">
                  <Icon name="plus" size={18} className="text-mute shrink-0"/>
                  <div className="w-28 shrink-0">
                    <div className="text-xs font-bold text-ink mb-1">{mt.defaultTitle.split('(')[0].trim()}</div>
                    <Toggle value={methodTypes[mt.key]?.active} onChange={(v: any) => setMethodTypes((prev: any) => ({...prev, [mt.key]: {...prev[mt.key], active: v}}))} label={methodTypes[mt.key]?.active ? 'Active' : 'Not Active'}/>
                  </div>
                  <input className="field flex-1" value={methodTypes[mt.key]?.title || ''} onChange={(e) => setMethodTypes((prev: any) => ({...prev, [mt.key]: {...prev[mt.key], title: e.target.value}}))} placeholder="Title"/>
                </div>
              ))}
            </div>
          </div>

          {/* Biaya Admin */}
          <div className="flex items-end gap-3">
            <div>
              <label className="text-[11px] text-mute block mb-1">Biaya Admin (Rp)</label>
              <input type="number" min="0" className="field w-40" value={adminFee} onChange={(e) => setAdminFee(e.target.value)}/>
            </div>
            <div className="text-[11px] text-mute pb-2">Dipotong dari nominal yang masuk ke campaign.</div>
          </div>

          {/* Rekening Transfer Manual — daftar rekening lengkap (nama, nomor, atas nama, logo)
              yang muncul sebagai dropdown di form donasi publik. */}
          <div>
            <label className="text-sm font-bold text-ink mb-1 block">Rekening Transfer Manual</label>
            <div className="text-[11px] text-mute mb-3">Tambahkan satu atau beberapa rekening tujuan. Donatur memilih salah satu via dropdown di halaman donasi, lalu konfirmasi ke CS via WhatsApp.</div>

            <div className="space-y-3">
              {manualBanks.length === 0 && (
                <div className="rounded-lg border border-dashed border-line p-4 text-center text-[12px] text-mute">Belum ada rekening. Klik "Tambah Rekening" di bawah.</div>
              )}
              {manualBanks.map((b: any, i: number) => (
                <ManualBankRow key={i} bank={b}
                  onChange={(patch: any) => setManualBanks((prev: any) => prev.map((x: any, j: number) => j === i ? { ...x, ...patch } : x))}
                  onRemove={() => setManualBanks((prev: any) => prev.filter((_: any, j: number) => j !== i))}
                  onToast={showToastSafe}/>
              ))}
            </div>
            <datalist id="manual-bank-names">{MANUAL_BANK_OPTIONS.map((b) => <option key={b} value={b}/>)}</datalist>
            <button type="button"
              onClick={() => setManualBanks((prev: any) => [...prev, { bank_name: '', account_number: '', account_name: '', logo: '' }])}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:underline">
              <Icon name="plus" size={14}/> Tambah Rekening
            </button>
            <div className="text-[11px] text-mute mt-3">Transfer manual direkonsiliasi otomatis via Moota (cek mutasi) bila aktif, atau dikonfirmasi manual oleh CS.</div>
          </div>

          {/* ===== Routing Pembayaran (per-channel gateway matrix, redesigned) ===== */}
          <div>
            <label className="text-sm font-bold text-ink mb-1 block">Routing Pembayaran</label>
            <div className="text-[11px] text-mute mb-3 leading-relaxed">
              Tentukan gateway yang menyelesaikan tiap metode. Gateway yang belum aktif / kredensialnya belum lengkap otomatis turun ke <b>Manual</b> di sisi donatur.
            </div>

            {/* Gateway status legend — quick glance which are live */}
            <div className="flex flex-wrap gap-2 mb-3">
              {GATEWAY_STATUS.map((g) => (
                <span key={g.key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${g.on ? g.cls : 'bg-bg2 text-mute border-line'}`}>
                  <span className={`h-2 w-2 rounded-full ${g.on ? g.dot : 'bg-slate-300'}`}/>
                  {g.label}
                  <span className="opacity-70 font-semibold">{g.key === 'manual' ? '· selalu aktif' : g.on ? '· aktif' : '· off'}</span>
                </span>
              ))}
            </div>

            <div className="rounded-xl border border-line overflow-hidden">
              {Object.entries(FLIP_CHANNELS).map(([typeKey, channels]: any) => (
                <div key={typeKey}>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-mute bg-bg2 border-t border-line first:border-t-0">
                    {typeKey === 'va' ? 'Virtual Account' : typeKey === 'instant' ? 'Instan (QRIS / e-wallet)' : 'Transfer'}
                  </div>
                  <div className="divide-y divide-line/60">
                    {channels.map((ch: any) => {
                      const gw = routing[ch.key] || 'manual';
                      const meta = GATEWAY_META[gw] || GATEWAY_META.manual;
                      const live = gw === 'manual' || (GATEWAY_STATUS.find((g) => g.key === gw)?.on ?? false);
                      return (
                        <div key={ch.key} className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2">
                          <span className="text-sm text-ink flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}/>
                            {ch.name}
                            {!live && <span className="text-[10px] text-amber-600 font-semibold">→ manual</span>}
                          </span>
                          <select
                            value={gw}
                            onChange={(e) => setRouting((prev: any) => ({ ...prev, [ch.key]: e.target.value }))}
                            className={`text-xs font-bold rounded-lg border px-2.5 py-1.5 focus:ring-0 focus:border-brand-600 ${meta.cls}`}>
                            {GATEWAY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bulk apply-all helper */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-mute font-semibold">Set semua metode ke:</span>
              {GATEWAY_OPTIONS.map((o) => (
                <button key={o.value} type="button"
                  onClick={() => { const out: any = {}; Object.values(FLIP_CHANNELS).flat().forEach((ch: any) => { out[ch.key] = o.value; }); setRouting(out); markPDirty(); }}
                  className="px-2.5 py-1 rounded-md border border-line text-[11px] font-bold text-ink hover:bg-bg2">{o.label}</button>
              ))}
            </div>

            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-700 leading-relaxed">
              <b>Catatan gateway hosted:</b> Flip/Xendit/iPaymu/Duitku hanya menampilkan metode yang aktif di dashboard merchant masing-masing. Pengaturan di sini hanya menentukan gateway mana yang memproses tiap channel di situs NiatBaik.
            </div>
          </div>

          {/* ===== Tampilan Form Publik (global) ===== */}
          <div>
            <label className="text-sm font-bold text-ink mb-1 block">Tampilan Form Donasi (Public Page)</label>
            <div className="text-[11px] text-mute mb-3">Berlaku untuk semua campaign. Atur ketebalan font/border form dan bentuk pemilih metode pembayaran.</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div>
                <label className="text-[11px] text-mute block mb-1">Gaya Font &amp; Border</label>
                <Select value={formDisplayStyle} onChange={setFormDisplayStyle} options={[{value:'normal',label:'Normal'},{value:'bold',label:'Tebal (Bold)'}]}/>
              </div>
              <div>
                <label className="text-[11px] text-mute block mb-1">Tampilan Metode Pembayaran</label>
                <Select value={paymentDisplayStyle} onChange={setPaymentDisplayStyle} options={[{value:'card',label:'Card (kotak)'},{value:'dropdown',label:'Dropdown (select)'}]}/>
              </div>
            </div>
          </div>

        </div>
        <div className="flex mt-8"><SaveButton onClick={saveGeneral}>Update</SaveButton></div>
        </div>
      )}

      {pTab === 'flip' && (
        <div onChangeCapture={markPDirty}>
        <div className="space-y-8">
          <div className="flex items-center justify-between rounded-xl border border-line p-3">
            <div><div className="text-sm font-bold text-ink">Aktifkan Flip</div><div className="text-xs text-mute">Bagi yang belum memiliki akun Flip Business, bisa mendaftar melalui link berikut: <a href="https://flip.id/business" target="_blank" rel="noopener noreferrer" className="text-brand-600 font-semibold hover:underline">Daftar akun Flip Business sekarang</a></div></div>
            <Toggle value={flipEnabled} onChange={setFlipEnabled}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Mode</label>
            <div className="text-[11px] text-mute mb-2">Gunakan mode Sandbox (Development) untuk uji coba test dan LIVE jika sistem sudah berjalan.</div>
            <div className="flex items-center gap-4">
              {[{v:'sandbox',l:'Sandbox'},{v:'production',l:'LIVE (Production)'}].map((o) => (
                <button key={o.v} onClick={() => setFlipMode(o.v)}
                  className={`px-8 py-2.5 rounded-lg border text-sm font-bold transition-colors ${flipMode===o.v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink hover:bg-bg2'}`}>{o.l}</button>
              ))}
            </div>
          </div>
          <SecretInput label={`Flip API Secret Key ${flipMode==='sandbox'?' - Sandbox':' - Production'}`} value={flipSecret} onChange={setFlipSecret} configured={flipConfigured} placeholder="API Key"/>
          <SecretInput label={`Flip Validation Token ${flipMode==='sandbox'?' - Sandbox':' - Production'}`} value={flipToken} onChange={setFlipToken} configured={flipConfigured} placeholder="Private Key"/>
          <div>
            <label className="text-xs font-semibold text-mute flex items-center gap-2">URL Callback {flipMode==='sandbox'?' - Sandbox':' - Production'} <span className="text-[10px] text-mute font-normal">(set di dashboard Flip)</span></label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-line bg-bg2 px-3 py-2">
              <span className="flex-1 min-w-0 truncate text-xs font-mono text-mute">{callbackHint}</span>
              <button type="button" onClick={() => copy(callbackHint)} className="text-xs font-bold text-brand-600 hover:underline shrink-0">Salin</button>
            </div>
            <input className="field mt-2" value={flipCallback} onChange={(e) => setFlipCallback(e.target.value)} placeholder="Override base URL Flip (opsional — kosongkan untuk otomatis dari Mode)"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-line rounded-xl p-4">
            <div>
              <div className="flex items-center gap-4 mb-1">
                <span className="text-sm font-bold text-ink">Auto Redirect</span>
                <Toggle value={flipRedirect} onChange={setFlipRedirect}/>
              </div>
              <div className="text-[11px] text-mute">Settingan ini hanya berlaku untuk metode Instant dan Transfer Flip.</div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-mute block mb-1">Biaya (Charge Fee)</label>
              <Select value={flipFee} onChange={setFlipFee} options={[{value:'merchant',label:'Ditanggung Merchant'},{value:'donatur',label:'Ditanggung Donatur'}]}/>
              <div className="text-[11px] text-mute mt-1">Biaya admin transaksi dapat dibebankan kepada Donatur atau ditanggung oleh Merchant (Setelah setting jangan lupa hubungi CS Flip jika ingin dibebankan ke Donatur).</div>
            </div>
          </div>

          {/* Flip Code Matrix */}
          <div>
            <div className="text-sm font-bold text-ink mb-1">Flip Code</div>
            <div className="text-[11px] text-mute mb-4">Perhatikan pada bagian 'code' dan gunakan pada saat mensetting payment dengan Flip for Business.</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(FLIP_CHANNELS).map(([typeKey, channels]: any) => (
                <div key={typeKey}>
                  <div className="text-xs font-bold text-mute uppercase tracking-wider mb-3">{typeKey === 'va' ? 'Virtual Account' : typeKey}</div>
                  <div className="space-y-3">
                    {channels.map((ch: any) => (
                      <div key={ch.key} className="flex items-center gap-3">
                        <input type="checkbox" checked={flipCodes[ch.key]?.enabled} onChange={(e) => setFlipCodes((prev: any) => ({...prev, [ch.key]: {...prev[ch.key], enabled: e.target.checked}}))} className="w-4 h-4 rounded text-brand-600 border-line focus:ring-brand-600"/>
                        <span className="text-sm text-ink w-24">{ch.name}</span>
                        <div className="flex-1 flex items-center bg-bg2 rounded border border-line px-2 py-1">
                          <span className="text-[10px] text-mute w-8">Code:</span>
                          <input className="bg-transparent border-0 p-0 text-xs font-mono text-ink w-full focus:ring-0" value={flipCodes[ch.key]?.code || ch.key} onChange={(e) => setFlipCodes((prev: any) => ({...prev, [ch.key]: {...prev[ch.key], code: e.target.value}}))}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        <div className="flex mt-8"><SaveButton onClick={saveFlip}>Update Flip</SaveButton></div>
        </div>
      )}

      {pTab === 'xendit' && (
        <div onChangeCapture={markPDirty}>
        <div className="space-y-8">
          <div className="flex items-center justify-between rounded-xl border border-line p-3">
            <div><div className="text-sm font-bold text-ink">Aktifkan Xendit</div><div className="text-xs text-mute">Gateway pembayaran multi-channel (VA, QRIS, e-wallet, retail). Daftar di <a href="https://dashboard.xendit.co" target="_blank" rel="noopener noreferrer" className="text-brand-600 font-semibold hover:underline">dashboard.xendit.co</a></div></div>
            <Toggle value={xenditEnabled} onChange={setXenditEnabled}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Mode</label>
            <div className="text-[11px] text-mute mb-2">Mode ditentukan oleh prefix Secret Key (xnd_development_… = Sandbox, xnd_production_… = LIVE). Pilihan ini hanya pengingat.</div>
            <div className="flex items-center gap-4">
              {[{v:'sandbox',l:'Sandbox'},{v:'production',l:'LIVE (Production)'}].map((o) => (
                <button key={o.v} onClick={() => setXenditMode(o.v)}
                  className={`px-8 py-2.5 rounded-lg border text-sm font-bold transition-colors ${xenditMode===o.v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink hover:bg-bg2'}`}>{o.l}</button>
              ))}
            </div>
          </div>
          <SecretInput label={`Xendit Secret Key ${xenditMode==='sandbox'?' - Sandbox':' - Production'}`} value={xenditSecret} onChange={setXenditSecret} configured={xenditConfigured} placeholder="xnd_development_… / xnd_production_…"/>
          <SecretInput label="Xendit Callback Verification Token" value={xenditToken} onChange={setXenditToken} configured={xenditConfigured} placeholder="Token dari Settings → Webhooks (X-CALLBACK-TOKEN)"/>
          <div>
            <label className="text-xs font-semibold text-ink mb-1 block">URL Callback (set di dashboard Xendit → Settings → Webhooks → Invoices Paid)</label>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-bg2 px-3 py-2 max-w-md">
              <span className="flex-1 min-w-0 truncate text-xs font-mono text-mute">{xenditWebhook}</span>
              <button type="button" onClick={() => copy(xenditWebhook)} className="text-xs font-bold text-brand-600 hover:underline shrink-0">Salin</button>
            </div>
            <div className="text-[11px] text-mute mt-2 leading-relaxed">Pilih channel pembayaran yang ingin ditampilkan langsung di dashboard Xendit (Settings → Payment Channels). Untuk merutekan metode ke Xendit, atur di tab <b>General → Routing Pembayaran</b>.</div>
          </div>
        </div>
        <div className="flex mt-8"><SaveButton onClick={saveXendit}>Update Xendit</SaveButton></div>
        </div>
      )}

      {pTab === 'moota' && (
        <div onChangeCapture={markPDirty}>
        <div className="space-y-6">
          <div>
            <div className="text-sm font-bold text-ink mb-1">Bagi yang belum memiliki akun Moota, bisa mendaftar melalui link berikut:</div>
            <a href="https://moota.co" target="_blank" rel="noopener noreferrer" className="text-brand-600 font-semibold text-sm hover:underline">Daftar akun Moota sekarang</a>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line p-3">
            <div><div className="text-sm font-bold text-ink">Aktifkan Moota</div></div>
            <Toggle value={mootaEnabled} onChange={setMootaEnabled}/>
          </div>
          <div>
            <div className="flex items-center gap-4 mb-1">
              <span className="text-sm font-bold text-ink">Signature Moota</span>
              <Toggle value={mootaSignature} onChange={setMootaSignature} label={mootaSignature ? 'Active' : 'Not Active'}/>
            </div>
            <div className="text-[11px] text-mute">Default aktif untuk Security, Non-aktifkan jika website anda mengalami kendala dengan pembuatan Signature Moota.</div>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink mb-1 block">URL Endpoint (set di dashboard Moota)</label>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-bg2 px-3 py-2 max-w-md">
              <span className="flex-1 min-w-0 truncate text-xs font-mono text-mute">{mootaWebhook}</span>
              <button type="button" onClick={() => copy(mootaWebhook)} className="text-xs font-bold text-brand-600 hover:underline shrink-0">Copy</button>
            </div>
            <input className="field mt-2 max-w-md" value={mootaEndpoint} onChange={(e) => setMootaEndpoint(e.target.value)} placeholder="Endpoint Moota (opsional)"/>
          </div>
          <div className="max-w-md">
            <SecretInput label="Moota Secret Token (webhook)" value={mootaSecret} onChange={setMootaSecret} configured={mootaConfigured}/>
          </div>
          <div className="max-w-md">
            <SecretInput label="Moota API Key (opsional)" value={mootaKey} onChange={setMootaKey} configured={mootaConfigured} placeholder="API key dari dashboard Moota"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink block mb-1">Moota Date Range (hari)</label>
            <input type="number" min="1" max="90" className="field w-24" value={mootaRange} onChange={(e) => setMootaRange(e.target.value)}/>
          </div>

          {/* ===== Moota Payment Gateway (outbound VA/QRIS) ===== */}
          <div className="border-2 border-brand-100 bg-brand-50/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-bold text-ink">Payment Gateway Moota</div>
                <div className="text-[11px] text-mute">Terima pembayaran VA / QRIS via Moota (Winpay). Berbeda dari fitur saldo/mutasi.</div>
              </div>
              <Toggle value={mootaGwEnabled} onChange={setMootaGwEnabled}/>
            </div>
            {mootaGwEnabled && (
              <div className="mt-2 space-y-2">
                <label className="text-[11px] font-semibold text-mute block">Akun Gateway (bank_account_id)</label>
                <div className="flex items-center gap-2">
                  <select value={mootaGwAccount} onChange={(e) => setMootaGwAccount(e.target.value)}
                    className="flex-1 text-sm rounded-lg border border-line bg-white px-3 py-2 text-ink focus:border-brand-600 focus:ring-0">
                    <option value="">— Pilih akun —</option>
                    {(mootaAccounts || []).map((a: any) => (
                      <option key={a.bank_id} value={a.bank_id}>{(a.bank_type || '').toUpperCase()} · {a.account_number} · {a.name}</option>
                    ))}
                    {/* Keep the saved id selectable even before the list loads. */}
                    {mootaGwAccount && !(mootaAccounts || []).some((a: any) => a.bank_id === mootaGwAccount) && (
                      <option value={mootaGwAccount}>{mootaGwAccount}</option>
                    )}
                  </select>
                  <button type="button" onClick={fetchMootaAccounts} disabled={mootaAccLoading}
                    className="shrink-0 text-xs font-bold text-brand-600 border border-brand-200 bg-white px-3 py-2 rounded-lg hover:bg-brand-50 disabled:opacity-50">
                    {mootaAccLoading ? 'Memuat…' : 'Muat Akun'}
                  </button>
                </div>
                <div className="text-[11px] text-mute leading-relaxed">
                  Pilih rekening Moota (idealnya akun Payment Gateway / Winpay) yang akan menampung pembayaran. Untuk VA/QRIS asli, akun harus tipe Payment Gateway — akun vaSandbox hanya menghasilkan halaman bayar hosted.
                </div>
              </div>
            )}
          </div>

          {/* Cek Saldo Moota */}
          {mootaConfigured && (
            <div className="bg-bg2 p-4 rounded-xl border border-line">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-bold text-ink">Saldo Rekening (Moota)</div>
                  <div className="text-[11px] text-mute">Menampilkan saldo terkini dari bank yang terhubung di akun Moota Anda.</div>
                </div>
                <button type="button" onClick={fetchMootaBalance} disabled={mootaBalLoading} className="text-sm font-bold text-brand-600 border border-brand-200 bg-white px-4 py-2 rounded-lg hover:bg-brand-50 disabled:opacity-50">
                  {mootaBalLoading ? 'Mengecek...' : 'Cek Saldo'}
                </button>
              </div>

              {mootaBalErr && (
                <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 leading-relaxed">
                  {mootaBalErr}
                </div>
              )}
              {mootaBalances && mootaBalances.length > 0 && (
                <div className="space-y-2">
                  {mootaBalances.map((b: any) => (
                    <div key={b.bank_id} className="flex justify-between items-center bg-white p-3 rounded border border-line">
                      <div>
                        <div className="text-sm font-bold text-ink">{b.bank_type.toUpperCase()} <span className="text-xs font-normal text-mute ml-2">{b.account_number}</span></div>
                        <div className="text-xs text-mute">{b.name}</div>
                      </div>
                      <div className="text-base font-bold text-emerald-600">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(b.balance)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {mootaBalances && mootaBalances.length === 0 && (
                <div className="text-sm text-mute italic text-center p-4 bg-white rounded border border-line">Belum ada bank yang terhubung di akun Moota Anda.</div>
              )}
            </div>
          )}
        </div>
        <div className="flex mt-8"><SaveButton onClick={saveMoota}>Update Moota</SaveButton></div>
        </div>
      )}

      {pTab === 'ipaymu' && (
        <div onChangeCapture={markPDirty}>
        <div className="space-y-8">
          <div className="flex items-center justify-between rounded-xl border border-line p-3">
            <div><div className="text-sm font-bold text-ink">Aktifkan iPaymu</div><div className="text-xs text-mute">Gateway pembayaran hosted (VA, QRIS, e-wallet, retail). Daftar di <a href="https://my.ipaymu.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 font-semibold hover:underline">my.ipaymu.com</a></div></div>
            <Toggle value={ipaymuEnabled} onChange={setIpaymuEnabled}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Mode</label>
            <div className="text-[11px] text-mute mb-2">Sandbox pakai <code>https://sandbox.ipaymu.co.id</code>, LIVE pakai <code>https://my.ipaymu.co.id</code> (isi di Base URL).</div>
            <div className="flex items-center gap-4">
              {[{v:'sandbox',l:'Sandbox'},{v:'production',l:'LIVE (Production)'}].map((o) => (
                <button key={o.v} onClick={() => setIpaymuMode(o.v)}
                  className={`px-8 py-2.5 rounded-lg border text-sm font-bold transition-colors ${ipaymuMode===o.v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink hover:bg-bg2'}`}>{o.l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">VA (Nomor Virtual Account iPaymu)</label>
            <input className="field mt-1 font-mono" value={ipaymuVA} onChange={(e) => setIpaymuVA(e.target.value)} placeholder="Contoh: 0000001234567890"/>
          </div>
          <SecretInput label="iPaymu API Key" value={ipaymuKey} onChange={setIpaymuKey} configured={ipaymuConfigured} placeholder="API Key dari dashboard iPaymu"/>
          <div>
            <label className="text-xs font-semibold text-mute">Base URL (opsional)</label>
            <input className="field mt-1 font-mono" value={ipaymuBase} onChange={(e) => setIpaymuBase(e.target.value)} placeholder="https://my.ipaymu.co.id"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink mb-1 block">URL Callback / Notify (set di dashboard iPaymu)</label>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-bg2 px-3 py-2 max-w-md">
              <span className="flex-1 min-w-0 truncate text-xs font-mono text-mute">{ipaymuWebhook}</span>
              <button type="button" onClick={() => copy(ipaymuWebhook)} className="text-xs font-bold text-brand-600 hover:underline shrink-0">Salin</button>
            </div>
            <div className="text-[11px] text-mute mt-2 leading-relaxed">Untuk merutekan channel ke iPaymu, atur di tab <b>General → Routing Pembayaran</b>.</div>
          </div>
        </div>
        <div className="flex mt-8"><SaveButton onClick={saveIpaymu}>Update iPaymu</SaveButton></div>
        </div>
      )}

      {pTab === 'duitku' && (
        <div onChangeCapture={markPDirty}>
        <div className="space-y-8">
          <div className="flex items-center justify-between rounded-xl border border-line p-3">
            <div><div className="text-sm font-bold text-ink">Aktifkan Duitku</div><div className="text-xs text-mute">Gateway pembayaran hosted (VA, QRIS, e-wallet, retail, paylater). Daftar di <a href="https://dashboard.duitku.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 font-semibold hover:underline">dashboard.duitku.com</a></div></div>
            <Toggle value={duitkuEnabled} onChange={setDuitkuEnabled}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Mode</label>
            <div className="text-[11px] text-mute mb-2">Sandbox pakai <code>https://sandbox.duitku.com</code>, LIVE pakai <code>https://passport.duitku.com</code> (isi di Base URL).</div>
            <div className="flex items-center gap-4">
              {[{v:'sandbox',l:'Sandbox'},{v:'production',l:'LIVE (Production)'}].map((o) => (
                <button key={o.v} onClick={() => setDuitkuMode(o.v)}
                  className={`px-8 py-2.5 rounded-lg border text-sm font-bold transition-colors ${duitkuMode===o.v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink hover:bg-bg2'}`}>{o.l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Merchant Code</label>
            <input className="field mt-1 font-mono" value={duitkuMerchant} onChange={(e) => setDuitkuMerchant(e.target.value)} placeholder="Contoh: DXXXX"/>
          </div>
          <SecretInput label="Duitku API Key" value={duitkuKey} onChange={setDuitkuKey} configured={duitkuConfigured} placeholder="API Key dari dashboard Duitku"/>
          <SecretInput label="Duitku Callback Key (opsional)" value={duitkuCbKey} onChange={setDuitkuCbKey} configured={duitkuConfigured} placeholder="Kosongkan untuk pakai API Key sebagai verifikasi"/>
          <div>
            <label className="text-xs font-semibold text-mute">Base URL (opsional)</label>
            <input className="field mt-1 font-mono" value={duitkuBase} onChange={(e) => setDuitkuBase(e.target.value)} placeholder="https://passport.duitku.com"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink mb-1 block">URL Callback (set di dashboard Duitku → Project → Callback URL)</label>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-bg2 px-3 py-2 max-w-md">
              <span className="flex-1 min-w-0 truncate text-xs font-mono text-mute">{duitkuWebhook}</span>
              <button type="button" onClick={() => copy(duitkuWebhook)} className="text-xs font-bold text-brand-600 hover:underline shrink-0">Salin</button>
            </div>
            <div className="text-[11px] text-mute mt-2 leading-relaxed">Untuk merutekan channel ke Duitku, atur di tab <b>General → Routing Pembayaran</b>.</div>
          </div>
        </div>
        <div className="flex mt-8"><SaveButton onClick={saveDuitku}>Update Duitku</SaveButton></div>
        </div>
      )}
    </Section>
  );
}
function SecretInput({ label, value, onChange, configured, placeholder }: any) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-xs font-semibold text-mute flex items-center gap-2">
        {label}
        {configured && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">tersimpan</span>}
      </label>
      <div className="mt-1 relative">
        <input type={show ? 'text' : 'password'} className="field pr-9 font-mono" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={configured ? 'Isi untuk mengganti · kosongkan untuk tetap' : (placeholder || '')}/>
        <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-bg2 flex items-center justify-center text-mute">
          <Icon name="eye" size={15} className={show ? 'text-brand-600' : ''}/>
        </button>
      </div>
    </div>
  );
}

function TrackingPanel({ settings, onSave }: any) {
  const showToast = useUiStore((s) => s.showToast);
  const [pixelIds, setPixelIds] = useState<any>({});
  // Server-side token presence flags (read-only booleans from backend; token values
  // are secret and never echoed back). Drives the "Tersimpan" badge on credential inputs.
  const [tokenSet, setTokenSet] = useState<any>({});
  const [showToken, setShowToken] = useState<any>({});
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
    { name:'Looker Studio (Data Studio)', status:'not', icon:'chart', color:'bg-[#4285F4]' },
  ];
  const events = ['PageView','ViewContent','InitiateCheckout','AddPaymentInfo','Lead','CompleteDonation','Purchase'];
  // Real verification of pixel events happens in each platform's official debug tool
  // (fired from the live public page), not from this admin form. Link there instead
  // of faking a "test event sent" toast.
  const PIXEL_VERIFY_URL: any = {
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
  const [lookerReports, setLookerReports] = useState<any>(parseArr(settings?.looker_reports, DEFAULT_LOOKER));
  const [lookerModal, setLookerModal] = useState(false);
  const [lookerForm, setLookerForm] = useState<any>({ name:'', url:'' });
  const [editingLooker, setEditingLooker] = useState<any>(null);

  useEffect(() => { setLookerReports(parseArr(settings?.looker_reports, DEFAULT_LOOKER)); }, [settings]);

  useEffect(() => {
    if (!settings) return;
    setPixelIds({
      'Meta Pixel': settings.meta_pixel_id || '',
      'Google Tag Manager': settings.gtm_id || '',
      'Google Ads Conversion': settings.google_ads_conversion_id || '',
      'Google Analytics 4': settings.ga4_measurement_id || '',
      'TikTok Pixel': settings.tiktok_pixel_id || '',
      'Looker Studio (Data Studio)': settings.looker_studio_embed || '',
    });
    setTokenSet({
      meta: !!settings.meta_capi_token_set,
      tiktok: !!settings.tiktok_access_token_set,
    });
  }, [settings]);

  // Global Meta Pixel: CAPI toggle + per-page event mapping (campaign editor inherits this on "Default").
  const DEFAULT_EVENTS = { campaign:'PageView', form:'InitiateCheckout', invoice:'Lead', success:'Purchase' };
  const parseObjSafe = (v: any, fb: any) => { if (v && typeof v === 'object') return v; if (typeof v === 'string' && v.trim()) { try { const p = JSON.parse(v); if (p && typeof p === 'object') return p; } catch {} } return fb; };
  const [capiEnabled, setCapiEnabled] = useState(!!settings?.meta_capi_enabled);
  const [metaEvents, setMetaEvents] = useState<any>(parseObjSafe(settings?.event_tracking_config, DEFAULT_EVENTS));
  useEffect(() => {
    setCapiEnabled(!!settings?.meta_capi_enabled);
    setMetaEvents(parseObjSafe(settings?.event_tracking_config, DEFAULT_EVENTS));
  }, [settings]);
  const EVENT_OPTS = ['', 'PageView','ViewContent','InitiateCheckout','AddPaymentInfo','Lead','Purchase','CompleteDonation'];

  const openAddLooker = () => { setEditingLooker(null); setLookerForm({ name:'', url:'' }); setLookerModal(true); };
  const openEditLooker = (r: any, i: number) => { setEditingLooker(i); setLookerForm({ name: r.name, url: r.url }); setLookerModal(true); };
  const saveLooker = () => {
    if (!lookerForm.name.trim() || !lookerForm.url.trim()) { showToast('Nama dan URL wajib diisi'); return; }
    let updated;
    if (editingLooker != null) {
      updated = lookerReports.map((r: any, i: number) => i === editingLooker ? { ...r, ...lookerForm } : r);
    } else {
      updated = [...lookerReports, { ...lookerForm, updated:'baru saja', status:'active', dim:'-', owner:'-' }];
    }
    setLookerReports(updated);
    onSave({ looker_reports: updated });
    setLookerModal(false);
  };

  const statusMap: any = {
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
                  <input className="field mt-2 font-mono text-xs" value={pixelIds[p.name] ?? ''} onChange={(e) => setPixelIds((prev: any) => ({...prev, [p.name]: e.target.value}))} placeholder="Masukkan ID…"/>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-mute">{(pixelIds[p.name] || '').trim() ? 'ID tersimpan — verifikasi event live di tool resmi' : 'Belum dikonfigurasi'}</span>
                <a className="text-brand-600 font-semibold hover:underline" href={PIXEL_VERIFY_URL[p.name] || '#'} target="_blank" rel="noopener noreferrer">Cara verifikasi</a>
              </div>
            </div>
          ))}
        </div>
        {/* Server-side conversion credentials (CAPI / EAPI) — secrets, never echoed back.
            Empty input = keep existing token (backend maps only non-nil pointer fields). */}
        <div className="mt-5 pt-4 border-t border-line">
          <div className="text-sm font-bold text-ink mb-1">Server-side Conversion Credentials</div>
          <div className="text-xs text-mute mb-3">Token rahasia untuk Meta CAPI & TikTok Events API. Disimpan terenkripsi di server; kosongkan jika tidak ingin mengganti token yang sudah ada.</div>
          {[
            { tokenKey:'meta_capi_token', testKey:'meta_test_event_code', label:'Meta CAPI Access Token', placeholder:'EAAG…', saved: tokenSet.meta },
            { tokenKey:'tiktok_access_token', testKey:'tiktok_test_event_code', label:'TikTok Events API Token', placeholder:'tt…', saved: tokenSet.tiktok },
          ].map((c) => (
            <div key={c.tokenKey} className="mb-3">
              <label className="text-xs font-semibold text-mute flex items-center gap-1.5">
                {c.label}
                {c.saved && <Badge tone="ok" size="sm" dot>Tersimpan</Badge>}
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type={showToken[c.tokenKey] ? 'text' : 'password'}
                  className="field flex-1 font-mono text-xs"
                  placeholder={c.saved ? '•••••• (kosongkan jika tidak diganti)' : c.placeholder}
                  onChange={(e) => setPixelIds((prev: any) => ({ ...prev, [c.tokenKey]: e.target.value }))}
                />
                <button type="button" className="text-xs font-semibold text-brand-600 hover:underline whitespace-nowrap" onClick={() => setShowToken((prev: any) => ({ ...prev, [c.tokenKey]: !prev[c.tokenKey] }))}>
                  {showToken[c.tokenKey] ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
              <input
                type="text"
                className="field mt-2 font-mono text-xs"
                placeholder={`${c.label} — Test Event Code (sandbox)`}
                onChange={(e) => setPixelIds((prev: any) => ({ ...prev, [c.testKey]: e.target.value }))}
              />
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
          <SaveButton onClick={() => onSave({
            meta_pixel_id: pixelIds['Meta Pixel'] || '',
            meta_capi_enabled: capiEnabled,
            // Credential secrets: send only when the admin typed a value; undefined keeps
            // the existing stored token (backend maps non-nil pointer fields only).
            meta_capi_token: pixelIds.meta_capi_token || undefined,
            meta_test_event_code: pixelIds.meta_test_event_code || undefined,
            event_tracking_config: JSON.stringify(metaEvents),
            gtm_id: pixelIds['Google Tag Manager'] || '',
            google_ads_conversion_id: pixelIds['Google Ads Conversion'] || '',
            ga4_measurement_id: pixelIds['Google Analytics 4'] || '',
            tiktok_pixel_id: pixelIds['TikTok Pixel'] || '',
            tiktok_access_token: pixelIds.tiktok_access_token || undefined,
            tiktok_test_event_code: pixelIds.tiktok_test_event_code || undefined,
            looker_studio_embed: pixelIds['Looker Studio (Data Studio)'] || '',
          })}>Simpan Semua Tracking</SaveButton>
        </div>
      </Section>

      <Section title="Looker Studio Reports" sub="Hubungkan dashboard Looker Studio (Data Studio) untuk konsolidasi semua data ads & donasi dalam satu tampilan."
        actions={<Btn size="sm" tone="brand" icon="chart" onClick={() => { try { window.dispatchEvent(new CustomEvent('nb-go-datastudio')); } catch{} }}>Buka Data Studio</Btn>}>
        <div className="space-y-3">
          {(Array.isArray(lookerReports)?lookerReports:[]).map((r: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-line">
              <div className="h-10 w-10 rounded-lg bg-[#4285F4] text-white flex items-center justify-center shrink-0">
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
          <div><label className="text-xs font-semibold text-mute">Nama Report</label><input className="field mt-1" value={lookerForm.name} onChange={(e) => setLookerForm((f: any) => ({...f, name: e.target.value}))} placeholder="cth: Overview Donasi"/></div>
          <div><label className="text-xs font-semibold text-mute">URL Looker Studio</label><input className="field mt-1" value={lookerForm.url} onChange={(e) => setLookerForm((f: any) => ({...f, url: e.target.value}))} placeholder="lookerstudio.google.com/reporting/…"/></div>
        </div>
      </Modal>
    </>
  );
}

function NotificationPanel({ settings, onSave }: any) {
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
  const parseNotif = (raw: any) => {
    let obj = raw;
    if (typeof raw === 'string' && raw.trim()) { try { obj = JSON.parse(raw); } catch { obj = null; } }
    if (obj && typeof obj === 'object') return labels.map((n, i) => obj[n.label] ?? INIT[i]);
    return INIT;
  };
  const [vals, setVals] = useState<any>(() => parseNotif(settings?.notification_config));
  useEffect(() => { if (settings?.notification_config) setVals(parseNotif(settings.notification_config)); }, [settings]);
  const toggle = (i: number) => setVals((prev: any) => prev.map((v: any, j: number) => j === i ? !v : v));
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
        <SaveButton onClick={() => onSave({ notification_config: JSON.stringify(Object.fromEntries(labels.map((n, i) => [n.label, vals[i]]))) })}>Simpan Perubahan</SaveButton>
      </div>
    </>
  );
}

function SocialPanel({ settings, onSave }: any) {
  // social_proof_config is a JSON string column (backend).
  const parseSP = (raw: any) => { let o = raw; if (typeof raw === 'string' && raw.trim()) { try { o = JSON.parse(raw); } catch { o = null; } } return (o && typeof o === 'object') ? o : {}; };
  const sp = parseSP(settings?.social_proof_config);
  const [spEnabled, setSpEnabled] = useState(sp.enabled ?? true);
  const [spInterval, setSpInterval] = useState(sp.interval || '8');
  const [spPosition, setSpPosition] = useState(sp.position ?? 2);
  const [spTemplate, setSpTemplate] = useState(sp.template || '{{nama}} baru saja berdonasi {{nominal}} untuk {{campaign}}');
  const [spFallback, setSpFallback] = useState(sp.fallback || 'Hamba Allah, Rizky H., Siti N., Hamba Allah');
  useEffect(() => {
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
              <textarea className="field mt-1" rows={3} value={spTemplate} onChange={(e) => setSpTemplate(e.target.value)}/>
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
        <SaveButton onClick={() => onSave({ social_proof_config: JSON.stringify({ enabled: spEnabled, interval: spInterval, position: spPosition, template: spTemplate, fallback: spFallback }), social_proof_enabled: spEnabled })}>Simpan Perubahan</SaveButton>
      </div>
    </>
  );
}

const DEFAULT_RULES = [
  { c:'Bantuan Aira', pct:12 },
  { c:'Sumur Bersih NTT', pct:10 },
  { c:'Wakaf Quran', pct:8 },
];
const parseObj = (v: any) => {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) { try { const p = JSON.parse(v); if (p && typeof p === 'object') return p; } catch {} }
  return {};
};

function FundraisingPanel({ settings, onSave }: any) {
  const showToast = useUiStore((s) => s.showToast);
  const fr = parseObj(settings?.fundraising_config);
  const [enabled, setEnabled] = useState(fr.enabled ?? true);
  const [autoCalc, setAutoCalc] = useState(fr.auto_calc ?? true);
  const [commission, setCommission] = useState(fr.commission || '10');
  const [minPayout, setMinPayout] = useState(fr.min_payout || 'Rp 100.000');
  const [period, setPeriod] = useState(fr.period || 'month');
  const [rules, setRules] = useState<any>(parseArr(fr.rules, DEFAULT_RULES));
  useEffect(() => {
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
            <div><label className="text-xs font-semibold text-mute">Default komisi</label><div className="mt-1 flex items-center gap-2"><input type="number" min="0" max="100" className="field" value={commission} onChange={(e) => setCommission(e.target.value)}/><span className="text-mute">%</span></div>
              {(() => { const n = parseInt(String(commission).replace(/\D/g,''),10); return (commission !== '' && (isNaN(n) || n < 0 || n > 100)) ? <div className="text-[10px] text-rose-600 mt-0.5">Komisi harus 0–100%</div> : null; })()}
            </div>
            <div><label className="text-xs font-semibold text-mute">Minimum payout</label><input className="field mt-1" value={minPayout} onChange={(e) => setMinPayout(e.target.value)}/></div>
            <div><label className="text-xs font-semibold text-mute">Periode payout</label><Select value={period} onChange={setPeriod} options={[{value:'week',label:'Mingguan'},{value:'month',label:'Bulanan'}]} className="mt-1"/></div>
          </div>
          <div className="rounded-xl border border-line p-4">
            <div className="font-semibold text-ink mb-2">Aturan khusus per campaign</div>
            <div className="space-y-2">
              {(Array.isArray(rules)?rules:[]).map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 font-medium text-ink">{r.c}</span>
                  <input type="number" value={r.pct} onChange={e => setRules((prev: any) => prev.map((x: any, j: number) => j === i ? {...x, pct: +e.target.value} : x))}
                    className="w-16 field text-right"/>
                  <span className="text-mute">%</span>
                  <button onClick={() => setRules((prev: any) => prev.filter((_: any, j: number) => j !== i))} className="text-mute hover:text-rose-600"><Icon name="trash" size={14}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
      <div className="flex justify-end mt-4">
        <SaveButton onClick={() => {
          const pct = parseInt(String(commission).replace(/\D/g,''),10);
          if (isNaN(pct) || pct < 0 || pct > 100) { showToast('Komisi harus 0–100%'); return; }
          // Clamp per-rule percentages to 0–100 too.
          const safeRules = (Array.isArray(rules)?rules:[]).map((r: any) => ({ ...r, pct: Math.max(0, Math.min(100, +r.pct || 0)) }));
          return onSave({ fundraising_config: JSON.stringify({ enabled, auto_calc: autoCalc, commission: String(pct), min_payout: minPayout, period, rules: safeRules }), fundraiser_commission_percent: pct });
        }}>Simpan Perubahan</SaveButton>
      </div>
    </>
  );
}

function CategoryPanel() {
  const showToast = useUiStore((s) => s.showToast);
  const [cats, setCats] = useState<any>(() => (useDataStore.getState().categories || []).slice());
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<any>(null); // {id, name}
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const r = await api.categories();
      if (r?.data && Array.isArray(r.data)) {
        useDataStore.getState().setCategories(r.data);
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
      if (editing) { await api.updateCategory(editing.id, { name: nm }); showToast('Kategori diperbarui'); }
      else { await api.createCategory({ name: nm }); showToast('Kategori ditambahkan'); }
      setName(''); setEditing(null);
      await refresh();
    } catch (e: any) { showToast('Gagal: ' + (e?.message || 'coba lagi')); }
    setBusy(false);
  };

  const remove = async (cat: any) => {
    if (!confirm('Hapus kategori "' + cat.name + '"? Campaign yang memakainya akan menjadi tanpa kategori.')) return;
    setBusy(true);
    try { await api.deleteCategory(cat.id); showToast('Kategori dihapus'); await refresh(); }
    catch (e: any) { showToast('Gagal menghapus: ' + (e?.message || '')); }
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
        {cats.map((cat: any) => (
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
  const showToast = useUiStore((s) => s.showToast);
  const [rows, setRows] = useState<any>(() => (useDataStore.getState().paymentStatuses || []).slice());
  const blank = { code:'', label:'', color:'#10B981', is_paid:false, is_default:false, sort_order:0 };
  const [form, setForm] = useState<any>(blank);
  const [editing, setEditing] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const r = await api.paymentStatuses();
      if (r?.data && Array.isArray(r.data)) { useDataStore.getState().setPaymentStatuses(r.data); setRows(r.data.slice()); }
    } catch {}
  };

  const submit = async () => {
    const code = form.code.trim(), label = form.label.trim();
    if (!code || !label) { showToast('Code dan label wajib diisi'); return; }
    setBusy(true);
    try {
      const payload = { code, label, color: form.color, is_paid: !!form.is_paid, is_default: !!form.is_default, sort_order: Number(form.sort_order) || 0 };
      if (editing) { await api.updatePaymentStatus(editing, payload); showToast('Status diperbarui'); }
      else { await api.createPaymentStatus(payload); showToast('Status ditambahkan'); }
      setForm(blank); setEditing(null);
      await refresh();
    } catch (e: any) { showToast('Gagal: ' + (e?.message || 'coba lagi')); }
    setBusy(false);
  };

  const edit = (s: any) => { setEditing(s.id); setForm({ code:s.code, label:s.label, color:s.color || '#10B981', is_paid:!!s.is_paid, is_default:!!s.is_default, sort_order:s.sort_order || 0 }); };
  const remove = async (s: any) => {
    if (!confirm('Hapus status "' + s.label + '"? Invoice yang memakainya tetap menyimpan teks status lama.')) return;
    setBusy(true);
    try { await api.deletePaymentStatus(s.id); showToast('Status dihapus'); await refresh(); }
    catch (e: any) { showToast('Gagal menghapus: ' + (e?.message || '')); }
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
        {rows.map((s: any) => (
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

function GeneralPanel({ settings, onSave }: any) {
  const showToast = useUiStore((s) => s.showToast);
  const [siteName, setSiteName] = useState(settings?.site_name || 'NIATBAIK.ORG');
  const [domain, setDomain] = useState(settings?.domain || 'niatbaik.org');
  const [tz, setTz] = useState(settings?.timezone || 'Asia/Jakarta (WIB) · GMT+7');
  const [currency, setCurrency] = useState(settings?.currency || 'IDR (Rp)');
  const [seoTitle, setSeoTitle] = useState(settings?.seo_title || 'NIATBAIK.ORG — Salurkan Kebaikan, Wujudkan Niat Baik');
  const [seoDesc, setSeoDesc] = useState(settings?.seo_description || 'Platform donasi & crowdfunding terpercaya untuk kemanusiaan, pendidikan, dan kesehatan di seluruh Indonesia.');
  const [maintenance, setMaintenance] = useState(settings?.maintenance ?? false);
  const [smtpHost, setSmtpHost] = useState(settings?.smtp_host || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(settings?.smtp_port || 587);
  const [smtpEmail, setSmtpEmail] = useState(settings?.smtp_email || '');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpName, setSmtpName] = useState(settings?.smtp_name || 'NIATBAIK.ORG');
  const [smtpShowPwd, setSmtpShowPwd] = useState(false);
  const [testTo, setTestTo] = useState(settings?.smtp_email || '');
  const [testBusy, setTestBusy] = useState(false);
  const sendTest = async () => {
    const to = (testTo || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) { showToast('Masukkan email tujuan yang valid'); return; }
    setTestBusy(true);
    try {
      await api.testEmail(to);
      showToast('Email tes terkirim ke ' + to);
    } catch (e: any) { showToast('Gagal kirim tes: ' + (e?.message || 'periksa konfigurasi SMTP')); }
    setTestBusy(false);
  };
  const [formPageName, setFormPageName] = useState(settings?.form_page_name || 'donasi');
  const [typPageName, setTypPageName] = useState(settings?.thankyou_page_name || 'invoice');
  // Donor greeting message + CS contact rotator
  const [donorGreeting, setDonorGreeting] = useState(settings?.donor_greeting || '');
  const [csMode, setCsMode] = useState(settings?.cs_rotator_mode || 'default');
  const parseCsContacts = (v: any) => {
    try { const p = typeof v === 'string' && v ? JSON.parse(v) : v; return Array.isArray(p) ? p : []; } catch { return []; }
  };
  const [csContacts, setCsContacts] = useState<any>(() => parseCsContacts(settings?.cs_contacts));
  // CS Cekat Ai (AI-first, human fallback). Secret key blank = keep.
  const [cekatEnabled, setCekatEnabled] = useState(settings?.cekat_ai_enabled ?? false);
  const [cekatEndpoint, setCekatEndpoint] = useState(settings?.cekat_ai_endpoint || '');
  const [cekatModel, setCekatModel] = useState(settings?.cekat_ai_model || '');
  const [cekatPrompt, setCekatPrompt] = useState(settings?.cekat_ai_system_prompt || '');
  const [cekatKey, setCekatKey] = useState('');
  const cekatConfigured = !!(settings?.cekat_ai_configured);
  const [cekatTesting, setCekatTesting] = useState(false);
  const testCekat = async () => {
    setCekatTesting(true);
    try { await api.cekatAiTest(); showToast('Koneksi Cekat Ai berhasil ✓'); }
    catch (e: any) { showToast('Tes gagal: ' + (e?.message || 'cek endpoint & API key')); }
    setCekatTesting(false);
  };
  useEffect(() => {
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
    if (settings?.cekat_ai_enabled != null) setCekatEnabled(settings.cekat_ai_enabled);
    setCekatEndpoint(settings?.cekat_ai_endpoint || '');
    setCekatModel(settings?.cekat_ai_model || '');
    setCekatPrompt(settings?.cekat_ai_system_prompt || '');
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
          <div><label className="text-xs font-semibold text-mute">SEO Description</label><textarea className="field mt-1" rows={3} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)}/></div>
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
            <textarea className="field mt-1" rows={2} value={donorGreeting} onChange={(e) => setDonorGreeting(e.target.value)}
              placeholder="Terima kasih atas niat baik Anda 🙏 Tim kami siap membantu via WhatsApp."/>
            <div className="text-[11px] text-mute mt-1">Ditampilkan ke donatur setelah donasi / di halaman invoice.</div>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Mode kontak CS</label>
            <Select value={csMode} onChange={setCsMode} options={[
              {value:'default', label:'Default (satu nomor)'},
              {value:'rotator', label:'Rotator (bergilir berurutan)'},
              {value:'least', label:'Least-loaded (paling sedikit beban)'},
            ]} className="mt-1"/>
            <div className="text-[11px] text-mute mt-1">
              <b>Default</b>: selalu nomor pertama. <b>Rotator</b>: bergilir berurutan tiap donasi.
              <b> Least-loaded</b>: tiap donasi diarahkan ke CS dengan donasi paling sedikit. Nomor CS
              disimpan per-invoice (donatur lihat nomor yang sama di semua halaman).
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Nomor CS (WhatsApp)</label>
            <div className="space-y-2 mt-1">
              {csContacts.map((ct: any, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1">
                    <input className="field font-mono" value={ct.phone || ''} placeholder="628xxxxxxxxxx"
                      onChange={(e) => {
                        // Keep digits only, normalize leading 0 → 62 (Indonesia E.164-ish).
                        let v = e.target.value.replace(/[^0-9]/g, '');
                        if (v.startsWith('0')) v = '62' + v.slice(1);
                        setCsContacts((prev: any) => prev.map((x: any, j: number) => j === i ? { ...x, phone: v } : x));
                      }}/>
                    {(ct.phone || '').length > 0 && ((ct.phone || '').length < 8 || (ct.phone || '').length > 15) && (
                      <div className="text-[10px] text-rose-600 mt-0.5">Nomor harus 8–15 digit (mis. 628123456789)</div>
                    )}
                  </div>
                  <input className="field flex-1" value={ct.name || ''} placeholder="Nama CS (opsional)"
                    onChange={(e) => setCsContacts((prev: any) => prev.map((x: any, j: number) => j === i ? { ...x, name: e.target.value } : x))}/>
                  <button onClick={() => setCsContacts((prev: any) => prev.filter((_: any, j: number) => j !== i))}
                    className="h-9 w-9 rounded-md hover:bg-rose-50 text-mute hover:text-rose-600 flex items-center justify-center shrink-0"><Icon name="trash" size={14}/></button>
                </div>
              ))}
              <button onClick={() => setCsContacts((prev: any) => [...prev, { phone:'', name:'' }])}
                className="text-xs font-bold text-brand-600 hover:underline">+ Tambah nomor CS</button>
            </div>
          </div>

          {/* CS Cekat Ai — AI-first, fallback ke CS manusia (nomor WA di atas) */}
          <div className="pt-4 mt-2 border-t border-line">
            <div className="flex items-center justify-between rounded-xl border border-line p-3">
              <div>
                <div className="text-sm font-bold text-ink flex items-center gap-2"><Icon name="sparkle" size={15} className="text-brand-600"/> CS Cekat Ai (AI)</div>
                <div className="text-xs text-mute mt-0.5">AI menjawab donatur lebih dulu; bila AI gagal atau donatur minta bicara dengan manusia, otomatis dialihkan ke CS WhatsApp di atas.</div>
              </div>
              <Toggle value={cekatEnabled} onChange={setCekatEnabled}/>
            </div>
            {cekatEnabled && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-mute">Endpoint API (OpenAI-compatible chat completions)</label>
                  <input className="field mt-1 font-mono" value={cekatEndpoint} onChange={(e) => setCekatEndpoint(e.target.value)} placeholder="https://api.cekat.ai/v1  atau  https://api.openai.com/v1"/>
                  <div className="text-[11px] text-mute mt-1">Boleh base URL (otomatis ditambah <code>/v1/chat/completions</code>) atau URL lengkap.</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-mute">Model</label>
                    <input className="field mt-1 font-mono" value={cekatModel} onChange={(e) => setCekatModel(e.target.value)} placeholder="gpt-4o-mini"/>
                  </div>
                  <SecretInput label="API Key" value={cekatKey} onChange={setCekatKey} configured={cekatConfigured} placeholder="Bearer key"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-mute">System Prompt (persona CS)</label>
                  <textarea className="field mt-1" rows={3} value={cekatPrompt} onChange={(e) => setCekatPrompt(e.target.value)}
                    placeholder="Anda CS ramah NIATBAIK.ORG. Jawab singkat, sopan, bahasa Indonesia. Bantu soal cara donasi, konfirmasi pembayaran, status donasi."/>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={testCekat} disabled={cekatTesting}
                    className="px-3 py-1.5 rounded-lg border border-brand-200 bg-white text-xs font-bold text-brand-600 hover:bg-brand-50 disabled:opacity-50">
                    {cekatTesting ? 'Menguji…' : 'Tes Koneksi'}
                  </button>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${cekatConfigured ? 'text-emerald-600' : 'text-mute'}`}>
                    <span className={`h-2 w-2 rounded-full ${cekatConfigured ? 'bg-emerald-500' : 'bg-slate-300'}`}/>
                    {cekatConfigured ? 'Terkonfigurasi' : 'Belum ada API key'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>
      <Section title="Maintenance Mode" sub="Aktifkan untuk menutup akses publik sementara saat update besar.">
        <Toggle value={maintenance} onChange={setMaintenance} label="Aktifkan maintenance mode" sub="Pengunjung akan melihat halaman maintenance."/>
      </Section>
      <div className="flex justify-end mt-4">
        <SaveButton onClick={() => {
          const patch: any = { site_name: siteName, domain, timezone: tz, currency, seo_title: seoTitle, seo_description: seoDesc, maintenance, smtp_host: smtpHost, smtp_port: smtpPort, smtp_email: smtpEmail, smtp_name: smtpName, form_page_name: formPageName || 'donasi', thankyou_page_name: typPageName || 'invoice',
            donor_greeting: donorGreeting,
            cs_rotator_mode: csMode,
            cs_contacts: JSON.stringify(csContacts
              .map((x: any) => ({ phone: (x.phone || '').replace(/[^0-9]/g, ''), name: (x.name || '').trim() }))
              .filter((x: any) => x.phone.length >= 8 && x.phone.length <= 15)),
            cekat_ai_enabled: cekatEnabled,
            cekat_ai_endpoint: cekatEndpoint.trim(),
            cekat_ai_model: cekatModel.trim(),
            cekat_ai_system_prompt: cekatPrompt,
          };
          if (smtpPassword) patch.smtp_password = smtpPassword;
          if (cekatKey.trim()) patch.cekat_ai_key = cekatKey.trim();
          return onSave(patch).then((ok: any) => { if (ok) setCekatKey(''); return ok; });
        }}>Simpan Perubahan</SaveButton>
      </div>
    </>
  );
}

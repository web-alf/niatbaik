import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, mediaUrl, sanitizeHTML, normalizeRichTextColors } from '@/lib/api';
import { mapCampaign } from '@/lib/mappers';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';
import { Card, Btn, Icon, Badge, StatusBadge } from '@/components';

// Full-page Campaign editor (Create / Edit). Matches the spec in the attached doc.
const EVENT_OPTS = ['', 'PageView','ViewContent','InitiateCheckout','AddPaymentInfo','Lead','Purchase','CompleteDonation'];

// pad → yyyy-MM-dd for <input type="date">.
function fmtDateInput(d: any) {
  const p = (n: any) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// deriveEndDate computes the campaign's end date for the date picker.
// backend provides: remaining-days count (days_left), duration_days + posted_at, no
// raw deadline/end_date (future schema may add one). Empty when nothing is known.
function deriveEndDate(c: any) {
  if (!c) return '';
  if (c.deadline || c.end_date) {
    const d = new Date(c.deadline || c.end_date);
    if (!isNaN(d.getTime())) return fmtDateInput(d);
  }
  if (typeof c.days_left === 'number' && c.days_left > 0) {
    const d = new Date();
    d.setDate(d.getDate() + c.days_left);
    return fmtDateInput(d);
  }
  if (typeof c.duration_days === 'number' && c.duration_days > 0) {
    const base = c.posted_at ? new Date(c.posted_at) : new Date();
    if (!isNaN(base.getTime())) { base.setDate(base.getDate() + c.duration_days); return fmtDateInput(base); }
  }
  return '';
}

// daysFromToday = whole days from now until yyyy-MM-dd (rounded up, min 0).
// Used to convert the date picker back into the backend's duration_days.
function daysFromToday(dateStr: any) {
  const target = new Date(dateStr + 'T23:59:59');
  if (isNaN(target.getTime())) return 0;
  const ms = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

// Inner form. Receives the campaign to edit as a prop (the FULL record when
// editing — see CampaignEditorView wrapper) so every field round-trips. All seed
// state below is derived from `c` on mount; the wrapper remounts this via `key` so
// fresh data re-seeds the form.
function CampaignEditorForm({ campaign }: any) {
  const showToast = useUiStore((s) => s.showToast);
  const navigate = useNavigate();
  const isEdit = !!campaign;
  const c = campaign;

  // Re-render if categories change in Settings while the editor is open.
  const [, setCatVer] = useState(0);
  useEffect(() => {
    const onCats = () => setCatVer(v => v + 1);
    window.addEventListener('nb-categories-updated', onCats);
    return () => window.removeEventListener('nb-categories-updated', onCats);
  }, []);

  // Payment methods (from Setting → Payment) used to populate the bank dropdown in
  // the advanced-option custom payment section. Load once on mount.
  const [payMethods, setPayMethods] = useState(() => useDataStore.getState().paymentMethodsList || useDataStore.getState().paymentMethodsPublic || []);
  useEffect(() => {
    let alive = true;
    if (api && api.paymentMethods) {
      api.paymentMethods()
        .then((r: any) => { if (alive && r && Array.isArray(r.data)) { setPayMethods(r.data); } })
        .catch(() => {});
    }
    return () => { alive = false; };
  }, []);

  // ---- form state ----
  const [title, setTitle] = useState(c?.title || '');
  const [content, setContent] = useState(c?.description || c?.short_description || '');
  const [target, setTarget] = useState(c?.target || 0);
  // Campaign expiry is stored backend-side as duration_days (PostedAt + N days), not a
  // date. Seed the date picker from the remaining/total duration so an edit shows the
  // real end date instead of a hardcoded literal, and send it back as duration_days on
  // save (previously endDate was collected but NEVER added to the payload → silently
  // discarded every edit).
  const [endDate, setEndDate] = useState(deriveEndDate(c) || '');
  const [location, setLocation] = useState(c?.location_name || '');
  const [gmaps, setGmaps] = useState(c?.location_gmaps || '');
  const [category, setCategory] = useState(c?.category || 'Uncategorized');
  // The campaigns list remaps backend statuses to design labels (Berjalan→Running,
  // Selesai→Ended) before passing the campaign here, so normalize back to the
  // canonical backend value the status <select> options + backend enum expect —
  // otherwise the dropdown shows blank and looks "reverted".
  const STATUS_DENORM: any = { Running: 'Berjalan', Ended: 'Selesai', Aktif: 'Berjalan' };
  const [status, setStatus] = useState(STATUS_DENORM[c?.status] || c?.status || 'Draft');
  const [thumb, setThumb] = useState(c?.img || c?.thumb || null);

  // Editable URL slugs. Public campaign page lives at <origin>/c/<slug>; use the
  // current origin so the displayed/copied link matches the real host (was hardcoded
  // to niatbaik.org, the wrong host — public site is donasi.niatbaik.org).
  const publicBaseUrl = (typeof window !== 'undefined' && window.location && window.location.origin) || 'https://donasi.niatbaik.org';
  const autoSlug = (title || c?.title || 'kampanye-baru').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  // When editing, seed the Long URL from the campaign's SAVED slug (was previously
  // derived from the title every time, so a custom slug never loaded and looked like
  // it reverted). New campaigns start from the title-derived slug.
  const [longSlug, setLongSlug] = useState(c?.slug || autoSlug);
  const [shortSlug] = useState(c?.id || 'djag7hj20pg');
  // Re-sync the long slug from the title only for NEW campaigns the user hasn't
  // hand-edited. On an existing campaign the saved slug is authoritative — don't
  // clobber it when the title field mounts/changes.
  const [longTouched, setLongTouched] = useState(false);
  useEffect(() => {
    if (isEdit || longTouched) return;
    setLongSlug((title || 'kampanye-baru').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''));
  }, [title]);

  // ---- form type panel ----
  // Initialize from the campaign being edited so saving doesn't silently reset them.
  // form_type is stored lowercase by the backend default ('donasi') but the editor uses
  // canonical 'Donation'/'Zakat' for its toggle. Normalize the seed so a legacy/default
  // campaign ('donasi') still highlights the toggle and the Zakat branches work — without
  // this, formMode was the raw 'donasi' and every `formMode === 'Zakat'` check silently
  // failed AND neither toggle button appeared selected.
  const normFormMode = (v: any) => /zakat/i.test(String(v || '')) ? 'Zakat' : 'Donation';
  const [formMode, setFormMode] = useState(normFormMode(c?.form_type)); // Donation | Zakat
  const [formStyle, setFormStyle] = useState(c?.form_style || 'Card');  // List | Typing | Package | Card | Package2 | Qurban

  // Safe JSON parse helper for the per-campaign config blobs (payment/pixel/form).
  const parseJSONObj = (raw: any) => {
    if (raw && typeof raw === 'object') return raw;
    if (typeof raw === 'string' && raw.trim()) { try { return JSON.parse(raw) || {}; } catch { return {}; } }
    return {};
  };
  // Saved per-campaign payment rows + pixel config, so the "Custom" advanced panels
  // round-trip on re-edit instead of resetting (these were previously dropped by
  // the backend entirely; now persisted via payment_config / pixel_config columns).
  const savedPaymentRows = (() => {
    const p = parseJSONObj(c?.payment_config);
    return Array.isArray(p) ? p : (Array.isArray(p.rows) ? p.rows : []);
  })();
  const savedPixel = parseJSONObj(c?.pixel_config);
  // Per-campaign "Fire Event" conversion config (FB/TikTok/Google Adwords). Public,
  // non-secret — drives which events fire on submit/success + the Google Ads conversion
  // id/labels. The Meta/TikTok CAPI secret token stays in pixel_config (above), never here.
  const savedConv = parseJSONObj(c?.conversion_config);

  // Parse the campaign's saved form_fields_config ONCE, up here, so the Advanced → Form
  // toggle can be seeded from it (previously it was hardcoded to 'Default', so after a
  // save the toggle reverted to Default while the custom button labels / field toggles
  // it controlled kept persisting — the exact "toggle balik ke default, settingan masih
  // custom" QA complaint). The persisted JSON carries an explicit `_custom` flag so the
  // toggle round-trips deterministically regardless of whether the labels equal defaults.
  const parseFFC = (raw: any) => {
    let o: any = {};
    if (typeof raw === 'string' && raw.trim()) { try { o = JSON.parse(raw) || {}; } catch { o = {}; } }
    else if (raw && typeof raw === 'object') { o = raw; }
    return o;
  };
  const ffc = parseFFC(c?.form_fields_config);
  const formCustomSaved = ffc._custom === true;

  // ---- advanced sections ----
  const [adv, setAdv] = useState<any>({
    payment: savedPaymentRows.length ? 'Custom' : 'Default',
    // Derived from the saved config's _custom flag (not hardcoded) so the toggle
    // reflects what was persisted on re-edit.
    form: formCustomSaved ? 'Custom' : 'Default',
    fundraising: 'Default',
    wa: c?.wa_notification ? 'Custom' : 'Default',
    followup: c?.followup_enabled ? 'Custom' : 'Default',
    // Unified "Fire Event" panel (FB / TikTok / Google Adwords). Custom when ANY
    // per-campaign tracking is configured on this campaign.
    fireEvent: (c?.meta_pixel_id || c?.tiktok_pixel_id || (c?.conversion_config && c.conversion_config.trim())) ? 'Custom' : 'Default',
    gtm: c?.gtm_id ? 'Custom' : 'Default',
    socialProof: 'Hide',
    urgent: c?.is_urgent ? 'Show' : 'Hide',
    popupInfo: c?.popup_info ? 'Show' : 'Hide',
    waFlying: c?.wa_flying_button ? 'Custom' : 'Default',
    extLink: c?.external_link ? 'Custom' : 'Default',
    general: 'Default',
  });

  // Form custom panel state. Seed from the campaign's saved form_fields_config so
  // button labels + field toggles round-trip on re-edit instead of reverting to
  // the hardcoded defaults below (which was a second cause of "settings revert").
  const [formCustom, setFormCustom] = useState<any>({
    button1: ffc.button1 || 'Tunaikan Fidyah',
    button2: ffc.button2 || 'Tunaikan Fidyah Sekarang',
    smallTitleCampaign: ffc.smallTitleCampaign || '',
    smallTitleDonate: ffc.smallTitleDonate || '',
    anonim: ffc.anonim != null ? !!ffc.anonim : true,
    email: ffc.email != null ? !!ffc.email : false,
    comment: ffc.comment != null ? !!ffc.comment : true,
  });

  // Nominal preset rows
  const parseNominals = (v: any) => {
    let arr = v;
    if (typeof v === 'string' && v.trim()) { try { arr = JSON.parse(v); } catch { arr = []; } }
    if (!Array.isArray(arr)) return [];
    return arr.map((n: any) => (typeof n === 'object' && n !== null)
      ? { amount: +n.amount || 0, label: n.label || '', fav: !!n.fav }
      : { amount: +n || 0, label: '', fav: false });
  };
  const [nominals, setNominals] = useState(parseNominals(c?.opt_nominal));
  const [minDonasi, setMinDonasi] = useState(c?.min_donation || '');
  const [maxDonasi, setMaxDonasi] = useState(c?.max_donation || 0);

  // ---- Custom-form items (Qurban / Package 2 / Zakat Fitrah) + Zakat calculator ----
  // Stored as one JSON envelope in campaign.form_items_config:
  //   {kind:"qurban|package2|zfitrah|zakat_calc", items:[...], calc:{...}}
  const parseItemsConfig = (raw: any) => {
    let o: any = {};
    if (raw && typeof raw === 'object') o = raw;
    else if (typeof raw === 'string' && raw.trim()) { try { o = JSON.parse(raw) || {}; } catch { o = {}; } }
    return {
      kind: o.kind || '',
      items: Array.isArray(o.items) ? o.items : [],
      calc: (o.calc && typeof o.calc === 'object') ? o.calc : {},
    };
  };
  const seededItems = parseItemsConfig(c?.form_items_config);
  const rand4 = () => Math.random().toString(36).slice(2, 6);
  const [formItems, setFormItems] = useState(seededItems.items);
  // Zakat sub-mode: 'fitrah' (item list) | 'calc' (Maal/Pertanian calculator). Seed from the
  // saved kind so an edit reopens on the right zakat builder.
  const [zakatKind, setZakatKind] = useState(seededItems.kind === 'zakat_calc' ? 'calc' : 'fitrah');
  // itemKindOf derives the active item-builder kind from mode/style/zakat-sub-mode. Used
  // both to seed the right builder and to reset items when the kind changes (so qurban
  // rows don't leak into a package2/zfitrah save — they have a different shape).
  const itemKindOf = (mode: any, style: any, zk: any) => /zakat/i.test(mode)
    ? (zk === 'calc' ? 'zakat_calc' : 'zfitrah')
    : (style === 'Qurban' ? 'qurban' : style === 'Package2' ? 'package2' : '');
  const [zakatCalc, setZakatCalc] = useState<any>({
    type: seededItems.calc.type || 'maal',
    rate: seededItems.calc.rate ?? 2.5,
    gold_price_per_gram: seededItems.calc.gold_price_per_gram ?? 0,
    agri_irrigation: seededItems.calc.agri_irrigation || 'tadah-hujan',
    agri_nisab_kg: seededItems.calc.agri_nisab_kg ?? 520,
    agri_price_per_kg: seededItems.calc.agri_price_per_kg ?? 0,
  });

  // Guarded setters: when switching form mode/style/zakat-sub-mode changes the active item
  // KIND, clear formItems so the previous kind's rows (e.g. qurban with animal_type/share)
  // don't leak into a different kind's save. No reset when the kind is unchanged.
  const changeFormMode = (m: any) => {
    if (itemKindOf(m, formStyle, zakatKind) !== itemKindOf(formMode, formStyle, zakatKind)) setFormItems([]);
    setFormMode(m);
  };
  const changeFormStyle = (s: any) => {
    if (itemKindOf(formMode, s, zakatKind) !== itemKindOf(formMode, formStyle, zakatKind)) setFormItems([]);
    setFormStyle(s);
  };
  const changeZakatKind = (zk: any) => {
    if (itemKindOf(formMode, formStyle, zk) !== itemKindOf(formMode, formStyle, zakatKind)) setFormItems([]);
    setZakatKind(zk);
  };

  const [advCustom, setAdvCustom] = useState<any>({
    fundraiserPct: '10', fundraiserEnabled: true,
    waNumber: '', waTemplate: '',
    followupMsg: '', paymentSuccessMsg: '',
    metaPixelId: c?.meta_pixel_id || '', tiktokPixelId: c?.tiktok_pixel_id || '', gtmId: c?.gtm_id || '',
    metaPixelEnabled: true,
    metaCAPIEnabled: !!savedPixel.capi, metaCAPIToken: savedPixel.token || '', metaTestEvent: savedPixel.test_event || '',
    events: (savedPixel.events && typeof savedPixel.events === 'object')
      ? { campaign:'PageView', form:'InitiateCheckout', invoice:'Lead', success:'Purchase', ...savedPixel.events }
      : { campaign:'PageView', form:'InitiateCheckout', invoice:'Lead', success:'Purchase' },
    // ---- Fire Event (per-campaign conversion) ----
    fireTab: 'fb', // fb | tiktok | gads
    // Which funnel events fire on submit/success per platform. Meta defaults mirror the
    // legacy per-page map (form→submit, success→success).
    metaFireEnabled: savedConv.meta ? savedConv.meta.enabled !== false : !!c?.meta_pixel_id,
    metaSubmitEvent: (savedConv.meta && savedConv.meta.events && savedConv.meta.events.submit) || savedPixel.events?.form || 'InitiateCheckout',
    metaSuccessEvent: (savedConv.meta && savedConv.meta.events && savedConv.meta.events.success) || savedPixel.events?.success || 'Purchase',
    tiktokFireEnabled: savedConv.tiktok ? savedConv.tiktok.enabled !== false : !!c?.tiktok_pixel_id,
    tiktokSubmitEvent: (savedConv.tiktok && savedConv.tiktok.events && savedConv.tiktok.events.submit) || 'InitiateCheckout',
    tiktokSuccessEvent: (savedConv.tiktok && savedConv.tiktok.events && savedConv.tiktok.events.success) || 'CompletePayment',
    gadsEnabled: savedConv.gads ? savedConv.gads.enabled !== false : false,
    gadsConversionId: (savedConv.gads && savedConv.gads.conversion_id) || '',
    gadsConversionActionId: (savedConv.gads && savedConv.gads.conversion_action_id) || '',
    gadsSubmitLabel: (savedConv.gads && savedConv.gads.labels && savedConv.gads.labels.submit) || '',
    gadsSuccessLabel: (savedConv.gads && savedConv.gads.labels && savedConv.gads.labels.success) || '',
    waFlyingNumber: '', waFlyingText: 'Chat via WhatsApp',
    extLinkUrl: c?.external_link || '', extLinkText: 'Kunjungi website',
    paymentRows: savedPaymentRows.length ? savedPaymentRows : [{ bank:'', account:'', holder:'', method:'instant' }],
    popupTitle: '', popupDesc: '', popupButton: 'Ya, Lanjutkan',
  });
  const [advOpen, setAdvOpen] = useState(true);

  const back = () => navigate('/campaigns');

  const [saving, setSaving] = useState(false);
  const handleSave = async (publish: any) => {
    if (!title.trim()) { showToast('Judul campaign wajib diisi'); return; }
    if (!content.trim()) { showToast('Keterangan campaign wajib diisi'); return; }
    setSaving(true);
    // Rewrite any absolute dev media origin back to a relative /uploads/ path so the
    // stored HTML is portable (works in prod where everything is same-origin).
    const desc = (content || '').split('http://localhost:8080/uploads/').join('/uploads/');
    const shortDesc = desc.replace(/<[^>]+>/g, '').trim().slice(0, 500) || title;
    // Status: "Save Draft" always unpublishes to Draft. "Update/Publish" honors the
    // status dropdown when editing (so an admin can set Selesai/Ditolak/etc. and it
    // sticks), defaulting a still-Draft campaign to Berjalan on publish. New
    // campaigns publish as Berjalan.
    let finalStatus;
    if (!publish) {
      finalStatus = 'Draft';
    } else if (isEdit) {
      finalStatus = (status && status !== 'Draft') ? status : 'Berjalan';
    } else {
      finalStatus = 'Berjalan';
    }
    const payload: any = {
      title: title.trim(),
      description: desc,
      short_description: shortDesc,
      status: finalStatus,
    };
    // Optional fields — only include if has value
    if (target > 0) payload.target = Number(target);
    // Convert the chosen end date → duration_days (backend's expiry model). Compute days
    // from today so the campaign runs until the selected date. Guard against a past date.
    if (endDate) {
      const days = daysFromToday(endDate);
      if (days > 0) payload.duration_days = days;
    }
    if (location.trim()) payload.location_name = location.trim();
    if (gmaps.trim()) payload.location_gmaps = gmaps.trim();
    // thumb may be a CSS gradient or an uploaded image URL — route to the right field.
    // Reduce any image ref (relative "/uploads/x.png", bare "x.png", or an absolute
    // dev URL "http://localhost:8080/uploads/x.png") down to the bare filename the
    // backend stores. Strip query/hash, take the last path segment.
    if (thumb) {
      if (typeof thumb === 'string' && thumb.startsWith('linear')) {
        payload.thumb_gradient = thumb;
      } else {
        const clean = String(thumb).split(/[?#]/)[0];
        payload.image = clean.substring(clean.lastIndexOf('/') + 1);
      }
    }
    // form_type = donation category (Donation/Zakat); form_style = visual layout
    // (Card/List/…). These were previously swapped, saving the wrong fields.
    if (formMode) payload.form_type = formMode;
    if (formStyle) payload.form_style = formStyle;
    if (minDonasi > 0) payload.min_donation = minDonasi;
    if (maxDonasi > 0) payload.max_donation = maxDonasi;
    if (nominals.length) payload.opt_nominal = JSON.stringify(nominals.map((n: any) => n.amount).filter(Boolean));
    // Resolve the selected category NAME to its UUID (backend expects category_id as UUID).
    // Note: clearing a category back to "Uncategorized" on an existing campaign is not
    // sent (backend treats absent category_id as "leave unchanged").
    if (category && category !== 'Uncategorized') {
      const cat = (useDataStore.getState().categories || []).find((x: any) => x.name === category);
      if (cat && cat.id) {
        payload.category_id = cat.id;
      } else {
        // The selected category was deleted (e.g. by another admin) while the editor
        // was open. Warn instead of silently saving with a stale category.
        showToast('Kategori yang dipilih sudah tidak ada. Pilih ulang kategori.');
        setCategory('Uncategorized');
        setSaving(false);
        return;
      }
    }
    // Advanced options
    payload.wa_notification = adv.wa === 'Custom';
    payload.followup_enabled = adv.followup === 'Custom';
    payload.is_urgent = adv.urgent === 'Show';
    payload.popup_info = adv.popupInfo === 'Show';
    payload.wa_flying_button = adv.waFlying === 'Custom';
    payload.form_fields_config = JSON.stringify({ _custom: adv.form === 'Custom', anonim: formCustom.anonim, email: formCustom.email, comment: formCustom.comment, button1: formCustom.button1, button2: formCustom.button2 });
    if (adv.payment === 'Custom') payload.payment_config = JSON.stringify(advCustom.paymentRows || []);
    // Custom-form items/calculator → form_items_config. kind is derived from the chosen
    // form style / zakat sub-mode so the public renderer knows which picker to show. Always
    // send (even empty) so clearing items on edit persists instead of keeping stale data.
    {
      const itemsKind = itemKindOf(formMode, formStyle, zakatKind);
      if (itemsKind === 'zakat_calc') {
        payload.form_items_config = JSON.stringify({ kind: 'zakat_calc', items: [], calc: zakatCalc });
      } else if (itemsKind) {
        const cleanItems = (formItems || [])
          .filter((it: any) => (it.name || '').trim() || Number(it.price) > 0)
          .map((it: any) => ({ ...it, price: Math.max(0, Math.floor(Number(it.price) || 0)) }));
        payload.form_items_config = JSON.stringify({ kind: itemsKind, items: cleanItems, calc: {} });
      } else {
        payload.form_items_config = ''; // not an item-based form → clear
      }
    }
    // Fire Event (unified FB / TikTok / Google Adwords conversion panel).
    // Custom sends per-campaign pixel IDs + secret CAPI config (pixel_config, admin-only)
    // + the public conversion_config (events to fire + Google Ads id/labels). Default
    // leaves meta_pixel_id empty = inherit the global pixels from Settings → Tracking & Ads.
    if (adv.fireEvent === 'Custom') {
      payload.meta_pixel_id = advCustom.metaPixelId;
      payload.tiktok_pixel_id = advCustom.tiktokPixelId;
      // Secret Meta CAPI config stays in pixel_config (never surfaced publicly). Keep the
      // legacy per-page event map in sync with the new submit/success choices.
      payload.pixel_config = JSON.stringify({
        capi: advCustom.metaCAPIEnabled, token: advCustom.metaCAPIToken, test_event: advCustom.metaTestEvent,
        events: { ...advCustom.events, form: advCustom.metaSubmitEvent, success: advCustom.metaSuccessEvent },
      });
      // Public client-fire config consumed by the donor page (tracking.jsx fireConversion).
      payload.conversion_config = JSON.stringify({
        meta: { enabled: advCustom.metaFireEnabled, events: { submit: advCustom.metaSubmitEvent, success: advCustom.metaSuccessEvent } },
        tiktok: { enabled: advCustom.tiktokFireEnabled, events: { submit: advCustom.tiktokSubmitEvent, success: advCustom.tiktokSuccessEvent } },
        gads: { enabled: advCustom.gadsEnabled, conversion_id: advCustom.gadsConversionId.trim(), conversion_action_id: advCustom.gadsConversionActionId.trim(), labels: { submit: advCustom.gadsSubmitLabel.trim(), success: advCustom.gadsSuccessLabel.trim() } },
      });
    } else {
      // Default → clear ALL per-campaign fire config so the campaign inherits the global
      // pixels. Send "" (not omit) — the backend update fields are tri-state pointers, so
      // an explicit "" clears while omitting would leave stale per-campaign config behind.
      payload.meta_pixel_id = '';
      payload.tiktok_pixel_id = '';
      payload.pixel_config = '';
      payload.conversion_config = '';
    }
    if (advCustom.gtmId) payload.gtm_id = advCustom.gtmId;
    if (advCustom.extLinkUrl) payload.external_link = advCustom.extLinkUrl;
    // Persist the campaign URL slug on edit. Send it whenever it has a valid value
    // and differs from what's already stored (c.slug) — the backend keeps it instead
    // of re-deriving from the title. Only editable when editing an existing campaign;
    // on create the backend derives the slug from the title.
    if (isEdit && longSlug && longSlug.length >= 3 && longSlug !== c?.slug) payload.slug = longSlug;

    try {
      if (isEdit) {
        await api.updateCampaign(c.id, payload);
        showToast('Campaign berhasil diupdate');
      } else {
        await api.createCampaign(payload);
        showToast('Campaign berhasil di' + (publish ? 'publish' : 'simpan'));
      }
      // Await the refresh so the campaign list reflects the change before we
      // navigate back (previously fire-and-forget → list looked stale until reload).
      try { await useDataStore.getState().refreshPublic(); } catch {}
      try { await useDataStore.getState().refreshAdmin(); } catch {}
      setTimeout(back, 300);
    } catch (e: any) {
      showToast('Gagal: ' + (e?.message || 'Periksa isian'));
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">{isEdit ? 'Edit Campaign' : 'Add New Campaign'}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <button onClick={back} className="text-mute hover:text-ink font-medium">Data Campaign</button>
            <Icon name="chevronR" size={12} className="text-mute"/>
            <span className="text-brand-600 font-semibold">{isEdit ? 'Edit Campaign' : 'Add New'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="outline" tone="ink" icon="chevronL" onClick={back}>Kembali</Btn>
          {isEdit && <Btn variant="outline" tone="ink" icon="eye">View Public</Btn>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ============ LEFT: Campaign card + Advanced Option ============ */}
        <div className="lg:col-span-2 space-y-5">
          {/* Campaign basic */}
          <Card className="p-5 lg:p-6">
            <div className="font-bold text-ink text-lg mb-5">Campaign</div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-5">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-ink">Title / Judul <span className="text-rose-600">*</span></label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="field mt-1.5" placeholder="Cth: Lunasi Hutang Puasamu, Bayar Fidyahmu!"/>
                </div>
              </div>

              {/* Thumbnail uploader */}
              <ThumbUploader thumb={thumb} icon={c?.icon} onChange={setThumb}/>
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-ink">Information / Keterangan <span className="text-rose-600">*</span></label>
              <RichEditor value={content} onChange={setContent}/>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-ink">Target donasi</label>
                <div className="mt-1.5 flex items-center rounded-lg border border-line bg-white focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
                  <span className="pl-3 text-brand-600 font-bold">Rp</span>
                  <input type="number" value={target} onChange={(e) => setTarget(+e.target.value)} className="flex-1 px-2 py-2.5 outline-none font-bold text-ink text-right" placeholder="1.000.000"/>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Tanggal berakhir donasi</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="field mt-1.5"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Location / Lokasi</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="field mt-1.5" placeholder="Contoh: Bandung, Jawa Barat"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Link Gmaps</label>
                <input value={gmaps} onChange={(e) => setGmaps(e.target.value)} className="field mt-1.5" placeholder="https://maps.google.com/…"/>
              </div>
            </div>

            <div className="mt-4 text-xs text-mute">
              <b className="text-ink">Note:</b> <span className="text-rose-600">*</span> Wajib diisi
            </div>
          </Card>

          {/* Advanced option */}
          <Card className="p-5 lg:p-6">
            <button onClick={() => setAdvOpen(!advOpen)} className="w-full flex items-center justify-between">
              <div className="font-bold text-ink text-lg">Advanced Option</div>
              <Icon name="chevronD" size={18} className={`text-mute transition-transform ${advOpen ? 'rotate-180' : ''}`}/>
            </button>

            {advOpen && (
              <div className="mt-5 space-y-6">
                <div>
                  <AdvRadio label="Payment" value={adv.payment} options={['Default','Custom']} onChange={(v: any) => setAdv({...adv, payment:v})}/>
                  {adv.payment === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-3">
                      <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_120px_auto] gap-2 text-[11px] font-bold text-mute uppercase px-0.5">
                        <div>Nama Bank</div><div>No. Rekening</div><div>Atas Nama</div><div>Method</div><div/>
                      </div>
                      {payMethods.length === 0 && (
                        <div className="text-[11px] text-amber-600 bg-amber-50 rounded-md px-2 py-1">
                          Belum ada metode pembayaran. Tambahkan dulu di Setting → Payment.
                        </div>
                      )}
                      {(advCustom.paymentRows || []).map((row: any, i: any) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_120px_auto] gap-2 items-center">
                          {/* Bank name is chosen from the methods configured in Setting → Payment.
                              Selecting one auto-fills the account number, holder, and method. */}
                          <select value={row.bank}
                            onChange={(e) => {
                              const name = e.target.value;
                              const m = payMethods.find((x: any) => (x.bank_name || x.name || x.bank_type) === name);
                              const arr = advCustom.paymentRows.map((r: any, j: any) => j === i ? {
                                ...r,
                                bank: name,
                                account: m ? (m.bank_number || m.account || r.account) : r.account,
                                holder: m ? (m.account_name || r.holder) : r.holder,
                                method: m ? (m.type || r.method) : r.method,
                              } : r);
                              setAdvCustom({...advCustom, paymentRows: arr});
                            }}
                            className="field bg-white">
                            <option value="">Pilih bank…</option>
                            {payMethods.map((m: any, k: any) => {
                              const nm = m.bank_name || m.name || m.bank_type || '';
                              return <option key={m.id || k} value={nm}>{nm}</option>;
                            })}
                          </select>
                          <input value={row.account} onChange={(e) => { const arr = advCustom.paymentRows.map((r: any, j: any) => j === i ? { ...r, account: e.target.value } : r); setAdvCustom({...advCustom, paymentRows: arr}); }} className="field bg-white font-mono" placeholder="No. Rekening"/>
                          <input value={row.holder} onChange={(e) => { const arr = advCustom.paymentRows.map((r: any, j: any) => j === i ? { ...r, holder: e.target.value } : r); setAdvCustom({...advCustom, paymentRows: arr}); }} className="field bg-white" placeholder="Atas Nama"/>
                          <select value={row.method} onChange={(e) => { const arr = advCustom.paymentRows.map((r: any, j: any) => j === i ? { ...r, method: e.target.value } : r); setAdvCustom({...advCustom, paymentRows: arr}); }} className="field bg-white">
                            <option value="instant">Instant</option>
                            <option value="va">VA</option>
                            <option value="tf">Transfer</option>
                          </select>
                          <button onClick={() => setAdvCustom({...advCustom, paymentRows: advCustom.paymentRows.filter((_: any, j: any) => j !== i)})} className="h-9 w-9 rounded-md text-mute hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center"><Icon name="trash" size={14}/></button>
                        </div>
                      ))}
                      <button onClick={() => setAdvCustom({...advCustom, paymentRows: [...(advCustom.paymentRows || []), { bank:'', account:'', holder:'', method:'instant' }]})} className="mt-1 px-3 py-2 rounded-lg border border-dashed border-line bg-white text-sm font-bold text-brand-600 hover:bg-brand-50">+ Add Payment</button>
                    </div>
                  )}
                </div>

                <div>
                  <AdvRadio label="Form" value={adv.form} options={['Default','Custom']} onChange={(v: any) => setAdv({...adv, form:v})}/>

                  {adv.form === 'Custom' && (
                    <div className="mt-4 p-4 lg:p-5 rounded-xl bg-bg2 border border-line space-y-5">
                      <div>
                        <div className="font-bold text-ink mb-3">Page Campaign</div>
                        <div>
                          <label className="text-xs font-semibold text-mute">Button 1</label>
                          <input value={formCustom.button1} onChange={(e) => setFormCustom({...formCustom, button1:e.target.value})} className="field mt-1 bg-white"/>
                        </div>
                      </div>

                      <div className="pt-5 border-t border-line">
                        <div className="font-bold text-ink mb-3">Page Form</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div><label className="text-xs font-semibold text-mute">Button Konfirmasi</label><input value={formCustom.button2} onChange={(e) => setFormCustom({...formCustom, button2:e.target.value})} className="field mt-1 bg-white"/></div>
                          <div><label className="text-xs font-semibold text-mute">Small Title Campaign</label><input value={formCustom.smallTitleCampaign} onChange={(e) => setFormCustom({...formCustom, smallTitleCampaign:e.target.value})} className="field mt-1 bg-white"/></div>
                          <div><label className="text-xs font-semibold text-mute">Small Title Donate</label><input value={formCustom.smallTitleDonate} onChange={(e) => setFormCustom({...formCustom, smallTitleDonate:e.target.value})} className="field mt-1 bg-white"/></div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <FieldToggle label="Anonim" value={formCustom.anonim} onChange={(v: any) => setFormCustom({...formCustom, anonim:v})}/>
                          <FieldToggle label="Email"  value={formCustom.email}  onChange={(v: any) => setFormCustom({...formCustom, email:v})}/>
                          <FieldToggle label="Comment" value={formCustom.comment} onChange={(v: any) => setFormCustom({...formCustom, comment:v})}/>
                        </div>
                      </div>

                      {formStyle === 'Qurban' && formMode !== 'Zakat' && (
                        <div className="pt-5 border-t border-line">
                          <div className="font-bold text-ink">Qurban</div>
                          <div className="text-xs text-mute mt-1">Tambahkan hewan qurban. Donatur memilih kartu hewan, harga jadi nominal donasi.</div>
                          <ItemBuilder kind="qurban" items={formItems} setItems={setFormItems} rand4={rand4}/>
                        </div>
                      )}

                      {formStyle === 'Package2' && formMode !== 'Zakat' && (
                        <div className="pt-5 border-t border-line">
                          <div className="font-bold text-ink">Package 2</div>
                          <div className="text-xs text-mute mt-1">Tambahkan paket donasi (gambar, nama, harga, deskripsi).</div>
                          <ItemBuilder kind="package2" items={formItems} setItems={setFormItems} rand4={rand4}/>
                        </div>
                      )}

                      {formMode === 'Zakat' && (
                        <div className="pt-5 border-t border-line">
                          <div className="font-bold text-ink mb-2">Zakat</div>
                          <div className="inline-flex p-1 bg-white rounded-lg border border-line mb-3">
                            {[{v:'fitrah',l:'Zakat Fitrah (paket)'},{v:'calc',l:'Maal / Pertanian (kalkulator)'}].map((o: any) => (
                              <button key={o.v} onClick={() => changeZakatKind(o.v)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${zakatKind===o.v ? 'bg-brand-600 text-white shadow-sm' : 'text-mute hover:text-ink'}`}>{o.l}</button>
                            ))}
                          </div>
                          {zakatKind === 'fitrah' ? (
                            <>
                              <div className="text-xs text-mute mb-1">Tambahkan paket zakat fitrah (jenis beras, harga/jiwa).</div>
                              <ItemBuilder kind="zfitrah" items={formItems} setItems={setFormItems} rand4={rand4}/>
                            </>
                          ) : (
                            <ZakatCalcBuilder calc={zakatCalc} setCalc={setZakatCalc}/>
                          )}
                        </div>
                      )}

                      <div className="pt-5 border-t border-line">
                        <div className="font-bold text-ink mb-3">Pilihan Nominal Donasi</div>
                        <div className="space-y-2">
                          {nominals.map((n: any, i: any) => (
                            <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-center">
                              <input type="number" value={n.amount} onChange={(e) => { const arr = [...nominals]; arr[i].amount = +e.target.value; setNominals(arr); }} className="field bg-white"/>
                              <input value={n.label} onChange={(e) => { const arr = [...nominals]; arr[i].label = e.target.value; setNominals(arr); }} className="field bg-white"/>
                              <label className="inline-flex items-center gap-2 text-xs font-semibold text-ink whitespace-nowrap pl-2">
                                <input type="radio" checked={n.fav} onChange={() => setNominals(nominals.map((x: any, j: any) => ({ ...x, fav: i === j })))} className="accent-emerald-600 h-4 w-4"/>
                                Sering di Pilih
                              </label>
                              <button onClick={() => setNominals(nominals.filter((_: any, j: any) => j !== i))} className="h-9 w-9 rounded-md text-mute hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center">
                                <Icon name="trash" size={14}/>
                              </button>
                            </div>
                          ))}
                          <button onClick={() => setNominals([...nominals, { amount:0, label:'', fav:false }])} className="mt-2 px-3 py-2 rounded-lg border border-dashed border-line bg-white text-sm font-bold text-brand-600 hover:bg-brand-50">+ Tambah Nominal</button>
                        </div>
                      </div>

                      <div className="pt-5 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="font-bold text-ink mb-1">Minimum Donasi</div>
                          <input type="number" value={minDonasi} onChange={(e) => setMinDonasi(+e.target.value)} className="field bg-white"/>
                          <div className="text-[11px] text-mute mt-1">Minimum Donasi yang diperbolehkan ketika donatur mengetik donasi pada form.</div>
                        </div>
                        <div>
                          <div className="font-bold text-ink mb-1">Maximum Donasi</div>
                          <input type="number" value={maxDonasi} onChange={(e) => setMaxDonasi(+e.target.value)} className="field bg-white"/>
                          <div className="text-[11px] text-mute mt-1">Maximum Donasi yang diperbolehkan ketika donatur mengetik donasi pada form. (0 = tanpa batas)</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <AdvRadio label="Fundraising" value={adv.fundraising} options={['Default','Custom']} onChange={(v: any) => setAdv({...adv, fundraising:v})}/>
                  {adv.fundraising === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-3">
                      <div><label className="text-xs font-semibold text-mute">Komisi fundraiser (%)</label><input type="number" value={advCustom.fundraiserPct} onChange={(e) => setAdvCustom({...advCustom, fundraiserPct: e.target.value})} className="field mt-1 bg-white" placeholder="10"/></div>
                      <FieldToggle label="Aktifkan fundraiser untuk campaign ini" value={advCustom.fundraiserEnabled} onChange={(v: any) => setAdvCustom({...advCustom, fundraiserEnabled:v})}/>
                    </div>
                  )}
                </div>

                <div>
                  <AdvRadio label="Whatsapp Notification" value={adv.wa} options={['Default','Custom']} onChange={(v: any) => setAdv({...adv, wa:v})}/>
                  {adv.wa === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-3">
                      <div className="text-xs text-mute mb-2">Notifikasi WhatsApp otomatis dikirim sesuai pengaturan admin. Isi field di bawah hanya untuk override khusus campaign ini.</div>
                      <div><label className="text-xs font-semibold text-mute">No. WhatsApp CS</label><input value={advCustom.waNumber} onChange={(e) => setAdvCustom({...advCustom, waNumber: e.target.value})} className="field mt-1 bg-white" placeholder="6281234567890"/></div>
                      <div><label className="text-xs font-semibold text-mute">Template pesan</label><textarea value={advCustom.waTemplate} onChange={(e) => setAdvCustom({...advCustom, waTemplate: e.target.value})} className="field mt-1 bg-white" rows={2} placeholder="Halo, saya ingin berdonasi untuk {{campaign}}"/></div>
                    </div>
                  )}
                </div>

                <div>
                  <AdvRadio label="Multiple Follow-Up & Payment Success Message (Format)" sub="( Trigger by Button Follow-up & Payment Status Button )" value={adv.followup} options={['Default','Custom']} onChange={(v: any) => setAdv({...adv, followup:v})}/>
                  {adv.followup === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-3">
                      <div><label className="text-xs font-semibold text-mute">Pesan follow-up (WA)</label><textarea value={advCustom.followupMsg} onChange={(e) => setAdvCustom({...advCustom, followupMsg: e.target.value})} className="field mt-1 bg-white" rows={3} placeholder="Assalamualaikum {{nama}}, terima kasih atas donasi Anda..."/></div>
                      <div><label className="text-xs font-semibold text-mute">Pesan payment sukses</label><textarea value={advCustom.paymentSuccessMsg} onChange={(e) => setAdvCustom({...advCustom, paymentSuccessMsg: e.target.value})} className="field mt-1 bg-white" rows={3} placeholder="Alhamdulillah, donasi Anda sebesar {{nominal}} telah diterima..."/></div>
                    </div>
                  )}
                </div>

                {/* Fire Event — unified per-campaign conversion tracking (FB / TikTok /
                    Google Adwords), mirrors Berdu. Default = inherit global pixels from
                    Settings → Tracking & Ads. Custom = configure this campaign's own pixels
                    + which events fire on form submit and payment success. */}
                <div>
                  <AdvRadio label="Fire Event (Conversion Tracking)" sub="( FB Pixel · TikTok · Google Adwords — per campaign )" value={adv.fireEvent} options={['Default','Custom']} onChange={(v: any) => setAdv({...adv, fireEvent:v})}/>
                  {adv.fireEvent === 'Default' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line">
                      <div className="flex items-start gap-2 text-[12px] text-mute">
                        <Icon name="pixel" size={15} className="text-brand-600 shrink-0 mt-0.5"/>
                        <span>Mengikuti pixel global dari <b className="text-ink">Settings &rarr; Tracking &amp; Ads</b>. Tidak ada event konversi khusus untuk campaign ini.</span>
                      </div>
                    </div>
                  )}
                  {adv.fireEvent === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-4">
                      <div className="text-[11px] text-mute">Pixel global dimatikan untuk campaign ini. Konversi <b>Submit</b> kirim saat form dikirim; <b>Success</b> saat pembayaran lunas. Pixel Value = nominal donasi (otomatis).</div>
                      {/* Tab strip: FB Pixel · TikTok · Google Adwords */}
                      <div className="inline-flex p-1 bg-white rounded-lg border border-line">
                        {[['fb','FB Pixel'],['tiktok','TikTok'],['gads','Google Adwords']].map(([k,label]: any) => (
                          <button key={k} type="button" onClick={() => setAdvCustom({...advCustom, fireTab:k})}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${advCustom.fireTab === k ? 'bg-brand-600 text-white shadow-sm' : 'text-mute hover:text-ink'}`}>
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* ---- FB Pixel tab ---- */}
                      {advCustom.fireTab === 'fb' && (
                        <div className="space-y-3">
                          <FieldToggle label="Aktifkan FB Pixel untuk campaign ini" value={advCustom.metaFireEnabled} onChange={(v: any) => setAdvCustom({...advCustom, metaFireEnabled:v})}/>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FieldToggle label="Meta Pixel & Conversion API" value={advCustom.metaCAPIEnabled ?? false} onChange={(v: any) => setAdvCustom({...advCustom, metaCAPIEnabled:v})}/>
                          </div>
                          <div className={`grid grid-cols-1 ${advCustom.metaCAPIEnabled ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2`}>
                            <div><label className="text-xs font-semibold text-mute">Pixel ID</label><input value={advCustom.metaPixelId} onChange={(e) => setAdvCustom({...advCustom, metaPixelId:e.target.value})} className="field mt-1 bg-white font-mono" placeholder="123456789012345"/></div>
                            {advCustom.metaCAPIEnabled && (
                              <div><label className="text-xs font-semibold text-mute">Secret Token (CAPI)</label><input value={advCustom.metaCAPIToken||''} onChange={(e) => setAdvCustom({...advCustom, metaCAPIToken:e.target.value})} className="field mt-1 bg-white font-mono" placeholder="EAAxxxxx"/></div>
                            )}
                            <div><label className="text-xs font-semibold text-mute">Test Event Code</label><input value={advCustom.metaTestEvent||''} onChange={(e) => setAdvCustom({...advCustom, metaTestEvent:e.target.value})} className="field mt-1 bg-white font-mono" placeholder="TEST12345"/></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-mute">Event Submit (form)</label>
                              <select value={advCustom.metaSubmitEvent} onChange={(e) => setAdvCustom({...advCustom, metaSubmitEvent:e.target.value})} className="field mt-1 bg-white">
                                {EVENT_OPTS.map((o: any) => <option key={o} value={o}>{o||'Pilih Event'}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-mute">Event Success (paid)</label>
                              <select value={advCustom.metaSuccessEvent} onChange={(e) => setAdvCustom({...advCustom, metaSuccessEvent:e.target.value})} className="field mt-1 bg-white">
                                {EVENT_OPTS.map((o: any) => <option key={o} value={o}>{o||'Pilih Event'}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ---- TikTok tab ---- */}
                      {advCustom.fireTab === 'tiktok' && (
                        <div className="space-y-3">
                          <FieldToggle label="Aktifkan TikTok Pixel untuk campaign ini" value={advCustom.tiktokFireEnabled} onChange={(v: any) => setAdvCustom({...advCustom, tiktokFireEnabled:v})}/>
                          <div><label className="text-xs font-semibold text-mute">TikTok Pixel ID</label>
                            <input value={advCustom.tiktokPixelId} onChange={(e) => setAdvCustom({...advCustom, tiktokPixelId: e.target.value})} className="field mt-1 bg-white font-mono" placeholder="CIK29JLM3"/>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-mute">Event Submit (form)</label>
                              <select value={advCustom.tiktokSubmitEvent} onChange={(e) => setAdvCustom({...advCustom, tiktokSubmitEvent:e.target.value})} className="field mt-1 bg-white">
                                {EVENT_OPTS.map((o: any) => <option key={o} value={o}>{o||'Pilih Event'}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-mute">Event Success (paid)</label>
                              <select value={advCustom.tiktokSuccessEvent} onChange={(e) => setAdvCustom({...advCustom, tiktokSuccessEvent:e.target.value})} className="field mt-1 bg-white">
                                {EVENT_OPTS.map((o: any) => <option key={o} value={o}>{o||'Pilih Event'}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ---- Google Adwords tab (mirrors berdu-googleads.jpeg) ---- */}
                      {advCustom.fireTab === 'gads' && (
                        <div className="space-y-3">
                          <FieldToggle label="Aktifkan Google Ads Conversion untuk campaign ini" value={advCustom.gadsEnabled} onChange={(v: any) => setAdvCustom({...advCustom, gadsEnabled:v})}/>
                          <div><label className="text-xs font-semibold text-mute">Conversion ID</label>
                            <input value={advCustom.gadsConversionId} onChange={(e) => setAdvCustom({...advCustom, gadsConversionId: e.target.value})} className="field mt-1 bg-white font-mono" placeholder="AW-829360860"/>
                            <div className="text-[11px] text-mute mt-1">Format: AW-XXXXXXXXX (dari Google Ads → Tools → Conversions).</div>
                          </div>
                          <div><label className="text-xs font-semibold text-mute">Conversion Action ID Override</label><input inputMode="numeric" pattern="[0-9]*" value={advCustom.gadsConversionActionId} onChange={(e) => setAdvCustom({...advCustom, gadsConversionActionId: e.target.value.replace(/\D/g, '')})} className="field mt-1 bg-white font-mono" placeholder="Kosong = gunakan default global"/></div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div><label className="text-xs font-semibold text-mute">Conversion Label — Submit</label>
                              <input value={advCustom.gadsSubmitLabel} onChange={(e) => setAdvCustom({...advCustom, gadsSubmitLabel: e.target.value})} className="field mt-1 bg-white font-mono" placeholder="(opsional)"/>
                            </div>
                            <div><label className="text-xs font-semibold text-mute">Conversion Label — Success</label>
                              <input value={advCustom.gadsSuccessLabel} onChange={(e) => setAdvCustom({...advCustom, gadsSuccessLabel: e.target.value})} className="field mt-1 bg-white font-mono" placeholder="43r8CKC17HsQ3JW8iwM"/>
                            </div>
                          </div>
                          <div className="rounded-lg bg-white border border-line p-3 flex items-center justify-between">
                            <div className="text-xs font-semibold text-mute">Pixel Value</div>
                            <div className="text-xs text-ink"><b>Rp</b> nominal donasi <span className="text-mute">(otomatis)</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <AdvRadio label="Google Tag Manager" value={adv.gtm} options={['Default','Custom']} onChange={(v: any) => setAdv({...adv, gtm:v})}/>
                  {adv.gtm === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line">
                      <label className="text-xs font-semibold text-mute">GTM Container ID</label>
                      <input value={advCustom.gtmId} onChange={(e) => setAdvCustom({...advCustom, gtmId: e.target.value})} className="field mt-1 bg-white font-mono" placeholder="GTM-XXXXXXX"/>
                    </div>
                  )}
                </div>

                <AdvRadio label="Tandai Urgent (badge URGENT di publik)"  value={adv.urgent}       options={['Hide','Show']}      onChange={(v: any) => setAdv({...adv, urgent:v})}/>
                <AdvRadio label="Social Proof"                         value={adv.socialProof}  options={['Hide','Show']}      onChange={(v: any) => setAdv({...adv, socialProof:v})}/>
                <AdvRadio label="Popup Info (Form)"                    value={adv.popupInfo}    options={['Hide','Show']}      onChange={(v: any) => setAdv({...adv, popupInfo:v})}/>
                {adv.popupInfo === 'Show' && (
                  <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-3">
                    <div><label className="text-xs font-semibold text-mute">Judul popup</label>
                      <input value={advCustom.popupTitle || ''} onChange={(e) => setAdvCustom({...advCustom, popupTitle:e.target.value})} className="field mt-1 bg-white" placeholder="Konfirmasi Donasi"/>
                    </div>
                    <div><label className="text-xs font-semibold text-mute">Deskripsi</label>
                      <textarea value={advCustom.popupDesc || ''} onChange={(e) => setAdvCustom({...advCustom, popupDesc:e.target.value})} className="field mt-1 bg-white" rows={2} placeholder="Anda akan berdonasi untuk campaign ini..."/>
                    </div>
                    <div><label className="text-xs font-semibold text-mute">Teks tombol</label>
                      <input value={advCustom.popupButton || 'Ya, Lanjutkan'} onChange={(e) => setAdvCustom({...advCustom, popupButton:e.target.value})} className="field mt-1 bg-white" placeholder="Ya, Lanjutkan"/>
                    </div>
                  </div>
                )}

                <div>
                  <AdvRadio label="Whatsapp Flying Button" value={adv.waFlying} options={['Default','Custom']} onChange={(v: any) => setAdv({...adv, waFlying:v})}/>
                  {adv.waFlying === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-3">
                      <div><label className="text-xs font-semibold text-mute">No. WhatsApp</label><input value={advCustom.waFlyingNumber} onChange={(e) => setAdvCustom({...advCustom, waFlyingNumber: e.target.value})} className="field mt-1 bg-white" placeholder="6281234567890"/></div>
                      <div><label className="text-xs font-semibold text-mute">Teks tombol</label><input value={advCustom.waFlyingText} onChange={(e) => setAdvCustom({...advCustom, waFlyingText: e.target.value})} className="field mt-1 bg-white" placeholder="Chat via WhatsApp"/></div>
                    </div>
                  )}
                </div>

                <div>
                  <AdvRadio label="External Link Button" value={adv.extLink} options={['Default','Custom']} onChange={(v: any) => setAdv({...adv, extLink:v})}/>
                  {adv.extLink === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-3">
                      <div><label className="text-xs font-semibold text-mute">URL tujuan</label><input value={advCustom.extLinkUrl} onChange={(e) => setAdvCustom({...advCustom, extLinkUrl: e.target.value})} className="field mt-1 bg-white" placeholder="https://..."/></div>
                      <div><label className="text-xs font-semibold text-mute">Teks tombol</label><input value={advCustom.extLinkText} onChange={(e) => setAdvCustom({...advCustom, extLinkText: e.target.value})} className="field mt-1 bg-white" placeholder="Kunjungi website"/></div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </Card>
        </div>

        {/* ============ RIGHT: Form Type + Publish (+ CS Rotator if edit) ============ */}
        <div className="lg:col-span-1 space-y-5">
          {/* Form Type */}
          <Card className="p-5">
            <div className="font-bold text-ink text-lg mb-4">Form Type</div>

            <div className="inline-flex p-1 bg-bg2 rounded-lg border border-line w-full">
              {['Donation','Zakat'].map((m) => (
                <button key={m} onClick={() => changeFormMode(m)}
                  className={`flex-1 px-3 py-2 text-sm font-bold rounded-md transition-all ${formMode === m ? 'bg-brand-600 text-white shadow-sm' : 'text-mute hover:text-ink'}`}>
                  {m}
                </button>
              ))}
            </div>

            {/* Mode-aware type list (mirrors DonasiAja's section_donation vs section_zakat).
                Donation → layout styles (Card first = default). Zakat → Maal/Fitrah, which
                map to the zakat sub-mode (Maal→calculator, Fitrah→item list). */}
            {formMode === 'Donation' ? (
              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5">
                {['Card','List','Typing','Package','Package2','Qurban'].map((s) => (
                  <label key={s} className="inline-flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" checked={formStyle === s} onChange={() => changeFormStyle(s)} className="accent-emerald-600 h-4 w-4"/>
                    <span className={formStyle === s ? 'font-bold text-ink' : 'text-ink/85'}>{s === 'Package2' ? 'Package 2' : s}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-y-2.5">
                {[{v:'fitrah',l:'Zakat Fitrah (paket)'},{v:'calc',l:'Zakat Maal / Pertanian (kalkulator)'}].map((o: any) => (
                  <label key={o.v} className="inline-flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" checked={zakatKind === o.v} onChange={() => changeZakatKind(o.v)} className="accent-emerald-600 h-4 w-4"/>
                    <span className={zakatKind === o.v ? 'font-bold text-ink' : 'text-ink/85'}>{o.l}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Preview — reflects the active mode (Zakat shows a calc/list skeleton). */}
            <FormTypePreview style={formStyle} mode={formMode} zakatKind={zakatKind}/>

            {/* Contextual hint: which Advanced > Form > Custom builder to fill. */}
            {formMode === 'Zakat' && zakatKind === 'fitrah' && (
              <div className="mt-4 pt-4 border-t border-line">
                <div className="font-bold text-ink">Note :</div>
                <p className="text-sm text-ink/80 mt-1 leading-relaxed">
                  Setelah memilih Zakat Fitrah, tambahkan paket zakat fitrah Anda di:
                  <span className="font-bold text-brand-600 mt-1 inline-block">Advanced Option &gt; Form &gt; Custom &gt; Zakat.</span>
                </p>
              </div>
            )}
            {formMode === 'Donation' && (formStyle === 'Qurban' || formStyle === 'Package2') && (
              <div className="mt-4 pt-4 border-t border-line">
                <div className="font-bold text-ink">Note :</div>
                <p className="text-sm text-ink/80 mt-1 leading-relaxed">
                  Setelah memilih {formStyle === 'Qurban' ? 'Qurban' : 'Package 2'}, tambahkan {formStyle === 'Qurban' ? 'hewan qurban' : 'paket'} Anda di:
                  <span className="font-bold text-brand-600 mt-1 inline-block">Advanced Option &gt; Form &gt; Custom &gt; {formStyle === 'Qurban' ? 'Qurban' : 'Package 2'}.</span>
                </p>
              </div>
            )}
          </Card>

          {/* Publish */}
          <Card className="p-5">
            <div className="font-bold text-ink text-lg mb-4">Publish</div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                <div className="text-mute">Category</div>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="field py-2">
                  <option value="Uncategorized">Uncategorized</option>
                  {/* Categories from the API (store.categories) so the editor matches
                      the same list used by the campaign list/filter and public pages. */}
                  {(useDataStore((s) => s.categories) || []).map((cat: any) => (
                    <option key={cat.id || cat.slug || cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                <div className="text-mute">Status</div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={status}/>
                  {/* Editable status — admin can move a campaign to Berjalan / Selesai /
                      Ditolak etc. and it persists (was a dead button before). The Save
                      buttons still override: "Save Draft" → Draft, "Update" honors this. */}
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="field py-1.5 text-xs flex-1">
                    <option value="Draft">Draft</option>
                    <option value="Berjalan">Berjalan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditolak">Ditolak</option>
                    <option value="Menunggu">Menunggu</option>
                  </select>
                </div>
              </div>

              {isEdit && (
                <>
                  <EditableUrlRow
                    label="Long URL"
                    prefix={publicBaseUrl + '/c/'}
                    value={longSlug}
                    onChange={(v: any) => { setLongSlug(v); setLongTouched(true); }}
                    onCopy={() => showToast('Long URL disalin')}
                    sanitize={(v: any) => v.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-+|-+$/g,'')}
                    helper="Hanya huruf kecil, angka, dan tanda strip (-)."
                    minLen={3}
                  />
                  <EditableUrlRow
                    label="Short URL"
                    prefix={publicBaseUrl + '/c/'}
                    value={shortSlug}
                    onCopy={() => showToast('Short URL disalin')}
                    helper="Tautan permanen berbasis ID campaign. Salin untuk iklan & QR code."
                    minLen={4}
                    short
                    readOnly
                  />
                </>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => handleSave(false)} disabled={saving} className="px-3 py-2.5 rounded-lg border-2 border-brand-600 text-brand-600 font-bold text-sm hover:bg-brand-50 disabled:opacity-50">
                {saving ? 'Menyimpan…' : isEdit ? 'Save Draft' : 'Save to Draft'}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving} className="px-3 py-2.5 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 shadow-sm disabled:opacity-50">
                {saving ? 'Menyimpan…' : isEdit ? 'Update' : 'Publish'}
              </button>
            </div>
          </Card>

          {/* CS Rotator — only in edit mode */}
          {isEdit && (
            <Card className="p-5">
              <div className="font-bold text-ink text-lg mb-3">CS Rotator</div>
              <div className="space-y-2">
                {['Putri Maharani', 'Bagus Santoso'].map((n, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-line">
                    <div className="h-8 w-8 rounded-full bg-sky2-50 text-sky2-600 flex items-center justify-center font-bold text-xs">{n.split(' ').map((s:any)=>s[0]).join('')}</div>
                    <div className="flex-1 text-sm font-semibold text-ink">{n}</div>
                    <Badge tone="ok" size="sm" dot>aktif</Badge>
                    <button className="h-7 w-7 rounded-md text-mute hover:text-rose-600 hover:bg-rose-50"><Icon name="close" size={13}/></button>
                  </div>
                ))}
              </div>
              <button className="mt-3 w-full px-3 py-2 rounded-lg border border-dashed border-line bg-white text-sm font-bold text-brand-600 hover:bg-brand-50">+ Add CS</button>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom sticky action bar on mobile */}
      <div className="lg:hidden sticky bottom-0 -mx-4 px-4 py-3 bg-white border-t border-line flex gap-2">
        <button onClick={() => handleSave(false)} disabled={saving} className="flex-1 px-3 py-2.5 rounded-lg border-2 border-brand-600 text-brand-600 font-bold text-sm disabled:opacity-50">{saving ? '…' : 'Save Draft'}</button>
        <button onClick={() => handleSave(true)} disabled={saving} className="flex-1 px-3 py-2.5 rounded-lg bg-brand-600 text-white font-bold text-sm disabled:opacity-50">{saving ? '…' : 'Publish'}</button>
      </div>
    </div>
  );
}

// ============================================================
// Subcomponents
// ============================================================
function EditableUrlRow({ label, prefix, value, onChange, onCopy, sanitize, helper, minLen = 3, maxLen, short, readOnly }: any) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<any>(null);

  useEffect(() => { if (editing) { setDraft(value); setTimeout(() => inputRef.current?.focus(), 0); } }, [editing]);
  // Keep the draft in sync if the parent value changes while not editing (e.g. the
  // saved slug loads in after the full record is fetched).
  useEffect(() => { if (!editing) setDraft(value); }, [value]);

  const save = () => {
    const clean = sanitize ? sanitize(draft.trim()) : draft.trim();
    if (clean.length < minLen) return;
    onChange(clean);
    setEditing(false);
  };
  const cancel = () => { setDraft(value); setEditing(false); };
  const cleaned = sanitize ? sanitize(draft) : draft;
  const tooShort = cleaned.length < minLen;
  const tooLong  = maxLen && cleaned.length > maxLen;

  return (
    <div className="grid grid-cols-[80px_1fr] items-start gap-3 pt-2 border-t border-line">
      <div className="text-mute pt-0.5">{label}</div>
      <div>
        {!editing ? (
          <div className="flex items-start gap-1">
            <div className="text-xs font-mono text-ink leading-snug break-all flex-1 group">
              <span className="text-mute">{prefix}</span>
              <span className="bg-brand-50 text-brand-700 px-1 rounded font-bold">{value}</span>
            </div>
            {!readOnly && (
              <button
                onClick={() => setEditing(true)}
                aria-label={`Edit ${label}`}
                className="shrink-0 h-7 w-7 rounded-md hover:bg-brand-50 text-mute hover:text-brand-600 flex items-center justify-center transition-colors">
                <Icon name="edit" size={13}/>
              </button>
            )}
            <button
              onClick={() => { try { navigator.clipboard?.writeText(prefix + value); } catch {} if (onCopy) onCopy(); }}
              aria-label={`Copy ${label}`}
              className="shrink-0 h-7 w-7 rounded-md hover:bg-bg2 text-mute hover:text-ink flex items-center justify-center">
              <Icon name="copy" size={13}/>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-lg border-2 border-brand-600 bg-white overflow-hidden ring-2 ring-brand-600/15">
              <div className="px-2 py-1.5 text-[11px] font-mono text-mute bg-bg2 border-b border-line break-all">{prefix}</div>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
                placeholder={short ? 'kode-unik' : 'slug-campaign'}
                className="w-full px-2.5 py-1.5 font-mono text-sm text-ink bg-white placeholder:text-slate-400 focus:outline-none"/>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px]">
                {tooShort && <span className="text-rose-600 font-semibold">Minimal {minLen} karakter</span>}
                {tooLong && <span className="text-rose-600 font-semibold">Maksimal {maxLen} karakter</span>}
                {!tooShort && !tooLong && helper && <span className="text-mute">{helper}</span>}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={cancel} className="px-2 py-1 rounded-md text-xs font-bold text-ink hover:bg-bg2 border border-line">Batal</button>
                <button onClick={save} disabled={tooShort || tooLong}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold text-white ${tooShort || tooLong ? 'bg-slate-300 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700'}`}>
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ThumbUploader({ thumb, icon, onChange }: any) {
  const fileRef = useRef<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const handleFile = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadError('');
    // Lenient check: only reject obvious non-images. Backend re-validates by content
    // (JPEG/PNG/WebP/GIF). Some browsers report empty/odd MIME — let those through.
    if (f.type && !f.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (JPG, PNG, WebP, GIF).');
      e.target.value = '';
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file melebihi 5MB. Kompres gambar terlebih dahulu.');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const res = await api.uploadImage(f);
      const url = res?.data?.url || res?.url;
      // Keep the canonical relative ref (/uploads/x.png) in state so the save logic
      // can strip it to a bare filename. Display is resolved at render via mediaUrl.
      if (url) onChange(url);
      else setUploadError((res && res.message) ? res.message : 'Upload gagal. Coba lagi.');
    } catch (err: any) { setUploadError(err?.message || 'Upload gagal. Periksa koneksi.'); }
    setUploading(false);
    e.target.value = '';
  };
  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
      <div onClick={() => fileRef.current?.click()}
        className="aspect-[13/7] rounded-xl bg-bg2 border-2 border-dashed border-line hover:border-brand-400 cursor-pointer overflow-hidden relative group"
        style={thumb && !thumb.startsWith('linear') ? { backgroundImage: `url(${mediaUrl(thumb)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : thumb ? { background: thumb } : {}}>
        {thumb && !thumb.startsWith('linear') && (
          <img src={mediaUrl(thumb)} alt="Preview" className="absolute inset-0 w-full h-full object-cover" onError={(e: any) => { e.target.style.display='none'; }}/>
        )}
        {thumb && thumb.startsWith('linear') && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80">
            <Icon name={icon || 'heart'} size={48} strokeWidth={1.2}/>
          </div>
        )}
        {!thumb && (
          <div className="h-full w-full flex flex-col items-center justify-center text-mute">
            <Icon name="image" size={32} className="mb-2"/>
            <span className="text-xs font-semibold">{uploading ? 'Mengupload...' : 'Klik untuk upload gambar'}</span>
            <span className="text-[10px] mt-1">650 x 350 px</span>
          </div>
        )}
        <div className="absolute top-2 right-2 h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-pop group-hover:scale-110 transition-transform">
          <Icon name="upload" size={14}/>
        </div>
      </div>
      <button onClick={() => { thumb ? onChange(null) : fileRef.current?.click(); setUploadError(''); }}
        className="mt-2 w-full text-xs font-semibold text-brand-600 hover:underline">
        {thumb ? 'Hapus gambar' : 'Upload gambar'}
      </button>
      {uploadError && (
        <div className="mt-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2 flex items-center gap-2">
          <Icon name="close" size={14}/>
          <span className="flex-1">{uploadError}</span>
          <button onClick={() => setUploadError('')} className="text-rose-400 hover:text-rose-600"><Icon name="close" size={12}/></button>
        </div>
      )}
      <div className="text-[10px] text-mute mt-1">JPG, PNG, WebP, GIF · maks 5MB · ideal 650×350 (gambar lain otomatis di-fit)</div>
    </div>
  );
}

function RichEditor({ value, onChange }: any) {
  const ref = useRef<any>(null);
  const imgRef = useRef<any>(null);
  const savedRange = useRef<any>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [colorOpen, setColorOpen] = useState(false);
  const [preview] = useState(false);

  useEffect(() => {
    // Sanitize on load so any already-stored malicious HTML can't execute when an
    // admin opens the editor. sanitizeHTML comes from api.ts. Then normalize pasted
    // light-mode-only inline colors (near-black/dark navy text, white highlight) so
    // the editor shows theme-correct text AND the fix persists on the next save.
    let clean: any = normalizeRichTextColors(sanitizeHTML(value || '') as string);
    // Resolve stored relative /uploads/ image src to a loadable URL so previews show
    // in the editor (dev serves uploads from a different origin). Rewritten back to
    // relative on save.
    if (clean) {
      clean = clean.replace(/(<img[^>]+src=")(\/uploads\/[^"]+)(")/gi, (_m: any, a: any, src: any, b: any) => a + mediaUrl(src) + b);
    }
    if (ref.current && ref.current.innerHTML !== clean) ref.current.innerHTML = clean;
  }, []);

  // Save the caret/selection whenever it's inside the editor so toolbar actions
  // (which steal focus) can restore it before running execCommand.
  const saveSel = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current && ref.current.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };
  const restoreSel = () => {
    ref.current && ref.current.focus();
    const sel = window.getSelection();
    if (!sel || !ref.current) return;
    if (savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    } else {
      // No saved range — place caret at end so inserts land somewhere valid.
      const r = document.createRange();
      r.selectNodeContents(ref.current); r.collapse(false);
      sel.removeAllRanges(); sel.addRange(r);
    }
  };
  const exec = (cmd: any, val?: any) => {
    restoreSel();
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(ref.current.innerHTML);
    saveSel();
  };
  const insertHTML = (html: any) => {
    restoreSel();
    // execCommand insertHTML is unreliable across browsers after focus loss;
    // insert at the restored range manually as a robust fallback.
    let ok = false;
    try { ok = document.execCommand('insertHTML', false, html); } catch { ok = false; }
    if (!ok && ref.current) {
      const sel = window.getSelection();
      const range = (sel && sel.rangeCount) ? sel.getRangeAt(0) : null;
      const tmp = document.createElement('div'); tmp.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node; while ((node = tmp.firstChild)) frag.appendChild(node);
      if (range) { range.deleteContents(); range.insertNode(frag); }
      else ref.current.appendChild(frag);
    }
    if (ref.current) onChange(ref.current.innerHTML);
    saveSel();
  };
  const wordCount = (value || '').replace(/<[^>]+>/g,'').trim().split(/\s+/).filter(Boolean).length;

  const insertLink = () => {
    if (linkUrl.trim()) exec('createLink', linkUrl.trim());
    setLinkOpen(false); setLinkUrl('');
  };
  const insertVideo = () => {
    const url = videoUrl.trim();
    if (!url) return;
    let embedUrl = url;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (yt) embedUrl = 'https://www.youtube.com/embed/' + yt[1];
    insertHTML('<div class="my-3" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden"><iframe src="' + embedUrl + '" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe></div>');
    setVideoOpen(false); setVideoUrl('');
  };
  const handleImgUpload = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const res = await api.uploadImage(f);
      const url = res?.data?.url || res?.url;
      // Insert a display-resolved URL so the preview loads in the editor (dev: :8080).
      // It's rewritten back to a relative /uploads/ path on save (see handleSave) so
      // stored content stays portable across environments.
      if (url) insertHTML('<img src="' + mediaUrl(url) + '" style="border-radius:8px;max-width:100%;height:auto;display:block;margin:8px 0"/>');
      else alert('Upload gambar gagal. Coba lagi.');
    } catch { alert('Upload gambar gagal. Periksa koneksi.'); }
    e.target.value = '';
  };
  const colors = ['#2E4191','#38B6FF','#16A34A','#DC2626','#F59E0B','#7C3AED','#1E293B','#64748B'];

  return (
    <div className="mt-1.5 rounded-xl border border-line bg-white overflow-hidden">
      <style>{`.nb-rte h1{font-size:1.6em;font-weight:800;line-height:1.3;margin:.6em 0 .3em;color:inherit}.nb-rte h2{font-size:1.35em;font-weight:700;line-height:1.35;margin:.6em 0 .3em;color:inherit}.nb-rte h3{font-size:1.15em;font-weight:700;line-height:1.4;margin:.5em 0 .25em;color:inherit}.nb-rte p{margin:.4em 0}.nb-rte blockquote{border-left:3px solid var(--nb-brand,#2E4191);padding-left:12px;color:#64748B;margin:.5em 0}.nb-rte ul{list-style:disc;padding-left:1.5em;margin:.4em 0}.nb-rte ol{list-style:decimal;padding-left:1.5em;margin:.4em 0}.nb-rte img{max-width:100%;height:auto}.nb-rte a{color:var(--nb-brand,#2E4191);text-decoration:underline}`}</style>
      <div className="flex items-center gap-1 px-2 py-1.5 bg-bg2 border-b border-line flex-wrap relative z-20">
        <button onMouseDown={(e)=>e.preventDefault()} onClick={() => exec('undo')} title="Undo" className="h-7 w-7 rounded hover:bg-white flex items-center justify-center text-ink">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-1"/></svg>
        </button>
        <button onMouseDown={(e)=>e.preventDefault()} onClick={() => exec('redo')} title="Redo" className="h-7 w-7 rounded hover:bg-white flex items-center justify-center text-ink">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h1"/></svg>
        </button>
        <span className="h-5 w-px bg-line mx-1"/>
        <select onMouseDown={saveSel} onChange={(e) => { if (e.target.value) { exec('formatBlock', e.target.value); e.target.selectedIndex = 0; } }} defaultValue="" className="h-7 px-2 rounded bg-white border border-line text-xs font-semibold text-ink relative z-50">
          <option value="" disabled>Format</option>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        <span className="h-5 w-px bg-line mx-1"/>
        <button onMouseDown={(e)=>e.preventDefault()} onClick={() => exec('bold')} title="Bold" className="h-7 w-7 rounded hover:bg-white flex items-center justify-center font-bold text-ink">B</button>
        <button onMouseDown={(e)=>e.preventDefault()} onClick={() => exec('italic')} title="Italic" className="h-7 w-7 rounded hover:bg-white flex items-center justify-center italic text-ink">I</button>
        <span className="h-5 w-px bg-line mx-1"/>
        <button onMouseDown={(e)=>e.preventDefault()} onClick={() => exec('justifyLeft')} title="Left" className="h-7 w-7 rounded hover:bg-white flex items-center justify-center text-ink"><AlignIcon a="left"/></button>
        <button onMouseDown={(e)=>e.preventDefault()} onClick={() => exec('justifyCenter')} title="Center" className="h-7 w-7 rounded hover:bg-white flex items-center justify-center text-ink"><AlignIcon a="center"/></button>
        <button onMouseDown={(e)=>e.preventDefault()} onClick={() => exec('justifyRight')} title="Right" className="h-7 w-7 rounded hover:bg-white flex items-center justify-center text-ink"><AlignIcon a="right"/></button>
        <button onMouseDown={(e)=>e.preventDefault()} onClick={() => exec('justifyFull')} title="Justify" className="h-7 w-7 rounded hover:bg-white flex items-center justify-center text-ink"><AlignIcon a="full"/></button>
        <span className="h-5 w-px bg-line mx-1"/>
        <button onMouseDown={(e)=>e.preventDefault()} onClick={() => exec('insertUnorderedList')} title="Bulleted list" className="h-7 w-7 rounded hover:bg-white flex items-center justify-center text-ink"><ListIcon ordered={false}/></button>
        <button onMouseDown={(e)=>e.preventDefault()} onClick={() => exec('insertOrderedList')} title="Numbered list" className="h-7 w-7 rounded hover:bg-white flex items-center justify-center text-ink"><ListIcon ordered={true}/></button>
        <span className="h-5 w-px bg-line mx-1"/>
        {/* Link */}
        <div className="relative">
          <button onMouseDown={(e)=>{e.preventDefault(); saveSel();}} onClick={() => { setLinkOpen(!linkOpen); setColorOpen(false); setVideoOpen(false); }} title="Link" className={`h-7 w-7 rounded hover:bg-white flex items-center justify-center ${linkOpen ? 'bg-white ring-2 ring-brand-600/20' : 'text-ink'}`}><Icon name="link" size={14}/></button>
          {linkOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-pop border border-line p-2 z-50 w-64">
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && insertLink()}
                placeholder="https://..." className="field text-xs" autoFocus/>
              <div className="flex gap-1 mt-1.5">
                <button onClick={() => { setLinkOpen(false); setLinkUrl(''); }} className="flex-1 px-2 py-1 rounded text-xs font-bold text-mute hover:bg-bg2">Batal</button>
                <button onClick={insertLink} className="flex-1 px-2 py-1 rounded text-xs font-bold text-white bg-brand-600 hover:bg-brand-700">Sisipkan</button>
              </div>
            </div>
          )}
        </div>
        {/* Image upload */}
        <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImgUpload}/>
        <button onMouseDown={(e)=>{e.preventDefault(); saveSel();}} onClick={() => imgRef.current?.click()} title="Insert gambar" className="h-7 w-7 rounded hover:bg-white flex items-center justify-center text-ink"><Icon name="image" size={14}/></button>
        {/* Video */}
        <div className="relative">
          <button onMouseDown={(e)=>{e.preventDefault(); saveSel();}} onClick={() => { setVideoOpen(!videoOpen); setLinkOpen(false); setColorOpen(false); }} title="Video" className={`h-7 w-7 rounded hover:bg-white flex items-center justify-center ${videoOpen ? 'bg-white ring-2 ring-brand-600/20' : 'text-ink'}`}><Icon name="play" size={14}/></button>
          {videoOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-pop border border-line p-2 z-50 w-72">
              <div className="text-[10px] font-bold text-mute mb-1">YouTube atau embed URL</div>
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && insertVideo()}
                placeholder="https://youtube.com/watch?v=..." className="field text-xs" autoFocus/>
              <div className="flex gap-1 mt-1.5">
                <button onClick={() => { setVideoOpen(false); setVideoUrl(''); }} className="flex-1 px-2 py-1 rounded text-xs font-bold text-mute hover:bg-bg2">Batal</button>
                <button onClick={insertVideo} className="flex-1 px-2 py-1 rounded text-xs font-bold text-white bg-brand-600 hover:bg-brand-700">Sisipkan Video</button>
              </div>
            </div>
          )}
        </div>
        <span className="h-5 w-px bg-line mx-1"/>
        {/* Color picker */}
        <div className="relative">
          <button onMouseDown={(e)=>{e.preventDefault(); saveSel();}} onClick={() => { setColorOpen(!colorOpen); setLinkOpen(false); setVideoOpen(false); }} title="Text color" className={`h-7 px-2 rounded hover:bg-white flex items-center gap-1 ${colorOpen ? 'bg-white ring-2 ring-brand-600/20' : 'text-ink'}`}><b>A</b><span className="h-2 w-2 rounded-sm bg-brand-600"/></button>
          {colorOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-pop border border-line p-2 z-50">
              <div className="grid grid-cols-4 gap-1.5">
                {colors.map((c) => (
                  <button key={c} onMouseDown={(e)=>e.preventDefault()} onClick={() => { exec('foreColor', c); setColorOpen(false); }}
                    className="h-7 w-7 rounded-md border border-line hover:scale-110 transition-transform" style={{ background: c }}/>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e: any) => onChange(e.currentTarget.innerHTML)}
        onKeyUp={saveSel}
        onMouseUp={saveSel}
        onBlur={saveSel}
        className="nb-rte min-h-[260px] max-h-[420px] overflow-y-auto p-4 text-sm text-ink/90 leading-relaxed focus:outline-none max-w-none"
      />

      <div className="flex justify-end px-3 py-1.5 bg-bg2 border-t border-line text-[11px] font-bold uppercase text-mute">
        {wordCount} WORDS
      </div>
    </div>
  );
}

const AlignIcon = ({ a }: any) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <rect x="2" y="3" width={a==='full' ? 12 : a==='center' ? 8 : 10} height="1.5" rx="0.5" transform={a==='right' ? 'translate(2 0)' : a==='center' ? 'translate(2 0)' : ''}/>
    <rect x="2" y="7" width="12" height="1.5" rx="0.5"/>
    <rect x="2" y="11" width={a==='full' ? 12 : a==='center' ? 8 : 10} height="1.5" rx="0.5" transform={a==='right' ? 'translate(2 0)' : a==='center' ? 'translate(2 0)' : ''}/>
  </svg>
);

const ListIcon = ({ ordered }: any) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    {ordered ? (
      <>
        <text x="0" y="6" fontSize="5" fontWeight="700">1</text>
        <text x="0" y="13" fontSize="5" fontWeight="700">2</text>
      </>
    ) : (
      <>
        <circle cx="3" cy="5" r="1.3"/>
        <circle cx="3" cy="11" r="1.3"/>
      </>
    )}
    <rect x="6" y="4" width="9" height="1.5" rx="0.5"/>
    <rect x="6" y="10" width="9" height="1.5" rx="0.5"/>
  </svg>
);

// Per-kind field schema for the custom-form item builder. Shared with the public
// renderer's expectations (public-app.jsx ItemSelect reads the same keys).
const QURBAN_ANIMALS = ['Kambing', 'Domba', 'Sapi', 'Kerbau', 'Unta'];
const QURBAN_SHARES = [
  { v: '1', l: '1 (Full)' }, { v: '1/7', l: '1/7' }, { v: '1/9', l: '1/9' }, { v: '1/10', l: '1/10' },
];

// ItemBuilder: a generic list-of-items editor for the qurban / package2 / zfitrah form
// kinds. Each row has image + name + price, plus kind-specific fields. Mirrors the
// payment-row map+edit+delete pattern. Items persist via form_items_config in handleSave.
function ItemBuilder({ kind, items, setItems, rand4 }: any) {
  const upd = (id: any, patch: any) => setItems(items.map((it: any) => it.id === id ? { ...it, ...patch } : it));
  const del = (id: any) => setItems(items.filter((it: any) => it.id !== id));
  const add = () => setItems([...(items || []), {
    id: rand4(), name: '', price: 0, image: '',
    ...(kind === 'qurban' ? { animal_type: 'Kambing', share: '1', weight: '' } : { desc: '' }),
  }]);
  // Reorder a row up/down (mirrors DonasiAja's drag-sort; chevrons are the lowest-risk
  // approach in the IIFE/window-global setup — no DnD lib).
  const move = (idx: any, dir: any) => {
    const arr = [...items];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    setItems(arr);
  };

  const uploadFor = async (id: any, file: any) => {
    if (!file) return;
    try {
      const res = await api.uploadImage(file);
      const url = res?.data?.url || res?.url;
      if (url) {
        // Store the bare filename (portable across envs), like the campaign thumbnail.
        const clean = String(url).split(/[?#]/)[0];
        upd(id, { image: clean.substring(clean.lastIndexOf('/') + 1) });
      }
    } catch { /* ignore — admin can retry */ }
  };

  return (
    <div className="mt-3 space-y-3">
      {(items || []).map((it: any, idx: any) => {
        const imgSrc = it.image ? mediaUrl('/uploads/' + it.image) : '';
        const priceField = (
          <div className="flex items-center field bg-white col-span-2"><span className="text-mute text-xs mr-1 font-bold">Rp</span>
            <input type="number" min="0" value={it.price} onChange={(e) => upd(it.id, { price: Math.max(0, Math.floor(+e.target.value || 0)) })} className="bg-transparent border-0 p-0 w-full focus:ring-0" placeholder="Harga"/>
          </div>
        );
        return (
          <div key={it.id} className="rounded-xl border border-line bg-white p-3">
            <div className="flex gap-3">
              {/* Image LEFT, large (~120px) to match DonasiAja's qurban card. */}
              <label className="relative shrink-0 h-28 w-28 rounded-xl border border-dashed border-line bg-bg2 flex items-center justify-center cursor-pointer overflow-hidden group">
                {imgSrc ? <img src={imgSrc} alt="" className="h-full w-full object-cover"/> : <Icon name="image" size={26} className="text-mute"/>}
                <span className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-brand-600 text-white flex items-center justify-center shadow"><Icon name="image" size={12}/></span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadFor(it.id, e.target.files?.[0]); e.target.value=''; }}/>
              </label>
              <div className="flex-1 grid grid-cols-2 gap-2 content-start">
                {/* Field order mirrors DonasiAja: name → weight → type → share → price(last). */}
                <input value={it.name} onChange={(e) => upd(it.id, { name: e.target.value })} className="field bg-white col-span-2" placeholder={kind === 'zfitrah' ? 'Nama / Jenis Beras' : 'Nama / Judul'}/>
                {kind === 'qurban' ? (
                  <>
                    <input value={it.weight || ''} onChange={(e) => upd(it.id, { weight: e.target.value })} className="field bg-white col-span-2" placeholder="Bobot / Weight (cth 25-30kg)"/>
                    <select value={it.animal_type} onChange={(e) => upd(it.id, { animal_type: e.target.value })} className="field bg-white" title="Jenis Hewan">
                      {QURBAN_ANIMALS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select value={it.share} onChange={(e) => upd(it.id, { share: e.target.value })} className="field bg-white" title="Pembayaran / Patungan">
                      {QURBAN_SHARES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                    </select>
                    {priceField}
                  </>
                ) : (
                  <>
                    <input value={it.desc || ''} onChange={(e) => upd(it.id, { desc: e.target.value })} className="field bg-white col-span-2" placeholder="Deskripsi / Description"/>
                    {priceField}
                  </>
                )}
              </div>
              {/* Reorder (up/down) + delete column. */}
              <div className="shrink-0 flex flex-col items-center gap-1 self-start">
                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="h-7 w-7 rounded-md text-mute hover:text-brand-600 hover:bg-brand-50 disabled:opacity-30 flex items-center justify-center" title="Naik"><Icon name="arrowUp" size={13}/></button>
                <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="h-7 w-7 rounded-md text-mute hover:text-brand-600 hover:bg-brand-50 disabled:opacity-30 flex items-center justify-center" title="Turun"><Icon name="arrowDown" size={13}/></button>
                <button onClick={() => del(it.id)} className="h-7 w-7 rounded-md text-mute hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center" title="Hapus"><Icon name="trash" size={13}/></button>
              </div>
            </div>
          </div>
        );
      })}
      <button onClick={add} className="px-3 py-2 rounded-lg border border-dashed border-line bg-white text-sm font-bold text-brand-600 hover:bg-brand-50">
        + {kind === 'qurban' ? 'Add Qurban' : kind === 'package2' ? 'Add Package' : 'Add Paket Zakat'}
      </button>
    </div>
  );
}

// ZakatCalcBuilder: admin configures the zakat calculator (Maal/Profesi/Emas/Pertanian).
// The donor enters their amount/weight on the public page; the rate/nisab here drive the
// computed zakat. Stored under form_items_config.calc.
function ZakatCalcBuilder({ calc, setCalc }: any) {
  const set = (patch: any) => setCalc({ ...calc, ...patch });
  return (
    <div className="mt-1 rounded-xl border border-line bg-white p-3 space-y-3">
      <div>
        <label className="text-xs font-semibold text-mute">Jenis Zakat</label>
        <select value={calc.type} onChange={(e) => set({ type: e.target.value })} className="field bg-white mt-1">
          <option value="maal">Maal (Harta)</option>
          <option value="profesi">Penghasilan / Profesi</option>
          <option value="emas">Emas</option>
          <option value="pertanian">Pertanian</option>
        </select>
      </div>
      {(calc.type === 'maal' || calc.type === 'profesi') && (
        <div>
          <label className="text-xs font-semibold text-mute">Rate (%)</label>
          <input type="number" step="0.1" value={calc.rate} onChange={(e) => set({ rate: +e.target.value || 0 })} className="field bg-white mt-1" placeholder="2.5"/>
          <div className="text-[11px] text-mute mt-1">Zakat = nominal harta/penghasilan × rate. Default 2.5%.</div>
        </div>
      )}
      {calc.type === 'emas' && (
        <div>
          <label className="text-xs font-semibold text-mute">Harga Emas per gram (Rp)</label>
          <input type="number" min="0" value={calc.gold_price_per_gram} onChange={(e) => set({ gold_price_per_gram: Math.max(0, Math.floor(+e.target.value || 0)) })} className="field bg-white mt-1" placeholder="cth 1.100.000"/>
          <div className="text-[11px] text-mute mt-1">Donatur isi gram emas; zakat = gram × harga × 2.5%.</div>
        </div>
      )}
      {calc.type === 'pertanian' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-mute">Pengairan</label>
            <select value={calc.agri_irrigation} onChange={(e) => set({ agri_irrigation: e.target.value })} className="field bg-white mt-1">
              <option value="mandiri">Mandiri (5%)</option>
              <option value="tadah-hujan">Tadah Hujan (10%)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Nisab (Kg)</label>
            <select value={calc.agri_nisab_kg} onChange={(e) => set({ agri_nisab_kg: +e.target.value })} className="field bg-white mt-1">
              <option value="520">520 kg (Beras)</option>
              <option value="653">653 kg (Gabah Kering)</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-mute">Harga per Kg (Rp)</label>
            <input type="number" min="0" value={calc.agri_price_per_kg} onChange={(e) => set({ agri_price_per_kg: Math.max(0, Math.floor(+e.target.value || 0)) })} className="field bg-white mt-1" placeholder="cth 12.000"/>
          </div>
          <div className="col-span-2 text-[11px] text-mute">Donatur isi hasil panen (kg); zakat = kg × harga/kg × rate (jika ≥ nisab).</div>
        </div>
      )}
    </div>
  );
}

function FieldToggle({ label, value, onChange }: any) {
  return (
    <div>
      <div className="text-xs font-semibold text-mute mb-1.5">{label}</div>
      <button onClick={() => onChange(!value)} className="inline-flex items-center gap-2">
        <span className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-all ${value ? 'left-[22px]' : 'left-0.5'}`}/>
        </span>
        <span className={`text-sm font-bold ${value ? 'text-ink' : 'text-mute'}`}>{value ? 'Show' : 'Hide'}</span>
      </button>
    </div>
  );
}

function AdvRadio({ label, sub, value, options, onChange }: any) {
  // Color hint per option
  const color = (o: any) => {
    if (o === 'Default' || o === 'Hide') return 'accent-emerald-600';
    return 'accent-emerald-600';
  };
  return (
    <div className="pb-5 border-b border-line last:border-0 last:pb-0">
      <div className="font-bold text-ink">{label}</div>
      {sub && <div className="text-xs text-mute mt-0.5">{sub}</div>}
      <div className="mt-2.5 flex flex-wrap items-center gap-5">
        {options.map((o: any) => (
          <label key={o} className="inline-flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" checked={value === o} onChange={() => onChange(o)} className={`h-4 w-4 ${color(o)}`}/>
            <span className={value === o ? 'font-bold text-ink' : 'text-ink/80'}>{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FormTypePreview({ style, mode, zakatKind }: any) {
  const presets = ['Rp', 'Rp', 'Rp', 'Rp', 'OTHER NOMINAL'];
  // Zakat mode shows a zakat-appropriate skeleton instead of the donation-nominal mock.
  if (mode === 'Zakat') {
    return (
      <div className="mt-4 rounded-xl bg-bg2 border border-line p-4">
        {zakatKind === 'calc' ? (
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-mute">Kalkulator Zakat</div>
            <div className="h-10 rounded-lg bg-white border border-line flex items-center px-3 text-xs font-bold text-mute">Rp [ nilai harta / hasil… ]</div>
            <div className="h-10 rounded-lg bg-white border border-line flex items-center justify-between px-3 text-xs">
              <span className="text-mute">Zakat</span><span className="font-bold text-brand-600">Rp …</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-mute">Paket Zakat Fitrah</div>
            {[1,2].map(i => (
              <div key={i} className="rounded-lg bg-white border border-line p-2.5 flex items-center gap-2">
                <div className="h-10 w-10 rounded-md bg-bg2"/>
                <div className="flex-1"><div className="text-xs font-bold text-ink">Beras Premium</div><div className="text-[10px] text-mute">Rp 45.000 / jiwa</div></div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-xl bg-bg2 border border-line p-4">
      {style === 'List' && (
        <div className="space-y-2">
          {presets.slice(0,4).map((p, i) => (
            <div key={i} className="h-10 rounded-lg bg-white border border-line flex items-center px-3 text-xs font-bold text-mute">{p}</div>
          ))}
        </div>
      )}
      {style === 'Typing' && (
        <div className="h-12 rounded-lg bg-white border border-line flex items-center px-3 text-xs font-bold text-mute">Rp [ ketik nominal… ]</div>
      )}
      {style === 'Package' && (
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,4].map((i) => (
            <div key={i} className="aspect-[3/2] rounded-lg bg-white border border-line flex items-center justify-center text-xs font-bold text-mute">Paket {i}</div>
          ))}
        </div>
      )}
      {style === 'Card' && (
        <div className="grid grid-cols-3 gap-2">
          {presets.slice(0,3).map((p, i) => (
            <div key={i} className="h-9 rounded-md bg-white border border-line flex items-center justify-center text-xs font-bold text-mute">{p}</div>
          ))}
          <div className="h-9 rounded-md bg-white border border-line flex items-center justify-center text-xs font-bold text-mute">{presets[3]}</div>
          <div className="col-span-2 h-9 rounded-md bg-white border border-line flex items-center justify-center text-[10px] font-bold text-mute">OTHER NOMINAL</div>
        </div>
      )}
      {style === 'Package2' && (
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,4].map((i) => (
            <div key={i} className="aspect-square rounded-lg bg-white border border-line p-2 flex flex-col">
              <div className="h-3/5 bg-bg2 rounded-md"/>
              <div className="mt-1 text-[10px] font-bold text-mute">Paket {i}</div>
            </div>
          ))}
        </div>
      )}
      {style === 'Qurban' && (
        <div className="space-y-2">
          <div className="rounded-lg bg-white border border-line p-3 flex items-center gap-2">
            <div className="h-10 w-10 rounded-md bg-bg2"/>
            <div className="flex-1">
              <div className="text-xs font-bold text-ink">Kambing — Rp 2.500.000</div>
              <div className="text-[10px] text-mute">Bobot 28-32 kg</div>
            </div>
            <div className="text-[10px] font-bold text-brand-600">QURBAN</div>
          </div>
          <div className="rounded-lg bg-white border border-line p-3 flex items-center gap-2">
            <div className="h-10 w-10 rounded-md bg-bg2"/>
            <div className="flex-1">
              <div className="text-xs font-bold text-ink">Sapi (1/7) — Rp 3.200.000</div>
              <div className="text-[10px] text-mute">Per kavling</div>
            </div>
            <div className="text-[10px] font-bold text-brand-600">QURBAN</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper: when editing, fetch the FULL record from the admin endpoint (the list passes
// only a TRIMMED campaign — no `description`, no advanced toggles) so the rich-text story
// (incl. images), thumbnail, Publish status, and all advanced settings load back correctly.
// mapCampaign normalizes field names (image→img, category object→name, etc.) the form
// expects. While the fetch is in flight we show a placeholder rather than mounting the
// form with trimmed data — that would flash the wrong content and discard any early edits
// when we remount with full data. On create (no id) we render the empty form immediately.
export default function CampaignEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editId = id;
  const [full, setFull] = useState<any>(null);
  const [loaded, setLoaded] = useState(!editId); // create mode: nothing to load

  useEffect(() => {
    let alive = true;
    if (!editId || !api || !api.adminCampaign) { setLoaded(true); return; }
    setLoaded(false);
    api.adminCampaign(editId)
      .then((r: any) => {
        if (!alive) return;
        if (r && r.data) {
          // mapCampaign normalizes field names (image→img, category object→name, etc.) the form expects.
          const mapped = mapCampaign(r.data);
          setFull(mapped);
        }
      })
      .catch(() => { /* keep null as fallback */ })
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [editId]);

  // While the full record loads (edit mode only), show a placeholder rather than
  // mounting the form with trimmed data — that would flash the wrong content and
  // discard any early edits when we remount with full data.
  if (editId && !loaded) {
    return (
      <div className="flex items-center justify-center py-24 text-mute text-sm">
        <span className="h-5 w-5 mr-3 rounded-full border-2 border-brand-600 border-t-transparent animate-spin"/>
        Memuat data campaign…
      </div>
    );
  }

  // key forces a fresh seed when switching between edited campaigns.
  return <CampaignEditorForm key={editId || 'new'} campaign={editId ? full : null}/>;
}

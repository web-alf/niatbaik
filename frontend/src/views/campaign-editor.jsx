// Full-page Campaign editor (Create / Edit). Matches the spec from the attached doc.
const EVENT_OPTS = ['', 'PageView','ViewContent','InitiateCheckout','AddPaymentInfo','Lead','Purchase','CompleteDonation'];
function CampaignEditorView() {
  const { editingCampaign, setView, setEditingCampaign, showToast } = useApp();
  const isEdit = !!editingCampaign;
  const c = editingCampaign;

  // ---- form state ----
  const [title, setTitle] = useStateA(c?.title || '');
  const [content, setContent] = useStateA(c?.description || c?.short_description || '');
  const [target, setTarget] = useStateA(c?.target || 0);
  const [endDate, setEndDate] = useStateA('2026-08-31');
  const [location, setLocation] = useStateA(c?.location_name || '');
  const [gmaps, setGmaps] = useStateA(c?.location_gmaps || '');
  const [category, setCategory] = useStateA(c?.category || 'Uncategorized');
  const [status, setStatus] = useStateA(c?.status || 'Draft');
  const [thumb, setThumb] = useStateA(c?.img || c?.thumb || null);

  // Editable URL slugs
  const autoSlug = (title || c?.title || 'kampanye-baru').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const [longSlug, setLongSlug] = useStateA(c?.id ? autoSlug : autoSlug);
  const [shortSlug, setShortSlug] = useStateA(c?.id || 'djag7hj20pg');
  // Re-sync long slug if title changes AND user hasn't custom-edited it
  const [longTouched, setLongTouched] = useStateA(false);
  useEffectA(() => {
    if (!longTouched) setLongSlug((title || 'kampanye-baru').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''));
  }, [title]);

  // ---- form type panel ----
  const [formMode, setFormMode] = useStateA('Donation'); // Donation | Zakat
  const [formStyle, setFormStyle] = useStateA('Card');   // List | Typing | Package | Card | Package2 | Qurban

  // ---- advanced sections ----
  const [adv, setAdv] = useStateA({
    payment: 'Default',
    form: 'Default',
    fundraising: 'Default',
    wa: c?.wa_notification ? 'Custom' : 'Default',
    followup: c?.followup_enabled ? 'Custom' : 'Default',
    metaPixel: c?.meta_pixel_id ? 'Custom' : 'Default',
    tiktokPixel: c?.tiktok_pixel_id ? 'Custom' : 'Default',
    gtm: c?.gtm_id ? 'Custom' : 'Default',
    socialProof: 'Hide',
    popupInfo: c?.popup_info ? 'Show' : 'Hide',
    waFlying: c?.wa_flying_button ? 'Custom' : 'Default',
    extLink: c?.external_link ? 'Custom' : 'Default',
    general: 'Default',
  });

  // Form custom panel state
  const [formCustom, setFormCustom] = useStateA({
    button1: 'Tunaikan Fidyah',
    button2: 'Tunaikan Fidyah Sekarang',
    smallTitleCampaign: '',
    smallTitleDonate: '',
    anonim: true,
    email: false,
    comment: true,
  });

  // Nominal preset rows
  const parseNominals = (v) => {
    let arr = v;
    if (typeof v === 'string' && v.trim()) { try { arr = JSON.parse(v); } catch { arr = []; } }
    if (!Array.isArray(arr)) return [];
    return arr.map(n => (typeof n === 'object' && n !== null)
      ? { amount: +n.amount || 0, label: n.label || '', fav: !!n.fav }
      : { amount: +n || 0, label: '', fav: false });
  };
  const [nominals, setNominals] = useStateA(parseNominals(c?.opt_nominal));
  const [minDonasi, setMinDonasi] = useStateA(c?.min_donation || '');
  const [maxDonasi, setMaxDonasi] = useStateA(c?.max_donation || 0);

  const [advCustom, setAdvCustom] = useStateA({
    fundraiserPct: '10', fundraiserEnabled: true,
    waNumber: '', waTemplate: '',
    followupMsg: '', paymentSuccessMsg: '',
    metaPixelId: c?.meta_pixel_id || '', tiktokPixelId: c?.tiktok_pixel_id || '', gtmId: c?.gtm_id || '',
    metaPixelEnabled: true, metaCAPIEnabled: false, metaCAPIToken: '', metaTestEvent: '',
    events: { campaign:'PageView', form:'InitiateCheckout', invoice:'Lead', success:'Purchase' },
    waFlyingNumber: '', waFlyingText: 'Chat via WhatsApp',
    extLinkUrl: c?.external_link || '', extLinkText: 'Kunjungi website',
    paymentRows: [{ bank:'', account:'', holder:'', method:'instant' }],
    popupTitle: '', popupDesc: '', popupButton: 'Ya, Lanjutkan',
  });
  const [advOpen, setAdvOpen] = useStateA(true);

  const back = () => { setEditingCampaign(null); setView('campaigns'); };

  const [saving, setSaving] = useStateA(false);
  const handleSave = async (publish) => {
    if (!title.trim()) { showToast('Judul campaign wajib diisi'); return; }
    if (!content.trim()) { showToast('Keterangan campaign wajib diisi'); return; }
    setSaving(true);
    const desc = content || '';
    const shortDesc = desc.replace(/<[^>]+>/g, '').trim().slice(0, 500) || title;
    const payload = {
      title: title.trim(),
      description: desc,
      short_description: shortDesc,
      status: publish ? 'Berjalan' : 'Draft',
    };
    // Optional fields — only include if has value
    if (target > 0) payload.target = Number(target);
    if (location.trim()) payload.location_name = location.trim();
    if (gmaps.trim()) payload.location_gmaps = gmaps.trim();
    // thumb may be a CSS gradient or an uploaded image URL — route to the right field
    if (thumb) {
      if (typeof thumb === 'string' && thumb.startsWith('linear')) {
        payload.thumb_gradient = thumb;
      } else {
        payload.image = String(thumb).replace(/^\/uploads\//, '');
      }
    }
    if (formStyle) payload.form_type = formStyle;
    if (formMode) payload.form_style = formMode;
    if (minDonasi > 0) payload.min_donation = minDonasi;
    if (maxDonasi > 0) payload.max_donation = maxDonasi;
    if (nominals.length) payload.opt_nominal = JSON.stringify(nominals.map(n => n.amount).filter(Boolean));
    // Don't send category_id as integer — backend expects UUID
    // Advanced options
    payload.wa_notification = adv.wa === 'Custom';
    payload.followup_enabled = adv.followup === 'Custom';
    payload.popup_info = adv.popupInfo === 'Show';
    payload.wa_flying_button = adv.waFlying === 'Custom';
    payload.form_fields_config = JSON.stringify({ anonim: formCustom.anonim, email: formCustom.email, comment: formCustom.comment, button1: formCustom.button1, button2: formCustom.button2 });
    if (adv.payment === 'Custom') payload.payment_config = JSON.stringify(advCustom.paymentRows || []);
    // Meta Pixel — Custom sends per-campaign config (global OFF); Default leaves meta_pixel_id empty = inherit global.
    if (adv.metaPixel === 'Custom') {
      payload.meta_pixel_id = advCustom.metaPixelId;
      payload.pixel_config = JSON.stringify({ capi: advCustom.metaCAPIEnabled, token: advCustom.metaCAPIToken, test_event: advCustom.metaTestEvent, events: advCustom.events });
    }
    if (advCustom.tiktokPixelId) payload.tiktok_pixel_id = advCustom.tiktokPixelId;
    if (advCustom.gtmId) payload.gtm_id = advCustom.gtmId;
    if (advCustom.extLinkUrl) payload.external_link = advCustom.extLinkUrl;

    try {
      if (isEdit) {
        await api.updateCampaign(c.id, payload);
        showToast('Campaign berhasil diupdate');
      } else {
        await api.createCampaign(payload);
        showToast('Campaign berhasil di' + (publish ? 'publish' : 'simpan'));
      }
      if (typeof window.loadApiData === 'function') try { window.loadApiData(); } catch {}
      setTimeout(back, 500);
    } catch (e) {
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
                  <AdvRadio label="Payment" value={adv.payment} options={['Default','Custom']} onChange={(v) => setAdv({...adv, payment:v})}/>
                  {adv.payment === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-3">
                      <div className="grid grid-cols-[1fr_1fr_1fr_120px_auto] gap-2 text-[11px] font-bold text-mute uppercase px-0.5">
                        <div>Nama Bank</div><div>No. Rekening</div><div>Atas Nama</div><div>Method</div><div/>
                      </div>
                      {(advCustom.paymentRows || []).map((row, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_120px_auto] gap-2 items-center">
                          <input value={row.bank} onChange={(e) => { const arr = advCustom.paymentRows.map((r, j) => j === i ? { ...r, bank: e.target.value } : r); setAdvCustom({...advCustom, paymentRows: arr}); }} className="field bg-white" placeholder="Nama Bank"/>
                          <input value={row.account} onChange={(e) => { const arr = advCustom.paymentRows.map((r, j) => j === i ? { ...r, account: e.target.value } : r); setAdvCustom({...advCustom, paymentRows: arr}); }} className="field bg-white font-mono" placeholder="No. Rekening"/>
                          <input value={row.holder} onChange={(e) => { const arr = advCustom.paymentRows.map((r, j) => j === i ? { ...r, holder: e.target.value } : r); setAdvCustom({...advCustom, paymentRows: arr}); }} className="field bg-white" placeholder="Atas Nama"/>
                          <select value={row.method} onChange={(e) => { const arr = advCustom.paymentRows.map((r, j) => j === i ? { ...r, method: e.target.value } : r); setAdvCustom({...advCustom, paymentRows: arr}); }} className="field bg-white">
                            <option value="instant">Instant</option>
                            <option value="va">VA</option>
                            <option value="tf">Transfer</option>
                          </select>
                          <button onClick={() => setAdvCustom({...advCustom, paymentRows: advCustom.paymentRows.filter((_, j) => j !== i)})} className="h-9 w-9 rounded-md text-mute hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center"><Icon name="trash" size={14}/></button>
                        </div>
                      ))}
                      <button onClick={() => setAdvCustom({...advCustom, paymentRows: [...(advCustom.paymentRows || []), { bank:'', account:'', holder:'', method:'instant' }]})} className="mt-1 px-3 py-2 rounded-lg border border-dashed border-line bg-white text-sm font-bold text-brand-600 hover:bg-brand-50">+ Add Payment</button>
                    </div>
                  )}
                </div>

                <div>
                  <AdvRadio label="Form" value={adv.form} options={['Default','Custom']} onChange={(v) => setAdv({...adv, form:v})}/>

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
                          <FieldToggle label="Anonim" value={formCustom.anonim} onChange={(v) => setFormCustom({...formCustom, anonim:v})}/>
                          <FieldToggle label="Email"  value={formCustom.email}  onChange={(v) => setFormCustom({...formCustom, email:v})}/>
                          <FieldToggle label="Comment" value={formCustom.comment} onChange={(v) => setFormCustom({...formCustom, comment:v})}/>
                        </div>
                      </div>

                      {formStyle === 'Qurban' && (
                        <div className="pt-5 border-t border-line">
                          <div className="font-bold text-ink">Qurban</div>
                          <div className="text-xs text-mute mt-1">Jika anda memilih form type Qurban, silahkan tambahkan qurban anda.</div>
                          <button className="mt-3 px-3 py-2 rounded-lg border border-line bg-white text-sm font-bold text-brand-600 hover:bg-brand-50">+ Add Qurban</button>
                        </div>
                      )}

                      {formStyle === 'Package2' && (
                        <div className="pt-5 border-t border-line">
                          <div className="font-bold text-ink">Package 2</div>
                          <div className="text-xs text-mute mt-1">Jika anda memilih form type Package 2, silahkan tambahkan paket anda.</div>
                          <button className="mt-3 px-3 py-2 rounded-lg border border-line bg-white text-sm font-bold text-brand-600 hover:bg-brand-50">+ Add Package</button>
                        </div>
                      )}

                      {formMode === 'Zakat' && (
                        <div className="pt-5 border-t border-line">
                          <div className="font-bold text-ink">Zakat Fitrah</div>
                          <div className="text-xs text-mute mt-1">Silahkan tambahkan paket zakat fitrah anda.</div>
                          <button className="mt-3 px-3 py-2 rounded-lg border border-line bg-white text-sm font-bold text-brand-600 hover:bg-brand-50">+ Add</button>
                        </div>
                      )}

                      <div className="pt-5 border-t border-line">
                        <div className="font-bold text-ink mb-3">Pilihan Nominal Donasi</div>
                        <div className="space-y-2">
                          {nominals.map((n, i) => (
                            <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-center">
                              <input type="number" value={n.amount} onChange={(e) => { const arr = [...nominals]; arr[i].amount = +e.target.value; setNominals(arr); }} className="field bg-white"/>
                              <input value={n.label} onChange={(e) => { const arr = [...nominals]; arr[i].label = e.target.value; setNominals(arr); }} className="field bg-white"/>
                              <label className="inline-flex items-center gap-2 text-xs font-semibold text-ink whitespace-nowrap pl-2">
                                <input type="radio" checked={n.fav} onChange={() => setNominals(nominals.map((x, j) => ({ ...x, fav: i === j })))} className="accent-emerald-600 h-4 w-4"/>
                                Sering di Pilih
                              </label>
                              <button onClick={() => setNominals(nominals.filter((_, j) => j !== i))} className="h-9 w-9 rounded-md text-mute hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center">
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
                  <AdvRadio label="Fundraising" value={adv.fundraising} options={['Default','Custom']} onChange={(v) => setAdv({...adv, fundraising:v})}/>
                  {adv.fundraising === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-3">
                      <div><label className="text-xs font-semibold text-mute">Komisi fundraiser (%)</label><input type="number" value={advCustom.fundraiserPct} onChange={(e) => setAdvCustom({...advCustom, fundraiserPct: e.target.value})} className="field mt-1 bg-white" placeholder="10"/></div>
                      <FieldToggle label="Aktifkan fundraiser untuk campaign ini" value={advCustom.fundraiserEnabled} onChange={(v) => setAdvCustom({...advCustom, fundraiserEnabled:v})}/>
                    </div>
                  )}
                </div>

                <div>
                  <AdvRadio label="Whatsapp Notification" value={adv.wa} options={['Default','Custom']} onChange={(v) => setAdv({...adv, wa:v})}/>
                  {adv.wa === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-3">
                      <div className="text-xs text-mute mb-2">Notifikasi WhatsApp otomatis dikirim sesuai pengaturan admin. Isi field di bawah hanya untuk override khusus campaign ini.</div>
                      <div><label className="text-xs font-semibold text-mute">No. WhatsApp CS</label><input value={advCustom.waNumber} onChange={(e) => setAdvCustom({...advCustom, waNumber: e.target.value})} className="field mt-1 bg-white" placeholder="6281234567890"/></div>
                      <div><label className="text-xs font-semibold text-mute">Template pesan</label><textarea value={advCustom.waTemplate} onChange={(e) => setAdvCustom({...advCustom, waTemplate: e.target.value})} className="field mt-1 bg-white" rows="2" placeholder="Halo, saya ingin berdonasi untuk {{campaign}}"/></div>
                    </div>
                  )}
                </div>

                <div>
                  <AdvRadio label="Multiple Follow-Up & Payment Success Message (Format)" sub="( Trigger by Button Follow-up & Payment Status Button )" value={adv.followup} options={['Default','Custom']} onChange={(v) => setAdv({...adv, followup:v})}/>
                  {adv.followup === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-3">
                      <div><label className="text-xs font-semibold text-mute">Pesan follow-up (WA)</label><textarea value={advCustom.followupMsg} onChange={(e) => setAdvCustom({...advCustom, followupMsg: e.target.value})} className="field mt-1 bg-white" rows="3" placeholder="Assalamualaikum {{nama}}, terima kasih atas donasi Anda..."/></div>
                      <div><label className="text-xs font-semibold text-mute">Pesan payment sukses</label><textarea value={advCustom.paymentSuccessMsg} onChange={(e) => setAdvCustom({...advCustom, paymentSuccessMsg: e.target.value})} className="field mt-1 bg-white" rows="3" placeholder="Alhamdulillah, donasi Anda sebesar {{nominal}} telah diterima..."/></div>
                    </div>
                  )}
                </div>

                <div>
                  <AdvRadio label="Meta Pixel (Facebook)" value={adv.metaPixel} options={['Default','Custom']} onChange={(v) => setAdv({...adv, metaPixel:v})}/>
                  {adv.metaPixel === 'Default' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line">
                      <div className="flex items-start gap-2 text-[12px] text-mute">
                        <Icon name="pixel" size={15} className="text-brand-600 shrink-0 mt-0.5"/>
                        <span>Mengikuti Meta Pixel global dari <b className="text-ink">Settings &rarr; Tracking &amp; Ads</b>.</span>
                      </div>
                    </div>
                  )}
                  {adv.metaPixel === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-4">
                      <div className="text-[11px] text-mute">Pixel global dimatikan untuk campaign ini. Konfigurasi tracking khusus di bawah.</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FieldToggle label="Meta Pixel Only" value={advCustom.metaPixelEnabled ?? true} onChange={(v) => setAdvCustom({...advCustom, metaPixelEnabled:v})}/>
                        <FieldToggle label="Meta Pixel & Conversion API" value={advCustom.metaCAPIEnabled ?? false} onChange={(v) => setAdvCustom({...advCustom, metaCAPIEnabled:v, metaPixelEnabled: v ? true : (advCustom.metaPixelEnabled ?? true)})}/>
                      </div>
                      <div className={`grid grid-cols-1 ${advCustom.metaCAPIEnabled ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2`}>
                        <div><label className="text-xs font-semibold text-mute">Pixel ID</label><input value={advCustom.metaPixelId} onChange={(e) => setAdvCustom({...advCustom, metaPixelId:e.target.value})} className="field mt-1 bg-white font-mono" placeholder="123456789012345"/></div>
                        {advCustom.metaCAPIEnabled && (
                          <div><label className="text-xs font-semibold text-mute">Secret Token (CAPI)</label><input value={advCustom.metaCAPIToken||''} onChange={(e) => setAdvCustom({...advCustom, metaCAPIToken:e.target.value})} className="field mt-1 bg-white font-mono" placeholder="EAAxxxxx"/></div>
                        )}
                        <div><label className="text-xs font-semibold text-mute">Test Event Code</label><input value={advCustom.metaTestEvent||''} onChange={(e) => setAdvCustom({...advCustom, metaTestEvent:e.target.value})} className="field mt-1 bg-white font-mono" placeholder="TEST12345"/></div>
                      </div>
                      <div className="pt-3 border-t border-line">
                        <div className="text-xs font-bold text-ink mb-2">Event Tracking per Halaman</div>
                        <div className="grid grid-cols-2 gap-3">
                          {[['campaign','Page Campaign'],['form','Page Form'],['invoice','Page Invoice'],['success','Page Success Payment']].map(([k,label]) => (
                            <div key={k}>
                              <label className="text-xs font-semibold text-mute">{label}</label>
                              <select value={advCustom.events?.[k]||''} onChange={(e) => setAdvCustom({...advCustom, events:{...advCustom.events, [k]:e.target.value}})} className="field mt-1 bg-white">
                                {EVENT_OPTS.map(o => <option key={o} value={o}>{o||'Pilih Event'}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <AdvRadio label="Tiktok Pixel" value={adv.tiktokPixel} options={['Default','Custom']} onChange={(v) => setAdv({...adv, tiktokPixel:v})}/>
                  {adv.tiktokPixel === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line">
                      <label className="text-xs font-semibold text-mute">TikTok Pixel ID</label>
                      <input value={advCustom.tiktokPixelId} onChange={(e) => setAdvCustom({...advCustom, tiktokPixelId: e.target.value})} className="field mt-1 bg-white font-mono" placeholder="CIK29JLM3"/>
                    </div>
                  )}
                </div>

                <div>
                  <AdvRadio label="Google Tag Manager" value={adv.gtm} options={['Default','Custom']} onChange={(v) => setAdv({...adv, gtm:v})}/>
                  {adv.gtm === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line">
                      <label className="text-xs font-semibold text-mute">GTM Container ID</label>
                      <input value={advCustom.gtmId} onChange={(e) => setAdvCustom({...advCustom, gtmId: e.target.value})} className="field mt-1 bg-white font-mono" placeholder="GTM-XXXXXXX"/>
                    </div>
                  )}
                </div>

                <AdvRadio label="Social Proof"                         value={adv.socialProof}  options={['Hide','Show']}      onChange={(v) => setAdv({...adv, socialProof:v})}/>
                <AdvRadio label="Popup Info (Form)"                    value={adv.popupInfo}    options={['Hide','Show']}      onChange={(v) => setAdv({...adv, popupInfo:v})}/>
                {adv.popupInfo === 'Show' && (
                  <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-3">
                    <div><label className="text-xs font-semibold text-mute">Judul popup</label>
                      <input value={advCustom.popupTitle || ''} onChange={(e) => setAdvCustom({...advCustom, popupTitle:e.target.value})} className="field mt-1 bg-white" placeholder="Konfirmasi Donasi"/>
                    </div>
                    <div><label className="text-xs font-semibold text-mute">Deskripsi</label>
                      <textarea value={advCustom.popupDesc || ''} onChange={(e) => setAdvCustom({...advCustom, popupDesc:e.target.value})} className="field mt-1 bg-white" rows="2" placeholder="Anda akan berdonasi untuk campaign ini..."/>
                    </div>
                    <div><label className="text-xs font-semibold text-mute">Teks tombol</label>
                      <input value={advCustom.popupButton || 'Ya, Lanjutkan'} onChange={(e) => setAdvCustom({...advCustom, popupButton:e.target.value})} className="field mt-1 bg-white" placeholder="Ya, Lanjutkan"/>
                    </div>
                  </div>
                )}

                <div>
                  <AdvRadio label="Whatsapp Flying Button" value={adv.waFlying} options={['Default','Custom']} onChange={(v) => setAdv({...adv, waFlying:v})}/>
                  {adv.waFlying === 'Custom' && (
                    <div className="mt-3 p-4 rounded-xl bg-bg2 border border-line space-y-3">
                      <div><label className="text-xs font-semibold text-mute">No. WhatsApp</label><input value={advCustom.waFlyingNumber} onChange={(e) => setAdvCustom({...advCustom, waFlyingNumber: e.target.value})} className="field mt-1 bg-white" placeholder="6281234567890"/></div>
                      <div><label className="text-xs font-semibold text-mute">Teks tombol</label><input value={advCustom.waFlyingText} onChange={(e) => setAdvCustom({...advCustom, waFlyingText: e.target.value})} className="field mt-1 bg-white" placeholder="Chat via WhatsApp"/></div>
                    </div>
                  )}
                </div>

                <div>
                  <AdvRadio label="External Link Button" value={adv.extLink} options={['Default','Custom']} onChange={(v) => setAdv({...adv, extLink:v})}/>
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
                <button key={m} onClick={() => setFormMode(m)}
                  className={`flex-1 px-3 py-2 text-sm font-bold rounded-md transition-all ${formMode === m ? 'bg-brand-600 text-white shadow-sm' : 'text-mute hover:text-ink'}`}>
                  {m}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5">
              {['List','Typing','Package','Card','Package2','Qurban'].map((s) => (
                <label key={s} className="inline-flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" checked={formStyle === s} onChange={() => setFormStyle(s)} className="accent-emerald-600 h-4 w-4"/>
                  <span className={formStyle === s ? 'font-bold text-ink' : 'text-ink/85'}>{s === 'Package2' ? 'Package 2' : s}</span>
                </label>
              ))}
            </div>

            {/* Preview */}
            <FormTypePreview style={formStyle}/>

            {formMode === 'Zakat' && (
              <div className="mt-4 pt-4 border-t border-line">
                <div className="font-bold text-ink">Note :</div>
                <p className="text-sm text-ink/80 mt-1 leading-relaxed">
                  Selepas memilih Borang Zakat Fitrah, jangan lupa untuk menambahkan pakej zakat fitrah anda pada :
                  <br/>
                  <span className="font-bold text-brand-600 mt-1 inline-block">Advanced Option &gt; Form &gt; Custom &gt; Zakat Fitrah.</span>
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
                  <option>Uncategorized</option>
                  <option>Medis</option>
                  <option>Pendidikan</option>
                  <option>Wakaf</option>
                  <option>Bencana</option>
                  <option>Ramadan</option>
                  <option>Fidyah</option>
                  <option>Qurban</option>
                  <option>Zakat</option>
                </select>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                <div className="text-mute">Status</div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={status}/>
                  <button className="h-7 w-7 rounded-md hover:bg-bg2 text-mute hover:text-ink flex items-center justify-center"><Icon name="edit" size={13}/></button>
                </div>
              </div>

              {isEdit && (
                <>
                  <EditableUrlRow
                    label="Long URL"
                    prefix="https://niatbaik.org/c/"
                    value={longSlug}
                    onChange={(v) => { setLongSlug(v); setLongTouched(true); }}
                    onCopy={() => showToast('Long URL disalin')}
                    sanitize={(v) => v.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-+|-+$/g,'')}
                    helper="Hanya huruf kecil, angka, dan tanda strip (-)."
                    minLen={3}
                  />
                  <EditableUrlRow
                    label="Short URL"
                    prefix="https://niatbaik.org/c/"
                    value={shortSlug}
                    onChange={setShortSlug}
                    onCopy={() => showToast('Short URL disalin')}
                    sanitize={(v) => v.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0, 16)}
                    helper="Maks 16 karakter alfanumerik. Gunakan untuk iklan & QR code."
                    minLen={4}
                    maxLen={16}
                    short
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

          {/* CS Rotator only in edit mode */}
          {isEdit && (
            <Card className="p-5">
              <div className="font-bold text-ink text-lg mb-3">CS Rotator</div>
              <div className="space-y-2">
                {['Putri Maharani', 'Bagus Santoso'].map((n, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-line">
                    <div className="h-8 w-8 rounded-full bg-sky2-50 text-sky2-600 flex items-center justify-center font-bold text-xs">{n.split(' ').map(s=>s[0]).join('')}</div>
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
function EditableUrlRow({ label, prefix, value, onChange, onCopy, sanitize, helper, minLen = 3, maxLen, short }) {
  const [editing, setEditing] = useStateA(false);
  const [draft, setDraft] = useStateA(value);
  const inputRef = React.useRef();

  useEffectA(() => { if (editing) { setDraft(value); setTimeout(() => inputRef.current?.focus(), 0); } }, [editing]);

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
            <button
              onClick={() => setEditing(true)}
              aria-label={`Edit ${label}`}
              className="shrink-0 h-7 w-7 rounded-md hover:bg-brand-50 text-mute hover:text-brand-600 flex items-center justify-center transition-colors">
              <Icon name="edit" size={13}/>
            </button>
            <button
              onClick={onCopy}
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
                className="w-full px-2.5 py-1.5 font-mono text-sm text-ink focus:outline-none"/>
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

function ThumbUploader({ thumb, icon, onChange }) {
  const fileRef = useRefA();
  const [uploading, setUploading] = useStateA(false);
  const [uploadError, setUploadError] = useStateA('');
  const handleFile = async (e) => {
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
      if (url) onChange(url);
      else setUploadError((res && res.message) ? res.message : 'Upload gagal. Coba lagi.');
    } catch (err) { setUploadError(err?.message || 'Upload gagal. Periksa koneksi.'); }
    setUploading(false);
    e.target.value = '';
  };
  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
      <div onClick={() => fileRef.current?.click()}
        className="aspect-[13/7] rounded-xl bg-bg2 border-2 border-dashed border-line hover:border-brand-400 cursor-pointer overflow-hidden relative group"
        style={thumb && !thumb.startsWith('linear') ? { backgroundImage: `url(${thumb})`, backgroundSize: 'cover', backgroundPosition: 'center' } : thumb ? { background: thumb } : {}}>
        {thumb && !thumb.startsWith('linear') && (
          <img src={thumb} alt="Preview" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }}/>
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

function RichEditor({ value, onChange }) {
  const ref = React.useRef();
  const imgRef = useRefA();
  const savedRange = React.useRef(null);
  const [linkOpen, setLinkOpen] = useStateA(false);
  const [linkUrl, setLinkUrl] = useStateA('');
  const [videoOpen, setVideoOpen] = useStateA(false);
  const [videoUrl, setVideoUrl] = useStateA('');
  const [colorOpen, setColorOpen] = useStateA(false);
  const [preview, setPreview] = useStateA(false);

  useEffectA(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || '';
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
  const exec = (cmd, val) => {
    restoreSel();
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(ref.current.innerHTML);
    saveSel();
  };
  const insertHTML = (html) => {
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
  const handleImgUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const res = await api.uploadImage(f);
      const url = res?.data?.url || res?.url;
      if (url) insertHTML('<img src="' + url + '" style="border-radius:8px;max-width:100%;height:auto;display:block;margin:8px 0"/>');
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
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
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

const AlignIcon = ({ a }) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <rect x="2" y="3" width={a==='full' ? 12 : a==='center' ? 8 : 10} height="1.5" rx="0.5" transform={a==='right' ? 'translate(2 0)' : a==='center' ? 'translate(2 0)' : ''}/>
    <rect x="2" y="7" width="12" height="1.5" rx="0.5"/>
    <rect x="2" y="11" width={a==='full' ? 12 : a==='center' ? 8 : 10} height="1.5" rx="0.5" transform={a==='right' ? 'translate(2 0)' : a==='center' ? 'translate(2 0)' : ''}/>
  </svg>
);

const ListIcon = ({ ordered }) => (
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

function FieldToggle({ label, value, onChange }) {
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

function AdvRadio({ label, sub, value, options, onChange }) {
  // Color hint per option
  const color = (o) => {
    if (o === 'Default' || o === 'Hide') return 'accent-emerald-600';
    return 'accent-emerald-600';
  };
  return (
    <div className="pb-5 border-b border-line last:border-0 last:pb-0">
      <div className="font-bold text-ink">{label}</div>
      {sub && <div className="text-xs text-mute mt-0.5">{sub}</div>}
      <div className="mt-2.5 flex flex-wrap items-center gap-5">
        {options.map((o) => (
          <label key={o} className="inline-flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" checked={value === o} onChange={() => onChange(o)} className={`h-4 w-4 ${color(o)}`}/>
            <span className={value === o ? 'font-bold text-ink' : 'text-ink/80'}>{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FormTypePreview({ style }) {
  const presets = ['Rp', 'Rp', 'Rp', 'Rp', 'OTHER NOMINAL'];
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

window.CampaignEditorView = CampaignEditorView;

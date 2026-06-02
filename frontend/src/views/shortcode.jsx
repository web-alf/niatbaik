function ShortcodeView() {
  const [type, setType] = useStateA('button');
  const [campaign, setCampaign] = useStateA('c-002');
  const [btnStyle, setBtnStyle] = useStateA('solid');
  const [btnColor, setBtnColor] = useStateA('brand');
  const [label, setLabel] = useStateA('Donasi Sekarang');
  const { showToast } = useApp();

  const c = window.NB.campaignSeed.find(x => x.id === campaign);

  const codes = {
    button: `<a href="https://niatbaik.org/c/${campaign}?utm_source=embed" class="nb-btn nb-${btnColor}">${label}</a>\n<script src="https://niatbaik.org/embed.js"></script>`,
    form: `<div class="nb-embed-form" data-campaign="${campaign}"></div>\n<script src="https://niatbaik.org/embed.js"></script>`,
    campaign: `<iframe src="https://niatbaik.org/embed/c/${campaign}" width="100%" height="640" frameborder="0"></iframe>`,
  };

  const copy = () => { navigator.clipboard?.writeText(codes[type]); showToast('Shortcode disalin ke clipboard'); };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shortcode"
        subtitle="Embed campaign, form donasi, atau tombol donasi di website / blog Anda."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: config */}
        <Card className="lg:col-span-2 p-5 space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-mute mb-2">Tipe Embed</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v:'button', label:'Tombol', icon:'bolt' },
                { v:'form',   label:'Form',   icon:'edit' },
                { v:'campaign', label:'Campaign', icon:'megaphone' },
              ].map((o) => (
                <button key={o.v} onClick={() => setType(o.v)}
                  className={`p-3 rounded-xl border text-left transition-colors ${type===o.v ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20' : 'border-line hover:bg-bg2'}`}>
                  <Icon name={o.icon} size={18} className={type===o.v ? 'text-brand-600' : 'text-mute'}/>
                  <div className={'mt-2 font-bold text-sm ' + (type===o.v ? 'text-brand-700' : 'text-ink')}>{o.label}</div>
                  <div className="text-[10px] text-mute leading-tight mt-0.5">{o.v === 'button' ? 'Cocok untuk CTA' : o.v==='form' ? 'Form donasi lengkap' : 'Halaman campaign penuh'}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-mute mb-2">Campaign Tujuan</div>
            <Select value={campaign} onChange={setCampaign} options={window.NB.campaignSeed.map(x => ({ value: x.id, label: x.title }))}/>
          </div>

          {type === 'button' && (
            <>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-mute mb-2">Label Tombol</div>
                <input value={label} onChange={(e) => setLabel(e.target.value)} className="field"/>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-mute mb-2">Style</div>
                <div className="grid grid-cols-3 gap-2">
                  {['solid','outline','ghost'].map((s) => (
                    <button key={s} onClick={() => setBtnStyle(s)}
                      className={`py-2 rounded-lg text-xs font-bold capitalize border ${btnStyle===s ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-ink hover:bg-bg2'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-mute mb-2">Warna</div>
                <div className="flex gap-2">
                  {[
                    { v:'brand', cls:'bg-brand-600' },
                    { v:'sky', cls:'bg-sky2-400' },
                    { v:'ok', cls:'bg-emerald-600' },
                    { v:'warn', cls:'bg-amber-500' },
                    { v:'bad', cls:'bg-rose-600' },
                    { v:'ink', cls:'bg-ink' },
                  ].map((o) => (
                    <button key={o.v} onClick={() => setBtnColor(o.v)}
                      className={`h-9 w-9 rounded-lg ${o.cls} ${btnColor===o.v ? 'ring-2 ring-offset-2 ring-brand-600' : ''}`}/>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="rounded-xl border border-line bg-bg2 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-mute mb-2 flex items-center gap-1.5">
              <Icon name="shield" size={12} className="text-emerald-600"/> Tracking otomatis
            </div>
            <div className="text-xs text-ink/80">UTM source & medium akan dikirim otomatis. Pixel Meta, Google, TikTok yang aktif di Settings akan ditembakkan saat donasi sukses.</div>
          </div>
        </Card>

        {/* Right: preview + code */}
        <div className="lg:col-span-3 space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-mute">Preview</div>
              <Badge tone="ok" dot>Live data</Badge>
            </div>
            <div className="rounded-xl bg-bg2 border border-dashed border-line min-h-[280px] p-6 flex items-center justify-center">
              {type === 'button' && (
                <button className={`px-6 py-3 rounded-xl font-bold transition-all text-base shadow-card ${
                  btnStyle === 'solid' ? `bg-brand-600 text-white hover:bg-brand-700` :
                  btnStyle === 'outline' ? `border-2 border-brand-600 text-brand-600 bg-white hover:bg-brand-50` :
                  `text-brand-600 hover:bg-brand-50 bg-white border border-transparent`
                }`} style={ btnColor !== 'brand' ? { background: btnStyle==='solid' ? ({sky:'#38B6FF',ok:'#16A34A',warn:'#F59E0B',bad:'#DC2626',ink:'#1E293B'}[btnColor]) : undefined, color: btnStyle!=='solid' ? ({sky:'#0E89CC',ok:'#16A34A',warn:'#B45309',bad:'#DC2626',ink:'#1E293B'}[btnColor]) : undefined, borderColor: btnStyle==='outline' ? ({sky:'#38B6FF',ok:'#16A34A',warn:'#F59E0B',bad:'#DC2626',ink:'#1E293B'}[btnColor]) : undefined } : {} }>
                  <span className="inline-flex items-center gap-2"><Icon name="heart" size={18}/> {label}</span>
                </button>
              )}
              {type === 'form' && (
                <div className="bg-white rounded-2xl border border-line p-5 w-full max-w-sm">
                  <div className="text-xs font-bold uppercase text-mute">{c?.category}</div>
                  <div className="font-bold text-ink mt-1 line-clamp-2">{c?.title}</div>
                  <Progress value={c?.raised || 0} max={c?.target || 1} height="h-1.5"/>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[50_000, 100_000, 250_000].map((p) => (
                      <button key={p} className="py-1.5 rounded-md border border-line text-xs font-bold">{fmtIDRShort(p)}</button>
                    ))}
                  </div>
                  <Btn size="md" className="w-full mt-3" icon="heart">Donasi Sekarang</Btn>
                </div>
              )}
              {type === 'campaign' && (
                <div className="bg-white rounded-xl border border-line w-full max-w-md overflow-hidden">
                  <div className="aspect-[16/9]" style={{background: c?.thumb}}>
                    <div className="h-full flex items-center justify-center text-white/80"><Icon name={c?.icon || 'heart'} size={50}/></div>
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-ink line-clamp-2">{c?.title}</div>
                    <div className="mt-2"><Progress value={c?.raised} max={c?.target} height="h-1.5"/></div>
                    <div className="mt-1 flex justify-between text-xs"><span className="text-brand-600 font-bold">{fmtIDRShort(c?.raised)}</span><span className="text-mute">dari {fmtIDRShort(c?.target)}</span></div>
                    <Btn className="w-full mt-2" size="sm" icon="heart">Donasi</Btn>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-mute">Kode Embed</div>
              <Btn size="sm" tone="ink" variant="outline" icon="copy" onClick={copy}>Salin Code</Btn>
            </div>
            <pre className="rounded-xl bg-ink text-emerald-300 text-xs font-mono p-4 overflow-x-auto leading-relaxed">{codes[type]}</pre>
            <div className="mt-3 text-xs text-mute">
              Pasang di tag <code className="bg-bg2 px-1 rounded">&lt;body&gt;</code> halaman Anda.
              Script akan otomatis menjalankan tracking pixel & responsive layout.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

window.ShortcodeView = ShortcodeView;

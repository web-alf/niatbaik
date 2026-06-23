// Payment Gateways dashboard (Admin-only). Read-only health + activity for the two
// gateways NiatBaik uses: Moota (bank-mutation reconcile, inbound webhook) and Flip
// (hosted payment gateway). Pulls from existing endpoints — no new backend:
//   - /settings        → flip_*/moota_* config + derived flip_configured/moota_configured
//   - /settings/moota-balance → live bank balances (outbound Moota API)
//   - /invoices        → recent transactions (filtered to type_payment=Flip)
// The webhook URLs are shown with copy + a reachability test that hits our own endpoint
// the same way the gateway would (empty-body ping for Moota, bad-token probe for Flip),
// so an admin can confirm "our side is reachable" without leaving the panel.
const { useState: uSg, useEffect: uEg } = React;

function gwOrigin() {
  try { return window.location.origin; } catch { return 'https://donasi.niatbaik.org'; }
}
function fmtRpG(n) {
  try { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n) || 0); }
  catch { return 'Rp ' + (Number(n) || 0); }
}

// Small status pill.
function GwBadge({ ok, on = 'Aktif', off = 'Nonaktif' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-400'}`}/>
      {ok ? on : off}
    </span>
  );
}

// One config key/value row.
function GwRow({ label, value, good }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-line/60 last:border-0">
      <span className="text-xs text-mute">{label}</span>
      <span className={`text-xs font-bold ${good === true ? 'text-emerald-600' : good === false ? 'text-rose-600' : 'text-ink'}`}>{value}</span>
    </div>
  );
}

// Webhook URL with copy + reachability test.
function WebhookProbe({ label, url, probe }) {
  const [copied, setCopied] = uSg(false);
  const [testing, setTesting] = uSg(false);
  const [result, setResult] = uSg(null); // {ok, text}

  const copy = () => { try { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  const test = async () => {
    setTesting(true); setResult(null);
    try { setResult(await probe()); }
    catch (e) { setResult({ ok: false, text: 'Gagal: ' + (e?.message || 'error') }); }
    setTesting(false);
  };

  return (
    <div className="mt-1">
      <div className="text-[11px] font-semibold text-mute mb-1">{label}</div>
      <div className="flex items-stretch gap-2">
        <code className="flex-1 min-w-0 truncate rounded-lg bg-bg2 border border-line px-3 py-2 text-[12px] text-ink font-mono">{url}</code>
        <button onClick={copy} className="shrink-0 px-3 rounded-lg border border-line bg-white text-xs font-bold text-brand-600 hover:bg-brand-50">{copied ? 'Tersalin ✓' : 'Salin'}</button>
        <button onClick={test} disabled={testing} className="shrink-0 px-3 rounded-lg border border-brand-200 bg-white text-xs font-bold text-brand-600 hover:bg-brand-50 disabled:opacity-50">{testing ? 'Menguji…' : 'Test URL'}</button>
      </div>
      {result && (
        <div className={`mt-1.5 text-[11px] font-semibold ${result.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{result.text}</div>
      )}
    </div>
  );
}

function GatewaysView() {
  const { showToast, setView } = useApp();
  const [settings, setSettings] = uSg(window.SETTINGS || null);
  const [loading, setLoading] = uSg(!window.SETTINGS);

  // Moota balance
  const [balances, setBalances] = uSg(null);
  const [balLoading, setBalLoading] = uSg(false);
  const [balErr, setBalErr] = uSg('');

  // Flip transactions
  const [flipTxns, setFlipTxns] = uSg(null);
  const [txnLoading, setTxnLoading] = uSg(true);

  uEg(() => {
    let alive = true;
    (async () => {
      try {
        const res = await window.api.settings();
        if (alive && res?.data) { setSettings(res.data); window.SETTINGS = res.data; }
      } catch {}
      if (alive) setLoading(false);
    })();
    (async () => {
      try {
        // Pull recent invoices (default sort = created_at desc), keep the Flip ones.
        // PaginatedResponse puts the array directly under `data`.
        const res = await window.api.invoices('limit=50');
        const rows = (res && res.data) || [];
        const list = Array.isArray(rows) ? rows : [];
        if (alive) setFlipTxns(list.filter(t => String(t.type_payment || '').toLowerCase() === 'flip').slice(0, 8));
      } catch { if (alive) setFlipTxns([]); }
      if (alive) setTxnLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const s = settings || {};
  const origin = gwOrigin();
  const flipOk = !!s.flip_enabled && !!s.flip_configured;
  const mootaOk = !!s.moota_enabled && !!s.moota_configured;

  const fetchBalance = async () => {
    setBalLoading(true); setBalErr('');
    try {
      const res = await window.api.mootaBalance();
      if (res?.data) { setBalances(res.data); }
      else { setBalances([]); setBalErr('Tidak ada saldo dikembalikan. Periksa koneksi / API Key.'); }
    } catch (e) {
      const msg = (e && e.message) ? e.message : 'Gagal cek saldo Moota.';
      setBalErr(msg); showToast && showToast(msg);
    }
    setBalLoading(false);
  };

  // Reachability probes — hit our own endpoint the way the gateway would.
  const probeMoota = async () => {
    const r = await fetch(origin + '/api/webhooks/moota', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '' });
    return r.ok
      ? { ok: true, text: `Endpoint OK (HTTP ${r.status}) — siap menerima callback Moota.` }
      : { ok: false, text: `HTTP ${r.status} — endpoint tidak merespons sebagaimana mestinya.` };
  };
  const probeFlip = async () => {
    // Bad-token probe: a healthy endpoint rejects with 401 (auth aktif). 401 = sehat.
    const r = await fetch(origin + '/api/webhooks/flip', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data={"id":1}&token=__probe__' });
    return r.status === 401
      ? { ok: true, text: 'Endpoint OK (HTTP 401 untuk token salah) — verifikasi token aktif.' }
      : { ok: false, text: `HTTP ${r.status} — diharapkan 401; periksa konfigurasi.` };
  };

  if (loading) {
    return <div className="p-6"><div className="animate-pulse h-40 rounded-2xl bg-bg2"/></div>;
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink flex items-center gap-2"><Icon name="creditcard" size={24} className="text-brand-600"/> Payment Gateways</h1>
        <p className="text-sm text-mute mt-1">Status koneksi, webhook, dan aktivitas gateway pembayaran. Konfigurasi diubah di <button onClick={() => setView && setView('settings')} className="font-semibold text-brand-600 hover:underline">Settings → Payment</button>.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ============ MOOTA ============ */}
        <div className="rounded-2xl bg-white border border-line shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center"><Icon name="wallet" size={18} className="text-emerald-600"/></div>
              <div>
                <div className="font-extrabold text-ink leading-tight">Moota</div>
                <div className="text-[11px] text-mute">Rekonsiliasi mutasi bank</div>
              </div>
            </div>
            <GwBadge ok={mootaOk}/>
          </div>

          <div className="px-5 py-3">
            <GwRow label="Status" value={s.moota_enabled ? 'Diaktifkan' : 'Dimatikan'} good={!!s.moota_enabled}/>
            <GwRow label="API Key" value={s.moota_configured ? 'Terpasang ✓' : 'Belum diisi'} good={!!s.moota_configured}/>
            <GwRow label="Verifikasi Signature" value={s.moota_signature_enabled ? 'ON (aman)' : 'OFF'} good={!!s.moota_signature_enabled}/>
            <GwRow label="Endpoint" value={s.moota_endpoint || 'app.moota.co (default)'}/>
          </div>

          <div className="px-5 pb-4">
            <WebhookProbe label="Webhook URL (set di dashboard Moota)" url={origin + '/api/webhooks/moota'} probe={probeMoota}/>
          </div>

          {/* Saldo bank */}
          <div className="px-5 pb-5">
            <div className="rounded-xl bg-bg2 border border-line p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-bold text-ink">Saldo Bank</div>
                <button onClick={fetchBalance} disabled={balLoading} className="text-xs font-bold text-brand-600 border border-brand-200 bg-white px-3 py-1.5 rounded-lg hover:bg-brand-50 disabled:opacity-50">{balLoading ? 'Mengecek…' : 'Cek Saldo'}</button>
              </div>
              {balErr && <div className="mb-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-[11px] text-rose-700 leading-relaxed">{balErr}</div>}
              {balances && balances.length > 0 && (
                <div className="space-y-2">
                  {balances.map(b => (
                    <div key={b.bank_id || b.account_number} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-line">
                      <div>
                        <div className="text-xs font-bold text-ink">{String(b.bank_type || '').toUpperCase()} <span className="font-normal text-mute ml-1.5">{b.account_number}</span></div>
                        <div className="text-[11px] text-mute">{b.name}</div>
                      </div>
                      <div className="text-sm font-bold text-emerald-600">{fmtRpG(b.balance)}</div>
                    </div>
                  ))}
                </div>
              )}
              {balances && balances.length === 0 && !balErr && (
                <div className="text-[11px] text-mute italic text-center py-2">Belum ada bank terhubung di akun Moota.</div>
              )}
              {!balances && !balErr && <div className="text-[11px] text-mute">Klik “Cek Saldo” untuk menampilkan saldo terkini.</div>}
            </div>
          </div>
        </div>

        {/* ============ FLIP ============ */}
        <div className="rounded-2xl bg-white border border-line shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-brand-100 flex items-center justify-center"><Icon name="bolt" size={18} className="text-brand-600"/></div>
              <div>
                <div className="font-extrabold text-ink leading-tight">Flip</div>
                <div className="text-[11px] text-mute">Gateway pembayaran (QRIS / VA / e-wallet)</div>
              </div>
            </div>
            <GwBadge ok={flipOk}/>
          </div>

          <div className="px-5 py-3">
            <GwRow label="Status" value={s.flip_enabled ? 'Diaktifkan' : 'Dimatikan'} good={!!s.flip_enabled}/>
            <GwRow label="Kredensial" value={s.flip_configured ? 'Terpasang ✓' : 'Belum diisi'} good={!!s.flip_configured}/>
            <GwRow label="Mode" value={(s.flip_mode || 'sandbox') === 'production' ? 'LIVE (Production)' : 'Sandbox (Test)'} good={(s.flip_mode || 'sandbox') === 'production'}/>
            <GwRow label="Auto-redirect" value={s.flip_auto_redirect ? 'ON' : 'OFF'}/>
            <GwRow label="Biaya ditanggung" value={(s.flip_charge_fee || 'merchant') === 'merchant' ? 'Merchant' : 'Donatur'}/>
          </div>

          <div className="px-5 pb-4">
            <WebhookProbe label="Callback URL (set di dashboard Flip — Accept Payment)" url={origin + '/api/webhooks/flip'} probe={probeFlip}/>
          </div>

          {(s.flip_mode || 'sandbox') !== 'production' && (
            <div className="px-5 pb-3">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-700 leading-relaxed">
                Mode <b>Sandbox</b> — transaksi tidak nyata. Ganti ke <b>LIVE</b> di Settings → Payment → Flip saat siap menerima uang asli.
              </div>
            </div>
          )}

          {/* Transaksi Flip terakhir */}
          <div className="px-5 pb-5">
            <div className="text-sm font-bold text-ink mb-2">Transaksi Flip Terakhir</div>
            {txnLoading ? (
              <div className="animate-pulse h-16 rounded-xl bg-bg2"/>
            ) : (flipTxns && flipTxns.length > 0) ? (
              <div className="space-y-1.5">
                {flipTxns.map(t => {
                  const paid = !!t.is_paid || /terbayar|paid|lunas|success/i.test(t.status || '');
                  return (
                    <div key={t.invoice_number} className="flex items-center justify-between bg-bg2 rounded-lg px-3 py-2 border border-line/60">
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold text-ink truncate">{t.invoice_number}</div>
                        <div className="text-[11px] text-mute truncate">{t.donor_name || '—'}</div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs font-bold text-ink">{fmtRpG(t.amount)}</div>
                        <span className={`text-[10px] font-bold ${paid ? 'text-emerald-600' : 'text-amber-600'}`}>{paid ? 'Terbayar' : (t.status || 'Menunggu')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-mute italic text-center py-3 bg-bg2 rounded-xl border border-line/60">Belum ada transaksi Flip.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.GatewaysView = GatewaysView;

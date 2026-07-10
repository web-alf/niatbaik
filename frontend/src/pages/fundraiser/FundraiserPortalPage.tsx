// Fundraiser portal — the fundraiser's OWN view: per-campaign referral links + stats,
// commission balance/history, and a payout (bonus withdrawal) request form. Self-fetches
// from /fundraisers/me; the withdrawal has no campaign_id (drawn from bonus_balance).
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { fmtIDR, fmtNum } from '@/lib/format';
import { exportCSV, exportExcel } from '@/lib/export';
import { useUiStore } from '@/store/ui';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, StatCard, Card, Btn, Icon, Modal } from '@/components';

const REF_BASE = (() => { try { return window.location.origin; } catch { return 'https://donasi.niatbaik.org'; } })();

export default function FundraiserPortalPage() {
  const { user } = useAuth();
  const showToast = useUiStore((s) => s.showToast);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayout, setShowPayout] = useState(false);
  const [ver, setVer] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.fundraiserMine().then((r: any) => { if (alive) setData(r?.data || null); })
      .catch(() => { if (alive) setData(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [ver]);

  const fundraisers = data?.fundraisers || [];
  const commissions = data?.commissions || [];
  const bonusBalance = data?.bonus_balance ?? 0;
  const bonusWithdrawn = data?.bonus_withdrawn ?? 0;
  const totalCommission = data?.total_commission ?? (bonusBalance + bonusWithdrawn);
  const totalRaised = fundraisers.reduce((s: number, f: any) => s + (f.total_raised || 0), 0);
  const totalDonors = fundraisers.reduce((s: number, f: any) => s + (f.total_donors || 0), 0);

  // Referral handle: username (?ref=budi) with the user id as a legacy fallback.
  const refCode = (user as any)?.username || user?.id || '';

  const copyRef = (f: any) => {
    const slug = f.campaign?.slug || '';
    if (!slug) { showToast('Link belum tersedia', 'bad'); return; }
    navigator.clipboard?.writeText(`${REF_BASE}/c/${slug}?ref=${refCode}`);
    showToast('Link referral disalin');
  };

  // Export the per-campaign performance aggregate (no donor PII — fundraisers only see
  // their own totals, matching the /fundraisers/me scope).
  const exportPerf = (kind: 'csv' | 'xls') => {
    const rows = fundraisers.map((f: any) => ({
      campaign: f.campaign?.title || '',
      terkumpul: f.total_raised || 0,
      donatur: f.total_donors || 0,
      klik: f.total_clicks || 0,
      donasi_dibuat: f.invoices_created || 0,
      donasi_lunas: f.invoices_paid || 0,
    }));
    if (!rows.length) { showToast('Belum ada data untuk diekspor'); return; }
    if (kind === 'csv') exportCSV(rows, 'niatbaik_fundraiser');
    else exportExcel(rows, 'niatbaik_fundraiser', undefined, 'Fundraiser');
    showToast(`${rows.length} baris diekspor ke ${kind.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Halo, ${(user?.name || 'Fundraiser').split(' ')[0]} 👋`}
        subtitle="Sebarkan link referral, pantau donasi, dan cairkan komisimu."
        actions={<>
          <Btn variant="outline" tone="ink" icon="refresh" onClick={() => setVer((v) => v + 1)}>Refresh</Btn>
          <Btn variant="outline" tone="ink" icon="download" onClick={() => exportPerf('csv')}>CSV</Btn>
          <Btn variant="outline" tone="ink" icon="download" onClick={() => exportPerf('xls')}>Excel</Btn>
          <Btn tone="brand" icon="wallet" onClick={() => setShowPayout(true)} disabled={bonusBalance < 10000}>Cairkan Komisi</Btn>
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="wallet"   label="Total Donasi"      value={fmtIDR(totalRaised)} accent="brand" sub="dari referralmu"/>
        <StatCard icon="handshake" label="Total Donatur"     value={fmtNum(totalDonors)} accent="ok" sub="via linkmu"/>
        <StatCard icon="sparkle"  label="Komisi Tersedia"   value={fmtIDR(bonusBalance)} accent="warn" sub="siap dicairkan"/>
        <StatCard icon="check"    label="Komisi Dicairkan"  value={fmtIDR(bonusWithdrawn)} accent="sky" sub="sudah ditarik"/>
      </div>

      <Card className="p-5">
        <div className="font-bold text-ink mb-3">Campaign Saya</div>
        {loading ? <div className="text-sm text-mute py-6 text-center">Memuat…</div> :
         fundraisers.length === 0 ? <div className="text-sm text-mute py-6 text-center">Belum ada campaign. Hubungi admin untuk didaftarkan sebagai fundraiser sebuah campaign.</div> : (
          <div className="space-y-3">
            {fundraisers.map((f: any) => (
              <div key={f.id} className="rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-ink truncate">{f.campaign?.title || 'Campaign'}</div>
                    <div className="mt-1 text-xs text-mute">
                      {fmtIDR(f.total_raised || 0)} terkumpul · {fmtNum(f.total_donors || 0)} donatur · {fmtNum(f.invoices_paid || 0)} donasi lunas
                    </div>
                  </div>
                  <Btn size="sm" variant="outline" tone="ink" icon="copy" onClick={() => copyRef(f)}>Salin Link</Btn>
                </div>
                <div className="mt-3 text-[11px] text-mute break-all bg-bg2 rounded-lg px-3 py-2">
                  {REF_BASE}/c/{f.campaign?.slug || ''}?ref={refCode}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-ink">Riwayat Komisi</div>
          <div className="text-sm text-mute">Total: <b className="text-ink">{fmtIDR(totalCommission)}</b></div>
        </div>
        {commissions.length === 0 ? <div className="text-sm text-mute py-6 text-center">Belum ada komisi tercatat.</div> : (
          <div className="space-y-2">
            {commissions.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between text-sm py-2 border-b border-line last:border-0">
                <div>
                  <div className="text-ink">{c.description}</div>
                  <div className="text-xs text-mute">{c.earned_at ? new Date(c.earned_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }) : ''}</div>
                </div>
                <div className="font-bold text-emerald-600">+{fmtIDR(c.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showPayout && (
        <PayoutModal available={bonusBalance} onClose={() => setShowPayout(false)} onDone={() => { setShowPayout(false); setVer(v => v + 1); }}/>
      )}
    </div>
  );
}

function PayoutModal({ available, onClose, onDone }: any) {
  const showToast = useUiStore((s) => s.showToast);
  const [form, setForm] = useState<any>({ amount: '', bank_type: '', bank_number: '', bank_name: '' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amount = parseInt(String(form.amount).replace(/\D/g, ''), 10) || 0;
    if (amount < 10000) { showToast('Minimal penarikan Rp 10.000', 'bad'); return; }
    if (amount > available) { showToast('Jumlah melebihi komisi tersedia', 'bad'); return; }
    if (!form.bank_type.trim() || !form.bank_number.trim() || !form.bank_name.trim()) { showToast('Lengkapi data bank', 'bad'); return; }
    setSaving(true);
    try {
      // No campaign_id → backend treats this as a bonus/commission withdrawal.
      await api.createWithdrawal({ amount, bank_type: form.bank_type.trim(), bank_number: form.bank_number.trim(), bank_name: form.bank_name.trim() });
      showToast('Pengajuan pencairan dikirim');
      onDone && onDone();
    } catch (e: any) { showToast(e?.message || 'Gagal mengajukan pencairan', 'bad'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Cairkan Komisi" size="sm" footer={<>
      <Btn variant="outline" tone="ink" onClick={onClose}>Batal</Btn>
      <Btn tone="brand" icon={saving ? 'refresh' : 'wallet'} onClick={submit} disabled={saving}>{saving ? 'Mengirim…' : 'Ajukan'}</Btn>
    </>}>
      <div className="space-y-3">
        <div className="text-xs text-mute">Komisi tersedia: <b className="text-ink">{fmtIDR(available)}</b></div>
        <div><label className="text-xs font-semibold text-mute">Jumlah (Rp)</label><input className="field mt-1 w-full" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="min. 10.000"/></div>
        <div><label className="text-xs font-semibold text-mute">Bank</label><input className="field mt-1 w-full" value={form.bank_type} onChange={e => setForm({ ...form, bank_type: e.target.value })} placeholder="mis. BCA"/></div>
        <div><label className="text-xs font-semibold text-mute">No. Rekening</label><input className="field mt-1 w-full" value={form.bank_number} onChange={e => setForm({ ...form, bank_number: e.target.value })} placeholder="1234567890"/></div>
        <div><label className="text-xs font-semibold text-mute">Atas Nama</label><input className="field mt-1 w-full" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} placeholder="Nama pemilik rekening"/></div>
      </div>
    </Modal>
  );
}

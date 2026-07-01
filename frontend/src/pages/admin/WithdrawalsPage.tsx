import { useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { fmtIDR, fmtNum } from '@/lib/format';
import { useUiStore } from '@/store/ui';
import { useAdminSync } from '@/lib/useAdminSync';
import { Card, PageHeader, Tabs, StatCard, Btn, Modal, Badge, Icon } from '@/components';

// Withdrawals admin — approve/reject fundraiser & campaign-owner payout requests.
// Backend (already built): GET /withdrawals, POST /withdrawals/:id/approve|reject.
// Approving deducts campaign + foundation balance and records cash-out mutations.
const STATUS_TONE: Record<string, string> = {
  'Dalam Antrian': 'warn', 'Menunggu': 'warn', 'Selesai': 'ok', 'Ditolak': 'bad',
};

export default function WithdrawalsPage() {
  const showToast = useUiStore((s) => s.showToast);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [confirm, setConfirm] = useState<any>(null); // { item, action: 'approve'|'reject' }
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.withdrawals();
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      setItems([]);
      showToast('Gagal memuat penarikan: ' + (e?.message || ''));
    }
    setLoading(false);
  };
  useAdminSync(load);

  const isPending = (s: string) => s === 'Dalam Antrian' || s === 'Menunggu';
  const counts = useMemo(() => ({
    pending: items.filter((i) => isPending(i.status)).length,
    done: items.filter((i) => i.status === 'Selesai').length,
    rejected: items.filter((i) => i.status === 'Ditolak').length,
    all: items.length,
  }), [items]);

  const totalPending = useMemo(
    () => items.filter((i) => isPending(i.status)).reduce((s, i) => s + (i.amount || 0), 0),
    [items],
  );

  const filtered = useMemo(() => {
    if (tab === 'all') return items;
    if (tab === 'pending') return items.filter((i) => isPending(i.status));
    if (tab === 'done') return items.filter((i) => i.status === 'Selesai');
    if (tab === 'rejected') return items.filter((i) => i.status === 'Ditolak');
    return items;
  }, [items, tab]);

  const doAction = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.action === 'approve') await api.approveWithdrawal(confirm.item.id);
      else await api.rejectWithdrawal(confirm.item.id);
      showToast(confirm.action === 'approve' ? 'Penarikan disetujui & dicairkan' : 'Penarikan ditolak');
      await load();
    } catch (e: any) {
      showToast('Gagal: ' + (e?.message || 'Error'));
    }
    setBusy(false);
    setConfirm(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Penarikan Dana" subtitle="Setujui atau tolak pengajuan pencairan dana fundraiser & campaign." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="wallet" label="Menunggu Persetujuan" value={fmtNum(counts.pending)} accent="warn"/>
        <StatCard icon="bolt" label="Total Nominal Pending" value={fmtIDR(totalPending)} accent="brand"/>
        <StatCard icon="check" label="Selesai" value={fmtNum(counts.done)} accent="ok"/>
        <StatCard icon="close" label="Ditolak" value={fmtNum(counts.rejected)} accent="bad"/>
      </div>

      <Card className="p-2">
        <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
          { value: 'pending', label: 'Menunggu', count: counts.pending },
          { value: 'done', label: 'Selesai', count: counts.done },
          { value: 'rejected', label: 'Ditolak', count: counts.rejected },
          { value: 'all', label: 'Semua', count: counts.all },
        ]}/>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-mute border-b border-line bg-bg2/60">
              <th className="px-5 py-3 font-semibold">Pemohon</th>
              <th className="py-3 font-semibold">Campaign</th>
              <th className="py-3 font-semibold">Rekening Tujuan</th>
              <th className="py-3 font-semibold text-right">Nominal</th>
              <th className="py-3 font-semibold">Status</th>
              <th className="pr-5 py-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-5 py-10 text-center text-mute">Memuat…</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-mute">Tidak ada pengajuan.</td></tr>
            )}
            {!loading && filtered.map((w: any) => (
              <tr key={w.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3">
                  <div className="font-semibold text-ink">{w.user?.name || '—'}</div>
                  <div className="text-[11px] text-mute">{w.user?.email || ''}</div>
                </td>
                <td className="py-3 text-ink/90">{w.campaign?.title || '—'}</td>
                <td className="py-3">
                  <div className="text-ink">{w.bank_name} · {w.bank_number}</div>
                  <div className="text-[11px] text-mute">{w.requested_at ? new Date(w.requested_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
                </td>
                <td className="py-3 text-right font-bold text-ink">{fmtIDR(w.amount)}</td>
                <td className="py-3"><Badge tone={STATUS_TONE[w.status] || 'slate'} size="sm">{w.status}</Badge></td>
                <td className="pr-5 py-3">
                  {isPending(w.status) ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <Btn size="sm" icon="check" onClick={() => setConfirm({ item: w, action: 'approve' })}>Setujui</Btn>
                      <Btn size="sm" variant="outline" tone="bad" icon="close" onClick={() => setConfirm({ item: w, action: 'reject' })}>Tolak</Btn>
                    </div>
                  ) : <div className="text-right text-mute text-xs">—</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={!!confirm} onClose={() => setConfirm(null)}
        title={confirm?.action === 'approve' ? 'Setujui Penarikan' : 'Tolak Penarikan'} size="sm"
        footer={<>
          <Btn variant="outline" tone="ink" onClick={() => setConfirm(null)}>Batal</Btn>
          <Btn tone={confirm?.action === 'approve' ? 'brand' : 'bad'} loading={busy}
            icon={confirm?.action === 'approve' ? 'check' : 'close'} onClick={doAction}>
            {confirm?.action === 'approve' ? 'Ya, cairkan' : 'Ya, tolak'}
          </Btn>
        </>}>
        {confirm && (
          <div className="text-sm text-ink/85 space-y-2">
            {confirm.action === 'approve' ? (
              <p>Setujui pencairan <b>{fmtIDR(confirm.item.amount)}</b> ke rekening <b>{confirm.item.bank_name} {confirm.item.bank_number}</b> a.n. {confirm.item.user?.name}? Saldo campaign & yayasan akan otomatis dikurangi.</p>
            ) : (
              <p>Tolak pengajuan penarikan <b>{fmtIDR(confirm.item.amount)}</b> dari <b>{confirm.item.user?.name}</b>?</p>
            )}
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[12px] text-amber-700">
              <Icon name="shield" size={14} className="mt-0.5 shrink-0"/>
              Tindakan ini mempengaruhi saldo dan tidak dapat dibatalkan otomatis.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

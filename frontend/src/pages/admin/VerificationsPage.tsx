import { useState, useEffect } from 'react';
import { api, mediaUrl } from '@/lib/api';
import { fmtNum } from '@/lib/format';
import { useUiStore } from '@/store/ui';
import { Card, PageHeader, StatCard, Btn, Modal, Badge, Icon } from '@/components';

// Verifications (KYC) admin — review pending identity submissions and approve/reject.
// Backend (already built): GET /verifications (users with verification_status pending,
// VerificationDetail preloaded), POST /verifications/:id/approve|reject. Approving sets
// the user's verification_status to "verified" (same "active" state as Members).
export default function VerificationsPage() {
  const showToast = useUiStore((s) => s.showToast);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string>('');     // enlarged KTP image url
  const [confirm, setConfirm] = useState<any>(null);       // { user, action }
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.verifications();
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      setItems([]);
      showToast('Gagal memuat verifikasi: ' + (e?.message || ''));
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const doAction = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.action === 'approve') await api.approveVerification(confirm.user.id);
      else await api.rejectVerification(confirm.user.id);
      showToast(confirm.action === 'approve' ? `${confirm.user.name} terverifikasi` : `Verifikasi ${confirm.user.name} ditolak`);
      await load();
    } catch (e: any) {
      showToast('Gagal: ' + (e?.message || 'Error'));
    }
    setBusy(false);
    setConfirm(null);
  };

  const pending = items.filter((u) => (u.verification_status || u.verification_detail?.status) === 'pending');

  return (
    <div className="space-y-5">
      <PageHeader title="Verifikasi KYC" subtitle="Tinjau dokumen identitas pengaju & setujui untuk mengaktifkan akun." />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon="shield" label="Menunggu Verifikasi" value={fmtNum(items.length)} accent="warn"/>
        <StatCard icon="check" label="Pending (status)" value={fmtNum(pending.length)} accent="brand"/>
        <StatCard icon="users" label="Total Pengaju" value={fmtNum(items.length)} accent="sky"/>
      </div>

      {loading && <Card className="p-10 text-center text-mute">Memuat…</Card>}
      {!loading && items.length === 0 && (
        <Card className="p-10 text-center text-mute">
          <Icon name="shield" size={32} className="mx-auto mb-2 text-mute/50"/>
          Tidak ada pengajuan verifikasi yang menunggu.
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {!loading && items.map((u: any) => {
          const det = u.verification_detail || {};
          const ktp = det.ktp_image ? mediaUrl(det.ktp_image) : '';
          const selfie = det.ktp_selfie ? mediaUrl(det.ktp_selfie) : '';
          return (
            <Card key={u.id} className="p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="font-bold text-ink truncate">{u.name}</div>
                  <div className="text-[11px] text-mute truncate">{u.email}{u.phone ? ' · ' + u.phone : ''}</div>
                </div>
                <Badge tone={(u.verification_status === 'rejected') ? 'bad' : 'warn'} size="sm">{u.verification_status || 'pending'}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[{ src: ktp, label: 'Foto KTP' }, { src: selfie, label: 'Selfie + KTP' }].map((img, i) => (
                  <div key={i}>
                    <div className="text-[10px] uppercase tracking-wider text-mute font-bold mb-1">{img.label}</div>
                    {img.src ? (
                      <button onClick={() => setPreview(img.src)} className="block w-full aspect-[3/2] rounded-lg overflow-hidden border border-line bg-bg2 hover:ring-2 hover:ring-brand-600/30">
                        <img src={img.src} alt={img.label} className="w-full h-full object-cover"/>
                      </button>
                    ) : (
                      <div className="w-full aspect-[3/2] rounded-lg border border-dashed border-line bg-bg2 flex items-center justify-center text-[11px] text-mute">Tidak ada</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Btn size="sm" icon="check" className="flex-1" onClick={() => setConfirm({ user: u, action: 'approve' })}>Setujui</Btn>
                <Btn size="sm" variant="outline" tone="bad" icon="close" className="flex-1" onClick={() => setConfirm({ user: u, action: 'reject' })}>Tolak</Btn>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Image lightbox */}
      <Modal open={!!preview} onClose={() => setPreview('')} title="Pratinjau Dokumen" size="lg"
        footer={<Btn variant="outline" tone="ink" onClick={() => setPreview('')}>Tutup</Btn>}>
        {preview && <img src={preview} alt="Dokumen" className="w-full rounded-lg border border-line"/>}
      </Modal>

      {/* Approve/reject confirm */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)}
        title={confirm?.action === 'approve' ? 'Setujui Verifikasi' : 'Tolak Verifikasi'} size="sm"
        footer={<>
          <Btn variant="outline" tone="ink" onClick={() => setConfirm(null)}>Batal</Btn>
          <Btn tone={confirm?.action === 'approve' ? 'brand' : 'bad'} loading={busy}
            icon={confirm?.action === 'approve' ? 'check' : 'close'} onClick={doAction}>
            {confirm?.action === 'approve' ? 'Ya, verifikasi' : 'Ya, tolak'}
          </Btn>
        </>}>
        {confirm && (
          <div className="text-sm text-ink/85">
            {confirm.action === 'approve'
              ? <p>Setujui identitas <b>{confirm.user.name}</b>? Akun akan menjadi <b>terverifikasi</b> dan aktif penuh.</p>
              : <p>Tolak verifikasi <b>{confirm.user.name}</b>? Status akun dikembalikan ke belum terverifikasi.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}

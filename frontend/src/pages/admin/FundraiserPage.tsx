import { useState } from 'react';
import { fmtNum, fmtIDRShort } from '@/lib/format';
import { exportCSV } from '@/lib/export';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';
import { api } from '@/lib/api';
import { PageHeader, StatCard, Card, SearchInput, Select, Btn, Icon, Modal } from '@/components';

// Fundraiser admin. Rows come from GET /fundraisers (mapped by mapFundraiser in the
// store): name, campaign, raised, txn, txnPaid, donors, clicks. Commission, payout
// status, and a referral code are NOT tracked on model.Fundraiser yet, so they are
// deliberately absent here rather than fabricated — add them once the backend has
// the columns. Created/generated invite passwords are surfaced to the admin.
export default function FundraiserPage() {
  const fundraisers = useDataStore((s) => s.fundraisers);
  const campaigns = useDataStore((s) => s.campaigns);
  const refreshAdmin = useDataStore((s) => s.refreshAdmin);
  const showToast = useUiStore((s) => s.showToast);
  const [search, setSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [invForm, setInvForm] = useState<any>({ name: '', email: '', phone: '', campaign: '' });
  const [createdCreds, setCreatedCreds] = useState<any>(null);

  const total = fundraisers.reduce((s: any, f: any) => s + (f.raised || 0), 0);
  const totalDonors = fundraisers.reduce((s: any, f: any) => s + (f.donors || 0), 0);
  const totalClicks = fundraisers.reduce((s: any, f: any) => s + (f.clicks || 0), 0);

  const filtered = fundraisers
    .filter((f: any) => campaignFilter === 'all' || f.campaignId === campaignFilter)
    .filter((f: any) => !search || (f.name || '').toLowerCase().includes(search.toLowerCase()));

  const handleInvite = async () => {
    if (!invForm.name.trim() || !invForm.email.trim()) { showToast('Nama & email wajib diisi'); return; }
    // Generate a temporary password and SHOW it to the admin (the backend invite email
    // is best-effort and may be off, so the admin needs the credential to share).
    const tempPassword = 'fr-' + Math.random().toString(36).slice(-8);
    setInviting(true);
    try {
      await api.createUser({ name: invForm.name, email: invForm.email, phone: invForm.phone, role: 'fundraiser', password: tempPassword });
      setCreatedCreds({ email: invForm.email, password: tempPassword });
      setShowInvite(false);
      setInvForm({ name: '', email: '', phone: '', campaign: '' });
      await refreshAdmin();
    } catch (e: any) {
      showToast('Gagal mengirim undangan: ' + (e?.message || 'Error'));
    }
    setInviting(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fundraiser"
        subtitle="Mitra fundraiser yang mempromosikan campaign NIATBAIK.ORG."
        actions={<>
          <Btn variant="outline" tone="ink" icon="download" onClick={() => {
            const rows = filtered.map((f: any) => ({
              nama: f.name, email: f.email, campaign: f.campaign,
              transaksi: f.txn, transaksi_terbayar: f.txnPaid, donatur: f.donors,
              klik: f.clicks, terkumpul: f.raised,
            }));
            if (!rows.length) { showToast('Tidak ada data'); return; }
            exportCSV(rows, 'niatbaik_fundraiser');
            showToast(rows.length + ' fundraiser diekspor');
          }}>Export</Btn>
          <Btn icon="plus" onClick={() => setShowInvite(true)}>Undang Fundraiser</Btn>
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="handshake" label="Total Fundraiser" value={fmtNum(fundraisers.length)} accent="brand"/>
        <StatCard icon="wallet" label="Total Donasi (FR)" value={fmtIDRShort(total)} accent="ok"/>
        <StatCard icon="heart" label="Total Donatur" value={fmtNum(totalDonors)} accent="sky"/>
        <StatCard icon="bolt" label="Total Klik Referral" value={fmtNum(totalClicks)} accent="warn"/>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="ml-auto w-full sm:w-auto flex flex-wrap items-center gap-2">
            <SearchInput placeholder="Cari nama fundraiser…" className="w-full sm:w-64" value={search} onChange={setSearch}/>
            <Select value={campaignFilter} onChange={setCampaignFilter} icon="filter"
              options={[{ value: 'all', label: 'Semua campaign' }, ...(campaigns || []).map((c: any) => ({ value: c.id, label: c.title }))]}/>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-mute border-b border-line bg-bg2/60">
              <th className="px-5 py-3 font-semibold">Fundraiser</th>
              <th className="py-3 font-semibold">Campaign</th>
              <th className="py-3 font-semibold text-right">Klik</th>
              <th className="py-3 font-semibold text-right">Transaksi</th>
              <th className="py-3 font-semibold text-right">Donatur</th>
              <th className="pr-5 py-3 font-semibold text-right">Terkumpul</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-mute">Belum ada fundraiser.</td></tr>
            )}
            {filtered.map((f: any) => (
              <tr key={f.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                      {(f.name || '?').split(' ').map((s: any) => s[0] || '').join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-ink">{f.name || '—'}</div>
                      <div className="text-[11px] text-mute">{f.email || ''}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-ink/90">{f.campaign || '—'}</td>
                <td className="py-3 text-right">{fmtNum(f.clicks)}</td>
                <td className="py-3 text-right">{fmtNum(f.txn)}</td>
                <td className="py-3 text-right">{fmtNum(f.donors)}</td>
                <td className="pr-5 py-3 text-right font-bold text-ink">{fmtIDRShort(f.raised)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Invite modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Undang Fundraiser" size="md"
        footer={<>
          <Btn variant="outline" tone="ink" onClick={() => setShowInvite(false)}>Batal</Btn>
          <Btn icon="plus" onClick={handleInvite} loading={inviting}>Buat Akun Fundraiser</Btn>
        </>}>
        <div className="space-y-3">
          <div><label className="text-xs font-semibold text-mute">Nama</label><input className="field mt-1" value={invForm.name} onChange={(e) => setInvForm({ ...invForm, name: e.target.value })} placeholder="Nama fundraiser"/></div>
          <div><label className="text-xs font-semibold text-mute">Email</label><input className="field mt-1" value={invForm.email} onChange={(e) => setInvForm({ ...invForm, email: e.target.value })} placeholder="email@domain.com"/></div>
          <div><label className="text-xs font-semibold text-mute">No. HP</label><input className="field mt-1" value={invForm.phone} onChange={(e) => setInvForm({ ...invForm, phone: e.target.value })} placeholder="08xxx"/></div>
          <div className="text-[11px] text-mute">Akun fundraiser dibuat dengan password sementara yang akan ditampilkan setelah dibuat — bagikan ke fundraiser agar bisa login.</div>
        </div>
      </Modal>

      {/* Generated-credential reveal (the admin must copy this; it isn't stored in plaintext). */}
      <Modal open={!!createdCreds} onClose={() => setCreatedCreds(null)} title="Akun Fundraiser Dibuat" size="sm"
        footer={<Btn onClick={() => setCreatedCreds(null)}>Selesai</Btn>}>
        {createdCreds && (
          <div className="space-y-3 text-sm">
            <div className="text-ink/85">Bagikan kredensial berikut ke fundraiser. Password ini tidak akan ditampilkan lagi.</div>
            <div className="rounded-lg bg-bg2 border border-line p-3 font-mono text-xs space-y-1">
              <div><span className="text-mute">Email:</span> {createdCreds.email}</div>
              <div><span className="text-mute">Password:</span> {createdCreds.password}</div>
            </div>
            <Btn size="sm" variant="outline" tone="ink" icon="copy" onClick={() => {
              navigator.clipboard?.writeText(`Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`);
              showToast('Kredensial disalin');
            }}>Salin kredensial</Btn>
          </div>
        )}
      </Modal>
    </div>
  );
}

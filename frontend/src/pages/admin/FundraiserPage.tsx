import { useState } from 'react';
import { fmtNum, fmtIDRShort } from '@/lib/format';
import { exportCSV, exportExcel } from '@/lib/export';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { PageHeader, StatCard, Card, SearchInput, Select, Btn, Icon, Modal } from '@/components';

// Fundraiser admin. Rows come from GET /fundraisers (mapped by mapFundraiser in the
// store): name, campaign, raised, txn, txnPaid, donors, clicks, commission,
// pendingPayout, ref. Commission/payout are derived from the referrer's bonus ledger
// (User.bonus_balance + bonus_withdrawn); the referral code is the fundraiser's user
// id (?ref=<id> share link). The Detail modal pulls real commission history from
// GET /fundraisers/:id. Created invite passwords are surfaced to the admin.
const REF_BASE = (() => { try { return window.location.origin; } catch { return 'https://donasi.niatbaik.org'; } })();

export default function FundraiserPage() {
  const fundraisers = useDataStore((s) => s.fundraisers);
  const campaigns = useDataStore((s) => s.campaigns);
  const refreshAdmin = useDataStore((s) => s.refreshAdmin);
  const showToast = useUiStore((s) => s.showToast);
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [invForm, setInvForm] = useState<any>({ name: '', email: '', phone: '', campaign: '' });
  const [createdCreds, setCreatedCreds] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);     // { fundraiser, commissions[], total_commission }
  const [detailLoading, setDetailLoading] = useState(false);

  const total = fundraisers.reduce((s: any, f: any) => s + (f.raised || 0), 0);
  const totalDonors = fundraisers.reduce((s: any, f: any) => s + (f.donors || 0), 0);
  const totalComm = fundraisers.reduce((s: any, f: any) => s + (f.commission || 0), 0);

  const openDetail = async (f: any) => {
    setDetail({ fundraiser: f, commissions: [], total_commission: f.commission || 0, _loading: true });
    setDetailLoading(true);
    try {
      const res = await api.fundraiser(f.id);
      const d: any = res?.data || {};
      setDetail({ fundraiser: f, commissions: d.commissions || [], total_commission: d.total_commission ?? f.commission ?? 0 });
    } catch (e: any) {
      showToast('Gagal memuat detail: ' + (e?.message || 'Error'));
      setDetail({ fundraiser: f, commissions: [], total_commission: f.commission || 0 });
    }
    setDetailLoading(false);
  };

  const copyRef = (f: any) => {
    if (!f.ref) { showToast('Kode referral belum tersedia'); return; }
    navigator.clipboard?.writeText(`${REF_BASE}/c/${f.campaignSlug || ''}?ref=${f.ref}`);
    showToast('Link referral disalin');
  };

  const filtered = fundraisers
    .filter((f: any) => campaignFilter === 'all' || f.campaignId === campaignFilter)
    .filter((f: any) => !search || (f.name || '').toLowerCase().includes(search.toLowerCase()));

  const handleInvite = async () => {
    if (!invForm.name.trim() || !invForm.email.trim()) { showToast('Nama & email wajib diisi', 'bad'); return; }
    // Campaign is required — a fundraiser is tied to a specific campaign (the affiliate
    // record). Without it the invite created a user but no Fundraiser record, so the list
    // stayed empty and referral stats never attributed.
    if (!invForm.campaign) { showToast('Pilih campaign untuk fundraiser ini', 'bad'); return; }
    // Generate a temporary password and SHOW it to the admin (the backend invite email
    // is best-effort and may be off, so the admin needs the credential to share).
    const tempPassword = 'fr-' + Math.random().toString(36).slice(-8);
    setInviting(true);
    try {
      // createFundraiser creates BOTH the user and the campaign affiliate record.
      await api.createFundraiser({ name: invForm.name, email: invForm.email, phone: invForm.phone, password: tempPassword, campaign_id: invForm.campaign });
      setCreatedCreds({ email: invForm.email, password: tempPassword });
      setShowInvite(false);
      setInvForm({ name: '', email: '', phone: '', campaign: '' });
      await refreshAdmin();
    } catch (e: any) {
      showToast('Gagal mengirim undangan: ' + (e?.message || 'Error'), 'bad');
    }
    setInviting(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fundraiser"
        subtitle="Mitra fundraiser yang mempromosikan campaign NIATBAIK.ORG."
        actions={<>
          {(['csv', 'xls'] as const).map((kind) => (
            <Btn key={kind} variant={kind === 'csv' ? 'outline' : undefined} tone="ink" icon="download" onClick={() => {
              const rows = filtered.map((f: any) => ({
                nama: f.name, email: f.email, campaign: f.campaign,
                transaksi: f.txn, transaksi_terbayar: f.txnPaid, donatur: f.donors,
                klik: f.clicks, terkumpul: f.raised,
                komisi: f.commission, komisi_pending: f.pendingPayout, ref: f.ref,
              }));
              if (!rows.length) { showToast('Tidak ada data'); return; }
              if (kind === 'csv') exportCSV(rows, 'niatbaik_fundraiser');
              else exportExcel(rows, 'niatbaik_fundraiser', undefined, 'Fundraiser');
              showToast(rows.length + ' fundraiser diekspor');
            }}>{kind === 'csv' ? 'CSV' : 'Excel'}</Btn>
          ))}
          {/* Inviting a fundraiser calls POST /users, which is admin-only. CS can view the
              list but not create, so the button is hidden for non-admins (was 403'ing). */}
          {role === 'Admin' && <Btn icon="plus" onClick={() => setShowInvite(true)}>Undang Fundraiser</Btn>}
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="handshake" label="Total Fundraiser" value={fmtNum(fundraisers.length)} accent="brand"/>
        <StatCard icon="wallet" label="Total Donasi (FR)" value={fmtIDRShort(total)} accent="ok"/>
        <StatCard icon="heart" label="Total Donatur" value={fmtNum(totalDonors)} accent="sky"/>
        <StatCard icon="star" label="Total Komisi" value={fmtIDRShort(totalComm)} accent="warn"/>
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
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-mute border-b border-line bg-bg2/60">
              <th className="px-5 py-3 font-semibold">Fundraiser</th>
              <th className="py-3 font-semibold">Campaign</th>
              <th className="py-3 font-semibold text-right">Transaksi</th>
              <th className="py-3 font-semibold text-right">Donatur</th>
              <th className="py-3 font-semibold text-right">Terkumpul</th>
              <th className="py-3 font-semibold text-right">Komisi</th>
              <th className="py-3 font-semibold text-right">Pending</th>
              <th className="pr-5 py-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-mute">Belum ada fundraiser.</td></tr>
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
                <td className="py-3 text-right">{fmtNum(f.txn)}</td>
                <td className="py-3 text-right">{fmtNum(f.donors)}</td>
                <td className="py-3 text-right font-bold text-ink">{fmtIDRShort(f.raised)}</td>
                <td className="py-3 text-right">{fmtIDRShort(f.commission)}</td>
                <td className="py-3 text-right">{f.pendingPayout > 0 ? <span className="text-amber-600 font-semibold">{fmtIDRShort(f.pendingPayout)}</span> : <span className="text-mute">—</span>}</td>
                <td className="pr-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button title="Detail komisi" className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-brand-600" onClick={() => openDetail(f)}><Icon name="eye" size={16}/></button>
                    <button title="Salin link referral" className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink" onClick={() => copyRef(f)}><Icon name="link" size={16}/></button>
                  </div>
                </td>
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
          <div>
            <label className="text-xs font-semibold text-mute">Campaign</label>
            <Select value={invForm.campaign} onChange={(v: string) => setInvForm({ ...invForm, campaign: v })} options={[
              { value: '', label: 'Pilih campaign…' },
              ...campaigns.map((c: any) => ({ value: c.id, label: c.title })),
            ]}/>
          </div>
          <div className="text-[11px] text-mute">Akun fundraiser dibuat dengan password sementara yang akan ditampilkan setelah dibuat — bagikan ke fundraiser agar bisa login. Fundraiser terikat ke campaign yang dipilih.</div>
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

      {/* Detail modal — real commission history from GET /fundraisers/:id */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Fundraiser" size="md"
        footer={<Btn variant="outline" tone="ink" onClick={() => setDetail(null)}>Tutup</Btn>}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-ink">{detail.fundraiser.name}</div>
                <div className="text-xs text-mute">{detail.fundraiser.email} · {detail.fundraiser.campaign || 'Semua campaign'}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-mute font-bold">Total Komisi</div>
                <div className="text-lg font-extrabold text-emerald-600">{fmtIDRShort(detail.total_commission)}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-bg2 p-2.5"><div className="text-[10px] text-mute uppercase">Terkumpul</div><div className="font-bold text-ink text-sm">{fmtIDRShort(detail.fundraiser.raised)}</div></div>
              <div className="rounded-lg bg-bg2 p-2.5"><div className="text-[10px] text-mute uppercase">Donatur</div><div className="font-bold text-ink text-sm">{fmtNum(detail.fundraiser.donors)}</div></div>
              <div className="rounded-lg bg-bg2 p-2.5"><div className="text-[10px] text-mute uppercase">Pending</div><div className="font-bold text-amber-600 text-sm">{fmtIDRShort(detail.fundraiser.pendingPayout)}</div></div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-mute font-semibold mb-2">Riwayat Komisi</div>
              {detailLoading ? (
                <div className="text-sm text-mute py-4 text-center">Memuat…</div>
              ) : (detail.commissions || []).length === 0 ? (
                <div className="text-sm text-mute py-4 text-center">Belum ada komisi tercatat.</div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {detail.commissions.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-line/60 px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm text-ink truncate">{c.description || 'Komisi donasi'}</div>
                        <div className="text-[11px] text-mute">{c.earned_at ? new Date(c.earned_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
                      </div>
                      <div className="font-bold text-emerald-600 shrink-0">{fmtIDRShort(c.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

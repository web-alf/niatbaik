import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';
import { exportCSV } from '@/lib/export';
import { useAdminSync } from '@/lib/useAdminSync';
import { ROLE_META } from '@/lib/nav';
import { Card, PageHeader, Tabs, Btn, SearchInput, RoleBadge, Modal, Icon } from '@/components';

const mapUser = (u: any) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: ((r) => r === 'Cs' ? 'CS' : r)((u.role || 'user').charAt(0).toUpperCase() + (u.role || 'user').slice(1)),
  lastLogin: u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Belum pernah',
  joined: u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-',
});

export default function MembersPage() {
  const showToast = useUiStore((s) => s.showToast);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDel, setConfirmDel] = useState<any>(null);

  const [addForm, setAddForm] = useState<any>({ name:'', email:'', phone:'', role:'admin', password:'' });
  const [addErrors, setAddErrors] = useState<any>({});
  const [addLoading, setAddLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.users('limit=500');
      const list = (res?.data || []).map(mapUser);
      setMembers(list);
    } catch {
      setMembers((useDataStore.getState().users || []).map(mapUser));
    }
    setLoading(false);
  };
  useAdminSync(load);

  useEffect(() => {
    if (editing) setAddForm({ name: editing.name, email: editing.email, phone: editing.phone || '', role: editing.role.toLowerCase(), password: '' });
    else setAddForm({ name:'', email:'', phone:'', role:'admin', password:'' });
    setAddErrors({});
    setShowPwd(false);
  }, [editing, showAdd]);

  const filtered = useMemo(() => {
    return members.filter(m => {
      if (tab !== 'all' && m.role !== tab) return false;
      if (q) {
        const query = q.toLowerCase();
        return m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query);
      }
      return true;
    });
  }, [members, tab, q]);

  const handleSaveUser = async () => {
    const e: any = {};
    if (!addForm.name.trim()) e.name = 'Nama wajib diisi';
    if (!addForm.email.trim()) e.email = 'Email wajib diisi';
    // On create the password is required; on edit it's optional (blank = unchanged).
    // Either way, if a value is present it must be ≥8 chars.
    if (!editing && !addForm.password.trim()) e.password = 'Password wajib diisi (min 8 karakter)';
    if (addForm.password && addForm.password.length < 8) e.password = 'Password minimal 8 karakter';
    setAddErrors(e);
    if (Object.keys(e).length) return;
    setAddLoading(true);
    try {
      if (editing) {
        const patch: any = { name: addForm.name, email: addForm.email, phone: addForm.phone, role: addForm.role };
        // Only send password when the admin actually typed a new one — an empty field
        // leaves the current password untouched (backend treats "" as unchanged).
        if (addForm.password.trim()) patch.password = addForm.password;
        await api.updateUser(editing.id, patch);
        showToast(addForm.password.trim() ? 'User & password berhasil diupdate' : 'User berhasil diupdate');
      } else {
        await api.createUser({ name: addForm.name, email: addForm.email, phone: addForm.phone, role: addForm.role, password: addForm.password });
        showToast('User berhasil ditambahkan');
      }
      setShowAdd(false); setEditing(null);
      load();
    } catch (err: any) { showToast('Gagal: ' + (err?.message || '')); }
    setAddLoading(false);
  };

  const handleDeleteUser = async () => {
    try {
      await api.deleteUser(confirmDel.id);
      showToast('User dipindah ke trash');
      setConfirmDel(null);
      load();
    } catch { showToast('Gagal menghapus user'); }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Members / User"
        subtitle="Tim NIATBAIK.ORG · Admin, CS, dan Advertiser."
        actions={<>
          <Btn variant="outline" tone="ink" icon="download" onClick={() => {
            const rows = filtered.map(m => ({ nama: m.name, email: m.email, role: m.role, last_login: m.lastLogin }));
            exportCSV(rows, 'niatbaik_users');
            showToast(rows.length + ' user diekspor');
          }}>Export</Btn>
          <Btn icon="plus" onClick={() => { setEditing(null); setShowAdd(true); }}>Add User</Btn>
        </>}
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs variant="underline" value={tab} onChange={setTab} tabs={[
            { value:'all',          label:'Semua',      count: members.length },
            { value:'Admin',        label:'Admin',      count: members.filter(m=>m.role==='Admin').length },
            { value:'CS',           label:'CS',         count: members.filter(m=>m.role==='CS').length },
            { value:'Advertiser',   label:'Advertiser', count: members.filter(m=>m.role==='Advertiser').length },
            { value:'Fundraiser',   label:'Fundraiser', count: members.filter(m=>m.role==='Fundraiser').length },
          ]}/>
          <div className="ml-auto w-full sm:w-auto"><SearchInput placeholder="Cari nama / email…" value={q} onChange={setQ} className="w-full sm:w-64"/></div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-mute border-b border-line bg-bg2/60">
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="py-3 font-semibold">Role</th>
              <th className="py-3 font-semibold">Last Login</th>
              <th className="pr-5 py-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-mute">Memuat data…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-mute">Tidak ada user ditemukan.</td></tr>
            ) : filtered.map((m) => (
              <tr key={m.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full text-white font-bold text-xs flex items-center justify-center ${ROLE_META[m.role]?.color || (m.role==='Fundraiser' ? 'bg-emerald-600' : 'bg-slate-500')}`}>
                      {m.name.split(' ').map((s: any)=>s[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="font-semibold text-ink">{m.name}</div>
                      <div className="text-xs text-mute">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3"><RoleBadge role={m.role}/></td>
                <td className="py-3 text-mute">{m.lastLogin}</td>
                <td className="pr-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button title="Edit user" className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-ink" onClick={() => { setEditing(m); setShowAdd(true); }}><Icon name="edit" size={16}/></button>
                    <button title="Hapus user" className="h-8 w-8 rounded-md hover:bg-bg2 text-mute hover:text-rose-600" onClick={() => setConfirmDel(m)}><Icon name="trash" size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Permission matrix */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-ink">Permission Matrix</div>
            <div className="text-xs text-mute mt-0.5">Akses per role · klik untuk mengubah.</div>
          </div>
          <Btn size="sm" variant="ghost" tone="ink" icon="edit">Edit permissions</Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-mute">
                <th className="py-2 font-semibold">Permission</th>
                <th className="py-2 font-semibold text-center">Admin</th>
                <th className="py-2 font-semibold text-center">CS</th>
                <th className="py-2 font-semibold text-center">Advertiser</th>
              </tr>
            </thead>
            <tbody>
              {[
                { p:'Dashboard', a:1, c:1, ad:1 },
                { p:'Kelola Campaign', a:1, c:0, ad:0 },
                { p:'Publish/Edit Campaign', a:1, c:0, ad:0 },
                { p:'Lihat Transaksi', a:1, c:1, ad:1 },
                { p:'Lihat data sensitif donatur (full)', a:1, c:1, ad:0 },
                { p:'Update status invoice', a:1, c:1, ad:0 },
                { p:'Kirim follow-up WA', a:1, c:1, ad:0 },
                { p:'Kelola Payment Method', a:1, c:0, ad:0 },
                { p:'Akses Analytics & UTM', a:1, c:0, ad:1 },
                { p:'Manage Tracking Pixel', a:1, c:0, ad:1 },
                { p:'Export full data', a:1, c:0, ad:0 },
                { p:'Export terbatas (CSV ringkas)', a:1, c:1, ad:1 },
                { p:'Kelola Members & Role', a:1, c:0, ad:0 },
                { p:'Akses Trash & Restore', a:1, c:0, ad:0 },
              ].map((r, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="py-2.5 text-ink font-medium">{r.p}</td>
                  {[r.a, r.c, r.ad].map((v, j) => (
                    <td key={j} className="py-2.5 text-center">
                      {v ? <span className="inline-flex h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center"><Icon name="check" size={14} strokeWidth={2.5}/></span>
                         : <span className="inline-flex h-6 w-6 rounded-full bg-slate-100 text-slate-400 items-center justify-center"><Icon name="close" size={14}/></span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit User Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditing(null); }} title={editing ? 'Edit User' : 'Tambah User Baru'} size="md"
        footer={<>
          <Btn variant="outline" tone="ink" onClick={() => { setShowAdd(false); setEditing(null); }}>Batal</Btn>
          <Btn onClick={handleSaveUser} loading={addLoading}>{editing ? 'Simpan' : 'Kirim Undangan'}</Btn>
        </>}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-mute">Nama lengkap</label>
            <input className={`field mt-1 ${addErrors.name ? 'border-rose-500' : ''}`} placeholder="Nama user"
              value={addForm.name} onChange={(e) => setAddForm({...addForm, name: e.target.value})}/>
            {addErrors.name && <div className="text-xs text-rose-500 mt-1">{addErrors.name}</div>}
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Email</label>
            <input className={`field mt-1 ${addErrors.email ? 'border-rose-500' : ''}`} placeholder="email@niatbaik.org"
              value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})}/>
            {addErrors.email && <div className="text-xs text-rose-500 mt-1">{addErrors.email}</div>}
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Telepon</label>
            <input className="field mt-1" placeholder="08xxxxxxxxxx"
              value={addForm.phone} onChange={(e) => setAddForm({...addForm, phone: e.target.value})}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">Role</label>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['admin','cs','advertiser','fundraiser'].map((r) => (
                <button key={r} type="button" onClick={() => setAddForm({...addForm, role: r})}
                  className={`py-2 rounded-lg border text-sm font-bold ${addForm.role === r ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line hover:bg-bg2'}`}>
                  {r === 'cs' ? 'CS' : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-mute">
              {editing ? 'Password baru' : 'Password'}
              {editing && <span className="font-normal normal-case"> · opsional</span>}
            </label>
            <div className="relative mt-1">
              <input type={showPwd ? 'text' : 'password'} className={`field pr-10 ${addErrors.password ? 'border-rose-500' : ''}`} value={addForm.password} onChange={(e) => setAddForm({...addForm, password: e.target.value})} placeholder={editing ? 'Kosongkan jika tidak diubah' : 'Min 8 karakter'}/>
              <button type="button" onClick={() => setShowPwd(!showPwd)} aria-label={showPwd ? 'Sembunyikan' : 'Tampilkan'}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-bg2 flex items-center justify-center text-mute">
                <Icon name="eye" size={14} className={showPwd ? 'text-brand-600' : ''}/>
              </button>
            </div>
            {addErrors.password && <div className="text-xs text-rose-500 mt-1">{addErrors.password}</div>}
            <div className="text-[10px] text-mute mt-1">
              {editing ? 'Mengganti password akan mengeluarkan user dari sesi login yang aktif.' : 'Detail login dikirim ke email user (jika SMTP aktif)'}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Hapus User" size="sm"
        footer={<>
          <Btn variant="outline" tone="ink" onClick={() => setConfirmDel(null)}>Batal</Btn>
          <Btn tone="bad" icon="trash" onClick={handleDeleteUser}>Hapus</Btn>
        </>}>
        <div className="text-sm text-ink/85">
          Hapus <b>{confirmDel?.name}</b> ({confirmDel?.email})? User akan dipindah ke Trash.
        </div>
      </Modal>
    </div>
  );
}

import { useState, useEffect, useMemo, useRef } from 'react';
import { api, mediaUrl } from '@/lib/api';
import { fmtNum } from '@/lib/format';
import { useUiStore } from '@/store/ui';
import { useAuth } from '@/context/AuthContext';
import { Card, PageHeader, Btn, Badge, RoleBadge, Icon } from '@/components';

const timeAgo = (dateStr: string) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return mins + ' menit lalu';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + ' jam lalu';
  const days = Math.floor(hrs / 24);
  return days <= 1 ? 'kemarin' : days + ' hari lalu';
};
const mapActivityIcon = (action: string) => {
  if (!action) return 'bolt';
  if (action.includes('login')) return 'shield';
  if (action.includes('password')) return 'shield';
  if (action.includes('profile')) return 'edit';
  if (action.includes('campaign')) return 'megaphone';
  if (action.includes('invoice')) return 'check';
  if (action.includes('export')) return 'download';
  return 'bolt';
};
const mapActivityTone = (action: string) => {
  if (!action) return 'slate';
  if (action.includes('login')) return 'ok';
  if (action.includes('password')) return 'ok';
  if (action.includes('profile')) return 'brand';
  if (action.includes('campaign')) return 'brand';
  return 'slate';
};

export default function ProfilePage() {
  const { role, user, logout, updateUser } = useAuth();
  const showToast = useUiStore((s) => s.showToast);

  // Per-role fallback meta (extra fields not in session)
  const defaults: any = {
    Admin:      { wa: '+62 812 3456 7890', joined: '12 Jan 2025' },
    CS:         { wa: '+62 813 9876 5432', joined: '08 Mar 2025' },
    Advertiser: { wa: '+62 821 5566 7788', joined: '21 Apr 2025' },
  };
  const meBase: any = user || { name:'-', email:'-', role: role, initial:'??' };
  const fb = defaults[role] || defaults.Admin;

  // Computed display values (read from session if present, else fallback)
  const display = {
    name:   meBase.name,
    email:  meBase.email,
    wa:     meBase.wa     || meBase.phone || fb.wa,
    // Avatar comes from user.image (the persisted /uploads path from /auth/me), resolved
    // through mediaUrl. Older code read a non-existent `avatar` key, so it never showed.
    avatar: meBase.image ? mediaUrl(meBase.image) : null,
    joined: meBase.joined || fb.joined,
    initial: meBase.initial,
  };

  // -------- Edit state --------
  const [editing, setEditing] = useState(false);
  // form.avatar = display URL (for the <img> preview); form.imagePath = the RAW stored
  // value we send to the server (/uploads/<uuid>.ext or '' to clear).
  const [form, setForm]       = useState<any>({ name: display.name, email: display.email, wa: display.wa, avatar: display.avatar, imagePath: meBase.image || '' });
  const [errors, setErrors]   = useState<any>({});
  const [saving, setSaving]   = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = api?.getToken?.();
    if (!token) return;
    const headers = { 'Authorization': 'Bearer ' + token };
    fetch('/api/profile/activity', { headers }).then(r => r.json()).then(res => {
      if (res?.data) setActivityLog(res.data.map((a: any) => ({
        t: a.description || a.action,
        when: timeAgo(a.created_at),
        icon: mapActivityIcon(a.action),
        tone: mapActivityTone(a.action),
      })));
    }).catch(() => {});
    fetch('/api/profile/logins', { headers }).then(r => r.json()).then(res => {
      if (res?.data && Array.isArray(res.data)) setLoginHistory(res.data.map((l: any) => {
        const ts = l.logged_in_at || l.created_at || '';
        const isZero = !ts || ts.startsWith('0001') || new Date(ts).getFullYear() < 2020;
        const ua = l.user_agent || '';
        let device = l.device;
        if (!device || device === ' · ') {
          const br = ua.includes('Chrome') && !ua.includes('Edg') ? 'Chrome' : ua.includes('Edg') ? 'Edge' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Browser';
          const os = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : ua.includes('Android') ? 'Android' : ua.includes('iPhone') ? 'iOS' : 'Unknown';
          device = br + ' · ' + os;
        }
        return {
          d: device,
          ip: (l.ip || l.ip_address || 'Unknown') + (l.location ? ' · ' + l.location : ''),
          when: isZero ? 'tidak diketahui' : timeAgo(ts),
          current: !!l.is_current,
        };
      }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editing) setForm({ name: display.name, email: display.email, wa: display.wa, avatar: display.avatar, imagePath: meBase.image || '' });
    // eslint-disable-next-line
  }, [editing, user?.email]);

  const initialsFrom = (n: string) => (n || '').split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '??';

  const validate = () => {
    const e: any = {};
    if (!form.name.trim()) e.name = 'Nama wajib diisi';
    else if (form.name.trim().length < 3) e.name = 'Minimal 3 karakter';
    if (!form.email.trim()) e.email = 'Email wajib diisi';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = 'Format email tidak valid';
    if (!form.wa.trim()) e.wa = 'No. WhatsApp wajib diisi';
    else if (form.wa.replace(/\D/g,'').length < 9) e.wa = 'No. WhatsApp tidak valid';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) { showToast('Periksa kembali isian Anda'); return; }
    setSaving(true);
    try {
      // Persist server-side. `image` is the raw /uploads path (backend column), NOT the
      // display URL. Then re-read /auth/me so the local user reflects what was saved.
      await api?.updateProfile?.({ name: form.name.trim(), email: form.email.trim(), phone: form.wa.trim(), image: form.imagePath || '' });
      try {
        const me: any = await api.me();
        if (me?.data) updateUser(me.data);
      } catch { updateUser({ name: form.name.trim(), email: form.email.trim(), phone: form.wa.trim(), image: form.imagePath || '' }); }
      showToast('Profil berhasil disimpan');
      setEditing(false);
    } catch {
      showToast('Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setForm({ name: display.name, email: display.email, wa: display.wa, avatar: display.avatar, imagePath: meBase.image || '' });
    setErrors({});
    setEditing(false);
  };

  // Avatar upload — send the file to /uploads/image (persisted on the api-uploads
  // volume) and keep the returned path, instead of stuffing a base64 data-URL into the
  // user row (which was never even persisted before, so the photo vanished on reload).
  const pickAvatar = async (file: any) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('File harus berupa gambar'); return; }
    if (file.size > 2 * 1024 * 1024)     { showToast('Ukuran maks 2 MB'); return; }
    setAvatarUploading(true);
    try {
      const res: any = await api.uploadImage(file);
      const path = res?.url || (res?.filename ? '/uploads/' + res.filename : '');
      if (!path) throw new Error('no url');
      setForm((f: any) => ({ ...f, imagePath: path, avatar: mediaUrl(path) }));
    } catch {
      showToast('Gagal mengunggah gambar');
    } finally {
      setAvatarUploading(false);
    }
  };

  // -------- Password state --------
  const [pwd, setPwd]         = useState<any>({ old: '', neu: '', con: '' });
  const [pwdErrors, setPwdErrors] = useState<any>({});
  const [pwdShow, setPwdShow] = useState<any>({ old:false, neu:false, con:false });

  const pwdStrength = useMemo(() => {
    const p = pwd.neu;
    if (!p) return { score: 0, label: '—', color: 'bg-slate-200' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const labels = ['Sangat lemah','Lemah','Cukup','Bagus','Kuat','Sangat kuat'];
    const colors = ['bg-rose-400','bg-rose-400','bg-amber-400','bg-yellow-400','bg-emerald-400','bg-emerald-600'];
    return { score, label: labels[score], color: colors[score] };
  }, [pwd.neu]);

  const updatePassword = async () => {
    const e: any = {};
    if (!pwd.old) e.old = 'Password lama wajib diisi';
    if (!pwd.neu) e.neu = 'Password baru wajib diisi';
    else if (pwd.neu.length < 8) e.neu = 'Minimal 8 karakter';
    else if (pwdStrength.score < 3) e.neu = 'Password terlalu lemah';
    if (!pwd.con) e.con = 'Konfirmasi password wajib diisi';
    else if (pwd.con !== pwd.neu) e.con = 'Konfirmasi tidak cocok';
    setPwdErrors(e);
    if (Object.keys(e).length > 0) { showToast('Periksa kembali password Anda'); return; }
    // Confirm with the API before claiming success (wrong old password → error).
    let res: any;
    try { res = await api?.changePassword?.({ old_password: pwd.old, new_password: pwd.neu }); }
    catch (err: any) { setPwdErrors({ old: err?.message || 'Password lama salah' }); showToast('Gagal mengubah password'); return; }
    if (res && res.success === false) { setPwdErrors({ old: res.message || 'Password lama salah' }); showToast('Gagal mengubah password'); return; }
    setPwd({ old:'', neu:'', con:'' });
    showToast('Password berhasil diubah · sesi lain akan diminta login ulang');
  };

  const avatarBgClass = role==='Admin' ? 'bg-brand-600' : role==='CS' ? 'bg-sky2-500' : 'bg-violet-600';

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" subtitle="Akun & aktivitas Anda."
        actions={editing ? (
          <>
            <Btn variant="outline" tone="ink" onClick={cancel}>Batal</Btn>
            <Btn icon="check" onClick={save} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan Perubahan'}</Btn>
          </>
        ) : (
          <Btn variant="outline" tone="ink" icon="edit" onClick={() => setEditing(true)}>Edit Profile</Btn>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6 text-center lg:col-span-1">
          {/* Avatar */}
          <div className="relative inline-block">
            {(editing ? form.avatar : display.avatar) ? (
              <img src={editing ? form.avatar : display.avatar} alt={display.name}
                className="mx-auto h-24 w-24 rounded-3xl object-cover ring-4 ring-white shadow-card"/>
            ) : (
              <div className={`mx-auto h-24 w-24 rounded-3xl text-white font-bold text-3xl flex items-center justify-center ${avatarBgClass}`}>
                {editing ? initialsFrom(form.name) : display.initial}
              </div>
            )}
            {editing && (
              <>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickAvatar(e.target.files?.[0])}/>
                <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white border-4 border-white shadow-pop flex items-center justify-center transition-colors"
                  title="Ganti foto">
                  <Icon name="upload" size={14} className={avatarUploading ? 'animate-pulse' : ''}/>
                </button>
                {form.avatar && (
                  <button onClick={() => setForm({ ...form, avatar: null, imagePath: '' })}
                    className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white border-2 border-white shadow flex items-center justify-center"
                    title="Hapus foto">
                    <Icon name="close" size={12} strokeWidth={2.4}/>
                  </button>
                )}
              </>
            )}
          </div>
          <div className="mt-3 font-bold text-lg text-ink">{editing ? (form.name || 'Nama…') : display.name}</div>
          <div className="text-sm text-mute">{editing ? form.email : display.email}</div>
          <div className="mt-2 flex justify-center"><RoleBadge role={role}/></div>
          {editing && <div className="mt-3 text-[11px] text-mute">JPG / PNG · maks 2 MB</div>}

          <div className="mt-5 flex gap-2 justify-center">
            {!editing && <Btn size="sm" variant="outline" tone="ink" icon="edit" onClick={() => setEditing(true)}>Edit Profile</Btn>}
            <Btn size="sm" variant="ghost" tone="bad" icon="logout" onClick={logout}>Sign Out</Btn>
          </div>

          <div className="mt-6 pt-5 border-t border-line text-left space-y-3">
            <div className="text-xs uppercase font-semibold text-mute">Statistik</div>
            <div className="flex justify-between text-sm"><span className="text-mute">Total tindakan</span><span className="font-bold text-ink">{fmtNum?.(activityLog.length) || activityLog.length}</span></div>
            <div className="flex justify-between text-sm"><span className="text-mute">Sejak bergabung</span><span className="font-bold text-ink">{display.joined}</span></div>
            <div className="flex justify-between text-sm"><span className="text-mute">Login terakhir</span><span className="font-bold text-ink">{loginHistory[0]?.when || 'baru saja'}</span></div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-ink">Informasi Akun</div>
                <div className="text-xs text-mute mt-0.5">{editing ? 'Mode edit aktif — ubah lalu Simpan Perubahan.' : 'Klik "Edit Profile" untuk mengubah data.'}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <ProfileField label="Nama lengkap" editing={editing} value={form.name} display={display.name}
                onChange={(v: any) => setForm({ ...form, name: v })} error={errors.name}/>
              <ProfileField label="Email" type="email" editing={editing} value={form.email} display={display.email}
                onChange={(v: any) => setForm({ ...form, email: v })} error={errors.email}/>
              <ProfileField label="No. WhatsApp" editing={editing} value={form.wa} display={display.wa}
                onChange={(v: any) => setForm({ ...form, wa: v })} error={errors.wa} placeholder="+62 812 …"/>
              <div>
                <label className="text-xs font-semibold text-mute">Role</label>
                <div className="mt-1 h-10 px-3 rounded-lg border border-line bg-bg2 text-sm font-semibold text-ink flex items-center justify-between">
                  <span>{role}</span>
                  <Icon name="shield" size={14} className="text-mute" title="Role tidak dapat diubah dari sini"/>
                </div>
                <div className="text-[10px] text-mute mt-1">Hanya dapat diubah oleh Admin di Members / User.</div>
              </div>
            </div>
            {editing && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Btn size="md" icon="check" onClick={save} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan Perubahan'}</Btn>
                <Btn size="md" variant="outline" tone="ink" onClick={cancel}>Batal</Btn>
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-line">
            <div className="font-bold text-ink">Ubah Password</div>
            <div className="text-xs text-mute mt-0.5">Gunakan kombinasi huruf, angka, dan simbol. Min 8 karakter.</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <PasswordField label="Password lama" value={pwd.old} show={pwdShow.old}
                onToggle={() => setPwdShow({ ...pwdShow, old: !pwdShow.old })}
                onChange={(v: any) => setPwd({ ...pwd, old: v })} error={pwdErrors.old}/>
              <div className="hidden sm:block"/>
              <PasswordField label="Password baru" value={pwd.neu} show={pwdShow.neu}
                onToggle={() => setPwdShow({ ...pwdShow, neu: !pwdShow.neu })}
                onChange={(v: any) => setPwd({ ...pwd, neu: v })} error={pwdErrors.neu}/>
              <PasswordField label="Konfirmasi password" value={pwd.con} show={pwdShow.con}
                onToggle={() => setPwdShow({ ...pwdShow, con: !pwdShow.con })}
                onChange={(v: any) => setPwd({ ...pwd, con: v })} error={pwdErrors.con}/>
            </div>

            {pwd.neu && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-mute">Kekuatan password</span>
                  <span className="font-bold text-ink">{pwdStrength.label}</span>
                </div>
                <div className="mt-1 grid grid-cols-5 gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className={`h-1.5 rounded-full ${i <= pwdStrength.score ? pwdStrength.color : 'bg-slate-100'}`}/>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <Btn size="md" variant="outline" tone="ink" icon="shield" onClick={updatePassword}>Update Password</Btn>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-ink">Activity Log</div>
            <div className="text-xs text-mute">30 aktivitas terakhir</div>
          </div>
          <Btn size="sm" variant="ghost" tone="ink" icon="download">Export log</Btn>
        </div>
        <div className="space-y-2">
          {(activityLog.length ? activityLog : [
            { t:'Belum ada aktivitas tercatat', when:'', icon:'inbox', tone:'slate' }
          ]).map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg2">
              <div className={`h-8 w-8 rounded-md flex items-center justify-center ${
                a.tone==='ok'?'bg-emerald-50 text-emerald-600':
                a.tone==='sky'?'bg-sky2-50 text-sky2-500':
                a.tone==='brand'?'bg-brand-50 text-brand-600':
                a.tone==='purple'?'bg-violet-50 text-violet-600':
                'bg-slate-100 text-slate-600'}`}>
                <Icon name={a.icon} size={14}/>
              </div>
              <div className="flex-1 text-sm text-ink">{a.t}</div>
              <div className="text-xs text-mute">{a.when}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-ink">Login History</div>
          <Badge tone="ok" dot>{loginHistory.length || 0} sesi tercatat</Badge>
        </div>
        <div className="space-y-2">
          {(loginHistory.length ? loginHistory : [
            { d:'Belum ada data login', ip:'', when:'', current:false }
          ]).map((l, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-line">
              <div className="h-8 w-8 rounded-md bg-bg2 text-mute flex items-center justify-center"><Icon name="globe" size={14}/></div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink flex items-center gap-2">{l.d} {l.current && <Badge tone="ok" size="sm" dot>Aktif</Badge>}</div>
                <div className="text-xs text-mute">{l.ip}</div>
              </div>
              <div className="text-xs text-mute">{l.when}</div>
              {!l.current && <Btn size="sm" variant="ghost" tone="bad">Logout</Btn>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// =========================================================
// Field components
// =========================================================
function ProfileField({ label, editing, value, display, onChange, error, type='text', placeholder }: any) {
  return (
    <div>
      <label className="text-xs font-semibold text-mute">{label}</label>
      {editing ? (
        <>
          <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`field mt-1 ${error ? 'border-rose-400 ring-2 ring-rose-300/30' : ''}`}/>
          {error && <div className="text-[11px] text-rose-600 font-semibold mt-1">{error}</div>}
        </>
      ) : (
        <div className="mt-1 h-10 px-3 rounded-lg border border-line bg-bg2 text-sm font-semibold text-ink flex items-center">
          {display || '—'}
        </div>
      )}
    </div>
  );
}

function PasswordField({ label, value, onChange, error, show, onToggle }: any) {
  return (
    <div>
      <label className="text-xs font-semibold text-mute">{label}</label>
      <div className="mt-1 relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
          className={`field pr-9 ${error ? 'border-rose-400 ring-2 ring-rose-300/30' : ''}`}
          placeholder="••••••••"/>
        <button type="button" onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-bg2 flex items-center justify-center text-mute">
          <Icon name="eye" size={13}/>
        </button>
      </div>
      {error && <div className="text-[11px] text-rose-600 font-semibold mt-1">{error}</div>}
    </div>
  );
}

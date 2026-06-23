// Forgot-password + reset-password pages (public, pre-auth).
// Mirrors LoginPage's split/card styling. Wired to window.api.forgotPassword /
// window.api.resetPassword (backend: POST /auth/forgot-password, /auth/reset-password).
const { useState: uS_reset } = React;

// Shared shell so both pages match the login look.
function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg2 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <img src="/assets/logo-niatbaik.png" alt="NIATBAIK.ORG" className="h-8"/>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-line dark:border-slate-700 p-7">
          <h2 className="text-2xl font-extrabold text-ink dark:text-slate-100">{title}</h2>
          {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
          {children}
        </div>
        {footer && <div className="mt-4 text-center text-xs text-muted">{footer}</div>}
      </div>
    </div>
  );
}

function gotoLogin() {
  // Drop any reset query/path and return to the SPA login screen.
  try { window.history.replaceState({}, '', '/'); } catch {}
  if (window.__nbNavigateLogin) window.__nbNavigateLogin();
  else window.location.href = '/';
}

function ForgotPasswordPage() {
  const [email, setEmail] = uS_reset('');
  const [loading, setLoading] = uS_reset(false);
  const [sent, setSent] = uS_reset(false);
  const [error, setError] = uS_reset('');

  const submit = async (e) => {
    e && e.preventDefault();
    setError(''); setLoading(true);
    try {
      await window.api.forgotPassword(email.trim().toLowerCase());
      // Backend always returns success (no account enumeration). Show neutral msg.
      setSent(true);
    } catch (err) {
      setError(err?.message || 'Gagal mengirim. Periksa koneksi Anda.');
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <AuthShell
        title="Cek email Anda"
        subtitle="Jika email terdaftar, kami telah mengirim tautan reset password. Tautan berlaku 1 jam."
        footer={<a href="#" onClick={(e)=>{e.preventDefault();gotoLogin();}} className="font-bold text-brand-600 hover:underline">&larr; Kembali ke login</a>}>
        <div className="mt-5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-semibold px-3 py-3 flex items-start gap-2">
          <Icon name="check" size={16}/> Tautan reset terkirim. Periksa folder inbox & spam.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Lupa password?"
      subtitle="Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat password baru."
      footer={<a href="#" onClick={(e)=>{e.preventDefault();gotoLogin();}} className="font-bold text-brand-600 hover:underline">&larr; Kembali ke login</a>}>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <div>
          <label className="text-xs font-bold text-muted">Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required
            className="mt-1 w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
            placeholder="nama@niatbaik.org"/>
        </div>
        {error && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold px-3 py-2 flex items-center gap-2">
            <Icon name="close" size={14}/> {error}
          </div>
        )}
        <button type="submit" disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 font-extrabold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-card transition-all text-base px-5 py-3 disabled:opacity-60">
          {loading ? 'Mengirim…' : 'Kirim Tautan Reset'}
        </button>
      </form>
    </AuthShell>
  );
}

// Capture the reset params ONCE at module-render time, then scrub them from the
// URL so the token doesn't linger in the address bar / browser history.
function readResetParams() {
  let email = '', token = '';
  try {
    const params = new URLSearchParams(window.location.search);
    email = params.get('email') || '';
    token = params.get('token') || '';
    if ((email || token) && window.location.pathname === '/reset-password') {
      // Keep the route, drop the query (token) from the visible URL + history entry.
      window.history.replaceState({}, '', '/reset-password');
    }
  } catch {}
  return { email, token };
}
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function ResetPasswordPage() {
  // Read (and scrub) email + token from the reset link query string, once.
  const captured = React.useRef(null);
  if (captured.current === null) captured.current = readResetParams();
  const { email, token } = captured.current;

  const [password, setPassword] = uS_reset('');
  const [confirm, setConfirm] = uS_reset('');
  const [showPwd, setShowPwd] = uS_reset(false);
  const [loading, setLoading] = uS_reset(false);
  const [done, setDone] = uS_reset(false);
  const [error, setError] = uS_reset('');

  // Reject malformed links (missing parts, or an email param that isn't an email).
  const invalidLink = !email || !token || !EMAIL_RE.test(email);

  const submit = async (e) => {
    e && e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password minimal 8 karakter.'); return; }
    if (password !== confirm) { setError('Konfirmasi password tidak cocok.'); return; }
    setLoading(true);
    try {
      const res = await window.api.resetPassword({ email, token, password, password_confirm: confirm });
      if (res?.success) setDone(true);
      else setError(res?.message || 'Tautan reset tidak valid atau sudah kedaluwarsa.');
    } catch (err) {
      setError(err?.message || 'Tautan reset tidak valid atau sudah kedaluwarsa.');
    } finally { setLoading(false); }
  };

  if (invalidLink) {
    return (
      <AuthShell title="Tautan tidak valid"
        subtitle="Tautan reset password tidak lengkap atau salah. Silakan minta tautan baru."
        footer={<a href="#" onClick={(e)=>{e.preventDefault();gotoLogin();}} className="font-bold text-brand-600 hover:underline">&larr; Kembali ke login</a>}>
        <div className="mt-5 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-sm font-semibold px-3 py-3 flex items-start gap-2">
          <Icon name="close" size={16}/> Email atau token tidak ditemukan di tautan.
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password berhasil diubah"
        subtitle="Silakan login dengan password baru Anda."
        footer={null}>
        <div className="mt-5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-semibold px-3 py-3 flex items-start gap-2">
          <Icon name="check" size={16}/> Berhasil! Password Anda telah diperbarui.
        </div>
        <button onClick={gotoLogin}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 font-extrabold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-card transition-all text-base px-5 py-3">
          Masuk Sekarang
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Buat password baru" subtitle={`Untuk akun ${email}`}
      footer={<a href="#" onClick={(e)=>{e.preventDefault();gotoLogin();}} className="font-bold text-brand-600 hover:underline">&larr; Kembali ke login</a>}>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <div>
          <label className="text-xs font-bold text-muted">Password baru</label>
          <div className="mt-1 relative">
            <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e)=>setPassword(e.target.value)} required
              className="w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 pl-3 pr-10 py-2.5 text-sm text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
              placeholder="Minimal 8 karakter"/>
            <button type="button" onClick={()=>setShowPwd(!showPwd)} aria-label={showPwd?'Sembunyikan':'Tampilkan'}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-bg2 dark:hover:bg-slate-700 flex items-center justify-center text-muted">
              <Icon name="eye" size={14} className={showPwd ? 'text-brand-600' : ''}/>
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-muted">Konfirmasi password</label>
          <input type={showPwd ? 'text' : 'password'} value={confirm} onChange={(e)=>setConfirm(e.target.value)} required
            className="mt-1 w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
            placeholder="Ulangi password baru"/>
        </div>
        {error && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold px-3 py-2 flex items-center gap-2">
            <Icon name="close" size={14}/> {error}
          </div>
        )}
        <button type="submit" disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 font-extrabold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-card transition-all text-base px-5 py-3 disabled:opacity-60">
          {loading ? 'Menyimpan…' : 'Simpan Password Baru'}
        </button>
      </form>
    </AuthShell>
  );
}

window.ForgotPasswordPage = ForgotPasswordPage;
window.ResetPasswordPage = ResetPasswordPage;

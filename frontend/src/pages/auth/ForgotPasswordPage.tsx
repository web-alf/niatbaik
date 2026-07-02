// Forgot-password page (public, pre-auth).
// Mirrors LoginPage's split/card styling. Wired to api.forgotPassword
// (backend: POST /auth/forgot-password).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Icon, Logo } from '@/components';

// Shared shell so both pages match the login look.
function AuthShell({ title, subtitle, children, footer }: any) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg2 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo size={32}/>
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

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const gotoLogin = () => {
    // Drop any reset query/path and return to the SPA login screen.
    try { window.history.replaceState({}, '', '/'); } catch {}
    navigate('/login');
  };

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: any) => {
    e && e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.forgotPassword(email.trim().toLowerCase());
      // Backend always returns success (no account enumeration). Show neutral msg.
      setSent(true);
    } catch (err: any) {
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

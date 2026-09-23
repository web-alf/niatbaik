// Public fundraiser email-verification landing page (link target from the registration
// email). Reads ?email=&token= once, scrubs them from the URL/history, then auto-submits
// to api.verifyFundraiserEmail (backend: POST /fundraisers/verify-email).
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Icon, Logo } from '@/components';

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

// Capture email + token ONCE, then scrub from the URL (same pattern as ResetPasswordPage).
function readVerifyParams() {
  let email = '', token = '';
  try {
    const params = new URLSearchParams(window.location.search);
    email = params.get('email') || '';
    token = params.get('token') || '';
    if ((email || token) && window.location.pathname === '/verify-fundraiser-email') {
      window.history.replaceState({}, '', '/verify-fundraiser-email');
    }
  } catch {}
  return { email, token };
}

export default function VerifyFundraiserEmailPage() {
  const navigate = useNavigate();
  const gotoLogin = () => navigate('/login');

  const captured = useRef<any>(null);
  if (captured.current === null) captured.current = readVerifyParams();
  const { email, token } = captured.current;

  const [status, setStatus] = useState<'checking' | 'done' | 'error'>(email && token ? 'checking' : 'error');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email || !token) return;
    api.verifyFundraiserEmail({ email, token })
      .then((res: any) => { if (res?.success !== false) setStatus('done'); else { setError(res?.message || ''); setStatus('error'); } })
      .catch((err: any) => { setError(err?.message || ''); setStatus('error'); });
  }, [email, token]);

  if (status === 'checking') {
    return <AuthShell title="Memverifikasi email…" subtitle="Mohon tunggu sebentar." footer={null}><div/></AuthShell>;
  }

  if (status === 'error') {
    return (
      <AuthShell title="Verifikasi gagal"
        subtitle={error || 'Tautan verifikasi tidak valid atau sudah kedaluwarsa.'}
        footer={<a href="#" onClick={(e)=>{e.preventDefault();gotoLogin();}} className="font-bold text-brand-600 hover:underline">&larr; Kembali ke login</a>}>
        <div className="mt-5 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-sm font-semibold px-3 py-3 flex items-start gap-2">
          <Icon name="close" size={16}/> Silakan daftar ulang jika tautan sudah kedaluwarsa.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Email terverifikasi"
      subtitle="Akun fundraiser Anda kini aktif. Detail login (email & password baru) telah dikirim ke email Anda."
      footer={null}>
      <div className="mt-5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-semibold px-3 py-3 flex items-start gap-2">
        <Icon name="check" size={16}/> Berhasil! Cek email Anda untuk info login.
      </div>
      <button onClick={gotoLogin}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 font-extrabold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-card transition-all text-base px-5 py-3">
        Masuk Sekarang
      </button>
    </AuthShell>
  );
}

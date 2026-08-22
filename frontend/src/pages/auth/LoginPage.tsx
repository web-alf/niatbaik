// Login page — split layout: branding left + form right.
// Deliberately minimal: no role hints, no demo accounts, no pre-filled emails. The
// public site no longer advertises this panel (footer "Masuk" link only), so the page
// itself must not leak which accounts/roles exist.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { fmtIDRShort, fmtNum } from '@/lib/format';
import { Icon, Logo } from '@/components';

function LoginStats(){
  const [d, setD] = useState<any>(null);
  useEffect(() => { api.publicStats().then((r: any) => r?.data && setD(r.data)).catch(() => {}); }, []);
  const items = d ? [
    { v: fmtIDRShort(d.total_raised), l: 'Donasi tersalurkan' },
    { v: fmtNum(d.total_donors), l: 'Donatur' },
    { v: String(d.active_campaigns), l: 'Campaign aktif' },
  ] : [
    { v: '-', l: 'Donasi tersalurkan' },
    { v: '-', l: 'Donatur' },
    { v: '-', l: 'Campaign aktif' },
  ];
  return (
    <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
      {items.map((s,i)=>(
        <div key={i} className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-3">
          <div className="text-xl font-extrabold leading-none">{s.v}</div>
          <div className="text-[11px] text-white/80 mt-1.5 leading-tight">{s.l}</div>
        </div>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    const v = !dark;
    setDark(v);
    document.documentElement.classList.toggle('dark', v);
    try { localStorage.setItem('niatbaik_dark', v ? '1' : '0'); } catch {}
  };

  const handleSubmit = async (e: any) => {
    e && e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.login(email.trim().toLowerCase(), password);
      if (res?.data?.user) {
        login(res.data.user);
      } else {
        setError(res?.message || 'Email atau password salah.');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal masuk. Periksa koneksi.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950">

      {/* ====== LEFT: Branding panel ====== */}
      <div className="lg:w-1/2 relative overflow-hidden bg-brand-700 text-white p-8 lg:p-12 flex flex-col">

        {/* Logo */}
        <div className="relative">
          <Logo size={36} light/>
        </div>

        {/* Main content — pushed to bottom */}
        <div className="relative mt-auto pt-12">
          <h1 className="text-3xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight">
            Kelola niat baik <br className="hidden lg:inline"/>donatur Indonesia.
          </h1>
          <p className="mt-3 text-white/85 max-w-md leading-relaxed">
            Halaman internal NIATBAIK.ORG. Masuk dengan akun Anda untuk melanjutkan.
          </p>

          {/* Stat cards */}
          <LoginStats/>
        </div>

        {/* Trust badges */}
        <div className="relative mt-10 pt-6 border-t border-white/15 flex flex-wrap items-center gap-3 text-xs text-white/65">
          <span className="inline-flex items-center gap-1.5"><Icon name="shield" size={14}/> Koneksi terenkripsi (SSL)</span>
          <span className="ml-auto">&copy; 2026 Yayasan NIATBAIK</span>
        </div>
      </div>

      {/* ====== RIGHT: Login form ====== */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-bg2 dark:bg-slate-950 relative">
        {/* Dark mode toggle */}
        <button onClick={toggleDark} aria-label="Toggle dark mode"
          className="absolute top-4 right-4 h-10 w-10 rounded-lg border border-line bg-white dark:bg-slate-800 hover:bg-bg2 dark:hover:bg-slate-700 flex items-center justify-center text-ink dark:text-slate-200 shadow-card z-10">
          <Icon name={dark ? 'sun' : 'moon'} size={16}/>
        </button>

        <div className="w-full max-w-md">
          {/* Mobile-only logo */}
          <div className="lg:hidden mb-6 flex justify-center">
            <Logo size={32}/>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-line dark:border-slate-700 p-7">
            <h2 className="text-2xl font-extrabold text-ink dark:text-slate-100">Masuk</h2>
            <p className="text-sm text-muted mt-1">Masukkan email dan password Anda.</p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <div>
                <label className="text-xs font-bold text-muted">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username"
                  className="mt-1 w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                  placeholder="nama@email.com" required/>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted">Password</label>
                  <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs font-semibold text-brand-600 hover:underline cursor-pointer">Lupa password?</button>
                </div>
                <div className="mt-1 relative">
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
                    className="w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 pl-3 pr-10 py-2.5 text-sm text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                    placeholder="••••••••" required/>
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    aria-label={showPwd ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-bg2 dark:hover:bg-slate-700 flex items-center justify-center text-muted">
                    <Icon name="eye" size={14} className={showPwd ? 'text-brand-600' : ''}/>
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold px-3 py-2 flex items-center gap-2">
                  <Icon name="close" size={14}/> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 font-extrabold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-card transition-all text-base px-5 py-3 disabled:opacity-60">
                {loading ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg> Memproses...</>
                ) : (
                  <>Masuk</>
                )}
              </button>
            </form>
          </div>

          <div className="mt-4 text-center text-xs text-muted">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="font-bold text-brand-600 hover:underline">Lihat situs publik &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  );
}

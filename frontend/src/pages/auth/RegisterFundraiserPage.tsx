// Public fundraiser self-registration page — same split-layout styling as LoginPage.
// Same fields as admin "Undang Fundraiser" (Nama/Email/No. HP/Campaign), minus password —
// the real password is generated + emailed only after the user verifies their email.
// Wired to api.registerFundraiser (backend: POST /fundraisers/register).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Icon, Logo } from '@/components';

export default function RegisterFundraiserPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    const v = !dark;
    setDark(v);
    document.documentElement.classList.toggle('dark', v);
    try { localStorage.setItem('niatbaik_dark', v ? '1' : '0'); } catch {}
  };

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', campaign: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.campaigns('limit=100').then((res: any) => setCampaigns(res?.data || res || [])).catch(() => {});
  }, []);

  const submit = async (e: any) => {
    e && e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim()) { setError('Nama & email wajib diisi.'); return; }
    if (!form.campaign) { setError('Pilih campaign untuk fundraiser ini.'); return; }
    setLoading(true);
    try {
      await api.registerFundraiser({ name: form.name, email: form.email, phone: form.phone, campaign_id: form.campaign });
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Gagal mendaftar. Periksa koneksi Anda.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950">

      {/* ====== LEFT: Branding panel ====== */}
      <div className="lg:w-1/2 relative overflow-hidden bg-brand-700 text-white p-8 lg:p-12 flex flex-col">
        <div className="relative">
          <Logo size={36} light/>
        </div>

        <div className="relative mt-auto pt-12">
          <h1 className="text-3xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight">
            Jadi fundraiser, <br className="hidden lg:inline"/>sebarkan niat baik.
          </h1>
          <p className="mt-3 text-white/85 max-w-md leading-relaxed">
            Daftar sebagai fundraiser NIATBAIK.ORG, bagikan link campaign, dan bantu galang dana untuk mereka yang membutuhkan.
          </p>
        </div>

        <div className="relative mt-10 pt-6 border-t border-white/15 flex flex-wrap items-center gap-3 text-xs text-white/65">
          <span className="inline-flex items-center gap-1.5"><Icon name="shield" size={14}/> Koneksi terenkripsi (SSL)</span>
          <span className="ml-auto">&copy; 2026 Yayasan NIATBAIK</span>
        </div>
      </div>

      {/* ====== RIGHT: Register form ====== */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-bg2 dark:bg-slate-950 relative">
        <button onClick={toggleDark} aria-label="Toggle dark mode"
          className="absolute top-4 right-4 h-10 w-10 rounded-lg border border-line bg-white dark:bg-slate-800 hover:bg-bg2 dark:hover:bg-slate-700 flex items-center justify-center text-ink dark:text-slate-200 shadow-card z-10">
          <Icon name={dark ? 'sun' : 'moon'} size={16}/>
        </button>

        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex justify-center">
            <Logo size={32}/>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-line dark:border-slate-700 p-7">
            {sent ? (
              <>
                <h2 className="text-2xl font-extrabold text-ink dark:text-slate-100">Cek email Anda</h2>
                <p className="text-sm text-muted mt-1">Kami telah mengirim tautan verifikasi ke email Anda. Klik tautan tersebut untuk mengaktifkan akun fundraiser Anda.</p>
                <div className="mt-5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-semibold px-3 py-3 flex items-start gap-2">
                  <Icon name="check" size={16}/> Pendaftaran berhasil. Periksa folder inbox & spam.
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-extrabold text-ink dark:text-slate-100">Daftar Fundraiser</h2>
                <p className="text-sm text-muted mt-1">Isi data di bawah untuk mendaftar sebagai fundraiser.</p>

                <form onSubmit={submit} className="mt-6 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-muted">Nama</label>
                    <input value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} required
                      className="mt-1 w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                      placeholder="Nama lengkap"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted">Email</label>
                    <input type="email" value={form.email} onChange={(e)=>setForm({ ...form, email: e.target.value })} autoComplete="username" required
                      className="mt-1 w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                      placeholder="nama@email.com"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted">No. HP</label>
                    <input value={form.phone} onChange={(e)=>setForm({ ...form, phone: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                      placeholder="08xxx"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted">Campaign</label>
                    <select value={form.campaign} onChange={(e)=>setForm({ ...form, campaign: e.target.value })} required
                      className="mt-1 w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600">
                      <option value="">Pilih campaign…</option>
                      {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold px-3 py-2 flex items-center gap-2">
                      <Icon name="close" size={14}/> {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 font-extrabold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-card transition-all text-base px-5 py-3 disabled:opacity-60">
                    {loading ? (
                      <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg> Mendaftar...</>
                    ) : (
                      <>Daftar Sekarang</>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="mt-4 text-center text-xs text-muted">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="font-bold text-brand-600 hover:underline">&larr; Kembali ke login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

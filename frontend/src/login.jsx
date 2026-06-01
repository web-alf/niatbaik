// Login page — split layout: branding left + form right
const { useState: uS_login, useEffect: uE_login } = React;

function LoginStats(){
  const [d, setD] = uS_login(null);
  uE_login(()=>{ api.publicStats().then(r=>r?.data&&setD(r.data)).catch(()=>{}); },[]);
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

const LOGIN_ACCOUNTS = {
  'admin@niatbaik.org':      { password: 'admin123',      role: 'Admin',      name: 'Andre Wicaksono', initial: 'AW', email: 'admin@niatbaik.org',      access: 'Full akses · kelola seluruh platform' },
  'cs@niatbaik.org':         { password: 'cs123456',      role: 'CS',         name: 'Putri Maharani',  initial: 'PM', email: 'cs@niatbaik.org',         access: 'Akses inbox donor, transaksi, follow-up' },
  'advertiser@niatbaik.org': { password: 'advertiser123', role: 'Advertiser', name: 'Dewi Lestari',    initial: 'DL', email: 'advertiser@niatbaik.org', access: 'Akses analytics, ads tracking, UTM, pixel' }
};

const LOGIN_ROLE_META = {
  Admin:      { color: 'bg-brand-600',  ring: 'ring-brand-600',  light: 'bg-brand-50',  text: 'text-brand-700',  icon: 'shield',  tag: 'Full Access',   desc: 'Kelola seluruh platform' },
  CS:         { color: 'bg-sky2-500',   ring: 'ring-sky2-500',   light: 'bg-sky2-50',   text: 'text-sky2-600',   icon: 'inbox',   tag: 'Operasional',   desc: 'Inbox & follow-up donatur' },
  Advertiser: { color: 'bg-violet-600', ring: 'ring-violet-600', light: 'bg-violet-50', text: 'text-violet-700', icon: 'chart',   tag: 'Marketing',     desc: 'Analytics & ads tracking' }
};

function LoginPage({ onLogin }) {
  const [email, setEmail] = uS_login('');
  const [password, setPassword] = uS_login('');
  const [error, setError] = uS_login('');
  const [loading, setLoading] = uS_login(false);
  const [showPwd, setShowPwd] = uS_login(false);
  const [pickedRole, setPickedRole] = uS_login('Admin');
  const [dark, setDark] = uS_login(() => document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    const v = !dark;
    setDark(v);
    document.documentElement.classList.toggle('dark', v);
    try { localStorage.setItem('niatbaik_dark', v ? '1' : '0'); } catch {}
  };

  const quickLogin = (roleKey) => {
    const acc = Object.values(LOGIN_ACCOUNTS).find(a => a.role === roleKey);
    if (acc) {
      setEmail(acc.email);
      setPassword(acc.password);
      setPickedRole(roleKey);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await window.api.login(email.trim().toLowerCase(), password);
      if (res?.data?.user) {
        onLogin(res.data.user);
      } else {
        setError(res?.message || 'Email atau password salah.');
      }
    } catch (err) {
      setError(err?.message || 'Gagal masuk. Periksa koneksi.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950">

      {/* ====== LEFT: Branding panel ====== */}
      <div className="lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white p-8 lg:p-12 flex flex-col">
        {/* Decorative blurs */}
        <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-sky2-400/30 blur-3xl"/>
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl"/>

        {/* Logo */}
        <div className="relative">
          <img src="/assets/logo-niatbaik.png" alt="NIATBAIK.ORG" className="h-9 brightness-200 invert"/>
        </div>

        {/* Main content — pushed to bottom */}
        <div className="relative mt-auto pt-12">
          {/* Version badge */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 text-[11px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/> Admin Console v2.6
          </div>

          <h1 className="mt-4 text-3xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight">
            Kelola niat baik <br className="hidden lg:inline"/>donatur Indonesia.
          </h1>
          <p className="mt-3 text-white/85 max-w-md leading-relaxed">
            Pusat kontrol untuk Admin, CS, dan Advertiser NIATBAIK.ORG. Login dengan akun masing-masing — tampilan & akses menyesuaikan otomatis sesuai role Anda.
          </p>

          {/* Stat cards */}
          <LoginStats/>
        </div>

        {/* Trust badges */}
        <div className="relative mt-10 pt-6 border-t border-white/15 flex flex-wrap items-center gap-3 text-xs text-white/65">
          <span className="inline-flex items-center gap-1.5"><Icon name="shield" size={14}/> SSL · 2FA Ready</span>
          <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14}/> ISO 27001</span>
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
            <img src="/assets/logo-niatbaik.png" alt="NIATBAIK.ORG" className="h-8"/>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-line dark:border-slate-700 p-7">
            <h2 className="text-2xl font-extrabold text-ink dark:text-slate-100">Masuk ke dashboard</h2>
            <p className="text-sm text-muted mt-1">Akses sesuai role Anda: Admin, CS, atau Advertiser.</p>

            {/* Role picker pills */}
            <div className="mt-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">Pilih role untuk login cepat</div>
              <div className="grid grid-cols-3 gap-2">
                {['Admin', 'CS', 'Advertiser'].map((r) => {
                  const m = LOGIN_ROLE_META[r];
                  const active = pickedRole === r;
                  return (
                    <button key={r} type="button" onClick={() => quickLogin(r)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${active ? `${m.ring} ${m.light} dark:bg-opacity-20` : 'border-line dark:border-slate-700 hover:bg-bg2 dark:hover:bg-slate-800'}`}>
                      <div className={`h-7 w-7 rounded-md ${m.color} text-white flex items-center justify-center`}>
                        <Icon name={m.icon} size={14}/>
                      </div>
                      <div className={`mt-2 font-extrabold text-sm ${active ? m.text : 'text-ink dark:text-slate-200'}`}>{r}</div>
                      <div className="text-[10px] text-muted leading-tight mt-0.5">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-muted">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                  placeholder="nama@niatbaik.org" required/>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted">Password</label>
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-semibold text-brand-600 hover:underline cursor-pointer">Lupa password?</a>
                </div>
                <div className="mt-1 relative">
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-line dark:border-slate-700 bg-white dark:bg-slate-800 pl-3 pr-10 py-2.5 text-sm text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                    placeholder="••••••••" required/>
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-bg2 dark:hover:bg-slate-700 flex items-center justify-center text-muted">
                    <Icon name="eye" size={14}/>
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold px-3 py-2 flex items-center gap-2">
                  <Icon name="close" size={14}/> {error}
                </div>
              )}

              <label className="flex items-center gap-2 text-xs text-ink/80 dark:text-slate-300">
                <input type="checkbox" defaultChecked className="rounded border-line"/>
                Ingat saya di perangkat ini
              </label>

              <button type="submit" disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 font-extrabold rounded-xl text-white bg-gradient-to-r from-brand-600 to-sky2-500 hover:from-brand-700 hover:to-sky2-500 shadow-card transition-all text-base px-5 py-3 disabled:opacity-60">
                {loading ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg> Memproses...</>
                ) : (
                  <><Icon name="logout" size={16} className="rotate-180"/> Masuk Dashboard</>
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-5 pt-5 border-t border-line dark:border-slate-700">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Kredensial demo</div>
              <div className="space-y-1.5 text-[11px] font-mono">
                {Object.entries(LOGIN_ACCOUNTS).map(([em, a]) => (
                  <div key={em} className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded ${LOGIN_ROLE_META[a.role].color} text-white text-[10px] font-bold w-20 text-center`}>{a.role}</span>
                    <span className="text-ink dark:text-slate-200">{em}</span>
                    <span className="text-muted">/</span>
                    <span className="text-ink dark:text-slate-200">{a.password}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-muted">
            Butuh bantuan login? <a href="#" onClick={(e) => { e.preventDefault(); }} className="font-bold text-brand-600 hover:underline cursor-pointer">Hubungi admin</a>
            <span className="mx-2">&middot;</span>
            <a href="#" onClick={(e) => { e.preventDefault(); window.__nbNavigateLanding && window.__nbNavigateLanding(); }} className="font-bold text-brand-600 hover:underline">Lihat situs publik &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  );
}

window.LoginPage = LoginPage;

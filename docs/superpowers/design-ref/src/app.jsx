// Main app shell: login flow + role-isolated routing.
const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA } = React;

const NAV = [
  { key: 'dashboard',     label: 'Dashboard',     icon: 'home',     roles: ['Admin', 'CS', 'Advertiser'] },
  { key: 'campaigns',     label: 'Campaigns',     icon: 'megaphone',roles: ['Admin', 'CS', 'Advertiser'] },
  { key: 'analytics',     label: 'Analytics',     icon: 'chart',    roles: ['Admin', 'Advertiser'] },
  { key: 'data-studio',   label: 'Data Studio',   icon: 'sparkle',  roles: ['Admin', 'Advertiser'] },
  { key: 'inbox',         label: 'CS Inbox',      icon: 'inbox',    roles: ['Admin', 'CS'], badge: 12 },
  { key: 'fundraiser',    label: 'Fundraiser',    icon: 'handshake',roles: ['Admin', 'CS'] },
  { key: 'shortcode',     label: 'Shortcode',     icon: 'code',     roles: ['Admin', 'Advertiser'] },
  { key: 'members',       label: 'Members / User',icon: 'users',    roles: ['Admin'] },
  { key: 'notifications', label: 'Notification',  icon: 'bell',     roles: ['Admin', 'CS', 'Advertiser'], badge: 4 },
  { key: 'trash',         label: 'Trash',         icon: 'trash',    roles: ['Admin'] }
];

const SECONDARY_NAV = [
  { key: 'profile',  label: 'Profile',  icon: 'user' },
  { key: 'settings', label: 'Settings', icon: 'cog', roles: ['Admin'] } // Settings restricted to Admin
];

// --- Mock user accounts per role ---
const ACCOUNTS = {
  'admin@niatbaik.org':      { password: 'admin123',      role: 'Admin',      name: 'Andre Wicaksono', initial: 'AW', email: 'admin@niatbaik.org',      access: 'Full akses · kelola seluruh platform' },
  'cs@niatbaik.org':         { password: 'cs123',         role: 'CS',         name: 'Putri Maharani',  initial: 'PM', email: 'cs@niatbaik.org',         access: 'Akses inbox donor, transaksi, follow-up' },
  'advertiser@niatbaik.org': { password: 'advertiser123', role: 'Advertiser', name: 'Dewi Lestari',    initial: 'DL', email: 'advertiser@niatbaik.org', access: 'Akses analytics, ads tracking, UTM, pixel' }
};

const ROLE_META = {
  Admin:      { color: 'bg-brand-600',  ring: 'ring-brand-600',  light: 'bg-brand-50',  text: 'text-brand-700',  icon: 'shield',  tag: 'Full Access' },
  CS:         { color: 'bg-sky2-500',   ring: 'ring-sky2-500',   light: 'bg-sky2-50',   text: 'text-sky2-600',   icon: 'inbox',   tag: 'Operasional' },
  Advertiser: { color: 'bg-violet-600', ring: 'ring-violet-600', light: 'bg-violet-50', text: 'text-violet-700', icon: 'chart',   tag: 'Marketing' }
};

// =============================================================
// LOGIN SCREEN
// =============================================================
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useStateA('admin@niatbaik.org');
  const [password, setPassword] = useStateA('admin123');
  const [error, setError] = useStateA('');
  const [showPwd, setShowPwd] = useStateA(false);
  const [pickedRole, setPickedRole] = useStateA('Admin');
  const [dark, setDark] = useStateA(() => document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    const v = !dark;
    setDark(v);
    document.documentElement.classList.toggle('dark', v);
    try { localStorage.setItem('niatbaik_dark', v ? '1' : '0'); } catch {}
  };

  const submit = (e) => {
    e && e.preventDefault();
    const acc = ACCOUNTS[email.trim().toLowerCase()];
    if (!acc || acc.password !== password) {
      setError('Email atau password salah. Coba kredensial demo di bawah.');
      return;
    }
    setError('');
    onLogin(acc);
  };

  const quickLogin = (roleKey) => {
    const acc = Object.values(ACCOUNTS).find(a => a.role === roleKey);
    setEmail(acc.email);
    setPassword(acc.password);
    setPickedRole(roleKey);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left: branding */}
      <div className="lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white p-8 lg:p-12 flex flex-col">
        <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-sky2-400/30 blur-3xl"/>
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl"/>

        <div className="relative">
          <img src="assets/logo.png" alt="NIATBAIK.ORG" className="h-9 brightness-200 invert"/>
        </div>

        <div className="relative mt-auto pt-12">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 text-[11px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/> Admin Console v2.6
          </div>
          <h1 className="mt-4 text-3xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight">
            Kelola niat baik <br className="hidden lg:inline"/>donatur Indonesia.
          </h1>
          <p className="mt-3 text-white/85 max-w-md leading-relaxed">
            Pusat kontrol untuk Admin, CS, dan Advertiser NIATBAIK.ORG. Login dengan akun masing-masing — tampilan & akses menyesuaikan otomatis sesuai role Anda.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { v:'1,8 M+', l:'Donasi tersalurkan' },
              { v:'182 rb+', l:'Donatur' },
              { v:'4,9★',   l:'Trust rating' }
            ].map((s,i) => (
              <div key={i} className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-3">
                <div className="text-xl font-extrabold leading-none">{s.v}</div>
                <div className="text-[11px] text-white/80 mt-1.5 leading-tight">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-10 pt-6 border-t border-white/15 flex flex-wrap items-center gap-3 text-xs text-white/65">
          <span className="inline-flex items-center gap-1.5"><Icon name="shield" size={14}/> SSL · 2FA Ready</span>
          <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14}/> ISO 27001</span>
          <span className="ml-auto">© 2026 Yayasan NIATBAIK</span>
        </div>
      </div>

      {/* Right: login form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-bg2 relative">
        <button onClick={toggleDark} aria-label="Toggle dark mode"
          className="absolute top-4 right-4 h-10 w-10 rounded-lg border border-line bg-white hover:bg-bg2 flex items-center justify-center text-ink shadow-card z-10">
          <Icon name={dark ? 'sun' : 'moon'} size={16}/>
        </button>
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex justify-center">
            <img src="assets/logo.png" alt="NIATBAIK.ORG" className="h-8"/>
          </div>

          <div className="bg-white rounded-3xl shadow-card border border-line p-7">
            <h2 className="text-2xl font-extrabold text-ink">Masuk ke dashboard</h2>
            <p className="text-sm text-mute mt-1">Akses sesuai role Anda: Admin, CS, atau Advertiser.</p>

            {/* Role pills */}
            <div className="mt-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-mute mb-2">Pilih role untuk login cepat</div>
              <div className="grid grid-cols-3 gap-2">
                {['Admin','CS','Advertiser'].map((r) => {
                  const m = ROLE_META[r];
                  const active = pickedRole === r;
                  return (
                    <button key={r} type="button" onClick={() => quickLogin(r)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${active ? `${m.ring} ${m.light}` : 'border-line hover:bg-bg2'}`}>
                      <div className={`h-7 w-7 rounded-md ${m.color} text-white flex items-center justify-center`}>
                        <Icon name={m.icon} size={14}/>
                      </div>
                      <div className={`mt-2 font-extrabold text-sm ${active ? m.text : 'text-ink'}`}>{r}</div>
                      <div className="text-[10px] text-mute leading-tight mt-0.5">{m.tag}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-mute">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                  placeholder="nama@niatbaik.org"/>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-mute">Password</label>
                  <a className="text-xs font-semibold text-brand-600 hover:underline cursor-pointer">Lupa password?</a>
                </div>
                <div className="mt-1 relative">
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-line bg-white pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                    placeholder="••••••••"/>
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-bg2 flex items-center justify-center text-mute">
                    <Icon name="eye" size={14}/>
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2 flex items-center gap-2">
                  <Icon name="close" size={14}/> {error}
                </div>
              )}

              <label className="flex items-center gap-2 text-xs text-ink/80">
                <input type="checkbox" defaultChecked className="rounded border-line"/>
                Ingat saya di perangkat ini
              </label>

              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 font-extrabold rounded-xl text-white bg-gradient-to-r from-brand-600 to-sky2-500 hover:from-brand-700 hover:to-sky2-500 shadow-card transition-all text-base px-5 py-3">
                <Icon name="logout" size={16} className="rotate-180"/> Masuk Dashboard
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-5 pt-5 border-t border-line">
              <div className="text-[10px] font-bold uppercase tracking-wider text-mute mb-2">Kredensial demo</div>
              <div className="space-y-1.5 text-[11px] font-mono">
                {Object.entries(ACCOUNTS).map(([em, a]) => (
                  <div key={em} className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded ${ROLE_META[a.role].color} text-white text-[10px] font-bold w-20 text-center`}>{a.role}</span>
                    <span className="text-ink">{em}</span>
                    <span className="text-mute">/</span>
                    <span className="text-ink">{a.password}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-mute">
            Butuh bantuan login? <a className="font-bold text-brand-600 hover:underline cursor-pointer">Hubungi admin</a>
            <span className="mx-2">·</span>
            <a href="public.html" className="font-bold text-brand-600 hover:underline">Lihat situs publik →</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// SIDEBAR
// =============================================================
function Sidebar({ open, onClose }) {
  const { view, setView, role } = useApp();
  const visible = NAV.filter((n) => n.roles.includes(role));
  const visibleSecondary = SECONDARY_NAV.filter((n) => !n.roles || n.roles.includes(role));
  const m = ROLE_META[role];

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={onClose}/>}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-white border-r border-line flex flex-col transition-transform ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-16 px-5 flex items-center border-b border-line">
          <Logo size={28}/>
        </div>

        {/* Role badge */}
        <div className="px-3 pt-3">
          <div className={`flex items-center gap-2.5 p-2.5 rounded-xl ${m.light} border border-line/60`}>
            <div className={`h-8 w-8 rounded-md ${m.color} text-white flex items-center justify-center shrink-0`}>
              <Icon name={m.icon} size={14}/>
            </div>
            <div className="min-w-0">
              <div className={`text-[10px] font-bold uppercase tracking-wider ${m.text}`}>Logged in as</div>
              <div className="text-sm font-extrabold text-ink">{role}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-mute">Menu Utama</div>
          <nav className="flex flex-col gap-1">
            {visible.map((n) => (
              <button key={n.key} onClick={() => { setView(n.key); onClose && onClose(); }}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${view === n.key ? 'bg-brand-50 text-brand-700' : 'text-ink/80 hover:bg-bg2 hover:text-ink'}`}>
                <Icon name={n.icon} size={18} className={view === n.key ? 'text-brand-600' : 'text-mute group-hover:text-ink'}/>
                <span className="flex-1 text-left">{n.label}</span>
                {n.badge && <span className="text-[10px] font-bold bg-sky2-400 text-white px-1.5 py-0.5 rounded-full">{n.badge}</span>}
              </button>
            ))}
          </nav>

          <div className="px-2 mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-mute">Akun</div>
          <nav className="flex flex-col gap-1">
            {visibleSecondary.map((n) => (
              <button key={n.key} onClick={() => { setView(n.key); onClose && onClose(); }}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${view === n.key ? 'bg-brand-50 text-brand-700' : 'text-ink/80 hover:bg-bg2 hover:text-ink'}`}>
                <Icon name={n.icon} size={18} className={view === n.key ? 'text-brand-600' : 'text-mute group-hover:text-ink'}/>
                <span className="flex-1 text-left">{n.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-xl bg-gradient-to-br from-brand-600 to-sky2-400 text-white p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
              <Icon name="sparkle" size={14}/> Tips
            </div>
            <div className="mt-1.5 text-sm font-semibold leading-snug">
              {role === 'Admin' && 'Naikkan ROAS dengan menyalakan Conversions API di Tracking & Ads.'}
              {role === 'CS' && 'Manfaatkan template WA untuk follow-up donatur lebih cepat.'}
              {role === 'Advertiser' && 'Cek rekomendasi campaign di dashboard untuk scaling ads optimal.'}
            </div>
            <button onClick={() => window.dispatchEvent(new CustomEvent('nb-open-ads-guide'))} className="mt-3 text-xs font-bold bg-white/20 hover:bg-white/30 backdrop-blur px-2.5 py-1.5 rounded-md">
              Buka panduan →
            </button>
          </div>
        </div>

        <div className="border-t border-line p-3">
          <a href="public.html" target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-ink/80 hover:bg-bg2 hover:text-ink">
            <Icon name="globe" size={18} className="text-mute"/>
            <span className="flex-1 text-left">Lihat situs publik</span>
            <Icon name="arrowR" size={14} className="text-mute"/>
          </a>
        </div>
      </aside>
    </>
  );
}

// =============================================================
// USER MENU (replaces RoleSwitcher in topbar)
// =============================================================
function UserMenu() {
  const { user, setView, logout, dark, setDark } = useApp();
  const [open, setOpen] = useStateA(false);
  const m = ROLE_META[user.role];

  // Close on outside click
  useEffectA(() => {
    if (!open) return;
    const handler = (e) => {
      if (!e.target.closest('[data-usermenu]')) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" data-usermenu>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-lg border border-line bg-white hover:bg-bg2 transition-colors">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-md object-cover"/>
        ) : (
          <div className={`h-8 w-8 rounded-md flex items-center justify-center text-white font-bold text-xs ${m.color}`}>
            {user.initial}
          </div>
        )}
        <div className="hidden sm:block text-left">
          <div className="text-xs font-bold text-ink leading-tight">{user.name}</div>
          <div className="text-[10px] text-mute">{user.role}</div>
        </div>
        <Icon name="chevronD" size={14} className="text-mute hidden sm:block"/>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-line shadow-pop z-50 overflow-hidden">
          <div className={`px-4 py-3.5 ${m.light} flex items-center gap-3 border-b border-line`}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-lg object-cover"/>
            ) : (
              <div className={`h-10 w-10 rounded-lg ${m.color} text-white flex items-center justify-center font-bold text-sm`}>
                {user.initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-ink truncate">{user.name}</div>
              <div className="text-xs text-mute truncate">{user.email}</div>
            </div>
            <span className={`px-2 py-0.5 rounded-md ${m.color} text-white text-[10px] font-bold`}>{user.role}</span>
          </div>

          <div className="px-4 py-2.5 border-b border-line">
            <div className="text-[10px] font-bold uppercase tracking-wider text-mute">Akses</div>
            <div className="text-xs text-ink/80 mt-0.5">{user.access}</div>
          </div>

          <div className="p-1.5">
            <button onClick={() => { setView('profile'); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-bg2 text-left">
              <Icon name="user" size={16} className="text-mute"/> Profile saya
            </button>
            {SECONDARY_NAV.find(n => n.key === 'settings' && (!n.roles || n.roles.includes(user.role))) && (
              <button onClick={() => { setView('settings'); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-bg2 text-left">
                <Icon name="cog" size={16} className="text-mute"/> Settings
              </button>
            )}
            <button onClick={() => { setView('notifications'); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-bg2 text-left">
              <Icon name="bell" size={16} className="text-mute"/> Notifikasi
            </button>
            <button onClick={() => setDark(!dark)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-bg2 text-left">
              <Icon name={dark ? 'sun' : 'moon'} size={16} className="text-mute"/>
              <span className="flex-1">Dark mode</span>
              <span className={`relative h-5 w-9 rounded-full transition-colors ${dark ? 'bg-brand-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-all ${dark ? 'left-[18px]' : 'left-0.5'}`}/>
              </span>
            </button>
          </div>

          <div className="p-1.5 border-t border-line">
            <button onClick={() => { logout(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold text-rose-600 hover:bg-rose-50 text-left">
              <Icon name="logout" size={16}/> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================
// TOPBAR
// =============================================================
function Topbar({ onMenu }) {
  const { setView } = useApp();
  return (
    <header className="sticky top-0 z-20 h-16 bg-white/85 backdrop-blur border-b border-line">
      <div className="h-full px-4 lg:px-6 flex items-center gap-3">
        <button onClick={onMenu} className="lg:hidden h-9 w-9 rounded-lg hover:bg-bg2 flex items-center justify-center text-mute">
          <Icon name="menu" size={20}/>
        </button>

        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute"/>
            <input
              placeholder="Cari campaign, donatur, invoice…"
              className="w-full h-10 rounded-lg border border-line bg-bg2 pl-9 pr-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"/>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-mute bg-white border border-line rounded px-1.5 py-0.5">⌘K</span>
          </div>
        </div>

        <button className="md:hidden h-10 w-10 rounded-lg border border-line bg-white hover:bg-bg2 flex items-center justify-center text-ink" aria-label="Search">
          <Icon name="search" size={18}/>
        </button>

        <div className="flex-1"/>

        <button onClick={() => setView('notifications')} className="relative h-10 w-10 rounded-lg border border-line bg-white hover:bg-bg2 flex items-center justify-center text-ink">
          <Icon name="bell" size={18}/>
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"/>
        </button>

        <UserMenu/>
      </div>
    </header>
  );
}

// =============================================================
// APP
// =============================================================
function App() {
  const [user, setUser] = useStateA(() => {
    try {
      const saved = localStorage.getItem('niatbaik_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [view, setViewRaw] = useStateA('dashboard');
  const [sidebarOpen, setSidebarOpen] = useStateA(false);
  const [invoiceTxn, setInvoiceTxn] = useStateA(null);
  const [toast, setToast] = useStateA('');
  const [campaignDetail, setCampaignDetail] = useStateA(null);
  const [editingCampaign, setEditingCampaign] = useStateA(null);
  const [adsGuideOpen, setAdsGuideOpen] = useStateA(false);
  const [dark, setDarkRaw] = useStateA(() => {
    try { return localStorage.getItem('niatbaik_dark') === '1'; } catch { return false; }
  });

  const setDark = (v) => {
    setDarkRaw(v);
    try { localStorage.setItem('niatbaik_dark', v ? '1' : '0'); } catch {}
    document.documentElement.classList.toggle('dark', v);
  };

  useEffectA(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const setView = (v) => { setViewRaw(v); window.scrollTo({ top: 0, behavior: 'instant' }); };

  const login = (acc) => {
    const session = { name: acc.name, email: acc.email, role: acc.role, initial: acc.initial, access: acc.access };
    setUser(session);
    setViewRaw('dashboard');
    try { localStorage.setItem('niatbaik_session', JSON.stringify(session)); } catch {}
  };

  const logout = () => {
    setUser(null);
    setViewRaw('dashboard');
    try { localStorage.removeItem('niatbaik_session'); } catch {}
  };

  const updateUser = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try { localStorage.setItem('niatbaik_session', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  // Guard: if current view is not allowed for this role, reset to dashboard
  useEffectA(() => {
    if (!user) return;
    const allNav = [...NAV, ...SECONDARY_NAV];
    const cur = allNav.find(n => n.key === view);
    if (cur && cur.roles && !cur.roles.includes(user.role)) {
      setViewRaw('dashboard');
    }
  }, [view, user]);

  // Cross-component navigation event (e.g. Settings link to Data Studio)
  useEffectA(() => {
    const handler = () => setView('data-studio');
    window.addEventListener('nb-go-datastudio', handler);
    return () => window.removeEventListener('nb-go-datastudio', handler);
  }, []);

  // Ads guide modal trigger
  useEffectA(() => {
    const open = () => setAdsGuideOpen(true);
    window.addEventListener('nb-open-ads-guide', open);
    return () => window.removeEventListener('nb-open-ads-guide', open);
  }, []);

  if (!user) return <LoginScreen onLogin={login}/>;

  const role = user.role;
  const ctx = {
    user, role, view, setView,
    login, logout, updateUser,
    invoiceTxn, setInvoiceTxn,
    campaignDetail, setCampaignDetail,
    editingCampaign, setEditingCampaign,
    showToast,
    dark, setDark,
    // Back-compat for views that still call setRole (no-op now)
    setRole: () => {}
  };

  const Views = {
    dashboard:     DashboardView,
    campaigns:     CampaignsView,
    'campaign-editor': CampaignEditorView,
    analytics:     role === 'Advertiser' ? AdvertiserView : AnalyticsView,
    'data-studio': DataStudioView,
    inbox:         CSInboxView,
    fundraiser:    FundraiserView,
    shortcode:     ShortcodeView,
    members:       MembersView,
    profile:       ProfileView,
    settings:      SettingsView,
    notifications: NotificationsView,
    trash:         TrashView
  };

  // Hard guard: deny rendering a view the role can't access
  const navEntry = [...NAV, ...SECONDARY_NAV].find(n => n.key === view);
  let Cur = Views[view] || DashboardView;
  if (navEntry?.roles && !navEntry.roles.includes(role)) Cur = AccessDenied;

  return (
    <AppCtx.Provider value={ctx}>
      <div className="min-h-screen flex bg-bg2">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar onMenu={() => setSidebarOpen(true)}/>
          <main className="flex-1 px-4 lg:px-6 py-6">
            <Cur/>
          </main>
        </div>
      </div>

      {invoiceTxn && (
        <InvoiceModal
          txn={invoiceTxn}
          onClose={() => setInvoiceTxn(null)}
          onCopy={(id) => { showToast('Kode invoice ' + id + ' disalin'); }}/>
      )}
      {campaignDetail && (
        <CampaignDetailModal campaign={campaignDetail} onClose={() => setCampaignDetail(null)}/>
      )}
      <AdsGuideModal open={adsGuideOpen} onClose={() => setAdsGuideOpen(false)}/>
      <Toast message={toast}/>
    </AppCtx.Provider>
  );
}

function AccessDenied() {
  const { role, setView } = useApp();
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <Icon name="shield" size={28}/>
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-ink">Akses ditolak</h2>
        <p className="mt-2 text-mute">Role <b className="text-ink">{role}</b> tidak memiliki akses ke halaman ini.</p>
        <button onClick={() => setView('dashboard')} className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700">
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

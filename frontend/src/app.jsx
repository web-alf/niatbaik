// Root app shell: auth flow, routing, context, layout
const { useState: uS, useEffect: uE, useMemo: uM } = React;

const NAV = [
  { key: 'dashboard',     label: 'Dashboard',      icon: 'home',      roles: ['Admin', 'CS', 'Advertiser'] },
  { key: 'campaigns',     label: 'Campaigns',      icon: 'megaphone', roles: ['Admin', 'CS', 'Advertiser'] },
  { key: 'analytics',     label: 'Analytics',      icon: 'chart',     roles: ['Admin', 'Advertiser'] },
  { key: 'data-studio',   label: 'Data Studio',    icon: 'sparkle',   roles: ['Admin', 'Advertiser'] },
  { key: 'cs-inbox',      label: 'Inbox Donatur',  icon: 'inbox',     roles: ['Admin', 'CS'], badge: 12 },
  { key: 'fundraiser',    label: 'Fundraiser',     icon: 'handshake', roles: ['Admin', 'CS'] },
  { key: 'shortcode',     label: 'Shortcode',      icon: 'code',      roles: ['Admin', 'Advertiser'] },
  { key: 'members',       label: 'Members / User', icon: 'users',     roles: ['Admin'] },
  { key: 'notification',  label: 'Notification',   icon: 'bell',      roles: ['Admin', 'CS', 'Advertiser'], badge: 4 },
  { key: 'trash',         label: 'Trash',          icon: 'trash',     roles: ['Admin'] }
];

const SECONDARY_NAV = [
  { key: 'profile',  label: 'Profile',  icon: 'user' },
  { key: 'settings', label: 'Settings', icon: 'cog', roles: ['Admin'] }
];

// Build role → allowed nav keys lookup
const NAV_ROLE_KEYS = {};
['Admin', 'CS', 'Advertiser'].forEach(r => {
  NAV_ROLE_KEYS[r] = NAV.filter(n => n.roles.includes(r)).map(n => n.key);
});

function App() {
  const [user, setUser] = uS(null);
  const [route, setRouteRaw] = uS('landing');
  const [authLoading, setAuthLoading] = uS(true);
  const [toast, setToast] = uS(null);
  const [editingCampaign, setEditingCampaign] = uS(null);
  const [campaignDetail, setCampaignDetail] = uS(null);
  const [invoiceTxn, setInvoiceTxn] = uS(null);
  const [sidebarOpen, setSidebarOpen] = uS(false);
  const [dark, setDarkRaw] = uS(() => {
    try { return localStorage.getItem('niatbaik_dark') === '1'; } catch { return false; }
  });
  const [tweaks, setTweaksRaw] = uS(() => {
    const d = localStorage.getItem('niatbaik_dark') === '1';
    return { dark: d, primary: '#2E4191', density: 'comfortable', sidebar: 'expanded' };
  });

  const ROLE_MAP = { admin: 'Admin', cs: 'CS', advertiser: 'Advertiser', fundraiser: 'Admin', user: 'Admin' };
  const role = ROLE_MAP[user?.role] || user?.role || 'Admin';

  // --- Dark mode ---
  const applyDark = (v) => {
    document.documentElement.classList.toggle('dark', v);
    document.body.classList.toggle('dark', v);
    try { localStorage.setItem('niatbaik_dark', v ? '1' : '0'); } catch {}
  };
  const setDark = (v) => { setDarkRaw(v); setTweaksRaw(prev => ({ ...prev, dark: v })); applyDark(v); };
  const setTweak = (key, val) => {
    setTweaksRaw(prev => ({ ...prev, [key]: val }));
    if (key === 'dark') { setDarkRaw(val); applyDark(val); }
  };

  uE(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  // --- Route setter ---
  const setView = (v) => { setRouteRaw(v); window.scrollTo({ top: 0, behavior: 'instant' }); };

  // --- Auth: check token on mount ---
  uE(() => {
    const token = api.getToken();
    if (token) {
      api.me().then(res => {
        if (res?.success && res?.data) {
          setUser(res.data);
          setRouteRaw('dashboard');
        } else {
          api.clearToken();
        }
      }).catch(() => {
        api.clearToken();
      }).finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  // --- Landing nav helper (used by login page) ---
  uE(() => {
    window.__nbNavigateLanding = () => { setView('landing'); };
    return () => { delete window.__nbNavigateLanding; };
  }, []);

  // --- Load API data ---
  uE(() => { if (typeof loadApiData === 'function') loadApiData(); }, []);

  // --- Cross-component navigation events ---
  uE(() => {
    const goDS = () => setView('data-studio');
    window.addEventListener('nb-go-datastudio', goDS);
    return () => window.removeEventListener('nb-go-datastudio', goDS);
  }, []);

  // --- Login handler ---
  const handleLogin = (userData) => {
    setUser(userData);
    // Persist session for demo accounts (no token)
    try { localStorage.setItem('niatbaik_session', JSON.stringify(userData)); } catch {}
    // Navigate to first allowed nav item for role
    const r = ROLE_MAP[userData.role] || userData.role || 'Admin';
    const firstKey = NAV_ROLE_KEYS[r]?.[0] || 'dashboard';
    setView(firstKey);
  };

  // --- Logout handler ---
  const handleLogout = () => {
    api.logout();
    setUser(null);
    try { localStorage.removeItem('niatbaik_session'); } catch {}
    setView('landing');
  };

  // --- Update user (profile edits etc) ---
  const updateUser = (patch) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try { localStorage.setItem('niatbaik_session', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // --- Toast ---
  const showToast = (titleOrObj, sub, tone) => {
    let t;
    if (typeof titleOrObj === 'string') {
      t = { title: titleOrObj, sub: sub || '', tone: tone || 'ok' };
    } else {
      t = titleOrObj;
    }
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Role access guard ---
  uE(() => {
    if (!user) return;
    const allNav = [...NAV, ...SECONDARY_NAV];
    const cur = allNav.find(n => n.key === route);
    if (cur && cur.roles && !cur.roles.includes(role)) {
      setRouteRaw('dashboard');
    }
  }, [route, user, role]);

  // --- Context value ---
  const ctx = uM(() => ({
    user, role,
    view: route, setView,
    route, navigate: setView,
    tweaks, setTweak,
    login: handleLogin, logout: handleLogout, updateUser,
    editingCampaign, setEditingCampaign,
    campaignDetail, setCampaignDetail,
    invoiceTxn, setInvoiceTxn,
    showToast,
    dark, setDark,
    // Back-compat aliases
    openCampaign: (id) => { setCampaignDetail(id); setView('campaign-detail'); },
    openInvoice: (tx) => setInvoiceTxn(tx),
    setRole: () => {}
  }), [user, role, route, tweaks, editingCampaign, campaignDetail, invoiceTxn, dark]);

  // --- Auth loading spinner ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg2 dark:bg-slate-950">
        <div className="text-center">
          <Logo size={36}/>
          <div className="mt-4 text-sm text-muted">Memuat...</div>
        </div>
      </div>
    );
  }

  // --- Public routes (no auth needed) ---
  const isPublicRoute = route === 'landing' || route === 'campaign-detail';

  if (!user && isPublicRoute) {
    return (
      <AppCtx.Provider value={ctx}>
        {route === 'landing' && <LandingPage/>}
        {route === 'campaign-detail' && <CampaignDetailWrap/>}
        <PublicRouteBar/>
        <Toast toast={toast} onClose={() => setToast(null)}/>
      </AppCtx.Provider>
    );
  }

  // --- Not logged in + admin route → login ---
  if (!user) {
    return (
      <AppCtx.Provider value={ctx}>
        <LoginPage onLogin={handleLogin}/>
      </AppCtx.Provider>
    );
  }

  // --- Logged in: admin layout ---
  const ViewComponent = resolveView(route, role);
  const skeletonType = SKELETON_MAP[route] || 'dashboard';

  return (
    <AppCtx.Provider value={ctx}>
      <div className="flex min-h-screen bg-bg2 dark:bg-slate-950">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar onMenu={() => setSidebarOpen(true)} role={role}/>
          <main className="flex-1 p-4 lg:p-6">
            <LazyView key={route} component={ViewComponent} skeleton={skeletonType}/>
          </main>
        </div>
      </div>

      {/* Modals */}
      {invoiceTxn && (
        <InvoiceModal
          txn={invoiceTxn}
          onClose={() => setInvoiceTxn(null)}
          onCopy={(id) => showToast('Kode invoice ' + id + ' disalin')}/>
      )}

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)}/>
    </AppCtx.Provider>
  );
}

// --- Resolve view component by route + role ---
function resolveView(route, role) {
  const views = {
    'dashboard':        typeof AdminDashboard !== 'undefined' ? AdminDashboard : Placeholder,
    'campaigns':        typeof CampaignsPage !== 'undefined' ? CampaignsPage : Placeholder,
    'campaign-editor':  typeof CampaignEditorView !== 'undefined' ? CampaignEditorView : Placeholder,
    'analytics':        typeof AnalyticsPage !== 'undefined' ? AnalyticsPage : Placeholder,
    'data-studio':      typeof DataStudioView !== 'undefined' ? DataStudioView : Placeholder,
    'cs-inbox':         typeof CsInbox !== 'undefined' ? CsInbox : Placeholder,
    'fundraiser':       typeof FundraiserPage !== 'undefined' ? FundraiserPage : Placeholder,
    'shortcode':        typeof ShortcodePage !== 'undefined' ? ShortcodePage : Placeholder,
    'members':          typeof MembersPage !== 'undefined' ? MembersPage : Placeholder,
    'profile':          typeof ProfilePage !== 'undefined' ? ProfilePage : Placeholder,
    'settings':         typeof SettingsPage !== 'undefined' ? SettingsPage : Placeholder,
    'notification':     typeof NotificationPage !== 'undefined' ? NotificationPage : Placeholder,
    'trash':            typeof TrashPage !== 'undefined' ? TrashPage : Placeholder,
    'adv-dashboard':    typeof AdvertiserDashboard !== 'undefined' ? AdvertiserDashboard : Placeholder,
  };

  // Check role access
  const navEntry = [...NAV, ...SECONDARY_NAV].find(n => n.key === route);
  if (navEntry?.roles && !navEntry.roles.includes(role)) {
    return AccessDenied;
  }

  return views[route] || views['dashboard'];
}

// --- Access Denied view ---
function AccessDenied() {
  const { role, setView } = useApp();
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
          <Icon name="shield" size={28}/>
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-ink dark:text-slate-100">Akses ditolak</h2>
        <p className="mt-2 text-muted">Role <b className="text-ink dark:text-slate-100">{role}</b> tidak memiliki akses ke halaman ini.</p>
        <button onClick={() => setView('dashboard')} className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700">
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}

// --- Placeholder for views not yet loaded ---
function Placeholder() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-muted text-sm">
      Halaman ini belum tersedia.
    </div>
  );
}

// --- Public route bar (shown when on landing/campaign-detail) ---
function PublicRouteBar() {
  const { route, setView: navigate, user, role } = useApp();
  const isPublic = route === 'landing' || route === 'campaign-detail';
  if (!isPublic) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[55]">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-full shadow-pop border border-line dark:border-slate-700 px-1.5 py-1 flex items-center gap-1 text-xs">
        <span className="px-2 text-muted">Anda di halaman publik</span>
        {user ? (
          <button onClick={() => navigate(NAV_ROLE_KEYS[role]?.[0] || 'dashboard')} className="inline-flex items-center gap-1 px-3 h-7 rounded-full bg-brand-600 text-white font-semibold">
            Dashboard <Icon name="arrowR" size={12}/>
          </button>
        ) : (
          <button onClick={() => navigate('dashboard')} className="inline-flex items-center gap-1 px-3 h-7 rounded-full bg-brand-600 text-white font-semibold">
            Masuk <Icon name="arrowR" size={12}/>
          </button>
        )}
      </div>
    </div>
  );
}

// --- Campaign detail wrapper (public) ---
function CampaignDetailWrap() {
  const { navigate, campaignDetail } = useApp();
  const id = campaignDetail || (typeof CAMPAIGNS !== 'undefined' && CAMPAIGNS[0]?.id);
  return <CampaignDetail id={id} onBack={() => navigate('landing')}/>;
}

// --- Skeleton type mapping per route ---
const SKELETON_MAP = {
  'dashboard': 'dashboard',
  'campaigns': 'campaigns',
  'campaign-editor': 'campaign-editor',
  'analytics': 'analytics',
  'data-studio': 'data-studio',
  'cs-inbox': 'cs-inbox',
  'fundraiser': 'fundraiser',
  'shortcode': 'shortcode',
  'members': 'members',
  'profile': 'profile',
  'settings': 'settings',
  'notification': 'notification',
  'trash': 'trash',
  'adv-dashboard': 'adv-dashboard',
};

// --- LazyView: shows skeleton then fades in the real view ---
function LazyView({ component: Comp, skeleton }) {
  const [ready, setReady] = uS(false);
  uE(() => {
    setReady(false);
    let tid;
    const frame = requestAnimationFrame(() => {
      tid = setTimeout(() => setReady(true), 300);
    });
    return () => { cancelAnimationFrame(frame); clearTimeout(tid); };
  }, [Comp]);

  if (!ready) return <PageSkeleton type={skeleton}/>;
  return (
    <div className="fadeup">
      <Comp/>
    </div>
  );
}

// --- Mount ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);

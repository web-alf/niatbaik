// Standalone useTweaks hook (replaces design-tool dependency)
function useTweaks(defaults) {
  const [state, setState] = React.useState(defaults);
  const setTweak = (key, val) => setState(prev => ({ ...prev, [key]: val }));
  return [state, setTweak];
}

const { useState: uS_a, useEffect: uE_a, useMemo: uM_a } = React;

const TWEAK_DEFAULTS = {
  "dark": false,
  "primary": "#2E4191",
  "density": "comfortable",
  "sidebar": "expanded"
};

function App(){
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = uS_a('landing');
  const [campaignId, setCampaignId] = uS_a(CAMPAIGNS[0].id);
  const [invoice, setInvoice] = uS_a(null);
  const [toast, setToast] = uS_a(null);
  const [showTweaks, setShowTweaks] = uS_a(false);
  const [user, setUser] = uS_a(null);
  const [authLoading, setAuthLoading] = uS_a(true);

  const role = user?.role || 'Admin';

  // Check token on mount
  uE_a(() => {
    const token = api.getToken();
    if (token) {
      api.me().then(res => {
        if (res?.success && res?.data) {
          setUser(res.data);
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

  // Landing nav helper for login page
  uE_a(() => {
    window.__nbNavigateLanding = () => { setRoute('landing'); window.scrollTo({top:0,behavior:'instant'}); };
    return () => { delete window.__nbNavigateLanding; };
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    const defaultRoute = NAV_BY_ROLE[userData.role]?.[0] || 'dashboard';
    setRoute(defaultRoute);
    window.scrollTo({top:0,behavior:'instant'});
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setRoute('landing');
    window.scrollTo({top:0,behavior:'instant'});
  };

  uE_a(()=>{
    document.documentElement.classList.toggle('dark', !!tweaks.dark);
    document.body.classList.toggle('dark', !!tweaks.dark);
  },[tweaks.dark]);

  uE_a(()=>{
    document.documentElement.classList.remove('density-compact','density-comfortable');
    document.documentElement.classList.add('density-'+(tweaks.density||'comfortable'));
  },[tweaks.density]);

  uE_a(()=>{
    const c = tweaks.primary || '#2E4191';
    const palette = {
      '#2E4191': { 50:'#eef1fb',100:'#dbe2f6',200:'#b6c4ec',300:'#8ea3df',400:'#6781d0',500:'#4762bd',600:'#2E4191',700:'#283879',800:'#202c5e',900:'#1a2450' },
      '#1d4ed8': { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#1d4ed8',700:'#1e40af',800:'#1e3a8a',900:'#172554' },
      '#0e7490': { 50:'#ecfeff',100:'#cffafe',200:'#a5f3fc',300:'#67e8f9',400:'#22d3ee',500:'#06b6d4',600:'#0e7490',700:'#155e75',800:'#164e63',900:'#083344' },
      '#16a34a': { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d' },
      '#7c3aed': { 50:'#faf5ff',100:'#f3e8ff',200:'#e9d5ff',300:'#d8b4fe',400:'#c084fc',500:'#a855f7',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95' },
      '#dc2626': { 50:'#fef2f2',100:'#fee2e2',200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c',800:'#991b1b',900:'#7f1d1d' },
    };
    const p = palette[c] || palette['#2E4191'];
    const id = '__brand-override';
    let style = document.getElementById(id);
    if (!style){ style = document.createElement('style'); style.id = id; document.head.appendChild(style); }
    if (c === '#2E4191'){ style.textContent = ''; return; }
    style.textContent = `
      .bg-brand-50{background-color:${p[50]} !important}
      .bg-brand-100{background-color:${p[100]} !important}
      .bg-brand-600{background-color:${p[600]} !important}
      .bg-brand-700{background-color:${p[700]} !important}
      .bg-brand-900{background-color:${p[900]} !important}
      .hover\\:bg-brand-700:hover{background-color:${p[700]} !important}
      .hover\\:bg-brand-100:hover{background-color:${p[100]} !important}
      .text-brand-300{color:${p[300]} !important}
      .text-brand-600{color:${p[600]} !important}
      .text-brand-700{color:${p[700]} !important}
      .border-brand-300{border-color:${p[300]} !important}
      .border-brand-400{border-color:${p[400]} !important}
      .border-brand-600{border-color:${p[600]} !important}
      .ring-brand-200{--tw-ring-color:${p[200]} !important}
      .focus\\:ring-brand-200:focus{--tw-ring-color:${p[200]} !important}
      .focus\\:border-brand-400:focus{border-color:${p[400]} !important}
      .from-brand-600{--tw-gradient-from:${p[600]} !important;--tw-gradient-to:${p[600]}00 !important;--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to) !important}
      .from-brand-700{--tw-gradient-from:${p[700]} !important;--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to) !important}
      .to-brand-600{--tw-gradient-to:${p[600]} !important}
      .via-brand-600{--tw-gradient-stops:var(--tw-gradient-from),${p[600]},var(--tw-gradient-to) !important}
      .dark .dark\\:bg-brand-900\\/30{background-color:${p[900]}4d !important}
      .dark .dark\\:bg-brand-900\\/40{background-color:${p[900]}66 !important}
      .dark .dark\\:bg-brand-900\\/60{background-color:${p[900]}99 !important}
      .dark .dark\\:text-brand-200{color:${p[200]} !important}
      .dark .dark\\:text-brand-300{color:${p[300]} !important}
    `;
  },[tweaks.primary]);

  // Load real data from API if available
  uE_a(() => { loadApiData(); }, []);

  const navigate = (r) => { setRoute(r); window.scrollTo({top:0,behavior:'instant'}); };
  const openCampaign = (id) => { setCampaignId(id); setRoute('campaign-detail'); window.scrollTo({top:0,behavior:'instant'}); };
  const openInvoice = (tx) => setInvoice(tx);

  const ctx = { role, route, navigate, openCampaign, campaignId, tweaks, setTweak, openInvoice, user, setUser, logout: handleLogout };

  // Show loading spinner during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg2 dark:bg-slate-950">
        <div className="text-center">
          <Logo size={36} />
          <div className="mt-4 text-sm text-muted">Memuat...</div>
        </div>
      </div>
    );
  }

  const isPublicRoute = route === 'landing' || route === 'campaign-detail';

  // Not logged in + trying to access admin route → show login
  if (!user && !isPublicRoute) {
    return (
      <AppCtx.Provider value={ctx}>
        <LoginPage onLogin={handleLogin} />
      </AppCtx.Provider>
    );
  }

  return (
    <AppCtx.Provider value={ctx}>
      <Router/>
      <InvoiceModal tx={invoice} onClose={()=>setInvoice(null)}/>
      <Toast toast={toast} onClose={()=>setToast(null)}/>
      <RouteBar/>
      <SettingsFloatBtn show={showTweaks} onToggle={()=>setShowTweaks(!showTweaks)}/>
      {showTweaks && <SettingsFloat tweaks={tweaks} setTweak={setTweak} navigate={navigate} openCampaign={openCampaign} openInvoice={openInvoice} onClose={()=>setShowTweaks(false)}/>}
    </AppCtx.Provider>
  );
}

function SettingsFloatBtn({ show, onToggle }){
  return (
    <button onClick={onToggle} className="fixed right-4 bottom-4 z-[60] w-12 h-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-pop flex items-center justify-center transition" title="Pengaturan tampilan">
      {show ? <Icons.X w={20} h={20}/> : <Icons.Settings w={20} h={20}/>}
    </button>
  );
}

function SettingsFloat({ tweaks, setTweak, navigate, openCampaign, openInvoice, onClose }){
  const { user } = useApp();
  return (
    <div className="fixed right-4 bottom-20 z-[59] w-[280px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-pop border border-line p-4 space-y-4 fadeup">
      <div className="flex items-center justify-between">
        <div className="font-bold text-sm text-ink dark:text-slate-100">Pengaturan</div>
        <button onClick={onClose} className="text-slate-400 hover:text-ink"><Icons.X w={16} h={16}/></button>
      </div>

      <div>
        <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Tampilan</div>
        <label className="flex items-center justify-between cursor-pointer mb-2">
          <span className="text-sm text-ink dark:text-slate-200">Dark mode</span>
          <button onClick={()=>setTweak('dark',!tweaks.dark)} className={`relative w-11 h-6 rounded-full transition ${tweaks.dark?'bg-brand-600':'bg-slate-200'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${tweaks.dark?'translate-x-5':''}`}/>
          </button>
        </label>

        <div className="text-xs text-muted mb-1">Primary color</div>
        <div className="flex gap-1.5 mb-3">
          {['#2E4191','#1d4ed8','#0e7490','#16a34a','#7c3aed','#dc2626'].map(c=>(
            <button key={c} onClick={()=>setTweak('primary',c)} className={`w-7 h-7 rounded-lg border-2 transition ${tweaks.primary===c?'border-ink dark:border-white scale-110':'border-transparent'}`} style={{background:c}}/>
          ))}
        </div>

        <div className="text-xs text-muted mb-1">Density</div>
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 mb-2">
          {['compact','comfortable'].map(d=>(
            <button key={d} onClick={()=>setTweak('density',d)} className={`flex-1 px-2 h-7 rounded-md text-xs font-medium ${tweaks.density===d?'bg-white dark:bg-slate-700 shadow-sm':''}`}>{d}</button>
          ))}
        </div>

        <div className="text-xs text-muted mb-1">Sidebar</div>
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          {['expanded','collapsed'].map(s=>(
            <button key={s} onClick={()=>setTweak('sidebar',s)} className={`flex-1 px-2 h-7 rounded-md text-xs font-medium ${tweaks.sidebar===s?'bg-white dark:bg-slate-700 shadow-sm':''}`}>{s}</button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Navigasi</div>
        <div className="space-y-1">
          <button onClick={()=>{navigate('landing');onClose();}} className="w-full text-left text-xs px-2 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 font-medium">→ Landing page</button>
          <button onClick={()=>{openCampaign(CAMPAIGNS[0].id);onClose();}} className="w-full text-left text-xs px-2 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 font-medium">→ Campaign detail</button>
          {user && <button onClick={()=>{navigate('dashboard');onClose();}} className="w-full text-left text-xs px-2 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 font-medium">→ Admin dashboard</button>}
          {user && <button onClick={()=>{openInvoice(TRANSACTIONS[0]);onClose();}} className="w-full text-left text-xs px-2 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 font-medium">→ Modal invoice</button>}
        </div>
      </div>
    </div>
  );
}

function RouteBar(){
  const { route, navigate, role, user } = useApp();
  const isPublic = route==='landing' || route==='campaign-detail';
  if (!isPublic) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[55]">
      <div className="bg-white/95 backdrop-blur rounded-full shadow-pop border border-line px-1.5 py-1 flex items-center gap-1 text-xs">
        <span className="px-2 text-muted">Anda di halaman publik</span>
        {user ? (
          <button onClick={()=>navigate(NAV_BY_ROLE[role][0])} className="inline-flex items-center gap-1 px-3 h-7 rounded-full bg-brand-600 text-white font-semibold">
            Dashboard <Icons.ArrowRight w={12} h={12}/>
          </button>
        ) : (
          <button onClick={()=>navigate('dashboard')} className="inline-flex items-center gap-1 px-3 h-7 rounded-full bg-brand-600 text-white font-semibold">
            Masuk <Icons.ArrowRight w={12} h={12}/>
          </button>
        )}
      </div>
    </div>
  );
}

function Router(){
  const { route } = useApp();

  if (route==='landing') return <LandingPage/>;
  if (route==='campaign-detail') return <CampaignDetailWrap/>;

  const def = NAV_DEFS[route] || NAV_DEFS.dashboard;
  return (
    <AppShell title={def.label} subtitle="">
      {route==='dashboard' && <AdminDashboard/>}
      {route==='campaigns' && <CampaignsPage/>}
      {route==='analytics' && <AnalyticsPage/>}
      {route==='fundraiser' && <FundraiserPage/>}
      {route==='shortcode' && <ShortcodePage/>}
      {route==='members' && <MembersPage/>}
      {route==='profile' && <ProfilePage/>}
      {route==='settings' && <SettingsPage/>}
      {route==='notification' && <NotificationPage/>}
      {route==='trash' && <TrashPage/>}
      {route==='cs-inbox' && <CsInbox/>}
      {route==='transactions' && <TransactionsPage/>}
      {route==='adv-dashboard' && <AdvertiserDashboard/>}
      {route==='tracking' && <TrackingSettings/>}
    </AppShell>
  );
}

function CampaignDetailWrap(){
  const { navigate, campaignId } = useApp();
  return <CampaignDetail id={campaignId || CAMPAIGNS[0].id} onBack={()=>navigate('landing')}/>;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);

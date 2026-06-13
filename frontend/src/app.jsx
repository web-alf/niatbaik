// Root app shell: auth flow, role-isolated routing, sidebar/topbar, public routes.
// Ported from canonical design (docs/superpowers/design-ref/src/app.jsx) and
// wired to the real Go backend (window.api) + seed fallback (window.NB).
const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR, useCallback: uC } = React;

// =============================================================
// NAV — canonical design keys
// =============================================================
const NAV = [
  { key: 'dashboard',     label: 'Dashboard',      icon: 'home',      roles: ['Admin', 'CS', 'Advertiser'] },
  { key: 'campaigns',     label: 'Campaigns',      icon: 'megaphone', roles: ['Admin', 'CS', 'Advertiser'] },
  { key: 'analytics',     label: 'Analytics',      icon: 'chart',     roles: ['Admin', 'Advertiser'] },
  { key: 'data-studio',   label: 'Data Studio',    icon: 'sparkle',   roles: ['Admin', 'Advertiser'] },
  { key: 'inbox',         label: 'CS Inbox',       icon: 'inbox',     roles: ['Admin', 'CS'], badge: 12 },
  { key: 'fundraiser',    label: 'Fundraiser',     icon: 'handshake', roles: ['Admin', 'CS'] },
  { key: 'members',       label: 'Members / User', icon: 'users',     roles: ['Admin'] },
  { key: 'notifications', label: 'Notification',   icon: 'bell',      roles: ['Admin', 'CS', 'Advertiser'], badge: 4 },
  { key: 'trash',         label: 'Trash',          icon: 'trash',     roles: ['Admin'] }
];

const SECONDARY_NAV = [
  { key: 'profile',  label: 'Profile',  icon: 'user' },
  { key: 'settings', label: 'Settings', icon: 'cog', roles: ['Admin'] }
];

const ROLE_META = {
  Admin:      { color: 'bg-brand-600',  ring: 'ring-brand-600',  light: 'bg-brand-50',  text: 'text-brand-700',  icon: 'shield',  tag: 'Full Access' },
  CS:         { color: 'bg-sky2-500',   ring: 'ring-sky2-500',   light: 'bg-sky2-50',   text: 'text-sky2-600',   icon: 'inbox',   tag: 'Operasional' },
  Advertiser: { color: 'bg-violet-600', ring: 'ring-violet-600', light: 'bg-violet-50', text: 'text-violet-700', icon: 'chart',   tag: 'Marketing' }
};

// Backend role (admin/cs/advertiser/fundraiser/user) → design role
const ROLE_MAP = { admin: 'Admin', cs: 'CS', advertiser: 'Advertiser', fundraiser: 'Admin', user: 'Admin' };
const toDesignRole = (u) => ROLE_META[u?.role] ? u.role : (ROLE_MAP[u?.role] || u?.role || 'Admin');

// Build role → allowed nav keys lookup
const NAV_ROLE_KEYS = {};
['Admin', 'CS', 'Advertiser'].forEach(r => {
  NAV_ROLE_KEYS[r] = NAV.filter(n => n.roles.includes(r)).map(n => n.key);
});

// =============================================================
// SIDEBAR
// =============================================================
function Sidebar({ open, onClose }) {
  const { view, setView, role } = useApp();
  const visible = NAV.filter((n) => n.roles.includes(role));
  const visibleSecondary = SECONDARY_NAV.filter((n) => !n.roles || n.roles.includes(role));
  const m = ROLE_META[role] || ROLE_META.Admin;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={onClose}/>}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-white border-r border-line flex flex-col transition-transform ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-16 px-5 flex items-center border-b border-line">
          <Logo size={28}/>
        </div>

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

        <div className="flex-1 overflow-y-auto px-3 py-4 nice-scroll">
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
          <button onClick={() => { setView('landing'); onClose && onClose(); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-ink/80 hover:bg-bg2 hover:text-ink">
            <Icon name="globe" size={18} className="text-mute"/>
            <span className="flex-1 text-left">Lihat situs publik</span>
            <Icon name="arrowR" size={14} className="text-mute"/>
          </button>
        </div>
      </aside>
    </>
  );
}

// =============================================================
// USER MENU
// =============================================================
function UserMenu() {
  const { user, role, setView, logout, dark, setDark } = useApp();
  const [open, setOpen] = uS(false);
  const m = ROLE_META[role] || ROLE_META.Admin;

  uE(() => {
    if (!open) return;
    const handler = (e) => { if (!e.target.closest('[data-usermenu]')) setOpen(false); };
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
            {user.initial || (user.name || 'U').slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="hidden sm:block text-left">
          <div className="text-xs font-bold text-ink leading-tight">{user.name}</div>
          <div className="text-[10px] text-mute">{role}</div>
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
                {user.initial || (user.name || 'U').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-ink truncate">{user.name}</div>
              <div className="text-xs text-mute truncate">{user.email}</div>
            </div>
            <span className={`px-2 py-0.5 rounded-md ${m.color} text-white text-[10px] font-bold`}>{role}</span>
          </div>

          {user.access && (
            <div className="px-4 py-2.5 border-b border-line">
              <div className="text-[10px] font-bold uppercase tracking-wider text-mute">Akses</div>
              <div className="text-xs text-ink/80 mt-0.5">{user.access}</div>
            </div>
          )}

          <div className="p-1.5">
            <button onClick={() => { setView('profile'); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-bg2 text-left">
              <Icon name="user" size={16} className="text-mute"/> Profile saya
            </button>
            {SECONDARY_NAV.find(n => n.key === 'settings' && (!n.roles || n.roles.includes(role))) && (
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
  const { setView, setInvoiceTxn } = useApp();
  const [searchQ, setSearchQ] = uS('');
  const [searchResults, setSearchResults] = uS(null);
  const [searchOpen, setSearchOpen] = uS(false);
  const [searchLoading, setSearchLoading] = uS(false);
  const inputRef = uR(null);
  const wrapRef = uR(null);
  const debounceRef = uR(null);

  // Debounced search
  const doSearch = uC((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setSearchResults(null); setSearchLoading(false); return; }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const [cRes, uRes, iRes] = await Promise.all([
          api.adminCampaigns('search=' + encodeURIComponent(q) + '&limit=5'),
          api.users('search=' + encodeURIComponent(q) + '&limit=5'),
          api.invoices('search=' + encodeURIComponent(q) + '&limit=5'),
        ]);
        setSearchResults({
          campaigns: cRes?.data || [],
          users: uRes?.data || [],
          invoices: iRes?.data || [],
        });
      } catch (e) {
        console.error('[Search]', e);
        setSearchResults({ campaigns: [], users: [], invoices: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  // Trigger search on query change
  uE(() => { doSearch(searchQ); }, [searchQ, doSearch]);

  // Cmd+K shortcut
  uE(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') { setSearchOpen(false); setSearchQ(''); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close on outside click
  uE(() => {
    if (!searchOpen) return;
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setSearchOpen(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  const hasResults = searchResults && (searchResults.campaigns.length || searchResults.users.length || searchResults.invoices.length);
  const noResults = searchResults && !hasResults && !searchLoading;

  const pickCampaign = (c) => { setSearchOpen(false); setSearchQ(''); setView('campaigns'); };
  const pickUser = (u) => { setSearchOpen(false); setSearchQ(''); setView('members'); };
  const pickInvoice = (inv) => { setSearchOpen(false); setSearchQ(''); setInvoiceTxn(inv); };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/85 backdrop-blur border-b border-line">
      <div className="h-full px-4 lg:px-6 flex items-center gap-3">
        <button onClick={onMenu} className="lg:hidden h-9 w-9 rounded-lg hover:bg-bg2 flex items-center justify-center text-mute">
          <Icon name="menu" size={20}/>
        </button>

        <div className="flex-1 max-w-xl hidden md:block" ref={wrapRef}>
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute"/>
            <input
              ref={inputRef}
              value={searchQ}
              onChange={(e) => { setSearchQ(e.target.value); setSearchOpen(true); }}
              onFocus={() => { if (searchQ.length >= 2) setSearchOpen(true); }}
              placeholder="Cari campaign, donatur, invoice…"
              className="w-full h-10 rounded-lg border border-line bg-bg2 pl-9 pr-14 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"/>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-mute bg-white border border-line rounded px-1.5 py-0.5">⌘K</span>

            {searchOpen && searchQ.length >= 2 && (
              <div className="absolute z-50 mt-2 left-0 right-0 bg-white rounded-xl shadow-pop border border-line max-h-[400px] overflow-y-auto">
                {searchLoading && !searchResults && (
                  <div className="text-sm text-mute text-center py-6">Mencari...</div>
                )}

                {noResults && (
                  <div className="text-sm text-mute text-center py-6">Tidak ada hasil untuk "{searchQ}"</div>
                )}

                {hasResults && (
                  <>
                    {searchResults.campaigns.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-mute px-3 py-2 flex items-center gap-1.5">
                          <Icon name="megaphone" size={12}/> Campaigns
                        </div>
                        {searchResults.campaigns.map((c) => (
                          <div key={c.id || c.slug} onClick={() => pickCampaign(c)} className="flex items-center gap-3 px-3 py-2 hover:bg-bg2 cursor-pointer rounded-lg mx-1">
                            <div className="h-8 w-8 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name="megaphone" size={14}/></div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-ink truncate">{c.title}</div>
                              <div className="text-[11px] text-mute">{c.status || 'campaign'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.users.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-mute px-3 py-2 flex items-center gap-1.5">
                          <Icon name="users" size={12}/> Users
                        </div>
                        {searchResults.users.map((u) => (
                          <div key={u.id} onClick={() => pickUser(u)} className="flex items-center gap-3 px-3 py-2 hover:bg-bg2 cursor-pointer rounded-lg mx-1">
                            <div className="h-8 w-8 rounded-md bg-sky2-50 text-sky2-600 flex items-center justify-center shrink-0"><Icon name="user" size={14}/></div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-ink truncate">{u.name}</div>
                              <div className="text-[11px] text-mute truncate">{u.email} {u.role ? '· ' + u.role : ''}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.invoices.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-mute px-3 py-2 flex items-center gap-1.5">
                          <Icon name="receipt" size={12}/> Invoices
                        </div>
                        {searchResults.invoices.map((inv) => (
                          <div key={inv.invoice_number || inv.id} onClick={() => pickInvoice(inv)} className="flex items-center gap-3 px-3 py-2 hover:bg-bg2 cursor-pointer rounded-lg mx-1">
                            <div className="h-8 w-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Icon name="receipt" size={14}/></div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-ink truncate">{inv.invoice_number}</div>
                              <div className="text-[11px] text-mute truncate">{inv.donor_name} {inv.amount ? '· Rp ' + Number(inv.amount).toLocaleString('id-ID') : ''}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <button className="md:hidden h-10 w-10 rounded-lg border border-line bg-white hover:bg-bg2 flex items-center justify-center text-ink" aria-label="Search">
          <Icon name="search" size={18}/>
        </button>

        <div className="flex-1"/>

        <UserMenu/>
      </div>
    </header>
  );
}

// =============================================================
// APP
// =============================================================
// Map a URL path (from a reset email link or deep link) to an initial public route.
// Parse the campaign slug from a /c/<slug> share URL, if present.
function campaignSlugFromPath() {
  try {
    const m = window.location.pathname.match(/^\/c\/([^/?#]+)/);
    if (m && m[1]) return decodeURIComponent(m[1]);
  } catch {}
  return '';
}

function initialRouteFromPath() {
  try {
    const p = window.location.pathname;
    if (p === '/reset-password') return 'reset-password';
    if (p === '/forgot-password') return 'forgot-password';
    if (/^\/c\/[^/?#]+/.test(p)) return 'campaign-detail';
  } catch {}
  return 'landing';
}

function App() {
  const [user, setUser] = uS(null);
  const [route, setRouteRaw] = uS(initialRouteFromPath);
  const [authLoading, setAuthLoading] = uS(true);
  const [toast, setToast] = uS('');
  const [sidebarOpen, setSidebarOpen] = uS(false);
  const [invoiceTxn, setInvoiceTxn] = uS(null);
  // Seed from a /c/<slug> deep-link so a direct visit/refresh opens that campaign.
  const [campaignDetail, setCampaignDetail] = uS(() => campaignSlugFromPath() || null);
  const [editingCampaign, setEditingCampaign] = uS(null);
  const [adsGuideOpen, setAdsGuideOpen] = uS(false);
  const [dark, setDarkRaw] = uS(() => {
    try { return localStorage.getItem('niatbaik_dark') === '1'; } catch { return false; }
  });

  const role = toDesignRole(user);

  // --- Dark mode ---
  const setDark = (v) => {
    setDarkRaw(v);
    try { localStorage.setItem('niatbaik_dark', v ? '1' : '0'); } catch {}
    document.documentElement.classList.toggle('dark', v);
    document.body.classList.toggle('dark', v);
  };
  uE(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  // --- Route setter ---
  const setView = (v) => { setRouteRaw(v); window.scrollTo({ top: 0, behavior: 'instant' }); };

  // --- Keep the browser URL in sync with the route ---
  // Without this the address bar stayed bare "/" no matter where you navigated, so a
  // shared campaign link couldn't be produced and the back button did nothing. We
  // reflect only PUBLIC, shareable locations into the path: /c/<slug> for a campaign
  // detail, "/" otherwise. (Dashboard sub-views stay on "/" — they're behind login.)
  const urlSyncedOnce = uR(false);
  uE(() => {
    let target = '/';
    if (route === 'campaign-detail') {
      const cd = campaignDetail;
      const slug = (cd && typeof cd === 'object') ? (cd.slug || cd.id) : cd;
      if (slug) target = '/c/' + slug;
    } else if (route === 'reset-password') {
      target = '/reset-password';
    } else if (route === 'forgot-password') {
      target = '/forgot-password';
    }
    try {
      // No-op when the URL already matches (prevents stacking duplicate "/" entries
      // as you move between dashboard sub-views).
      if (window.location.pathname === target) { urlSyncedOnce.current = true; return; }
      // First sync after mount replaces (don't add a spurious history entry on top of
      // the entry the user arrived on); later navigations push so Back works.
      if (!urlSyncedOnce.current) {
        window.history.replaceState({ route }, '', target + window.location.search);
      } else {
        window.history.pushState({ route }, '', target + window.location.search);
      }
      urlSyncedOnce.current = true;
    } catch {}
  }, [route, campaignDetail]);

  // Back/forward: re-derive the route from the URL so navigation history works.
  // user is read from a ref so the listener is registered once (no re-register churn
  // on login/profile changes, which could drop a queued back-click).
  const userRef = uR(user);
  userRef.current = user;
  uE(() => {
    const onPop = () => {
      const slug = campaignSlugFromPath();
      if (slug) { setCampaignDetail(slug); setRouteRaw('campaign-detail'); }
      else {
        const p = window.location.pathname;
        if (p === '/reset-password') setRouteRaw('reset-password');
        else if (p === '/forgot-password') setRouteRaw('forgot-password');
        else setRouteRaw(userRef.current ? 'dashboard' : 'landing');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // --- Auth: check token on mount ---
  uE(() => {
    // Public flows must NOT be auto-redirected to the dashboard even when a valid
    // session exists — otherwise a logged-in admin opening a /c/<slug> share link gets
    // bounced to the dashboard and the campaign looks like a 404 (only worked in a
    // logged-out browser). Covers reset/forgot AND the public campaign-detail route.
    // (Bare "/" still lands logged-in users on the dashboard, the established UX.)
    const onPublicFlow = route === 'reset-password' || route === 'forgot-password' ||
      route === 'campaign-detail';
    const token = api.getToken && api.getToken();
    if (token) {
      api.me().then(res => {
        if (res?.data) {
          setUser(res.data);
          if (!onPublicFlow) setRouteRaw('dashboard');
        } else {
          api.clearToken && api.clearToken();
        }
      }).catch(() => {
        api.clearToken && api.clearToken();
      }).finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  // --- Load API data (await before rendering views) ---
  const [dataReady, setDataReady] = uS(false);
  // dataTick bumps on every realtime refresh; changing it re-renders the current view
  // so it re-reads the freshly-updated window.* globals (covers all dashboard pages).
  const [dataTick, setDataTick] = uS(0);
  uE(() => {
    let cancelled = false;
    (async () => {
      setDataReady(false);
      await (window.refreshAllData ? window.refreshAllData(!!user) : Promise.resolve());
      if (!cancelled) setDataReady(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // --- Realtime auto-refresh (long-poll) ---
  // While logged in, hold a long-poll on /api/events; when the server's data revision
  // advances (any mutation anywhere), refetch everything and bump dataTick to
  // re-render. Pauses while the tab is hidden; backs off on error; self-cancels on
  // logout/unmount. Near-instant (<1s) without WebSockets — Cloudflare-friendly.
  uE(() => {
    if (!user) return;
    let stopped = false;
    let rev = 0;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    (async () => {
      // Seed the revision so the first poll only returns on a *new* change.
      try { const r0 = await api.events(0); rev = r0?.revision || 0; } catch {}
      while (!stopped) {
        if (document.hidden) { await sleep(2000); continue; }
        try {
          const res = await api.events(rev);
          if (stopped) break;
          if (res && res.changed) {
            rev = res.revision || rev;
            await (window.refreshAllData ? window.refreshAllData(true) : Promise.resolve());
            if (!stopped) setDataTick(t => t + 1);
          } else if (res && res.revision != null) {
            rev = res.revision; // timeout tick — just re-poll
          }
        } catch {
          // Network/auth blip — wait before retrying so we don't hot-loop.
          if (!stopped) await sleep(5000);
        }
      }
    })();
    return () => { stopped = true; };
  }, [user]);

  // --- Landing/login nav helpers (used by login + reset pages) ---
  uE(() => {
    window.__nbNavigateLanding = () => setView('landing');
    window.__nbNavigateLogin = () => setView('login');
    window.__nbNavigateForgot = () => setView('forgot-password');
    return () => {
      delete window.__nbNavigateLanding;
      delete window.__nbNavigateLogin;
      delete window.__nbNavigateForgot;
    };
  }, []);

  // --- Cross-component navigation events ---
  uE(() => {
    const goDS = () => setView('data-studio');
    const openGuide = () => setAdsGuideOpen(true);
    window.addEventListener('nb-go-datastudio', goDS);
    window.addEventListener('nb-open-ads-guide', openGuide);
    return () => {
      window.removeEventListener('nb-go-datastudio', goDS);
      window.removeEventListener('nb-open-ads-guide', openGuide);
    };
  }, []);

  // --- Login handler (accepts backend user object) ---
  const handleLogin = (userData) => {
    setUser(userData);
    // Note: the user object is intentionally NOT persisted to localStorage. Auth
    // state is rehydrated on mount from the JWT via api.me(), which is the single
    // source of truth; mirroring the full user (role/email) into localStorage was
    // dead (never read back) and needlessly exposed it to any XSS on the page.
    const r = toDesignRole(userData);
    const firstKey = NAV_ROLE_KEYS[r]?.[0] || 'dashboard';
    setView(firstKey);
  };

  // --- Logout ---
  const handleLogout = () => {
    api.logout && api.logout();
    setUser(null);
    // Clear any legacy persisted session left by older builds (no longer written).
    try { localStorage.removeItem('niatbaik_session'); } catch {}
    setView('landing');
  };

  // --- Update user (profile edits etc) ---
  const updateUser = (patch) => {
    setUser(prev => {
      if (!prev) return prev;
      return { ...prev, ...patch }; // not persisted — see handleLogin note
    });
  };

  // --- Toast (string or {title,...}) ---
  const showToast = (msg) => {
    const text = typeof msg === 'string' ? msg : (msg?.title || '');
    setToast(text);
    setTimeout(() => setToast(''), 2600);
  };

  // --- Role access guard ---
  uE(() => {
    if (!user) return;
    const all = [...NAV, ...SECONDARY_NAV];
    const cur = all.find(n => n.key === route);
    if (cur && cur.roles && !cur.roles.includes(role)) setRouteRaw('dashboard');
  }, [route, user, role]);

  // --- Session-expiry recovery ---
  // api.jsx fires 'nb-session-expired' when an authenticated request gets a 401
  // (token expired/revoked). Drop the user back to login instead of leaving them
  // on a dashboard where every action silently fails.
  uE(() => {
    const onExpired = () => {
      // Already logged out (no active user) — nothing to clean up and no reason to
      // flash a "session expired" toast at an anonymous visitor.
      if (!user) return;
      setUser(null);
      try { localStorage.removeItem('niatbaik_session'); } catch {}
      setView('login');
      showToast('Sesi Anda telah berakhir. Silakan masuk kembali.');
    };
    window.addEventListener('nb-session-expired', onExpired);
    return () => window.removeEventListener('nb-session-expired', onExpired);
  }, [user]);

  // --- Context ---
  const ctx = uM(() => ({
    user, role,
    view: route, setView,
    route, navigate: setView,
    login: handleLogin, logout: handleLogout, updateUser,
    invoiceTxn, setInvoiceTxn,
    campaignDetail, setCampaignDetail,
    editingCampaign, setEditingCampaign,
    showToast,
    dark, setDark,
    openCampaign: (id) => { setCampaignDetail(id); setView('campaign-detail'); },
    openInvoice: (tx) => setInvoiceTxn(tx),
    // Increments on every realtime data refresh; views can read this from useApp()
    // and pass it to useMemo deps to recompute derived lists when fresh data lands.
    dataTick,
    setRole: () => {}
  }), [user, role, route, invoiceTxn, campaignDetail, editingCampaign, dark, dataTick]);

  // --- Auth loading skeleton ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex bg-bg2">
        <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-line h-screen">
          <div className="h-16 px-5 flex items-center border-b border-line"><div className="h-7 w-28 bg-bg2 rounded-md shimmer"/></div>
          <div className="p-3 space-y-2 mt-2">{[1,2,3,4,5,6].map(i => <div key={i} className="h-9 bg-bg2 rounded-lg shimmer"/>)}</div>
        </aside>
        <div className="flex-1 min-w-0">
          <header className="h-16 bg-white border-b border-line flex items-center px-6 gap-3">
            <div className="h-10 w-64 bg-bg2 rounded-lg shimmer"/><div className="flex-1"/><div className="h-9 w-9 bg-bg2 rounded-lg shimmer"/>
          </header>
          <div className="p-6 space-y-5">
            <div className="h-8 w-72 bg-bg2 rounded-lg shimmer"/>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-line shimmer"/>)}</div>
            <div className="h-64 bg-white rounded-2xl border border-line shimmer"/>
          </div>
        </div>
      </div>
    );
  }

  // --- Auth flows (reset/forgot password) — always public, render before any
  // user/login gating so a reset link works whether or not a session exists. ---
  if (route === 'reset-password') {
    return (
      <AppCtx.Provider value={ctx}>
        <ViewErrorBoundary route={route}>
          {window.ResetPasswordPage ? <window.ResetPasswordPage/> : null}
        </ViewErrorBoundary>
        <Toast message={toast}/>
      </AppCtx.Provider>
    );
  }
  if (route === 'forgot-password') {
    return (
      <AppCtx.Provider value={ctx}>
        <ViewErrorBoundary route={route}>
          {window.ForgotPasswordPage ? <window.ForgotPasswordPage/> : null}
        </ViewErrorBoundary>
        <Toast message={toast}/>
      </AppCtx.Provider>
    );
  }

  // --- Public routes (no auth required) ---
  const isPublicRoute = route === 'landing' || route === 'campaign-detail';
  if (isPublicRoute && !dataReady) {
    return null;
  }
  if (isPublicRoute) {
    return (
      <AppCtx.Provider value={ctx}>
        <ViewErrorBoundary route={route}>
          {route === 'landing' && <LandingPage/>}
          {route === 'campaign-detail' && <CampaignDetailWrap/>}
        </ViewErrorBoundary>
        <Toast message={toast}/>
      </AppCtx.Provider>
    );
  }

  // --- Not logged in (or explicit login route) → login ---
  if (!user || route === 'login') {
    return (
      <AppCtx.Provider value={ctx}>
        <LoginPage onLogin={handleLogin}/>
        <Toast message={toast}/>
      </AppCtx.Provider>
    );
  }

  // --- Resolve view (window globals from view files) ---
  const Views = {
    dashboard:         window.DashboardView,
    campaigns:         window.CampaignsView,
    'campaign-editor': window.CampaignEditorView,
    analytics:         role === 'Advertiser' ? window.AdvertiserView : window.AnalyticsView,
    'data-studio':     window.DataStudioView,
    inbox:             window.CSInboxView,
    fundraiser:        window.FundraiserView,
    members:           window.MembersView,
    profile:           window.ProfileView,
    settings:          window.SettingsView,
    notifications:     window.NotificationsView,
    trash:             window.TrashView,
  };

  const navEntry = [...NAV, ...SECONDARY_NAV].find(n => n.key === route);
  let Cur = dataReady ? (Views[route] || window.DashboardView || Placeholder) : DashboardSkeleton;
  if (dataReady && navEntry?.roles && !navEntry.roles.includes(role)) Cur = AccessDenied;

  return (
    <AppCtx.Provider value={ctx}>
      <div className="min-h-screen flex bg-bg2">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar onMenu={() => setSidebarOpen(true)}/>
          <main className="flex-1 px-4 lg:px-6 py-6">
            <ViewErrorBoundary route={route}>
              <div className="fadeup">
                <Cur/>
              </div>
            </ViewErrorBoundary>
          </main>
        </div>
      </div>

      {invoiceTxn && (
        <InvoiceModal txn={invoiceTxn} onClose={() => setInvoiceTxn(null)}
          onCopy={(id) => showToast('Kode invoice ' + id + ' disalin')}/>
      )}
      {campaignDetail && route !== 'campaign-detail' && typeof window.CampaignDetailModal === 'function' && (
        <CampaignDetailModal campaign={campaignDetail} onClose={() => setCampaignDetail(null)}/>
      )}
      {typeof window.AdsGuideModal === 'function' && (
        <AdsGuideModal open={adsGuideOpen} onClose={() => setAdsGuideOpen(false)}/>
      )}
      <Toast message={toast}/>
    </AppCtx.Provider>
  );
}

// --- Data loading skeleton (shown inside layout while API fetches) ---
function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-72 bg-bg2 rounded-lg shimmer"/>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-line shimmer"/>)}
      </div>
      <div className="h-64 bg-white rounded-2xl border border-line shimmer"/>
      <div className="h-48 bg-white rounded-2xl border border-line shimmer"/>
    </div>
  );
}

// --- Access Denied view ---
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

// --- Placeholder for views not yet loaded ---
function Placeholder() {
  return <div className="min-h-[40vh] flex items-center justify-center text-mute text-sm">Halaman ini belum tersedia.</div>;
}

// --- Campaign detail wrapper (public route) ---
function CampaignDetailWrap() {
  const { navigate, campaignDetail } = useApp();
  // The slug comes from in-app navigation (campaignDetail — may be a slug string or
  // a campaign object) or the /c/<slug> URL. Do NOT fall back to list[0] — an unknown
  // slug must reach CampaignDetail so it shows "not found" instead of silently
  // opening a different campaign.
  const cd = campaignDetail;
  const id = (cd && typeof cd === 'object') ? (cd.slug || cd.id) : (cd || campaignSlugFromPath());
  if (typeof window.CampaignDetail !== 'function') {
    return <div className="min-h-screen flex items-center justify-center text-mute">Memuat campaign…</div>;
  }
  return <CampaignDetail id={id} onBack={() => navigate('landing')}/>;
}

// --- ErrorBoundary: a single view crash never blanks the whole app ---
class ViewErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('[ViewError]', this.props.route, error, info?.componentStack); }
  componentDidUpdate(prevProps) {
    if (prevProps.route !== this.props.route && this.state.error) this.setState({ error: null });
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="max-w-md text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icon name="bolt" size={28}/>
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-ink">Halaman gagal dimuat</h2>
            <p className="mt-2 text-sm text-mute">Terjadi kesalahan saat menampilkan halaman ini. Coba muat ulang.</p>
            <pre className="mt-3 text-left text-[11px] text-rose-600 bg-rose-50 rounded-lg p-3 overflow-auto max-h-32">{String(this.state.error?.message || this.state.error)}</pre>
            <button onClick={() => window.location.reload()} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700">
              Muat ulang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Mount ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);

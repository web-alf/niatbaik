// Admin shell: Sidebar + Topbar/UserMenu + realtime poll + cross-page modals + Outlet.
// Ported from app.jsx Sidebar/UserMenu/Topbar + the logged-in render branch.
import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon, Logo, InvoiceModal, Toast, ErrorBoundary } from '@/components';
import { NAV, SECONDARY_NAV, ROLE_META } from '@/lib/nav';
import { useAuth } from '@/context/AuthContext';
import { useUiStore } from '@/store/ui';
import { useDataStore } from '@/store/data';
import { RealtimeProvider } from '@/context/RealtimeProvider';
import { api, mediaUrl } from '@/lib/api';
import AdsGuidePage from '@/pages/admin/AdsGuidePage';

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role } = useAuth();
  const navigate = useNavigate();
  const visible = NAV.filter((n) => n.roles.includes(role));
  const visibleSecondary = SECONDARY_NAV.filter((n) => !n.roles || n.roles.includes(role));
  const m = ROLE_META[role] || ROLE_META.Admin;
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink/80 hover:bg-bg2 hover:text-ink'}`;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-white border-r border-line flex flex-col transition-transform ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-16 px-5 flex items-center border-b border-line"><Logo size={28} /></div>
        <div className="px-3 pt-3">
          <div className={`flex items-center gap-2.5 p-2.5 rounded-xl ${m.light} border border-line/60`}>
            <div className={`h-8 w-8 rounded-md ${m.color} text-white flex items-center justify-center shrink-0`}>
              <Icon name={m.icon} size={14} />
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
            {visible.map((n) => n.disabled ? (
              <div key={n.key} title={n.disabledHint || 'Dinonaktifkan'}
                className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-mute/50 cursor-not-allowed select-none">
                <Icon name={n.icon} size={18} className="text-mute/40" />
                <span className="flex-1 text-left">{n.label}</span>
                <span className="text-[9px] font-bold uppercase tracking-wide bg-bg2 text-mute/60 px-1.5 py-0.5 rounded">off</span>
              </div>
            ) : (
              <NavLink key={n.key} to={n.path} onClick={onClose} className={linkCls}>
                {({ isActive }) => (
                  <>
                    <Icon name={n.icon} size={18} className={isActive ? 'text-brand-600' : 'text-mute group-hover:text-ink'} />
                    <span className="flex-1 text-left">{n.label}</span>
                    {n.badge && <span className="text-[10px] font-bold bg-sky2-400 text-white px-1.5 py-0.5 rounded-full">{n.badge}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="px-2 mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-mute">Akun</div>
          <nav className="flex flex-col gap-1">
            {visibleSecondary.map((n) => (
              <NavLink key={n.key} to={n.path} onClick={onClose} className={linkCls}>
                {({ isActive }) => (
                  <>
                    <Icon name={n.icon} size={18} className={isActive ? 'text-brand-600' : 'text-mute group-hover:text-ink'} />
                    <span className="flex-1 text-left">{n.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 rounded-xl bg-brand-600 text-white p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
              <Icon name="sparkle" size={14} /> Tips
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
          <button onClick={() => { navigate('/'); onClose(); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-ink/80 hover:bg-bg2 hover:text-ink">
            <Icon name="globe" size={18} className="text-mute" />
            <span className="flex-1 text-left">Lihat situs publik</span>
            <Icon name="arrowR" size={14} className="text-mute" />
          </button>
        </div>
      </aside>
    </>
  );
}

function UserMenu() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const dark = useUiStore((s) => s.dark);
  const setDark = useUiStore((s) => s.setDark);
  const [open, setOpen] = useState(false);
  const m = ROLE_META[role] || ROLE_META.Admin;
  if (!user) return null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (!(e.target as Element).closest('[data-usermenu]')) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const initials = (user.name || 'U').slice(0, 2).toUpperCase();
  // Avatar is the persisted /uploads path from /auth/me under `image` (NOT `avatar` —
  // the backend has no such field), resolved via mediaUrl exactly like ProfilePage.
  const avatar = user.image ? mediaUrl(user.image) : null;
  return (
    <div className="relative" data-usermenu>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-lg border border-line bg-white hover:bg-bg2 transition-colors">
        {avatar ? <img src={avatar} alt={user.name} className="h-8 w-8 rounded-md object-cover" /> : (
          <div className={`h-8 w-8 rounded-md flex items-center justify-center text-white font-bold text-xs ${m.color}`}>{initials}</div>
        )}
        <div className="hidden sm:block text-left">
          <div className="text-xs font-bold text-ink leading-tight">{user.name}</div>
          <div className="text-[10px] text-mute">{role}</div>
        </div>
        <Icon name="chevronD" size={14} className="text-mute hidden sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-line shadow-pop z-50 overflow-hidden">
          <div className={`px-4 py-3.5 ${m.light} flex items-center gap-3 border-b border-line`}>
            {avatar ? <img src={avatar} alt={user.name} className="h-10 w-10 rounded-lg object-cover" /> : (
              <div className={`h-10 w-10 rounded-lg ${m.color} text-white flex items-center justify-center font-bold text-sm`}>{initials}</div>
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
            <button onClick={() => { navigate('/profile'); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-bg2 text-left">
              <Icon name="user" size={16} className="text-mute" /> Profile saya
            </button>
            {SECONDARY_NAV.find((n) => n.key === 'settings' && (!n.roles || n.roles.includes(role))) && (
              <button onClick={() => { navigate('/settings'); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-bg2 text-left">
                <Icon name="cog" size={16} className="text-mute" /> Settings
              </button>
            )}
            <button onClick={() => { navigate('/notifications'); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-bg2 text-left">
              <Icon name="bell" size={16} className="text-mute" /> Notifikasi
            </button>
            <button onClick={() => setDark(!dark)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-bg2 text-left">
              <Icon name={dark ? 'sun' : 'moon'} size={16} className="text-mute" />
              <span className="flex-1">Dark mode</span>
              <span className={`relative h-5 w-9 rounded-full transition-colors ${dark ? 'bg-brand-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-all ${dark ? 'left-[18px]' : 'left-0.5'}`} />
              </span>
            </button>
          </div>
          <div className="p-1.5 border-t border-line">
            <button onClick={() => { logout(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold text-rose-600 hover:bg-rose-50 text-left">
              <Icon name="logout" size={16} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const openInvoice = useUiStore((s) => s.openInvoice);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setSearchResults(null); setSearchLoading(false); return; }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      const qp = 'search=' + encodeURIComponent(q) + '&limit=5';
      // Only query endpoints this role may read (campaigns=staff, invoices=admin+cs,
      // users=admin). allSettled so one 403 can't blank the whole result set — the old
      // Promise.all rejected on the first forbidden call, leaving CS/Advertiser search dead.
      const canUsers = role === 'Admin';
      const canInvoices = role === 'Admin' || role === 'CS';
      const [cRes, uRes, iRes] = await Promise.allSettled([
        api.adminCampaigns(qp),
        canUsers ? api.users(qp) : Promise.resolve(null),
        canInvoices ? api.invoices(qp) : Promise.resolve(null),
      ]);
      const val = (r: any) => (r.status === 'fulfilled' ? r.value?.data || [] : []);
      setSearchResults({ campaigns: val(cRes), users: val(uRes), invoices: val(iRes) });
      setSearchLoading(false);
    }, 300);
  }, [role]);

  useEffect(() => { doSearch(searchQ); }, [searchQ, doSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); setSearchOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); setSearchQ(''); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setSearchOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  const hasResults = searchResults && (searchResults.campaigns.length || searchResults.users.length || searchResults.invoices.length);
  const noResults = searchResults && !hasResults && !searchLoading;

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/85 backdrop-blur border-b border-line">
      <div className="h-full px-4 lg:px-6 flex items-center gap-3">
        <button onClick={onMenu} className="lg:hidden h-9 w-9 rounded-lg hover:bg-bg2 flex items-center justify-center text-mute">
          <Icon name="menu" size={20} />
        </button>
        <div className="flex-1 max-w-xl hidden md:block" ref={wrapRef}>
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input ref={inputRef} value={searchQ}
              onChange={(e) => { setSearchQ(e.target.value); setSearchOpen(true); }}
              onFocus={() => { if (searchQ.length >= 2) setSearchOpen(true); }}
              placeholder="Cari campaign, donatur, invoice…"
              className="w-full h-10 rounded-lg border border-line bg-bg2 pl-9 pr-14 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-mute bg-white border border-line rounded px-1.5 py-0.5">⌘K</span>
            {searchOpen && searchQ.length >= 2 && (
              <div className="absolute z-50 mt-2 left-0 right-0 bg-white rounded-xl shadow-pop border border-line max-h-[400px] overflow-y-auto">
                {searchLoading && !searchResults && <div className="text-sm text-mute text-center py-6">Mencari...</div>}
                {noResults && <div className="text-sm text-mute text-center py-6">Tidak ada hasil untuk "{searchQ}"</div>}
                {hasResults && (
                  <>
                    {searchResults.campaigns.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-mute px-3 py-2 flex items-center gap-1.5"><Icon name="megaphone" size={12} /> Campaigns</div>
                        {searchResults.campaigns.map((c: any) => (
                          <div key={c.id || c.slug} onClick={() => { setSearchOpen(false); setSearchQ(''); navigate('/campaigns'); }} className="flex items-center gap-3 px-3 py-2 hover:bg-bg2 cursor-pointer rounded-lg mx-1">
                            <div className="h-8 w-8 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name="megaphone" size={14} /></div>
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
                        <div className="text-[10px] font-bold uppercase tracking-wider text-mute px-3 py-2 flex items-center gap-1.5"><Icon name="users" size={12} /> Users</div>
                        {searchResults.users.map((u: any) => (
                          <div key={u.id} onClick={() => { setSearchOpen(false); setSearchQ(''); navigate('/members'); }} className="flex items-center gap-3 px-3 py-2 hover:bg-bg2 cursor-pointer rounded-lg mx-1">
                            <div className="h-8 w-8 rounded-md bg-sky2-50 text-sky2-600 flex items-center justify-center shrink-0"><Icon name="user" size={14} /></div>
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
                        <div className="text-[10px] font-bold uppercase tracking-wider text-mute px-3 py-2 flex items-center gap-1.5"><Icon name="inbox" size={12} /> Invoices</div>
                        {searchResults.invoices.map((inv: any) => (
                          <div key={inv.invoice_number || inv.id} onClick={() => { setSearchOpen(false); setSearchQ(''); openInvoice(inv); }} className="flex items-center gap-3 px-3 py-2 hover:bg-bg2 cursor-pointer rounded-lg mx-1">
                            <div className="h-8 w-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Icon name="inbox" size={14} /></div>
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
          <Icon name="search" size={18} />
        </button>
        <div className="flex-1" />
        <UserMenu />
      </div>
    </header>
  );
}

export function AdminLayout() {
  const { user, role } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adsGuideOpen, setAdsGuideOpen] = useState(false);
  const invoiceTxn = useUiStore((s) => s.invoiceTxn);
  const closeInvoice = useUiStore((s) => s.closeInvoice);
  const showToast = useUiStore((s) => s.showToast);

  // Ads guide modal is opened by the sidebar's CustomEvent.
  useEffect(() => {
    const open = () => setAdsGuideOpen(true);
    window.addEventListener('nb-open-ads-guide', open);
    return () => window.removeEventListener('nb-open-ads-guide', open);
  }, []);

  // Close the mobile sidebar on route change.
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Boot admin data on entry. RealtimeProvider's long-poll only calls refreshAdmin() when
  // the server revision CHANGES — on a fresh load / deep-link straight to an admin route it
  // just seeds the revision and waits, so the panel would sit empty until the next server
  // mutation. Fire the authed refresh straight off the stored TOKEN (not the resolved user)
  // so it runs in parallel with api.me() instead of waiting a round-trip for it — a hard
  // reload of /dashboard then costs one batch of requests, not three serial ones. Guard so
  // it only fires once per load.
  const bootedRef = useRef(false);
  useEffect(() => {
    if (bootedRef.current) return;
    if (!(api.getToken && api.getToken())) return;
    bootedRef.current = true;
    useDataStore.getState().refreshAll(true);
  }, []);

  return (
    <RealtimeProvider enabled={!!user} role={role}>
      <div className="min-h-screen flex bg-bg2">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar onMenu={() => setSidebarOpen(true)} />
          <main className="flex-1 px-4 lg:px-6 py-6">
            <ErrorBoundary key={location.pathname}>
              <div className="fadeup"><Outlet /></div>
            </ErrorBoundary>
          </main>
        </div>
      </div>
      {invoiceTxn && (
        <InvoiceModal txn={invoiceTxn} onClose={closeInvoice} onCopy={(id: string) => showToast('Kode invoice ' + id + ' disalin')} />
      )}
      <AdsGuideMount open={adsGuideOpen} onClose={() => setAdsGuideOpen(false)} />
      <GlobalToast />
    </RealtimeProvider>
  );
}

// AdsGuide is a self-contained modal (renders null until open), so a plain static
// mount is enough — the codebase ships one bundle, no route-level code-splitting.
function AdsGuideMount({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AdsGuidePage open={open} onClose={onClose} />;
}

function GlobalToast() {
  const toast = useUiStore((s) => s.toast);
  return <Toast message={toast} />;
}

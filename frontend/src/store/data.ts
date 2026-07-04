// Central data store — replaces window.NB + all window.DATA_* caches + the
// data.jsx loaders + refreshAllData. Components subscribe via selectors, so a
// store update re-renders only the views that read the changed slice (the old
// dataTick counter is gone).
//
// RULE: use the useDataStore(selector) hook in render; use getState() only inside
// actions/effects (e.g. the realtime poll). A getState() snapshot read in render
// would silently stop updating on the next poll.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import { mapCampaign, mapInvoice, mapFundraiser, applyThemeColor, setPaymentStatusRef } from '@/lib/mappers';
import { NBTracking } from '@/lib/tracking';
import type {
  Campaign, Invoice, Category, PaymentMethod, PaymentStatus, NotificationItem, User,
} from '@/types/api';

// Resolve null (network failure) and exceptions to null so one dead endpoint
// never aborts a whole refresh batch.
const safe = async <X>(fn: () => Promise<X>): Promise<X | null> => {
  try { return await fn(); } catch { return null; }
};

// Bump on any breaking change to a persisted slice's shape. A version mismatch makes
// zustand/persist DROP the stale cache on load instead of hydrating incompatible data —
// so a deploy that changes a field can't leave ghost data in users' browsers.
// v2: dropped donor-PII slices (transactions, notifications) from the persisted set.
// v3: also dropped staff/fundraiser PII (users, fundraisers).
// v4: also dropped trash (deleted staff name/email).
// v5: also dropped profile (the logged-in user's own name/email/phone/address/bank).
// Each bump purges any older cache that still holds the now-excluded slices.
const DATA_STORE_VERSION = 5;

interface Totals {
  raised: number; donors: number; tx: number; activeCampaigns: number; totalCampaigns: number;
  fundraiser: number; leads: number; convRate: number; today: number; month: number;
}

interface DataState {
  // public (everyone)
  campaigns: Campaign[];
  categories: Category[];
  publicSettings: any | null;
  paymentMethodsPublic: PaymentMethod[];
  paymentStatuses: PaymentStatus[];
  // admin (logged-in)
  transactions: Invoice[];
  notifications: NotificationItem[];
  fundraisers: any[];
  users: User[];
  settings: any | null;
  profile: any | null;
  trash: any[];
  paymentMethodsList: PaymentMethod[];
  dailyDonations: any[];
  dashboardStats: any | null;
  paymentBreakdown: any | null;
  trafficSources: any | null;
  analyticsOverview: any | null;
  analyticsCampaigns: any | null;
  analyticsUtm: any | null;
  analyticsTraffic: any | null;
  analyticsFunnel: any | null;
  dataStudio: any | null;
  adCosts: any | null;
  totals: Totals;
  ready: boolean;
  loading: boolean;
  // adminRev increments every time refreshAdmin() finishes. Pages that fetch admin
  // data independently (withdrawals, members, notifications, trash)
  // subscribe to it to re-fetch when another device/session mutates shared data —
  // the RealtimeProvider long-poll bumps it via refreshAdmin on a revision change.
  adminRev: number;
}

interface DataActions {
  refreshAll: (isLoggedIn: boolean, role?: string) => Promise<void>;
  refreshPublic: () => Promise<void>;
  refreshAdmin: (role?: string) => Promise<void>;
  refreshInvoices: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  refreshDataStudio: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshPaymentMethods: () => Promise<void>;
  setCategories: (c: Category[]) => void;
  setPaymentStatuses: (s: PaymentStatus[]) => void;
}

const EMPTY_TOTALS: Totals = {
  raised: 0, donors: 0, tx: 0, activeCampaigns: 0, totalCampaigns: 0,
  fundraiser: 0, leads: 0, convRate: 0, today: 0, month: 0,
};

export const useDataStore = create<DataState & DataActions>()(persist((set, get) => ({
  campaigns: [], categories: [], publicSettings: null, paymentMethodsPublic: [], paymentStatuses: [],
  transactions: [], notifications: [], fundraisers: [], users: [], settings: null, profile: null,
  trash: [], paymentMethodsList: [], dailyDonations: [], dashboardStats: null, paymentBreakdown: null,
  trafficSources: null, analyticsOverview: null, analyticsCampaigns: null, analyticsUtm: null,
  analyticsTraffic: null, analyticsFunnel: null, dataStudio: null, adCosts: null,
  totals: EMPTY_TOTALS,
  ready: false, loading: false, adminRev: 0,

  // = loadApiData
  async refreshPublic() {
    const [statsRes, campaignsRes, categoriesRes, pubSettingsRes, pubPayRes, payStatusRes] = await Promise.all([
      safe(() => api.publicStats()), safe(() => api.campaigns()), safe(() => api.categories()),
      safe(() => api.publicSettings()), safe(() => api.publicPaymentMethods()), safe(() => api.paymentStatuses()),
    ]);
    const patch: Partial<DataState> = {};
    const totals = { ...get().totals };
    if (statsRes?.data) {
      totals.raised = statsRes.data.total_raised ?? 0;
      totals.donors = statsRes.data.total_donors ?? 0;
      totals.activeCampaigns = statsRes.data.active_campaigns ?? 0;
      totals.totalCampaigns = statsRes.data.total_campaigns ?? 0;
    }
    if (Array.isArray(campaignsRes?.data)) {
      patch.campaigns = campaignsRes.data.map(mapCampaign);
      totals.activeCampaigns = patch.campaigns.filter((c) => c.status === 'Berjalan' || c.status === 'Running').length;
    }
    patch.totals = totals;
    if (categoriesRes?.data) patch.categories = categoriesRes.data;
    if (pubSettingsRes?.data) {
      patch.publicSettings = pubSettingsRes.data;
      if (pubSettingsRes.data.primary_color || pubSettingsRes.data.secondary_color) {
        applyThemeColor(pubSettingsRes.data.primary_color, pubSettingsRes.data.secondary_color);
      }
      // Tracking: capture UTM from the landing URL + inject configured pixels. Both
      // are safe no-ops when nothing is configured and must never break data load.
      try { NBTracking.captureUTM(); NBTracking.initPixels(pubSettingsRes.data); } catch { /* ignore */ }
    }
    if (Array.isArray(pubPayRes?.data)) patch.paymentMethodsPublic = pubPayRes.data;
    if (Array.isArray(payStatusRes?.data)) {
      patch.paymentStatuses = payStatusRes.data;
      setPaymentStatusRef(payStatusRes.data); // keep mapInvoice's status map fresh
    }
    set(patch);
  },

  // = loadAdminData + sibling loaders, batched into one set()
  // role gates the calls each staff role is actually allowed to make: firing admin-only
  // (users/settings/paymentMethods/trash) and cs-only (invoices/fundraisers) reads for a
  // CS/Advertiser session 403'd on every boot AND every realtime revision tick — swallowed
  // by safe() but a wasteful storm that buried real auth failures. When role is undefined
  // (initial boot, before api.me() resolves) we keep firing everything, as before.
  async refreshAdmin(role?: string) {
    const canAdmin = !role || role === 'Admin';
    const canCS = !role || role === 'Admin' || role === 'CS';
    const [txRes, notifRes, fundraiserRes, usersRes, settingsRes, profileRes, invRes,
      chartRes, statsRes, pmChartRes, tsChartRes, pmListRes, trashRes] = await Promise.all([
      safe(() => api.recentTransactions(48)),
      safe(() => api.notifications()),
      canCS ? safe(() => api.fundraisers()) : Promise.resolve(null),
      canAdmin ? safe(() => api.users('limit=500')) : Promise.resolve(null),
      canAdmin ? safe(() => api.settings()) : Promise.resolve(null),
      safe(() => api.profile()),
      canCS ? safe(() => api.invoices('limit=500')) : Promise.resolve(null),
      safe(() => api.dailyChart(30)),
      safe(() => api.dashboardStats()),
      safe(() => api.paymentMethodChart()),
      safe(() => api.trafficSourceChart()),
      canAdmin ? safe(() => api.paymentMethods()) : Promise.resolve(null),
      canAdmin ? safe(() => api.trash()) : Promise.resolve(null),
    ]);
    const patch: Partial<DataState> = {};
    // invoices('limit=500') is the fuller list; recentTransactions is the fallback.
    if (Array.isArray(invRes?.data)) patch.transactions = invRes.data.map(mapInvoice);
    else if (Array.isArray(txRes?.data)) patch.transactions = txRes.data.map(mapInvoice);
    // Notifications endpoint wraps the list: { notifications: [...], unread_count }.
    const notifData: any = notifRes?.data;
    if (Array.isArray(notifData?.notifications)) patch.notifications = notifData.notifications;
    else if (Array.isArray(notifData)) patch.notifications = notifData; // tolerate bare-array shape
    if (Array.isArray(fundraiserRes?.data)) patch.fundraisers = fundraiserRes.data.map(mapFundraiser);
    if (Array.isArray(usersRes?.data)) patch.users = usersRes.data;
    if (settingsRes?.data) patch.settings = settingsRes.data;
    if (profileRes?.data) patch.profile = profileRes.data;
    if (Array.isArray(chartRes?.data)) patch.dailyDonations = chartRes.data;
    if (statsRes?.data) patch.dashboardStats = statsRes.data;
    if (pmChartRes?.data) patch.paymentBreakdown = pmChartRes.data;
    if (tsChartRes?.data) patch.trafficSources = tsChartRes.data;
    if (pmListRes?.data) patch.paymentMethodsList = pmListRes.data;
    // Trash endpoint returns { campaigns: [...], users: [...] }; flatten to a typed list.
    if (Array.isArray(trashRes?.data)) patch.trash = trashRes.data; // tolerate bare-array shape
    else if (trashRes?.data && typeof trashRes.data === 'object') {
      const d: any = trashRes.data;
      patch.trash = [
        ...(Array.isArray(d.campaigns) ? d.campaigns.map((c: any) => ({ ...c, type: 'campaign' })) : []),
        ...(Array.isArray(d.users) ? d.users.map((u: any) => ({ ...u, type: 'user' })) : []),
      ];
    }
    // Bump adminRev so pages fetching admin data independently re-run their loads —
    // this is what makes a change on device A appear on device B without a manual
    // reload (the RealtimeProvider long-poll calls refreshAdmin on a revision change).
    set({ ...patch, adminRev: (get().adminRev || 0) + 1 });
  },

  async refreshInvoices() {
    const r = await safe(() => api.invoices('limit=500'));
    if (Array.isArray(r?.data)) set({ transactions: r.data.map(mapInvoice) });
  },

  // = loadAnalytics
  async refreshAnalytics() {
    const [ov, camp, utm, traf, fun] = await Promise.all([
      safe(() => api.analyticsOverview()), safe(() => api.analyticsCampaigns()),
      safe(() => api.analyticsUTM()), safe(() => api.analyticsTraffic()), safe(() => api.analyticsFunnel()),
    ]);
    const patch: Partial<DataState> = {};
    if (ov?.data) patch.analyticsOverview = ov.data;
    if (camp?.data) patch.analyticsCampaigns = camp.data;
    if (utm?.data) patch.analyticsUtm = utm.data;
    if (traf?.data) patch.analyticsTraffic = traf.data;
    if (fun?.data) patch.analyticsFunnel = fun.data;
    set(patch);
  },

  async refreshDataStudio() {
    const r = await safe(() => api.dataStudioOverview());
    if (r?.data) set({ dataStudio: r.data });
  },

  async refreshDashboard() {
    const [s, pm, tr] = await Promise.all([
      safe(() => api.dashboardStats()), safe(() => api.paymentMethodChart()), safe(() => api.trafficSourceChart()),
    ]);
    const patch: Partial<DataState> = {};
    if (s?.data) patch.dashboardStats = s.data;
    if (pm?.data) patch.paymentBreakdown = pm.data;
    if (tr?.data) patch.trafficSources = tr.data;
    set(patch);
  },

  async refreshPaymentMethods() {
    const r = await safe(() => api.paymentMethods());
    if (r?.data) set({ paymentMethodsList: r.data });
  },

  // = refreshAllData
  // Public and admin batches run CONCURRENTLY (not public-then-admin) so a hard reload of
  // an admin route pays one round-trip, not two. refreshAdmin maps invoices with the
  // payment-status ref that refreshPublic sets; the map has a static fallback + is_paid,
  // so the brief ordering race is benign (a realtime tick re-maps anyway).
  async refreshAll(isLoggedIn: boolean, role?: string) {
    set({ loading: true });
    const tasks = [get().refreshPublic()];
    if (isLoggedIn) {
      tasks.push(get().refreshAdmin(role), get().refreshAnalytics(), get().refreshDataStudio());
    }
    await Promise.all(tasks);
    set({ loading: false, ready: true });
  },

  setCategories(c) { set({ categories: c }); },
  setPaymentStatuses(s) { setPaymentStatusRef(s); set({ paymentStatuses: s }); },
}), {
  name: 'nb_data',
  version: DATA_STORE_VERSION,
  storage: createJSONStorage(() => localStorage),
  // Version bumps intentionally DISCARD the old cache (each bump narrowed which slices
  // are persisted, dropping PII). Provide an explicit migrate so zustand doesn't warn
  // "no migrate function provided" — we return nothing, letting defaults seed and the
  // background refreshAll repopulate.
  migrate: () => ({} as any),
  // Persist DATA slices only — never the control flags. ready/loading/adminRev stay at
  // their defaults on reload so the background refreshAll still fires (rehydrated data
  // paints instantly, then gets refreshed). Actions aren't serializable and are skipped.
  //
  // PII IS DELIBERATELY EXCLUDED: `transactions` (donor name/phone/email),
  // `notifications` (subtitles like "Donasi Dari : <name>"), `users` (staff name/email/
  // phone), `fundraisers` (fundraiser name/email), `trash` (deleted staff name/email),
  // and `profile` (the logged-in user's own name/email/phone/address/bank) are NOT
  // persisted, so no personal data lands in localStorage. Those slices come back on the
  // first background refresh (they start empty on reload). Only aggregates/config cached.
  partialize: (s) => ({
    campaigns: s.campaigns, categories: s.categories, publicSettings: s.publicSettings,
    paymentMethodsPublic: s.paymentMethodsPublic, paymentStatuses: s.paymentStatuses,
    settings: s.settings,
    paymentMethodsList: s.paymentMethodsList, dailyDonations: s.dailyDonations,
    dashboardStats: s.dashboardStats, paymentBreakdown: s.paymentBreakdown,
    trafficSources: s.trafficSources, analyticsOverview: s.analyticsOverview,
    analyticsCampaigns: s.analyticsCampaigns, analyticsUtm: s.analyticsUtm,
    analyticsTraffic: s.analyticsTraffic, analyticsFunnel: s.analyticsFunnel,
    dataStudio: s.dataStudio, adCosts: s.adCosts, totals: s.totals,
  }),
  // On rehydrate, re-prime mapInvoice's status ref from the cached list so invoice
  // status labels are correct before the first live refresh completes.
  onRehydrateStorage: () => (state) => {
    if (state?.paymentStatuses?.length) setPaymentStatusRef(state.paymentStatuses);
  },
}));

// Wipe the persisted cache — call on logout / session expiry so the next user on a shared
// browser can't read the previous admin's cached donor PII (names, phones, amounts).
export const clearPersistedData = () => {
  try { useDataStore.persist.clearStorage(); } catch { /* ignore */ }
};

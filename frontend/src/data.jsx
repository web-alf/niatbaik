// data.jsx — Formatting helpers, API mappers, data loaders for NiatBaik.
// No seed/dummy data — all data comes from real backend API.

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

const fmtIDR = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');

const fmtIDRShort = (n) => {
  if (n >= 1e9) return 'Rp ' + (n / 1e9).toFixed(1).replace(/\.0$/, '') + ' M';
  if (n >= 1e6) return 'Rp ' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + ' jt';
  if (n >= 1e3) return 'Rp ' + (n / 1e3).toFixed(0) + ' rb';
  return 'Rp ' + (n || 0);
};

const fmtNum = (n) => (n || 0).toLocaleString('id-ID');

const fmtPct = (n) => (n * 100).toFixed(1) + '%';

/* ------------------------------------------------------------------ */
/*  SVG placeholder generators                                         */
/* ------------------------------------------------------------------ */

function placeholderImg(seed, label) {
  const hues = [
    ['#2E4191', '#38B6FF'], ['#2563eb', '#22d3ee'], ['#0e7490', '#38B6FF'],
    ['#1e40af', '#60a5fa'], ['#0369a1', '#7dd3fc'], ['#1e3a8a', '#38bdf8'],
  ];
  const [a, b] = hues[seed % hues.length];
  return `data:image/svg+xml;utf8,` + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>
      </linearGradient></defs>
      <rect width='800' height='500' fill='url(#g)'/>
      <g transform='translate(400 250)' fill='rgba(255,255,255,0.9)' text-anchor='middle' font-family='system-ui'>
        <text font-size='28' font-weight='700'>${label || 'DONASI'}</text>
      </g>
    </svg>`
  );
}

function avatarSvg(initials, seed) {
  const hues = ['#2E4191', '#38B6FF', '#0e83c8', '#4762bd', '#1aa1ee', '#125883'];
  const bg = hues[seed % hues.length];
  return `data:image/svg+xml;utf8,` + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'>
      <rect width='80' height='80' rx='40' fill='${bg}'/>
      <text x='40' y='48' text-anchor='middle' fill='#fff' font-family='system-ui' font-size='30' font-weight='700'>${initials}</text>
    </svg>`
  );
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const paymentMethods = ['QRIS', 'BCA VA', 'Mandiri VA', 'BNI VA', 'GoPay', 'OVO', 'Dana', 'ShopeePay'];
const autoConfirmMethods = ['BCA VA', 'Mandiri VA', 'BNI VA'];
const isAutoConfirmMethod = (m) => autoConfirmMethods.some(a => m && m.includes(a));
const NOMINAL_PRESETS = [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

/* ------------------------------------------------------------------ */
/*  API response mappers                                               */
/* ------------------------------------------------------------------ */

function mapCampaign(c) {
  return {
    id: c.id, slug: c.slug, title: c.title,
    category: (typeof c.category === 'object' ? c.category?.name : c.category) || '',
    target: c.target || 0,
    raised: c.total_raised ?? c.raised ?? 0,
    donors: c.donor_count ?? c.donors ?? 0,
    status: c.status || 'Draft',
    daysLeft: c.days_left ?? c.daysLeft ?? 0,
    days: c.days_left ?? c.daysLeft ?? 0,
    thumb: c.thumb_gradient || c.thumb || (c.image ? '/uploads/' + c.image : ''),
    img: c.image ? (c.image.startsWith('http') ? c.image : '/uploads/' + c.image) : '',
    icon: c.icon || 'heart',
    updatedAt: c.updated_at || c.updatedAt || '',
    description: c.description || c.short_description || '',
    short_description: c.short_description || '',
    featured: c.featured || false,
    form_style: c.form_style || 'Card',
    form_type: c.form_type || 'donasi',
    opt_nominal: c.opt_nominal || '',
    form_fields_config: c.form_fields_config || '',
    payment_config: c.payment_config || '',
    pixel_config: c.pixel_config || '',
    button_color: c.button_color || '',
    min_donation: c.min_donation || 0,
    max_donation: c.max_donation || 0,
    location_name: c.location_name || '',
    location_gmaps: c.location_gmaps || '',
    // Advanced / Publish-panel fields — needed so the editor can round-trip them
    // (they are absent from the trimmed public list, present in the admin detail).
    wa_notification: c.wa_notification || false,
    followup_enabled: c.followup_enabled || false,
    popup_info: c.popup_info || false,
    wa_flying_button: c.wa_flying_button || false,
    external_link: c.external_link || '',
    meta_pixel_id: c.meta_pixel_id || '',
    tiktok_pixel_id: c.tiktok_pixel_id || '',
    gtm_id: c.gtm_id || '',
    progress_percentage: c.progress_percentage || (c.target > 0 ? Math.min(100, Math.round((c.total_raised || c.raised || 0) / c.target * 100)) : 0),
  };
}
window.mapCampaign = mapCampaign;

function mapInvoice(inv) {
  if (!inv) return inv;
  if (inv.donor !== undefined && inv.utm && typeof inv.utm === 'object') return inv;
  // Normalize backend status (Indonesian, e.g. "Terbayar"/"Menunggu Pembayaran")
  // to the English buckets the dashboard Status filter offers (Paid/Pending/Failed).
  // Base static map for resilience, then augment from the admin-managed
  // PAYMENT_STATUSES (is_paid → Paid; failure-ish codes → Failed; rest → Pending).
  const STATUS_MAP = {
    'terbayar': 'Paid', 'sukses': 'Paid', 'lunas': 'Paid', 'paid': 'Paid',
    'menunggu pembayaran': 'Pending', 'menunggu': 'Pending', 'tertunda': 'Pending', 'pending': 'Pending',
    'gagal': 'Failed', 'kadaluarsa': 'Failed', 'expired': 'Failed', 'dibatalkan': 'Failed', 'failed': 'Failed',
  };
  for (const ps of (window.PAYMENT_STATUSES || [])) {
    const code = (ps.code || '').toString().trim().toLowerCase();
    if (!code) continue;
    if (ps.is_paid) STATUS_MAP[code] = 'Paid';
    else if (!(code in STATUS_MAP)) STATUS_MAP[code] = /gagal|fail|expire|kadaluarsa|batal|cancel|tolak/i.test(code) ? 'Failed' : 'Pending';
  }
  const rawStatus = (inv.status || '').toString().trim().toLowerCase();
  // Always one of Paid/Pending/Failed after this line (matches the filter options).
  const status = STATUS_MAP[rawStatus] || (inv.is_paid ? 'Paid' : 'Pending');
  return {
    id: inv.invoice_number || inv.id || '',
    donor: inv.donor_name || inv.donor || '',
    // campaign may arrive as a nested object {id,title,...} — always coerce to a string title
    campaign: inv.campaign_title
      || (typeof inv.campaign === 'string' ? inv.campaign : (inv.campaign && inv.campaign.title) || ''),
    campaignId: inv.campaign_id || inv.campaignId || (inv.campaign && inv.campaign.id) || '',
    amount: inv.amount ?? inv.total ?? 0,
    method: inv.payment_method || inv.method || '',
    status,
    date: inv.paid_at || inv.created_at || inv.date || '',
    utm: {
      source:   inv.utm_source   ?? inv.utm?.source   ?? '',
      medium:   inv.utm_medium   ?? inv.utm?.medium   ?? '',
      content:  inv.utm_content  ?? inv.utm?.content  ?? '',
      campaign: inv.utm_campaign ?? inv.utm?.campaign ?? '',
      term:     inv.utm_term     ?? inv.utm?.term     ?? '',
      id:       inv.utm_id       ?? inv.utm?.id       ?? '',
    },
    whatsapp: inv.donor_phone || inv.whatsapp || '',
    email: inv.donor_email || inv.email || '',
    note: inv.cs_note || inv.note || '',
    anon: inv.is_anonymous ?? inv.anon ?? false,
    message: inv.message || '',
  };
}
window.mapInvoice = mapInvoice;

/* ------------------------------------------------------------------ */
/*  API data loaders                                                   */
/* ------------------------------------------------------------------ */

// Apply saved theme color to CSS so whole web reflects branding
function applyThemeColor(color) {
  if (!color) return;
  try {
    let el = document.getElementById('nb-theme-vars');
    if (!el) { el = document.createElement('style'); el.id = 'nb-theme-vars'; document.head.appendChild(el); }
    el.textContent = `.text-brand-600{color:${color} !important}.bg-brand-600{background-color:${color} !important}.border-brand-600{border-color:${color} !important}.from-brand-600{--tw-gradient-from:${color} !important}.ring-brand-600{--tw-ring-color:${color} !important}.hover\\:bg-brand-700:hover{background-color:${color} !important}`;
  } catch {}
}
window.applyThemeColor = applyThemeColor;

async function loadApiData() {
  if (typeof window.api === 'undefined') return;
  try {
    const api = window.api;
    const safe = async (fn) => { try { return await fn(); } catch { return null; } };
    const [statsRes, campaignsRes, categoriesRes, pubSettingsRes, pubPayRes, payStatusRes] = await Promise.all([
      safe(() => api.publicStats()), safe(() => api.campaigns()), safe(() => api.categories()),
      safe(() => api.publicSettings()), safe(() => api.publicPaymentMethods()),
      safe(() => api.paymentStatuses()),
    ]);
    if (statsRes?.data) {
      window.TOTAL_RAISED     = statsRes.data.total_raised     ?? 0;
      window.TOTAL_DONORS     = statsRes.data.total_donors     ?? 0;
      window.ACTIVE_CAMPAIGNS = statsRes.data.active_campaigns ?? 0;
    }
    if (campaignsRes?.data && Array.isArray(campaignsRes.data)) {
      window.CAMPAIGNS = campaignsRes.data.map(mapCampaign);
      window.ACTIVE_CAMPAIGNS = window.CAMPAIGNS.filter(c => c.status === 'Berjalan' || c.status === 'Running').length;
    }
    if (categoriesRes?.data) window.CATEGORIES = categoriesRes.data;
    if (pubSettingsRes?.data) {
      window.PUBLIC_SETTINGS = pubSettingsRes.data;
      if (pubSettingsRes.data.primary_color) applyThemeColor(pubSettingsRes.data.primary_color);
    }
    if (pubPayRes?.data && Array.isArray(pubPayRes.data)) window.PAYMENT_METHODS_PUBLIC = pubPayRes.data;
    if (payStatusRes?.data && Array.isArray(payStatusRes.data)) window.PAYMENT_STATUSES = payStatusRes.data;
    console.log('[data] API data loaded');
  } catch (e) {
    console.log('[data] API load error:', e?.message || e);
  }
}

async function loadAdminData() {
  if (typeof window.api === 'undefined') return;
  const api = window.api;
  const safe = async (fn) => { try { return await fn(); } catch { return null; } };
  const [txRes, notifRes, fundraiserRes, usersRes, settingsRes] = await Promise.all([
    safe(() => api.recentTransactions?.(48)),
    safe(() => api.notifications?.()),
    safe(() => api.fundraisers?.()),
    safe(() => api.users?.()),
    safe(() => api.settings?.()),
  ]);
  if (txRes?.data)         window.TRANSACTIONS  = Array.isArray(txRes.data) ? txRes.data.map(mapInvoice) : [];
  if (notifRes?.data)      window.NOTIFICATIONS = Array.isArray(notifRes.data) ? notifRes.data : [];
  if (fundraiserRes?.data) window.FUNDRAISERS   = Array.isArray(fundraiserRes.data) ? fundraiserRes.data : [];
  if (usersRes?.data)      window.USERS          = Array.isArray(usersRes.data) ? usersRes.data : [];
  if (settingsRes?.data)   window.SETTINGS       = settingsRes.data;
}

async function loadDashboardChart() {
  if (typeof window.api === 'undefined') return;
  try {
    const res = await window.api.dailyChart?.(30);
    if (res?.data) window.DAILY_DONATIONS = Array.isArray(res.data) ? res.data : [];
  } catch (e) { console.log('[data] Chart load error:', e?.message); }
}

async function loadProfile() {
  if (typeof window.api === 'undefined') return;
  try {
    const res = await window.api.profile?.();
    if (res?.data) window.PROFILE = res.data;
  } catch (e) { console.log('[data] Profile load error:', e?.message); }
}

async function loadInvoices() {
  if (typeof window.api === 'undefined') return;
  try {
    const r = await window.api.invoices?.('limit=100');
    if (r?.data && Array.isArray(r.data)) window.TRANSACTIONS = r.data.map(mapInvoice);
  } catch (e) { console.log('[data] Invoices load error:', e?.message); }
}

async function loadAnalytics() {
  if (typeof window.api === 'undefined') return;
  const safe = async (fn) => { try { return await fn(); } catch { return null; } };
  const [ov, camp, utm, traf, fun] = await Promise.all([
    safe(() => window.api.analyticsOverview?.()), safe(() => window.api.analyticsCampaigns?.()),
    safe(() => window.api.analyticsUTM?.()), safe(() => window.api.analyticsTraffic?.()), safe(() => window.api.analyticsFunnel?.()),
  ]);
  if (ov?.data) window.ANALYTICS_OVERVIEW = ov.data;
  if (camp?.data) window.ANALYTICS_CAMPAIGNS = camp.data;
  if (utm?.data) window.ANALYTICS_UTM = utm.data;
  if (traf?.data) window.ANALYTICS_TRAFFIC = traf.data;
  if (fun?.data) window.ANALYTICS_FUNNEL = fun.data;
}

async function loadDataStudio() {
  if (typeof window.api === 'undefined') return;
  try {
    const r = await window.api.dataStudioOverview?.();
    if (r?.data) window.DATASTUDIO = r.data;
  } catch (e) { console.log('[data] DataStudio load error:', e?.message); }
}

async function loadPaymentMethods() {
  if (typeof window.api === 'undefined') return;
  try { const r = await window.api.paymentMethods?.(); if (r?.data) window.PAYMENT_METHODS_LIST = r.data; } catch {}
}

async function loadDashboardStats() {
  if (typeof window.api === 'undefined') return;
  const safe = async (fn) => { try { return await fn(); } catch { return null; } };
  const [s, pm, tr] = await Promise.all([
    safe(() => window.api.dashboardStats?.()),
    safe(() => window.api.paymentMethodChart?.()),
    safe(() => window.api.trafficSourceChart?.()),
  ]);
  if (s?.data)  window.DASHBOARD_STATS    = s.data;
  if (pm?.data) window.PAYMENT_BREAKDOWN  = pm.data;
  if (tr?.data) window.TRAFFIC_SOURCES    = tr.data;
}

async function loadAdCosts() {
  if (typeof window.api === 'undefined') return;
  try {
    const r = await window.api.adCosts?.();
    if (r?.data) window.AD_COSTS = r.data;
  } catch {}
}

/* ------------------------------------------------------------------ */
/*  Export to window scope — all empty, API fills them                  */
/* ------------------------------------------------------------------ */

window.NB = {
  fmtIDR, fmtIDRShort, fmtNum, fmtPct,
  campaignSeed: [], txns: [], fundraisers: [], members: [],
  dailyDonations: [], trafficSources: [], paymentMethods, autoConfirmMethods, isAutoConfirmMethod,
  socialProofLines: [], donorNames: [], NOMINAL_PRESETS, NOTIFICATIONS: [], TRASH: [],
  TOTAL_RAISED: 0, TOTAL_DONORS: 0, TOTAL_TX: 0, ACTIVE_CAMPAIGNS: 0,
  TOTAL_FUNDRAISER: 0, TOTAL_LEADS: 0, CONV_RATE: 0, TODAY_RAISED: 0, MONTH_RAISED: 0,
  placeholderImg, avatarSvg,
  loadApiData, loadAdminData, loadDashboardChart, loadProfile,
  loadInvoices, loadAnalytics, loadDataStudio, loadPaymentMethods,
  loadDashboardStats, loadAdCosts,
};

window.fmtIDR           = fmtIDR;
window.fmtIDRShort      = fmtIDRShort;
window.fmtShort         = fmtIDRShort;
window.fmtNum           = fmtNum;
window.fmtPct           = fmtPct;
window.placeholderImg   = placeholderImg;
window.avatarSvg        = avatarSvg;
window.CAMPAIGNS        = [];
window.TRANSACTIONS     = [];
window.DAILY            = [];
window.DAILY_DONATIONS  = [];
window.TRAFFIC_SOURCES  = [];
window.ANALYTICS_TRAFFIC = [];
window.FUNDRAISERS      = [];
window.USERS            = [];
window.NOTIFICATIONS    = [];
window.TRASH            = [];
window.DONORS           = [];
window.NOMINAL_PRESETS  = NOMINAL_PRESETS;
window.PAYMENT_METHODS  = paymentMethods;
window.TOTAL_RAISED     = 0;
window.TOTAL_DONORS     = 0;
window.TOTAL_TX         = 0;
window.ACTIVE_CAMPAIGNS = 0;
window.TOTAL_FUNDRAISER = 0;
window.TOTAL_LEADS      = 0;
window.CONV_RATE        = 0;
window.TODAY_RAISED     = 0;
window.MONTH_RAISED     = 0;
window.socialProofLines = [];
window.loadApiData        = loadApiData;
window.loadAdminData      = loadAdminData;
window.loadDashboardChart = loadDashboardChart;
window.loadProfile        = loadProfile;
window.loadInvoices       = loadInvoices;
window.loadAnalytics      = loadAnalytics;
window.loadDataStudio     = loadDataStudio;
window.loadPaymentMethods = loadPaymentMethods;
window.loadDashboardStats = loadDashboardStats;
window.loadAdCosts        = loadAdCosts;

// data.jsx — Formatting helpers + seed/mock data for NiatBaik donation platform.
// Shared across all views (public, admin, CS, advertiser).

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

const fmtIDR = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');

const fmtIDRShort = (n) => {
  if (n >= 1e9) return 'Rp ' + (n / 1e9).toFixed(1).replace(/\.0$/, '') + ' M';
  if (n >= 1e6) return 'Rp ' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + ' jt';
  if (n >= 1e3) return 'Rp ' + (n / 1e3).toFixed(0) + ' rb';
  return 'Rp ' + n;
};

const fmtNum = (n) => (n || 0).toLocaleString('id-ID');

const fmtPct = (n) => (n * 100).toFixed(1) + '%';

/* ------------------------------------------------------------------ */
/*  SVG placeholder generators (kept from original)                    */
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
      </linearGradient>
      <pattern id='p' width='40' height='40' patternUnits='userSpaceOnUse'>
        <path d='M0 40 L40 0' stroke='rgba(255,255,255,0.06)' stroke-width='1'/>
      </pattern></defs>
      <rect width='800' height='500' fill='url(#g)'/>
      <rect width='800' height='500' fill='url(#p)'/>
      <g transform='translate(400 230)' fill='rgba(255,255,255,0.92)' text-anchor='middle' font-family='DM Sans, sans-serif'>
        <text font-size='28' font-weight='700' letter-spacing='1'>${label || 'DONASI'}</text>
        <text y='40' font-size='15' opacity='0.75'>niatbaik.org</text>
      </g>
      <g transform='translate(400 360)' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'>
        <circle r='28'/><path d='M-10 -2 L-2 8 L12 -10' stroke-linecap='round' stroke-linejoin='round' stroke-width='3'/>
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
      <text x='40' y='48' text-anchor='middle' fill='#fff' font-family='DM Sans, sans-serif' font-size='30' font-weight='700'>${initials}</text>
    </svg>`
  );
}

/* ------------------------------------------------------------------ */
/*  Campaign seed data (8 campaigns)                                   */
/* ------------------------------------------------------------------ */

const campaignSeed = [
  {
    id: 'c-001',
    title: 'Sumur Bersih untuk Desa Lengkong, NTT',
    category: 'Air Bersih',
    target: 250_000_000,
    raised: 184_320_000,
    donors: 2147,
    status: 'Running',
    daysLeft: 18,
    thumb: 'linear-gradient(135deg, #38B6FF 0%, #2E4191 100%)',
    icon: 'droplet',
    updatedAt: '2 jam lalu',
  },
  {
    id: 'c-002',
    title: 'Bantuan Operasi Jantung untuk Aira (4 thn)',
    category: 'Medis',
    target: 180_000_000,
    raised: 162_540_000,
    donors: 4318,
    status: 'Running',
    daysLeft: 6,
    thumb: 'linear-gradient(135deg, #F59E0B 0%, #DC2626 100%)',
    icon: 'heart',
    updatedAt: '12 menit lalu',
  },
  {
    id: 'c-003',
    title: 'Buka Puasa untuk 5.000 Yatim Jabodetabek',
    category: 'Ramadan',
    target: 500_000_000,
    raised: 312_780_500,
    donors: 8920,
    status: 'Running',
    daysLeft: 24,
    thumb: 'linear-gradient(135deg, #16A34A 0%, #2E4191 100%)',
    icon: 'moon',
    updatedAt: '1 jam lalu',
  },
  {
    id: 'c-004',
    title: 'Renovasi Madrasah Al-Hikmah, Lombok Timur',
    category: 'Pendidikan',
    target: 320_000_000,
    raised: 87_410_000,
    donors: 612,
    status: 'Running',
    daysLeft: 41,
    thumb: 'linear-gradient(135deg, #2E4191 0%, #38B6FF 100%)',
    icon: 'book',
    updatedAt: 'kemarin',
  },
  {
    id: 'c-005',
    title: 'Bantuan Korban Banjir Demak',
    category: 'Bencana',
    target: 150_000_000,
    raised: 150_000_000,
    donors: 3402,
    status: 'Ended',
    daysLeft: 0,
    thumb: 'linear-gradient(135deg, #64748B 0%, #1E293B 100%)',
    icon: 'cloud',
    updatedAt: '3 hari lalu',
  },
  {
    id: 'c-006',
    title: 'Wakaf Quran untuk Pesantren Pelosok',
    category: 'Wakaf',
    target: 100_000_000,
    raised: 12_400_000,
    donors: 184,
    status: 'Draft',
    daysLeft: 30,
    thumb: 'linear-gradient(135deg, #38B6FF 0%, #16A34A 100%)',
    icon: 'book',
    updatedAt: '5 jam lalu',
  },
  {
    id: 'c-007',
    title: 'Modal Usaha untuk Janda Kepala Keluarga',
    category: 'Ekonomi',
    target: 80_000_000,
    raised: 0,
    donors: 0,
    status: 'Published',
    daysLeft: 60,
    thumb: 'linear-gradient(135deg, #F59E0B 0%, #38B6FF 100%)',
    icon: 'briefcase',
    updatedAt: 'baru saja',
  },
  {
    id: 'c-008',
    title: 'Beasiswa 1000 Anak Dhuafa Lanjut Sekolah',
    category: 'Beasiswa',
    target: 1_500_000_000,
    raised: 1_127_450_000,
    donors: 8432,
    status: 'Running',
    daysLeft: 14,
    thumb: 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)',
    icon: 'graduation-cap',
    updatedAt: '30 menit lalu',
  },
];

/* ------------------------------------------------------------------ */
/*  Donor names + payment methods                                      */
/* ------------------------------------------------------------------ */

const donorNames = [
  'Rizky H.', 'Hamba Allah', 'Siti Nurhaliza', 'Andi P.', 'Hamba Allah',
  'Budi Santoso', 'Maya Wijaya', 'Hamba Allah', 'Dewi A.', 'Fajar Ramadhan',
  'Hamba Allah', 'Nadia P.', 'Iqbal R.', 'Hamba Allah', 'Lestari K.',
  'Hamba Allah', 'Yusuf M.', 'Aisha N.', 'Hamba Allah', 'Rangga D.',
];

const paymentMethods = ['QRIS', 'BCA VA (Moota)', 'Mandiri VA (Moota)', 'BNI VA (Moota)', 'Flip', 'GoPay', 'OVO', 'Dana', 'ShopeePay'];
const autoConfirmMethods = ['BCA VA (Moota)', 'Mandiri VA (Moota)', 'BNI VA (Moota)', 'Flip'];
const isAutoConfirmMethod = (m) => autoConfirmMethods.includes(m);

const NOMINAL_PRESETS = [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

/* ------------------------------------------------------------------ */
/*  Transaction generator                                              */
/* ------------------------------------------------------------------ */

function makeTxns(n) {
  const rows = [];
  const statuses = ['Paid', 'Paid', 'Paid', 'Paid', 'Pending', 'Failed', 'Paid', 'Paid'];
  const utm = [
    { source: 'facebook',  medium: 'paid',   campaign: 'aira-jantung-q2',    content: 'hero-vid-01',  term: 'donasi-medis', id: 'fb-29384' },
    { source: 'google',    medium: 'cpc',    campaign: 'wakaf-quran-search', content: 'text-ad-3',    term: 'wakaf-quran',  id: 'gg-71028' },
    { source: 'tiktok',    medium: 'paid',   campaign: 'bukber-yatim-tt',    content: 'bantu-rans',   term: 'organik',      id: 'tt-rian-01' },
    { source: 'instagram', medium: 'social', campaign: 'organic-bio',        content: 'reels-04',     term: 'sedekah',      id: 'ig-bio-link' },
    { source: '(direct)',  medium: '(none)', campaign: '(direct)',           content: '',             term: '',             id: '' },
  ];
  const amounts = [25_000, 50_000, 100_000, 150_000, 200_000, 250_000, 500_000, 1_000_000];
  const messages = [
    'Semoga Allah balas dengan kebaikan berlipat.',
    'Mohon doakan keluarga kami.',
    'Sedikit dari kami, semoga bermanfaat.',
    'Niat baik, semoga terlaksana.',
    '-',
  ];
  const emails = ['rizky', 'siti', 'andi', 'budi', 'maya', 'dewi', 'fajar', 'nadia'];

  for (let i = 0; i < n; i++) {
    const c = campaignSeed[i % campaignSeed.length];
    const u = utm[i % utm.length];
    rows.push({
      id: 'INV-' + (2025_1100 + i).toString(),
      donor: donorNames[i % donorNames.length],
      campaign: c.title,
      campaignId: c.id,
      amount: amounts[i % amounts.length],
      method: paymentMethods[i % paymentMethods.length],
      status: statuses[i % statuses.length],
      date: `${(i % 28) + 1} Mei 2026, ${(8 + (i % 12)).toString().padStart(2, '0')}:${(i * 7 % 60).toString().padStart(2, '0')}`,
      utm: u,
      whatsapp: '+62 81' + (200000000 + i * 137).toString().slice(0, 9),
      email: emails[i % emails.length] + '@mail.com',
      note: i % 5 === 0 ? 'Donatur minta dikirimkan kuitansi via WA.' : '',
      anon: i % 6 === 0,
      message: messages[i % messages.length],
    });
  }
  return rows;
}

const txns = makeTxns(48);

/* ------------------------------------------------------------------ */
/*  Traffic sources                                                    */
/* ------------------------------------------------------------------ */

const trafficSources = [
  { name: 'Meta Ads',   visits: 48230, leads: 5612, donations: 1842, spend: 92_400_000, color: '#1877F2' },
  { name: 'TikTok Ads', visits: 31840, leads: 3210, donations: 980,  spend: 41_800_000, color: '#000000' },
  { name: 'Google Ads', visits: 22150, leads: 2840, donations: 1124, spend: 58_300_000, color: '#34A853' },
  { name: 'Organic',    visits: 18920, leads: 1410, donations: 612,  spend: 0,          color: '#2E4191' },
];

/* ------------------------------------------------------------------ */
/*  Fundraisers                                                        */
/* ------------------------------------------------------------------ */

const fundraisers = [
  { id: 'f-01', name: 'Ust. Ahmad Fauzi',            campaign: 'Buka Puasa 5.000 Yatim', raised: 84_320_000, txn: 612, commission: 8_432_000,  status: 'pending', ref: 'NB/AHMAD' },
  { id: 'f-02', name: 'Komunitas Pejuang Subuh',     campaign: 'Sumur Bersih NTT',       raised: 41_500_000, txn: 318, commission: 4_150_000,  status: 'paid',    ref: 'NB/PSUBUH' },
  { id: 'f-03', name: 'Influencer @hijrahbersama',   campaign: 'Bantuan Aira',            raised: 38_120_000, txn: 884, commission: 3_812_000,  status: 'pending', ref: 'NB/HIJRAH' },
  { id: 'f-04', name: 'Masjid Al-Falah Bandung',     campaign: 'Wakaf Quran',             raised: 12_400_000, txn: 142, commission: 1_240_000,  status: 'paid',    ref: 'NB/ALFALAH' },
  { id: 'f-05', name: 'Rizal Pratama',                campaign: 'Madrasah Lombok',         raised: 8_750_000,  txn: 67,  commission: 875_000,   status: 'pending', ref: 'NB/RIZAL' },
];

/* ------------------------------------------------------------------ */
/*  Members / Users                                                    */
/* ------------------------------------------------------------------ */

const members = [
  { id: 'u-01', name: 'Andre Wicaksono', email: 'andre@niatbaik.org',  role: 'Admin',      status: 'active',   lastLogin: 'baru saja' },
  { id: 'u-02', name: 'Putri Maharani',  email: 'putri@niatbaik.org',  role: 'CS',          status: 'active',   lastLogin: '5 menit lalu' },
  { id: 'u-03', name: 'Bagus Santoso',   email: 'bagus@niatbaik.org',  role: 'CS',          status: 'active',   lastLogin: '20 menit lalu' },
  { id: 'u-04', name: 'Dewi Lestari',    email: 'dewi@niatbaik.org',   role: 'Advertiser',  status: 'active',   lastLogin: '1 jam lalu' },
  { id: 'u-05', name: 'Rahmat Hidayat',  email: 'rahmat@niatbaik.org', role: 'Advertiser',  status: 'inactive', lastLogin: '3 hari lalu' },
  { id: 'u-06', name: 'Sinta Aulia',     email: 'sinta@niatbaik.org',  role: 'CS',          status: 'active',   lastLogin: 'kemarin' },
];

/* ------------------------------------------------------------------ */
/*  Daily donations (30-day series for charts)                         */
/* ------------------------------------------------------------------ */

const dailyDonations = Array.from({ length: 30 }, (_, i) => {
  const base = 18_000_000 + Math.sin(i / 3) * 8_000_000 + (i / 30) * 12_000_000;
  const noise = ((i * 9301 + 49297) % 233280) / 233280;
  const amount = Math.max(2_500_000, Math.round(base + noise * 14_000_000));
  const d = new Date(Date.now() - (29 - i) * 86400_000);
  return { date: d.toISOString().slice(0, 10), amount };
});

/* ------------------------------------------------------------------ */
/*  Notifications                                                      */
/* ------------------------------------------------------------------ */

const NOTIFICATIONS = [
  { id: 1, type: 'donation',   title: 'Donasi baru Rp250.000',                       sub: 'Rizky H. · Sumur Bersih NTT',        ts: 'baru saja' },
  { id: 2, type: 'campaign',   title: 'Campaign "Bantuan Aira" tercapai 90%',        sub: 'Sisa 6 hari',                              ts: '10 menit lalu' },
  { id: 3, type: 'system',     title: 'Meta Pixel reconnected',                       sub: 'Event tracking aktif kembali',             ts: '1 jam lalu' },
  { id: 4, type: 'donation',   title: 'Donasi baru Rp1.000.000',                     sub: 'Hamba Allah · Buka Puasa 5.000 Yatim', ts: '2 jam lalu' },
  { id: 5, type: 'fundraiser', title: 'Fundraiser baru bergabung',                    sub: 'Komunitas Pejuang Subuh',                  ts: 'kemarin' },
];

/* ------------------------------------------------------------------ */
/*  Social proof lines (public page ticker)                            */
/* ------------------------------------------------------------------ */

const socialProofLines = [
  { name: 'Hamba Allah', amount: 100_000, campaign: 'Bantuan Aira',           when: 'baru saja' },
  { name: 'Rizky H.',    amount: 50_000,  campaign: 'Sumur Bersih NTT',       when: '12 detik lalu' },
  { name: 'Hamba Allah', amount: 250_000, campaign: 'Buka Puasa 5.000 Yatim', when: '34 detik lalu' },
  { name: 'Siti N.',     amount: 500_000, campaign: 'Bantuan Aira',           when: '1 menit lalu' },
  { name: 'Hamba Allah', amount: 25_000,  campaign: 'Wakaf Quran',            when: '2 menit lalu' },
];

/* ------------------------------------------------------------------ */
/*  Trash items                                                        */
/* ------------------------------------------------------------------ */

const TRASH = [
  { id: 't1', kind: 'campaign',    title: 'Bantu Renovasi Madrasah (lama)', deleted: '3 hari lalu',  by: 'Andre Wicaksono' },
  { id: 't2', kind: 'user',        title: 'Test Account',                   deleted: '1 minggu lalu', by: 'Andre Wicaksono' },
  { id: 't3', kind: 'transaction', title: 'INV-20251099',                   deleted: '2 minggu lalu', by: 'Putri Maharani' },
  { id: 't4', kind: 'campaign',    title: 'Kurban 2025',                    deleted: '1 bulan lalu',  by: 'Andre Wicaksono' },
];

/* ------------------------------------------------------------------ */
/*  Computed aggregates                                                */
/* ------------------------------------------------------------------ */

const TOTAL_RAISED     = campaignSeed.reduce((s, c) => s + c.raised, 0);
const TOTAL_DONORS     = campaignSeed.reduce((s, c) => s + c.donors, 0);
const TOTAL_TX         = txns.length * 537; // multiplier for realism
const ACTIVE_CAMPAIGNS = campaignSeed.filter(c => c.status === 'Running').length;
const TOTAL_FUNDRAISER = 142;
const TOTAL_LEADS      = 18420;
const CONV_RATE        = 4.7; // %
const TODAY_RAISED     = dailyDonations[dailyDonations.length - 1].amount;
const MONTH_RAISED     = dailyDonations.reduce((s, d) => s + d.amount, 0);

/* ------------------------------------------------------------------ */
/*  API data loaders — replace seed data when backend available        */
/* ------------------------------------------------------------------ */

function mapCampaign(c) {
  return {
    id: c.id, slug: c.slug, title: c.title,
    category: c.category || '',
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
    min_donation: c.min_donation || 0,
    location_name: c.location_name || '',
    progress_percentage: c.progress_percentage || (c.target > 0 ? Math.min(100, Math.round((c.total_raised || c.raised || 0) / c.target * 100)) : 0),
  };
}
window.mapCampaign = mapCampaign;

async function loadApiData() {
  if (typeof window.api === 'undefined') {
    console.log('[data] No API client — using seed data');
    return;
  }
  try {
    const api = window.api;
    const [statsRes, campaignsRes, categoriesRes] = await Promise.all([
      api.publicStats(),
      api.campaigns(),
      api.categories(),
    ]);

    if (statsRes?.data) {
      window.TOTAL_RAISED     = statsRes.data.total_raised     || TOTAL_RAISED;
      window.TOTAL_DONORS     = statsRes.data.total_donors     || TOTAL_DONORS;
      window.ACTIVE_CAMPAIGNS = statsRes.data.active_campaigns || ACTIVE_CAMPAIGNS;
    }

    if (campaignsRes?.data && campaignsRes.data.length > 0) {
      window.CAMPAIGNS = campaignsRes.data.map(mapCampaign);
      window.ACTIVE_CAMPAIGNS = window.CAMPAIGNS.filter(c => c.status === 'Berjalan' || c.status === 'Running').length;
    }

    if (categoriesRes?.data) {
      window.CATEGORIES = categoriesRes.data;
    }

    console.log('[data] API data loaded');
  } catch (e) {
    console.log('[data] API fallback — using seed data:', e?.message || e);
  }
}

async function loadAdminData() {
  if (typeof window.api === 'undefined') return;
  try {
    const api = window.api;
    const [txRes, notifRes, fundraiserRes, usersRes, settingsRes] = await Promise.all([
      api.recentTransactions?.(48),
      api.notifications?.(),
      api.fundraisers?.(),
      api.users?.(),
      api.settings?.(),
    ]);
    if (txRes?.data)        window.TRANSACTIONS  = txRes.data;
    if (notifRes?.data)     window.NOTIFICATIONS = notifRes.data;
    if (fundraiserRes?.data) window.FUNDRAISERS   = fundraiserRes.data;
    if (usersRes?.data)     window.USERS          = usersRes.data;
    if (settingsRes?.data)  window.SETTINGS       = settingsRes.data;
  } catch (e) {
    console.log('[data] Admin data fallback:', e?.message || e);
  }
}

async function loadDashboardChart() {
  if (typeof window.api === 'undefined') return;
  try {
    const res = await window.api.dailyChart?.(30);
    if (res?.data) window.DAILY_DONATIONS = res.data;
  } catch (e) {
    console.log('[data] Chart data fallback:', e?.message || e);
  }
}

async function loadProfile() {
  if (typeof window.api === 'undefined') return;
  try {
    const res = await window.api.profile?.();
    if (res?.data) window.PROFILE = res.data;
  } catch (e) {
    console.log('[data] Profile fallback:', e?.message || e);
  }
}

/* ------------------------------------------------------------------ */
/*  Export to window scope                                             */
/* ------------------------------------------------------------------ */

// Namespace object
window.NB = {
  fmtIDR, fmtIDRShort, fmtNum, fmtPct,
  campaignSeed, txns, fundraisers, members,
  dailyDonations, trafficSources, paymentMethods, autoConfirmMethods, isAutoConfirmMethod,
  socialProofLines, donorNames, NOMINAL_PRESETS, NOTIFICATIONS, TRASH,
  TOTAL_RAISED, TOTAL_DONORS, TOTAL_TX, ACTIVE_CAMPAIGNS,
  TOTAL_FUNDRAISER, TOTAL_LEADS, CONV_RATE, TODAY_RAISED, MONTH_RAISED,
  placeholderImg, avatarSvg, makeTxns,
  loadApiData, loadAdminData, loadDashboardChart, loadProfile,
};

// Individual window exports (backward compat)
window.fmtIDR           = fmtIDR;
window.fmtIDRShort      = fmtIDRShort;
window.fmtShort         = fmtIDRShort; // alias
window.fmtNum           = fmtNum;
window.fmtPct           = fmtPct;
window.placeholderImg   = placeholderImg;
window.avatarSvg        = avatarSvg;
window.CAMPAIGNS        = campaignSeed;
window.TRANSACTIONS     = txns;
window.DAILY            = dailyDonations;
window.DAILY_DONATIONS  = dailyDonations;
window.TRAFFIC_SOURCES  = trafficSources;
window.FUNDRAISERS      = fundraisers;
window.USERS            = members;
window.NOTIFICATIONS    = NOTIFICATIONS;
window.TRASH            = TRASH;
window.DONORS           = donorNames;
window.NOMINAL_PRESETS  = NOMINAL_PRESETS;
window.PAYMENT_METHODS  = paymentMethods;
window.TOTAL_RAISED     = TOTAL_RAISED;
window.TOTAL_DONORS     = TOTAL_DONORS;
window.TOTAL_TX         = TOTAL_TX;
window.ACTIVE_CAMPAIGNS = ACTIVE_CAMPAIGNS;
window.TOTAL_FUNDRAISER = TOTAL_FUNDRAISER;
window.TOTAL_LEADS      = TOTAL_LEADS;
window.CONV_RATE        = CONV_RATE;
window.TODAY_RAISED     = TODAY_RAISED;
window.MONTH_RAISED     = MONTH_RAISED;
window.socialProofLines = socialProofLines;
window.loadApiData      = loadApiData;
window.loadAdminData    = loadAdminData;
window.loadDashboardChart = loadDashboardChart;
window.loadProfile      = loadProfile;
window.makeTxns         = makeTxns;

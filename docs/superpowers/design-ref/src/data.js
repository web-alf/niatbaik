// Dummy data + helpers shared across views.

const fmtIDR = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const fmtIDRShort = (n) => {
  if (n >= 1e9) return 'Rp ' + (n / 1e9).toFixed(1).replace(/\.0$/, '') + ' M';
  if (n >= 1e6) return 'Rp ' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + ' jt';
  if (n >= 1e3) return 'Rp ' + (n / 1e3).toFixed(0) + ' rb';
  return 'Rp ' + n;
};
const fmtNum = (n) => n.toLocaleString('id-ID');
const fmtPct = (n) => (n * 100).toFixed(1) + '%';

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
];

const donorNames = [
  'Rizky H.', 'Hamba Allah', 'Siti Nurhaliza', 'Andi P.', 'Hamba Allah',
  'Budi Santoso', 'Maya Wijaya', 'Hamba Allah', 'Dewi A.', 'Fajar Ramadhan',
  'Hamba Allah', 'Nadia P.', 'Iqbal R.', 'Hamba Allah', 'Lestari K.',
  'Hamba Allah', 'Yusuf M.', 'Aisha N.', 'Hamba Allah', 'Rangga D.',
];

const paymentMethods = ['QRIS', 'BCA VA (Moota)', 'Mandiri VA (Moota)', 'BNI VA (Moota)', 'Flip', 'GoPay', 'OVO', 'Dana', 'ShopeePay'];
// Methods that support auto-confirm via webhook (status Pending → Paid otomatis)
const autoConfirmMethods = ['BCA VA (Moota)', 'Mandiri VA (Moota)', 'BNI VA (Moota)', 'Flip'];
const isAutoConfirmMethod = (m) => autoConfirmMethods.includes(m);

function makeTxns(n) {
  const rows = [];
  const statuses = ['Paid','Paid','Paid','Paid','Pending','Failed','Paid','Paid'];
  const utm = [
    { source: 'facebook',  medium: 'paid',    campaign: 'aira-jantung-q2',     content: 'hero-vid-01',   term: 'donasi-medis',  id: 'fb-29384' },
    { source: 'google',    medium: 'cpc',     campaign: 'wakaf-quran-search',  content: 'text-ad-3',     term: 'wakaf-quran',   id: 'gg-71028' },
    { source: 'tiktok',    medium: 'paid',    campaign: 'bukber-yatim-tt',     content: 'bantu-rans',    term: 'organik',       id: 'tt-rian-01' },
    { source: 'instagram', medium: 'social',  campaign: 'organic-bio',         content: 'reels-04',      term: 'sedekah',       id: 'ig-bio-link' },
    { source: '(direct)',  medium: '(none)',  campaign: '(direct)',            content: '',              term: '',              id: '' },
  ];
  for (let i = 0; i < n; i++) {
    const c = campaignSeed[i % campaignSeed.length];
    const amt = [25_000, 50_000, 100_000, 150_000, 200_000, 250_000, 500_000, 1_000_000][i % 8];
    const u = utm[i % utm.length];
    rows.push({
      id: 'INV-' + (2025_1100 + i).toString(),
      donor: donorNames[i % donorNames.length],
      campaign: c.title,
      campaignId: c.id,
      amount: amt,
      method: paymentMethods[i % paymentMethods.length],
      status: statuses[i % statuses.length],
      date: `${(i%28)+1} Mei 2026, ${(8 + (i%12)).toString().padStart(2,'0')}:${(i*7%60).toString().padStart(2,'0')}`,
      utm: u,
      whatsapp: '+62 81' + (200000000 + i * 137).toString().slice(0,9),
      email: ['rizky','siti','andi','budi','maya','dewi','fajar','nadia'][i%8] + '@mail.com',
      note: i % 5 === 0 ? 'Donatur minta dikirimkan kuitansi via WA.' : '',
      anon: i % 6 === 0,
      message: ['Semoga Allah balas dengan kebaikan berlipat.','Mohon doakan keluarga kami.','Sedikit dari kami, semoga bermanfaat.','Niat baik, semoga terlaksana.','-'][i%5],
    });
  }
  return rows;
}

const txns = makeTxns(48);

const fundraisers = [
  { id: 'f-01', name: 'Ust. Ahmad Fauzi', campaign: 'Buka Puasa 5.000 Yatim', raised: 84_320_000, txn: 612, commission: 8_432_000, status: 'pending', ref: 'NB/AHMAD' },
  { id: 'f-02', name: 'Komunitas Pejuang Subuh', campaign: 'Sumur Bersih NTT', raised: 41_500_000, txn: 318, commission: 4_150_000, status: 'paid', ref: 'NB/PSUBUH' },
  { id: 'f-03', name: 'Influencer @hijrahbersama', campaign: 'Bantuan Aira', raised: 38_120_000, txn: 884, commission: 3_812_000, status: 'pending', ref: 'NB/HIJRAH' },
  { id: 'f-04', name: 'Masjid Al-Falah Bandung', campaign: 'Wakaf Quran', raised: 12_400_000, txn: 142, commission: 1_240_000, status: 'paid', ref: 'NB/ALFALAH' },
  { id: 'f-05', name: 'Rizal Pratama', campaign: 'Madrasah Lombok', raised: 8_750_000, txn: 67, commission: 875_000, status: 'pending', ref: 'NB/RIZAL' },
];

const members = [
  { id: 'u-01', name: 'Andre Wicaksono', email: 'andre@niatbaik.org', role: 'Admin', status: 'active', lastLogin: 'baru saja' },
  { id: 'u-02', name: 'Putri Maharani', email: 'putri@niatbaik.org', role: 'CS', status: 'active', lastLogin: '5 menit lalu' },
  { id: 'u-03', name: 'Bagus Santoso', email: 'bagus@niatbaik.org', role: 'CS', status: 'active', lastLogin: '20 menit lalu' },
  { id: 'u-04', name: 'Dewi Lestari', email: 'dewi@niatbaik.org', role: 'Advertiser', status: 'active', lastLogin: '1 jam lalu' },
  { id: 'u-05', name: 'Rahmat Hidayat', email: 'rahmat@niatbaik.org', role: 'Advertiser', status: 'inactive', lastLogin: '3 hari lalu' },
  { id: 'u-06', name: 'Sinta Aulia', email: 'sinta@niatbaik.org', role: 'CS', status: 'active', lastLogin: 'kemarin' },
];

// Daily donation series for chart (30 days)
const dailyDonations = Array.from({length: 30}, (_, i) => {
  const base = 18_000_000 + Math.sin(i / 3) * 8_000_000 + (i / 30) * 12_000_000;
  const noise = ((i * 9301 + 49297) % 233280) / 233280;
  return Math.max(2_500_000, Math.round(base + noise * 14_000_000));
});

// Traffic source breakdown
const trafficSources = [
  { name: 'Meta Ads',     visits: 48230, leads: 5612, donations: 1842, spend: 92_400_000, color: '#1877F2' },
  { name: 'TikTok Ads',   visits: 31840, leads: 3210, donations: 980,  spend: 41_800_000, color: '#000000' },
  { name: 'Google Ads',   visits: 22150, leads: 2840, donations: 1124, spend: 58_300_000, color: '#34A853' },
  { name: 'Organic',      visits: 18920, leads: 1410, donations: 612,  spend: 0,          color: '#2E4191' },
];

const socialProofLines = [
  { name: 'Hamba Allah',   amount: 100_000, campaign: 'Bantuan Aira',           when: 'baru saja' },
  { name: 'Rizky H.',      amount: 50_000,  campaign: 'Sumur Bersih NTT',       when: '12 detik lalu' },
  { name: 'Hamba Allah',   amount: 250_000, campaign: 'Buka Puasa 5.000 Yatim', when: '34 detik lalu' },
  { name: 'Siti N.',       amount: 500_000, campaign: 'Bantuan Aira',           when: '1 menit lalu' },
  { name: 'Hamba Allah',   amount: 25_000,  campaign: 'Wakaf Quran',            when: '2 menit lalu' },
];

window.NB = {
  fmtIDR, fmtIDRShort, fmtNum, fmtPct,
  campaignSeed, txns, fundraisers, members,
  dailyDonations, trafficSources, paymentMethods, autoConfirmMethods, isAutoConfirmMethod, socialProofLines,
};

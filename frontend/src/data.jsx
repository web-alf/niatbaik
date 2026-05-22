// Dummy data for NIATBAIK.ORG
// All campaigns are pendidikan-themed (beasiswa, sekolah, dhuafa pendidikan)

const fmtIDR = (n) => 'Rp' + (n||0).toLocaleString('id-ID');
const fmtShort = (n) => {
  if (n >= 1e9) return 'Rp' + (n/1e9).toFixed(1).replace(/\.0$/,'') + 'M';
  if (n >= 1e6) return 'Rp' + (n/1e6).toFixed(1).replace(/\.0$/,'') + 'jt';
  if (n >= 1e3) return 'Rp' + (n/1e3).toFixed(0) + 'rb';
  return 'Rp' + n;
};
const fmtNum = (n) => (n||0).toLocaleString('id-ID');

// SVG placeholder image generator - returns data URI for a "photo-like" gradient w/ icon
function placeholderImg(seed, label){
  const hues = [['#2E4191','#38B6FF'],['#2563eb','#22d3ee'],['#0e7490','#38B6FF'],['#1e40af','#60a5fa'],['#0369a1','#7dd3fc'],['#1e3a8a','#38bdf8']];
  const [a,b] = hues[seed % hues.length];
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
        <text font-size='28' font-weight='700' letter-spacing='1'>${label||'PENDIDIKAN'}</text>
        <text y='40' font-size='15' opacity='0.75'>niatbaik.org</text>
      </g>
      <g transform='translate(400 360)' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'>
        <circle r='28'/><path d='M-10 -2 L-2 8 L12 -10' stroke-linecap='round' stroke-linejoin='round' stroke-width='3'/>
      </g>
    </svg>`
  );
}

function avatarSvg(initials, seed){
  const hues = ['#2E4191','#38B6FF','#0e83c8','#4762bd','#1aa1ee','#125883'];
  const bg = hues[seed % hues.length];
  return `data:image/svg+xml;utf8,` + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'>
      <rect width='80' height='80' rx='40' fill='${bg}'/>
      <text x='40' y='48' text-anchor='middle' fill='#fff' font-family='DM Sans, sans-serif' font-size='30' font-weight='700'>${initials}</text>
    </svg>`
  );
}

const CAMPAIGNS = [
  { id:'c1', slug:'beasiswa-1000-anak-dhuafa', title:'Beasiswa 1000 Anak Dhuafa Lanjut Sekolah', target: 1_500_000_000, raised: 1_127_450_000, donors: 8432, days: 14, status:'Running', category:'Beasiswa', img: placeholderImg(0,'BEASISWA'), description:'Banyak anak putus sekolah karena ekonomi. Dengan donasi Anda, mereka bisa kembali ke bangku sekolah tahun ini.' },
  { id:'c2', slug:'bangun-sekolah-pelosok-ntt', title:'Bangun Sekolah di Pelosok NTT', target: 850_000_000, raised: 642_300_000, donors: 4120, days: 32, status:'Running', category:'Sekolah', img: placeholderImg(1,'SEKOLAH NTT'), description:'Ratusan anak harus berjalan 3 jam ke sekolah terdekat. Mari bangun ruang kelas baru di desa terpencil NTT.' },
  { id:'c3', slug:'paket-sekolah-yatim', title:'Paket Sekolah Anak Yatim 2026', target: 500_000_000, raised: 489_200_000, donors: 5320, days: 4, status:'Running', category:'Yatim', img: placeholderImg(2,'PAKET SEKOLAH'), description:'Seragam, sepatu, tas, dan buku untuk anak-anak yatim agar siap masuk tahun ajaran baru.' },
  { id:'c4', slug:'tahfidz-quran-pesantren', title:'Beasiswa Tahfidz Qur’an Santri', target: 300_000_000, raised: 178_400_000, donors: 2240, days: 21, status:'Running', category:'Tahfidz', img: placeholderImg(3,'TAHFIDZ'), description:'Dukung 200 santri penghafal Al-Qur’an menyelesaikan hafalan 30 juz tahun ini.' },
  { id:'c5', slug:'laptop-untuk-mahasiswa', title:'Laptop untuk Mahasiswa Tidak Mampu', target: 250_000_000, raised: 92_500_000, donors: 873, days: 45, status:'Running', category:'Mahasiswa', img: placeholderImg(4,'LAPTOP'), description:'Banyak mahasiswa tertinggal pelajaran karena tidak punya laptop. Bantu satu mahasiswa lulus tepat waktu.' },
  { id:'c6', slug:'guru-honorer-pelosok', title:'Tunjangan Guru Honorer Pelosok', target: 200_000_000, raised: 200_000_000, donors: 3210, days: 0, status:'Ended', category:'Guru', img: placeholderImg(5,'GURU'), description:'Penghargaan untuk para guru honorer yang mengabdi di daerah 3T dengan gaji terbatas.' },
  { id:'c7', slug:'sahabat-sekolah', title:'Sahabat Sekolah — Bantu Iuran Sekolah', target: 400_000_000, raised: 0, donors: 0, days: 60, status:'Draft', category:'Iuran', img: placeholderImg(0,'IURAN SEKOLAH'), description:'Program patungan menutup tunggakan iuran sekolah anak-anak prasejahtera di Jabodetabek.' },
  { id:'c8', slug:'perpustakaan-desa', title:'Perpustakaan Mini untuk 50 Desa', target: 350_000_000, raised: 0, donors: 0, days: 0, status:'Published', category:'Literasi', img: placeholderImg(1,'PERPUSTAKAAN'), description:'Sudut baca berisi 500 buku untuk anak-anak desa, lengkap dengan rak dan furniture sederhana.' },
];

const DONORS = [
  { name:'Ahmad Fauzi', initials:'AF' },
  { name:'Hamba Allah', initials:'HA', anon:true },
  { name:'Siti Nurhaliza', initials:'SN' },
  { name:'Budi Santoso', initials:'BS' },
  { name:'Rina Marlina', initials:'RM' },
  { name:'Dewi Lestari', initials:'DL' },
  { name:'Pak Anto', initials:'PA' },
  { name:'Ibu Wati', initials:'IW' },
  { name:'Hamba Allah', initials:'HA', anon:true },
  { name:'Faisal Rahman', initials:'FR' },
  { name:'Citra Ayu', initials:'CA' },
  { name:'Tono Wiratmo', initials:'TW' },
];

const PRAYERS = [
  'Semoga semua anak Indonesia bisa lanjut sekolah. Aamiin.',
  'Sedikit yang saya bisa, semoga jadi amal jariyah.',
  'Untuk almarhumah ibu saya, semoga jadi pemberat timbangan kebaikannya.',
  'Barakallah… semoga sampai ke tangan yang berhak.',
  'Semangat adik-adik, raih cita-cita setinggi langit!',
  'Lillahi ta’ala. Mohon doakan keluarga kami.',
];

const NOMINAL_PRESETS = [25000, 50000, 100000, 250000, 500000, 1000000];

// Generate fake transactions
const PAYMENT_METHODS = ['BCA VA','BNI VA','Mandiri VA','BSI VA','QRIS','GoPay','OVO','DANA','ShopeePay','Bank Transfer'];
const STATUSES = ['Sukses','Pending','Gagal','Sukses','Sukses','Sukses'];
const UTM_SOURCES = ['facebook','google','tiktok','instagram','organic','whatsapp'];

function genTx(n){
  const out = [];
  const now = Date.now();
  for(let i=0;i<n;i++){
    const c = CAMPAIGNS[i % 6];
    const d = DONORS[i % DONORS.length];
    const amt = NOMINAL_PRESETS[i % NOMINAL_PRESETS.length] + (i*1000 % 25000);
    const stat = STATUSES[i % STATUSES.length];
    const days = Math.floor(i/3);
    out.push({
      id: 'INV-' + String(20260000 + i).slice(-7),
      donor: d.name,
      initials: d.initials,
      anon: d.anon,
      campaign: c.title,
      campaignId: c.id,
      amount: amt,
      method: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
      status: stat,
      ts: now - (i*3600_000) - (days*86400_000*0.4),
      utm_source: UTM_SOURCES[i % UTM_SOURCES.length],
      utm_campaign: 'ramadhan-2026',
      utm_medium: i%3===0?'cpc':'social',
      phone: '+62 81' + String(10000000 + i*137).slice(-8),
      email: d.name.toLowerCase().replace(/[^a-z]/g,'.').slice(0,12) + '@gmail.com',
      prayer: PRAYERS[i % PRAYERS.length],
      note: i%5===0 ? 'Donor follow-up untuk pengulangan donasi bulanan.' : '',
    });
  }
  return out;
}

const TRANSACTIONS = genTx(48);

// Analytics daily series (30 days)
function genDaily(){
  const out = [];
  for(let i=29;i>=0;i--){
    const d = new Date(Date.now() - i*86400_000);
    // base trend + weekly cycle + spikes
    const base = 12_000_000 + i*350_000;
    const cycle = Math.sin(i/3)*4_000_000;
    const noise = (Math.cos(i*1.7)+1)*2_000_000;
    const spike = (i===6 || i===15) ? 18_000_000 : 0;
    const amount = Math.max(2_000_000, Math.round(base + cycle + noise + spike));
    out.push({ date: d, amount, count: Math.round(amount/85_000) });
  }
  return out;
}
const DAILY = genDaily();

const TOTAL_RAISED = CAMPAIGNS.reduce((s,c)=>s+c.raised,0);
const TOTAL_DONORS = CAMPAIGNS.reduce((s,c)=>s+c.donors,0);
const TOTAL_TX = TRANSACTIONS.length * 537; // multiplier for realism
const ACTIVE_CAMPAIGNS = CAMPAIGNS.filter(c=>c.status==='Running').length;
const TOTAL_FUNDRAISER = 142;
const TOTAL_LEADS = 18420;
const CONV_RATE = 4.7; // %
const TODAY_RAISED = DAILY[DAILY.length-1].amount;
const MONTH_RAISED = DAILY.reduce((s,d)=>s+d.amount,0);

const FUNDRAISERS = [
  { id:'f1', name:'Ust. Ahmad Dahlan', campaign:'Beasiswa 1000 Anak Dhuafa', raised:78_400_000, tx:312, commission:3_920_000, status:'paid', ref:'AHMAD' },
  { id:'f2', name:'Komunitas Peduli Anak', campaign:'Bangun Sekolah NTT', raised:54_200_000, tx:198, commission:2_710_000, status:'pending', ref:'KPA' },
  { id:'f3', name:'Indah Ramadhani', campaign:'Paket Sekolah Yatim', raised:46_120_000, tx:243, commission:2_306_000, status:'pending', ref:'INDAH' },
  { id:'f4', name:'Pesantren Al-Hikmah', campaign:'Beasiswa Tahfidz', raised:38_900_000, tx:172, commission:1_945_000, status:'paid', ref:'ALHIKMAH' },
  { id:'f5', name:'Rumah Belajar Senyum', campaign:'Laptop Mahasiswa', raised:12_300_000, tx:64, commission:615_000, status:'pending', ref:'SENYUM' },
];

const USERS = [
  { id:'u1', name:'Admin Pusat', email:'admin@niatbaik.org', role:'Admin', status:'active', last:'2 menit lalu', initials:'AP' },
  { id:'u2', name:'Rizki Adhitama', email:'rizki@niatbaik.org', role:'Admin', status:'active', last:'1 jam lalu', initials:'RA' },
  { id:'u3', name:'Sari Maharani', email:'sari@niatbaik.org', role:'CS', status:'active', last:'5 menit lalu', initials:'SM' },
  { id:'u4', name:'Bayu Pratama', email:'bayu@niatbaik.org', role:'CS', status:'active', last:'12 menit lalu', initials:'BP' },
  { id:'u5', name:'Dimas Iklan', email:'dimas@niatbaik.org', role:'Advertiser', status:'active', last:'30 menit lalu', initials:'DI' },
  { id:'u6', name:'Putri Marketing', email:'putri@niatbaik.org', role:'Advertiser', status:'active', last:'kemarin', initials:'PM' },
  { id:'u7', name:'Andi Lama', email:'andi@niatbaik.org', role:'CS', status:'inactive', last:'2 minggu lalu', initials:'AL' },
];

const NOTIFICATIONS = [
  { id:1, type:'donation', title:'Donasi baru Rp250.000', sub:'Ahmad Fauzi · Beasiswa 1000 Anak', ts:'baru saja' },
  { id:2, type:'campaign', title:'Campaign "Paket Sekolah Yatim" tercapai 97%', sub:'Sisa 4 hari', ts:'10 menit lalu' },
  { id:3, type:'system', title:'Meta Pixel reconnected', sub:'Event tracking aktif kembali', ts:'1 jam lalu' },
  { id:4, type:'donation', title:'Donasi baru Rp1.000.000', sub:'Hamba Allah · Bangun Sekolah NTT', ts:'2 jam lalu' },
  { id:5, type:'fundraiser', title:'Fundraiser baru bergabung', sub:'Komunitas Peduli Anak', ts:'kemarin' },
];

// Source / channel breakdown
const TRAFFIC_SOURCES = [
  { src:'Meta Ads', visits: 124_800, leads: 5240, donations: 2180, spend: 38_500_000, color:'#2E4191' },
  { src:'Google Ads', visits: 86_200, leads: 3120, donations: 1480, spend: 28_200_000, color:'#38B6FF' },
  { src:'TikTok Ads', visits: 62_400, leads: 1840, donations: 720, spend: 14_800_000, color:'#0e83c8' },
  { src:'Organic', visits: 41_300, leads: 980, donations: 540, spend: 0, color:'#94a3b8' },
];

// Trash items
const TRASH = [
  { id:'t1', kind:'campaign', title:'Bantu Renovasi Madrasah (lama)', deleted:'3 hari lalu', by:'Rizki Adhitama' },
  { id:'t2', kind:'user', title:'Test Account', deleted:'1 minggu lalu', by:'Admin Pusat' },
  { id:'t3', kind:'transaction', title:'INV-2025993', deleted:'2 minggu lalu', by:'Sari Maharani' },
  { id:'t4', kind:'campaign', title:'Kurban 2025', deleted:'1 bulan lalu', by:'Admin Pusat' },
];

Object.assign(window, {
  fmtIDR, fmtShort, fmtNum, placeholderImg, avatarSvg,
  CAMPAIGNS, DONORS, PRAYERS, NOMINAL_PRESETS, PAYMENT_METHODS,
  TRANSACTIONS, DAILY, TOTAL_RAISED, TOTAL_DONORS, TOTAL_TX, ACTIVE_CAMPAIGNS,
  TOTAL_FUNDRAISER, TOTAL_LEADS, CONV_RATE, TODAY_RAISED, MONTH_RAISED,
  FUNDRAISERS, USERS, NOTIFICATIONS, TRAFFIC_SOURCES, TRASH
});

// API data loader — replaces dummy data when backend is available
async function loadApiData() {
  try {
    const [statsRes, campaignsRes, categoriesRes] = await Promise.all([
      api.publicStats(),
      api.campaigns(),
      api.categories(),
    ]);

    if (statsRes?.data) {
      window.TOTAL_RAISED = statsRes.data.total_raised || TOTAL_RAISED;
      window.TOTAL_DONORS = statsRes.data.total_donors || TOTAL_DONORS;
      window.ACTIVE_CAMPAIGNS = statsRes.data.active_campaigns || ACTIVE_CAMPAIGNS;
    }

    if (campaignsRes?.data && campaignsRes.data.length > 0) {
      window.CAMPAIGNS = campaignsRes.data.map(c => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        target: c.target,
        raised: c.total_raised || 0,
        donors: c.donor_count || 0,
        days: c.days_left || 0,
        status: c.status,
        category: c.category || '',
        img: c.image ? '/uploads/' + c.image : placeholderImg(0, c.title?.substring(0,12) || 'CAMPAIGN'),
        description: c.short_description || c.description || '',
      }));
      window.ACTIVE_CAMPAIGNS = CAMPAIGNS.filter(c => c.status === 'Berjalan').length;
    }

    console.log('API data loaded successfully');
  } catch (e) {
    console.log('Using fallback dummy data:', e?.message || e);
  }
}

window.loadApiData = loadApiData;

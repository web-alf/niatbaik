// Ads & Compliance Guide modal — Meta Ads, Google Ads, TikTok Ads, Organic.
// Content reflects the latest publicly-documented rules as of 2026 for charity / donation campaigns.
import { useState } from 'react';
import { Modal, Btn, Icon } from '@/components';

export default function AdsGuidePage({ open, onClose }: any) {
  const [tab, setTab] = useState('meta');

  if (!open) return null;

  const tabs = [
    { v:'meta',    l:'Meta Ads',    icon:'pixel',   color:'#1877F2', sub:'Facebook + Instagram' },
    { v:'google',  l:'Google Ads',  icon:'target',  color:'#34A853', sub:'Search + Display + YouTube' },
    { v:'tiktok',  l:'TikTok Ads',  icon:'bolt',    color:'#FF0050', sub:'For You + Spark Ads' },
    { v:'organic', l:'Organik',     icon:'sparkle', color:'#16A34A', sub:'SEO + Sosmed + Komunitas' },
  ];

  return (
    <Modal open={open} onClose={onClose} size="xl"
      title={<span className="flex items-center gap-2">
        <span className="h-7 w-7 rounded-md bg-brand-600 text-white flex items-center justify-center"><Icon name="sparkle" size={14}/></span>
        Panduan Platform Iklan & Organik
      </span>}
      footer={<>
        <span className="mr-auto text-xs text-mute">Update: Mei 2026</span>
        <Btn variant="outline" tone="ink" icon="download" onClick={() => window.print()}>Unduh PDF</Btn>
        <Btn onClick={onClose}>Tutup</Btn>
      </>}>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-5">
        {/* Sidebar tabs */}
        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto no-scrollbar -mx-1 px-1 lg:m-0 lg:p-0">
          {tabs.map((t) => (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors text-left ${tab === t.v ? 'bg-brand-50 text-brand-700' : 'text-ink/85 hover:bg-bg2'}`}>
              <div className={`h-7 w-7 rounded-md flex items-center justify-center text-white shrink-0`} style={{ background: t.color }}>
                <Icon name={t.icon} size={14}/>
              </div>
              <div className="min-w-0">
                <div className="text-sm leading-tight">{t.l}</div>
                <div className="text-[10px] font-medium text-mute leading-tight">{t.sub}</div>
              </div>
            </button>
          ))}

          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 hidden lg:block">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1"><Icon name="shield" size={12}/> Disclaimer</div>
            <div className="text-[11px] text-amber-800 leading-snug mt-1">Rules tiap platform berubah berkala. Selalu rujuk dokumentasi resmi sebelum scale-up budget besar.</div>
          </div>
        </nav>

        <div className="min-h-[480px]">
          {tab === 'meta'    && <MetaGuide/>}
          {tab === 'google'  && <GoogleGuide/>}
          {tab === 'tiktok'  && <TikTokGuide/>}
          {tab === 'organic' && <OrganicGuide/>}
        </div>
      </div>
    </Modal>
  );
}

// =========================================================
// Reusable guide blocks
// =========================================================
function GuideHero({ color, title, sub, kpi }: any) {
  return (
    <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: color }}>
      <div className="relative">
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-90">Panduan Platform</div>
        <h2 className="mt-1 text-2xl font-extrabold">{title}</h2>
        <p className="mt-1 text-sm text-white/90 max-w-2xl">{sub}</p>
        {kpi && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            {kpi.map((k: any, i: number) => (
              <div key={i} className="rounded-lg bg-white/15 backdrop-blur p-2.5">
                <div className="text-lg font-extrabold">{k.v}</div>
                <div className="text-[10px] text-white/85 leading-tight mt-0.5">{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section2({ icon, title, sub, tone='brand', children }: any) {
  const tones: any = {
    brand: 'bg-brand-50 text-brand-600',
    ok:    'bg-emerald-50 text-emerald-600',
    warn:  'bg-amber-50 text-amber-600',
    bad:   'bg-rose-50 text-rose-600',
    sky:   'bg-sky2-50 text-sky2-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-start gap-2.5 mb-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <Icon name={icon} size={16}/>
        </div>
        <div>
          <div className="font-bold text-ink">{title}</div>
          {sub && <div className="text-xs text-mute">{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function CheckList({ items, tone='ok' }: any) {
  const c = tone === 'ok' ? 'text-emerald-600 bg-emerald-50' : tone === 'bad' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50';
  const ic = tone === 'ok' ? 'check' : tone === 'bad' ? 'close' : 'shield';
  return (
    <ul className="space-y-2 text-sm text-ink/85">
      {items.map((it: any, i: number) => (
        <li key={i} className="flex items-start gap-2">
          <span className={`h-5 w-5 rounded-full ${c} flex items-center justify-center shrink-0 mt-0.5`}>
            <Icon name={ic} size={11} strokeWidth={2.6}/>
          </span>
          <span dangerouslySetInnerHTML={{ __html: it }}/>
        </li>
      ))}
    </ul>
  );
}

function CodeBlock({ children }: any) {
  return <pre className="rounded-lg bg-ink text-emerald-300 text-[11px] font-mono p-3 overflow-x-auto leading-relaxed">{children}</pre>;
}

// =========================================================
// META ADS
// =========================================================
function MetaGuide() {
  return (
    <div className="space-y-4">
      <GuideHero color="#1877F2" title="Meta Ads — Facebook + Instagram"
        sub="Untuk campaign donasi, manfaatkan Special Ad Category 'Social Issues' bila menargetkan isu sensitif, dan optimasi Purchase + Donate via Conversions API."
        kpi={[
          { v:'~4.2x', l:'ROAS rata-rata charity ID' },
          { v:'≤ 24j', l:'Window attribusi' },
          { v:'5 act.', l:'Min event Purchase' },
          { v:'CAPI', l:'Wajib aktif 2026' },
        ]}/>

      <Section2 icon="check" tone="ok" title="Wajib di-setup" sub="Sebelum spend pertama">
        <CheckList items={[
          'Pasang <b>Meta Pixel</b> di seluruh halaman + event minimum: <code>PageView</code>, <code>ViewContent</code>, <code>InitiateCheckout</code>, <code>AddPaymentInfo</code>, <code>Purchase</code>',
          'Aktifkan <b>Conversions API (CAPI)</b> via server-side dengan parameter <code>fbclid</code>, <code>fbp</code>, <code>fbc</code>, dan user data (email/phone) yang sudah di-hash SHA-256',
          'Verifikasi <b>domain niatbaik.org</b> di Business Manager → Brand Safety',
          'Setup <b>Aggregated Event Measurement (AEM)</b> — pilih max 8 event prioritas, urutkan dari paling akhir (Purchase) ke atas (PageView)',
          'Buat <b>Custom Audience</b>: All visitors 30d, Add Payment Info 14d, Purchasers 180d (untuk lookalike & retargeting)',
        ]}/>
      </Section2>

      <Section2 icon="close" tone="bad" title="Yang dilarang (Disapproval triggers)" sub="Penyebab iklan ditolak / akun dibatasi">
        <CheckList tone="bad" items={[
          'Klaim emosional ekstrem: <i>"selamatkan nyawa sekarang atau dia mati"</i> → langgar <b>Sensational Content policy</b>',
          'Gambar penderita dengan close-up wajah anak yatim / pasien terminal → bisa kena <b>Personal Attributes</b>',
          'Klaim hasil <i>"100% sampai"</i> tanpa bukti audit → langgar <b>Misleading Claims</b>',
          'Sebut nama / jumlah donatur lain di iklan (langgar <b>Personal Attributes</b>)',
          'Penggunaan <b>before/after</b> medis (penderita sebelum vs sesudah)',
          'Iklan minta donasi via DM/WhatsApp manual tanpa landing page → flagged sebagai <b>off-platform circumvention</b>',
        ]}/>
      </Section2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section2 icon="target" tone="brand" title="Struktur kampanye optimal">
          <CheckList items={[
            'Objective: <b>Sales</b> (bukan Engagement) — optimasi event Purchase',
            'CBO (Campaign Budget Optimization) untuk min 3 ad set',
            '<b>Advantage+ Audience</b> — biarkan ML pilih, jangan over-target',
            'Min budget per ad set: <b>Rp 200rb/hari</b> agar keluar learning phase < 7 hari',
            'Frequency cap: 2/7-hari untuk cold, 4/7-hari retargeting',
          ]}/>
        </Section2>

        <Section2 icon="bolt" tone="warn" title="Creative best-practice 2026">
          <CheckList tone="warn" items={[
            'Format <b>9:16 vertical</b> untuk Reels & Stories (priority 70% spend)',
            'Hook 3 detik pertama: <i>masalah konkret</i>, bukan logo yayasan',
            'UGC / talking-head > stock footage (CTR +60-120%)',
            'Caption text <b>≥ 80%</b> closed caption (audio off default)',
            'CTA button: <b>Donasi Sekarang</b> (bukan Learn More)',
          ]}/>
        </Section2>
      </div>

      <Section2 icon="code" tone="slate" title="Snippet Pixel — wajib dipasang">
        <CodeBlock>{`fbq('track', 'Purchase', {
  value: 100000,
  currency: 'IDR',
  content_type: 'donation',
  content_ids: ['c-002'],
  // CAPI dedup
  eventID: 'INV-20261234'
});`}</CodeBlock>
      </Section2>
    </div>
  );
}

// =========================================================
// GOOGLE ADS
// =========================================================
function GoogleGuide() {
  return (
    <div className="space-y-4">
      <GuideHero color="#34A853" title="Google Ads — Search + Display + YouTube"
        sub="Manfaatkan Google Ad Grants kalau yayasan eligible (USD $10k/bulan gratis). Untuk paid, fokus Performance Max + Search dengan offline conversion."
        kpi={[
          { v:'~3.8x', l:'ROAS rata-rata' },
          { v:'90 hr', l:'Conversion window' },
          { v:'≥ 30', l:'Min konversi/30d untuk Smart Bidding' },
          { v:'GA4', l:'Sumber tunggal 2026' },
        ]}/>

      <Section2 icon="check" tone="ok" title="Wajib di-setup">
        <CheckList items={[
          '<b>Google Ads Conversion</b> + <b>GA4 Enhanced Measurement</b> — gunakan GA4 sebagai single source of truth (Universal Analytics sudah sunset)',
          'Setup <b>Consent Mode v2</b> (<code>ad_storage</code>, <code>ad_user_data</code>, <code>ad_personalization</code>, <code>analytics_storage</code>) — wajib untuk EU + best practice global',
          'Pasang <b>Google Tag Manager</b> sebagai container utama, hindari hard-code',
          'Upload <b>Enhanced Conversions</b> — kirim email/phone donatur (di-hash) untuk match offline donation',
          '<b>Ad Grants</b> — apply via Google for Nonprofits (gratis $10k/bulan, ada syarat 5% CTR & quality score)',
        ]}/>
      </Section2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section2 icon="target" tone="brand" title="Tipe campaign yang efektif">
          <CheckList items={[
            '<b>Performance Max</b> — automated multi-channel, kasih creative asset lengkap (15 image + 5 video + 5 headline + 5 description)',
            '<b>Search</b> — keyword high intent: <i>"donasi sumur bersih"</i>, <i>"zakat fitrah online"</i>, gunakan <b>Broad Match + Smart Bidding</b>',
            '<b>YouTube In-Stream Skippable</b> — 6 detik hook, CTA card overlay donasi',
            '<b>Demand Gen</b> (ex-Discovery) untuk visual storytelling di Gmail + Discover',
          ]}/>
        </Section2>

        <Section2 icon="close" tone="bad" title="Yang dilarang">
          <CheckList tone="bad" items={[
            'Klaim deduksi pajak ("dapat potongan pajak 100%") tanpa bukti dokumen',
            'Donate-to-cause yang sebenarnya for-profit',
            'Trademark organisasi lain di copy iklan (Baznas, Dompet Dhuafa, dll)',
            'Landing page <b>tanpa kontak fisik</b> + <b>NPSN/akta yayasan</b> → policy <i>Misrepresentation</i>',
            'Doxxing penerima manfaat dengan KTP / alamat lengkap',
          ]}/>
        </Section2>
      </div>

      <Section2 icon="bolt" tone="warn" title="Bidding strategy 2026">
        <CheckList tone="warn" items={[
          'Mulai dengan <b>Maximize Conversions</b> sampai dapat 30 conv/30d',
          'Setelah cukup data → switch <b>Target ROAS</b> (set 300-400%) atau <b>Target CPA</b>',
          'Hindari Manual CPC kecuali untuk eksperimen keyword baru',
          '<b>Value-based bidding</b>: pass donation amount sebagai conversion value (bukan flat $1)',
        ]}/>
      </Section2>

      <Section2 icon="code" tone="slate" title="Snippet Conversion + Enhanced Conversions">
        <CodeBlock>{`gtag('event', 'conversion', {
  send_to: 'AW-1029384/AbC-D_efG',
  value: 100000,
  currency: 'IDR',
  transaction_id: 'INV-20261234',
  // Enhanced Conversions (akan di-hash auto)
  user_data: {
    email: 'donatur@mail.com',
    phone_number: '+628123456789'
  }
});`}</CodeBlock>
      </Section2>
    </div>
  );
}

// =========================================================
// TIKTOK ADS
// =========================================================
function TikTokGuide() {
  return (
    <div className="space-y-4">
      <GuideHero color="#FF0050" title="TikTok Ads — For You + Spark Ads"
        sub="Native-first creative wajib. Spark Ads (boost organic post) biasanya CPM 30-50% lebih murah daripada iklan dari nol. Charity policy ketat — bukti badan hukum wajib."
        kpi={[
          { v:'~2.9x', l:'ROAS rata-rata' },
          { v:'7 hari', l:'Default attribusi' },
          { v:'50+', l:'Min event/7d untuk auto bid' },
          { v:'EAPI', l:'Wajib aktif untuk iOS' },
        ]}/>

      <Section2 icon="check" tone="ok" title="Wajib di-setup">
        <CheckList items={[
          '<b>TikTok Pixel</b> + <b>Events API (EAPI)</b> server-side — wajib untuk akurasi tracking iOS 14.5+ dan AEM-style aggregation',
          'Verifikasi domain di TikTok Business Center → Web Events Configuration',
          'Pilih max 10 web event prioritas, urutkan dari Purchase ke PageView',
          'Aktifkan <b>Advanced Matching</b> — kirim email/phone hashed bersama event',
          'Daftar di <b>TikTok for Good</b> (kategori Nonprofit) untuk akses CPM diskon + verifikasi yayasan',
        ]}/>
      </Section2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section2 icon="bolt" tone="warn" title="Creative rules — strict">
          <CheckList tone="warn" items={[
            '<b>9:16 vertical</b> wajib, 1080×1920 min',
            'Audio harus jelas — TikTok demotes silent video',
            '<b>UGC / talking head</b> mengungguli polished branded video',
            'Hook < 3 detik, hindari logo yayasan di frame 1',
            'Caption / text overlay hindari clickbait ekstrem',
            'Gunakan <b>trending sound</b> berlisensi commercial (Commercial Music Library)',
          ]}/>
        </Section2>

        <Section2 icon="close" tone="bad" title="Yang dilarang">
          <CheckList tone="bad" items={[
            'Gambar penderita medis ekstrem (luka, before/after operasi)',
            'Penggunaan <b>shocking imagery</b> (kematian, kelaparan akut)',
            'Anak < 13 tahun sebagai subjek utama tanpa wali eksplisit',
            'Klaim donasi yang menyesatkan ("Rp 10rb = nyawa terselamatkan")',
            'Mengarahkan ke <b>WhatsApp pribadi</b> tanpa landing page resmi',
            'Penggunaan <b>music berlisensi konsumen</b> (Indonesian Idol clip, dll) — pakai Commercial Music Library',
          ]}/>
        </Section2>
      </div>

      <Section2 icon="target" tone="brand" title="Struktur campaign rekomendasi">
        <CheckList items={[
          'Objective: <b>Web Conversions</b> (bukan Traffic) — optimasi event Complete Payment',
          'ABO (Ad-set Budget) di awal — kasih min Rp 150rb/hari per adset',
          'Setelah dapat 50 conv → migrasi ke <b>Smart Performance Campaign (SPC)</b>',
          'Audience: mulai <b>Open Targeting</b> + Custom Audience exclusion donatur 30d',
          '<b>Spark Ads</b>: boost organic post yang sudah > 10K views → CPM bisa 40% lebih rendah',
        ]}/>
      </Section2>

      <Section2 icon="code" tone="slate" title="Snippet Pixel + EAPI dedup">
        <CodeBlock>{`ttq.track('CompletePayment', {
  value: 100000,
  currency: 'IDR',
  content_type: 'donation',
  content_id: 'c-002',
  // dedup dengan server-side EAPI event_id
  event_id: 'INV-20261234'
});`}</CodeBlock>
      </Section2>
    </div>
  );
}

// =========================================================
// ORGANIC
// =========================================================
function OrganicGuide() {
  return (
    <div className="space-y-4">
      <GuideHero color="#16A34A" title="Organik — SEO + Sosmed + Komunitas"
        sub="Sumber donasi paling 'sehat' (no spend, retensi tertinggi). Investasi 6-12 bulan, tapi compound."
        kpi={[
          { v:'~38%', l:'Donatur repeat' },
          { v:'∞ ROAS', l:'No ad spend' },
          { v:'> 70%', l:'Mobile share' },
          { v:'< 3d', l:'Best update cadence' },
        ]}/>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section2 icon="globe" tone="brand" title="SEO — Onpage & Technical">
          <CheckList items={[
            '<b>Core Web Vitals</b>: LCP < 2.5s, INP < 200ms, CLS < 0.1 — wajib untuk ranking 2026',
            'Schema.org markup: <code>NonprofitOrganization</code>, <code>DonateAction</code>, <code>Article</code> dengan author + reviewer',
            'Setiap campaign = landing page dedicated, slug human-readable (<code>/c/sumur-bersih-ntt</code>)',
            'Internal linking dari blog edukatif (<i>"Apa itu Fidyah?"</i>) ke campaign relevan',
            'Mobile-first design — Google index mobile dulu',
            'Image: WebP/AVIF + lazy load + alt text deskriptif',
          ]}/>
        </Section2>

        <Section2 icon="megaphone" tone="ok" title="Sosial Media organik">
          <CheckList items={[
            '<b>Instagram Reels</b> — algoritma 2026 push native edit + tren audio',
            '<b>TikTok</b> — post 3-5×/minggu, konsisten niche (charity storytelling)',
            'YouTube <b>Shorts</b> — copy ulang Reels dengan caption SEO',
            'WhatsApp Channel (broadcast) untuk update progress campaign',
            'Telegram group donatur retensi tinggi',
            'Hindari over-CTA "donasi sekarang" — 80% edukasi, 20% promosi',
          ]}/>
        </Section2>

        <Section2 icon="users" tone="warn" title="Komunitas & PR">
          <CheckList tone="warn" items={[
            'Kolaborasi <b>influencer mikro</b> (10-50K followers) — engagement 3-5× lebih tinggi',
            'Liputan media nasional — <b>Detik, CNN, Liputan6</b> — terbukti boost trust',
            'Program <b>Fundraiser referral</b> (komisi 10% donasi via link)',
            'Kerja sama masjid / pesantren / kampus',
            'Public audit bulanan + laporan transparan PDF',
          ]}/>
        </Section2>

        <Section2 icon="sparkle" tone="sky" title="Email & Notifikasi">
          <CheckList items={[
            'Welcome series 5 email setelah donasi pertama (educate, story, next campaign)',
            'Email update progress per campaign (foto dari lapangan)',
            'WhatsApp template terverifikasi untuk konfirmasi + thank-you',
            '<b>Donor monthly digest</b> — total tersalurkan, dampak nyata',
            'Reactivation untuk lapsed donor 90+ hari',
          ]}/>
        </Section2>
      </div>

      <Section2 icon="check" tone="ok" title="Quick wins minggu ini">
        <CheckList items={[
          'Audit kecepatan situs di <b>PageSpeed Insights</b> — target ≥ 90 mobile',
          'Buat 3 konten edukatif evergreen (cth: <i>"Cara hitung zakat penghasilan 2026"</i>)',
          'Setup Google My Business yayasan + kumpulkan review donatur',
          'Aktifkan share-to-WA / Instagram Stories di halaman campaign',
          'Tambah testimoni donatur dengan foto + nama (izin tertulis)',
        ]}/>
      </Section2>
    </div>
  );
}

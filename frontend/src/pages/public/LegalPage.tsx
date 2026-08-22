// Static legal pages (Syarat & Ketentuan / Kebijakan Privasi / Disklaimer).
// One component, content keyed by `kind` — routed from /syarat-ketentuan,
// /kebijakan-privasi, /disklaimer. Content is plain data (no HTML injection).
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Footer, MobileBottomNav, getKontakHref } from './_components';

type Section = { h: string; p?: string[]; ul?: string[] };
type Doc = { title: string; intro: string; sections: Section[] };

const DOCS: Record<string, Doc> = {
  terms: {
    title: 'Syarat & Ketentuan',
    intro:
      'Dengan mengakses dan menggunakan platform NIATBAIK.ORG ("Platform"), Anda menyetujui Syarat & Ketentuan berikut. Mohon dibaca dengan saksama sebelum berdonasi atau menggunakan layanan kami.',
    sections: [
      {
        h: '1. Tentang Platform',
        p: [
          'Platform ini dikelola oleh Yayasan NIATBAIK sebagai sarana penggalangan dana (crowdfunding) untuk program sosial, kemanusiaan, pendidikan, kesehatan, serta penyaluran zakat, infak, sedekah, dan wakaf.',
        ],
      },
      {
        h: '2. Donasi',
        ul: [
          'Donasi bersifat sukarela dan tidak dapat ditarik kembali (non-refundable) setelah pembayaran berhasil, kecuali terjadi kesalahan teknis yang dapat dibuktikan.',
          'Nominal minimum donasi mengikuti ketentuan yang tertera pada halaman campaign.',
          'Donatur dapat memilih untuk menampilkan nama atau berdonasi sebagai anonim.',
          'Bukti donasi diterbitkan secara elektronik melalui halaman invoice dan/atau kanal komunikasi yang Anda berikan.',
        ],
      },
      {
        h: '3. Penggunaan Dana',
        ul: [
          'Dana yang terkumpul disalurkan kepada penerima manfaat sesuai tujuan campaign.',
          'Biaya operasional dan/atau biaya layanan pembayaran dapat dipotong dari donasi sesuai ketentuan yang berlaku dan diinformasikan secara transparan.',
          'Apabila dana melebihi target atau campaign tidak dapat dilanjutkan, kelebihan dana akan dialokasikan ke program serupa yang masih membutuhkan.',
        ],
      },
      {
        h: '4. Fundraiser',
        ul: [
          'Fundraiser adalah pihak yang membantu menyebarkan campaign melalui tautan referral resmi.',
          'Pendaftaran fundraiser dilakukan melalui tim NIATBAIK dan tunduk pada verifikasi.',
          'Fundraiser dilarang menggunakan cara-cara yang menyesatkan, memaksa, atau melanggar hukum dalam mengajak berdonasi.',
        ],
      },
      {
        h: '5. Kewajiban Pengguna',
        ul: [
          'Memberikan data yang benar dan akurat saat berdonasi atau berkomunikasi dengan kami.',
          'Tidak menyalahgunakan Platform untuk tindakan penipuan, pencucian uang, atau aktivitas melanggar hukum lainnya.',
          'Tidak mengganggu, merusak, atau mencoba mengakses sistem Platform secara tidak sah.',
        ],
      },
      {
        h: '6. Hak Kekayaan Intelektual',
        p: [
          'Seluruh konten Platform — logo, teks, desain, dan materi campaign — dilindungi hak cipta dan tidak boleh digunakan tanpa izin tertulis dari Yayasan NIATBAIK, kecuali untuk keperluan menyebarkan campaign melalui fitur berbagi yang disediakan.',
        ],
      },
      {
        h: '7. Perubahan Ketentuan',
        p: [
          'Kami dapat memperbarui Syarat & Ketentuan ini sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini dan berlaku sejak dipublikasikan.',
        ],
      },
      {
        h: '8. Kontak',
        p: [
          'Pertanyaan mengenai Syarat & Ketentuan ini dapat disampaikan melalui kanal WhatsApp resmi yang tertera di Platform.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Kebijakan Privasi',
    intro:
      'Kebijakan Privasi ini menjelaskan bagaimana Yayasan NIATBAIK mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat menggunakan Platform NIATBAIK.ORG.',
    sections: [
      {
        h: '1. Data yang Kami Kumpulkan',
        ul: [
          'Data yang Anda berikan saat berdonasi: nama, nomor WhatsApp, alamat email, dan pesan/doa (opsional).',
          'Data transaksi: nominal donasi, metode pembayaran, dan status pembayaran.',
          'Data teknis: alamat IP, jenis perangkat/peramban, serta sumber kunjungan (UTM) untuk keperluan analitik.',
        ],
      },
      {
        h: '2. Penggunaan Data',
        ul: [
          'Memproses dan mengonfirmasi donasi Anda.',
          'Mengirimkan bukti donasi dan informasi perkembangan campaign.',
          'Meningkatkan layanan, keamanan, dan pengalaman pengguna Platform.',
          'Memenuhi kewajiban hukum dan pelaporan yang berlaku.',
        ],
      },
      {
        h: '3. Perlindungan Data',
        ul: [
          'Koneksi ke Platform dienkripsi menggunakan SSL/TLS.',
          'Data pembayaran diproses oleh penyedia layanan pembayaran berlisensi; kami tidak menyimpan data kartu atau kredensial perbankan Anda.',
          'Akses ke data pribadi dibatasi hanya untuk personel yang berwenang.',
        ],
      },
      {
        h: '4. Berbagi Data dengan Pihak Ketiga',
        p: [
          'Kami tidak menjual data pribadi Anda. Data hanya dibagikan kepada penyedia layanan pembayaran untuk memproses transaksi, atau kepada aparat berwenang bila diwajibkan oleh hukum.',
        ],
      },
      {
        h: '5. Donasi Anonim',
        p: [
          'Apabila Anda memilih berdonasi sebagai anonim, nama dan pesan Anda tidak akan ditampilkan secara publik di halaman campaign.',
        ],
      },
      {
        h: '6. Cookie & Pelacakan',
        p: [
          'Platform dapat menggunakan cookie dan piksel pemasaran (mis. Meta Pixel, Google Tag Manager) untuk analitik dan pengukuran iklan. Anda dapat menonaktifkan cookie melalui pengaturan peramban, dengan konsekuensi sebagian fitur mungkin tidak berfungsi optimal.',
        ],
      },
      {
        h: '7. Hak Anda',
        ul: [
          'Meminta salinan, koreksi, atau penghapusan data pribadi Anda.',
          'Menarik persetujuan penggunaan data untuk keperluan pemasaran.',
          'Menyampaikan keluhan terkait pemrosesan data pribadi.',
        ],
      },
      {
        h: '8. Perubahan Kebijakan',
        p: [
          'Kebijakan Privasi ini dapat diperbarui sewaktu-waktu. Perubahan material akan diinformasikan melalui Platform.',
        ],
      },
      {
        h: '9. Kontak',
        p: [
          'Permintaan terkait data pribadi dapat disampaikan melalui kanal WhatsApp resmi yang tertera di Platform.',
        ],
      },
    ],
  },
  disclaimer: {
    title: 'Disklaimer',
    intro:
      'Halaman ini memuat batasan tanggung jawab Yayasan NIATBAIK atas penggunaan Platform NIATBAIK.ORG.',
    sections: [
      {
        h: '1. Konten Campaign',
        p: [
          'Setiap campaign melalui proses verifikasi oleh tim kami. Meskipun demikian, informasi pada halaman campaign disusun berdasarkan data dari penggalang dana dan penerima manfaat; pembaruan kondisi di lapangan dapat terjadi sewaktu-waktu.',
        ],
      },
      {
        h: '2. Batas Tanggung Jawab',
        ul: [
          'Kami berupaya menjaga Platform tetap tersedia dan aman, namun tidak menjamin bebas dari gangguan teknis sepenuhnya.',
          'Kami tidak bertanggung jawab atas kerugian akibat penggunaan tautan tidak resmi yang mengatasnamakan NIATBAIK.ORG.',
          'Keputusan berdonasi sepenuhnya merupakan pilihan sadar donatur.',
        ],
      },
      {
        h: '3. Tautan Resmi',
        p: [
          'Satu-satunya domain resmi kami adalah niatbaik.org (termasuk subdomain donasi.niatbaik.org). Waspadai situs atau rekening yang mengatasnamakan kami di luar kanal resmi. Konfirmasi kebenaran informasi melalui WhatsApp resmi yang tertera di Platform.',
        ],
      },
      {
        h: '4. Perubahan',
        p: [
          'Disklaimer ini dapat diperbarui sewaktu-waktu tanpa pemberitahuan terlebih dahulu.',
        ],
      },
    ],
  },
};

export default function LegalPage({ kind }: { kind: 'terms' | 'privacy' | 'disclaimer' }) {
  const navigate = useNavigate();
  const doc = DOCS[kind];

  useEffect(() => {
    try { window.scrollTo(0, 0); } catch {}
    document.title = `${doc.title} — NIATBAIK.ORG`;
    return () => { document.title = 'NIATBAIK.ORG'; };
  }, [kind]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar onNav={(name: any) => { if (name === 'home') navigate('/'); }} onHome={() => navigate('/')}/>
      <main className="flex-1 bg-bg2">
        <div className="max-w-3xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-ink">{doc.title}</h1>
          <p className="mt-2 text-sm text-mute">Terakhir diperbarui: 7 Juli 2026</p>
          <p className="mt-5 text-ink/85 leading-relaxed">{doc.intro}</p>
          <div className="mt-8 space-y-7">
            {doc.sections.map((s, i) => (
              <section key={i}>
                <h2 className="font-bold text-lg text-ink">{s.h}</h2>
                {s.p?.map((t, j) => <p key={j} className="mt-2 text-sm text-ink/80 leading-relaxed">{t}</p>)}
                {s.ul && (
                  <ul className="mt-2 space-y-1.5 list-disc pl-5 text-sm text-ink/80 leading-relaxed">
                    {s.ul.map((t, j) => <li key={j}>{t}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer/>
      <MobileBottomNav
        onHome={() => navigate('/')}
        goSection={(hash: string) => {
          navigate('/');
          const id = hash.replace('#', '');
          setTimeout(() => { try { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); } catch {} }, 250);
        }}
        waHref={getKontakHref()}
      />
    </div>
  );
}

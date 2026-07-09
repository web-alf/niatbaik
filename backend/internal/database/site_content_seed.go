package database

import (
	"encoding/json"

	"github.com/anrdart/niatbaik-api/internal/model"
	"gorm.io/gorm"
)

// defaultSiteContent mirrors the homepage copy hardcoded in the frontend so that, on first
// boot, the CMS is pre-seeded with exactly what the site shows today (admin can then edit).
// Idempotent: only inserts keys that don't yet exist.
func defaultSiteContent() map[string]any {
	return map[string]any{
		"navbar": map[string]any{
			"links": []map[string]any{
				{"label": "Campaign", "href": "#campaigns"},
				{"label": "Bagaimana?", "href": "#how"},
				{"label": "Testimoni", "href": "#testi"},
				{"label": "FAQ", "href": "#faq"},
			},
			"ctaPrimary": "Donasi Sekarang",
			"loginLabel": "Masuk",
		},
		"hero": map[string]any{
			"badge":          "{{donors}} donatur aktif",
			"badgeSub":       "· Update real-time",
			"headline":       "Salurkan",
			"headlineAccent": "Niat Baik",
			"headlineTail":   "Anda, wujudkan kebaikan nyata.",
			"paragraph":      "Donasi terverifikasi untuk kemanusiaan, kesehatan, pendidikan, dan wakaf. Transparan, mudah, dan dipercaya oleh {{donors}}+ donatur di Indonesia.",
			"ctaPrimary":   "Mulai Donasi",
			"ctaSecondary": "Lihat Campaign",
			"trustLines": []string{"SSL Aman", "Berizin Kemensos", "Audit publik bulanan"},
		},
		"trust_strip": map[string]any{
			"caption": "Diliput & dipercaya oleh",
			"items": []map[string]any{
				{"name": "Kementerian Sosial RI", "src": "/trust/kemensos.svg"},
				{"name": "BAZNAS", "src": "/trust/baznas.svg"},
				{"name": "PWNU", "src": "/trust/nu.svg"},
				{"name": "Muhammadiyah", "src": "/trust/muhammadiyah.svg"},
				{"name": "detikcom", "src": "/trust/detik.png"},
				{"name": "CNN Indonesia", "src": "/trust/cnn-indonesia.svg"},
				{"name": "Tempo", "src": "/trust/tempo.svg"},
				{"name": "Liputan6", "src": "/trust/liputan6.svg"},
				{"name": "Kompas", "src": "/trust/kompas.svg"},
				{"name": "OJK", "src": "/trust/ojk.png"},
			},
		},
		"how_to": map[string]any{
			"eyebrow": "Cara berdonasi",
			"heading": "Mudah · Hanya 60 detik",
			"sub":     "Donasi via NIATBAIK.ORG bisa dilakukan kapan saja, tanpa perlu daftar akun.",
			"steps": []map[string]any{
				{"icon": "megaphone", "title": "Pilih campaign", "desc": "Pilih campaign sesuai niat baik Anda dari daftar terverifikasi."},
				{"icon": "wallet", "title": "Tentukan nominal", "desc": "Isi nominal donasi. Mulai dari Rp 10.000."},
				{"icon": "creditcard", "title": "Pilih pembayaran", "desc": "Bayar via QRIS, VA Bank, atau e-wallet favorit Anda."},
				{"icon": "heart", "title": "Doakan & sebar", "desc": "Donasi tersalurkan. Ajak teman ikut dalam kebaikan."},
			},
		},
		"testimonials": map[string]any{
			"eyebrow":         "Apa kata donatur",
			"headingTpl":      "Bergabung bersama {{donors}}+ donatur Indonesia",
			"headingFallback": "Bergabung bersama para donatur Indonesia",
			"sub":             "Cerita nyata dari donatur yang mempercayakan niat baiknya melalui NIATBAIK.ORG.",
			"items": []map[string]any{
				{"name": "Ibu Sari, Bekasi", "rating": "⭐⭐⭐⭐⭐", "quote": "Alhamdulillah, donasi saya untuk Aira dilaporkan transparan. Bahkan saya dikirim foto setelah operasinya. Sangat amanah.", "color": "#2E4191"},
				{"name": "Pak Burhan, Bandung", "rating": "⭐⭐⭐⭐⭐", "quote": "Sudah 3 tahun rutin sedekah lewat NIATBAIK. Donasi via QRIS, cepat dan langsung dapat kuitansi via WhatsApp.", "color": "#38B6FF"},
				{"name": "Hamba Allah", "rating": "⭐⭐⭐⭐⭐", "quote": "Donasi anonim juga dilayani. Yang penting niatnya baik, sampai ke yang membutuhkan. Terima kasih NIATBAIK.", "color": "#16A34A"},
				{"name": "Andini, Surabaya", "rating": "⭐⭐⭐⭐⭐", "quote": "Saya jadi fundraiser di NIATBAIK. Mudah dipakai, dan komisi bisa saya donasikan lagi. Berkah!", "color": "#F59E0B"},
			},
		},
		"faq": map[string]any{
			"eyebrow": "Pertanyaan umum",
			"heading": "Hal-hal yang sering ditanyakan",
			"items": []map[string]any{
				{"question": "Apakah donasi saya terverifikasi dan aman?", "answer": "Setiap campaign di NIATBAIK.ORG melalui proses verifikasi tim kami: kunjungan lapangan, dokumen pengaju, hingga update rutin. Donatur juga menerima laporan transparan tiap minggu."},
				{"question": "Bagaimana saya tahu donasi sudah diterima?", "answer": "Setelah pembayaran sukses, Anda akan menerima notifikasi & kuitansi otomatis via WhatsApp dan email. Riwayat donasi juga tampil di halaman campaign."},
				{"question": "Apa metode pembayaran yang didukung?", "answer": "QRIS, Virtual Account BCA/Mandiri/BNI/BRI, GoPay, OVO, Dana, ShopeePay, hingga kartu kredit. Tinggal pilih yang paling nyaman."},
				{"question": "Apakah saya bisa donasi sebagai Hamba Allah?", "answer": "Tentu. Centang \"Donasi sebagai anonim\" pada form, dan nama Anda akan tampil sebagai Hamba Allah di halaman publik."},
				{"question": "Apakah donasi saya bisa dijadikan zakat?", "answer": "Ya. Campaign tertentu dapat menjadi penyaluran zakat. Anda akan mendapatkan bukti penyaluran zakat untuk pengurang pajak."},
				{"question": "Apakah ada minimum donasi?", "answer": "Minimum donasi Rp 10.000. Tidak ada batas maksimum."},
			},
		},
		"final_cta": map[string]any{
			"headline":    "Setiap niat baik, sekecil apapun, berdampak besar.",
			"sub":         "Mulai donasi sekarang dan jadilah bagian dari kebaikan yang nyata.",
			"buttonLabel": "Donasi Sekarang",
		},
		"footer": map[string]any{
			"blurb":      "Platform donasi & crowdfunding terpercaya. Salurkan zakat, sedekah, wakaf, dan donasi kemanusiaan dengan mudah.",
			"waCtaLabel": "Hubungi kami via WhatsApp",
			"columns": []map[string]any{
				{"title": "Platform", "links": []map[string]any{
					{"label": "Donasi", "href": "#campaigns"},
					{"label": "Fundraiser", "href": "#how"},
					{"label": "Laporan transparansi", "href": "#testi"},
				}},
				{"title": "Tentang", "links": []map[string]any{
					{"label": "Profil Yayasan"},
					{"label": "Disklaimer", "href": "/disklaimer"},
				}},
				{"title": "Bantuan", "links": []map[string]any{
					{"label": "FAQ", "href": "#faq"},
					{"label": "Kontak", "href": "wa"},
					{"label": "Syarat & ketentuan", "href": "/syarat-ketentuan"},
					{"label": "Kebijakan privasi", "href": "/kebijakan-privasi"},
				}},
			},
			"copyright": "© 2026 Yayasan NIATBAIK.",
			"sslNote":   "Koneksi terenkripsi (SSL)",
		},
	}
}

// seedSiteContent inserts default rows for any section key not yet present. Called after
// AutoMigrate. Non-fatal: logs and continues on error (homepage falls back client-side).
func seedSiteContent(db *gorm.DB) error {
	for key, data := range defaultSiteContent() {
		var count int64
		db.Model(&model.SiteContent{}).Where("key = ?", key).Count(&count)
		if count > 0 {
			continue
		}
		raw, err := json.Marshal(data)
		if err != nil {
			continue
		}
		if err := db.Create(&model.SiteContent{Key: key, Value: string(raw)}).Error; err != nil {
			return err
		}
	}
	return nil
}

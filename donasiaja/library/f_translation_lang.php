<?php


function get_langArray($key, $lang = 'id') {

	global $wpdb;
    $table_name = $wpdb->prefix . "dja_settings";
    // Currency
    $query_currency = $wpdb->get_results('SELECT data from '.$table_name.' where type="currency" ORDER BY id ASC');
    $currency       = $query_currency[0]->data;
    $lang           = get_data_lang($currency);

    // Construct the path to the translation file
    $filePath = ABSPATH . "wp-content/plugins/donasiaja/library/locale/{$lang}.php";

    // Check if the translation file exists
    if (file_exists($filePath)) {
        // Include the translation file
        $translations = require $filePath;

        // Check if the returned value is an array
        if (is_array($translations)) {
            return $translations[$key] ?? "Translation not found for key: {$key}";
        } else {
            return 'Translation file did not return a valid array.';
        }
    } else {
        // return "Translation file not found: {$filePath}";
        return TranslationManager::get($key, $lang);
    }


}


class TranslationManager {
    private static $translations = [
        'id' => [
            // Dashboard
			'dash_card_title1' => 'Total Donasi',
			'dash_card_title2' => 'Jumlah Donasi',
			'dash_card_title3' => 'Konversi',
			'dash_card_desc1' => 'Total donasi berhasil terkumpul',
			'dash_card_desc2' => 'Donasi',
			'dash_card_desc3' => 'Terkumpul',
			'dash_card_desc4' => 'Konversi donasi berhasil terkumpul',
			'dash_table_title' => 'Data Donasi',
			'dash_table_col1' => 'Donatur',
			'dash_table_col2' => 'Donasi',
			'dash_setting_desc1' => 'Aktifkan jika ingin memfollowup menggunakan Wanotif dari background service. Jika tidak aktif, followup akan menggunakan metode link web whatsapp. Pastikan Wanotif anda sudah di-setup atau dalam kondisi aktif agar pesan bisa terkirim. (<a href="http://localhost:8888/wp/wp-admin/admin.php?page=donasiaja_settings&amp;action=notification" target="_blank">Setting Wanotif</a>)',
			'dash_setting_desc2' => 'Aktifkan jika ingin langsung otomatis memfollowup whatsapp saat merubah status payment menjadi Success (status pembayaran diterima).',
			'dash_setting_desc3' => 'Silahkan tambahkan kode berikut untuk memanggil value dari setiap donasi yang masuk.',
			'dash_cs_desc1' => 'Donasi yang berhasil dilakukan pada program',
			'dash_cs_desc2' => 'Total Donasi Terkumpul',
			'dash_cs_desc3' => 'Jumlah Donasi',
			'dash_cs_desc4' => 'Berhasil Donasi',
			'dash_cs_desc5' => 'Konversi',

			// Campaigns
			'campaign_card_title1' => 'Total Donasi',
			'campaign_card_title2' => 'Jumlah Donasi',
			'campaign_card_title3' => 'Campaign Active',
			'campaign_card_desc1' => 'Total donasi yang berhasil terkumpul',
			'campaign_card_desc2' => 'Campaign yang sedang active',
			'campaign_card_desc3' => 'Donasi',
			'campaign_card_desc4' => 'Terkumpul',
			'campaign_op1' => 'Total Terkumpul',
			'campaign_op2' => 'Jumlah Donasi',
			'campaign_op3' => 'Progress Donasi',
			'campaign_op4' => 'List Donatur',
			'campaign_op5' => 'Data Donasi',
			'shortcode_1' => 'total_terkumpul',
			'shortcode_2' => 'jumlah_donasi',
			'shortcode_3' => 'progress',
			'shortcode_4' => 'list_donatur',
			'form_type_desc1' => 'Setelah memilih Form Package 2, jangan lupa menambahkan paket anda pada :',
			'form_type_desc2' => 'Setelah memilih Form Qurban, jangan lupa menambahkan qurban anda pada :',
			'form_type_desc3' => 'Selepas memilih Borang Zakat Fitrah, jangan lupa untuk menambahkan pakej zakat fitrah anda pada :',
			'form_type_desc4' => '<li>Persentase zakat default : 2.5 persen.</li><li>Custom Zakat Percent untuk merubah persentase zakat yang anda inginkan.</li><li>Aktifkan option pengeluaran, jika kalkulasi zakat pada lembaga anda mempertimbangkan nominal pengeluaran Muzaki.</li><li>Kosongkan judul jika ingin menggunakan judul field yang default.</li>',
			'campaign_breadcrumb1' => 'Data Campaign',
			'campaign_breadcrumb2' => 'Edit Campaign',
			'campaign_title1' => 'Add New Campaign',
			'campaign_title2' => 'Campaign',
			'campaign_title3' => 'Data Campaign',
			'campaign_title4' => 'Edit Campaign',
			'campaign_title5' => 'Pilihan Nominal Donasi',
			'campaign_title6' => 'Minimum Donasi',
			'campaign_title7' => 'Maximum Donasi',
			'campaign_label1' => 'Target donasi',
			'campaign_label2' => 'Tanggal berakhir donasi',
			'campaign_label3' => 'Wajib diisi',
			'campaign_placeholder1' => 'Contoh: Bandung, Jawa Barat',
			'campaign_placeholder2' => 'Contoh: 200',
			'campaign_desc1' => 'Aktifkan sesuai dengan kebutuhan anda.',
			'campaign_desc2' => 'Gunakan sesuai kebutuhan, pilih <i>None</i> jika tidak ingin ada tambahan kode unik pada total.',
			'campaign_desc3' => 'Jika anda memilih form type Qurban, silahkan tambahkan qurban anda.',
			'campaign_desc4' => 'Jika anda memilih form type Package 2, silahkan tambahkan paket anda.',
			'campaign_desc5' => 'Silahkan tambahkan paket zakat fitrah anda.',
			'campaign_desc6' => 'Nominal Donasi yang diperbolehkan ketika donatur mengetik donasi pada form.',
			'campaign_desc7' => 'Anda bisa menambahkan field input dan textarea pada form donasi.',
			'campaign_desc8' => 'Anda bisa menambahkan field input pada form yang langsung berefek pada jumlah donasi. Misal anda sedang membuat Form Zakat dan menambahkan 1 field input nominal Sedekah pada form campaign ini. Field ini hanya berlaku pada Form type Donation (Card, Typing, dan Packaged) saja.',
			'campaign_desc9' => 'Aktifkan jika ingin memberi komisi pada Fundraiser pada campaign ini.',
			'campaign_desc10' => 'Pilih tipe komisi yang ingin anda berikan pada Fundraiser.',
			'campaign_desc11' => 'Tuliskan 2000 jika anda ingin memberikan setiap komisi 2000.',
			'campaign_table_col1' => 'Campaign',

			// shortcode
			'shortcode_note1' => '<li>Button sifatnya opsional, gunakan sesuai style dan selera masing-masing.</li><li>Always GRID = box campaign akan tetap menjadi GRID (Card) sesuai bentuknya tanpa menjadi list pada saat di buka di mobile.</li>',

			// Fundraising
			'fundraising_section_title1' => 'Total Fundraising',
			'fundraising_section_title2' => 'Komisi Fundraising',
			'fundraising_section_title3' => 'Komisi Dicairkan',
			'fundraising_section_desc1' => 'Donasi terkumpul',
			'fundraising_section_desc2' => 'Komisi yang didapat',
			'fundraising_col1' => 'Campaign',
			'fundraising_col2' => 'Komisi',

			// Shortcode

			// Members - My Profile
			'section_label1' => 'Domisili',
			'section_label2' => 'No Rekening',
			'section_label3' => 'No Rekening atas Nama',
			'section_label4' => 'Akun',

			// My Profile
			'myprofile_title' => 'Verifikasi Data',
			'myprofile_title2' => 'Data Organisasi',
			'myprofile_desc' => 'Masukkan data dengan benar dan valid agar proses verifikasi berjalan lancar.',
			'myprofile_desc2' => 'Foto bagian depan KTP',
			'myprofile_desc3' => 'Foto Diri dengan memegang KTP',
			'myprofile_desc4' => '( Sekolah / Perusahaan / Yayasan / Lembaga )',
			'myprofile_desc5' => 'Legalitas Organisasi ',
			'myprofile_desc6' => '<li>- Gunakan foto asli, bukan fotokopi KTP</li><li>- Foto KTP dalam kondisi terang dan jelas</li><li>- Foto KTP tidak terpotong atau terhalangi objek lain</li>',
			'myprofile_placeholder1' => 'Jabatan di Organisasi',
			'myprofile_placeholder2' => 'Program Unggulan',
			'myprofile_placeholder3' => 'Profile Organisasi',

			// My Donate
			'mydonate_title1' => 'Total Donasi',
			'mydonate_title2' => 'Jumlah Donasi',
			'mydonate_title3' => 'Campaign',
			'mydonate_desc1' => 'Total donasi yang disumbangkan',
			'mydonate_desc2' => 'Donasi berhasil dilakukan dari',
			'mydonate_desc3' => 'Jumlah campaign yang dibantu',
			'mydonate_label_col1' => 'Donatur',
			'mydonate_label_col2' => 'Donasi',
			'mydonate_label_col3' => 'Kuitansi',

			// Print Kuitansi
			'kuitansi_title' => 'Kuitansi',
			'kuitansi_label1' => 'Telah terima dari',
			'kuitansi_label2' => 'Uang sejumlah',
			'kuitansi_label3' => 'LUNAS',

			// Settings > License
			'license_desc' => 'Jelajahi keunggulan fitur-fitur premium kami. Aktifkan lisensi DonasiAja sekarang untuk pengalaman terbaik yang tak terlupakan!',
			'license_desc2' => '<li>Aktivasi DonasiAja dengan memasukkan API Key yang diperoleh dari <a href="https://member.donasiaja.id/login" style="text-decoration: underline;" target="_blank">Member Page</a></li><li>Jika saat aktivasi ada notif: <b>Your Activation is Full</b>, klik Deactivate terlebih dahulu &gt; Lalu klik Activate kembali.</li><li>Jika ingin menghapus license, klik tombol Deactivate.</li>',
			'license_desc3' => 'Aktif sampai dengan',
			'currency_title' => 'Language & Currency',
			'currency_desc' => 'Silahkan pilih negara anda untuk menyesuaikan bahasa dan mata uang.',
			'db_desc' => 'Silahkan klik <b>Update</b> jika anda baru mengupdate DonasiAja ke versi terbaru secara otomatis, jika update Manual silahkan abaikan settingan ini.',

			// Settings > Themes
			'themes_desc1' => 'Silahkan diatur sesuai tema anda.',

			// Settings > Form
			'form_title1' => 'Donatur dapat memilih Tipe Form',
			'form_title2' => 'Minimum Donasi',
			'form_title3' => 'Pilihan Nominal Donasi',
			'form_title4' => 'Maksimal Jumlah Paket',
			'form_title5' => 'Anonim',
			'form_title6' => 'Form Konfirmasi',
			'form_title7' => 'Donatur harus Login',
			'form_title8' => 'Harga emas per gram',
			'form_title9' => 'Harga padi per kilogram',
			'form_title10' => 'Harga gabah per kilogram',
			'form_desc1' => 'Aktifkan jika donatur boleh memilih tipe form pada saat pembuatan campaign (Form Card, Typing dan Package).',
			'form_desc2' => 'Tulis minimum donasi yang diperbolehkan ketika donatur mengetik donasi pada form.',
			'form_desc3' => 'Tulis dari nominal terendah ke tinggi.',
			'form_desc4' => 'Tulis maksimal jumlah paket yang ada pada form paket.',
			'form_desc5' => 'Aktifkan jika ingin tombol donasi menjadi Disabled ketika donasi sudah terpenuhi.',
			'form_desc6' => 'Tidak disarankan diaktifkan agar memudahkan donatur mengisi donasi tanpa harus login. Digunakan untuk beberapa case yang mengharuskan di platform harus login saat mengisi donasi.',
			'form_desc7' => 'Pilih custom untuk mengganti icon sesuai kebutuhan anda.',
			'form_desc8' => 'Harga emas digunakan untuk perhitungan Zakat.',
			'form_desc9' => 'Harga padi digunakan untuk perhitungan Zakat.',
			'form_desc10' => 'Harga gabah digunakan untuk perhitungan Zakat.',

			// Settings > Payment
			'payment_title1' => 'Unique Number / Kode Unik',
			'payment_label1' => 'Instant',
			'payment_label2' => 'Virtual Account',
			'payment_label3' => 'Transfer',
			'payment_placeholder1' => 'Pembayaran Instan (Cepat & Mudah)',
			'payment_placeholder2' => 'Virtual Account (Verifikasi Otomatis)',
			'payment_placeholder3' => 'Transfer Bank (Verifikasi Manual 1x24jam)',
			'payment_opt1' => 'Instant',
			'payment_opt2' => 'VA',
			'payment_opt3' => 'Transfer',
			'payment_desc1' => 'Silahkan diatur sesuai kebutuhan pembayaran anda.',
			'payment_desc2' => 'Gunakan sesuai kebutuhan, pilih &apos;None&apos; jika tidak ingin ada tambahan kode unik pada total.',
			'payment_desc3' => 'Aktifkan sesuai kebutuhan agar tampil pada list metode pembayaran.',

			// Settings > Notification
			'notif_desc1' => 'Silahkan diatur notifikasi sesuai kebutuhan anda.',
			'notif_desc2' => 'Wanotif memudahkan kita dalam mengirimkan pesan whatsapp otomatis ke Donatur. Semakin cepat donatur mendapatkan notifikasi transaksi donasi, semakin cepat donatur akan menyelesaikan proses pembayaran. Lembaga Donasi juga lebih terlihat Profesional.',
			'notif_desc3' => 'Aktifkan agar Wanotif bisa mengirimkan whatsapp ke no donatur.',
			'notif_desc4' => 'Tambahkan Apikey Wanotif pada masing-masing CS agar pengiriman langsung dari device Whatsapp CS anda (CS Rotator). Abaikan jika anda menggunakan 1 device pada pengiriman notifikasi whatsapp, karena otomatis akan menggunakan wanotif apikey default.',
			'notif_desc5' => 'Pesan yang akan dikirimkan pertama kali ke Donatur setelah berhasil submit form donasi.',
			'notif_desc6_section1' => 'Aktifkan jika ingin menggunakan text followup 1 yang ada di',
			'notif_desc6_section2' => 'Keuntungan mengaktfikan ini adalah ketika terjadi followup maka akan ketahuan button followup 1 akan berwarna hijau.',
			'notif_desc7' => 'Pesan yang akan dikirimkan ke Donatur setelah sistem menerima pembayaran. Notifikasi akan di trigger melalui transaksi di Moota, iPaymu, Tripay, Midtrans dan Flip secara otomatis.',
			'notif_desc8' => 'Silahkan tambahkan shortcode berikut untuk memanggil value dari setiap donasi yang masuk.',

			// Settings > Social Proof
			'socialproof_desc1' => 'Silahkan diatur social proof sesuai kebutuhan anda.',
			'socialproof_desc2' => 'Baru saja Donasi di {campaign_title}',

			// Settings > Fundraising
			'fundraising_title1' => 'Commission / Komisi',
			'fundraising_title2' => 'Minimal saldo pencairan',
			'fundraising_desc1' => 'Silahkan diatur fitur Fundraising sesuai kebutuhan anda.',
			'fundraising_desc2' => 'Aktifkan fundraising mode ini agar anda & member (donatur) anda bisa menggunakan/ mengakses fitur Fundraising.',
			'fundraising_desc3' => 'Tuliskan deksripsi singkat untuk keterangan Fundraiser yang akan Join.',
			'fundraising_desc4' => 'Fitur ini harus aktif agar anda bisa menggunakan fitur komisi fundraising. Jika tidak aktif, maka tampilan di menu Fundraising akan menampilkan list fundraising saja tanpa ada menu komisi dan semua komisi akan diberi 0 jika ada fundraising yang masuk dari link Fundraiser.',
			'fundraising_desc5' => 'Pilih tipe komisi yang ingin anda berikan pada Fundraiser.',
			'fundraising_desc6' => 'Aktifkan jika anda ingin memberikan adanya minimal saldo pencairan, jika saldo belum mencukupi maka Fundraiser tidak dapat mencairkan.',
			'fundraising_desc7' => 'Aktifkan jika anda ingin mengirimkan pesan whatsapp kepada Fundraiser pada saat mengupdate Status Pencairan Komisi. Pastikan settingan ',
			'fundraising_desc8' => 'Tuliskan pesan whatsapp yang ingin anda kirimkan. Gunakan shortcode yang anda untuk memudahkan pesan tersampaikan kepada fundraiser.',
			'fundraising_desc9' => 'Aktifkan jika anda ingin mengirimkan pesan email kepada Fundraiser pada saat mengupdate Status Pencairan Komisi. Pastikan settingan',
			'fundraising_desc10' => 'Tuliskan pesan email yang ingin anda kirimkan. Gunakan shortcode yang anda untuk memudahkan pesan tersampaikan kepada fundraiser.',
			'fundraising_desc11' => 'Gunakan shortcode berikut untuk memanggil value dan bisa dipanggil pada wa message dan juga email message.',
			'fundraising_desc12' => 'Jumlah nominal komisi yang dicairkan',

			// Settings > General
			'general_title1' => 'Donatur Create Campaign',
			'general_title2' => 'Pilih tipe menu pada halaman Campaign',
			'general_title3' => 'Batas maximal user bisa melakukan love pada doa atau komentar',
			'general_title4' => 'Delete Donasi & Campaign',
			'general_title5' => 'Data Whatsapp Column',
			'general_title6' => 'Campaign Style',
			'general_desc1' => 'Silahkan diatur sesuai kebutuhan anda.',
			'general_desc2' => 'Gunakan shortcode berikut untuk memanggil data yang sesuai anda butuhkan.',
			'general_desc3' => 'Aktifkan jika ingin menggunakan login bawaan DonasiAja.',
			'general_desc4' => 'Aktifkan jika ingin mengaktifkan menu registrasi user (donatur). Pastikan settingan di Wordpress anda sudah mengaktifkan',
			'general_desc5' => 'Aktifkan jika ingin mengaktifkan checkbox register sebagai tanda user harus mematuhi peraturan yang ada di situs atau website ini.',
			'general_desc6' => 'Aktifkan jika ingin mengaktifkan menu rubah password pada halaman login.',
			'general_desc7' => 'User Donatur diberikan akses membuat campaign.',
			'general_desc8' => 'Customer Service (CS) dapat merubah status payment (success & waiting) pada donasi.',
			'general_desc9' => 'Campaign yang sudah ada donasinya, tetap bisa dihapus.',
			'general_desc10' => 'Campaign yang sudah ada donasinya, tidak bisa dihapus. Kecuali data donasi dihapus terlebih dahulu, baru campaign bisa dihapus.',
			'general_desc11' => 'Kenapa ada ini? untuk menghindari kesalahan delete campaign dan data donasi hilang sia-sia karena kelalaian delete campaign.',
			'general_desc12' => 'Set Not Active jika terjadi double Jquery pada halaman website anda atau Custom lalu sesuaikan dengan Jquery yang anda gunakan pada website anda. Jika tidak, wajib aktifkan.',
			'general_desc13' => 'Aktifkan jika ingin deskripsi campaign menjadi lebih singkat dan ada tambahan button Readmore',
			'general_desc14' => 'Setting untuk menampilkan atau menyembunyikan data whatsapp bagi Donatur (Campaigner) yang bisa membuat campaign.',
			'general_desc15' => 'Aktifkan jika anda mengalami kendala pada upload profile picture untuk menormalisasi gambar yang diupload agar bisa tersimpan. Pastikan gambar yang anda upload berbentuk Kotak atau Square.',
			'general_desc16' => 'Aktifkan fitur ini jika Anda ingin data donasi yang masuk ke akun User Donatur yang telah terdaftar berdasarkan nomor WhatsApp ketika pengguna donatur tidak sedang login.',

			// Campaign
			'f_campaign_title1' => 'Campaign',
			'f_campaign_title2' => 'Penggalang Dana',
			'f_campaign_title3' => 'Kabar Terbaru',
			'f_campaign_label1' => 'Donasi',
			'f_campaign_button1' => 'Baca selengkapnya',
			'f_campaign_button2' => 'Baca dengan ringkas',
			'f_campaign_button3' => 'Terbaru',
			'f_campaign_button4' => 'Terbesar',

			// Form
			'f_select_title1' => 'Paket Donasi',
			'f_select_title2' => 'Pilih jumlah paket',
			'f_select_title3' => 'Paket',

			// Thankyou page
			'f_typ_desc1' => 'Harap transfer sesuai nominal diatas <i>(sampai 3 digit terakhir)</i> agar dapat terkonfirmasi otomatis dan kebaikan ini dapat kami teruskan.',
			'f_typ_desc2' => 'Ingin lihat program lainnya?',
			'f_typ_desc3' => 'Payment Number',
			'f_typ_desc4' => 'Nominal transfer',
			'f_typ_desc5' => 'Instruksi Pembayaran',
			'f_typ_desc6' => 'Pembayaran Berhasil',
			'f_typ_button1' => 'Konfirmasi Pembayaran',
        ],
        'en' => [
	        // Dashboard
			'dash_card_title1' => 'Jumlah Derma',
			'dash_card_title2' => 'Jumlah Penderma',
			'dash_card_title3' => 'Penukaran',
			'dash_card_desc1' => 'Jumlah derma berjaya dikumpulkan',
			'dash_card_desc2' => 'Penderma',
			'dash_card_desc3' => 'Dikumpulkan',
			'dash_card_desc4' => 'Penukaran derma berjaya dikumpulkan',
			'dash_table_title' => 'Data Penderma',
			'dash_table_col1' => 'Penderma',
			'dash_table_col2' => 'Derma',
			'dash_setting_desc1' => 'Aktifkan jika ingin mengikuti dengan menggunakan Wanotif. Pastikan Wanotif anda telah diatur atau dalam keadaan aktif agar pesan dapat dikirim. (<a href="http://localhost:8888/wp/wp-admin/admin.php?page=donasiaja_settings&amp;action=notification" target="_blank">Setting Wanotif</a>)',
			'dash_setting_desc2' => 'Aktifkan jika anda ingin secara automatik mengikuti pesanan melalui WhatsApp apabila menukar status pembayaran kepada Berjaya (pembayaran diterima).',
			'dash_setting_desc3' => 'Sila tambahkan kod berikut untuk mengambil nilai daripada setiap sumbangan yang diterima.',
			'dash_cs_desc1' => 'Derma yang berjaya dilaksanakan dalam program.',
			'dash_cs_desc2' => 'Jumlah Derma Terkumpul',
			'dash_cs_desc3' => 'Jumlah Penderma',
			'dash_cs_desc4' => 'Berhasil Derma',
			'dash_cs_desc5' => 'Penukaran',

			// Campaigns
			'campaign_card_title1' => 'Jumlah Derma',
			'campaign_card_title2' => 'Jumlah Penderma',
			'campaign_card_title3' => 'Kempen Aktif',
			'campaign_card_desc1' => 'Jumlah derma berjaya dikumpulkan',
			'campaign_card_desc2' => 'Kempen yang sedang active',
			'campaign_card_desc3' => 'Penderma',
			'campaign_card_desc4' => 'Dikumpulkan',
			'campaign_op1' => 'Jumlah Derma',
			'campaign_op2' => 'Jumlah Penderma',
			'campaign_op3' => 'Progress Derma',
			'campaign_op4' => 'List Penderma',
			'campaign_op5' => 'Data Penderma',
			'shortcode_1' => 'jumlah_derma',
			'shortcode_2' => 'jumlah_penderma',
			'shortcode_3' => 'progress_derma',
			'shortcode_4' => 'list_penderma',
			'form_type_desc1' => 'Selepas memilih Form Package 2, jangan lupa untuk menambahkan pakej anda pada:',
			'form_type_desc2' => 'Selepas memilih Form Qurban, jangan lupa untuk menambahkan qurban anda pada:',
			'form_type_desc3' => 'Selepas memilih Form Zakat Fitrah, jangan lupa untuk menambahkan pakej zakat fitrah anda pada :',
			'form_type_desc4' => '<li>Persentase zakat lalai: 2.5 peratus.</li><li>Custom Zakat Percent untuk mengubah peratusan zakat mengikut kehendak anda.</li><li>Aktifkan opsyen pengeluaran jika pengiraan zakat dalam pertubuhan anda mempertimbangkan jumlah pengeluaran Muzaki.</li><li>Biarkan tajuk kosong jika anda ingin menggunakan tajuk medan lalai.</li>',
			'campaign_breadcrumb1' => 'Data Kempen',
			'campaign_breadcrumb2' => 'Edit Kempen',
			'campaign_title1' => 'Tambah Kempen Baru',
			'campaign_title2' => 'Kempen',
			'campaign_title3' => 'Data Kempen',
			'campaign_title4' => 'Edit Kempen',
			'campaign_title5' => 'Pilihan Jumlah Sumbangan',
			'campaign_title6' => 'Sumbangan Minimum',
			'campaign_title7' => 'Sumbangan Maximum',
			'campaign_label1' => 'Target derma',
			'campaign_label2' => 'Tarikh tamat derma',
			'campaign_label3' => 'Perlu diisi',
			'campaign_placeholder1' => 'Contoh: Shah Alam, Selangor',
			'campaign_placeholder2' => 'Contoh: 200',
			'campaign_desc1' => 'Aktifkan mengikut keperluan anda.',
			'campaign_desc2' => 'Gunakan mengikut keperluan, pilih <i>None</i> jika tidak ingin ada tambahan kod unik pada jumlah keseluruhan.',
			'campaign_desc3' => 'Jika anda memilih Form type Qurban, sila tambahkan qurban anda.',
			'campaign_desc4' => 'Jika anda memilih Form type Qurban, sila tambahkan pakej anda.',
			'campaign_desc5' => 'Sila tambahkan pakej zakat fitrah anda.',
			'campaign_desc6' => 'Jumlah Sumbangan yang dibenarkan apabila penderma menaip sumbangan pada form.',
			'campaign_desc7' => 'Anda boleh menambahkan field input dan textarea pada form donasi.',
			'campaign_desc8' => 'Anda boleh menambahkan field input pada form yang langsung mempengaruhi jumlah sumbangan. Sebagai contoh, jika anda sedang membuat Form Zakat dan menambahkan 1 field input nominal Sedekah pada form kempen ini. Field ini hanya berlaku pada Form type Donation (Card, Typing, dan Packaged) saja.',
			'campaign_desc9' => 'Aktifkan jika ingin memberikan komisen kepada Fundraiser pada kempen ini.',
			'campaign_desc10' => 'Pilih jenis komisen yang ingin anda berikan kepada Fundraiser.',
			'campaign_desc11' => 'Tuliskan 200 jika anda ingin memberikan setiap komisen sebanyak 200.',
			'campaign_table_col1' => 'Kempen',

			// shortcode
			'shortcode_note1' => '<li>Button adalah pilihan opsional, gunakan menurut style dan selera masing-masing.</li><li>Always GRID = box campaign akan tetap menjadi GRID (Card) seperti asalnya tanpa bertukar kepada list apabila dibuka di mobile.</li>',

			// Fundraising
			'fundraising_section_title1' => 'Jumlah Fundraising',
			'fundraising_section_title2' => 'Komisen Fundraising',
			'fundraising_section_title3' => 'Komisen Dicairkan',
			'fundraising_section_desc1' => 'Derma terkumpul',
			'fundraising_section_desc2' => 'Komisen yang didapat',
			'fundraising_col1' => 'Kempen',
			'fundraising_col2' => 'Komisen',

			// Shortcode

			// Members - My Profile
			'section_label1' => 'Tempat Tinggal',
			'section_label2' => 'No Akaun',
			'section_label3' => 'No Akaun Atas nama',
			'section_label4' => 'Akaun',

			// My Profile
			'myprofile_title' => 'Pengesahan Data',
			'myprofile_title2' => 'Data Pertubuhan',
			'myprofile_desc' => 'Sila masukkan data dengan betul dan sah agar proses pengesahan berjalan dengan lancar.',
			'myprofile_desc2' => 'Gambar bahagian depan MyKad',
			'myprofile_desc3' => 'Gambar sendiri sambil memegang MyKad',
			'myprofile_desc4' => '( Sekolah / Syarikat / Yayasan / Lembaga )',
			'myprofile_desc5' => 'Dokumen Sah Pertubuhan ',
			'myprofile_desc6' => '<li>- Guna gambar asli, bukan fotokopi MyKad.</li><li>- Pastikan gambar MyKad dalam keadaan terang dan jelas.</li><li>- Pastikan gambar MyKad tidak terpotong atau terhalang oleh objek lain.</li>',
			'myprofile_placeholder1' => 'Jawatan di Pertubuhan',
			'myprofile_placeholder2' => 'Program Utama',
			'myprofile_placeholder3' => 'Profile Pertubuhan',

			// My Donate
			'mydonate_title1' => 'Jumlah Derma',
			'mydonate_title2' => 'Banyaknya Derma',
			'mydonate_title3' => 'Campaign',
			'mydonate_desc1' => 'Jumlah derma yang diberikan',
			'mydonate_desc2' => 'Derma berhasil dilakukan dari',
			'mydonate_desc3' => 'Jumlah campaign yang dibantu',
			'mydonate_label_col1' => 'Penderma',
			'mydonate_label_col2' => 'Derma',
			'mydonate_label_col3' => 'Resit',

			// Print Kuitansi
			'kuitansi_title' => 'Resit',
			'kuitansi_label1' => 'Telah diterima dari',
			'kuitansi_label2' => 'Wang sebanyak',
			'kuitansi_label3' => 'BERJAYA',

			// Settings > License
			'license_desc' => 'Terokai keunggulan ciri-ciri premium kami. Aktifkan lesen DonasiAja sekarang untuk pengalaman terbaik yang tidak akan dilupakan!',
			'license_desc2' => '<li>Aktivasi DonasiAja dengan memasukkan API Key yang diperoleh dari <a href="https://member.donasiaja.id/login" style="text-decoration: underline;" target="_blank">Member Page</a></li><li>Jika ketika mengaktifkan muncul notifikasi <b>Your Activation is Full</b>, klik butang "Deactivate" terlebih dahulu.</li><li>Jika ingin memadamkan license, klik butang <b>Deactivate</b>.</li>',
			'license_desc3' => 'Aktif sehingga',
			'currency_title' => 'Bahasa dan Mata Wang',
			'currency_desc' => 'Sila pilih negara anda untuk menyesuaikan bahasa dan mata wang.',
			'db_desc' => 'Sila klik <b>Update</b> jika anda baru sahaja mengemaskini DonasiAja ke versi terbaru secara automatik. Jika kemas kini dilakukan secara manual, sila abaikan tetapan ini.',

			// Settings > Themes
			'themes_desc1' => 'Sila atur mengikut tema anda.',

			// Settings > Form
			'form_title1' => 'Penderma boleh memilih Tipe Form',
			'form_title2' => 'Minimum Derma',
			'form_title3' => 'Pilihan Amount Derma',
			'form_title4' => 'Jumlah maksimum pakej',
			'form_title5' => 'Identiti',
			'form_title6' => 'Form Pengesahan',
			'form_title7' => 'Penderma perlu Login',
			'form_title8' => 'Harga emas segram',
			'form_title9' => 'Harga pagi sekilogram',
			'form_title10' => 'Harga gabah sekilogram',
			'form_desc1' => 'Aktifkan jika penderma boleh memilih type form pada saat pembuatan kempen (Form Card, Typing dan Package).',
			'form_desc2' => 'Tuliskan jumlah derma minimum yang dibenarkan apabila penderma menaip derma dalam form.',
			'form_desc3' => 'Tulis dari Amount terendah ke nilai tertinggi.',
			'form_desc4' => 'Tulis jumlah maksimum pakej yang ada dalam form pakej.',
			'form_desc5' => 'Aktifkan jika ingin button derma menjadi Disabled apabila sumbangan sudah mencapai had maksimum.',
			'form_desc6' => 'Tidak disarankan diaktifkan agar memudahkan penderma mengisi sumbangan tanpa perlu login. Digunakan untuk beberapa kasus di mana di platform tersebut penderma harus login saat mengisi sumbangan.',
			'form_desc7' => 'Pilih custom untuk menukar ikon mengikut keperluan anda.',
			'form_desc8' => 'Harga emas digunakan untuk pengiraan Zakat.',
			'form_desc9' => 'Harga pagi digunakan untuk pengiraan Zakat.',
			'form_desc10' => 'Harga gabah digunakan untuk pengiraan Zakat.',

			// Settings > Payment
			'payment_title1' => 'Unique Number / Kod Unik',
			'payment_label1' => 'Instant (e-Wallet)',
			'payment_label2' => 'Auto Payment Gateway',
			'payment_label3' => 'Transfer Bank In',
			'payment_placeholder1' => 'Instant Transfer - Bank',
			'payment_placeholder2' => 'Payment Gateway (Pengesahan Automatik)',
			'payment_placeholder3' => 'Transfer Bank In (Pengesahan Manual 1x24jam)',
			'payment_opt1' => 'Instant',
			'payment_opt2' => 'Auto',
			'payment_opt3' => 'Transfer',
			'payment_desc1' => 'Sila atur mengikut keperluan pembayaran anda.',
			'payment_desc2' => 'Gunakan mengikut keperluan, pilih &apos;None&apos; jika tidak ingin ada kod unik tambahan pada total.',
			'payment_desc3' => 'Aktifkan mengikut keperluan agar ia muncul dalam senarai cara pembayaran.',

			// Settings > Notification
			'notif_desc1' => 'Sila tetapkan notification mengikut keperluan anda',
			'notif_desc2' => 'Wanotif memudahkan kita untuk menghantar mesej WhatsApp secara automatik kepada Penderma. Semakin cepat Penderma menerima notifikasi transaksi sumbangan, semakin cepat Penderma akan menyelesaikan proses pembayaran. Lembaga Derma juga kelihatan lebih Profesional.',
			'notif_desc3' => 'Aktifkan supaya Wanotif dapat menghantar WhatsApp kepada nombor penderma.',
			'notif_desc4' => 'Tambahkan Apikey Wanotif pada setiap CS supaya penghantaran langsung dari peranti WhatsApp CS anda (CS Rotator). Abaikan jika anda menggunakan 1 peranti pada penghantaran notifikasi WhatsApp, kerana ia secara automatik akan menggunakan wanotif apikey default.',
			'notif_desc5' => 'Pesan yang akan dihantar kepada Penderma pertama kali selepas berjaya membuat derma.',
			'notif_desc6_section1' => 'Aktifkan jika ingin menggunakan text followup 1 yang terdapat dalam',
			'notif_desc6_section2' => 'Kelebihan aktivasi ini adalah apabila terdapat followup, button followup 1 akan bertukar menjadi hijau.',
			'notif_desc7' => 'Mesej yang akan dihantar kepada Penderma selepas sistem menerima pembayaran. Notification ini akan di trigger melalui transaksi di Toyyibpay, Billplz, dan CHIP secara automatik.',
			'notif_desc8' => 'Sila tambah shortcode berikut untuk mendapatkan value setiap derma yang diterima.',


			// Settings > Social Proof
			'socialproof_desc1' => 'Sila atur social proof mengikut keperluan anda.',
			'socialproof_desc2' => 'Baru saja Derma di {campaign_title}',

			// Settings > Fundraising
			'fundraising_title1' => 'Commission / Komisen',
			'fundraising_title2' => 'Minimum baki yang boleh dikeluarkan.',
			'fundraising_desc1' => 'Sila atur ciri Fundraising mengikut keperluan anda.',
			'fundraising_desc2' => 'Aktifkan fundraising mode ini supaya anda dan ahli (penderma) anda dapat menggunakan/akses ciri  Fundraising.',
			'fundraising_desc3' => 'Tulis keterangan ringkas untuk fundraising yang akan Join.',
			'fundraising_desc4' => 'Ciri ini perlu diaktifkan supaya anda boleh menggunakan ciri komisen fundraising. Sekiranya tidak diaktifkan, menu fundraising akan menunjukkan senarai fundraising saja tanpa menu komisen, dan semua komisen akan ditetapkan sebagai 0 jika terdapat fundraising yang datang dari link fundraising.',
			'fundraising_desc5' => 'Pilih jenis komisen yang ingin anda berikan kepada Fundraising.',
			'fundraising_desc6' => 'Aktifkan jika anda ingin menetapkan jumlah baki minima untuk dikeluarkan; jika baki tidak mencukupi, maka Fundraiser tidak dapat membuat pengeluaran.',
			'fundraising_desc7' => 'Aktifkan jika anda ingin menghantar mesej WhatsApp kepada Fundraiser semasa mengemaskini Status Pengeluaran Komisen. Pastikan tetapan ',
			'fundraising_desc8' => 'Tulis mesej WhatsApp yang ingin anda hantar. Gunakan shortcode yang disediakan untuk memudahkan pesanan diterima oleh fundraiser.',
			'fundraising_desc9' => 'Aktifkan jika anda ingin menghantar e-mel kepada Fundraiser semasa mengemaskini Status Pengeluaran Komisen. Pastikan tetapan ',
			'fundraising_desc10' => 'Tulis mesej e-mel yang ingin anda hantar. Gunakan shortcode yang disediakan untuk memudahkan pesan diterima oleh fundraiser.',
			'fundraising_desc11' => 'Gunakan shortcode berikut untuk mendapatkan value yang boleh digunakan dalam mesej WhatsApp dan juga mesej e-mel.',
			'fundraising_desc12' => 'Jumlah Amount komisen yang dikeluarkan',

			// Settings > General
			'general_title1' => 'Penderma Create Kempen',
			'general_title2' => 'Pilih jenis menu pada laman Kempen',
			'general_title3' => 'Had maksimum penggunaan love pada doa atau komen.',
			'general_title4' => 'Delete Derma & Kempen',
			'general_title5' => 'Data Ruangan Whatsapp',
			'general_title6' => 'Campaign Style',
			'general_desc1' => 'Sila atur mengikut keperluan anda.',
			'general_desc2' => 'Gunakan shortcode berikut untuk mendapatkan data yang anda perlukan.',
			'general_desc3' => 'Aktifkan jika ingin menggunakan login DonasiAja yang disediakan.',
			'general_desc4' => 'Aktifkan jika ingin mengaktifkan menu register user (penderma). Pastikan tetapan di Wordpress anda sudah diaktifkan',
			'general_desc5' => 'Aktifkan jika ingin mengaktifkan checkbox register sebagai tanda user perlu mematuhi peraturan yang ada di laman web ini.',
			'general_desc6' => 'Aktifkan jika ingin mengaktifkan menu tukar password di halaman login.',
			'general_desc7' => 'User Penderma diberikan akses untuk membuat campaign.',
			'general_desc8' => 'Customer Service (CS) dapat mengubah status pembayaran (success & waiting) pada sumbangan.',
			'general_desc9' => 'Kempen yang sudah menerima sumbangan masih boleh dihapus.',
			'general_desc10' => 'Kempen yang sudah menerima sumbangan tidak boleh dihapus. Kecuali data derma  dihapus terlebih dahulu, barulah campaign boleh dihapus.',
			'general_desc11' => 'Mengapa ada ini? Untuk mengelakkan kesilapan memadamkan campaign dan data derma yang hilang kerana kesilapan memadamkan campaign .',
			'general_desc12' => 'Tetapkan sebagai Not Active jika terdapat masalah ganda pada Jquery di halaman web anda atau kustomkan dan sesuaikan dengan versi Jquery yang anda gunakan di laman web anda. Jika tidak, wajib diaktifkan.',
			'general_desc13' => 'Aktifkan ia jika anda mahu perihalan kempen menjadi lebih pendek dan mempunyai butang Readmore tambahan',
			'general_desc14' => 'Tetapan untuk menunjukkan atau menyembunyikan data WhatsApp untuk Penderma yang boleh membuat kempen.',
			'general_desc15' => 'Aktifkan ia jika anda mengalami masalah memuat naik gambar profil anda untuk menormalkan imej yang dimuat naik supaya ia boleh disimpan.',
			'general_desc16' => 'Aktifkan fungsi ini jika anda ingin data sumbangan masuk ke akaun Pengguna Donatur yang telah didaftarkan berdasarkan nombor WhatsApp yang dimasukkan ketika pengguna donatur tidak sedang log masuk.',

			// Campaign
			'f_campaign_title1' => 'Kempen',
			'f_campaign_title2' => 'Pengumpul Dana',
			'f_campaign_title3' => 'Berita Terbaru',
			'f_campaign_label1' => 'Penderma',
			'f_campaign_button1' => 'Baca lebih lanjut',
			'f_campaign_button2' => 'Baca secara ringkas',
			'f_campaign_button3' => 'Terbaharu',
			'f_campaign_button4' => 'Paling Besar',

			// Form
			'f_select_title1' => 'Pakej Derma',
			'f_select_title2' => 'Pilih bilangan pakej',
			'f_select_title3' => 'Pakej',

			// Thankyou page
			'f_typ_desc1' => 'Sila transfer sesuai Amount seperti yang dinyatakan di atas <i>(sehingga 3 digit terakhir)</i> supaya pengesahan automatik dapat dilakukan dan kebaikan ini dapat diteruskan.',
			'f_typ_desc2' => 'Mahukah anda melihat program-program lain?',
			'f_typ_desc3' => 'No Akaun',
			'f_typ_desc4' => 'Jumlah pemindahan',
			'f_typ_desc5' => 'Petunjuk Pembayaran',
			'f_typ_desc6' => 'Pembayaran Berhasil',
			'f_typ_button1' => 'Pengesahkan Pembayaran',
        ]
    ];

    public static function get($key, $lang = 'id') {
        return self::$translations[$lang][$key] ?? "Translation not found for key: {$key}";
    }
}


?>
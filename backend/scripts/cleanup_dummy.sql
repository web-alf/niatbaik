-- ============================================================================
-- NiatBaik — hapus semua data dummy/contoh & reset angka ke 0
-- ============================================================================
-- Menghapus SEMUA campaign + data turunannya (invoice, donasi, dll), kategori
-- contoh, metode bayar contoh, dan me-reset seluruh saldo/akumulasi ke 0.
--
-- AMAN untuk user login: tabel users TIDAK disentuh (admin / CS / advertiser tetap).
-- Settings & payment_statuses dipertahankan (esensial), hanya angkanya di-nol-kan.
--
-- CARA PAKAI:
--   Lokal  : docker exec -i niatbaik-postgres-1 psql -U niatbaik -d niatbaik < backend/scripts/cleanup_dummy.sql
--   Produksi (VPS, hati-hati!):
--            docker compose -f docker-compose.prod.yml exec -T postgres \
--              psql -U niatbaik -d niatbaik < backend/scripts/cleanup_dummy.sql
--
-- Dibungkus transaksi: kalau ada error, SEMUA dibatalkan (tidak ada perubahan separuh).
-- ============================================================================

BEGIN;

-- 1) Data transaksional turunan campaign/donasi -----------------------------
--    Urutan: anak dulu, baru induk (hindari pelanggaran FK kalau ada).
DELETE FROM commissions;        -- bonus fundraiser dari donasi
DELETE FROM fundraiser_clicks;  -- klik link referral
DELETE FROM fundraisers;        -- baris fundraiser per campaign
DELETE FROM loves;              -- like/love campaign
DELETE FROM pixel_events;       -- event tracking per donasi/campaign
DELETE FROM withdrawals;        -- permintaan/pencairan dana
DELETE FROM donations;          -- baris donasi
DELETE FROM invoices;           -- invoice donasi
DELETE FROM campaign_updates;   -- update/berita campaign
DELETE FROM campaign_funds;     -- mutasi kas masuk/keluar per campaign
DELETE FROM financial_reports;  -- laporan keuangan global (mutasi)

-- 2) Campaign itu sendiri ----------------------------------------------------
DELETE FROM campaigns;

-- 3) Konten contoh: kategori & metode pembayaran ----------------------------
--    (Admin akan membuat sendiri lewat halaman Settings.)
DELETE FROM categories;
DELETE FROM payment_methods;

-- 4) Reset seluruh angka/saldo ke 0 -----------------------------------------
--    settings hanya ada satu baris; nol-kan saldo global.
UPDATE settings SET total_money = 0;

-- (campaigns sudah kosong, tapi jaga-jaga bila ada sisa: nol-kan akumulasi)
UPDATE campaigns SET total_raised = 0;

-- 5) Bersihkan kolom legacy iPaymu (gateway tidak dipakai; sisakan Flip+Moota)
--    Aman bila kolom sudah tidak ada — DROP ... IF EXISTS.
ALTER TABLE settings DROP COLUMN IF EXISTS ipaymu_va;
ALTER TABLE settings DROP COLUMN IF EXISTS ipaymu_secret;
ALTER TABLE settings DROP COLUMN IF EXISTS ipaymu_url;
ALTER TABLE settings DROP COLUMN IF EXISTS ipaymu_merchant_code;

COMMIT;

-- ============================================================================
-- Verifikasi (jalankan setelah COMMIT bila ingin cek):
--   SELECT count(*) AS campaigns FROM campaigns;        -- harus 0
--   SELECT count(*) AS invoices  FROM invoices;         -- harus 0
--   SELECT count(*) AS categories FROM categories;      -- harus 0
--   SELECT count(*) AS methods FROM payment_methods;    -- harus 0
--   SELECT total_money FROM settings;                   -- harus 0
--   SELECT email, role FROM users ORDER BY role;        -- admin/cs/advertiser tetap ada
-- ============================================================================

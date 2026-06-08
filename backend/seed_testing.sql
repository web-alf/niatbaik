-- ============================================================
--  NIATBAIK.ORG — Testing Seed Data (PostgreSQL)
--  Inject into VPS for testing real data flows.
--
--  Usage (VPS, inside docker):
--    docker compose -f docker-compose.prod.yml exec -T postgres \
--      psql -U niatbaik -d niatbaik < backend/seed_testing.sql
--
--  Idempotent: safe to re-run. Uses slug/email/invoice_number as keys.
--  Remove all seeded rows with the CLEANUP block at the bottom.
-- ============================================================

BEGIN;

-- ---- Resolve the admin user (campaigns/invoices need an owner) ----
-- Falls back to first user if no admin exists.
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1;
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id FROM users ORDER BY created_at LIMIT 1;
  END IF;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No users found — run the app once so the admin is seeded, then re-run this script.';
  END IF;
  -- stash for later statements
  PERFORM set_config('seed.admin_id', admin_id::text, true);
END $$;

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO categories (id, name, slug, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Medis',       'medis',       now(), now()),
  (gen_random_uuid(), 'Pendidikan',  'pendidikan',  now(), now()),
  (gen_random_uuid(), 'Air Bersih',  'air-bersih',  now(), now()),
  (gen_random_uuid(), 'Wakaf',       'wakaf',       now(), now()),
  (gen_random_uuid(), 'Bencana',     'bencana',     now(), now()),
  (gen_random_uuid(), 'Ramadan',     'ramadan',     now(), now())
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- CAMPAIGNS (8) — linked to admin + category by slug
-- ============================================================
INSERT INTO campaigns (id, user_id, category_id, title, slug, short_description, description, target, total_raised, duration_days, status, featured, location_name, form_type, icon, thumb_gradient, form_style, min_donation, created_at, updated_at)
SELECT gen_random_uuid(), current_setting('seed.admin_id')::uuid,
  (SELECT id FROM categories WHERE slug=c.cat),
  c.title, c.slug, c.short_desc, c.descr, c.target, c.raised, c.days, 'Berjalan', c.featured,
  c.loc, 'donasi', c.icon, c.thumb, 'Card', 10000, now(), now()
FROM (VALUES
  ('air-bersih',  'Sumur Bersih untuk Desa Lengkong, NTT', 'sumur-bersih-lengkong-ntt', 'Air bersih untuk 380 keluarga di NTT.', '<h2>Air Bersih untuk Lengkong</h2><p>Anak-anak berjalan 4 km untuk seember air keruh. Bantu kami membangun sumur bor + filtrasi.</p>', 250000000::bigint, 184320000::bigint, 18, true,  'Lengkong, NTT', 'droplet', 'linear-gradient(135deg,#38B6FF,#2E4191)'),
  ('medis',       'Bantuan Operasi Jantung untuk Aira (4 thn)', 'operasi-jantung-aira', 'Aira butuh operasi jantung segera.', '<h2>Selamatkan Aira</h2><p>Aira (4 thn) butuh operasi jantung. Biaya Rp 180 juta.</p>', 180000000::bigint, 162540000::bigint, 6, true, 'Jakarta', 'heart', 'linear-gradient(135deg,#F59E0B,#DC2626)'),
  ('ramadan',     'Buka Puasa untuk 5.000 Yatim Jabodetabek', 'bukber-5000-yatim', 'Sediakan buka puasa untuk 5.000 yatim.', '<h2>Berbagi Buka Puasa</h2><p>5.000 paket buka puasa untuk anak yatim se-Jabodetabek.</p>', 500000000::bigint, 312780500::bigint, 24, false, 'Jabodetabek', 'moon', 'linear-gradient(135deg,#16A34A,#2E4191)'),
  ('pendidikan',  'Renovasi Madrasah Al-Hikmah, Lombok Timur', 'renovasi-madrasah-alhikmah', 'Madrasah rusak butuh renovasi.', '<h2>Renovasi Madrasah</h2><p>Ruang kelas Madrasah Al-Hikmah nyaris roboh.</p>', 320000000::bigint, 87410000::bigint, 41, false, 'Lombok Timur', 'book', 'linear-gradient(135deg,#2E4191,#38B6FF)'),
  ('bencana',     'Bantuan Korban Banjir Demak', 'bantuan-banjir-demak', 'Bantu korban banjir Demak.', '<h2>Solidaritas Banjir Demak</h2><p>Ribuan warga mengungsi akibat banjir.</p>', 150000000::bigint, 96500000::bigint, 12, false, 'Demak', 'cloud', 'linear-gradient(135deg,#64748B,#1E293B)'),
  ('wakaf',       'Wakaf Quran untuk Pesantren Pelosok', 'wakaf-quran-pesantren', 'Wakaf 1.000 mushaf Quran.', '<h2>Wakaf Quran</h2><p>1.000 mushaf untuk pesantren pelosok.</p>', 100000000::bigint, 42400000::bigint, 30, false, 'Sukabumi', 'book', 'linear-gradient(135deg,#38B6FF,#16A34A)'),
  ('medis',       'Modal Usaha untuk Janda Kepala Keluarga', 'modal-usaha-janda', 'Modal usaha mikro untuk ibu tunggal.', '<h2>Modal Usaha</h2><p>Bantu 50 ibu tunggal memulai usaha mikro.</p>', 80000000::bigint, 21500000::bigint, 60, false, 'Bandung', 'briefcase', 'linear-gradient(135deg,#F59E0B,#38B6FF)'),
  ('pendidikan',  'Beasiswa 1000 Anak Dhuafa Lanjut Sekolah', 'beasiswa-1000-dhuafa', 'Beasiswa untuk anak dhuafa.', '<h2>Beasiswa Dhuafa</h2><p>1.000 anak dhuafa terancam putus sekolah.</p>', 1500000000::bigint, 1127450000::bigint, 14, true, 'Nasional', 'graduation-cap', 'linear-gradient(135deg,#2563eb,#22d3ee)')
) AS c(cat, title, slug, short_desc, descr, target, raised, days, featured, loc, icon, thumb)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- CAMPAIGN UPDATES (timeline) — 2 per featured campaign
-- ============================================================
INSERT INTO campaign_updates (id, campaign_id, user_id, title, body, created_at, updated_at)
SELECT gen_random_uuid(), cm.id, current_setting('seed.admin_id')::uuid, u.title, u.body, now() - (u.days_ago || ' days')::interval, now()
FROM campaigns cm
CROSS JOIN (VALUES
  ('Tim sudah tiba di lokasi', 'Survey selesai, pelaksanaan dimulai pekan ini.', 2),
  ('Donasi tembus 50% target', 'Alhamdulillah, separuh target tercapai. Terima kasih!', 7)
) AS u(title, body, days_ago)
WHERE cm.slug IN ('sumur-bersih-lengkong-ntt','operasi-jantung-aira','beasiswa-1000-dhuafa')
  AND NOT EXISTS (SELECT 1 FROM campaign_updates x WHERE x.campaign_id = cm.id AND x.title = u.title);

-- ============================================================
-- PAID INVOICES + DONATIONS (12 donations across campaigns)
-- These drive: dashboard stats, recent transactions, campaign donor lists.
-- ============================================================
INSERT INTO invoices (id, invoice_number, campaign_id, subtotal, unique_amount, total, is_paid, status, is_anonymous, donor_name, donor_phone, donor_email, expired_at, paid_at, type_payment, payment_method_name, utm_source, utm_medium, utm_campaign, created_at, updated_at)
SELECT gen_random_uuid(), d.invno,
  (SELECT id FROM campaigns WHERE slug=d.cslug),
  d.amt, 0, d.amt, true, 'Terbayar', d.anon, d.donor, d.phone, d.email,
  now() + interval '1 day', now() - (d.days_ago || ' days')::interval,
  'Flip', d.method, d.utm_s, d.utm_m, d.utm_c,
  now() - (d.days_ago || ' days')::interval, now()
FROM (VALUES
  ('INV-SEED0001', 'sumur-bersih-lengkong-ntt', 250000::bigint, false, 'Rizky Hidayat',  '081200000001', 'rizky@mail.com',  'QRIS',       'facebook','paid','sumur-ntt', 0),
  ('INV-SEED0002', 'operasi-jantung-aira',      500000::bigint, true,  'Hamba Allah',    '081200000002', '',                'BCA VA',     'google','cpc','aira-jantung', 0),
  ('INV-SEED0003', 'bukber-5000-yatim',         100000::bigint, false, 'Siti Nurhaliza', '081200000003', 'siti@mail.com',   'GoPay',      'tiktok','paid','bukber-yatim', 1),
  ('INV-SEED0004', 'beasiswa-1000-dhuafa',     1000000::bigint, false, 'Andi Pratama',   '081200000004', 'andi@mail.com',   'Mandiri VA', 'instagram','social','beasiswa', 1),
  ('INV-SEED0005', 'operasi-jantung-aira',      250000::bigint, true,  'Hamba Allah',    '081200000005', '',                'QRIS',       '(direct)','(none)','(direct)', 2),
  ('INV-SEED0006', 'sumur-bersih-lengkong-ntt', 150000::bigint, false, 'Budi Santoso',   '081200000006', 'budi@mail.com',   'OVO',        'facebook','paid','sumur-ntt', 2),
  ('INV-SEED0007', 'wakaf-quran-pesantren',      50000::bigint, false, 'Maya Wijaya',    '081200000007', 'maya@mail.com',   'Dana',       'google','cpc','wakaf', 3),
  ('INV-SEED0008', 'bukber-5000-yatim',         200000::bigint, false, 'Fajar Ramadhan', '081200000008', 'fajar@mail.com',  'BNI VA',     'tiktok','paid','bukber-yatim', 3),
  ('INV-SEED0009', 'beasiswa-1000-dhuafa',      750000::bigint, false, 'Nadia Putri',    '081200000009', 'nadia@mail.com',  'QRIS',       'organic','none','organic', 4),
  ('INV-SEED0010', 'renovasi-madrasah-alhikmah',300000::bigint, false, 'Iqbal Ramadan',  '081200000010', 'iqbal@mail.com',  'BCA VA',     'facebook','paid','madrasah', 5),
  ('INV-SEED0011', 'bantuan-banjir-demak',      500000::bigint, true,  'Hamba Allah',    '081200000011', '',                'ShopeePay',  'instagram','social','banjir', 6),
  ('INV-SEED0012', 'modal-usaha-janda',         100000::bigint, false, 'Lestari Kusuma', '081200000012', 'lestari@mail.com','QRIS',       'tiktok','paid','modal-usaha', 7)
) AS d(invno, cslug, amt, anon, donor, phone, email, method, utm_s, utm_m, utm_c, days_ago)
ON CONFLICT (invoice_number) DO NOTHING;

-- Donations linked to the paid invoices above
INSERT INTO donations (id, invoice_id, campaign_id, donor_name, amount, created_at, updated_at)
SELECT gen_random_uuid(), i.id, i.campaign_id, i.donor_name, i.subtotal, i.created_at, now()
FROM invoices i
WHERE i.invoice_number LIKE 'INV-SEED%'
  AND NOT EXISTS (SELECT 1 FROM donations dn WHERE dn.invoice_id = i.id);

-- ============================================================
-- NOTIFICATIONS (broadcast, user_id NULL)
-- ============================================================
INSERT INTO notifications (id, user_id, type, title, subtitle, is_read, created_at, updated_at)
SELECT gen_random_uuid(), NULL, n.type, n.title, n.sub, false, now() - (n.mins || ' minutes')::interval, now()
FROM (VALUES
  ('donation',   'Donasi baru Rp500.000',                  'Hamba Allah · Operasi Jantung Aira', 2),
  ('campaign',   'Campaign "Operasi Aira" capai 90%',       'Sisa 6 hari lagi', 30),
  ('donation',   'Donasi baru Rp1.000.000',                'Andi Pratama · Beasiswa Dhuafa', 90),
  ('fundraiser', 'Fundraiser baru bergabung',               'Komunitas Pejuang Subuh', 300),
  ('system',     'Pembayaran Flip terverifikasi otomatis',  'Gateway aktif', 600)
) AS n(type, title, sub, mins)
WHERE NOT EXISTS (SELECT 1 FROM notifications x WHERE x.title = n.title AND x.user_id IS NULL);

-- ============================================================
-- Recalculate campaign total_raised + global TotalMoney from paid invoices
-- ============================================================
UPDATE campaigns c SET total_raised = COALESCE((
  SELECT SUM(i.subtotal) FROM invoices i WHERE i.campaign_id = c.id AND i.is_paid = true
), 0)
WHERE c.slug IN (
  'sumur-bersih-lengkong-ntt','operasi-jantung-aira','bukber-5000-yatim',
  'renovasi-madrasah-alhikmah','bantuan-banjir-demak','wakaf-quran-pesantren',
  'modal-usaha-janda','beasiswa-1000-dhuafa'
);

UPDATE settings SET total_money = COALESCE((SELECT SUM(subtotal) FROM invoices WHERE is_paid = true), 0);

COMMIT;

-- ============================================================
-- SUMMARY
-- ============================================================
SELECT 'categories' AS tbl, COUNT(*) FROM categories
UNION ALL SELECT 'campaigns', COUNT(*) FROM campaigns
UNION ALL SELECT 'invoices (seed)', COUNT(*) FROM invoices WHERE invoice_number LIKE 'INV-SEED%'
UNION ALL SELECT 'donations (seed)', COUNT(*) FROM donations WHERE invoice_id IN (SELECT id FROM invoices WHERE invoice_number LIKE 'INV-SEED%')
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications;

-- ============================================================
-- CLEANUP (run to remove ALL seeded testing data):
-- ------------------------------------------------------------
-- BEGIN;
-- DELETE FROM donations WHERE invoice_id IN (SELECT id FROM invoices WHERE invoice_number LIKE 'INV-SEED%');
-- DELETE FROM invoices WHERE invoice_number LIKE 'INV-SEED%';
-- DELETE FROM campaign_updates WHERE campaign_id IN (SELECT id FROM campaigns WHERE slug IN ('sumur-bersih-lengkong-ntt','operasi-jantung-aira','bukber-5000-yatim','renovasi-madrasah-alhikmah','bantuan-banjir-demak','wakaf-quran-pesantren','modal-usaha-janda','beasiswa-1000-dhuafa'));
-- DELETE FROM campaigns WHERE slug IN ('sumur-bersih-lengkong-ntt','operasi-jantung-aira','bukber-5000-yatim','renovasi-madrasah-alhikmah','bantuan-banjir-demak','wakaf-quran-pesantren','modal-usaha-janda','beasiswa-1000-dhuafa');
-- DELETE FROM notifications WHERE title IN ('Donasi baru Rp500.000','Campaign "Operasi Aira" capai 90%','Donasi baru Rp1.000.000','Fundraiser baru bergabung','Pembayaran Flip terverifikasi otomatis');
-- UPDATE settings SET total_money = COALESCE((SELECT SUM(subtotal) FROM invoices WHERE is_paid = true), 0);
-- COMMIT;
-- ============================================================

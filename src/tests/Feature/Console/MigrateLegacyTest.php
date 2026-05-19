<?php

namespace Tests\Feature\Console;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MigrateLegacyTest extends TestCase
{
    use RefreshDatabase;

    private function createLegacyCategoryTable(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `category` (
                `id` int NOT NULL AUTO_INCREMENT,
                `image` varchar(200) NOT NULL,
                `name` varchar(200) NOT NULL,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }

    private function createLegacyUserTable(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `user` (
                `id` int NOT NULL AUTO_INCREMENT,
                `user_id` varchar(200) NOT NULL DEFAULT '',
                `name` varchar(200) NOT NULL,
                `password` varchar(200) NOT NULL,
                `email` varchar(200) NOT NULL,
                `phone` varchar(200) NOT NULL DEFAULT '',
                `image` varchar(200) NOT NULL DEFAULT 'user.png',
                `account_type` varchar(20) NOT NULL DEFAULT 'User',
                `fundraising` varchar(20) NOT NULL DEFAULT 'No',
                `date_register` varchar(200) NOT NULL DEFAULT '',
                `alamat` text,
                `org_status` varchar(20) NOT NULL DEFAULT '',
                `org_name` varchar(200) NOT NULL DEFAULT '',
                `org_phone` varchar(200) NOT NULL DEFAULT '',
                `org_address` text NOT NULL,
                `org_image` varchar(200) NOT NULL DEFAULT '',
                `bank_type` varchar(200) NOT NULL DEFAULT '',
                `bank_number` varchar(200) NOT NULL DEFAULT '',
                `bank_name` varchar(200) NOT NULL DEFAULT '',
                `token` varchar(200) NOT NULL DEFAULT '',
                `max_upload` int NOT NULL DEFAULT 0,
                `bonus_saldo` int NOT NULL DEFAULT 0,
                `bonus_cair` int NOT NULL DEFAULT 0,
                `total_click` int NOT NULL DEFAULT 0,
                `fund_name` varchar(200) DEFAULT NULL,
                `fund_email` varchar(200) DEFAULT NULL,
                `fund_whatsapp` varchar(200) DEFAULT NULL,
                `fund_provinsi` varchar(200) DEFAULT NULL,
                `fund_bank_nama` varchar(200) DEFAULT NULL,
                `fund_bank_rekening` varchar(200) DEFAULT NULL,
                `fund_bank_jenis` varchar(200) DEFAULT NULL,
                `fund_org` varchar(200) DEFAULT NULL,
                `id_ref` int NOT NULL DEFAULT -1,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }

    private function createLegacyProvinceTable(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `z_provinsi` (
                `id` char(2) NOT NULL,
                `provinsi` varchar(255) NOT NULL,
                `aktif` varchar(20) NOT NULL DEFAULT 'No',
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }

    private function createLegacyProjectTable(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `project` (
                `id` int NOT NULL AUTO_INCREMENT,
                `id_user` int NOT NULL,
                `title` varchar(200) NOT NULL,
                `short_description` text NOT NULL,
                `description` text NOT NULL,
                `target` bigint NOT NULL DEFAULT 0,
                `limit_date` int DEFAULT 30,
                `unlimited` varchar(20) NOT NULL DEFAULT 'No',
                `total` int NOT NULL DEFAULT 0,
                `image` varchar(200) NOT NULL,
                `last_update_date` date DEFAULT NULL,
                `post_date` date NOT NULL,
                `id_category` int DEFAULT NULL,
                `push` varchar(20) NOT NULL DEFAULT 'No',
                `active` varchar(200) NOT NULL DEFAULT 'Berjalan',
                `last_check` date DEFAULT NULL,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }

    private function createLegacyBankTable(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `bank` (
                `id` int NOT NULL AUTO_INCREMENT,
                `bank_name` varchar(200) NOT NULL,
                `bank_number` varchar(200) NOT NULL,
                `bank_type` varchar(200) NOT NULL,
                `image` varchar(200) NOT NULL,
                `type` varchar(200) NOT NULL,
                `kode` varchar(200) NOT NULL,
                `potongan_admin` varchar(200) NOT NULL DEFAULT '0',
                `category` varchar(200) NOT NULL,
                `active` text NOT NULL,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }

    private function createLegacyPageTable(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `page` (
                `id` int NOT NULL AUTO_INCREMENT,
                `title` varchar(200) NOT NULL,
                `text` text NOT NULL,
                `image` varchar(200) NOT NULL,
                `datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `type` varchar(200) NOT NULL DEFAULT 'blog',
                `header` varchar(50) DEFAULT 'No',
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }

    private function createLegacySlideTable(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `slide` (
                `id` int NOT NULL AUTO_INCREMENT,
                `link` text NOT NULL,
                `image` varchar(200) NOT NULL,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }

    private function createLegacyMoneyManagementTable(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `money_management` (
                `id` int NOT NULL AUTO_INCREMENT,
                `datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `text` text NOT NULL,
                `in` int DEFAULT NULL,
                `out` int DEFAULT NULL,
                `month` int NOT NULL,
                `year` int NOT NULL,
                `balance` int NOT NULL DEFAULT 0,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }

    protected function tearDown(): void
    {
        // Drop legacy tables (different names from Laravel tables) to avoid conflicts
        $legacyTables = [
            'money_management', 'slide', 'page', 'bank', 'project',
            'z_provinsi', 'user', 'category',
        ];
        foreach ($legacyTables as $table) {
            DB::statement("DROP TABLE IF EXISTS `{$table}`");
        }

        parent::tearDown();
    }

    public function test_migrates_categories(): void
    {
        $this->createLegacyCategoryTable();

        DB::table('category')->insert([
            ['id' => 1, 'image' => 'cat1.jpg', 'name' => 'Pendidikan'],
            ['id' => 2, 'image' => 'cat2.jpg', 'name' => 'Kesehatan'],
        ]);

        $this->artisan('migrate:legacy', ['--connection' => config('database.default')])
            ->assertSuccessful();

        $this->assertDatabaseCount('categories', 2);
        $this->assertDatabaseHas('categories', [
            'id' => 1,
            'name' => 'Pendidikan',
            'slug' => 'pendidikan',
            'image' => 'cat1.jpg',
        ]);
        $this->assertDatabaseHas('categories', [
            'id' => 2,
            'name' => 'Kesehatan',
            'slug' => 'kesehatan',
        ]);
    }

    public function test_user_passwords_are_hashed_and_forced_reset(): void
    {
        $this->createLegacyUserTable();

        DB::table('user')->insert([
            'id' => 1,
            'user_id' => 'USR001',
            'name' => 'Test User',
            'password' => 'plaintext123',
            'email' => 'test@example.com',
            'phone' => '08123456789',
            'org_address' => '',
        ]);

        $this->artisan('migrate:legacy', ['--connection' => config('database.default')])
            ->assertSuccessful();

        $user = DB::table('users')->where('id', 1)->first();

        $this->assertNotNull($user);
        $this->assertEquals('Test User', $user->name);
        $this->assertEquals('test@example.com', $user->email);

        // Password must be hashed, not plaintext
        $this->assertNotEquals('plaintext123', $user->password);
        $this->assertTrue(str_starts_with($user->password, '$2y$') || str_starts_with($user->password, '$2b$'));

        // force_password_reset must be true
        $this->assertEquals(1, $user->force_password_reset);
    }

    public function test_migrates_user_roles_correctly(): void
    {
        $this->createLegacyUserTable();

        DB::table('user')->insert([
            [
                'id' => 1, 'user_id' => 'USR001', 'name' => 'Admin',
                'password' => 'pw', 'email' => 'admin@test.com', 'phone' => '081',
                'account_type' => 'Master', 'fundraising' => 'No', 'org_address' => '',
            ],
            [
                'id' => 2, 'user_id' => 'USR002', 'name' => 'Fundraiser',
                'password' => 'pw', 'email' => 'fund@test.com', 'phone' => '082',
                'account_type' => 'User', 'fundraising' => 'Yes', 'org_address' => '',
            ],
            [
                'id' => 3, 'user_id' => 'USR003', 'name' => 'Regular',
                'password' => 'pw', 'email' => 'user@test.com', 'phone' => '083',
                'account_type' => 'User', 'fundraising' => 'No', 'org_address' => '',
            ],
        ]);

        $this->artisan('migrate:legacy', ['--connection' => config('database.default')])
            ->assertSuccessful();

        $this->assertDatabaseHas('users', ['id' => 1, 'role' => 'admin']);
        $this->assertDatabaseHas('users', ['id' => 2, 'role' => 'fundraiser']);
        $this->assertDatabaseHas('users', ['id' => 3, 'role' => 'user']);
    }

    public function test_migrates_provinces(): void
    {
        $this->createLegacyProvinceTable();

        DB::table('z_provinsi')->insert([
            ['id' => '11', 'provinsi' => 'Aceh', 'aktif' => 'Yes'],
            ['id' => '12', 'provinsi' => 'Sumatera Utara', 'aktif' => 'No'],
        ]);

        $this->artisan('migrate:legacy', ['--connection' => config('database.default')])
            ->assertSuccessful();

        $this->assertDatabaseHas('provinces', ['id' => 11, 'name' => 'Aceh', 'active' => true]);
        $this->assertDatabaseHas('provinces', ['id' => 12, 'name' => 'Sumatera Utara', 'active' => false]);
    }

    public function test_migrates_campaigns_with_slug(): void
    {
        $this->createLegacyUserTable();
        $this->createLegacyCategoryTable();
        $this->createLegacyProjectTable();

        DB::table('category')->insert(['id' => 1, 'image' => 'cat.jpg', 'name' => 'Test']);

        DB::table('user')->insert([
            'id' => 1, 'user_id' => 'U1', 'name' => 'Owner',
            'password' => 'pw', 'email' => 'own@test.com', 'phone' => '081',
            'org_address' => '',
        ]);

        DB::table('project')->insert([
            'id' => 5, 'id_user' => 1, 'title' => 'Bantu Anak Yatim',
            'short_description' => 'Short', 'description' => 'Long',
            'target' => 1000000, 'total' => 500000, 'image' => 'proj.jpg',
            'post_date' => '2023-01-01', 'id_category' => 1, 'active' => 'Berjalan',
        ]);

        $this->artisan('migrate:legacy', ['--connection' => config('database.default')])
            ->assertSuccessful();

        $this->assertDatabaseHas('campaigns', [
            'id' => 5,
            'user_id' => 1,
            'slug' => 'bantu-anak-yatim-5',
            'status' => 'Berjalan',
            'total_raised' => 500000,
        ]);
    }

    public function test_migrates_payment_methods(): void
    {
        $this->createLegacyBankTable();

        DB::table('bank')->insert([
            'id' => 1, 'bank_name' => 'BCA', 'bank_number' => '123456',
            'bank_type' => 'Bank', 'image' => 'bca.png', 'type' => 'manual',
            'kode' => 'BCA001', 'potongan_admin' => '5000',
            'category' => 'bank_transfer', 'active' => 'Yes',
        ]);

        $this->artisan('migrate:legacy', ['--connection' => config('database.default')])
            ->assertSuccessful();

        $this->assertDatabaseHas('payment_methods', [
            'id' => 1,
            'code' => 'BCA001',
            'admin_fee' => 5000,
            'active' => true,
        ]);
    }

    public function test_migrates_posts_and_pages_separately(): void
    {
        $this->createLegacyPageTable();

        DB::table('page')->insert([
            [
                'id' => 1, 'title' => 'Blog Post', 'text' => 'Content',
                'image' => 'blog.jpg', 'type' => 'blog', 'header' => 'Yes',
            ],
            [
                'id' => 2, 'title' => 'About Us', 'text' => 'About content',
                'image' => 'about.jpg', 'type' => 'page', 'header' => 'No',
            ],
        ]);

        $this->artisan('migrate:legacy', ['--connection' => config('database.default')])
            ->assertSuccessful();

        $this->assertDatabaseHas('posts', [
            'id' => 1,
            'title' => 'Blog Post',
            'slug' => 'blog-post-1',
            'show_in_header' => true,
        ]);

        $this->assertDatabaseHas('pages', [
            'id' => 2,
            'title' => 'About Us',
            'slug' => 'about-us-2',
            'show_in_header' => false,
        ]);

        // Blog should NOT be in pages, page should NOT be in posts
        $this->assertDatabaseMissing('pages', ['title' => 'Blog Post']);
        $this->assertDatabaseMissing('posts', ['title' => 'About Us']);
    }

    public function test_user_referred_by_null_when_negative(): void
    {
        $this->createLegacyUserTable();

        DB::table('user')->insert([
            'id' => 1, 'user_id' => 'U1', 'name' => 'User One',
            'password' => 'pw', 'email' => 'one@test.com', 'phone' => '081',
            'id_ref' => -1, 'org_address' => '',
        ]);

        $this->artisan('migrate:legacy', ['--connection' => config('database.default')])
            ->assertSuccessful();

        $this->assertDatabaseHas('users', [
            'id' => 1,
            'referred_by' => null,
        ]);
    }
}

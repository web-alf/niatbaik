# DonasiAja Rebuild — Phase 1: Foundation (DB + Campaign Card + Campaign Detail + Homepage)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand database schema for DonasiAja features, rebuild the campaign card component, redesign the campaign detail page with tabs/donors/love/share, and update the homepage to use the new card.

**Architecture:** 6 new migrations add columns to campaigns/invoices/users/settings + create loves and verification_details tables. Campaign detail gets a 2-column tabbed layout with Livewire components. New campaign card component shows donor avatars, verification badge, and countdown. Homepage uses new cards.

**Tech Stack:** Laravel 13, Livewire 4, Alpine.js, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-05-20-donasiaja-rebuild-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `database/migrations/2026_05_20_000001_add_donasiaja_columns_to_campaigns_table.php` | Create | 8 new columns on campaigns |
| `database/migrations/2026_05_20_000002_add_donasiaja_columns_to_invoices_table.php` | Create | 7 new columns on invoices |
| `database/migrations/2026_05_20_000003_create_loves_table.php` | Create | Love/reaction table |
| `database/migrations/2026_05_20_000004_add_profile_columns_to_users_table.php` | Create | 3 new columns on users |
| `database/migrations/2026_05_20_000005_create_verification_details_table.php` | Create | KTP verification table |
| `database/migrations/2026_05_20_000006_add_theme_columns_to_settings_table.php` | Create | 8 new columns on settings |
| `app/Models/Campaign.php` | Modify | Add new fillable fields + loves() relation |
| `app/Models/Invoice.php` | Modify | Add new fillable fields + casts |
| `app/Models/User.php` | Modify | Add new fillable + verificationDetails() relation |
| `app/Models/Setting.php` | Modify | Add hidden fields |
| `app/Models/Love.php` | Create | Love model |
| `app/Models/VerificationDetail.php` | Create | Verification model |
| `resources/views/components/campaign-card.blade.php` | Rewrite | DonasiAja-style card with avatars, badge, countdown |
| `app/Livewire/DonorList.php` | Create | Sortable donor list with load-more |
| `resources/views/livewire/donor-list.blade.php` | Create | Donor list view |
| `app/Livewire/LoveButton.php` | Create | Love toggle component |
| `resources/views/livewire/love-button.blade.php` | Create | Love button view |
| `resources/views/components/share-modal.blade.php` | Create | Share popup (Alpine.js) |
| `resources/views/pages/campaign/show.blade.php` | Rewrite | 2-column tabbed layout |
| `app/Http/Controllers/CampaignController.php` | Modify | Add data for tabs/donors/loves |
| `resources/views/pages/home.blade.php` | Modify | Use new campaign card |

---

### Task 1: Migration — Add columns to campaigns table

**Files:**
- Create: `database/migrations/2026_05_20_000001_add_donasiaja_columns_to_campaigns_table.php`

- [ ] **Step 1: Create migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->string('location_name')->nullable()->after('image');
            $table->string('location_gmaps')->nullable()->after('location_name');
            $table->string('form_type')->default('donasi')->after('location_gmaps');
            $table->string('allocation_title')->nullable()->after('form_type');
            $table->json('opt_nominal')->nullable()->after('allocation_title');
            $table->string('button_color')->nullable()->after('opt_nominal');
            $table->boolean('socialproof')->default(false)->after('button_color');
            $table->boolean('fundraiser_setting')->default(false)->after('socialproof');
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn([
                'location_name', 'location_gmaps', 'form_type',
                'allocation_title', 'opt_nominal', 'button_color',
                'socialproof', 'fundraiser_setting',
            ]);
        });
    }
};
```

- [ ] **Step 2: Update Campaign model fillable**

Add to `$fillable` array in `app/Models/Campaign.php` after `'last_checked_at'`:

```php
'location_name',
'location_gmaps',
'form_type',
'allocation_title',
'opt_nominal',
'button_color',
'socialproof',
'fundraiser_setting',
```

Add to `casts()` return array:

```php
'opt_nominal' => 'array',
'socialproof' => 'boolean',
'fundraiser_setting' => 'boolean',
```

Add `loves()` relationship after `fundraisers()`:

```php
public function loves(): HasMany
{
    return $this->hasMany(Love::class);
}
```

- [ ] **Step 3: Commit**

```bash
git add database/migrations/2026_05_20_000001_add_donasiaja_columns_to_campaigns_table.php app/Models/Campaign.php
git commit -m "feat: add DonasiAja columns to campaigns table"
```

---

### Task 2: Migration — Add columns to invoices table

**Files:**
- Create: `database/migrations/2026_05_20_000002_add_donasiaja_columns_to_invoices_table.php`

- [ ] **Step 1: Create migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('payment_method_name')->nullable()->after('type_payment');
            $table->text('payment_qrcode')->nullable()->after('qr_url');
            $table->text('deeplink_url')->nullable()->after('payment_qrcode');
            $table->json('payment_instructions')->nullable()->after('deeplink_url');
            $table->string('ip')->nullable()->after('referral_processed');
            $table->string('utm_source')->nullable()->after('ip');
            $table->string('utm_medium')->nullable()->after('utm_source');
            $table->string('utm_campaign')->nullable()->after('utm_medium');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'payment_method_name', 'payment_qrcode', 'deeplink_url',
                'payment_instructions', 'ip', 'utm_source', 'utm_medium', 'utm_campaign',
            ]);
        });
    }
};
```

- [ ] **Step 2: Update Invoice model fillable**

Add to `$fillable` array in `app/Models/Invoice.php` after `'referral_processed'`:

```php
'payment_method_name',
'payment_qrcode',
'deeplink_url',
'payment_instructions',
'ip',
'utm_source',
'utm_medium',
'utm_campaign',
```

Add to `casts()`:

```php
'payment_instructions' => 'array',
```

- [ ] **Step 3: Commit**

```bash
git add database/migrations/2026_05_20_000002_add_donasiaja_columns_to_invoices_table.php app/Models/Invoice.php
git commit -m "feat: add DonasiAja columns to invoices table"
```

---

### Task 3: Migration — Create loves table + model

**Files:**
- Create: `database/migrations/2026_05_20_000003_create_loves_table.php`
- Create: `app/Models/Love.php`

- [ ] **Step 1: Create migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['campaign_id', 'ip']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loves');
    }
};
```

- [ ] **Step 2: Create Love model**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Love extends Model
{
    public $timestamps = false;

    protected $fillable = ['campaign_id', 'user_id', 'ip'];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add database/migrations/2026_05_20_000003_create_loves_table.php app/Models/Love.php
git commit -m "feat: create loves table and model"
```

---

### Task 4: Migration — Add profile columns to users + verification_details table

**Files:**
- Create: `database/migrations/2026_05_20_000004_add_profile_columns_to_users_table.php`
- Create: `database/migrations/2026_05_20_000005_create_verification_details_table.php`
- Create: `app/Models/VerificationDetail.php`

- [ ] **Step 1: Create users migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('user_cover_image')->nullable()->after('image');
            $table->string('verification_status')->default('unverified')->after('org_image');
            $table->text('bio')->nullable()->after('verification_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['user_cover_image', 'verification_status', 'bio']);
        });
    }
};
```

- [ ] **Step 2: Create verification_details migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verification_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('ktp_image');
            $table->string('ktp_selfie');
            $table->string('status')->default('pending');
            $table->datetime('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_details');
    }
};
```

- [ ] **Step 3: Create VerificationDetail model**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationDetail extends Model
{
    protected $fillable = ['user_id', 'ktp_image', 'ktp_selfie', 'status', 'reviewed_at'];

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

- [ ] **Step 4: Update User model**

Add to `$fillable` in `app/Models/User.php` after `'referred_by'`:

```php
'user_cover_image',
'verification_status',
'bio',
```

Add relationship after `referrals()`:

```php
public function verificationDetail(): \Illuminate\Database\Eloquent\Relations\HasOne
{
    return $this->hasOne(VerificationDetail::class);
}

public function isVerified(): bool
{
    return $this->verification_status === 'verified';
}
```

- [ ] **Step 5: Commit**

```bash
git add database/migrations/2026_05_20_00000[45]_*.php app/Models/VerificationDetail.php app/Models/User.php
git commit -m "feat: add user profile columns and verification_details table"
```

---

### Task 5: Migration — Add theme columns to settings

**Files:**
- Create: `database/migrations/2026_05_20_000006_add_theme_columns_to_settings_table.php`

- [ ] **Step 1: Create migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->string('theme_color')->nullable()->after('payment_provider');
            $table->string('progressbar_color')->nullable()->after('theme_color');
            $table->string('button_color')->nullable()->after('progressbar_color');
            $table->boolean('powered_by')->default(true)->after('button_color');
            $table->boolean('socialproof_setting')->default(false)->after('powered_by');
            $table->string('whatsapp_admin')->nullable()->after('socialproof_setting');
            $table->string('telegram_bot_token')->nullable()->after('whatsapp_admin');
            $table->string('telegram_chat_id')->nullable()->after('telegram_bot_token');
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'theme_color', 'progressbar_color', 'button_color',
                'powered_by', 'socialproof_setting', 'whatsapp_admin',
                'telegram_bot_token', 'telegram_chat_id',
            ]);
        });
    }
};
```

- [ ] **Step 2: Update Setting model hidden array**

In `app/Models/Setting.php`, add to `$hidden`:

```php
protected $hidden = [
    'ipaymu_secret',
    'smtp_password',
    'whatsapp_token',
    'whatsapp_token_starsender',
    'telegram_bot_token',
];
```

- [ ] **Step 3: Commit**

```bash
git add database/migrations/2026_05_20_000006_add_theme_columns_to_settings_table.php app/Models/Setting.php
git commit -m "feat: add theme and notification columns to settings"
```

---

### Task 6: Run migrations and verify

- [ ] **Step 1: Run migrations locally**

```bash
php artisan migrate
```

Expected: 6 migrations run successfully.

- [ ] **Step 2: Verify schema**

```bash
php artisan tinker --execute="echo Schema::hasColumn('campaigns', 'form_type') ? 'OK' : 'FAIL';"
php artisan tinker --execute="echo Schema::hasColumn('invoices', 'payment_qrcode') ? 'OK' : 'FAIL';"
php artisan tinker --execute="echo Schema::hasTable('loves') ? 'OK' : 'FAIL';"
php artisan tinker --execute="echo Schema::hasColumn('users', 'verification_status') ? 'OK' : 'FAIL';"
php artisan tinker --execute="echo Schema::hasTable('verification_details') ? 'OK' : 'FAIL';"
php artisan tinker --execute="echo Schema::hasColumn('settings', 'theme_color') ? 'OK' : 'FAIL';"
```

Expected: All print `OK`.

- [ ] **Step 3: Commit (no new files, just verify)**

---

### Task 7: Campaign Card Component — Full Redesign

**Files:**
- Rewrite: `resources/views/components/campaign-card.blade.php`

- [ ] **Step 1: Read the existing card**

Read `resources/views/components/campaign-card.blade.php` to understand current props.

- [ ] **Step 2: Rewrite with DonasiAja-style design**

The card receives `$campaign` prop (with eager-loaded `user`, `category`, `invoices`).

```blade
@props(['campaign'])

@php
    $percentage = min($campaign->progress_percentage, 100);
    $setting = \App\Models\Setting::first();
    $progressColor = $setting->progressbar_color ?? '#16a34a';
    $paidInvoices = $campaign->invoices->where('is_paid', true);
    $donorCount = $paidInvoices->count();
    $recentDonors = $paidInvoices->take(3);
    $daysLeft = $campaign->unlimited ? '∞' : max(0, now()->diffInDays($campaign->posted_at->addDays($campaign->duration_days), false));
@endphp

<a href="{{ route('campaign.show', $campaign) }}" class="block bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
    <div class="relative">
        <img src="{{ $campaign->image ? asset('storage/' . $campaign->image) : asset('images/default-campaign.png') }}"
             alt="{{ $campaign->title }}"
             class="w-full h-48 object-cover" loading="lazy">
        @if($campaign->category)
        <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 px-2 py-1 rounded-full">
            {{ $campaign->category->name }}
        </span>
        @endif
    </div>

    <div class="p-4">
        <h3 class="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 mb-2">{{ $campaign->title }}</h3>

        <div class="flex items-center gap-2 mb-3">
            <div class="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                @if($campaign->user->image && $campaign->user->image !== 'user.png')
                    <img src="{{ asset('storage/' . $campaign->user->image) }}" class="w-full h-full object-cover">
                @else
                    <span class="text-[10px] font-bold text-gray-500">{{ strtoupper(substr($campaign->user->name, 0, 1)) }}</span>
                @endif
            </div>
            <span class="text-xs text-gray-500 truncate">{{ $campaign->user->name }}</span>
            @if($campaign->user->isVerified())
                <svg class="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            @endif
        </div>

        <p class="text-sm font-bold mb-1" style="color: {{ $progressColor }}">
            Rp {{ number_format($campaign->total_raised, 0, ',', '.') }}
        </p>

        <div class="w-full bg-gray-200 rounded-full h-1.5 mb-2">
            <div class="h-1.5 rounded-full transition-all" style="width: {{ $percentage }}%; background: {{ $progressColor }}"></div>
        </div>

        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <div class="flex -space-x-2">
                    @foreach($recentDonors as $donor)
                    <div class="w-6 h-6 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center overflow-hidden">
                        <span class="text-[8px] font-bold text-gray-500">{{ strtoupper(substr($donor->donor_name, 0, 1)) }}</span>
                    </div>
                    @endforeach
                </div>
                @if($donorCount > 3)
                <span class="text-[10px] text-gray-400 ml-1">+{{ $donorCount - 3 }}</span>
                @endif
            </div>
            <span class="text-xs text-gray-400">
                @if($campaign->unlimited)
                    ∞
                @elseif($daysLeft > 0)
                    {{ $daysLeft }} hari lagi
                @else
                    Selesai
                @endif
            </span>
        </div>
    </div>
</a>
```

- [ ] **Step 3: Commit**

```bash
git add resources/views/components/campaign-card.blade.php
git commit -m "feat: redesign campaign card with donor avatars, badge, countdown"
```

---

### Task 8: LoveButton Livewire Component

**Files:**
- Create: `app/Livewire/LoveButton.php`
- Create: `resources/views/livewire/love-button.blade.php`

- [ ] **Step 1: Create Livewire component**

```php
<?php

namespace App\Livewire;

use App\Models\Campaign;
use App\Models\Love;
use Livewire\Component;

class LoveButton extends Component
{
    public Campaign $campaign;
    public int $count = 0;
    public bool $loved = false;

    public function mount(Campaign $campaign): void
    {
        $this->campaign = $campaign;
        $this->count = $campaign->loves()->count();
        $this->loved = $campaign->loves()->where('ip', request()->ip())->exists();
    }

    public function toggle(): void
    {
        $ip = request()->ip();

        $existing = $this->campaign->loves()->where('ip', $ip)->first();

        if ($existing) {
            $existing->delete();
            $this->loved = false;
            $this->count--;
        } else {
            $this->campaign->loves()->create([
                'user_id' => auth()->id(),
                'ip' => $ip,
            ]);
            $this->loved = true;
            $this->count++;
        }
    }

    public function render()
    {
        return view('livewire.love-button');
    }
}
```

- [ ] **Step 2: Create view**

```blade
<button wire:click="toggle" class="flex items-center gap-2 px-4 py-2 rounded-full border transition {{ $loved ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:text-red-400' }}">
    <svg class="w-5 h-5 transition {{ $loved ? 'scale-110' : '' }}" fill="{{ $loved ? 'currentColor' : 'none' }}" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
    </svg>
    <span class="text-sm font-medium">{{ $count }}</span>
</button>
```

- [ ] **Step 3: Commit**

```bash
git add app/Livewire/LoveButton.php resources/views/livewire/love-button.blade.php
git commit -m "feat: add LoveButton Livewire component"
```

---

### Task 9: DonorList Livewire Component

**Files:**
- Create: `app/Livewire/DonorList.php`
- Create: `resources/views/livewire/donor-list.blade.php`

- [ ] **Step 1: Create Livewire component**

```php
<?php

namespace App\Livewire;

use App\Models\Campaign;
use App\Models\Invoice;
use Livewire\Component;

class DonorList extends Component
{
    public int $campaignId;
    public string $sort = 'latest';
    public int $perPage = 10;

    public function loadMore(): void
    {
        $this->perPage += 10;
    }

    public function setSort(string $sort): void
    {
        $this->sort = $sort;
        $this->perPage = 10;
    }

    public function render()
    {
        $query = Invoice::where('campaign_id', $this->campaignId)
            ->where('is_paid', true);

        $query = match ($this->sort) {
            'highest' => $query->orderByDesc('total'),
            default => $query->latest('paid_at'),
        };

        $donors = $query->take($this->perPage)->get();
        $total = Invoice::where('campaign_id', $this->campaignId)->where('is_paid', true)->count();

        return view('livewire.donor-list', [
            'donors' => $donors,
            'total' => $total,
            'hasMore' => $total > $this->perPage,
        ]);
    }
}
```

- [ ] **Step 2: Create view**

```blade
<div>
    <div class="flex gap-2 mb-4">
        <button wire:click="setSort('latest')"
            class="px-4 py-1.5 rounded-full text-sm font-medium transition {{ $sort === 'latest' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200' }}">
            Terbaru
        </button>
        <button wire:click="setSort('highest')"
            class="px-4 py-1.5 rounded-full text-sm font-medium transition {{ $sort === 'highest' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200' }}">
            Terbesar
        </button>
    </div>

    <div class="space-y-3">
        @forelse($donors as $donor)
        <div class="flex items-center gap-3 py-2">
            <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span class="text-sm font-bold text-green-600">{{ strtoupper(substr($donor->is_anonymous ? 'O' : $donor->donor_name, 0, 1)) }}</span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">{{ $donor->is_anonymous ? 'Orang Baik' : $donor->donor_name }}</p>
                <p class="text-xs text-gray-400">{{ $donor->paid_at?->diffForHumans() }}</p>
            </div>
            <p class="text-sm font-semibold text-green-600 flex-shrink-0">Rp {{ number_format($donor->total, 0, ',', '.') }}</p>
        </div>
        @empty
        <p class="text-center text-gray-400 py-6 text-sm">Belum ada donatur.</p>
        @endforelse
    </div>

    @if($hasMore)
    <button wire:click="loadMore" class="w-full mt-4 py-2 text-sm text-green-600 font-medium hover:bg-green-50 rounded-lg transition">
        Tampilkan lebih banyak
    </button>
    @endif
</div>
```

- [ ] **Step 3: Commit**

```bash
git add app/Livewire/DonorList.php resources/views/livewire/donor-list.blade.php
git commit -m "feat: add DonorList Livewire component with sort/load-more"
```

---

### Task 10: Share Modal Component

**Files:**
- Create: `resources/views/components/share-modal.blade.php`

- [ ] **Step 1: Create Alpine.js share modal**

```blade
@props(['url', 'title'])

<div x-data="{ open: false }" class="relative">
    <button @click="open = true" class="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700 transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
        <span class="text-sm font-medium">Bagikan</span>
    </button>

    <div x-show="open" x-transition @click.outside="open = false" @keydown.escape.window="open = false"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" style="display: none">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" @click.stop>
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold text-gray-800">Bagikan</h3>
                <button @click="open = false" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>

            <div class="flex items-center gap-2 bg-gray-50 rounded-lg p-3 mb-4">
                <input type="text" value="{{ $url }}" id="share-url" readonly class="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate">
                <button @click="navigator.clipboard.writeText('{{ $url }}'); $el.textContent = 'Disalin!'; setTimeout(() => $el.textContent = 'Salin', 2000)"
                        class="text-sm font-medium text-green-600 hover:text-green-700 flex-shrink-0">Salin</button>
            </div>

            <div class="grid grid-cols-3 gap-3">
                <a href="https://wa.me/?text={{ urlencode($title . ' ' . $url) }}" target="_blank"
                   class="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 transition">
                    <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <span class="text-xs text-gray-500">WhatsApp</span>
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u={{ urlencode($url) }}" target="_blank"
                   class="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 transition">
                    <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </div>
                    <span class="text-xs text-gray-500">Facebook</span>
                </a>
                <a href="https://twitter.com/intent/tweet?text={{ urlencode($title) }}&url={{ urlencode($url) }}" target="_blank"
                   class="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 transition">
                    <div class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </div>
                    <span class="text-xs text-gray-500">Twitter</span>
                </a>
            </div>
        </div>
    </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add resources/views/components/share-modal.blade.php
git commit -m "feat: add share modal component (WhatsApp, Facebook, Twitter)"
```

---

### Task 11: Campaign Detail Page — Full Redesign

**Files:**
- Modify: `app/Http/Controllers/CampaignController.php`
- Rewrite: `resources/views/pages/campaign/show.blade.php`

- [ ] **Step 1: Update CampaignController::show()**

Read `app/Http/Controllers/CampaignController.php` first. Update the `show()` method to eager-load more data:

```php
public function show(Campaign $campaign)
{
    $campaign->load(['user', 'category', 'updates.user']);

    $paidInvoices = $campaign->invoices()->where('is_paid', true);
    $donorCount = $paidInvoices->count();
    $totalRaised = $campaign->total_raised;
    $loveCount = $campaign->loves()->count();
    $updateCount = $campaign->updates()->count();

    return view('pages.campaign.show', compact(
        'campaign', 'donorCount', 'totalRaised', 'loveCount', 'updateCount'
    ));
}
```

- [ ] **Step 2: Rewrite campaign/show.blade.php**

Full 2-column tabbed layout. Read the existing file first, then replace entirely:

```blade
<x-app-layout>
    <x-slot name="title">{{ $campaign->title }}</x-slot>

    {{-- Hero Image --}}
    <div class="relative w-full h-64 sm:h-80 md:h-96 bg-gray-200">
        <img src="{{ asset('storage/' . $campaign->image) }}" alt="{{ $campaign->title }}"
             class="w-full h-full object-cover">
        <a href="{{ url('/') }}" class="absolute top-4 left-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition">
            <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </a>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col lg:flex-row gap-8">
            {{-- Main Content --}}
            <div class="flex-1 lg:flex-[2.2]">
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">{{ $campaign->title }}</h1>

                @if($campaign->location_name)
                <div class="flex items-center gap-1 text-sm text-gray-500 mb-4">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    @if($campaign->location_gmaps)
                        <a href="{{ $campaign->location_gmaps }}" target="_blank" class="hover:text-green-600">{{ $campaign->location_name }}</a>
                    @else
                        <span>{{ $campaign->location_name }}</span>
                    @endif
                </div>
                @endif

                {{-- Creator --}}
                <div class="flex items-center gap-3 mb-6 pb-6 border-b">
                    <div class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        @if($campaign->user->image && $campaign->user->image !== 'user.png')
                            <img src="{{ asset('storage/' . $campaign->user->image) }}" class="w-full h-full object-cover">
                        @else
                            <div class="w-full h-full flex items-center justify-center">
                                <span class="text-sm font-bold text-gray-400">{{ strtoupper(substr($campaign->user->name, 0, 1)) }}</span>
                            </div>
                        @endif
                    </div>
                    <div>
                        <div class="flex items-center gap-1">
                            <a href="{{ route('organization.show', $campaign->user) }}" class="text-sm font-medium text-gray-800 hover:text-green-600">{{ $campaign->user->name }}</a>
                            @if($campaign->user->isVerified())
                                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                            @endif
                        </div>
                        <p class="text-xs text-gray-400">{{ $campaign->user->org_name ?: 'Penggalang Dana' }}</p>
                    </div>
                </div>

                {{-- Tabs --}}
                <div x-data="{ tab: 'description' }">
                    <div class="flex border-b mb-6 overflow-x-auto">
                        <button @click="tab = 'description'" :class="tab === 'description' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                                class="px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition">Keterangan</button>
                        <button @click="tab = 'updates'" :class="tab === 'updates' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                                class="px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition">Kabar Terbaru ({{ $updateCount }})</button>
                        <button @click="tab = 'donors'" :class="tab === 'donors' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                                class="px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition">Donatur ({{ $donorCount }})</button>
                    </div>

                    {{-- Tab: Description --}}
                    <div x-show="tab === 'description'" x-data="{ expanded: false }">
                        <div class="prose max-w-none" :class="!expanded && 'max-h-[300px] overflow-hidden relative'"
                             x-ref="desc">
                            {!! Str::sanitizeHtml($campaign->description) !!}
                            <div x-show="!expanded" class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
                        </div>
                        <button @click="expanded = !expanded" x-show="$refs.desc.scrollHeight > 300"
                                class="mt-3 text-sm font-medium text-green-600 hover:text-green-700"
                                x-text="expanded ? 'Sembunyikan' : 'Baca Selengkapnya'"></button>
                    </div>

                    {{-- Tab: Updates --}}
                    <div x-show="tab === 'updates'" x-cloak>
                        @forelse($campaign->updates as $update)
                        <div class="border-l-2 border-green-200 pl-4 pb-6 relative">
                            <div class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-green-500"></div>
                            <p class="text-xs text-gray-400 mb-1">{{ $update->created_at->translatedFormat('d F Y') }}</p>
                            <h4 class="text-sm font-semibold text-gray-800 mb-1">{{ $update->title }}</h4>
                            @if($update->image)
                            <img src="{{ asset('storage/' . $update->image) }}" alt="{{ $update->title }}" class="w-full h-48 object-cover rounded-lg mb-2">
                            @endif
                            <div class="text-sm text-gray-600">{!! Str::sanitizeHtml($update->body) !!}</div>
                        </div>
                        @empty
                        <p class="text-center text-gray-400 py-8 text-sm">Belum ada kabar terbaru.</p>
                        @endforelse
                    </div>

                    {{-- Tab: Donors --}}
                    <div x-show="tab === 'donors'" x-cloak>
                        @livewire('donor-list', ['campaignId' => $campaign->id])
                    </div>
                </div>
            </div>

            {{-- Sidebar --}}
            <div class="lg:flex-1 lg:max-w-sm">
                <div class="bg-white rounded-xl shadow-sm border p-6 sticky top-4">
                    @php
                        $setting = \App\Models\Setting::first();
                        $progressColor = $setting->progressbar_color ?? '#16a34a';
                        $btnColor = $campaign->button_color ?? $setting->button_color ?? '#16a34a';
                        $percentage = min($campaign->progress_percentage, 100);
                        $daysLeft = $campaign->unlimited ? null : max(0, now()->diffInDays($campaign->posted_at->addDays($campaign->duration_days), false));
                    @endphp

                    <p class="text-2xl font-bold text-gray-800 mb-1">Rp {{ number_format($campaign->total_raised, 0, ',', '.') }}</p>
                    <p class="text-sm text-gray-400 mb-3">terkumpul dari Rp {{ number_format($campaign->target, 0, ',', '.') }}</p>

                    <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div class="h-2 rounded-full transition-all" style="width: {{ $percentage }}%; background: {{ $progressColor }}"></div>
                    </div>

                    <div class="flex justify-between text-sm text-gray-500 mb-6">
                        <span><strong class="text-gray-800">{{ $donorCount }}</strong> Donatur</span>
                        <span>
                            @if($campaign->unlimited) ∞ Hari
                            @elseif($daysLeft > 0) <strong class="text-gray-800">{{ $daysLeft }}</strong> Hari lagi
                            @else Selesai
                            @endif
                        </span>
                    </div>

                    @if($campaign->status === 'Berjalan')
                    <a href="{{ route('donation.form', $campaign) }}"
                       class="block w-full text-center text-white font-semibold py-3 rounded-xl transition hover:opacity-90"
                       style="background: {{ $btnColor }}">
                        Donasi Sekarang
                    </a>
                    @else
                    <button disabled class="block w-full text-center text-white font-semibold py-3 rounded-xl bg-gray-400 cursor-not-allowed">
                        Campaign {{ $campaign->status }}
                    </button>
                    @endif

                    <div class="flex gap-3 mt-4">
                        @livewire('love-button', ['campaign' => $campaign])
                        <x-share-modal :url="route('campaign.show', $campaign)" :title="$campaign->title" />
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- Fixed mobile donate button --}}
    @if($campaign->status === 'Berjalan')
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg lg:hidden z-40">
        <a href="{{ route('donation.form', $campaign) }}"
           class="block w-full text-center text-white font-semibold py-3 rounded-xl transition hover:opacity-90"
           style="background: {{ $btnColor }}">
            Donasi Sekarang
        </a>
    </div>
    @endif
</x-app-layout>
```

- [ ] **Step 3: Commit**

```bash
git add app/Http/Controllers/CampaignController.php resources/views/pages/campaign/show.blade.php
git commit -m "feat: redesign campaign detail page with tabs, donors, love, share"
```

---

### Task 12: Update Homepage to Use New Card

**Files:**
- Modify: `resources/views/pages/home.blade.php`
- Modify: `app/Http/Controllers/HomeController.php`

- [ ] **Step 1: Update HomeController**

Read `app/Http/Controllers/HomeController.php`. Update to eager-load relationships needed by the new card:

```php
public function index()
{
    $slides = Slide::latest()->get();
    $categories = Category::all();
    $featuredCampaigns = Campaign::with(['user', 'category', 'invoices' => fn($q) => $q->where('is_paid', true)])
        ->where('status', 'Berjalan')
        ->where('featured', true)
        ->latest()
        ->take(4)
        ->get();
    $campaigns = Campaign::with(['user', 'category', 'invoices' => fn($q) => $q->where('is_paid', true)])
        ->where('status', 'Berjalan')
        ->latest()
        ->take(8)
        ->get();
    $posts = Post::latest()->take(3)->get();

    return view('pages.home', compact('slides', 'categories', 'featuredCampaigns', 'campaigns', 'posts'));
}
```

- [ ] **Step 2: Update home.blade.php**

Read the existing file. The campaign sections should already use `<x-campaign-card>`. Just make sure the card receives the campaign with eager-loaded relations. If the featured section uses inline HTML, replace with:

```blade
@foreach($featuredCampaigns as $campaign)
    <x-campaign-card :campaign="$campaign" />
@endforeach
```

Same for recent campaigns:

```blade
@foreach($campaigns as $campaign)
    <x-campaign-card :campaign="$campaign" />
@endforeach
```

- [ ] **Step 3: Commit**

```bash
git add app/Http/Controllers/HomeController.php resources/views/pages/home.blade.php
git commit -m "feat: update homepage to use new campaign card with eager-loaded data"
```

---

### Task 13: Update Search to Use New Card

**Files:**
- Modify: `app/Livewire/CampaignSearch.php`

- [ ] **Step 1: Update CampaignSearch Livewire component**

Read `app/Livewire/CampaignSearch.php`. Update query to eager-load relations for the new card:

Change the render method's query to:

```php
$campaigns = Campaign::query()
    ->with(['user', 'category', 'invoices' => fn($q) => $q->where('is_paid', true)])
    ->where('status', 'Berjalan')
    ->when($this->categoryId, fn($q) => $q->where('category_id', $this->categoryId))
    ->when($this->search, fn($q) => $q->where(fn($q2) =>
        $q2->where('title', 'like', "%{$this->search}%")
           ->orWhere('short_description', 'like', "%{$this->search}%")
    ))
    ->latest()
    ->paginate(12);
```

The Livewire view (`campaign-search.blade.php`) already uses `<x-campaign-card>` from previous fix. No view changes needed.

- [ ] **Step 2: Commit**

```bash
git add app/Livewire/CampaignSearch.php
git commit -m "feat: update campaign search to eager-load data for new card"
```

# NiatBaik Full Rebuild — DonasiAja Reference

## Overview

Rebuild NiatBaik crowdfunding platform to match DonasiAja's feature set and UI quality. NiatBaik is a Laravel 13 app; DonasiAja is a WordPress plugin. We're porting DonasiAja's UX into Laravel/Livewire/Tailwind, not copying code.

Domain: https://donasi.niatbaik.org

---

## Phase 1: Database & Model Expansion

### New Migrations

**1. Add columns to `campaigns` table:**
- `location_name` (string, nullable)
- `location_gmaps` (string, nullable) — Google Maps URL
- `form_type` (string, default: 'donasi') — donasi/zakat/qurban/infaq/wakaf
- `allocation_title` (string, nullable) — custom label for donation type
- `opt_nominal` (json, nullable) — predefined amount options [10000, 25000, 50000, 100000]
- `button_color` (string, nullable) — per-campaign button color override
- `socialproof` (boolean, default: false)
- `fundraiser_setting` (boolean, default: false) — enable fundraiser for this campaign

**2. Add columns to `invoices` table:**
- `payment_method_name` (string, nullable) — display name of selected method
- `payment_qrcode` (text, nullable) — QR code URL/data
- `deeplink_url` (text, nullable) — e-wallet deeplink
- `payment_instructions` (json, nullable) — cached payment instructions
- `expired_at` change to datetime (already datetime in current schema)
- `evidence_image` (already exists)
- `evidence_status` (already exists)
- `ip` (string, nullable) — donor IP
- `utm_source` (string, nullable)
- `utm_medium` (string, nullable)
- `utm_campaign` (string, nullable)

**3. Create `loves` table:**
- `id`, `campaign_id` (FK), `user_id` (FK, nullable), `ip` (string), `created_at`
- Unique constraint: [campaign_id, ip]

**4. Add columns to `users` table:**
- `user_cover_image` (string, nullable) — profile cover
- `verification_status` (string, default: 'unverified') — unverified/pending/verified
- `bio` (text, nullable)

**5. Create `verification_details` table:**
- `id`, `user_id` (FK), `ktp_image` (string), `ktp_selfie` (string), `status` (string), `reviewed_at` (datetime, nullable), `created_at`, `updated_at`

**6. Add columns to `settings` table:**
- `theme_color` (string, nullable) — primary theme color
- `progressbar_color` (string, nullable)
- `button_color` (string, nullable) — global default
- `powered_by` (boolean, default: true)
- `socialproof_setting` (boolean, default: false)
- `whatsapp_admin` (string, nullable) — admin WA number
- `telegram_bot_token` (string, nullable)
- `telegram_chat_id` (string, nullable)

---

## Phase 2: Campaign Detail Page Redesign

**Route:** `/campaign/{campaign:slug}` (existing)

### Layout (based on DonasiAja campaign2.php):

**Hero Section:**
- Full-width campaign image (parallax optional, CSS-only)
- Back/home button overlay (top-left)
- Campaign title overlay on scroll (sticky header)

**Main Content (2-column: content 65% + sidebar 35%):**

**Left Column:**
- Campaign title (h1)
- Location badge with maps icon + link
- Creator info (avatar, name, verification badge)
- **Tabbed content:**
  - Tab 1: "Keterangan" — campaign description (with read-more collapse at 300px)
  - Tab 2: "Kabar Terbaru" — campaign updates timeline
  - Tab 3: "Donatur" — donor list with sort toggle (Terbaru/Terbesar), load more

**Right Column (Sidebar):**
- Progress card:
  - Amount raised / target (formatted Rp)
  - Progress bar (color from settings)
  - Percentage text
  - Days remaining (or "∞" if unlimited)
  - Donor count
- **Donate button** (full-width, prominent, colored)
- Love/reaction button with count
- Share button (modal with copy link + social media)
- Fundraiser section (if enabled): top fundraisers list

**Mobile:**
- Sidebar moves below content
- Fixed "Donasi Sekarang" button at bottom of screen
- Tabs become horizontally scrollable

### Livewire Components:
- `CampaignTabs` — handles tab switching, lazy-loads donors
- `DonorList` — sortable (latest/highest), paginated with load-more
- `LoveButton` — toggle love with animation, updates count
- `ShareModal` — copy link, social share buttons

---

## Phase 3: Donation Form Redesign

**Route:** `/campaign/{campaign:slug}/donate` (new)

### Sections:

**1. Campaign Header:**
- Campaign image (small, parallax)
- Campaign title
- Allocation type badge (Donasi/Zakat/Qurban/etc.)

**2. Amount Selection:**
- Predefined nominal buttons (from campaign `opt_nominal` or defaults)
- "Nominal Lainnya" custom input
- Min amount: Rp 10.000
- For Zakat: auto-calculate 2.5% with input fields (penghasilan, emas, hutang)
- For Qurban: package selection cards with quantity counter

**3. Donor Information:**
- Name (text, required)
- WhatsApp (tel, optional)
- Email (email, optional)
- Anonymous toggle
- Message/Doa (textarea, optional)

**4. Payment Method Selection:**
- Grid of payment method cards grouped by category:
  - Transfer Bank (bank logos)
  - E-Wallet (GoPay, OVO, Dana, etc.)
  - QRIS
  - Virtual Account
- Each card: logo + name + description
- Selected state: green border + background highlight
- Shows admin fee per method

**5. Submit Button:**
- "Lanjutkan Pembayaran" (full-width, colored)
- Loading state with spinner

### Livewire Component: `DonationCheckout`
- Multi-step form: Amount → Info → Payment Method → Submit
- Real-time validation
- Creates Invoice on submit → redirects to payment page

---

## Phase 4: Payment/Invoice Page

**Route:** `/donation/payment/{invoice:invoice_number}` (existing, redesign view)

### Pending State:
- App logo (centered)
- Greeting: "Terima kasih [Name]"
- Campaign title

**Payment Details Card:**
- Bank logo + name
- Account number (with copy button)
- Account holder name
- Transfer amount (large, last 3 digits highlighted in color = unique amount)
- Expiration countdown timer (HH:MM:SS)

**Payment Instructions:**
- Accordion per bank/method (ATM, Mobile Banking, Internet Banking)
- Cached instructions from payment_instructions JSON

**Confirmation Section:**
- "Konfirmasi Pembayaran" button
- Upload proof image (drag-drop + click)
- Preview uploaded image
- Submit confirmation → updates evidence_image, evidence_status

**Auto-check:**
- Poll every 5 seconds for payment status (Livewire poll or AJAX)
- On confirmed → redirect to success state

### Success State:
- Success icon/animation
- "Donasi anda telah kami terima"
- Campaign title + amount
- "Kembali ke Campaign" button

### Livewire Component: `PaymentStatus`
- Polls invoice status
- Handles file upload for confirmation
- Countdown timer (JS)
- Copy-to-clipboard (JS)

---

## Phase 5: Homepage Redesign

**Route:** `/` (existing)

### Sections:
1. **Hero Slider** — full-width, auto-play (already exists, keep Splide)
2. **Category Buttons** — horizontal scroll pills (already exists, improve styling)
3. **Featured Campaigns** — 4-column grid, DonasiAja-style cards:
   - Campaign image
   - Title (2-line clamp)
   - Creator name + verification badge
   - Amount raised (colored)
   - Progress bar
   - Donor avatars (first 3 circles + "+N" badge)
   - Days remaining
4. **Recent Campaigns** — same card style + "Lihat Semua" link
5. **Blog Posts** — 3-column grid (keep existing)

### Updated Campaign Card Component:
- Add donor avatar row (query first 3 donors with profile pics)
- Add verification badge on creator name
- Add countdown days
- Improve progress bar styling (custom color)

---

## Phase 6: Search Page Redesign

**Route:** `/search/{category?}` (existing)

### Layout:
- Search input (full-width, prominent, with search icon)
- Category filter pills (horizontal scroll)
- Campaign cards grid (same new card style)
- "Load more" button (replace pagination with load-more)
- Empty state with illustration

### Update Livewire `CampaignSearch`:
- Add load-more instead of pagination
- Use new campaign card component
- Add total count display

---

## Phase 7: User Profile Page Redesign

**Route:** `/organization/{user}` (existing, renamed)

### Layout (match DonasiAja profile.php):
- Cover image (user_cover_image or default)
- Profile picture (circular, 88px)
- Name + verification badge
- Organization info (if org type): address, phone
- Bio section
- Campaign list with new card style
- Load more button

---

## Phase 8: Auth Pages Polish

### Registration:
- Add WhatsApp field
- Password strength indicator (visual bar)
- CAPTCHA slider (simple drag-to-verify)

### Login:
- Support email/phone/username login
- Password show/hide toggle (eye icon)

---

## Phase 9: Admin Panel Enhancements

### New Admin Pages:
- **Categories** (already done)
- **Analytics Dashboard** — charts: donations over time, top campaigns, conversion rate
- **User Verification** — KTP review, approve/reject
- **Notification Settings** — WhatsApp admin number, email templates

### Settings Expansion:
- Theme colors (primary, progressbar, button)
- Social proof toggle
- WhatsApp admin number
- Payment gateway selection per campaign

---

## Phase 10: Notification System

### WhatsApp Notification (via WA API/Gateway):
- New donation → notify admin
- Payment confirmed → notify donor
- Campaign update → notify donors

### Email Notification:
- Use Laravel's built-in Mail (already configured SMTP)
- Create Mailable classes:
  - `DonationReceived`
  - `PaymentConfirmed`
  - `CampaignUpdate`
  - `WithdrawalStatus`

---

## Phase 11: Social Features

### Love/Reaction System:
- Heart button on campaign detail
- Count display
- IP-based (1 love per IP per campaign)
- Animation on click

### Social Proof Popup:
- "X baru saja berdonasi Rp Y untuk [campaign]"
- Shows randomly every 15-30 seconds
- Data from recent donations (last 24h)
- Dismissable, positioned bottom-left

### Share Modal:
- Copy link button
- WhatsApp share
- Facebook share
- Twitter share

---

## Tech Decisions

| Aspect | Choice |
|--------|--------|
| Frontend framework | Tailwind CSS (already using) |
| JS interactivity | Alpine.js (already included via Livewire) |
| Real-time components | Livewire (already using) |
| Parallax | CSS-only (`background-attachment: fixed`) or lightweight JS |
| Toast notifications | Alpine.js component (no external lib needed) |
| QR codes | `simplesoftwareio/simple-qrcode` package |
| File upload preview | Alpine.js + FileReader API |
| Countdown timer | Alpine.js `x-init` with setInterval |
| Copy to clipboard | Navigator.clipboard API |
| Animations | Tailwind `transition` + `animate` classes |

---

## File Structure (New/Modified)

```
src/
├── app/
│   ├── Http/Controllers/
│   │   ├── DonationController.php          — redesign
│   │   ├── CampaignController.php          — add tabs data
│   │   └── Admin/
│   │       └── VerificationController.php  — NEW
│   ├── Livewire/
│   │   ├── DonationCheckout.php            — NEW (replaces DonationForm)
│   │   ├── PaymentStatus.php               — NEW
│   │   ├── CampaignTabs.php                — NEW
│   │   ├── DonorList.php                   — NEW
│   │   ├── LoveButton.php                  — NEW
│   │   ├── SocialProof.php                 — NEW
│   │   └── CampaignSearch.php              — redesign
│   ├── Mail/
│   │   ├── DonationReceived.php            — NEW
│   │   └── PaymentConfirmed.php            — NEW
│   └── Models/
│       └── Love.php                        — NEW
├── database/migrations/
│   ├── 2026_05_20_*_add_donasiaja_columns_to_campaigns.php
│   ├── 2026_05_20_*_add_donasiaja_columns_to_invoices.php
│   ├── 2026_05_20_*_create_loves_table.php
│   ├── 2026_05_20_*_add_profile_columns_to_users.php
│   ├── 2026_05_20_*_create_verification_details_table.php
│   └── 2026_05_20_*_add_theme_columns_to_settings.php
├── resources/views/
│   ├── components/
│   │   ├── campaign-card.blade.php         — redesign (donor avatars, badge, countdown)
│   │   ├── toast.blade.php                 — NEW
│   │   └── share-modal.blade.php           — NEW
│   ├── pages/
│   │   ├── home.blade.php                  — redesign
│   │   ├── search.blade.php                — redesign
│   │   ├── campaign/
│   │   │   └── show.blade.php              — full redesign (tabbed)
│   │   ├── donation/
│   │   │   ├── form.blade.php              — full redesign (multi-step)
│   │   │   └── payment.blade.php           — full redesign (invoice page)
│   │   └── organization.blade.php          — redesign (cover image, bio)
│   ├── livewire/
│   │   ├── donation-checkout.blade.php     — NEW
│   │   ├── payment-status.blade.php        — NEW
│   │   ├── campaign-tabs.blade.php         — NEW
│   │   ├── donor-list.blade.php            — NEW
│   │   ├── love-button.blade.php           — NEW
│   │   ├── social-proof.blade.php          — NEW
│   │   └── campaign-search.blade.php       — redesign
│   ├── admin/
│   │   └── verifications/                  — NEW (index, show)
│   └── emails/
│       ├── donation-received.blade.php     — NEW
│       └── payment-confirmed.blade.php     — NEW
└── routes/
    └── web.php                             — add new routes
```

## Out of Scope (for now)

- Multiple payment gateway integration (Midtrans, Flip, Tripay) — keep manual bank transfer + iPaymu
- Facebook/TikTok pixel tracking
- Telegram bot notifications
- IP/WA blocking system
- Excel import/export
- Receipt printing
- Malaysia region data
- Donor groups / broadcast scheduler
- CAPTCHA slider (use simple honeypot instead)

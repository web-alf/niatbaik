// API response mappers + theme color injector. Ported from data.jsx.
import type { CSSProperties } from 'react';
import { mediaUrl } from '@/lib/api';
import type { Campaign, Invoice, PaymentStatus } from '@/types/api';

export function mapCampaign(c: any): Campaign {
  return {
    id: c.id, slug: c.slug, title: c.title,
    category: (typeof c.category === 'object' ? c.category?.name : c.category) || '',
    target: c.target || 0,
    raised: c.total_raised ?? c.raised ?? 0,
    donors: c.donor_count ?? c.donors ?? 0,
    status: c.status || 'Draft',
    daysLeft: c.days_left ?? c.daysLeft ?? 0,
    days: c.days_left ?? c.daysLeft ?? 0,
    // thumb stays a CSS-valid background (gradient or empty). The real uploaded image
    // lives in `img` and is rendered as an <img>; a raw "/uploads/x" path is not a
    // valid CSS background value, so it must NOT be folded into thumb.
    thumb: c.thumb_gradient || c.thumb || '',
    img: c.image ? (c.image.startsWith('http') || c.image.startsWith('/uploads/') ? c.image : '/uploads/' + c.image) : '',
    icon: c.icon || 'heart',
    updatedAt: c.updated_at || c.updatedAt || '',
    description: c.description || c.short_description || '',
    short_description: c.short_description || '',
    featured: c.featured || false,
    form_style: c.form_style || 'Card',
    form_type: c.form_type || 'donasi',
    opt_nominal: c.opt_nominal || '',
    form_fields_config: c.form_fields_config || '',
    payment_config: c.payment_config || '',
    pixel_config: c.pixel_config || '',
    form_items_config: c.form_items_config || '',
    conversion_config: c.conversion_config || '',
    button_color: c.button_color || '',
    min_donation: c.min_donation || 0,
    max_donation: c.max_donation || 0,
    location_name: c.location_name || '',
    location_gmaps: c.location_gmaps || '',
    // Advanced / Publish-panel fields — round-tripped by the editor (absent from the
    // trimmed public list, present in the admin detail).
    wa_notification: c.wa_notification || false,
    followup_enabled: c.followup_enabled || false,
    popup_info: c.popup_info || false,
    wa_flying_button: c.wa_flying_button || false,
    external_link: c.external_link || '',
    meta_pixel_id: c.meta_pixel_id || '',
    tiktok_pixel_id: c.tiktok_pixel_id || '',
    gtm_id: c.gtm_id || '',
    progress_percentage: c.progress_percentage || (c.target > 0 ? Math.min(100, Math.round((c.total_raised || c.raised || 0) / c.target * 100)) : 0),
  };
}

// campaignBgStyle returns a CSS style object for a campaign thumbnail box: the
// uploaded image as a cover background when present, else the saved gradient, else
// a neutral brand color. Single source of truth across every view.
export function campaignBgStyle(c: any): CSSProperties {
  const img = c && c.img;
  if (img) {
    const url = mediaUrl(img);
    return { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  const t = c && c.thumb;
  if (typeof t === 'string' && t.startsWith('linear')) return { background: t };
  return { background: '#2E4191' };
}

// mapInvoice normalizes a backend invoice into the dashboard shape. It augments the
// status map from the admin-managed payment statuses; the store keeps this ref fresh
// so the mapper stays a leaf module (no store import, no window).
let _paymentStatuses: PaymentStatus[] = [];
export function setPaymentStatusRef(list: PaymentStatus[]) { _paymentStatuses = list || []; }

export function mapInvoice(inv: any): Invoice {
  if (!inv) return inv;
  if (inv.donor !== undefined && inv.utm && typeof inv.utm === 'object') return inv;
  // Normalize backend status (Indonesian) to the English buckets the dashboard filter
  // offers (Paid/Pending/Failed). Static base map, then augment from PAYMENT_STATUSES.
  const STATUS_MAP: Record<string, string> = {
    'terbayar': 'Paid', 'sukses': 'Paid', 'lunas': 'Paid', 'paid': 'Paid',
    'menunggu pembayaran': 'Pending', 'menunggu': 'Pending', 'tertunda': 'Pending', 'pending': 'Pending',
    'gagal': 'Failed', 'kadaluarsa': 'Failed', 'expired': 'Failed', 'dibatalkan': 'Failed', 'failed': 'Failed',
  };
  for (const ps of _paymentStatuses) {
    const code = (ps.code || '').toString().trim().toLowerCase();
    if (!code) continue;
    if (ps.is_paid) STATUS_MAP[code] = 'Paid';
    else if (!(code in STATUS_MAP)) STATUS_MAP[code] = /gagal|fail|expire|kadaluarsa|batal|cancel|tolak/i.test(code) ? 'Failed' : 'Pending';
  }
  const rawStatus = (inv.status || '').toString().trim().toLowerCase();
  const status = STATUS_MAP[rawStatus] || (inv.is_paid ? 'Paid' : 'Pending');
  return {
    id: inv.invoice_number || inv.id || '',
    // Real DB UUID, kept separate from display `id`. Mutating endpoints
    // (addInvoiceNote, updateInvoiceStatus) parse the path param as a UUID, so they
    // MUST use this — sending the invoice_number 400s on uuid.Parse.
    uuid: inv.id || '',
    donor: inv.donor_name || inv.donor || '',
    campaign: inv.campaign_title
      || (typeof inv.campaign === 'string' ? inv.campaign : (inv.campaign && inv.campaign.title) || ''),
    campaignId: inv.campaign_id || inv.campaignId || (inv.campaign && inv.campaign.id) || '',
    amount: inv.amount ?? inv.total ?? 0,
    method: inv.payment_method || inv.method || '',
    status,
    date: inv.paid_at || inv.created_at || inv.date || '',
    utm: {
      source:   inv.utm_source   ?? inv.utm?.source   ?? '',
      medium:   inv.utm_medium   ?? inv.utm?.medium   ?? '',
      content:  inv.utm_content  ?? inv.utm?.content  ?? '',
      campaign: inv.utm_campaign ?? inv.utm?.campaign ?? '',
      term:     inv.utm_term     ?? inv.utm?.term     ?? '',
      id:       inv.utm_id       ?? inv.utm?.id       ?? '',
    },
    whatsapp: inv.donor_phone || inv.whatsapp || '',
    email: inv.donor_email || inv.email || '',
    note: inv.cs_note || inv.note || '',
    clickId: inv.click_id || inv.clickId || '',
    anon: inv.is_anonymous ?? inv.anon ?? false,
    message: inv.message || '',
  };
}

// mapFundraiser normalizes a backend model.Fundraiser (nested user/campaign objects)
// into the flat shape FundraiserPage renders. Fields the backend does not yet track
// (commission, ref_code, per-fundraiser status) are intentionally absent here — the
// page must not invent them. `name`/`campaign` come from the preloaded relations.
export function mapFundraiser(f: any): any {
  if (!f) return f;
  return {
    id: f.id,
    userId: f.user_id,
    campaignId: f.campaign_id,
    name: f.user?.name || f.name || '',
    email: f.user?.email || '',
    campaign: f.campaign?.title || '',
    campaignSlug: f.campaign?.slug || '',
    raised: f.total_raised ?? 0,
    clicks: f.total_clicks ?? 0,
    donors: f.total_donors ?? 0,
    txn: f.invoices_created ?? 0,
    txnPaid: f.invoices_paid ?? 0,
    joined: f.created_at || '',
  };
}

// applyThemeColor injects CSS so the whole site reflects the saved brand color.
export function applyThemeColor(color: string) {
  if (!color) return;
  try {
    let el = document.getElementById('nb-theme-vars');
    if (!el) { el = document.createElement('style'); el.id = 'nb-theme-vars'; document.head.appendChild(el); }
    el.textContent = `.text-brand-600{color:${color} !important}.bg-brand-600{background-color:${color} !important}.border-brand-600{border-color:${color} !important}.ring-brand-600{--tw-ring-color:${color} !important}.hover\\:bg-brand-700:hover{background-color:${color} !important}`;
  } catch { /* ignore */ }
}

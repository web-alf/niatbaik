// API DTOs. Tight on the entities that flow through many components; loose
// (index signature + unknown) where the backend shape is a fuzzy JSON blob.

export type Role = 'Admin' | 'CS' | 'Advertiser' | 'Fundraiser';

// Backend wraps payloads as { data, message, ... }. request<T>() returns null on
// a GET network/parse failure (see lib/api.ts), so callers must null-check.
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
  meta?: unknown;
}

export interface ApiError {
  status: number;
  message: string;
}

export interface Campaign {
  id: string | number;
  slug: string;
  title: string;
  category: string;
  target: number;
  raised: number;
  donors: number;
  status: string;
  daysLeft: number;
  days: number;
  thumb: string;
  img: string;
  icon: string;
  updatedAt: string;
  description: string;
  short_description: string;
  featured: boolean;
  isUrgent: boolean;
  form_style: string;
  form_type: string;
  opt_nominal: string;
  form_fields_config: string;
  payment_config: string;
  pixel_config: string;
  form_items_config: string;
  conversion_config: string;
  button_color: string;
  min_donation: number;
  max_donation: number;
  location_name: string;
  location_gmaps: string;
  progress_percentage: number;
  // Advanced / publish-panel fields the editor round-trips — kept loose.
  [k: string]: unknown;
}

export interface InvoiceUTM {
  source: string;
  medium: string;
  content: string;
  campaign: string;
  term: string;
  id: string;
}

export interface Invoice {
  id: string;
  uuid: string;
  donor: string;
  campaign: string;
  campaignId: string | number;
  amount: number;
  method: string;
  status: 'Paid' | 'Pending' | 'Failed' | string;
  isPaid: boolean;
  leadQuality: 'berkualitas' | 'invalid' | '';
  date: string;
  utm: InvoiceUTM;
  whatsapp: string;
  email: string;
  note: string;
  clickId?: string;
  anon: boolean;
  message: string;
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  role: Role | string;
  access?: string;
  image?: string; // persisted /uploads avatar path from /auth/me (resolve via mediaUrl)
  [k: string]: unknown;
}

export interface PaymentStatus {
  code: string;
  is_paid?: boolean;
  label?: string;
  [k: string]: unknown;
}

export interface Category {
  id: string | number;
  name: string;
  slug?: string;
  [k: string]: unknown;
}

export interface PaymentMethod {
  code?: string;
  name?: string;
  bank_name?: string;
  bank_number?: string;
  type?: string;
  [k: string]: unknown;
}

export interface NotificationItem {
  id: string | number;
  title?: string;
  message?: string;
  read?: boolean;
  created_at?: string;
  [k: string]: unknown;
}

export interface TrashItem {
  id: string | number;
  type: string;
  [k: string]: unknown;
}

// VERY fuzzy — ~40 JSON-blob columns. Keep loose; cast at use sites.
export interface Settings {
  primary_color?: string;
  gtm_id?: string;
  meta_pixel_id?: string;
  ga4_measurement_id?: string;
  google_ads_conversion_id?: string;
  tiktok_pixel_id?: string;
  [k: string]: unknown;
}

export interface EventsResp {
  revision: number;
  changed: boolean;
}

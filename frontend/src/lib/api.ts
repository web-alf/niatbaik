// API client + media URL resolver + rich-text sanitizer.
// Ported from api.jsx. The dev server proxies /api and /uploads to :8080
// (see vite.config.ts), so both dev and prod use relative URLs — no CORS,
// no localhost branch.
import type { ApiError, ApiResponse } from '@/types/api';

const API_BASE = '/api';
const MEDIA_ORIGIN = '';

// mediaUrl resolves any image reference to a loadable URL:
//  - empty / data: / blob: / http(s):// → returned as-is
//  - "/uploads/x.png"  → MEDIA_ORIGIN + path
//  - "uploads/x.png" or bare "x.png" → MEDIA_ORIGIN + "/uploads/" + name
export function mediaUrl(ref: unknown): string {
  if (!ref || typeof ref !== 'string') return (ref as string) || '';
  if (/^(data:|blob:|https?:\/\/)/i.test(ref)) return ref;
  if (ref.startsWith('/uploads/')) return MEDIA_ORIGIN + ref;
  if (ref.startsWith('uploads/')) return MEDIA_ORIGIN + '/' + ref;
  if (ref.startsWith('/')) return MEDIA_ORIGIN + ref;
  return MEDIA_ORIGIN + '/uploads/' + ref;
}

let authToken: string | null = localStorage.getItem('nb_token') || null;

function sanitizeText(s: unknown): unknown {
  if (typeof s !== 'string') return s;
  return s.replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;'));
}

// Hosts allowed as <iframe> sources (the rich editor embeds YouTube videos).
const SANITIZE_ALLOWED_IFRAME_HOSTS = [
  'www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com',
  'player.vimeo.com',
];

// sanitizeHTML strips script-bearing/dangerous markup from rich-text HTML while
// keeping safe formatting + whitelisted video embeds. Used for fields rendered as
// HTML (campaign description/content) so stored content can't carry stored XSS.
// Parsing happens in an inert document (no script execution, no resource loads).
// NOTE: DOM-walk logic kept byte-identical to api.jsx — security-critical.
export function sanitizeHTML(html: unknown): unknown {
  if (typeof html !== 'string' || html === '') return html;
  let doc: Document;
  try {
    doc = document.implementation.createHTMLDocument('');
    doc.body.innerHTML = html;
  } catch {
    // If parsing fails for any reason, fall back to fully-escaped text.
    return sanitizeText(html);
  }

  const FORBIDDEN_TAGS = new Set([
    'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'BASE',
    'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'SVG', 'MATH',
  ]);

  const walk = (node: Element | HTMLElement) => {
    // Snapshot children first; we mutate during iteration.
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType !== 1) continue; // keep text/comment-free nodes as-is
      const el = child as Element;
      const tag = el.tagName;

      // Allow a YouTube/Vimeo iframe, drop every other forbidden element.
      if (tag === 'IFRAME') {
        let host = '';
        try { host = new URL(el.getAttribute('src') || '', window.location.origin).hostname; } catch { host = ''; }
        if (!SANITIZE_ALLOWED_IFRAME_HOSTS.includes(host)) { el.remove(); continue; }
      } else if (FORBIDDEN_TAGS.has(tag)) {
        el.remove();
        continue;
      }

      // Strip event handlers + javascript:/dangerous URLs from every element.
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const val = (attr.value || '').trim();
        if (name.startsWith('on')) { el.removeAttribute(attr.name); continue; }
        if ((name === 'href' || name === 'src' || name === 'xlink:href' || name === 'formaction' || name === 'action')) {
          const v = val.replace(/\s+/g, '').toLowerCase();
          const isDataImg = name === 'src' && v.startsWith('data:image/');
          if ((v.startsWith('javascript:') || v.startsWith('vbscript:') || (v.startsWith('data:') && !isDataImg))) {
            el.removeAttribute(attr.name);
          }
        }
        if (name === 'style' && /expression\(|javascript:|url\(/i.test(val)) {
          el.removeAttribute(attr.name);
        }
      }

      walk(el);
    }
  };

  walk(doc.body);
  return doc.body.innerHTML;
}

// Fields sent EXACTLY as typed (no <>-escaping): secrets (escaping changes the
// hashed string) and JSON config blobs (escaping corrupts JSON.parse). These are
// parsed, never rendered as HTML, so they carry no XSS risk.
const SANITIZE_RAW_KEYS = new Set([
  'password', 'password_confirm', 'current_password', 'new_password', 'token',
  'form_fields_config', 'opt_nominal', 'cs_contacts', 'nominal_presets',
  'social_proof_config', 'notification_config', 'fundraising_config',
  'event_tracking_config', 'pixel_config', 'payment_config',
  'manual_banks', 'payment_method_types', 'flip_code_config', 'looker_reports',
  'payment_channel_gateways', 'form_items_config', 'conversion_config',
]);

function sanitizeBody(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (k === 'description' || k === 'content' || k === 'body') safe[k] = sanitizeHTML(v);
    else if (SANITIZE_RAW_KEYS.has(k)) safe[k] = v;
    else if (typeof v === 'string') safe[k] = sanitizeText(v);
    else safe[k] = v;
  }
  return safe;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export const api = {
  setToken(token: string) { authToken = token; localStorage.setItem('nb_token', token); },
  clearToken() { authToken = null; localStorage.removeItem('nb_token'); },
  getToken() { return authToken; },

  async request<T = unknown>(method: Method, path: string, body: unknown = null): Promise<ApiResponse<T> | null> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = 'Bearer ' + authToken;

    const opts: RequestInit = { method, headers };
    if (body) opts.body = JSON.stringify(sanitizeBody(body));

    const hadToken = !!authToken;
    try {
      const res = await fetch(API_BASE + path, opts);
      // Parse the body defensively: nginx emits NON-JSON bodies for 429 (rate limit) /
      // 413 (too large) / 5xx, so calling res.json() unconditionally would throw a
      // SyntaxError and mask the real status as a generic connection error — and skip
      // the 401 session-expiry recovery below. Drive control flow off res.status, which
      // is always present.
      let data: any = null;
      try { data = await res.json(); } catch { /* non-JSON body (nginx 429/413/HTML) */ }
      if (!res.ok) {
        // A 401 on an authenticated request means the session expired/was revoked.
        // Clear the dead token and signal the app to return to login. (A 401 with no
        // token is a normal auth failure, e.g. wrong login — leave it to the caller.)
        if (res.status === 401 && hadToken) {
          this.clearToken();
          try { window.dispatchEvent(new CustomEvent('nb-session-expired')); } catch { /* ignore */ }
        }
        const msg = res.status === 429
          ? 'Terlalu banyak permintaan. Coba lagi sebentar.'
          : (data?.message || `Error ${res.status}`);
        throw { status: res.status, message: msg } as ApiError;
      }
      return data as ApiResponse<T>;
    } catch (err) {
      if ((err as ApiError)?.status !== undefined) throw err;
      // Network/parse failure. Reads degrade to null (seed/empty); mutations MUST
      // surface the error — a silent null made a failed save look successful.
      if (method !== 'GET') {
        console.error('API request failed:', method, path, err);
        throw { status: 0, message: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.' } as ApiError;
      }
      console.warn('API unavailable, using fallback:', path);
      return null;
    }
  },

  get<T = unknown>(path: string) { return this.request<T>('GET', path); },
  post<T = unknown>(path: string, body?: unknown) { return this.request<T>('POST', path, body); },
  put<T = unknown>(path: string, body?: unknown) { return this.request<T>('PUT', path, body); },
  del<T = unknown>(path: string) { return this.request<T>('DELETE', path); },

  // Auth
  async login(email: string, password: string) {
    const res = await this.post<any>('/auth/login', { email, password });
    if (res?.data?.token?.access_token) this.setToken(res.data.token.access_token);
    return res;
  },
  async logout() {
    try { await this.post('/auth/logout', {}); } catch { /* ignore — still clear locally */ }
    this.clearToken();
    return { success: true };
  },
  me() { return this.get<any>('/auth/me'); },
  forgotPassword(email: string) { return this.post('/auth/forgot-password', { email }); },
  resetPassword(data: unknown) { return this.post('/auth/reset-password', data); },

  // Public
  campaigns(params = '') { return this.get<any[]>('/campaigns' + (params ? '?' + params : '')); },
  campaign(slug: string) { return this.get<any>('/campaigns/' + slug); },
  categories() { return this.get<any[]>('/categories'); },
  createCategory(data: unknown) { return this.post('/admin/categories', data); },
  updateCategory(id: string | number, data: unknown) { return this.put('/admin/categories/' + id, data); },
  deleteCategory(id: string | number) { return this.del('/admin/categories/' + id); },
  paymentStatuses() { return this.get<any[]>('/payment-statuses'); },
  createPaymentStatus(data: unknown) { return this.post('/admin/payment-statuses', data); },
  updatePaymentStatus(id: string | number, data: unknown) { return this.put('/admin/payment-statuses/' + id, data); },
  deletePaymentStatus(id: string | number) { return this.del('/admin/payment-statuses/' + id); },
  publicSettings() { return this.get<any>('/settings/public'); },
  publicPaymentMethods() { return this.get<any[]>('/payment-methods/public'); },
  publicStats() { return this.get<any>('/stats'); },

  // Donations
  createDonation(data: unknown) { return this.post<any>('/donations', data); },
  paymentStatus(invoice: string) { return this.get<any>('/donations/' + invoice); },
  simulatePayment(invoice: string) { return this.post('/donations/' + invoice + '/simulate-payment', {}); },

  // Dashboard
  dashboardStats() { return this.get<any>('/dashboard/stats'); },
  dailyChart(days = 30) { return this.get<any[]>('/dashboard/chart/daily?days=' + days); },
  paymentMethodChart() { return this.get<any>('/dashboard/chart/payment-methods'); },
  trafficSourceChart() { return this.get<any>('/dashboard/chart/traffic-sources'); },
  recentTransactions(limit = 10) { return this.get<any[]>('/dashboard/recent-transactions?limit=' + limit); },
  campaignEarnings(params = '') { return this.get<any[]>('/dashboard/campaign-earnings' + (params ? '?' + params : '')); },

  // Admin campaigns
  adminCampaigns(params = '') { return this.get<any[]>('/admin/campaigns' + (params ? '?' + params : '')); },
  adminCampaign(id: string | number) { return this.get<any>('/admin/campaigns/' + id); },
  createCampaign(data: unknown) { return this.post<any>('/admin/campaigns', data); },
  updateCampaign(id: string | number, data: unknown) { return this.put<any>('/admin/campaigns/' + id, data); },
  deleteCampaign(id: string | number) { return this.del('/admin/campaigns/' + id); },

  // Per-campaign info updates (detail-page timeline)
  campaignUpdates(id: string | number) { return this.get<any[]>('/admin/campaigns/' + id + '/updates'); },
  createCampaignUpdate(id: string | number, data: unknown) { return this.post<any>('/admin/campaigns/' + id + '/updates', data); },
  deleteCampaignUpdate(id: string | number, updateId: string | number) { return this.del('/admin/campaigns/' + id + '/updates/' + updateId); },

  // Users
  users(params = '') { return this.get<any[]>('/users' + (params ? '?' + params : '')); },
  createUser(data: unknown) { return this.post('/users', data); },
  updateUser(id: string | number, data: unknown) { return this.put('/users/' + id, data); },
  deleteUser(id: string | number) { return this.del('/users/' + id); },

  // Invoices (CS)
  invoices(params = '') { return this.get<any[]>('/invoices' + (params ? '?' + params : '')); },
  invoice(id: string | number) { return this.get<any>('/invoices/' + id); },
  updateInvoiceStatus(id: string | number, status: string) { return this.put('/invoices/' + id + '/status', { status }); },
  addInvoiceNote(id: string | number, note: string) { return this.put('/invoices/' + id + '/note', { note }); },
  updateInvoiceQuality(id: string | number, quality: string) { return this.put('/invoices/' + id + '/quality', { quality }); },

  // Analytics
  analyticsOverview() { return this.get<any>('/analytics/overview'); },
  analyticsCampaigns() { return this.get<any>('/analytics/campaigns'); },
  analyticsUTM() { return this.get<any>('/analytics/utm'); },
  analyticsTraffic() { return this.get<any>('/analytics/traffic'); },
  analyticsFunnel() { return this.get<any>('/analytics/funnel'); },
  adCosts(params = '') { return this.get<any>('/analytics/ad-costs' + (params ? '?' + params : '')); },
  createAdCost(data: unknown) { return this.post('/analytics/ad-costs', data); },

  // Settings
  settings() { return this.get<any>('/settings'); },
  updateSettings(data: unknown) { return this.put('/settings', data); },
  testEmail(to: string) { return this.post('/settings/test-email', { to }); },
  mootaBalance() { return this.get<any>('/settings/moota-balance'); },
  mootaAccounts() { return this.get<any>('/settings/moota-accounts'); },

  // Realtime long-poll: resolves when the server data revision advances past `since`
  // (or after the server's ~25s hold). Returns { revision, changed }.
  events(since?: number) { return this.get<any>('/events?since=' + (since || 0)); },

  // Notifications
  notifications() { return this.get<any[]>('/notifications'); },
  markNotificationRead(id: string | number) { return this.put('/notifications/' + id + '/read'); },
  markAllNotificationsRead() { return this.put('/notifications/read'); },

  // Profile
  profile() { return this.get<any>('/profile'); },
  updateProfile(data: unknown) { return this.put('/profile', data); },
  changePassword(data: unknown) { return this.put('/profile/password', data); },

  // Fundraisers
  fundraisers(params = '') { return this.get<any[]>('/fundraisers' + (params ? '?' + params : '')); },
  fundraiser(id: string | number) { return this.get<any>('/fundraisers/' + id); },

  // Withdrawals
  withdrawals() { return this.get<any[]>('/withdrawals'); },
  approveWithdrawal(id: string | number) { return this.post('/withdrawals/' + id + '/approve'); },
  rejectWithdrawal(id: string | number) { return this.post('/withdrawals/' + id + '/reject'); },

  // Cekat Ai (AI CS)
  cekatAiStatus() { return this.get<any>('/cs/cekat-ai/status'); },
  cekatAiTest() { return this.post<any>('/cs/cekat-ai/test'); },
  csChat(message: string, history: any[] = []) { return this.post<any>('/cs/chat', { message, history }); },

  // Trash
  trash() { return this.get<any[]>('/trash'); },
  restoreTrash(type: string, id: string | number) { return this.post('/trash/' + type + '/' + id + '/restore'); },
  permanentDelete(type: string, id: string | number) { return this.del('/trash/' + type + '/' + id); },

  // Data Studio
  dataStudioOverview() { return this.get<any>('/datastudio/overview'); },
  dataStudioMeta() { return this.get<any>('/datastudio/meta'); },
  dataStudioGoogle() { return this.get<any>('/datastudio/google'); },
  dataStudioTiktok() { return this.get<any>('/datastudio/tiktok'); },
  dataStudioFunnel() { return this.get<any>('/datastudio/funnel'); },
  dataStudioGeo() { return this.get<any>('/datastudio/geo'); },

  // Tracking status — per-platform pixel/connection health.
  trackingStatus() { return this.get<any>('/admin/tracking/status'); },

  // Payment methods (admin)
  paymentMethods() { return this.get<any[]>('/admin/payment-methods'); },
  createPaymentMethod(data: unknown) { return this.post('/admin/payment-methods', data); },
  updatePaymentMethod(id: string | number, data: unknown) { return this.put('/admin/payment-methods/' + id, data); },
  deletePaymentMethod(id: string | number) { return this.del('/admin/payment-methods/' + id); },

  // Upload
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const headers: Record<string, string> = {};
    if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
    const res = await fetch(API_BASE + '/uploads/image', { method: 'POST', headers, body: formData });
    return res.json();
  },
};

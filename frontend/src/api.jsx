const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8080/api'
  : '/api';

// Origin that serves uploaded media (/uploads/...). In local dev the frontend runs
// on :3000 but the API (and the /uploads static dir) is on :8080, so a relative
// "/uploads/x.png" would resolve to :3000 and 404. In production both share one
// origin behind nginx, so the prefix is empty (relative URLs work).
const MEDIA_ORIGIN = window.location.hostname === 'localhost'
  ? 'http://localhost:8080'
  : '';

// mediaUrl resolves any image reference to a loadable absolute/relative URL:
//  - empty / data: / blob: / http(s):// → returned as-is
//  - "/uploads/x.png"  → MEDIA_ORIGIN + path
//  - "uploads/x.png" or bare "x.png" → MEDIA_ORIGIN + "/uploads/" + name
function mediaUrl(ref) {
  if (!ref || typeof ref !== 'string') return ref || '';
  if (/^(data:|blob:|https?:\/\/)/i.test(ref)) return ref;
  if (ref.startsWith('/uploads/')) return MEDIA_ORIGIN + ref;
  if (ref.startsWith('uploads/')) return MEDIA_ORIGIN + '/' + ref;
  if (ref.startsWith('/')) return MEDIA_ORIGIN + ref;
  return MEDIA_ORIGIN + '/uploads/' + ref;
}
window.mediaUrl = mediaUrl;

let authToken = localStorage.getItem('nb_token') || null;

function sanitizeText(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/[<>]/g, c => c === '<' ? '&lt;' : '&gt;');
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
function sanitizeHTML(html) {
  if (typeof html !== 'string' || html === '') return html;
  let doc;
  try {
    doc = document.implementation.createHTMLDocument('');
    doc.body.innerHTML = html;
  } catch (e) {
    // If parsing fails for any reason, fall back to fully-escaped text.
    return sanitizeText(html);
  }

  const FORBIDDEN_TAGS = new Set([
    'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'BASE',
    'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'SVG', 'MATH',
  ]);

  const walk = (node) => {
    // Snapshot children first; we mutate during iteration.
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType !== 1) continue; // keep text/comment-free nodes as-is
      const tag = child.tagName;

      // Allow a YouTube/Vimeo iframe, drop every other forbidden element.
      if (tag === 'IFRAME') {
        let host = '';
        try { host = new URL(child.getAttribute('src') || '', window.location.origin).hostname; } catch (e) { host = ''; }
        if (!SANITIZE_ALLOWED_IFRAME_HOSTS.includes(host)) { child.remove(); continue; }
      } else if (FORBIDDEN_TAGS.has(tag)) {
        child.remove();
        continue;
      }

      // Strip event handlers + javascript:/dangerous URLs from every element.
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const val = (attr.value || '').trim();
        if (name.startsWith('on')) { child.removeAttribute(attr.name); continue; }
        if ((name === 'href' || name === 'src' || name === 'xlink:href' || name === 'formaction' || name === 'action')) {
          const v = val.replace(/\s+/g, '').toLowerCase();
          const isDataImg = name === 'src' && v.startsWith('data:image/');
          if ((v.startsWith('javascript:') || v.startsWith('vbscript:') || (v.startsWith('data:') && !isDataImg))) {
            child.removeAttribute(attr.name);
          }
        }
        if (name === 'style' && /expression\(|javascript:|url\(/i.test(val)) {
          child.removeAttribute(attr.name);
        }
      }

      walk(child);
    }
  };

  walk(doc.body);
  return doc.body.innerHTML;
}

// Fields sent EXACTLY as typed (no <>-escaping):
//  - secrets: escaping would make bcrypt hash a different string than typed.
//  - JSON config blobs: escaping < > inside a JSON string corrupts the structure
//    so the consumer's JSON.parse would fail. These are parsed (never rendered as
//    HTML), so they carry no XSS risk and must be preserved byte-for-byte.
const SANITIZE_RAW_KEYS = new Set([
  'password', 'password_confirm', 'current_password', 'new_password', 'token',
  'form_fields_config', 'opt_nominal', 'cs_contacts', 'nominal_presets',
  'social_proof_config', 'notification_config', 'fundraising_config',
  'event_tracking_config', 'pixel_config', 'payment_config',
  // Payment JSON config blobs added in the Settings → Payment churn. They're parsed
  // (never rendered as HTML) so they must be preserved byte-for-byte; <>-escaping them
  // would corrupt the JSON and break the backend's JSON.parse / unmarshal.
  'manual_banks', 'payment_method_types', 'flip_code_config', 'looker_reports',
  'payment_channel_gateways',
]);

function sanitizeBody(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const safe = {};
  for (const [k, v] of Object.entries(obj)) {
    // Rich-text fields keep their HTML but are sanitized (not passed raw) so a
    // stored <script>/onerror can't fire when the content is later rendered.
    if (k === 'description' || k === 'content' || k === 'body') safe[k] = sanitizeHTML(v);
    // Passwords/tokens are never rendered as HTML — sending them raw is required
    // for correct hashing/matching and carries no XSS risk.
    else if (SANITIZE_RAW_KEYS.has(k)) safe[k] = v;
    else if (typeof v === 'string') safe[k] = sanitizeText(v);
    else safe[k] = v;
  }
  return safe;
}

const api = {
  setToken(token) { authToken = token; localStorage.setItem('nb_token', token); },
  clearToken() { authToken = null; localStorage.removeItem('nb_token'); },
  getToken() { return authToken; },

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = 'Bearer ' + authToken;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(sanitizeBody(body));

    const hadToken = !!authToken;
    try {
      const res = await fetch(API_BASE + path, opts);
      const data = await res.json();
      if (!res.ok) {
        // A 401 on a request we authenticated means the session expired or was
        // revoked. Clear the dead token and signal the app to return to login so
        // the user isn't stuck with silently-failing actions. (A 401 with no token
        // is just a normal auth failure, e.g. wrong login — leave it to the caller.)
        if (res.status === 401 && hadToken) {
          this.clearToken();
          try { window.dispatchEvent(new CustomEvent('nb-session-expired')); } catch {}
        }
        throw { status: res.status, message: data.message || 'Error' };
      }
      return data;
    } catch (err) {
      if (err.status) throw err;
      // Network/parse failure. For reads we degrade to seed data (return null), but
      // for mutations we MUST surface the error — silently returning null made a
      // failed save look like a success.
      if (method !== 'GET') {
        console.error('API request failed:', method, path, err);
        throw { status: 0, message: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.' };
      }
      console.warn('API unavailable, using fallback:', path);
      return null;
    }
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body) { return this.request('PUT', path, body); },
  del(path) { return this.request('DELETE', path); },

  // Auth
  async login(email, password) {
    const res = await this.post('/auth/login', { email, password });
    if (res?.data?.token?.access_token) this.setToken(res.data.token.access_token);
    return res;
  },
  async logout() {
    // Best-effort server-side revocation, then clear local token regardless.
    try { await this.post('/auth/logout', {}); } catch (e) { /* ignore — still clear locally */ }
    this.clearToken();
    return { success: true };
  },
  async me() { return this.get('/auth/me'); },
  forgotPassword(email) { return this.post('/auth/forgot-password', { email }); },
  resetPassword(data) { return this.post('/auth/reset-password', data); },

  // Public
  campaigns(params = '') { return this.get('/campaigns' + (params ? '?' + params : '')); },
  campaign(slug) { return this.get('/campaigns/' + slug); },
  categories() { return this.get('/categories'); },
  createCategory(data) { return this.post('/admin/categories', data); },
  updateCategory(id, data) { return this.put('/admin/categories/' + id, data); },
  deleteCategory(id) { return this.del('/admin/categories/' + id); },
  paymentStatuses() { return this.get('/payment-statuses'); },
  createPaymentStatus(data) { return this.post('/admin/payment-statuses', data); },
  updatePaymentStatus(id, data) { return this.put('/admin/payment-statuses/' + id, data); },
  deletePaymentStatus(id) { return this.del('/admin/payment-statuses/' + id); },
  publicSettings() { return this.get('/settings/public'); },
  publicPaymentMethods() { return this.get('/payment-methods/public'); },
  publicStats() { return this.get('/stats'); },

  // Donations
  createDonation(data) { return this.post('/donations', data); },
  paymentStatus(invoice) { return this.get('/donations/' + invoice); },
  // Sandbox-only: ask the backend to settle this invoice without a real transfer. The
  // route only exists in non-production; in prod this 404s (button is hidden anyway).
  simulatePayment(invoice) { return this.post('/donations/' + invoice + '/simulate-payment', {}); },

  // Dashboard
  dashboardStats() { return this.get('/dashboard/stats'); },
  dailyChart(days = 30) { return this.get('/dashboard/chart/daily?days=' + days); },
  paymentMethodChart() { return this.get('/dashboard/chart/payment-methods'); },
  trafficSourceChart() { return this.get('/dashboard/chart/traffic-sources'); },
  recentTransactions(limit = 10) { return this.get('/dashboard/recent-transactions?limit=' + limit); },

  // Admin campaigns
  adminCampaigns(params = '') { return this.get('/admin/campaigns' + (params ? '?' + params : '')); },
  adminCampaign(id) { return this.get('/admin/campaigns/' + id); },
  createCampaign(data) { return this.post('/admin/campaigns', data); },
  updateCampaign(id, data) { return this.put('/admin/campaigns/' + id, data); },
  deleteCampaign(id) { return this.del('/admin/campaigns/' + id); },

  // Users
  users(params = '') { return this.get('/users' + (params ? '?' + params : '')); },
  createUser(data) { return this.post('/users', data); },
  updateUser(id, data) { return this.put('/users/' + id, data); },
  deleteUser(id) { return this.del('/users/' + id); },

  // Invoices (CS)
  invoices(params = '') { return this.get('/invoices' + (params ? '?' + params : '')); },
  invoice(id) { return this.get('/invoices/' + id); },
  updateInvoiceStatus(id, status) { return this.put('/invoices/' + id + '/status', { status }); },
  addInvoiceNote(id, note) { return this.put('/invoices/' + id + '/note', { note }); },

  // Analytics
  analyticsOverview() { return this.get('/analytics/overview'); },
  analyticsCampaigns() { return this.get('/analytics/campaigns'); },
  analyticsUTM() { return this.get('/analytics/utm'); },
  analyticsTraffic() { return this.get('/analytics/traffic'); },
  analyticsFunnel() { return this.get('/analytics/funnel'); },
  adCosts(params = '') { return this.get('/analytics/ad-costs' + (params ? '?' + params : '')); },
  createAdCost(data) { return this.post('/analytics/ad-costs', data); },

  // Settings
  settings() { return this.get('/settings'); },
  updateSettings(data) { return this.put('/settings', data); },
  testEmail(to) { return this.post('/settings/test-email', { to }); },
  mootaBalance() { return this.get('/settings/moota-balance'); },
  mootaAccounts() { return this.get('/settings/moota-accounts'); },

  // Realtime long-poll: resolves when the server data revision advances past `since`
  // (or after the server's ~25s hold). Returns { revision, changed }.
  events(since) { return this.get('/events?since=' + (since || 0)); },

  // Notifications
  notifications() { return this.get('/notifications'); },
  markNotificationRead(id) { return this.put('/notifications/' + id + '/read'); },
  markAllNotificationsRead() { return this.put('/notifications/read'); },

  // Profile
  profile() { return this.get('/profile'); },
  updateProfile(data) { return this.put('/profile', data); },
  changePassword(data) { return this.put('/profile/password', data); },

  // Fundraisers
  fundraisers(params = '') { return this.get('/fundraisers' + (params ? '?' + params : '')); },

  // Withdrawals
  withdrawals() { return this.get('/withdrawals'); },
  approveWithdrawal(id) { return this.post('/withdrawals/' + id + '/approve'); },
  rejectWithdrawal(id) { return this.post('/withdrawals/' + id + '/reject'); },

  // Trash
  trash() { return this.get('/trash'); },
  restoreTrash(type, id) { return this.post('/trash/' + type + '/' + id + '/restore'); },
  permanentDelete(type, id) { return this.del('/trash/' + type + '/' + id); },

  // Data Studio
  dataStudioOverview() { return this.get('/datastudio/overview'); },
  dataStudioMeta()     { return this.get('/datastudio/meta'); },
  dataStudioGoogle()   { return this.get('/datastudio/google'); },
  dataStudioTiktok()   { return this.get('/datastudio/tiktok'); },
  dataStudioFunnel()   { return this.get('/datastudio/funnel'); },
  dataStudioGeo()      { return this.get('/datastudio/geo'); },

  // Tracking status — per-platform pixel/connection health (config + last dispatch).
  trackingStatus()     { return this.get('/admin/tracking/status'); },

  // Payment methods (admin)
  paymentMethods()              { return this.get('/admin/payment-methods'); },
  createPaymentMethod(data)     { return this.post('/admin/payment-methods', data); },
  updatePaymentMethod(id, data) { return this.put('/admin/payment-methods/' + id, data); },
  deletePaymentMethod(id)       { return this.del('/admin/payment-methods/' + id); },

  // Upload
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const headers = {};
    if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
    const res = await fetch(API_BASE + '/uploads/image', { method: 'POST', headers, body: formData });
    return res.json();
  },
};

window.api = api;
// Exposed for views that render stored rich-text HTML (defense-in-depth on display).
window.sanitizeHTML = sanitizeHTML;

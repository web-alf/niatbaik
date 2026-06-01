const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8080/api'
  : '/api';

let authToken = localStorage.getItem('nb_token') || null;

function sanitizeText(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/[<>]/g, c => c === '<' ? '&lt;' : '&gt;');
}

function sanitizeBody(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const safe = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'description' || k === 'content' || k === 'body') safe[k] = v;
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

    try {
      const res = await fetch(API_BASE + path, opts);
      const data = await res.json();
      if (!res.ok) throw { status: res.status, message: data.message || 'Error' };
      return data;
    } catch (err) {
      if (err.status) throw err;
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
  async logout() { this.clearToken(); return { success: true }; },
  async me() { return this.get('/auth/me'); },

  // Public
  campaigns(params = '') { return this.get('/campaigns' + (params ? '?' + params : '')); },
  campaign(slug) { return this.get('/campaigns/' + slug); },
  categories() { return this.get('/categories'); },
  publicSettings() { return this.get('/settings/public'); },
  publicStats() { return this.get('/stats'); },

  // Donations
  createDonation(data) { return this.post('/donations', data); },
  paymentStatus(invoice) { return this.get('/donations/' + invoice); },

  // Dashboard
  dashboardStats() { return this.get('/dashboard/stats'); },
  dailyChart(days = 30) { return this.get('/dashboard/chart/daily?days=' + days); },
  paymentMethodChart() { return this.get('/dashboard/chart/payment-methods'); },
  trafficSourceChart() { return this.get('/dashboard/chart/traffic-sources'); },
  recentTransactions(limit = 10) { return this.get('/dashboard/recent-transactions?limit=' + limit); },

  // Admin campaigns
  adminCampaigns(params = '') { return this.get('/admin/campaigns' + (params ? '?' + params : '')); },
  createCampaign(data) { return this.post('/admin/campaigns', data); },
  updateCampaign(id, data) { return this.put('/admin/campaigns/' + id, data); },
  deleteCampaign(id) { return this.del('/admin/campaigns/' + id); },

  // Users
  users(params = '') { return this.get('/users' + (params ? '?' + params : '')); },
  createUser(data) { return this.post('/users', data); },
  updateUser(id, data) { return this.put('/users/' + id, data); },

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

  // Data Studio
  dataStudioOverview() { return this.get('/datastudio/overview'); },
  dataStudioMeta()     { return this.get('/datastudio/meta'); },
  dataStudioGoogle()   { return this.get('/datastudio/google'); },
  dataStudioTiktok()   { return this.get('/datastudio/tiktok'); },
  dataStudioFunnel()   { return this.get('/datastudio/funnel'); },
  dataStudioGeo()      { return this.get('/datastudio/geo'); },

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

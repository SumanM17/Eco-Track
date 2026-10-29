/**
 * CarbonKatha 2.0 Unified API Client
 * Features:
 * - Dynamic token injection (Authorization: Bearer <token>)
 * - Multi-account support (Individual, Family, Organization)
 * - Evidence upload, OCR extraction & fraud checks
 * - GPS mobility telemetry & simulated routes
 * - Carbon Coins ledger & coupon redemption
 * - Multilingual AI chat assistant (en, hi, ta, te)
 * - Hackathon-resilient offline fallback mode
 */

import { 
  MOCK_CALCULATION, 
  MOCK_EXPLANATIONS, 
  MOCK_PROGRESS, 
  MOCK_BILL_SCAN 
} from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const DEFAULT_TIMEOUT_MS = 10000;

export const getAuthToken = () => localStorage.getItem('carbonkatha_token') || '';
export const setAuthToken = (token) => localStorage.setItem('carbonkatha_token', token);
export const removeAuthToken = () => localStorage.removeItem('carbonkatha_token');

export const isMockEnabled = () => localStorage.getItem('carbonkatha_use_mock') === 'true';
export const setMockEnabled = (enabled) => localStorage.setItem('carbonkatha_use_mock', enabled ? 'true' : 'false');

async function request(endpoint, options = {}, customTimeout = DEFAULT_TIMEOUT_MS) {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), customTimeout);

  const token = getAuthToken();
  const headers = {
    'Accept': 'application/json',
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorJson.message || errorDetail;
      } catch {
        // Not JSON
      }
      throw new Error(errorDetail);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[CarbonKatha 2.0 API] ${options.method || 'GET'} ${url}:`, error.message);
    throw error;
  }
}

export const api = {
  // --- System & Health ---
  async getHealth() {
    return await request('/api/health', { method: 'GET' }, 4000);
  },

  async getSystemStatus() {
    return await request('/api/system/status', { method: 'GET' }, 4000);
  },

  // --- Authentication & Accounts ---
  async register(payload) {
    const res = await request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  async login(email, password) {
    const res = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  async demoLogin(accountType = 'individual') {
    const res = await request('/api/auth/demo-login', { method: 'POST', body: JSON.stringify({ account_type: accountType }) });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  async getMe() {
    return await request('/api/auth/me', { method: 'GET' });
  },

  logout() {
    removeAuthToken();
  },

  // --- Activities & Calculation ---
  async getActivities(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return await request(`/api/activities/${qs ? `?${qs}` : ''}`);
  },

  async createActivity(payload) {
    return await request('/api/activities/', { method: 'POST', body: JSON.stringify(payload) });
  },

  async deleteActivity(id) {
    return await request(`/api/activities/${id}`, { method: 'DELETE' });
  },

  async getActivitySummary(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return await request(`/api/activities/summary${qs ? `?${qs}` : ''}`);
  },

  async getComparison(currentPeriod = null, previousPeriod = null) {
    const qs = new URLSearchParams({
      ...(currentPeriod ? { current_period: currentPeriod } : {}),
      ...(previousPeriod ? { previous_period: previousPeriod } : {}),
    }).toString();
    return await request(`/api/activities/comparison${qs ? `?${qs}` : ''}`);
  },

  // --- Legacy Compatibility (v1.0) ---
  async parseText(text, language = null) {
    if (isMockEnabled()) {
      return {
        activities: [
          { category: 'electricity', item: '1.5-ton Split AC', value: 4.0, unit: 'hours', frequency: 'daily', confidence: 0.95 },
          { category: 'transport', item: 'Delhi Metro', value: 15.0, unit: 'km', frequency: 'daily', confidence: 0.92 },
          { category: 'fuel', item: 'LPG Stove Cooking', value: 0.5, unit: 'hours', frequency: 'daily', confidence: 0.88 },
        ],
        assumptions: ["Assumed 1.5-ton split AC @ 1.2 kW/hr", "Calculated Delhi Metro at 0.015 kg CO2e/km"],
        follow_up_question: "Did you use any personal vehicle or dispose of wet waste today?",
        parser: "claude-mock-offline",
        language_detected: language || 'en',
      };
    }
    return await request('/api/parse/', { method: 'POST', body: JSON.stringify({ text, language }) });
  },

  async calculate(activities) {
    try {
      return await request('/api/calculate', { method: 'POST', body: JSON.stringify({ activities }) });
    } catch {
      return MOCK_CALCULATION;
    }
  },

  async explain(breakdown, mode = 'student', language = 'en') {
    try {
      return await request('/api/explain', { method: 'POST', body: JSON.stringify({ breakdown, mode, language }) });
    } catch {
      const modeGroup = MOCK_EXPLANATIONS[mode.toLowerCase()] || MOCK_EXPLANATIONS.student;
      return { explanation: modeGroup[language] || modeGroup.en, mode, language };
    }
  },

  async submitFeedback(payload) {
    return await request('/api/voice/feedback', { method: 'POST', body: JSON.stringify(payload) });
  },

  // --- Progress, Trajectory & What-If ---
  async getProgress() {
    try {
      return await request('/api/progress', { method: 'GET' });
    } catch {
      return MOCK_PROGRESS;
    }
  },

  async calculateWhatIf(params) {
    return await request('/api/whatif', { method: 'POST', body: JSON.stringify(params) });
  },

  async getBudget() {
    return await request('/api/budget', { method: 'GET' });
  },

  async getRecommendations(language = 'en') {
    return await request(`/api/recommendations?language=${encodeURIComponent(language)}`, { method: 'GET' });
  },

  async getLeaderboard(filter = 'weekly') {
    return await request(`/api/leaderboard?filter=${encodeURIComponent(filter)}`, { method: 'GET' });
  },

  // --- Evidence Verification & Document Extraction ---
  async uploadEvidence(file, documentType = 'electricity_bill', activityId = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (activityId) formData.append('activity_id', activityId);

    return await request('/api/evidence/upload', { method: 'POST', body: formData }, 25000);
  },

  async confirmEvidence(evidenceId, confirmedQuantity, confirmedUnit, activityId = null) {
    return await request('/api/evidence/confirm', {
      method: 'POST',
      body: JSON.stringify({
        evidence_id: evidenceId,
        confirmed_quantity: confirmedQuantity,
        confirmed_unit: confirmedUnit,
        activity_id: activityId,
      }),
    });
  },

  async getEvidenceList() {
    return await request('/api/evidence/');
  },

  // --- Family & Household ---
  async getFamilyDashboard() {
    return await request('/api/family/dashboard');
  },

  async addFamilyMember(name, email, role = 'member') {
    return await request('/api/family/members', { method: 'POST', body: JSON.stringify({ name, email, role }) });
  },

  // --- Organization Portal ---
  async getOrgDashboard() {
    return await request('/api/organization/dashboard');
  },

  async getFacilities() {
    return await request('/api/organization/facilities');
  },

  async createFacility(name, location, facilityType, areaSqft) {
    return await request('/api/organization/facilities', {
      method: 'POST',
      body: JSON.stringify({ name, location, facility_type: facilityType, area_sqft: areaSqft }),
    });
  },

  async getOrgReport(period = null) {
    const qs = period ? `?period=${encodeURIComponent(period)}` : '';
    return await request(`/api/organization/report${qs}`);
  },

  // --- GPS Mobility & Simulated Routes ---
  async getSimulatedRoutes() {
    return await request('/api/gps/simulated-routes');
  },

  async recordTrip(payload) {
    return await request('/api/gps/record', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getTrips() {
    return await request('/api/gps/trips');
  },

  // --- Rewards & Carbon Coins ---
  async getRewardsDashboard() {
    return await request('/api/rewards/dashboard');
  },

  async redeemCoupon(rewardId) {
    return await request('/api/rewards/redeem', { method: 'POST', body: JSON.stringify({ reward_id: rewardId }) });
  },

  async getMyVouchers() {
    return await request('/api/rewards/my-vouchers');
  },

  // --- Multilingual AI Chat Assistant ---
  async chatWithAssistant(message, language = 'en', accountType = 'individual') {
    return await request('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, language, account_type: accountType }),
    });
  },

  // --- Legacy Scan Bill (v1.0) ---
  async scanBill(billFile) {
    return await this.uploadEvidence(billFile, 'electricity_bill');
  },
};

export default api;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface ApiResponse<T> {
  data: T;
  error?: { message: string; code?: string };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API request failed");
    }

    return data.data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: object): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: object): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: object): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

// Type-safe API methods
export const api = {
  // Overview
  getOverview: () => apiClient.get("/overview"),
  getRecommendations: () => apiClient.get("/overview/recommendations"),
  getTimeseries: (params?: { from?: string; to?: string }) =>
    apiClient.get(`/overview/timeseries${params ? `?from=${params.from}&to=${params.to}` : ""}`),

  // Campaigns
  getCampaigns: (params?: { status?: string; page?: number }) =>
    apiClient.get(`/campaigns${params?.status ? `?status=${params.status}` : ""}`),
  getCampaign: (id: string) => apiClient.get(`/campaigns/${id}`),
  updateCampaign: (id: string, data: object) => apiClient.patch(`/campaigns/${id}`, data),

  // Rules
  getRules: (params?: { active?: boolean }) =>
    apiClient.get(`/rules${params?.active !== undefined ? `?active=${params.active}` : ""}`),
  getRule: (id: string) => apiClient.get(`/rules/${id}`),
  createRule: (data: object) => apiClient.post("/rules", data),
  updateRule: (id: string, data: object) => apiClient.put(`/rules/${id}`, data),
  deleteRule: (id: string) => apiClient.delete(`/rules/${id}`),
  testRule: (id: string) => apiClient.post(`/rules/${id}/test`),
  getRulePresets: () => apiClient.get("/rules/presets/list"),

  // Creatives
  getVariants: (params?: { status?: string }) =>
    apiClient.get(`/creatives/variants${params?.status ? `?status=${params.status}` : ""}`),
  generateCreatives: (data: object) => apiClient.post("/creatives/generate", data),
  scoreCreative: (data: object) => apiClient.post("/creatives/score", data),
  checkCompliance: (data: object) => apiClient.post("/creatives/compliance-check", data),
  getCompetitors: () => apiClient.get("/creatives/competitors"),
  addCompetitor: (data: object) => apiClient.post("/creatives/competitors", data),
  getCompetitorAds: (competitorId: string) =>
    apiClient.get(`/creatives/competitors/${competitorId}/ads`),
  getTrends: () => apiClient.get("/creatives/trends"),

  // Alerts
  getAlerts: (params?: { status?: string; severity?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.severity) searchParams.set("severity", params.severity);
    const query = searchParams.toString();
    return apiClient.get(`/alerts${query ? `?${query}` : ""}`);
  },
  updateAlert: (id: string, data: object) => apiClient.patch(`/alerts/${id}`, data),
  dismissAlerts: (alertIds: string[]) => apiClient.post("/alerts/dismiss", { alertIds }),
  getAlertStats: () => apiClient.get("/alerts/stats/summary"),

  // Reports
  getSummary: (params?: { period?: string; from?: string; to?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.period) searchParams.set("period", params.period);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    const query = searchParams.toString();
    return apiClient.get(`/reports/summary${query ? `?${query}` : ""}`);
  },
  getCreativeReport: () => apiClient.get("/reports/creative"),
  getBenchmarks: () => apiClient.get("/reports/benchmarks"),
  getCohorts: () => apiClient.get("/reports/cohorts"),
  exportReport: (data: object) => apiClient.post("/reports/export", data),

  // Settings
  getSettings: () => apiClient.get("/settings"),
  getBrandProfile: () => apiClient.get("/settings/brand-profile"),
  updateBrandProfile: (data: object) => apiClient.put("/settings/brand-profile", data),
  getAutomation: () => apiClient.get("/settings/automation"),
  updateAutomation: (data: object) => apiClient.put("/settings/automation", data),
  getNotifications: () => apiClient.get("/settings/notifications"),
  updateNotifications: (data: object) => apiClient.put("/settings/notifications", data),
  getIntegrations: () => apiClient.get("/settings/integrations"),
  connectMeta: () => apiClient.post("/settings/integrations/meta/connect"),
  connectSlack: (data: object) => apiClient.post("/settings/integrations/slack/connect", data),
  connectDiscord: (data: object) => apiClient.post("/settings/integrations/discord/connect", data),
  disconnectIntegration: (provider: string) =>
    apiClient.post(`/settings/integrations/${provider}/disconnect`),
  getCommunity: () => apiClient.get("/settings/community"),
  updateCommunity: (data: object) => apiClient.put("/settings/community", data),

  // Tracking
  getTrackingHealth: () => apiClient.get("/tracking/health"),
  diagnoseTracking: () => apiClient.get("/tracking/diagnose"),
  verifyEvents: (events: string[]) => apiClient.post("/tracking/verify-events", { events }),
  getTrackingRecommendations: () => apiClient.get("/tracking/recommendations"),
};

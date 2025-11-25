export interface Tenant {
  id: string;
  name: string;
  shopifyDomain: string;
  shopifyAccessToken?: string;
  plan: "free" | "starter" | "growth" | "enterprise";
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  role: "owner" | "admin" | "marketer" | "collaborator";
  createdAt: string;
  updatedAt: string;
}

export interface AdAccount {
  id: string;
  tenantId: string;
  provider: "meta" | "google" | "tiktok";
  externalId: string;
  name: string;
  accessToken?: string;
  status: "active" | "paused" | "disconnected";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  tenantId: string;
  userId: string;
  shop: string;
  accessToken: string;
  expiresAt: string;
}

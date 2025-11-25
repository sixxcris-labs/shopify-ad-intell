export type CampaignStatus = "active" | "paused" | "archived" | "deleted";
export type AutomationLevel = "manual" | "partial" | "full";

export interface Campaign {
  id: string;
  tenantId: string;
  adAccountId: string;
  externalId: string;
  name: string;
  status: CampaignStatus;
  objective: string;
  spend: number;
  revenue: number;
  profit: number;
  roas: number;
  cac: number;
  impressions: number;
  clicks: number;
  conversions: number;
  automationLevel: AutomationLevel;
  createdAt: string;
  updatedAt: string;
}

export interface AdSet {
  id: string;
  tenantId: string;
  campaignId: string;
  externalId: string;
  name: string;
  status: CampaignStatus;
  targetingDescription?: string;
  spend: number;
  revenue: number;
  profit: number;
  roas: number;
  impressions: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ad {
  id: string;
  tenantId: string;
  adSetId: string;
  externalId: string;
  name: string;
  status: CampaignStatus;
  creativeId?: string;
  spend: number;
  revenue: number;
  profit: number;
  roas: number;
  impressions: number;
  clicks: number;
  conversions: number;
  fatigueScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignListResponse {
  data: Campaign[];
  total: number;
  page: number;
  pageSize: number;
}

import type { ProfitMetrics } from "./metrics";

export interface MetaBrainContext {
  trackingHealth?: TrackingHealth;
  recentActions?: string[];
  activeCampaignCount?: number;
  topPerformers?: string[];
  underPerformers?: string[];
}

export interface MetaBrainInput {
  shopId: string;
  metrics: ProfitMetrics;
  context: MetaBrainContext;
}

export interface MetaBrainRecommendation {
  id: string;
  type: "scale" | "pause" | "test" | "fix" | "monitor";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  entityType?: "campaign" | "ad_set" | "ad";
  entityId?: string;
  suggestedAction?: string;
  expectedImpact?: string;
}

export interface MetaBrainOutput {
  input: MetaBrainInput;
  summary: string;
  recommendations: MetaBrainRecommendation[];
  actions: string[];
  prompt?: string;
}

export interface TrackingHealth {
  pixelStatus: "healthy" | "degraded" | "failing";
  capiStatus: "healthy" | "degraded" | "failing" | "not_configured";
  eventMatchQuality: number; // 0-10
  dedupRate: number; // percentage
  lastChecked: string;
  issues: TrackingIssue[];
}

export interface TrackingIssue {
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
  recommendation: string;
}

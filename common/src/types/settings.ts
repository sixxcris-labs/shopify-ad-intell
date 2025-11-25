export type GlobalAutomationLevel = "suggestions_only" | "auto_low_risk" | "auto_advanced";

export interface BrandProfile {
  toneFormalToCasual: number; // 1-10 scale
  tonePlayfulToSerious: number; // 1-10 scale
  voiceDescription?: string;
  exampleMessages: string[];
  prohibitedPhrases: string[];
  brandColors?: string[];
  logoUrl?: string;
}

export interface AutomationSettings {
  globalAutomationLevel: GlobalAutomationLevel;
  maxDailySpendChangePercent: number;
  maxDailyBudgetChangeUsd: number;
  requireReviewForHighRisk: boolean;
  pauseOnTrackingIssues: boolean;
  notifyOnAutoActions: boolean;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  emailAddresses: string[];
  slackEnabled: boolean;
  slackWebhookUrl?: string;
  slackChannel?: string;
  discordEnabled: boolean;
  discordWebhookUrl?: string;
  alertSeverityThreshold: "low" | "medium" | "high" | "critical";
}

export interface IntegrationStatus {
  shopify: {
    connected: boolean;
    shop?: string;
    scopes?: string[];
    connectedAt?: string;
  };
  meta: {
    connected: boolean;
    adAccountId?: string;
    adAccountName?: string;
    connectedAt?: string;
  };
  slack: {
    connected: boolean;
    workspace?: string;
    connectedAt?: string;
  };
  discord: {
    connected: boolean;
    connectedAt?: string;
  };
}

export interface CommunitySettings {
  optedIn: boolean;
  shareRevenue: boolean;
  shareSpend: boolean;
  shareCreativePerformance: boolean;
  industryVertical?: string;
}

export interface Settings {
  tenantId: string;
  brandProfile: BrandProfile;
  automation: AutomationSettings;
  notifications: NotificationSettings;
  integrations: IntegrationStatus;
  community: CommunitySettings;
  updatedAt: string;
}

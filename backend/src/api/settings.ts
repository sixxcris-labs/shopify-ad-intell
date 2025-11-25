import { Router } from "express";
import type { Settings, BrandProfile, AutomationSettings, NotificationSettings } from "@shopify-ad-intelligence/common";

const router = Router();

// Mock settings
let mockSettings: Settings = {
  tenantId: "tenant_mock",
  brandProfile: {
    toneFormalToCasual: 6,
    tonePlayfulToSerious: 4,
    voiceDescription: "Friendly, helpful, professional",
    exampleMessages: [
      "Get ready to transform your style!",
      "Quality you can trust, prices you'll love",
    ],
    prohibitedPhrases: ["guarantee", "miracle", "revolutionary"],
    brandColors: ["#1a73e8", "#34a853"],
  },
  automation: {
    globalAutomationLevel: "auto_low_risk",
    maxDailySpendChangePercent: 20,
    maxDailyBudgetChangeUsd: 500,
    requireReviewForHighRisk: true,
    pauseOnTrackingIssues: true,
    notifyOnAutoActions: true,
  },
  notifications: {
    emailEnabled: true,
    emailAddresses: ["merchant@example.com"],
    slackEnabled: true,
    slackWebhookUrl: "",
    slackChannel: "#ad-alerts",
    discordEnabled: false,
    discordWebhookUrl: "",
    alertSeverityThreshold: "medium",
  },
  integrations: {
    shopify: {
      connected: true,
      shop: "example.myshopify.com",
      scopes: ["read_products", "read_orders", "read_customers"],
      connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    meta: {
      connected: true,
      adAccountId: "act_123456789",
      adAccountName: "Example Store Ad Account",
      connectedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    slack: {
      connected: false,
    },
    discord: {
      connected: false,
    },
  },
  community: {
    optedIn: false,
    shareRevenue: false,
    shareSpend: false,
    shareCreativePerformance: false,
    industryVertical: "fashion",
  },
  updatedAt: new Date().toISOString(),
};

/**
 * Get all settings
 */
router.get("/", (_req, res) => {
  res.json({ data: mockSettings });
});

/**
 * Get brand profile
 */
router.get("/brand-profile", (_req, res) => {
  res.json({ data: mockSettings.brandProfile });
});

/**
 * Update brand profile
 */
router.put("/brand-profile", (req, res) => {
  const updates = req.body as Partial<BrandProfile>;
  mockSettings.brandProfile = { ...mockSettings.brandProfile, ...updates };
  mockSettings.updatedAt = new Date().toISOString();
  res.json({ data: mockSettings.brandProfile });
});

/**
 * Get automation settings
 */
router.get("/automation", (_req, res) => {
  res.json({ data: mockSettings.automation });
});

/**
 * Update automation settings
 */
router.put("/automation", (req, res) => {
  const updates = req.body as Partial<AutomationSettings>;
  mockSettings.automation = { ...mockSettings.automation, ...updates };
  mockSettings.updatedAt = new Date().toISOString();
  res.json({ data: mockSettings.automation });
});

/**
 * Get notification settings
 */
router.get("/notifications", (_req, res) => {
  res.json({ data: mockSettings.notifications });
});

/**
 * Update notification settings
 */
router.put("/notifications", (req, res) => {
  const updates = req.body as Partial<NotificationSettings>;
  mockSettings.notifications = { ...mockSettings.notifications, ...updates };
  mockSettings.updatedAt = new Date().toISOString();
  res.json({ data: mockSettings.notifications });
});

/**
 * Get integration status
 */
router.get("/integrations", (_req, res) => {
  res.json({ data: mockSettings.integrations });
});

/**
 * Connect Meta/Facebook Ads
 */
router.post("/integrations/meta/connect", (req, res) => {
  // TODO: Implement actual OAuth flow
  res.json({
    data: {
      authUrl: "https://www.facebook.com/v19.0/dialog/oauth?...",
      state: "random_state_token",
    },
  });
});

/**
 * Connect Slack
 */
router.post("/integrations/slack/connect", (req, res) => {
  const { webhookUrl, channel } = req.body;
  mockSettings.integrations.slack = {
    connected: true,
    workspace: "Example Workspace",
    connectedAt: new Date().toISOString(),
  };
  mockSettings.notifications.slackEnabled = true;
  mockSettings.notifications.slackWebhookUrl = webhookUrl;
  mockSettings.notifications.slackChannel = channel;
  mockSettings.updatedAt = new Date().toISOString();
  res.json({ data: mockSettings.integrations.slack });
});

/**
 * Connect Discord
 */
router.post("/integrations/discord/connect", (req, res) => {
  const { webhookUrl } = req.body;
  mockSettings.integrations.discord = {
    connected: true,
    connectedAt: new Date().toISOString(),
  };
  mockSettings.notifications.discordEnabled = true;
  mockSettings.notifications.discordWebhookUrl = webhookUrl;
  mockSettings.updatedAt = new Date().toISOString();
  res.json({ data: mockSettings.integrations.discord });
});

/**
 * Disconnect integration
 */
router.post("/integrations/:provider/disconnect", (req, res) => {
  const { provider } = req.params;

  if (provider === "slack") {
    mockSettings.integrations.slack = { connected: false };
    mockSettings.notifications.slackEnabled = false;
  } else if (provider === "discord") {
    mockSettings.integrations.discord = { connected: false };
    mockSettings.notifications.discordEnabled = false;
  } else if (provider === "meta") {
    mockSettings.integrations.meta = { connected: false };
  }

  mockSettings.updatedAt = new Date().toISOString();
  res.json({ success: true });
});

/**
 * Get community settings
 */
router.get("/community", (_req, res) => {
  res.json({ data: mockSettings.community });
});

/**
 * Update community opt-in
 */
router.put("/community", (req, res) => {
  const updates = req.body;
  mockSettings.community = { ...mockSettings.community, ...updates };
  mockSettings.updatedAt = new Date().toISOString();
  res.json({ data: mockSettings.community });
});

export default router;

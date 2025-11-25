import { Router } from "express";
import type { Campaign, CampaignListResponse } from "@shopify-ad-intelligence/common";

const router = Router();

// Mock data
const mockCampaigns: Campaign[] = [
  {
    id: "camp_1",
    tenantId: "tenant_mock",
    adAccountId: "act_123",
    externalId: "123456789",
    name: "Prospecting - US",
    status: "active",
    objective: "conversions",
    spend: 2500,
    revenue: 10500,
    profit: 5500,
    roas: 4.2,
    cac: 45,
    impressions: 150000,
    clicks: 3500,
    conversions: 70,
    automationLevel: "partial",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "camp_2",
    tenantId: "tenant_mock",
    adAccountId: "act_123",
    externalId: "987654321",
    name: "Retargeting - All",
    status: "active",
    objective: "conversions",
    spend: 1500,
    revenue: 8700,
    profit: 4800,
    roas: 5.8,
    cac: 35,
    impressions: 80000,
    clicks: 2200,
    conversions: 50,
    automationLevel: "full",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "camp_3",
    tenantId: "tenant_mock",
    adAccountId: "act_123",
    externalId: "456789123",
    name: "Lookalike - EU",
    status: "active",
    objective: "conversions",
    spend: 1000,
    revenue: 800,
    profit: -500,
    roas: 0.8,
    cac: 125,
    impressions: 50000,
    clicks: 800,
    conversions: 8,
    automationLevel: "manual",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Get all campaigns
 */
router.get("/", (req, res) => {
  const { status, page = "1", pageSize = "20" } = req.query;

  let filtered = [...mockCampaigns];

  if (status && typeof status === "string") {
    filtered = filtered.filter((c) => c.status === status);
  }

  const pageNum = parseInt(page as string, 10);
  const size = parseInt(pageSize as string, 10);
  const start = (pageNum - 1) * size;
  const paginated = filtered.slice(start, start + size);

  const response: CampaignListResponse = {
    data: paginated,
    total: filtered.length,
    page: pageNum,
    pageSize: size,
  };

  res.json(response);
});

/**
 * Get single campaign
 */
router.get("/:id", (req, res) => {
  const campaign = mockCampaigns.find((c) => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({
      error: { message: "Campaign not found" },
    });
  }

  return res.json({ data: campaign });
});

/**
 * Update campaign
 */
router.patch("/:id", (req, res) => {
  const campaignIndex = mockCampaigns.findIndex((c) => c.id === req.params.id);

  if (campaignIndex === -1) {
    return res.status(404).json({
      error: { message: "Campaign not found" },
    });
  }

  const { status, automationLevel } = req.body;
  const campaign = mockCampaigns[campaignIndex];

  if (status) campaign.status = status;
  if (automationLevel) campaign.automationLevel = automationLevel;
  campaign.updatedAt = new Date().toISOString();

  return res.json({ data: campaign });
});

/**
 * Get campaign ad sets
 */
router.get("/:id/adsets", (req, res) => {
  // TODO: Return actual ad sets
  res.json({
    data: [
      {
        id: "adset_1",
        campaignId: req.params.id,
        name: "Interest - Fitness",
        status: "active",
        spend: 1000,
        roas: 3.5,
      },
    ],
  });
});

/**
 * Get campaign ads
 */
router.get("/:id/ads", (req, res) => {
  // TODO: Return actual ads
  res.json({
    data: [
      {
        id: "ad_1",
        adSetId: "adset_1",
        name: "Video - Testimonial",
        status: "active",
        spend: 500,
        roas: 4.0,
        fatigueScore: 25,
      },
    ],
  });
});

export default router;

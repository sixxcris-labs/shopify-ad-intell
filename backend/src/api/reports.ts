import { Router } from "express";
import type { SummaryReport, ReportExportRequest } from "@shopify-ad-intelligence/common";

const router = Router();

/**
 * Get summary report
 */
router.get("/summary", (req, res) => {
  const { period = "weekly", from, to } = req.query;

  // TODO: Fetch real data
  const summary: SummaryReport = {
    tenantId: "tenant_mock",
    period: period as "daily" | "weekly" | "monthly",
    from: from?.toString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    to: to?.toString() || new Date().toISOString(),
    kpis: [
      { label: "Revenue", value: "$18,000", change: 12, trend: "up" },
      { label: "Profit", value: "$13,000", change: 8, trend: "up" },
      { label: "ROAS", value: "3.6", change: 5, trend: "up" },
      { label: "CAC", value: "$63", change: -5, trend: "up" },
    ],
    metrics: {
      spend: 5000,
      revenue: 18000,
      orders: 120,
      customers: 95,
      totalMarketingSpend: 6000,
      mer: 3.0,
      metaRoas: 3.6,
      cac: 63.16,
      aov: 150,
      ltv: 225,
      ltvToCac: 3.56,
      paybackDays: 45,
    },
    topCampaigns: [
      { id: "camp_1", name: "Prospecting - US", profit: 4500, roas: 4.2 },
      { id: "camp_2", name: "Retargeting - All", profit: 3200, roas: 5.8 },
    ],
    bottomCampaigns: [
      { id: "camp_3", name: "Lookalike - EU", profit: -200, roas: 0.8 },
    ],
    recommendations: [
      "Scale Retargeting - All by 20%",
      "Pause or reduce budget for Lookalike - EU",
      "Test new creative angles for Prospecting - US",
    ],
  };

  res.json({ data: summary });
});

/**
 * Get creative performance report
 */
router.get("/creative", (req, res) => {
  const { from, to } = req.query;

  res.json({
    data: {
      tenantId: "tenant_mock",
      from: from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: to || new Date().toISOString(),
      winners: [
        {
          id: "ad_1",
          name: "Video - Testimonial",
          format: "video",
          roas: 4.8,
          spend: 1500,
          revenue: 7200,
        },
        {
          id: "ad_2",
          name: "Carousel - Product",
          format: "carousel",
          roas: 4.2,
          spend: 1200,
          revenue: 5040,
        },
      ],
      losers: [
        {
          id: "ad_5",
          name: "Image - Sale Banner",
          format: "image",
          roas: 0.9,
          spend: 800,
          revenue: 720,
        },
      ],
      fatigued: [
        {
          id: "ad_3",
          name: "Video - Summer Sale",
          fatigueScore: 72,
          daysSinceCreation: 45,
        },
      ],
    },
  });
});

/**
 * Get benchmark data
 */
router.get("/benchmarks", (req, res) => {
  res.json({
    data: {
      industry: "E-commerce",
      vertical: "Fashion",
      metrics: {
        roas: { value: 3.6, percentile: 65, benchmark: 2.8 },
        cac: { value: 63, percentile: 55, benchmark: 75 },
        aov: { value: 150, percentile: 70, benchmark: 120 },
        conversionRate: { value: 2.8, percentile: 60, benchmark: 2.5 },
      },
      comparison: {
        vsIndustry: "+28%",
        vsLastMonth: "+12%",
        vsTopPerformers: "-15%",
      },
    },
  });
});

/**
 * Export report
 */
router.post("/export", async (req, res) => {
  const { type, format, from, to } = req.body as ReportExportRequest;

  // TODO: Generate actual export file
  // For now, return a mock download URL

  res.json({
    data: {
      downloadUrl: `https://exports.example.com/reports/${type}_${Date.now()}.${format}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
});

/**
 * Get cohort/LTV analysis
 */
router.get("/cohorts", (req, res) => {
  res.json({
    data: {
      cohorts: [
        {
          month: "2024-01",
          customers: 450,
          revenue: 67500,
          ltv30: 150,
          ltv60: 185,
          ltv90: 210,
          retentionRate: 0.35,
        },
        {
          month: "2024-02",
          customers: 520,
          revenue: 78000,
          ltv30: 150,
          ltv60: 190,
          ltv90: null,
          retentionRate: 0.38,
        },
        {
          month: "2024-03",
          customers: 580,
          revenue: 87000,
          ltv30: 150,
          ltv60: null,
          ltv90: null,
          retentionRate: 0.40,
        },
      ],
      averageLtv: 225,
      averagePayback: 45,
    },
  });
});

export default router;

import { Router } from "express";
import type { ProfitMetrics, SummaryReport, KPI } from "@shopify-ad-intelligence/common";
import { MetricsService, MetaBrainService } from "../services";

const router = Router();
const metricsService = new MetricsService();
const metaBrainService = new MetaBrainService();

// Mock data for development
const mockMetrics: ProfitMetrics = {
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
};

/**
 * Get overview dashboard data
 */
router.get("/", async (req, res) => {
  const { from, to } = req.query;

  // TODO: Fetch real data from database
  const metrics = mockMetrics;
  const health = metricsService.assessHealth(metrics);

  const kpis: KPI[] = [
    {
      label: "Revenue",
      value: `$${metrics.revenue.toLocaleString()}`,
      change: 12,
      changeLabel: "vs last period",
      trend: "up",
    },
    {
      label: "Profit",
      value: `$${(metrics.revenue - metrics.spend).toLocaleString()}`,
      change: 8,
      changeLabel: "vs last period",
      trend: "up",
    },
    {
      label: "ROAS",
      value: metrics.metaRoas.toFixed(2),
      change: 5,
      changeLabel: "vs last period",
      trend: "up",
    },
    {
      label: "MER",
      value: metrics.mer.toFixed(2),
      change: -2,
      changeLabel: "vs last period",
      trend: "down",
    },
    {
      label: "CAC",
      value: `$${metrics.cac.toFixed(0)}`,
      change: -5,
      changeLabel: "vs last period",
      trend: "up", // Lower CAC is better
    },
    {
      label: "LTV:CAC",
      value: metrics.ltvToCac.toFixed(2),
      change: 3,
      changeLabel: "vs last period",
      trend: "up",
    },
  ];

  const summary: SummaryReport = {
    tenantId: "tenant_mock",
    period: "weekly",
    from: from?.toString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    to: to?.toString() || new Date().toISOString(),
    kpis,
    metrics,
    topCampaigns: [
      { id: "camp_1", name: "Prospecting - US", profit: 4500, roas: 4.2 },
      { id: "camp_2", name: "Retargeting - All", profit: 3200, roas: 5.8 },
    ],
    bottomCampaigns: [
      { id: "camp_3", name: "Lookalike - EU", profit: -200, roas: 0.8 },
    ],
    recommendations: health.issues.concat(health.opportunities),
  };

  res.json({ data: summary });
});

/**
 * Get AI recommendations
 */
router.get("/recommendations", async (req, res) => {
  try {
    // TODO: Get real metrics from database
    const output = await metaBrainService.getRecommendations({
      tenantId: "tenant_mock",
      metrics: mockMetrics,
    });

    res.json({ data: output });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({
      error: { message: "Failed to generate recommendations" },
    });
  }
});

/**
 * Get metrics timeseries
 */
router.get("/timeseries", (req, res) => {
  const { from, to, metric } = req.query;

  // TODO: Fetch real timeseries data
  const days = 7;
  const snapshots = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    return {
      date: date.toISOString().split("T")[0],
      metrics: {
        ...mockMetrics,
        spend: mockMetrics.spend * (0.9 + Math.random() * 0.2),
        revenue: mockMetrics.revenue * (0.9 + Math.random() * 0.2),
      },
    };
  });

  res.json({
    data: {
      shopId: "tenant_mock",
      from: from || snapshots[0].date,
      to: to || snapshots[snapshots.length - 1].date,
      snapshots,
    },
  });
});

export default router;

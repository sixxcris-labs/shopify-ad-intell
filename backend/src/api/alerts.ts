import { Router } from "express";
import type { Alert, AlertListResponse, AlertFilters } from "@shopify-ad-intelligence/common";

const router = Router();

// Mock data
const mockAlerts: Alert[] = [
  {
    id: "alert_1",
    tenantId: "tenant_mock",
    type: "low_roas",
    severity: "high",
    entityType: "campaign",
    entityId: "camp_3",
    title: "Campaign ROAS Below Breakeven",
    message: "Lookalike - EU has ROAS of 0.8 over the last 3 days, below the 1.0 breakeven threshold.",
    recommendation: "Consider pausing this campaign or reducing budget to limit losses.",
    status: "open",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "alert_2",
    tenantId: "tenant_mock",
    type: "scaling_opportunity",
    severity: "medium",
    entityType: "campaign",
    entityId: "camp_2",
    title: "High-Performing Campaign Ready to Scale",
    message: "Retargeting - All has maintained ROAS above 5.0 for 7 days with stable performance.",
    recommendation: "Consider increasing budget by 20% to capture more conversions.",
    status: "open",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "alert_3",
    tenantId: "tenant_mock",
    type: "creative_fatigue",
    severity: "low",
    entityType: "ad",
    entityId: "ad_5",
    title: "Creative Showing Signs of Fatigue",
    message: "Video - Summer Sale has declining CTR over the past 5 days.",
    recommendation: "Prepare new creative variants to replace this ad.",
    status: "open",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Get all alerts
 */
router.get("/", (req, res) => {
  const { status, severity, entityType } = req.query as Partial<AlertFilters>;

  let filtered = [...mockAlerts];

  if (status) {
    filtered = filtered.filter((a) => a.status === status);
  }
  if (severity) {
    filtered = filtered.filter((a) => a.severity === severity);
  }
  if (entityType) {
    filtered = filtered.filter((a) => a.entityType === entityType);
  }

  const unreadCount = filtered.filter((a) => a.status === "open").length;

  const response: AlertListResponse = {
    data: filtered,
    total: filtered.length,
    unreadCount,
  };

  res.json(response);
});

/**
 * Get single alert
 */
router.get("/:id", (req, res) => {
  const alert = mockAlerts.find((a) => a.id === req.params.id);

  if (!alert) {
    return res.status(404).json({
      error: { message: "Alert not found" },
    });
  }

  return res.json({ data: alert });
});

/**
 * Update alert (mark as resolved, snooze, etc.)
 */
router.patch("/:id", (req, res) => {
  const alertIndex = mockAlerts.findIndex((a) => a.id === req.params.id);

  if (alertIndex === -1) {
    return res.status(404).json({
      error: { message: "Alert not found" },
    });
  }

  const { status, snoozedUntil } = req.body;
  const alert = mockAlerts[alertIndex];

  if (status) {
    alert.status = status;
    if (status === "resolved") {
      alert.resolvedAt = new Date().toISOString();
    }
  }
  if (snoozedUntil) {
    alert.snoozedUntil = snoozedUntil;
    alert.status = "snoozed";
  }
  alert.updatedAt = new Date().toISOString();

  return res.json({ data: alert });
});

/**
 * Dismiss multiple alerts
 */
router.post("/dismiss", (req, res) => {
  const { alertIds } = req.body;

  if (!Array.isArray(alertIds)) {
    return res.status(400).json({
      error: { message: "alertIds must be an array" },
    });
  }

  let dismissed = 0;
  for (const id of alertIds) {
    const alert = mockAlerts.find((a) => a.id === id);
    if (alert) {
      alert.status = "dismissed";
      alert.updatedAt = new Date().toISOString();
      dismissed++;
    }
  }

  return res.json({
    data: { dismissed },
  });
});

/**
 * Get alert statistics
 */
router.get("/stats/summary", (_req, res) => {
  const stats = {
    total: mockAlerts.length,
    open: mockAlerts.filter((a) => a.status === "open").length,
    resolved: mockAlerts.filter((a) => a.status === "resolved").length,
    snoozed: mockAlerts.filter((a) => a.status === "snoozed").length,
    bySeverity: {
      critical: mockAlerts.filter((a) => a.severity === "critical").length,
      high: mockAlerts.filter((a) => a.severity === "high").length,
      medium: mockAlerts.filter((a) => a.severity === "medium").length,
      low: mockAlerts.filter((a) => a.severity === "low").length,
    },
  };

  res.json({ data: stats });
});

export default router;

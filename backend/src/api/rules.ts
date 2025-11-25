import { Router } from "express";
import type { Rule, RuleListResponse } from "@shopify-ad-intelligence/common";
import { RulesEngine, MetricsService } from "../services";

const router = Router();
const rulesEngine = new RulesEngine();
const metricsService = new MetricsService();

// Mock data
const mockRules: Rule[] = [
  {
    id: "rule_1",
    tenantId: "tenant_mock",
    name: "Pause Low ROAS Campaigns",
    description: "Automatically pause campaigns with ROAS below 1.0",
    scope: "campaign",
    automationMode: "auto_low_risk",
    triggers: ["threshold"],
    conditions: [
      { metric: "roas", operator: "<", value: 1.0, windowDays: 3 },
      { metric: "spend", operator: ">", value: 100, windowDays: 3 },
    ],
    actions: [
      { type: "pause" },
      { type: "notify", notifyChannels: ["email", "slack"] },
    ],
    riskLevel: "low",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rule_2",
    tenantId: "tenant_mock",
    name: "Scale High Performers",
    description: "Increase budget for campaigns with ROAS > 3",
    scope: "campaign",
    automationMode: "suggestions_only",
    triggers: ["threshold"],
    conditions: [
      { metric: "roas", operator: ">", value: 3.0, windowDays: 7 },
      { metric: "spend", operator: ">", value: 500, windowDays: 7 },
    ],
    actions: [
      { type: "scale_budget", value: 20, unit: "percent" },
    ],
    riskLevel: "medium",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Get all rules
 */
router.get("/", (req, res) => {
  const { active } = req.query;

  let filtered = [...mockRules];

  if (active !== undefined) {
    filtered = filtered.filter((r) => r.active === (active === "true"));
  }

  const response: RuleListResponse = {
    data: filtered,
    total: filtered.length,
  };

  res.json(response);
});

/**
 * Get single rule
 */
router.get("/:id", (req, res) => {
  const rule = mockRules.find((r) => r.id === req.params.id);

  if (!rule) {
    return res.status(404).json({
      error: { message: "Rule not found" },
    });
  }

  return res.json({ data: rule });
});

/**
 * Create new rule
 */
router.post("/", (req, res) => {
  const {
    name,
    description,
    scope,
    automationMode,
    triggers,
    conditions,
    actions,
    riskLevel,
  } = req.body;

  // TODO: Validate input with zod

  const newRule: Rule = {
    id: `rule_${Date.now()}`,
    tenantId: "tenant_mock",
    name,
    description,
    scope: scope || "campaign",
    automationMode: automationMode || "suggestions_only",
    triggers: triggers || ["threshold"],
    conditions: conditions || [],
    actions: actions || [],
    riskLevel: riskLevel || "medium",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockRules.push(newRule);

  res.status(201).json({ data: newRule });
});

/**
 * Update rule
 */
router.put("/:id", (req, res) => {
  const ruleIndex = mockRules.findIndex((r) => r.id === req.params.id);

  if (ruleIndex === -1) {
    return res.status(404).json({
      error: { message: "Rule not found" },
    });
  }

  const updates = req.body;
  const rule = { ...mockRules[ruleIndex], ...updates, updatedAt: new Date().toISOString() };
  mockRules[ruleIndex] = rule;

  return res.json({ data: rule });
});

/**
 * Delete rule
 */
router.delete("/:id", (req, res) => {
  const ruleIndex = mockRules.findIndex((r) => r.id === req.params.id);

  if (ruleIndex === -1) {
    return res.status(404).json({
      error: { message: "Rule not found" },
    });
  }

  mockRules.splice(ruleIndex, 1);

  return res.status(204).send();
});

/**
 * Test/simulate rule against current data
 */
router.post("/:id/test", (req, res) => {
  const rule = mockRules.find((r) => r.id === req.params.id);

  if (!rule) {
    return res.status(404).json({
      error: { message: "Rule not found" },
    });
  }

  // Use mock metrics for testing
  const mockMetrics = metricsService.compute({
    spend: 5000,
    revenue: 18000,
    orders: 120,
    customers: 95,
  });

  const result = rulesEngine.evaluateCustomRule(rule, mockMetrics);

  return res.json({
    data: {
      rule: rule.name,
      result,
      testedAt: new Date().toISOString(),
      metricsUsed: mockMetrics,
    },
  });
});

/**
 * Get rule presets
 */
router.get("/presets/list", (_req, res) => {
  res.json({
    data: {
      protection: [
        { id: "protect_negative_roas", name: "Negative ROAS Protection" },
        { id: "protect_high_cac", name: "High CAC Protection" },
        { id: "protect_mer_drop", name: "MER Drop Protection" },
      ],
      scaling: [
        { id: "scale_high_roas", name: "High ROAS Scaling" },
        { id: "scale_profitable_mer", name: "Profitable MER Scaling" },
      ],
      fatigue: [
        { id: "fatigue_declining_roas", name: "Declining ROAS Alert" },
      ],
    },
  });
});

export default router;

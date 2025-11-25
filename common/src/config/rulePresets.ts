import type { ProfitMetrics, RuleEvaluationResult } from "../types";

export interface RulePreset {
  id: string;
  name: string;
  description: string;
  category: "protection" | "scaling" | "fatigue" | "revival";
  evaluate: (metrics: ProfitMetrics) => RuleEvaluationResult;
}

// Protection Rules - prevent losses
export const protectionRules: RulePreset[] = [
  {
    id: "protect_negative_roas",
    name: "Negative ROAS Protection",
    description: "Pause campaigns with ROAS below 1.0 for 3+ days",
    category: "protection",
    evaluate: (metrics) => ({
      id: "protect_negative_roas",
      name: "Negative ROAS Protection",
      triggered: metrics.metaRoas < 1.0,
      reason: metrics.metaRoas < 1.0
        ? `ROAS is ${metrics.metaRoas.toFixed(2)}, below breakeven`
        : "ROAS is healthy",
    }),
  },
  {
    id: "protect_high_cac",
    name: "High CAC Protection",
    description: "Alert when CAC exceeds 3x target",
    category: "protection",
    evaluate: (metrics) => ({
      id: "protect_high_cac",
      name: "High CAC Protection",
      triggered: metrics.ltvToCac < 1.5,
      reason: metrics.ltvToCac < 1.5
        ? `LTV:CAC ratio is ${metrics.ltvToCac.toFixed(2)}, too low`
        : "CAC is within acceptable range",
    }),
  },
  {
    id: "protect_mer_drop",
    name: "MER Drop Protection",
    description: "Alert on significant MER decline",
    category: "protection",
    evaluate: (metrics) => ({
      id: "protect_mer_drop",
      name: "MER Drop Protection",
      triggered: metrics.mer < 2.0,
      reason: metrics.mer < 2.0
        ? `MER is ${metrics.mer.toFixed(2)}, below healthy threshold`
        : "MER is healthy",
    }),
  },
];

// Scaling Rules - identify opportunities
export const scalingRules: RulePreset[] = [
  {
    id: "scale_high_roas",
    name: "High ROAS Scaling",
    description: "Scale budget for campaigns with ROAS > 3.0",
    category: "scaling",
    evaluate: (metrics) => ({
      id: "scale_high_roas",
      name: "High ROAS Scaling",
      triggered: metrics.metaRoas > 3.0,
      reason: metrics.metaRoas > 3.0
        ? `ROAS is ${metrics.metaRoas.toFixed(2)}, eligible for scaling`
        : "ROAS not high enough for scaling",
    }),
  },
  {
    id: "scale_profitable_mer",
    name: "Profitable MER Scaling",
    description: "Scale when MER indicates healthy efficiency",
    category: "scaling",
    evaluate: (metrics) => ({
      id: "scale_profitable_mer",
      name: "Profitable MER Scaling",
      triggered: metrics.mer > 3.5 && metrics.ltvToCac > 3.0,
      reason: metrics.mer > 3.5
        ? `MER ${metrics.mer.toFixed(2)} with LTV:CAC ${metrics.ltvToCac.toFixed(2)} - scale opportunity`
        : "Metrics not strong enough for aggressive scaling",
    }),
  },
];

// Fatigue Rules - detect creative exhaustion
export const fatigueRules: RulePreset[] = [
  {
    id: "fatigue_declining_roas",
    name: "Declining ROAS Alert",
    description: "Alert when ROAS trends downward consistently",
    category: "fatigue",
    evaluate: (metrics) => ({
      id: "fatigue_declining_roas",
      name: "Declining ROAS Alert",
      triggered: false, // Requires historical comparison
      reason: "Requires timeseries data for trend analysis",
    }),
  },
];

// Revival Rules - recover underperformers
export const revivalRules: RulePreset[] = [
  {
    id: "revival_paused_winners",
    name: "Paused Winners Revival",
    description: "Suggest testing paused ads that were previously profitable",
    category: "revival",
    evaluate: (metrics) => ({
      id: "revival_paused_winners",
      name: "Paused Winners Revival",
      triggered: false, // Requires historical data
      reason: "Requires historical performance data",
    }),
  },
];

export function evaluateProtectionRules(metrics: ProfitMetrics): RuleEvaluationResult[] {
  return protectionRules.map((rule) => rule.evaluate(metrics));
}

export function evaluateScalingRules(metrics: ProfitMetrics): RuleEvaluationResult[] {
  return scalingRules.map((rule) => rule.evaluate(metrics));
}

export function evaluateFatigueRules(metrics: ProfitMetrics): RuleEvaluationResult[] {
  return fatigueRules.map((rule) => rule.evaluate(metrics));
}

export function evaluateAllRules(metrics: ProfitMetrics): {
  protection: RuleEvaluationResult[];
  scaling: RuleEvaluationResult[];
  fatigue: RuleEvaluationResult[];
  revival: RuleEvaluationResult[];
} {
  return {
    protection: evaluateProtectionRules(metrics),
    scaling: evaluateScalingRules(metrics),
    fatigue: evaluateFatigueRules(metrics),
    revival: revivalRules.map((rule) => rule.evaluate(metrics)),
  };
}

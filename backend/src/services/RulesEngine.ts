import type {
  ProfitMetrics,
  Rule,
  RuleEvaluationResult,
  RuleExecution,
  RuleCondition,
} from "@shopify-ad-intelligence/common";
import {
  evaluateProtectionRules,
  evaluateScalingRules,
} from "@shopify-ad-intelligence/common";

export interface RulesSummary {
  protection: RuleEvaluationResult[];
  scaling: RuleEvaluationResult[];
  custom: RuleEvaluationResult[];
  triggered: RuleEvaluationResult[];
}

export class RulesEngine {
  /**
   * Evaluate all preset rules against current metrics
   */
  evaluatePresets(metrics: ProfitMetrics): Omit<RulesSummary, "custom" | "triggered"> {
    const protection = evaluateProtectionRules(metrics);
    const scaling = evaluateScalingRules(metrics);

    return { protection, scaling };
  }

  /**
   * Evaluate a single custom rule against metrics
   */
  evaluateCustomRule(rule: Rule, metrics: ProfitMetrics): RuleEvaluationResult {
    const conditionResults = rule.conditions.map((condition) =>
      this.evaluateCondition(condition, metrics)
    );

    const allMet = conditionResults.every((r) => r.met);
    const reasons = conditionResults
      .filter((r) => r.met)
      .map((r) => r.reason);

    return {
      id: rule.id,
      name: rule.name,
      triggered: allMet,
      reason: allMet
        ? `Conditions met: ${reasons.join("; ")}`
        : "Not all conditions met",
    };
  }

  /**
   * Evaluate a single condition against metrics
   */
  private evaluateCondition(
    condition: RuleCondition,
    metrics: ProfitMetrics
  ): { met: boolean; reason: string } {
    const metricValue = this.getMetricValue(condition.metric, metrics);
    
    if (metricValue === null) {
      return { met: false, reason: `Unknown metric: ${condition.metric}` };
    }

    let met = false;
    switch (condition.operator) {
      case ">":
        met = metricValue > condition.value;
        break;
      case "<":
        met = metricValue < condition.value;
        break;
      case ">=":
        met = metricValue >= condition.value;
        break;
      case "<=":
        met = metricValue <= condition.value;
        break;
      case "==":
        met = metricValue === condition.value;
        break;
      case "!=":
        met = metricValue !== condition.value;
        break;
    }

    return {
      met,
      reason: `${condition.metric} (${metricValue.toFixed(2)}) ${condition.operator} ${condition.value}`,
    };
  }

  /**
   * Get metric value by name
   */
  private getMetricValue(metricName: string, metrics: ProfitMetrics): number | null {
    const metricMap: Record<string, number> = {
      spend: metrics.spend,
      revenue: metrics.revenue,
      orders: metrics.orders,
      customers: metrics.customers,
      mer: metrics.mer,
      roas: metrics.metaRoas,
      metaRoas: metrics.metaRoas,
      cac: metrics.cac,
      aov: metrics.aov,
      ltv: metrics.ltv,
      ltvToCac: metrics.ltvToCac,
      paybackDays: metrics.paybackDays,
    };

    return metricMap[metricName] ?? null;
  }

  /**
   * Evaluate all rules (presets + custom) and return summary
   */
  evaluateAll(metrics: ProfitMetrics, customRules: Rule[] = []): RulesSummary {
    const presets = this.evaluatePresets(metrics);
    const custom = customRules.map((rule) => this.evaluateCustomRule(rule, metrics));

    const triggered = [
      ...presets.protection.filter((r) => r.triggered),
      ...presets.scaling.filter((r) => r.triggered),
      ...custom.filter((r) => r.triggered),
    ];

    return {
      ...presets,
      custom,
      triggered,
    };
  }

  /**
   * Create a rule execution record
   */
  createExecution(
    rule: Rule,
    result: RuleEvaluationResult,
    affectedEntities: string[] = []
  ): Omit<RuleExecution, "id"> {
    return {
      ruleId: rule.id,
      tenantId: rule.tenantId,
      triggered: result.triggered,
      conditionsMet: result.triggered ? [result.reason] : [],
      actionsTaken: result.triggered ? rule.actions : [],
      affectedEntities,
      executedAt: new Date().toISOString(),
    };
  }
}

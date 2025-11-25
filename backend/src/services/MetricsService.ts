import type { ProfitMetrics, RawMetricsInput, MetricTimeseries } from "@shopify-ad-intelligence/common";

export class MetricsService {
  /**
   * Compute profit-first metrics from raw input
   */
  compute(input: RawMetricsInput): ProfitMetrics {
    const {
      spend = 0,
      revenue = 0,
      orders = 0,
      customers = 0,
      totalMarketingSpend = 0,
      ltv = 0,
      paybackDays = 0,
    } = input;

    const effectiveTotalSpend = totalMarketingSpend || spend;
    const aov = orders > 0 ? revenue / orders : 0;
    const cac = customers > 0 ? effectiveTotalSpend / customers : 0;
    const mer = effectiveTotalSpend > 0 ? revenue / effectiveTotalSpend : 0;
    const metaRoas = spend > 0 ? revenue / spend : 0;
    const effectiveLtv = ltv || aov * 1.5; // Estimate if not provided
    const ltvToCac = cac > 0 ? effectiveLtv / cac : 0;

    return {
      spend,
      revenue,
      orders,
      customers,
      totalMarketingSpend: effectiveTotalSpend,
      mer,
      metaRoas,
      cac,
      aov,
      ltv: effectiveLtv,
      ltvToCac,
      paybackDays,
    };
  }

  /**
   * Compare two metric snapshots and calculate changes
   */
  compareMetrics(
    current: ProfitMetrics,
    previous: ProfitMetrics
  ): Record<keyof ProfitMetrics, { value: number; change: number; changePercent: number }> {
    const result = {} as Record<keyof ProfitMetrics, { value: number; change: number; changePercent: number }>;
    
    for (const key of Object.keys(current) as (keyof ProfitMetrics)[]) {
      const currentVal = current[key];
      const prevVal = previous[key];
      const change = currentVal - prevVal;
      const changePercent = prevVal !== 0 ? (change / prevVal) * 100 : 0;
      
      result[key] = {
        value: currentVal,
        change,
        changePercent,
      };
    }
    
    return result;
  }

  /**
   * Generate health assessment based on metrics
   */
  assessHealth(metrics: ProfitMetrics): {
    overall: "healthy" | "warning" | "critical";
    issues: string[];
    opportunities: string[];
  } {
    const issues: string[] = [];
    const opportunities: string[] = [];

    // Check ROAS
    if (metrics.metaRoas < 1.0) {
      issues.push(`ROAS is ${metrics.metaRoas.toFixed(2)}, below breakeven`);
    } else if (metrics.metaRoas > 3.0) {
      opportunities.push(`High ROAS of ${metrics.metaRoas.toFixed(2)} - consider scaling`);
    }

    // Check LTV:CAC
    if (metrics.ltvToCac < 1.5) {
      issues.push(`LTV:CAC ratio of ${metrics.ltvToCac.toFixed(2)} is too low`);
    } else if (metrics.ltvToCac > 4.0) {
      opportunities.push(`Strong LTV:CAC of ${metrics.ltvToCac.toFixed(2)} - room for aggressive growth`);
    }

    // Check MER
    if (metrics.mer < 2.0) {
      issues.push(`MER of ${metrics.mer.toFixed(2)} indicates poor efficiency`);
    }

    // Check payback
    if (metrics.paybackDays > 90) {
      issues.push(`Payback period of ${metrics.paybackDays} days may strain cash flow`);
    }

    const overall = issues.length > 2 ? "critical" : issues.length > 0 ? "warning" : "healthy";

    return { overall, issues, opportunities };
  }
}

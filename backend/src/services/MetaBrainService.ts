import type {
  ProfitMetrics,
  MetaBrainInput,
  MetaBrainOutput,
  MetaBrainContext,
  MetaBrainRecommendation,
  TrackingHealth,
} from "@shopify-ad-intelligence/common";
import { z } from "zod";
import { META_BRAIN_PROMPT } from "../config/metaBrainPrompt";
import { MetricsService } from "./MetricsService";
import { RulesEngine } from "./RulesEngine";
import { LLMClient } from "./LLMClient";
import { prisma } from "../db/client";
import { TrackingService } from "./TrackingService";

export interface GetRecommendationsParams {
  tenantId: string;
  metrics: ProfitMetrics;
  trackingHealth?: TrackingHealth;
  recentActions?: string[];
}

export class MetaBrainService {
  private metricsService: MetricsService;
  private rulesEngine: RulesEngine;
  private llmClient: LLMClient;
  private trackingService: TrackingService;

  constructor() {
    this.metricsService = new MetricsService();
    this.rulesEngine = new RulesEngine();
    this.llmClient = new LLMClient();
    this.trackingService = new TrackingService();
  }

  /**
   * Generate AI-powered recommendations based on metrics and context
   */
  async getRecommendations(params: GetRecommendationsParams): Promise<MetaBrainOutput> {
    const { tenantId, metrics: fallbackMetrics, trackingHealth, recentActions = [] } = params;

    const currentMetrics =
      (await this.getMetricsFromDB(tenantId)) ||
      fallbackMetrics;
    const historicalMetrics = await this.getHistoricalMetrics(tenantId, 7);
    const campaigns = await this.getCampaignPerformance(tenantId);
    const trackingStatus =
      trackingHealth || (await this.trackingService.getTrackingHealth(tenantId));
    const activeRules = await this.getActiveRules(tenantId);

    const topPerformers = campaigns.filter((c) => c.roas > 3).map((c) => c.name);
    const underPerformers = campaigns.filter((c) => c.roas < 1).map((c) => c.name);

    const contextForPrompt: EnrichedContext = {
      current: currentMetrics,
      trend: this.calculateTrends(historicalMetrics),
      topPerformers,
      underPerformers,
      trackingHealth: trackingStatus,
      activeRules,
      recentActions,
    };

    const context: MetaBrainContext = {
      trackingHealth: trackingStatus,
      recentActions,
      activeCampaignCount: campaigns.length,
      topPerformers,
      underPerformers,
    };

    const input: MetaBrainInput = {
      shopId: tenantId,
      metrics: currentMetrics,
      context,
    };

    const rulesEvaluation = this.rulesEngine.evaluateAll(currentMetrics);
    const healthAssessment = this.metricsService.assessHealth(currentMetrics);
    const ruleBasedRecommendations = this.generateRuleBasedRecommendations(
      rulesEvaluation.triggered,
      healthAssessment
    );

    if (this.llmClient.isConfigured()) {
      try {
        return await this.generateAIRecommendations({
          tenantId,
          metrics: currentMetrics,
          metaContext: context,
          aiContext: contextForPrompt,
        });
      } catch (error) {
        console.error("MetaBrain AI recommendations failed, using rule-based output:", error);
      }
    }

    const summary = this.generateSummary(
      currentMetrics,
      healthAssessment,
      rulesEvaluation.triggered.length
    );

    return {
      input,
      summary,
      recommendations: ruleBasedRecommendations,
      actions: ruleBasedRecommendations.map((r) => r.title),
      prompt: META_BRAIN_PROMPT,
    };
  }

  /**
   * Generate recommendations from triggered rules
   */
  private generateRuleBasedRecommendations(
    triggeredRules: { id: string; name: string; triggered: boolean; reason: string }[],
    healthAssessment: { overall: string; issues: string[]; opportunities: string[] }
  ): MetaBrainRecommendation[] {
    const recommendations: MetaBrainRecommendation[] = [];

    // Add recommendations from triggered rules
    for (const rule of triggeredRules) {
      const isProtection = rule.id.startsWith("protect");
      const isScaling = rule.id.startsWith("scale");

      recommendations.push({
        id: `rec_${rule.id}`,
        type: isProtection ? "pause" : isScaling ? "scale" : "monitor",
        priority: isProtection ? "high" : "medium",
        title: rule.name,
        description: rule.reason,
        expectedImpact: isProtection
          ? "Prevent further losses"
          : "Potential revenue increase",
      });
    }

    // Add recommendations from health issues
    for (const issue of healthAssessment.issues) {
      if (!recommendations.some((r) => r.description.includes(issue))) {
        recommendations.push({
          id: `rec_health_${Date.now()}`,
          type: "fix",
          priority: "high",
          title: "Address Performance Issue",
          description: issue,
          expectedImpact: "Improve overall efficiency",
        });
      }
    }

    // Add recommendations from opportunities
    for (const opportunity of healthAssessment.opportunities) {
      recommendations.push({
        id: `rec_opp_${Date.now()}`,
        type: "scale",
        priority: "medium",
        title: "Growth Opportunity",
        description: opportunity,
        expectedImpact: "Potential revenue growth",
      });
    }

    return recommendations;
  }

  /**
   * Generate a plain-language summary
   */
  private generateSummary(
    metrics: ProfitMetrics,
    healthAssessment: { overall: string; issues: string[]; opportunities: string[] },
    triggeredRulesCount: number
  ): string {
    const status = healthAssessment.overall === "healthy"
      ? "performing well"
      : healthAssessment.overall === "warning"
      ? "showing some concerns"
      : "needs attention";

    const parts = [
      `Your ad account is ${status}.`,
      `Current MER: ${metrics.mer.toFixed(2)}, ROAS: ${metrics.metaRoas.toFixed(2)}, LTV:CAC: ${metrics.ltvToCac.toFixed(2)}.`,
    ];

    if (triggeredRulesCount > 0) {
      parts.push(`${triggeredRulesCount} rule(s) triggered requiring action.`);
    }

    if (healthAssessment.issues.length > 0) {
      parts.push(`Key issue: ${healthAssessment.issues[0]}`);
    }

    if (healthAssessment.opportunities.length > 0) {
      parts.push(`Opportunity: ${healthAssessment.opportunities[0]}`);
    }

    return parts.join(" ");
  }

  /**
   * Get AI-enhanced recommendations using LLM
   */
  async getEnhancedRecommendations(params: GetRecommendationsParams): Promise<MetaBrainOutput> {
    return this.getRecommendations(params);
  }

  private async getMetricsFromDB(tenantId: string): Promise<ProfitMetrics | null> {
    const latest = await prisma.metricsDaily.findFirst({
      where: { tenantId, dimensionType: "account" },
      orderBy: { date: "desc" },
    });

    if (!latest) {
      return null;
    }

    return this.metricsService.compute({
      spend: Number(latest.spend),
      revenue: Number(latest.revenue),
      orders: latest.orders,
      customers: latest.customers,
      totalMarketingSpend: Number(latest.spend),
    });
  }

  private async getHistoricalMetrics(tenantId: string, days: number): Promise<ProfitMetrics[]> {
    const rows = await prisma.metricsDaily.findMany({
      where: { tenantId, dimensionType: "account" },
      orderBy: { date: "desc" },
      take: days,
    });

    return rows.map((row) =>
      this.metricsService.compute({
        spend: Number(row.spend),
        revenue: Number(row.revenue),
        orders: row.orders,
        customers: row.customers,
        totalMarketingSpend: Number(row.spend),
      })
    );
  }

  private async getCampaignPerformance(
    tenantId: string
  ): Promise<{ id: string; name: string; roas: number; spend: number; revenue: number }[]> {
    const campaigns = await prisma.campaign.findMany({
      where: { tenantId },
      include: {
        metrics: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });

    return campaigns.map((campaign) => {
      const latestMetrics = campaign.metrics[0];
      const spend = latestMetrics ? Number(latestMetrics.spend) : 0;
      const revenue = latestMetrics ? Number(latestMetrics.revenue) : 0;
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        roas,
        spend,
        revenue,
      };
    });
  }

  private async getActiveRules(tenantId: string): Promise<string[]> {
    const rules = await prisma.rule.findMany({
      where: { tenantId, active: true },
      select: { name: true },
    });

    return rules.map((rule) => rule.name);
  }

  private calculateTrends(history: ProfitMetrics[]): TrendSummary {
    if (history.length < 2) {
      return {
        window: history.length,
        mer: { value: history[0]?.mer ?? 0, change: 0 },
        roas: { value: history[0]?.metaRoas ?? 0, change: 0 },
        spend: { value: history[0]?.spend ?? 0, changePercent: 0 },
        revenue: { value: history[0]?.revenue ?? 0, changePercent: 0 },
      };
    }

    const latest = history[0];
    const oldest = history[history.length - 1];

    return {
      window: history.length,
      mer: { value: latest.mer, change: latest.mer - oldest.mer },
      roas: { value: latest.metaRoas, change: latest.metaRoas - oldest.metaRoas },
      spend: { value: latest.spend, changePercent: this.percentChange(latest.spend, oldest.spend) },
      revenue: {
        value: latest.revenue,
        changePercent: this.percentChange(latest.revenue, oldest.revenue),
      },
    };
  }

  private percentChange(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  }

  private async generateAIRecommendations(params: {
    tenantId: string;
    metrics: ProfitMetrics;
    metaContext: MetaBrainContext;
    aiContext: EnrichedContext;
  }): Promise<MetaBrainOutput> {
    const { tenantId, metrics, metaContext, aiContext } = params;

    const aiResponse = await this.llmClient.completeJSON(
      META_BRAIN_PROMPT,
      this.buildAIPrompt(aiContext),
      aiRecommendationsSchema
    );

    const recommendations = aiResponse.recommendations.map((rec, index) => ({
      id: `ai_rec_${index}`,
      type: normalizeRecommendationType(rec.type),
      priority: normalizePriority(rec.priority),
      title: rec.title,
      description: rec.description,
      expectedImpact: rec.expectedImpact,
    }));

    const input: MetaBrainInput = {
      shopId: tenantId,
      metrics,
      context: metaContext,
    };

    return {
      input,
      summary: aiResponse.summary,
      recommendations,
      actions: aiResponse.actions && aiResponse.actions.length > 0
        ? aiResponse.actions
        : recommendations.map((rec) => rec.title),
      prompt: META_BRAIN_PROMPT,
    };
  }

  private buildAIPrompt(context: EnrichedContext): string {
    const tracking = context.trackingHealth;

    return `
Given the following account data:

CURRENT METRICS:
- MER: ${context.current.mer.toFixed(2)}
- ROAS: ${context.current.metaRoas.toFixed(2)}
- CAC: $${context.current.cac.toFixed(0)}
- LTV:CAC: ${context.current.ltvToCac.toFixed(2)}

TRENDS (${context.trend.window}-day):
${JSON.stringify(context.trend, null, 2)}

TOP PERFORMERS: ${context.topPerformers.join(", ") || "None"}
UNDER PERFORMERS: ${context.underPerformers.join(", ") || "None"}

TRACKING HEALTH:
- Pixel: ${tracking?.pixelStatus ?? "unknown"}
- CAPI: ${tracking?.capiStatus ?? "unknown"}
- EMQ: ${tracking?.eventMatchQuality ?? 0}/10

ACTIVE RULES: ${context.activeRules.join(", ") || "None"}
RECENT ACTIONS: ${context.recentActions?.join(", ") || "None"}

Provide 3-5 actionable recommendations. For each:
1. Priority (high/medium/low)
2. Type (scale/pause/test/fix/monitor)
3. Title (clear action)
4. Description (why and what)
5. Expected impact.

Respond in JSON with shape:
{
  "summary": string,
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "type": "scale" | "pause" | "test" | "fix" | "monitor",
      "title": string,
      "description": string,
      "expectedImpact": string
    }
  ],
  "actions": string[]
}
`;
  }
}

type TrendSummary = {
  window: number;
  mer: { value: number; change: number };
  roas: { value: number; change: number };
  spend: { value: number; changePercent: number };
  revenue: { value: number; changePercent: number };
};

type EnrichedContext = {
  current: ProfitMetrics;
  trend: TrendSummary;
  topPerformers: string[];
  underPerformers: string[];
  trackingHealth?: TrackingHealth;
  activeRules: string[];
  recentActions: string[];
};

const aiRecommendationsSchema = z.object({
  summary: z.string(),
  recommendations: z
    .array(
      z.object({
        priority: z.string(),
        type: z.string(),
        title: z.string(),
        description: z.string(),
        expectedImpact: z.string().optional(),
      })
    )
    .min(1),
  actions: z.array(z.string()).optional(),
});

const recommendationTypes = ["scale", "pause", "test", "fix", "monitor"] as const;
const recommendationPriorities = ["high", "medium", "low"] as const;

function normalizeRecommendationType(
  value?: string
): MetaBrainRecommendation["type"] {
  return recommendationTypes.includes(value as any)
    ? (value as MetaBrainRecommendation["type"])
    : "monitor";
}

function normalizePriority(value?: string): MetaBrainRecommendation["priority"] {
  return recommendationPriorities.includes(value as any)
    ? (value as MetaBrainRecommendation["priority"])
    : "medium";
}

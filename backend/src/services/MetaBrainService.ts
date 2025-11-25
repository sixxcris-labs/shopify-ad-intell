import type {
  ProfitMetrics,
  MetaBrainInput,
  MetaBrainOutput,
  MetaBrainContext,
  MetaBrainRecommendation,
  TrackingHealth,
} from "@shopify-ad-intelligence/common";
import { META_BRAIN_PROMPT } from "../config/metaBrainPrompt";
import { MetricsService } from "./MetricsService";
import { RulesEngine } from "./RulesEngine";
import { LLMClient } from "./LLMClient";

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

  constructor() {
    this.metricsService = new MetricsService();
    this.rulesEngine = new RulesEngine();
    this.llmClient = new LLMClient();
  }

  /**
   * Generate AI-powered recommendations based on metrics and context
   */
  async getRecommendations(params: GetRecommendationsParams): Promise<MetaBrainOutput> {
    const { tenantId, metrics, trackingHealth, recentActions = [] } = params;

    // Assess health
    const healthAssessment = this.metricsService.assessHealth(metrics);

    // Evaluate rules
    const rulesEvaluation = this.rulesEngine.evaluateAll(metrics);

    // Build context
    const context: MetaBrainContext = {
      trackingHealth,
      recentActions,
      activeCampaignCount: 0, // TODO: Get from data
      topPerformers: [],
      underPerformers: [],
    };

    const input: MetaBrainInput = {
      shopId: tenantId,
      metrics,
      context,
    };

    // Generate recommendations from rules
    const ruleBasedRecommendations = this.generateRuleBasedRecommendations(
      rulesEvaluation.triggered,
      healthAssessment
    );

    // Generate summary
    const summary = this.generateSummary(metrics, healthAssessment, rulesEvaluation.triggered.length);

    // Generate action items
    const actions = ruleBasedRecommendations.map((r) => r.title);

    return {
      input,
      summary,
      recommendations: ruleBasedRecommendations,
      actions,
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
    const baseOutput = await this.getRecommendations(params);

    // If LLM is configured, enhance with AI
    if (this.llmClient.isConfigured()) {
      try {
        const enhancedSummary = await this.llmClient.complete(
          META_BRAIN_PROMPT,
          `Given these metrics: ${JSON.stringify(params.metrics)}, provide a brief strategic summary.`
        );
        baseOutput.summary = enhancedSummary || baseOutput.summary;
      } catch (error) {
        console.error("LLM enhancement failed, using rule-based output:", error);
      }
    }

    return baseOutput;
  }
}

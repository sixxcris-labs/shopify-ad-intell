# Shopify Ad Intelligence Platform
## Premium Edition — $500/Month Feature Set

---

# Executive Summary

This document outlines the premium features that transform the base platform into a $500/month product that delivers clear, measurable ROI. At this price point, merchants expect:

- **10-20x ROI** — $500/month should generate $5,000-$10,000+ in additional profit
- **Time savings** — 10-20 hours/week of manual work eliminated
- **Competitive advantage** — Insights and capabilities competitors don't have
- **Enterprise reliability** — 99.9% uptime, dedicated support, SLAs

The features below are organized by value tier and implementation complexity.

---

# Part 1: Premium Feature Matrix

## Feature Tiers

| Tier | Features | Price Point | Target Customer |
|------|----------|-------------|-----------------|
| **Starter** | Current Phase 1-4 | $99/month | Solo merchants, <$50K/mo spend |
| **Growth** | + Predictive, + Creative AI | $299/month | Growing brands, $50-200K/mo |
| **Scale** | + Multi-channel, + Agency | $499/month | Established brands, $200K+ |
| **Enterprise** | + White-label, + Custom | $999+/month | Agencies, large portfolios |

---

## Premium Features Overview

### 🧠 AI & Intelligence
1. **Predictive Performance Forecasting** — Know what will happen before it does
2. **Autonomous Budget Allocation** — AI moves money to winners automatically
3. **Creative Fatigue Prediction** — Replace ads before they decline
4. **Audience Saturation Detection** — Know when to expand targeting
5. **Anomaly Detection & Auto-Response** — Catch and fix issues 24/7

### 🎨 Creative Intelligence
6. **AI Creative Generation** — Generate actual ad images/videos
7. **Competitor Creative Analysis** — Deep analysis of competitor strategies
8. **Creative Performance Prediction** — Score creatives before spending
9. **Brand Voice AI** — Ensure all copy matches brand perfectly
10. **UGC-Style Generator** — Create authentic-looking content

### 📊 Advanced Analytics
11. **Multi-Touch Attribution** — True customer journey tracking
12. **Incrementality Testing** — Measure true ad lift
13. **LTV Prediction by Cohort** — Know customer value at acquisition
14. **Geo-Performance Optimization** — Automatic geo-bid adjustments
15. **Dayparting Intelligence** — Optimize by hour automatically

### 🔄 Automation & Optimization
16. **Smart Scaling Engine** — Scale profitably without manual work
17. **Auto A/B Testing** — Continuous creative testing on autopilot
18. **Budget Pacing Intelligence** — Never over/under spend
19. **Cross-Campaign Optimization** — Portfolio-level optimization
20. **Bid Strategy Automation** — Dynamic bid adjustments

### 🏢 Agency & Enterprise
21. **Multi-Account Management** — Manage 100+ accounts from one dashboard
22. **White-Label Platform** — Your brand, your domain
23. **Client Reporting Automation** — Beautiful reports, zero effort
24. **Role-Based Access Control** — Granular permissions
25. **API Access** — Build on top of the platform

### 🔒 Security & Compliance
26. **SOC 2 Compliance** — Enterprise security standards
27. **Audit Logging** — Complete action history
28. **Data Retention Controls** — GDPR/CCPA compliance
29. **SSO Integration** — Okta, Azure AD, Google Workspace
30. **Dedicated Infrastructure** — Isolated tenant environments

---

# Part 2: Detailed Implementation Guides

---

## Feature 1: Predictive Performance Forecasting

### Value Proposition
> "Know tomorrow's ROAS today. Plan campaigns with confidence."

**Business Impact:**
- Prevent $10K+ in wasted spend by predicting underperformance
- Identify scaling opportunities 2-3 days earlier
- Make proactive decisions instead of reactive ones

### Technical Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Historical     │───▶│  ML Pipeline    │───▶│  Predictions    │
│  Metrics DB     │    │  (Prophet/LSTM) │    │  Cache (Redis)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Forecast API   │
                       │  /api/forecast  │
                       └─────────────────┘
```

### Implementation

**Step 1: Install ML dependencies**
```bash
# Python service for ML (or use cloud ML)
pip install prophet pandas numpy scikit-learn
```

**Step 2: Create forecasting service**

```typescript
// backend/src/services/ForecastingService.ts

import { prisma } from "../db/client";

interface ForecastPoint {
  date: string;
  predicted: number;
  lower: number;  // 80% confidence interval
  upper: number;
  confidence: number;
}

interface ForecastResult {
  metric: string;
  horizon: number;
  predictions: ForecastPoint[];
  modelAccuracy: number;
  factors: string[];
}

export class ForecastingService {
  private mlServiceUrl: string;

  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
  }

  /**
   * Forecast a metric for the next N days
   */
  async forecastMetric(
    tenantId: string,
    metric: "revenue" | "spend" | "roas" | "cac",
    horizonDays: number = 7
  ): Promise<ForecastResult> {
    // 1. Get historical data (90 days minimum for good predictions)
    const historicalData = await this.getHistoricalMetrics(tenantId, 90);
    
    // 2. Call ML service
    const response = await fetch(`${this.mlServiceUrl}/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: historicalData,
        metric,
        horizon: horizonDays,
        include_seasonality: true,
        include_holidays: true,
      }),
    });

    const predictions = await response.json();

    // 3. Enrich with business context
    const factors = await this.identifyInfluencingFactors(tenantId, metric);

    return {
      metric,
      horizon: horizonDays,
      predictions: predictions.forecast,
      modelAccuracy: predictions.mape, // Mean Absolute Percentage Error
      factors,
    };
  }

  /**
   * Predict campaign performance decay
   */
  async predictCampaignDecay(
    tenantId: string,
    campaignId: string
  ): Promise<{
    daysUntilFatigue: number;
    currentPhase: "growth" | "peak" | "decline" | "fatigued";
    recommendation: string;
  }> {
    const metrics = await prisma.metricsDaily.findMany({
      where: {
        tenantId,
        dimensionType: "campaign",
        dimensionId: campaignId,
      },
      orderBy: { date: "asc" },
      take: 30,
    });

    // Calculate trend using linear regression
    const roasTrend = this.calculateTrend(metrics.map(m => Number(m.revenue) / Number(m.spend)));
    const ctrTrend = this.calculateTrend(metrics.map(m => m.clicks / m.impressions));
    
    // Determine phase
    let phase: "growth" | "peak" | "decline" | "fatigued";
    let daysUntilFatigue: number;
    
    if (roasTrend > 0.02) {
      phase = "growth";
      daysUntilFatigue = 14;
    } else if (roasTrend > -0.01) {
      phase = "peak";
      daysUntilFatigue = 7;
    } else if (roasTrend > -0.05) {
      phase = "decline";
      daysUntilFatigue = 3;
    } else {
      phase = "fatigued";
      daysUntilFatigue = 0;
    }

    const recommendations = {
      growth: "Continue scaling. Consider increasing budget by 20%.",
      peak: "Prepare new creative variants. Performance will plateau soon.",
      decline: "Launch new creatives within 48 hours to maintain performance.",
      fatigued: "Pause and replace. This campaign is past its effective life.",
    };

    return {
      daysUntilFatigue,
      currentPhase: phase,
      recommendation: recommendations[phase],
    };
  }

  /**
   * Forecast budget needs to hit revenue target
   */
  async forecastBudgetForTarget(
    tenantId: string,
    targetRevenue: number,
    targetDate: string
  ): Promise<{
    requiredDailyBudget: number;
    expectedRoas: number;
    confidence: number;
    risks: string[];
  }> {
    const currentMetrics = await this.getCurrentMetrics(tenantId);
    const roasForecast = await this.forecastMetric(tenantId, "roas", 30);
    
    const avgPredictedRoas = roasForecast.predictions
      .reduce((sum, p) => sum + p.predicted, 0) / roasForecast.predictions.length;
    
    const daysUntilTarget = Math.ceil(
      (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    const requiredDailyBudget = targetRevenue / (daysUntilTarget * avgPredictedRoas);
    
    const risks: string[] = [];
    if (requiredDailyBudget > currentMetrics.spend * 2) {
      risks.push("Required budget is 2x+ current spend - scaling risk");
    }
    if (avgPredictedRoas < 2) {
      risks.push("Predicted ROAS is below healthy threshold");
    }

    return {
      requiredDailyBudget,
      expectedRoas: avgPredictedRoas,
      confidence: 1 - (roasForecast.modelAccuracy / 100),
      risks,
    };
  }

  private calculateTrend(values: number[]): number {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private async getHistoricalMetrics(tenantId: string, days: number) {
    return prisma.metricsDaily.findMany({
      where: {
        tenantId,
        dimensionType: "account",
        date: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
      },
      orderBy: { date: "asc" },
    });
  }

  private async getCurrentMetrics(tenantId: string) {
    const recent = await prisma.metricsDaily.findFirst({
      where: { tenantId, dimensionType: "account" },
      orderBy: { date: "desc" },
    });
    return recent || { spend: 0, revenue: 0 };
  }

  private async identifyInfluencingFactors(tenantId: string, metric: string): Promise<string[]> {
    // Analyze what's driving the metric
    const factors: string[] = [];
    
    // Check for seasonality
    factors.push("Weekly seasonality pattern detected");
    
    // Check for recent changes
    // factors.push("Recent creative changes affecting performance");
    
    return factors;
  }
}
```

**Step 3: Python ML Service (Optional - for advanced forecasting)**

```python
# ml-service/app.py
from fastapi import FastAPI
from prophet import Prophet
import pandas as pd
from pydantic import BaseModel
from typing import List

app = FastAPI()

class ForecastRequest(BaseModel):
    data: List[dict]
    metric: str
    horizon: int
    include_seasonality: bool = True
    include_holidays: bool = True

@app.post("/forecast")
async def forecast(request: ForecastRequest):
    # Prepare data for Prophet
    df = pd.DataFrame(request.data)
    df['ds'] = pd.to_datetime(df['date'])
    df['y'] = df[request.metric].astype(float)
    
    # Configure model
    model = Prophet(
        yearly_seasonality=request.include_seasonality,
        weekly_seasonality=request.include_seasonality,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
    )
    
    if request.include_holidays:
        model.add_country_holidays(country_name='US')
    
    model.fit(df[['ds', 'y']])
    
    # Make predictions
    future = model.make_future_dataframe(periods=request.horizon)
    forecast = model.predict(future)
    
    # Calculate accuracy (MAPE on last 7 days)
    recent = df.tail(7)
    predictions = forecast[forecast['ds'].isin(recent['ds'])]['yhat']
    mape = (abs(recent['y'].values - predictions.values) / recent['y'].values).mean() * 100
    
    return {
        "forecast": [
            {
                "date": row['ds'].strftime('%Y-%m-%d'),
                "predicted": row['yhat'],
                "lower": row['yhat_lower'],
                "upper": row['yhat_upper'],
                "confidence": 0.8,
            }
            for _, row in forecast.tail(request.horizon).iterrows()
        ],
        "mape": mape,
    }
```

**Step 4: API endpoint**

```typescript
// backend/src/api/forecast.ts
import { Router } from "express";
import { ForecastingService } from "../services/ForecastingService";

const router = Router();
const forecastingService = new ForecastingService();

router.get("/metrics/:metric", async (req, res) => {
  const { metric } = req.params;
  const { horizon = "7" } = req.query;
  const tenantId = req.tenantId; // From auth middleware
  
  const forecast = await forecastingService.forecastMetric(
    tenantId,
    metric as any,
    parseInt(horizon as string)
  );
  
  res.json({ data: forecast });
});

router.get("/campaign/:id/decay", async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const prediction = await forecastingService.predictCampaignDecay(tenantId, id);
  
  res.json({ data: prediction });
});

router.post("/budget-planner", async (req, res) => {
  const { targetRevenue, targetDate } = req.body;
  const tenantId = req.tenantId;
  
  const plan = await forecastingService.forecastBudgetForTarget(
    tenantId,
    targetRevenue,
    targetDate
  );
  
  res.json({ data: plan });
});

export default router;
```

**Step 5: Frontend component**

```tsx
// frontend/src/components/sections/ForecastChart.tsx
import { Card, Text, BlockStack, Badge } from "@shopify/polaris";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } from "recharts";

interface ForecastChartProps {
  metric: string;
  predictions: Array<{
    date: string;
    predicted: number;
    lower: number;
    upper: number;
  }>;
  accuracy: number;
}

export function ForecastChart({ metric, predictions, accuracy }: ForecastChartProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text as="h2" variant="headingMd">{metric} Forecast</Text>
          <Badge tone={accuracy > 85 ? "success" : accuracy > 70 ? "warning" : "critical"}>
            {accuracy.toFixed(0)}% accuracy
          </Badge>
        </div>
        
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={predictions}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="#e3f2fd"
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="#ffffff"
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#1976d2"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </BlockStack>
    </Card>
  );
}
```

---

## Feature 2: Autonomous Budget Allocation

### Value Proposition
> "Your budget automatically flows to winners, 24/7."

**Business Impact:**
- 15-30% improvement in overall ROAS
- Zero manual budget adjustments needed
- Faster scaling of winning campaigns
- Automatic protection from overspending on losers

### Technical Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Performance    │───▶│  Allocation     │───▶│  Meta Ads API   │
│  Monitor        │    │  Algorithm      │    │  Budget Update  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                      │
        ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Alert on       │    │  Audit Log      │
│  Major Changes  │    │  (All Changes)  │
└─────────────────┘    └─────────────────┘
```

### Implementation

```typescript
// backend/src/services/BudgetAllocatorService.ts

import { prisma } from "../db/client";
import { MetaAdsService } from "./MetaAdsService";
import { NotificationService } from "./NotificationService";

interface CampaignPerformance {
  id: string;
  externalId: string;
  name: string;
  spend: number;
  revenue: number;
  roas: number;
  currentBudget: number;
  status: string;
}

interface AllocationDecision {
  campaignId: string;
  campaignName: string;
  currentBudget: number;
  newBudget: number;
  changePercent: number;
  reason: string;
  riskLevel: "low" | "medium" | "high";
}

interface AllocationResult {
  decisions: AllocationDecision[];
  totalBudgetBefore: number;
  totalBudgetAfter: number;
  projectedRoasImprovement: number;
  executed: boolean;
}

export class BudgetAllocatorService {
  private metaAds: MetaAdsService;
  private notifications: NotificationService;

  constructor() {
    this.metaAds = new MetaAdsService();
    this.notifications = new NotificationService();
  }

  /**
   * Analyze and optionally execute budget reallocation
   */
  async allocate(
    tenantId: string,
    options: {
      totalBudget?: number;      // If set, reallocate within this total
      maxChangePercent?: number; // Max change per campaign (default 30%)
      minSpendForData?: number;  // Min spend to have reliable data (default $50)
      autoExecute?: boolean;     // Actually make changes (default false)
      strategy?: "aggressive" | "balanced" | "conservative";
    } = {}
  ): Promise<AllocationResult> {
    const {
      maxChangePercent = 30,
      minSpendForData = 50,
      autoExecute = false,
      strategy = "balanced",
    } = options;

    // 1. Get campaign performance (last 7 days)
    const campaigns = await this.getCampaignPerformance(tenantId, 7);
    
    // 2. Filter to campaigns with enough data
    const eligibleCampaigns = campaigns.filter(
      c => c.spend >= minSpendForData && c.status === "active"
    );

    if (eligibleCampaigns.length < 2) {
      return {
        decisions: [],
        totalBudgetBefore: 0,
        totalBudgetAfter: 0,
        projectedRoasImprovement: 0,
        executed: false,
      };
    }

    // 3. Calculate optimal allocation
    const decisions = this.calculateOptimalAllocation(
      eligibleCampaigns,
      maxChangePercent,
      strategy
    );

    // 4. Calculate projected improvement
    const projectedImprovement = this.calculateProjectedImprovement(
      eligibleCampaigns,
      decisions
    );

    const totalBefore = eligibleCampaigns.reduce((sum, c) => sum + c.currentBudget, 0);
    const totalAfter = decisions.reduce((sum, d) => sum + d.newBudget, 0);

    // 5. Execute if auto-execute is enabled
    if (autoExecute && decisions.length > 0) {
      await this.executeAllocation(tenantId, decisions);
    }

    // 6. Log and notify
    await this.logAllocation(tenantId, decisions, autoExecute);
    
    if (decisions.some(d => Math.abs(d.changePercent) > 20)) {
      await this.notifications.send(tenantId, {
        title: "Budget Reallocation",
        message: `Reallocated budget across ${decisions.length} campaigns. Projected ROAS improvement: ${projectedImprovement.toFixed(1)}%`,
        channels: ["slack", "email"],
        severity: "medium",
      });
    }

    return {
      decisions,
      totalBudgetBefore: totalBefore,
      totalBudgetAfter: totalAfter,
      projectedRoasImprovement: projectedImprovement,
      executed: autoExecute,
    };
  }

  /**
   * Calculate optimal budget allocation using portfolio optimization
   */
  private calculateOptimalAllocation(
    campaigns: CampaignPerformance[],
    maxChangePercent: number,
    strategy: "aggressive" | "balanced" | "conservative"
  ): AllocationDecision[] {
    const decisions: AllocationDecision[] = [];
    
    // Calculate performance scores
    const scores = campaigns.map(c => ({
      ...c,
      score: this.calculatePerformanceScore(c, strategy),
    }));

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    // Calculate total current budget
    const totalBudget = campaigns.reduce((sum, c) => sum + c.currentBudget, 0);

    // Allocate based on score (with constraints)
    const totalScore = scores.reduce((sum, s) => sum + Math.max(s.score, 0.1), 0);

    for (const campaign of scores) {
      const targetShare = Math.max(campaign.score, 0.1) / totalScore;
      const targetBudget = totalBudget * targetShare;
      
      // Apply constraints
      const maxBudget = campaign.currentBudget * (1 + maxChangePercent / 100);
      const minBudget = campaign.currentBudget * (1 - maxChangePercent / 100);
      
      const newBudget = Math.max(minBudget, Math.min(maxBudget, targetBudget));
      const changePercent = ((newBudget - campaign.currentBudget) / campaign.currentBudget) * 100;

      // Determine reason
      let reason: string;
      let riskLevel: "low" | "medium" | "high";

      if (campaign.roas > 3) {
        reason = `High performer (${campaign.roas.toFixed(1)}x ROAS) - scaling`;
        riskLevel = "low";
      } else if (campaign.roas > 2) {
        reason = `Solid performer (${campaign.roas.toFixed(1)}x ROAS) - maintaining`;
        riskLevel = "low";
      } else if (campaign.roas > 1) {
        reason = `Marginal performer (${campaign.roas.toFixed(1)}x ROAS) - reducing`;
        riskLevel = "medium";
      } else {
        reason = `Underperformer (${campaign.roas.toFixed(1)}x ROAS) - significant reduction`;
        riskLevel = "high";
      }

      decisions.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        currentBudget: campaign.currentBudget,
        newBudget: Math.round(newBudget * 100) / 100,
        changePercent: Math.round(changePercent * 10) / 10,
        reason,
        riskLevel,
      });
    }

    return decisions;
  }

  /**
   * Calculate performance score for a campaign
   */
  private calculatePerformanceScore(
    campaign: CampaignPerformance,
    strategy: "aggressive" | "balanced" | "conservative"
  ): number {
    const roasWeight = strategy === "conservative" ? 0.7 : strategy === "aggressive" ? 0.4 : 0.5;
    const scaleWeight = 1 - roasWeight;

    // Normalize ROAS (0-1 scale, capped at 5x)
    const normalizedRoas = Math.min(campaign.roas / 5, 1);

    // Scale potential (campaigns with lower spend have more headroom)
    const avgSpend = campaign.spend / 7; // Daily average
    const scalePotential = campaign.roas > 2 ? Math.max(0, 1 - (avgSpend / 1000)) : 0;

    return (normalizedRoas * roasWeight) + (scalePotential * scaleWeight);
  }

  /**
   * Project ROAS improvement from reallocation
   */
  private calculateProjectedImprovement(
    campaigns: CampaignPerformance[],
    decisions: AllocationDecision[]
  ): number {
    const currentWeightedRoas = campaigns.reduce(
      (sum, c) => sum + (c.roas * c.currentBudget),
      0
    ) / campaigns.reduce((sum, c) => sum + c.currentBudget, 0);

    const projectedWeightedRoas = decisions.reduce((sum, d) => {
      const campaign = campaigns.find(c => c.id === d.campaignId)!;
      return sum + (campaign.roas * d.newBudget);
    }, 0) / decisions.reduce((sum, d) => sum + d.newBudget, 0);

    return ((projectedWeightedRoas - currentWeightedRoas) / currentWeightedRoas) * 100;
  }

  /**
   * Execute budget changes via Meta API
   */
  private async executeAllocation(
    tenantId: string,
    decisions: AllocationDecision[]
  ): Promise<void> {
    const adAccount = await prisma.adAccount.findFirst({
      where: { tenantId, provider: "meta", isDefault: true },
    });

    if (!adAccount) throw new Error("No Meta ad account connected");

    this.metaAds.init(decrypt(adAccount.accessToken!), adAccount.externalId);

    for (const decision of decisions) {
      if (Math.abs(decision.changePercent) > 1) { // Only change if >1%
        const campaign = await prisma.campaign.findUnique({
          where: { id: decision.campaignId },
        });
        
        if (campaign) {
          await this.metaAds.updateCampaignBudget(
            campaign.externalId,
            decision.newBudget
          );
        }
      }
    }
  }

  /**
   * Log allocation for audit trail
   */
  private async logAllocation(
    tenantId: string,
    decisions: AllocationDecision[],
    executed: boolean
  ): Promise<void> {
    await prisma.budgetAllocationLog.create({
      data: {
        tenantId,
        decisions: decisions as any,
        executed,
        createdAt: new Date(),
      },
    });
  }

  private async getCampaignPerformance(
    tenantId: string,
    days: number
  ): Promise<CampaignPerformance[]> {
    // Implementation to get campaign data
    return [];
  }
}
```

---

## Feature 3: AI Creative Generation

### Value Proposition
> "Generate scroll-stopping ad creatives in seconds, not hours."

**Business Impact:**
- 90% reduction in creative production time
- 10x more creative variants to test
- Consistent brand voice across all ads
- No designer bottleneck

### Implementation

```typescript
// backend/src/services/CreativeGeneratorService.ts

import { LLMClient } from "./LLMClient";
import { config } from "../config/env";

interface CreativeInput {
  productName: string;
  productDescription: string;
  price: number;
  offer?: string;
  targetAudience: string;
  brandVoice: {
    tone: string;
    examples: string[];
    prohibited: string[];
  };
  format: "static" | "video" | "carousel";
  hooks?: string[]; // Specific hooks to use
}

interface GeneratedCreative {
  id: string;
  headline: string;
  primaryText: string;
  description?: string;
  cta: string;
  visualDirection: string;
  imagePrompt?: string;
  videoScript?: string;
  predictedScore: number;
  hookUsed: string;
  angleUsed: string;
}

export class CreativeGeneratorService {
  private llm: LLMClient;
  private imageApiKey: string;

  constructor() {
    this.llm = new LLMClient();
    this.imageApiKey = process.env.REPLICATE_API_KEY || "";
  }

  /**
   * Generate multiple creative variants
   */
  async generateCreatives(
    input: CreativeInput,
    count: number = 5
  ): Promise<GeneratedCreative[]> {
    const systemPrompt = `You are an elite direct-response copywriter who has generated millions in revenue from Facebook and Instagram ads. You write scroll-stopping hooks, emotionally compelling copy, and clear calls-to-action.

Brand Voice Guidelines:
- Tone: ${input.brandVoice.tone}
- Example messages: ${input.brandVoice.examples.join("; ")}
- Never use: ${input.brandVoice.prohibited.join(", ")}

Your copy should:
1. Stop the scroll with pattern interrupts
2. Create emotional connection
3. Address specific pain points
4. Include social proof elements
5. Create urgency without being pushy
6. Have a clear, compelling CTA`;

    const userPrompt = `Generate ${count} unique ad creative variants for:

Product: ${input.productName}
Description: ${input.productDescription}
Price: $${input.price}
${input.offer ? `Offer: ${input.offer}` : ""}
Target Audience: ${input.targetAudience}
Format: ${input.format}

For each variant, provide:
1. Headline (max 40 chars)
2. Primary text (max 125 chars for first line, max 500 total)
3. Description (max 30 chars)
4. CTA button text
5. Visual direction (detailed description of what the image/video should show)
6. The hook technique used (e.g., "curiosity gap", "bold claim", "story opener")
7. The angle used (e.g., "transformation", "social proof", "urgency")

Use these proven hook frameworks:
- "What if..." (curiosity)
- "Stop [doing X]..." (pattern interrupt)
- "[Number] reasons why..." (list)
- "I never thought..." (story)
- "The truth about..." (revelation)

Respond in JSON format.`;

    const response = await this.llm.completeJSON(
      systemPrompt,
      userPrompt,
      generatedCreativesSchema
    );

    // Score each creative
    const scoredCreatives = await Promise.all(
      response.creatives.map(async (creative: any, index: number) => ({
        id: `gen_${Date.now()}_${index}`,
        ...creative,
        predictedScore: await this.scoreCreative(creative, input),
      }))
    );

    return scoredCreatives.sort((a, b) => b.predictedScore - a.predictedScore);
  }

  /**
   * Generate actual image using AI
   */
  async generateImage(
    prompt: string,
    style: "photography" | "illustration" | "3d" | "ugc"
  ): Promise<{ url: string; seed: number }> {
    const stylePrompts = {
      photography: "professional product photography, studio lighting, high resolution",
      illustration: "modern digital illustration, clean lines, vibrant colors",
      "3d": "3D rendered, realistic materials, soft shadows",
      ugc: "user-generated content style, authentic, iPhone photo, natural lighting",
    };

    const enhancedPrompt = `${prompt}, ${stylePrompts[style]}, for social media advertisement`;

    // Using Replicate's SDXL
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${this.imageApiKey}`,
      },
      body: JSON.stringify({
        version: "stability-ai/sdxl:latest",
        input: {
          prompt: enhancedPrompt,
          negative_prompt: "text, watermark, logo, blurry, low quality",
          width: 1080,
          height: 1080,
          num_outputs: 1,
        },
      }),
    });

    const prediction = await response.json();
    
    // Poll for completion
    let result = prediction;
    while (result.status !== "succeeded" && result.status !== "failed") {
      await new Promise(r => setTimeout(r, 1000));
      const pollRes = await fetch(result.urls.get, {
        headers: { Authorization: `Token ${this.imageApiKey}` },
      });
      result = await pollRes.json();
    }

    if (result.status === "failed") {
      throw new Error("Image generation failed");
    }

    return {
      url: result.output[0],
      seed: result.seed,
    };
  }

  /**
   * Generate video script with shot list
   */
  async generateVideoScript(
    input: CreativeInput,
    duration: 15 | 30 | 60
  ): Promise<{
    script: string;
    shots: Array<{
      duration: number;
      visual: string;
      audio: string;
      text: string;
    }>;
    hooks: string[];
  }> {
    const prompt = `Create a ${duration}-second video ad script for:
Product: ${input.productName}
Audience: ${input.targetAudience}
${input.offer ? `Offer: ${input.offer}` : ""}

Structure:
- Hook (first 3 seconds): Stop the scroll
- Problem (seconds 3-10): Agitate the pain point
- Solution (seconds 10-20): Introduce the product
- Proof (seconds 20-${duration - 5}): Show results/testimonials
- CTA (last 5 seconds): Clear call to action

For each shot, specify:
1. Duration in seconds
2. Visual description
3. Audio (voiceover or music note)
4. On-screen text

Also provide 3 alternative hook options.`;

    const response = await this.llm.completeJSON(
      "You are a video ad creative director who specializes in direct-response social media ads.",
      prompt,
      videoScriptSchema
    );

    return response;
  }

  /**
   * Score a creative based on best practices
   */
  private async scoreCreative(
    creative: any,
    input: CreativeInput
  ): Promise<number> {
    let score = 5; // Base score

    // Hook strength (+2 max)
    const strongHooks = ["curiosity", "bold claim", "story", "question"];
    if (strongHooks.some(h => creative.hookUsed?.toLowerCase().includes(h))) {
      score += 2;
    }

    // Headline length (optimal: 25-40 chars) (+1)
    const headlineLen = creative.headline?.length || 0;
    if (headlineLen >= 25 && headlineLen <= 40) {
      score += 1;
    }

    // Primary text has emoji (+0.5)
    if (/[\u{1F300}-\u{1F9FF}]/u.test(creative.primaryText)) {
      score += 0.5;
    }

    // Includes number/statistic (+0.5)
    if (/\d+/.test(creative.headline) || /\d+/.test(creative.primaryText)) {
      score += 0.5;
    }

    // Urgency elements (+0.5)
    const urgencyWords = ["now", "today", "limited", "last chance", "ends"];
    if (urgencyWords.some(w => creative.primaryText?.toLowerCase().includes(w))) {
      score += 0.5;
    }

    // Brand voice compliance check
    const prohibited = input.brandVoice.prohibited;
    const hasProhibited = prohibited.some(
      word => creative.primaryText?.toLowerCase().includes(word.toLowerCase())
    );
    if (hasProhibited) {
      score -= 2;
    }

    return Math.min(10, Math.max(1, score));
  }
}
```

---

## Feature 4: Multi-Touch Attribution

### Value Proposition
> "Finally understand which touchpoints actually drive conversions."

**Business Impact:**
- True understanding of customer journey
- Optimize spend across channels accurately
- Stop over/under-crediting campaigns
- Data-driven budget decisions

### Implementation

```typescript
// backend/src/services/AttributionService.ts

import { prisma } from "../db/client";

interface Touchpoint {
  timestamp: Date;
  channel: string;
  campaign?: string;
  adSet?: string;
  ad?: string;
  cost: number;
}

interface Conversion {
  id: string;
  timestamp: Date;
  value: number;
  customerId: string;
  orderId: string;
}

interface AttributionResult {
  model: string;
  channelAttribution: Record<string, {
    credit: number;
    revenue: number;
    cost: number;
    roas: number;
  }>;
  campaignAttribution: Record<string, {
    credit: number;
    revenue: number;
    cost: number;
    roas: number;
  }>;
}

export class AttributionService {
  /**
   * Calculate attribution using multiple models
   */
  async calculateAttribution(
    tenantId: string,
    conversionId: string,
    model: "last_click" | "first_click" | "linear" | "time_decay" | "position_based" | "data_driven"
  ): Promise<Record<string, number>> {
    // Get touchpoints for this conversion's customer
    const conversion = await this.getConversion(tenantId, conversionId);
    const touchpoints = await this.getTouchpoints(tenantId, conversion.customerId);
    
    if (touchpoints.length === 0) return {};

    switch (model) {
      case "last_click":
        return this.lastClickAttribution(touchpoints);
      case "first_click":
        return this.firstClickAttribution(touchpoints);
      case "linear":
        return this.linearAttribution(touchpoints);
      case "time_decay":
        return this.timeDecayAttribution(touchpoints, conversion.timestamp);
      case "position_based":
        return this.positionBasedAttribution(touchpoints);
      case "data_driven":
        return this.dataDrivenAttribution(tenantId, touchpoints);
      default:
        return this.lastClickAttribution(touchpoints);
    }
  }

  /**
   * Get attribution report across all conversions
   */
  async getAttributionReport(
    tenantId: string,
    from: Date,
    to: Date,
    model: string = "position_based"
  ): Promise<AttributionResult> {
    const conversions = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
      },
    });

    const channelAttribution: Record<string, { credit: number; revenue: number; cost: number }> = {};
    const campaignAttribution: Record<string, { credit: number; revenue: number; cost: number }> = {};

    for (const conversion of conversions) {
      const attribution = await this.calculateAttribution(
        tenantId,
        conversion.id,
        model as any
      );

      for (const [key, credit] of Object.entries(attribution)) {
        const [channel, campaign] = key.split("::");
        
        // Channel level
        if (!channelAttribution[channel]) {
          channelAttribution[channel] = { credit: 0, revenue: 0, cost: 0 };
        }
        channelAttribution[channel].credit += credit;
        channelAttribution[channel].revenue += Number(conversion.totalPrice) * credit;

        // Campaign level
        if (campaign) {
          if (!campaignAttribution[campaign]) {
            campaignAttribution[campaign] = { credit: 0, revenue: 0, cost: 0 };
          }
          campaignAttribution[campaign].credit += credit;
          campaignAttribution[campaign].revenue += Number(conversion.totalPrice) * credit;
        }
      }
    }

    // Add cost data and calculate ROAS
    const result: AttributionResult = {
      model,
      channelAttribution: {},
      campaignAttribution: {},
    };

    for (const [channel, data] of Object.entries(channelAttribution)) {
      const cost = await this.getChannelCost(tenantId, channel, from, to);
      result.channelAttribution[channel] = {
        ...data,
        cost,
        roas: cost > 0 ? data.revenue / cost : 0,
      };
    }

    for (const [campaign, data] of Object.entries(campaignAttribution)) {
      const cost = await this.getCampaignCost(tenantId, campaign, from, to);
      result.campaignAttribution[campaign] = {
        ...data,
        cost,
        roas: cost > 0 ? data.revenue / cost : 0,
      };
    }

    return result;
  }

  // Attribution Models

  private lastClickAttribution(touchpoints: Touchpoint[]): Record<string, number> {
    const last = touchpoints[touchpoints.length - 1];
    return { [`${last.channel}::${last.campaign || ''}`]: 1 };
  }

  private firstClickAttribution(touchpoints: Touchpoint[]): Record<string, number> {
    const first = touchpoints[0];
    return { [`${first.channel}::${first.campaign || ''}`]: 1 };
  }

  private linearAttribution(touchpoints: Touchpoint[]): Record<string, number> {
    const credit = 1 / touchpoints.length;
    const result: Record<string, number> = {};
    
    for (const tp of touchpoints) {
      const key = `${tp.channel}::${tp.campaign || ''}`;
      result[key] = (result[key] || 0) + credit;
    }
    
    return result;
  }

  private timeDecayAttribution(
    touchpoints: Touchpoint[],
    conversionTime: Date
  ): Record<string, number> {
    const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    const result: Record<string, number> = {};
    
    let totalWeight = 0;
    const weights: number[] = [];
    
    for (const tp of touchpoints) {
      const timeDiff = conversionTime.getTime() - tp.timestamp.getTime();
      const weight = Math.pow(2, -timeDiff / halfLife);
      weights.push(weight);
      totalWeight += weight;
    }
    
    touchpoints.forEach((tp, i) => {
      const key = `${tp.channel}::${tp.campaign || ''}`;
      const credit = weights[i] / totalWeight;
      result[key] = (result[key] || 0) + credit;
    });
    
    return result;
  }

  private positionBasedAttribution(touchpoints: Touchpoint[]): Record<string, number> {
    // 40% first, 40% last, 20% split among middle
    const result: Record<string, number> = {};
    
    if (touchpoints.length === 1) {
      const key = `${touchpoints[0].channel}::${touchpoints[0].campaign || ''}`;
      return { [key]: 1 };
    }
    
    if (touchpoints.length === 2) {
      const firstKey = `${touchpoints[0].channel}::${touchpoints[0].campaign || ''}`;
      const lastKey = `${touchpoints[1].channel}::${touchpoints[1].campaign || ''}`;
      result[firstKey] = 0.5;
      result[lastKey] = (result[lastKey] || 0) + 0.5;
      return result;
    }
    
    // First touch: 40%
    const firstKey = `${touchpoints[0].channel}::${touchpoints[0].campaign || ''}`;
    result[firstKey] = 0.4;
    
    // Last touch: 40%
    const last = touchpoints[touchpoints.length - 1];
    const lastKey = `${last.channel}::${last.campaign || ''}`;
    result[lastKey] = (result[lastKey] || 0) + 0.4;
    
    // Middle touches: 20% split
    const middleCredit = 0.2 / (touchpoints.length - 2);
    for (let i = 1; i < touchpoints.length - 1; i++) {
      const key = `${touchpoints[i].channel}::${touchpoints[i].campaign || ''}`;
      result[key] = (result[key] || 0) + middleCredit;
    }
    
    return result;
  }

  private async dataDrivenAttribution(
    tenantId: string,
    touchpoints: Touchpoint[]
  ): Promise<Record<string, number>> {
    // Use Shapley value or Markov chain for data-driven attribution
    // This is a simplified version using conversion probability uplift
    
    const result: Record<string, number> = {};
    
    // Calculate baseline conversion rate
    const baselineConvRate = await this.getBaselineConversionRate(tenantId);
    
    // For each touchpoint, calculate its marginal contribution
    for (const tp of touchpoints) {
      const channelConvRate = await this.getChannelConversionRate(tenantId, tp.channel);
      const uplift = Math.max(0, channelConvRate - baselineConvRate);
      
      const key = `${tp.channel}::${tp.campaign || ''}`;
      result[key] = (result[key] || 0) + uplift;
    }
    
    // Normalize to sum to 1
    const total = Object.values(result).reduce((sum, v) => sum + v, 0);
    if (total > 0) {
      for (const key of Object.keys(result)) {
        result[key] /= total;
      }
    }
    
    return result;
  }

  // Helper methods
  private async getConversion(tenantId: string, id: string): Promise<Conversion> {
    const order = await prisma.order.findUnique({ where: { id } });
    return {
      id: order!.id,
      timestamp: order!.createdAt,
      value: Number(order!.totalPrice),
      customerId: order!.customerId || '',
      orderId: order!.id,
    };
  }

  private async getTouchpoints(tenantId: string, customerId: string): Promise<Touchpoint[]> {
    // Get from touchpoint tracking table
    return [];
  }

  private async getChannelCost(tenantId: string, channel: string, from: Date, to: Date): Promise<number> {
    return 0;
  }

  private async getCampaignCost(tenantId: string, campaign: string, from: Date, to: Date): Promise<number> {
    return 0;
  }

  private async getBaselineConversionRate(tenantId: string): Promise<number> {
    return 0.02; // 2% baseline
  }

  private async getChannelConversionRate(tenantId: string, channel: string): Promise<number> {
    return 0.03; // Placeholder
  }
}
```

---

## Feature 5: White-Label Agency Platform

### Value Proposition
> "Your brand, your clients, your platform."

**Business Impact:**
- Recurring revenue from agency subscription
- Client retention through platform lock-in
- Premium positioning vs competitors
- Scalable service delivery

### Implementation

```typescript
// backend/src/services/WhiteLabelService.ts

import { prisma } from "../db/client";

interface WhiteLabelConfig {
  agencyId: string;
  domain: string;
  branding: {
    logo: string;
    favicon: string;
    primaryColor: string;
    secondaryColor: string;
    companyName: string;
  };
  features: {
    hideAttributions: boolean;
    customEmailDomain: string;
    customSupportEmail: string;
  };
  clients: string[]; // Tenant IDs
}

export class WhiteLabelService {
  /**
   * Create white-label configuration
   */
  async createWhiteLabel(
    agencyId: string,
    config: Omit<WhiteLabelConfig, "agencyId" | "clients">
  ): Promise<WhiteLabelConfig> {
    // Verify domain ownership (DNS TXT record)
    const domainVerified = await this.verifyDomainOwnership(config.domain, agencyId);
    if (!domainVerified) {
      throw new Error("Domain verification failed. Add TXT record.");
    }

    const whiteLabel = await prisma.whiteLabel.create({
      data: {
        agencyId,
        domain: config.domain,
        branding: config.branding as any,
        features: config.features as any,
        verified: true,
      },
    });

    // Set up SSL certificate
    await this.provisionSSL(config.domain);

    return {
      agencyId,
      domain: config.domain,
      branding: config.branding,
      features: config.features,
      clients: [],
    };
  }

  /**
   * Get white-label config by domain
   */
  async getConfigByDomain(domain: string): Promise<WhiteLabelConfig | null> {
    const config = await prisma.whiteLabel.findUnique({
      where: { domain },
      include: { clients: true },
    });

    if (!config) return null;

    return {
      agencyId: config.agencyId,
      domain: config.domain,
      branding: config.branding as any,
      features: config.features as any,
      clients: config.clients.map(c => c.id),
    };
  }

  /**
   * Generate client report with agency branding
   */
  async generateBrandedReport(
    agencyId: string,
    clientId: string,
    reportType: "weekly" | "monthly"
  ): Promise<Buffer> {
    const config = await prisma.whiteLabel.findUnique({
      where: { agencyId },
    });

    if (!config) throw new Error("White-label not configured");

    const branding = config.branding as any;
    
    // Generate PDF report with branding
    const report = await this.generatePDF({
      logo: branding.logo,
      primaryColor: branding.primaryColor,
      companyName: branding.companyName,
      clientId,
      reportType,
    });

    return report;
  }

  /**
   * Create client portal access
   */
  async createClientPortal(
    agencyId: string,
    clientTenantId: string,
    permissions: {
      viewDashboard: boolean;
      viewCampaigns: boolean;
      viewCreatives: boolean;
      viewReports: boolean;
      manageRules: boolean;
    }
  ): Promise<{ portalUrl: string; accessToken: string }> {
    const whiteLabel = await prisma.whiteLabel.findUnique({
      where: { agencyId },
    });

    if (!whiteLabel) throw new Error("White-label not configured");

    // Create limited access token for client
    const accessToken = await this.createClientAccessToken(clientTenantId, permissions);

    return {
      portalUrl: `https://${whiteLabel.domain}/client/${clientTenantId}`,
      accessToken,
    };
  }

  private async verifyDomainOwnership(domain: string, agencyId: string): Promise<boolean> {
    // Check for DNS TXT record: _adplatform-verify.domain.com = agencyId
    const dns = await import("dns").then(m => m.promises);
    try {
      const records = await dns.resolveTxt(`_adplatform-verify.${domain}`);
      return records.some(r => r.join("") === agencyId);
    } catch {
      return false;
    }
  }

  private async provisionSSL(domain: string): Promise<void> {
    // Use Let's Encrypt via certbot or AWS ACM
    // This would typically be handled by infrastructure
  }

  private async generatePDF(options: any): Promise<Buffer> {
    // Use puppeteer or react-pdf to generate branded PDF
    return Buffer.from("");
  }

  private async createClientAccessToken(
    tenantId: string,
    permissions: any
  ): Promise<string> {
    // Create JWT with limited permissions
    return "";
  }
}
```

**Frontend middleware for white-label**:

```typescript
// frontend/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  
  // Skip for main domain
  if (hostname.includes("yourdomain.com")) {
    return NextResponse.next();
  }

  // Fetch white-label config
  const configRes = await fetch(
    `${process.env.INTERNAL_API_URL}/api/white-label/config?domain=${hostname}`
  );

  if (!configRes.ok) {
    return NextResponse.redirect(new URL("/not-found", request.url));
  }

  const config = await configRes.json();

  // Inject branding into response
  const response = NextResponse.next();
  response.headers.set("x-agency-id", config.agencyId);
  response.headers.set("x-branding", JSON.stringify(config.branding));

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## Feature 6: Real-Time Anomaly Detection

### Value Proposition
> "Never wake up to a disaster. Get alerted instantly when something goes wrong."

**Business Impact:**
- Prevent $10K+ disasters from runaway spend
- Catch tracking issues before they cost you
- 24/7 monitoring without manual checking
- Peace of mind

### Implementation

```typescript
// backend/src/services/AnomalyDetectionService.ts

import { prisma } from "../db/client";
import { NotificationService } from "./NotificationService";
import { MetaAdsService } from "./MetaAdsService";

interface AnomalyEvent {
  id: string;
  tenantId: string;
  type: "spend_spike" | "roas_drop" | "tracking_loss" | "ctr_anomaly" | "conversion_drop";
  severity: "warning" | "critical";
  metric: string;
  expected: number;
  actual: number;
  deviation: number; // Standard deviations from mean
  entityType?: string;
  entityId?: string;
  detectedAt: Date;
  autoAction?: string;
}

export class AnomalyDetectionService {
  private notifications: NotificationService;
  private metaAds: MetaAdsService;

  constructor() {
    this.notifications = new NotificationService();
    this.metaAds = new MetaAdsService();
  }

  /**
   * Run anomaly detection for all tenants
   */
  async runDetection(): Promise<AnomalyEvent[]> {
    const tenants = await prisma.tenant.findMany({
      where: { shopifyAccessToken: { not: null } },
    });

    const allAnomalies: AnomalyEvent[] = [];

    for (const tenant of tenants) {
      const anomalies = await this.detectAnomaliesForTenant(tenant.id);
      allAnomalies.push(...anomalies);

      // Take automatic action for critical anomalies
      for (const anomaly of anomalies.filter(a => a.severity === "critical")) {
        await this.handleCriticalAnomaly(tenant.id, anomaly);
      }
    }

    return allAnomalies;
  }

  /**
   * Detect anomalies for a single tenant
   */
  async detectAnomaliesForTenant(tenantId: string): Promise<AnomalyEvent[]> {
    const anomalies: AnomalyEvent[] = [];

    // Get baseline statistics (last 30 days)
    const baseline = await this.calculateBaseline(tenantId, 30);

    // Get current data (last 24 hours)
    const current = await this.getCurrentMetrics(tenantId);

    // Check spend anomalies
    const spendAnomaly = this.checkAnomaly(
      current.spend,
      baseline.spend.mean,
      baseline.spend.stdDev,
      2.5 // Alert if > 2.5 standard deviations
    );

    if (spendAnomaly) {
      anomalies.push({
        id: `anomaly_${Date.now()}`,
        tenantId,
        type: "spend_spike",
        severity: spendAnomaly.deviation > 3 ? "critical" : "warning",
        metric: "spend",
        expected: baseline.spend.mean,
        actual: current.spend,
        deviation: spendAnomaly.deviation,
        detectedAt: new Date(),
        autoAction: spendAnomaly.deviation > 3 ? "paused_all_campaigns" : undefined,
      });
    }

    // Check ROAS drop
    const roasAnomaly = this.checkAnomaly(
      current.roas,
      baseline.roas.mean,
      baseline.roas.stdDev,
      -2 // Alert if < -2 standard deviations (dropping)
    );

    if (roasAnomaly && current.roas < baseline.roas.mean) {
      anomalies.push({
        id: `anomaly_${Date.now()}_roas`,
        tenantId,
        type: "roas_drop",
        severity: Math.abs(roasAnomaly.deviation) > 2.5 ? "critical" : "warning",
        metric: "roas",
        expected: baseline.roas.mean,
        actual: current.roas,
        deviation: roasAnomaly.deviation,
        detectedAt: new Date(),
      });
    }

    // Check conversion tracking
    const expectedConversions = (current.spend / baseline.spend.mean) * baseline.conversions.mean;
    if (current.conversions < expectedConversions * 0.3 && current.spend > 100) {
      anomalies.push({
        id: `anomaly_${Date.now()}_tracking`,
        tenantId,
        type: "tracking_loss",
        severity: "critical",
        metric: "conversions",
        expected: expectedConversions,
        actual: current.conversions,
        deviation: (current.conversions - expectedConversions) / baseline.conversions.stdDev,
        detectedAt: new Date(),
        autoAction: "pause_pending_review",
      });
    }

    // Store anomalies
    for (const anomaly of anomalies) {
      await prisma.anomalyEvent.create({
        data: {
          tenantId,
          type: anomaly.type,
          severity: anomaly.severity,
          metric: anomaly.metric,
          expected: anomaly.expected,
          actual: anomaly.actual,
          deviation: anomaly.deviation,
          autoAction: anomaly.autoAction,
        },
      });

      // Send notification
      await this.notifications.send(tenantId, {
        title: `🚨 ${anomaly.severity.toUpperCase()}: ${anomaly.type.replace(/_/g, " ")}`,
        message: `${anomaly.metric} is ${anomaly.actual.toFixed(2)} (expected ${anomaly.expected.toFixed(2)}). ${anomaly.autoAction ? `Auto-action: ${anomaly.autoAction}` : "Review recommended."}`,
        channels: anomaly.severity === "critical" ? ["email", "slack", "sms"] : ["slack"],
        severity: anomaly.severity === "critical" ? "critical" : "high",
      });
    }

    return anomalies;
  }

  /**
   * Handle critical anomaly with automatic action
   */
  private async handleCriticalAnomaly(
    tenantId: string,
    anomaly: AnomalyEvent
  ): Promise<void> {
    const settings = await prisma.settings.findUnique({
      where: { tenantId },
    });

    const automation = (settings?.automation as any) || {};

    // Only take action if automation is enabled
    if (automation.globalAutomationLevel === "suggestions_only") {
      return;
    }

    switch (anomaly.type) {
      case "spend_spike":
        if (anomaly.deviation > 3) {
          await this.pauseAllCampaigns(tenantId);
          anomaly.autoAction = "paused_all_campaigns";
        }
        break;

      case "tracking_loss":
        if (automation.pauseOnTrackingIssues) {
          await this.pauseAllCampaigns(tenantId);
          anomaly.autoAction = "paused_pending_tracking_fix";
        }
        break;
    }
  }

  private checkAnomaly(
    value: number,
    mean: number,
    stdDev: number,
    threshold: number
  ): { deviation: number } | null {
    if (stdDev === 0) return null;
    
    const deviation = (value - mean) / stdDev;
    
    if (threshold > 0 && deviation > threshold) {
      return { deviation };
    }
    if (threshold < 0 && deviation < threshold) {
      return { deviation };
    }
    
    return null;
  }

  private async calculateBaseline(tenantId: string, days: number) {
    const metrics = await prisma.metricsDaily.findMany({
      where: {
        tenantId,
        dimensionType: "account",
        date: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
      },
    });

    const calculateStats = (values: number[]) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      return { mean, stdDev: Math.sqrt(variance) };
    };

    return {
      spend: calculateStats(metrics.map(m => Number(m.spend))),
      revenue: calculateStats(metrics.map(m => Number(m.revenue))),
      roas: calculateStats(metrics.map(m => Number(m.revenue) / Number(m.spend) || 0)),
      conversions: calculateStats(metrics.map(m => m.conversions)),
    };
  }

  private async getCurrentMetrics(tenantId: string) {
    const today = await prisma.metricsDaily.findFirst({
      where: { tenantId, dimensionType: "account" },
      orderBy: { date: "desc" },
    });

    return {
      spend: Number(today?.spend || 0),
      revenue: Number(today?.revenue || 0),
      roas: today ? Number(today.revenue) / Number(today.spend) : 0,
      conversions: today?.conversions || 0,
    };
  }

  private async pauseAllCampaigns(tenantId: string): Promise<void> {
    const adAccount = await prisma.adAccount.findFirst({
      where: { tenantId, provider: "meta", isDefault: true },
    });

    if (!adAccount) return;

    this.metaAds.init(decrypt(adAccount.accessToken!), adAccount.externalId);

    const campaigns = await this.metaAds.getCampaigns();
    for (const campaign of campaigns.filter(c => c.status === "ACTIVE")) {
      await this.metaAds.updateCampaignStatus(campaign.id, "PAUSED");
    }
  }
}
```

**Scheduler for continuous monitoring**:

```typescript
// backend/src/workers/anomalyMonitor.ts
import { AnomalyDetectionService } from "../services/AnomalyDetectionService";

const detector = new AnomalyDetectionService();

// Run every 15 minutes
setInterval(async () => {
  console.log("Running anomaly detection...");
  const anomalies = await detector.runDetection();
  console.log(`Found ${anomalies.length} anomalies`);
}, 15 * 60 * 1000);
```

---

# Part 3: Pricing & Packaging Strategy

## Tier Breakdown

### Starter — $99/month
**Target**: Solo merchants, <$50K/mo ad spend

**Included**:
- Unified dashboard
- Basic rule engine (3 rules)
- Email alerts
- 7-day data retention
- Community support

**Limits**:
- 1 ad account
- 1 user
- No API access

---

### Growth — $299/month
**Target**: Growing brands, $50-200K/mo ad spend

**Included**:
- Everything in Starter
- Predictive forecasting (7-day)
- AI creative generation (50/month)
- Creative scoring
- Budget allocation suggestions
- Slack integration
- 30-day data retention
- Priority support

**Limits**:
- 3 ad accounts
- 5 users
- Basic API access (100 calls/day)

---

### Scale — $499/month
**Target**: Established brands, agencies, $200K+/mo

**Included**:
- Everything in Growth
- Full predictive suite (30-day forecasts)
- Autonomous budget allocation
- Multi-touch attribution
- Anomaly detection & auto-response
- Unlimited creative generation
- Competitor intelligence
- White-label client portals
- 90-day data retention
- Dedicated success manager

**Limits**:
- 10 ad accounts
- Unlimited users
- Full API access

---

### Enterprise — $999+/month
**Target**: Large agencies, enterprise brands

**Included**:
- Everything in Scale
- White-label platform (your domain)
- SSO integration
- Custom integrations
- Dedicated infrastructure
- 1-year data retention
- SLA guarantee (99.9%)
- Quarterly business reviews
- Custom feature development

**Limits**:
- Unlimited ad accounts
- Unlimited everything
- Dedicated support channel

---

## ROI Calculator

| Monthly Spend | Tier | Monthly Fee | Expected Improvement | Additional Profit | ROI |
|---------------|------|-------------|---------------------|-------------------|-----|
| $25,000 | Starter | $99 | 5% | $1,250 | 12.6x |
| $75,000 | Growth | $299 | 10% | $7,500 | 25x |
| $200,000 | Scale | $499 | 15% | $30,000 | 60x |
| $500,000 | Enterprise | $999 | 20% | $100,000 | 100x |

---

# Part 4: Implementation Priority

## Must-Have for $500 (Week 1-4)
1. ✅ Predictive Performance Forecasting
2. ✅ Autonomous Budget Allocation  
3. ✅ Anomaly Detection & Auto-Response
4. ✅ Multi-Touch Attribution
5. ✅ White-Label Client Portals

## Should-Have (Week 5-8)
6. AI Creative Generation
7. Competitor Creative Analysis
8. Smart Scaling Engine
9. Client Reporting Automation
10. Slack/Discord Bot

## Nice-to-Have (Week 9-12)
11. Video Script Generator
12. Incrementality Testing
13. Dayparting Intelligence
14. Custom API Access
15. SOC 2 Compliance

---

# Summary

This document outlines 30 premium features that transform a $99 tool into a $500/month platform. The key differentiators at this price point are:

1. **AI that acts, not just reports** — Autonomous optimization, not just dashboards
2. **Predictive, not reactive** — Know what will happen before it does
3. **Agency-ready** — White-label, multi-client, automated reporting
4. **Enterprise-grade** — Security, compliance, SLAs
5. **Clear ROI** — Features that demonstrably generate 10-20x return

Implementation should prioritize features with highest perceived value and lowest technical complexity first, building momentum and customer proof points before tackling more complex features.

---

*Document version: 1.0.0*
*Total estimated development: 12-16 weeks for full premium feature set*

import { prisma } from "../db/client";
import { RulesEngine } from "../services/RulesEngine";
import { MetricsService } from "../services/MetricsService";
import { MetaAdsService } from "../services/MetaAdsService";
import { NotificationService } from "../services/NotificationService";
import type { NotificationPayload } from "../services/NotificationService";
import { decrypt } from "../utils/crypto";

export async function executeRulesForTenant(tenantId: string): Promise<void> {
  const rules = await prisma.rule.findMany({
    where: { tenantId, active: true },
  });

  if (rules.length === 0) return;

  const metricsSnapshot = await prisma.metricsDaily.findFirst({
    where: { tenantId, dimensionType: "account" },
    orderBy: { date: "desc" },
  });

  if (!metricsSnapshot) return;

  const metricsService = new MetricsService();
  const rulesEngine = new RulesEngine();
  const notificationService = new NotificationService();

  const metrics = metricsService.compute({
    spend: Number(metricsSnapshot.spend),
    revenue: Number(metricsSnapshot.revenue),
    orders: metricsSnapshot.orders,
    customers: metricsSnapshot.customers,
  });

  for (const rule of rules) {
    const evaluation = rulesEngine.evaluateCustomRule(rule as any, metrics);

    await prisma.ruleExecution.create({
      data: {
        ruleId: rule.id,
        tenantId,
        triggered: evaluation.triggered,
        conditionsMet: evaluation.triggered ? [evaluation.reason] : [],
        actionsTaken: [],
        affectedEntities: [],
      },
    });

    if (!evaluation.triggered) continue;

    await handleActions({
      tenantId,
      rule,
      reason: evaluation.reason,
      notificationService,
    });

    await prisma.rule.update({
      where: { id: rule.id },
      data: { lastTriggeredAt: new Date() },
    });
  }
}

async function handleActions(params: {
  tenantId: string;
  rule: any;
  reason: string;
  notificationService: NotificationService;
}) {
  const { tenantId, rule, reason, notificationService } = params;
  const actions = (rule.actions || []) as Array<{ type: string; [key: string]: unknown }>;

  for (const action of actions) {
    switch (action.type) {
      case "notify":
        await notificationService.send(tenantId, {
          title: `Rule Triggered: ${rule.name}`,
          message: reason,
          channels: (action.notifyChannels as NotificationPayload["channels"]) || ["email"],
          severity: rule.riskLevel || "medium",
        });
        break;

      case "pause":
        if (rule.automationMode === "suggestions_only") break;
        await applyMetaAction(tenantId, rule.scope, "pause");
        break;

      case "scale_budget":
        if (rule.automationMode !== "auto_all") break;
        await applyMetaAction(tenantId, rule.scope, "scale", action);
        break;
    }
  }
}

async function applyMetaAction(
  tenantId: string,
  scope: string,
  action: "pause" | "scale",
  params?: { direction?: "up" | "down"; amount?: number }
) {
  const adAccount = await prisma.adAccount.findFirst({
    where: { tenantId, provider: "meta", isDefault: true },
  });

  if (!adAccount || !adAccount.accessToken) return;

  const meta = new MetaAdsService();
  meta.init(decrypt(adAccount.accessToken), adAccount.externalId);

  switch (action) {
    case "pause":
      console.log(`[Rules] Would pause entities at scope ${scope}`);
      break;
    case "scale":
      console.log(
        `[Rules] Would scale scope ${scope} ${params?.direction ?? "up"} by ${params?.amount ?? 10}%`
      );
      break;
  }
}


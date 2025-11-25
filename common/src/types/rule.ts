export type RuleAutomationMode = "suggestions_only" | "auto_low_risk" | "auto_all";
export type RuleScope = "account" | "campaign" | "ad_set" | "ad";
export type RuleRiskLevel = "low" | "medium" | "high";
export type ConditionOperator = ">" | "<" | ">=" | "<=" | "==" | "!=";

export interface RuleCondition {
  metric: string;
  operator: ConditionOperator;
  value: number;
  windowDays: number;
}

export interface RuleAction {
  type: "pause" | "enable" | "scale_budget" | "notify" | "tag";
  value?: number;
  unit?: "percent" | "absolute";
  notifyChannels?: string[];
}

export interface Rule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  scope: RuleScope;
  automationMode: RuleAutomationMode;
  triggers: ("schedule" | "threshold" | "manual")[];
  conditions: RuleCondition[];
  actions: RuleAction[];
  riskLevel: RuleRiskLevel;
  active: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleExecution {
  id: string;
  ruleId: string;
  tenantId: string;
  triggered: boolean;
  conditionsMet: string[];
  actionsTaken: RuleAction[];
  affectedEntities: string[];
  executedAt: string;
}

export interface RuleEvaluationResult {
  id: string;
  name: string;
  triggered: boolean;
  reason: string;
}

export interface RuleListResponse {
  data: Rule[];
  total: number;
}

export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertStatus = "open" | "snoozed" | "resolved" | "dismissed";
export type AlertEntityType = "account" | "campaign" | "ad_set" | "ad" | "tracking" | "system";

export interface Alert {
  id: string;
  tenantId: string;
  type: string;
  severity: AlertSeverity;
  entityType: AlertEntityType;
  entityId?: string;
  title: string;
  message: string;
  recommendation?: string;
  status: AlertStatus;
  snoozedUntil?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertCreateRequest {
  type: string;
  severity: AlertSeverity;
  entityType: AlertEntityType;
  entityId?: string;
  title: string;
  message: string;
  recommendation?: string;
}

export interface AlertUpdateRequest {
  status?: AlertStatus;
  snoozedUntil?: string;
}

export interface AlertListResponse {
  data: Alert[];
  total: number;
  unreadCount: number;
}

export interface AlertFilters {
  status?: AlertStatus;
  severity?: AlertSeverity;
  entityType?: AlertEntityType;
  from?: string;
  to?: string;
}

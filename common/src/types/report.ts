import type { ProfitMetrics } from "./metrics";

export interface KPI {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "flat";
}

export interface SummaryReport {
  tenantId: string;
  period: "daily" | "weekly" | "monthly";
  from: string;
  to: string;
  kpis: KPI[];
  metrics: ProfitMetrics;
  previousMetrics?: ProfitMetrics;
  topCampaigns: { id: string; name: string; profit: number; roas: number }[];
  bottomCampaigns: { id: string; name: string; profit: number; roas: number }[];
  recommendations: string[];
}

export interface CreativePerformanceReport {
  tenantId: string;
  from: string;
  to: string;
  winners: {
    id: string;
    name: string;
    format: string;
    roas: number;
    spend: number;
    revenue: number;
  }[];
  losers: {
    id: string;
    name: string;
    format: string;
    roas: number;
    spend: number;
    revenue: number;
  }[];
  fatigued: {
    id: string;
    name: string;
    fatigueScore: number;
    daysSinceCreation: number;
  }[];
}

export interface BenchmarkData {
  segmentKey: string;
  metricKey: string;
  value: number;
  percentile: number;
  sampleSize: number;
  updatedAt: string;
}

export interface ReportExportRequest {
  type: "summary" | "creative" | "campaigns";
  format: "csv" | "pdf";
  from: string;
  to: string;
}

export interface ReportExportResponse {
  downloadUrl: string;
  expiresAt: string;
}

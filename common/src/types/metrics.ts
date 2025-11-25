export interface RawMetricsInput {
  spend?: number;
  revenue?: number;
  orders?: number;
  customers?: number;
  totalMarketingSpend?: number;
  ltv?: number;
  paybackDays?: number;
}

export interface ProfitMetrics {
  spend: number;
  revenue: number;
  orders: number;
  customers: number;
  totalMarketingSpend: number;
  mer: number;          // Marketing Efficiency Ratio
  metaRoas: number;     // Meta-specific ROAS
  cac: number;          // Customer Acquisition Cost
  aov: number;          // Average Order Value
  ltv: number;          // Lifetime Value
  ltvToCac: number;     // LTV to CAC ratio
  paybackDays: number;  // Days to payback CAC
}

export interface MetricSnapshot {
  date: string;
  metrics: ProfitMetrics;
}

export interface MetricTimeseries {
  shopId: string;
  from: string;
  to: string;
  snapshots: MetricSnapshot[];
}

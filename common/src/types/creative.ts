export type CreativeStatus = "draft" | "approved" | "live" | "archived";
export type CreativeFormat = "image" | "video" | "carousel" | "text";
export type ComplianceStatus = "ok" | "needs_review" | "rejected";

export interface CreativeVariant {
  id: string;
  tenantId: string;
  name: string;
  format: CreativeFormat;
  headline: string;
  primaryText: string;
  cta: string;
  visualDescription: string;
  assetUrl?: string;
  predictedScore?: number;
  complianceStatus: ComplianceStatus;
  complianceNotes?: string;
  status: CreativeStatus;
  campaignId?: string;
  productId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeGenerateRequest {
  productId?: string;
  productName: string;
  productDescription?: string;
  offer?: string;
  audience?: string;
  angle?: string;
  format: CreativeFormat;
  count?: number;
}

export interface CreativeScoreRequest {
  headline: string;
  primaryText: string;
  cta: string;
  format: CreativeFormat;
}

export interface CreativeScoreResponse {
  score: number;
  breakdown: {
    hookStrength: number;
    clarity: number;
    urgency: number;
    brandFit: number;
  };
  suggestions: string[];
}

export interface CompetitorAd {
  id: string;
  tenantId: string;
  competitorId: string;
  externalId: string;
  pageId: string;
  pageName: string;
  snapshotUrl?: string;
  headline?: string;
  bodyText?: string;
  ctaText?: string;
  format: CreativeFormat;
  firstSeenAt: string;
  lastSeenAt: string;
  isActive: boolean;
  tags: string[];
  detectedHooks: string[];
  detectedOffers: string[];
  createdAt: string;
}

export interface Competitor {
  id: string;
  tenantId: string;
  type: "page" | "keyword";
  identifier: string;
  label: string;
  createdAt: string;
  updatedAt: string;
}

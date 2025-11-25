import { Router } from "express";
import type {
  CreativeVariant,
  CreativeGenerateRequest,
  CreativeScoreRequest,
  CreativeScoreResponse,
  Competitor,
  CompetitorAd,
} from "@shopify-ad-intelligence/common";

const router = Router();

// Mock data
const mockVariants: CreativeVariant[] = [
  {
    id: "var_1",
    tenantId: "tenant_mock",
    name: "Summer Sale - Urgency",
    format: "image",
    headline: "Last Chance: 40% Off Everything",
    primaryText: "Our biggest sale ends tonight. Don't miss out on premium quality at unbeatable prices.",
    cta: "Shop Now",
    visualDescription: "Product grid with countdown timer overlay",
    predictedScore: 8.2,
    complianceStatus: "ok",
    status: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockCompetitors: Competitor[] = [
  {
    id: "comp_1",
    tenantId: "tenant_mock",
    type: "page",
    identifier: "123456789",
    label: "Competitor Brand A",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Get creative variants
 */
router.get("/variants", (req, res) => {
  const { status } = req.query;

  let filtered = [...mockVariants];
  if (status && typeof status === "string") {
    filtered = filtered.filter((v) => v.status === status);
  }

  res.json({ data: filtered });
});

/**
 * Get single variant
 */
router.get("/variants/:id", (req, res) => {
  const variant = mockVariants.find((v) => v.id === req.params.id);

  if (!variant) {
    return res.status(404).json({
      error: { message: "Variant not found" },
    });
  }

  return res.json({ data: variant });
});

/**
 * Generate creative variants
 */
router.post("/generate", async (req, res) => {
  const {
    productName,
    productDescription,
    offer,
    audience,
    angle,
    format = "image",
    count = 3,
  } = req.body as CreativeGenerateRequest;

  // TODO: Use LLM to generate actual variants
  const generated: Omit<CreativeVariant, "id" | "tenantId" | "createdAt" | "updatedAt">[] = [];

  for (let i = 0; i < count; i++) {
    generated.push({
      name: `${productName} - Variant ${i + 1}`,
      format,
      headline: `${offer || "Special Offer"} on ${productName}`,
      primaryText: `${productDescription || "Premium quality"} for ${audience || "you"}. ${angle || "Don't miss out."}`,
      cta: "Shop Now",
      visualDescription: `${format} creative featuring ${productName}`,
      predictedScore: Math.random() * 3 + 6, // 6-9
      complianceStatus: "ok",
      status: "draft",
    });
  }

  res.json({
    data: generated.map((v, i) => ({
      ...v,
      id: `var_gen_${Date.now()}_${i}`,
      tenantId: "tenant_mock",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  });
});

/**
 * Score a creative
 */
router.post("/score", (req, res) => {
  const { headline, primaryText, cta, format } = req.body as CreativeScoreRequest;

  // TODO: Use ML model for actual scoring
  const score = Math.random() * 3 + 6; // 6-9

  const response: CreativeScoreResponse = {
    score,
    breakdown: {
      hookStrength: Math.random() * 3 + 6,
      clarity: Math.random() * 3 + 6,
      urgency: Math.random() * 3 + 6,
      brandFit: Math.random() * 3 + 6,
    },
    suggestions: [
      "Consider adding social proof",
      "Test a more specific CTA",
      "Try a question-based hook",
    ],
  };

  res.json({ data: response });
});

/**
 * Check compliance
 */
router.post("/compliance-check", (req, res) => {
  const { headline, primaryText } = req.body;

  // TODO: Implement actual compliance checking
  const issues: string[] = [];

  // Simple checks
  if (headline?.toLowerCase().includes("guarantee")) {
    issues.push("Avoid absolute guarantees - may violate ad policies");
  }
  if (primaryText?.toLowerCase().includes("cure")) {
    issues.push("Medical claims may require substantiation");
  }

  res.json({
    data: {
      status: issues.length === 0 ? "ok" : "needs_review",
      issues,
      checkedAt: new Date().toISOString(),
    },
  });
});

/**
 * Get competitors
 */
router.get("/competitors", (_req, res) => {
  res.json({ data: mockCompetitors });
});

/**
 * Add competitor
 */
router.post("/competitors", (req, res) => {
  const { type, identifier, label } = req.body;

  const competitor: Competitor = {
    id: `comp_${Date.now()}`,
    tenantId: "tenant_mock",
    type: type || "page",
    identifier,
    label,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockCompetitors.push(competitor);

  res.status(201).json({ data: competitor });
});

/**
 * Get competitor ads
 */
router.get("/competitors/:id/ads", (req, res) => {
  // TODO: Fetch from Ad Library
  const mockAds: CompetitorAd[] = [
    {
      id: "cad_1",
      tenantId: "tenant_mock",
      competitorId: req.params.id,
      externalId: "ext_123",
      pageId: "page_123",
      pageName: "Competitor Brand A",
      headline: "New Collection Available",
      bodyText: "Shop our latest arrivals",
      ctaText: "Shop Now",
      format: "image",
      firstSeenAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastSeenAt: new Date().toISOString(),
      isActive: true,
      tags: ["new", "collection"],
      detectedHooks: ["novelty", "curiosity"],
      detectedOffers: [],
      createdAt: new Date().toISOString(),
    },
  ];

  res.json({ data: mockAds });
});

/**
 * Get creative trends
 */
router.get("/trends", (_req, res) => {
  res.json({
    data: {
      hooks: [
        { hook: "Problem-solution", frequency: 45, trend: "up" },
        { hook: "Social proof", frequency: 38, trend: "stable" },
        { hook: "Urgency", frequency: 32, trend: "down" },
      ],
      formats: [
        { format: "video", frequency: 55, trend: "up" },
        { format: "carousel", frequency: 28, trend: "stable" },
        { format: "image", frequency: 17, trend: "down" },
      ],
      angles: [
        { angle: "Testimonial", frequency: 40, trend: "up" },
        { angle: "Product demo", frequency: 35, trend: "stable" },
        { angle: "Lifestyle", frequency: 25, trend: "down" },
      ],
    },
  });
});

export default router;

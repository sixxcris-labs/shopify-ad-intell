# Shopify Ad Intelligence Platform

## Complete Project Documentation & Implementation Guide

---

# Part 1: Project Overview

## What This Is

A profit-first AI co-pilot for Shopify merchants running Meta Ads. The platform connects store and ad data, applies elite media-buying logic via an LLM-powered "brain," and automates profit-focused decisions with configurable safety rails.

## Value Proposition

> "Turn noisy Shopify + Meta data into clear, profit-focused decisions—what to scale, pause, fix, or test next."

Unlike traditional ad dashboards that focus on vanity metrics, this platform prioritizes:
- **MER** (Marketing Efficiency Ratio) over isolated ROAS
- **LTV:CAC** ratio for sustainable growth
- **Payback period** for cash flow management
- **System-level thinking** across the entire funnel

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, Shopify Polaris, App Bridge |
| Backend | Express.js, TypeScript, Node.js 20+ |
| Database | PostgreSQL (primary), Redis (cache/queues) |
| AI/ML | OpenAI GPT-4o / Anthropic Claude |
| Infrastructure | Docker, GitHub Actions CI/CD |
| Package Manager | pnpm 9+ with workspaces |

---

## Repository Structure

```
shopify-ad-intelligence/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                 # CI pipeline (typecheck, lint, test, build)
│   └── instructions/
│       └── snyk_rules.instructions.md
│
├── common/                        # Shared package
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts               # Main export
│       ├── types/
│       │   ├── index.ts           # Type exports
│       │   ├── metrics.ts         # ProfitMetrics, RawMetricsInput
│       │   ├── metaBrain.ts       # AI brain I/O contracts
│       │   ├── tenant.ts          # Tenant, User, AdAccount, Session
│       │   ├── campaign.ts        # Campaign, AdSet, Ad
│       │   ├── rule.ts            # Rule, RuleCondition, RuleAction
│       │   ├── creative.ts        # CreativeVariant, Competitor, CompetitorAd
│       │   ├── alert.ts           # Alert types
│       │   ├── report.ts          # Report types
│       │   └── settings.ts        # Settings, BrandProfile, AutomationSettings
│       └── config/
│           └── rulePresets.ts     # Built-in rule templates
│
├── backend/                       # API server
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts               # Express app entry
│       ├── config/
│       │   ├── env.ts             # Environment config with Zod validation
│       │   └── metaBrainPrompt.ts # AI system prompt
│       ├── middleware/
│       │   └── errorHandler.ts    # Global error handling
│       ├── api/
│       │   ├── index.ts           # Route aggregator
│       │   ├── health.ts          # Health check endpoints
│       │   ├── authShopify.ts     # Shopify OAuth flow
│       │   ├── overview.ts        # Dashboard KPIs & recommendations
│       │   ├── campaigns.ts       # Campaign CRUD & metrics
│       │   ├── rules.ts           # Automation rules CRUD
│       │   ├── creatives.ts       # Creative variants & competitors
│       │   ├── alerts.ts          # Alert management
│       │   ├── reports.ts         # Reporting endpoints
│       │   ├── settings.ts        # App settings
│       │   └── tracking.ts        # Pixel/CAPI health
│       └── services/
│           ├── index.ts           # Service exports
│           ├── MetricsService.ts  # Profit metrics calculation
│           ├── RulesEngine.ts     # Rule evaluation logic
│           ├── MetaBrainService.ts# AI recommendation engine
│           ├── LLMClient.ts       # OpenAI/Anthropic abstraction
│           ├── TrackingService.ts # Tracking health diagnostics
│           ├── ShopifyService.ts  # Shopify Admin API client
│           └── MetaAdsService.ts  # Meta Marketing API client
│
├── frontend/                      # Next.js app
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   ├── .env.example
│   └── src/
│       ├── pages/
│       │   ├── _app.tsx           # App wrapper with Polaris
│       │   ├── index.tsx          # Overview dashboard
│       │   ├── campaigns/index.tsx
│       │   ├── rules/index.tsx
│       │   ├── creative-intelligence/index.tsx
│       │   ├── creative-studio/index.tsx
│       │   ├── alerts/index.tsx
│       │   ├── reports/index.tsx
│       │   └── settings/index.tsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppLayout.tsx  # Frame with navigation
│       │   │   └── index.ts
│       │   └── sections/
│       │       └── index.ts
│       └── lib/
│           ├── apiClient.ts       # Type-safe API client
│           └── index.ts
│
├── docs/                          # Documentation
│   └── README.md
│
├── package.json                   # Workspace root
├── pnpm-workspace.yaml
├── .gitignore
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 14+ (for Phase 2)
- Redis 7+ (for Phase 2)

### Installation

```bash
# Clone and enter directory
cd shopify-ad-intelligence

# Install dependencies
pnpm install

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development servers
pnpm dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services (frontend:4310, backend:4311) |
| `pnpm dev:backend` | Start backend only |
| `pnpm dev:frontend` | Start frontend only |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type check all packages |

> Local development defaults: frontend `http://localhost:4310`, backend `http://localhost:4311`, PostgreSQL `localhost:5544`, Redis `localhost:6385`. These avoid collisions with other commonly used ports (3000/3001/5432/6379).

---

## API Reference

### Base URL
```
Development: http://localhost:4311/api
Production: https://your-domain.com/api
```

### Endpoints

#### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/ready` | Readiness probe with dependency checks |

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/shopify` | Initiate Shopify OAuth |
| GET | `/auth/shopify/callback` | OAuth callback handler |
| GET | `/auth/shopify/me` | Get current session |

#### Overview
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/overview` | Dashboard KPIs and summary |
| GET | `/overview/recommendations` | AI-generated recommendations |
| GET | `/overview/timeseries` | Metrics over time |

#### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/campaigns` | List campaigns |
| GET | `/campaigns/:id` | Get campaign details |
| PATCH | `/campaigns/:id` | Update campaign |
| GET | `/campaigns/:id/adsets` | Get ad sets |
| GET | `/campaigns/:id/ads` | Get ads |

#### Rules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rules` | List rules |
| POST | `/rules` | Create rule |
| GET | `/rules/:id` | Get rule |
| PUT | `/rules/:id` | Update rule |
| DELETE | `/rules/:id` | Delete rule |
| POST | `/rules/:id/test` | Test rule against data |
| GET | `/rules/presets/list` | Get preset templates |

#### Creatives
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/creatives/variants` | List creative variants |
| POST | `/creatives/generate` | Generate new variants |
| POST | `/creatives/score` | Score a creative |
| POST | `/creatives/compliance-check` | Check policy compliance |
| GET | `/creatives/competitors` | List competitors |
| POST | `/creatives/competitors` | Add competitor |
| GET | `/creatives/competitors/:id/ads` | Get competitor ads |
| GET | `/creatives/trends` | Get creative trends |

#### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alerts` | List alerts |
| PATCH | `/alerts/:id` | Update alert status |
| POST | `/alerts/dismiss` | Bulk dismiss alerts |
| GET | `/alerts/stats/summary` | Alert statistics |

#### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/summary` | Performance summary |
| GET | `/reports/creative` | Creative performance |
| GET | `/reports/benchmarks` | Industry benchmarks |
| GET | `/reports/cohorts` | LTV cohort analysis |
| POST | `/reports/export` | Export to CSV/PDF |

#### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | Get all settings |
| GET/PUT | `/settings/brand-profile` | Brand profile |
| GET/PUT | `/settings/automation` | Automation settings |
| GET/PUT | `/settings/notifications` | Notification settings |
| GET | `/settings/integrations` | Integration status |
| POST | `/settings/integrations/meta/connect` | Connect Meta |
| POST | `/settings/integrations/slack/connect` | Connect Slack |
| POST | `/settings/integrations/discord/connect` | Connect Discord |
| GET/PUT | `/settings/community` | Community opt-in |

#### Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tracking/health` | Pixel/CAPI health |
| GET | `/tracking/diagnose` | Diagnose issues |
| POST | `/tracking/verify-events` | Verify event firing |
| GET | `/tracking/recommendations` | Improvement suggestions |

---

## Core Concepts

### Profit-First Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| **MER** | Total Revenue / Total Marketing Spend | > 3.0 |
| **CAC** | Total Marketing Spend / New Customers | < LTV/3 |
| **LTV:CAC** | Customer LTV / CAC | > 3.0 |
| **Payback Days** | Days to recover CAC | < 90 |
| **ROAS** | Revenue / Ad Spend | > 2.0 |
| **AOV** | Revenue / Orders | Varies |

### Rule Engine

Rules consist of:
- **Scope**: account, campaign, ad_set, ad
- **Conditions**: metric + operator + value + time window
- **Actions**: pause, enable, scale_budget, notify, tag
- **Risk Level**: low, medium, high
- **Automation Mode**: suggestions_only, auto_low_risk, auto_all

### AI Brain

The MetaBrainService uses an expert system prompt to:
1. Analyze current metrics and context
2. Evaluate rule triggers
3. Assess tracking health
4. Generate prioritized recommendations
5. Explain decisions in plain language

---

# Part 2: Implementation Guide

## Current Status: Phase 1 Complete ✅

Phase 1 delivers a fully typed, working skeleton with mock data. All routes return realistic data, the UI is functional, and the architecture is production-ready.

---

## Phase 2: Core Integrations (2-3 weeks)

### 2.1 Database Setup

**Task**: Set up PostgreSQL with Prisma ORM

**Files to create**:
```
backend/
├── prisma/
│   ├── schema.prisma      # Data model
│   └── migrations/        # Migration files
└── src/
    └── db/
        └── client.ts      # Prisma client singleton
```

**schema.prisma**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tenant {
  id                String   @id @default(cuid())
  name              String
  shopifyDomain     String   @unique
  shopifyAccessToken String?
  plan              String   @default("free")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  users             User[]
  adAccounts        AdAccount[]
  campaigns         Campaign[]
  rules             Rule[]
  alerts            Alert[]
  settings          Settings?
}

model User {
  id        String   @id @default(cuid())
  tenantId  String
  email     String
  role      String   @default("marketer")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
}

model AdAccount {
  id           String   @id @default(cuid())
  tenantId     String
  provider     String   // meta, google, tiktok
  externalId   String
  name         String
  accessToken  String?
  refreshToken String?
  status       String   @default("active")
  isDefault    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  campaigns    Campaign[]
  
  @@unique([tenantId, provider, externalId])
}

model Campaign {
  id              String   @id @default(cuid())
  tenantId        String
  adAccountId     String
  externalId      String
  name            String
  status          String
  objective       String?
  automationLevel String   @default("manual")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  adAccount       AdAccount @relation(fields: [adAccountId], references: [id])
  metrics         MetricsDaily[]
  
  @@unique([adAccountId, externalId])
}

model MetricsDaily {
  id            String   @id @default(cuid())
  tenantId      String
  date          DateTime @db.Date
  dimensionType String   // campaign, adset, ad, product
  dimensionId   String
  spend         Decimal  @db.Decimal(12, 2)
  revenue       Decimal  @db.Decimal(12, 2)
  orders        Int      @default(0)
  customers     Int      @default(0)
  impressions   Int      @default(0)
  clicks        Int      @default(0)
  conversions   Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  campaign      Campaign? @relation(fields: [dimensionId], references: [id])
  
  @@unique([tenantId, date, dimensionType, dimensionId])
  @@index([tenantId, date])
}

model Rule {
  id             String   @id @default(cuid())
  tenantId       String
  name           String
  description    String?
  scope          String   // account, campaign, adset, ad
  automationMode String   @default("suggestions_only")
  triggers       Json     // ["schedule", "threshold"]
  conditions     Json     // RuleCondition[]
  actions        Json     // RuleAction[]
  riskLevel      String   @default("medium")
  active         Boolean  @default(true)
  lastTriggeredAt DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  tenant         Tenant   @relation(fields: [tenantId], references: [id])
  executions     RuleExecution[]
}

model RuleExecution {
  id              String   @id @default(cuid())
  ruleId          String
  tenantId        String
  triggered       Boolean
  conditionsMet   Json     // string[]
  actionsTaken    Json     // RuleAction[]
  affectedEntities Json    // string[]
  executedAt      DateTime @default(now())
  
  rule            Rule     @relation(fields: [ruleId], references: [id])
}

model Alert {
  id            String   @id @default(cuid())
  tenantId      String
  type          String
  severity      String   // low, medium, high, critical
  entityType    String   // campaign, ad_set, ad, tracking, system
  entityId      String?
  title         String
  message       String
  recommendation String?
  status        String   @default("open")
  snoozedUntil  DateTime?
  resolvedAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, status])
}

model Settings {
  id            String   @id @default(cuid())
  tenantId      String   @unique
  brandProfile  Json     // BrandProfile
  automation    Json     // AutomationSettings
  notifications Json     // NotificationSettings
  community     Json     // CommunitySettings
  updatedAt     DateTime @updatedAt
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
}
```

**Implementation steps**:
1. `pnpm add -D prisma` and `pnpm add @prisma/client` in backend
2. Run `npx prisma init`
3. Add schema above
4. Run `npx prisma migrate dev --name init`
5. Create `src/db/client.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

### 2.2 Shopify OAuth (Real Implementation)

**Current state**: Skeleton OAuth flow with no token storage

**File**: `backend/src/api/authShopify.ts`

**Required changes**:

```typescript
// Add these imports
import { prisma } from '../db/client';
import crypto from 'crypto';

// Implement HMAC verification
function verifyHmac(query: Record<string, string>, secret: string): boolean {
  const { hmac, ...rest } = query;
  const message = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join('&');
  const computed = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(computed));
}

// Update callback handler
router.get("/callback", async (req, res) => {
  const { shop, code, state, hmac } = req.query;
  
  // 1. Verify HMAC
  if (!verifyHmac(req.query as Record<string, string>, config.shopify.apiSecret)) {
    return res.status(401).json({ error: { message: "Invalid HMAC" } });
  }
  
  // 2. Verify state matches stored nonce (use Redis)
  // const storedNonce = await redis.get(`oauth:${shop}`);
  // if (state !== storedNonce) return res.status(401)...
  
  // 3. Exchange code for token
  const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.shopify.apiKey,
      client_secret: config.shopify.apiSecret,
      code,
    }),
  });
  
  const { access_token, scope } = await tokenResponse.json();
  
  // 4. Create or update tenant
  const tenant = await prisma.tenant.upsert({
    where: { shopifyDomain: shop as string },
    update: { 
      shopifyAccessToken: encrypt(access_token), // Implement encryption
      updatedAt: new Date(),
    },
    create: {
      name: shop as string,
      shopifyDomain: shop as string,
      shopifyAccessToken: encrypt(access_token),
    },
  });
  
  // 5. Register webhooks
  await registerWebhooks(shop as string, access_token);
  
  // 6. Redirect to app
  return res.redirect(`${config.shopify.appUrl}/?shop=${shop}`);
});
```

**Additional requirements**:
- Implement token encryption (use `crypto.createCipheriv`)
- Add Redis for nonce storage
- Create webhook registration function
- Add session middleware for authenticated routes

---

### 2.3 Meta Ads OAuth

**Current state**: Placeholder in settings API

**Files to modify**:
- `backend/src/api/settings.ts`
- `backend/src/services/MetaAdsService.ts`

**Meta OAuth flow**:

```typescript
// backend/src/api/authMeta.ts (new file)
import { Router } from "express";
import { config } from "../config/env";
import { prisma } from "../db/client";

const router = Router();

// Step 1: Redirect to Facebook
router.get("/", (req, res) => {
  const { tenantId } = req.query;
  
  const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64');
  
  const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  authUrl.searchParams.set("client_id", config.meta.appId);
  authUrl.searchParams.set("redirect_uri", `${config.shopify.appUrl}/api/auth/meta/callback`);
  authUrl.searchParams.set("scope", "ads_management,ads_read,business_management");
  authUrl.searchParams.set("state", state);
  
  res.redirect(authUrl.toString());
});

// Step 2: Handle callback
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  
  const { tenantId } = JSON.parse(Buffer.from(state as string, 'base64').toString());
  
  // Exchange code for token
  const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", config.meta.appId);
  tokenUrl.searchParams.set("client_secret", config.meta.appSecret);
  tokenUrl.searchParams.set("redirect_uri", `${config.shopify.appUrl}/api/auth/meta/callback`);
  tokenUrl.searchParams.set("code", code as string);
  
  const tokenRes = await fetch(tokenUrl.toString());
  const { access_token } = await tokenRes.json();
  
  // Get long-lived token
  const longLivedUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
  longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
  longLivedUrl.searchParams.set("client_id", config.meta.appId);
  longLivedUrl.searchParams.set("client_secret", config.meta.appSecret);
  longLivedUrl.searchParams.set("fb_exchange_token", access_token);
  
  const longLivedRes = await fetch(longLivedUrl.toString());
  const { access_token: longLivedToken } = await longLivedRes.json();
  
  // Get ad accounts
  const accountsRes = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name&access_token=${longLivedToken}`
  );
  const { data: accounts } = await accountsRes.json();
  
  // Store first ad account (or let user choose)
  if (accounts.length > 0) {
    await prisma.adAccount.upsert({
      where: {
        tenantId_provider_externalId: {
          tenantId,
          provider: "meta",
          externalId: accounts[0].id,
        },
      },
      update: {
        accessToken: encrypt(longLivedToken),
        name: accounts[0].name,
      },
      create: {
        tenantId,
        provider: "meta",
        externalId: accounts[0].id,
        name: accounts[0].name,
        accessToken: encrypt(longLivedToken),
        isDefault: true,
      },
    });
  }
  
  res.redirect(`${config.shopify.appUrl}/settings?meta=connected`);
});

export default router;
```

---

### 2.4 Data Sync Worker

**Purpose**: Periodically sync data from Shopify and Meta APIs

**File**: `backend/src/workers/dataSync.ts`

```typescript
import { prisma } from "../db/client";
import { ShopifyService } from "../services/ShopifyService";
import { MetaAdsService } from "../services/MetaAdsService";
import { decrypt } from "../utils/crypto";

export async function syncTenantData(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { adAccounts: true },
  });
  
  if (!tenant) throw new Error("Tenant not found");
  
  // Sync Shopify orders
  if (tenant.shopifyAccessToken) {
    const shopify = new ShopifyService();
    shopify.init(tenant.shopifyDomain, decrypt(tenant.shopifyAccessToken));
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const orders = await shopify.getOrders(
      yesterday.toISOString(),
      new Date().toISOString()
    );
    
    const metrics = shopify.calculateRevenueMetrics(orders);
    
    // Store in MetricsDaily
    await prisma.metricsDaily.upsert({
      where: {
        tenantId_date_dimensionType_dimensionId: {
          tenantId,
          date: yesterday,
          dimensionType: "account",
          dimensionId: tenantId,
        },
      },
      update: {
        revenue: metrics.totalRevenue,
        orders: metrics.orderCount,
        customers: metrics.uniqueCustomers,
      },
      create: {
        tenantId,
        date: yesterday,
        dimensionType: "account",
        dimensionId: tenantId,
        revenue: metrics.totalRevenue,
        orders: metrics.orderCount,
        customers: metrics.uniqueCustomers,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
      },
    });
  }
  
  // Sync Meta Ads data
  for (const adAccount of tenant.adAccounts.filter(a => a.provider === "meta")) {
    const meta = new MetaAdsService();
    meta.init(decrypt(adAccount.accessToken!), adAccount.externalId);
    
    const insights = await meta.getAccountInsights("yesterday");
    
    await prisma.metricsDaily.upsert({
      where: {
        tenantId_date_dimensionType_dimensionId: {
          tenantId,
          date: yesterday,
          dimensionType: "adaccount",
          dimensionId: adAccount.id,
        },
      },
      update: {
        spend: insights.spend,
        impressions: insights.impressions,
        clicks: insights.clicks,
        conversions: insights.conversions,
      },
      create: {
        tenantId,
        date: yesterday,
        dimensionType: "adaccount",
        dimensionId: adAccount.id,
        spend: insights.spend,
        revenue: insights.conversionValue,
        impressions: insights.impressions,
        clicks: insights.clicks,
        conversions: insights.conversions,
        orders: 0,
        customers: 0,
      },
    });
    
    // Sync campaigns
    const campaigns = await meta.getCampaigns();
    for (const campaign of campaigns) {
      await prisma.campaign.upsert({
        where: {
          adAccountId_externalId: {
            adAccountId: adAccount.id,
            externalId: campaign.id,
          },
        },
        update: {
          name: campaign.name,
          status: campaign.status.toLowerCase(),
          objective: campaign.objective,
        },
        create: {
          tenantId,
          adAccountId: adAccount.id,
          externalId: campaign.id,
          name: campaign.name,
          status: campaign.status.toLowerCase(),
          objective: campaign.objective,
        },
      });
    }
  }
}

// Run as cron job or queue worker
export async function runDataSyncForAllTenants() {
  const tenants = await prisma.tenant.findMany({
    where: { shopifyAccessToken: { not: null } },
  });
  
  for (const tenant of tenants) {
    try {
      await syncTenantData(tenant.id);
      console.log(`Synced data for tenant: ${tenant.name}`);
    } catch (error) {
      console.error(`Failed to sync tenant ${tenant.id}:`, error);
    }
  }
}
```

**Scheduling options**:
1. **Simple**: Node cron (`node-cron` package)
2. **Robust**: BullMQ with Redis (recommended for production)
3. **Serverless**: AWS EventBridge + Lambda

---

## Phase 3: AI & Automation (2 weeks)

### 3.1 LLM Integration (Production)

**Current state**: Basic LLMClient with API calls

**Enhancements needed**:

```typescript
// backend/src/services/LLMClient.ts

// Add retry logic
async complete(
  systemPrompt: string,
  userMessage: string,
  options: LLMCompletionOptions = {}
): Promise<string> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await this.doComplete(systemPrompt, userMessage, options);
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}

// Add structured output parsing
async completeJSON<T>(
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const response = await this.complete(
    systemPrompt + "\n\nRespond with valid JSON only.",
    userMessage,
    { temperature: 0.3 }
  );
  
  const parsed = JSON.parse(response);
  return schema.parse(parsed);
}

// Add streaming support
async *stream(
  systemPrompt: string,
  userMessage: string
): AsyncGenerator<string> {
  // Implementation for streaming responses
}
```

### 3.2 Enhanced MetaBrainService

**Add context enrichment**:

```typescript
// backend/src/services/MetaBrainService.ts

async getRecommendations(params: GetRecommendationsParams): Promise<MetaBrainOutput> {
  // 1. Get current metrics
  const currentMetrics = await this.getMetricsFromDB(params.tenantId);
  
  // 2. Get historical metrics for comparison
  const historicalMetrics = await this.getHistoricalMetrics(params.tenantId, 7);
  
  // 3. Get active campaigns with performance
  const campaigns = await this.getCampaignPerformance(params.tenantId);
  
  // 4. Get tracking health
  const trackingHealth = await this.trackingService.getTrackingHealth(params.tenantId);
  
  // 5. Build rich context
  const context = {
    current: currentMetrics,
    trend: this.calculateTrends(historicalMetrics),
    topPerformers: campaigns.filter(c => c.roas > 3).map(c => c.name),
    underPerformers: campaigns.filter(c => c.roas < 1).map(c => c.name),
    trackingHealth,
    activeRules: await this.getActiveRules(params.tenantId),
  };
  
  // 6. Generate recommendations
  if (this.llmClient.isConfigured()) {
    return this.generateAIRecommendations(context);
  } else {
    return this.generateRuleBasedRecommendations(context);
  }
}

private async generateAIRecommendations(context: any): Promise<MetaBrainOutput> {
  const prompt = `
Given the following account data:

CURRENT METRICS:
- MER: ${context.current.mer.toFixed(2)}
- ROAS: ${context.current.metaRoas.toFixed(2)}
- CAC: $${context.current.cac.toFixed(0)}
- LTV:CAC: ${context.current.ltvToCac.toFixed(2)}

TRENDS (7-day):
${JSON.stringify(context.trend, null, 2)}

TOP PERFORMERS: ${context.topPerformers.join(", ") || "None"}
UNDER PERFORMERS: ${context.underPerformers.join(", ") || "None"}

TRACKING HEALTH:
- Pixel: ${context.trackingHealth.pixelStatus}
- CAPI: ${context.trackingHealth.capiStatus}
- EMQ: ${context.trackingHealth.eventMatchQuality}/10

Provide 3-5 actionable recommendations. For each:
1. Priority (high/medium/low)
2. Type (scale/pause/test/fix/monitor)
3. Title (clear action)
4. Description (why and what)
5. Expected impact
`;

  const response = await this.llmClient.completeJSON(
    META_BRAIN_PROMPT,
    prompt,
    recommendationsSchema
  );
  
  return response;
}
```

### 3.3 Rule Executor Worker

**File**: `backend/src/workers/ruleExecutor.ts`

```typescript
import { prisma } from "../db/client";
import { RulesEngine } from "../services/RulesEngine";
import { MetricsService } from "../services/MetricsService";
import { MetaAdsService } from "../services/MetaAdsService";
import { NotificationService } from "../services/NotificationService";

export async function executeRulesForTenant(tenantId: string) {
  const rules = await prisma.rule.findMany({
    where: { tenantId, active: true },
  });
  
  const metricsService = new MetricsService();
  const rulesEngine = new RulesEngine();
  const notificationService = new NotificationService();
  
  // Get current metrics
  const rawMetrics = await prisma.metricsDaily.findFirst({
    where: { tenantId, dimensionType: "account" },
    orderBy: { date: "desc" },
  });
  
  if (!rawMetrics) return;
  
  const metrics = metricsService.compute({
    spend: Number(rawMetrics.spend),
    revenue: Number(rawMetrics.revenue),
    orders: rawMetrics.orders,
    customers: rawMetrics.customers,
  });
  
  for (const rule of rules) {
    const result = rulesEngine.evaluateCustomRule(rule as any, metrics);
    
    // Log execution
    await prisma.ruleExecution.create({
      data: {
        ruleId: rule.id,
        tenantId,
        triggered: result.triggered,
        conditionsMet: result.triggered ? [result.reason] : [],
        actionsTaken: [],
        affectedEntities: [],
      },
    });
    
    if (result.triggered) {
      const actions = rule.actions as any[];
      
      for (const action of actions) {
        switch (action.type) {
          case "notify":
            await notificationService.send(tenantId, {
              title: `Rule Triggered: ${rule.name}`,
              message: result.reason,
              channels: action.notifyChannels || ["email"],
            });
            break;
            
          case "pause":
            if (rule.automationMode !== "suggestions_only") {
              // Get campaigns matching rule scope
              // Call Meta API to pause
            }
            break;
            
          case "scale_budget":
            if (rule.automationMode === "auto_all") {
              // Implement budget scaling
            }
            break;
        }
      }
      
      // Update last triggered
      await prisma.rule.update({
        where: { id: rule.id },
        data: { lastTriggeredAt: new Date() },
      });
    }
  }
}
```

### 3.4 Notification Service

**File**: `backend/src/services/NotificationService.ts`

```typescript
import { config } from "../config/env";

interface NotificationPayload {
  title: string;
  message: string;
  channels: ("email" | "slack" | "discord")[];
  severity?: "low" | "medium" | "high" | "critical";
}

export class NotificationService {
  async send(tenantId: string, payload: NotificationPayload) {
    const promises: Promise<void>[] = [];
    
    for (const channel of payload.channels) {
      switch (channel) {
        case "email":
          promises.push(this.sendEmail(tenantId, payload));
          break;
        case "slack":
          promises.push(this.sendSlack(payload));
          break;
        case "discord":
          promises.push(this.sendDiscord(payload));
          break;
      }
    }
    
    await Promise.allSettled(promises);
  }
  
  private async sendEmail(tenantId: string, payload: NotificationPayload) {
    if (!config.notifications.sendgridApiKey) return;
    
    // Get tenant email addresses from settings
    // Use SendGrid API
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.notifications.sendgridApiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: "merchant@example.com" }] }],
        from: { email: "alerts@yourdomain.com" },
        subject: payload.title,
        content: [{ type: "text/plain", value: payload.message }],
      }),
    });
  }
  
  private async sendSlack(payload: NotificationPayload) {
    if (!config.notifications.slackWebhookUrl) return;
    
    const color = {
      low: "#36a64f",
      medium: "#ffcc00",
      high: "#ff6600",
      critical: "#ff0000",
    }[payload.severity || "medium"];
    
    await fetch(config.notifications.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [{
          color,
          title: payload.title,
          text: payload.message,
          ts: Math.floor(Date.now() / 1000),
        }],
      }),
    });
  }
  
  private async sendDiscord(payload: NotificationPayload) {
    if (!config.notifications.discordWebhookUrl) return;
    
    await fetch(config.notifications.discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: payload.title,
          description: payload.message,
          color: 0x5865F2,
        }],
      }),
    });
  }
}
```

---

## Phase 4: Production Deployment (1 week)

### 4.1 Docker Setup

**File**: `infrastructure/docker/Dockerfile.backend`

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY common/package.json common/
COPY backend/package.json backend/

RUN pnpm install --frozen-lockfile

COPY common/ common/
COPY backend/ backend/

RUN pnpm --filter backend build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 4311

CMD ["node", "dist/index.js"]
```

**File**: `infrastructure/docker/docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ad_intelligence
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5544:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6385:6379"

  backend:
    build:
      context: ../..
      dockerfile: infrastructure/docker/Dockerfile.backend
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/ad_intelligence
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    ports:
      - "4311:4311"
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ../..
      dockerfile: infrastructure/docker/Dockerfile.frontend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:4311
    ports:
      - "4310:4310"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 4.2 Environment Variables (Production)

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5544/dbname?sslmode=require
REDIS_URL=redis://:password@host:6385

# Shopify
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,read_orders,read_customers,write_products
SHOPIFY_APP_URL=https://your-app.com

# Meta
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret

# LLM
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Notifications
SENDGRID_API_KEY=SG...
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Security
ENCRYPTION_KEY=32-byte-hex-string
SESSION_SECRET=your-session-secret
```

### 4.3 Deployment Checklist

- [ ] Set up PostgreSQL (AWS RDS / Supabase / Neon)
- [ ] Set up Redis (AWS ElastiCache / Upstash)
- [ ] Configure SSL certificates
- [ ] Set up domain and DNS
- [ ] Create Shopify app in Partner Dashboard
- [ ] Create Meta app in Developer Console
- [ ] Configure OAuth redirect URIs
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Set up log aggregation
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Run security audit
- [ ] Load test critical endpoints

---

## Appendix A: Security Considerations

### Token Encryption

```typescript
// backend/src/utils/crypto.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Rate Limiting

```typescript
// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../db/redis';

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: { message: 'Too many requests' } },
});

export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: { error: { message: 'Too many login attempts' } },
});
```

---

## Appendix B: Testing Strategy

### Unit Tests

```typescript
// tests/backend/services/MetricsService.test.ts
import { MetricsService } from '../../../backend/src/services/MetricsService';

describe('MetricsService', () => {
  const service = new MetricsService();

  describe('compute', () => {
    it('calculates MER correctly', () => {
      const result = service.compute({
        spend: 1000,
        revenue: 3000,
        totalMarketingSpend: 1000,
      });
      
      expect(result.mer).toBe(3.0);
    });

    it('calculates CAC correctly', () => {
      const result = service.compute({
        totalMarketingSpend: 1000,
        customers: 10,
      });
      
      expect(result.cac).toBe(100);
    });

    it('handles division by zero', () => {
      const result = service.compute({
        spend: 0,
        revenue: 0,
        orders: 0,
        customers: 0,
      });
      
      expect(result.mer).toBe(0);
      expect(result.cac).toBe(0);
      expect(result.aov).toBe(0);
    });
  });
});
```

### Integration Tests

```typescript
// tests/backend/api/overview.test.ts
import request from 'supertest';
import { app } from '../../../backend/src';

describe('GET /api/overview', () => {
  it('returns dashboard data', async () => {
    const response = await request(app)
      .get('/api/overview')
      .expect(200);
    
    expect(response.body.data).toHaveProperty('kpis');
    expect(response.body.data).toHaveProperty('metrics');
  });
});
```

### E2E Tests

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('dashboard loads and displays KPIs', async ({ page }) => {
  await page.goto('/');
  
  await expect(page.getByText('Overview')).toBeVisible();
  await expect(page.getByText('Revenue')).toBeVisible();
  await expect(page.getByText('ROAS')).toBeVisible();
});
```

---

## Appendix C: Troubleshooting

### Common Issues

**1. TypeScript path resolution errors**
```bash
# Ensure tsconfig paths match actual structure
# Check that workspace dependencies are linked
pnpm install
```

**2. Polaris icons not found**
```bash
# Install polaris-icons separately
pnpm add @shopify/polaris-icons --filter frontend
```

**3. OAuth redirect mismatch**
- Verify `SHOPIFY_APP_URL` matches Shopify Partner Dashboard
- Ensure Meta App redirect URIs are configured

**4. Database connection failures**
```bash
# Test connection
npx prisma db pull

# Reset if needed
npx prisma migrate reset
```

**5. LLM API rate limits**
- Implement exponential backoff (included in LLMClient)
- Consider caching recommendations for 5-10 minutes

---

## Summary

This implementation guide covers everything needed to take the Phase 1 skeleton to production:

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 1** ✅ | Complete | Types, skeleton API, mock data, UI |
| **Phase 2** | 2-3 weeks | Database, OAuth, data sync |
| **Phase 3** | 2 weeks | AI integration, automation, notifications |
| **Phase 4** | 1 week | Docker, deployment, monitoring |

**Total estimated time to production MVP: 5-6 weeks**

For questions or issues, refer to:
- Shopify App Development: https://shopify.dev/docs/apps
- Meta Marketing API: https://developers.facebook.com/docs/marketing-apis
- Polaris Components: https://polaris.shopify.com/components

---

*Document version: 1.0.0*
*Last updated: Phase 1 completion*

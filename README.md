# Shopify Ad Intelligence

> Profit-first AI co-pilot for Shopify merchants running Meta Ads. Connects Shopify + Meta data, applies world-class media-buying logic through an LLM-powered brain, and automates decisions with configurable safety rails.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
- [Workspace Commands](#workspace-commands)
- [Backend API](#backend-api)
- [Frontend Experience](#frontend-experience)
- [Core Modules](#core-modules)
- [Data & Integrations](#data--integrations)
- [Testing & Quality](#testing--quality)
- [Roadmap](#roadmap)
- [License](#license)

## Overview
The platform turns noisy acquisition data into clear, profit-focused actions:
- **Profit-first metrics** such as MER, CAC, LTV:CAC, AOV, and payback period.
- **MetaBrain AI co-pilot** that blends rule-based guardrails with GPT-4o/Claude reasoning.
- **Automation engine** that can suggest, alert, or execute actions across campaigns.
- **Tracking command center** for Pixel + CAPI diagnostics and recommendations.
- **Creative intelligence** for variants, scoring, compliance, and competitor monitoring.
- **Enterprise foundation**: Prisma/PostgreSQL, Redis, encrypted tokens, background workers, and Slack/Discord/Email notifications.

## Architecture
| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 14, React 18, Shopify Polaris, App Bridge | Served on `http://localhost:4310` in dev |
| Backend | Express.js, TypeScript, Zod, Prisma | API + workers on `http://localhost:4311` |
| Database | PostgreSQL + Prisma ORM | Tokenized data + metrics warehouse |
| Cache/Queues | Redis 7 | OAuth nonce storage, future job queues |
| AI/ML | OpenAI GPT-4o, Anthropic Claude Sonnet | Abstracted via `LLMClient` with retries/streaming |
| Notifications | SendGrid, Slack, Discord webhooks | Configurable per tenant |
| Infrastructure | pnpm workspaces, Docker (future), GitHub Actions CI | Ready for containerized deploys |

## Repository Layout
```
├── backend/                     # Express API + workers
│   ├── src/
│   │   ├── api/                 # REST routes (auth, overview, campaigns, rules…)
│   │   ├── services/            # Metrics, MetaBrain, LLMClient, Shopify, Meta, notifications
│   │   ├── workers/             # dataSync, ruleExecutor
│   │   ├── db/                  # Prisma + Redis clients
│   │   └── config/              # Env validation, prompts
│   └── prisma/                  # schema.prisma + migrations
├── frontend/                    # Next.js app with Polaris UI
│   ├── src/pages/               # Overview, Campaigns, Rules, Creatives, Alerts, Reports, Settings
│   ├── src/components/          # App layout and sections
│   └── src/lib/                 # API client, Shopify helpers
├── common/                      # Shared types + presets
│   ├── src/types/               # Metrics, rules, meta brain contracts
│   └── src/config/              # Rule presets, shared config
├── docs/                        # Supplementary documentation
└── shopify-ad-intelligence-guide.md  # Full implementation playbook
```

## Getting Started
### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL 14+ (Phase 2)
- Redis 7+

### Installation
```bash
pnpm install

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Environment Variables (highlights)
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend port | `4311` |
| `SHOPIFY_APP_URL` | Public/frontend URL | `http://localhost:4310` |
| `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` | Shopify OAuth credentials | `xxx` |
| `SHOPIFY_SCOPES` | Requested Shopify scopes | `read_orders,write_products` |
| `META_APP_ID` / `META_APP_SECRET` | Meta Marketing API creds | `xxx` |
| `DATABASE_URL` | Prisma connection string | `postgresql://localhost:5544/ad_intelligence` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6385` |
| `LLM_PROVIDER` | `openai` or `anthropic` | `openai` |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | LLM keys | `sk-...` |
| `ENCRYPTION_KEY` | 32-byte hex for token encryption | `0123...abcd` |
| `SENDGRID_API_KEY` / `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL` | Notification channels | `https://hooks...` |

### Run the stack
```bash
pnpm dev          # Start frontend + backend
pnpm dev:backend  # API only (http://localhost:4311)
pnpm dev:frontend # UI only (http://localhost:4310)
```

### Default Local Ports
- Frontend: `http://localhost:4310`
- Backend / API: `http://localhost:4311`
- PostgreSQL: `localhost:5544`
- Redis: `localhost:6385`

> These non-standard ports avoid conflicts with other projects that typically occupy 3000/3001/5432/6379.

## Workspace Commands
```bash
pnpm build        # Build all packages
pnpm test         # Run unit + integration tests
pnpm lint         # ESLint across packages
pnpm typecheck    # tsc --noEmit for each workspace
pnpm --filter backend prisma migrate dev --name init  # Create DB schema
pnpm clean        # Clean build artifacts
```

## Backend API
### Base URL
- Development: `http://localhost:4311/api`

### Key Routes
| Route | Description |
|-------|-------------|
| `GET /health` | Liveness + version |
| `GET /overview` | Profit-first KPIs + summaries |
| `GET /overview/recommendations` | AI/Rule driven insights |
| `GET /campaigns` + `/campaigns/:id` | Meta campaign data |
| `GET/POST /rules` | Automation rule CRUD |
| `POST /rules/:id/test` | Dry-run rule evaluation |
| `GET /creatives/*` | Creative variants, competitors, scoring |
| `GET /alerts` / `/alerts/stats/summary` | Alert center |
| `GET /reports/*` | Summary, creative, benchmark, cohort reports |
| `GET /settings` + sub-routes | Brand profile, automation, notifications, integrations |
| `GET /tracking/*` | Pixel/CAPI status, diagnostics, recommendations |
| `GET /auth/shopify` | Shopify OAuth entry (HMAC + Redis nonce) |
| `GET /auth/meta` | Meta Marketing OAuth flow |

### Background Workers
- `dataSync`: pulls Shopify orders + Meta insights into `MetricsDaily` via Prisma, ensuring MER/CAC dashboards have fresh data.
- `ruleExecutor`: evaluates active rules, records executions, invokes NotificationService, and (soon) applies Meta actions.

## Frontend Experience
- Next.js 14 app styled with Shopify Polaris for a native-admin feel.
- Pages: Overview dashboard, Campaign explorer, Rule builder, Creative Intelligence, Creative Studio, Alerts, Reports, Settings.
- API layer in `frontend/src/lib/apiClient.ts` handles typed requests to the backend, respecting `NEXT_PUBLIC_API_URL`.
- App Bridge-ready layout via `components/layout/AppLayout.tsx`, ready for embedded app deployment.

## Core Modules
- **MetricsService** – Computes MER, CAC, LTV:CAC, payback, compares time windows, and scores account health.
- **MetaBrainService** – Aggregates live/historical metrics, campaign performance, tracking health, and active rules; falls back to rule-based output or uses the LLM for structured recommendations (JSON schema validated).
- **LLMClient** – Provider-agnostic wrapper with retries, exponential backoff, JSON parsing helper, and streaming support for GPT-4o.
- **RulesEngine** – Evaluates preset/custom rules, interprets risk levels, and powers the automation loop.
- **ShopifyService / MetaAdsService** – Thin SDKs over Shopify Admin API (2024-01) and Meta Marketing API (v19) for OAuth, campaign data, insights, and budget controls.
- **NotificationService** – Sends multi-channel notifications (email via SendGrid, Slack, Discord) with severity-aware formatting.
- **TrackingService** – Synthesizes Pixel + CAPI status, EMQ, dedup rates, and recommended fixes.

## Data & Integrations
- **Prisma ORM** with PostgreSQL backing multi-tenant objects (Tenants, Users, AdAccounts, Campaigns, MetricsDaily, Rules, Alerts, Settings).
- **Redis** caches Shopify OAuth nonces (state validation) and is ready for job queues/rate limiting.
- **Token Encryption** implemented via AES-256-GCM (`backend/src/utils/crypto.ts`), keyed by `ENCRYPTION_KEY`.
- **Shopify OAuth** verifies HMAC signatures, stores encrypted tokens, and auto-registers critical webhooks.
- **Meta OAuth** exchanges codes for long-lived tokens, persists ad accounts, and seeds default accounts.
- **Background jobs** keep MetricsDaily tables hydrated and log every rule evaluation for auditability.

## Testing & Quality
- **Unit/Integration Tests** – Jest-based suites (see `tests/backend` examples in guide) for services and APIs.
- **Linting & Type Safety** – ESLint + TypeScript strict settings across `backend`, `frontend`, and `common`.
- **Database workflows** – `pnpm --filter backend prisma migrate dev` to evolve schema; `.env.example` captures required secrets.
- **Continuous Integration** – `.github/workflows/ci.yml` ready for typecheck/lint/test/build pipelines.

## Roadmap
| Phase | Status | Highlights |
|-------|--------|------------|
| Phase 1 | ✅ Complete | Typed skeleton, mock data, UI shell |
| Phase 2 | 🚧 In Progress | Prisma DB, Shopify/Meta OAuth, encrypted storage, data sync |
| Phase 3 | ⏳ Planned | Full AI automation loop, notification routing, advanced MetaBrain |
| Phase 4 | ⏳ Planned | Dockerized deploy, monitoring, production hardening |

## License
Private – All rights reserved.

 Shopify Ad Intelligence

> Profit-first AI co-pilot for Shopify brands running Meta ads. It connects Shopify + Meta data, runs world-class media-buying logic through an LLM-powered brain, and automates decisions with configurable safety rails.

## Table of Contents

* [Overview](#overview)
* [Architecture](#architecture)
* [Repository Layout](#repository-layout)
* [Getting Started](#getting-started)
* [Workspace Commands](#workspace-commands)
* [Backend API](#backend-api)
* [Frontend Experience](#frontend-experience)
* [Core Modules](#core-modules)
* [Data & Integrations](#data--integrations)
* [Testing & Quality](#testing--quality)
* [Roadmap](#roadmap)
* [License](#license)

## Overview

Turn noisy acquisition data into clear, profit-focused actions:

* **Profit-first metrics**: MER, CAC, LTV:CAC, AOV, payback period.
* **MetaBrain AI co-pilot** that blends rule-based guardrails with LLM reasoning.
* **Automation engine** that can suggest, alert, or execute campaign actions.
* **Tracking command center** for Pixel + CAPI diagnostics and fixes.
* **Creative intelligence** for variants, scoring, compliance, and competitive monitoring.
* **Production-ready foundation**: Prisma/PostgreSQL, Redis, encrypted tokens, background workers, and Slack/Discord/Email notifications.

## Architecture

| Layer          | Technology                                        | Notes                                       |
| -------------- | ------------------------------------------------- | ------------------------------------------- |
| Frontend       | Next.js 14, React 18, Shopify Polaris, App Bridge | Dev: `http://localhost:4310`                |
| Backend        | Express.js, TypeScript, Zod, Prisma               | API + workers: `http://localhost:4311`      |
| Database       | PostgreSQL + Prisma ORM                           | Tokenized data + metrics warehouse          |
| Cache/Queues   | Redis 7                                           | OAuth nonces + future job queues            |
| AI/ML          | OpenAI GPT-4o, Anthropic Claude Sonnet            | Abstracted via `LLMClient` (retries/stream) |
| Notifications  | SendGrid, Slack, Discord webhooks                 | Configurable per tenant                     |
| Infrastructure | pnpm workspaces, Docker (planned), GitHub Actions | Container-friendly, CI-ready                |

## Repository Layout

```bash
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
│   ├── src/components/          # Layout + shared UI sections
│   └── src/lib/                 # API client, Shopify helpers
├── common/                      # Shared types + presets
│   ├── src/types/               # Metrics, rules, MetaBrain contracts
│   └── src/config/              # Rule presets, shared config
├── docs/                        # Supplementary documentation
└── shopify-ad-intelligence-guide.md  # Full implementation playbook
```

## Getting Started

### Prerequisites

* Node.js 20+
* pnpm 9+
* PostgreSQL 14+ (Phase 2+)
* Redis 7+

### Installation

```bash
pnpm install

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Environment Variables (highlights)

| Variable                                                         | Description                      | Example                                       |
| ---------------------------------------------------------------- | -------------------------------- | --------------------------------------------- |
| `PORT`                                                           | Backend port                     | `4311`                                        |
| `SHOPIFY_APP_URL`                                                | Public/frontend URL              | `http://localhost:4310`                       |
| `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET`                         | Shopify OAuth creds              | `xxx`                                         |
| `SHOPIFY_SCOPES`                                                 | Shopify scopes                   | `read_orders,write_products`                  |
| `META_APP_ID` / `META_APP_SECRET`                                | Meta Marketing API creds         | `xxx`                                         |
| `DATABASE_URL`                                                   | Prisma connection string         | `postgresql://localhost:5544/ad_intelligence` |
| `REDIS_URL`                                                      | Redis connection string          | `redis://localhost:6385`                      |
| `LLM_PROVIDER`                                                   | `openai` or `anthropic`          | `openai`                                      |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`                           | LLM API keys                     | `sk-...`                                      |
| `ENCRYPTION_KEY`                                                 | 32-byte hex for token encryption | `0123...abcd`                                 |
| `SENDGRID_API_KEY` / `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL` | Notification channels            | `https://hooks...`                            |

### Run the stack

```bash
pnpm dev          # Start frontend + backend together
pnpm dev:backend  # API only (http://localhost:4311)
pnpm dev:frontend # UI only (http://localhost:4310)
```

### Default Local Ports

* Frontend: `http://localhost:4310`
* Backend / API: `http://localhost:4311`
* PostgreSQL: `localhost:5544`
* Redis: `localhost:6385`

> Non-standard ports avoid conflicts with common defaults (`3000/3001/5432/6379`).

## Workspace Commands

```bash
pnpm build        # Build all packages
pnpm test         # Run unit + integration tests
pnpm lint         # ESLint across packages
pnpm typecheck    # TypeScript --noEmit per workspace
pnpm --filter backend prisma migrate dev --name init  # Create DB schema
pnpm clean        # Clean build artifacts
```

## Backend API

### Base URL

* Dev: `http://localhost:4311/api`

### Key Routes

| Route                                   | Description                                            |
| --------------------------------------- | ------------------------------------------------------ |
| `GET /health`                           | Liveness + version                                     |
| `GET /overview`                         | Profit-first KPIs + summaries                          |
| `GET /overview/recommendations`         | AI/Rule-driven insights                                |
| `GET /campaigns` / `/campaigns/:id`     | Meta campaign data                                     |
| `GET /rules` / `POST /rules`            | Automation rule CRUD                                   |
| `POST /rules/:id/test`                  | Dry-run rule evaluation                                |
| `GET /creatives/*`                      | Creative variants, competitors, scoring                |
| `GET /alerts` / `/alerts/stats/summary` | Alert center                                           |
| `GET /reports/*`                        | Summary, creative, benchmark, cohort reports           |
| `GET /settings` + sub-routes            | Brand profile, automation, notifications, integrations |
| `GET /tracking/*`                       | Pixel/CAPI status, diagnostics, recommendations        |
| `GET /auth/shopify`                     | Shopify OAuth (HMAC + Redis nonce)                     |
| `GET /auth/meta`                        | Meta Marketing OAuth flow                              |

### Background Workers

* `dataSync` – Pulls Shopify orders + Meta insights into `MetricsDaily` via Prisma so MER/CAC dashboards stay fresh.
* `ruleExecutor` – Evaluates active rules, logs executions, triggers `NotificationService`, and (soon) applies Meta actions.

## Frontend Experience

* Next.js 14 app styled with Shopify Polaris for a native-admin feel.
* Key pages: Overview, Campaigns, Rules, Creative Intelligence, Creative Studio, Alerts, Reports, Settings.
* API layer in `frontend/src/lib/apiClient.ts` provides typed access to the backend via `NEXT_PUBLIC_API_URL`.
* App Bridge-ready layout in `components/layout/AppLayout.tsx` for embedded-app deployment.

## Core Modules

* **MetricsService** – Computes MER, CAC, LTV:CAC, payback, window comparisons, and overall account health scores.
* **MetaBrainService** – Aggregates metrics, campaign performance, tracking health, and active rules; falls back to deterministic rules or uses the LLM for schema-validated recommendations.
* **LLMClient** – Provider-agnostic wrapper with retries, exponential backoff, JSON parsing helpers, and streaming support.
* **RulesEngine** – Evaluates preset/custom rules, handles risk levels, and powers the automation loop.
* **ShopifyService / MetaAdsService** – Thin SDKs over Shopify Admin API (2024-01) and Meta Marketing API (v19) for auth, data, insights, and budget controls.
* **NotificationService** – Multi-channel notifications (SendGrid email, Slack, Discord) with severity-aware formatting.
* **TrackingService** – Combines Pixel + CAPI status, EMQ, deduplication rates, and recommended fixes.

## Data & Integrations

* **Prisma ORM** with PostgreSQL backing multi-tenant entities: Tenants, Users, AdAccounts, Campaigns, `MetricsDaily`, Rules, Alerts, Settings.
* **Redis** caches Shopify OAuth nonces (state validation) and is ready for queues / rate limiting.
* **Token encryption** via AES-256-GCM (`backend/src/utils/crypto.ts`), keyed by `ENCRYPTION_KEY`.
* **Shopify OAuth**: verifies HMAC, stores encrypted tokens, and registers critical webhooks.
* **Meta OAuth**: exchanges codes for long-lived tokens, persists ad accounts, and seeds defaults.
* **Background jobs** hydrate `MetricsDaily` and log every rule evaluation for audit and debugging.

## Testing & Quality

* **Unit/Integration tests** – Jest suites for services and APIs (see `tests/backend` examples in the guide).
* **Linting & types** – ESLint + strict TypeScript across `backend`, `frontend`, and `common`.
* **Database workflows** – `pnpm --filter backend prisma migrate dev` to evolve schema; `.env.example` documents required secrets.
* **Continuous Integration** – `.github/workflows/ci.yml` for typecheck/lint/test/build pipelines.

## Roadmap

| Phase   | Status         | Highlights                                                        |
| ------- | -------------- | ----------------------------------------------------------------- |
| Phase 1 | ✅ Complete     | Typed skeleton, mock data, UI shell                               |
| Phase 2 | 🚧 In progress | Prisma DB, Shopify/Meta OAuth, encrypted storage, data sync       |
| Phase 3 | ⏳ Planned      | Full AI automation loop, notification routing, advanced MetaBrain |
| Phase 4 | ⏳ Planned      | Dockerized deploy, monitoring, production hardening               |

## License

Private – All rights reserved.


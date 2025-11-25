# Shopify Ad Intelligence

Profit-first AI co-pilot for Shopify merchants running Meta Ads. Connects store + ad data, applies elite media-buying logic via an LLM-powered "brain," and automates profit-focused decisions.

## Tech Stack

- **Frontend**: Next.js + Shopify Polaris + App Bridge
- **Backend**: Express + TypeScript
- **Common**: Shared types and utilities
- **Database**: PostgreSQL + Redis (Phase 2)
- **AI**: OpenAI/Anthropic LLM integration

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment files
cp backend/.env.example backend/.env

# Start development servers
pnpm dev
```

### Available Scripts

```bash
pnpm dev          # Start all services in dev mode
pnpm dev:backend  # Start backend only
pnpm dev:frontend # Start frontend only
pnpm build        # Build all packages
pnpm test         # Run tests
pnpm lint         # Lint all packages
pnpm typecheck    # Type check all packages
```

### Default Local Ports

- Frontend: http://localhost:4310
- Backend: http://localhost:4311
- PostgreSQL: localhost:5544
- Redis: localhost:6385

> These non-standard ports keep the project isolated from other services that commonly occupy 3000/3001/5432/6379 on shared dev machines.

## Project Structure

```
├── backend/         # Express API server
│   ├── src/
│   │   ├── api/         # API routes
│   │   ├── services/    # Business logic
│   │   ├── config/      # Configuration
│   │   └── middleware/  # Express middleware
├── frontend/        # Next.js app
│   ├── src/
│   │   ├── pages/       # Next.js pages
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities
├── common/          # Shared types
│   └── src/
│       ├── types/       # TypeScript interfaces
│       └── config/      # Shared configuration
└── docs/            # Documentation
```

## Core Features

- **Profit-First Metrics**: MER, CAC, LTV:CAC, AOV, Payback Days
- **AI Brain Service**: LLM-powered recommendations
- **Rule Engine**: Automated actions with safety rails
- **Tracking Health**: Pixel + CAPI diagnostics
- **Creative Studio**: Variant generation and scoring

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| GET /api/overview | Dashboard KPIs and recommendations |
| GET /api/campaigns | Campaign list with metrics |
| GET /api/rules | Automation rules |
| GET /api/creatives/variants | Creative variants |
| GET /api/alerts | Active alerts |
| GET /api/reports/summary | Performance reports |
| GET /api/settings | App settings |
| GET /api/tracking/health | Tracking diagnostics |

## Development Phases

- **Phase 1** ✅ Core skeleton and types
- **Phase 2** 🔲 Shopify/Meta OAuth, database, real data
- **Phase 3** 🔲 AI Brain, automation workers
- **Phase 4** 🔲 Production deployment

## License

Private - All rights reserved

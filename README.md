# Verified AR

Argentine sneaker marketplace with bid/ask matching, local authentication, and Mercado Pago integration.

## Quick Start

```bash
# 1. Install dependencies
pnpm install && cd frontend && pnpm install && cd ../backend && pnpm install

# 2. Configure environment
cp env.template .env
# Edit .env with Supabase credentials

# 3. Start services
docker-compose up --build
```

**Access**: http://localhost:3000

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS, TypeScript |
| Backend | Next.js API Routes, Zod validation |
| Database | PostgreSQL (Supabase) with RLS |
| Auth | Supabase Auth |
| Payments | Mercado Pago |

## Project Structure

```
├── frontend/       # Next.js frontend (port 3000)
├── backend/        # Next.js API backend (port 4000)
├── docs/           # All documentation
└── scripts/        # Seed and validation scripts
```

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/SETUP.md`](./docs/SETUP.md) | Complete setup guide |
| [`docs/roadmap-mvp.md`](./docs/roadmap-mvp.md) | Current MVP tasks |
| [`docs/architecture.md`](./docs/architecture.md) | System design |
| [`docs/MATCHING.md`](./docs/MATCHING.md) | Bid/Ask matching engine |
| [`docs/schema.sql`](./docs/schema.sql) | Database schema |
| [`docs/DOCKER-TESTING.md`](./docs/DOCKER-TESTING.md) | Testing guide |

## Commands

```bash
pnpm dev              # Start all services
pnpm seed             # Seed products
pnpm test:db          # Test database connection
pnpm test:env         # Start test environment
```

## Status

**Current Phase**: Week 7-8 (Stability & Validation)  
**Progress**: 60% Complete

See [`docs/PROJECT-STATUS.md`](./docs/PROJECT-STATUS.md) for details.

## License

Private - All rights reserved

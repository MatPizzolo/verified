# Verified AR

Argentine sneaker marketplace with bid/ask matching engine.

---

## Quick Start

```bash
# 1. Setup environment
cp env.template .env
# Edit .env with Supabase credentials

# 2. Install dependencies
pnpm install

# 3. Start Docker
docker-compose up -d --build

# 4. Seed demo data (3 featured users + images)
docker exec verified-backend-1 bash /app/root-scripts/docker-demo-setup.sh
```

**Access:** http://localhost:3000

---

## Documentation

- **[DEMO.md](./docs/DEMO.md)** - Demo setup & featured users
- **[roadmap-mvp.md](./docs/roadmap-mvp.md)** - Development roadmap
- **[MATCHING.md](./docs/MATCHING.md)** - Matching engine details
- **[architecture.md](./docs/architecture.md)** - System architecture

---

## Testing

```bash
# Integration tests
pnpm test:integration

# Validation tests
pnpm test:matching
pnpm test:pricing
```

---

## Project Structure

```
/frontend          # Next.js 15 app
/backend           # API routes & services
/scripts
  /demo            # Demo data seeding
  /validation      # Test scripts
/docs              # Documentation
```

---

## Demo Users

**Password:** `Demo1234!`

- `mateo.collector@demo.com` - Active buyer (10 saved, 3 purchases, 5 bids)
- `sofia.reseller@demo.com` - Power seller (2 sales, 6 listings)
- `lucas.casual@demo.com` - Casual buyer (4 saved, 2 bids)

See [DEMO.md](./docs/DEMO.md) for full guide.

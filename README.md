# Verified AR - Argentine Sneaker Marketplace

A localized StockX clone for the Argentine market with local authentication and ARS payment support.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- pnpm (package manager)
- Supabase account

### Setup Instructions

**📖 Complete Setup Guide**: See [`docs/SETUP.md`](./docs/SETUP.md) for detailed step-by-step instructions.

**Quick Start**:

1. **Install dependencies**:
```bash
# Root dependencies
pnpm install

# Frontend dependencies
cd frontend && pnpm install

# Backend dependencies
cd ../backend && pnpm install
```

2. **Set up Supabase**:
   - Create account at [supabase.com](https://supabase.com)
   - Create new project
   - Go to SQL Editor and run `docs/schema.sql`
   - Copy API credentials from Project Settings → API

3. **Configure environment**:
```bash
cp env.template .env
# Edit .env with your Supabase credentials
```

4. **Test database connection**:
```bash
pnpm test:db
```

5. **Start with Docker**:
```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

6. **Test Docker services**:
```bash
pnpm test:docker
```

7. **Access the application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Nginx proxy: http://localhost

8. **Test authentication**:
- Visit http://localhost:3000/register
- Create a test account
- Login at http://localhost:3000/login

### Development (without Docker)

```bash
# Terminal 1: Frontend
cd frontend
pnpm dev

# Terminal 2: Backend
cd backend
pnpm dev
```

## Project Structure

```
/
├── frontend/          # Next.js frontend (port 3000)
│   ├── src/
│   │   ├── app/      # App router pages
│   │   ├── components/
│   │   ├── lib/      # Supabase client
│   │   ├── hooks/
│   │   └── types/
│   └── Dockerfile
├── backend/           # Next.js API backend (port 4000)
│   ├── src/
│   │   ├── app/api/  # API routes
│   │   └── lib/      # Supabase server client
│   └── Dockerfile
├── nginx/             # Nginx reverse proxy config
├── docs/              # Documentation and roadmaps
│   ├── roadmap-mvp.md    # MVP launch tasks
│   ├── roadmap-v2.md     # Post-MVP features
│   ├── schema.sql        # Database schema
│   └── architecture.md   # System architecture
└── docker-compose.yml
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires Bearer token)

### Health Checks
- `GET /api/health` - Backend health check
- `GET /health` - Nginx health check

## Next Steps

Follow the MVP roadmap in `docs/roadmap-mvp.md`:

**Week 1-2**: ✅ Infrastructure & Authentication (IN PROGRESS)
- [x] Docker setup
- [x] Database setup
- [x] Basic authentication endpoints
- [ ] Authentication UI components
- [ ] Middleware for route protection

**Week 3-4**: Product Catalog
**Week 5-6**: Bid/Ask Engine
**Week 7-8**: Payments & Checkout
**Week 9-10**: Admin & Launch

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, TypeScript
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Payments**: Mercado Pago (coming soon)
- **Search**: Algolia (coming in V2)
- **Images**: Cloudinary (coming soon)
- **Deployment**: Docker, Vercel

## Contributing

This is a private project. See `docs/roadmap-mvp.md` for current tasks.

## License

Private - All rights reserved
# verified

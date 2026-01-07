# Docker Testing Infrastructure

## Overview

This document describes the Docker setup for running tests in an isolated environment, separate from your development database.

## Architecture

### Development Environment (`docker-compose.yml`)
- **Frontend**: Port 3000, uses external Supabase
- **Backend**: Port 4000, uses external Supabase
- **Nginx**: Port 80, reverse proxy
- **Hot Reload**: Enabled via bind mounts

### Test Environment (`docker-compose.test.yml`)
- **Test Database**: Local PostgreSQL on port 5433
- **Backend Test**: Runs unit and integration tests
- **Frontend Test**: Port 3001 for E2E tests
- **Isolated Data**: Separate volume, won't affect dev data

## Quick Start

### Run Tests in Docker

```bash
# Start test environment (includes test database)
pnpm test:env

# Run tests in backend container
docker exec verified-backend-test pnpm test

# Run specific test file
docker exec verified-backend-test pnpm test market-engine.test.ts

# Stop and clean up test environment
pnpm test:env:down
```

### Development Workflow

```bash
# Start development environment
pnpm dev

# In another terminal, run tests locally
cd backend && pnpm test

# Or run validation scripts
pnpm test:market
pnpm test:matching
pnpm test:pricing
```

## File Structure

```
/
├── docker-compose.yml          # Development environment
├── docker-compose.test.yml     # Test environment
├── frontend/
│   ├── Dockerfile              # Production build
│   ├── Dockerfile.dev          # Development with hot-reload
│   └── scripts/
│       └── wait-for-it.sh      # Wait for dependencies
├── backend/
│   ├── Dockerfile              # Production build
│   ├── Dockerfile.dev          # Development with hot-reload
│   └── scripts/
│       └── wait-for-it.sh      # Wait for dependencies
├── env.test.template           # Test environment variables
└── .env.test                   # Your test credentials (gitignored)
```

## Environment Variables

### Development (`.env`)
- Uses external Supabase project
- Shared with team
- Persistent data

### Testing (`.env.test`)
- Uses local PostgreSQL in Docker
- Isolated per developer
- Ephemeral data (reset on `down -v`)

Copy `env.test.template` to `.env.test` and configure:

```bash
cp env.test.template .env.test
# Edit .env.test with your test credentials
```

## Key Features

### 1. Wait-for-it Script
- Ensures database is ready before tests run
- Prevents "connection refused" errors
- 60-second timeout with retries

### 2. Health Checks
- PostgreSQL: `pg_isready` check every 5s
- Backend: HTTP health endpoint
- Frontend: HTTP health endpoint

### 3. Volume Mappings
- **Bind Mounts**: `./backend:/app` for hot-reload
- **Anonymous Volumes**: `/app/node_modules` to prevent overwrite
- **Cache Volumes**: `/app/.next` for build cache

### 4. Network Isolation
- Development: `verified-network`
- Testing: `verified-test-network`
- Services communicate via service names (e.g., `backend`, `test-db`)

## Common Commands

### Development
```bash
# Start all services
pnpm dev

# Rebuild after dependency changes
pnpm build && pnpm dev

# View logs
pnpm logs

# Stop services
pnpm down
```

### Testing
```bash
# Start test environment
pnpm test:env

# Run unit tests
docker exec verified-backend-test pnpm test

# Run integration tests
docker exec verified-backend-test pnpm test:integration

# Run E2E tests
docker exec verified-frontend-test pnpm test:e2e

# Clean up (removes test data)
pnpm test:env:down
```

### Database
```bash
# Connect to test database
docker exec -it verified-test-db psql -U postgres -d verified_test

# Run migrations
docker exec verified-test-db psql -U postgres -d verified_test -f /docker-entrypoint-initdb.d/01-schema.sql

# Seed test data
pnpm test:market
```

## Troubleshooting

### Tests fail with "connection refused"
**Cause**: Database not ready  
**Solution**: Wait-for-it script should handle this. Check logs:
```bash
docker logs verified-backend-test
```

### Hot reload not working
**Cause**: Volume mapping issue  
**Solution**: Ensure bind mounts are correct:
```bash
docker-compose down
docker-compose up --build
```

### Port conflicts
**Cause**: Port already in use  
**Solution**: 
- Dev uses 3000, 4000, 80
- Test uses 3001, 5433
- Stop conflicting services or change ports in compose files

### node_modules out of sync
**Cause**: Dependencies changed  
**Solution**:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start test environment
        run: docker-compose -f docker-compose.test.yml up -d
      
      - name: Wait for services
        run: sleep 10
      
      - name: Run tests
        run: docker exec verified-backend-test pnpm test
      
      - name: Cleanup
        run: docker-compose -f docker-compose.test.yml down -v
```

## Best Practices

1. **Always use test environment for integration tests**
   - Prevents data corruption in development
   - Ensures consistent test state

2. **Clean up after tests**
   - Run `pnpm test:env:down` to remove test data
   - Prevents disk space issues

3. **Use wait-for-it for dependencies**
   - Never assume services are ready
   - Always wait for health checks

4. **Separate test and dev databases**
   - Test DB: Port 5433, ephemeral
   - Dev DB: External Supabase, persistent

5. **Keep Dockerfiles lean**
   - Use multi-stage builds for production
   - Use dev Dockerfiles for development/testing

## Performance Tips

- **Layer Caching**: Order Dockerfile commands from least to most frequently changed
- **Volume Performance**: Use named volumes for node_modules (faster than bind mounts)
- **Parallel Tests**: Run unit tests in parallel with `vitest --threads`
- **Test Database**: Use `UNLOGGED` tables for faster test execution (add to schema if needed)

---

**Last Updated**: January 2026  
**Maintained By**: DevOps Team

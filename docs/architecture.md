# System Architecture

## Overview

**Verified AR** is a localized StockX clone for the Argentine market, built with a modern serverless architecture optimized for the Argentine e-commerce ecosystem.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn UI
- **State Management**: React Server Components + Client Components
- **Forms**: React Hook Form + Zod validation

### Backend
- **Database**: Supabase (PostgreSQL 15)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Edge Functions**: Supabase Edge Functions (Deno)

### Payments & Logistics
- **Payment Gateway**: Mercado Pago
- **Shipping**: Andreani / OCA / Correo Argentino APIs
- **Currency Data**: DolarAPI.com (MEP/Blue rates)

### Infrastructure
- **Hosting**: Vercel (Edge Network)
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics + Sentry
- **Email**: Supabase (SMTP)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Next.js 15 App (React 19)                          │   │
│  │  - Server Components (RSC)                          │   │
│  │  - Client Components (Interactive UI)              │   │
│  │  - Shadcn UI Components                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                      API/EDGE LAYER                          │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Next.js API      │  │ Supabase Edge    │               │
│  │ Routes           │  │ Functions        │               │
│  │ - /api/webhooks  │  │ - Matching       │               │
│  │ - /api/mp        │  │ - Notifications  │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                     SERVICES LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Supabase    │  │ Mercado Pago │  │  DolarAPI    │     │
│  │  - Auth      │  │ - Payments   │  │  - Rates     │     │
│  │  - Database  │  │ - Payouts    │  │              │     │
│  │  - Storage   │  │ - Webhooks   │  │              │     │
│  │  - Realtime  │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database (Supabase)                     │   │
│  │  - 12 Core Tables                                   │   │
│  │  - RLS Policies                                     │   │
│  │  - Triggers & Functions                             │   │
│  │  - Full-text Search                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Workflows

### 1. User Registration & Authentication

```
User → Next.js → Supabase Auth
                    ↓
              Create user record in DB
                    ↓
              Send verification email
                    ↓
              Redirect to onboarding
```

**Implementation**:
- Supabase Auth handles email/password + OAuth (Google)
- RLS policies automatically filter data by `auth.uid()`
- JWT tokens stored in HTTP-only cookies

### 2. Product Browsing

```
User → Next.js SSR → Supabase Query
                         ↓
                   Fetch products + variants
                         ↓
                   Join with market_stats
                         ↓
                   Return with lowest ask/highest bid
```

**Optimizations**:
- Server-side rendering for SEO
- Incremental Static Regeneration (ISR) for product pages
- Edge caching for static assets
- Database indexes on frequently queried fields

### 3. Bid/Ask Placement

```
User submits bid/ask → Next.js API Route
                           ↓
                     Validate + Insert into DB
                           ↓
                     Trigger matching function
                           ↓
                     Check for opposite listing
                           ↓
                  ┌─────────┴─────────┐
                  │                   │
            Match found          No match
                  │                   │
         Create transaction    Update market stats
                  │                   │
         Notify both parties   Return success
```

**Matching Logic** (PostgreSQL Function):
```sql
-- For new bid:
1. Find lowest active ask for same variant
2. If bid_price >= ask_price → MATCH
3. Create transaction record
4. Update both listings to 'filled'
5. Trigger notifications

-- For new ask:
1. Find highest active bid for same variant
2. If ask_price <= bid_price → MATCH
3. (same as above)
```

### 4. Payment & Escrow Flow

```
Match created → Buyer redirected to checkout
                    ↓
              Create Mercado Pago preference
                    ↓
              User pays via MP
                    ↓
              MP sends webhook to /api/webhooks/mercadopago
                    ↓
              Verify payment signature
                    ↓
              Update transaction status → 'pending_shipment'
                    ↓
              Notify seller to ship
```

**Escrow Timeline**:
1. **T+0**: Buyer pays → Funds held by Mercado Pago
2. **T+1-2**: Seller ships to authentication center
3. **T+3-4**: Item authenticated
4. **T+5-6**: Item shipped to buyer
5. **T+7**: Buyer confirms receipt → Seller receives payout

### 5. Authentication Workflow

```
Item arrives at center → Admin dashboard shows in queue
                              ↓
                    Admin starts authentication
                              ↓
                    Complete checklist:
                    - Box condition
                    - Stitching quality
                    - Material verification
                    - Barcode/SKU match
                    - UV light check
                              ↓
                    Upload verification photos
                              ↓
                    Mark as PASS or FAIL
                              ↓
                 ┌──────────┴──────────┐
                 │                     │
              PASS                   FAIL
                 │                     │
        Ship to buyer          Notify seller
                 │             Return to seller
        Update status          Refund buyer
                 │             Penalize seller
        Notify buyer
```

---

## Database Design Principles

### 1. Normalization
- **3NF compliance**: Minimal redundancy
- **Foreign keys**: Enforce referential integrity
- **Indexes**: Optimize frequent queries

### 2. Denormalization (Strategic)
- `market_stats` table caches lowest ask/highest bid
- `products.total_sales` avoids expensive COUNT queries
- `users.reputation_score` pre-calculated

### 3. Data Integrity
- **Check constraints**: `price_ars > 0`
- **Unique constraints**: One size per product
- **Cascading deletes**: Clean up related records

### 4. Performance
- **Indexes on foreign keys**: Fast joins
- **Composite indexes**: Multi-column queries
- **GIN indexes**: Full-text search
- **Materialized views**: Complex aggregations

---

## Security Architecture

### 1. Row Level Security (RLS)

**Users Table**:
```sql
-- Users can only read their own profile
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = auth_id);
```

**Bids/Asks Tables**:
```sql
-- Users can see their own + all active listings
CREATE POLICY bids_select_own_or_active ON bids
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    status = 'active'
  );
```

**Transactions Table**:
```sql
-- Users can only see transactions they're part of
CREATE POLICY transactions_select_own ON transactions
  FOR SELECT USING (
    buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    seller_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
```

### 2. API Security

**Rate Limiting**:
- 10 requests/minute for bid/ask placement
- 100 requests/minute for product browsing
- Implemented via Vercel Edge Middleware

**Input Validation**:
- Zod schemas for all API inputs
- SQL injection prevention (Supabase client handles this)
- XSS protection (Next.js auto-escapes)

**Authentication**:
- JWT tokens in HTTP-only cookies
- CSRF protection via SameSite cookies
- Refresh token rotation

### 3. Payment Security

**Mercado Pago**:
- Webhook signature verification
- HTTPS-only communication
- PCI DSS compliant (handled by MP)

**Sensitive Data**:
- No credit card data stored
- Mercado Pago account IDs only
- Encrypted at rest (Supabase default)

---

## Scalability Considerations

### Current Architecture (MVP)
- **Concurrent users**: 1,000+
- **Transactions/day**: 500+
- **Database size**: <10 GB
- **Response time**: <200ms (p95)

### Scaling Strategy

**Phase 1: Vertical Scaling** (0-5K users)
- Upgrade Supabase plan (more CPU/RAM)
- Enable connection pooling
- Add Redis cache for hot data

**Phase 2: Horizontal Scaling** (5K-50K users)
- Read replicas for database
- CDN for static assets (already via Vercel)
- Separate edge functions for matching engine

**Phase 3: Microservices** (50K+ users)
- Separate authentication service
- Dedicated matching engine service
- Event-driven architecture (message queue)

### Bottlenecks & Solutions

**Bottleneck**: Matching engine on high volume
- **Solution**: Queue-based processing (BullMQ + Redis)

**Bottleneck**: Database writes during peak hours
- **Solution**: Write-ahead log (WAL) optimization, batch inserts

**Bottleneck**: Real-time updates for many concurrent users
- **Solution**: Supabase Realtime scales automatically, fallback to polling

---

## Monitoring & Observability

### Key Metrics

**Application**:
- Request latency (p50, p95, p99)
- Error rate (4xx, 5xx)
- API endpoint usage

**Business**:
- Active listings (bids/asks)
- Match rate (% of listings matched)
- GMV (Gross Merchandise Value)
- Authentication pass rate

**Infrastructure**:
- Database CPU/memory usage
- Connection pool utilization
- Edge function cold starts

### Tools

- **Vercel Analytics**: Frontend performance
- **Supabase Dashboard**: Database metrics
- **Sentry**: Error tracking
- **Custom Dashboard**: Business metrics (built in-app)

---

## Disaster Recovery

### Backup Strategy

**Database**:
- Supabase automatic daily backups (7-day retention)
- Weekly manual exports to S3
- Point-in-time recovery (PITR) enabled

**Storage**:
- Supabase Storage replication
- Monthly backup to external provider

**Code**:
- Git version control (GitHub)
- Tagged releases for rollback

### Incident Response

1. **Detection**: Monitoring alerts → Slack/Email
2. **Assessment**: Check dashboards, logs
3. **Mitigation**: Rollback deployment or hotfix
4. **Communication**: Status page update
5. **Post-mortem**: Document and prevent recurrence

---

## Future Architecture Enhancements

### Short-Term (3-6 months)
- [ ] Redis cache layer for market stats
- [ ] Elasticsearch for advanced product search
- [ ] WebSocket connections for real-time bidding
- [ ] Mobile app (React Native)

### Long-Term (6-12 months)
- [ ] Multi-region deployment (Brazil, Chile)
- [ ] GraphQL API for mobile apps
- [ ] Machine learning for price predictions
- [ ] Blockchain integration for provenance tracking

---

## Conclusion

This architecture balances:
- **Simplicity**: Serverless, managed services
- **Performance**: Edge caching, optimized queries
- **Security**: RLS, input validation, HTTPS
- **Scalability**: Horizontal scaling path defined
- **Cost**: Pay-as-you-grow pricing model

The system is designed to handle the unique challenges of the Argentine market: currency volatility, local logistics, and trust-building through authentication.

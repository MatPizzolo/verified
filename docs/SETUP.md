# Setup Guide - Verified AR

Complete step-by-step setup instructions for the MVP.

---

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker Desktop
- Git

---

## Step 1: Supabase Account & Project Setup

### 1.1 Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Verify your email

### 1.2 Create New Project

1. Click "New Project"
2. Fill in details:
   - **Name**: `verified-ar` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to Argentina (e.g., São Paulo)
   - **Pricing Plan**: Free tier is fine for MVP
3. Click "Create new project"
4. Wait 2-3 minutes for provisioning

### 1.3 Get API Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** tab
3. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`) - **Keep this secret!**

---

## Step 2: Run Database Schema

### 2.1 Open SQL Editor

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**

### 2.2 Execute Schema

1. Open `docs/schema.sql` in your code editor
2. Copy the **entire contents**
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl/Cmd + Enter)
5. Wait for completion (should take 5-10 seconds)
6. Verify success: You should see "Success. No rows returned"

### 2.3 Verify Tables Created

1. Click **Table Editor** (left sidebar)
2. You should see these tables:
   - `users`
   - `products`
   - `brands`
   - `variants`
   - `bids`
   - `asks`
   - `transactions`
   - `payouts`
   - `notifications`
   - `price_history`
   - `market_stats`
   - `exchange_rates`

---

## Step 3: Configure Environment Variables

### 3.1 Create .env File

```bash
# From project root
cp env.template .env
```

### 3.2 Edit .env File

Open `.env` and replace placeholders with your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

**Important**: Never commit `.env` to git!

---

## Step 4: Install Dependencies

### 4.1 Frontend Dependencies

```bash
cd frontend
pnpm install
```

### 4.2 Backend Dependencies

```bash
cd ../backend
pnpm install
```

---

## Step 5: Test Database Connection

### 5.1 Run Connection Test

```bash
# From project root
node scripts/test-db-connection.js
```

Expected output:
```
✓ Connected to Supabase
✓ Database schema verified
✓ RLS policies active
✓ All tables accessible
```

If you see errors, verify your `.env` credentials.

---

## Step 6: Start Development Environment

### Option A: Using Docker (Recommended)

```bash
# From project root
docker-compose up --build
```

Wait for all services to start (2-3 minutes first time).

**Verify services are running**:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Nginx: http://localhost

### Option B: Without Docker

```bash
# Terminal 1: Frontend
cd frontend
pnpm dev

# Terminal 2: Backend
cd backend
pnpm dev
```

---

## Step 7: Test Authentication Flow

### 7.1 Register New User

1. Open http://localhost:3000/register
2. Fill in the form:
   - **Name**: Test User
   - **Email**: test@example.com
   - **Password**: Test1234
   - Check "Accept terms"
3. Click "Crear cuenta"
4. You should be redirected to `/products`

### 7.2 Verify in Supabase

1. Go to Supabase dashboard
2. Click **Authentication** → **Users**
3. You should see your test user
4. Click **Table Editor** → **users**
5. Verify user record exists with correct data

### 7.3 Test Login

1. Logout (if needed)
2. Go to http://localhost:3000/login
3. Login with test@example.com / Test1234
4. Should redirect to `/products`

### 7.4 Test Protected Routes

1. Open http://localhost:3000/products (should work)
2. Logout
3. Try http://localhost:3000/products (should redirect to /login)

---

## Step 8: Verify RLS Policies

### 8.1 Test User Isolation

1. Register two different users
2. Try to access other user's data via API
3. Should be blocked by RLS

### 8.2 Check RLS in Supabase

1. Go to **Table Editor**
2. Click any table (e.g., `users`)
3. Click **RLS** tab
4. Verify policies are enabled and active

---

## Troubleshooting

### Issue: "Cannot connect to Supabase"

**Solution**:
- Verify `.env` file has correct credentials
- Check Supabase project is not paused (free tier pauses after 7 days inactivity)
- Verify internet connection

### Issue: "Schema execution failed"

**Solution**:
- Make sure you're using PostgreSQL 15+
- Check for syntax errors in schema.sql
- Try running schema in smaller chunks

### Issue: "Docker services won't start"

**Solution**:
```bash
# Stop all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild
docker-compose up --build
```

### Issue: "Port already in use"

**Solution**:
```bash
# Check what's using the port
lsof -i :3000  # or :4000, :80

# Kill the process or change ports in docker-compose.yml
```

### Issue: "TypeScript errors"

**Solution**:
```bash
# Make sure dependencies are installed
cd frontend && pnpm install
cd ../backend && pnpm install

# Restart your IDE
```

---

## Next Steps

Once setup is complete:

1. ✅ Mark Database Setup tasks as complete in `roadmap-mvp.md`
2. ✅ Mark "Test: User can register and login" as complete
3. 🚀 Continue to **Week 3-4: Product Catalog**

---

## Quick Reference

### Useful Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart a service
docker-compose restart frontend

# Run tests
pnpm test

# Check types
pnpm type-check
```

### Important URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Supabase Dashboard: https://supabase.com/dashboard
- Documentation: `docs/` folder

---

## Step 9: Mercado Pago Setup (Week 9-10)

### 9.1 Create Developer Account

1. Go to [developers.mercadopago.com](https://developers.mercadopago.com)
2. Create a new application
3. Get your credentials:
   - Access Token → `MERCADO_PAGO_ACCESS_TOKEN`
   - Public Key → `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`

**Important**: Start with TEST credentials during development!

### 9.2 Configure Webhooks

Configure webhook URL in Mercado Pago dashboard:
```
https://your-domain.com/api/webhooks/mercadopago
```

Use [ngrok](https://ngrok.com) for local testing:
```bash
ngrok http 3000
# Use the ngrok URL for webhook testing
```

---

## Security Best Practices

### Environment Variables
- ✅ **DO**: Use `NEXT_PUBLIC_` prefix for client-side variables
- ✅ **DO**: Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only
- ✅ **DO**: Add `.env` and `.env.local` to `.gitignore`
- ❌ **DON'T**: Commit `.env` to version control
- ❌ **DON'T**: Expose service role keys in client code

### Verify RLS Status
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
All tables should have `rowsecurity = true`.

---

## Deployment Checklist

### Vercel Deployment
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Production Environment Variables
- `NEXT_PUBLIC_BASE_URL` → Your production domain
- Use **PRODUCTION** Mercado Pago credentials
- Verify Supabase production database is properly configured

### Post-Deployment Verification
- [ ] Test authentication flow
- [ ] Verify Mercado Pago webhook is receiving events
- [ ] Check Supabase RLS policies are working
- [ ] Test bid/ask placement
- [ ] Verify email notifications are sent
- [ ] Monitor error logs (Vercel/Supabase dashboards)

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Mercado Pago API Reference](https://www.mercadopago.com.ar/developers/en/reference)
- [Shadcn UI Components](https://ui.shadcn.com)

---

**Last Updated**: January 7, 2026

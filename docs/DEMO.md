# MVP Demo Guide

Complete guide for setting up and presenting the marketplace demo with 3 featured users.

---

## 🚀 Quick Setup

### Prerequisites
- Docker running
- Supabase project configured
- `.env` file with credentials

### Setup Steps

```bash
# 1. Apply saved_products migration in Supabase SQL Editor
# Copy from: docs/migrations/add-saved-products.sql

# 2. Ensure Supabase Storage bucket exists
# The script will auto-create 'sneakers' bucket if needed

# 3. Run demo setup
docker-compose up -d --build
docker exec verified-backend-1 bash /app/root-scripts/docker-demo-setup.sh

# Or from host:
pnpm demo:enhanced
```

**Note:** Product images are automatically downloaded from source URLs and uploaded to Supabase Storage with filenames matching the product slug (e.g., `air-force-1-low-white-white-white.jpg`).

---

## 👥 Featured Users

All passwords: `Demo1234!`

### Mateo Coleccionista (Active Collector)
**Email:** `mateo.collector@demo.com`  
**Location:** Buenos Aires, CABA

**Activity:**
- ⭐ 10 saved products
- 💳 3 completed purchases
- 💰 5 active bids (90%-110% of retail)

**Use Case:** Demonstrate buyer experience, saved items, purchase history

---

### Sofía Revendedora (Power Seller)
**Email:** `sofia.reseller@demo.com`  
**Location:** Córdoba, Córdoba

**Activity:**
- 💳 2 completed sales
- 🏷️ 6 active asks (115%-140% of retail)

**Use Case:** Demonstrate seller dashboard, sales history, listing management

---

### Lucas Casual (Deal Hunter)
**Email:** `lucas.casual@demo.com`  
**Location:** Rosario, Santa Fe

**Activity:**
- ⭐ 4 saved products
- 💰 2 active bids (85% of retail)

**Use Case:** Demonstrate casual browsing, deal-hunting behavior

---

## 🎬 Presentation Flow

### 1. Login as Mateo
- Click heart icon → Show 10 saved products
- Navigate to "My Bids" → Show 5 active bids
- Navigate to "My Orders" → Show 3 completed purchases
- Browse marketplace → Demonstrate saving new products

### 2. Login as Sofía
- Navigate to "Dashboard" → Show 6 active listings
- Navigate to "Sales History" → Show 2 completed sales
- Demonstrate editing ask prices

### 3. Login as Lucas
- Click heart icon → Show 4 saved products
- Navigate to "My Bids" → Show 2 conservative bids
- Browse for deals → Demonstrate price comparison

---

## 📊 Demo Environment

| Metric | Count |
|--------|-------|
| Featured Users | 3 |
| Background Users | 4 |
| Completed Transactions | 5 |
| Active Bids | ~17 |
| Active Asks | ~11 |
| Saved Products | 14 |

**Exchange Rate:** 1350.50 ARS/USD (fixed for demo)

---

## 🛠️ Customization

### Add More Featured Users

Edit `scripts/demo/seed-enhanced-demo.ts`:

```typescript
const FEATURED_USERS = [
  {
    email: 'your.user@demo.com',
    password: 'Demo1234!',
    full_name: 'Your Name',
    role: 'buyer', // or 'seller'
    city: 'Your City',
    province: 'Your Province',
    persona: 'Your Persona',
    description: 'Your description'
  },
  // ... existing users
];
```

### Adjust Activity Levels

Modify loops in seed script:
- **Saved products:** Lines 180-210
- **Transactions:** Lines 215-330
- **Bids:** Lines 335-420
- **Asks:** Lines 425-490

---

## 🔧 Troubleshooting

**No saved products showing?**
- Apply migration: `docs/migrations/add-saved-products.sql`
- Check RLS policies enabled
- Verify user logged in

**Transaction history empty?**
- Check `transactions` table has `status = 'completed'`
- Verify user IDs match between auth and users table

**Bids/Asks not appearing?**
- Check `status = 'active'`
- Verify `expires_at` is in future
- Ensure user IDs correct

---

## 📁 File Structure

```
scripts/
├── demo/
│   ├── seed-products.js          # Product catalog with image upload
│   ├── upload-product-images.js  # Image upload utility
│   ├── seed-mvp-demo.ts          # Basic demo (8 users)
│   └── seed-enhanced-demo.ts     # Enhanced (3 featured users)
├── validation/
│   ├── seed-test-market.ts       # Test data
│   ├── validate-matching.ts      # Matching engine tests
│   └── validate-pricing.ts       # Price conversion tests
└── docker-demo-setup.sh          # Docker setup script

docs/
├── DEMO.md                       # This file
├── migrations/
│   └── add-saved-products.sql    # Saved products table
└── roadmap-mvp.md                # Development roadmap

Supabase Storage:
└── sneakers/                     # Auto-created bucket
    └── products/
        ├── air-force-1-low-white-white-white.jpg
        ├── dunk-low-panda-white-black.jpg
        └── ... (named by product slug)
```

---

## 🎯 Key Features Demonstrated

- ✅ User profiles with distinct personas
- ✅ Saved/favorited products
- ✅ Transaction history (purchases & sales)
- ✅ Active marketplace (bids & asks)
- ✅ Price variation and discovery
- ✅ Market depth with background users

---

**Your MVP is ready to present!** 🚀

# V2 Roadmap - Verified AR (Post-MVP)

> **Refer to [roadmap-mvp.md](./roadmap-mvp.md) for MVP scope and launch tasks**

**Timeline**: Months 2-12 after MVP launch  
**Goal**: Scale platform with advanced features, optimizations, and regional expansion

---

## Advanced Features & Optimizations

This roadmap contains **ONLY** post-MVP features. All MVP launch tasks are in `roadmap-mvp.md`.

---

## Month 2-3: Enhanced User Experience

### Google OAuth Integration
- [ ] Configure Google OAuth in Supabase
- [ ] Add Google sign-in button to login/register pages
- [ ] Handle OAuth callback and user creation
- [ ] Test: User can register/login with Google
- [ ] Migrate existing users to support OAuth

### Algolia Instant Search
- [ ] Create Algolia account and index
- [ ] Configure searchable attributes (name, brand, colorway, SKU)
- [ ] Set up faceted filtering (brand, size, price, gender)
- [ ] Implement database triggers to sync products to Algolia
- [ ] Replace PostgreSQL search with Algolia InstantSearch
- [ ] Add autocomplete with product suggestions
- [ ] Add typo tolerance and synonyms
- [ ] Test: Search returns results in <50ms

### Real-Time Price Updates
- [ ] Set up Supabase Realtime subscriptions
- [ ] Subscribe to bids/asks changes on product pages
- [ ] Update lowest ask/highest bid in real-time
- [ ] Add toast notifications for price changes
- [ ] Implement optimistic UI updates
- [ ] Test: Price updates appear instantly without refresh

### Enhanced Product Pages
- [ ] Add TradingView-style price charts (last 30/90/365 days)
- [ ] Integrate lightweight-charts library
- [ ] Display sales volume over time
- [ ] Add price volatility indicators
- [ ] Show bid/ask spread visualization
- [ ] Add "Set Price Alert" button (see Price Alerts below)

---

## Month 4-5: Power Seller Features

### Advanced Seller Dashboard
- [ ] Create `/seller/dashboard` page
- [ ] Display seller analytics (total sales, revenue, avg sale price)
- [ ] Show inventory management (active asks, sold items)
- [ ] Add bulk listing tool (upload CSV with multiple products)
- [ ] Implement seller reputation score calculation
- [ ] Add seller badges (verified, power seller, top rated)
- [ ] Show seller performance metrics (response time, shipping speed)

### Consignment Service
- [ ] Create `/consignment/request` page
- [ ] Build consignment request form (product details, photos)
- [ ] Create admin review queue for consignment requests
- [ ] Add consignment status tracking (received, listed, sold)
- [ ] Implement automatic listing creation after approval
- [ ] Calculate consignment fees (20% vs 10% for self-listing)
- [ ] Test: User can submit consignment request

### Seller Verification Process
- [ ] Create `/seller/verify` page
- [ ] Add ID verification (DNI/passport upload)
- [ ] Integrate with identity verification service (e.g., Onfido)
- [ ] Add address verification (utility bill upload)
- [ ] Create admin verification queue
- [ ] Add verified seller badge to profiles
- [ ] Require verification for listings >$500 USD

---

## Month 6-7: Logistics & Automation

### Automated Shipping Labels (Andreani Integration)
- [ ] Create Andreani developer account
- [ ] Integrate Andreani API for label generation
- [ ] Add "Generate Shipping Label" button in admin dashboard
- [ ] Automatically create label when transaction status = `pending_shipment`
- [ ] Send label PDF to seller via email
- [ ] Track shipment status via Andreani API
- [ ] Update transaction status based on tracking events
- [ ] Test: Label generates and seller receives email

### OCA Integration (Alternative Carrier)
- [ ] Integrate OCA API as backup carrier
- [ ] Add carrier selection in admin dashboard
- [ ] Compare shipping rates (Andreani vs OCA)
- [ ] Automatically select cheapest carrier
- [ ] Test: System switches carriers based on price

### Shipping Insurance
- [ ] Partner with insurance provider
- [ ] Add insurance option at checkout (+2% of item value)
- [ ] Automatically file claims for lost/damaged items
- [ ] Track insurance claim status
- [ ] Refund buyer if claim approved

---

## Month 8-9: Advanced Analytics & Monitoring

### Advanced Analytics Dashboard
- [ ] Create `/admin/analytics/advanced` page
- [ ] Add cohort analysis (user retention by signup month)
- [ ] Display conversion funnel (browse → bid → match → pay)
- [ ] Show GMV breakdown by product category
- [ ] Add seller performance leaderboard
- [ ] Implement A/B testing framework
- [ ] Add custom date range selector
- [ ] Export reports to CSV/PDF

### Business Intelligence
- [ ] Integrate with data warehouse (e.g., BigQuery)
- [ ] Set up ETL pipeline (Supabase → BigQuery)
- [ ] Create Looker/Metabase dashboards
- [ ] Add predictive analytics (demand forecasting)
- [ ] Implement churn prediction model
- [ ] Add price recommendation engine for sellers

### Performance Monitoring
- [ ] Set up APM (Application Performance Monitoring) with Datadog
- [ ] Add custom metrics (bid placement time, matching latency)
- [ ] Create performance dashboards
- [ ] Set up alerts for slow queries (>1s)
- [ ] Implement query optimization based on insights
- [ ] Add database connection pooling

---

## Month 10-11: Mobile & Multi-Currency

### Mobile App (React Native)
- [ ] Set up React Native project with Expo
- [ ] Implement authentication screens
- [ ] Build product browsing (list and detail)
- [ ] Add bid/ask placement
- [ ] Integrate push notifications (Firebase)
- [ ] Add camera for product photos
- [ ] Implement barcode scanner for SKU lookup
- [ ] Test on iOS and Android devices
- [ ] Submit to App Store and Google Play

### Multi-Currency Support
- [ ] Add support for USD payments (Stripe integration)
- [ ] Create currency selector in user settings
- [ ] Display prices in user's preferred currency
- [ ] Add crypto payment option (USDT/USDC via Coinbase Commerce)
- [ ] Implement real-time currency conversion
- [ ] Add currency hedging for sellers
- [ ] Test: User can pay in USD or crypto

### International Shipping
- [ ] Partner with international carriers (DHL, FedEx)
- [ ] Add international shipping option at checkout
- [ ] Calculate customs duties and taxes
- [ ] Display total landed cost to buyer
- [ ] Handle cross-border returns
- [ ] Test: User in Brazil can buy from Argentina

---

## Month 12+: Scaling & Expansion

### Infrastructure Scaling
- [ ] Migrate from docker-compose to Kubernetes
- [ ] Set up auto-scaling for API pods
- [ ] Implement database read replicas
- [ ] Add Redis cache layer for hot data
- [ ] Set up CDN for static assets (Cloudflare)
- [ ] Implement queue system for background jobs (BullMQ)
- [ ] Add load balancer (AWS ALB or Nginx)

### Regional Expansion
- [ ] Launch in Brazil (Portuguese localization)
- [ ] Launch in Chile (CLP currency support)
- [ ] Launch in Colombia (COP currency support)
- [ ] Partner with local authentication centers
- [ ] Add region-specific payment methods
- [ ] Localize marketing campaigns

### Advanced Features
- [ ] Add price alerts (email/push when target price reached)
- [ ] Implement referral program (earn $10 credit per referral)
- [ ] Add trade-in program (trade old sneakers for credit)
- [ ] Create community forums
- [ ] Add sneaker reviews and ratings
- [ ] Implement outfit inspiration (style guides)
- [ ] Add AR try-on (virtual sneaker fitting)
- [ ] Create subscription model ("Verified Pro" tier with lower fees)

### WhatsApp Notifications
- [ ] Integrate Twilio WhatsApp API
- [ ] Send order status updates via WhatsApp
- [ ] Add WhatsApp support chat
- [ ] Implement WhatsApp payment reminders
- [ ] Test: User receives WhatsApp notification on match

### Sustainability Initiative
- [ ] Launch sneaker recycling program
- [ ] Partner with upcycling brands
- [ ] Add carbon offset option at checkout
- [ ] Display environmental impact metrics
- [ ] Create "Eco-Verified" badge for sustainable products

---

## V2 Definition of Done

### Enhanced User Experience
- [ ] Google OAuth works seamlessly
- [ ] Algolia search returns results in <50ms
- [ ] Real-time price updates work without refresh
- [ ] TradingView charts display price history

### Power Seller Features
- [ ] Seller dashboard shows analytics
- [ ] Consignment service operational
- [ ] Seller verification process complete
- [ ] Bulk listing tool works

### Logistics & Automation
- [ ] Andreani integration generates labels automatically
- [ ] Shipping insurance available
- [ ] Tracking updates transaction status

### Advanced Analytics
- [ ] Admin has access to advanced analytics
- [ ] BI dashboards operational
- [ ] Performance monitoring active

### Mobile & Multi-Currency
- [ ] Mobile app published on App Store and Google Play
- [ ] USD and crypto payments work
- [ ] International shipping available

### Scaling & Expansion
- [ ] Kubernetes deployment operational
- [ ] Regional expansion to 2+ countries
- [ ] Advanced features (price alerts, referrals, AR) launched

---

**Last Updated**: January 2026  
**Status**: Post-MVP roadmap

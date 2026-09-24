# WildPrice Hunter — Implementation Plan
## Cross-Platform Product Price Intelligence Engine

> **Vision**: A user drops any product link from any platform, and WildPrice Hunter scans the entire web to surface the same or equivalent product at the lowest price, ranked by trust, rating, and verified seller authenticity.

---

## 1. Product Overview & Core Problem

| Pain Point | Solution |
|---|---|
| Users overpay on one platform unknowingly | Drop a link → instant price matrix across all platforms |
| Can't trust unknown sellers | Trust Score (reviews + seller age + return policy) |
| Manual Google searching is slow and ineffective | AI-powered product fingerprinting + scraping pipeline |
| No single view of cross-platform pricing | Unified result card with price, platform badge, rating, link |

---

## 2. Complete Feature Set

### 🔍 Core Search Engine
- **Link Drop Search** — paste any product URL (Amazon, eBay, AliExpress, Walmart, Etsy, Shopify stores, TikTok Shop, social links, etc.)
- **Image Search** — drop a product image → reverse image search → match
- **Text/Keyword Search** — type product name → find across all platforms
- **Barcode/QR Scan** — scan physical product → find online
- **Price History** — historical price chart per platform (when available)

### 📊 Comparison Intelligence
- **Price Matrix** — sorted lowest-to-highest across all found listings
- **Trust Score** — composite: seller rating + # reviews + platform reliability + return policy + account age
- **Similarity Score** — how closely the result matches the original (AI-powered)
- **Shipping Estimate** — delivery cost + time estimate included in total price
- **Total Cost Calculator** — price + shipping = "true cost" comparison

### 🛡️ Trust & Safety Layer
- **Platform Badge** — color-coded: Amazon 🟠, eBay 🔵, AliExpress 🔴, Walmart 🟢, Etsy 🟣, Shopify ⬜
- **Seller Verification** — days active, feedback score, dispute rate
- **Review Sentiment** — NLP summary of top reviews (positive/negative)
- **Fake Review Detection** — flag suspicious review patterns
- **Scam Domain Detector** — blocklist + WHOIS age check for Shopify stores

### 👤 User Features
- **Search History** — all past searches with saved results
- **Watchlist / Price Alerts** — set target price → push notification when reached
- **Saved Comparisons** — bookmark result sets
- **Share Results** — share a comparison card via WhatsApp, Telegram, etc.
- **Dropshipping Mode** — shows profit margin calculator (AliExpress cost vs retail price)

### 📱 App-Specific Features
- **Onboarding Flow** — 3-screen value prop introduction
- **Dark/Light Mode** — with Flat-Brutalism theme
- **Deep Link Support** — share a product from any app → opens WildPrice Hunter directly
- **Guest Mode** — search without account, with limited history

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MOBILE APP (React Native)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Search  │  │ Results  │  │Watchlist │  │   Profile    │   │
│  │  Screen  │  │  Screen  │  │  Screen  │  │   Screen     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│              React Navigation + Zustand + TanStack Query          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST + WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY (NestJS)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Auth Module │  │ Search Module│  │  Watchlist Module    │   │
│  │  (JWT+Guard)│  │(Orchestrator)│  │  (Bull Queue + CRON) │   │
│  └─────────────┘  └──────┬───────┘  └──────────────────────┘   │
│  ┌─────────────┐  ┌──────▼───────┐  ┌──────────────────────┐   │
│  │Product Intel│  │ Scraper Mgr  │  │  Notification Svc    │   │
│  │Module (AI)  │  │(Queue+Worker)│  │  (FCM Push)          │   │
│  └─────────────┘  └──────────────┘  └──────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────▼─────────────┐
        │    SCRAPING WORKERS       │
        │  (BullMQ + Redis Queue)   │
        │                           │
        │  ┌──────┐ ┌──────────┐   │
        │  │Amazon│ │  eBay    │   │
        │  │Worker│ │  Worker  │   │
        │  └──────┘ └──────────┘   │
        │  ┌──────────┐ ┌──────┐   │
        │  │AliExpress│ │Walmart│  │
        │  │Worker    │ │Worker │   │
        │  └──────────┘ └──────┘   │
        │  ┌──────┐ ┌──────────┐   │
        │  │ Etsy │ │ Shopify  │   │
        │  │Worker│ │ Generic  │   │
        │  └──────┘ └──────────┘   │
        └─────────────┬────────────┘
                      │
        ┌─────────────▼────────────┐
        │    DATA LAYER             │
        │  ┌──────────┐ ┌───────┐  │
        │  │PostgreSQL│ │ Redis │  │
        │  │(Primary) │ │(Cache)│  │
        │  └──────────┘ └───────┘  │
        │  ┌──────────────────────┐ │
        │  │ Elasticsearch (Search│ │
        │  │ & Product Dedup)     │ │
        │  └──────────────────────┘ │
        └──────────────────────────┘
```

---

## 4. Tech Stack

### Frontend — React Native
| Layer | Technology | Reason |
|---|---|---|
| Framework | React Native 0.74+ (Bare) | Full native control |
| Navigation | React Navigation v6 | Industry standard |
| State Management | Zustand | Lightweight, fast |
| Server State | TanStack Query (React Query) | Cache, refetch, background sync |
| HTTP Client | Axios + Interceptors | Token refresh, retry logic |
| Styling | StyleSheet + custom DS tokens | Flat-Brutalist theme |
| Animations | React Native Reanimated 3 | 60fps smooth animations |
| Charts | Victory Native | Price history charts |
| Deep Linking | React Native Linking + expo-linking | Open from share sheet |
| Notifications | @notifee/react-native | Local + FCM push |
| Camera/QR | react-native-vision-camera | Barcode scanning |
| Image Pick | react-native-image-picker | Image reverse search |
| Storage | MMKV | Ultra-fast local storage |
| Auth | react-native-keychain | Secure token storage |
| Clipboard | @react-native-clipboard/clipboard | Paste product URL |

### Backend — NestJS
| Layer | Technology | Reason |
|---|---|---|
| Framework | NestJS 10 | Modular, scalable, DI |
| Language | TypeScript strict | Type safety |
| ORM | TypeORM + PostgreSQL | Relational data |
| Cache/Queue | Redis + BullMQ | Job queuing, caching |
| Search | Elasticsearch 8 | Product dedup + search |
| Auth | Passport + JWT (access+refresh) | Standard auth |
| Validation | class-validator + class-transformer | DTO validation |
| Scraping | Playwright (headless) + Cheerio | Dynamic + static pages |
| AI/NLP | Google Gemini API | Product fingerprinting + review sentiment |
| Proxy | Rotating proxy pool (Smartproxy/BrightData) | Anti-bot bypass |
| Push | Firebase Admin SDK | FCM notifications |
| Docs | Swagger/OpenAPI | Auto-generated |
| Monitoring | Prometheus + Grafana | Metrics |
| Logging | Winston + Loki | Structured logs |

### Infrastructure
| Component | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Search | Elasticsearch 8 |
| Deployment | DigitalOcean / AWS ECS |
| CDN | Cloudflare |
| CI/CD | GitHub Actions |

---

## 5. Database Schema (PostgreSQL)

### Core Tables

```sql
-- Users
users: id, email, password_hash, display_name, avatar_url, plan(free|pro), created_at

-- Search Sessions
search_sessions: id, user_id, input_type(url|text|image|barcode), 
                 input_value, status(pending|processing|done|failed), 
                 original_product_id, created_at

-- Products (deduplicated)
products: id, title, brand, category, image_url, description, 
          fingerprint_hash, created_at, updated_at

-- Platform Listings
platform_listings: id, product_id, platform(amazon|ebay|...), 
                   seller_name, seller_url, product_url, price, 
                   currency, shipping_cost, rating, review_count, 
                   in_stock, trust_score, last_scraped_at

-- Price History
price_history: id, listing_id, price, scraped_at

-- Watchlist
watchlist: id, user_id, product_id, target_price, is_active, 
           notification_sent_at, created_at

-- Search History
search_history: id, user_id, session_id, created_at

-- Platform Trust Metadata
platform_trust: id, platform, domain, trust_tier, avg_rating, 
                is_verified, blocklisted, updated_at
```

---

## 6. API Endpoints

### Search API
```
POST   /api/search/url          — Submit product URL for search
POST   /api/search/text         — Submit text/keyword search
POST   /api/search/image        — Submit image for reverse search
GET    /api/search/:sessionId   — Poll search session status
GET    /api/search/:sessionId/results — Get comparison results
```

### Products API
```
GET    /api/products/:id        — Get product detail
GET    /api/products/:id/history — Price history chart data
```

### User API
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/users/me
PATCH  /api/users/me
```

### Watchlist API
```
GET    /api/watchlist
POST   /api/watchlist
DELETE /api/watchlist/:id
PATCH  /api/watchlist/:id/target-price
```

### History API
```
GET    /api/history
DELETE /api/history/:id
```

---

## 7. UI/UX Design Language — Flat + Brutalism

### Design Principles
- **Raw, bold borders** — 2-3px solid black borders on all cards
- **High-contrast colors** — no gradients, pure flat fills
- **Offset shadows** — `4px 4px 0px #000` hard box shadows
- **Brutalist typography** — heavy weights (700-900), all-caps labels
- **Functional aesthetics** — no decorative chrome, every pixel serves a purpose
- **Tactile interactions** — button press = shadow collapses (3D press illusion)

### Color Palette
```
Background:   #F5F0E8  (off-white / cream — main surface)
Primary:      #1A1A1A  (near-black — borders, text)
Accent-1:     #FF3B00  (brutal orange-red — primary CTA, price badge)
Accent-2:     #00E5FF  (electric cyan — trust score, links)
Accent-3:     #C8FF00  (acid green — savings badge, discount)
Accent-4:     #7B2FBE  (deep violet — platform Amazon badge)
Card Surface: #FFFFFF  (pure white card fill)
Muted:        #888888  (secondary text)
Error:        #FF0055  (alerts)
Success:      #00CC66  (in-stock, verified)
Dark Mode BG: #0D0D0D  (near-black background)
Dark Mode Card:#1A1A1A
```

### Typography
```
Font Family:  Space Grotesk (headings) + IBM Plex Mono (prices/numbers)
H1:           32px / 900 weight / uppercase / letter-spacing: -0.5px
H2:           24px / 700 weight
Body:         16px / 400 weight / line-height: 1.6
Price:        28px / 700 / IBM Plex Mono / Accent-1
Label:        11px / 700 / uppercase / letter-spacing: 2px
```

### Component Design Tokens
```
border-radius: 0px (brutal, no rounding)   [option: 4px max]
border-width:  2px solid #1A1A1A
shadow:        4px 4px 0px #1A1A1A
shadow-active: 1px 1px 0px #1A1A1A  (pressed state)
spacing-unit:  8px base
```

---

## 8. Screen Map & Navigation

```
App Root
├── Onboarding (3 screens — first launch only)
│   ├── Screen 1: "Drop Any Link"
│   ├── Screen 2: "We Hunt the Price"
│   └── Screen 3: "Save Real Money"
│
├── Auth Stack
│   ├── Login Screen
│   └── Register Screen
│
└── Main Tab Navigator
    ├── [Tab 1] Search Screen (Home)
    │   ├── URL Input Card (paste / deep link)
    │   ├── Quick Mode Toggle: URL | Text | Image | Scan
    │   └── Recent Searches (horizontal scroll)
    │
    ├── [Tab 2] Results Screen (triggered by search)
    │   ├── Original Product Card (what you searched)
    │   ├── Filter Bar (sort: price | trust | savings | rating)
    │   ├── Results List (platform comparison cards)
    │   └── Product Detail Modal
    │       ├── Price History Chart
    │       ├── Trust Score Breakdown
    │       ├── Review Sentiment Summary
    │       └── [Open on Platform] CTA
    │
    ├── [Tab 3] Watchlist Screen
    │   ├── Active Alerts List
    │   └── Set Target Price Modal
    │
    ├── [Tab 4] History Screen
    │   └── Past Search Cards
    │
    └── [Tab 5] Profile Screen
        ├── Plan Badge (Free / Pro)
        ├── Settings
        └── Dropshipping Mode Toggle
```

---

## 9. Scraping Architecture & Pipeline

### Step-by-Step Flow

```
1. User submits URL/text/image
2. NestJS receives → creates search_session (status: pending)
3. Returns session_id immediately to client (polling begins)
4. Search Orchestrator analyzes input:
   - URL: extract platform, ASIN/item-id, product name
   - Text: keyword → Elasticsearch product lookup + scrape
   - Image: Gemini Vision → product description → keyword search
5. Product Fingerprinter (Gemini): extract {title, brand, category, key attributes}
6. Dispatch parallel scraping jobs to BullMQ for each platform:
   - Amazon, eBay, AliExpress, Walmart, Etsy, Shopify (generic)
7. Each worker (Playwright headless + proxy rotation):
   - Scrapes platform search results
   - Calculates similarity score vs fingerprint
   - Extracts: price, shipping, rating, reviews, seller info
   - Calculates trust_score
   - Stores in platform_listings
8. As each worker completes → session results update in real-time
9. Client polls /results → receives progressive results
10. Final sort: by total_cost (price + shipping)
```

### Anti-Detection Strategy
- Rotating residential proxies (per domain)
- Randomized user-agent strings
- Human-like mouse movements (Playwright)
- Request throttling with jitter
- CAPTCHA solving service integration (2Captcha / Anti-Captcha)
- Playwright fingerprint spoofing (stealth plugin)

---

## 10. Trust Score Algorithm

```
Trust Score (0–100) = weighted sum:

Platform Reliability Weight  → 30 pts
  └─ Amazon/Walmart: 30 | eBay: 25 | AliExpress: 15 | Unknown Shopify: 10

Seller Rating Score          → 25 pts
  └─ rating/5 * 25

Review Volume Score          → 15 pts
  └─ log10(review_count) / log10(10000) * 15

Return Policy Score          → 15 pts
  └─ Free returns: 15 | Paid: 8 | None: 0

Seller Account Age           → 10 pts
  └─ >5yr: 10 | 2-5yr: 7 | <2yr: 3

Domain Trust (Shopify)       → 5 pts
  └─ WHOIS age + SSL + Scamadviser API
```

---

## 11. AI/Product Fingerprinting

### Gemini Integration
- **Input**: Product title, description, images, brand, category tags
- **Output**: Normalized product fingerprint JSON:
  ```json
  {
    "canonical_title": "...",
    "brand": "...",
    "category": "Electronics > Earbuds",
    "key_attributes": ["noise-cancelling", "wireless", "ANC"],
    "model_number": "WH-1000XM5",
    "similarity_threshold": 0.85
  }
  ```
- **Similarity Matching**: Cosine similarity of embeddings to filter false positives
- **Review Sentiment**: Gemini summarizes top 20 reviews → 3-bullet positive / 3-bullet negative

---

## 12. Dropshipping Mode

Special mode for dropshippers:
- Shows **AliExpress cost** as base (sourcing price)
- Shows **Amazon/eBay retail price** as sale price
- Calculates **profit margin** and **margin %**
- Highlights **niche opportunity score** (high margin + high demand)
- Trending products feed (sourced from platform bestsellers)

---

## 13. Project Folder Structure

```
wildprice-hunter/
├── apps/
│   ├── mobile/                    ← React Native App
│   │   ├── src/
│   │   │   ├── api/               ← API client (Axios instances)
│   │   │   ├── components/        ← Reusable UI components
│   │   │   │   ├── ui/            ← Design system primitives
│   │   │   │   └── features/      ← Feature-specific components
│   │   │   ├── screens/           ← Screen components
│   │   │   ├── navigation/        ← Route definitions
│   │   │   ├── store/             ← Zustand stores
│   │   │   ├── hooks/             ← Custom hooks
│   │   │   ├── utils/             ← Helpers, formatters
│   │   │   ├── constants/         ← Theme, colors, spacing
│   │   │   └── types/             ← TypeScript types
│   │   ├── android/
│   │   └── ios/
│   │
│   └── backend/                   ← NestJS API
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── search/
│       │   │   ├── products/
│       │   │   ├── scraper/
│       │   │   │   ├── workers/   ← Per-platform workers
│       │   │   │   └── strategies/
│       │   │   ├── watchlist/
│       │   │   ├── history/
│       │   │   ├── trust/
│       │   │   └── ai/            ← Gemini integration
│       │   ├── common/
│       │   │   ├── guards/
│       │   │   ├── interceptors/
│       │   │   ├── filters/
│       │   │   └── decorators/
│       │   └── config/
│       └── test/
│
├── packages/                      ← Shared packages (monorepo)
│   ├── shared-types/              ← Shared TS types/interfaces
│   └── trust-algorithm/           ← Trust score logic (shared)
│
├── infrastructure/
│   ├── docker-compose.yml
│   ├── nginx/
│   └── k8s/                       ← Kubernetes manifests (later)
│
└── docs/
    ├── API.md
    ├── ARCHITECTURE.md
    ├── SOP.md
    └── QA.md
```

---

## 14. SOP Documentation

### SOP-001: Adding a New Platform Scraper
1. Create `src/modules/scraper/workers/{platform}.worker.ts`
2. Implement `BaseScraper` interface (search + extract + normalize)
3. Register in `ScraperModule` providers
4. Add platform to `PlatformEnum`
5. Add trust baseline in `platform_trust` seed data
6. Write unit test + integration test
7. Update documentation

### SOP-002: Trust Score Update
1. Update `TrustAlgorithmService.calculate()` in `/packages/trust-algorithm`
2. Run `npm run test:trust` to verify no regression
3. Re-score all existing listings (run migration script)
4. Deploy with feature flag

### SOP-003: Handling Blocked Scraping
1. Check proxy pool health → rotate proxy
2. If persistent: add 60s exponential backoff
3. Fallback: use SERP API (SerpAPI) for that platform
4. Log blocked attempts → alert if >30% block rate

---

## 15. QA Strategy

### Unit Tests (Jest)
- Trust score algorithm: edge cases, weighting
- Product fingerprinting: similarity threshold
- URL parser: all platform URL formats
- Price extraction: currency conversion, edge cases

### Integration Tests
- API endpoint tests (Supertest)
- Database operations (test containers)
- BullMQ job processing (mock workers)

### E2E Tests (Detox - React Native)
- Search flow: URL → results
- Watchlist creation → alert
- Auth flow: register → login → protected routes

### Manual QA Checklist
- [ ] All 6 platform scrapers return valid data
- [ ] Trust score within 0–100 range always
- [ ] Deep link opens correct screen
- [ ] Dark mode renders all screens correctly
- [ ] Offline state shows proper empty states
- [ ] Price history chart renders on iOS + Android

---

## 16. Implementation Phases

### Phase 1 — Foundation (Week 1–2)
- [ ] Monorepo setup (Nx or Turborepo)
- [ ] React Native app scaffold + navigation
- [ ] NestJS backend scaffold + Docker setup
- [ ] Auth module (register/login/JWT)
- [ ] Design system tokens + base components
- [ ] Search screen UI

### Phase 2 — Core Engine (Week 3–4)
- [ ] Search orchestrator (NestJS)
- [ ] BullMQ queue setup
- [ ] Amazon + eBay scrapers (Playwright)
- [ ] Product fingerprinting (Gemini)
- [ ] Results screen UI
- [ ] Trust score algorithm

### Phase 3 — Platform Coverage (Week 5–6)
- [ ] AliExpress + Walmart scrapers
- [ ] Etsy + Shopify generic scraper
- [ ] Similarity scoring
- [ ] Price history storage + chart

### Phase 4 — User Features (Week 7–8)
- [ ] Watchlist + price alerts (BullMQ CRON)
- [ ] FCM push notifications
- [ ] Search history
- [ ] Dropshipping mode
- [ ] Review sentiment (Gemini NLP)

### Phase 5 — Polish & Launch (Week 9–10)
- [ ] Onboarding screens
- [ ] Performance optimization
- [ ] E2E test suite
- [ ] App Store + Play Store submission prep
- [ ] Infrastructure hardening

---

## 17. Open Questions

> [!IMPORTANT]
> **Q1 — Monetization**: Free tier with limited searches/day (e.g., 5/day free, unlimited Pro at $9.99/mo)? Or fully free with ads?

> [!IMPORTANT]
> **Q2 — Starting Platform Scope**: Should Phase 1 cover all 6 platforms or start with Amazon + eBay + AliExpress only?

> [!IMPORTANT]
> **Q3 — Proxy Infrastructure**: Do you have a budget for rotating residential proxies (~$50–200/mo)? Or should we start with free proxies + SerpAPI fallback?

> [!IMPORTANT]
> **Q4 — App Target Platform**: iOS + Android both, or Android-first?

> [!IMPORTANT]
> **Q5 — Backend Hosting**: Preference for DigitalOcean, AWS, or just local Docker for now?

> [!WARNING]
> **Legal Note**: Web scraping may violate some platforms' Terms of Service. For a production app, consider using official APIs where available (eBay API, Amazon PA-API), and legal SERP/price APIs for others (e.g., Rainforest API, DataForSEO, SerpAPI) as the primary data source with Playwright as fallback.

---

## 18. Verification Plan

### Automated Tests
```bash
# Backend unit tests
npm run test --workspace=apps/backend

# Backend integration tests
npm run test:integration --workspace=apps/backend

# Trust algorithm tests
npm run test --workspace=packages/trust-algorithm

# Mobile E2E (Detox)
npx detox test --configuration android.emu.debug
```

### Manual Verification
1. Submit Amazon product URL → verify results from ≥3 platforms appear
2. Price sort works correctly (ascending)
3. Trust score is non-zero for all major platform listings
4. Watchlist alert fires when price threshold is met (test with mock)
5. Deep link from WhatsApp share opens search screen with pre-filled URL
6. Dark mode toggle applies consistently across all screens

---

*Plan version: 1.0 | Created: 2026-09-18 | Author: Antigravity AI Lead Architect*

# WildPrice Hunter — Developer Documentation

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](file:///e:/Projects/mobile%20application/WildP%20Hunter/package.json)
[![React Native](https://img.shields.io/badge/React%20Native-0.87.1-61DAFB.svg)](file:///e:/Projects/mobile%20application/WildP%20Hunter/apps/mobile/package.json)
[![NestJS](https://img.shields.io/badge/NestJS-12.0-E0234E.svg)](file:///e:/Projects/mobile%20application/WildP%20Hunter/apps/backend/package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg)](file:///e:/Projects/mobile%20application/WildP%20Hunter/tsconfig.base.json)
[![Build Status](<https://img.shields.io/badge/Android%20Build-Passing%20(v0.2)-brightgreen.svg>)](file:///e:/Projects/mobile%20application/WildP%20Hunter/release-v0.2/RELEASE_VERIFICATION.md)

---

## Overview

**WildPrice Hunter** is a high-performance, cross-platform product price comparison and seller verification engine. It scans multiple global retail platforms (**Amazon, eBay, AliExpress, Walmart, Etsy, and Shopify**) in real-time to find identical or equivalent products at the lowest prices, backed by Google Gemini AI-driven similarity matching and a 6-factor seller authenticity trust algorithm.

The application features a **hybrid dual-engine architecture**:

1. **Cloud Backend Engine**: NestJS 12 + BullMQ distributed workers + Socket.io real-time streaming + Google Gemini AI.
2. **Embedded Client Engine**: On-device React Native scrapers with direct HTTP extraction, image resolution, and local caching for lightning-fast searches and offline fallback.

---

## Repository Structure

```
wildprice-hunter/
├── apps/
│   ├── backend/                      # NestJS 12 API Gateway & Scraping Engine (Port 3000)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── ai/               # Google Gemini AI similarity & audit module
│   │   │   │   ├── auth/             # JWT auth & Passport strategies
│   │   │   │   ├── history/          # Price & search history tracking
│   │   │   │   ├── products/         # Product catalog & dropship margins
│   │   │   │   ├── scraper/          # BullMQ queue & platform workers
│   │   │   │   ├── search/           # Search session orchestrator & WebSocket gateway
│   │   │   │   ├── trust/            # Trust evaluation engine
│   │   │   │   ├── users/            # User profile management
│   │   │   │   └── watchlist/        # Price alert tracking & notifications
│   │   │   ├── health/               # Terminus health-check endpoints
│   │   │   └── main.ts               # Application entrypoint & Swagger setup
│   │   └── test/                     # Vitest e2e & unit test suite
│   │
│   └── mobile/                       # React Native 0.87.1 Mobile App (Android & iOS)
│       ├── android/                  # Native Android project (SDK 37 / Target 35)
│       └── src/
│           ├── api/                  # Axios & WebSocket client configuration
│           ├── components/           # Custom UI components & Flat-Brutalism design system
│           ├── constants/            # Color palettes, typography & theme tokens
│           ├── embedded/             # Embedded on-device scraping & fallback engine
│           │   ├── scrapers/         # Client-side Amazon, eBay, AliExpress, Walmart parsers
│           │   ├── orchestrator/     # Client search scheduler & queue manager
│           │   └── storage/          # AsyncStorage local caching layer
│           ├── hooks/                # Custom React hooks (search, network, debouncing)
│           ├── navigation/           # React Navigation 7 stack & custom bottom tab bar
│           ├── screens/              # App screens (Search, Results, Watchlist, Profile, etc.)
│           └── store/                # Zustand global state stores
│
├── packages/
│   ├── shared-types/                 # Universal TypeScript interfaces, enums & DTOs
│   └── trust-algorithm/              # Standalone 6-factor trust scoring module
│
├── infrastructure/
│   ├── docker-compose.yml            # PostgreSQL, Redis & Elasticsearch services
│   └── nginx/                        # Reverse proxy & SSL termination configuration
│
├── scripts/
│   ├── build-android.ps1             # Automated Android AAB & APK build script with W: drive
│   ├── copy-release-v0.8.ps1         # Release bundling automation
│   ├── test-scrapers.js              # Standalone scraper verification harness
│   └── verify-realtime-fix.js        # WebSocket & polling validation script
│
├── release-v0.9/                     # Production release artifacts (v0.9.0)
│   ├── WildPriceHunter-v0.9.aab      # Production signed Play Store App Bundle (61.40 MB)
│   ├── WildPriceHunter-v0.9.apk      # Universal release APK (84.42 MB)
│   ├── RELEASE_VERIFICATION.md       # Cryptographic hashes & verification certificates
│   ├── PLAY_STORE_LISTING.md         # Official Play Store listing copy & keywords
│   ├── PRIVACY_POLICY.md             # Public compliance privacy policy
│   ├── DATA_SAFETY_AND_DECLARATIONS.md # Google Play Data Safety declaration form
│   └── playstore_icon_512x512.png    # 512x512 Play Store icon & feature graphic
│
├── docs/                             # Project documentation & checklists
│   ├── README.md                     # Main developer documentation (this file)
│   └── PLAYSTORE_PUBLICATION_CHECKLIST.md # Step-by-step Google Play Console guide
│
├── KEYSTORE_CREDENTIALS.md           # Production Android signing key details & fingerprints
└── package.json                      # Monorepo workspaces & root execution scripts
```

---

## Quick Start

### Prerequisites

- **Node.js**: `>= 20.0.0` (Recommended: `22.x LTS`)
- **npm**: `>= 10.0.0`
- **Docker Desktop**: For running PostgreSQL, Redis, and Elasticsearch
- **Java Development Kit**: JDK 17 (e.g. Eclipse Adoptium OpenJDK 17)
- **Android Studio**: Android SDK Build-Tools 35.0.0+, Android SDK Platform 35 / 37
- **Xcode**: macOS only (for optional iOS builds)

### 1. Installation

Install all workspace dependencies from the root:

```bash
npm install
```

### 2. Environment Configuration

Copy the sample environment file and configure your API keys:

```bash
cp .env.example .env
```

Key environment variables:

| Variable            | Description                                   | Default / Example                                         |
| ------------------- | --------------------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`      | PostgreSQL connection string                  | `postgresql://postgres:postgres@localhost:5432/wildprice` |
| `REDIS_URL`         | Redis connection URL                          | `redis://localhost:6379`                                  |
| `JWT_SECRET`        | 32+ character secret for JWT signing          | `your-secure-jwt-secret-key-min-32-chars`                 |
| `GEMINI_API_KEY`    | Google Gemini AI API key                      | `AIzaSy...`                                               |
| `FIRECRAWL_API_KEY` | Firecrawl API key for structured web scraping | `fc-...`                                                  |
| `FIRECRAWL_API_URL` | Firecrawl endpoint (Cloud or self-hosted)     | `https://api.firecrawl.dev`                               |
| `PORT`              | NestJS server port                            | `3000`                                                    |

### 3. Start Database & Message Queue Infrastructure

Launch PostgreSQL, Redis, and Elasticsearch using Docker Compose:

```bash
cd infrastructure
docker-compose up -d postgres redis elasticsearch
```

Verify services:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Elasticsearch: `localhost:9200`

### 4. Run the Backend API

From the repository root:

```bash
npm run dev:backend
```

- **REST API**: `http://localhost:3000/api`
- **Swagger Documentation**: `http://localhost:3000/docs`
- **Health Check**: `http://localhost:3000/health`
- **WebSocket Gateway**: `ws://localhost:3000/search`

### 5. Run the Mobile App

Ensure your Android emulator is running or a physical device is connected via USB (`adb devices`).

Start Metro bundler in one terminal:

```bash
cd apps/mobile && npx react-native start
```

Launch the Android application in another terminal:

```bash
npm run dev:mobile:android
```

---

## Dual Search Architecture

WildPrice Hunter provides a dual-engine search system to ensure maximum speed, privacy, and 100% availability.

```
                            ┌────────────────────────┐
                            │    User Input: URL,    │
                            │   Keyword, or Image    │
                            └───────────┬────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        ┌───────────────────────┐               ┌───────────────────────┐
        │   NESTJS API GATEWAY  │               │   MOBILE EMBEDDED     │
        │    (Cloud Pipeline)   │               │    CLIENT ENGINE      │
        └───────────┬───────────┘               └───────────┬───────────┘
                    │                                       │
            ┌───────┴───────┐                               │
            ▼               ▼                               │
      BullMQ Workers   WebSocket Stream                     │
      (Scraper Queue)  (search:progress)                    │
            │               │                               │
    ┌───────┴────────┐      │                     Direct Platform Parsers
    │ Amazon/eBay/   │      │                     (Amazon, eBay, Walmart,
    │ Ali/Walmart    │      │                      AliExpress via Axios)
    └───────┬────────┘      │                               │
            │               │                               │
            ▼               │                               │
     Gemini AI Model        │                               │
    (Similarity/Audit)      │                               │
            │               │                               │
            ▼               │                               │
    Trust Score Evaluator   │                               │
            │               │                               │
            └───────┬───────┘                               │
                    ▼                                       ▼
        ┌───────────────────────────────────────────────────────────┐
        │                 Zustand Unified Search Store              │
        │               (Sorted by Price & Trust Score)             │
        └───────────────────────────────────────────────────────────┘
```

### 1. Cloud Search Pipeline

1. **Request Intake**: User posts product URL, keyword, or image to `/api/search/{url|text|image}`.
2. **Session Creation**: Search session initialized with a unique UUID.
3. **Queue Distribution**: Scraper jobs dispatched in parallel to BullMQ workers across Amazon, eBay, AliExpress, Walmart, and Etsy, powered by the unified Firecrawl structured extraction engine.
4. **Real-time Notifications**: Backend emits `search:progress` events over Socket.io as each marketplace worker finishes.
5. **AI Fingerprinting**: Google Gemini AI calculates listing similarity (`0.0` – `1.0`), checks for counterfeit patterns, and summarizes review sentiment.
6. **Trust Evaluation**: Seller rating, platform history, and return policies calculate the 0–100 composite trust score.
7. **Storage & Polling**: Listings persisted to PostgreSQL; client receives complete matrix.

### 2. Client-Side Embedded Engine (`apps/mobile/src/embedded`)

- **ScraperManager**: Orchestrates local parallel searches without depending on cloud backend availability.
- **Platform Parsers**: Optimized DOM and JSON scrapers for Amazon, eBay, Walmart, and AliExpress.
- **ImageResolver**: Extracts high-resolution product thumbnails and image arrays directly.
- **Offline Storage**: Searches and product cards cached locally in AsyncStorage for instant offline retrieval.

---

## Real-Time WebSocket Protocol

The search gateway uses Socket.io to stream scraping progress to mobile clients without polling overhead.

- **Namespace**: `/search`
- **Client Subscription**: `socket.emit('subscribe', { sessionId: '<SESSION_UUID>' })`

### Emitted Events

#### `search:progress`

Fired each time an individual platform scraper completes:

```json
{
  "sessionId": "a5e8f1b2-...",
  "platform": "amazon",
  "status": "completed",
  "resultsFound": 12,
  "elapsedMs": 1420
}
```

#### `search:complete`

Fired when all platform scrapers and AI similarity scoring have concluded:

```json
{
  "sessionId": "a5e8f1b2-...",
  "status": "completed",
  "totalResults": 48,
  "lowestPrice": 19.99,
  "currency": "USD"
}
```

#### `search:error`

Fired on unexpected worker failure or rate limiting:

```json
{
  "sessionId": "a5e8f1b2-...",
  "platform": "aliexpress",
  "error": "Rate limit exceeded"
}
```

---

## Trust Score Algorithm

Located in [packages/trust-algorithm](file:///e:/Projects/mobile%20application/WildP%20Hunter/packages/trust-algorithm/src/index.ts), this engine assigns a 0–100 rating to every listing across six dimensions:

| Dimension                | Max Points | Evaluation Logic                                                               |
| ------------------------ | :--------: | ------------------------------------------------------------------------------ |
| **Platform Reliability** |     30     | Hardcoded reliability tier (Amazon: 30, Walmart: 28, eBay: 24, AliExpress: 18) |
| **Seller Rating**        |     25     | Scaled linearly: `(rating / 5) * 25`                                           |
| **Review Volume**        |     15     | Logarithmic curve: `(log10(count) / log10(10000)) * 15`                        |
| **Return Policy**        |     15     | Free returns = 15, Paid returns = 8, No returns = 0                            |
| **Seller Account Age**   |     10     | `> 5 years` = 10, `2–5 years` = 7, `< 2 years` = 3                             |
| **Domain Trust**         |     5      | Valid SSL certificate and WHOIS registration age > 1 year                      |
| **Total Max Score**      |  **100**   | **Grade: 80+ Trusted                                                           | 60–79 Moderate | <60 Risky** |

---

## API Reference

### Authentication

All authenticated endpoints require an `Authorization: Bearer <token>` header.

| Method | Endpoint             | Auth | Description                                       |
| ------ | -------------------- | :--: | ------------------------------------------------- |
| `POST` | `/api/auth/register` |  ❌  | Create new user account                           |
| `POST` | `/api/auth/login`    |  ❌  | Authenticate and obtain JWT access/refresh tokens |
| `POST` | `/api/auth/refresh`  |  ❌  | Refresh expired JWT token                         |
| `POST` | `/api/auth/logout`   |  ✅  | Invalidate active user session                    |
| `GET`  | `/api/auth/me`       |  ✅  | Fetch profile of authenticated user               |

### Search & Price Comparison

| Method | Endpoint                  |   Auth   | Description                                           |
| ------ | ------------------------- | :------: | ----------------------------------------------------- |
| `POST` | `/api/search/url`         | Optional | Start search by pasting any marketplace URL           |
| `POST` | `/api/search/text`        | Optional | Search products by keyword query across all platforms |
| `POST` | `/api/search/image`       | Optional | Search products using base64 image data               |
| `GET`  | `/api/search/:id`         | Optional | Get current session status & completion percentage    |
| `GET`  | `/api/search/:id/results` | Optional | Fetch all parsed & ranked product listings            |

### Products & Intelligence

| Method | Endpoint                            |   Auth   | Description                                                |
| ------ | ----------------------------------- | :------: | ---------------------------------------------------------- |
| `GET`  | `/api/products/:id`                 | Optional | Get consolidated product profile and all platform listings |
| `GET`  | `/api/products/:id/dropshipping`    | Optional | Calculate potential dropshipping margin vs wholesale price |
| `GET`  | `/api/products/listing/:id/history` | Optional | Retrieve historical price changes and trends               |

### Watchlist & Alerts

| Method   | Endpoint                          | Auth | Description                                      |
| -------- | --------------------------------- | :--: | ------------------------------------------------ |
| `GET`    | `/api/watchlist`                  |  ✅  | List all tracked products for the user           |
| `POST`   | `/api/watchlist`                  |  ✅  | Add listing to user's price drop alert watchlist |
| `PATCH`  | `/api/watchlist/:id/target-price` |  ✅  | Update target notification price threshold       |
| `DELETE` | `/api/watchlist/:id`              |  ✅  | Remove product from watchlist                    |

---

## Automated Android Release Builds

The repository includes a dedicated PowerShell automation script ([scripts/build-android.ps1](file:///e:/Projects/mobile%20application/WildP%20Hunter/scripts/build-android.ps1)) that handles:

- Circumventing the Windows 260-character `MAX_PATH` limitation by mounting the workspace to virtual drive `W:`.
- Generating the offline production Hermes bytecode bundle (`hermesc` HBC v98).
- Packaging both the Google Play Store App Bundle (`.aab`) and signed `.apk`.

### Build Commands

```powershell
# Build both Play Store AAB and universal Release APK:
npm run build:android

# Or specify a target directly:
powershell -ExecutionPolicy Bypass -File ./scripts/build-android.ps1 -Target bundleRelease
powershell -ExecutionPolicy Bypass -File ./scripts/build-android.ps1 -Target assembleRelease
```

### Current Android Release Specifications (v0.9.0)

- **Application ID**: `com.wildpricehunter`
- **Version Code**: `9`
- **Version Name**: `0.9.0`
- **Compile SDK**: `37`
- **Target SDK**: `35` (Compliant with Google Play 2026 requirements)
- **Minimum SDK**: `24` (Android 7.0+, ~98.5% global device coverage)
- **Signing Scheme**: V2 APK Signature Scheme (`wildprice-release.jks`)
- **Key Fingerprints & Passwords**: See [KEYSTORE_CREDENTIALS.md](file:///e:/Projects/mobile%20application/WildP%20Hunter/KEYSTORE_CREDENTIALS.md)

---

## Testing & Quality Assurance

### Run All Workspace Tests

```bash
npm test
```

### Run Tests Per Package

```bash
# Backend unit & integration tests (Vitest)
npm run test --workspace=apps/backend

# Backend end-to-end tests
npm run test:e2e --workspace=apps/backend

# Mobile tests (Jest)
npm run test --workspace=apps/mobile

# Trust scoring algorithm tests
npm run test --workspace=packages/trust-algorithm
```

### Code Formatting & Linting

```bash
# Lint all packages
npm run lint

# Format code with Prettier
npm run format
```

---

## Documentation Links

- 📋 [Google Play Store Publication Checklist](file:///e:/Projects/mobile%20application/WildP%20Hunter/docs/PLAYSTORE_PUBLICATION_CHECKLIST.md)
- 🔑 [Keystore & Signing Key Credentials](file:///e:/Projects/mobile%20application/WildP%20Hunter/KEYSTORE_CREDENTIALS.md)
- 📦 [Release v0.9 Verification & Checksums](file:///e:/Projects/mobile%20application/WildP%20Hunter/release-v0.9/RELEASE_VERIFICATION.md)
- 📝 [Official Play Store Listing Copy](file:///e:/Projects/mobile%20application/WildP%20Hunter/release-v0.9/PLAY_STORE_LISTING.md)
- 🔒 [Privacy Policy](file:///e:/Projects/mobile%20application/WildP%20Hunter/release-v0.9/PRIVACY_POLICY.md)
- 🛡️ [Data Safety Declarations](file:///e:/Projects/mobile%20application/WildP%20Hunter/release-v0.9/DATA_SAFETY_AND_DECLARATIONS.md)

---

_WildPrice Hunter v0.9.0 | Built with React Native, NestJS, BullMQ & Google Gemini AI_

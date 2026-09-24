# WildPrice Hunter 🎯

> **Cross-Platform Real-Time Product Price Comparison & Trust Intelligence Engine**

[![Version](https://img.shields.io/badge/version-0.9.0-blue.svg)](file:///e:/Projects/mobile%20application/WildP%20Hunter/package.json)
[![React Native](https://img.shields.io/badge/React%20Native-0.87.1-61DAFB.svg)](file:///e:/Projects/mobile%20application/WildP%20Hunter/apps/mobile/package.json)
[![NestJS](https://img.shields.io/badge/NestJS-12.0-E0234E.svg)](file:///e:/Projects/mobile%20application/WildP%20Hunter/apps/backend/package.json)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Powered-8E75C2.svg)](file:///e:/Projects/mobile%20application/WildP%20Hunter/apps/backend/src/modules/ai)
[![Android Build](<https://img.shields.io/badge/Android%20AAB-Passing%20(v0.9)-brightgreen.svg>)](file:///e:/Projects/mobile%20application/WildP%20Hunter/release-v0.9/RELEASE_VERIFICATION.md)
[![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey.svg)](file:///e:/Projects/mobile%20application/WildP%20Hunter/package.json)

---

## ⚡ What is WildPrice Hunter?

**WildPrice Hunter** eliminates the guesswork and hidden markups in modern e-commerce. When shopping online, consumers and dropshippers often overpay on one platform (like Amazon or Shopify) for goods manufactured and sold directly on other marketplaces for a fraction of the cost.

WildPrice Hunter allows users to:

1. **Paste any product URL** or search term.
2. **Scan across 6 global retail ecosystems**: Amazon, eBay, AliExpress, Walmart, Etsy, and Shopify.
3. **Verify listing authenticity** with Google Gemini AI and a transparent 6-factor Seller Trust Score.
4. **Track price drops** and calculate dropshipping profit margins.

---

## 🚀 Quick Navigation

- 📘 **[Master Architecture & Engineering Guide](PROJECT_ARCHITECTURE_AND_ENGINEERING_GUIDE.md)** — Comprehensive technical deep dive: dual engines, 6-factor trust algorithm, Google Gemini AI pipeline, and WebSocket contracts.
- 📖 **[Comprehensive Developer Documentation](docs/README.md)** — Architectural breakdown, API reference, WebSocket protocol, and setup instructions.
- 📋 **[Play Store Publication Checklist](docs/PLAYSTORE_PUBLICATION_CHECKLIST.md)** — Step-by-step Google Play Console submission guide for v0.9.0.
- 📦 **[Release v0.9 Verification & Artifacts](release-v0.9/RELEASE_VERIFICATION.md)** — Binary sizes, SHA-256 cryptographic checksums, and `apksigner` logs.
- 📝 **[Play Store Listing Copy](release-v0.9/PLAY_STORE_LISTING.md)** — Store titles, short/full descriptions, and keyword tags.

---

## 🏗️ Monorepo Structure

```
wildprice-hunter/
├── apps/
│   ├── backend/               # NestJS 12 API Gateway, BullMQ workers, WebSocket gateway
│   └── mobile/                # React Native 0.87.1 App (New Architecture, Hermes HBC v98)
├── packages/
│   ├── shared-types/          # Shared TypeScript models, enums & DTOs
│   └── trust-algorithm/       # Standalone 6-factor trust scoring module
├── infrastructure/            # Docker Compose services (PostgreSQL, Redis, Elasticsearch)
├── scripts/                   # Build automation, PowerShell scripts & testing harnesses
├── release-v0.9/              # Signed .aab & .apk binaries, graphics, and legal policies
└── docs/                      # Developer and release documentation
```

---

## 🛠️ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Set your DATABASE_URL, REDIS_URL, GEMINI_API_KEY, SERPAPI_KEY
```

### 3. Start Local Services

```bash
cd infrastructure && docker-compose up -d postgres redis elasticsearch
```

### 4. Run Development Servers

```bash
# Start Backend API (http://localhost:3000/docs)
npm run dev:backend

# Start Mobile App (Android)
npm run dev:mobile:android
```

### 5. Build Android Production Release (.aab + .apk)

```bash
npm run build:android
```

---

## 🧪 Testing

```bash
# Run all workspace test suites
npm test

# Run backend unit tests with Vitest
npm run test --workspace=apps/backend

# Run mobile unit tests with Jest
npm run test --workspace=apps/mobile
```

---

_WildPrice Hunter v0.9.0 | Built with React Native, NestJS, BullMQ & Google Gemini AI_

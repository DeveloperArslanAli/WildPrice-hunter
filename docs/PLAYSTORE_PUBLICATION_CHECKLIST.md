# Google Play Store Publication Checklist — Release v0.9.0

## Application: WildPrice Hunter (`com.wildpricehunter`)

---

## 1. Technical Build & Package Status

| Requirement             | Target Specification             | Current Project Status | Verification / Notes                                                |
| :---------------------- | :------------------------------- | :--------------------- | :------------------------------------------------------------------ |
| **Package Format**      | Android App Bundle (`.aab`)      | ✅ **FULFILLED**       | `release-v0.9/WildPriceHunter-v0.9.aab` (61.40 MB / ~58.55 MB)      |
| **Testing APK**         | Release `.apk` (signed)          | ✅ **FULFILLED**       | `release-v0.9/WildPriceHunter-v0.9.apk` (84.42 MB)                  |
| **Version Name**        | `0.9.0`                          | ✅ **FULFILLED**       | Configured in `defaultConfig.versionName`                           |
| **Version Code**        | `9` (Integer)                    | ✅ **FULFILLED**       | Configured in `defaultConfig.versionCode`                           |
| **Target SDK Version**  | API 34+ (Play Store Requirement) | ✅ **FULFILLED**       | Set to **API 35** (`targetSdkVersion 35`)                           |
| **Compile SDK Version** | API 34+                          | ✅ **FULFILLED**       | Set to **API 37** (`compileSdkVersion 37`)                          |
| **Minimum SDK Version** | API 24+                          | ✅ **FULFILLED**       | Set to **API 24** (Android 7.0+, ~98.5% global devices)             |
| **64-bit Architecture** | `arm64-v8a`, `x86_64`            | ✅ **FULFILLED**       | Native libs bundled for `armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64` |
| **Production Signing**  | V2 Signature Scheme + Keystore   | ✅ **FULFILLED**       | Signed with `wildprice-release.jks` (`wildprice-key-alias`)         |
| **Hermes JS Engine**    | Hermes Bytecode Optimization     | ✅ **FULFILLED**       | Compiled with `hermesc` HBC bytecode v98                            |
| **Permissions Audit**   | Minimal required permissions     | ✅ **FULFILLED**       | Only `android.permission.INTERNET` declared                         |

---

## 2. Cryptographic Checksums (v0.9.0)

| File            | Path                                    | Size             | SHA-256 Checksum                                                   |
| :-------------- | :-------------------------------------- | :--------------- | :----------------------------------------------------------------- |
| **AAB Bundle**  | `release-v0.9/WildPriceHunter-v0.9.aab` | 61,397,731 bytes | `70737204B89CAFC346ED4AC86532326B6DCA3F57DD30058DAA57BD7E7A8FB195` |
| **Release APK** | `release-v0.9/WildPriceHunter-v0.9.apk` | 84,417,360 bytes | `8EF8D8474E6026026AF62F72F0241FE75F17F3B6F53AFFB35ABF7B97C1579452` |

> See [release-v0.9/RELEASE_VERIFICATION.md](file:///e:/Projects/mobile%20application/WildP%20Hunter/release-v0.9/RELEASE_VERIFICATION.md) for full `apksigner` and `aapt dump badging` verification logs.

---

## 3. Google Play Console Setup Step-by-Step

### Step 3.1: Create App in Google Play Console

1. Log in to [Google Play Console](https://play.google.com/console).
2. Click **Create app**.
3. Fill in:
   - **App name**: `WildPrice Hunter: Price Tracker` (30 chars max)
   - **Default language**: English (United States) - `en-US`
   - **App or game**: App
   - **Free or paid**: Free
   - Accept the Developer Program Policies and US export laws checkboxes.
4. Click **Create app**.

---

### Step 3.2: Google Play App Signing

1. Navigate to **Release** > **Setup** > **App integrity**.
2. Google Play App Signing is automatically enabled for all new apps.
3. Choose **Use Google-generated key** (recommended) or export your key with PEPK tool.
4. Note your Upload Key fingerprints matching [KEYSTORE_CREDENTIALS.md](file:///e:/Projects/mobile%20application/WildP%20Hunter/KEYSTORE_CREDENTIALS.md):
   - **SHA-256**: `9E:1C:AE:FB:73:03:06:6C:A5:EE:6E:F3:D6:2C:CB:1F:F3:36:EE:BE:6E:36:EC:AE:E3:AA:4A:37:FA:0C:8C:31`
   - **SHA-1**: `1F:61:B3:20:11:F6:0C:37:E7:B1:C0:A1:DA:88:76:D8:2A:F8:29:F8`

---

### Step 3.3: Store Listing & Graphic Assets

Ready-to-upload visual assets are located in the [release-v0.9/](file:///e:/Projects/mobile%20application/WildP%20Hunter/release-v0.9) directory:

| Asset                  | Location / Specifications                                                  | Checklist              |
| :--------------------- | :------------------------------------------------------------------------- | :--------------------- |
| **App Icon**           | `release-v0.9/playstore_icon_512x512.png` (512 x 512 px, 32-bit PNG)       | ✅ Ready to upload     |
| **Feature Graphic**    | `release-v0.9/playstore_feature_graphic_1024x500.jpg` (1024 x 500 px, JPG) | ✅ Ready to upload     |
| **Phone Screenshots**  | Min 2, max 8. Format: 9:16 (e.g. 1080 x 2400 px), PNG/JPEG                 | ⬜ Min 4 screens taken |
| **Tablet Screenshots** | Optional for phones, recommended for foldables & tablets                   | ⬜ Optional            |

#### Store Listing Copy Reference (from `release-v0.9/PLAY_STORE_LISTING.md`):

- **Short Description** (up to 80 characters):
  > _Find lowest prices across Amazon, eBay, AliExpress & Walmart with AI._
- **Full Description**: See [release-v0.9/PLAY_STORE_LISTING.md](file:///e:/Projects/mobile%20application/WildP%20Hunter/release-v0.9/PLAY_STORE_LISTING.md) for full formatted description with feature bullets, dropshipping mode highlights, and trust algorithm details.

---

### Step 3.4: App Content & Policy Declarations

Under **Policy and programs** > **App content**, complete all mandatory questionnaires:

1. **Privacy Policy**:
   - Host the public privacy policy provided in [release-v0.9/PRIVACY_POLICY.md](file:///e:/Projects/mobile%20application/WildP%20Hunter/release-v0.9/PRIVACY_POLICY.md) on a public web page (e.g. GitHub Pages or company domain).
   - Enter the valid URL into Google Play Console.
2. **App Access**:
   - Select _"All functionality is available without restrictions"_ (guest mode supported without mandatory login) OR provide demo credentials.
3. **Ads**:
   - Select _"No, my app does not contain ads"_.
4. **Content Rating (IARC)**:
   - Category: Utility / Shopping.
   - Expected Rating: **PEGI 3 / Everyone**.
5. **Target Audience and Content**:
   - Target age: **18 and older** (or 13+).
   - Select _"No, does not intentionally target children under 13"_.
6. **News Apps**: Select _"No"_.
7. **COVID-19 Contact Tracing**: Select _"No"_.
8. **Data Safety Form**:
   - Follow the pre-filled field answers in [release-v0.9/DATA_SAFETY_AND_DECLARATIONS.md](file:///e:/Projects/mobile%20application/WildP%20Hunter/release-v0.9/DATA_SAFETY_AND_DECLARATIONS.md).
   - Data collected: Email & Name (optional, if registered), search query text (app functionality).
   - Data sharing: Data is **not sold** to third parties.
   - Security: Encrypted in transit (HTTPS / TLS 1.3).
9. **Financial Features**:
   - Select _"Price comparison / shopping tool (not a regulated financial or banking entity)"_.
10. **Government Apps**: Select _"No"_.

---

### Step 3.5: Release Tracks & Rollout

1. **Internal Testing**:
   - Navigate to **Testing** > **Internal testing**.
   - Create a new release and upload:
     `release-v0.9/WildPriceHunter-v0.9.aab` (or `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`)
   - **Release Name**: `0.9.0 (9)`
   - **Release Notes**:
     ```text
     What's new in WildPrice Hunter v0.9:
     • Bottom Navigation Bar Redesign: Fixed bottom navigation bar layout with edge-to-edge active indicators and dedicated safe inset handling across all Android navigation modes.
     • Zero Text Clipping: Fluid responsive tab item sizing eliminates label truncation and squashing on compact and large screen devices.
     • Real-Time Marketplace Extraction: Enhanced cross-platform search and live metadata parsing across Amazon, eBay, Walmart, and AliExpress.
     • Performance & Stability: Hardened memory lifecycle and zero-leak state clearing during intensive multi-platform searches.
     ```
   - Add internal tester email list for instant access.

2. **Closed Testing (20 Testers Requirement for Personal Accounts)**:
   - If using a personal Google Play developer account created after November 2023, run closed testing with at least 20 testers opted in for 14 continuous days before requesting production access.

3. **Production Track**:
   - Promote internal/closed release to **Production** once test review period is complete.

---

## 4. Automation Script Quick Reference

To rebuild the release package at any time:

```powershell
# Build both Play Store AAB and universal Release APK:
powershell -ExecutionPolicy Bypass -File .\scripts\build-android.ps1 -Target allRelease

# Or build only the Play Store App Bundle:
powershell -ExecutionPolicy Bypass -File .\scripts\build-android.ps1 -Target bundleRelease

# Or build only the Release APK:
powershell -ExecutionPolicy Bypass -File .\scripts\build-android.ps1 -Target assembleRelease
```

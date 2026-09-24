# WildPrice Hunter v0.2 — Release Verification & Cryptographic Hashes

**Build Date:** September 22, 2026  
**Package:** `com.wildpricehunter`  
**Version Code:** `10`  
**Version Name:** `0.2.0`  
**Internal Package Version:** `0.2.0`  

---

## 1. Key Improvements in v0.2

- **Unified Firecrawl Scraping Engine:**
  - Fully replaced legacy scraper stack with Firecrawl structured extraction and marketplace search.
  - Implemented real-time JSON schema extraction (`ProductExtractSchema`) on `/v1/search` and `/v1/scrape` retrieving live prices, high-res images, stock indicators, and merchant names.
- **Zero Mock Data Across All 4 Target Marketplaces:**
  - Verified live parallel scraping across **Amazon**, **eBay**, **AliExpress**, and **Walmart**.
  - Direct eBay item path targeting (`ebay.com/itm/`) ensuring accurate live buy prices.
  - Live cross-platform price comparison discovering up to 90% savings between direct manufacturers and retail marketplaces.
- **Enhanced Security & Domain Boundaries:**
  - Resolved domain spoofing vulnerabilities via strict boundary regex checking in `UrlParserService`.
  - Zero-downtime HTML fallback extracting OpenGraph & JSON-LD `Product` schemas during rate limits.
- **Custom Bottom Navigation Bar:**
  - Production-hardened bottom navigation layout with dedicated safe bottom insets and edge-to-edge active indicators.

---

## 2. Binary Cryptographic Checksums (SHA-256)

| Binary File | Size (Bytes) | SHA-256 Checksum |
| :--- | :--- | :--- |
| **`WildPriceHunter-v0.2.aab`** | 61,397,718 bytes (~58.55 MB) | `553734F00F4DDEA62F0E9818F869AACA70494CE83D894AE58FA0D66EB5A1A5AC` |
| **`WildPriceHunter-v0.2.apk`** | 84,417,360 bytes (~80.51 MB) | `17A4ACB437D991CB2A8E93C547C5DD3A03B4F30C438F747018B195D77946A3D9` |

---

## 3. Keystore & Certificate Fingerprints

- **Keystore File:** `apps/mobile/android/app/wildprice-release.jks`
- **Key Alias:** `wildprice-key-alias`
- **Algorithm:** 2048-bit RSA with SHA256withRSA
- **Certificate Validity:** September 19, 2026 — February 04, 2054
- **Certificate Fingerprints:**
  - **SHA-1:** `1F:61:B3:20:11:F6:0C:37:E7:B1:C0:A1:DA:88:76:D8:2A:F8:29:F8`
  - **SHA-256:** `9E:1C:AE:FB:73:03:06:6C:A5:EE:6E:F3:D6:2C:CB:1F:F3:36:EE:BE:6E:36:EC:AE:E3:AA:4A:37:FA:0C:8C:31`

---

## 4. Signing Scheme Verification Results (`apksigner`)

```text
Verifies: true
Verified using v1 scheme (JAR signing): false
Verified using v2 scheme (APK Signature Scheme v2): true
Verified using v3 scheme (APK Signature Scheme v3): false
Verified using v3.1 scheme (APK Signature Scheme v3.1): false
Verified using v3.2 scheme (APK Signature Scheme v3.2): false
Verified using v4 scheme (APK Signature Scheme v4): false
Verified for SourceStamp: false
Number of signers: 1
```

---

## 5. Package Badging & Android Manifest (`aapt dump badging`)

```text
package: name='com.wildpricehunter' versionCode='10' versionName='0.2.0' platformBuildVersionName='17' platformBuildVersionCode='37' compileSdkVersion='37' compileSdkVersionCodename='17'
sdkVersion:'24'
targetSdkVersion:'36'
application-label:'WildPrice Hunter'
application-icon-160:'res/BW.xml'
application-icon-240:'res/BW.xml'
application-icon-320:'res/BW.xml'
application-icon-480:'res/BW.xml'
application-icon-640:'res/BW.xml'
application-icon-65534:'res/BW.xml'
launchable-activity: name='com.mobile.MainActivity'
native-code: 'arm64-v8a' 'armeabi-v7a' 'x86' 'x86_64'
```

---

## 6. Automated Test Pass Certificate

```text
Backend Test Suite (Vitest):        14 passed, 14 total (82 passed, 82 total)
Mobile Test Suite (Jest):           13 passed, 13 total (71 passed, 71 total)
Trust Algorithm Suite (Vitest):      1 passed,  1 total (20 passed, 20 total)
TypeScript / Linter:                0 errors (Both Mobile & Backend)
Status:                             100% GREEN (173 passed, 0 failures)
```

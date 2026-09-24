# WildPrice Hunter v2.0 — Release Verification & Cryptographic Hashes

**Build Date:** September 24, 2026  
**Package:** `com.wildpricehunter`  
**Version Code:** `20`  
**Version Name:** `2.0.0`  
**Internal Monorepo Version:** `2.0.0`  

---

## 1. Key Improvements in v2.0

- **Major Version 2.0 Architectural Milestone:**
  - Full-stack synchronization: bumped root, mobile, and backend workspace dependencies to version `2.0.0`.
  - Android application version code incremented to `20` and version name to `2.0.0`.
- **Dual-Engine Search & Scraping Coordination:**
  - Seamless fallback between Cloud NestJS backend and Embedded On-Device React Native search orchestrator.
  - Enhanced cache pruning in `localDb` keeping the local storage clean and fast.
- **Google Gemini 2.0 Flash AI Integration:**
  - Sub-second product similarity scoring and semantic entity title extraction.
  - Complete elimination of false positive accessory matches.
- **Enhanced 6-Factor Seller Authenticity & Trust Engine:**
  - Real-time trust calculations across 6 weighted parameters (Platform, Seller Rating, Review Volume, Return Policy, Account Age, Domain Trust).
  - Instant visual badge classification: Highly Trusted, Trusted, Moderate, Low Trust, Risky.
- **Platform Hardening & Security:**
  - Compiled against Android SDK 37 (Target SDK 36, Min SDK 24).
  - Signed with PKCS12 2048-bit RSA production release key via APK Signature Scheme v2.
  - 100% clean of credentials and secrets, compliant with GitHub Secret Scanning push protection.

---

## 2. Binary Cryptographic Checksums (SHA-256)

| Binary File | Size (Bytes) | SHA-256 Checksum |
| :--- | :--- | :--- |
| **`WildPriceHunter-v2.0.aab`** | 61,397,637 bytes (~58.55 MB) | `F2D9A895967B8FF383256E7A42C5AA554B4D5167BAA051CA00660E131A56CE17` |
| **`WildPriceHunter-v2.0.apk`** | 84,417,440 bytes (~80.51 MB) | `AD29B50BAC598640B3299FABC82FC3592B7FB5D67ED372861A48B10F46C79E2B` |

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
package: name='com.wildpricehunter' versionCode='20' versionName='2.0.0' platformBuildVersionName='17' platformBuildVersionCode='37' compileSdkVersion='37' compileSdkVersionCodename='17'
sdkVersion:'24'
targetSdkVersion:'36'
uses-permission: name='android.permission.INTERNET'
uses-permission: name='com.wildpricehunter.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'
application-label:'WildPrice Hunter'
application-icon-160:'res/mipmap-mdpi-v4/ic_launcher.png'
application-icon-240:'res/mipmap-hdpi-v4/ic_launcher.png'
application-icon-320:'res/mipmap-xhdpi-v4/ic_launcher.png'
application-icon-480:'res/mipmap-xxhdpi-v4/ic_launcher.png'
application-icon-640:'res/mipmap-xxxhdpi-v4/ic_launcher.png'
```

---

## 6. Automated Test Pass Certificate

```text
Mobile Unit & Embedded Tests:  13 test suites passed, 71 tests passed (100%)
Backend Unit & Service Tests:  10 test suites passed, 47 tests passed (100%)
Backend Production Build:      0 errors (nest build successful)
Android Production Build:      BUILD SUCCESSFUL (464 tasks, 0 errors)
TypeScript / Linter:          0 errors
Status:                       ALL GREEN (Production Ready)
```

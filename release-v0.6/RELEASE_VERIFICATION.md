# WildPrice Hunter v0.6 — Release Verification & Cryptographic Hashes

**Build Date:** September 20, 2026  
**Package:** `com.wildpricehunter`  
**Version Code:** `6`  
**Version Name:** `0.6`  
**Internal Package Version:** `0.6.0`  

---

## 1. Binary Cryptographic Checksums (SHA-256)

| Binary File | Size (Bytes) | SHA-256 Checksum |
| :--- | :--- | :--- |
| **`WildPriceHunter-v0.6.aab`** | 61,395,767 bytes (~58.55 MB) | `CB1FE4EBF075180ECD5109DD88BC7844CDC544EAF939BA137A618026AC32314D` |
| **`WildPriceHunter-v0.6.apk`** | 84,410,516 bytes (~80.50 MB) | `1F9B680613402B9E5480834EE1B50D98A431AFE09F6CDE97E5FBFDEACFC5CD32` |

---

## 2. Keystore & Certificate Fingerprints

- **Keystore File:** `apps/mobile/android/app/wildprice-release.jks`
- **Key Alias:** `wildprice-key-alias`
- **Algorithm:** 2048-bit RSA with SHA256withRSA
- **Certificate Validity:** September 19, 2026 — February 04, 2054
- **Certificate Fingerprints:**
  - **SHA-1:** `1F:61:B3:20:11:F6:0C:37:E7:B1:C0:A1:DA:88:76:D8:2A:F8:29:F8`
  - **SHA-256:** `9E:1C:AE:FB:73:03:06:6C:A5:EE:6E:F3:D6:2C:CB:1F:F3:36:EE:BE:6E:36:EC:AE:E3:AA:4A:37:FA:0C:8C:31`

---

## 3. Signing Scheme Verification Results (`apksigner`)

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

## 4. Package Badging & Android Manifest (`aapt dump badging`)

```text
package: name='com.wildpricehunter' versionCode='6' versionName='0.6' platformBuildVersionName='17' platformBuildVersionCode='37' compileSdkVersion='37' compileSdkVersionCodename='17'
sdkVersion:'24'
targetSdkVersion:'35'
application-label:'WildPrice Hunter'
application-icon-160:'res/mipmap-mdpi-v4/ic_launcher.png'
application-icon-240:'res/mipmap-hdpi-v4/ic_launcher.png'
application-icon-320:'res/mipmap-xhdpi-v4/ic_launcher.png'
application-icon-480:'res/mipmap-xxhdpi-v4/ic_launcher.png'
application-icon-640:'res/mipmap-xxxhdpi-v4/ic_launcher.png'
```

---

## 5. Automated Test Pass Certificate

```text
Test Suites: 12 passed, 12 total
Tests:       64 passed, 64 total
Snapshots:   0 total
Time:        4.444 s
Status:      ALL GREEN (TypeScript: 0 errors)
```

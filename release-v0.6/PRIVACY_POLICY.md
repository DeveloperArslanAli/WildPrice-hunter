# Privacy Policy for WildPrice Hunter

**Effective Date:** September 20, 2026  
**Application:** WildPrice Hunter (Package: `com.wildpricehunter`)  
**Developer:** WildPrice Hunter Team  
**Contact:** support@wildpricehunter.com  

---

## 1. Introduction
WildPrice Hunter ("we", "our", or "the App") respects your privacy. This Privacy Policy explains our practices regarding the collection, storage, and protection of information when you use our mobile application.

## 2. On-Device & Offline-First Data Architecture
WildPrice Hunter is architected as an **offline-first application**:
- **Search History**: Your searches and hunted queries are stored exclusively on your device within local application storage (`AsyncStorage`). They are never transmitted to our servers or sold to third parties.
- **Watchlist & Price Alerts**: Saved items and tracked prices remain on your device.
- **Account Profiles**: Guest usage does not require any personal identification, phone number, or email address. Optional local profiles remain on your hardware.

## 3. Information Handled During Usage

### 3.1 Network Requests for Search Queries
When you search for a product or paste a URL:
- The app sends search terms or product URLs to public marketplace search APIs (including Amazon, eBay, AliExpress, and Walmart via secure HTTPS) to fetch real-time listing prices, titles, ratings, and shipping information.
- No personal user identifiers, device IDs, or advertising IDs are attached to these product queries.

### 3.2 Google Gemini AI Analysis
If you use the AI Review Analysis or Image Search features:
- Product review text or item image data is sent via direct HTTPS to Google's Gemini API strictly for sentiment scoring and product keyword identification.
- No personal user data is included with these requests.

### 3.3 Clipboard & Camera Permissions
- **Clipboard**: If you tap the "Paste" button, the app accesses your device clipboard solely to paste the product URL into the search box. We do not read or store clipboard content without direct user action.
- **Camera / Storage**: If you use the visual search feature, the app requests access to your camera or gallery only to capture or select a photo of a product to search. Images are processed locally or queried for product identification and are not saved to remote servers.

## 4. Third-Party Services
The App interacts with the following external APIs solely to provide core product search and AI functionality:
- **Google Gemini API** (Product fingerprinting and review sentiment analysis)
- **Marketplace Public Endpoints** (Amazon, eBay, AliExpress, Walmart price indexing)

We do not use third-party advertising SDKs, behavioral trackers, or data broker analytics.

## 5. Children's Privacy
WildPrice Hunter does not target children under the age of 13 and does not knowingly collect personal information from children.

## 6. Data Retention & Deletion
Because all user data (search history, watchlist, preferences) is stored locally on your device:
- You can clear your search history and watchlist at any time in the app settings.
- Uninstalling the app permanently removes all local app data from your device.

## 7. Changes to This Privacy Policy
We may update this Privacy Policy from time to time. Any changes will be posted in this document and reflected in future app updates.

## 8. Contact Us
If you have questions or concerns about this policy, contact us at:  
**Email:** support@wildpricehunter.com  
**Website:** https://wildpricehunter.com  

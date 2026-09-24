# Privacy Policy for WildPrice Hunter

**Effective Date:** September 22, 2026  
**Last Updated:** September 22, 2026  
**Version:** 0.2.0

WildPrice Hunter ("we", "our", or "the App") is committed to protecting your privacy. This Privacy Policy explains our data collection and handling practices when you use the WildPrice Hunter mobile application.

---

## 1. Zero Personal Data Collection

WildPrice Hunter is engineered with a **local-first, offline-first privacy architecture**:

- **No User Account Required**: You can use all core features (price comparison, trust analysis, product search) without signing up or providing any personal identifiable information (PII).
- **No Personal Identifiers Collected**: We do not collect your name, email address, phone number, physical address, or device hardware IDs.
- **Local Storage**: Your search history, watched products, and user preferences are stored exclusively on your device using encrypted local storage (`AsyncStorage`). This data never leaves your device unless you explicitly clear or export it.

---

## 2. Information Processed During Product Searches

When you perform a product search:

- **Product URLs & Queries**: If you paste a product URL or enter a search query, that text is sent over encrypted HTTPS/TLS 1.3 to our public query gateway to scan retail marketplaces (Amazon, eBay, AliExpress, Walmart). We do not correlate your queries with your identity.
- **Image Search**: If you choose to upload or photograph a product for visual search, the image is transmitted securely via TLS 1.3 to Google Gemini Vision strictly to extract search keywords. Images are not retained, stored, or used to train public models.

---

## 3. Third-Party Marketplaces

WildPrice Hunter searches publicly available product information across third-party marketplaces:
- Amazon Services LLC
- eBay Inc.
- AliExpress (Alibaba Group)
- Walmart Inc.

When you click an outbound link to view a deal on an external marketplace website or app, you are subject to that platform's terms of service and privacy policy. We encourage you to review their respective policies.

---

## 4. Permissions Used

WildPrice Hunter requests minimal Android permissions:

- `INTERNET`: Required to query real-time marketplace prices and trust scores.
- `ACCESS_NETWORK_STATE`: Used to detect offline status and serve cached local deals.
- `CAMERA` *(Optional)*: Only requested when you explicitly choose to take a photo of a product for visual image search. You can deny this permission without impacting URL or keyword searches.
- `READ_MEDIA_IMAGES` *(Optional)*: Only requested when selecting a photo from your gallery for visual search.

---

## 5. Security of Your Data

All network communications between the app and backend services employ industry-standard **TLS 1.3 encryption in transit**. We do not operate advertising tracking trackers, ad networks, or analytics SDKs that profile users across apps.

---

## 6. Children's Privacy

WildPrice Hunter is intended for general audiences and is not directed at children under the age of 13. We do not knowingly collect personal data from children.

---

## 7. Contact Us

If you have questions or concerns regarding this Privacy Policy, please contact the development team:

- **Email**: `privacy@wildpricehunter.com`
- **Developer Website**: `https://wildpricehunter.com`
- **GitHub**: `https://github.com/wildpricehunter`

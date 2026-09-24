# Google Play Console Data Safety & App Content Declarations

Use these exact answers when completing the **App content** questionnaires in the Google Play Console for **WildPrice Hunter v0.8**.

---

## 1. Data Safety Questionnaire

### Overview
- **Does your app collect or share any of the required user data types?**  
  👉 **No** (All search history, watchlist items, and profiles are kept strictly on-device in local storage).
- **Is all of the user data collected by your app encrypted in transit?**  
  👉 **Yes** (All HTTPS marketplace and AI queries use standard TLS 1.3).
- **Do you provide a way for users to request that their data be deleted?**  
  👉 **Yes** (Users can clear all history/watchlist directly inside the app, and uninstalling wipes all data).

---

## 2. App Content Declarations

### Privacy Policy
- **Privacy Policy URL**: Link to your hosted `PRIVACY_POLICY.md` (e.g. `https://wildpricehunter.com/privacy` or a public GitHub/Notion page).

### Ads
- **Does your app contain ads?**  
  👉 Select: **"No, my app does not contain ads"**.

### App Access
- **Are parts of your app restricted based on login credentials, memberships, location, etc.?**  
  👉 Select: **"All functionality is available without special access"** (the app provides full guest access out-of-the-box).

### Target Audience & Content
- **Target age group**:  
  👉 Select: **18 and over** (or 13-17 / 18+).  
- **Appeal to children**:  
  👉 Select: **"No"**.

### News Apps
- **Is your app a news app?**  
  👉 Select: **"No"**.

### COVID-19 Tracing / Status
- 👉 Select: **"My app is not a publicly available COVID-19 contact tracing or status app"**.

### Financial Features
- **Does your app provide financial features (banking, loans, investments, crypto)?**  
  👉 Select: **"None of the above / My app does not provide financial features"** (price comparison is classified under Shopping, not financial services).

### Government Apps
- 👉 Select: **"No"**.

---

## 3. Store Listing Assets Upload Guide

1. **App Icon**: Upload `playstore_icon_512x512.png` (512×512 PNG, 32-bit color).
2. **Feature Graphic**: Upload `playstore_feature_graphic_1024x500.jpg` (1024×500 JPG).
3. **Screenshots**: Upload phone screenshots (at least 2, 16:9 or 9:16 aspect ratio).
4. **App Bundle**: In **Production** (or **Closed testing** / **Internal testing**), create a new release and drag & drop:
   `WildPriceHunter-v0.8.aab`
5. **Release Notes**: Copy the contents of `PLAY_STORE_LISTING.md` (What's new in v0.8).

# OkadaGo iOS Build Setup

End-to-end checklist for getting the **OkadaGo Passenger** and **OkadaGo Rider** apps building for iOS and uploading to **TestFlight** via **EAS Build** (cloud). Everything below runs on Windows — no Mac, no Xcode required.

The two apps share most of this setup. The only thing that differs is the bundle ID and the App Store Connect app entry.

| App | Folder | Bundle ID | EAS project ID |
|---|---|---|---|
| Passenger | `frontend/passenger-app` | `com.okadago.passenger` | `94c07182-c892-4106-8b44-3a4ebc25f853` |
| Rider | `frontend/rider-app` | `com.okadago.rider` | `ae3d1d1a-2ce9-40ec-b4a4-97510377682e` |

**Estimated time for the first build end-to-end: 1.5–3 hours** (most of that is Apple account enrollment + App Store Connect propagation + the first EAS build, which typically takes 15–25 min).

---

## 1. Apple Developer prerequisites (one-time)

### 1.1 Enroll in the Apple Developer Program

- Go to <https://developer.apple.com/programs/enroll/>
- Cost: **$99 USD/year** (credit card or Apple-invoiced)
- Individual or organization enrollment both work
- Processing: usually **24–48 hours**

You cannot proceed until enrollment is active. There's no way to "skip" this step.

### 1.2 Note your Apple Team ID

- Once enrolled, visit <https://developer.apple.com/account>
- Find the **10-character Team ID** at the top of the Membership section (looks like `A1B2C3D4E5`)
- You'll paste this into both `eas.json` files

### 1.3 Create the App Store Connect app entries

- Open <https://appstoreconnect.apple.com> → **My Apps** → **+** → **New App**
- Create **two** entries, one per app:

  | Field | Passenger | Rider |
  |---|---|---|
  | Platform | iOS | iOS |
  | Name | OkadaGo Passenger | OkadaGo Rider |
  | Primary language | English | English |
  | Bundle ID | `com.okadago.passenger` | `com.okadago.rider` |
  | SKU | `okadago-passenger` | `okadago-rider` |

- After creation, look at the URL of each app's page in App Store Connect. It looks like:
  ```
  https://appstoreconnect.apple.com/apps/1234567890/distribution
                                          ^^^^^^^^^^
                                          numeric app ID
  ```
- Note each numeric ID — this is your `ascAppIdentifier`.

### 1.4 Generate an App Store Connect API key (recommended over Apple ID password)

EAS can authenticate to App Store Connect using either your Apple ID + app-specific password, or an **API key** (cleaner, doesn't require 2FA prompts at submit time).

To create a key:

1. <https://appstoreconnect.apple.com> → **Users and Access** → **Keys** → **App Store Connect API** → **Generate API Key**
2. Name: `EAS Submit` (or anything)
3. Access: **App Manager** (minimum required for upload)
4. Download the `.p8` file — **you cannot download it again**, store it somewhere safe
5. Note the **Key ID** (10 chars, e.g. `ABC123DEFG`) and **Issuer ID** (UUID, at the top of the Keys page)

If you skip this step, EAS will fall back to Apple ID auth and prompt you for credentials on every submit.

---

## 2. Google Maps API key for iOS

The apps use `react-native-maps` with Google as the tile provider. Android and iOS need **separate API keys** restricted to the matching bundle ID.

1. Go to <https://console.cloud.google.com/google/maps-apis/credentials>
2. Enable **Maps SDK for iOS** (and **Maps SDK for Android** if not done already)
3. **Create credentials → API key**, twice — one for iOS, one for Android
4. For the **iOS key**, click it and add an **iOS apps** application restriction with bundle ID `com.okadago.passenger` (or `com.okadago.rider`)
5. API restrictions: enable only **Maps SDK for iOS** (no other APIs)
6. Copy the key value — you'll set it as an EAS Secret in step 3

> **Common pitfall:** a gray map on iOS almost always means the key's bundle-ID restriction doesn't match what the app actually reports. Double-check this if the first install shows a blank map.

---

## 3. EAS Secrets (one-time per project)

`EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY` must be set as an **EAS Secret** in both `preview` and `production` environments, for each app.

```bash
# Install the EAS CLI globally if you don't have it
npm install -g eas-cli

# Log in (browser-based auth)
eas login

# --- Passenger app ---
cd frontend/passenger-app
eas env:create --name EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY --environment preview --visibility secret
eas env:create --name EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY --environment production --visibility secret
# Paste the iOS-restricted Google Maps key at each prompt
# Confirm with: eas env:list

# --- Rider app ---
cd ../rider-app
eas env:create --name EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY --environment preview --visibility secret
eas env:create --name EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY --environment production --visibility secret
```

The `eas.json` `env` block in each app already declares this variable with a placeholder. EAS Secrets **override** `eas.json` values, so the placeholder is just a fallback that ensures builds don't fail if you forget the secret.

Other env vars (`EXPO_PUBLIC_API_BASE_URL`, `EXPO_USE_UPDATES`) are baked into `eas.json` directly and don't need to be secrets.

---

## 4. Update `eas.json` with your Apple identifiers

Both `eas.json` files have placeholder values in `submit.production.ios` that you must fill in:

- `appleTeamId` — your 10-character Apple Team ID from step 1.2
- `ascAppIdentifier` — the numeric App Store Connect app ID from step 1.3

In `frontend/passenger-app/eas.json` and `frontend/rider-app/eas.json`, replace:

```json
"appleTeamId": "FILL_FROM_APPLE_DEVELOPER_PORTAL",
"ascAppIdentifier": "FILL_FROM_APP_STORE_CONNECT_URL",
```

with real values. Example after filling in:

```json
"appleTeamId": "A1B2C3D4E5",
"ascAppIdentifier": "1234567890",
```

If you created an App Store Connect API key (step 1.4), also add:

```json
"ascApiKeyPath": "./asc-key.p8",
"ascApiKeyId": "ABC123DEFG",
"ascApiKeyIssuerId": "00000000-0000-0000-0000-000000000000"
```

…and drop the `.p8` file at the path you specified (don't commit it; the existing `.gitignore` already excludes `*.p8` patterns — add `asc-key.p8` to `.gitignore` if you use this path).

---

## 5. Build & submit (per app)

### 5.1 First build

```bash
cd frontend/passenger-app   # or frontend/rider-app
pnpm install
eas build --platform ios --profile preview
```

- First build takes **15–25 minutes** (EAS runs `expo prebuild`, `pod install`, `xcodebuild` on a Mac runner)
- Subsequent builds are faster (~5–10 min) because the native build cache is warm
- Watch progress at <https://expo.dev/accounts/<your-account>/projects/okadago-passenger/builds>
- The output is a `.ipa` file — EAS stores it for you; no need to download

### 5.2 Submit to App Store Connect

```bash
eas submit --platform ios --latest
```

- If you set up the API key (step 1.4 + 4), this is non-interactive
- If you didn't, it will prompt for your Apple ID and an **app-specific password** (generate one at <https://appleid.apple.com> → App-Specific Passwords — requires 2FA enabled)
- Within ~5 min the build shows up in App Store Connect → your app → **TestFlight** tab

### 5.3 Share with TestFlight testers

1. App Store Connect → your app → **TestFlight** tab
2. Add an **Internal Testing** group (only Team members, no review needed) or **External Testing** (up to 10,000 testers, requires a brief Apple review)
3. The build is **eligible to install** within a few minutes of the upload
4. Internal testers get an email invite, install the **TestFlight** app from the App Store, accept the invite, and install the build

---

## 6. On-device sanity checks

After installing the build on a real iPhone via TestFlight, walk through this list:

- [ ] **Cold start** — splash screen appears, then the home map
- [ ] **Maps render with Google tiles** (not a gray box — this is the key-restriction check)
- [ ] **Location permission prompt** appears with the user-friendly usage string from `app.json` → `ios.infoPlist.NSLocationWhenInUseUsageDescription`
- [ ] **(Rider only)** Location escalates to "Always Allow" and tracking continues for 30+ seconds with the app backgrounded
- [ ] **Login** — auth flow reaches `https://okadago-backend.onrender.com/v1/...` and succeeds
- [ ] **Book a ride / accept a request** — full end-to-end works
- [ ] **(Optional) OTA update test** — `pnpm eas:update:preview` from your dev machine, kill the app, reopen — should fetch the new bundle

If anything fails, the most common causes (in order):

1. Google Maps key bundle-ID restriction mismatch
2. EAS Secret not set for the right environment (e.g. set for `production` but built with `preview`)
3. App Store Connect app entry not created or has the wrong bundle ID
4. Privacy nutrition labels not filled in (only blocks external testers, not internal)

---

## 7. Going to the App Store (later)

TestFlight is the right place to start, but eventually you'll want to ship:

- **App privacy nutrition labels** — required before external TestFlight testers, definitely required for App Store review. ~15 min per app.
- **App Store screenshots** — required for review. Sizes for iPhone 6.7" and 6.1" minimum (and iPad if you ship `supportsTablet: true`, which both OkadaGo apps do).
- **App description, keywords, support URL, marketing URL** — App Store Connect → your app → App Information
- **Age rating questionnaire** — App Store Connect → your app → Age Rating
- **App Review submission** — once everything above is filled in, the "Submit for Review" button in App Store Connect activates. Review typically takes 24–48 hours.
- **Privacy policy URL** — Apple requires this. Host a simple page (e.g. on `okadago.com/privacy`) and add the URL to App Store Connect.

EAS can submit directly to App Store review too — just change `distributionType` from `internal` to `store` in `submit.production.ios` and rerun `eas submit --platform ios --latest`.

---

## 8. After a code change

Routine workflows once the initial setup is done:

```bash
# Code change → new build → new TestFlight release
eas build --platform ios --profile preview
eas submit --platform ios --latest

# JS / assets only → OTA update (no native rebuild)
pnpm eas:update:preview        # to preview channel
pnpm eas:update:production     # to production channel (live users)
```

OTA updates apply only to installs of the same `runtimeVersion`. The current `runtimeVersion.policy: "appVersion"` ties runtime to `version` in `app.json`. Bump `version` (e.g. `1.0.0` → `1.0.1`) when you ship native changes; a `pnpm eas:update:production` will only reach users on the matching app version.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Build fails: "no provisioning profile for com.okadago.passenger" | App Store Connect app entry not created | Complete step 1.3 |
| Build fails: "No valid code signing identities" | Apple account not connected to EAS, or expired certs | `eas credentials` → follow prompts to set up distribution certs |
| App installs but map is gray | Google Maps key restricted to wrong bundle ID | Re-check Google Cloud Console key restrictions (step 2) |
| iOS location prompt doesn't appear | `expo-location` not in plugins, or Info.plist strings missing | Already configured; check `app.json` → `expo.ios.infoPlist` is present |
| "Red screen" on launch (Fabric / TurboModule error) | New Architecture + an outdated lib | `npx expo install --fix` to realign package versions; see [risks in the iOS config plan](#) |
| Submit fails: "Authentication credentials are missing or invalid" | API key path/ID/Issuer wrong, or `.p8` not at the path | Re-check step 1.4 and 4 |

For deeper issues, the EAS Build logs (downloadable as `.txt` from the EAS dashboard) almost always point to the exact line.

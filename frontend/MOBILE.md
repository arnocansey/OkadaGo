# OkadaGo Mobile Apps

Passenger and rider apps live under `frontend/passenger-app` and `frontend/rider-app`. Both use Expo EAS for production APK/AAB builds and `react-native-maps` with `PROVIDER_GOOGLE`.

## Blank / white Google Maps on production APK

The most common causes:

1. **Missing API key at EAS build time** — placeholder values in `eas.json` override EAS secrets and produce an empty `com.google.android.geo.API_KEY` in `AndroidManifest.xml`.
2. **Maps SDK for Android not enabled** — the mobile Maps key is separate from the backend Places server key.
3. **Release SHA-1 not registered** — production APKs are signed with the EAS keystore, not your local debug keystore.

Build logs should **not** show map keys loaded only from `eas.json` placeholders. Prefer EAS secrets or a real `.env` uploaded via `.easignore`.

## Google Maps API keys

| Variable | Used for |
| --- | --- |
| `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY` | Android map tiles (`react-native-maps`) |
| `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY` | iOS map tiles |
| `GOOGLE_PLACES_API_KEY` (backend only) | Address search / Places bootstrap |

Do **not** reuse the backend Places server key for mobile Maps unless it is also configured for Maps SDK for Android/iOS.

### Google Cloud Console setup (Android)

1. Create or select an **Android-restricted** API key.
2. Enable **Maps SDK for Android** on that key.
3. Add application restriction: Android apps.
4. Package names:
   - Passenger: `com.okadago.passenger`
   - Rider: `com.okadago.rider`
5. Add the **EAS release SHA-1** fingerprint (see below). Debug SHA-1 alone is not enough for store/APK builds from EAS.

## EAS secrets (recommended for CI / production-apk)

Run from each app directory (`frontend/passenger-app` or `frontend/rider-app`):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY --value YOUR_ANDROID_MAPS_KEY --type string
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY --value YOUR_IOS_MAPS_KEY --type string
```

Set environment to **production** in the Expo dashboard (or use `eas env:create` on newer CLI versions).

Verify before building:

```bash
eas env:list --environment production
```

Expected build log line:

```text
Environment variables loaded from EAS: EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY, ...
```

If you see `No environment variables ... found for the "production" environment`, secrets are missing.

### Local `.env` alternative

Copy `.env.example` to `.env` with real keys. Each app’s `.easignore` intentionally allows `.env` to upload during `eas build`. Do not commit `.env`.

## Get EAS release SHA-1 fingerprint

Production APKs use Expo’s remote Android keystore. Fetch SHA-1 from EAS credentials:

```bash
cd frontend/passenger-app   # or frontend/rider-app
eas credentials -p android
```

Choose **Keystore: Manage everything needed to build your project** → view keystore → copy **SHA-1** (and SHA-256 if prompted).

Or in Expo dashboard: Project → Credentials → Android → Application identifiers → Keystore → SHA-1.

Add that SHA-1 to the Android Maps API key restriction in Google Cloud Console, then rebuild:

```bash
pnpm eas:build:android
```

## How keys reach AndroidManifest

`app.config.js` reads `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY` at **build time** and Expo injects it as:

```xml
<meta-data android:name="com.google.android.geo.API_KEY" android:value="..." />
```

If the key is empty or a placeholder, maps render white. `AppMap` now shows a fallback message instead of a blank panel.

## Build profiles

| Profile | Output | Notes |
| --- | --- | --- |
| `production-apk` | APK | Side-load / internal testing |
| `production` | AAB | Play Store |

Both inherit the **production** EAS environment for secrets. Map keys are **not** hard-coded in `eas.json`.

## Typecheck

```bash
cd frontend/passenger-app && pnpm typecheck
cd frontend/rider-app && pnpm typecheck
```

## Rebuild checklist after fixing keys

- [ ] EAS production secrets set for both map key env vars
- [ ] Maps SDK for Android enabled on the Android key
- [ ] EAS release SHA-1 added to Google Cloud Console for each app package
- [ ] Billing enabled on the Google Cloud project
- [ ] New `production-apk` build installed (old APK still has the old manifest key)

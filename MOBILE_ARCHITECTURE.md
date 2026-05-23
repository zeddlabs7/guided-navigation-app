# Mobile Architecture — Arriveo React Native App

## Overview

The Arriveo mobile app is built with **Expo (SDK 54)** and **expo-router** for file-based navigation. It lives at `apps/mobile/` within the existing pnpm monorepo and covers the **recipient flow** only (create, manage, publish, and share delivery guidance).

**Current platform: iOS only.** Android will be added later with `google-services.json`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native via Expo (development build, not Expo Go) |
| Navigation | expo-router (file-based, typed routes) |
| Firebase | `@react-native-firebase/*` (native iOS SDK) |
| Auth | Native phone auth via `@react-native-firebase/auth` (SMS OTP, no reCAPTCHA) |
| Database | `@react-native-firebase/firestore` |
| State | React hooks + context (no external state library) |
| Types | `@guidenav/types` (shared workspace package) |
| Validation | `@guidenav/core` (shared workspace package) |
| Image Handling | expo-image-picker, expo-image-manipulator (planned) |
| Sharing | React Native Share API, expo-clipboard (planned) |

## Running the App

Since the app uses native Firebase modules (`@react-native-firebase/*`), it **cannot run in Expo Go**. You need a development build:

```bash
# First time: generate native iOS project
cd apps/mobile
npx expo prebuild --platform ios

# Run on iOS simulator or device
npx expo run:ios

# Or from monorepo root
pnpm run dev:mobile:ios
```

## Directory Structure

```
apps/mobile/
├── app/                          # expo-router file-based routes
│   ├── _layout.tsx               # Root layout (Stack + AuthProvider)
│   ├── index.tsx                 # Entry redirect (auth check)
│   ├── +not-found.tsx            # 404 screen
│   ├── settings.tsx              # Settings screen
│   ├── (auth)/                   # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/                   # Tab group (authenticated)
│   │   ├── _layout.tsx
│   │   └── dashboard.tsx
│   └── guidance/                 # Guidance management stack
│       ├── _layout.tsx
│       ├── create.tsx
│       └── [id]/
│           ├── _layout.tsx
│           ├── edit.tsx
│           ├── preview.tsx
│           ├── share.tsx
│           └── steps/
│               ├── _layout.tsx
│               └── [stepIndex].tsx
├── constants/                    # Theme, colors, spacing
│   ├── theme.ts
│   └── linkValidity.ts
├── contexts/                     # React contexts
│   └── AuthContext.tsx
├── services/                     # Firebase service layer
│   ├── firebase/config.ts        # Firestore instance
│   ├── auth/index.ts             # Phone auth (native SMS OTP)
│   └── users/index.ts            # User document management
├── hooks/                        # React hooks
├── assets/                       # Icons, splash, images
├── GoogleService-Info.plist      # Firebase iOS config (from Firebase Console)
├── app.config.ts                 # Expo configuration
├── metro.config.js               # Metro bundler config (monorepo)
├── babel.config.js               # Babel preset
├── tsconfig.json                 # TypeScript config
└── package.json
```

## Authentication

The mobile app uses **native Firebase Phone Auth with SMS OTP**. No reCAPTCHA, no WebView, no modals.

### How it works

1. User enters phone number (E.164 format, e.g. `+966XXXXXXXXX`)
2. App calls `auth().signInWithPhoneNumber(phoneNumber)` (native Firebase SDK)
3. Firebase sends SMS natively — shows app name in the message, not a website URL
4. User enters 6-digit code
5. App calls `confirmation.confirm(code)` to complete sign-in
6. `AuthContext` listens to `onAuthStateChanged` and routes accordingly

### Why native Firebase instead of JS SDK

- **No reCAPTCHA needed** — native SDK handles app verification via APNs (iOS) / SafetyNet (Android)
- **Proper SMS branding** — SMS shows your app name, not a web domain
- **Better UX** — no WebView modals, no loading spinners, no captcha icons
- **Requires development build** — cannot run in Expo Go (this is the trade-off)

## Navigation Architecture

```
Root Stack (app/_layout.tsx)
├── (auth) group — unauthenticated screens
│   └── login
├── (tabs) group — main authenticated experience
│   └── dashboard (tab: "Home")
├── guidance stack — guidance CRUD
│   ├── create — multi-step wizard
│   └── [id] — specific guidance
│       ├── edit — manage steps
│       ├── preview — read-only preview + publish
│       ├── share — link generation + sharing
│       └── steps/[stepIndex] — step builder
├── settings — app settings
└── +not-found — 404
```

## Shared Package Consumption

The mobile app imports from two workspace packages:

- **`@guidenav/types`** — All domain types (`GuidanceSet`, `GuidanceStep`, `ShareLink`, etc.), enums, constants (`MAX_STEPS_PER_GUIDANCE`, `IMAGE_CONSTRAINTS`), and label maps.
- **`@guidenav/core`** — Pure validation functions (`validateGuidanceTitle`, `validateImageFile`, `validateStepOrder`, etc.) and utilities (`generateId`, overlay normalization, Maps URL generation).

Both packages are pure TypeScript with no browser or framework dependencies. The Metro bundler is configured via `metro.config.js` to resolve these from the monorepo root.

## Firebase Config Files

| Platform | File | Location |
|----------|------|----------|
| iOS | `GoogleService-Info.plist` | `apps/mobile/GoogleService-Info.plist` |
| Android | `google-services.json` | Not yet added (Android support coming later) |

These files are downloaded from Firebase Console → Project Settings → Your apps. They are referenced in `app.config.ts` via the `ios.googleServicesFile` and `android.googleServicesFile` fields.

## Key Differences from PWA

1. **Native Firebase SDK** — `@react-native-firebase/*` instead of Firebase JS SDK
2. **No reCAPTCHA** — Native phone auth handles verification via APNs/SafetyNet
3. **Development build required** — Cannot use Expo Go
4. **No overlay canvas editor** — Simplified overlay placement for mobile
5. **Native sharing** — OS share sheet + clipboard copy
6. **Link validity picker** — Duration options with premium tier indicators
7. **Camera integration** — Native camera/gallery with permission handling
8. **Deep linking** — `arriveo://` scheme; courier links open in browser

## Assumptions

- **iOS first**, Android later
- English only at launch (Arabic/RTL deferred)
- No push notifications in initial version
- No offline-first architecture (Firestore persistence helps passively)
- Same Firebase project as web apps (shared Firestore, Auth, Storage)
- Courier links (`/g/{token}`) always open in device browser, not in-app

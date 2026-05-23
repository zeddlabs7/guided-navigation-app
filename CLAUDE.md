# CLAUDE.md — Arriveo Project Guide

This file provides context for AI assistants working on the Arriveo codebase.

## Project Overview

Arriveo is a delivery guidance system that helps recipients guide couriers to their exact location using step-by-step photo-based instructions. The project is a **pnpm monorepo** with multiple Vue web apps and a React Native mobile app sharing the same Firebase backend.

## Repository Structure

```
apps/
  recipient-app/     # Vue 3 PWA — recipient creates guidance (the original app)
  courier-app/       # Vue 3 web — courier follows guidance via token link
  admin-portal/      # Vue 3 admin dashboard
  landing-page/      # Vue 3 marketing site
  mobile/            # Expo React Native — recipient app for iOS/Android

packages/
  types/             # Shared TypeScript types, constants, enums (framework-agnostic)
  core/              # Pure validation and utility functions (framework-agnostic)
  services/          # Firebase SDK wrappers for web apps (uses firebase/* JS SDK)
  i18n/              # Vue i18n setup (Vue-specific, not used by mobile)
  ui/                # Shared Vue components (Vue-specific, not used by mobile)

firebase/
  functions/         # Cloud Functions (Node 20, onCall + onRequest)
  firebase.json      # Hosting, Firestore, Storage, Functions config
  firestore.rules    # Security rules
  storage.rules      # Storage rules
```

## Key Conventions

- **Package manager:** pnpm with workspaces (`pnpm-workspace.yaml`)
- **Node version:** 20 (see `.nvmrc`)
- **Internal packages:** scoped as `@guidenav/*` (e.g. `@guidenav/types`)
- **Workspace protocol:** dependencies use `workspace:*`
- **No Lerna/Nx/Turbo:** simple pnpm filters for orchestration

## Firebase Configuration

- Config lives in `firebase/` (not repo root). Deploy commands `cd firebase` first.
- Four hosting targets: recipient, courier, admin, landing
- Firestore collections: `users`, `guidanceSets`, `guidanceSteps`, `shareLinks`, `feedbackEvents`, `analyticsEvents`, `whatsappOtpCodes`, `whatsappVerifySessions`, `whatsappVerifyTokens`
- Auth providers: Phone (SMS OTP), custom tokens (WhatsApp flows)

## Package Boundaries

- `packages/types` and `packages/core` are **pure TypeScript** with zero browser/framework dependencies. Safe for consumption by both Vue web apps and React Native.
- `packages/services` depends on the Firebase JS SDK and uses browser APIs (`crypto.subtle`, `new Image()`, `URL.createObjectURL`). It is **not** compatible with React Native.
- `packages/ui` and `packages/i18n` are Vue-specific.
- The mobile app (`apps/mobile`) will have its own service layer using `@react-native-firebase/*`.

## Mobile App (apps/mobile)

- **Framework:** Expo (SDK 54) with expo-router for file-based routing
- **Platform:** iOS first (development build, not Expo Go). Android later.
- **Scope:** Recipient flow only (create/manage/publish/share guidance)
- **Firebase:** `@react-native-firebase/*` native modules (not Firebase JS SDK)
- **Auth:** Native SMS OTP via `@react-native-firebase/auth` (no reCAPTCHA, no WebView)
- **Config:** `GoogleService-Info.plist` for iOS (from Firebase Console)
- **Language:** English only at launch
- **Courier links** open in the device browser, not in the native app
- See `MOBILE_ARCHITECTURE.md` for detailed architecture

## Important Patterns

- Guidance sets have a lifecycle: DRAFT → PUBLISHED → DISABLED
- Share links use SHA-256 token hashing; the plain token is returned once and never stored
- Steps are ordered by `stepIndex`; first should be `LOCATION_CHECK`, last `DROP_OFF_POINT`
- The courier app loads guidance via the `loadGuidanceByToken` Cloud Function (not direct Firestore)
- Share link creation in the web app uses direct Firestore writes (not the Cloud Function)

## What NOT to Change

- Do not modify `apps/courier-app` — it is stable and not part of the mobile migration
- Do not modify `packages/services` to accommodate React Native — create a separate service layer
- Do not add Vue-specific code to `packages/types` or `packages/core`
- Do not change Firestore security rules unless a new collection is needed

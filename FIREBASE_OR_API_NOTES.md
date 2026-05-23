# Firebase & API Notes — Arriveo

## Firebase Project

All apps (web + mobile) share a single Firebase project: `guided-navigation-app`.

Firebase config lives in `firebase/` (not repo root). Deploy with `cd firebase && firebase deploy`.

## Firestore Collections

### `users`
- **Doc ID:** Firebase Auth UID
- **Fields:** `email`, `phoneNumber`, `languagePreference`, `isActive`, `createdAt`, `updatedAt`
- **Created by:** `getOrCreateUser()` after successful auth sign-in
- **Rules:** Read by anyone, write only by owner (`auth.uid == userId`)

### `guidanceSets`
- **Fields:** `recipientUserId`, `title`, `description`, `status` (DRAFT/PUBLISHED/DISABLED), `languageOriginal`, `supportedLanguages`, `availabilityMode`, `availabilityStartTs`, `availabilityEndTs`, `timezone`, `destinationCoordinates`, `addressType`, building metadata fields, `currentVersion`, `publishedAt`, `deletedAt`, timestamps
- **Soft delete:** `deletedAt` field, queries filter `deletedAt == null`
- **Rules:** Single-doc read by anyone, list only by owner, write only by owner

### `guidanceSteps`
- **Fields:** `guidanceSetId`, `stepIndex`, `stepType`, `contentType`, `title`, `instructionOriginal`, `instructionTranslations`, `image` (StepImage), `overlays`, `locationData`, `isRequired`, `deletedAt`, timestamps
- **Ordered by:** `stepIndex` (0-based)
- **Step types:** LOCATION_CHECK, LANDMARK_REFERENCE, PARKING_LOCATION, BUILDING_ENTRY, RECEPTION_OR_SECURITY, LOBBY_NAVIGATION, ELEVATOR_ENTRY, STAIRS_ENTRY, FLOOR_NUMBER, CORRIDOR_OR_PATH, DOOR_IDENTIFICATION, DROP_OFF_POINT, GATE_ENTRY, UNIT_OR_DOOR_IDENTIFICATION, FLOOR_NAVIGATION, OTHER
- **Rules:** Read by anyone, write by any authenticated user

### `shareLinks`
- **Fields:** `guidanceSetId`, `tokenHash` (SHA-256), `status` (ACTIVE/REVOKED/EXPIRED), `expiresAt`, `expiryDurationMinutes`, `revokedAt`, `accessCount`, `lastAccessedAt`, timestamps
- **Token handling:** Plain token returned once at creation, only the SHA-256 hash is stored
- **Default expiry:** 1440 minutes (24 hours), configurable via `expiryDurationMinutes`
- **Rules:** Read by anyone, update by anyone (for access counting), create/delete by authenticated

### `feedbackEvents`
- **Fields:** `guidanceSetId`, `guidanceStepId`, `shareLinkId`, `eventType`, `reasonCode`, `metadata`, `createdAt`
- **Rules:** Create by anyone, read by authenticated

### `analyticsEvents`
- **Fields:** `app` (RECIPIENT/COURIER), `eventType`, linkage IDs, `metadata`, `createdAt`
- **Rules:** Create by anyone, read by authenticated

### `whatsappOtpCodes`, `whatsappVerifySessions`, `whatsappVerifyTokens`
- Internal collections for WhatsApp auth flows
- No client access (Cloud Functions / Admin SDK only)

## Cloud Functions

All callable unless noted:

| Function | Auth Required | Purpose |
|----------|--------------|---------|
| `createShareLink` | Yes | Generate share link (server-side, with ownership check) |
| `validateShareLink` | No | Validate token, check expiry/revoked |
| `loadGuidanceByToken` | No | Load full guidance payload for courier view |
| `revokeShareLink` | Yes | Revoke a share link |
| `logAnalyticsEvent` | No | Log analytics event |
| `submitFeedback` | No | Submit courier feedback |
| `sendWhatsAppOTP` | No | Send OTP via WhatsApp |
| `verifyWhatsAppOTP` | No | Verify OTP, return custom token |
| `createVerificationSession` | No | Start WhatsApp verify flow |
| `whatsappVerifyWebhook` | No | HTTP webhook for Meta WhatsApp (onRequest) |
| `getVerificationStatus` | No | Poll verification status |
| `retryVerificationSession` | No | Retry expired verification |

## API Patterns (Web vs Mobile)

### What the web recipient app does directly in Firestore:
- `createShareLink` — generates token client-side, writes to `shareLinks`
- `revokeShareLink` — updates doc status
- `createGuidanceSet`, `updateGuidanceSet`, `createGuidanceStep`, `updateGuidanceStep` — direct Firestore writes
- `uploadStepImage` — direct Storage upload with `uploadBytes`
- Analytics and feedback — direct `addDoc`

### What uses Cloud Functions:
- `loadGuidanceByToken` — courier app calls this callable
- WhatsApp OTP/verification flows — all callable functions (web app only)

### Mobile app approach (iOS first, Android later):
The mobile app uses **`@react-native-firebase/*` native modules** (not the Firebase JS SDK). This requires a development build (cannot run in Expo Go) but provides:

- **Native phone auth** — `auth().signInWithPhoneNumber()`, no reCAPTCHA, SMS shows app name
- **Native Firestore** — `@react-native-firebase/firestore`, same data access patterns as web
- **Native Storage** — `@react-native-firebase/storage` with `putFile` for image uploads (planned)

Firebase config comes from `GoogleService-Info.plist` (iOS) placed at `apps/mobile/GoogleService-Info.plist`. Android's `google-services.json` will be added when Android support is implemented.

The web app's WhatsApp OTP flow is **not used** in the mobile app. The mobile app uses Firebase's native SMS OTP only.

## Storage Structure

```
guidanceSets/
  {guidanceSetId}/
    steps/
      {stepId}/
        main.{extension}    # Step photo (JPEG, PNG, WebP)
```

- **Upload:** `uploadBytes` (web) / `putFile` (RN)
- **Download:** Public URL via `getDownloadURL`
- **Max size:** 5 MB
- **Supported types:** JPEG, PNG, WebP
- **Rules:** Currently open read/write (development)

## Data Model for Link Validity (New)

The existing `ShareLink` type already supports variable expiry via `expiryDurationMinutes`. No schema change is needed. The mobile app will pass different values:

| Option | Minutes | Tier |
|--------|---------|------|
| 1 hour | 60 | free |
| 6 hours | 360 | free |
| 24 hours | 1440 | free |
| 3 days | 4320 | free |
| 7 days | 10080 | premium (future) |
| 30 days | 43200 | premium (future) |

Premium gating is UI-only for now. The optional `linkValidityTier` field will be added to `ShareLink` type for future backend enforcement.

## Known Inconsistencies

1. **Dual share link creation:** Both a Cloud Function (`createShareLink`) and a client Firestore write exist. The web app uses the client version. The mobile app should also use direct Firestore writes for consistency.

2. **`expiresAt` type mismatch:** Types define `expiresAt` as `Timestamp` (string alias), but both Functions and client code write ISO strings. Clients should read as string.

3. **Step ownership:** `guidanceSteps` rules allow any authenticated user to write. Steps are linked to guidance sets via `guidanceSetId` but there's no rule enforcing the creator matches.

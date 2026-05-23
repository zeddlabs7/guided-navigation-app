# App Flows — Arriveo Mobile

This document maps the existing PWA recipient flows to React Native screens.

## Flow 1: Authentication

```
App Launch
  → Check auth state
  → If not authenticated → Login Screen
  → If authenticated → Dashboard

Login Screen
  → Enter phone number
  → Receive SMS OTP (native phone auth, no reCAPTCHA)
  → Enter OTP code
  → On success: getOrCreateUser(uid, phone) → Dashboard
```

**PWA reference:** `apps/recipient-app/src/pages/LoginPage.vue`, `apps/recipient-app/src/composables/useAuth.ts`

**RN screen:** `app/(auth)/login.tsx`

**Key difference:** No reCAPTCHA container. Native phone auth handles verification automatically. This fixes the captcha icon persistence bug from the PWA.

---

## Flow 2: Dashboard

```
Dashboard Screen
  → Real-time list of user's guidance sets (Firestore onSnapshot)
  → Filter by status: All / Draft / Published
  → Search by title
  → Pull-to-refresh
  → Tap "+" → Create Guidance
  → Tap guidance card → Edit Guidance
  → Tap share icon → Share screen
  → Long press → Delete (soft delete)
```

**PWA reference:** `apps/recipient-app/src/pages/DashboardPage.vue`

**RN screen:** `app/(tabs)/dashboard.tsx`

---

## Flow 3: Create Guidance

```
Create Guidance Screen
  → (First time) Show info popup: "Create as many steps as you need"
  → Step 1: Enter title (validated via @guidenav/core)
  → Step 2: Select address type (apartment, villa, compound, office, other)
  → Step 3: Enter metadata fields (dynamic based on address type)
  → Actions:
    → "Save Draft" → createGuidanceSet(DRAFT) → Edit Guidance
    → "Add First Step" → createGuidanceSet(DRAFT) → Step Builder (index 0)
    → "Preview" → createGuidanceSet(DRAFT) → Preview
```

**PWA reference:** `apps/recipient-app/src/pages/CreateGuidancePage.vue`

**RN screen:** `app/guidance/create.tsx`

**New feature:** Info popup on first visit (AsyncStorage flag).

---

## Flow 4: Edit Guidance

```
Edit Guidance Screen
  → Display guidance title and metadata
  → List of steps (ordered by stepIndex)
  → Drag to reorder steps
  → Tap step → Step Builder
  → "Add Step" → Step Builder (new step)
  → "Delete Step" → Confirm → soft delete
  → Navigation to Preview or Share
```

**PWA reference:** `apps/recipient-app/src/pages/EditGuidancePage.vue`

**RN screen:** `app/guidance/[id]/edit.tsx`

---

## Flow 5: Step Builder

```
Step Builder Screen
  → Select step type (from ADDRESS_TYPE_STEP_CONFIG)
  → Enter instructions text
  → Upload photo:
    → Camera or Gallery picker
    → Compress image
    → Upload to Firebase Storage with progress
    → Retry on failure
  → Place overlays on photo (simplified editor):
    → Add arrow overlay (directional)
    → Add marker overlay (numbered)
    → Drag to position, pinch to scale
  → Optional: Set location pin (LOCATION_CHECK type)
  → Save step → back to Edit Guidance
```

**PWA reference:** `apps/recipient-app/src/pages/StepBuilderPage.vue`

**RN screen:** `app/guidance/[id]/steps/[stepIndex].tsx`

**Key difference:** Overlay editor is simplified for mobile touch interaction. No full canvas drawing.

---

## Flow 6: Preview + Publish

```
Preview Screen
  → Read-only view of all steps with images and overlays
  → Scroll through steps sequentially
  → "Publish" button → updateGuidanceSet({ status: 'PUBLISHED' })
  → "Unpublish" → updateGuidanceSet({ status: 'DRAFT' })
  → Navigate to Share
```

**PWA reference:** `apps/recipient-app/src/pages/PreviewPage.vue`

**RN screen:** `app/guidance/[id]/preview.tsx`

---

## Flow 7: Share Link

```
Share Screen
  → If no active link:
    → Select availability mode (anytime, time window, not available)
    → Select link validity duration:
      → 1 hour, 6 hours, 24 hours (free)
      → 3 days (free)
      → 7 days, 30 days (premium indicator, coming soon)
    → "Generate Link" → createShareLink({ guidanceSetId, expiryDurationMinutes })
  → If active link exists:
    → Show link URL
    → "Copy Link" → clipboard
    → "Share via WhatsApp" → open WhatsApp with pre-filled message
    → "Share" → native OS share sheet
    → "Regenerate" → revoke old + create new
    → "Revoke" → revokeShareLink
```

**PWA reference:** `apps/recipient-app/src/pages/ShareLinkPage.vue`

**RN screen:** `app/guidance/[id]/share.tsx`

**New features:**
- Link validity duration picker (replaces hardcoded 24h)
- Premium tier indicators for longer durations
- Native sharing (WhatsApp, OS share sheet, copy link)

---

## Flow 8: Settings

```
Settings Screen
  → Display phone number
  → Language selector (English only at launch)
  → "Sign Out" → Firebase signOut → Login Screen
```

**PWA reference:** `apps/recipient-app/src/pages/SettingsPage.vue`

**RN screen:** `app/settings.tsx`

---

## Deep Linking

| Link | Behavior |
|------|----------|
| `arriveo://dashboard` | Opens Dashboard |
| `arriveo://guidance/{id}` | Opens Edit Guidance |
| `https://arriveo.app/g/{token}` | Opens in device browser (courier web app) |

Courier links are explicitly **not** handled by the native app. They open the courier web experience.

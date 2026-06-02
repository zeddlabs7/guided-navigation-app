# TODO — React Native App Implementation

## Legend
- [ ] Not started
- [~] In progress
- [x] Complete

---

## Phase 0: Scaffold
- [x] Create `apps/mobile` with Expo + expo-router
- [x] Configure Metro for monorepo (`watchFolders`, `nodeModulesPaths`)
- [x] Set up navigation structure (auth, tabs, guidance stack, settings)
- [x] Create placeholder screens for all flows
- [x] Verify `@guidenav/types` and `@guidenav/core` are RN-compatible
- [x] Add `dev:mobile` script to root `package.json`
- [x] Create documentation files

## Phase 1: Authentication
- [ ] Install `@react-native-firebase/app` + `@react-native-firebase/auth`
- [ ] Configure Firebase native apps (GoogleService-Info.plist, google-services.json)
- [ ] Implement phone number input with country code
- [ ] Implement SMS OTP verification (native, no reCAPTCHA)
- [ ] Create `useAuth` hook with auth state management
- [ ] Implement `getOrCreateUser` (Firestore write after auth)
- [ ] Add auth context provider to root layout
- [ ] Wire navigation guards (redirect to login if unauthenticated)
- [ ] Handle auth errors (invalid number, wrong code, rate limiting)

## Phase 2: Dashboard + Guidance CRUD
- [ ] Install `@react-native-firebase/firestore`
- [ ] Create `useGuidanceSets` hook (real-time Firestore listener)
- [ ] Build guidance set card component
- [ ] Implement FlatList with pull-to-refresh
- [ ] Add search bar with client-side filtering
- [ ] Add filter tabs (All / Draft / Published)
- [ ] Implement "New Guidance" FAB
- [ ] Build Create Guidance wizard:
  - [ ] Title input with validation
  - [ ] Address type selector
  - [ ] Dynamic metadata fields based on address type
  - [ ] "Steps info" popup (first-time, AsyncStorage flag)
- [ ] Build Edit Guidance screen:
  - [ ] Step list with thumbnails
  - [ ] Drag-to-reorder (react-native-draggable-flatlist or similar)
  - [ ] Delete step with confirmation
  - [ ] Navigation to step builder, preview, share
- [ ] Implement soft-delete for guidance sets

## Phase 3: Step Builder
- [ ] Install `expo-image-picker`, `expo-image-manipulator`
- [ ] Install `@react-native-firebase/storage`
- [ ] Request camera and gallery permissions
- [ ] Image picker (camera + gallery)
- [x] Image compression before upload
- [ ] Upload with progress indicator
- [ ] Upload error handling + retry
- [ ] Step type dropdown (from ADDRESS_TYPE_STEP_CONFIG)
- [ ] Instructions text input with character count
- [ ] Simplified overlay editor:
  - [ ] Add arrow overlay (tap to place, drag to move)
  - [ ] Add marker overlay
  - [ ] Pinch to scale, rotate gesture
  - [ ] Delete overlay
- [ ] Location picker for LOCATION_CHECK type (if Maps API key available)
- [ ] Save step (create or update)

## Phase 4: Share + Publish
- [ ] Preview screen with step carousel
- [ ] Publish / unpublish toggle
- [ ] Share link generation:
  - [ ] SHA-256 token hashing (via expo-crypto or similar)
  - [ ] Firestore share link creation
- [ ] Link validity duration picker:
  - [ ] Free options: 1h, 6h, 24h, 3d
  - [ ] Premium options: 7d, 30d (locked, "Coming soon" toast)
- [ ] Availability mode selector (anytime, time window, not available)
- [ ] Copy link to clipboard (expo-clipboard)
- [ ] Share via WhatsApp (Linking.openURL)
- [ ] Native OS share sheet (Share API)
- [ ] Revoke existing link
- [ ] Regenerate link

## Phase 5: Polish
- [ ] Deep link configuration (arriveo:// scheme)
- [ ] Courier links open in browser (not in-app)
- [ ] Settings screen with real auth data
- [ ] Sign out functionality
- [ ] Error boundary component
- [ ] Loading skeletons
- [ ] Empty state illustrations
- [ ] App icon and splash screen (branded)
- [ ] EAS Build setup (eas.json)
- [ ] iOS TestFlight distribution
- [ ] Android internal testing

## Known Issues
- [x] Dashboard image flickering (iOS only): When switching filter tabs (e.g. All → Draft → All), thumbnail images briefly go blank and take 3-4 seconds to re-render. Root cause: React Native's Image component loses its GPU texture on unmount on iOS; even with `cache: 'force-cache'` and ScrollView (no FlatList), the images re-decode from disk cache. Android (Fresco) does not exhibit this issue. Fix: use `expo-image` (which uses SDWebImage on iOS / Glide on Android with persistent memory caching).
- [x] Step Builder: Photo upload is slow (5-10+ seconds). Fixed: images are now compressed to max 1280px width and 70% JPEG quality via `expo-image-manipulator` before upload. Also migrated all remote image rendering from React Native `Image` to `expo-image` for persistent memory+disk caching and faster rendering.

## Future Enhancements (Out of Scope)
- [ ] Arabic language + RTL layout
- [ ] Push notifications (delivery updates)
- [ ] Premium subscription (link validity billing)
- [ ] Offline-first with Firestore persistence
- [ ] Courier flow in native app
- [ ] Biometric auth (Face ID / fingerprint)
- [ ] Analytics dashboard in-app

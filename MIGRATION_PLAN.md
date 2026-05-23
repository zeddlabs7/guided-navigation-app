# Migration Plan — PWA to React Native

## Strategy

The Arriveo React Native app is **not** a line-by-line port of the Vue PWA. It is a fresh native implementation that uses the PWA as a **functional reference**. The backend (Firebase, Firestore, Cloud Functions) remains unchanged.

## Phases

### Phase 0: Scaffold (Current)
- [x] Create Expo app structure in `apps/mobile`
- [x] Set up expo-router navigation matching PWA routes
- [x] Create placeholder screens for all flows
- [x] Verify `packages/types` and `packages/core` work in RN
- [x] Add documentation files

### Phase 1: Authentication
- [ ] Install `@react-native-firebase/app` and `@react-native-firebase/auth`
- [ ] Implement SMS OTP phone sign-in (native, no reCAPTCHA)
- [ ] Implement `getOrCreateUser` pattern in Firestore
- [ ] Add auth state management (context + hooks)
- [ ] Wire login screen to real auth
- [ ] Add auth guards to navigation (redirect unauthenticated users)

### Phase 2: Dashboard + Guidance CRUD
- [ ] Real-time guidance set list with Firestore `onSnapshot`
- [ ] Pull-to-refresh and search/filter
- [ ] Create guidance wizard (title → address type → metadata)
- [ ] Edit guidance screen with step list
- [ ] Step reordering and deletion
- [ ] Soft-delete guidance sets

### Phase 3: Step Builder
- [ ] Camera and gallery image picker with permissions
- [ ] Image compression before upload
- [ ] Upload to Firebase Storage with progress indicator
- [ ] Error handling and retry for uploads
- [ ] Step type selector and instruction input
- [ ] Simplified overlay editor (arrow/marker placement)
- [ ] Optional location picker (if Google Maps API key available)

### Phase 4: Preview + Publish + Share
- [ ] Read-only guidance preview
- [ ] Publish action (set status to PUBLISHED)
- [ ] Share link generation with validity duration picker
- [ ] Free vs premium tier indicators (UI only, no billing)
- [ ] Copy link to clipboard
- [ ] Share via WhatsApp deep link
- [ ] Native OS share sheet
- [ ] Availability mode selection (anytime, time window, not available)

### Phase 5: Polish + Production
- [ ] Deep link configuration (`arriveo://` scheme)
- [ ] Courier links open in device browser
- [ ] "Steps info" popup before first guidance creation
- [ ] Settings screen with real data
- [ ] Error boundary and global error handling
- [ ] Loading skeletons and empty states
- [ ] App icon and splash screen
- [ ] EAS Build configuration for iOS and Android
- [ ] TestFlight / internal testing distribution

### Future (Not in Scope)
- Arabic language + RTL support
- Push notifications
- Premium subscription billing
- Offline-first mode
- Courier flow in native app

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking existing web apps | Mobile app is in a separate `apps/mobile` directory; no changes to `packages/services`, `packages/ui`, or any existing app |
| Firebase SDK incompatibility | Separate service layer for RN using `@react-native-firebase/*` |
| Monorepo Metro resolution | `metro.config.js` configured with `watchFolders` and `nodeModulesPaths` pointing to monorepo root |
| Shared package browser deps | Audited: `packages/types` and `packages/core` are pure TS, no browser APIs |
| Large scope creep | Phased approach with clear boundaries; each phase is independently shippable |

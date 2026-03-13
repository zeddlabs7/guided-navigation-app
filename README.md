# Delivery Guidance System

A delivery guidance system that helps couriers reach exact drop-off points using visual step-by-step instructions created by recipients.

## Project Structure

```
├── apps/
│   ├── recipient-app/     # Mobile-first PWA for recipients
│   └── courier-app/       # Web app for couriers (accessed via share link)
├── packages/
│   ├── types/             # Shared TypeScript types
│   ├── core/              # Shared business logic
│   ├── services/          # Firebase service wrappers
│   ├── ui/                # Shared UI components
│   └── i18n/              # Internationalization (EN/AR)
└── firebase/
    ├── functions/         # Cloud Functions
    ├── firestore.rules    # Firestore security rules
    ├── storage.rules      # Storage security rules
    └── firestore.indexes.json
```

## Prerequisites

- Node.js >= 18
- pnpm >= 8

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Copy the example environment file and fill in your Firebase credentials:

```bash
cp .env.example .env
```

Required variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 3. Run development servers

Run both apps simultaneously:

```bash
pnpm dev
```

Or run individually:

```bash
# Recipient App (port 3000)
pnpm dev:recipient

# Courier App (port 3001)
pnpm dev:courier
```

### 4. Build for production

```bash
pnpm build
```

## Firebase Setup

### Local Development with Emulators

```bash
cd firebase
firebase emulators:start
```

### Deploy Firebase

```bash
cd firebase
firebase deploy
```

## Tech Stack

- **Frontend**: Vue 3, TypeScript, Vite
- **State**: Pinia
- **Routing**: Vue Router
- **i18n**: vue-i18n (English & Arabic)
- **Backend**: Firebase (Firestore, Storage, Functions, Auth)
- **Hosting**: Netlify (frontend), Firebase (backend)

## Apps

### Recipient App
- Mobile-first PWA
- Create delivery guidance with photos
- Add overlays (arrows, markers)
- Set availability
- Generate share links

### Courier App
- Access via tokenized share link
- Step-by-step guidance playback
- Submit feedback
- Open location in maps

## License

Private - All rights reserved

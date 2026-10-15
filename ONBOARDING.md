# Yadul — Developer Onboarding (Windows)

Welcome to the Yadul project! This guide will walk you through everything you need to install, configure, and run on your Windows laptop. Follow each section in order.

Your primary work will be on the **Vue 3 web apps** (courier app, admin portal, landing page). The mobile app (React Native / Expo) section is optional — only set that up if Zohaib asks you to work on it.

---

## Table of Contents

**Required Setup (Web Apps)**

1. [Install Git](#1-install-git)
2. [Install Node.js (v20)](#2-install-nodejs-v20)
3. [Install pnpm](#3-install-pnpm)
4. [Install Cursor (Code Editor)](#4-install-cursor-code-editor)
5. [Install Firebase CLI](#5-install-firebase-cli)
6. [Clone the Repository](#6-clone-the-repository)
7. [Project Structure Overview](#7-project-structure-overview)
8. [Environment Variables (Web Apps)](#8-environment-variables-web-apps)
9. [Running the Web Apps](#9-running-the-web-apps)
10. [Common Issues & Tips](#10-common-issues--tips)

**Optional Setup (Mobile App — only if needed)**

11. [Install Java JDK 17](#11-optional-install-java-jdk-17)
12. [Install Android Studio & Emulator](#12-optional-install-android-studio--emulator)
13. [Install Expo / EAS CLI](#13-optional-install-expo--eas-cli)
14. [Mobile App Environment Variables](#14-optional-mobile-app-environment-variables)
15. [Running the Mobile App (Android)](#15-optional-running-the-mobile-app-android)

**Reference**

16. [Access Checklist (for Zohaib)](#16-access-checklist-for-zohaib)
17. [Quick Reference Card](#17-quick-reference-card)

---

## 1. Install Git

Git is the version control tool we use to manage code.

1. Download **Git for Windows** from https://git-scm.com/download/win
2. Run the installer — accept all the default options.
3. After installation, open **PowerShell** (search "PowerShell" in Start menu) and verify:
   ```
   git --version
   ```
   You should see something like `git version 2.x.x`.
4. Configure your identity (use your real name and email):
   ```
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

---

## 2. Install Node.js (v20)

Node.js is the JavaScript runtime that powers all our build tools. This project requires **Node.js version 20**.

We recommend using **nvm-windows** so you can easily switch Node versions:

1. Download the latest **nvm-windows** installer from https://github.com/coreybutler/nvm-windows/releases (get the `nvm-setup.exe` file).
2. Run the installer with default options.
3. Close and reopen PowerShell, then run:
   ```
   nvm install 20
   nvm use 20
   ```
4. Verify:
   ```
   node --version
   ```
   Should print `v20.x.x`.
   ```
   npm --version
   ```
   Should print `10.x.x` (npm comes bundled with Node).

---

## 3. Install pnpm

This project uses **pnpm** as its package manager (NOT npm or yarn). All install and run commands use `pnpm`.

1. In PowerShell, run:
   ```
   npm install -g pnpm
   ```
2. Verify:
   ```
   pnpm --version
   ```
   Should print `8.x.x` or higher.

> **Important:** Always use `pnpm` commands in this project, never `npm install` or `yarn`.

---

## 4. Install Cursor (Code Editor)

We use **Cursor** as our code editor. It's built on VS Code so it'll feel familiar, but it has built-in AI features that will help you a lot while learning.

1. Download Cursor from https://cursor.com (get the Windows version).
2. Run the installer.
3. Open Cursor and sign in using the credentials Zohaib provides. This gives you access to the AI features (chat, autocomplete, etc.).
4. Install these extensions (click the Extensions icon in the left sidebar, or press `Ctrl+Shift+X`):

   | Extension | What it's for |
   |-----------|--------------|
   | **ESLint** | Shows code errors and style issues |
   | **Prettier - Code formatter** | Auto-formats your code on save |
   | **Vue - Official (Volar)** | Syntax support for `.vue` files (web apps) |

5. Recommended: enable "Format on Save" — open Settings (`Ctrl+,`), search for "Format on Save", and check the box.

---

## 5. Install Firebase CLI

Firebase is our backend (database, auth, hosting, cloud functions).

1. Install the Firebase CLI:
   ```
   npm install -g firebase-tools
   ```
2. Log in with your Google account (Zohaib will add you to the Firebase project first):
   ```
   firebase login
   ```
   This opens a browser window — sign in with the Google account Zohaib added.
3. Verify you have access:
   ```
   firebase projects:list
   ```
   You should see `guided-navigation-app` in the list.

---

## 6. Clone the Repository

Now you can download the project code.

1. In PowerShell, navigate to where you want the project (e.g. your Desktop or a `code` folder):
   ```
   cd ~\Desktop
   ```
2. Clone the repository:
   ```
   git clone https://github.com/zeddlabs7/guided-navigation-app.git
   ```
3. Enter the project folder:
   ```
   cd guided-navigation-app
   ```
4. Make sure you're on Node 20:
   ```
   nvm use 20
   ```
5. Install all dependencies:
   ```
   pnpm install
   ```
   This will install packages for ALL apps and shared packages in the monorepo. It may take a few minutes the first time.

---

## 7. Project Structure Overview

This is a **monorepo** — multiple apps and shared packages in one repository.

```
guided-navigation-app/
├── apps/
│   ├── courier-app/       # Vue 3 web app — courier follows guidance via link
│   ├── admin-portal/      # Vue 3 web app — admin dashboard
│   ├── landing-page/      # Vue 3 web app — marketing site
│   └── mobile/            # React Native app (Expo) — optional, see section 11+
│
├── packages/
│   ├── types/             # Shared TypeScript types (used by all apps)
│   ├── core/              # Shared utility functions (used by all apps)
│   ├── services/          # Firebase SDK wrappers (used by web apps)
│   ├── i18n/              # Translation setup (Vue web apps)
│   └── ui/                # Shared Vue components (Vue web apps)
│
├── firebase/
│   ├── functions/         # Cloud Functions (backend logic)
│   ├── firebase.json      # Firebase hosting/services config
│   ├── firestore.rules    # Database security rules
│   └── storage.rules      # File storage security rules
│
├── package.json           # Root package.json (monorepo scripts)
├── pnpm-workspace.yaml    # Defines the monorepo workspace
└── .nvmrc                 # Specifies Node.js version (20)
```

**Key things to know:**
- The **web apps** (courier, admin, landing) are built with **Vue 3** — this is what you'll mainly work on.
- `packages/types` and `packages/core` are shared by everything. They are plain TypeScript.
- `packages/services` contains Firebase SDK wrappers used by the web apps.
- `packages/ui` has shared Vue components and `packages/i18n` handles translations.

---

## 8. Environment Variables (Web Apps)

The web apps need environment variables to connect to Firebase and Google APIs. These are NOT committed to git for security reasons.

Copy the example file and fill in values (ask Zohaib for the actual keys):

```
cp .env.example .env
```

The `.env.example` file shows all required variables:

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key |

---

## 9. Running the Web Apps

From the **project root** (not inside an app folder):

| Command | What it runs |
|---------|-------------|
| `pnpm dev:courier` | Courier app |
| `pnpm dev:admin` | Admin portal |
| `pnpm dev:landing` | Landing/marketing page |
| `pnpm dev` | Courier + Admin apps together |

Each command starts a local dev server. Open the URL it prints in your browser (usually `http://localhost:5173` or similar).

### Building for Production

```
pnpm build              # Builds all web apps
pnpm build:courier      # Build just the courier app
```

### Deploying

Deployment goes through Firebase Hosting. From the project root:

```
pnpm deploy:courier     # Build + deploy courier app
pnpm deploy:admin       # Build + deploy admin portal
pnpm deploy:landing     # Build + deploy landing page
pnpm deploy:all         # Build + deploy everything
```

> **Note:** You need Firebase CLI access (see [Section 5](#5-install-firebase-cli)) to deploy.

---

## 10. Common Issues & Tips

### "command not found: pnpm"
You forgot to install pnpm. Run `npm install -g pnpm`.

### "The engine 'node' is incompatible with this module"
You're on the wrong Node version. Run `nvm use 20`.

### Metro bundler errors about missing modules
Run `pnpm install` from the project root to make sure all dependencies are installed.

### Windows-specific: line ending issues
If you see git changes on files you didn't edit, it might be a line ending issue. Run:
```
git config --global core.autocrlf true
```

### Using Cursor AI
Cursor has a built-in AI chat (press `Ctrl+L`) that can help you understand code, write new code, and debug issues. Use it freely — it knows the project context when you have files open.

---

# Optional: Mobile App Setup

> **Skip this entire section unless Zohaib asks you to work on the mobile app.** Everything above is sufficient for working on the web apps.

---

## 11. (Optional) Install Java JDK 17

The Android build system (Gradle) requires Java. You need **JDK 17**.

1. Download **Adoptium Temurin 17** from https://adoptium.net/ — select:
   - Operating System: **Windows**
   - Architecture: **x64**
   - Package Type: **JDK**
   - Version: **17 (LTS)**
2. Run the `.msi` installer. During installation, make sure to check **"Set JAVA_HOME variable"** when prompted.
3. Close and reopen PowerShell, then verify:
   ```
   java -version
   ```
   Should print `openjdk version "17.x.x"`.
   ```
   echo $env:JAVA_HOME
   ```
   Should print the JDK install path (e.g. `C:\Program Files\Eclipse Adoptium\jdk-17...`).

---

## 12. (Optional) Install Android Studio & Emulator

Since you're on Windows, you can only run the mobile app on an **Android emulator** (iOS requires a Mac).

### Install Android Studio

1. Download Android Studio from https://developer.android.com/studio
2. Run the installer with default options.
3. On first launch, the Setup Wizard will run — choose **Standard** installation. Let it download the default SDK components.
4. Once Android Studio opens, go to **Settings** (or **File > Settings**) > **Languages & Frameworks > Android SDK**:
   - In the **SDK Platforms** tab: make sure **Android 14 (API 34)** is checked and installed.
   - In the **SDK Tools** tab: make sure these are checked:
     - Android SDK Build-Tools
     - Android SDK Command-line Tools
     - Android Emulator
     - Android SDK Platform-Tools
   - Click **Apply** and let everything download.

### Set Environment Variables

You need to tell your system where Android SDK is installed.

1. Open **System Environment Variables**:
   - Press `Win+R`, type `sysdm.cpl`, press Enter.
   - Go to **Advanced** tab > **Environment Variables**.
2. Under **User variables**, click **New** and add:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\<YOUR_USERNAME>\AppData\Local\Android\Sdk`
     (Replace `<YOUR_USERNAME>` with your actual Windows username.)
3. In the same User variables section, find `Path`, click **Edit**, then **New**, and add these two entries:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\emulator
   ```
4. Click OK on all dialogs.
5. Close and reopen PowerShell, then verify:
   ```
   adb --version
   ```
   Should print `Android Debug Bridge version ...`.

### Create an Android Emulator (AVD)

1. Open Android Studio.
2. Go to **Tools > Device Manager** (or click the phone icon in the toolbar).
3. Click **Create Virtual Device**.
4. Choose **Pixel 7** (or any recent Pixel device), click **Next**.
5. Select the **API 34** system image (download it if prompted), click **Next**.
6. Give it a name (default is fine), click **Finish**.
7. Click the **Play** button next to your new device to launch the emulator.
8. Once the emulator is running, verify in PowerShell:
   ```
   adb devices
   ```
   You should see your emulator listed (e.g. `emulator-5554   device`).

> **Tip:** You can also launch the emulator from the command line:
> ```
> emulator -avd Pixel_7_API_34
> ```

---

## 13. (Optional) Install Expo / EAS CLI

Expo is the framework we use for the mobile app. EAS (Expo Application Services) handles builds.

1. Install EAS CLI globally:
   ```
   npm install -g eas-cli
   ```
2. Verify:
   ```
   eas --version
   ```
   Should print version `18.5.0` or higher.
3. Log in with the Expo account (Zohaib will share credentials or invite you):
   ```
   eas login
   ```
4. Also install the **React Native Tools** extension in Cursor (`Ctrl+Shift+X`, search "React Native Tools").

> **Important:** This project uses **development builds**, NOT Expo Go. The Expo Go app from the Play Store will NOT work because we use native Firebase modules. You'll build the app directly onto the emulator.

---

## 14. (Optional) Mobile App Environment Variables

### Mobile `.env` file

```
cd apps/mobile
cp .env.example .env
```

Fill in:

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_COURIER_APP_URL` | Courier app URL for share links |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key (needs Maps SDK for Android, Places API, Geocoding API enabled) |

### Firebase Config File for Android

The mobile app also needs a `google-services.json` file for Firebase on Android. This file should already be in `apps/mobile/google-services.json`. If it's missing, ask Zohaib to send it to you. Place it at:

```
apps/mobile/google-services.json
```

---

## 15. (Optional) Running the Mobile App (Android)

Make sure your Android emulator is running (see [Section 12](#12-optional-install-android-studio--emulator)).

### First Time (builds the app from scratch)

```
cd apps/mobile
npx expo run:android
```

This will:
- Compile all the native code
- Install the development build on your emulator
- Start the Metro bundler

**This takes a while the first time** (10-20 minutes depending on your machine). Subsequent runs are much faster.

### After the First Build

Once the app is installed on the emulator, you can just start the dev server:

```
cd apps/mobile
npx expo start --android
```

This starts the Metro bundler and opens the app on the emulator. Code changes will hot-reload automatically.

### If the Build Fails

- Make sure `ANDROID_HOME` is set correctly (see [Section 12](#12-optional-install-android-studio--emulator)).
- Make sure Java 17 is installed (see [Section 11](#11-optional-install-java-jdk-17)).
- Make sure the emulator is running (`adb devices` should list it).
- Try `cd apps/mobile && npx expo prebuild --clean` then `npx expo run:android` again.

### Mobile-Specific Tips

- **Emulator is slow?** Enable Hardware Acceleration (HAXM or Hyper-V) in your BIOS settings. Use an x86_64 system image (not ARM). Allocate at least 4 GB RAM to the emulator in AVD settings.
- **iOS builds:** You cannot build or run the iOS app on Windows. iOS development requires a Mac. Only Android is available to you.
- The mobile app uses native Firebase (`@react-native-firebase/*`), not the Firebase JS SDK that the web apps use. It has its own service layer.

---

## 16. Access Checklist (for Zohaib)

These are things **Zohaib needs to do** to give the new developer access:

**Required (for web app work):**

- [ ] **GitHub** — Add as collaborator on [zeddlabs7/guided-navigation-app](https://github.com/zeddlabs7/guided-navigation-app)
- [ ] **Firebase Console** — Add Google account as **Editor** on the `guided-navigation-app` project at https://console.firebase.google.com
- [ ] **Google Cloud Console** — Ensure Maps API key access (or add to GCP project for the `guided-navigation-app` project)
- [ ] **Cursor** — Share Cursor account login credentials for AI features
- [ ] **Send `.env` values** — Share the actual Firebase API keys and Google Maps API key so the new dev can fill in their `.env` files

**Optional (only if working on mobile app):**

- [ ] **Expo / EAS** — Add to the Expo project at https://expo.dev (go to project settings > Members)
- [ ] **Send `google-services.json`** — The Android Firebase config file (already at `apps/mobile/google-services.json`, but send a copy just in case)

---

## 17. Quick Reference Card

**Web Apps (your main work):**

| What | Command |
|------|---------|
| Install dependencies | `pnpm install` (from project root) |
| Run courier web app | `pnpm dev:courier` (from project root) |
| Run admin portal | `pnpm dev:admin` (from project root) |
| Run landing page | `pnpm dev:landing` (from project root) |
| Build all web apps | `pnpm build` (from project root) |
| Deploy courier app | `pnpm deploy:courier` (from project root) |
| Check Node version | `node --version` (should be v20.x.x) |
| Check pnpm version | `pnpm --version` (should be 8+) |
| Firebase login | `firebase login` |

**Mobile App (optional):**

| What | Command |
|------|---------|
| Run mobile app (first time) | `cd apps/mobile && npx expo run:android` |
| Run mobile app (after first build) | `cd apps/mobile && npx expo start --android` |
| Check emulator | `adb devices` |
| Expo login | `eas login` |

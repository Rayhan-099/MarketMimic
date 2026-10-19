# Android Build Readiness & Environment Assessment

**Date:** 17 October 2026  
**Auditor:** React Native / Expo Architect & Mobile Tooling Engineer  
**Target Platform:** Android (Physical Device APK)  
**Deliverable Path:** `docs/setup/android-build-readiness.md`  

---

## 1. Executive Summary

MarketMimic's primary deliverable is an installable Android APK built under a strict ₹0 operating budget ceiling. The development environment must support both local compilation (independent of cloud quotas) and optional cloud build options (EAS Build free tier), without incurring mandatory costs.

This assessment audits the workstation's detected toolchain, identifies missing components, highlights compatibility risks (notably JDK 27 vs Gradle 8.x), and specifies the complete prerequisite pathway to compile the first release APK. **No application scaffolding was created during this phase.**

---

## 2. Toolchain Inventory & Compatibility Findings

| Component | Detected Version | Target / Supported Version | Compatibility Finding & Action Required |
|---|---|---|---|
| **Operating System** | Linux celestia `7.2.9-2-cachyos` (x86_64) | Linux / WSL2 / macOS | **Compatible.** High-performance Linux environment. |
| **Node.js** | `v26.11.1` | Node 20.x, 22.x LTS, or 24.x | **Functional with warnings.** Modern Metro/Expo tooling supports current Node releases; if Metro bundler warnings occur, Node 22 LTS via `fnm` or `nvm` is recommended. |
| **Package Manager** | `npm 12.2.0` | `npm` >= 10, `yarn`, or `pnpm` | **Compatible.** Standard package runner and dependency resolver. |
| **Git** | `2.56.0` | Git >= 2.30 | **Compatible.** |
| **Java Development Kit (JDK)** | OpenJDK `27` | OpenJDK `17` (LTS) or `21` (LTS) | **INCOMPATIBLE with Gradle 8.x.** Gradle and Android Gradle Plugin (AGP 8.x/8.7) fail with `Unsupported class file major version` when run on JDK 27. **Action:** Install OpenJDK 17 and set `JAVA_HOME`. |
| **Android SDK / NDK** | Unset (`ANDROID_HOME` empty) | Android SDK API 34 / 35, Build-Tools 34.0.0 / 35.0.0 | **Missing.** Local builds require command-line tools and platform SDK. |
| **Android Platform Tools (`adb`)** | Not found in PATH | `adb` 34.x+ | **Missing.** Required for USB debugging and direct device deployment. |
| **Expo CLI** | Available via `npx expo` | Modern Expo CLI bundled with SDK | **Ready.** Standard on-demand package runner execution. |

---

## 3. Recommended Remediation & Setup Commands

To establish a 100% offline, local Android build capability on this CachyOS / Arch-based Linux machine:

### 3.1 Install JDK 17 (Required for Android Gradle Plugin)
```bash
# Install OpenJDK 17 alongside JDK 27
sudo pacman -S jdk17-openjdk

# Switch default Java runtime or target via JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export PATH=$JAVA_HOME/bin:$PATH
```

### 3.2 Install Android SDK Command-line Tools & Platform Tools
```bash
# Option A: Via Arch Linux package manager
sudo pacman -S android-tools android-sdk

# Option B: Manual install into user home directory
mkdir -p "$HOME/Android/Sdk/cmdline-tools"
# Download commandlinetools-linux from developer.android.com, extract to "$HOME/Android/Sdk/cmdline-tools/latest"
```

### 3.3 Configure Android Environment Variables
Add to user profile or project development shell script:
```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"
```

### 3.4 Accept Android Licenses & Install Platforms
```bash
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
```

---

## 4. Build Pipelines: Zero-Budget Analysis

### Route A: Local Offline Build (Primary — ₹0 Guaranteed)
- **Mechanism:** Expo Prebuild (`npx expo prebuild --platform android`) generates a standard Gradle Android project.
- **Compilation:** Run `./gradlew assembleRelease` directly inside `android/`.
- **Output:** `android/app/build/outputs/apk/release/app-release-unsigned.apk`.
- **Signing:** Generate a local debug keystore or personal release keystore via `keytool -genkeypair` (free, offline, stored locally, ignored in `.gitignore`).
- **Cost:** ₹0. Zero network dependency, zero build quotas, zero risk of third-party policy changes.

### Route B: Expo Application Services (EAS Build — Cloud Optional)
- **Mechanism:** `eas build --platform android --profile preview`.
- **Requirements:** Free Expo account (`expo.dev`), `eas-cli`.
- **Pros:** Does not require local Android SDK or JDK configuration on the workstation.
- **Cons:** Subject to monthly concurrency and build minutes on free tier; requires internet connection.
- **PRD Compliance:** Permitted for convenience, but cannot substitute for Route A.

---

## 5. Prerequisites Checklist for Application Scaffolding

Before Phase A/B application generation begins in the next stage:
- [x] Repository initialized with Git and `.gitignore`.
- [x] Mobile engineering skills (`expo-overview`, `expo-router`, etc.) installed.
- [ ] JDK 17 installed and verified (`java -version` returns OpenJDK 17).
- [ ] Android SDK / `platform-tools` configured or EAS account prepared.
- [ ] Target Expo SDK version pinned (Recommended: Expo SDK 52 LTS or 54 with React Native 0.76+ New Architecture).

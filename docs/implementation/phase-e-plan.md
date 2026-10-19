# MarketMimic Phase E Implementation Plan
## Android Release Engineering, Real-Device Validation & Final APK Delivery

> **Authoritative Phase E Plan**  
> **Date:** 18 October 2026  
> **Status:** Active Execution  
> **Workspace:** `/mnt/d/Vyuk Projects/stock/`  
> **Budget Ceiling:** ₹0  

---

### 1. Objectives

1. Recover safely from the prior stalled EAS authentication attempt without re-triggering interactive cloud authentication.
2. Verify all regression gates (tests, TypeScript, Metro Hermes bytecode bundle).
3. Establish a self-contained local Android build toolchain inside workspace (`.build-tools/`) supporting JDK 17 and Android SDK 34/35.
4. Execute `./gradlew assembleRelease` using the project's native Gradle project in `android/`.
5. Verify and inspect the resulting standalone release APK (`com.marketmimic.app`, release signing, metadata, size, SHA-256).
6. Check `adb` for available physical devices or emulators, and perform the 20-step smoke-test flow if available, or clearly document the absence of an active device.
7. Audit market data honesty across all screens (ensuring labels say `DEMO` and never misleadingly claim `LIVE`).
8. Publish final release manifest and comprehensive verification reports.

---

### 2. Milestone Breakdown

- **Milestone 1: State Recovery & Toolchain Audit**
  - Verify workspace integrity, processes, git diff, and absence of stalled EAS commands.
  - Audit Node.js, npm, Java runtime (JDK 27 detected), and Android SDK status.
  - Formulate workspace-contained toolchain strategy (`.build-tools/` in `.gitignore`).

- **Milestone 2: Regression Gates Verification**
  - Execute `npm test` (all 24 test files, 133 tests).
  - Execute `npm run typecheck` (`tsc --noEmit`).
  - Execute `npx expo export --platform android` (Hermes bytecode `.hbc` bundle in `dist/`).

- **Milestone 3: Local Build Environment Setup**
  - Download Amazon Corretto OpenJDK 17 LTS Linux x64 into `.build-tools/jdk-17/`.
  - Download Google Android Command-line Tools into `.build-tools/android-sdk/`.
  - Install `platforms;android-35` and `build-tools;35.0.0` using `sdkmanager`.
  - Configure `android/local.properties` with `sdk.dir`.

- **Milestone 4: Local Android Release Build**
  - Execute `./gradlew assembleRelease` with `JAVA_HOME` pointing to `.build-tools/jdk-17/` and `ANDROID_HOME` pointing to `.build-tools/android-sdk/`.
  - Validate output APK in `android/app/build/outputs/apk/release/`.
  - Copy standalone release APK to `release-output/MarketMimic-release.apk`.

- **Milestone 5: APK Structural Validation & Audit**
  - Inspect APK package ID (`com.marketmimic.app`), version code (1), version name (`1.0.0`).
  - Verify release signing, permissions, and native Hermes architecture.
  - Compute cryptographic SHA-256 checksum and measure exact file size.

- **Milestone 6: Real-Device / Emulator Testing & Market Data Audit**
  - Check `adb devices`.
  - Perform 20-step smoke-test flow if device is available; otherwise, document explicit manual installation procedure.
  - Verify data freshness labels (`DEMO` / `REPLAY`, no false `LIVE` badges).

- **Milestone 7: Final Documentation & Release Manifest**
  - Complete `docs/implementation/phase-e-execution-log.md`.
  - Complete `docs/implementation/phase-e-skill-usage.md`.
  - Complete `docs/implementation/phase-e-verification-report.md`.
  - Complete `docs/implementation/release-manifest.md`.

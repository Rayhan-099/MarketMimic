# MarketMimic Standalone Release Manifest

**Build Date:** 19 October 2026  
**Build Target:** Android ARM64 Phone (Android 16 / 15 / 14 / Universal)  
**Distribution:** Direct Personal Installation / Sideloading (Outside Google Play Store)  
**Cost Model:** ₹0 Cloud Cost Guarantee (Zero cloud build credits, zero paid APIs)

---

## 1. Artifact Verification & Checksums

| Property | Value |
|---|---|
| **File Name** | `MarketMimic-release.apk` |
| **Output Path** | `release-output/MarketMimic-release.apk` |
| **Gradle Source Path** | `android/app/build/outputs/apk/release/app-release.apk` |
| **File Size (Exact Bytes)** | `80,143,152 bytes` |
| **File Size (Human Readable)** | `76.43 MB` (~77 MB) |
| **SHA-256 Checksum** | `d1ba172f3cabc61d7fbfbc91a80cd6830abb609f6f0bd4e431f50b18cdd09300` |
| **Package Identifier** | `com.marketmimic.app` |
| **Version Code** | `1` |
| **Version Name** | `1.0.0` |
| **Application Label** | `MarketMimic` |
| **Launchable Activity** | `com.marketmimic.app.MainActivity` |

---

## 2. Platform & Architecture Compatibility

- **Minimum SDK:** `24` (Android 7.0 Nougat)
- **Target SDK:** `34` (Android 14)
- **Compile SDK:** `35` (Android 15)
- **Tested Target OS:** Android 16 Preview / Android 15 / Android 14
- **Native Architectures Packaged (Universal APK):**
  - `arm64-v8a` (Primary target: Modern 64-bit ARM smartphones)
  - `armeabi-v7a` (Legacy 32-bit ARM smartphones)
  - `x86_64` (Modern 64-bit Android Studio emulators)
  - `x86` (32-bit Android Studio emulators)

---

## 3. Engine & Runtime Integrity

- **JavaScript Engine:** Hermes Bytecode VM (Magic signature `c6 1f bc 03`, little-endian `0x03bc1fc6` confirmed).
- **Embedded JS Bundle:** `assets/index.android.bundle` (1,673,944 bytes Hermes bytecode).
- **Database Engine:** SQLite 3 with CR-SQLite extension (`libcrsqlite.so` and `libexpo-sqlite.so` compiled for all 4 ABIs).
- **Signing Keystore:** Standard Android debug release key (`androiddebugkey`), pre-configured for instant sideloading without developer signature conflicts.
- **Financial Invariants Embedded:**
  - Double-entry ledger with integer paise representation (Zero floating-point rounding errors).
  - Weighted Average Cost (WAC) delivery accounting.
  - Mark-to-Market (M2M) intraday position tracking with auto-squareoff alerts.
  - Deterministic historical replay harness.

---

## 4. Sideload Installation Instructions

To install on a connected Android phone:

```bash
# 1. Enable USB Debugging on your phone:
# Settings -> Developer Options -> USB Debugging (ON)

# 2. Verify device connection:
adb devices

# 3. Install the APK:
adb install -r release-output/MarketMimic-release.apk

# 4. Launch the application:
adb shell am start -n com.marketmimic.app/.MainActivity
```

Direct phone download:
1. Transfer `MarketMimic-release.apk` to your phone via USB, Google Drive, or LocalSend.
2. Tap the `.apk` file in your Android File Manager.
3. Allow "Install from unknown sources" if prompted.
4. Tap **Install** and open **MarketMimic**.

# LTF1 Mobile -- APK Build and Distribution

This document covers the build, distribution, and release strategy for the LTF1 Android app.

---

## App Metadata

| Field | Value |
|-------|-------|
| Package name | `com.ltf1.mobile` |
| Version | 1.0.0 |
| Min SDK | 24 (Android 7.0 Nougat) |
| Target SDK | 34 (Android 14) |
| Architecture | arm64-v8a, armeabi-v7a, x86_64 |

---

## Phase 1: Internal APK Distribution

Internal distribution is the initial release strategy. APK files are built with EAS Build and shared directly with testers.

### Build Command

```bash
eas build --platform android --profile preview
```

This produces a standalone APK file (not an AAB). APK files can be installed directly on any Android device without going through the Play Store.

### Sharing the APK

- Upload to Google Drive and share the link with testers.
- Post in Slack or Discord for the team.
- Host on a direct download URL if available.

No signing key management is needed for internal builds. EAS manages a debug keystore automatically.

### Installation

Testers install the APK by:
1. Opening the download link on their Android device.
2. Allowing installation from unknown sources (one-time device setting).
3. Tapping the downloaded APK to install.

---

## EAS Configuration

### eas.json

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### Build Profiles

| Profile | Purpose | Output | Signing |
|---------|---------|--------|---------|
| `development` | Local development with dev client | Debug APK | Debug keystore |
| `preview` | Internal testing with release optimizations | Release APK | EAS-managed keystore |
| `production` | Play Store submission | AAB (Android App Bundle) | Play Store managed signing |

---

## Phase 2: Play Store Distribution (Future)

When the app is ready for public release, switch from APK to AAB and submit through the Play Store.

### Build and Submit

```bash
eas build --platform android --profile production
eas submit --platform android
```

### Play Store Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| Google Play Developer account | Required | $25 one-time registration fee |
| App signing key | Managed by Play Store | Google Play App Signing handles key management |
| Store listing | Required | Title, short description, full description |
| Screenshots | Required | Minimum 2 screenshots, recommended 8 |
| App icon | Required | 512x512 PNG, no transparency |
| Feature graphic | Required | 1024x500 PNG or JPG |
| Privacy policy URL | Required | Must be publicly accessible |
| Content rating | Required | Complete the IARC questionnaire |
| Target API level | Required | Must target SDK 34+ for new submissions |
| Data safety form | Required | Declare what data the app collects |

### Store Listing Content

**Title:** LTF1 -- Dev Project Management

**Short description (80 chars):**
Project management built for developers. Tasks, sprints, and team coordination.

**Category:** Productivity

**Content rating:** Everyone (no user-generated content in v1)

### Release Tracks

| Track | Purpose | Audience |
|-------|---------|----------|
| Internal testing | Earliest builds for the core team | Up to 100 testers |
| Closed testing | Beta builds for selected external testers | Invite-only |
| Open testing | Public beta before full launch | Anyone can join |
| Production | Full public release | All Play Store users |

Start with the internal testing track. Graduate to closed testing, then production.

---

## Environment Configuration

The mobile app connects to different Convex deployments based on the build profile.

| Profile | Convex Deployment | Clerk Frontend API |
|---------|-------------------|-------------------|
| development | Dev deployment | Dev Clerk instance |
| preview | Staging deployment | Staging Clerk instance |
| production | Production deployment | Production Clerk instance |

Environment variables are set in `eas.json` under each build profile's `env` field or through EAS Secrets for sensitive values.

---

## Version Management

### Versioning Scheme

Follow semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes, major redesigns.
- **MINOR:** New features, screen additions.
- **PATCH:** Bug fixes, performance improvements.

### Android Version Codes

Android requires an integer `versionCode` that increments with every build. EAS Build can auto-increment this.

In `app.json`:

```json
{
  "expo": {
    "android": {
      "versionCode": 1
    }
  }
}
```

EAS auto-increment:

```json
{
  "build": {
    "production": {
      "android": {
        "autoIncrement": true
      }
    }
  }
}
```

---

## CI/CD (Future)

### GitHub Actions Pipeline

Automate builds on push to main:

```yaml
name: Build Android
on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd apps/mobile && eas build --platform android --profile preview --non-interactive
```

### Automated Distribution

After a successful build:
1. EAS Build produces the APK/AAB artifact.
2. For `preview` builds: APK is available for download from the EAS dashboard.
3. For `production` builds: `eas submit` uploads to the Play Store internal testing track.
4. Changelog is auto-generated from git commit messages since the last build.

### Build Notifications

Configure EAS Build webhooks or GitHub Actions notifications to alert the team in Slack/Discord when a new build is ready.

---

## Security Considerations

- Never commit signing keys or service account JSON files to the repository.
- Store `google-service-account.json` as an EAS Secret, not in the repo.
- Use EAS Secrets for all sensitive environment variables (Convex deploy keys, Clerk secret keys).
- The `.gitignore` must include `*.keystore`, `*.jks`, and `google-service-account.json`.
- APK files shared for internal testing should be distributed through private channels only.

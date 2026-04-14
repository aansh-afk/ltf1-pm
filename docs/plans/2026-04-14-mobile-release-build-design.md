# LTF1 Mobile Local Release Build Design

## Goal

Produce a local, reproducible Android release APK for `apps/mobile` that installs on the Samsung Galaxy F16 and runs without Metro or a USB connection.

## Problem

`./gradlew assembleRelease` fails in `:app:createBundleReleaseJsAndAssets` during Babel transform. The failing module is `react-native-worklets/plugin`.

The app does not directly depend on `react-native-worklets`, but `babel-preset-expo` auto-detects it in the pnpm store and injects that plugin during release bundling. In this monorepo, that transitive plugin is not resolvable from the app-level release bundle step.

## Chosen Approach

Keep the current Expo SDK 52, React Native 0.76.9, and Reanimated 3.16.x stack.

Update `apps/mobile/babel.config.js` so that:

- `babel-preset-expo` does not auto-inject `worklets`
- `babel-preset-expo` does not auto-inject `reanimated`
- `react-native-reanimated/plugin` remains explicitly configured as the last plugin

This is the smallest change because it targets the exact failing resolution path without changing app code or native dependencies.

## Verification

1. Run `ANDROID_HOME="$HOME/Android/Sdk" ./gradlew assembleRelease` in `apps/mobile/android`.
2. Install the generated APK with `adb install -r`.
3. Launch the release app with no Metro server running.
4. Smoke-test sign-in, tab navigation, and one Convex-backed screen.

## Fallback

If the Babel fix does not unblock release bundling, fall back to pre-bundling JS and disabling Gradle bundling for release builds. A Reanimated downgrade is lower priority because it increases compatibility risk.

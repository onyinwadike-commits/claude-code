# Screenshot Blocker Native Modules

These native modules provide screenshot blocking functionality for iOS and Android.

## Features

### iOS
- Listens for `UIApplicationUserDidTakeScreenshotNotification`
- Emits `onScreenshotTaken` event to JavaScript when a screenshot is detected
- Optional secure text field overlay for additional protection
- Screen capture detection for screen recording

### Android
- Uses `FLAG_SECURE` window flag to completely prevent screenshots
- Also prevents screen recording
- Hides content in recent apps switcher

## Installation

### iOS

1. Copy the files from `native-modules/ios/` to your Xcode project:
   - `ScreenshotBlockerModule.h`
   - `ScreenshotBlockerModule.m`

2. Ensure the files are added to your build target.

3. The module will auto-link with React Native.

### Android

1. Copy the files from `native-modules/android/` to:
   `android/app/src/main/java/com/voidconfessions/screenshotblocker/`

2. Add the package to `MainApplication.java`:

```java
import com.voidconfessions.screenshotblocker.ScreenshotBlockerPackage;

@Override
protected List<ReactPackage> getPackages() {
  List<ReactPackage> packages = new PackageList(this).getPackages();
  packages.add(new ScreenshotBlockerPackage());
  return packages;
}
```

## Usage

### React Component (Recommended)

```tsx
import { ScreenshotBlocker } from '../components/ScreenshotBlocker';

function App() {
  return (
    <ScreenshotBlocker
      enabled={true}
      onScreenshotDetected={() => {
        console.log('Screenshot detected!');
      }}
    >
      <SensitiveContent />
    </ScreenshotBlocker>
  );
}
```

### Hook

```tsx
import { useScreenshotBlocker } from '../components/ScreenshotBlocker';

function SecureScreen() {
  const { enableSecureMode, disableSecureMode } = useScreenshotBlocker();

  useEffect(() => {
    enableSecureMode();
    return () => disableSecureMode();
  }, []);

  return <SensitiveContent />;
}
```

### Direct Native Module Access

```tsx
import { NativeModules, Platform } from 'react-native';

const { ScreenshotBlockerModule } = NativeModules;

// Android: Enable secure mode
if (Platform.OS === 'android') {
  ScreenshotBlockerModule.enableSecureMode();
}

// iOS: Check if screen is being recorded
if (Platform.OS === 'ios') {
  const isCapturing = await ScreenshotBlockerModule.isScreenBeingCaptured();
}
```

## API Reference

### ScreenshotBlocker Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable screenshot blocking |
| `inactiveBlurIntensity` | `number` | `100` | Blur intensity when app is inactive |
| `screenshotBlurIntensity` | `number` | `100` | Blur intensity when screenshot detected (iOS) |
| `fadeOutDuration` | `number` | `300` | Duration of blur fade animation (ms) |
| `screenshotBlurDuration` | `number` | `500` | How long to show blur after screenshot (iOS) |
| `onScreenshotDetected` | `() => void` | - | Callback when screenshot is detected |
| `onAppInactive` | `() => void` | - | Callback when app becomes inactive |
| `onAppActive` | `() => void` | - | Callback when app becomes active |

### Native Module Methods

#### Android

| Method | Description |
|--------|-------------|
| `enableSecureMode()` | Enable FLAG_SECURE |
| `disableSecureMode()` | Disable FLAG_SECURE |
| `isSecureModeEnabled()` | Check if secure mode is enabled |
| `enableSecureModeAsync()` | Enable with Promise |
| `disableSecureModeAsync()` | Disable with Promise |

#### iOS

| Method | Description |
|--------|-------------|
| `isScreenBeingCaptured()` | Check if screen recording is active (iOS 11+) |
| `enableSecureTextOverlay()` | Add secure text field trick |
| `disableSecureTextOverlay()` | Remove secure text field |

### Events (iOS)

| Event | Payload | Description |
|-------|---------|-------------|
| `onScreenshotTaken` | `{ timestamp: number }` | Fired when user takes a screenshot |

## Security Notes

1. **Android FLAG_SECURE** is the most effective - it completely prevents screenshots and screen recording at the OS level.

2. **iOS** cannot prevent screenshots, only detect them. The blur effect is shown reactively. For better protection, consider:
   - Using the secure text field overlay (may have UI side effects)
   - Implementing server-side screenshot detection via watermarking

3. **AppState blur** provides protection when the user opens the app switcher or notification center, preventing content from appearing in previews.

4. This protection can be bypassed by determined users (external cameras, modified OS, etc.). For truly sensitive data, consider additional server-side protections.

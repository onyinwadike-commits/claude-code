# Native Modules

This directory contains native modules for iOS and Android that provide:
1. **Screenshot Blocking** - Prevent screenshots and blur content when app is inactive
2. **Voice Anonymization** - On-device audio processing to anonymize voice recordings

---

# Screenshot Blocker

Provides screenshot blocking functionality for iOS and Android.

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

---

# Voice Anonymizer

Provides on-device audio processing to anonymize voice recordings.

## Features

### Audio Processing
- **Pitch Shifting**: -6 to +6 semitones random shift
- **Time Stretching**: 0.9x to 1.1x playback speed adjustment
- **Noise Injection**: Subtle background noise to mask voice characteristics

### Platform Support

#### iOS
- Uses AVFoundation's `AVAudioEngine` for audio processing
- `AVAudioUnitTimePitch` for pitch shifting and time stretching
- Accelerate framework's vDSP for noise injection
- Outputs AAC-encoded M4A files

#### Android
- Uses `MediaCodec` for decoding and encoding
- Custom sample processing for pitch and time adjustments
- Random noise injection during encoding
- Outputs AAC-encoded M4A files

## Installation

### iOS

1. Copy the files from `native-modules/ios/` to your Xcode project:
   - `VoiceAnonymizerModule.h`
   - `VoiceAnonymizerModule.m`

2. Add the AVFoundation and Accelerate frameworks to your project.

3. The module will auto-link with React Native.

### Android

1. Copy the files from `native-modules/android/` to:
   `android/app/src/main/java/com/voidconfessions/voiceanonymizer/`

2. Add the package to `MainApplication.java`:

```java
import com.voidconfessions.voiceanonymizer.VoiceAnonymizerPackage;

@Override
protected List<ReactPackage> getPackages() {
  List<ReactPackage> packages = new PackageList(this).getPackages();
  packages.add(new VoiceAnonymizerPackage());
  return packages;
}
```

## Usage

### VoiceRecorder Component (Recommended)

```tsx
import { VoiceRecorder } from '../components/VoiceRecorder';

function RecordScreen() {
  return (
    <VoiceRecorder
      voidType="grief"
      isPremium={true}
      onRecordingComplete={(result) => {
        console.log('Recording complete:', result);
      }}
      onCancel={() => {
        console.log('Recording cancelled');
      }}
    />
  );
}
```

### VoiceAnonymizer Service

```tsx
import { anonymizeVoice, uploadAnonymizedAudio } from '../services/voiceAnonymizer';

// Anonymize with random parameters
const result = await anonymizeVoice(recordingUri);
if (result.success) {
  console.log('Anonymized file:', result.anonymizedUri);
  console.log('Parameters used:', result.params);

  // Upload to server
  const uploadResult = await uploadAnonymizedAudio(
    result.anonymizedUri,
    'grief',
    { duration: 30 }
  );
}

// Anonymize with custom parameters
const customResult = await anonymizeVoice(recordingUri, {
  pitchShift: 3, // +3 semitones
  timeStretch: 1.05, // 5% faster
  noiseLevel: 0.05, // 5% noise
});
```

### Direct Native Module Access

```tsx
import { NativeModules } from 'react-native';

const { VoiceAnonymizerModule } = NativeModules;

const result = await VoiceAnonymizerModule.anonymizeAudio(
  inputUri,
  3.0,    // pitchShift (semitones)
  1.05,   // timeStretch (factor)
  0.05    // noiseLevel (0-1)
);

console.log('Output:', result.outputUri);
```

## API Reference

### VoiceRecorder Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `voidType` | `VoidType` | Yes | The void type for styling |
| `isPremium` | `boolean` | Yes | Whether user has premium access |
| `onRecordingComplete` | `function` | No | Callback with recording result |
| `onCancel` | `function` | No | Callback when recording is cancelled |

### VoiceAnonymizer Service

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `anonymizeVoice` | `(uri, params?)` | `Promise<AnonymizationResult>` | Anonymize audio file |
| `uploadAnonymizedAudio` | `(uri, voidType, metadata?)` | `Promise<UploadResult>` | Upload to server |
| `deleteAnonymizedFile` | `(uri)` | `Promise<boolean>` | Delete local file |
| `generateRandomParams` | `()` | `AnonymizationParams` | Generate random parameters |
| `isNativeAnonymizerAvailable` | `()` | `boolean` | Check if native module is available |

### AnonymizationParams

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `pitchShift` | `number` | -6 to +6 | Pitch shift in semitones |
| `timeStretch` | `number` | 0.9 to 1.1 | Playback speed factor |
| `noiseLevel` | `number` | 0 to 0.2 | Background noise level |

### Native Module Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `anonymizeAudio` | `(inputUri, pitchShift, timeStretch, noiseLevel)` | `Promise<{outputUri, success}>` | Process audio file |
| `isAvailable` | `()` | `Promise<boolean>` | Check module availability |

## Privacy Notes

1. **Original files are always deleted** after anonymization - only the processed version is kept.

2. **All processing is on-device** - the original voice never leaves the device.

3. **Random parameters** are generated for each recording, making it impossible to reverse-engineer the original voice.

4. **The anonymized audio ID** is stored, but the mapping to the original device is not preserved.

5. For additional privacy, consider implementing:
   - Server-side re-anonymization
   - Differential privacy noise injection
   - Voice activity detection to remove identifiable speech patterns

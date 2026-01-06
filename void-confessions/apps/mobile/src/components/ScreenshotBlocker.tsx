import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  AppState,
  AppStateStatus,
  StyleSheet,
  NativeModules,
  NativeEventEmitter,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { ScreenshotBlockerModule } = NativeModules;

interface ScreenshotBlockerProps {
  children: React.ReactNode;
  /** Enable screenshot blocking (default: true) */
  enabled?: boolean;
  /** Blur intensity when app is inactive (default: 100) */
  inactiveBlurIntensity?: number;
  /** Blur intensity when screenshot detected (default: 100) */
  screenshotBlurIntensity?: number;
  /** Duration of blur fade animation in ms (default: 300) */
  fadeOutDuration?: number;
  /** How long to show blur after screenshot on iOS (default: 500) */
  screenshotBlurDuration?: number;
  /** Callback when screenshot is detected */
  onScreenshotDetected?: () => void;
  /** Callback when app becomes inactive */
  onAppInactive?: () => void;
  /** Callback when app becomes active */
  onAppActive?: () => void;
}

/**
 * ScreenshotBlocker component that protects sensitive content
 *
 * - Monitors AppState and instantly blurs content when app becomes inactive
 * - On iOS: Listens for screenshot notifications
 * - On Android: Sets FLAG_SECURE to prevent screenshots entirely
 *
 * Usage:
 * ```tsx
 * <ScreenshotBlocker>
 *   <SensitiveContent />
 * </ScreenshotBlocker>
 * ```
 */
export function ScreenshotBlocker({
  children,
  enabled = true,
  inactiveBlurIntensity = 100,
  screenshotBlurIntensity = 100,
  fadeOutDuration = 300,
  screenshotBlurDuration = 500,
  onScreenshotDetected,
  onAppInactive,
  onAppActive,
}: ScreenshotBlockerProps): React.JSX.Element {
  const [isBlurred, setIsBlurred] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const screenshotTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const blurOpacity = useSharedValue(0);

  // Show blur instantly
  const showBlur = useCallback((intensity: number = inactiveBlurIntensity) => {
    setBlurIntensity(intensity);
    setIsBlurred(true);
    blurOpacity.value = 1;
  }, [inactiveBlurIntensity, blurOpacity]);

  // Fade out blur
  const hideBlur = useCallback(() => {
    blurOpacity.value = withTiming(0, {
      duration: fadeOutDuration,
      easing: Easing.out(Easing.cubic),
    }, (finished) => {
      if (finished) {
        runOnJS(setIsBlurred)(false);
      }
    });
  }, [fadeOutDuration, blurOpacity]);

  // Handle screenshot detection (iOS)
  const handleScreenshot = useCallback(() => {
    if (!enabled) return;

    // Clear any existing timeout
    if (screenshotTimeoutRef.current) {
      clearTimeout(screenshotTimeoutRef.current);
    }

    // Show blur briefly
    showBlur(screenshotBlurIntensity);

    // Notify callback
    onScreenshotDetected?.();

    // Hide blur after duration
    screenshotTimeoutRef.current = setTimeout(() => {
      hideBlur();
      screenshotTimeoutRef.current = null;
    }, screenshotBlurDuration);
  }, [enabled, showBlur, screenshotBlurIntensity, hideBlur, screenshotBlurDuration, onScreenshotDetected]);

  // Handle AppState changes
  useEffect(() => {
    if (!enabled) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // App becoming inactive (user switching apps, control center, etc.)
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        if (appState.current === 'active') {
          showBlur(inactiveBlurIntensity);
          onAppInactive?.();
        }
      }

      // App becoming active again
      if (nextAppState === 'active') {
        if (appState.current !== 'active') {
          hideBlur();
          onAppActive?.();
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [enabled, showBlur, hideBlur, inactiveBlurIntensity, onAppInactive, onAppActive]);

  // iOS: Listen for screenshot notifications
  useEffect(() => {
    if (!enabled || Platform.OS !== 'ios') return;

    // Try to use native module for screenshot detection
    if (ScreenshotBlockerModule) {
      try {
        const eventEmitter = new NativeEventEmitter(ScreenshotBlockerModule);
        const subscription = eventEmitter.addListener(
          'onScreenshotTaken',
          handleScreenshot
        );

        return () => {
          subscription.remove();
        };
      } catch (error) {
        console.warn('ScreenshotBlocker: Failed to set up iOS screenshot listener', error);
      }
    }
  }, [enabled, handleScreenshot]);

  // Android: Enable/disable FLAG_SECURE
  useEffect(() => {
    if (!enabled || Platform.OS !== 'android') return;

    if (ScreenshotBlockerModule) {
      try {
        ScreenshotBlockerModule.enableSecureMode();

        return () => {
          ScreenshotBlockerModule.disableSecureMode();
        };
      } catch (error) {
        console.warn('ScreenshotBlocker: Failed to enable Android secure mode', error);
      }
    }
  }, [enabled]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (screenshotTimeoutRef.current) {
        clearTimeout(screenshotTimeoutRef.current);
      }
    };
  }, []);

  // Animated styles
  const blurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {children}

      {/* Blur overlay */}
      {isBlurred && (
        <Animated.View style={[styles.blurOverlay, blurStyle]} pointerEvents="none">
          <BlurView
            intensity={blurIntensity}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.solidOverlay} />
        </Animated.View>
      )}
    </View>
  );
}

/**
 * Hook to programmatically control screenshot blocking
 */
export function useScreenshotBlocker() {
  const enableSecureMode = useCallback(() => {
    if (Platform.OS === 'android' && ScreenshotBlockerModule) {
      try {
        ScreenshotBlockerModule.enableSecureMode();
      } catch (error) {
        console.warn('Failed to enable secure mode:', error);
      }
    }
  }, []);

  const disableSecureMode = useCallback(() => {
    if (Platform.OS === 'android' && ScreenshotBlockerModule) {
      try {
        ScreenshotBlockerModule.disableSecureMode();
      } catch (error) {
        console.warn('Failed to disable secure mode:', error);
      }
    }
  }, []);

  const isSecureModeAvailable = useCallback(() => {
    return !!ScreenshotBlockerModule;
  }, []);

  return {
    enableSecureMode,
    disableSecureMode,
    isSecureModeAvailable,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  solidOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 5, 8, 0.5)',
  },
});

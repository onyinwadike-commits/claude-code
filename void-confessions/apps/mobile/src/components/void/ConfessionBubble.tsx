import React, { useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { Confession, VoidType, EchoWord } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LONG_PRESS_DURATION_MS = 1500; // 1.5 seconds for resonance

interface ConfessionBubbleProps {
  confession: Confession;
  voidType: VoidType;
  onResonate: (id: string) => void;
  onEcho: (id: string, word: EchoWord) => void;
  isGlowing?: boolean;
  echoWord?: EchoWord | null;
  /** Current Y position for opacity calculation */
  currentY?: number;
  /** Screen height for fade calculation */
  fadeStartY?: number;
}

const ECHO_WORDS: EchoWord[] = ['same', 'felt', 'brave', 'heard', 'seen', 'lighter', 'strength'];

export function ConfessionBubble({
  confession,
  voidType,
  onResonate,
  onEcho,
  isGlowing = false,
  echoWord = null,
  currentY = SCREEN_HEIGHT,
  fadeStartY = 200,
}: ConfessionBubbleProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];

  // Animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const echoOpacity = useSharedValue(0);
  const echoScale = useSharedValue(0.5);
  const pressProgress = useSharedValue(0);
  const isLongPressing = useSharedValue(false);

  // Long press timer ref
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Entrance animation
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withSpring(1, { damping: 12, stiffness: 120 });
  }, []);

  // Glow effect when resonance received
  useEffect(() => {
    if (isGlowing) {
      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      glowIntensity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0.6, { duration: 200 }),
        withTiming(0.8, { duration: 150 }),
        withTiming(0, { duration: 500 })
      );

      // Pulse scale effect
      scale.value = withSequence(
        withSpring(1.05, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
    }
  }, [isGlowing]);

  // Echo word animation
  useEffect(() => {
    if (echoWord) {
      echoOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1500, withTiming(0, { duration: 500 }))
      );
      echoScale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withTiming(1, { duration: 200 }),
        withDelay(1300, withTiming(0.8, { duration: 300 }))
      );
    }
  }, [echoWord]);

  // Callbacks for gestures
  const triggerResonate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onResonate(confession.id);
  }, [confession.id, onResonate]);

  const triggerEcho = useCallback(() => {
    const randomWord = ECHO_WORDS[Math.floor(Math.random() * ECHO_WORDS.length)];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEcho(confession.id, randomWord);
  }, [confession.id, onEcho]);

  const startLongPressTimer = useCallback(() => {
    // Clear any existing timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // Start progress animation
    pressProgress.value = withTiming(1, { duration: LONG_PRESS_DURATION_MS });

    // Set timer for resonance
    longPressTimerRef.current = setTimeout(() => {
      runOnJS(triggerResonate)();
    }, LONG_PRESS_DURATION_MS);
  }, [triggerResonate, pressProgress]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pressProgress.value = withTiming(0, { duration: 200 });
  }, [pressProgress]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Long press gesture for resonance (1.5s hold)
  const longPressGesture = Gesture.LongPress()
    .minDuration(LONG_PRESS_DURATION_MS)
    .onBegin(() => {
      isLongPressing.value = true;
      runOnJS(startLongPressTimer)();
    })
    .onFinalize((_, success) => {
      isLongPressing.value = false;
      if (!success) {
        runOnJS(cancelLongPress)();
      }
    });

  // Tap gesture for echo
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(triggerEcho)();
    });

  // Combine gestures - long press takes priority
  const composedGesture = Gesture.Exclusive(longPressGesture, tapGesture);

  // Container style with opacity fade based on Y position
  const containerStyle = useAnimatedStyle(() => {
    // Calculate opacity based on Y position (fade as it approaches top)
    const positionOpacity = interpolate(
      currentY,
      [0, fadeStartY, fadeStartY + 100],
      [0, 0.3, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value * positionOpacity,
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
    transform: [{ scale: 1 + glowIntensity.value * 0.15 }],
  }));

  const echoStyle = useAnimatedStyle(() => ({
    opacity: echoOpacity.value,
    transform: [{ scale: echoScale.value }],
  }));

  // Progress ring style for long press indicator
  const progressStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pressProgress.value, [0, 0.1, 1], [0, 1, 1]),
    transform: [{ scale: interpolate(pressProgress.value, [0, 1], [0.8, 1.1]) }],
    borderWidth: interpolate(pressProgress.value, [0, 1], [2, 4]),
  }));

  // Calculate time remaining
  const timeRemaining = Math.max(
    0,
    Math.floor((new Date(confession.expiresAt).getTime() - Date.now()) / 1000 / 60)
  );

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glowOverlay,
          glowStyle,
          { backgroundColor: config.colors.glow },
        ]}
      />

      {/* Long press progress ring */}
      <Animated.View
        style={[
          styles.progressRing,
          progressStyle,
          { borderColor: config.colors.primary },
        ]}
      />

      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            styles.bubble,
            { borderColor: config.colors.primary + '30' },
          ]}
        >
          {/* Content */}
          <Text style={styles.content} numberOfLines={6}>
            {confession.content}
          </Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            {/* Resonance count */}
            <View style={styles.resonanceContainer}>
              <Text style={[styles.resonanceIcon, { color: config.colors.primary }]}>
                ◉
              </Text>
              <Text style={styles.resonanceCount}>
                {confession.resonanceCount}
              </Text>
            </View>

            {/* Echoes */}
            {confession.echoes.length > 0 && (
              <View style={styles.echoesContainer}>
                {confession.echoes.slice(0, 3).map((echo) => (
                  <View
                    key={echo.word}
                    style={[styles.echoBadge, { backgroundColor: config.colors.primary + '20' }]}
                  >
                    <Text style={[styles.echoText, { color: config.colors.primary }]}>
                      {echo.word}
                    </Text>
                    <Text style={styles.echoCount}>{echo.count}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Time remaining */}
            <Text style={styles.timeText}>
              {timeRemaining > 0 ? `${timeRemaining}m` : '<1m'}
            </Text>
          </View>

          {/* Hold hint */}
          <Text style={styles.holdHint}>Hold to resonate</Text>
        </Animated.View>
      </GestureDetector>

      {/* Echo word popup */}
      {echoWord && (
        <Animated.View style={[styles.echoPopup, echoStyle]}>
          <Text style={[styles.echoPopupText, { color: config.colors.primary }]}>
            {echoWord}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  glowOverlay: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 30,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  progressRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 28,
    borderWidth: 2,
  },
  bubble: {
    backgroundColor: 'rgba(20, 20, 35, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  content: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resonanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resonanceIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  resonanceCount: {
    fontSize: 13,
    color: '#8b8b9a',
    fontWeight: '500',
  },
  echoesContainer: {
    flexDirection: 'row',
    flex: 1,
    marginHorizontal: 12,
    flexWrap: 'wrap',
    gap: 6,
  },
  echoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  echoText: {
    fontSize: 11,
    fontWeight: '500',
    marginRight: 4,
  },
  echoCount: {
    fontSize: 10,
    color: '#6b6b7a',
  },
  timeText: {
    fontSize: 11,
    color: '#5a5a6a',
  },
  holdHint: {
    fontSize: 10,
    color: '#4a4a5a',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  echoPopup: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -25,
    width: 100,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 25,
  },
  echoPopupText: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});

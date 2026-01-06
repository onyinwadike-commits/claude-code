import React, { useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
  FadeIn,
  useAnimatedReaction,
  cancelAnimation,
} from 'react-native-reanimated';
import type { Confession, VoidType, EchoWord } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';
import { ConfessionBubble } from './ConfessionBubble';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Constants for drift calculation
const BASE_DRIFT_DURATION = 30000; // 30 seconds base duration
const MIN_DRIFT_DURATION = 15000; // Minimum 15 seconds
const MAX_DRIFT_DURATION = 60000; // Maximum 60 seconds
const CONTENT_LENGTH_FACTOR = 100; // Every 100 chars adds to duration
const BUBBLE_HEIGHT_ESTIMATE = 150; // Estimated bubble height
const TOP_SAFE_AREA = 140; // Space for header and stats
const BOTTOM_SAFE_AREA = 120; // Space for WhisperInput
const FADE_START_Y = 200; // Start fading when Y < this value

interface ConfessionRiverProps {
  confessions: Confession[];
  voidType: VoidType;
  onResonate: (id: string) => void;
  onEcho: (id: string, word: EchoWord) => void;
  onConfessionExit?: (id: string) => void;
  glowingConfessionId?: string | null;
  echoEvent?: { confessionId: string; word: EchoWord } | null;
}

interface DriftingConfessionProps {
  confession: Confession;
  voidType: VoidType;
  index: number;
  driftSpeed: number;
  onResonate: (id: string) => void;
  onEcho: (id: string, word: EchoWord) => void;
  onExit: (id: string) => void;
  isGlowing: boolean;
  echoWord: EchoWord | null;
}

/**
 * Calculate drift duration based on content length and void's base speed
 */
function calculateDriftDuration(content: string, baseDriftSpeed: number): number {
  // Longer confessions drift slower (more time to read)
  const lengthBonus = Math.floor(content.length / CONTENT_LENGTH_FACTOR) * 5000;

  // Apply void's drift speed (higher speed = shorter duration)
  const speedMultiplier = 1 / Math.max(0.1, baseDriftSpeed);

  const duration = (BASE_DRIFT_DURATION + lengthBonus) * speedMultiplier;

  return Math.max(MIN_DRIFT_DURATION, Math.min(MAX_DRIFT_DURATION, duration));
}

/**
 * Individual drifting confession with its own animation
 */
function DriftingConfession({
  confession,
  voidType,
  index,
  driftSpeed,
  onResonate,
  onEcho,
  onExit,
  isGlowing,
  echoWord,
}: DriftingConfessionProps): React.JSX.Element {
  // Calculate drift duration based on content length and void speed
  const driftDuration = useMemo(
    () => calculateDriftDuration(confession.content, driftSpeed),
    [confession.content, driftSpeed]
  );

  // Starting Y position (staggered from bottom)
  const startY = SCREEN_HEIGHT - BOTTOM_SAFE_AREA + index * 20;
  // End Y position (above the top of visible area)
  const endY = -BUBBLE_HEIGHT_ESTIMATE - 50;

  // Animation value for Y position
  const translateY = useSharedValue(startY);

  // Track if confession has exited
  const hasExited = useSharedValue(false);

  // Callback when confession exits screen
  const handleExit = useCallback(() => {
    if (!hasExited.value) {
      hasExited.value = true;
      onExit(confession.id);
    }
  }, [confession.id, onExit, hasExited]);

  // Start drift animation
  useEffect(() => {
    // Small delay based on index for staggered entrance
    const entranceDelay = Math.min(index * 200, 1000);

    translateY.value = withDelay(
      entranceDelay,
      withTiming(endY, {
        duration: driftDuration,
        easing: Easing.linear,
      })
    );

    return () => {
      cancelAnimation(translateY);
    };
  }, [driftDuration, endY, index, translateY]);

  // Watch for confession exiting the screen
  useAnimatedReaction(
    () => translateY.value,
    (currentY) => {
      if (currentY <= endY + 10 && !hasExited.value) {
        runOnJS(handleExit)();
      }
    },
    [endY, handleExit]
  );

  // Animated style for the container
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Calculate current Y for opacity fade (passed to bubble)
  const currentYForFade = useSharedValue(startY);

  useAnimatedReaction(
    () => translateY.value,
    (value) => {
      currentYForFade.value = value;
    },
    []
  );

  return (
    <Animated.View style={[styles.driftingContainer, containerStyle]}>
      <ConfessionBubble
        confession={confession}
        voidType={voidType}
        onResonate={onResonate}
        onEcho={onEcho}
        isGlowing={isGlowing}
        echoWord={echoWord}
        currentY={translateY.value}
        fadeStartY={FADE_START_Y}
      />
    </Animated.View>
  );
}

export function ConfessionRiver({
  confessions,
  voidType,
  onResonate,
  onEcho,
  onConfessionExit,
  glowingConfessionId,
  echoEvent,
}: ConfessionRiverProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];
  const driftSpeed = config.defaultWeather.driftSpeed;

  // Handle confession exit
  const handleConfessionExit = useCallback(
    (id: string) => {
      onConfessionExit?.(id);
    },
    [onConfessionExit]
  );

  // Render empty state if no confessions
  if (confessions.length === 0) {
    return (
      <Animated.View entering={FadeIn.duration(500)} style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyEmoji}>🌌</Text>
          <Text style={styles.emptyTitle}>The void is listening...</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to release your confession
          </Text>

          {/* Floating particles hint */}
          <View style={styles.hintContainer}>
            <View style={[styles.hintDot, { backgroundColor: config.colors.primary }]} />
            <View
              style={[
                styles.hintDot,
                { backgroundColor: config.colors.primary, opacity: 0.6 },
              ]}
            />
            <View
              style={[
                styles.hintDot,
                { backgroundColor: config.colors.primary, opacity: 0.3 },
              ]}
            />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionText}>
              Tap a confession to echo
            </Text>
            <Text style={styles.instructionText}>
              Hold 1.5s to resonate
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Render each confession as independently drifting bubble */}
      {confessions.map((confession, index) => (
        <DriftingConfession
          key={confession.id}
          confession={confession}
          voidType={voidType}
          index={index}
          driftSpeed={driftSpeed}
          onResonate={onResonate}
          onEcho={onEcho}
          onExit={handleConfessionExit}
          isGlowing={glowingConfessionId === confession.id}
          echoWord={echoEvent?.confessionId === confession.id ? echoEvent.word : null}
        />
      ))}

      {/* Top fade gradient overlay */}
      <View style={styles.topFade} pointerEvents="none" />

      {/* Bottom fade gradient overlay */}
      <View style={styles.bottomFade} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  driftingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6b6b7a',
    textAlign: 'center',
    lineHeight: 22,
  },
  hintContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 8,
  },
  hintDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  instructionsContainer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#5a5a6a',
    fontStyle: 'italic',
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
    // Create gradient effect with multiple borders
    borderBottomWidth: 80,
    borderBottomColor: 'rgba(5, 5, 8, 0)',
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'transparent',
    // Simulated gradient from bottom
    borderTopWidth: 100,
    borderTopColor: 'rgba(5, 5, 8, 0.9)',
  },
});

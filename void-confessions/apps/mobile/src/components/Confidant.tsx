/**
 * Confidant Component
 *
 * Displays a compassionate AI-generated reflection after
 * a confession is released. Only available for Void Walker+ subscribers.
 *
 * The reflection:
 * - Never quotes or references the confession content
 * - Provides a single compassionate acknowledgment
 * - Fades away after being read
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { VoidType } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';
import { getConfidantReflection, type ConfidantResponse } from '../services/confidant';
import { useConfidantAI } from '../hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Reading time estimate: ~150 words per minute
const WORDS_PER_MINUTE = 150;
const MIN_DISPLAY_TIME = 4000; // 4 seconds minimum
const FADE_OUT_DELAY = 2000; // Extra time after reading

interface ConfidantProps {
  /** The content of the confession (analyzed locally, never sent) */
  confessionContent: string;
  /** The void type */
  voidType: VoidType;
  /** Called when the confidant message is dismissed */
  onDismiss: () => void;
  /** Skip loading and show immediately (for testing) */
  testReflection?: string;
}

type ConfidantState = 'loading' | 'revealing' | 'visible' | 'fading' | 'dismissed';

export function Confidant({
  confessionContent,
  voidType,
  onDismiss,
  testReflection,
}: ConfidantProps): React.JSX.Element | null {
  // Check feature access
  const { hasAccess } = useConfidantAI();

  // State
  const [state, setState] = useState<ConfidantState>('loading');
  const [reflection, setReflection] = useState<ConfidantResponse | null>(null);

  // Animation values
  const containerOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  const voidConfig = VOID_CONFIG[voidType];

  // Don't render if user doesn't have access
  if (!hasAccess) {
    return null;
  }

  // Calculate reading time based on word count
  const calculateReadingTime = useCallback((text: string): number => {
    const wordCount = text.split(/\s+/).length;
    const readingTime = (wordCount / WORDS_PER_MINUTE) * 60 * 1000;
    return Math.max(MIN_DISPLAY_TIME, readingTime) + FADE_OUT_DELAY;
  }, []);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setState('fading');
    containerOpacity.value = withTiming(0, { duration: 500 }, () => {
      runOnJS(onDismiss)();
    });
  }, [containerOpacity, onDismiss]);

  // Fetch reflection on mount
  useEffect(() => {
    let isMounted = true;

    const fetchReflection = async () => {
      try {
        // Use test reflection if provided
        if (testReflection) {
          if (isMounted) {
            setReflection({
              reflection: testReflection,
              voidType,
              timestamp: Date.now(),
            });
            setState('revealing');
          }
          return;
        }

        // Get AI reflection
        const response = await getConfidantReflection(confessionContent, voidType);

        if (isMounted) {
          setReflection(response);
          setState('revealing');
        }
      } catch (error) {
        console.error('[Confidant] Failed to get reflection:', error);
        if (isMounted) {
          onDismiss();
        }
      }
    };

    fetchReflection();

    return () => {
      isMounted = false;
    };
  }, [confessionContent, voidType, testReflection, onDismiss]);

  // Reveal animation
  useEffect(() => {
    if (state !== 'revealing' || !reflection) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate in
    containerOpacity.value = withTiming(1, { duration: 800 });
    glowIntensity.value = withSequence(
      withTiming(1, { duration: 1000 }),
      withTiming(0.5, { duration: 2000 })
    );
    textOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );

    // Start progress bar and auto-dismiss
    const displayTime = calculateReadingTime(reflection.reflection);

    progressWidth.value = withTiming(100, {
      duration: displayTime,
      easing: Easing.linear,
    });

    setState('visible');

    // Auto-dismiss after reading time
    const dismissTimeout = setTimeout(() => {
      handleDismiss();
    }, displayTime);

    return () => clearTimeout(dismissTimeout);
  }, [
    state,
    reflection,
    containerOpacity,
    textOpacity,
    glowIntensity,
    progressWidth,
    calculateReadingTime,
    handleDismiss,
  ]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value * 0.3,
    transform: [{ scale: 1 + glowIntensity.value * 0.1 }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Loading state
  if (state === 'loading' || !reflection) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.container, containerStyle]}
      >
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDot,
              {
                backgroundColor: voidConfig.colors.primary,
              },
            ]}
          />
          <Text style={styles.loadingText}>The void is listening...</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Ambient glow */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          { backgroundColor: voidConfig.colors.primary },
        ]}
      />

      {/* Content card */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={handleDismiss}
      >
        {/* Confidant icon */}
        <View style={[styles.iconContainer, { backgroundColor: voidConfig.colors.primary }]}>
          <Text style={styles.icon}>🕯️</Text>
        </View>

        {/* Label */}
        <Text style={styles.label}>The Confidant</Text>

        {/* Reflection text */}
        <Animated.Text style={[styles.reflection, textStyle]}>
          "{reflection.reflection}"
        </Animated.Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              progressStyle,
              { backgroundColor: voidConfig.colors.primary },
            ]}
          />
        </View>

        {/* Dismiss hint */}
        <Text style={styles.dismissHint}>Tap to dismiss</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * ConfidantToggle - Settings toggle for enabling/disabling Confidant
 */
interface ConfidantToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function ConfidantToggle({ enabled, onToggle }: ConfidantToggleProps): React.JSX.Element {
  const { hasAccess } = useConfidantAI();

  return (
    <TouchableOpacity
      style={styles.toggleContainer}
      onPress={() => hasAccess && onToggle(!enabled)}
      disabled={!hasAccess}
    >
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleIcon}>🕯️</Text>
        <View style={styles.toggleTextContainer}>
          <Text style={[styles.toggleTitle, !hasAccess && styles.toggleDisabled]}>
            Confidant
          </Text>
          <Text style={styles.toggleDescription}>
            {hasAccess
              ? 'Receive compassionate reflection after release'
              : 'Void Walker+ feature'}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.toggleSwitch,
          enabled && hasAccess && styles.toggleSwitchOn,
          !hasAccess && styles.toggleSwitchDisabled,
        ]}
      >
        <Animated.View
          style={[
            styles.toggleKnob,
            enabled && hasAccess && styles.toggleKnobOn,
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8b8b9a',
    fontStyle: 'italic',
  },
  glow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
  },
  card: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b8b9a',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
  },
  reflection: {
    fontSize: 20,
    lineHeight: 32,
    color: '#ffffff',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1.5,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
    opacity: 0.6,
  },
  dismissHint: {
    fontSize: 12,
    color: '#6b6b7a',
  },

  // Toggle styles
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginBottom: 12,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#8b8b9a',
  },
  toggleDisabled: {
    color: '#6b6b7a',
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3a3a4e',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchOn: {
    backgroundColor: '#7c3aed',
  },
  toggleSwitchDisabled: {
    opacity: 0.5,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
});

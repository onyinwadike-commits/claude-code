/**
 * BurnRelease Animation
 *
 * Text catches fire from bottom, burns upward, turns to ash particles that rise
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Rect,
  vec,
  BlurMask,
  useValue,
  useComputedValue,
  runTiming,
} from '@shopify/react-native-skia';
import { VOID_CONFIG } from '@void-confessions/core';
import type { ReleaseAnimationProps, Particle } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 60;
const ASH_COUNT = 40;

export function BurnRelease({
  text,
  voidType,
  onComplete,
  duration = 3000,
}: ReleaseAnimationProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];

  // Animation progress (0 to 1)
  const progress = useSharedValue(0);
  const burnProgress = useSharedValue(0);
  const ashProgress = useSharedValue(0);

  // Skia animation value
  const skiaProgress = useValue(0);

  // Fire colors
  const fireColors = useMemo(() => [
    '#ff4500', // Orange red
    '#ff6b35', // Orange
    '#ffaa00', // Yellow orange
    '#ffdd00', // Yellow
    config.colors.primary,
  ], [config.colors.primary]);

  // Generate fire particles
  const fireParticles = useMemo<Particle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: SCREEN_WIDTH * 0.2 + Math.random() * SCREEN_WIDTH * 0.6,
      y: SCREEN_HEIGHT * 0.5 + Math.random() * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: -2 - Math.random() * 4,
      size: 4 + Math.random() * 12,
      opacity: 0.6 + Math.random() * 0.4,
      rotation: Math.random() * 360,
      color: fireColors[Math.floor(Math.random() * fireColors.length)],
    }));
  }, [fireColors]);

  // Generate ash particles
  const ashParticles = useMemo<Particle[]>(() => {
    return Array.from({ length: ASH_COUNT }, (_, i) => ({
      id: i,
      x: SCREEN_WIDTH * 0.2 + Math.random() * SCREEN_WIDTH * 0.6,
      y: SCREEN_HEIGHT * 0.4,
      vx: (Math.random() - 0.5) * 3,
      vy: -1 - Math.random() * 2,
      size: 2 + Math.random() * 4,
      opacity: 0.8,
      rotation: Math.random() * 360,
      color: '#333333',
    }));
  }, []);

  // Start animation
  useEffect(() => {
    // Phase 1: Text glows and starts burning (0-30%)
    progress.value = withTiming(1, { duration, easing: Easing.linear });

    // Phase 1: Burn effect spreads (0-50%)
    burnProgress.value = withTiming(1, {
      duration: duration * 0.5,
      easing: Easing.in(Easing.cubic),
    });

    // Phase 2: Ash particles rise (30-100%)
    ashProgress.value = withDelay(
      duration * 0.3,
      withTiming(1, {
        duration: duration * 0.7,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Skia animation
    runTiming(skiaProgress, 1, { duration });

    // Complete callback
    const timeout = setTimeout(() => {
      onComplete();
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration, onComplete]);

  // Text container style with glow and burn effect
  const textContainerStyle = useAnimatedStyle(() => {
    const burn = burnProgress.value;

    return {
      opacity: interpolate(burn, [0, 0.3, 0.8, 1], [1, 1, 0.3, 0], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(burn, [0, 0.2, 0.5], [1, 1.02, 0.98], Extrapolation.CLAMP) },
      ],
    };
  });

  // Glow overlay style
  const glowStyle = useAnimatedStyle(() => {
    const burn = burnProgress.value;

    return {
      opacity: interpolate(burn, [0, 0.2, 0.6, 1], [0, 0.8, 0.4, 0], Extrapolation.CLAMP),
    };
  });

  // Burn mask style (reveals fire from bottom)
  const burnMaskStyle = useAnimatedStyle(() => {
    const burn = burnProgress.value;

    return {
      height: `${burn * 100}%`,
    };
  });

  // Compute particle positions
  const computedProgress = useComputedValue(() => skiaProgress.current, [skiaProgress]);

  return (
    <View style={styles.container}>
      {/* Fire particles canvas */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {fireParticles.map((particle, index) => {
            const delay = index * 0.01;
            const particleProgress = Math.max(0, Math.min(1, (computedProgress.current - delay) / 0.5));

            if (particleProgress <= 0) return null;

            const currentY = particle.y - particleProgress * 300;
            const currentX = particle.x + Math.sin(particleProgress * 10 + index) * 20;
            const currentOpacity = particle.opacity * (1 - particleProgress);
            const currentSize = particle.size * (1 + particleProgress * 0.5);

            return (
              <Circle
                key={particle.id}
                cx={currentX}
                cy={currentY}
                r={currentSize}
                color={particle.color}
                opacity={currentOpacity}
              >
                <BlurMask blur={currentSize * 0.5} style="normal" />
              </Circle>
            );
          })}
        </Group>

        {/* Ash particles */}
        <Group>
          {ashParticles.map((particle, index) => {
            const delay = 0.3 + index * 0.02;
            const particleProgress = Math.max(0, Math.min(1, (computedProgress.current - delay) / 0.7));

            if (particleProgress <= 0) return null;

            const currentY = particle.y - particleProgress * 400;
            const currentX = particle.x + Math.sin(particleProgress * 5 + index) * 30 + particle.vx * particleProgress * 50;
            const currentOpacity = 0.6 * (1 - particleProgress * 0.8);

            return (
              <Circle
                key={`ash-${particle.id}`}
                cx={currentX}
                cy={currentY}
                r={particle.size}
                color={particle.color}
                opacity={currentOpacity}
              />
            );
          })}
        </Group>
      </Canvas>

      {/* Text with burn effect */}
      <Animated.View style={[styles.textContainer, textContainerStyle]}>
        {/* Glow layer */}
        <Animated.View style={[styles.glowOverlay, glowStyle]}>
          <Text style={[styles.text, styles.glowText, { color: fireColors[0] }]}>
            {text}
          </Text>
        </Animated.View>

        {/* Main text */}
        <Text style={[styles.text, { color: '#ffffff' }]}>{text}</Text>

        {/* Burn gradient overlay */}
        <View style={styles.burnOverlayContainer}>
          <Animated.View style={[styles.burnGradient, burnMaskStyle]}>
            <View style={[styles.burnGradientInner, { backgroundColor: fireColors[0] }]} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  textContainer: {
    paddingHorizontal: 40,
    position: 'relative',
  },
  text: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 28,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowText: {
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  burnOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  burnGradient: {
    width: '100%',
    overflow: 'hidden',
  },
  burnGradientInner: {
    height: 100,
    opacity: 0.3,
  },
});

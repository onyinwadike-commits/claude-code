/**
 * ScreamRelease Animation
 *
 * Text vibrates violently with increasing intensity, then shoots up and out of view
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  withSpring,
  Easing,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
  LinearGradient,
  vec,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { VOID_CONFIG } from '@void-confessions/core';
import type { ReleaseAnimationProps, Particle } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHOCKWAVE_COUNT = 5;
const ENERGY_PARTICLE_COUNT = 30;

export function ScreamRelease({
  text,
  voidType,
  onComplete,
  duration = 2500,
}: ReleaseAnimationProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];

  // Animation values
  const vibrateProgress = useSharedValue(0);
  const vibrateIntensity = useSharedValue(0);
  const launchProgress = useSharedValue(0);
  const shockwaveProgress = useSharedValue(0);

  // Rage colors
  const rageColors = useMemo(() => [
    '#ff0000', // Red
    '#ff3333', // Light red
    '#ff6600', // Orange red
    '#ffcc00', // Yellow
    config.colors.primary,
  ], [config.colors.primary]);

  // Generate energy particles
  const energyParticles = useMemo<Particle[]>(() => {
    return Array.from({ length: ENERGY_PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: SCREEN_WIDTH * 0.3 + Math.random() * SCREEN_WIDTH * 0.4,
      y: SCREEN_HEIGHT * 0.45 + Math.random() * SCREEN_HEIGHT * 0.1,
      vx: (Math.random() - 0.5) * 100,
      vy: -300 - Math.random() * 500,
      size: 3 + Math.random() * 8,
      opacity: 0.6 + Math.random() * 0.4,
      rotation: 0,
      color: rageColors[Math.floor(Math.random() * rageColors.length)],
    }));
  }, [rageColors]);

  // Trigger haptics
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  // Start animation sequence
  useEffect(() => {
    // Phase 1: Build up vibration (0-60%)
    vibrateProgress.value = withTiming(1, {
      duration: duration * 0.6,
      easing: Easing.in(Easing.cubic),
    });

    // Vibration intensity ramps up
    vibrateIntensity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(-1, { duration: 50 })
      ),
      -1, // Infinite
      true
    );

    // Trigger haptics during vibration
    const hapticInterval = setInterval(() => {
      triggerHaptic();
    }, 100);

    // Phase 2: Launch upward (60-100%)
    launchProgress.value = withDelay(
      duration * 0.6,
      withTiming(1, {
        duration: duration * 0.4,
        easing: Easing.in(Easing.exp),
      })
    );

    // Shockwave on launch
    shockwaveProgress.value = withDelay(
      duration * 0.55,
      withTiming(1, {
        duration: duration * 0.3,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Clear haptics and complete
    const timeout = setTimeout(() => {
      clearInterval(hapticInterval);
      onComplete();
    }, duration);

    return () => {
      clearInterval(hapticInterval);
      clearTimeout(timeout);
    };
  }, [duration, onComplete]);

  // Text container with vibration and launch
  const textContainerStyle = useAnimatedStyle(() => {
    const vibrate = vibrateProgress.value;
    const intensity = vibrateIntensity.value;
    const launch = launchProgress.value;

    // Vibration amplitude increases over time
    const vibrateAmount = vibrate * 15 * intensity;

    // Launch translation
    const launchY = interpolate(
      launch,
      [0, 0.3, 1],
      [0, -20, -SCREEN_HEIGHT],
      Extrapolation.CLAMP
    );

    return {
      opacity: interpolate(launch, [0.5, 0.8], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: launch < 0.3 ? vibrateAmount : 0 },
        { translateY: launchY },
        { scale: interpolate(vibrate, [0, 0.5, 1], [1, 1.05, 1.15], Extrapolation.CLAMP) },
        {
          rotate: `${launch < 0.3 ? vibrateAmount * 0.5 : 0}deg`,
        },
      ],
    };
  });

  // Glow effect that intensifies
  const glowStyle = useAnimatedStyle(() => {
    const vibrate = vibrateProgress.value;

    return {
      opacity: interpolate(vibrate, [0, 0.5, 1], [0, 0.5, 1], Extrapolation.CLAMP),
    };
  });

  // Shockwave rings
  const ShockwaveRing = ({ index }: { index: number }) => {
    const ringStyle = useAnimatedStyle(() => {
      const delay = index * 0.1;
      const progress = Math.max(0, Math.min(1, (shockwaveProgress.value - delay) / 0.5));

      const size = 50 + progress * 300;

      return {
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3 - progress * 2,
        borderColor: rageColors[index % rageColors.length],
        opacity: (1 - progress) * 0.8,
        transform: [
          { translateX: -size / 2 },
          { translateY: -size / 2 },
        ],
      };
    });

    return (
      <Animated.View
        style={[
          {
            left: SCREEN_WIDTH / 2,
            top: SCREEN_HEIGHT / 2,
          },
          ringStyle,
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Energy particles canvas */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {energyParticles.map((particle, index) => {
            // Particles launch with text
            const delay = 0.6 + index * 0.01;

            return (
              <Circle
                key={particle.id}
                cx={particle.x}
                cy={particle.y}
                r={particle.size}
                color={particle.color}
                opacity={particle.opacity * 0.8}
              >
                <BlurMask blur={particle.size * 0.5} style="normal" />
              </Circle>
            );
          })}
        </Group>
      </Canvas>

      {/* Shockwave rings */}
      {Array.from({ length: SHOCKWAVE_COUNT }).map((_, i) => (
        <ShockwaveRing key={i} index={i} />
      ))}

      {/* Vibrating text */}
      <Animated.View style={[styles.textContainer, textContainerStyle]}>
        {/* Intense glow */}
        <Animated.View style={[styles.glowOverlay, glowStyle]}>
          <Text
            style={[
              styles.text,
              styles.glowText,
              { color: rageColors[0], textShadowColor: rageColors[0] },
            ]}
          >
            {text}
          </Text>
        </Animated.View>

        {/* Secondary glow layer */}
        <Animated.View style={[styles.glowOverlay, glowStyle, { opacity: 0.5 }]}>
          <Text
            style={[
              styles.text,
              styles.glowText,
              { color: rageColors[1], textShadowColor: rageColors[1] },
            ]}
          >
            {text}
          </Text>
        </Animated.View>

        {/* Main text */}
        <Text style={[styles.text, { color: '#ffffff' }]}>{text}</Text>
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
    fontWeight: '700',
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
    textShadowRadius: 30,
  },
});

/**
 * ShatterRelease Animation
 *
 * Text freezes with ice effect, cracks appear, then crumbles into fragments
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Canvas,
  Path,
  Group,
  LinearGradient,
  vec,
  Skia,
  BlurMask,
  Rect,
} from '@shopify/react-native-skia';
import { VOID_CONFIG } from '@void-confessions/core';
import type { ReleaseAnimationProps, TextFragment } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FRAGMENT_COUNT = 25;
const CRACK_COUNT = 8;

interface CrackLine {
  id: number;
  path: string;
  delay: number;
}

export function ShatterRelease({
  text,
  voidType,
  onComplete,
  duration = 3000,
}: ReleaseAnimationProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];

  // Animation progress values
  const freezeProgress = useSharedValue(0);
  const crackProgress = useSharedValue(0);
  const shatterProgress = useSharedValue(0);

  // Ice colors
  const iceColors = useMemo(() => [
    '#a8d8ff', // Light ice blue
    '#7cc4ff', // Ice blue
    '#5bb5ff', // Medium ice
    '#ffffff', // White frost
    config.colors.primary,
  ], [config.colors.primary]);

  // Generate crack lines
  const crackLines = useMemo<CrackLine[]>(() => {
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;

    return Array.from({ length: CRACK_COUNT }, (_, i) => {
      const angle = (i / CRACK_COUNT) * Math.PI * 2;
      const length = 50 + Math.random() * 100;
      const endX = centerX + Math.cos(angle) * length;
      const endY = centerY + Math.sin(angle) * length;

      // Create jagged path
      let path = `M ${centerX} ${centerY}`;
      const segments = 3 + Math.floor(Math.random() * 3);
      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        const x = centerX + (endX - centerX) * t + (Math.random() - 0.5) * 20;
        const y = centerY + (endY - centerY) * t + (Math.random() - 0.5) * 20;
        path += ` L ${x} ${y}`;
      }

      return {
        id: i,
        path,
        delay: i * 0.05,
      };
    });
  }, []);

  // Generate text fragments for shatter effect
  const fragments = useMemo<TextFragment[]>(() => {
    return Array.from({ length: FRAGMENT_COUNT }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 200 + Math.random() * 300;
      return {
        id: i,
        char: '',
        x: SCREEN_WIDTH * 0.3 + Math.random() * SCREEN_WIDTH * 0.4,
        y: SCREEN_HEIGHT * 0.4 + Math.random() * SCREEN_HEIGHT * 0.2,
        targetX: Math.cos(angle) * velocity,
        targetY: Math.sin(angle) * velocity + 200, // Add gravity
        rotation: (Math.random() - 0.5) * 720,
        scale: 0.3 + Math.random() * 0.7,
        delay: 0.5 + Math.random() * 0.2,
      };
    });
  }, []);

  // Start animation sequence
  useEffect(() => {
    // Phase 1: Freeze effect (0-25%)
    freezeProgress.value = withTiming(1, {
      duration: duration * 0.25,
      easing: Easing.out(Easing.cubic),
    });

    // Phase 2: Cracks appear (25-50%)
    crackProgress.value = withDelay(
      duration * 0.25,
      withTiming(1, {
        duration: duration * 0.25,
        easing: Easing.in(Easing.cubic),
      })
    );

    // Phase 3: Shatter and fall (50-100%)
    shatterProgress.value = withDelay(
      duration * 0.5,
      withTiming(1, {
        duration: duration * 0.5,
        easing: Easing.in(Easing.quad),
      })
    );

    // Complete callback
    const timeout = setTimeout(() => {
      onComplete();
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration, onComplete]);

  // Frozen text style
  const frozenTextStyle = useAnimatedStyle(() => {
    const freeze = freezeProgress.value;
    const shatter = shatterProgress.value;

    return {
      opacity: interpolate(shatter, [0, 0.2, 0.5], [1, 0.8, 0], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(freeze, [0, 0.5, 1], [1, 1.02, 1], Extrapolation.CLAMP) },
        {
          translateY: interpolate(
            shatter,
            [0, 0.3, 1],
            [0, 5, 50],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  // Ice overlay style
  const iceOverlayStyle = useAnimatedStyle(() => {
    const freeze = freezeProgress.value;
    const shatter = shatterProgress.value;

    return {
      opacity: interpolate(
        freeze,
        [0, 0.5, 1],
        [0, 0.3, 0.6],
        Extrapolation.CLAMP
      ) * (1 - shatter),
    };
  });

  // Frost crystals style
  const frostStyle = useAnimatedStyle(() => {
    const freeze = freezeProgress.value;

    return {
      opacity: interpolate(freeze, [0.3, 0.8, 1], [0, 0.4, 0.6], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(freeze, [0.3, 1], [0.8, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  // Create animated fragment components
  const AnimatedFragment = ({ fragment }: { fragment: TextFragment }) => {
    const fragmentStyle = useAnimatedStyle(() => {
      const progress = Math.max(0, shatterProgress.value);
      const t = Math.min(1, progress / 0.8);

      return {
        position: 'absolute',
        left: fragment.x,
        top: fragment.y,
        width: 20 + fragment.scale * 30,
        height: 15 + fragment.scale * 20,
        backgroundColor: iceColors[Math.floor(Math.random() * 3)],
        opacity: interpolate(t, [0, 0.3, 0.8, 1], [0, 1, 0.5, 0], Extrapolation.CLAMP),
        transform: [
          { translateX: fragment.targetX * t },
          { translateY: fragment.targetY * t + 200 * t * t }, // Gravity
          { rotate: `${fragment.rotation * t}deg` },
          { scale: fragment.scale * (1 - t * 0.5) },
        ],
      };
    });

    return <Animated.View style={fragmentStyle} />;
  };

  return (
    <View style={styles.container}>
      {/* Crack lines canvas */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {crackLines.map((crack) => {
            const skiaPath = Skia.Path.MakeFromSVGString(crack.path);
            if (!skiaPath) return null;

            return (
              <Path
                key={crack.id}
                path={skiaPath}
                color="#ffffff"
                style="stroke"
                strokeWidth={2}
                opacity={0.8}
              >
                <BlurMask blur={1} style="normal" />
              </Path>
            );
          })}
        </Group>

        {/* Ice shards background */}
        <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          <LinearGradient
            start={vec(0, SCREEN_HEIGHT * 0.3)}
            end={vec(0, SCREEN_HEIGHT * 0.7)}
            colors={['transparent', 'rgba(168, 216, 255, 0.1)', 'transparent']}
          />
        </Rect>
      </Canvas>

      {/* Fragment pieces */}
      {fragments.map((fragment) => (
        <AnimatedFragment key={fragment.id} fragment={fragment} />
      ))}

      {/* Frozen text */}
      <Animated.View style={[styles.textContainer, frozenTextStyle]}>
        {/* Ice overlay */}
        <Animated.View style={[styles.iceOverlay, iceOverlayStyle]}>
          <View style={[styles.iceGradient, { backgroundColor: iceColors[0] }]} />
        </Animated.View>

        {/* Frost crystals overlay */}
        <Animated.View style={[styles.frostOverlay, frostStyle]}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.frostCrystal,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: 2 + Math.random() * 4,
                  height: 2 + Math.random() * 4,
                  transform: [{ rotate: `${Math.random() * 45}deg` }],
                },
              ]}
            />
          ))}
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
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(168, 216, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  iceOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iceGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  frostOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  frostCrystal: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    opacity: 0.8,
  },
});

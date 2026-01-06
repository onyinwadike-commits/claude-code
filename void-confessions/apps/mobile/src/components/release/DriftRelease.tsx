/**
 * DriftRelease Animation
 *
 * Text breaks apart into leaf-like fragments that drift away on a gentle breeze
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Canvas,
  Path,
  Group,
  Skia,
  BlurMask,
} from '@shopify/react-native-skia';
import { VOID_CONFIG } from '@void-confessions/core';
import type { ReleaseAnimationProps } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LEAF_COUNT = 35;

interface Leaf {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  driftX: number;
  driftY: number;
  wobblePhase: number;
  wobbleAmplitude: number;
  color: string;
  delay: number;
}

export function DriftRelease({
  text,
  voidType,
  onComplete,
  duration = 4000,
}: ReleaseAnimationProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];

  // Animation values
  const fadeProgress = useSharedValue(0);
  const driftProgress = useSharedValue(0);
  const windProgress = useSharedValue(0);

  // Longing/nature colors
  const leafColors = useMemo(() => [
    '#8fbc8f', // Dark sea green
    '#98d198', // Light green
    '#7eb37e', // Medium green
    '#b8d4b8', // Pale green
    '#a0c4a0', // Sage
    config.colors.primary,
  ], [config.colors.primary]);

  // Generate leaves
  const leaves = useMemo<Leaf[]>(() => {
    return Array.from({ length: LEAF_COUNT }, (_, i) => {
      const angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25; // Mostly rightward
      const speed = 100 + Math.random() * 200;

      return {
        id: i,
        x: SCREEN_WIDTH * 0.2 + Math.random() * SCREEN_WIDTH * 0.6,
        y: SCREEN_HEIGHT * 0.4 + Math.random() * SCREEN_HEIGHT * 0.2,
        size: 8 + Math.random() * 12,
        rotation: Math.random() * 360,
        driftX: Math.cos(angle) * speed,
        driftY: Math.sin(angle) * speed - 50, // Slight upward bias
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleAmplitude: 20 + Math.random() * 30,
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        delay: Math.random() * 0.3,
      };
    });
  }, [leafColors]);

  // Create leaf SVG path
  const createLeafPath = (size: number) => {
    // Simple leaf shape
    return `M 0 ${-size / 2}
            Q ${size / 3} ${-size / 4} ${size / 2} 0
            Q ${size / 3} ${size / 4} 0 ${size / 2}
            Q ${-size / 3} ${size / 4} ${-size / 2} 0
            Q ${-size / 3} ${-size / 4} 0 ${-size / 2} Z`;
  };

  // Start animation sequence
  useEffect(() => {
    // Phase 1: Text fades and fragments (0-30%)
    fadeProgress.value = withTiming(1, {
      duration: duration * 0.3,
      easing: Easing.in(Easing.cubic),
    });

    // Phase 2: Leaves drift (20-100%)
    driftProgress.value = withDelay(
      duration * 0.2,
      withTiming(1, {
        duration: duration * 0.8,
        easing: Easing.out(Easing.quad),
      })
    );

    // Wind wobble animation
    windProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    const timeout = setTimeout(() => {
      onComplete();
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration, onComplete]);

  // Fading text style
  const textStyle = useAnimatedStyle(() => {
    const fade = fadeProgress.value;

    return {
      opacity: interpolate(fade, [0, 0.5, 1], [1, 0.5, 0], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(fade, [0, 1], [1, 0.95], Extrapolation.CLAMP),
        },
      ],
    };
  });

  // Individual leaf component
  const LeafComponent = ({ leaf }: { leaf: Leaf }) => {
    const leafStyle = useAnimatedStyle(() => {
      const delay = leaf.delay;
      const t = Math.max(0, Math.min(1, (driftProgress.value - delay) / (1 - delay)));
      const wind = windProgress.value;

      // Wobble motion
      const wobbleX = Math.sin(t * Math.PI * 4 + leaf.wobblePhase) * leaf.wobbleAmplitude * (1 - t * 0.5);
      const wobbleY = Math.cos(t * Math.PI * 3 + leaf.wobblePhase) * leaf.wobbleAmplitude * 0.5;

      // Drift position
      const currentX = leaf.x + leaf.driftX * t + wobbleX + wind * 30;
      const currentY = leaf.y + leaf.driftY * t + wobbleY;

      // Rotation that changes over time
      const rotation = leaf.rotation + t * 360 * (leaf.id % 2 === 0 ? 1 : -1);

      return {
        position: 'absolute',
        left: currentX - leaf.size / 2,
        top: currentY - leaf.size / 2,
        width: leaf.size,
        height: leaf.size,
        opacity: interpolate(t, [0, 0.1, 0.7, 1], [0, 1, 0.8, 0], Extrapolation.CLAMP),
        transform: [
          { rotate: `${rotation}deg` },
          { scaleX: 0.6 + Math.sin(t * Math.PI * 2) * 0.2 }, // Flutter effect
        ],
      };
    });

    return (
      <Animated.View style={leafStyle}>
        <View
          style={[
            styles.leaf,
            {
              backgroundColor: leaf.color,
              width: leaf.size,
              height: leaf.size * 1.5,
              borderRadius: leaf.size / 2,
            },
          ]}
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Leaf particles in canvas for blur effect */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {leaves.slice(0, 15).map((leaf) => {
            const pathString = createLeafPath(leaf.size);
            const skiaPath = Skia.Path.MakeFromSVGString(pathString);
            if (!skiaPath) return null;

            // Offset to center area
            skiaPath.offset(leaf.x, leaf.y + 50);

            return (
              <Path
                key={`canvas-${leaf.id}`}
                path={skiaPath}
                color={leaf.color}
                opacity={0.3}
              >
                <BlurMask blur={4} style="normal" />
              </Path>
            );
          })}
        </Group>
      </Canvas>

      {/* Animated leaves */}
      {leaves.map((leaf) => (
        <LeafComponent key={leaf.id} leaf={leaf} />
      ))}

      {/* Fading text */}
      <Animated.View style={[styles.textContainer, textStyle]}>
        {/* Soft glow */}
        <View style={styles.glowOverlay}>
          <Text
            style={[
              styles.text,
              styles.glowText,
              { color: leafColors[0], textShadowColor: leafColors[1] },
            ]}
          >
            {text}
          </Text>
        </View>

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
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowText: {
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  leaf: {
    transform: [{ rotate: '45deg' }],
  },
});

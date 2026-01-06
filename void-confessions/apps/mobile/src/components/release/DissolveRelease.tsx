/**
 * DissolveRelease Animation
 *
 * Text melts and dissolves like ink dropped in water, with flowing tendrils
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
  Path,
  Skia,
  LinearGradient,
  vec,
} from '@shopify/react-native-skia';
import { VOID_CONFIG } from '@void-confessions/core';
import type { ReleaseAnimationProps, Particle } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const INK_DROP_COUNT = 40;
const TENDRIL_COUNT = 12;

interface InkTendril {
  id: number;
  startX: number;
  startY: number;
  path: string;
  delay: number;
}

export function DissolveRelease({
  text,
  voidType,
  onComplete,
  duration = 3500,
}: ReleaseAnimationProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];

  // Animation values
  const meltProgress = useSharedValue(0);
  const inkSpreadProgress = useSharedValue(0);
  const fadeProgress = useSharedValue(0);

  // Guilt/water colors
  const inkColors = useMemo(() => [
    '#1a1a2e', // Deep ink
    '#2d2d44', // Dark blue-gray
    '#3d3d5c', // Medium ink
    '#4a4a6a', // Lighter ink
    config.colors.primary,
  ], [config.colors.primary]);

  // Generate ink drops
  const inkDrops = useMemo<Particle[]>(() => {
    return Array.from({ length: INK_DROP_COUNT }, (_, i) => ({
      id: i,
      x: SCREEN_WIDTH * 0.2 + Math.random() * SCREEN_WIDTH * 0.6,
      y: SCREEN_HEIGHT * 0.45 + Math.random() * 50,
      vx: (Math.random() - 0.5) * 100,
      vy: 50 + Math.random() * 150,
      size: 5 + Math.random() * 15,
      opacity: 0.4 + Math.random() * 0.4,
      rotation: 0,
      color: inkColors[Math.floor(Math.random() * inkColors.length)],
    }));
  }, [inkColors]);

  // Generate flowing tendrils
  const tendrils = useMemo<InkTendril[]>(() => {
    return Array.from({ length: TENDRIL_COUNT }, (_, i) => {
      const startX = SCREEN_WIDTH * 0.3 + (i / TENDRIL_COUNT) * SCREEN_WIDTH * 0.4;
      const startY = SCREEN_HEIGHT * 0.5;

      // Create flowing bezier path
      const cp1X = startX + (Math.random() - 0.5) * 80;
      const cp1Y = startY + 50 + Math.random() * 50;
      const cp2X = startX + (Math.random() - 0.5) * 120;
      const cp2Y = startY + 150 + Math.random() * 100;
      const endX = startX + (Math.random() - 0.5) * 150;
      const endY = startY + 300 + Math.random() * 200;

      const path = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

      return {
        id: i,
        startX,
        startY,
        path,
        delay: i * 0.05,
      };
    });
  }, []);

  // Start animation sequence
  useEffect(() => {
    // Phase 1: Melt effect (0-40%)
    meltProgress.value = withTiming(1, {
      duration: duration * 0.4,
      easing: Easing.in(Easing.cubic),
    });

    // Phase 2: Ink spreads (20-80%)
    inkSpreadProgress.value = withDelay(
      duration * 0.2,
      withTiming(1, {
        duration: duration * 0.6,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Phase 3: Fade away (60-100%)
    fadeProgress.value = withDelay(
      duration * 0.6,
      withTiming(1, {
        duration: duration * 0.4,
        easing: Easing.out(Easing.quad),
      })
    );

    const timeout = setTimeout(() => {
      onComplete();
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration, onComplete]);

  // Melting text style
  const meltingTextStyle = useAnimatedStyle(() => {
    const melt = meltProgress.value;

    return {
      opacity: interpolate(melt, [0, 0.3, 0.8, 1], [1, 0.9, 0.4, 0], Extrapolation.CLAMP),
      transform: [
        {
          scaleY: interpolate(melt, [0, 0.5, 1], [1, 1.1, 1.5], Extrapolation.CLAMP),
        },
        {
          scaleX: interpolate(melt, [0, 0.5, 1], [1, 0.95, 0.8], Extrapolation.CLAMP),
        },
        {
          translateY: interpolate(melt, [0, 1], [0, 30], Extrapolation.CLAMP),
        },
      ],
    };
  });

  // Water ripple overlay
  const rippleStyle = useAnimatedStyle(() => {
    const spread = inkSpreadProgress.value;

    return {
      opacity: interpolate(spread, [0, 0.3, 0.8, 1], [0, 0.3, 0.2, 0], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(spread, [0, 1], [0.5, 2], Extrapolation.CLAMP) },
      ],
    };
  });

  // Ink drip component
  const InkDrop = ({ drop, index }: { drop: Particle; index: number }) => {
    const dropStyle = useAnimatedStyle(() => {
      const delay = 0.2 + index * 0.02;
      const t = Math.max(0, Math.min(1, (inkSpreadProgress.value - delay) / 0.6));
      const fade = fadeProgress.value;

      const currentY = drop.y + drop.vy * t;
      const currentX = drop.x + drop.vx * t + Math.sin(t * Math.PI * 2) * 20;
      const spread = 1 + t * 0.5;

      return {
        position: 'absolute',
        left: currentX - drop.size * spread / 2,
        top: currentY - drop.size * spread / 2,
        width: drop.size * spread,
        height: drop.size * spread * (1 + t * 0.5), // Elongate as it falls
        borderRadius: drop.size * spread / 2,
        backgroundColor: drop.color,
        opacity: drop.opacity * (1 - t * 0.5) * (1 - fade),
      };
    });

    return <Animated.View style={dropStyle} />;
  };

  return (
    <View style={styles.container}>
      {/* Ink tendrils canvas */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {tendrils.map((tendril) => {
            const skiaPath = Skia.Path.MakeFromSVGString(tendril.path);
            if (!skiaPath) return null;

            return (
              <Path
                key={tendril.id}
                path={skiaPath}
                color={inkColors[tendril.id % inkColors.length]}
                style="stroke"
                strokeWidth={4 + Math.random() * 4}
                opacity={0.5}
              >
                <BlurMask blur={8} style="normal" />
              </Path>
            );
          })}

          {/* Larger ink blobs */}
          {inkDrops.slice(0, 15).map((drop) => (
            <Circle
              key={`blob-${drop.id}`}
              cx={drop.x}
              cy={drop.y + 100}
              r={drop.size * 1.5}
              color={drop.color}
              opacity={0.4}
            >
              <BlurMask blur={drop.size} style="normal" />
            </Circle>
          ))}
        </Group>
      </Canvas>

      {/* Ink drops */}
      {inkDrops.map((drop, index) => (
        <InkDrop key={drop.id} drop={drop} index={index} />
      ))}

      {/* Water ripple effect */}
      <Animated.View style={[styles.rippleContainer, rippleStyle]}>
        <View style={[styles.ripple, { borderColor: inkColors[2] }]} />
        <View style={[styles.ripple, styles.rippleInner, { borderColor: inkColors[3] }]} />
      </Animated.View>

      {/* Melting text */}
      <Animated.View style={[styles.textContainer, meltingTextStyle]}>
        {/* Blur/dissolve overlay */}
        <View style={styles.dissolveOverlay}>
          <Text
            style={[
              styles.text,
              {
                color: inkColors[0],
                textShadowColor: inkColors[1],
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 10,
              },
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
  dissolveOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rippleContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 200,
    height: 100,
    borderRadius: 100,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  rippleInner: {
    width: 140,
    height: 70,
    borderRadius: 70,
  },
});

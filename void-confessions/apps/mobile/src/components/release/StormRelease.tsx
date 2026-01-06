/**
 * StormRelease Animation
 *
 * Lightning cracks across the text, illuminating it in flashes before dispersing
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import {
  Canvas,
  Path,
  Group,
  BlurMask,
  Skia,
  Circle,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { VOID_CONFIG } from '@void-confessions/core';
import type { ReleaseAnimationProps, Particle } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LIGHTNING_COUNT = 6;
const SPARK_COUNT = 30;

interface LightningBolt {
  id: number;
  path: string;
  delay: number;
  duration: number;
}

export function StormRelease({
  text,
  voidType,
  onComplete,
  duration = 3000,
}: ReleaseAnimationProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];
  const [lightningFlash, setLightningFlash] = useState(false);

  // Animation values
  const stormProgress = useSharedValue(0);
  const flashProgress = useSharedValue(0);
  const disperseProgress = useSharedValue(0);

  // Storm colors
  const stormColors = useMemo(() => [
    '#ffffff', // White lightning
    '#e0e0ff', // Blue-white
    '#c0c0ff', // Light purple
    '#8080ff', // Purple
    config.colors.primary,
  ], [config.colors.primary]);

  // Generate lightning bolt paths
  const lightningBolts = useMemo<LightningBolt[]>(() => {
    return Array.from({ length: LIGHTNING_COUNT }, (_, i) => {
      const startX = SCREEN_WIDTH * 0.3 + (i / LIGHTNING_COUNT) * SCREEN_WIDTH * 0.4;
      const startY = SCREEN_HEIGHT * 0.2;
      const endY = SCREEN_HEIGHT * 0.5 + Math.random() * 50;

      // Create jagged lightning path
      let path = `M ${startX} ${startY}`;
      let currentX = startX;
      let currentY = startY;
      const segments = 6 + Math.floor(Math.random() * 4);

      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        const targetY = startY + (endY - startY) * t;
        const offsetX = (Math.random() - 0.5) * 60;
        currentX = startX + offsetX;
        currentY = targetY;
        path += ` L ${currentX} ${currentY}`;

        // Add branch occasionally
        if (Math.random() > 0.6 && j < segments - 1) {
          const branchLength = 30 + Math.random() * 40;
          const branchAngle = (Math.random() - 0.5) * Math.PI / 2;
          const branchX = currentX + Math.cos(branchAngle) * branchLength;
          const branchY = currentY + Math.sin(branchAngle) * branchLength * 0.5 + branchLength * 0.5;
          path += ` M ${currentX} ${currentY} L ${branchX} ${branchY} M ${currentX} ${currentY}`;
        }
      }

      return {
        id: i,
        path,
        delay: 0.1 + i * 0.15,
        duration: 0.1 + Math.random() * 0.1,
      };
    });
  }, []);

  // Generate sparks
  const sparks = useMemo<Particle[]>(() => {
    return Array.from({ length: SPARK_COUNT }, (_, i) => ({
      id: i,
      x: SCREEN_WIDTH * 0.3 + Math.random() * SCREEN_WIDTH * 0.4,
      y: SCREEN_HEIGHT * 0.45 + Math.random() * SCREEN_HEIGHT * 0.1,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      size: 2 + Math.random() * 4,
      opacity: 0.8 + Math.random() * 0.2,
      rotation: 0,
      color: stormColors[Math.floor(Math.random() * 2)], // White or blue-white
    }));
  }, [stormColors]);

  // Trigger haptic and flash
  const triggerLightning = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLightningFlash(true);
    setTimeout(() => setLightningFlash(false), 80);
  };

  // Start animation sequence
  useEffect(() => {
    // Overall progress
    stormProgress.value = withTiming(1, {
      duration,
      easing: Easing.linear,
    });

    // Flash sequence - multiple strikes
    const flashSequence = withSequence(
      withDelay(duration * 0.1, withTiming(1, { duration: 50 })),
      withTiming(0, { duration: 100 }),
      withDelay(duration * 0.15, withTiming(1, { duration: 50 })),
      withTiming(0, { duration: 100 }),
      withDelay(duration * 0.1, withTiming(1, { duration: 50 })),
      withTiming(0, { duration: 150 }),
      withDelay(duration * 0.05, withTiming(1, { duration: 80 })),
      withTiming(0, { duration: 200 })
    );
    flashProgress.value = flashSequence;

    // Trigger haptics on strikes
    const strikeTimings = [
      duration * 0.1,
      duration * 0.35,
      duration * 0.55,
      duration * 0.7,
    ];
    const timeouts = strikeTimings.map((time) =>
      setTimeout(() => triggerLightning(), time)
    );

    // Disperse at end
    disperseProgress.value = withDelay(
      duration * 0.7,
      withTiming(1, {
        duration: duration * 0.3,
        easing: Easing.out(Easing.cubic),
      })
    );

    const completeTimeout = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(completeTimeout);
    };
  }, [duration, onComplete]);

  // Text with lightning illumination
  const textStyle = useAnimatedStyle(() => {
    const flash = flashProgress.value;
    const disperse = disperseProgress.value;

    return {
      opacity: interpolate(disperse, [0, 0.5, 1], [1, 0.5, 0], Extrapolation.CLAMP),
      transform: [
        { scale: 1 + flash * 0.05 },
        {
          translateY: interpolate(
            disperse,
            [0, 1],
            [0, -100],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  // Flash overlay
  const flashOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: flashProgress.value * 0.3,
    };
  });

  // Glow during flash
  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: flashProgress.value * 0.8,
    };
  });

  // Spark component
  const Spark = ({ spark, index }: { spark: Particle; index: number }) => {
    const sparkStyle = useAnimatedStyle(() => {
      const delay = 0.5 + index * 0.02;
      const t = Math.max(0, Math.min(1, (disperseProgress.value - delay + 0.5) / 0.5));

      return {
        position: 'absolute',
        left: spark.x + spark.vx * t,
        top: spark.y + spark.vy * t,
        width: spark.size,
        height: spark.size,
        borderRadius: spark.size / 2,
        backgroundColor: spark.color,
        opacity: spark.opacity * (1 - t),
      };
    });

    return <Animated.View style={sparkStyle} />;
  };

  return (
    <View style={styles.container}>
      {/* Screen flash overlay */}
      {lightningFlash && <View style={styles.screenFlash} />}
      <Animated.View
        style={[styles.flashOverlay, flashOverlayStyle]}
        pointerEvents="none"
      />

      {/* Lightning bolts canvas */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {lightningBolts.map((bolt) => {
            const skiaPath = Skia.Path.MakeFromSVGString(bolt.path);
            if (!skiaPath) return null;

            return (
              <Group key={bolt.id}>
                {/* Outer glow */}
                <Path
                  path={skiaPath}
                  color={stormColors[2]}
                  style="stroke"
                  strokeWidth={8}
                  opacity={0.3}
                >
                  <BlurMask blur={10} style="normal" />
                </Path>
                {/* Inner bright line */}
                <Path
                  path={skiaPath}
                  color={stormColors[0]}
                  style="stroke"
                  strokeWidth={3}
                  opacity={0.9}
                >
                  <BlurMask blur={2} style="normal" />
                </Path>
              </Group>
            );
          })}

          {/* Electric sparks */}
          {sparks.slice(0, 15).map((spark) => (
            <Circle
              key={`spark-${spark.id}`}
              cx={spark.x}
              cy={spark.y}
              r={spark.size}
              color={spark.color}
              opacity={0.8}
            >
              <BlurMask blur={spark.size} style="normal" />
            </Circle>
          ))}
        </Group>
      </Canvas>

      {/* Sparks */}
      {sparks.map((spark, index) => (
        <Spark key={spark.id} spark={spark} index={index} />
      ))}

      {/* Text with electric glow */}
      <Animated.View style={[styles.textContainer, textStyle]}>
        {/* Electric glow layer */}
        <Animated.View style={[styles.glowOverlay, glowStyle]}>
          <Text
            style={[
              styles.text,
              styles.glowText,
              { color: stormColors[0], textShadowColor: stormColors[1] },
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
  screenFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(200, 200, 255, 0.2)',
  },
  textContainer: {
    paddingHorizontal: 40,
    position: 'relative',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
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
    textShadowRadius: 25,
  },
});

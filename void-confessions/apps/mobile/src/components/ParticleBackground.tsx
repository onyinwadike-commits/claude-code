import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, Platform } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  useValue,
  useComputedValue,
  runTiming,
  Easing,
  BlurMask,
} from '@shopify/react-native-skia';
import type { VoidType } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
}

interface ParticleBackgroundProps {
  voidType: VoidType;
  intensity?: number; // 0-1
  particleCount?: number;
}

/**
 * Skia-powered particle background effect
 */
export function ParticleBackground({
  voidType,
  intensity = 0.5,
  particleCount = 30,
}: ParticleBackgroundProps): React.JSX.Element | null {
  const config = VOID_CONFIG[voidType];
  const color = config.colors.primary;

  // Animation progress (0-1)
  const progress = useValue(0);

  // Generate particles
  const particles: Particle[] = React.useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 2 + Math.random() * 4,
      speed: 0.5 + Math.random() * 1.5,
      opacity: 0.1 + Math.random() * 0.4,
    }));
  }, [particleCount]);

  useEffect(() => {
    // Continuous animation loop
    const animate = () => {
      runTiming(progress, 1, {
        duration: 10000,
        easing: Easing.linear,
      });
    };

    animate();

    const interval = setInterval(() => {
      progress.current = 0;
      animate();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Compute particle positions based on progress
  const computedY = useComputedValue(() => {
    return progress.current;
  }, [progress]);

  // Skip rendering on web (Skia doesn't work well on web)
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <Canvas style={styles.canvas}>
      <Group>
        {particles.map((particle) => {
          const yOffset = particle.speed * height * intensity;
          const animatedY = (particle.y - yOffset + height) % height;

          return (
            <Circle
              key={particle.id}
              cx={particle.x}
              cy={animatedY}
              r={particle.radius}
              color={color}
              opacity={particle.opacity * intensity}
            >
              <BlurMask blur={particle.radius} style="normal" />
            </Circle>
          );
        })}
      </Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
});

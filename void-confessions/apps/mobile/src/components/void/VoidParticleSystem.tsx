import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions, Platform } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
  vec,
  useValue,
  useComputedValue,
  useTouchHandler,
  runTiming,
  Easing,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import type { VoidType, VoidWeatherState } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
}

interface VoidParticleSystemProps {
  voidType: VoidType;
  weather: VoidWeatherState | null;
  intensity?: number;
}

// Particle configurations per void type
const PARTICLE_CONFIGS: Record<VoidType, {
  count: number;
  type: 'rain' | 'ember' | 'fog' | 'firefly' | 'dust' | 'sparkle';
  baseSpeed: number;
  sizeRange: [number, number];
}> = {
  grief: { count: 60, type: 'rain', baseSpeed: 3, sizeRange: [1, 3] },
  rage: { count: 40, type: 'ember', baseSpeed: 2, sizeRange: [2, 5] },
  guilt: { count: 30, type: 'fog', baseSpeed: 0.5, sizeRange: [8, 20] },
  longing: { count: 25, type: 'firefly', baseSpeed: 0.8, sizeRange: [2, 4] },
  relief: { count: 35, type: 'sparkle', baseSpeed: 1.5, sizeRange: [2, 4] },
};

// Weather modifiers
const WEATHER_MODIFIERS: Record<string, { speedMult: number; countMult: number; opacityMult: number }> = {
  calm: { speedMult: 0.7, countMult: 0.5, opacityMult: 0.6 },
  serene: { speedMult: 0.5, countMult: 0.4, opacityMult: 0.5 },
  clearing: { speedMult: 0.8, countMult: 0.6, opacityMult: 0.7 },
  heavy: { speedMult: 1.2, countMult: 1.5, opacityMult: 0.9 },
  turbulent: { speedMult: 1.5, countMult: 1.8, opacityMult: 1.0 },
  stormy: { speedMult: 2.0, countMult: 2.0, opacityMult: 1.0 },
  hope: { speedMult: 1.0, countMult: 1.2, opacityMult: 0.8 },
  anger: { speedMult: 1.8, countMult: 1.5, opacityMult: 1.0 },
};

function createParticle(
  id: number,
  config: typeof PARTICLE_CONFIGS[VoidType],
  color: string,
  weatherMod: typeof WEATHER_MODIFIERS[string]
): Particle {
  const { type, baseSpeed, sizeRange } = config;
  const radius = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);

  let x = Math.random() * SCREEN_WIDTH;
  let y = Math.random() * SCREEN_HEIGHT;
  let vx = 0;
  let vy = 0;

  switch (type) {
    case 'rain':
      y = -radius * 2;
      vx = (Math.random() - 0.5) * 0.5;
      vy = baseSpeed * weatherMod.speedMult * (0.8 + Math.random() * 0.4);
      break;
    case 'ember':
      y = SCREEN_HEIGHT + radius * 2;
      vx = (Math.random() - 0.5) * 2;
      vy = -baseSpeed * weatherMod.speedMult * (0.8 + Math.random() * 0.4);
      break;
    case 'fog':
      vx = (Math.random() - 0.5) * baseSpeed * weatherMod.speedMult;
      vy = (Math.random() - 0.5) * baseSpeed * weatherMod.speedMult * 0.3;
      break;
    case 'firefly':
      vx = (Math.random() - 0.5) * baseSpeed * weatherMod.speedMult;
      vy = (Math.random() - 0.5) * baseSpeed * weatherMod.speedMult;
      break;
    case 'sparkle':
      vy = -baseSpeed * weatherMod.speedMult * (0.5 + Math.random() * 0.5);
      vx = (Math.random() - 0.5) * 0.5;
      break;
    case 'dust':
    default:
      vx = (Math.random() - 0.5) * baseSpeed * weatherMod.speedMult;
      vy = baseSpeed * weatherMod.speedMult * 0.2;
      break;
  }

  return {
    id,
    x,
    y,
    vx,
    vy,
    radius,
    opacity: (0.3 + Math.random() * 0.5) * weatherMod.opacityMult,
    life: 0,
    maxLife: 200 + Math.random() * 300,
    color,
  };
}

export function VoidParticleSystem({
  voidType,
  weather,
  intensity = 1,
}: VoidParticleSystemProps): React.JSX.Element | null {
  const config = VOID_CONFIG[voidType];
  const particleConfig = PARTICLE_CONFIGS[voidType];
  const weatherMod = weather
    ? WEATHER_MODIFIERS[weather.state] || WEATHER_MODIFIERS.calm
    : WEATHER_MODIFIERS.calm;

  const particleCount = Math.floor(particleConfig.count * weatherMod.countMult * intensity);

  // Animation clock
  const clock = useValue(0);

  // Initialize particles
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) =>
      createParticle(i, particleConfig, config.colors.primary, weatherMod)
    );
  }, [particleCount, voidType, weather?.state]);

  // Animation loop
  useEffect(() => {
    let frame = 0;
    let animationId: number;

    const animate = () => {
      frame++;
      clock.current = frame;

      // Update particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Firefly wobble
        if (particleConfig.type === 'firefly') {
          p.vx += (Math.random() - 0.5) * 0.1;
          p.vy += (Math.random() - 0.5) * 0.1;
          p.vx *= 0.99;
          p.vy *= 0.99;
          p.opacity = (0.2 + Math.sin(p.life * 0.05) * 0.4) * weatherMod.opacityMult;
        }

        // Ember flicker
        if (particleConfig.type === 'ember') {
          p.opacity = (0.4 + Math.random() * 0.4) * weatherMod.opacityMult;
          p.radius *= 0.998; // Shrink over time
        }

        // Sparkle twinkle
        if (particleConfig.type === 'sparkle') {
          p.opacity = (0.3 + Math.sin(p.life * 0.1) * 0.5) * weatherMod.opacityMult;
        }

        // Reset if out of bounds or life expired
        if (
          p.y > SCREEN_HEIGHT + p.radius * 2 ||
          p.y < -p.radius * 2 ||
          p.x < -p.radius * 2 ||
          p.x > SCREEN_WIDTH + p.radius * 2 ||
          p.life > p.maxLife
        ) {
          const newP = createParticle(p.id, particleConfig, config.colors.primary, weatherMod);
          Object.assign(p, newP);
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [particles, particleConfig.type, weatherMod]);

  // Skip on web
  if (Platform.OS === 'web') {
    return null;
  }

  const renderParticle = (particle: Particle) => {
    const { type } = particleConfig;

    if (type === 'rain') {
      // Rain drops as elongated shapes
      const path = Skia.Path.Make();
      path.moveTo(particle.x, particle.y);
      path.lineTo(particle.x + particle.vx * 3, particle.y + particle.vy * 3);
      return (
        <Path
          key={particle.id}
          path={path}
          color={particle.color}
          style="stroke"
          strokeWidth={particle.radius}
          opacity={particle.opacity}
        />
      );
    }

    if (type === 'fog') {
      return (
        <Circle
          key={particle.id}
          cx={particle.x}
          cy={particle.y}
          r={particle.radius}
          color={particle.color}
          opacity={particle.opacity * 0.3}
        >
          <BlurMask blur={particle.radius * 0.8} style="normal" />
        </Circle>
      );
    }

    // Default circle particle
    return (
      <Circle
        key={particle.id}
        cx={particle.x}
        cy={particle.y}
        r={particle.radius}
        color={particle.color}
        opacity={particle.opacity}
      >
        {(type === 'ember' || type === 'sparkle' || type === 'firefly') && (
          <BlurMask blur={particle.radius * 0.5} style="normal" />
        )}
      </Circle>
    );
  };

  return (
    <Canvas style={styles.canvas}>
      <Group>{particles.map(renderParticle)}</Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
});

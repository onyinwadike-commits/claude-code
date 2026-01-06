'use client';

import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import type { VoidType, WeatherState } from '@void-confessions/core';

// Particle count
const PARTICLE_COUNT = 2000;

// Void color configurations
const VOID_COLORS: Record<VoidType, { primary: string; secondary: string; accent: string }> = {
  grief: { primary: '#4a4de6', secondary: '#6270f2', accent: '#8193f8' },
  rage: { primary: '#e51d1d', secondary: '#f83b3b', accent: '#ff6b6b' },
  guilt: { primary: '#455557', secondary: '#5d7a7c', accent: '#789597' },
  longing: { primary: '#ef6507', secondary: '#fe8011', accent: '#ff9d38' },
  relief: { primary: '#0a9156', secondary: '#16b26c', accent: '#3acd87' },
};

// Particle behavior configurations per void type
const PARTICLE_CONFIG: Record<
  VoidType,
  {
    baseSpeed: number;
    sizeRange: [number, number];
    opacity: number;
    spread: { x: number; y: number; z: number };
  }
> = {
  grief: {
    baseSpeed: 2.0,
    sizeRange: [0.02, 0.04],
    opacity: 0.6,
    spread: { x: 15, y: 20, z: 10 },
  },
  rage: {
    baseSpeed: 1.5,
    sizeRange: [0.03, 0.06],
    opacity: 0.8,
    spread: { x: 12, y: 15, z: 8 },
  },
  guilt: {
    baseSpeed: 0.3,
    sizeRange: [0.08, 0.15],
    opacity: 0.3,
    spread: { x: 20, y: 12, z: 15 },
  },
  longing: {
    baseSpeed: 0.5,
    sizeRange: [0.02, 0.05],
    opacity: 0.9,
    spread: { x: 18, y: 15, z: 12 },
  },
  relief: {
    baseSpeed: 0.8,
    sizeRange: [0.015, 0.03],
    opacity: 0.5,
    spread: { x: 16, y: 18, z: 10 },
  },
};

interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  velocities: Float32Array;
  phases: Float32Array;
  originalY: Float32Array;
}

interface VoidParticlesProps {
  voidType: VoidType;
  weather: WeatherState;
}

function VoidParticles({ voidType, weather }: VoidParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const { viewport } = useThree();

  const config = PARTICLE_CONFIG[voidType];
  const colors = VOID_COLORS[voidType];

  // Generate initial particle data
  const particleData = useMemo<ParticleData>(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colorsArray = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const phases = new Float32Array(PARTICLE_COUNT);
    const originalY = new Float32Array(PARTICLE_COUNT);

    const primaryColor = new THREE.Color(colors.primary);
    const secondaryColor = new THREE.Color(colors.secondary);
    const accentColor = new THREE.Color(colors.accent);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Position based on void type spread
      positions[i3] = (Math.random() - 0.5) * config.spread.x;
      positions[i3 + 1] = (Math.random() - 0.5) * config.spread.y;
      positions[i3 + 2] = -5 + (Math.random() - 0.5) * config.spread.z;

      originalY[i] = positions[i3 + 1];

      // Random size within range
      sizes[i] = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);

      // Velocity (will be modified per void type in animation)
      velocities[i3] = (Math.random() - 0.5) * 0.5;
      velocities[i3 + 1] = Math.random() * 0.5;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;

      // Phase for wave/oscillation effects
      phases[i] = Math.random() * Math.PI * 2;

      // Color mixing
      const colorChoice = Math.random();
      const selectedColor =
        colorChoice < 0.5 ? primaryColor : colorChoice < 0.8 ? secondaryColor : accentColor;

      colorsArray[i3] = selectedColor.r;
      colorsArray[i3 + 1] = selectedColor.g;
      colorsArray[i3 + 2] = selectedColor.b;
    }

    return { positions, colors: colorsArray, sizes, velocities, phases, originalY };
  }, [voidType, colors, config]);

  // Animation based on void type
  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const geometry = pointsRef.current.geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;

    // Weather multiplier affects speed
    const weatherMultiplier =
      weather.state === 'storm' ? 2.5 : weather.state === 'turbulent' ? 1.8 : weather.state === 'rain' ? 1.5 : 1;
    const speed = config.baseSpeed * weather.intensity * weatherMultiplier * delta;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const phase = particleData.phases[i];

      switch (voidType) {
        case 'grief': {
          // Rain falling down
          positions[i3 + 1] -= speed * (1 + Math.random() * 0.5);

          // Slight horizontal drift
          positions[i3] += Math.sin(time + phase) * 0.002 * weather.intensity;

          // Reset when below view
          if (positions[i3 + 1] < -config.spread.y / 2) {
            positions[i3 + 1] = config.spread.y / 2;
            positions[i3] = (Math.random() - 0.5) * config.spread.x;
          }
          break;
        }

        case 'rage': {
          // Embers rising up with horizontal sway
          positions[i3 + 1] += speed * (0.8 + Math.random() * 0.4);

          // Horizontal sway
          const swayAmount = Math.sin(time * 2 + phase) * 0.03 * weather.intensity;
          positions[i3] += swayAmount;

          // Slight z movement for depth
          positions[i3 + 2] += Math.cos(time + phase) * 0.005;

          // Reset when above view
          if (positions[i3 + 1] > config.spread.y / 2) {
            positions[i3 + 1] = -config.spread.y / 2;
            positions[i3] = (Math.random() - 0.5) * config.spread.x;
            positions[i3 + 2] = -5 + (Math.random() - 0.5) * config.spread.z;
          }
          break;
        }

        case 'guilt': {
          // Fog drifting slowly - horizontal movement with slight vertical wave
          const fogSpeed = speed * 0.3;

          // Slow horizontal drift
          positions[i3] += fogSpeed * (0.5 + particleData.velocities[i3]);

          // Gentle vertical wave
          positions[i3 + 1] =
            particleData.originalY[i] +
            Math.sin(time * 0.5 + phase) * 0.5 * weather.intensity;

          // Subtle z movement
          positions[i3 + 2] += Math.sin(time * 0.3 + phase) * 0.002;

          // Wrap around horizontally
          if (positions[i3] > config.spread.x / 2) {
            positions[i3] = -config.spread.x / 2;
          } else if (positions[i3] < -config.spread.x / 2) {
            positions[i3] = config.spread.x / 2;
          }
          break;
        }

        case 'longing': {
          // Fireflies floating randomly with occasional bright pulses
          const floatSpeed = speed * 0.5;

          // Random floating movement
          positions[i3] += Math.sin(time * 0.8 + phase) * floatSpeed * 0.5;
          positions[i3 + 1] += Math.cos(time * 0.6 + phase * 1.5) * floatSpeed * 0.3;
          positions[i3 + 2] += Math.sin(time * 0.4 + phase * 0.7) * floatSpeed * 0.2;

          // Keep within bounds with soft wrapping
          const bounds = config.spread;
          if (Math.abs(positions[i3]) > bounds.x / 2) {
            positions[i3] *= 0.95;
          }
          if (Math.abs(positions[i3 + 1]) > bounds.y / 2) {
            positions[i3 + 1] *= 0.95;
          }
          if (positions[i3 + 2] > -2 || positions[i3 + 2] < -config.spread.z - 5) {
            positions[i3 + 2] = -5 + (Math.random() - 0.5) * config.spread.z;
          }
          break;
        }

        case 'relief': {
          // Dust motes rising gently with slight wobble
          positions[i3 + 1] += speed * 0.4;

          // Gentle wobble
          positions[i3] += Math.sin(time * 1.5 + phase) * 0.008 * weather.intensity;
          positions[i3 + 2] += Math.cos(time * 1.2 + phase) * 0.005 * weather.intensity;

          // Reset when above view
          if (positions[i3 + 1] > config.spread.y / 2) {
            positions[i3 + 1] = -config.spread.y / 2;
            positions[i3] = (Math.random() - 0.5) * config.spread.x;
            positions[i3 + 2] = -5 + (Math.random() - 0.5) * config.spread.z;
          }
          break;
        }
      }
    }

    geometry.attributes.position.needsUpdate = true;

    // Update material opacity based on weather
    if (materialRef.current) {
      const targetOpacity = config.opacity * (0.5 + weather.intensity * 0.5);
      materialRef.current.opacity = THREE.MathUtils.lerp(
        materialRef.current.opacity,
        targetOpacity,
        delta * 2
      );
    }
  });

  // Create geometry with attributes
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particleData.positions.slice(), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(particleData.colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(particleData.sizes, 1));
    return geo;
  }, [particleData]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        transparent
        vertexColors
        size={config.sizeRange[1]}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={config.opacity}
      />
    </points>
  );
}

interface VoidCoreProps {
  voidType: VoidType;
  weather: WeatherState;
}

function VoidCore({ voidType, weather }: VoidCoreProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const colors = VOID_COLORS[voidType];

  useFrame((state, delta) => {
    if (!meshRef.current || !glowRef.current) return;

    const time = state.clock.elapsedTime;
    const weatherMultiplier = weather.state === 'storm' ? 1.5 : 1;

    // Pulse effect
    const pulse = 1 + Math.sin(time * 0.8) * 0.15 * weather.intensity * weatherMultiplier;
    meshRef.current.scale.setScalar(pulse);
    glowRef.current.scale.setScalar(pulse * 1.2);

    // Slow rotation
    meshRef.current.rotation.z += delta * 0.1 * weather.intensity;
    meshRef.current.rotation.y += delta * 0.05;
  });

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={[0, 0, -10]}>
        {/* Core sphere */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[2, 64, 64]} />
          <meshStandardMaterial
            color={colors.primary}
            emissive={colors.secondary}
            emissiveIntensity={0.5 + weather.intensity * 0.3}
            roughness={0.9}
            metalness={0.1}
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Inner glow */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[2.5, 32, 32]} />
          <meshBasicMaterial
            color={colors.accent}
            transparent
            opacity={0.1 + weather.intensity * 0.1}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Outer glow ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3, 4, 64]} />
          <meshBasicMaterial
            color={colors.primary}
            transparent
            opacity={0.05 + weather.intensity * 0.05}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </Float>
  );
}

interface AmbientParticlesProps {
  voidType: VoidType;
  weather: WeatherState;
}

function AmbientParticles({ voidType, weather }: AmbientParticlesProps) {
  const colors = VOID_COLORS[voidType];
  const count = 50;

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 18,
        -8 - Math.random() * 12,
      ] as [number, number, number],
      scale: 0.3 + Math.random() * 1.5,
      speed: 0.2 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  return (
    <group>
      {particles.map((particle, i) => (
        <Float
          key={i}
          speed={particle.speed * weather.intensity}
          rotationIntensity={0.1}
          floatIntensity={0.4 * weather.intensity}
        >
          <mesh position={particle.position}>
            <sphereGeometry args={[particle.scale, 16, 16]} />
            <meshBasicMaterial
              color={colors.primary}
              transparent
              opacity={0.03 + weather.intensity * 0.03}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

interface VoidBackgroundProps {
  voidType: VoidType;
  weather?: WeatherState;
  className?: string;
}

export function VoidBackground({
  voidType,
  weather = { state: 'calm', intensity: 0.5, nextChange: Date.now() + 300000 },
  className = '',
}: VoidBackgroundProps) {
  const colors = VOID_COLORS[voidType];

  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        {/* Background color */}
        <color attach="background" args={['#050508']} />

        {/* Fog for depth */}
        <fog attach="fog" args={['#050508', 8, 30]} />

        {/* Lighting */}
        <ambientLight intensity={0.15} />
        <pointLight
          position={[0, 0, -8]}
          intensity={0.8 * weather.intensity}
          color={colors.accent}
          distance={20}
        />
        <pointLight
          position={[5, 5, -5]}
          intensity={0.3 * weather.intensity}
          color={colors.secondary}
          distance={15}
        />
        <pointLight
          position={[-5, -5, -5]}
          intensity={0.2 * weather.intensity}
          color={colors.primary}
          distance={15}
        />

        {/* Main particle system */}
        <VoidParticles voidType={voidType} weather={weather} />

        {/* Central void core */}
        <VoidCore voidType={voidType} weather={weather} />

        {/* Ambient background particles */}
        <AmbientParticles voidType={voidType} weather={weather} />
      </Canvas>
    </div>
  );
}

export default VoidBackground;

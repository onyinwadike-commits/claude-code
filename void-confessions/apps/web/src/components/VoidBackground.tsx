'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { VoidType, WeatherState } from '@void-confessions/core';

// Void color configurations
const VOID_COLORS: Record<VoidType, { primary: string; secondary: string; accent: string }> = {
  grief: { primary: '#4a4de6', secondary: '#6270f2', accent: '#8193f8' },
  rage: { primary: '#e51d1d', secondary: '#f83b3b', accent: '#ff6b6b' },
  guilt: { primary: '#455557', secondary: '#5d7a7c', accent: '#789597' },
  longing: { primary: '#ef6507', secondary: '#fe8011', accent: '#ff9d38' },
  relief: { primary: '#0a9156', secondary: '#16b26c', accent: '#3acd87' },
};

interface ParticleFieldProps {
  voidType: VoidType;
  weather: WeatherState;
  count?: number;
}

function ParticleField({ voidType, weather, count = 5000 }: ParticleFieldProps) {
  const ref = useRef<THREE.Points>(null);
  const { viewport } = useThree();

  // Generate particle positions
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const voidColors = VOID_COLORS[voidType];
    const primaryColor = new THREE.Color(voidColors.primary);
    const secondaryColor = new THREE.Color(voidColors.secondary);
    const accentColor = new THREE.Color(voidColors.accent);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Distribute particles in a sphere-like volume
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 3 + Math.random() * 12;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi) - 5;

      // Mix colors
      const colorChoice = Math.random();
      const selectedColor =
        colorChoice < 0.5 ? primaryColor : colorChoice < 0.8 ? secondaryColor : accentColor;

      colors[i3] = selectedColor.r;
      colors[i3 + 1] = selectedColor.g;
      colors[i3 + 2] = selectedColor.b;
    }

    return [positions, colors];
  }, [count, voidType]);

  // Animation
  useFrame((state, delta) => {
    if (!ref.current) return;

    const weatherMultiplier = weather.state === 'storm' ? 2 : weather.state === 'rain' ? 1.5 : 1;
    const rotationSpeed = 0.02 * weather.intensity * weatherMultiplier;

    ref.current.rotation.x += delta * rotationSpeed * 0.5;
    ref.current.rotation.y += delta * rotationSpeed;

    // Pulsing effect based on weather
    const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05 * weather.intensity;
    ref.current.scale.setScalar(scale);
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        vertexColors
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.8}
      />
    </Points>
  );
}

interface VoidCoreProps {
  voidType: VoidType;
  weather: WeatherState;
}

function VoidCore({ voidType, weather }: VoidCoreProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const colors = VOID_COLORS[voidType];

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Pulse effect
    const pulse = 1 + Math.sin(state.clock.elapsedTime) * 0.1 * weather.intensity;
    meshRef.current.scale.setScalar(pulse);

    // Slow rotation
    meshRef.current.rotation.z += delta * 0.1;
  });

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[0, 0, -8]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color={colors.primary}
          emissive={colors.secondary}
          emissiveIntensity={0.5}
          roughness={0.9}
          metalness={0.1}
          transparent
          opacity={0.3}
        />
      </mesh>
      {/* Inner glow */}
      <mesh position={[0, 0, -8]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color={colors.accent} transparent opacity={0.2} />
      </mesh>
    </Float>
  );
}

interface NebulaProps {
  voidType: VoidType;
}

function Nebula({ voidType }: NebulaProps) {
  const colors = VOID_COLORS[voidType];
  const count = 100;

  const clouds = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        -10 - Math.random() * 10,
      ] as [number, number, number],
      scale: 0.5 + Math.random() * 2,
      opacity: 0.05 + Math.random() * 0.1,
    }));
  }, []);

  return (
    <group>
      {clouds.map((cloud, i) => (
        <Float key={i} speed={0.5} rotationIntensity={0.1} floatIntensity={0.3}>
          <mesh position={cloud.position}>
            <sphereGeometry args={[cloud.scale, 16, 16]} />
            <meshBasicMaterial
              color={colors.primary}
              transparent
              opacity={cloud.opacity}
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
  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <fog attach="fog" args={['#0a0a0f', 5, 25]} />

        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, -5]} intensity={0.5} color={VOID_COLORS[voidType].accent} />

        <ParticleField voidType={voidType} weather={weather} />
        <VoidCore voidType={voidType} weather={weather} />
        <Nebula voidType={voidType} />
      </Canvas>
    </div>
  );
}

export default VoidBackground;

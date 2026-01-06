import type { ReleaseStyle, VoidType } from '@void-confessions/core';

/**
 * Props shared by all release animation components
 */
export interface ReleaseAnimationProps {
  /** The confession text to animate */
  text: string;
  /** The void type for color theming */
  voidType: VoidType;
  /** Callback when animation completes */
  onComplete: () => void;
  /** Animation duration override (ms) */
  duration?: number;
}

/**
 * Configuration for release animation
 */
export interface ReleaseAnimationConfig {
  /** Release style type */
  style: ReleaseStyle;
  /** Default duration in ms */
  defaultDuration: number;
  /** Whether this style requires premium */
  isPremium: boolean;
  /** Sound effect key */
  soundKey: string;
}

/**
 * Particle configuration for particle-based animations
 */
export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  color: string;
}

/**
 * Text fragment for shatter/scatter animations
 */
export interface TextFragment {
  id: number;
  char: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  rotation: number;
  scale: number;
  opacity: number;
  delay: number;
}

/**
 * Release animation configurations
 */
export const RELEASE_ANIMATIONS: Record<ReleaseStyle, ReleaseAnimationConfig> = {
  default: {
    style: 'default',
    defaultDuration: 2000,
    isPremium: false,
    soundKey: 'release-fade',
  },
  burn: {
    style: 'burn',
    defaultDuration: 3000,
    isPremium: true,
    soundKey: 'release-burn',
  },
  shatter: {
    style: 'shatter',
    defaultDuration: 1500,
    isPremium: true,
    soundKey: 'release-shatter',
  },
  scream: {
    style: 'scream',
    defaultDuration: 2500,
    isPremium: true,
    soundKey: 'release-scream',
  },
  dissolve: {
    style: 'dissolve',
    defaultDuration: 4000,
    isPremium: true,
    soundKey: 'release-dissolve',
  },
  storm: {
    style: 'storm',
    defaultDuration: 3500,
    isPremium: true,
    soundKey: 'release-storm',
  },
  drift: {
    style: 'drift',
    defaultDuration: 5000,
    isPremium: true,
    soundKey: 'release-drift',
  },
};

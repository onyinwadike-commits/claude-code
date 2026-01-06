/**
 * Types of particle effects that can be rendered in the void background
 */
export type ParticleEffectType =
  | 'ember'
  | 'ash'
  | 'mist'
  | 'rain'
  | 'snow'
  | 'dust'
  | 'spark'
  | 'tear'
  | 'smoke'
  | 'star';

/**
 * Configuration for particle visual effects
 */
export interface ParticleEffect {
  /** Type of particle to render */
  type: ParticleEffectType;
  /** Particle density (0-1, where 1 is maximum density) */
  density: number;
  /** Particle movement speed (0-1, where 1 is maximum speed) */
  speed: number;
  /** Primary particle color in hex format */
  color: string;
  /** Optional secondary color for gradients/variations */
  secondaryColor?: string;
  /** Opacity of particles (0-1) */
  opacity?: number;
  /** Size multiplier for particles (default 1) */
  sizeMultiplier?: number;
}

/**
 * Weather state representing the current mood of the void
 */
export type VoidWeatherState =
  | 'calm'
  | 'turbulent'
  | 'stormy'
  | 'serene'
  | 'heavy'
  | 'clearing';

/**
 * Complete weather configuration for a void environment
 */
export interface VoidWeather {
  /** Current weather state */
  state: VoidWeatherState;
  /** Intensity of the weather effect (0-1) */
  intensity: number;
  /** Primary particle effect configuration */
  particleEffect: ParticleEffect;
  /** Secondary particle effect (optional, for layered effects) */
  secondaryParticleEffect?: ParticleEffect;
  /** Speed at which elements drift across the screen (0-1) */
  driftSpeed: number;
  /** Background color in hex format */
  backgroundColor: string;
  /** Optional gradient end color for background */
  backgroundGradientEnd?: string;
  /** Ambient light level (0-1, affects overall brightness) */
  ambientLight?: number;
}

/**
 * Preset weather configurations for different scenarios
 */
export interface VoidWeatherPreset {
  name: string;
  description: string;
  weather: VoidWeather;
}

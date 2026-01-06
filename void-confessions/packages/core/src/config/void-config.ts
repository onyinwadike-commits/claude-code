import type { VoidType, ReleaseStyle } from '../types/void';
import type { VoidWeather, ParticleEffect } from '../types/weather';

/**
 * Color palette for a void type
 */
export interface VoidColorPalette {
  /** Primary background color */
  primary: string;
  /** Secondary/gradient color */
  secondary: string;
  /** Accent color for highlights */
  accent: string;
  /** Text color */
  text: string;
  /** Muted text color */
  textMuted: string;
  /** Glow/emission color */
  glow: string;
  /** Particle primary color */
  particle: string;
  /** Particle secondary color */
  particleSecondary: string;
}

/**
 * Particle configuration for a void type
 */
export interface VoidParticleConfig {
  /** Primary particle effect */
  primary: ParticleEffect;
  /** Secondary/ambient particle effect */
  secondary?: ParticleEffect;
  /** Particle effect during release animation */
  release: ParticleEffect;
}

/**
 * Soundscape reference for a void type
 */
export interface VoidSoundscape {
  /** Ambient background loop identifier */
  ambient: string;
  /** Sound for releasing a confession */
  release: string;
  /** Sound for receiving an echo */
  echo: string;
  /** Sound for resonance pulse */
  resonance: string;
  /** Optional wind/weather overlay */
  weather?: string;
}

/**
 * Complete configuration for a void type
 */
export interface VoidTypeConfig {
  /** Display name */
  name: string;
  /** Description of this void type */
  description: string;
  /** Emoji/icon representation */
  icon: string;
  /** Color palette */
  colors: VoidColorPalette;
  /** Particle configurations */
  particles: VoidParticleConfig;
  /** Soundscape references */
  soundscape: VoidSoundscape;
  /** Default weather state */
  defaultWeather: VoidWeather;
  /** Recommended release styles for this void */
  releaseStyles: ReleaseStyle[];
  /** Placeholder text for confession input */
  placeholder: string;
  /** Prompt to encourage confession */
  prompt: string;
}

/**
 * Complete void configuration for all void types
 */
export const VOID_CONFIG: Record<VoidType, VoidTypeConfig> = {
  grief: {
    name: 'Grief',
    description: 'A space for loss, mourning, and remembrance',
    icon: '🌑',
    colors: {
      primary: '#0a0a12',
      secondary: '#1a1a2e',
      accent: '#4a5568',
      text: '#e2e8f0',
      textMuted: '#718096',
      glow: '#667eea',
      particle: '#a0aec0',
      particleSecondary: '#4a5568',
    },
    particles: {
      primary: {
        type: 'tear',
        density: 0.3,
        speed: 0.2,
        color: '#667eea',
        opacity: 0.6,
      },
      secondary: {
        type: 'mist',
        density: 0.4,
        speed: 0.1,
        color: '#4a5568',
        opacity: 0.3,
      },
      release: {
        type: 'mist',
        density: 0.8,
        speed: 0.4,
        color: '#667eea',
        opacity: 0.8,
      },
    },
    soundscape: {
      ambient: 'grief-ambient-rain',
      release: 'grief-release-dissolve',
      echo: 'grief-echo-soft',
      resonance: 'grief-resonance-wave',
      weather: 'soft-rain',
    },
    defaultWeather: {
      state: 'heavy',
      intensity: 0.6,
      particleEffect: {
        type: 'rain',
        density: 0.4,
        speed: 0.3,
        color: '#667eea',
      },
      driftSpeed: 0.2,
      backgroundColor: '#0a0a12',
      backgroundGradientEnd: '#1a1a2e',
      ambientLight: 0.3,
    },
    releaseStyles: ['dissolve', 'drift', 'default'],
    placeholder: 'What loss weighs on your heart...',
    prompt: 'Let your grief flow into the void',
  },

  rage: {
    name: 'Rage',
    description: 'A furnace for anger, frustration, and fury',
    icon: '🔥',
    colors: {
      primary: '#1a0a0a',
      secondary: '#2d1f1f',
      accent: '#e53e3e',
      text: '#fed7d7',
      textMuted: '#fc8181',
      glow: '#f56565',
      particle: '#fc8181',
      particleSecondary: '#c53030',
    },
    particles: {
      primary: {
        type: 'ember',
        density: 0.5,
        speed: 0.6,
        color: '#f56565',
        opacity: 0.8,
      },
      secondary: {
        type: 'smoke',
        density: 0.3,
        speed: 0.2,
        color: '#2d1f1f',
        opacity: 0.4,
      },
      release: {
        type: 'spark',
        density: 0.9,
        speed: 0.9,
        color: '#fc8181',
        opacity: 1.0,
      },
    },
    soundscape: {
      ambient: 'rage-ambient-fire',
      release: 'rage-release-burn',
      echo: 'rage-echo-crack',
      resonance: 'rage-resonance-rumble',
      weather: 'crackling-fire',
    },
    defaultWeather: {
      state: 'turbulent',
      intensity: 0.8,
      particleEffect: {
        type: 'ember',
        density: 0.6,
        speed: 0.5,
        color: '#f56565',
      },
      driftSpeed: 0.6,
      backgroundColor: '#1a0a0a',
      backgroundGradientEnd: '#2d1f1f',
      ambientLight: 0.4,
    },
    releaseStyles: ['burn', 'shatter', 'scream', 'storm'],
    placeholder: 'What fury burns inside you...',
    prompt: 'Let your rage ignite and burn away',
  },

  guilt: {
    name: 'Guilt',
    description: 'A chamber for regret, shame, and seeking peace',
    icon: '⚖️',
    colors: {
      primary: '#0a0f0a',
      secondary: '#1a2f1a',
      accent: '#68d391',
      text: '#c6f6d5',
      textMuted: '#9ae6b4',
      glow: '#48bb78',
      particle: '#9ae6b4',
      particleSecondary: '#276749',
    },
    particles: {
      primary: {
        type: 'ash',
        density: 0.4,
        speed: 0.15,
        color: '#68d391',
        opacity: 0.5,
      },
      secondary: {
        type: 'dust',
        density: 0.3,
        speed: 0.1,
        color: '#276749',
        opacity: 0.3,
      },
      release: {
        type: 'ash',
        density: 0.7,
        speed: 0.3,
        color: '#48bb78',
        opacity: 0.7,
      },
    },
    soundscape: {
      ambient: 'guilt-ambient-wind',
      release: 'guilt-release-crumble',
      echo: 'guilt-echo-whisper',
      resonance: 'guilt-resonance-chime',
      weather: 'gentle-wind',
    },
    defaultWeather: {
      state: 'heavy',
      intensity: 0.5,
      particleEffect: {
        type: 'ash',
        density: 0.4,
        speed: 0.2,
        color: '#68d391',
      },
      driftSpeed: 0.15,
      backgroundColor: '#0a0f0a',
      backgroundGradientEnd: '#1a2f1a',
      ambientLight: 0.35,
    },
    releaseStyles: ['burn', 'dissolve', 'default'],
    placeholder: 'What burden do you carry...',
    prompt: 'Release your guilt into the void',
  },

  longing: {
    name: 'Longing',
    description: 'An ocean for yearning, nostalgia, and distant desires',
    icon: '🌊',
    colors: {
      primary: '#0a0a1a',
      secondary: '#1a1a3a',
      accent: '#9f7aea',
      text: '#e9d8fd',
      textMuted: '#b794f4',
      glow: '#805ad5',
      particle: '#b794f4',
      particleSecondary: '#553c9a',
    },
    particles: {
      primary: {
        type: 'star',
        density: 0.3,
        speed: 0.1,
        color: '#9f7aea',
        opacity: 0.7,
      },
      secondary: {
        type: 'mist',
        density: 0.2,
        speed: 0.05,
        color: '#553c9a',
        opacity: 0.3,
      },
      release: {
        type: 'star',
        density: 0.6,
        speed: 0.2,
        color: '#b794f4',
        opacity: 0.9,
      },
    },
    soundscape: {
      ambient: 'longing-ambient-ocean',
      release: 'longing-release-drift',
      echo: 'longing-echo-distant',
      resonance: 'longing-resonance-bell',
      weather: 'distant-waves',
    },
    defaultWeather: {
      state: 'serene',
      intensity: 0.4,
      particleEffect: {
        type: 'star',
        density: 0.3,
        speed: 0.1,
        color: '#9f7aea',
      },
      driftSpeed: 0.1,
      backgroundColor: '#0a0a1a',
      backgroundGradientEnd: '#1a1a3a',
      ambientLight: 0.4,
    },
    releaseStyles: ['drift', 'dissolve', 'default'],
    placeholder: 'What do you yearn for...',
    prompt: 'Cast your longing into the infinite void',
  },

  relief: {
    name: 'Relief',
    description: 'A sanctuary for release, unburdening, and finding peace',
    icon: '✨',
    colors: {
      primary: '#0f0a1a',
      secondary: '#1f1a2e',
      accent: '#faf089',
      text: '#fefcbf',
      textMuted: '#f6e05e',
      glow: '#ecc94b',
      particle: '#f6e05e',
      particleSecondary: '#b7791f',
    },
    particles: {
      primary: {
        type: 'dust',
        density: 0.25,
        speed: 0.1,
        color: '#faf089',
        opacity: 0.6,
      },
      secondary: {
        type: 'star',
        density: 0.15,
        speed: 0.05,
        color: '#ecc94b',
        opacity: 0.4,
      },
      release: {
        type: 'spark',
        density: 0.5,
        speed: 0.3,
        color: '#f6e05e',
        opacity: 0.8,
      },
    },
    soundscape: {
      ambient: 'relief-ambient-breeze',
      release: 'relief-release-shimmer',
      echo: 'relief-echo-bright',
      resonance: 'relief-resonance-glow',
      weather: 'gentle-breeze',
    },
    defaultWeather: {
      state: 'clearing',
      intensity: 0.3,
      particleEffect: {
        type: 'dust',
        density: 0.25,
        speed: 0.1,
        color: '#faf089',
      },
      driftSpeed: 0.1,
      backgroundColor: '#0f0a1a',
      backgroundGradientEnd: '#1f1a2e',
      ambientLight: 0.5,
    },
    releaseStyles: ['dissolve', 'drift', 'default'],
    placeholder: 'What weight are you releasing...',
    prompt: 'Let go and find your peace',
  },
};

/**
 * Get configuration for a specific void type
 */
export function getVoidConfig(voidType: VoidType): VoidTypeConfig {
  return VOID_CONFIG[voidType];
}

/**
 * Get all void types as an array
 */
export function getAllVoidTypes(): VoidType[] {
  return Object.keys(VOID_CONFIG) as VoidType[];
}

/**
 * Get color palette for a void type
 */
export function getVoidColors(voidType: VoidType): VoidColorPalette {
  return VOID_CONFIG[voidType].colors;
}

/**
 * Get default weather for a void type
 */
export function getVoidWeather(voidType: VoidType): VoidWeather {
  return VOID_CONFIG[voidType].defaultWeather;
}

/**
 * Release style configurations with animation parameters
 */
export const RELEASE_STYLE_CONFIG: Record<
  ReleaseStyle,
  {
    name: string;
    duration: number;
    easing: string;
    particleMultiplier: number;
    soundIntensity: number;
  }
> = {
  default: {
    name: 'Fade',
    duration: 2000,
    easing: 'ease-out',
    particleMultiplier: 1.0,
    soundIntensity: 0.5,
  },
  burn: {
    name: 'Burn',
    duration: 3000,
    easing: 'ease-in',
    particleMultiplier: 2.0,
    soundIntensity: 0.8,
  },
  shatter: {
    name: 'Shatter',
    duration: 1500,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    particleMultiplier: 3.0,
    soundIntensity: 1.0,
  },
  scream: {
    name: 'Scream',
    duration: 2500,
    easing: 'ease-in-out',
    particleMultiplier: 2.5,
    soundIntensity: 1.0,
  },
  dissolve: {
    name: 'Dissolve',
    duration: 4000,
    easing: 'ease-out',
    particleMultiplier: 1.5,
    soundIntensity: 0.4,
  },
  storm: {
    name: 'Storm',
    duration: 3500,
    easing: 'ease-in-out',
    particleMultiplier: 2.5,
    soundIntensity: 0.9,
  },
  drift: {
    name: 'Drift',
    duration: 5000,
    easing: 'linear',
    particleMultiplier: 1.0,
    soundIntensity: 0.3,
  },
};

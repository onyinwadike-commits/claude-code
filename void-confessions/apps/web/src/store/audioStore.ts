import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Howl, Howler } from 'howler';
import type { VoidType, WeatherState } from '@void-confessions/core';

// Audio file paths
const AUDIO_PATHS = {
  // Ambient loops per void type
  ambient: {
    grief: '/audio/ambient/grief-loop.mp3',
    rage: '/audio/ambient/rage-loop.mp3',
    guilt: '/audio/ambient/guilt-loop.mp3',
    longing: '/audio/ambient/longing-loop.mp3',
    relief: '/audio/ambient/relief-loop.mp3',
  },
  // Sound effects
  sfx: {
    // Confession sounds
    confessionRelease: '/audio/sfx/water-drop.mp3',
    confessionSend: '/audio/sfx/whoosh-soft.mp3',
    // Interaction sounds
    resonance: '/audio/sfx/warm-hum.mp3',
    echo: '/audio/sfx/distant-chime.mp3',
    // UI sounds
    enter: '/audio/sfx/enter-void.mp3',
    exit: '/audio/sfx/exit-void.mp3',
    hover: '/audio/sfx/hover-soft.mp3',
    click: '/audio/sfx/click-soft.mp3',
  },
  // Weather layers
  weather: {
    storm: '/audio/weather/storm-layer.mp3',
    rain: '/audio/weather/rain-layer.mp3',
    wind: '/audio/weather/wind-layer.mp3',
    turbulent: '/audio/weather/turbulent-layer.mp3',
  },
} as const;

// Sound effect types
type SfxType = keyof typeof AUDIO_PATHS.sfx;
type WeatherType = keyof typeof AUDIO_PATHS.weather;

// Audio filter settings per weather state
const WEATHER_AUDIO_CONFIG: Record<
  WeatherState['state'],
  { lowpass: number; volume: number; reverb: number }
> = {
  calm: { lowpass: 22000, volume: 1.0, reverb: 0.2 },
  stirring: { lowpass: 18000, volume: 1.1, reverb: 0.3 },
  turbulent: { lowpass: 12000, volume: 1.2, reverb: 0.5 },
  storm: { lowpass: 8000, volume: 1.3, reverb: 0.7 },
  rain: { lowpass: 15000, volume: 0.9, reverb: 0.4 },
};

interface AudioState {
  // Settings (persisted)
  isEnabled: boolean;
  masterVolume: number;
  ambientVolume: number;
  sfxVolume: number;
  isMuted: boolean;

  // Runtime state (not persisted)
  isInitialized: boolean;
  isLoading: boolean;
  currentVoid: VoidType | null;
  currentWeather: WeatherState['state'];

  // Howl instances (not persisted)
  _ambientHowls: Map<VoidType, Howl>;
  _sfxHowls: Map<string, Howl>;
  _weatherHowls: Map<string, Howl>;
  _activeWeatherLayer: Howl | null;

  // Actions
  initialize: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setAmbientVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  toggleMute: () => void;

  // Ambient control
  playAmbient: (voidType: VoidType) => void;
  stopAmbient: () => void;
  crossfadeToVoid: (voidType: VoidType, duration?: number) => void;

  // Weather effects
  updateWeather: (weather: WeatherState) => void;

  // Sound effects
  playSfx: (sound: SfxType, options?: { volume?: number; rate?: number }) => void;
  playConfessionRelease: () => void;
  playResonance: () => void;
  playEcho: () => void;

  // Cleanup
  cleanup: () => void;
}

const CROSSFADE_DURATION = 2500; // ms

export const useAudioStore = create<AudioState>()(
  devtools(
    persist(
      (set, get) => ({
        // Persisted settings
        isEnabled: true,
        masterVolume: 0.7,
        ambientVolume: 0.5,
        sfxVolume: 0.8,
        isMuted: false,

        // Runtime state
        isInitialized: false,
        isLoading: false,
        currentVoid: null,
        currentWeather: 'calm',

        // Howl instances
        _ambientHowls: new Map(),
        _sfxHowls: new Map(),
        _weatherHowls: new Map(),
        _activeWeatherLayer: null,

        initialize: async () => {
          const state = get();
          if (state.isInitialized || state.isLoading || !state.isEnabled) return;

          set({ isLoading: true });

          try {
            // Set global volume
            Howler.volume(state.masterVolume);

            // Preload ambient tracks
            const ambientHowls = new Map<VoidType, Howl>();
            const ambientLoadPromises = Object.entries(AUDIO_PATHS.ambient).map(
              ([voidType, path]) => {
                return new Promise<void>((resolve, reject) => {
                  const howl = new Howl({
                    src: [path],
                    loop: true,
                    volume: 0,
                    preload: true,
                    html5: true, // Better for long audio
                    onload: () => resolve(),
                    onloaderror: (_, error) => {
                      console.warn(`Failed to load ambient: ${voidType}`, error);
                      resolve(); // Don't fail initialization
                    },
                  });
                  ambientHowls.set(voidType as VoidType, howl);
                });
              }
            );

            // Preload sound effects
            const sfxHowls = new Map<string, Howl>();
            const sfxLoadPromises = Object.entries(AUDIO_PATHS.sfx).map(([name, path]) => {
              return new Promise<void>((resolve) => {
                const howl = new Howl({
                  src: [path],
                  volume: state.sfxVolume,
                  preload: true,
                  onload: () => resolve(),
                  onloaderror: () => {
                    console.warn(`Failed to load sfx: ${name}`);
                    resolve();
                  },
                });
                sfxHowls.set(name, howl);
              });
            });

            // Preload weather layers
            const weatherHowls = new Map<string, Howl>();
            const weatherLoadPromises = Object.entries(AUDIO_PATHS.weather).map(
              ([name, path]) => {
                return new Promise<void>((resolve) => {
                  const howl = new Howl({
                    src: [path],
                    loop: true,
                    volume: 0,
                    preload: true,
                    html5: true,
                    onload: () => resolve(),
                    onloaderror: () => {
                      console.warn(`Failed to load weather: ${name}`);
                      resolve();
                    },
                  });
                  weatherHowls.set(name, howl);
                });
              }
            );

            // Wait for all audio to load
            await Promise.all([
              ...ambientLoadPromises,
              ...sfxLoadPromises,
              ...weatherLoadPromises,
            ]);

            set({
              isInitialized: true,
              isLoading: false,
              _ambientHowls: ambientHowls,
              _sfxHowls: sfxHowls,
              _weatherHowls: weatherHowls,
            });
          } catch (error) {
            console.error('Audio initialization failed:', error);
            set({ isLoading: false });
          }
        },

        setEnabled: (enabled) => {
          set({ isEnabled: enabled });
          if (!enabled) {
            get().cleanup();
          } else {
            get().initialize();
          }
        },

        setMasterVolume: (volume) => {
          Howler.volume(volume);
          set({ masterVolume: volume });
        },

        setAmbientVolume: (volume) => {
          const state = get();
          // Update currently playing ambient
          if (state.currentVoid) {
            const howl = state._ambientHowls.get(state.currentVoid);
            if (howl?.playing()) {
              howl.volume(volume);
            }
          }
          // Update weather layer
          if (state._activeWeatherLayer?.playing()) {
            state._activeWeatherLayer.volume(volume * 0.5);
          }
          set({ ambientVolume: volume });
        },

        setSfxVolume: (volume) => {
          const state = get();
          state._sfxHowls.forEach((howl) => {
            howl.volume(volume);
          });
          set({ sfxVolume: volume });
        },

        toggleMute: () => {
          const state = get();
          const newMuted = !state.isMuted;
          Howler.mute(newMuted);
          set({ isMuted: newMuted });
        },

        playAmbient: (voidType) => {
          const state = get();
          if (!state.isInitialized || !state.isEnabled || state.isMuted) return;

          const howl = state._ambientHowls.get(voidType);
          if (!howl) return;

          // Stop all other ambient sounds immediately
          state._ambientHowls.forEach((h, type) => {
            if (type !== voidType && h.playing()) {
              h.stop();
            }
          });

          // Start new ambient
          if (!howl.playing()) {
            howl.volume(0);
            howl.play();
          }
          howl.fade(0, state.ambientVolume, 1000);

          set({ currentVoid: voidType });
        },

        stopAmbient: () => {
          const state = get();
          state._ambientHowls.forEach((howl) => {
            if (howl.playing()) {
              howl.fade(howl.volume(), 0, 1000);
              setTimeout(() => howl.stop(), 1000);
            }
          });

          // Also stop weather layer
          if (state._activeWeatherLayer?.playing()) {
            state._activeWeatherLayer.fade(state._activeWeatherLayer.volume(), 0, 1000);
            setTimeout(() => state._activeWeatherLayer?.stop(), 1000);
          }

          set({ currentVoid: null, _activeWeatherLayer: null });
        },

        crossfadeToVoid: (voidType, duration = CROSSFADE_DURATION) => {
          const state = get();
          if (!state.isInitialized || !state.isEnabled) return;
          if (state.currentVoid === voidType) return;

          const currentHowl = state.currentVoid
            ? state._ambientHowls.get(state.currentVoid)
            : null;
          const nextHowl = state._ambientHowls.get(voidType);

          if (!nextHowl) return;

          // Fade out current
          if (currentHowl?.playing()) {
            currentHowl.fade(currentHowl.volume(), 0, duration);
            setTimeout(() => currentHowl.stop(), duration);
          }

          // Fade in next
          if (!nextHowl.playing()) {
            nextHowl.volume(0);
            nextHowl.play();
          }
          nextHowl.fade(0, state.ambientVolume, duration);

          // Play enter sound
          get().playSfx('enter');

          set({ currentVoid: voidType });
        },

        updateWeather: (weather) => {
          const state = get();
          if (!state.isInitialized || !state.isEnabled) return;

          const weatherConfig = WEATHER_AUDIO_CONFIG[weather.state];
          const previousWeather = state.currentWeather;

          // Update ambient volume based on weather
          const currentAmbient = state.currentVoid
            ? state._ambientHowls.get(state.currentVoid)
            : null;

          if (currentAmbient?.playing()) {
            const targetVolume = state.ambientVolume * weatherConfig.volume * weather.intensity;
            currentAmbient.fade(currentAmbient.volume(), targetVolume, 1000);
          }

          // Handle weather layer transitions
          if (weather.state !== previousWeather) {
            // Fade out previous weather layer
            if (state._activeWeatherLayer?.playing()) {
              const oldLayer = state._activeWeatherLayer;
              oldLayer.fade(oldLayer.volume(), 0, 2000);
              setTimeout(() => oldLayer.stop(), 2000);
            }

            // Start new weather layer if not calm
            if (weather.state !== 'calm') {
              const weatherKey = weather.state as WeatherType;
              const newLayer = state._weatherHowls.get(weatherKey);

              if (newLayer) {
                newLayer.volume(0);
                if (!newLayer.playing()) {
                  newLayer.play();
                }
                const targetVolume = state.ambientVolume * 0.5 * weather.intensity;
                newLayer.fade(0, targetVolume, 2000);
                set({ _activeWeatherLayer: newLayer });
              }
            } else {
              set({ _activeWeatherLayer: null });
            }
          } else if (state._activeWeatherLayer?.playing()) {
            // Just update volume for intensity changes
            const targetVolume = state.ambientVolume * 0.5 * weather.intensity;
            state._activeWeatherLayer.fade(state._activeWeatherLayer.volume(), targetVolume, 500);
          }

          set({ currentWeather: weather.state });
        },

        playSfx: (sound, options = {}) => {
          const state = get();
          if (!state.isInitialized || !state.isEnabled || state.isMuted) return;

          const howl = state._sfxHowls.get(sound);
          if (!howl) return;

          // Apply options
          const volume = options.volume ?? state.sfxVolume;
          const rate = options.rate ?? 1;

          const soundId = howl.play();
          howl.volume(volume, soundId);
          howl.rate(rate, soundId);
        },

        playConfessionRelease: () => {
          const state = get();
          // Play water drop sound with slight pitch variation
          state.playSfx('confessionRelease', {
            rate: 0.9 + Math.random() * 0.2,
          });
          // Also play a soft whoosh
          setTimeout(() => {
            state.playSfx('confessionSend', {
              volume: state.sfxVolume * 0.5,
            });
          }, 100);
        },

        playResonance: () => {
          const state = get();
          // Play warm hum with slight variation
          state.playSfx('resonance', {
            rate: 0.95 + Math.random() * 0.1,
            volume: state.sfxVolume * 0.8,
          });
        },

        playEcho: () => {
          const state = get();
          // Play distant chime
          state.playSfx('echo', {
            rate: 0.9 + Math.random() * 0.2,
            volume: state.sfxVolume * 0.6,
          });
        },

        cleanup: () => {
          const state = get();

          // Stop and unload all audio
          state._ambientHowls.forEach((howl) => {
            howl.stop();
            howl.unload();
          });
          state._sfxHowls.forEach((howl) => {
            howl.unload();
          });
          state._weatherHowls.forEach((howl) => {
            howl.stop();
            howl.unload();
          });

          set({
            isInitialized: false,
            currentVoid: null,
            currentWeather: 'calm',
            _ambientHowls: new Map(),
            _sfxHowls: new Map(),
            _weatherHowls: new Map(),
            _activeWeatherLayer: null,
          });
        },
      }),
      {
        name: 'void-audio-settings',
        partialize: (state) => ({
          isEnabled: state.isEnabled,
          masterVolume: state.masterVolume,
          ambientVolume: state.ambientVolume,
          sfxVolume: state.sfxVolume,
          isMuted: state.isMuted,
        }),
      }
    ),
    { name: 'audio-store' }
  )
);

// Selectors
export const selectIsAudioEnabled = (state: AudioState) => state.isEnabled;
export const selectIsMuted = (state: AudioState) => state.isMuted;
export const selectVolumes = (state: AudioState) => ({
  master: state.masterVolume,
  ambient: state.ambientVolume,
  sfx: state.sfxVolume,
});

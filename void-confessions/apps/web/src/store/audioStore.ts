import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Howl, Howler } from 'howler';
import type { VoidType } from '@void-confessions/core';

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
  // UI sounds
  ui: {
    whisper: '/audio/ui/whisper.mp3',
    release: '/audio/ui/release.mp3',
    resonate: '/audio/ui/resonate.mp3',
    echo: '/audio/ui/echo.mp3',
    enter: '/audio/ui/enter.mp3',
    exit: '/audio/ui/exit.mp3',
  },
  // Weather transitions
  weather: {
    storm: '/audio/weather/storm.mp3',
    rain: '/audio/weather/rain.mp3',
    wind: '/audio/weather/wind.mp3',
  },
};

interface AudioState {
  // Settings
  isInitialized: boolean;
  masterVolume: number;
  ambientVolume: number;
  sfxVolume: number;
  isMuted: boolean;

  // Currently playing
  currentAmbient: VoidType | null;

  // Howl instances (not persisted)
  _ambientHowls: Map<VoidType, Howl>;
  _sfxHowls: Map<string, Howl>;

  // Actions
  initialize: () => void;
  setMasterVolume: (volume: number) => void;
  setAmbientVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  toggleMute: () => void;
  playAmbient: (voidType: VoidType) => void;
  stopAmbient: () => void;
  crossfadeAmbient: (voidType: VoidType) => void;
  playSfx: (sound: keyof typeof AUDIO_PATHS.ui) => void;
  playWeatherSound: (weather: keyof typeof AUDIO_PATHS.weather) => void;
  cleanup: () => void;
}

export const useAudioStore = create<AudioState>()(
  devtools(
    persist(
      (set, get) => ({
        isInitialized: false,
        masterVolume: 0.7,
        ambientVolume: 0.5,
        sfxVolume: 0.8,
        isMuted: false,
        currentAmbient: null,
        _ambientHowls: new Map(),
        _sfxHowls: new Map(),

        initialize: () => {
          const state = get();
          if (state.isInitialized) return;

          // Set global volume
          Howler.volume(state.masterVolume);

          // Preload ambient tracks
          const ambientHowls = new Map<VoidType, Howl>();
          (Object.entries(AUDIO_PATHS.ambient) as [VoidType, string][]).forEach(
            ([voidType, path]) => {
              const howl = new Howl({
                src: [path],
                loop: true,
                volume: 0,
                preload: true,
              });
              ambientHowls.set(voidType, howl);
            }
          );

          // Preload UI sounds
          const sfxHowls = new Map<string, Howl>();
          Object.entries(AUDIO_PATHS.ui).forEach(([name, path]) => {
            const howl = new Howl({
              src: [path],
              volume: state.sfxVolume,
              preload: true,
            });
            sfxHowls.set(name, howl);
          });

          set({
            isInitialized: true,
            _ambientHowls: ambientHowls,
            _sfxHowls: sfxHowls,
          });
        },

        setMasterVolume: (volume) => {
          Howler.volume(volume);
          set({ masterVolume: volume });
        },

        setAmbientVolume: (volume) => {
          const state = get();
          state._ambientHowls.forEach((howl) => {
            if (howl.playing()) {
              howl.volume(volume);
            }
          });
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
          if (!state.isInitialized || state.isMuted) return;

          const howl = state._ambientHowls.get(voidType);
          if (!howl) return;

          // Stop other ambient sounds
          state._ambientHowls.forEach((h, type) => {
            if (type !== voidType && h.playing()) {
              h.fade(h.volume(), 0, 1000);
              setTimeout(() => h.stop(), 1000);
            }
          });

          // Start new ambient
          if (!howl.playing()) {
            howl.play();
          }
          howl.fade(howl.volume(), state.ambientVolume, 2000);

          set({ currentAmbient: voidType });
        },

        stopAmbient: () => {
          const state = get();
          state._ambientHowls.forEach((howl) => {
            if (howl.playing()) {
              howl.fade(howl.volume(), 0, 1000);
              setTimeout(() => howl.stop(), 1000);
            }
          });
          set({ currentAmbient: null });
        },

        crossfadeAmbient: (voidType) => {
          const state = get();
          if (!state.isInitialized || state.currentAmbient === voidType) return;

          const currentHowl = state.currentAmbient
            ? state._ambientHowls.get(state.currentAmbient)
            : null;
          const nextHowl = state._ambientHowls.get(voidType);

          if (!nextHowl) return;

          // Start crossfade
          if (currentHowl && currentHowl.playing()) {
            currentHowl.fade(currentHowl.volume(), 0, 2000);
            setTimeout(() => currentHowl.stop(), 2000);
          }

          if (!nextHowl.playing()) {
            nextHowl.volume(0);
            nextHowl.play();
          }
          nextHowl.fade(0, state.ambientVolume, 2000);

          set({ currentAmbient: voidType });
        },

        playSfx: (sound) => {
          const state = get();
          if (!state.isInitialized || state.isMuted) return;

          const howl = state._sfxHowls.get(sound);
          if (howl) {
            howl.play();
          }
        },

        playWeatherSound: (weather) => {
          const state = get();
          if (!state.isInitialized || state.isMuted) return;

          const path = AUDIO_PATHS.weather[weather];
          if (!path) return;

          // Create one-shot howl for weather
          const howl = new Howl({
            src: [path],
            volume: state.ambientVolume * 0.7,
            onend: () => howl.unload(),
          });
          howl.play();
        },

        cleanup: () => {
          const state = get();
          state._ambientHowls.forEach((howl) => {
            howl.stop();
            howl.unload();
          });
          state._sfxHowls.forEach((howl) => {
            howl.unload();
          });
          set({
            isInitialized: false,
            currentAmbient: null,
            _ambientHowls: new Map(),
            _sfxHowls: new Map(),
          });
        },
      }),
      {
        name: 'audio-settings',
        partialize: (state) => ({
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

/**
 * Settings Store
 *
 * Persisted user preferences for the app
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  // Confidant settings
  confidantEnabled: boolean;

  // Audio settings
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  ambientVolume: number;
  sfxVolume: number;

  // Privacy settings
  screenshotBlockingEnabled: boolean;

  // Display settings
  reducedMotion: boolean;
  autoplayAnimations: boolean;

  // Actions
  setConfidantEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setAmbientVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setScreenshotBlockingEnabled: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setAutoplayAnimations: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

const defaultSettings = {
  confidantEnabled: true,
  soundEnabled: true,
  hapticsEnabled: true,
  ambientVolume: 0.5,
  sfxVolume: 0.8,
  screenshotBlockingEnabled: true,
  reducedMotion: false,
  autoplayAnimations: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setConfidantEnabled: (enabled) => set({ confidantEnabled: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setAmbientVolume: (volume) => set({ ambientVolume: volume }),
      setSfxVolume: (volume) => set({ sfxVolume: volume }),
      setScreenshotBlockingEnabled: (enabled) => set({ screenshotBlockingEnabled: enabled }),
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
      setAutoplayAnimations: (enabled) => set({ autoplayAnimations: enabled }),
      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'void-settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const selectConfidantEnabled = (state: SettingsState) => state.confidantEnabled;
export const selectSoundEnabled = (state: SettingsState) => state.soundEnabled;
export const selectHapticsEnabled = (state: SettingsState) => state.hapticsEnabled;

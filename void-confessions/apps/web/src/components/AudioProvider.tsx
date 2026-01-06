'use client';

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useAudioStore } from '@/store/audioStore';
import type { VoidType, WeatherState } from '@void-confessions/core';

interface AudioContextValue {
  // State
  isEnabled: boolean;
  isInitialized: boolean;
  isMuted: boolean;
  masterVolume: number;
  ambientVolume: number;
  sfxVolume: number;

  // Actions
  initialize: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setAmbientVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  toggleMute: () => void;

  // Playback
  enterVoid: (voidType: VoidType) => void;
  exitVoid: () => void;
  updateWeather: (weather: WeatherState) => void;

  // Sound effects
  playConfessionRelease: () => void;
  playResonance: () => void;
  playEcho: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

// Safe hook that returns null if not in provider
export function useAudioSafe(): AudioContextValue | null {
  return useContext(AudioContext);
}

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const store = useAudioStore();
  const hasInitialized = useRef(false);
  const interactionHandled = useRef(false);

  // Initialize audio on first user interaction (required by browsers)
  useEffect(() => {
    if (hasInitialized.current) return;

    const handleInteraction = async () => {
      if (interactionHandled.current) return;
      interactionHandled.current = true;

      // Small delay to ensure browser context is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (store.isEnabled && !store.isInitialized) {
        await store.initialize();
        hasInitialized.current = true;
      }

      // Remove listeners after first interaction
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [store]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      store.cleanup();
    };
  }, []);

  // Handle visibility change - pause/resume audio
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Mute when tab is hidden (but keep playing for seamless return)
        if (!store.isMuted) {
          store.toggleMute();
          // Store that we auto-muted
          sessionStorage.setItem('void-audio-auto-muted', 'true');
        }
      } else {
        // Unmute when tab is visible again (only if we auto-muted)
        if (sessionStorage.getItem('void-audio-auto-muted') === 'true') {
          sessionStorage.removeItem('void-audio-auto-muted');
          if (store.isMuted) {
            store.toggleMute();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [store]);

  // Wrap store actions with additional logic
  const enterVoid = useCallback(
    (voidType: VoidType) => {
      store.crossfadeToVoid(voidType);
    },
    [store]
  );

  const exitVoid = useCallback(() => {
    store.stopAmbient();
    store.playSfx('exit');
  }, [store]);

  const value: AudioContextValue = {
    // State
    isEnabled: store.isEnabled,
    isInitialized: store.isInitialized,
    isMuted: store.isMuted,
    masterVolume: store.masterVolume,
    ambientVolume: store.ambientVolume,
    sfxVolume: store.sfxVolume,

    // Actions
    initialize: store.initialize,
    setEnabled: store.setEnabled,
    setMasterVolume: store.setMasterVolume,
    setAmbientVolume: store.setAmbientVolume,
    setSfxVolume: store.setSfxVolume,
    toggleMute: store.toggleMute,

    // Playback
    enterVoid,
    exitVoid,
    updateWeather: store.updateWeather,

    // Sound effects
    playConfessionRelease: store.playConfessionRelease,
    playResonance: store.playResonance,
    playEcho: store.playEcho,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

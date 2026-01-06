import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { VoidType, WeatherState, Confession } from '@void-confessions/core';

interface VoidState {
  // Current void
  currentVoid: VoidType | null;
  weather: WeatherState;
  collectiveCount: number;

  // Confessions
  confessions: Confession[];
  pendingConfession: string;

  // UI State
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentVoid: (voidType: VoidType | null) => void;
  setWeather: (weather: WeatherState) => void;
  setCollectiveCount: (count: number) => void;
  addConfession: (confession: Confession) => void;
  removeConfession: (id: string) => void;
  updateConfessionResonance: (id: string, delta: number) => void;
  setPendingConfession: (text: string) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentVoid: null,
  weather: {
    state: 'calm' as const,
    intensity: 0.5,
    nextChange: Date.now() + 300000,
  },
  collectiveCount: 0,
  confessions: [],
  pendingConfession: '',
  isConnected: false,
  isLoading: false,
  error: null,
};

export const useVoidStore = create<VoidState>()(
  devtools(
    immer((set) => ({
      ...initialState,

      setCurrentVoid: (voidType) =>
        set((state) => {
          state.currentVoid = voidType;
          state.confessions = []; // Clear confessions when switching voids
        }),

      setWeather: (weather) =>
        set((state) => {
          state.weather = weather;
        }),

      setCollectiveCount: (count) =>
        set((state) => {
          state.collectiveCount = count;
        }),

      addConfession: (confession) =>
        set((state) => {
          // Keep only last 50 confessions for performance
          if (state.confessions.length >= 50) {
            state.confessions = state.confessions.slice(-49);
          }
          state.confessions.push(confession);
        }),

      removeConfession: (id) =>
        set((state) => {
          state.confessions = state.confessions.filter((c) => c.id !== id);
        }),

      updateConfessionResonance: (id, delta) =>
        set((state) => {
          const confession = state.confessions.find((c) => c.id === id);
          if (confession) {
            confession.resonanceCount = (confession.resonanceCount || 0) + delta;
          }
        }),

      setPendingConfession: (text) =>
        set((state) => {
          state.pendingConfession = text;
        }),

      setConnected: (connected) =>
        set((state) => {
          state.isConnected = connected;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      reset: () => set(initialState),
    })),
    { name: 'void-store' }
  )
);

// Selectors for optimized re-renders
export const selectCurrentVoid = (state: VoidState) => state.currentVoid;
export const selectWeather = (state: VoidState) => state.weather;
export const selectConfessions = (state: VoidState) => state.confessions;
export const selectIsConnected = (state: VoidState) => state.isConnected;

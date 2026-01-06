import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  VoidType,
  VoidWeatherState,
  Confession,
  ReleaseStyle,
  EchoWord,
} from '@void-confessions/core';

/**
 * Connection status for WebSocket
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Draft confession being composed
 */
export interface DraftConfession {
  content: string;
  voidType: VoidType | null;
  releaseStyle: ReleaseStyle;
  audioUri?: string;
}

/**
 * Void store state
 */
interface VoidState {
  // Connection
  connectionStatus: ConnectionStatus;
  lastError: string | null;

  // Active void
  activeVoid: VoidType | null;
  weather: Record<VoidType, VoidWeatherState | null>;

  // Confessions in view
  confessions: Confession[];
  activeConfession: Confession | null;

  // Draft
  draft: DraftConfession;

  // User session (anonymous)
  sessionHash: string | null;

  // Premium status
  isPremium: boolean;
  premiumFeatures: {
    customReleaseStyles: boolean;
    extendedEchoes: boolean;
    voiceConfessions: boolean;
    noAds: boolean;
  };

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setActiveVoid: (voidType: VoidType | null) => void;
  setWeather: (voidType: VoidType, weather: VoidWeatherState) => void;
  addConfession: (confession: Confession) => void;
  removeConfession: (confessionId: string) => void;
  updateConfession: (confession: Confession) => void;
  setActiveConfession: (confession: Confession | null) => void;
  updateDraft: (updates: Partial<DraftConfession>) => void;
  resetDraft: () => void;
  setSessionHash: (hash: string) => void;
  setPremiumStatus: (isPremium: boolean) => void;
  clearConfessions: () => void;
}

const initialDraft: DraftConfession = {
  content: '',
  voidType: null,
  releaseStyle: 'default',
};

/**
 * Main Zustand store for void confessions state
 */
export const useVoidStore = create<VoidState>()(
  immer((set) => ({
    // Initial state
    connectionStatus: 'disconnected',
    lastError: null,
    activeVoid: null,
    weather: {
      grief: null,
      rage: null,
      guilt: null,
      longing: null,
      relief: null,
    },
    confessions: [],
    activeConfession: null,
    draft: initialDraft,
    sessionHash: null,
    isPremium: false,
    premiumFeatures: {
      customReleaseStyles: false,
      extendedEchoes: false,
      voiceConfessions: false,
      noAds: false,
    },

    // Actions
    setConnectionStatus: (status) =>
      set((state) => {
        state.connectionStatus = status;
        if (status === 'connected') {
          state.lastError = null;
        }
      }),

    setActiveVoid: (voidType) =>
      set((state) => {
        state.activeVoid = voidType;
        // Clear confessions when changing voids
        if (voidType !== state.activeVoid) {
          state.confessions = [];
        }
      }),

    setWeather: (voidType, weather) =>
      set((state) => {
        state.weather[voidType] = weather;
      }),

    addConfession: (confession) =>
      set((state) => {
        // Add to beginning, limit to 50 confessions in memory
        state.confessions = [confession, ...state.confessions].slice(0, 50);
      }),

    removeConfession: (confessionId) =>
      set((state) => {
        state.confessions = state.confessions.filter((c) => c.id !== confessionId);
        if (state.activeConfession?.id === confessionId) {
          state.activeConfession = null;
        }
      }),

    updateConfession: (confession) =>
      set((state) => {
        const index = state.confessions.findIndex((c) => c.id === confession.id);
        if (index !== -1) {
          state.confessions[index] = confession;
        }
        if (state.activeConfession?.id === confession.id) {
          state.activeConfession = confession;
        }
      }),

    setActiveConfession: (confession) =>
      set((state) => {
        state.activeConfession = confession;
      }),

    updateDraft: (updates) =>
      set((state) => {
        state.draft = { ...state.draft, ...updates };
      }),

    resetDraft: () =>
      set((state) => {
        state.draft = initialDraft;
      }),

    setSessionHash: (hash) =>
      set((state) => {
        state.sessionHash = hash;
      }),

    setPremiumStatus: (isPremium) =>
      set((state) => {
        state.isPremium = isPremium;
        state.premiumFeatures = {
          customReleaseStyles: isPremium,
          extendedEchoes: isPremium,
          voiceConfessions: isPremium,
          noAds: isPremium,
        };
      }),

    clearConfessions: () =>
      set((state) => {
        state.confessions = [];
        state.activeConfession = null;
      }),
  }))
);

/**
 * Selectors for common state access patterns
 */
export const selectActiveWeather = (state: VoidState) =>
  state.activeVoid ? state.weather[state.activeVoid] : null;

export const selectIsConnected = (state: VoidState) =>
  state.connectionStatus === 'connected';

export const selectCanUseVoice = (state: VoidState) =>
  state.premiumFeatures.voiceConfessions;

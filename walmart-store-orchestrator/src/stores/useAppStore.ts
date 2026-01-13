import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Store, SectionKey, MARKET_36_STORES } from '@/data/stores';

interface AppState {
  // Selected store
  selectedStore: Store | null;
  setSelectedStore: (store: Store | null) => void;

  // Active section (A-K)
  activeSection: SectionKey;
  setActiveSection: (section: SectionKey) => void;

  // Dark mode
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;

  // Mobile navigation open state
  mobileNavOpen: boolean;
  setMobileNavOpen: (value: boolean) => void;

  // Store selector modal
  storeSelectorOpen: boolean;
  setStoreSelectorOpen: (value: boolean) => void;

  // Search query for stores
  storeSearchQuery: string;
  setStoreSearchQuery: (query: string) => void;

  // Filter stores by search query
  filteredStores: () => Store[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Default to first store in the list
      selectedStore: MARKET_36_STORES[0],
      setSelectedStore: (store) => set({ selectedStore: store, storeSelectorOpen: false }),

      // Default to section A (Fresh)
      activeSection: 'A',
      setActiveSection: (section) => set({ activeSection: section }),

      // Dark mode enabled by default
      darkMode: true,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setDarkMode: (value) => set({ darkMode: value }),

      // Mobile nav closed by default
      mobileNavOpen: false,
      setMobileNavOpen: (value) => set({ mobileNavOpen: value }),

      // Store selector closed by default
      storeSelectorOpen: false,
      setStoreSelectorOpen: (value) => set({ storeSelectorOpen: value }),

      // Store search
      storeSearchQuery: '',
      setStoreSearchQuery: (query) => set({ storeSearchQuery: query }),

      // Filter stores based on search query
      filteredStores: () => {
        const query = get().storeSearchQuery.toLowerCase();
        if (!query) return MARKET_36_STORES;
        return MARKET_36_STORES.filter(
          (store) =>
            store.name.toLowerCase().includes(query) ||
            store.address.toLowerCase().includes(query) ||
            store.city.toLowerCase().includes(query) ||
            store.storeNumber.toString().includes(query)
        );
      },
    }),
    {
      name: 'walmart-store-orchestrator-storage',
      partialize: (state) => ({
        selectedStore: state.selectedStore,
        activeSection: state.activeSection,
        darkMode: state.darkMode,
      }),
    }
  )
);

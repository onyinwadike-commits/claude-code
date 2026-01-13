'use client';

import { useAppStore } from '@/stores/useAppStore';
import { Store } from '@/data/stores';
import { X, Search, MapPin, Phone, Building2, Check } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function StoreSelector() {
  const {
    storeSelectorOpen,
    setStoreSelectorOpen,
    selectedStore,
    setSelectedStore,
    storeSearchQuery,
    setStoreSearchQuery,
    filteredStores,
  } = useAppStore();

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (storeSelectorOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [storeSelectorOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && storeSelectorOpen) {
        setStoreSelectorOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [storeSelectorOpen, setStoreSelectorOpen]);

  if (!storeSelectorOpen) return null;

  const stores = filteredStores();

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
    setStoreSearchQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={() => {
          setStoreSelectorOpen(false);
          setStoreSearchQuery('');
        }}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl glass-modal p-6 animate-scale-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Select Store</h2>
            <p className="text-sm text-white/60 mt-1">Market 36 - Las Vegas</p>
          </div>
          <button
            onClick={() => {
              setStoreSelectorOpen(false);
              setStoreSearchQuery('');
            }}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={24} className="text-white/60" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by store number, name, or address..."
            value={storeSearchQuery}
            onChange={(e) => setStoreSearchQuery(e.target.value)}
            className="w-full glass-input pl-12"
          />
        </div>

        {/* Store list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {stores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60">No stores found matching your search.</p>
            </div>
          ) : (
            stores.map((store) => {
              const isSelected = selectedStore?.id === store.id;

              return (
                <button
                  key={store.id}
                  onClick={() => handleStoreSelect(store)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                    isSelected
                      ? 'bg-walmart-blue/30 border border-walmart-blue/50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Store header */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-walmart-blue/30 text-walmart-yellow rounded-lg text-sm font-bold">
                          #{store.storeNumber}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            store.format === 'Supercenter'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {store.format}
                        </span>
                        {isSelected && (
                          <span className="ml-auto flex items-center gap-1 text-walmart-yellow">
                            <Check size={16} />
                            <span className="text-xs">Selected</span>
                          </span>
                        )}
                      </div>

                      {/* Store name */}
                      <h3 className="text-white font-semibold mb-2">{store.name}</h3>

                      {/* Store details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <MapPin size={14} />
                          <span>
                            {store.address}, {store.city}, {store.state} {store.zipCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Phone size={14} />
                          <span>{store.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Building2 size={14} />
                          <span>
                            Sections: {store.sections.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer with store count */}
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <p className="text-sm text-white/40">
            {stores.length} store{stores.length !== 1 ? 's' : ''} in Market 36
          </p>
        </div>
      </div>
    </div>
  );
}

// Compact store selector button for header
export function StoreButton() {
  const { selectedStore, setStoreSelectorOpen } = useAppStore();

  return (
    <button
      onClick={() => setStoreSelectorOpen(true)}
      className="glass-button flex items-center gap-2"
    >
      <Building2 size={18} />
      {selectedStore ? (
        <>
          <span className="font-bold text-walmart-yellow">#{selectedStore.storeNumber}</span>
          <span className="hidden sm:inline text-white/80 text-sm">
            {selectedStore.city}
          </span>
        </>
      ) : (
        <span>Select Store</span>
      )}
    </button>
  );
}

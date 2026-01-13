'use client';

import { useAppStore } from '@/stores/useAppStore';
import { SECTIONS, getSectionByKey } from '@/data/stores';
import { SectionIcon } from '@/components';
import { MapPin, Phone, Building2, Users, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

export default function Home() {
  const { selectedStore, activeSection, setStoreSelectorOpen } = useAppStore();
  const currentSection = getSectionByKey(activeSection);

  // If no store is selected, prompt to select one
  if (!selectedStore) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="glass-card p-8 max-w-md animate-fade-in">
          <Building2 size={48} className="text-walmart-blue mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Store Orchestrator</h2>
          <p className="text-white/60 mb-6">
            Select a store from Market 36 to begin managing operations.
          </p>
          <button
            onClick={() => setStoreSelectorOpen(true)}
            className="w-full py-3 px-6 bg-walmart-blue hover:bg-walmart-darkBlue text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Select a Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Store Info Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1.5 bg-walmart-blue/30 text-walmart-yellow rounded-lg text-lg font-bold">
                #{selectedStore.storeNumber}
              </span>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  selectedStore.format === 'Supercenter'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                {selectedStore.format}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{selectedStore.name}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {selectedStore.address}, {selectedStore.city}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={14} />
                {selectedStore.phone}
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4">
            <div className="glass-button flex flex-col items-center p-3 min-w-[80px]">
              <Users size={20} className="text-walmart-blue mb-1" />
              <span className="text-xs text-white/60">Associates</span>
              <span className="font-bold text-white">247</span>
            </div>
            <div className="glass-button flex flex-col items-center p-3 min-w-[80px]">
              <TrendingUp size={20} className="text-green-400 mb-1" />
              <span className="text-xs text-white/60">Sales</span>
              <span className="font-bold text-white">+12%</span>
            </div>
            <div className="glass-button flex flex-col items-center p-3 min-w-[80px]">
              <AlertTriangle size={20} className="text-yellow-400 mb-1" />
              <span className="text-xs text-white/60">Alerts</span>
              <span className="font-bold text-white">3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Section Header */}
      {currentSection && (
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-walmart-blue/20 border border-walmart-blue/30">
            <SectionIcon section={currentSection.key} size={24} className="text-walmart-yellow" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Section {currentSection.key}: {currentSection.name}
            </h3>
            <p className="text-sm text-white/60">{currentSection.description}</p>
          </div>
        </div>
      )}

      {/* Section Content Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder cards for section content */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="glass-card p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 shimmer" />
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4 shimmer" />
              <div className="h-3 bg-white/10 rounded w-1/2 shimmer" />
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Last updated</span>
                <span className="text-white/60 flex items-center gap-1">
                  <Clock size={12} />
                  Just now
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section Navigation Quick Links */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Quick Navigation</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
          {SECTIONS.filter((s) => selectedStore.sections.includes(s.key)).map((section) => (
            <button
              key={section.key}
              onClick={() => useAppStore.getState().setActiveSection(section.key)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 ${
                activeSection === section.key
                  ? 'bg-walmart-blue/30 text-walmart-yellow border border-walmart-blue/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <SectionIcon section={section.key} size={20} />
              <span className="text-xs font-medium">{section.key}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useAppStore } from '@/stores/useAppStore';
import { SECTIONS, SectionKey } from '@/data/stores';
import { SectionIcon } from '@/components/icons/SectionIcon';
import { Store, MoreHorizontal, X } from 'lucide-react';
import { useState } from 'react';

export function MobileBottomNav() {
  const { activeSection, setActiveSection, setStoreSelectorOpen, selectedStore } = useAppStore();
  const [showMoreSections, setShowMoreSections] = useState(false);

  // Show first 4 sections in the main nav, rest in overflow menu
  const mainSections = SECTIONS.slice(0, 4);
  const overflowSections = SECTIONS.slice(4);

  const handleSectionClick = (key: SectionKey) => {
    setActiveSection(key);
    setShowMoreSections(false);
  };

  return (
    <>
      {/* Overflow menu modal */}
      {showMoreSections && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMoreSections(false)}
          />

          {/* Menu */}
          <div className="absolute bottom-20 left-4 right-4 glass-modal p-4 animate-slide-up safe-bottom">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">More Sections</h3>
              <button
                onClick={() => setShowMoreSections(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-white/60" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {overflowSections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => handleSectionClick(section.key)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                    activeSection === section.key
                      ? 'bg-walmart-blue/30 text-walmart-yellow'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <SectionIcon section={section.key} size={24} />
                  <span className="text-xs font-medium">{section.key}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden glass-nav safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Store selector button */}
          <button
            onClick={() => setStoreSelectorOpen(true)}
            className="mobile-nav-item min-w-[60px]"
          >
            <Store size={22} />
            <span className="text-[10px] font-medium truncate max-w-[60px]">
              {selectedStore ? `#${selectedStore.storeNumber}` : 'Store'}
            </span>
          </button>

          {/* Main section buttons */}
          {mainSections.map((section) => (
            <button
              key={section.key}
              onClick={() => handleSectionClick(section.key)}
              className={`mobile-nav-item min-w-[50px] ${
                activeSection === section.key ? 'active' : ''
              }`}
            >
              <SectionIcon section={section.key} size={22} />
              <span className="text-[10px] font-medium">{section.key}</span>
            </button>
          ))}

          {/* More button */}
          <button
            onClick={() => setShowMoreSections(true)}
            className={`mobile-nav-item min-w-[50px] ${
              overflowSections.some((s) => s.key === activeSection) ? 'active' : ''
            }`}
          >
            <MoreHorizontal size={22} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

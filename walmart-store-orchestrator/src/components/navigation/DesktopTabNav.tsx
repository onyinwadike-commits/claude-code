'use client';

import { useAppStore } from '@/stores/useAppStore';
import { SECTIONS } from '@/data/stores';
import { SectionIcon } from '@/components/icons/SectionIcon';

export function DesktopTabNav() {
  const { activeSection, setActiveSection, selectedStore } = useAppStore();

  // Filter sections based on what the store supports
  const availableSections = selectedStore
    ? SECTIONS.filter((s) => selectedStore.sections.includes(s.key))
    : SECTIONS;

  return (
    <nav className="hidden md:flex items-center gap-1 px-4 py-2 overflow-x-auto">
      {availableSections.map((section) => {
        const isActive = activeSection === section.key;

        return (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`section-tab flex items-center gap-2 no-select ${
              isActive ? 'active' : ''
            }`}
            title={`${section.name}: ${section.description}`}
          >
            <SectionIcon section={section.key} size={18} />
            <span className="font-medium">{section.key}</span>
            <span className="hidden lg:inline text-sm opacity-80">{section.name}</span>
          </button>
        );
      })}
    </nav>
  );
}

// Compact version for sidebar use
export function DesktopTabNavVertical() {
  const { activeSection, setActiveSection, selectedStore } = useAppStore();

  const availableSections = selectedStore
    ? SECTIONS.filter((s) => selectedStore.sections.includes(s.key))
    : SECTIONS;

  return (
    <nav className="hidden md:flex flex-col gap-1 p-2">
      {availableSections.map((section) => {
        const isActive = activeSection === section.key;

        return (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 no-select ${
              isActive
                ? 'bg-walmart-blue/20 text-walmart-yellow border border-walmart-blue/30'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title={section.description}
          >
            <SectionIcon section={section.key} size={20} />
            <div className="flex flex-col items-start">
              <span className="font-semibold text-sm">
                {section.key} - {section.name}
              </span>
              <span className="text-xs opacity-60">{section.description}</span>
            </div>
          </button>
        );
      })}
    </nav>
  );
}

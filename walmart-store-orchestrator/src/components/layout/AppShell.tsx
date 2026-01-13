'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { DesktopTabNav } from '@/components/navigation/DesktopTabNav';
import { StoreSelector, StoreButton } from '@/components/store-selector/StoreSelector';
import { Moon, Sun, Menu } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { darkMode, toggleDarkMode, selectedStore, activeSection } = useAppStore();

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 glass-header">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-walmart-blue to-walmart-darkBlue flex items-center justify-center shadow-lg">
                  <span className="text-walmart-yellow text-lg font-bold">W</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-walmart-yellow flex items-center justify-center">
                  <span className="text-[8px] font-bold text-walmart-darkBlue">36</span>
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Store Orchestrator</h1>
                <p className="text-xs text-white/60 hidden sm:block">
                  Market 36 Operations Hub
                </p>
              </div>
            </div>

            {/* Center - Store Button (visible on larger screens) */}
            <div className="hidden md:block">
              <StoreButton />
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* Current section indicator */}
              {selectedStore && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs text-white/60">Section</span>
                  <span className="font-bold text-walmart-yellow">{activeSection}</span>
                </div>
              )}

              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <Sun size={20} className="text-walmart-yellow" />
                ) : (
                  <Moon size={20} className="text-white/80" />
                )}
              </button>

              {/* Mobile menu button (future use) */}
              <button className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors">
                <Menu size={20} className="text-white/80" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop section tabs */}
        <div className="border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <DesktopTabNav />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />

      {/* Store selector modal */}
      <StoreSelector />
    </div>
  );
}

'use client';

/**
 * Admin Dashboard
 *
 * Main moderation console showing:
 * - Flagged confessions queue (privacy-protected)
 * - Shift timer with rotation alerts
 * - Moderation statistics
 *
 * Privacy: NO user identifiers, NO IP addresses shown.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store';
import {
  AuthGuard,
  ShiftTimer,
  ModerationQueue,
  StatsPanel,
} from '../components';

export default function AdminDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Play rotation sound when needed
  const handleRotationNeeded = useCallback(() => {
    // In production, this could trigger an audio alert
    console.log('Rotation recommended - 2 hours exceeded');
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-gray-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-void-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-lg font-semibold">Moderation Console</h1>
                </div>

                {/* Role badge */}
                {user && (
                  <span className="px-2.5 py-0.5 bg-void-600/20 text-void-300 rounded-full text-xs font-medium">
                    {user.role.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* User info */}
                <span className="text-sm text-gray-300">
                  {user?.username}
                </span>

                {/* Logout */}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Shift Timer */}
              <ShiftTimer onRotationNeeded={handleRotationNeeded} />

              {/* Stats Panel */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-4">
                  Today&apos;s Activity
                </h3>
                <StatsPanel />
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-4">
                  Resources
                </h3>
                <div className="space-y-2">
                  <a
                    href="#"
                    className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    📋 Moderation Guidelines
                  </a>
                  <a
                    href="#"
                    className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    🆘 Escalation Contacts
                  </a>
                  <a
                    href="#"
                    className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    💚 Wellbeing Resources
                  </a>
                </div>
              </div>
            </div>

            {/* Main Queue */}
            <div className="lg:col-span-3">
              <ModerationQueue />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between text-xs">
              <p>
                🔒 Privacy-first moderation • No user data exposed
              </p>
              <p>
                Void Confessions Admin v0.1.0
              </p>
            </div>
          </div>
        </footer>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                End Session?
              </h3>
              <p className="text-gray-600 mb-6">
                {user?.shiftStartedAt
                  ? 'You have an active shift. Signing out will end your shift and log you out.'
                  : 'Are you sure you want to sign out?'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Sign Out
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

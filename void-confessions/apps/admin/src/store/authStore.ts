/**
 * Authentication Store
 *
 * Manages admin authentication state.
 * Only admin accounts can access the moderation console.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminUser {
  id: string;
  username: string;
  role: 'moderator' | 'admin' | 'senior_moderator';
  shiftStartedAt: number | null;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  startShift: () => void;
  endShift: () => void;
  clearError: () => void;
}

// Simulated admin credentials (in production, this would be server-validated)
const ADMIN_CREDENTIALS = [
  { username: 'moderator', password: 'mod_secure_2024', role: 'moderator' as const },
  { username: 'admin', password: 'admin_secure_2024', role: 'admin' as const },
  { username: 'senior', password: 'senior_secure_2024', role: 'senior_moderator' as const },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Find matching admin credentials
        const adminUser = ADMIN_CREDENTIALS.find(
          (cred) => cred.username === username && cred.password === password
        );

        if (!adminUser) {
          set({
            isLoading: false,
            error: 'Invalid credentials. Admin access only.',
          });
          return false;
        }

        // Generate mock token
        const token = `admin_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        set({
          user: {
            id: `admin_${adminUser.username}`,
            username: adminUser.username,
            role: adminUser.role,
            shiftStartedAt: null,
          },
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return true;
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      startShift: () => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              shiftStartedAt: Date.now(),
            },
          });
        }
      },

      endShift: () => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              shiftStartedAt: null,
            },
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'void-admin-auth',
      partialize: (state) => ({
        // Only persist essential auth data, not shift state
        token: state.token,
        user: state.user
          ? { ...state.user, shiftStartedAt: null }
          : null,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors
export const selectIsAdmin = (state: AuthState) =>
  state.user?.role === 'admin' || state.user?.role === 'senior_moderator';

export const selectCanManageModerators = (state: AuthState) =>
  state.user?.role === 'admin';

export const selectShiftDuration = (state: AuthState) => {
  if (!state.user?.shiftStartedAt) return 0;
  return Date.now() - state.user.shiftStartedAt;
};

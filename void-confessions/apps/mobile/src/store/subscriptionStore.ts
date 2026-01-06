import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import {
  SubscriptionTier,
  TIER_CONFIG,
  ENTITLEMENTS,
  FEATURES,
  FEATURE_TIER_REQUIREMENTS,
  RELEASE_ANIMATION_ENTITLEMENTS,
  type FeatureId,
  type EntitlementId,
  type TierConfig,
} from '../config/revenueCat';

// ============================================================================
// TYPES
// ============================================================================

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  isActive: boolean;
  expirationDate: string | null;
  willRenew: boolean;
  productId: string | null;
  isTrialPeriod: boolean;
  periodType: 'normal' | 'trial' | 'intro';
}

export interface PurchasedRelease {
  id: string;
  purchaseDate: string;
}

interface SubscriptionState {
  // Initialization
  isInitialized: boolean;
  isLoading: boolean;

  // Subscription state
  subscription: SubscriptionInfo;

  // Individual purchases (release animations)
  purchasedReleases: Set<string>;

  // Active entitlements from RevenueCat
  activeEntitlements: Set<string>;

  // Available packages for purchase
  subscriptionPackages: PurchasesPackage[];
  releasePackages: PurchasesPackage[];

  // Error state
  lastError: string | null;

  // Actions
  setInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
  setSubscription: (info: Partial<SubscriptionInfo>) => void;
  setActiveEntitlements: (entitlements: string[]) => void;
  addPurchasedRelease: (releaseId: string) => void;
  setSubscriptionPackages: (packages: PurchasesPackage[]) => void;
  setReleasePackages: (packages: PurchasesPackage[]) => void;
  setError: (error: string | null) => void;
  updateFromCustomerInfo: (customerInfo: CustomerInfo) => void;
  reset: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Determine subscription tier from active entitlements
 */
function getTierFromEntitlements(entitlements: Set<string>): SubscriptionTier {
  if (entitlements.has(ENTITLEMENTS.witnessed)) {
    return SubscriptionTier.Witnessed;
  }
  if (entitlements.has(ENTITLEMENTS.guardian)) {
    return SubscriptionTier.Guardian;
  }
  if (entitlements.has(ENTITLEMENTS.voidWalker)) {
    return SubscriptionTier.VoidWalker;
  }
  return SubscriptionTier.Free;
}

/**
 * Extract subscription info from CustomerInfo
 */
function extractSubscriptionInfo(customerInfo: CustomerInfo): SubscriptionInfo {
  const entitlements = new Set(Object.keys(customerInfo.entitlements.active));
  const tier = getTierFromEntitlements(entitlements);

  // Find the active subscription entitlement
  const tierConfig = TIER_CONFIG[tier];
  const activeEntitlement = tierConfig.entitlement
    ? customerInfo.entitlements.active[tierConfig.entitlement]
    : null;

  return {
    tier,
    isActive: tier !== SubscriptionTier.Free,
    expirationDate: activeEntitlement?.expirationDate ?? null,
    willRenew: activeEntitlement?.willRenew ?? false,
    productId: activeEntitlement?.productIdentifier ?? null,
    isTrialPeriod: activeEntitlement?.periodType === 'TRIAL',
    periodType: activeEntitlement?.periodType === 'TRIAL'
      ? 'trial'
      : activeEntitlement?.periodType === 'INTRO'
        ? 'intro'
        : 'normal',
  };
}

/**
 * Extract purchased release animations from CustomerInfo
 */
function extractPurchasedReleases(customerInfo: CustomerInfo): Set<string> {
  const purchased = new Set<string>();
  const entitlements = customerInfo.entitlements.active;

  // Check individual release entitlements
  Object.entries(RELEASE_ANIMATION_ENTITLEMENTS).forEach(([featureId, entitlementId]) => {
    if (entitlements[entitlementId]) {
      purchased.add(featureId);
    }
  });

  // If user has subscription with all releases, add them all
  if (entitlements[ENTITLEMENTS.allReleaseAnimations]) {
    Object.keys(RELEASE_ANIMATION_ENTITLEMENTS).forEach((featureId) => {
      purchased.add(featureId);
    });
  }

  return purchased;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialSubscription: SubscriptionInfo = {
  tier: SubscriptionTier.Free,
  isActive: false,
  expirationDate: null,
  willRenew: false,
  productId: null,
  isTrialPeriod: false,
  periodType: 'normal',
};

// ============================================================================
// STORE
// ============================================================================

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      isInitialized: false,
      isLoading: false,
      subscription: initialSubscription,
      purchasedReleases: new Set(),
      activeEntitlements: new Set(),
      subscriptionPackages: [],
      releasePackages: [],
      lastError: null,

      // Actions
      setInitialized: (initialized) => set({ isInitialized: initialized }),

      setLoading: (loading) => set({ isLoading: loading }),

      setSubscription: (info) =>
        set((state) => ({
          subscription: { ...state.subscription, ...info },
        })),

      setActiveEntitlements: (entitlements) =>
        set({ activeEntitlements: new Set(entitlements) }),

      addPurchasedRelease: (releaseId) =>
        set((state) => {
          const newSet = new Set(state.purchasedReleases);
          newSet.add(releaseId);
          return { purchasedReleases: newSet };
        }),

      setSubscriptionPackages: (packages) => set({ subscriptionPackages: packages }),

      setReleasePackages: (packages) => set({ releasePackages: packages }),

      setError: (error) => set({ lastError: error }),

      updateFromCustomerInfo: (customerInfo) => {
        const subscription = extractSubscriptionInfo(customerInfo);
        const purchasedReleases = extractPurchasedReleases(customerInfo);
        const activeEntitlements = new Set(Object.keys(customerInfo.entitlements.active));

        set({
          subscription,
          purchasedReleases,
          activeEntitlements,
          lastError: null,
        });
      },

      reset: () =>
        set({
          isInitialized: false,
          isLoading: false,
          subscription: initialSubscription,
          purchasedReleases: new Set(),
          activeEntitlements: new Set(),
          subscriptionPackages: [],
          releasePackages: [],
          lastError: null,
        }),
    }),
    {
      name: 'void-subscription-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist subscription info, not packages or loading states
        subscription: state.subscription,
        purchasedReleases: Array.from(state.purchasedReleases),
      }),
      // Transform Set to Array for storage and back
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        purchasedReleases: new Set(persistedState?.purchasedReleases || []),
        activeEntitlements: new Set(),
      }),
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Get current subscription tier
 */
export const selectTier = (state: SubscriptionState): SubscriptionTier =>
  state.subscription.tier;

/**
 * Get tier config for current subscription
 */
export const selectTierConfig = (state: SubscriptionState): TierConfig =>
  TIER_CONFIG[state.subscription.tier];

/**
 * Check if user has at least the specified tier
 */
export const selectHasTier =
  (requiredTier: SubscriptionTier) =>
  (state: SubscriptionState): boolean =>
    state.subscription.tier >= requiredTier;

/**
 * Check if a feature is available to the user
 */
export const selectHasFeature =
  (featureId: FeatureId) =>
  (state: SubscriptionState): boolean => {
    const requiredTier = FEATURE_TIER_REQUIREMENTS[featureId];

    // For release animations, check individual purchases OR subscription
    if (Object.keys(RELEASE_ANIMATION_ENTITLEMENTS).includes(featureId)) {
      // Subscription tier VoidWalker+ includes all release animations
      if (state.subscription.tier >= SubscriptionTier.VoidWalker) {
        return true;
      }
      // Check if individually purchased
      return state.purchasedReleases.has(featureId);
    }

    // For other features, check tier requirement
    return state.subscription.tier >= requiredTier;
  };

/**
 * Check if user has active subscription
 */
export const selectIsSubscribed = (state: SubscriptionState): boolean =>
  state.subscription.isActive;

/**
 * Get subscription expiration date
 */
export const selectExpirationDate = (state: SubscriptionState): string | null =>
  state.subscription.expirationDate;

/**
 * Check if subscription will renew
 */
export const selectWillRenew = (state: SubscriptionState): boolean =>
  state.subscription.willRenew;

/**
 * Check if user is in trial period
 */
export const selectIsTrialPeriod = (state: SubscriptionState): boolean =>
  state.subscription.isTrialPeriod;

/**
 * Get all purchased release animations
 */
export const selectPurchasedReleases = (state: SubscriptionState): string[] =>
  Array.from(state.purchasedReleases);

/**
 * Check if a specific release animation is owned
 */
export const selectOwnsRelease =
  (releaseId: string) =>
  (state: SubscriptionState): boolean => {
    // Subscription includes all
    if (state.subscription.tier >= SubscriptionTier.VoidWalker) {
      return true;
    }
    return state.purchasedReleases.has(releaseId);
  };

/**
 * Get available releases for purchase (not owned)
 */
export const selectAvailableReleases = (state: SubscriptionState): string[] => {
  // If subscribed, all are available
  if (state.subscription.tier >= SubscriptionTier.VoidWalker) {
    return [];
  }
  // Return releases not yet purchased
  const allReleases = Object.keys(RELEASE_ANIMATION_ENTITLEMENTS);
  return allReleases.filter((id) => !state.purchasedReleases.has(id));
};

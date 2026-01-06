/**
 * Subscription Hooks
 *
 * React hooks for accessing subscription state and performing
 * subscription-related actions.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import {
  useSubscriptionStore,
  selectTier,
  selectTierConfig,
  selectHasTier,
  selectHasFeature,
  selectIsSubscribed,
  selectExpirationDate,
  selectWillRenew,
  selectIsTrialPeriod,
  selectPurchasedReleases,
  selectOwnsRelease,
  selectAvailableReleases,
} from '../store/subscriptionStore';
import {
  purchaseSubscription,
  purchaseReleaseAnimation,
  restorePurchases,
  getManagementURL,
  refreshCustomerInfo,
  getSubscriptionPackagesByTier,
  getReleaseAnimationPackages,
} from '../services/purchases';
import {
  SubscriptionTier,
  TIER_CONFIG,
  FEATURES,
  type FeatureId,
  type TierConfig,
} from '../config/revenueCat';

// ============================================================================
// SUBSCRIPTION STATUS HOOK
// ============================================================================

/**
 * Hook for accessing subscription status and tier
 */
export function useSubscription() {
  const tier = useSubscriptionStore(selectTier);
  const tierConfig = useSubscriptionStore(selectTierConfig);
  const isSubscribed = useSubscriptionStore(selectIsSubscribed);
  const expirationDate = useSubscriptionStore(selectExpirationDate);
  const willRenew = useSubscriptionStore(selectWillRenew);
  const isTrialPeriod = useSubscriptionStore(selectIsTrialPeriod);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const isInitialized = useSubscriptionStore((state) => state.isInitialized);
  const lastError = useSubscriptionStore((state) => state.lastError);

  // Format expiration date for display
  const formattedExpirationDate = useMemo(() => {
    if (!expirationDate) return null;
    const date = new Date(expirationDate);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [expirationDate]);

  // Days until expiration
  const daysUntilExpiration = useMemo(() => {
    if (!expirationDate) return null;
    const now = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [expirationDate]);

  // Check if subscription is expiring soon (within 7 days)
  const isExpiringSoon = useMemo(() => {
    if (!daysUntilExpiration || willRenew) return false;
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
  }, [daysUntilExpiration, willRenew]);

  // Tier comparison helpers
  const isVoidWalkerPlus = tier >= SubscriptionTier.VoidWalker;
  const isGuardianPlus = tier >= SubscriptionTier.Guardian;
  const isWitnessed = tier >= SubscriptionTier.Witnessed;

  return {
    // Tier info
    tier,
    tierConfig,
    tierName: tierConfig.displayName,

    // Status
    isSubscribed,
    isLoading,
    isInitialized,
    isTrialPeriod,
    willRenew,
    isExpiringSoon,

    // Dates
    expirationDate,
    formattedExpirationDate,
    daysUntilExpiration,

    // Tier checks
    isVoidWalkerPlus,
    isGuardianPlus,
    isWitnessed,

    // Error
    lastError,
  };
}

// ============================================================================
// FEATURE ACCESS HOOK
// ============================================================================

/**
 * Hook for checking feature access and handling upsells
 */
export function useFeatureAccess(featureId: FeatureId) {
  const hasAccess = useSubscriptionStore(selectHasFeature(featureId));
  const currentTier = useSubscriptionStore(selectTier);
  const { FEATURE_TIER_REQUIREMENTS } = require('../config/revenueCat');
  const requiredTier = FEATURE_TIER_REQUIREMENTS[featureId];
  const requiredTierConfig = TIER_CONFIG[requiredTier];

  // Determine if this is an individual purchase feature
  const isIndividualPurchase = Object.keys(FEATURES)
    .filter((key) => key.startsWith('release'))
    .includes(featureId);

  // Get the upgrade path
  const upgradeTier = useMemo(() => {
    if (hasAccess) return null;
    if (isIndividualPurchase) return SubscriptionTier.VoidWalker; // Can buy individually or subscribe
    return requiredTier;
  }, [hasAccess, isIndividualPurchase, requiredTier]);

  const upgradeConfig = upgradeTier ? TIER_CONFIG[upgradeTier] : null;

  return {
    hasAccess,
    currentTier,
    requiredTier,
    requiredTierConfig,
    isIndividualPurchase,
    upgradeTier,
    upgradeConfig,
  };
}

// ============================================================================
// PURCHASE ACTIONS HOOK
// ============================================================================

/**
 * Hook for subscription purchase actions
 */
export function usePurchaseActions() {
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const subscriptionPackages = useSubscriptionStore((state) => state.subscriptionPackages);
  const releasePackages = useSubscriptionStore((state) => state.releasePackages);

  // Get packages organized by tier
  const packagesByTier = useMemo(() => getSubscriptionPackagesByTier(), [subscriptionPackages]);

  // Get release animation packages
  const releaseAnimationPackages = useMemo(
    () => getReleaseAnimationPackages(),
    [releasePackages]
  );

  // Subscribe to a tier
  const subscribe = useCallback(
    async (tier: SubscriptionTier, yearly: boolean = false): Promise<boolean> => {
      const packages = packagesByTier[tier];
      const pkg = yearly ? packages.yearly : packages.monthly;

      if (!pkg) {
        Alert.alert('Error', 'This subscription is not available');
        return false;
      }

      const result = await purchaseSubscription(pkg);

      if (result.success) {
        Alert.alert('Success', 'Welcome to your new subscription!');
        return true;
      }

      if (!result.userCancelled && result.error) {
        Alert.alert('Purchase Failed', result.error);
      }

      return false;
    },
    [packagesByTier]
  );

  // Purchase individual release animation
  const purchaseRelease = useCallback(
    async (releaseId: string): Promise<boolean> => {
      const pkg = releaseAnimationPackages[releaseId];

      if (!pkg) {
        Alert.alert('Error', 'This release animation is not available');
        return false;
      }

      const result = await purchaseReleaseAnimation(releaseId, pkg);

      if (result.success) {
        Alert.alert('Success', 'Release animation unlocked!');
        return true;
      }

      if (!result.userCancelled && result.error) {
        Alert.alert('Purchase Failed', result.error);
      }

      return false;
    },
    [releaseAnimationPackages]
  );

  // Restore purchases
  const restore = useCallback(async (): Promise<boolean> => {
    const result = await restorePurchases();

    if (result.success) {
      Alert.alert('Restore Complete', 'Your purchases have been restored.');
      return true;
    }

    if (result.error) {
      Alert.alert('Restore Failed', result.error);
    }

    return false;
  }, []);

  // Refresh subscription status
  const refresh = useCallback(async (): Promise<void> => {
    try {
      await refreshCustomerInfo();
    } catch (error) {
      console.error('Failed to refresh subscription status:', error);
    }
  }, []);

  // Open subscription management
  const openManagement = useCallback(async (): Promise<void> => {
    try {
      const url = await getManagementURL();
      if (url) {
        await Linking.openURL(url);
      } else {
        // Fallback to platform subscription settings
        const settingsUrl =
          Platform.OS === 'ios'
            ? 'https://apps.apple.com/account/subscriptions'
            : 'https://play.google.com/store/account/subscriptions';
        await Linking.openURL(settingsUrl);
      }
    } catch (error) {
      console.error('Failed to open management:', error);
      Alert.alert('Error', 'Could not open subscription management');
    }
  }, []);

  return {
    isLoading,
    packagesByTier,
    releaseAnimationPackages,
    subscribe,
    purchaseRelease,
    restore,
    refresh,
    openManagement,
  };
}

// ============================================================================
// RELEASE ANIMATIONS HOOK
// ============================================================================

/**
 * Hook for release animation ownership
 */
export function useReleaseAnimations() {
  const purchasedReleases = useSubscriptionStore(selectPurchasedReleases);
  const availableReleases = useSubscriptionStore(selectAvailableReleases);
  const tier = useSubscriptionStore(selectTier);

  // Check if all releases are unlocked (via subscription)
  const hasAllReleases = tier >= SubscriptionTier.VoidWalker;

  // Check if a specific release is owned
  const ownsRelease = useCallback(
    (releaseId: string): boolean => {
      if (hasAllReleases) return true;
      return purchasedReleases.includes(releaseId);
    },
    [hasAllReleases, purchasedReleases]
  );

  // Get release status
  const getReleaseStatus = useCallback(
    (releaseId: string): 'owned' | 'available' | 'locked' => {
      if (ownsRelease(releaseId)) return 'owned';
      // In the future, could check if available for purchase
      return 'available';
    },
    [ownsRelease]
  );

  return {
    purchasedReleases,
    availableReleases,
    hasAllReleases,
    ownsRelease,
    getReleaseStatus,
  };
}

// ============================================================================
// PAYWALL HOOK
// ============================================================================

export interface PaywallOptions {
  feature?: FeatureId;
  tier?: SubscriptionTier;
  message?: string;
  onDismiss?: () => void;
  onUpgrade?: () => void;
}

/**
 * Hook for showing paywall when accessing premium features
 */
export function usePaywall(options: PaywallOptions = {}) {
  const { feature, tier, message, onDismiss, onUpgrade } = options;

  const currentTier = useSubscriptionStore(selectTier);
  const hasFeatureAccess = feature ? useSubscriptionStore(selectHasFeature(feature)) : true;
  const hasTierAccess = tier ? currentTier >= tier : true;

  const shouldShowPaywall = !hasFeatureAccess || !hasTierAccess;

  // Determine required tier for upgrade
  const requiredTier = useMemo(() => {
    if (tier && currentTier < tier) return tier;
    if (feature) {
      const { FEATURE_TIER_REQUIREMENTS } = require('../config/revenueCat');
      return FEATURE_TIER_REQUIREMENTS[feature];
    }
    return SubscriptionTier.VoidWalker;
  }, [feature, tier, currentTier]);

  const requiredTierConfig = TIER_CONFIG[requiredTier];

  // Show upgrade alert
  const showUpgradePrompt = useCallback(() => {
    const defaultMessage = `This feature requires ${requiredTierConfig.displayName} subscription.`;

    Alert.alert(
      'Upgrade Required',
      message || defaultMessage,
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: onDismiss,
        },
        {
          text: 'View Plans',
          onPress: onUpgrade,
        },
      ],
      { cancelable: true }
    );
  }, [message, requiredTierConfig, onDismiss, onUpgrade]);

  // Guard function - returns true if access granted, false if paywall shown
  const checkAccess = useCallback((): boolean => {
    if (shouldShowPaywall) {
      showUpgradePrompt();
      return false;
    }
    return true;
  }, [shouldShowPaywall, showUpgradePrompt]);

  return {
    shouldShowPaywall,
    hasAccess: !shouldShowPaywall,
    requiredTier,
    requiredTierConfig,
    showUpgradePrompt,
    checkAccess,
  };
}

// ============================================================================
// SUBSCRIPTION INIT HOOK
// ============================================================================

/**
 * Hook to initialize subscription service (use in App.tsx)
 */
export function useSubscriptionInit() {
  const isInitialized = useSubscriptionStore((state) => state.isInitialized);

  useEffect(() => {
    // Refresh on mount if already initialized
    if (isInitialized) {
      refreshCustomerInfo().catch(console.error);
    }
  }, [isInitialized]);

  return { isInitialized };
}

/**
 * RevenueCat Purchases Service
 *
 * Handles all interactions with RevenueCat SDK for subscriptions
 * and in-app purchases.
 */

import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOfferings,
  PRODUCT_CATEGORY,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import {
  REVENUECAT_CONFIG,
  OFFERINGS,
  SUBSCRIPTION_PRODUCTS,
  RELEASE_ANIMATION_PRODUCTS,
  ENTITLEMENTS,
  SubscriptionTier,
  TIER_CONFIG,
  type ReleaseAnimationProductId,
  type SubscriptionProductId,
} from '../config/revenueCat';
import { useSubscriptionStore } from '../store/subscriptionStore';

// ============================================================================
// INITIALIZATION
// ============================================================================

let isConfigured = false;

/**
 * Initialize RevenueCat SDK
 * Call this early in app lifecycle (usually in App.tsx)
 */
export async function initializePurchases(): Promise<void> {
  if (isConfigured) {
    console.log('[Purchases] Already configured');
    return;
  }

  const store = useSubscriptionStore.getState();
  store.setLoading(true);

  try {
    // Enable debug logging in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Get platform-specific API key
    const apiKey =
      Platform.OS === 'ios'
        ? REVENUECAT_CONFIG.apiKeyIOS
        : REVENUECAT_CONFIG.apiKeyAndroid;

    // Configure RevenueCat
    await Purchases.configure({ apiKey });
    isConfigured = true;

    // Set up listener for customer info updates
    Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

    // Fetch initial customer info
    const customerInfo = await Purchases.getCustomerInfo();
    store.updateFromCustomerInfo(customerInfo);

    // Fetch available offerings
    await fetchOfferings();

    store.setInitialized(true);
    console.log('[Purchases] Initialized successfully');
  } catch (error) {
    console.error('[Purchases] Initialization failed:', error);
    store.setError(error instanceof Error ? error.message : 'Failed to initialize purchases');
  } finally {
    store.setLoading(false);
  }
}

/**
 * Handle customer info updates from RevenueCat
 */
function handleCustomerInfoUpdate(customerInfo: CustomerInfo): void {
  console.log('[Purchases] Customer info updated');
  useSubscriptionStore.getState().updateFromCustomerInfo(customerInfo);
}

// ============================================================================
// OFFERINGS
// ============================================================================

/**
 * Fetch available offerings from RevenueCat
 */
export async function fetchOfferings(): Promise<PurchasesOfferings | null> {
  try {
    const offerings = await Purchases.getOfferings();
    const store = useSubscriptionStore.getState();

    // Extract subscription packages
    const subscriptionOffering = offerings.all[OFFERINGS.subscriptions] || offerings.current;
    if (subscriptionOffering?.availablePackages) {
      store.setSubscriptionPackages(subscriptionOffering.availablePackages);
    }

    // Extract release animation packages
    const releaseOffering = offerings.all[OFFERINGS.releaseAnimations];
    if (releaseOffering?.availablePackages) {
      store.setReleasePackages(releaseOffering.availablePackages);
    }

    return offerings;
  } catch (error) {
    console.error('[Purchases] Failed to fetch offerings:', error);
    useSubscriptionStore
      .getState()
      .setError(error instanceof Error ? error.message : 'Failed to fetch offerings');
    return null;
  }
}

/**
 * Get subscription packages organized by tier
 */
export function getSubscriptionPackagesByTier(): Record<
  SubscriptionTier,
  { monthly?: PurchasesPackage; yearly?: PurchasesPackage }
> {
  const packages = useSubscriptionStore.getState().subscriptionPackages;
  const result: Record<SubscriptionTier, { monthly?: PurchasesPackage; yearly?: PurchasesPackage }> =
    {
      [SubscriptionTier.Free]: {},
      [SubscriptionTier.VoidWalker]: {},
      [SubscriptionTier.Guardian]: {},
      [SubscriptionTier.Witnessed]: {},
    };

  packages.forEach((pkg) => {
    const productId = pkg.product.identifier;

    // Void Walker
    if (productId === SUBSCRIPTION_PRODUCTS.voidWalkerMonthly) {
      result[SubscriptionTier.VoidWalker].monthly = pkg;
    } else if (productId === SUBSCRIPTION_PRODUCTS.voidWalkerYearly) {
      result[SubscriptionTier.VoidWalker].yearly = pkg;
    }
    // Guardian
    else if (productId === SUBSCRIPTION_PRODUCTS.guardianMonthly) {
      result[SubscriptionTier.Guardian].monthly = pkg;
    } else if (productId === SUBSCRIPTION_PRODUCTS.guardianYearly) {
      result[SubscriptionTier.Guardian].yearly = pkg;
    }
    // Witnessed
    else if (productId === SUBSCRIPTION_PRODUCTS.witnessedMonthly) {
      result[SubscriptionTier.Witnessed].monthly = pkg;
    } else if (productId === SUBSCRIPTION_PRODUCTS.witnessedYearly) {
      result[SubscriptionTier.Witnessed].yearly = pkg;
    }
  });

  return result;
}

/**
 * Get release animation packages by release ID
 */
export function getReleaseAnimationPackages(): Record<string, PurchasesPackage | undefined> {
  const packages = useSubscriptionStore.getState().releasePackages;
  const result: Record<string, PurchasesPackage | undefined> = {};

  packages.forEach((pkg) => {
    const productId = pkg.product.identifier;

    // Map product IDs to release IDs
    Object.entries(RELEASE_ANIMATION_PRODUCTS).forEach(([releaseId, prodId]) => {
      if (productId === prodId) {
        result[releaseId] = pkg;
      }
    });
  });

  return result;
}

// ============================================================================
// PURCHASES
// ============================================================================

export interface PurchaseResult {
  success: boolean;
  error?: string;
  userCancelled?: boolean;
}

/**
 * Purchase a subscription package
 */
export async function purchaseSubscription(pkg: PurchasesPackage): Promise<PurchaseResult> {
  const store = useSubscriptionStore.getState();
  store.setLoading(true);
  store.setError(null);

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    store.updateFromCustomerInfo(customerInfo);

    console.log('[Purchases] Subscription purchase successful');
    return { success: true };
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('[Purchases] User cancelled purchase');
      return { success: false, userCancelled: true };
    }

    const errorMessage = error.message || 'Purchase failed';
    console.error('[Purchases] Purchase failed:', error);
    store.setError(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    store.setLoading(false);
  }
}

/**
 * Purchase an individual release animation
 */
export async function purchaseReleaseAnimation(
  releaseId: string,
  pkg?: PurchasesPackage
): Promise<PurchaseResult> {
  const store = useSubscriptionStore.getState();
  store.setLoading(true);
  store.setError(null);

  try {
    // If no package provided, try to find it
    if (!pkg) {
      const packages = getReleaseAnimationPackages();
      pkg = packages[releaseId];

      if (!pkg) {
        throw new Error(`Package not found for release: ${releaseId}`);
      }
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    store.updateFromCustomerInfo(customerInfo);

    console.log(`[Purchases] Release animation ${releaseId} purchase successful`);
    return { success: true };
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('[Purchases] User cancelled purchase');
      return { success: false, userCancelled: true };
    }

    const errorMessage = error.message || 'Purchase failed';
    console.error('[Purchases] Release animation purchase failed:', error);
    store.setError(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    store.setLoading(false);
  }
}

/**
 * Purchase a specific product by ID
 */
export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  const store = useSubscriptionStore.getState();
  store.setLoading(true);
  store.setError(null);

  try {
    const { customerInfo } = await Purchases.purchaseStoreProduct({
      identifier: productId,
    } as any);
    store.updateFromCustomerInfo(customerInfo);

    console.log(`[Purchases] Product ${productId} purchase successful`);
    return { success: true };
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('[Purchases] User cancelled purchase');
      return { success: false, userCancelled: true };
    }

    const errorMessage = error.message || 'Purchase failed';
    console.error('[Purchases] Product purchase failed:', error);
    store.setError(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    store.setLoading(false);
  }
}

// ============================================================================
// RESTORE
// ============================================================================

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  const store = useSubscriptionStore.getState();
  store.setLoading(true);
  store.setError(null);

  try {
    const customerInfo = await Purchases.restorePurchases();
    store.updateFromCustomerInfo(customerInfo);

    const hasEntitlements = Object.keys(customerInfo.entitlements.active).length > 0;
    console.log(
      `[Purchases] Restore complete. Has entitlements: ${hasEntitlements}`
    );

    return { success: true };
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to restore purchases';
    console.error('[Purchases] Restore failed:', error);
    store.setError(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    store.setLoading(false);
  }
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Get management URL for current subscription
 */
export async function getManagementURL(): Promise<string | null> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.managementURL;
  } catch (error) {
    console.error('[Purchases] Failed to get management URL:', error);
    return null;
  }
}

/**
 * Check if user is eligible for introductory pricing
 */
export async function checkIntroEligibility(
  productIds: string[]
): Promise<Record<string, boolean>> {
  try {
    const result: Record<string, boolean> = {};

    // Check each product
    for (const productId of productIds) {
      try {
        const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility([
          productId,
        ]);
        result[productId] = eligibility[productId]?.status === 0; // ELIGIBLE
      } catch {
        result[productId] = false;
      }
    }

    return result;
  } catch (error) {
    console.error('[Purchases] Failed to check intro eligibility:', error);
    return {};
  }
}

// ============================================================================
// USER IDENTIFICATION
// ============================================================================

/**
 * Log in a user (for cross-device sync)
 * Use anonymous ID for privacy-focused app
 */
export async function loginUser(userId: string): Promise<void> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    useSubscriptionStore.getState().updateFromCustomerInfo(customerInfo);
    console.log('[Purchases] User logged in');
  } catch (error) {
    console.error('[Purchases] Login failed:', error);
    throw error;
  }
}

/**
 * Log out user and create new anonymous ID
 */
export async function logoutUser(): Promise<void> {
  try {
    const customerInfo = await Purchases.logOut();
    useSubscriptionStore.getState().updateFromCustomerInfo(customerInfo);
    console.log('[Purchases] User logged out');
  } catch (error) {
    console.error('[Purchases] Logout failed:', error);
    throw error;
  }
}

/**
 * Get current app user ID
 */
export async function getAppUserId(): Promise<string> {
  return Purchases.getAppUserID();
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if user currently has a specific entitlement
 */
export async function hasEntitlement(entitlementId: string): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[entitlementId] !== undefined;
  } catch (error) {
    console.error('[Purchases] Failed to check entitlement:', error);
    return false;
  }
}

/**
 * Get current subscription tier
 */
export function getCurrentTier(): SubscriptionTier {
  return useSubscriptionStore.getState().subscription.tier;
}

/**
 * Check if user has at least the specified tier
 */
export function hasTier(requiredTier: SubscriptionTier): boolean {
  return useSubscriptionStore.getState().subscription.tier >= requiredTier;
}

/**
 * Refresh customer info from server
 */
export async function refreshCustomerInfo(): Promise<void> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    useSubscriptionStore.getState().updateFromCustomerInfo(customerInfo);
  } catch (error) {
    console.error('[Purchases] Failed to refresh customer info:', error);
    throw error;
  }
}

// ============================================================================
// LEGACY EXPORTS (for backwards compatibility)
// ============================================================================

export { ENTITLEMENTS };

export async function checkPremiumStatus(): Promise<boolean> {
  return hasTier(SubscriptionTier.VoidWalker);
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  const offerings = await fetchOfferings();
  return offerings?.current?.availablePackages || [];
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const result = await purchaseSubscription(pkg);
  return result.success;
}

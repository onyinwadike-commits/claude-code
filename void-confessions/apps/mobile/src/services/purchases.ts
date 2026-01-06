import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { useVoidStore } from '../store';

// RevenueCat API keys (replace with your actual keys)
const REVENUECAT_API_KEY_IOS = 'your_ios_api_key';
const REVENUECAT_API_KEY_ANDROID = 'your_android_api_key';

// Product identifiers
export const PRODUCTS = {
  PREMIUM_MONTHLY: 'void_premium_monthly',
  PREMIUM_YEARLY: 'void_premium_yearly',
  PREMIUM_LIFETIME: 'void_premium_lifetime',
} as const;

// Entitlement identifier
export const ENTITLEMENTS = {
  PREMIUM: 'premium',
} as const;

/**
 * Initialize RevenueCat SDK
 */
export async function initializePurchases(): Promise<void> {
  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_API_KEY_IOS
      : REVENUECAT_API_KEY_ANDROID;

    await Purchases.configure({ apiKey });

    // Check initial premium status
    await checkPremiumStatus();

    // Listen for customer info updates
    Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

    console.log('[Purchases] Initialized successfully');
  } catch (error) {
    console.error('[Purchases] Initialization failed:', error);
  }
}

/**
 * Handle customer info updates
 */
function handleCustomerInfoUpdate(customerInfo: CustomerInfo): void {
  const isPremium = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== undefined;
  useVoidStore.getState().setPremiumStatus(isPremium);
}

/**
 * Check current premium status
 */
export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== undefined;
    useVoidStore.getState().setPremiumStatus(isPremium);
    return isPremium;
  } catch (error) {
    console.error('[Purchases] Failed to check premium status:', error);
    return false;
  }
}

/**
 * Get available packages for purchase
 */
export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();

    if (offerings.current?.availablePackages) {
      return offerings.current.availablePackages;
    }

    return [];
  } catch (error) {
    console.error('[Purchases] Failed to get offerings:', error);
    return [];
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPremium = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== undefined;
    useVoidStore.getState().setPremiumStatus(isPremium);
    return isPremium;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('[Purchases] User cancelled');
      return false;
    }
    console.error('[Purchases] Purchase failed:', error);
    throw error;
  }
}

/**
 * Restore purchases
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== undefined;
    useVoidStore.getState().setPremiumStatus(isPremium);
    return isPremium;
  } catch (error) {
    console.error('[Purchases] Restore failed:', error);
    throw error;
  }
}

/**
 * Get current subscription info
 */
export async function getSubscriptionInfo(): Promise<{
  isSubscribed: boolean;
  expirationDate: string | null;
  willRenew: boolean;
}> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];

    if (premiumEntitlement) {
      return {
        isSubscribed: true,
        expirationDate: premiumEntitlement.expirationDate,
        willRenew: premiumEntitlement.willRenew,
      };
    }

    return {
      isSubscribed: false,
      expirationDate: null,
      willRenew: false,
    };
  } catch (error) {
    console.error('[Purchases] Failed to get subscription info:', error);
    return {
      isSubscribed: false,
      expirationDate: null,
      willRenew: false,
    };
  }
}

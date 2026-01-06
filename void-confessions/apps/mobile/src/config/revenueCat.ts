/**
 * RevenueCat Configuration
 *
 * Product IDs, entitlements, and subscription tier definitions
 */

// RevenueCat API keys (replace with actual keys from RevenueCat dashboard)
export const REVENUECAT_CONFIG = {
  apiKeyIOS: 'appl_your_ios_api_key',
  apiKeyAndroid: 'goog_your_android_api_key',
} as const;

// ============================================================================
// PRODUCT IDENTIFIERS
// ============================================================================

/**
 * Individual release animation products (non-consumable)
 * Each unlocks a specific premium release animation style
 */
export const RELEASE_ANIMATION_PRODUCTS = {
  burn: 'void_release_burn',
  shatter: 'void_release_shatter',
  scream: 'void_release_scream',
  dissolve: 'void_release_dissolve',
  storm: 'void_release_storm',
  drift: 'void_release_drift',
} as const;

export type ReleaseAnimationProductId =
  (typeof RELEASE_ANIMATION_PRODUCTS)[keyof typeof RELEASE_ANIMATION_PRODUCTS];

/**
 * Subscription products
 */
export const SUBSCRIPTION_PRODUCTS = {
  // Void Walker - Entry tier ($4.99/month)
  voidWalkerMonthly: 'void_walker_monthly',
  voidWalkerYearly: 'void_walker_yearly',

  // Guardian - Mid tier ($9.99/month)
  guardianMonthly: 'void_guardian_monthly',
  guardianYearly: 'void_guardian_yearly',

  // Witnessed - Top tier ($14.99/month)
  witnessedMonthly: 'void_witnessed_monthly',
  witnessedYearly: 'void_witnessed_yearly',
} as const;

export type SubscriptionProductId =
  (typeof SUBSCRIPTION_PRODUCTS)[keyof typeof SUBSCRIPTION_PRODUCTS];

/**
 * All product IDs combined
 */
export const ALL_PRODUCTS = {
  ...RELEASE_ANIMATION_PRODUCTS,
  ...SUBSCRIPTION_PRODUCTS,
} as const;

// ============================================================================
// ENTITLEMENTS
// ============================================================================

/**
 * Entitlement identifiers as configured in RevenueCat
 * These are granted when users purchase products
 */
export const ENTITLEMENTS = {
  // Individual release animations
  releaseAnimationBurn: 'release_burn',
  releaseAnimationShatter: 'release_shatter',
  releaseAnimationScream: 'release_scream',
  releaseAnimationDissolve: 'release_dissolve',
  releaseAnimationStorm: 'release_storm',
  releaseAnimationDrift: 'release_drift',
  // All release animations (from subscription)
  allReleaseAnimations: 'all_release_animations',

  // Subscription tiers (cumulative)
  voidWalker: 'void_walker',
  guardian: 'guardian',
  witnessed: 'witnessed',
} as const;

export type EntitlementId = (typeof ENTITLEMENTS)[keyof typeof ENTITLEMENTS];

// ============================================================================
// SUBSCRIPTION TIERS
// ============================================================================

/**
 * Subscription tier hierarchy (higher number = higher tier)
 */
export enum SubscriptionTier {
  Free = 0,
  VoidWalker = 1,
  Guardian = 2,
  Witnessed = 3,
}

/**
 * Tier configuration with features and pricing
 */
export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyProductId: string;
  yearlyProductId: string;
  entitlement: string;
  features: string[];
  color: string;
  icon: string;
}

export const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
  [SubscriptionTier.Free]: {
    id: SubscriptionTier.Free,
    name: 'free',
    displayName: 'Free',
    description: 'Basic void experience',
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyProductId: '',
    yearlyProductId: '',
    entitlement: '',
    features: [
      'Access all five voids',
      'Text confessions',
      'Basic release animation',
      'Resonate with others',
    ],
    color: '#6b7280',
    icon: '🌑',
  },
  [SubscriptionTier.VoidWalker]: {
    id: SubscriptionTier.VoidWalker,
    name: 'void_walker',
    displayName: 'Void Walker',
    description: 'Enhanced emotional release',
    monthlyPrice: 4.99,
    yearlyPrice: 49.99,
    monthlyProductId: SUBSCRIPTION_PRODUCTS.voidWalkerMonthly,
    yearlyProductId: SUBSCRIPTION_PRODUCTS.voidWalkerYearly,
    entitlement: ENTITLEMENTS.voidWalker,
    features: [
      'Voice confessions',
      'Custom themes',
      'Confidant AI support',
      'Enhanced resonance',
      'All release animations',
      'Ad-free experience',
    ],
    color: '#8b5cf6',
    icon: '🌙',
  },
  [SubscriptionTier.Guardian]: {
    id: SubscriptionTier.Guardian,
    name: 'guardian',
    displayName: 'Guardian',
    description: 'Deep void connection',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    monthlyProductId: SUBSCRIPTION_PRODUCTS.guardianMonthly,
    yearlyProductId: SUBSCRIPTION_PRODUCTS.guardianYearly,
    entitlement: ENTITLEMENTS.guardian,
    features: [
      'Everything in Void Walker',
      'Priority echo delivery',
      'Extended confession history',
      'Advanced mood analytics',
      'Early access to new features',
      'Guardian badge',
    ],
    color: '#06b6d4',
    icon: '🛡️',
  },
  [SubscriptionTier.Witnessed]: {
    id: SubscriptionTier.Witnessed,
    name: 'witnessed',
    displayName: 'Witnessed',
    description: 'Complete void experience',
    monthlyPrice: 14.99,
    yearlyPrice: 149.99,
    monthlyProductId: SUBSCRIPTION_PRODUCTS.witnessedMonthly,
    yearlyProductId: SUBSCRIPTION_PRODUCTS.witnessedYearly,
    entitlement: ENTITLEMENTS.witnessed,
    features: [
      'Everything in Guardian',
      'Witnessed confessions',
      'Direct support hotline',
      'Exclusive void chambers',
      'Custom confession styles',
      'Witnessed badge',
    ],
    color: '#f59e0b',
    icon: '👁️',
  },
};

// ============================================================================
// FEATURE DEFINITIONS
// ============================================================================

/**
 * Feature identifiers for gating
 */
export const FEATURES = {
  // Void Walker+ features
  voiceConfessions: 'voiceConfessions',
  customThemes: 'customThemes',
  confidantAI: 'confidantAI',
  enhancedResonance: 'enhancedResonance',
  allReleaseAnimations: 'allReleaseAnimations',
  adFree: 'adFree',

  // Guardian+ features
  priorityEchoDelivery: 'priorityEchoDelivery',
  extendedHistory: 'extendedHistory',
  moodAnalytics: 'moodAnalytics',
  earlyAccess: 'earlyAccess',
  guardianBadge: 'guardianBadge',

  // Witnessed only features
  witnessedConfessions: 'witnessedConfessions',
  directSupport: 'directSupport',
  exclusiveVoidChambers: 'exclusiveVoidChambers',
  customConfessionStyles: 'customConfessionStyles',
  witnessedBadge: 'witnessedBadge',

  // Individual purchase features
  releaseBurn: 'releaseBurn',
  releaseShatter: 'releaseShatter',
  releaseScream: 'releaseScream',
  releaseDissolve: 'releaseDissolve',
  releaseStorm: 'releaseStorm',
  releaseDrift: 'releaseDrift',
} as const;

export type FeatureId = (typeof FEATURES)[keyof typeof FEATURES];

/**
 * Map features to minimum required tier
 */
export const FEATURE_TIER_REQUIREMENTS: Record<FeatureId, SubscriptionTier> = {
  // Void Walker+ features
  [FEATURES.voiceConfessions]: SubscriptionTier.VoidWalker,
  [FEATURES.customThemes]: SubscriptionTier.VoidWalker,
  [FEATURES.confidantAI]: SubscriptionTier.VoidWalker,
  [FEATURES.enhancedResonance]: SubscriptionTier.VoidWalker,
  [FEATURES.allReleaseAnimations]: SubscriptionTier.VoidWalker,
  [FEATURES.adFree]: SubscriptionTier.VoidWalker,

  // Guardian+ features
  [FEATURES.priorityEchoDelivery]: SubscriptionTier.Guardian,
  [FEATURES.extendedHistory]: SubscriptionTier.Guardian,
  [FEATURES.moodAnalytics]: SubscriptionTier.Guardian,
  [FEATURES.earlyAccess]: SubscriptionTier.Guardian,
  [FEATURES.guardianBadge]: SubscriptionTier.Guardian,

  // Witnessed only features
  [FEATURES.witnessedConfessions]: SubscriptionTier.Witnessed,
  [FEATURES.directSupport]: SubscriptionTier.Witnessed,
  [FEATURES.exclusiveVoidChambers]: SubscriptionTier.Witnessed,
  [FEATURES.customConfessionStyles]: SubscriptionTier.Witnessed,
  [FEATURES.witnessedBadge]: SubscriptionTier.Witnessed,

  // Individual release animations (Free tier - but requires purchase)
  [FEATURES.releaseBurn]: SubscriptionTier.Free,
  [FEATURES.releaseShatter]: SubscriptionTier.Free,
  [FEATURES.releaseScream]: SubscriptionTier.Free,
  [FEATURES.releaseDissolve]: SubscriptionTier.Free,
  [FEATURES.releaseStorm]: SubscriptionTier.Free,
  [FEATURES.releaseDrift]: SubscriptionTier.Free,
};

/**
 * Map release animation features to their entitlements
 */
export const RELEASE_ANIMATION_ENTITLEMENTS: Record<string, EntitlementId> = {
  [FEATURES.releaseBurn]: ENTITLEMENTS.releaseAnimationBurn,
  [FEATURES.releaseShatter]: ENTITLEMENTS.releaseAnimationShatter,
  [FEATURES.releaseScream]: ENTITLEMENTS.releaseAnimationScream,
  [FEATURES.releaseDissolve]: ENTITLEMENTS.releaseAnimationDissolve,
  [FEATURES.releaseStorm]: ENTITLEMENTS.releaseAnimationStorm,
  [FEATURES.releaseDrift]: ENTITLEMENTS.releaseAnimationDrift,
};

// ============================================================================
// OFFERINGS
// ============================================================================

/**
 * RevenueCat offering identifiers
 */
export const OFFERINGS = {
  default: 'default',
  releaseAnimations: 'release_animations',
  subscriptions: 'subscriptions',
} as const;

// ============================================================================
// PRICING DISPLAY
// ============================================================================

/**
 * Release animation pricing
 */
export const RELEASE_ANIMATION_PRICE = 0.99;

/**
 * Format pricing info for display
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Calculate yearly savings percentage
 */
export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  const monthlyTotal = monthlyPrice * 12;
  const savings = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
  return Math.round(savings);
}

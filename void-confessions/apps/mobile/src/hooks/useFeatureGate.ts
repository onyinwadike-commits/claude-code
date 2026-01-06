/**
 * Feature Gating Utilities
 *
 * Provides easy-to-use hooks and components for gating features
 * based on subscription tier and entitlements.
 */

import React, { useCallback, useMemo, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSubscriptionStore, selectHasFeature, selectTier, selectOwnsRelease } from '../store/subscriptionStore';
import {
  SubscriptionTier,
  TIER_CONFIG,
  FEATURES,
  FEATURE_TIER_REQUIREMENTS,
  type FeatureId,
} from '../config/revenueCat';

// ============================================================================
// FEATURE GATE HOOK
// ============================================================================

export interface FeatureGateResult {
  /** Whether user has access to the feature */
  hasAccess: boolean;
  /** Whether user is subscribed at any level */
  isSubscribed: boolean;
  /** Current subscription tier */
  currentTier: SubscriptionTier;
  /** Minimum tier required for this feature */
  requiredTier: SubscriptionTier;
  /** Config for the required tier */
  requiredTierConfig: typeof TIER_CONFIG[SubscriptionTier];
  /** Whether this feature can be purchased individually */
  canPurchaseIndividually: boolean;
  /** Message explaining why access is denied */
  accessDeniedMessage: string;
}

/**
 * Hook to check if user has access to a specific feature
 */
export function useFeatureGate(featureId: FeatureId): FeatureGateResult {
  const currentTier = useSubscriptionStore(selectTier);
  const hasAccess = useSubscriptionStore(selectHasFeature(featureId));
  const isSubscribed = currentTier >= SubscriptionTier.VoidWalker;

  const requiredTier = FEATURE_TIER_REQUIREMENTS[featureId];
  const requiredTierConfig = TIER_CONFIG[requiredTier];

  // Check if this is an individual purchase feature (release animations)
  const canPurchaseIndividually = featureId.startsWith('release');

  // Generate access denied message
  const accessDeniedMessage = useMemo(() => {
    if (hasAccess) return '';

    if (canPurchaseIndividually) {
      return `Unlock this animation for $0.99 or subscribe to ${TIER_CONFIG[SubscriptionTier.VoidWalker].displayName} for all animations.`;
    }

    if (requiredTier === SubscriptionTier.Witnessed) {
      return `This exclusive feature is only available to ${requiredTierConfig.displayName} members.`;
    }

    return `Upgrade to ${requiredTierConfig.displayName} to unlock this feature.`;
  }, [hasAccess, canPurchaseIndividually, requiredTier, requiredTierConfig]);

  return {
    hasAccess,
    isSubscribed,
    currentTier,
    requiredTier,
    requiredTierConfig,
    canPurchaseIndividually,
    accessDeniedMessage,
  };
}

// ============================================================================
// SPECIFIC FEATURE HOOKS
// ============================================================================

/**
 * Hook for voice confessions feature (Void Walker+)
 */
export function useVoiceConfessions() {
  return useFeatureGate(FEATURES.voiceConfessions);
}

/**
 * Hook for custom themes feature (Void Walker+)
 */
export function useCustomThemes() {
  return useFeatureGate(FEATURES.customThemes);
}

/**
 * Hook for Confidant AI feature (Void Walker+)
 */
export function useConfidantAI() {
  return useFeatureGate(FEATURES.confidantAI);
}

/**
 * Hook for enhanced resonance feature (Void Walker+)
 */
export function useEnhancedResonance() {
  return useFeatureGate(FEATURES.enhancedResonance);
}

/**
 * Hook for witnessed confessions feature (Witnessed only)
 */
export function useWitnessedConfessions() {
  return useFeatureGate(FEATURES.witnessedConfessions);
}

/**
 * Hook for ad-free experience (Void Walker+)
 */
export function useAdFree() {
  return useFeatureGate(FEATURES.adFree);
}

/**
 * Hook for priority echo delivery (Guardian+)
 */
export function usePriorityEcho() {
  return useFeatureGate(FEATURES.priorityEchoDelivery);
}

/**
 * Hook for extended history (Guardian+)
 */
export function useExtendedHistory() {
  return useFeatureGate(FEATURES.extendedHistory);
}

/**
 * Hook for mood analytics (Guardian+)
 */
export function useMoodAnalytics() {
  return useFeatureGate(FEATURES.moodAnalytics);
}

// ============================================================================
// RELEASE ANIMATION HOOKS
// ============================================================================

export interface ReleaseAnimationAccess {
  hasAccess: boolean;
  isOwnedIndividually: boolean;
  isIncludedInSubscription: boolean;
  canPurchase: boolean;
}

/**
 * Hook to check access to a specific release animation
 */
export function useReleaseAnimationAccess(releaseId: string): ReleaseAnimationAccess {
  const currentTier = useSubscriptionStore(selectTier);
  const ownsRelease = useSubscriptionStore(selectOwnsRelease(releaseId));

  const isIncludedInSubscription = currentTier >= SubscriptionTier.VoidWalker;
  const isOwnedIndividually = ownsRelease && !isIncludedInSubscription;
  const hasAccess = ownsRelease || isIncludedInSubscription;
  const canPurchase = !hasAccess;

  return {
    hasAccess,
    isOwnedIndividually,
    isIncludedInSubscription,
    canPurchase,
  };
}

/**
 * Hook to get all release animation access status
 */
export function useAllReleaseAnimations() {
  const burn = useReleaseAnimationAccess('releaseBurn');
  const shatter = useReleaseAnimationAccess('releaseShatter');
  const scream = useReleaseAnimationAccess('releaseScream');
  const dissolve = useReleaseAnimationAccess('releaseDissolve');
  const storm = useReleaseAnimationAccess('releaseStorm');
  const drift = useReleaseAnimationAccess('releaseDrift');

  return {
    burn,
    shatter,
    scream,
    dissolve,
    storm,
    drift,
    allOwned: burn.hasAccess && shatter.hasAccess && scream.hasAccess &&
              dissolve.hasAccess && storm.hasAccess && drift.hasAccess,
  };
}

// ============================================================================
// TIER CHECK HOOKS
// ============================================================================

/**
 * Hook to check if user has at least Void Walker tier
 */
export function useIsVoidWalkerPlus(): boolean {
  const tier = useSubscriptionStore(selectTier);
  return tier >= SubscriptionTier.VoidWalker;
}

/**
 * Hook to check if user has at least Guardian tier
 */
export function useIsGuardianPlus(): boolean {
  const tier = useSubscriptionStore(selectTier);
  return tier >= SubscriptionTier.Guardian;
}

/**
 * Hook to check if user has Witnessed tier
 */
export function useIsWitnessed(): boolean {
  const tier = useSubscriptionStore(selectTier);
  return tier >= SubscriptionTier.Witnessed;
}

// ============================================================================
// UTILITY FUNCTIONS (non-hook)
// ============================================================================

/**
 * Check feature access synchronously (for non-React code)
 */
export function checkFeatureAccess(featureId: FeatureId): boolean {
  const state = useSubscriptionStore.getState();
  const tier = state.subscription.tier;
  const requiredTier = FEATURE_TIER_REQUIREMENTS[featureId];

  // For release animations, also check individual purchases
  if (featureId.startsWith('release')) {
    if (tier >= SubscriptionTier.VoidWalker) return true;
    return state.purchasedReleases.has(featureId);
  }

  return tier >= requiredTier;
}

/**
 * Check tier access synchronously
 */
export function checkTierAccess(requiredTier: SubscriptionTier): boolean {
  const state = useSubscriptionStore.getState();
  return state.subscription.tier >= requiredTier;
}

/**
 * Get current tier synchronously
 */
export function getCurrentTier(): SubscriptionTier {
  return useSubscriptionStore.getState().subscription.tier;
}

// ============================================================================
// FEATURE FLAG OBJECT
// ============================================================================

/**
 * Get all feature flags as an object (useful for feature flagging UI)
 */
export function useFeatureFlags() {
  const tier = useSubscriptionStore(selectTier);
  const purchasedReleases = useSubscriptionStore((state) => state.purchasedReleases);

  return useMemo(() => ({
    // Void Walker+ features
    voiceConfessions: tier >= SubscriptionTier.VoidWalker,
    customThemes: tier >= SubscriptionTier.VoidWalker,
    confidantAI: tier >= SubscriptionTier.VoidWalker,
    enhancedResonance: tier >= SubscriptionTier.VoidWalker,
    allReleaseAnimations: tier >= SubscriptionTier.VoidWalker,
    adFree: tier >= SubscriptionTier.VoidWalker,

    // Guardian+ features
    priorityEchoDelivery: tier >= SubscriptionTier.Guardian,
    extendedHistory: tier >= SubscriptionTier.Guardian,
    moodAnalytics: tier >= SubscriptionTier.Guardian,
    earlyAccess: tier >= SubscriptionTier.Guardian,
    guardianBadge: tier >= SubscriptionTier.Guardian,

    // Witnessed only features
    witnessedConfessions: tier >= SubscriptionTier.Witnessed,
    directSupport: tier >= SubscriptionTier.Witnessed,
    exclusiveVoidChambers: tier >= SubscriptionTier.Witnessed,
    customConfessionStyles: tier >= SubscriptionTier.Witnessed,
    witnessedBadge: tier >= SubscriptionTier.Witnessed,

    // Individual release animations (check individual purchase OR subscription)
    releaseBurn: tier >= SubscriptionTier.VoidWalker || purchasedReleases.has('releaseBurn'),
    releaseShatter: tier >= SubscriptionTier.VoidWalker || purchasedReleases.has('releaseShatter'),
    releaseScream: tier >= SubscriptionTier.VoidWalker || purchasedReleases.has('releaseScream'),
    releaseDissolve: tier >= SubscriptionTier.VoidWalker || purchasedReleases.has('releaseDissolve'),
    releaseStorm: tier >= SubscriptionTier.VoidWalker || purchasedReleases.has('releaseStorm'),
    releaseDrift: tier >= SubscriptionTier.VoidWalker || purchasedReleases.has('releaseDrift'),
  }), [tier, purchasedReleases]);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  FEATURES,
  SubscriptionTier,
  TIER_CONFIG,
  FEATURE_TIER_REQUIREMENTS,
};

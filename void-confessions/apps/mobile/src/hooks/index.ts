/**
 * Hooks Barrel Export
 */

export {
  useSubscription,
  useFeatureAccess,
  usePurchaseActions,
  useReleaseAnimations,
  usePaywall,
  useSubscriptionInit,
} from './useSubscription';

export {
  useFeatureGate,
  useVoiceConfessions,
  useCustomThemes,
  useConfidantAI,
  useEnhancedResonance,
  useWitnessedConfessions,
  useAdFree,
  usePriorityEcho,
  useExtendedHistory,
  useMoodAnalytics,
  useReleaseAnimationAccess,
  useAllReleaseAnimations,
  useIsVoidWalkerPlus,
  useIsGuardianPlus,
  useIsWitnessed,
  useFeatureFlags,
  checkFeatureAccess,
  checkTierAccess,
  getCurrentTier,
  FEATURES,
  SubscriptionTier,
  TIER_CONFIG,
  FEATURE_TIER_REQUIREMENTS,
  type FeatureGateResult,
  type ReleaseAnimationAccess,
} from './useFeatureGate';

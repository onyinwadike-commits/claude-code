export {
  connectSocket,
  disconnectSocket,
  getSocket,
  joinVoid,
  leaveVoid,
  resonateConfession,
  echoConfession,
} from './socket';

export {
  // Initialization
  initializePurchases,

  // Offerings
  fetchOfferings,
  getOfferings,
  getSubscriptionPackagesByTier,
  getReleaseAnimationPackages,

  // Purchases
  purchaseSubscription,
  purchaseReleaseAnimation,
  purchaseProduct,
  purchasePackage,

  // Restore
  restorePurchases,

  // Management
  getManagementURL,
  checkIntroEligibility,

  // User
  loginUser,
  logoutUser,
  getAppUserId,

  // Helpers
  hasEntitlement,
  getCurrentTier,
  hasTier,
  refreshCustomerInfo,
  checkPremiumStatus,

  // Constants
  ENTITLEMENTS,

  // Types
  type PurchaseResult,
} from './purchases';

export {
  requestAudioPermissions,
  configureAudioSession,
  startRecording,
  stopRecording,
  getRecordingDuration,
  playAudio,
  stopAudio,
  cleanupAudio,
  type RecordingState,
} from './audio';

export {
  anonymizeVoice,
  uploadAnonymizedAudio,
  deleteAnonymizedFile,
  cleanupTempAudioFiles,
  generateRandomParams,
  isNativeAnonymizerAvailable,
  getAudioFileInfo,
  type AnonymizationParams,
  type AnonymizationResult,
} from './voiceAnonymizer';

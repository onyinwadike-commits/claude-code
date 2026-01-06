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
  initializePurchases,
  checkPremiumStatus,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getSubscriptionInfo,
  PRODUCTS,
  ENTITLEMENTS,
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

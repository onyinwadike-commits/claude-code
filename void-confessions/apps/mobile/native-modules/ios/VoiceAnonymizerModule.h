/**
 * VoiceAnonymizerModule.h
 * Native module for iOS voice anonymization
 *
 * Uses AVFoundation and Accelerate framework for audio processing:
 * - Pitch shifting using AVAudioUnitTimePitch
 * - Time stretching using AVAudioUnitVarispeed
 * - Noise injection using vDSP
 */

#import <React/RCTBridgeModule.h>

@interface VoiceAnonymizerModule : NSObject <RCTBridgeModule>

@end

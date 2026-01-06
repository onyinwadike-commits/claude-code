/**
 * ScreenshotBlockerModule.h
 * Native module for iOS screenshot detection
 *
 * This module listens for UIApplicationUserDidTakeScreenshotNotification
 * and emits events to JavaScript when a screenshot is taken.
 *
 * Installation:
 * 1. Add these files to your Xcode project
 * 2. Ensure they're included in the build target
 * 3. The module will auto-link with React Native's new architecture
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface ScreenshotBlockerModule : RCTEventEmitter <RCTBridgeModule>

@end

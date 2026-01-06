/**
 * ScreenshotBlockerModule.m
 * Implementation of iOS screenshot detection native module
 */

#import "ScreenshotBlockerModule.h"
#import <UIKit/UIKit.h>

@implementation ScreenshotBlockerModule
{
  bool hasListeners;
}

RCT_EXPORT_MODULE();

- (instancetype)init
{
  self = [super init];
  if (self) {
    // Register for screenshot notification
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleScreenshot:)
                                                 name:UIApplicationUserDidTakeScreenshotNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onScreenshotTaken"];
}

// Will be called when this module's first listener is added.
- (void)startObserving
{
  hasListeners = YES;
}

// Will be called when this module's last listener is removed, or on dealloc.
- (void)stopObserving
{
  hasListeners = NO;
}

- (void)handleScreenshot:(NSNotification *)notification
{
  if (hasListeners) {
    [self sendEventWithName:@"onScreenshotTaken" body:@{
      @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
    }];
  }
}

/**
 * Optional: Check if screen capture is happening (for screen recording detection)
 * Note: This requires additional setup and may not work on all iOS versions
 */
RCT_EXPORT_METHOD(isScreenBeingCaptured:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (@available(iOS 11.0, *)) {
    BOOL isCaptured = [[UIScreen mainScreen] isCaptured];
    resolve(@(isCaptured));
  } else {
    resolve(@(NO));
  }
}

/**
 * Add a visual overlay to prevent capture (optional extra protection)
 * This creates a secure text field trick that obscures content
 */
RCT_EXPORT_METHOD(enableSecureTextOverlay:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    // Get the key window
    UIWindow *window = nil;
    if (@available(iOS 13.0, *)) {
      for (UIWindowScene* windowScene in [UIApplication sharedApplication].connectedScenes) {
        if (windowScene.activationState == UISceneActivationStateForegroundActive) {
          for (UIWindow *win in windowScene.windows) {
            if (win.isKeyWindow) {
              window = win;
              break;
            }
          }
        }
      }
    } else {
      window = [UIApplication sharedApplication].keyWindow;
    }

    if (window) {
      // The secure text field prevents screenshots of its superview
      UITextField *secureField = [[UITextField alloc] initWithFrame:CGRectMake(0, 0, 1, 1)];
      secureField.secureTextEntry = YES;
      secureField.userInteractionEnabled = NO;
      secureField.tag = 99999; // Tag for later removal
      [window addSubview:secureField];
      [window.layer.superlayer addSublayer:secureField.layer];
      [secureField.layer.sublayers.firstObject addSublayer:window.layer];

      resolve(@(YES));
    } else {
      reject(@"NO_WINDOW", @"Could not find key window", nil);
    }
  });
}

RCT_EXPORT_METHOD(disableSecureTextOverlay:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIWindow *window = nil;
    if (@available(iOS 13.0, *)) {
      for (UIWindowScene* windowScene in [UIApplication sharedApplication].connectedScenes) {
        if (windowScene.activationState == UISceneActivationStateForegroundActive) {
          for (UIWindow *win in windowScene.windows) {
            if (win.isKeyWindow) {
              window = win;
              break;
            }
          }
        }
      }
    } else {
      window = [UIApplication sharedApplication].keyWindow;
    }

    if (window) {
      UIView *secureField = [window viewWithTag:99999];
      [secureField removeFromSuperview];
      resolve(@(YES));
    } else {
      resolve(@(NO));
    }
  });
}

@end

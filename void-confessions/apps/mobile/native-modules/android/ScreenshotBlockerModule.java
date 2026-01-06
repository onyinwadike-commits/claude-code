/**
 * ScreenshotBlockerModule.java
 * Native module for Android screenshot blocking using FLAG_SECURE
 *
 * FLAG_SECURE prevents:
 * - Screenshots
 * - Screen recording
 * - Display on non-secure displays
 * - Recent apps thumbnail
 *
 * Installation:
 * 1. Add this file to android/app/src/main/java/com/voidconfessions/
 * 2. Add ScreenshotBlockerPackage to MainApplication.java
 * 3. The module will be available as NativeModules.ScreenshotBlockerModule
 */

package com.voidconfessions.screenshotblocker;

import android.app.Activity;
import android.view.WindowManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = ScreenshotBlockerModule.NAME)
public class ScreenshotBlockerModule extends ReactContextBaseJavaModule {
    public static final String NAME = "ScreenshotBlockerModule";
    private boolean isSecureModeEnabled = false;

    public ScreenshotBlockerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    /**
     * Enable FLAG_SECURE to prevent screenshots and screen recording
     */
    @ReactMethod
    public void enableSecureMode() {
        final Activity activity = getCurrentActivity();
        if (activity != null) {
            UiThreadUtil.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
                        isSecureModeEnabled = true;
                    } catch (Exception e) {
                        // Log error but don't crash
                        e.printStackTrace();
                    }
                }
            });
        }
    }

    /**
     * Disable FLAG_SECURE to allow screenshots and screen recording
     */
    @ReactMethod
    public void disableSecureMode() {
        final Activity activity = getCurrentActivity();
        if (activity != null) {
            UiThreadUtil.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                        isSecureModeEnabled = false;
                    } catch (Exception e) {
                        // Log error but don't crash
                        e.printStackTrace();
                    }
                }
            });
        }
    }

    /**
     * Check if secure mode is currently enabled
     */
    @ReactMethod
    public void isSecureModeEnabled(Promise promise) {
        promise.resolve(isSecureModeEnabled);
    }

    /**
     * Enable secure mode and return a promise
     */
    @ReactMethod
    public void enableSecureModeAsync(Promise promise) {
        final Activity activity = getCurrentActivity();
        if (activity != null) {
            UiThreadUtil.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
                        isSecureModeEnabled = true;
                        promise.resolve(true);
                    } catch (Exception e) {
                        promise.reject("ERROR", "Failed to enable secure mode", e);
                    }
                }
            });
        } else {
            promise.reject("NO_ACTIVITY", "No current activity found");
        }
    }

    /**
     * Disable secure mode and return a promise
     */
    @ReactMethod
    public void disableSecureModeAsync(Promise promise) {
        final Activity activity = getCurrentActivity();
        if (activity != null) {
            UiThreadUtil.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                        isSecureModeEnabled = false;
                        promise.resolve(true);
                    } catch (Exception e) {
                        promise.reject("ERROR", "Failed to disable secure mode", e);
                    }
                }
            });
        } else {
            promise.reject("NO_ACTIVITY", "No current activity found");
        }
    }
}

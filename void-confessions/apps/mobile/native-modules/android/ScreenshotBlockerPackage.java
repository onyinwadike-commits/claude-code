/**
 * ScreenshotBlockerPackage.java
 * React Native package that registers the ScreenshotBlockerModule
 *
 * Installation:
 * Add to MainApplication.java in getPackages():
 *
 * @Override
 * protected List<ReactPackage> getPackages() {
 *   List<ReactPackage> packages = new PackageList(this).getPackages();
 *   packages.add(new ScreenshotBlockerPackage());
 *   return packages;
 * }
 */

package com.voidconfessions.screenshotblocker;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ScreenshotBlockerPackage implements ReactPackage {

    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new ScreenshotBlockerModule(reactContext));
        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}

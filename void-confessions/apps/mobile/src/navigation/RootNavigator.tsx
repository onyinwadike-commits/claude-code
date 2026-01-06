import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

// Screens
import {
  HomeScreen,
  VoidSelectScreen,
  VoidScreen,
  ComposeScreen,
  ReleaseScreen,
  SettingsScreen,
  PremiumScreen,
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root navigation stack
 */
export function RootNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: {
          backgroundColor: '#0a0a0a',
        },
        // Disable gestures for immersive experience
        gestureEnabled: false,
      }}
    >
      {/* Main Flow */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="VoidSelect"
        component={VoidSelectScreen}
        options={{ animation: 'fade_from_bottom' }}
      />
      <Stack.Screen
        name="Void"
        component={VoidScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="Compose"
        component={ComposeScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Release"
        component={ReleaseScreen}
        options={{
          animation: 'fade',
          gestureEnabled: false, // Prevent accidental dismissal during release
        }}
      />

      {/* Settings & Premium */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

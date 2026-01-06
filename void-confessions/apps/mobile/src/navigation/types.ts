import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { VoidType } from '@void-confessions/core';

/**
 * Root stack parameter list
 */
export type RootStackParamList = {
  // Main screens
  Home: undefined;
  VoidSelect: undefined;
  Void: { voidType: VoidType };
  Compose: { voidType: VoidType };
  Release: { confessionId: string; voidType: VoidType; confessionContent?: string };

  // Settings & Premium
  Settings: undefined;
  Premium: undefined;
  SubscriptionSuccess: undefined;

  // Letters to the Void
  LetterToVoid: { voidType: VoidType };
  LetterReveal: { letterId: string };
  LettersList: undefined;

  // Onboarding
  Onboarding: undefined;
  OnboardingComplete: undefined;
};

/**
 * Screen props types for type-safe navigation
 */
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type VoidSelectScreenProps = NativeStackScreenProps<RootStackParamList, 'VoidSelect'>;
export type VoidScreenProps = NativeStackScreenProps<RootStackParamList, 'Void'>;
export type ComposeScreenProps = NativeStackScreenProps<RootStackParamList, 'Compose'>;
export type ReleaseScreenProps = NativeStackScreenProps<RootStackParamList, 'Release'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
export type PremiumScreenProps = NativeStackScreenProps<RootStackParamList, 'Premium'>;
export type LetterToVoidScreenProps = NativeStackScreenProps<RootStackParamList, 'LetterToVoid'>;
export type LetterRevealScreenProps = NativeStackScreenProps<RootStackParamList, 'LetterReveal'>;
export type LettersListScreenProps = NativeStackScreenProps<RootStackParamList, 'LettersList'>;

/**
 * Type for useNavigation hook
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { VOID_CONFIG } from '@void-confessions/core';
import type { ReleaseScreenProps } from '../navigation';
import { Confidant } from '../components/Confidant';
import { useSettingsStore, selectConfidantEnabled } from '../store/settingsStore';
import { useConfidantAI } from '../hooks';

const { width, height } = Dimensions.get('window');

type ReleasePhase = 'releasing' | 'released' | 'confidant' | 'complete';

export function ReleaseScreen(): React.JSX.Element {
  const navigation = useNavigation<ReleaseScreenProps['navigation']>();
  const route = useRoute<ReleaseScreenProps['route']>();
  const { voidType, confessionContent } = route.params;

  const config = VOID_CONFIG[voidType];

  // Settings
  const confidantEnabled = useSettingsStore(selectConfidantEnabled);
  const { hasAccess: hasConfidantAccess } = useConfidantAI();

  // Phase state
  const [phase, setPhase] = useState<ReleasePhase>('releasing');

  // Animation values
  const orbitScale = useSharedValue(1);
  const orbitOpacity = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const completedOpacity = useSharedValue(0);

  // Determine if we should show Confidant
  const shouldShowConfidant = confidantEnabled && hasConfidantAccess && confessionContent;

  const navigateBack = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'Home' },
          { name: 'Void', params: { voidType } },
        ],
      })
    );
  }, [navigation, voidType]);

  const handleConfidantDismiss = useCallback(() => {
    setPhase('complete');
    // Brief delay before navigating back
    setTimeout(() => {
      navigateBack();
    }, 500);
  }, [navigateBack]);

  const showConfidantOrComplete = useCallback(() => {
    if (shouldShowConfidant) {
      setPhase('confidant');
    } else {
      setPhase('complete');
      setTimeout(() => {
        navigateBack();
      }, 2000);
    }
  }, [shouldShowConfidant, navigateBack]);

  useEffect(() => {
    if (phase !== 'releasing') return;

    // Show "Releasing..." text
    textOpacity.value = withTiming(1, { duration: 500 });

    // Shrink orb and fade out
    orbitScale.value = withSequence(
      withTiming(1.2, { duration: 500, easing: Easing.out(Easing.ease) }),
      withDelay(
        500,
        withTiming(0, { duration: 1500, easing: Easing.in(Easing.ease) })
      )
    );

    orbitOpacity.value = withDelay(
      1000,
      withTiming(0, { duration: 1000 })
    );

    // Show completion message
    completedOpacity.value = withDelay(
      2000,
      withTiming(1, { duration: 500 }, () => {
        runOnJS(setPhase)('released');
      })
    );
  }, [phase, textOpacity, orbitScale, orbitOpacity, completedOpacity]);

  // Handle phase transitions
  useEffect(() => {
    if (phase !== 'released') return;

    // Wait for user to see completion message, then show Confidant or navigate
    const timeout = setTimeout(() => {
      showConfidantOrComplete();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [phase, showConfidantOrComplete]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbitScale.value }],
    opacity: orbitOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const completedStyle = useAnimatedStyle(() => ({
    opacity: completedOpacity.value,
  }));

  // Show Confidant overlay
  if (phase === 'confidant' && confessionContent) {
    return (
      <View style={styles.container}>
        <Confidant
          confessionContent={confessionContent}
          voidType={voidType}
          onDismiss={handleConfidantDismiss}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Ambient background */}
      <View
        style={[styles.ambientGlow, { backgroundColor: config.colors.primary }]}
      />

      {/* Orb animation */}
      <View style={styles.orbContainer}>
        <Animated.View
          style={[
            styles.orb,
            orbStyle,
            { backgroundColor: config.colors.primary },
          ]}
        />
      </View>

      {/* Text */}
      <View style={styles.textContainer}>
        <Animated.Text style={[styles.releasingText, textStyle]}>
          Releasing into the void...
        </Animated.Text>

        <Animated.View style={[styles.completedContainer, completedStyle]}>
          <Text style={styles.completedText}>Your confession is free</Text>
          <Text style={styles.subtitleText}>
            It will exist for 5 minutes,{'\n'}then fade into nothing
          </Text>
          {shouldShowConfidant && (
            <Text style={styles.confidantHint}>
              The Confidant is listening...
            </Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    top: height * 0.2,
    width: width,
    height: width,
    borderRadius: width / 2,
    opacity: 0.2,
  },
  orbContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  orb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  releasingText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 40,
  },
  completedContainer: {
    alignItems: 'center',
    position: 'absolute',
    top: 0,
  },
  completedText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 16,
  },
  subtitleText: {
    fontSize: 16,
    color: '#8b8b9a',
    textAlign: 'center',
    lineHeight: 24,
  },
  confidantHint: {
    fontSize: 14,
    color: '#7c3aed',
    marginTop: 24,
    fontStyle: 'italic',
  },
});

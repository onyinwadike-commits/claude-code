/**
 * LetterReveal Screen
 *
 * Reveals a letter that has returned from the void.
 * Auto-deletes after viewing.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { VOID_CONFIG } from '@void-confessions/core';
import type { VoidType } from '@void-confessions/core';
import { getLetter, markLetterViewed, deleteLetter } from '../services/letterStorage';
import { clearBadge } from '../services/letterNotifications';
import type { DecryptedLetter } from '../services/letterEncryption';
import type { LetterRevealScreenProps } from '../navigation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type RevealPhase = 'loading' | 'unsealing' | 'revealed' | 'fading';

export function LetterRevealScreen(): React.JSX.Element {
  const navigation = useNavigation<LetterRevealScreenProps['navigation']>();
  const route = useRoute<LetterRevealScreenProps['route']>();
  const { letterId } = route.params;

  // State
  const [phase, setPhase] = useState<RevealPhase>('loading');
  const [letter, setLetter] = useState<DecryptedLetter | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const sealOpacity = useSharedValue(1);
  const sealScale = useSharedValue(1);
  const letterOpacity = useSharedValue(0);
  const letterY = useSharedValue(50);
  const glowIntensity = useSharedValue(0);

  const voidType = (letter?.voidType || 'grief') as VoidType;
  const config = VOID_CONFIG[voidType];

  // Load and decrypt the letter
  useEffect(() => {
    const loadLetter = async () => {
      try {
        const decrypted = await getLetter(letterId);
        if (!decrypted) {
          setError('This letter could not be found or decrypted.');
          return;
        }
        setLetter(decrypted);
        setPhase('unsealing');
      } catch (err) {
        console.error('Failed to load letter:', err);
        setError('Failed to retrieve your letter.');
      }
    };

    loadLetter();
    clearBadge();
  }, [letterId]);

  // Unsealing animation
  useEffect(() => {
    if (phase !== 'unsealing') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate the seal breaking
    sealScale.value = withSequence(
      withTiming(1.1, { duration: 300 }),
      withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) })
    );

    sealOpacity.value = withDelay(
      200,
      withTiming(0, { duration: 400 })
    );

    // Glow effect
    glowIntensity.value = withSequence(
      withTiming(1, { duration: 500 }),
      withTiming(0.3, { duration: 1000 })
    );

    // Reveal the letter
    letterOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );

    letterY.value = withDelay(
      600,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) }, () => {
        runOnJS(setPhase)('revealed');
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
      })
    );
  }, [phase, sealScale, sealOpacity, glowIntensity, letterOpacity, letterY]);

  // Mark as viewed when revealed
  useEffect(() => {
    if (phase === 'revealed') {
      markLetterViewed(letterId);
    }
  }, [phase, letterId]);

  const handleDismiss = useCallback(() => {
    setPhase('fading');

    // Confirm and delete
    Alert.alert(
      'Delete this letter?',
      'Once deleted, this letter cannot be recovered.',
      [
        {
          text: 'Keep for now',
          style: 'cancel',
          onPress: () => setPhase('revealed'),
        },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: async () => {
            await deleteLetter(letterId);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            navigation.goBack();
          },
        },
      ]
    );
  }, [letterId, navigation]);

  // Format dates
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const timeSinceWritten = letter
    ? Math.floor((Date.now() - letter.createdAt) / (24 * 60 * 60 * 1000))
    : 0;

  // Animated styles
  const sealStyle = useAnimatedStyle(() => ({
    opacity: sealOpacity.value,
    transform: [{ scale: sealScale.value }],
  }));

  const letterStyle = useAnimatedStyle(() => ({
    opacity: letterOpacity.value,
    transform: [{ translateY: letterY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value * 0.4,
  }));

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>💔</Text>
          <Text style={styles.errorTitle}>Letter Lost</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading state
  if (phase === 'loading' || !letter) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Retrieving your letter...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Ambient glow */}
      <Animated.View
        style={[
          styles.ambientGlow,
          glowStyle,
          { backgroundColor: config.colors.primary },
        ]}
      />

      {/* Seal animation (shown during unsealing) */}
      {phase === 'unsealing' && (
        <Animated.View style={[styles.sealContainer, sealStyle]}>
          <View style={[styles.seal, { backgroundColor: config.colors.primary }]}>
            <Text style={styles.sealText}>📜</Text>
          </View>
          <Text style={styles.unsealingText}>Breaking the seal...</Text>
        </Animated.View>
      )}

      {/* Letter content */}
      <Animated.View style={[styles.letterContainer, letterStyle]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.delay(800)} style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleDismiss}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Letter meta */}
          <Animated.View entering={FadeInUp.delay(900)} style={styles.metaSection}>
            <Text style={styles.metaLabel}>A letter from {timeSinceWritten} days ago</Text>
            <Text style={styles.metaDate}>Written {formatDate(letter.createdAt)}</Text>
          </Animated.View>

          {/* Void type indicator */}
          <Animated.View
            entering={FadeInUp.delay(1000)}
            style={[styles.voidBadge, { backgroundColor: `${config.colors.primary}30` }]}
          >
            <Text style={[styles.voidBadgeText, { color: config.colors.primary }]}>
              From the {config.name} void
            </Text>
          </Animated.View>

          {/* Letter content */}
          <Animated.View entering={FadeInUp.delay(1100)} style={styles.contentContainer}>
            <Text style={styles.letterContent}>{letter.content}</Text>
          </Animated.View>

          {/* Signature */}
          <Animated.View entering={FadeInUp.delay(1200)} style={styles.signatureSection}>
            <Text style={styles.signatureDash}>—</Text>
            <Text style={styles.signatureText}>Your past self</Text>
          </Animated.View>

          {/* Delete prompt */}
          <Animated.View entering={FadeInUp.delay(1300)} style={styles.deleteSection}>
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: config.colors.primary }]}
              onPress={handleDismiss}
            >
              <Text style={[styles.deleteButtonText, { color: config.colors.primary }]}>
                Release this letter
              </Text>
            </TouchableOpacity>
            <Text style={styles.deleteHint}>
              This letter will be permanently deleted
            </Text>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  ambientGlow: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.2,
    left: (SCREEN_WIDTH - SCREEN_WIDTH * 0.8) / 2,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8b8b9a',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#8b8b9a',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  errorButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  sealContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  seal: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  sealText: {
    fontSize: 48,
  },
  unsealingText: {
    fontSize: 16,
    color: '#8b8b9a',
    fontStyle: 'italic',
  },
  letterContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '300',
  },
  metaSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  metaLabel: {
    fontSize: 14,
    color: '#8b8b9a',
    marginBottom: 4,
  },
  metaDate: {
    fontSize: 12,
    color: '#6b6b7a',
  },
  voidBadge: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 32,
  },
  voidBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contentContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  letterContent: {
    fontSize: 18,
    lineHeight: 30,
    color: '#ffffff',
  },
  signatureSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  signatureDash: {
    fontSize: 24,
    color: '#6b6b7a',
    marginBottom: 8,
  },
  signatureText: {
    fontSize: 16,
    color: '#8b8b9a',
    fontStyle: 'italic',
  },
  deleteSection: {
    alignItems: 'center',
  },
  deleteButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 2,
    marginBottom: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteHint: {
    fontSize: 12,
    color: '#6b6b7a',
  },
});

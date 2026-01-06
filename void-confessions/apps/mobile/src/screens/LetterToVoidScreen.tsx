/**
 * LetterToVoid Screen
 *
 * Write a confession to your future self.
 * Encrypted and stored locally only - never leaves the device.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { VOID_CONFIG, CONFESSION_MAX_LENGTH } from '@void-confessions/core';
import type { VoidType } from '@void-confessions/core';
import { saveLetter } from '../services/letterStorage';
import { scheduleLetterNotification } from '../services/letterNotifications';
import type { LetterToVoidScreenProps } from '../navigation';

const RETURN_OPTIONS: Array<{ days: 30 | 90 | 365; label: string; description: string }> = [
  { days: 30, label: '30 Days', description: 'One month' },
  { days: 90, label: '90 Days', description: 'Three months' },
  { days: 365, label: '1 Year', description: 'One year' },
];

export function LetterToVoidScreen(): React.JSX.Element {
  const navigation = useNavigation<LetterToVoidScreenProps['navigation']>();
  const route = useRoute<LetterToVoidScreenProps['route']>();
  const { voidType } = route.params;

  const config = VOID_CONFIG[voidType];

  // Form state
  const [content, setContent] = useState('');
  const [selectedDays, setSelectedDays] = useState<30 | 90 | 365>(90);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation for selected option
  const scale = useSharedValue(1);

  const handleSelectDays = useCallback((days: 30 | 90 | 365) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDays(days);
    scale.value = withSpring(1.05, {}, () => {
      scale.value = withSpring(1);
    });
  }, [scale]);

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Please write something to your future self');
      return;
    }

    if (content.length < 10) {
      setError('Your letter should be at least 10 characters');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Save encrypted letter locally
      const letterId = await saveLetter(content, voidType, selectedDays);

      // Schedule notification
      await scheduleLetterNotification({
        id: letterId,
        createdAt: Date.now(),
        returnDate: Date.now() + selectedDays * 24 * 60 * 60 * 1000,
        returnDays: selectedDays,
        hasBeenViewed: false,
        isReady: false,
      });

      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show confirmation
      Alert.alert(
        'Letter Sealed',
        `Your letter has been encrypted and sealed. It will return to you in ${selectedDays} days.\n\nThis letter never leaves your device.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      console.error('Failed to save letter:', err);
      setError('Failed to save your letter. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const returnDate = new Date(Date.now() + selectedDays * 24 * 60 * 60 * 1000);
  const formattedDate = returnDate.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Ambient glow */}
      <View
        style={[styles.ambientGlow, { backgroundColor: config.colors.primary }]}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Letter to the Void</Text>
          <Text style={styles.subtitle}>Write to your future self</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: config.colors.primary },
            (!content.trim() || isSaving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!content.trim() || isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Sealing...' : 'Seal'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Privacy notice */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.privacyNotice}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            Encrypted locally • Never leaves your device • Auto-deletes after viewing
          </Text>
        </Animated.View>

        {/* Text input */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <TextInput
            style={styles.input}
            placeholder="Dear future me..."
            placeholderTextColor="#6b6b7a"
            value={content}
            onChangeText={(text) => {
              setContent(text);
              setError(null);
            }}
            multiline
            autoFocus
            maxLength={CONFESSION_MAX_LENGTH}
          />

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Text style={styles.charCount}>
            {content.length}/{CONFESSION_MAX_LENGTH}
          </Text>
        </Animated.View>

        {/* Return date selector */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(200)}
          style={styles.returnSection}
        >
          <Text style={styles.sectionTitle}>When should this return?</Text>

          <View style={styles.optionsRow}>
            {RETURN_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.days}
                style={[
                  styles.optionButton,
                  selectedDays === option.days && styles.optionButtonSelected,
                  selectedDays === option.days && {
                    borderColor: config.colors.primary,
                    backgroundColor: `${config.colors.primary}20`,
                  },
                ]}
                onPress={() => handleSelectDays(option.days)}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    selectedDays === option.days && styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Return date preview */}
          <View style={styles.datePreview}>
            <Text style={styles.datePreviewLabel}>Returns on</Text>
            <Text style={[styles.datePreviewDate, { color: config.colors.primary }]}>
              {formattedDate}
            </Text>
          </View>
        </Animated.View>

        {/* Info section */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(300)}
          style={styles.infoSection}
        >
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>1</Text>
            <Text style={styles.infoText}>
              Your letter is encrypted with a key stored only on your device
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>2</Text>
            <Text style={styles.infoText}>
              A notification will remind you when it's ready to reveal
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>3</Text>
            <Text style={styles.infoText}>
              After you read it, the letter is permanently deleted
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  ambientGlow: {
    position: 'absolute',
    top: -200,
    left: -100,
    right: -100,
    height: 400,
    borderRadius: 200,
    opacity: 0.15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '300',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#8b8b9a',
    marginTop: 2,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#8b8b9a',
  },
  input: {
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 28,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
  },
  charCount: {
    fontSize: 14,
    color: '#6b6b7a',
    textAlign: 'right',
    marginTop: 8,
  },
  returnSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderWidth: 2,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: '#ffffff',
  },
  optionDescription: {
    fontSize: 12,
    color: '#8b8b9a',
  },
  datePreview: {
    marginTop: 20,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  datePreviewLabel: {
    fontSize: 12,
    color: '#8b8b9a',
    marginBottom: 4,
  },
  datePreviewDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 32,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b8b9a',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2a2a3e',
    color: '#8b8b9a',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#8b8b9a',
    lineHeight: 20,
  },
});

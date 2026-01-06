import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { VOID_CONFIG, CONFESSION_MAX_LENGTH, validateConfessionContent } from '@void-confessions/core';
import { useVoidStore } from '../store';
import type { ComposeScreenProps } from '../navigation';

export function ComposeScreen(): React.JSX.Element {
  const navigation = useNavigation<ComposeScreenProps['navigation']>();
  const route = useRoute<ComposeScreenProps['route']>();
  const { voidType } = route.params;

  const config = VOID_CONFIG[voidType];
  const isPremium = useVoidStore((state) => state.isPremium);

  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validation = validateConfessionContent(content);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid content');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // TODO: Call API to create confession
      const response = await fetch('http://localhost:3002/confessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          voidType,
          releaseStyle: 'default',
        }),
      });

      const data = await response.json();

      if (data.success) {
        navigation.replace('Release', {
          confessionId: data.data.id,
          voidType,
        });
      } else {
        setError(data.error?.message ?? 'Failed to create confession');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <Text style={styles.title}>Confess to the Void</Text>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: config.colors.primary },
            (!content.trim() || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!content.trim() || isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '...' : 'Release'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeIn.duration(300)}>
          <TextInput
            style={styles.input}
            placeholder="What weighs on your soul?"
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

          <View style={styles.footer}>
            <Text style={styles.charCount}>
              {content.length}/{CONFESSION_MAX_LENGTH}
            </Text>

            {!isPremium && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Premium')}
              >
                <Text style={styles.premiumHint}>
                  Unlock voice confessions →
                </Text>
              </TouchableOpacity>
            )}
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  submitButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
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
  input: {
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 28,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  charCount: {
    fontSize: 14,
    color: '#6b6b7a',
  },
  premiumHint: {
    fontSize: 14,
    color: '#7c3aed',
  },
});

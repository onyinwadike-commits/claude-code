import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { validateConfessionContent, CONFESSION_MAX_LENGTH } from '@void-confessions/core';

export function HomeScreen() {
  const [confession, setConfession] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const validation = validateConfessionContent(confession);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError(undefined);
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setSubmitted(true);
    setConfession('');
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <Text style={styles.successEmoji}>🌌</Text>
          <Text style={styles.successTitle}>Your confession has been sent into the void</Text>
          <Text style={styles.successMessage}>
            It will be reviewed and may appear anonymously soon.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => setSubmitted(false)}>
            <Text style={styles.buttonText}>Share Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Void Confessions</Text>
          <Text style={styles.subtitle}>Share your thoughts anonymously into the void</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Your Confession</Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="What would you like to confess to the void?"
            placeholderTextColor="#9ca3af"
            value={confession}
            onChangeText={setConfession}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.helperText}>
              {confession.length}/{CONFESSION_MAX_LENGTH} characters
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, (!confession.trim() || isSubmitting) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!confession.trim() || isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Sending...' : 'Send to the Void'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4c1d95',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 150,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#c4b5fd',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  successCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
});

import React, { useState, useCallback, useMemo } from 'react';
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
import * as Localization from 'expo-localization';
import {
  VOID_CONFIG,
  CONFESSION_MAX_LENGTH,
  validateConfessionContent,
  detectCrisis,
  createCrisisResponse,
  logInterventionMetric,
  createInterventionMetric,
  type CrisisLocale,
  type CrisisResponse,
} from '@void-confessions/core';
import { useVoidStore } from '../store';
import { CrisisResourcesModal } from '../components/CrisisResourcesModal';
import type { ComposeScreenProps } from '../navigation';

/**
 * Map device region to crisis locale
 */
function getLocaleFromDevice(): CrisisLocale {
  const region = Localization.getLocales()[0]?.regionCode?.toUpperCase();

  const localeMap: Record<string, CrisisLocale> = {
    US: 'US',
    GB: 'UK',
    UK: 'UK',
    CA: 'CA',
    AU: 'AU',
    NZ: 'NZ',
    IE: 'IE',
    DE: 'DE',
    FR: 'FR',
    ES: 'ES',
    IT: 'IT',
    NL: 'NL',
    BE: 'BE',
    IN: 'IN',
    JP: 'JP',
    KR: 'KR',
    BR: 'BR',
    MX: 'MX',
  };

  return localeMap[region || ''] || 'INTL';
}

export function ComposeScreen(): React.JSX.Element {
  const navigation = useNavigation<ComposeScreenProps['navigation']>();
  const route = useRoute<ComposeScreenProps['route']>();
  const { voidType } = route.params;

  const config = VOID_CONFIG[voidType];
  const isPremium = useVoidStore((state) => state.isPremium);

  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Crisis detection state
  const [crisisResponse, setCrisisResponse] = useState<CrisisResponse | null>(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  // Get user's locale for crisis resources
  const userLocale = useMemo(() => getLocaleFromDevice(), []);

  // Check content for crisis indicators in real-time
  const crisisDetection = useMemo(() => {
    if (content.length < 10) return null;
    return detectCrisis(content, userLocale);
  }, [content, userLocale]);

  // Determine if we should show "Get Help" button
  const showGetHelp = crisisDetection?.detected || false;

  const handleGetHelp = useCallback(() => {
    if (!crisisDetection?.detected) return;

    // Create and show crisis response
    const response = createCrisisResponse(userLocale);
    setCrisisResponse(response);
    setShowCrisisModal(true);

    // Log intervention (no content)
    const metric = createInterventionMetric(crisisDetection, userLocale);
    if (metric) {
      logInterventionMetric(metric);
    }
  }, [crisisDetection, userLocale]);

  const handleSubmit = async () => {
    // First check for crisis content
    if (crisisDetection?.detected) {
      handleGetHelp();
      return; // Do NOT post the confession
    }

    const validation = validateConfessionContent(content);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid content');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Call API to create confession
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

      // Server-side crisis detection (backup)
      if (data.crisisDetected) {
        setCrisisResponse(data);
        setShowCrisisModal(true);
        return;
      }

      if (data.success) {
        navigation.replace('Release', {
          confessionId: data.data.id,
          voidType,
          confessionContent: content, // Pass content for Confidant (analyzed locally only)
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

  const handleCloseCrisisModal = useCallback(() => {
    setShowCrisisModal(false);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Ambient glow */}
      <View
        style={[
          styles.ambientGlow,
          { backgroundColor: showGetHelp ? '#2d5a3d' : config.colors.primary },
        ]}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {showGetHelp ? 'We\'re Here For You' : 'Confess to the Void'}
        </Text>

        {/* Dynamic button: Get Help or Release */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            showGetHelp
              ? styles.getHelpButton
              : { backgroundColor: config.colors.primary },
            (!content.trim() || isSubmitting) && !showGetHelp && styles.submitButtonDisabled,
          ]}
          onPress={showGetHelp ? handleGetHelp : handleSubmit}
          disabled={(!content.trim() || isSubmitting) && !showGetHelp}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '...' : showGetHelp ? '💚 Get Help' : 'Release'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Crisis notice banner */}
      {showGetHelp && (
        <Animated.View entering={FadeIn} style={styles.crisisBanner}>
          <Text style={styles.crisisBannerText}>
            It sounds like you might be going through a difficult time.
            Support is available.
          </Text>
        </Animated.View>
      )}

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

            {!isPremium && !showGetHelp && (
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

      {/* Crisis Resources Modal */}
      {crisisResponse && (
        <CrisisResourcesModal
          visible={showCrisisModal}
          resources={crisisResponse.resources}
          supportMessage={crisisResponse.supportMessage}
          onClose={handleCloseCrisisModal}
        />
      )}
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
  getHelpButton: {
    backgroundColor: '#2d5a3d',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  crisisBanner: {
    backgroundColor: '#2d5a3d',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  crisisBannerText: {
    color: '#a8e6a8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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

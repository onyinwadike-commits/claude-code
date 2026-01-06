import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import type { VoidType } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';
import {
  requestAudioPermissions,
  configureAudioSession,
} from '../services/audio';
import {
  anonymizeVoice,
  uploadAnonymizedAudio,
  deleteAnonymizedFile,
  type AnonymizationResult,
} from '../services/voiceAnonymizer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_RECORDING_DURATION = 60; // 60 seconds
const WAVEFORM_BARS = 40;

interface VoiceRecorderProps {
  voidType: VoidType;
  isPremium: boolean;
  onRecordingComplete?: (result: {
    success: boolean;
    audioId?: string;
    duration: number;
  }) => void;
  onCancel?: () => void;
}

type RecorderState = 'idle' | 'requesting' | 'ready' | 'recording' | 'processing' | 'uploading' | 'error';

/**
 * Animated waveform bar component
 */
function WaveformBar({
  index,
  isRecording,
  color,
  metering,
}: {
  index: number;
  isRecording: boolean;
  color: string;
  metering: number;
}) {
  const height = useSharedValue(10);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (isRecording) {
      // Animate based on metering + random variation for organic feel
      const baseHeight = 10 + metering * 50;
      const randomVariation = Math.random() * 20;
      const delay = index * 20;

      height.value = withDelay(
        delay,
        withSpring(baseHeight + randomVariation, {
          damping: 8,
          stiffness: 200,
        })
      );
      opacity.value = withTiming(0.6 + metering * 0.4, { duration: 100 });
    } else {
      height.value = withSpring(10, { damping: 15 });
      opacity.value = withTiming(0.3, { duration: 300 });
    }
  }, [isRecording, metering, index, height, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.waveformBar,
        animatedStyle,
        { backgroundColor: color },
      ]}
    />
  );
}

export function VoiceRecorder({
  voidType,
  isPremium,
  onRecordingComplete,
  onCancel,
}: VoiceRecorderProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];

  // State
  const [state, setState] = useState<RecorderState>('idle');
  const [duration, setDuration] = useState(0);
  const [metering, setMetering] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const meteringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const pulseScale = useSharedValue(1);
  const recordButtonScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const processingRotation = useSharedValue(0);

  // Check premium status
  useEffect(() => {
    if (!isPremium) {
      setState('error');
      setErrorMessage('Voice recording is a premium feature');
    }
  }, [isPremium]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }
    cancelAnimation(pulseScale);
    cancelAnimation(processingRotation);
  }, [pulseScale, processingRotation]);

  // Request permissions and prepare
  const prepareRecording = useCallback(async () => {
    setState('requesting');

    const hasPermission = await requestAudioPermissions();
    if (!hasPermission) {
      setState('error');
      setErrorMessage('Microphone permission denied');
      Alert.alert(
        'Permission Required',
        'Please enable microphone access in Settings to record voice confessions.',
        [{ text: 'OK' }]
      );
      return;
    }

    await configureAudioSession();
    setState('ready');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (state !== 'ready') return;

    try {
      setState('recording');
      setDuration(0);
      setMetering(0);

      // Start pulse animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );

      // Create recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          // Update metering from recording status
          if (status.isRecording && status.metering !== undefined) {
            // Normalize metering (typically -160 to 0 dB)
            const normalizedMetering = Math.max(0, (status.metering + 60) / 60);
            setMetering(normalizedMetering);
          }
        },
        100 // Update interval in ms
      );

      recordingRef.current = recording;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          progressWidth.value = withTiming(
            (newDuration / MAX_RECORDING_DURATION) * 100,
            { duration: 900 }
          );

          // Auto-stop at max duration
          if (newDuration >= MAX_RECORDING_DURATION) {
            stopRecording();
          }

          return newDuration;
        });
      }, 1000);

      console.log('[VoiceRecorder] Recording started');
    } catch (error) {
      console.error('[VoiceRecorder] Failed to start:', error);
      setState('error');
      setErrorMessage('Failed to start recording');
    }
  }, [state, pulseScale, progressWidth]);

  // Stop recording and process
  const stopRecording = useCallback(async () => {
    if (state !== 'recording' || !recordingRef.current) return;

    // Stop animations and timers
    cancelAnimation(pulseScale);
    pulseScale.value = withSpring(1);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState('processing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Start processing animation
    processingRotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );

    try {
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI');
      }

      console.log('[VoiceRecorder] Recording stopped:', uri);

      // Anonymize audio
      console.log('[VoiceRecorder] Anonymizing...');
      const anonymizationResult = await anonymizeVoice(uri);

      if (!anonymizationResult.success || !anonymizationResult.anonymizedUri) {
        throw new Error(anonymizationResult.error || 'Anonymization failed');
      }

      console.log('[VoiceRecorder] Anonymized:', anonymizationResult);

      // Upload anonymized audio
      setState('uploading');
      const uploadResult = await uploadAnonymizedAudio(
        anonymizationResult.anonymizedUri,
        voidType,
        {
          duration,
          anonymizationParams: anonymizationResult.params,
        }
      );

      cancelAnimation(processingRotation);

      if (uploadResult.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onRecordingComplete?.({
          success: true,
          audioId: uploadResult.audioId,
          duration,
        });
        setState('idle');
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error) {
      console.error('[VoiceRecorder] Processing failed:', error);
      cancelAnimation(processingRotation);
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Processing failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [state, duration, voidType, pulseScale, processingRotation, onRecordingComplete]);

  // Cancel recording
  const cancelRecording = useCallback(async () => {
    await cleanup();
    setState('idle');
    setDuration(0);
    setMetering(0);
    progressWidth.value = 0;
    onCancel?.();
  }, [cleanup, progressWidth, onCancel]);

  // Retry after error
  const retry = useCallback(() => {
    setErrorMessage(null);
    setState('idle');
    setDuration(0);
    progressWidth.value = 0;
  }, [progressWidth]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const processingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${processingRotation.value}deg` }],
  }));

  const buttonPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordButtonScale.value }],
  }));

  // Generate waveform bars
  const waveformBars = Array.from({ length: WAVEFORM_BARS }, (_, i) => (
    <WaveformBar
      key={i}
      index={i}
      isRecording={state === 'recording'}
      color={config.colors.primary}
      metering={metering}
    />
  ));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Voice Confession</Text>
        <Text style={styles.subtitle}>
          {state === 'idle' && 'Tap to start recording'}
          {state === 'requesting' && 'Requesting permission...'}
          {state === 'ready' && 'Ready to record'}
          {state === 'recording' && 'Recording...'}
          {state === 'processing' && 'Anonymizing voice...'}
          {state === 'uploading' && 'Uploading...'}
          {state === 'error' && 'Error'}
        </Text>
      </View>

      {/* Waveform visualization */}
      <View style={styles.waveformContainer}>
        {waveformBars}
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              progressStyle,
              { backgroundColor: config.colors.primary },
            ]}
          />
        </View>
        <View style={styles.durationRow}>
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          <Text style={styles.maxDurationText}>{formatDuration(MAX_RECORDING_DURATION)}</Text>
        </View>
      </View>

      {/* Error message */}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={retry} style={styles.retryButton}>
            <Text style={[styles.retryText, { color: config.colors.primary }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {/* Cancel button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={cancelRecording}
          disabled={state === 'processing' || state === 'uploading'}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        {/* Main record button */}
        <Animated.View style={buttonPressStyle}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              state === 'recording' && styles.recordButtonActive,
              { borderColor: config.colors.primary },
            ]}
            onPress={() => {
              if (state === 'idle') {
                prepareRecording();
              } else if (state === 'ready') {
                startRecording();
              } else if (state === 'recording') {
                stopRecording();
              }
            }}
            onPressIn={() => {
              recordButtonScale.value = withSpring(0.95);
            }}
            onPressOut={() => {
              recordButtonScale.value = withSpring(1);
            }}
            disabled={state === 'processing' || state === 'uploading' || state === 'error'}
          >
            {(state === 'processing' || state === 'uploading') ? (
              <Animated.View style={processingStyle}>
                <Text style={styles.processingIcon}>⟳</Text>
              </Animated.View>
            ) : state === 'recording' ? (
              <Animated.View style={pulseStyle}>
                <View
                  style={[
                    styles.recordingIndicator,
                    { backgroundColor: config.colors.primary },
                  ]}
                />
              </Animated.View>
            ) : (
              <View
                style={[
                  styles.recordIcon,
                  { backgroundColor: config.colors.primary },
                ]}
              />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Spacer for alignment */}
        <View style={styles.cancelButton} />
      </View>

      {/* Anonymization notice */}
      <View style={styles.noticeContainer}>
        <Text style={styles.noticeText}>
          🔒 Your voice will be anonymized with random pitch shift, time stretch, and noise injection before uploading.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.98)',
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b6b7a',
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    gap: 3,
    marginVertical: 40,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 10,
  },
  progressContainer: {
    paddingHorizontal: 20,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  durationText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  maxDurationText: {
    fontSize: 14,
    color: '#5a5a6a',
    fontVariant: ['tabular-nums'],
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    padding: 10,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cancelButton: {
    width: 80,
    padding: 10,
  },
  cancelText: {
    fontSize: 15,
    color: '#6b6b7a',
    textAlign: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: 'rgba(40, 40, 50, 0.9)',
  },
  recordIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  recordingIndicator: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  processingIcon: {
    fontSize: 32,
    color: '#ffffff',
  },
  noticeContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 12,
    color: '#5a5a6a',
    textAlign: 'center',
    lineHeight: 18,
  },
});

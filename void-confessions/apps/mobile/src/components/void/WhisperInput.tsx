import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Dimensions,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  FadeInUp,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { VoidType, ReleaseStyle } from '@void-confessions/core';
import {
  VOID_CONFIG,
  CONFESSION_MAX_LENGTH,
  validateConfessionContent,
  RELEASE_STYLE_CONFIG,
  VOID_TYPE_RELEASE_STYLES,
} from '@void-confessions/core';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WhisperInputProps {
  voidType: VoidType;
  onCompose: () => void;
  onQuickWhisper?: (content: string, releaseStyle: ReleaseStyle) => Promise<void>;
  isPremium?: boolean;
}

// Release style icons and labels
const RELEASE_STYLE_DATA: Record<ReleaseStyle, { icon: string; label: string }> = {
  default: { icon: '✨', label: 'Fade' },
  burn: { icon: '🔥', label: 'Burn' },
  shatter: { icon: '💥', label: 'Shatter' },
  scream: { icon: '🗣️', label: 'Scream' },
  dissolve: { icon: '💨', label: 'Dissolve' },
  storm: { icon: '⛈️', label: 'Storm' },
  drift: { icon: '🌊', label: 'Drift' },
};

interface FloatingTextProps {
  text: string;
  color: string;
  onComplete: () => void;
}

/**
 * Animated floating text that drifts upward and fades
 */
function FloatingText({ text, color, onComplete }: FloatingTextProps): React.JSX.Element {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Animate text floating up and fading
    translateY.value = withTiming(-200, { duration: 1500, easing: Easing.out(Easing.cubic) });
    scale.value = withSequence(
      withTiming(1.1, { duration: 200 }),
      withTiming(0.8, { duration: 1300 })
    );
    opacity.value = withDelay(
      500,
      withTiming(0, { duration: 1000 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.floatingTextContainer, animatedStyle]}>
      <Text style={[styles.floatingText, { color }]} numberOfLines={3}>
        {text.length > 100 ? text.slice(0, 100) + '...' : text}
      </Text>
    </Animated.View>
  );
}

interface ReleaseStylePickerProps {
  voidType: VoidType;
  selectedStyle: ReleaseStyle;
  onSelect: (style: ReleaseStyle) => void;
  onClose: () => void;
  visible: boolean;
}

/**
 * Modal picker for release styles
 */
function ReleaseStylePicker({
  voidType,
  selectedStyle,
  onSelect,
  onClose,
  visible,
}: ReleaseStylePickerProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];
  const availableStyles = VOID_TYPE_RELEASE_STYLES[voidType];

  const handleSelect = useCallback((style: ReleaseStyle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(style);
    onClose();
  }, [onSelect, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.duration(200)}
          style={styles.pickerContainer}
        >
          <BlurView intensity={80} tint="dark" style={styles.pickerBlur}>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Release Style</Text>
              <Text style={styles.pickerSubtitle}>
                Choose how your confession enters the void
              </Text>

              <View style={styles.stylesGrid}>
                {availableStyles.map((style) => {
                  const styleData = RELEASE_STYLE_DATA[style];
                  const isSelected = style === selectedStyle;

                  return (
                    <TouchableOpacity
                      key={style}
                      style={[
                        styles.styleOption,
                        isSelected && {
                          backgroundColor: config.colors.primary + '30',
                          borderColor: config.colors.primary,
                        },
                      ]}
                      onPress={() => handleSelect(style)}
                    >
                      <Text style={styles.styleIcon}>{styleData.icon}</Text>
                      <Text
                        style={[
                          styles.styleLabel,
                          isSelected && { color: config.colors.primary },
                        ]}
                      >
                        {styleData.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export function WhisperInput({
  voidType,
  onCompose,
  onQuickWhisper,
  isPremium = false,
}: WhisperInputProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];
  const inputRef = useRef<TextInput>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [releaseStyle, setReleaseStyle] = useState<ReleaseStyle>('default');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [floatingText, setFloatingText] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Animation values
  const expandProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const releaseButtonGlow = useSharedValue(0);
  const inputGlow = useSharedValue(0);

  // Keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleFocus = useCallback(() => {
    setIsExpanded(true);
    expandProgress.value = withSpring(1, { damping: 15 });
    inputGlow.value = withTiming(1, { duration: 300 });
  }, []);

  const handleBlur = useCallback(() => {
    if (!content.trim()) {
      setIsExpanded(false);
      expandProgress.value = withSpring(0, { damping: 15 });
    }
    inputGlow.value = withTiming(0, { duration: 300 });
  }, [content]);

  const handleRelease = useCallback(async () => {
    if (!content.trim() || isSending) return;

    const validation = validateConfessionContent(content);
    if (!validation.valid) {
      // Shake animation for invalid input
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Animate release button
    buttonScale.value = withSequence(
      withTiming(0.85, { duration: 100 }),
      withSpring(1.1, { damping: 8 }),
      withSpring(1, { damping: 12 })
    );

    // Glow effect on button
    releaseButtonGlow.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 500 })
    );

    // Show floating text animation
    setFloatingText(content);

    try {
      if (onQuickWhisper) {
        await onQuickWhisper(content, releaseStyle);
      }

      // Clear input after a short delay (let animation start)
      setTimeout(() => {
        setContent('');
        setIsExpanded(false);
        expandProgress.value = withSpring(0);
        Keyboard.dismiss();
      }, 300);
    } catch (error) {
      console.error('Failed to release confession:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFloatingText(null);
    } finally {
      setIsSending(false);
    }
  }, [content, isSending, onQuickWhisper, releaseStyle]);

  const handleComposePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    onCompose();
  }, [onCompose]);

  const handleStylePickerOpen = useCallback(() => {
    if (!isPremium) {
      // Show premium upsell hint
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowStylePicker(true);
  }, [isPremium]);

  const handleFloatingTextComplete = useCallback(() => {
    setFloatingText(null);
  }, []);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    const baseHeight = 70;
    const expandedHeight = 160;
    const height = baseHeight + expandProgress.value * (expandedHeight - baseHeight);
    return { height };
  });

  const inputContainerStyle = useAnimatedStyle(() => {
    const baseHeight = 48;
    const expandedHeight = 100;
    const height = baseHeight + expandProgress.value * (expandedHeight - baseHeight);
    return { height };
  });

  const inputGlowStyle = useAnimatedStyle(() => ({
    opacity: inputGlow.value * 0.3,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const buttonGlowStyle = useAnimatedStyle(() => ({
    opacity: releaseButtonGlow.value,
    transform: [{ scale: 1 + releaseButtonGlow.value * 0.3 }],
  }));

  const charCount = content.length;
  const charPercentage = charCount / CONFESSION_MAX_LENGTH;
  const isOverLimit = charCount > CONFESSION_MAX_LENGTH;
  const isNearLimit = charPercentage > 0.9;

  // Get current release style data
  const currentStyleData = RELEASE_STYLE_DATA[releaseStyle];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
      style={styles.keyboardAvoid}
    >
      <Animated.View
        entering={FadeInUp.delay(300).duration(400)}
        style={[styles.container, containerStyle]}
      >
        {/* Blur background */}
        <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
          <View style={styles.blurOverlay} />
        </BlurView>

        <View style={styles.content}>
          {/* Input row */}
          <View style={styles.inputRow}>
            {/* Input with glow effect */}
            <Animated.View style={[styles.inputWrapper, inputContainerStyle]}>
              {/* Glow layer */}
              <Animated.View
                style={[
                  styles.inputGlow,
                  inputGlowStyle,
                  { backgroundColor: config.colors.primary },
                ]}
              />

              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  { borderColor: config.colors.primary + '40' },
                  isExpanded && styles.inputExpanded,
                ]}
                placeholder={config.placeholder || 'Whisper to the void...'}
                placeholderTextColor="#5a5a6a"
                value={content}
                onChangeText={setContent}
                onFocus={handleFocus}
                onBlur={handleBlur}
                multiline
                maxLength={CONFESSION_MAX_LENGTH + 100} // Allow slight overflow for UX
                textAlignVertical="top"
                returnKeyType="default"
              />
            </Animated.View>

            {/* Action buttons */}
            <View style={styles.buttonsColumn}>
              {content.trim() ? (
                <Animated.View style={buttonStyle}>
                  {/* Glow layer for release button */}
                  <Animated.View
                    style={[
                      styles.releaseButtonGlow,
                      buttonGlowStyle,
                      { backgroundColor: config.colors.glow },
                    ]}
                  />

                  <TouchableOpacity
                    style={[
                      styles.releaseButton,
                      { backgroundColor: config.colors.primary },
                      (isSending || isOverLimit) && styles.buttonDisabled,
                    ]}
                    onPress={handleRelease}
                    disabled={isSending || isOverLimit}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.releaseButtonText}>
                      {isSending ? '...' : 'Release'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <TouchableOpacity
                  style={[styles.composeButton, { borderColor: config.colors.primary }]}
                  onPress={handleComposePress}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.composeButtonText, { color: config.colors.primary }]}>
                    +
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer row (expanded state) */}
          {isExpanded && (
            <Animated.View
              entering={FadeInUp.duration(200)}
              style={styles.footer}
            >
              {/* Release style picker (premium only) */}
              <TouchableOpacity
                style={[
                  styles.stylePickerButton,
                  { borderColor: config.colors.primary + '40' },
                  !isPremium && styles.stylePickerLocked,
                ]}
                onPress={handleStylePickerOpen}
              >
                <Text style={styles.stylePickerIcon}>{currentStyleData.icon}</Text>
                <Text style={styles.stylePickerLabel}>
                  {isPremium ? currentStyleData.label : '🔒'}
                </Text>
              </TouchableOpacity>

              {/* Character counter */}
              <View style={styles.charCountContainer}>
                <Text
                  style={[
                    styles.charCount,
                    isNearLimit && styles.charCountWarning,
                    isOverLimit && styles.charCountOver,
                  ]}
                >
                  {charCount.toLocaleString()}/{CONFESSION_MAX_LENGTH.toLocaleString()}
                </Text>

                {/* Progress bar */}
                <View style={styles.charProgressBar}>
                  <View
                    style={[
                      styles.charProgressFill,
                      {
                        width: `${Math.min(charPercentage * 100, 100)}%`,
                        backgroundColor: isOverLimit
                          ? '#ef4444'
                          : isNearLimit
                          ? '#f59e0b'
                          : config.colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            </Animated.View>
          )}
        </View>

        {/* Floating text animation */}
        {floatingText && (
          <FloatingText
            text={floatingText}
            color={config.colors.primary}
            onComplete={handleFloatingTextComplete}
          />
        )}
      </Animated.View>

      {/* Release style picker modal */}
      <ReleaseStylePicker
        voidType={voidType}
        selectedStyle={releaseStyle}
        onSelect={setReleaseStyle}
        onClose={() => setShowStylePicker(false)}
        visible={showStylePicker}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 5, 8, 0.7)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  inputGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 26,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 20,
  },
  inputExpanded: {
    textAlignVertical: 'top',
  },
  buttonsColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  releaseButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  releaseButtonGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 30,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  releaseButtonText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  composeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 30, 0.5)',
  },
  composeButtonText: {
    fontSize: 28,
    fontWeight: '300',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  stylePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(20, 20, 30, 0.5)',
    gap: 6,
  },
  stylePickerLocked: {
    opacity: 0.6,
  },
  stylePickerIcon: {
    fontSize: 14,
  },
  stylePickerLabel: {
    fontSize: 12,
    color: '#8b8b9a',
    fontWeight: '500',
  },
  charCountContainer: {
    alignItems: 'flex-end',
  },
  charCount: {
    fontSize: 12,
    color: '#5a5a6a',
    marginBottom: 4,
  },
  charCountWarning: {
    color: '#f59e0b',
  },
  charCountOver: {
    color: '#ef4444',
  },
  charProgressBar: {
    width: 80,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  charProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Floating text animation
  floatingTextContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  floatingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  pickerBlur: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  pickerContent: {
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  pickerSubtitle: {
    fontSize: 14,
    color: '#6b6b7a',
    marginBottom: 24,
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  styleOption: {
    width: 90,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(20, 20, 30, 0.5)',
    alignItems: 'center',
  },
  styleIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  styleLabel: {
    fontSize: 13,
    color: '#8b8b9a',
    fontWeight: '500',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b6b7a',
  },
});

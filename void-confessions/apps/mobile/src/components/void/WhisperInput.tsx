import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInUp,
} from 'react-native-reanimated';
import type { VoidType } from '@void-confessions/core';
import { VOID_CONFIG, CONFESSION_MAX_LENGTH, validateConfessionContent } from '@void-confessions/core';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WhisperInputProps {
  voidType: VoidType;
  onCompose: () => void;
  onQuickWhisper?: (content: string) => Promise<void>;
  isPremium?: boolean;
}

export function WhisperInput({
  voidType,
  onCompose,
  onQuickWhisper,
  isPremium = false,
}: WhisperInputProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];

  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Animation values
  const expandProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const handleFocus = useCallback(() => {
    setIsExpanded(true);
    expandProgress.value = withSpring(1, { damping: 15 });
  }, []);

  const handleBlur = useCallback(() => {
    if (!content.trim()) {
      setIsExpanded(false);
      expandProgress.value = withSpring(0, { damping: 15 });
    }
  }, [content]);

  const handleSend = useCallback(async () => {
    if (!content.trim() || isSending) return;

    const validation = validateConfessionContent(content);
    if (!validation.valid) {
      return;
    }

    setIsSending(true);
    buttonScale.value = withSpring(0.9);

    try {
      if (onQuickWhisper) {
        await onQuickWhisper(content);
      }
      setContent('');
      setIsExpanded(false);
      expandProgress.value = withSpring(0);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Failed to send whisper:', error);
    } finally {
      setIsSending(false);
      buttonScale.value = withSpring(1);
    }
  }, [content, isSending, onQuickWhisper]);

  const handleComposePress = useCallback(() => {
    Keyboard.dismiss();
    onCompose();
  }, [onCompose]);

  const containerStyle = useAnimatedStyle(() => {
    const height = 60 + expandProgress.value * 60;
    return {
      height,
    };
  });

  const inputStyle = useAnimatedStyle(() => {
    const height = 44 + expandProgress.value * 50;
    return {
      height,
    };
  });

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const charCount = content.length;
  const isOverLimit = charCount > CONFESSION_MAX_LENGTH;

  return (
    <Animated.View
      entering={FadeInUp.delay(300).duration(400)}
      style={[styles.container, containerStyle]}
    >
      <View style={styles.backdrop} />

      <View style={styles.content}>
        {/* Input row */}
        <View style={styles.inputRow}>
          <Animated.View style={[styles.inputContainer, inputStyle]}>
            <TextInput
              style={[
                styles.input,
                { borderColor: config.colors.primary + '40' },
              ]}
              placeholder="Whisper to the void..."
              placeholderTextColor="#5a5a6a"
              value={content}
              onChangeText={setContent}
              onFocus={handleFocus}
              onBlur={handleBlur}
              multiline={isExpanded}
              maxLength={CONFESSION_MAX_LENGTH + 50} // Allow some overflow for UX
              returnKeyType="send"
              blurOnSubmit={false}
            />
          </Animated.View>

          {/* Send or Compose button */}
          {content.trim() ? (
            <Animated.View style={buttonStyle}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: config.colors.primary },
                  (isSending || isOverLimit) && styles.buttonDisabled,
                ]}
                onPress={handleSend}
                disabled={isSending || isOverLimit}
              >
                <Text style={styles.sendButtonText}>
                  {isSending ? '...' : '↑'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity
              style={[styles.composeButton, { borderColor: config.colors.primary }]}
              onPress={handleComposePress}
            >
              <Text style={[styles.composeButtonText, { color: config.colors.primary }]}>
                +
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Character count (when expanded) */}
        {isExpanded && (
          <View style={styles.footer}>
            <Text style={[styles.charCount, isOverLimit && styles.charCountOver]}>
              {charCount}/{CONFESSION_MAX_LENGTH}
            </Text>

            {!isPremium && (
              <Text style={styles.premiumHint}>
                Hold for voice 🎙
              </Text>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 5, 8, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#ffffff',
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
  },
  composeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  composeButtonText: {
    fontSize: 24,
    fontWeight: '300',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#5a5a6a',
  },
  charCountOver: {
    color: '#ef4444',
  },
  premiumHint: {
    fontSize: 12,
    color: '#5a5a6a',
  },
});

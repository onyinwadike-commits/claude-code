import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { Confession, VoidType, EchoWord } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ConfessionBubbleProps {
  confession: Confession;
  voidType: VoidType;
  index: number;
  onResonate: (id: string) => void;
  onEcho: (id: string, word: EchoWord) => void;
  isGlowing?: boolean;
  echoWord?: EchoWord | null;
}

const ECHO_WORDS: EchoWord[] = ['same', 'felt', 'brave', 'heard', 'seen', 'lighter', 'strength'];

export function ConfessionBubble({
  confession,
  voidType,
  index,
  onResonate,
  onEcho,
  isGlowing = false,
  echoWord = null,
}: ConfessionBubbleProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];

  // Animation values
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const glowIntensity = useSharedValue(0);
  const echoOpacity = useSharedValue(0);
  const echoScale = useSharedValue(0.5);

  // Entrance animation
  useEffect(() => {
    translateY.value = withDelay(
      index * 100,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
    opacity.value = withDelay(
      index * 100,
      withTiming(1, { duration: 500 })
    );
    scale.value = withDelay(
      index * 100,
      withSpring(1, { damping: 12, stiffness: 120 })
    );
  }, []);

  // Glow effect when resonance received
  useEffect(() => {
    if (isGlowing) {
      glowIntensity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.3, { duration: 300 }),
        withTiming(0, { duration: 500 })
      );
    }
  }, [isGlowing]);

  // Echo word animation
  useEffect(() => {
    if (echoWord) {
      echoOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1500, withTiming(0, { duration: 500 }))
      );
      echoScale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withTiming(1, { duration: 200 }),
        withDelay(1300, withTiming(0.8, { duration: 300 }))
      );
    }
  }, [echoWord]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
    transform: [{ scale: 1 + glowIntensity.value * 0.1 }],
  }));

  const echoStyle = useAnimatedStyle(() => ({
    opacity: echoOpacity.value,
    transform: [{ scale: echoScale.value }],
  }));

  const handlePress = useCallback(() => {
    // Trigger resonance animation
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );
    onResonate(confession.id);
  }, [confession.id, onResonate]);

  const handleLongPress = useCallback(() => {
    // Show echo options (simplified - just pick random for demo)
    const randomWord = ECHO_WORDS[Math.floor(Math.random() * ECHO_WORDS.length)];
    onEcho(confession.id, randomWord);
  }, [confession.id, onEcho]);

  // Calculate time remaining
  const timeRemaining = Math.max(
    0,
    Math.floor((new Date(confession.expiresAt).getTime() - Date.now()) / 1000 / 60)
  );

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glowOverlay,
          glowStyle,
          { backgroundColor: config.colors.primary },
        ]}
      />

      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.bubble,
          { borderColor: config.colors.primary + '30' },
          pressed && styles.bubblePressed,
        ]}
      >
        {/* Content */}
        <Text style={styles.content} numberOfLines={4}>
          {confession.content}
        </Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {/* Resonance count */}
          <View style={styles.resonanceContainer}>
            <Text style={[styles.resonanceIcon, { color: config.colors.primary }]}>
              ◉
            </Text>
            <Text style={styles.resonanceCount}>
              {confession.resonanceCount}
            </Text>
          </View>

          {/* Echoes */}
          {confession.echoes.length > 0 && (
            <View style={styles.echoesContainer}>
              {confession.echoes.slice(0, 3).map((echo) => (
                <View
                  key={echo.word}
                  style={[styles.echoBadge, { backgroundColor: config.colors.primary + '20' }]}
                >
                  <Text style={[styles.echoText, { color: config.colors.primary }]}>
                    {echo.word}
                  </Text>
                  <Text style={styles.echoCount}>{echo.count}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Time remaining */}
          <Text style={styles.timeText}>
            {timeRemaining > 0 ? `${timeRemaining}m` : '<1m'}
          </Text>
        </View>
      </Pressable>

      {/* Echo word popup */}
      {echoWord && (
        <Animated.View style={[styles.echoPopup, echoStyle]}>
          <Text style={[styles.echoPopupText, { color: config.colors.primary }]}>
            {echoWord}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  glowOverlay: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 26,
  },
  bubble: {
    backgroundColor: 'rgba(20, 20, 35, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  bubblePressed: {
    opacity: 0.9,
  },
  content: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resonanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resonanceIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  resonanceCount: {
    fontSize: 13,
    color: '#8b8b9a',
    fontWeight: '500',
  },
  echoesContainer: {
    flexDirection: 'row',
    flex: 1,
    marginHorizontal: 12,
    flexWrap: 'wrap',
    gap: 6,
  },
  echoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  echoText: {
    fontSize: 11,
    fontWeight: '500',
    marginRight: 4,
  },
  echoCount: {
    fontSize: 10,
    color: '#6b6b7a',
  },
  timeText: {
    fontSize: 11,
    color: '#5a5a6a',
  },
  echoPopup: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -20,
    width: 80,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
  },
  echoPopupText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

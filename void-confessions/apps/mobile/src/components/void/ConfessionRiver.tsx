import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions, FlatList, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import type { Confession, VoidType, EchoWord } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';
import { ConfessionBubble } from './ConfessionBubble';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfessionRiverProps {
  confessions: Confession[];
  voidType: VoidType;
  onResonate: (id: string) => void;
  onEcho: (id: string, word: EchoWord) => void;
  glowingConfessionId?: string | null;
  echoEvent?: { confessionId: string; word: EchoWord } | null;
}

export function ConfessionRiver({
  confessions,
  voidType,
  onResonate,
  onEcho,
  glowingConfessionId,
  echoEvent,
}: ConfessionRiverProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];
  const flatListRef = useRef<FlatList>(null);

  // Ambient drift animation
  const driftY = useSharedValue(0);

  useEffect(() => {
    // Subtle continuous drift
    driftY.value = withRepeat(
      withTiming(10, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const driftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: driftY.value }],
  }));

  // Auto-scroll to top when new confession arrives
  useEffect(() => {
    if (confessions.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [confessions.length]);

  const renderConfession = useCallback(
    ({ item, index }: { item: Confession; index: number }) => (
      <ConfessionBubble
        confession={item}
        voidType={voidType}
        index={index}
        onResonate={onResonate}
        onEcho={onEcho}
        isGlowing={glowingConfessionId === item.id}
        echoWord={echoEvent?.confessionId === item.id ? echoEvent.word : null}
      />
    ),
    [voidType, onResonate, onEcho, glowingConfessionId, echoEvent]
  );

  const keyExtractor = useCallback((item: Confession) => item.id, []);

  if (confessions.length === 0) {
    return (
      <Animated.View entering={FadeIn.duration(500)} style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyEmoji}>🌌</Text>
          <Text style={styles.emptyTitle}>The void is listening...</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to release your confession
          </Text>

          {/* Floating particles hint */}
          <View style={styles.hintContainer}>
            <View style={[styles.hintDot, { backgroundColor: config.colors.primary }]} />
            <View
              style={[
                styles.hintDot,
                { backgroundColor: config.colors.primary, opacity: 0.6 },
              ]}
            />
            <View
              style={[
                styles.hintDot,
                { backgroundColor: config.colors.primary, opacity: 0.3 },
              ]}
            />
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, driftStyle]}>
      <FlatList
        ref={flatListRef}
        data={confessions}
        renderItem={renderConfession}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        inverted={false}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={7}
        initialNumToRender={5}
        // Pull to refresh placeholder
        onRefresh={() => {}}
        refreshing={false}
      />

      {/* Fade gradient at bottom */}
      <View style={styles.bottomFade} pointerEvents="none" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 120, // Space for WhisperInput
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6b6b7a',
    textAlign: 'center',
    lineHeight: 22,
  },
  hintContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 8,
  },
  hintDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'transparent',
    // Simulated gradient
    borderTopWidth: 60,
    borderTopColor: 'rgba(5, 5, 8, 0.8)',
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import type { VoidType } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';

interface CollectiveCounterProps {
  voidType: VoidType;
  totalResonances: number;
  totalEchoes: number;
  activeViewers: number;
}

export function CollectiveCounter({
  voidType,
  totalResonances,
  totalEchoes,
  activeViewers,
}: CollectiveCounterProps): React.JSX.Element {
  const config = VOID_CONFIG[voidType];

  // Track previous values for animation
  const [prevResonances, setPrevResonances] = useState(totalResonances);
  const [prevEchoes, setPrevEchoes] = useState(totalEchoes);

  // Animation values
  const resonanceScale = useSharedValue(1);
  const echoScale = useSharedValue(1);
  const opacity = useSharedValue(0);

  // Initial fade in
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  // Animate on resonance change
  useEffect(() => {
    if (totalResonances > prevResonances) {
      resonanceScale.value = withSequence(
        withSpring(1.3, { damping: 6 }),
        withSpring(1, { damping: 10 })
      );
    }
    setPrevResonances(totalResonances);
  }, [totalResonances]);

  // Animate on echo change
  useEffect(() => {
    if (totalEchoes > prevEchoes) {
      echoScale.value = withSequence(
        withSpring(1.3, { damping: 6 }),
        withSpring(1, { damping: 10 })
      );
    }
    setPrevEchoes(totalEchoes);
  }, [totalEchoes]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const resonanceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resonanceScale.value }],
  }));

  const echoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: echoScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={[styles.content, { borderColor: config.colors.primary + '40' }]}>
        {/* Resonances */}
        <Animated.View style={[styles.stat, resonanceStyle]}>
          <Text style={[styles.statIcon, { color: config.colors.primary }]}>◉</Text>
          <Text style={styles.statValue}>{formatNumber(totalResonances)}</Text>
        </Animated.View>

        <View style={styles.divider} />

        {/* Echoes */}
        <Animated.View style={[styles.stat, echoStyle]}>
          <Text style={[styles.statIcon, { color: config.colors.primary }]}>◌</Text>
          <Text style={styles.statValue}>{formatNumber(totalEchoes)}</Text>
        </Animated.View>

        <View style={styles.divider} />

        {/* Active viewers */}
        <View style={styles.stat}>
          <Text style={styles.viewerDot}>●</Text>
          <Text style={styles.viewerCount}>{activeViewers}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

const styles = StyleSheet.create({
  container: {},
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 15, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 10,
  },
  viewerDot: {
    fontSize: 8,
    color: '#4ade80',
    marginRight: 4,
  },
  viewerCount: {
    fontSize: 12,
    color: '#8b8b9a',
  },
});

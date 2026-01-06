import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { VOID_CONFIG } from '@void-confessions/core';
import { useVoidStore } from '../store';
import { joinVoid, leaveVoid, connectSocket } from '../services';
import type { VoidScreenProps } from '../navigation';

const { width } = Dimensions.get('window');

export function VoidScreen(): React.JSX.Element {
  const navigation = useNavigation<VoidScreenProps['navigation']>();
  const route = useRoute<VoidScreenProps['route']>();
  const { voidType } = route.params;

  const config = VOID_CONFIG[voidType];
  const confessions = useVoidStore((state) => state.confessions);
  const weather = useVoidStore((state) => state.weather[voidType]);

  // Ambient animation
  const ambientOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Connect and join void
    connectSocket();
    joinVoid(voidType);

    ambientOpacity.value = withRepeat(
      withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    return () => {
      leaveVoid(voidType);
    };
  }, [voidType]);

  const ambientStyle = useAnimatedStyle(() => ({
    opacity: ambientOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Ambient background */}
      <Animated.View
        style={[
          styles.ambientGlow,
          ambientStyle,
          { backgroundColor: config.colors.primary },
        ]}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.voidTitle}>
            {voidType.charAt(0).toUpperCase() + voidType.slice(1)} Void
          </Text>
          {weather && (
            <Text style={styles.weatherText}>
              Weather: {weather.state}
            </Text>
          )}
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Confessions area (placeholder - implement with FlatList/ScrollView) */}
      <View style={styles.confessionsArea}>
        {confessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              The void is quiet...{'\n'}
              Be the first to confess
            </Text>
          </View>
        ) : (
          <View style={styles.confessionsList}>
            {confessions.slice(0, 5).map((confession) => (
              <View key={confession.id} style={styles.confessionBubble}>
                <Text style={styles.confessionText} numberOfLines={3}>
                  {confession.content}
                </Text>
                <View style={styles.confessionMeta}>
                  <Text style={styles.resonanceCount}>
                    {confession.resonanceCount} resonances
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Compose button */}
      <TouchableOpacity
        style={[styles.composeButton, { backgroundColor: config.colors.primary }]}
        onPress={() => navigation.navigate('Compose', { voidType })}
      >
        <Text style={styles.composeButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    height: 400,
    borderRadius: 200,
    filter: 'blur(100px)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 28,
    color: '#ffffff',
  },
  headerInfo: {
    alignItems: 'center',
  },
  voidTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  weatherText: {
    fontSize: 12,
    color: '#8b8b9a',
    marginTop: 4,
  },
  headerSpacer: {
    width: 48,
  },
  confessionsArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b6b7a',
    textAlign: 'center',
    lineHeight: 24,
  },
  confessionsList: {
    paddingTop: 20,
  },
  confessionBubble: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  confessionText: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 22,
  },
  confessionMeta: {
    flexDirection: 'row',
    marginTop: 12,
  },
  resonanceCount: {
    fontSize: 12,
    color: '#8b8b9a',
  },
  composeButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  composeButtonText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '300',
  },
});

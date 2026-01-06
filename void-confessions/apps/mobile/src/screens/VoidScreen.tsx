import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import type { VoidType, EchoWord, VoidWeatherState } from '@void-confessions/core';
import { VOID_CONFIG } from '@void-confessions/core';
import { useVoidStore } from '../store';
import {
  connectSocket,
  joinVoid,
  leaveVoid,
  resonateConfession,
  echoConfession,
  getSocket,
} from '../services';
import {
  VoidBackground,
  VoidParticleSystem,
  ConfessionRiver,
  WeatherIndicator,
  CollectiveCounter,
  WhisperInput,
} from '../components/void';
import type { VoidScreenProps } from '../navigation';

export function VoidScreen(): React.JSX.Element {
  const navigation = useNavigation<VoidScreenProps['navigation']>();
  const route = useRoute<VoidScreenProps['route']>();
  const { voidType } = route.params;

  const config = VOID_CONFIG[voidType];

  // Store state
  const confessions = useVoidStore((state) => state.confessions);
  const weather = useVoidStore((state) => state.weather[voidType]);
  const connectionStatus = useVoidStore((state) => state.connectionStatus);
  const setWeather = useVoidStore((state) => state.setWeather);
  const addConfession = useVoidStore((state) => state.addConfession);
  const updateConfession = useVoidStore((state) => state.updateConfession);
  const removeConfession = useVoidStore((state) => state.removeConfession);
  const isPremium = useVoidStore((state) => state.isPremium);

  // Local state for UI effects
  const [glowingConfessionId, setGlowingConfessionId] = useState<string | null>(null);
  const [echoEvent, setEchoEvent] = useState<{ confessionId: string; word: EchoWord } | null>(null);
  const [totalResonances, setTotalResonances] = useState(0);
  const [totalEchoes, setTotalEchoes] = useState(0);
  const [activeViewers, setActiveViewers] = useState(1);

  // Refs for tracking
  const weatherTransitionRef = useRef<VoidWeatherState | null>(null);
  const confessionsRef = useRef(confessions);
  confessionsRef.current = confessions;

  // Animation values
  const headerOpacity = useSharedValue(0);

  // Connect to WebSocket and subscribe to void channel
  useEffect(() => {
    // Fade in header
    headerOpacity.value = withTiming(1, { duration: 500 });

    // Connect socket
    const socket = connectSocket();

    // Join void channel
    joinVoid(voidType);

    // Socket event handlers
    const handleConfessionNew = (data: { confession: any }) => {
      addConfession(data.confession);
    };

    const handleConfessionResonance = (data: { confessionId: string; newCount: number }) => {
      // Update confession using ref to get latest state
      const confession = confessionsRef.current.find((c) => c.id === data.confessionId);
      if (confession) {
        updateConfession({ ...confession, resonanceCount: data.newCount });
      }

      // Trigger glow effect
      setGlowingConfessionId(data.confessionId);
      setTimeout(() => setGlowingConfessionId(null), 1000);

      // Update total
      setTotalResonances((prev) => prev + 1);
    };

    const handleConfessionEcho = (data: { confessionId: string; word: EchoWord; newCount: number }) => {
      // Update confession using ref
      const confession = confessionsRef.current.find((c) => c.id === data.confessionId);
      if (confession) {
        const echoes = [...confession.echoes];
        const echoIndex = echoes.findIndex((e) => e.word === data.word);
        if (echoIndex >= 0) {
          echoes[echoIndex] = { word: data.word, count: data.newCount };
        } else {
          echoes.push({ word: data.word, count: data.newCount });
        }
        updateConfession({ ...confession, echoes });
      }

      // Show echo word animation
      setEchoEvent({ confessionId: data.confessionId, word: data.word });
      setTimeout(() => setEchoEvent(null), 2000);

      // Update total
      setTotalEchoes((prev) => prev + 1);
    };

    const handleConfessionExpired = (data: { confessionId: string }) => {
      removeConfession(data.confessionId);
    };

    const handleWeatherUpdate = (data: { voidType: VoidType; weather: VoidWeatherState }) => {
      if (data.voidType === voidType) {
        weatherTransitionRef.current = data.weather;
        setWeather(voidType, data.weather);
      }
    };

    const handleViewerCount = (data: { count: number }) => {
      setActiveViewers(data.count);
    };

    // Register event listeners
    socket.on('confession:new', handleConfessionNew);
    socket.on('confession:resonance', handleConfessionResonance);
    socket.on('confession:echo', handleConfessionEcho);
    socket.on('confession:expired', handleConfessionExpired);
    socket.on('weather:update', handleWeatherUpdate);
    socket.on('viewers:count', handleViewerCount);

    // Cleanup
    return () => {
      socket.off('confession:new', handleConfessionNew);
      socket.off('confession:resonance', handleConfessionResonance);
      socket.off('confession:echo', handleConfessionEcho);
      socket.off('confession:expired', handleConfessionExpired);
      socket.off('weather:update', handleWeatherUpdate);
      socket.off('viewers:count', handleViewerCount);

      leaveVoid(voidType);
    };
  }, [voidType]);

  // Calculate totals from confessions
  useEffect(() => {
    const resonances = confessions.reduce((sum, c) => sum + c.resonanceCount, 0);
    const echoes = confessions.reduce(
      (sum, c) => sum + c.echoes.reduce((eSum, e) => eSum + e.count, 0),
      0
    );
    setTotalResonances(resonances);
    setTotalEchoes(echoes);
  }, [confessions]);

  // Handlers
  const handleResonate = useCallback((confessionId: string) => {
    resonateConfession(confessionId);
  }, []);

  const handleEcho = useCallback((confessionId: string, word: EchoWord) => {
    echoConfession(confessionId, word);
  }, []);

  const handleCompose = useCallback(() => {
    navigation.navigate('Compose', { voidType });
  }, [navigation, voidType]);

  const handleQuickWhisper = useCallback(async (content: string) => {
    // Create confession via API
    try {
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
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create confession');
      }
    } catch (error) {
      console.error('Quick whisper failed:', error);
      throw error;
    }
  }, [voidType]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Layer 1: Animated background */}
      <VoidBackground voidType={voidType} weather={weather} />

      {/* Layer 2: Particle system */}
      <VoidParticleSystem
        voidType={voidType}
        weather={weather}
        intensity={weather?.intensity || 0.5}
      />

      {/* Layer 3: Confession river */}
      <View style={styles.riverContainer}>
        <ConfessionRiver
          confessions={confessions}
          voidType={voidType}
          onResonate={handleResonate}
          onEcho={handleEcho}
          glowingConfessionId={glowingConfessionId}
          echoEvent={echoEvent}
        />
      </View>

      {/* Layer 4: Top overlay */}
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <Animated.View style={[styles.header, headerStyle]}>
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          {/* Center: Void title */}
          <View style={styles.titleContainer}>
            <Text style={styles.voidTitle}>
              {voidType.charAt(0).toUpperCase() + voidType.slice(1)}
            </Text>
            {connectionStatus !== 'connected' && (
              <Text style={styles.connectionStatus}>
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </Text>
            )}
          </View>

          {/* Right spacer for alignment */}
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Weather and Counter row */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.statsRow}
        >
          <WeatherIndicator voidType={voidType} weather={weather} />
          <CollectiveCounter
            voidType={voidType}
            totalResonances={totalResonances}
            totalEchoes={totalEchoes}
            activeViewers={activeViewers}
          />
        </Animated.View>
      </SafeAreaView>

      {/* Layer 5: Bottom overlay - WhisperInput */}
      <WhisperInput
        voidType={voidType}
        onCompose={handleCompose}
        onQuickWhisper={handleQuickWhisper}
        isPremium={isPremium}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
  },
  riverContainer: {
    flex: 1,
    paddingTop: 140, // Space for header and stats
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#ffffff',
  },
  titleContainer: {
    alignItems: 'center',
  },
  voidTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  connectionStatus: {
    fontSize: 11,
    color: '#f59e0b',
    marginTop: 2,
  },
  headerSpacer: {
    width: 44,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});

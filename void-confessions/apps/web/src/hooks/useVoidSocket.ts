'use client';

import { useEffect, useCallback } from 'react';
import { socketService } from '@/services/socket';
import { useVoidStore } from '@/store/voidStore';
import { useAudioStore } from '@/store/audioStore';
import type { VoidType, Confession, WeatherState } from '@void-confessions/core';

export function useVoidSocket(voidType: VoidType | null) {
  const {
    setConnected,
    addConfession,
    updateConfessionResonance,
    setWeather,
    setCollectiveCount,
    setError,
  } = useVoidStore();

  const {
    crossfadeToVoid,
    stopAmbient,
    updateWeather,
    playConfessionRelease,
    playResonance,
    playEcho,
    playSfx,
  } = useAudioStore();

  // Connect to socket on mount
  useEffect(() => {
    const socket = socketService.connect();

    const unsubConnect = socketService.on('connected', () => {
      setConnected(true);
    });

    const unsubDisconnect = socketService.on('disconnected', () => {
      setConnected(false);
    });

    const unsubError = socketService.on('error', (error: { message: string }) => {
      setError(error.message);
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubError();
    };
  }, [setConnected, setError]);

  // Join/leave void when voidType changes
  useEffect(() => {
    if (!voidType) return;

    // Join the void and start ambient audio
    socketService.joinVoid(voidType);
    crossfadeToVoid(voidType);

    // Set up void-specific listeners
    const unsubConfession = socketService.on('confession:new', (confession: Confession) => {
      addConfession(confession);
      // Play subtle sound for new confession
      playSfx('hover', { volume: 0.3 });
    });

    const unsubResonance = socketService.on(
      'confession:resonance',
      (data: { confessionId: string; count: number }) => {
        updateConfessionResonance(data.confessionId, 1);
        playResonance();
      }
    );

    const unsubEcho = socketService.on(
      'confession:echo',
      (data: { confessionId: string; echoCount: number }) => {
        playEcho();
      }
    );

    const unsubWeather = socketService.on('weather:update', (weather: WeatherState) => {
      setWeather(weather);
      updateWeather(weather);
    });

    const unsubCollective = socketService.on('collective:update', (count: number) => {
      setCollectiveCount(count);
    });

    return () => {
      socketService.leaveVoid(voidType);
      stopAmbient();
      unsubConfession();
      unsubResonance();
      unsubEcho();
      unsubWeather();
      unsubCollective();
    };
  }, [
    voidType,
    addConfession,
    updateConfessionResonance,
    setWeather,
    setCollectiveCount,
    crossfadeToVoid,
    stopAmbient,
    updateWeather,
    playResonance,
    playEcho,
    playSfx,
  ]);

  // Actions
  const submitConfession = useCallback(
    (content: string, releaseStyle?: string) => {
      if (!voidType) return;
      socketService.submitConfession(content, voidType, releaseStyle);
      playConfessionRelease();
    },
    [voidType, playConfessionRelease]
  );

  const resonateConfession = useCallback(
    (confessionId: string) => {
      socketService.resonateConfession(confessionId);
      // Sound is played when server broadcasts the resonance
    },
    []
  );

  const echoConfession = useCallback(
    (confessionId: string) => {
      socketService.echoConfession(confessionId);
      // Sound is played when server broadcasts the echo
    },
    []
  );

  return {
    isConnected: socketService.isConnected(),
    submitConfession,
    resonateConfession,
    echoConfession,
  };
}

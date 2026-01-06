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

  const { playSfx, crossfadeAmbient, playWeatherSound } = useAudioStore();

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

    // Join the void
    socketService.joinVoid(voidType);
    crossfadeAmbient(voidType);
    playSfx('enter');

    // Set up void-specific listeners
    const unsubConfession = socketService.on('confession:new', (confession: Confession) => {
      addConfession(confession);
      playSfx('whisper');
    });

    const unsubResonance = socketService.on(
      'confession:resonance',
      (data: { confessionId: string; count: number }) => {
        updateConfessionResonance(data.confessionId, 1);
        playSfx('resonate');
      }
    );

    const unsubWeather = socketService.on('weather:update', (weather: WeatherState) => {
      setWeather(weather);
      if (weather.state === 'storm') {
        playWeatherSound('storm');
      } else if (weather.state === 'rain') {
        playWeatherSound('rain');
      }
    });

    const unsubCollective = socketService.on('collective:update', (count: number) => {
      setCollectiveCount(count);
    });

    return () => {
      socketService.leaveVoid(voidType);
      playSfx('exit');
      unsubConfession();
      unsubResonance();
      unsubWeather();
      unsubCollective();
    };
  }, [
    voidType,
    addConfession,
    updateConfessionResonance,
    setWeather,
    setCollectiveCount,
    crossfadeAmbient,
    playSfx,
    playWeatherSound,
  ]);

  // Actions
  const submitConfession = useCallback(
    (content: string, releaseStyle?: string) => {
      if (!voidType) return;
      socketService.submitConfession(content, voidType, releaseStyle);
      playSfx('release');
    },
    [voidType, playSfx]
  );

  const resonateConfession = useCallback(
    (confessionId: string) => {
      socketService.resonateConfession(confessionId);
    },
    []
  );

  const echoConfession = useCallback(
    (confessionId: string) => {
      socketService.echoConfession(confessionId);
      playSfx('echo');
    },
    [playSfx]
  );

  return {
    isConnected: socketService.isConnected(),
    submitConfession,
    resonateConfession,
    echoConfession,
  };
}

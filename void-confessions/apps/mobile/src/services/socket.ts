import { io, Socket } from 'socket.io-client';
import type { VoidType, Confession, VoidWeatherState, EchoWord } from '@void-confessions/core';
import { useVoidStore } from '../store';

const API_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://api.voidconfessions.app';

/**
 * WebSocket message types
 */
interface ServerToClientEvents {
  'confession:new': (data: { confession: Confession }) => void;
  'confession:resonance': (data: { confessionId: string; newCount: number }) => void;
  'confession:echo': (data: { confessionId: string; word: EchoWord; newCount: number }) => void;
  'confession:expired': (data: { confessionId: string }) => void;
  'weather:update': (data: { voidType: VoidType; weather: VoidWeatherState }) => void;
  'error': (data: { code: string; message: string }) => void;
  'joined': (data: { voidType: VoidType; weather: VoidWeatherState }) => void;
}

interface ClientToServerEvents {
  'join:void': (data: { voidType: VoidType; sessionHash?: string }) => void;
  'leave:void': (data: { voidType: VoidType }) => void;
  'confession:resonate': (data: { confessionId: string }) => void;
  'confession:echo': (data: { confessionId: string; word: EchoWord }) => void;
}

type VoidSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: VoidSocket | null = null;

/**
 * Initialize and connect to the WebSocket server
 */
export function connectSocket(): VoidSocket {
  if (socket?.connected) {
    return socket;
  }

  const store = useVoidStore.getState();
  store.setConnectionStatus('connecting');

  socket = io(API_URL, {
    path: '/api/v1/stream/ws',
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  // Connection events
  socket.on('connect', () => {
    console.log('[Socket] Connected');
    useVoidStore.getState().setConnectionStatus('connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    useVoidStore.getState().setConnectionStatus('disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
    useVoidStore.getState().setConnectionStatus('error');
  });

  // Server events
  socket.on('joined', ({ voidType, weather }) => {
    console.log('[Socket] Joined void:', voidType);
    useVoidStore.getState().setWeather(voidType, weather);
  });

  socket.on('confession:new', ({ confession }) => {
    console.log('[Socket] New confession:', confession.id);
    useVoidStore.getState().addConfession(confession);
  });

  socket.on('confession:resonance', ({ confessionId, newCount }) => {
    const store = useVoidStore.getState();
    const confession = store.confessions.find((c) => c.id === confessionId);
    if (confession) {
      store.updateConfession({ ...confession, resonanceCount: newCount });
    }
  });

  socket.on('confession:echo', ({ confessionId, word, newCount }) => {
    const store = useVoidStore.getState();
    const confession = store.confessions.find((c) => c.id === confessionId);
    if (confession) {
      const echoes = [...confession.echoes];
      const echoIndex = echoes.findIndex((e) => e.word === word);
      if (echoIndex >= 0) {
        echoes[echoIndex] = { word, count: newCount };
      } else {
        echoes.push({ word, count: newCount });
      }
      store.updateConfession({ ...confession, echoes });
    }
  });

  socket.on('confession:expired', ({ confessionId }) => {
    console.log('[Socket] Confession expired:', confessionId);
    useVoidStore.getState().removeConfession(confessionId);
  });

  socket.on('weather:update', ({ voidType, weather }) => {
    console.log('[Socket] Weather update:', voidType, weather.state);
    useVoidStore.getState().setWeather(voidType, weather);
  });

  socket.on('error', ({ code, message }) => {
    console.error('[Socket] Error:', code, message);
  });

  return socket;
}

/**
 * Disconnect from the WebSocket server
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the current socket instance
 */
export function getSocket(): VoidSocket | null {
  return socket;
}

/**
 * Join a void channel to receive confessions
 */
export function joinVoid(voidType: VoidType): void {
  const store = useVoidStore.getState();
  socket?.emit('join:void', {
    voidType,
    sessionHash: store.sessionHash ?? undefined,
  });
  store.setActiveVoid(voidType);
}

/**
 * Leave the current void channel
 */
export function leaveVoid(voidType: VoidType): void {
  socket?.emit('leave:void', { voidType });
  useVoidStore.getState().setActiveVoid(null);
}

/**
 * Send a resonance (like) to a confession
 */
export function resonateConfession(confessionId: string): void {
  socket?.emit('confession:resonate', { confessionId });
}

/**
 * Send an echo word to a confession
 */
export function echoConfession(confessionId: string, word: EchoWord): void {
  socket?.emit('confession:echo', { confessionId, word });
}

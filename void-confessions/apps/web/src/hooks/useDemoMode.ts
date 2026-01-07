'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useVoidStore } from '@/store/voidStore';
import type { VoidType, Confession } from '@void-confessions/core';

// Sample confessions for demo mode - themed by void type
const DEMO_CONFESSIONS: Record<VoidType, string[]> = {
  grief: [
    "I still talk to her picture every morning...",
    "Three years later and I still reach for the phone to call him",
    "I kept all the voicemails. I can't delete them.",
    "The empty chair at dinner still breaks me",
    "I miss who I was before the loss",
    "Some days breathing feels like betrayal",
    "I planted a garden in their memory. It's the only thing keeping me going.",
    "I dream about them and wake up crying",
    "The world kept spinning but mine stopped",
    "I found an old birthday card today. I wasn't ready.",
  ],
  rage: [
    "I smile at work while fantasizing about quitting spectacularly",
    "They'll never know how close I came to saying everything",
    "I've been screaming into pillows for weeks",
    "The unfairness of it all consumes me",
    "I'm so tired of being the bigger person",
    "They don't deserve my forgiveness and they won't get it",
    "I deleted everything but the anger remains",
    "Sometimes the only thing keeping me going is spite",
    "I rehearse arguments that will never happen",
    "My patience isn't virtue anymore, it's a cage",
  ],
  guilt: [
    "I never said goodbye and I have to live with that",
    "They trusted me completely and I let them down",
    "I pretend I've moved on but the shame follows me",
    "I was the toxic one. I know that now.",
    "The lie was small but it changed everything",
    "I could have helped but I walked away",
    "They'll never know what I did",
    "I smile when they thank me but I don't deserve it",
    "I've apologized but not for what I really did",
    "The secret is eating me alive",
  ],
  longing: [
    "I still drive past their house sometimes",
    "Every love song is about them now",
    "I keep their sweater in my closet. It still smells like them.",
    "I rehearse what I'd say if I saw them again",
    "The 'what ifs' are louder at 3am",
    "I'm happy for them. I'm also devastated.",
    "I dream of a life that was never mine",
    "Sometimes I forget we're not together anymore",
    "I've moved on but part of me is still waiting",
    "I miss who I was when I was with them",
  ],
  relief: [
    "I finally said no and the world didn't end",
    "The chains are off. I can breathe again.",
    "I thought I'd miss them. I don't.",
    "Walking away was the bravest thing I've ever done",
    "The test came back negative. I cried for an hour.",
    "I forgave myself today. It took years.",
    "The debt is paid. I'm free.",
    "I told the truth and survived",
    "I don't have to pretend anymore",
    "It's over. It's finally over.",
  ],
};

// Generate a unique ID
function generateId(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get a random confession for the void type
function getRandomConfession(voidType: VoidType): Confession {
  const confessions = DEMO_CONFESSIONS[voidType];
  const content = confessions[Math.floor(Math.random() * confessions.length)];

  return {
    id: generateId(),
    content,
    voidType,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString(), // Expires in 1 minute
    resonanceCount: Math.floor(Math.random() * 5),
    echoCount: Math.floor(Math.random() * 3),
  };
}

// Get random interval between 5-10 seconds
function getRandomInterval(): number {
  return 5000 + Math.random() * 5000;
}

export function useDemoMode(voidType: VoidType | null) {
  const {
    addConfession,
    removeConfession,
    setCollectiveCount,
    setWeather,
    confessions,
  } = useVoidStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const confessionTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Start generating confessions when void type is set
  useEffect(() => {
    if (!voidType) return;

    // Set initial weather and count
    setWeather({
      state: 'calm',
      intensity: 0.5 + Math.random() * 0.3,
      nextChange: Date.now() + 300000,
    });
    setCollectiveCount(Math.floor(10 + Math.random() * 50));

    // Add initial confessions with staggered timing
    const initialConfessions = 3;
    for (let i = 0; i < initialConfessions; i++) {
      setTimeout(() => {
        if (voidType) {
          const confession = getRandomConfession(voidType);
          addConfession(confession);
          scheduleRemoval(confession.id);
        }
      }, i * 1500);
    }

    // Start interval for new confessions
    const scheduleNextConfession = () => {
      intervalRef.current = setTimeout(() => {
        if (voidType) {
          const confession = getRandomConfession(voidType);
          addConfession(confession);
          scheduleRemoval(confession.id);

          // Increment collective count occasionally
          if (Math.random() > 0.7) {
            setCollectiveCount((prev: number) => prev + 1);
          }
        }
        scheduleNextConfession();
      }, getRandomInterval());
    };

    scheduleNextConfession();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      confessionTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      confessionTimeoutsRef.current.clear();
    };
  }, [voidType, addConfession, setWeather, setCollectiveCount]);

  // Schedule removal of a confession after it drifts up
  const scheduleRemoval = useCallback((id: string) => {
    const timeout = setTimeout(() => {
      removeConfession(id);
      confessionTimeoutsRef.current.delete(id);
    }, 15000 + Math.random() * 10000); // Remove after 15-25 seconds

    confessionTimeoutsRef.current.set(id, timeout);
  }, [removeConfession]);

  // Submit a confession (local only in demo mode)
  const submitConfession = useCallback(
    (content: string, releaseStyle?: string) => {
      if (!voidType || !content.trim()) return;

      const confession: Confession = {
        id: generateId(),
        content: content.trim(),
        voidType,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        resonanceCount: 0,
        echoCount: 0,
        releaseStyle,
      };

      addConfession(confession);
      scheduleRemoval(confession.id);

      // Increment collective count
      setCollectiveCount((prev: number) => prev + 1);
    },
    [voidType, addConfession, scheduleRemoval, setCollectiveCount]
  );

  // Resonate (just increment locally in demo mode)
  const resonateConfession = useCallback(
    (confessionId: string) => {
      const { updateConfessionResonance } = useVoidStore.getState();
      updateConfessionResonance(confessionId, 1);
    },
    []
  );

  // Echo (just increment locally in demo mode)
  const echoConfession = useCallback(
    (confessionId: string) => {
      // In demo mode, just add a small visual feedback
      // The actual echo count isn't tracked in the store currently
    },
    []
  );

  return {
    isDemoMode: true,
    isConnected: false,
    submitConfession,
    resonateConfession,
    echoConfession,
  };
}

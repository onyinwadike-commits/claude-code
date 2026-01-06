'use client';

import { ReactNode, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAudioStore } from '@/store/audioStore';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const initializeAudio = useAudioStore((state) => state.initialize);

  useEffect(() => {
    // Initialize audio on first user interaction
    const handleInteraction = () => {
      initializeAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [initializeAudio]);

  return <AnimatePresence mode="wait">{children}</AnimatePresence>;
}

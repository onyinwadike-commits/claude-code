'use client';

import { ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AudioProvider } from '@/components/AudioProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AudioProvider>
      <AnimatePresence mode="wait">{children}</AnimatePresence>
    </AudioProvider>
  );
}

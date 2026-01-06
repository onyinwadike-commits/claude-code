'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from './AudioProvider';

interface AudioSettingsProps {
  className?: string;
}

export function AudioSettings({ className = '' }: AudioSettingsProps) {
  const audio = useAudio();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {/* Toggle button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-2 rounded-lg transition-colors
          ${audio.isMuted || !audio.isEnabled
            ? 'bg-void-800/50 text-white/40'
            : 'bg-void-700/50 text-white/80 hover:bg-void-600/50'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={audio.isMuted ? 'Unmute audio' : 'Mute audio'}
      >
        {audio.isMuted || !audio.isEnabled ? (
          <SpeakerOffIcon className="w-5 h-5" />
        ) : (
          <SpeakerOnIcon className="w-5 h-5" volume={audio.masterVolume} />
        )}
      </motion.button>

      {/* Settings panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`
                absolute top-full right-0 mt-2 z-50
                w-72 p-4 rounded-xl
                bg-void-900/95 backdrop-blur-lg
                border border-void-700/50
                shadow-xl
              `}
            >
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <SpeakerOnIcon className="w-4 h-4" volume={1} />
                Audio Settings
              </h3>

              {/* Enable/Disable toggle */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-void-700/50">
                <span className="text-white/70 text-sm">Sound Effects</span>
                <button
                  onClick={() => audio.setEnabled(!audio.isEnabled)}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors
                    ${audio.isEnabled ? 'bg-relief-600' : 'bg-void-700'}
                  `}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white"
                    animate={{ left: audio.isEnabled ? '1.5rem' : '0.25rem' }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                </button>
              </div>

              {/* Volume sliders */}
              <div className={`space-y-4 ${!audio.isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Master Volume */}
                <VolumeSlider
                  label="Master"
                  value={audio.masterVolume}
                  onChange={audio.setMasterVolume}
                  icon={<SpeakerOnIcon className="w-4 h-4" volume={audio.masterVolume} />}
                />

                {/* Ambient Volume */}
                <VolumeSlider
                  label="Ambient"
                  value={audio.ambientVolume}
                  onChange={audio.setAmbientVolume}
                  icon={<WaveIcon className="w-4 h-4" />}
                />

                {/* SFX Volume */}
                <VolumeSlider
                  label="Effects"
                  value={audio.sfxVolume}
                  onChange={audio.setSfxVolume}
                  icon={<SparkleIcon className="w-4 h-4" />}
                />
              </div>

              {/* Mute button */}
              <button
                onClick={audio.toggleMute}
                disabled={!audio.isEnabled}
                className={`
                  w-full mt-4 py-2 px-4 rounded-lg text-sm font-medium
                  transition-colors flex items-center justify-center gap-2
                  ${audio.isMuted
                    ? 'bg-rage-600/20 text-rage-300 hover:bg-rage-600/30'
                    : 'bg-void-700/50 text-white/70 hover:bg-void-600/50'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {audio.isMuted ? (
                  <>
                    <SpeakerOffIcon className="w-4 h-4" />
                    Unmute All
                  </>
                ) : (
                  <>
                    <SpeakerOnIcon className="w-4 h-4" volume={1} />
                    Mute All
                  </>
                )}
              </button>

              {/* Status */}
              <div className="mt-4 pt-4 border-t border-void-700/50 text-xs text-white/40">
                {audio.isInitialized ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-relief-500" />
                    Audio loaded
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-longing-500 animate-pulse" />
                    Click anywhere to enable audio
                  </span>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Volume slider component
interface VolumeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: React.ReactNode;
}

function VolumeSlider({ label, value, onChange, icon }: VolumeSliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/50 flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="text-white/70 tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-void-700 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-110
          [&::-moz-range-thumb]:w-3.5
          [&::-moz-range-thumb]:h-3.5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-white
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer
        "
        style={{
          background: `linear-gradient(to right, rgba(139, 92, 246, 0.8) ${value * 100}%, rgba(55, 48, 79, 0.8) ${value * 100}%)`,
        }}
      />
    </div>
  );
}

// Icons
function SpeakerOnIcon({ className, volume = 1 }: { className?: string; volume?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      {volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" strokeLinecap="round" />}
      {volume > 0.5 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round" />}
    </svg>
  );
}

function SpeakerOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" />
      <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" />
    </svg>
  );
}

function WaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2a2 2 0 0 1 2-2h2" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" />
    </svg>
  );
}

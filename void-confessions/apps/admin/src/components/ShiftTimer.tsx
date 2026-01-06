'use client';

/**
 * Shift Timer Component
 *
 * Tracks moderator exposure time during active shifts.
 * Auto-rotation alerts after 2 hours to protect moderator wellbeing.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const WARNING_THRESHOLD = 1.5 * 60 * 60 * 1000; // 1.5 hours - show warning
const ALERT_INTERVAL = 15 * 60 * 1000; // Remind every 15 min after 2 hours

interface ShiftTimerProps {
  onRotationNeeded?: () => void;
}

export function ShiftTimer({ onRotationNeeded }: ShiftTimerProps) {
  const user = useAuthStore((state) => state.user);
  const startShift = useAuthStore((state) => state.startShift);
  const endShift = useAuthStore((state) => state.endShift);

  const [elapsed, setElapsed] = useState(0);
  const [showRotationAlert, setShowRotationAlert] = useState(false);
  const [lastAlertTime, setLastAlertTime] = useState(0);

  // Calculate elapsed time
  useEffect(() => {
    if (!user?.shiftStartedAt) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const shiftElapsed = now - user.shiftStartedAt!;
      setElapsed(shiftElapsed);

      // Check for rotation needed
      if (shiftElapsed >= TWO_HOURS_MS) {
        // Show alert if we haven't shown one in the last interval
        if (now - lastAlertTime > ALERT_INTERVAL) {
          setShowRotationAlert(true);
          setLastAlertTime(now);
          onRotationNeeded?.();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.shiftStartedAt, lastAlertTime, onRotationNeeded]);

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const getTimerColor = useCallback(() => {
    if (elapsed >= TWO_HOURS_MS) return 'text-red-500';
    if (elapsed >= WARNING_THRESHOLD) return 'text-yellow-500';
    return 'text-green-500';
  }, [elapsed]);

  const getProgressPercent = useCallback(() => {
    return Math.min((elapsed / TWO_HOURS_MS) * 100, 100);
  }, [elapsed]);

  const handleStartShift = () => {
    startShift();
    setShowRotationAlert(false);
    setLastAlertTime(0);
  };

  const handleEndShift = () => {
    endShift();
    setShowRotationAlert(false);
  };

  const handleDismissAlert = () => {
    setShowRotationAlert(false);
  };

  const isShiftActive = !!user?.shiftStartedAt;

  return (
    <div className="relative">
      {/* Rotation Alert Modal */}
      {showRotationAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Shift Rotation Recommended
              </h3>
              <p className="text-gray-600 mb-6">
                You&apos;ve been moderating for over 2 hours. Consider taking a break
                to protect your mental wellbeing. Extended exposure to sensitive
                content can be taxing.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleEndShift}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  End Shift
                </button>
                <button
                  onClick={handleDismissAlert}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Continue (15 min)
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                This reminder will appear every 15 minutes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-gray-300 font-medium">Shift Timer</span>
          </div>
          {isShiftActive && (
            <span className={`text-lg font-mono font-bold ${getTimerColor()}`}>
              {formatTime(elapsed)}
            </span>
          )}
        </div>

        {isShiftActive ? (
          <>
            {/* Progress bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  elapsed >= TWO_HOURS_MS
                    ? 'bg-red-500'
                    : elapsed >= WARNING_THRESHOLD
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${getProgressPercent()}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>0:00</span>
              <span>2:00:00 (rotation)</span>
            </div>

            <button
              onClick={handleEndShift}
              className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm font-medium"
            >
              End Shift
            </button>
          </>
        ) : (
          <button
            onClick={handleStartShift}
            className="w-full py-2 px-4 bg-void-600 hover:bg-void-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Start Shift
          </button>
        )}

        {/* Wellbeing reminder */}
        <p className="text-xs text-gray-500 mt-3 text-center">
          {isShiftActive
            ? 'Remember to take breaks. Your wellbeing matters.'
            : 'Start your shift to begin reviewing flagged content.'}
        </p>
      </div>
    </div>
  );
}

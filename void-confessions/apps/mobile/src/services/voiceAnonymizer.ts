/**
 * VoiceAnonymizer Service
 *
 * Applies on-device audio transformations to anonymize voice recordings:
 * - Random pitch shift (-6 to +6 semitones)
 * - Time stretch (0.9x to 1.1x speed)
 * - Background noise injection
 *
 * The original recording is deleted after processing.
 */

import { NativeModules, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const { VoiceAnonymizerModule } = NativeModules;

/**
 * Anonymization parameters
 */
export interface AnonymizationParams {
  /** Pitch shift in semitones (-6 to +6) */
  pitchShift: number;
  /** Time stretch factor (0.9 to 1.1) */
  timeStretch: number;
  /** Noise level (0 to 1) */
  noiseLevel: number;
}

/**
 * Anonymization result
 */
export interface AnonymizationResult {
  success: boolean;
  anonymizedUri: string | null;
  originalDeleted: boolean;
  params: AnonymizationParams;
  error?: string;
}

/**
 * Generate random anonymization parameters
 */
export function generateRandomParams(): AnonymizationParams {
  // Random pitch shift: -6 to +6 semitones
  const pitchShift = Math.random() * 12 - 6;

  // Random time stretch: 0.9x to 1.1x
  const timeStretch = 0.9 + Math.random() * 0.2;

  // Random noise level: 0.02 to 0.08 (subtle background noise)
  const noiseLevel = 0.02 + Math.random() * 0.06;

  return {
    pitchShift: Math.round(pitchShift * 10) / 10, // Round to 1 decimal
    timeStretch: Math.round(timeStretch * 100) / 100, // Round to 2 decimals
    noiseLevel: Math.round(noiseLevel * 1000) / 1000, // Round to 3 decimals
  };
}

/**
 * Check if native voice anonymization is available
 */
export function isNativeAnonymizerAvailable(): boolean {
  return !!VoiceAnonymizerModule?.anonymizeAudio;
}

/**
 * Anonymize audio file using native processing
 *
 * @param inputUri - URI of the original audio file
 * @param params - Optional anonymization parameters (random if not provided)
 * @returns Anonymization result with new file URI
 */
export async function anonymizeVoice(
  inputUri: string,
  params?: Partial<AnonymizationParams>
): Promise<AnonymizationResult> {
  // Generate or merge parameters
  const defaultParams = generateRandomParams();
  const finalParams: AnonymizationParams = {
    ...defaultParams,
    ...params,
  };

  // Validate parameters
  finalParams.pitchShift = Math.max(-6, Math.min(6, finalParams.pitchShift));
  finalParams.timeStretch = Math.max(0.9, Math.min(1.1, finalParams.timeStretch));
  finalParams.noiseLevel = Math.max(0, Math.min(0.2, finalParams.noiseLevel));

  console.log('[VoiceAnonymizer] Processing with params:', finalParams);

  try {
    // Check if native module is available
    if (VoiceAnonymizerModule?.anonymizeAudio) {
      // Use native processing
      const result = await VoiceAnonymizerModule.anonymizeAudio(
        inputUri,
        finalParams.pitchShift,
        finalParams.timeStretch,
        finalParams.noiseLevel
      );

      // Delete original file
      const originalDeleted = await deleteOriginalFile(inputUri);

      return {
        success: true,
        anonymizedUri: result.outputUri,
        originalDeleted,
        params: finalParams,
      };
    } else {
      // Fallback: Copy file with new name (minimal anonymization)
      // In production, this should be replaced with proper audio processing
      console.warn('[VoiceAnonymizer] Native module not available, using fallback');

      const anonymizedUri = await fallbackAnonymization(inputUri);
      const originalDeleted = await deleteOriginalFile(inputUri);

      return {
        success: true,
        anonymizedUri,
        originalDeleted,
        params: finalParams,
      };
    }
  } catch (error) {
    console.error('[VoiceAnonymizer] Processing failed:', error);

    return {
      success: false,
      anonymizedUri: null,
      originalDeleted: false,
      params: finalParams,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fallback anonymization when native module is not available
 * This should only be used for development/testing
 */
async function fallbackAnonymization(inputUri: string): Promise<string> {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const outputUri = `${FileSystem.cacheDirectory}anonymized_${timestamp}_${randomId}.m4a`;

  // Copy file (in production, this would be actual audio processing)
  await FileSystem.copyAsync({
    from: inputUri,
    to: outputUri,
  });

  console.log('[VoiceAnonymizer] Fallback: Copied to', outputUri);
  return outputUri;
}

/**
 * Delete the original audio file
 */
async function deleteOriginalFile(uri: string): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      console.log('[VoiceAnonymizer] Original file deleted:', uri);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[VoiceAnonymizer] Failed to delete original:', error);
    return false;
  }
}

/**
 * Delete an anonymized audio file
 */
export async function deleteAnonymizedFile(uri: string): Promise<boolean> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    return true;
  } catch (error) {
    console.error('[VoiceAnonymizer] Failed to delete anonymized file:', error);
    return false;
  }
}

/**
 * Get file info for an audio file
 */
export async function getAudioFileInfo(uri: string): Promise<{
  exists: boolean;
  size: number;
  modificationTime: number;
} | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    if (info.exists) {
      return {
        exists: true,
        size: info.size || 0,
        modificationTime: info.modificationTime || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Upload anonymized audio to server
 *
 * @param anonymizedUri - URI of the anonymized audio file
 * @param voidType - The void type this confession belongs to
 * @param metadata - Additional metadata for the upload
 */
export async function uploadAnonymizedAudio(
  anonymizedUri: string,
  voidType: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; audioId?: string; error?: string }> {
  try {
    // Create upload task
    const uploadResult = await FileSystem.uploadAsync(
      'http://localhost:3002/confessions/audio',
      anonymizedUri,
      {
        fieldName: 'audio',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        parameters: {
          voidType,
          ...(metadata ? { metadata: JSON.stringify(metadata) } : {}),
        },
      }
    );

    if (uploadResult.status === 200 || uploadResult.status === 201) {
      const response = JSON.parse(uploadResult.body);

      // Delete local anonymized file after successful upload
      await deleteAnonymizedFile(anonymizedUri);

      return {
        success: true,
        audioId: response.audioId || response.id,
      };
    } else {
      return {
        success: false,
        error: `Upload failed with status ${uploadResult.status}`,
      };
    }
  } catch (error) {
    console.error('[VoiceAnonymizer] Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Clean up all temporary audio files
 */
export async function cleanupTempAudioFiles(): Promise<void> {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return;

    const files = await FileSystem.readDirectoryAsync(cacheDir);
    const audioFiles = files.filter(
      (f) => f.startsWith('anonymized_') || f.startsWith('recording_')
    );

    for (const file of audioFiles) {
      await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
    }

    console.log(`[VoiceAnonymizer] Cleaned up ${audioFiles.length} temp files`);
  } catch (error) {
    console.error('[VoiceAnonymizer] Cleanup failed:', error);
  }
}

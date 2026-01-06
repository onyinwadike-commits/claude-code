import { Audio } from 'expo-av';
import type { Recording, Sound } from 'expo-av/build/Audio';

/**
 * Audio recording state
 */
export interface RecordingState {
  isRecording: boolean;
  duration: number;
  uri: string | null;
}

let currentRecording: Recording | null = null;
let currentSound: Sound | null = null;

/**
 * Request audio recording permissions
 */
export async function requestAudioPermissions(): Promise<boolean> {
  try {
    const { granted } = await Audio.requestPermissionsAsync();
    return granted;
  } catch (error) {
    console.error('[Audio] Permission request failed:', error);
    return false;
  }
}

/**
 * Configure audio session for recording
 */
export async function configureAudioSession(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('[Audio] Session configuration failed:', error);
  }
}

/**
 * Start recording audio
 */
export async function startRecording(): Promise<Recording | null> {
  try {
    // Stop any existing recording
    if (currentRecording) {
      await stopRecording();
    }

    // Configure audio session
    await configureAudioSession();

    // Create and start recording
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    currentRecording = recording;
    console.log('[Audio] Recording started');
    return recording;
  } catch (error) {
    console.error('[Audio] Failed to start recording:', error);
    return null;
  }
}

/**
 * Stop recording and get the URI
 */
export async function stopRecording(): Promise<string | null> {
  if (!currentRecording) {
    return null;
  }

  try {
    await currentRecording.stopAndUnloadAsync();
    const uri = currentRecording.getURI();
    currentRecording = null;

    // Reset audio mode for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    console.log('[Audio] Recording stopped:', uri);
    return uri;
  } catch (error) {
    console.error('[Audio] Failed to stop recording:', error);
    currentRecording = null;
    return null;
  }
}

/**
 * Get current recording duration in milliseconds
 */
export async function getRecordingDuration(): Promise<number> {
  if (!currentRecording) {
    return 0;
  }

  try {
    const status = await currentRecording.getStatusAsync();
    return status.isRecording ? status.durationMillis : 0;
  } catch {
    return 0;
  }
}

/**
 * Play audio from URI
 */
export async function playAudio(uri: string): Promise<void> {
  try {
    // Stop any existing playback
    if (currentSound) {
      await currentSound.unloadAsync();
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true }
    );

    currentSound = sound;

    // Clean up when playback finishes
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        currentSound = null;
      }
    });

    console.log('[Audio] Playing:', uri);
  } catch (error) {
    console.error('[Audio] Playback failed:', error);
  }
}

/**
 * Stop current audio playback
 */
export async function stopAudio(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    } catch (error) {
      console.error('[Audio] Failed to stop playback:', error);
    }
  }
}

/**
 * Clean up audio resources
 */
export async function cleanupAudio(): Promise<void> {
  await stopRecording();
  await stopAudio();
}

/**
 * Letter Storage Service
 *
 * Manages local storage of encrypted letters.
 * All data stays on device - nothing is ever sent to a server.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  encryptLetter,
  decryptLetter,
  type EncryptedLetter,
  type DecryptedLetter,
} from './letterEncryption';

// Storage keys
const LETTERS_STORAGE_KEY = '@void_letters_to_void';
const LETTERS_INDEX_KEY = '@void_letters_index';

/**
 * Letter metadata (non-sensitive info for listing)
 */
export interface LetterMetadata {
  id: string;
  createdAt: number;
  returnDate: number;
  returnDays: 30 | 90 | 365;
  hasBeenViewed: boolean;
  isReady: boolean; // True if return date has passed
}

/**
 * Get all letter metadata for listing
 */
export async function getLetterMetadata(): Promise<LetterMetadata[]> {
  try {
    const indexJson = await AsyncStorage.getItem(LETTERS_INDEX_KEY);
    if (!indexJson) return [];

    const index: LetterMetadata[] = JSON.parse(indexJson);
    const now = Date.now();

    // Update isReady status
    return index.map((letter) => ({
      ...letter,
      isReady: now >= letter.returnDate,
    }));
  } catch (error) {
    console.error('[LetterStorage] Failed to get metadata:', error);
    return [];
  }
}

/**
 * Get letters that are ready to be revealed
 */
export async function getReadyLetters(): Promise<LetterMetadata[]> {
  const metadata = await getLetterMetadata();
  return metadata.filter((letter) => letter.isReady && !letter.hasBeenViewed);
}

/**
 * Get pending letters (not yet ready)
 */
export async function getPendingLetters(): Promise<LetterMetadata[]> {
  const metadata = await getLetterMetadata();
  return metadata.filter((letter) => !letter.isReady);
}

/**
 * Save a new letter to the void
 *
 * @param content - The confession content
 * @param voidType - The void type
 * @param returnDays - Days until return
 * @returns The letter ID
 */
export async function saveLetter(
  content: string,
  voidType: string,
  returnDays: 30 | 90 | 365
): Promise<string> {
  try {
    // Encrypt the letter
    const encryptedLetter = await encryptLetter(content, voidType, returnDays);

    // Get existing letters
    const lettersJson = await AsyncStorage.getItem(LETTERS_STORAGE_KEY);
    const letters: Record<string, EncryptedLetter> = lettersJson
      ? JSON.parse(lettersJson)
      : {};

    // Add new letter
    letters[encryptedLetter.id] = encryptedLetter;
    await AsyncStorage.setItem(LETTERS_STORAGE_KEY, JSON.stringify(letters));

    // Update index
    const indexJson = await AsyncStorage.getItem(LETTERS_INDEX_KEY);
    const index: LetterMetadata[] = indexJson ? JSON.parse(indexJson) : [];

    index.push({
      id: encryptedLetter.id,
      createdAt: encryptedLetter.createdAt,
      returnDate: encryptedLetter.returnDate,
      returnDays: encryptedLetter.returnDays,
      hasBeenViewed: false,
      isReady: false,
    });

    await AsyncStorage.setItem(LETTERS_INDEX_KEY, JSON.stringify(index));

    console.log(`[LetterStorage] Letter ${encryptedLetter.id} saved`);
    return encryptedLetter.id;
  } catch (error) {
    console.error('[LetterStorage] Failed to save letter:', error);
    throw new Error('Failed to save letter');
  }
}

/**
 * Retrieve and decrypt a letter by ID
 *
 * @param letterId - The letter ID
 * @returns Decrypted letter or null
 */
export async function getLetter(letterId: string): Promise<DecryptedLetter | null> {
  try {
    const lettersJson = await AsyncStorage.getItem(LETTERS_STORAGE_KEY);
    if (!lettersJson) return null;

    const letters: Record<string, EncryptedLetter> = JSON.parse(lettersJson);
    const encryptedLetter = letters[letterId];

    if (!encryptedLetter) return null;

    return await decryptLetter(encryptedLetter);
  } catch (error) {
    console.error('[LetterStorage] Failed to get letter:', error);
    return null;
  }
}

/**
 * Mark a letter as viewed
 *
 * @param letterId - The letter ID
 */
export async function markLetterViewed(letterId: string): Promise<void> {
  try {
    // Update letters storage
    const lettersJson = await AsyncStorage.getItem(LETTERS_STORAGE_KEY);
    if (lettersJson) {
      const letters: Record<string, EncryptedLetter> = JSON.parse(lettersJson);
      if (letters[letterId]) {
        letters[letterId].hasBeenViewed = true;
        await AsyncStorage.setItem(LETTERS_STORAGE_KEY, JSON.stringify(letters));
      }
    }

    // Update index
    const indexJson = await AsyncStorage.getItem(LETTERS_INDEX_KEY);
    if (indexJson) {
      const index: LetterMetadata[] = JSON.parse(indexJson);
      const letterIndex = index.findIndex((l) => l.id === letterId);
      if (letterIndex !== -1) {
        index[letterIndex].hasBeenViewed = true;
        await AsyncStorage.setItem(LETTERS_INDEX_KEY, JSON.stringify(index));
      }
    }

    console.log(`[LetterStorage] Letter ${letterId} marked as viewed`);
  } catch (error) {
    console.error('[LetterStorage] Failed to mark letter viewed:', error);
  }
}

/**
 * Delete a letter permanently
 *
 * @param letterId - The letter ID
 */
export async function deleteLetter(letterId: string): Promise<void> {
  try {
    // Remove from letters storage
    const lettersJson = await AsyncStorage.getItem(LETTERS_STORAGE_KEY);
    if (lettersJson) {
      const letters: Record<string, EncryptedLetter> = JSON.parse(lettersJson);
      delete letters[letterId];
      await AsyncStorage.setItem(LETTERS_STORAGE_KEY, JSON.stringify(letters));
    }

    // Remove from index
    const indexJson = await AsyncStorage.getItem(LETTERS_INDEX_KEY);
    if (indexJson) {
      const index: LetterMetadata[] = JSON.parse(indexJson);
      const filteredIndex = index.filter((l) => l.id !== letterId);
      await AsyncStorage.setItem(LETTERS_INDEX_KEY, JSON.stringify(filteredIndex));
    }

    console.log(`[LetterStorage] Letter ${letterId} deleted`);
  } catch (error) {
    console.error('[LetterStorage] Failed to delete letter:', error);
  }
}

/**
 * Delete all viewed letters (cleanup)
 */
export async function deleteViewedLetters(): Promise<number> {
  try {
    const metadata = await getLetterMetadata();
    const viewedLetters = metadata.filter((l) => l.hasBeenViewed);

    for (const letter of viewedLetters) {
      await deleteLetter(letter.id);
    }

    return viewedLetters.length;
  } catch (error) {
    console.error('[LetterStorage] Failed to delete viewed letters:', error);
    return 0;
  }
}

/**
 * Get count of letters by status
 */
export async function getLetterCounts(): Promise<{
  total: number;
  pending: number;
  ready: number;
  viewed: number;
}> {
  const metadata = await getLetterMetadata();

  return {
    total: metadata.length,
    pending: metadata.filter((l) => !l.isReady).length,
    ready: metadata.filter((l) => l.isReady && !l.hasBeenViewed).length,
    viewed: metadata.filter((l) => l.hasBeenViewed).length,
  };
}

/**
 * Calculate time remaining until letter returns
 */
export function getTimeRemaining(returnDate: number): {
  days: number;
  hours: number;
  minutes: number;
  isReady: boolean;
  formatted: string;
} {
  const now = Date.now();
  const diff = returnDate - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      isReady: true,
      formatted: 'Ready to reveal',
    };
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  let formatted: string;
  if (days > 0) {
    formatted = `${days} day${days !== 1 ? 's' : ''} remaining`;
  } else if (hours > 0) {
    formatted = `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
  } else {
    formatted = `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  }

  return { days, hours, minutes, isReady: false, formatted };
}

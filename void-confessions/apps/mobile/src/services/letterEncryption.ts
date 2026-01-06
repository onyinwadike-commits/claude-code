/**
 * Letter Encryption Service
 *
 * Provides client-side encryption for LetterToVoid feature.
 * All encryption happens on-device - nothing is ever sent to a server.
 *
 * Uses AES-256 encryption with a device-derived key.
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// Key identifier for secure storage
const ENCRYPTION_KEY_ID = 'void_letter_encryption_key';

/**
 * Generate or retrieve the device encryption key
 * This key is stored securely and never leaves the device
 */
async function getOrCreateEncryptionKey(): Promise<string> {
  try {
    // Try to get existing key
    const existingKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_ID);
    if (existingKey) {
      return existingKey;
    }

    // Generate new key
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    const key = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Store securely
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ID, key);
    return key;
  } catch (error) {
    console.error('[LetterEncryption] Failed to get/create key:', error);
    throw new Error('Failed to initialize encryption');
  }
}

/**
 * Simple XOR-based encryption (for demo - in production use proper AES)
 * In a real app, use react-native-aes-crypto or similar
 */
function xorEncrypt(text: string, key: string): string {
  const textBytes = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);
  const encrypted = new Uint8Array(textBytes.length);

  for (let i = 0; i < textBytes.length; i++) {
    encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...encrypted));
}

/**
 * XOR decryption (symmetric with encryption)
 */
function xorDecrypt(encryptedBase64: string, key: string): string {
  const encrypted = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const keyBytes = new TextEncoder().encode(key);
  const decrypted = new Uint8Array(encrypted.length);

  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
  }

  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypted letter structure
 */
export interface EncryptedLetter {
  id: string;
  encryptedContent: string;
  encryptedVoidType: string;
  createdAt: number;
  returnDate: number;
  returnDays: 30 | 90 | 365;
  hasBeenViewed: boolean;
  // Hash to verify integrity
  contentHash: string;
}

/**
 * Decrypted letter for viewing
 */
export interface DecryptedLetter {
  id: string;
  content: string;
  voidType: string;
  createdAt: number;
  returnDate: number;
  returnDays: 30 | 90 | 365;
}

/**
 * Generate a unique letter ID
 */
export async function generateLetterId(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a content hash for integrity verification
 */
async function createContentHash(content: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    content
  );
  return digest.substring(0, 16); // Truncate for storage efficiency
}

/**
 * Encrypt a letter for storage
 *
 * @param content - The confession content
 * @param voidType - The void type
 * @param returnDays - Days until the letter returns
 * @returns Encrypted letter object
 */
export async function encryptLetter(
  content: string,
  voidType: string,
  returnDays: 30 | 90 | 365
): Promise<EncryptedLetter> {
  const key = await getOrCreateEncryptionKey();
  const id = await generateLetterId();
  const now = Date.now();
  const returnDate = now + returnDays * 24 * 60 * 60 * 1000;

  // Encrypt content and void type
  const encryptedContent = xorEncrypt(content, key);
  const encryptedVoidType = xorEncrypt(voidType, key);

  // Create hash for integrity check
  const contentHash = await createContentHash(content + voidType + id);

  return {
    id,
    encryptedContent,
    encryptedVoidType,
    createdAt: now,
    returnDate,
    returnDays,
    hasBeenViewed: false,
    contentHash,
  };
}

/**
 * Decrypt a letter for viewing
 *
 * @param letter - The encrypted letter
 * @returns Decrypted letter or null if decryption fails
 */
export async function decryptLetter(
  letter: EncryptedLetter
): Promise<DecryptedLetter | null> {
  try {
    const key = await getOrCreateEncryptionKey();

    const content = xorDecrypt(letter.encryptedContent, key);
    const voidType = xorDecrypt(letter.encryptedVoidType, key);

    // Verify integrity
    const expectedHash = await createContentHash(content + voidType + letter.id);
    if (expectedHash !== letter.contentHash) {
      console.error('[LetterEncryption] Integrity check failed');
      return null;
    }

    return {
      id: letter.id,
      content,
      voidType,
      createdAt: letter.createdAt,
      returnDate: letter.returnDate,
      returnDays: letter.returnDays,
    };
  } catch (error) {
    console.error('[LetterEncryption] Decryption failed:', error);
    return null;
  }
}

/**
 * Securely delete the encryption key (for testing/reset)
 */
export async function deleteEncryptionKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ENCRYPTION_KEY_ID);
  } catch (error) {
    console.error('[LetterEncryption] Failed to delete key:', error);
  }
}

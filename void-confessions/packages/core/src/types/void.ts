/**
 * The emotional category of a confession - the type of void it belongs to
 */
export type VoidType = 'grief' | 'rage' | 'guilt' | 'longing' | 'relief';

/**
 * Visual animation style for releasing a confession into the void
 */
export type ReleaseStyle =
  | 'default'
  | 'burn'
  | 'shatter'
  | 'scream'
  | 'dissolve'
  | 'storm'
  | 'drift';

/**
 * Single-word echoes that others can send in response to a confession
 * These are the only form of interaction - anonymous resonance
 */
export type EchoWord =
  | 'same'
  | 'felt'
  | 'brave'
  | 'heard'
  | 'seen'
  | 'lighter'
  | 'strength';

/**
 * Echo attached to a confession - represents anonymous resonance from another user
 */
export interface Echo {
  word: EchoWord;
  count: number;
}

/**
 * Mapping of void types to their recommended release styles
 */
export const VOID_TYPE_RELEASE_STYLES: Record<VoidType, ReleaseStyle[]> = {
  grief: ['dissolve', 'drift', 'default'],
  rage: ['burn', 'shatter', 'scream', 'storm'],
  guilt: ['burn', 'dissolve', 'default'],
  longing: ['drift', 'dissolve', 'default'],
  relief: ['dissolve', 'drift', 'default'],
};

/**
 * Echo words that resonate best with each void type
 */
export const VOID_TYPE_ECHO_WORDS: Record<VoidType, EchoWord[]> = {
  grief: ['same', 'felt', 'seen', 'heard'],
  rage: ['same', 'felt', 'heard', 'strength'],
  guilt: ['brave', 'lighter', 'seen', 'strength'],
  longing: ['same', 'felt', 'seen', 'heard'],
  relief: ['lighter', 'brave', 'strength', 'heard'],
};

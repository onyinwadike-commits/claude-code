/**
 * Text Scrubber Service
 *
 * Removes personally identifiable information (PII) from text
 * before any moderation processing. All moderation runs on
 * scrubbed text only to protect user privacy.
 */

/**
 * Types of PII that can be detected and scrubbed
 */
export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'address'
  | 'name'
  | 'url'
  | 'date_of_birth'
  | 'username';

/**
 * Result of PII detection
 */
export interface PIIDetection {
  type: PIIType;
  start: number;
  end: number;
  original: string;
  replacement: string;
}

/**
 * Result of text scrubbing
 */
export interface ScrubResult {
  /** Original text (should NOT be stored) */
  original: string;
  /** Scrubbed text with PII removed */
  scrubbed: string;
  /** List of PII detected */
  detections: PIIDetection[];
  /** Whether any PII was found */
  hasPII: boolean;
  /** Count by PII type */
  piiCounts: Partial<Record<PIIType, number>>;
}

/**
 * PII detection patterns
 */
const PII_PATTERNS: Record<PIIType, RegExp> = {
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,

  // Phone numbers (various formats)
  phone: /(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}\b/g,

  // Social Security Numbers (US)
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,

  // Credit card numbers
  credit_card: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,

  // IP addresses
  ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,

  // Street addresses (simplified)
  address: /\b\d{1,5}\s+(?:[A-Za-z]+\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl)\.?\b/gi,

  // URLs
  url: /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi,

  // Dates that could be DOB (MM/DD/YYYY, DD/MM/YYYY, etc.)
  date_of_birth: /\b(?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}\b/g,

  // Social media usernames (@username format)
  username: /@[A-Za-z0-9_]{3,30}\b/g,

  // Common name patterns (this is simplified - real implementation would use NER)
  name: /\b(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi,
};

/**
 * Replacement strings for each PII type
 */
const PII_REPLACEMENTS: Record<PIIType, string> = {
  email: '[EMAIL]',
  phone: '[PHONE]',
  ssn: '[SSN]',
  credit_card: '[CARD]',
  ip_address: '[IP]',
  address: '[ADDRESS]',
  name: '[NAME]',
  url: '[URL]',
  date_of_birth: '[DOB]',
  username: '[USERNAME]',
};

/**
 * Detect PII in text without modifying it
 */
export function detectPII(text: string): PIIDetection[] {
  const detections: PIIDetection[] = [];

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    // Reset regex state
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(text)) !== null) {
      detections.push({
        type: type as PIIType,
        start: match.index,
        end: match.index + match[0].length,
        original: match[0],
        replacement: PII_REPLACEMENTS[type as PIIType],
      });
    }
  }

  // Sort by position for consistent replacement
  return detections.sort((a, b) => a.start - b.start);
}

/**
 * Scrub PII from text
 *
 * @param text - Text to scrub
 * @returns Scrub result with scrubbed text and detections
 */
export function scrubText(text: string): ScrubResult {
  const detections = detectPII(text);

  if (detections.length === 0) {
    return {
      original: text,
      scrubbed: text,
      detections: [],
      hasPII: false,
      piiCounts: {},
    };
  }

  // Build scrubbed text by replacing PII
  let scrubbed = text;
  let offset = 0;

  // Track counts by type
  const piiCounts: Partial<Record<PIIType, number>> = {};

  for (const detection of detections) {
    const adjustedStart = detection.start + offset;
    const adjustedEnd = detection.end + offset;

    scrubbed =
      scrubbed.substring(0, adjustedStart) +
      detection.replacement +
      scrubbed.substring(adjustedEnd);

    // Adjust offset for length difference
    offset += detection.replacement.length - (detection.end - detection.start);

    // Count by type
    piiCounts[detection.type] = (piiCounts[detection.type] || 0) + 1;
  }

  return {
    original: text,
    scrubbed,
    detections,
    hasPII: true,
    piiCounts,
  };
}

/**
 * Quick check if text contains any PII
 */
export function containsPII(text: string): boolean {
  for (const pattern of Object.values(PII_PATTERNS)) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Scrub specific types of PII only
 */
export function scrubSpecificPII(text: string, types: PIIType[]): ScrubResult {
  const allDetections = detectPII(text);
  const filteredDetections = allDetections.filter((d) => types.includes(d.type));

  if (filteredDetections.length === 0) {
    return {
      original: text,
      scrubbed: text,
      detections: [],
      hasPII: false,
      piiCounts: {},
    };
  }

  let scrubbed = text;
  let offset = 0;
  const piiCounts: Partial<Record<PIIType, number>> = {};

  for (const detection of filteredDetections) {
    const adjustedStart = detection.start + offset;
    const adjustedEnd = detection.end + offset;

    scrubbed =
      scrubbed.substring(0, adjustedStart) +
      detection.replacement +
      scrubbed.substring(adjustedEnd);

    offset += detection.replacement.length - (detection.end - detection.start);
    piiCounts[detection.type] = (piiCounts[detection.type] || 0) + 1;
  }

  return {
    original: text,
    scrubbed,
    detections: filteredDetections,
    hasPII: true,
    piiCounts,
  };
}

/**
 * Additional sensitive patterns (not PII but should be scrubbed)
 */
const SENSITIVE_PATTERNS = {
  // Specific locations
  location: /\b(?:located at|live at|work at|address is)\s+([^.!?\n]{5,50})\b/gi,
  // School/workplace names
  institution: /\b(?:go to|work at|attend|student at)\s+([A-Z][A-Za-z\s&]+(?:School|University|College|Inc|Corp|LLC))\b/gi,
};

/**
 * Enhanced scrub that also removes sensitive contextual information
 */
export function deepScrub(text: string): ScrubResult {
  // First do standard PII scrub
  let result = scrubText(text);
  let scrubbed = result.scrubbed;

  // Then apply sensitive pattern scrubbing
  for (const [, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    pattern.lastIndex = 0;
    scrubbed = scrubbed.replace(pattern, '[REDACTED]');
  }

  return {
    ...result,
    scrubbed,
  };
}

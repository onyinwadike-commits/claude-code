/**
 * Doxxing Detection Service
 *
 * Detects attempts to expose personal information about others,
 * including addresses, phone numbers, workplaces, and real names.
 */

/**
 * Types of doxxing content
 */
export type DoxxingType =
  | 'address_exposure'
  | 'phone_exposure'
  | 'workplace_exposure'
  | 'school_exposure'
  | 'real_name_exposure'
  | 'social_media_exposure'
  | 'family_info_exposure'
  | 'financial_info_exposure'
  | 'call_to_action';

/**
 * Doxxing severity levels
 */
export type DoxxingSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Result of doxxing detection
 */
export interface DoxxingResult {
  /** Whether doxxing was detected */
  detected: boolean;
  /** Severity level */
  severity: DoxxingSeverity;
  /** Confidence score (0-1) */
  confidence: number;
  /** Types of doxxing detected */
  doxxingTypes: DoxxingType[];
  /** Should auto-block */
  shouldBlock: boolean;
  /** Should flag for review */
  shouldFlag: boolean;
  /** Number of potential victims identified */
  potentialVictims: number;
  /** Matched patterns (for audit) */
  matches: string[];
}

/**
 * Patterns that indicate third-party information exposure
 */
const CONTEXT_PATTERNS = {
  // Phrases indicating information is about someone else
  thirdParty: [
    /\b(?:their|his|her|someone'?s?)\s+(?:address|phone|number|workplace|school|name)\b/gi,
    /\b(?:lives at|works at|goes to|found out|discovered)\b/gi,
    /\b(?:real name is|actually named|true identity)\b/gi,
    /\b(?:here(?:'s| is)|posting|sharing|exposing)\s+(?:their|his|her)\b/gi,
  ],

  // Call to action patterns (harassment)
  callToAction: [
    /\b(?:go to|show up at|find them at)\s+(?:their|his|her|this)\b/gi,
    /\b(?:call|text|message|contact|harass)\s+(?:them|her|him)\s+(?:at|on)\b/gi,
    /\b(?:let(?:'s| us)|everyone should)\s+(?:call|message|find|harass)\b/gi,
    /\b(?:make their life|teach them|they deserve)\b/gi,
    /\b(?:spam|flood|brigade)\s+(?:their|his|her|this)\b/gi,
  ],
};

/**
 * Patterns for specific information types
 */
const INFO_PATTERNS: Record<DoxxingType, RegExp[]> = {
  address_exposure: [
    // Street address patterns with third-party context
    /\b(?:lives|staying|found|located)\s+(?:at|in)\s+\d{1,5}\s+[A-Za-z]+\s+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard)\b/gi,
    /\b(?:their|his|her)\s+(?:address|home|house)\s+(?:is|:)\s*\d/gi,
    /\b(?:apartment|apt|unit)\s+(?:#|\d)\s*\d+\b/gi,
  ],

  phone_exposure: [
    // Phone number exposure
    /\b(?:their|his|her)\s+(?:phone|number|cell|mobile)\s+(?:is|:)/gi,
    /\b(?:call|text)\s+(?:them|her|him)\s+(?:at|on)\s+[\d\-\(\)\s]+/gi,
    /\b(?:here(?:'s| is))\s+(?:their|his|her)\s+(?:number|phone)/gi,
  ],

  workplace_exposure: [
    // Workplace exposure
    /\b(?:works|employed)\s+(?:at|for|with)\s+[A-Z][A-Za-z\s&]+(?:Inc|Corp|LLC|Company|Co)?\b/gi,
    /\b(?:their|his|her)\s+(?:job|workplace|employer|boss)\b/gi,
    /\b(?:get them|got them)\s+(?:fired|in trouble at work)\b/gi,
  ],

  school_exposure: [
    // School exposure
    /\b(?:goes to|attends|student at)\s+[A-Z][A-Za-z\s]+(?:School|High|Middle|Elementary|University|College)\b/gi,
    /\b(?:their|his|her)\s+(?:school|university|college|class)\b/gi,
  ],

  real_name_exposure: [
    // Real name exposure
    /\b(?:real name|actually named|true name|legal name)\s+(?:is|:)\s+[A-Z][a-z]+/gi,
    /\b(?:their|his|her)\s+(?:full name|real name)\s+(?:is|:)/gi,
    /\b(?:name is|named)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/gi,
  ],

  social_media_exposure: [
    // Social media account exposure
    /\b(?:their|his|her)\s+(?:instagram|twitter|facebook|tiktok|snapchat|discord|reddit)\s+(?:is|:)?\s*@?[A-Za-z0-9_]+/gi,
    /\b(?:found|here(?:'s| is))\s+(?:their|his|her)\s+(?:profile|account|page)\b/gi,
    /\b@[A-Za-z0-9_]+\s+(?:is|belongs to)\s+(?:them|her|him)\b/gi,
  ],

  family_info_exposure: [
    // Family information
    /\b(?:their|his|her)\s+(?:mom|dad|mother|father|parent|sibling|brother|sister|wife|husband|spouse|kid|child)\b/gi,
    /\b(?:family|parents)\s+(?:live|lives|located|stay)\s+(?:at|in)\b/gi,
  ],

  financial_info_exposure: [
    // Financial information
    /\b(?:their|his|her)\s+(?:bank|credit card|account number|ssn|social security)\b/gi,
    /\b(?:card number|account)\s+(?:is|:)\s*[\d\-\s]+/gi,
  ],

  call_to_action: [
    // Explicit calls to harass
    /\b(?:let(?:'s| us)|everyone)\s+(?:harass|attack|bully|spam|flood|dox|doxx)\b/gi,
    /\b(?:raid|brigade)\s+(?:their|his|her|this)\b/gi,
    /\b(?:make them pay|ruin their|destroy their)\b/gi,
  ],
};

/**
 * Detect doxxing attempts in text
 *
 * @param text - Text to analyze (should be pre-scrubbed for self-PII)
 * @returns Doxxing detection result
 */
export function detectDoxxing(text: string): DoxxingResult {
  const normalizedText = text.toLowerCase();
  const matches: string[] = [];
  const detectedTypes = new Set<DoxxingType>();
  let totalScore = 0;

  // First check for third-party context indicators
  let hasThirdPartyContext = false;
  for (const pattern of CONTEXT_PATTERNS.thirdParty) {
    pattern.lastIndex = 0;
    if (pattern.test(normalizedText)) {
      hasThirdPartyContext = true;
      break;
    }
  }

  // Check for call to action (harassment intent)
  let hasCallToAction = false;
  for (const pattern of CONTEXT_PATTERNS.callToAction) {
    pattern.lastIndex = 0;
    if (pattern.test(normalizedText)) {
      hasCallToAction = true;
      matches.push('[call_to_action]');
      detectedTypes.add('call_to_action');
      totalScore += 0.5;
      break;
    }
  }

  // Check each information type
  for (const [doxxType, patterns] of Object.entries(INFO_PATTERNS)) {
    const type = doxxType as DoxxingType;

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(normalizedText)) {
        matches.push(`[${type}]`);
        detectedTypes.add(type);

        // Higher score if third-party context or call to action present
        if (hasThirdPartyContext || hasCallToAction) {
          totalScore += 0.4;
        } else {
          totalScore += 0.2;
        }
        break; // Only count each type once
      }
    }
  }

  // Calculate confidence
  const confidence = Math.min(totalScore, 1.0);

  // Determine severity
  let severity: DoxxingSeverity = 'none';
  if (hasCallToAction && detectedTypes.size > 1) {
    severity = 'critical'; // Call to action + specific info = critical
  } else if (confidence >= 0.7 || hasCallToAction) {
    severity = 'high';
  } else if (confidence >= 0.4 && hasThirdPartyContext) {
    severity = 'medium';
  } else if (confidence >= 0.2) {
    severity = 'low';
  }

  const detected = severity !== 'none';

  // Estimate potential victims (simplified)
  const potentialVictims = hasThirdPartyContext ? 1 : 0;

  return {
    detected,
    severity,
    confidence,
    doxxingTypes: Array.from(detectedTypes),
    shouldBlock: severity === 'critical' || severity === 'high',
    shouldFlag: detected && !['critical', 'high'].includes(severity),
    potentialVictims,
    matches,
  };
}

/**
 * Quick check if text contains doxxing indicators
 */
export function containsDoxxing(text: string): boolean {
  const normalizedText = text.toLowerCase();

  // Check for call to action first (highest risk)
  for (const pattern of CONTEXT_PATTERNS.callToAction) {
    pattern.lastIndex = 0;
    if (pattern.test(normalizedText)) {
      return true;
    }
  }

  // Check for third-party context + info patterns
  let hasContext = false;
  for (const pattern of CONTEXT_PATTERNS.thirdParty) {
    pattern.lastIndex = 0;
    if (pattern.test(normalizedText)) {
      hasContext = true;
      break;
    }
  }

  if (hasContext) {
    for (const patterns of Object.values(INFO_PATTERNS)) {
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        if (pattern.test(normalizedText)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Get human-readable reason for doxxing detection
 */
export function getDoxxingReason(result: DoxxingResult): string {
  if (!result.detected) {
    return 'No doxxing detected';
  }

  const types = result.doxxingTypes.join(', ');
  const victims = result.potentialVictims > 0 ? ` (${result.potentialVictims} potential victim(s))` : '';
  return `Doxxing detected (${result.severity}): ${types}${victims}`;
}

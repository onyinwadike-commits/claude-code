/**
 * Hate Speech Classifier
 *
 * Detects hate speech, slurs, and discriminatory content.
 * Uses pattern matching and severity scoring.
 *
 * NOTE: This is a rule-based classifier. In production,
 * integrate with ML models like Perspective API or custom
 * fine-tuned transformers for better accuracy.
 */

/**
 * Categories of hate speech
 */
export type HateSpeechCategory =
  | 'racial'
  | 'religious'
  | 'gender'
  | 'sexual_orientation'
  | 'disability'
  | 'nationality'
  | 'general_hate';

/**
 * Severity levels for hate speech
 */
export type HateSeverity = 'none' | 'low' | 'medium' | 'high' | 'severe';

/**
 * Result of hate speech classification
 */
export interface HateSpeechResult {
  /** Whether hate speech was detected */
  detected: boolean;
  /** Overall severity level */
  severity: HateSeverity;
  /** Confidence score (0-1) */
  confidence: number;
  /** Categories detected */
  categories: HateSpeechCategory[];
  /** Should auto-block (severe cases) */
  shouldBlock: boolean;
  /** Should flag for human review */
  shouldFlag: boolean;
  /** Matched patterns (for audit, not displayed) */
  matches: string[];
}

/**
 * Hate speech patterns by category
 * NOTE: These are intentionally obfuscated/partial patterns
 * Real implementation should use comprehensive databases
 */
const HATE_PATTERNS: Record<HateSpeechCategory, { severe: RegExp[]; moderate: RegExp[]; mild: RegExp[] }> = {
  racial: {
    severe: [
      // Severe racial slurs (obfuscated - real impl would have full list)
      /\b(?:n[i1]gg(?:er|a)|k[i1]ke|sp[i1]c|ch[i1]nk|g[o0]{2}k)\b/gi,
    ],
    moderate: [
      /\b(?:colored people|those people)\s+(?:are|should|need to)\b/gi,
      /\b(?:go back to|return to)\s+(?:your country|where you came from)\b/gi,
    ],
    mild: [
      /\b(?:all)\s+(?:blacks|whites|asians|latinos)\s+(?:are)\b/gi,
    ],
  },
  religious: {
    severe: [
      /\b(?:kill|murder|exterminate)\s+(?:all)?\s*(?:muslims|jews|christians|hindus)\b/gi,
    ],
    moderate: [
      /\b(?:muslims|jews|christians)\s+(?:are|all)\s+(?:terrorists|evil|scum)\b/gi,
      /\b(?:death to)\s+(?:islam|jews|christians)\b/gi,
    ],
    mild: [
      /\b(?:those)\s+(?:muslims|jews|christians)\s+(?:always)\b/gi,
    ],
  },
  gender: {
    severe: [
      /\b(?:women|females)\s+(?:deserve to|should be)\s+(?:raped|beaten|killed)\b/gi,
      /\b(?:all women are)\s+(?:wh[o0]res|sl[u]ts|b[i1]tches)\b/gi,
    ],
    moderate: [
      /\b(?:women|men)\s+(?:are inferior|don't deserve|shouldn't have)\s+(?:rights|jobs|vote)\b/gi,
      /\b(?:females|women)\s+(?:belong in|should stay in)\s+(?:the kitchen|home)\b/gi,
    ],
    mild: [
      /\b(?:typical)\s+(?:woman|female|man|male)\b/gi,
    ],
  },
  sexual_orientation: {
    severe: [
      /\b(?:f[a4]gg?[o0]t|d[y]ke)\b/gi,
      /\b(?:kill|murder|hang)\s+(?:all)?\s*(?:gays|homosexuals|lgb?t)\b/gi,
    ],
    moderate: [
      /\b(?:gays|homosexuals|trans)\s+(?:are|is)\s+(?:disgusting|sick|disease|mental)\b/gi,
      /\b(?:being gay|homosexuality)\s+(?:is a)\s+(?:sin|disease|choice|mental illness)\b/gi,
    ],
    mild: [
      /\b(?:that's so)\s+(?:gay)\b/gi,
    ],
  },
  disability: {
    severe: [
      /\b(?:ret[a4]rd(?:ed)?|tard)\b/gi,
      /\b(?:disabled people)\s+(?:should be|deserve to)\s+(?:killed|dead|eliminated)\b/gi,
    ],
    moderate: [
      /\b(?:disabled|handicapped)\s+(?:people are)\s+(?:useless|burden|worthless)\b/gi,
    ],
    mild: [
      /\b(?:what are you)\s+(?:deaf|blind|stupid)\b/gi,
    ],
  },
  nationality: {
    severe: [
      /\b(?:kill|murder|bomb)\s+(?:all)?\s*(?:americans|mexicans|chinese|russians|arabs)\b/gi,
    ],
    moderate: [
      /\b(?:all)\s+(?:mexicans|chinese|muslims|americans)\s+(?:are|should be)\s+(?:criminals|deported|banned)\b/gi,
    ],
    mild: [
      /\b(?:typical)\s+(?:american|mexican|chinese|russian)\b/gi,
    ],
  },
  general_hate: {
    severe: [
      /\b(?:kill yourself|kys|go die)\b/gi,
      /\b(?:hope you|you should)\s+(?:die|get killed|kill yourself)\b/gi,
      /\b(?:subhuman|vermin|cockroach(?:es)?)\b/gi,
    ],
    moderate: [
      /\b(?:you're|you are)\s+(?:worthless|garbage|trash|scum)\b/gi,
      /\b(?:people like you)\s+(?:don't deserve|should be)\b/gi,
    ],
    mild: [
      /\b(?:shut up|stfu)\b/gi,
    ],
  },
};

/**
 * Severity weights for scoring
 */
const SEVERITY_WEIGHTS = {
  severe: 1.0,
  moderate: 0.6,
  mild: 0.3,
};

/**
 * Threshold scores for severity levels
 */
const SEVERITY_THRESHOLDS = {
  severe: 0.8,
  high: 0.6,
  medium: 0.4,
  low: 0.2,
};

/**
 * Classify text for hate speech
 *
 * @param text - Text to classify (should be pre-scrubbed)
 * @returns Classification result
 */
export function classifyHateSpeech(text: string): HateSpeechResult {
  const normalizedText = text.toLowerCase();
  const matches: string[] = [];
  const detectedCategories = new Set<HateSpeechCategory>();
  let totalScore = 0;
  let severeMatch = false;

  // Check each category
  for (const [category, patterns] of Object.entries(HATE_PATTERNS)) {
    const cat = category as HateSpeechCategory;

    // Check severe patterns
    for (const pattern of patterns.severe) {
      pattern.lastIndex = 0;
      const match = pattern.exec(normalizedText);
      if (match) {
        matches.push(`[${cat}:severe]`);
        detectedCategories.add(cat);
        totalScore += SEVERITY_WEIGHTS.severe;
        severeMatch = true;
      }
    }

    // Check moderate patterns
    for (const pattern of patterns.moderate) {
      pattern.lastIndex = 0;
      const match = pattern.exec(normalizedText);
      if (match) {
        matches.push(`[${cat}:moderate]`);
        detectedCategories.add(cat);
        totalScore += SEVERITY_WEIGHTS.moderate;
      }
    }

    // Check mild patterns
    for (const pattern of patterns.mild) {
      pattern.lastIndex = 0;
      const match = pattern.exec(normalizedText);
      if (match) {
        matches.push(`[${cat}:mild]`);
        detectedCategories.add(cat);
        totalScore += SEVERITY_WEIGHTS.mild;
      }
    }
  }

  // Calculate final score (capped at 1.0)
  const confidence = Math.min(totalScore, 1.0);

  // Determine severity level
  let severity: HateSeverity = 'none';
  if (confidence >= SEVERITY_THRESHOLDS.severe || severeMatch) {
    severity = 'severe';
  } else if (confidence >= SEVERITY_THRESHOLDS.high) {
    severity = 'high';
  } else if (confidence >= SEVERITY_THRESHOLDS.medium) {
    severity = 'medium';
  } else if (confidence >= SEVERITY_THRESHOLDS.low) {
    severity = 'low';
  }

  const detected = severity !== 'none';

  return {
    detected,
    severity,
    confidence,
    categories: Array.from(detectedCategories),
    shouldBlock: severity === 'severe',
    shouldFlag: detected && severity !== 'severe',
    matches,
  };
}

/**
 * Quick check if text likely contains hate speech
 * (faster than full classification)
 */
export function containsHateSpeech(text: string): boolean {
  const normalizedText = text.toLowerCase();

  for (const patterns of Object.values(HATE_PATTERNS)) {
    for (const pattern of [...patterns.severe, ...patterns.moderate]) {
      pattern.lastIndex = 0;
      if (pattern.test(normalizedText)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get human-readable reason for hate speech detection
 * (for moderation queue, not shown to users)
 */
export function getHateSpeechReason(result: HateSpeechResult): string {
  if (!result.detected) {
    return 'No hate speech detected';
  }

  const categories = result.categories.join(', ');
  return `Hate speech detected (${result.severity}): ${categories}`;
}

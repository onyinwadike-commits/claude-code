/**
 * Threat Detection Service
 *
 * Detects threats of violence, terrorism, and other dangerous content.
 * Prioritizes safety over false negatives.
 */

/**
 * Types of threats that can be detected
 */
export type ThreatType =
  | 'violence'
  | 'terrorism'
  | 'mass_violence'
  | 'targeted_threat'
  | 'weapon_mention'
  | 'bomb_threat'
  | 'stalking'
  | 'kidnapping';

/**
 * Threat severity levels
 */
export type ThreatSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Result of threat detection
 */
export interface ThreatDetectionResult {
  /** Whether a threat was detected */
  detected: boolean;
  /** Severity level */
  severity: ThreatSeverity;
  /** Confidence score (0-1) */
  confidence: number;
  /** Types of threats detected */
  threatTypes: ThreatType[];
  /** Should auto-block */
  shouldBlock: boolean;
  /** Should flag for human review */
  shouldFlag: boolean;
  /** Should escalate to authorities (critical threats) */
  shouldEscalate: boolean;
  /** Matched patterns (for audit) */
  matches: string[];
}

/**
 * Threat patterns by type and severity
 */
const THREAT_PATTERNS: Record<ThreatType, { critical: RegExp[]; high: RegExp[]; medium: RegExp[] }> = {
  violence: {
    critical: [
      /\b(?:i(?:'m| am) going to|i will|gonna)\s+(?:kill|murder|shoot|stab|attack)\s+(?:you|them|him|her|everyone)\b/gi,
      /\b(?:you(?:'re| are)|they(?:'re| are))\s+(?:going to|gonna)\s+(?:die|be killed|get hurt)\b/gi,
    ],
    high: [
      /\b(?:want to|planning to|thinking about)\s+(?:kill|murder|hurt|attack)\b/gi,
      /\b(?:beat|hurt|attack)\s+(?:you|them|her|him)\s+(?:badly|so bad)\b/gi,
    ],
    medium: [
      /\b(?:should|deserve to)\s+(?:die|be killed|get hurt)\b/gi,
      /\b(?:wish)\s+(?:you|they|he|she)\s+(?:were dead|would die)\b/gi,
    ],
  },
  terrorism: {
    critical: [
      /\b(?:bomb|blow up|attack)\s+(?:the|a)\s+(?:school|church|mosque|synagogue|building|airport|mall)\b/gi,
      /\b(?:join|support|pledge to)\s+(?:isis|al[- ]?qaeda|taliban|terrorist)\b/gi,
    ],
    high: [
      /\b(?:making|building|have)\s+(?:a|the)\s+(?:bomb|explosive|ied)\b/gi,
      /\b(?:jihad|holy war|infidels must die)\b/gi,
    ],
    medium: [
      /\b(?:terror(?:ist)?|extremist)\s+(?:attack|act)\b/gi,
    ],
  },
  mass_violence: {
    critical: [
      /\b(?:shoot up|attack|bomb)\s+(?:the|my|a)\s+(?:school|office|workplace|mall|concert|event)\b/gi,
      /\b(?:mass|school|workplace)\s+(?:shooting|attack|murder)\b/gi,
      /\b(?:kill|murder|shoot)\s+(?:everyone|as many|them all)\b/gi,
    ],
    high: [
      /\b(?:columbine|sandy hook|parkland)\s+(?:style|like|inspired)\b/gi,
      /\b(?:high score|body count|kill count)\b/gi,
    ],
    medium: [
      /\b(?:go postal|snap and)\s+(?:kill|attack|hurt)\b/gi,
    ],
  },
  targeted_threat: {
    critical: [
      /\b(?:i know where)\s+(?:you|they|he|she)\s+(?:live|work|go to school)\b/gi,
      /\b(?:coming for|find)\s+(?:you|them|your family)\b/gi,
    ],
    high: [
      /\b(?:watch your back|you(?:'re| are) dead|count your days)\b/gi,
      /\b(?:make you|watch you)\s+(?:suffer|pay|regret)\b/gi,
    ],
    medium: [
      /\b(?:you(?:'ll| will)|they(?:'ll| will))\s+(?:regret|pay for|be sorry)\b/gi,
    ],
  },
  weapon_mention: {
    critical: [
      /\b(?:have|got|bought)\s+(?:a|my)\s+(?:gun|rifle|ar-?15|ak-?47)\s+(?:ready|loaded|for)\b/gi,
    ],
    high: [
      /\b(?:bring|use)\s+(?:my|a|the)\s+(?:gun|knife|weapon)\s+(?:to|at|on)\b/gi,
    ],
    medium: [
      /\b(?:own|have)\s+(?:guns|weapons|firearms)\b/gi,
    ],
  },
  bomb_threat: {
    critical: [
      /\b(?:planted|placing|there(?:'s| is))\s+(?:a|the)\s+(?:bomb|explosive|device)\b/gi,
      /\b(?:bomb|explosive)\s+(?:at|in|inside)\s+(?:the|a)\b/gi,
    ],
    high: [
      /\b(?:making|building|assembling)\s+(?:a|an)\s+(?:bomb|explosive|pipe bomb|ied)\b/gi,
    ],
    medium: [
      /\b(?:blow up|detonate|explode)\b/gi,
    ],
  },
  stalking: {
    critical: [
      /\b(?:following|watching|tracking)\s+(?:you|her|him)\s+(?:every day|all the time|always)\b/gi,
      /\b(?:i know)\s+(?:your|their|his|her)\s+(?:schedule|routine|address|where)\b/gi,
    ],
    high: [
      /\b(?:can(?:'t| not) stop)\s+(?:thinking about|watching|following)\s+(?:you|her|him)\b/gi,
      /\b(?:outside|near)\s+(?:your|their|his|her)\s+(?:house|home|work|school)\b/gi,
    ],
    medium: [
      /\b(?:keeping tabs on|monitoring)\s+(?:you|her|him|them)\b/gi,
    ],
  },
  kidnapping: {
    critical: [
      /\b(?:going to|plan to|will)\s+(?:kidnap|abduct|take)\s+(?:you|her|him|them|the kid)\b/gi,
      /\b(?:grab|snatch|take)\s+(?:the|a|your)\s+(?:kid|child|children)\b/gi,
    ],
    high: [
      /\b(?:never see)\s+(?:your|the)\s+(?:kid|child|family)\s+(?:again)\b/gi,
    ],
    medium: [
      /\b(?:take|keep)\s+(?:you|them|her|him)\s+(?:hostage|captive)\b/gi,
    ],
  },
};

/**
 * Severity scores
 */
const SEVERITY_SCORES = {
  critical: 1.0,
  high: 0.7,
  medium: 0.4,
};

/**
 * Detect threats in text
 *
 * @param text - Text to analyze (should be pre-scrubbed)
 * @returns Threat detection result
 */
export function detectThreats(text: string): ThreatDetectionResult {
  const normalizedText = text.toLowerCase();
  const matches: string[] = [];
  const detectedTypes = new Set<ThreatType>();
  let totalScore = 0;
  let hasCritical = false;

  // Check each threat type
  for (const [threatType, patterns] of Object.entries(THREAT_PATTERNS)) {
    const type = threatType as ThreatType;

    // Check critical patterns
    for (const pattern of patterns.critical) {
      pattern.lastIndex = 0;
      if (pattern.test(normalizedText)) {
        matches.push(`[${type}:critical]`);
        detectedTypes.add(type);
        totalScore += SEVERITY_SCORES.critical;
        hasCritical = true;
      }
    }

    // Check high patterns
    for (const pattern of patterns.high) {
      pattern.lastIndex = 0;
      if (pattern.test(normalizedText)) {
        matches.push(`[${type}:high]`);
        detectedTypes.add(type);
        totalScore += SEVERITY_SCORES.high;
      }
    }

    // Check medium patterns
    for (const pattern of patterns.medium) {
      pattern.lastIndex = 0;
      if (pattern.test(normalizedText)) {
        matches.push(`[${type}:medium]`);
        detectedTypes.add(type);
        totalScore += SEVERITY_SCORES.medium;
      }
    }
  }

  // Calculate confidence (capped at 1.0)
  const confidence = Math.min(totalScore, 1.0);

  // Determine severity
  let severity: ThreatSeverity = 'none';
  if (hasCritical || confidence >= 0.9) {
    severity = 'critical';
  } else if (confidence >= 0.6) {
    severity = 'high';
  } else if (confidence >= 0.35) {
    severity = 'medium';
  } else if (confidence >= 0.15) {
    severity = 'low';
  }

  const detected = severity !== 'none';

  // Critical threats (mass violence, terrorism, bomb threats) should escalate
  const criticalTypes: ThreatType[] = ['mass_violence', 'terrorism', 'bomb_threat', 'kidnapping'];
  const hasCriticalType = Array.from(detectedTypes).some((t) => criticalTypes.includes(t));
  const shouldEscalate = severity === 'critical' && hasCriticalType;

  return {
    detected,
    severity,
    confidence,
    threatTypes: Array.from(detectedTypes),
    shouldBlock: severity === 'critical' || severity === 'high',
    shouldFlag: detected && !['critical', 'high'].includes(severity),
    shouldEscalate,
    matches,
  };
}

/**
 * Quick check if text contains threat indicators
 */
export function containsThreat(text: string): boolean {
  const normalizedText = text.toLowerCase();

  for (const patterns of Object.values(THREAT_PATTERNS)) {
    for (const pattern of [...patterns.critical, ...patterns.high]) {
      pattern.lastIndex = 0;
      if (pattern.test(normalizedText)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get human-readable reason for threat detection
 */
export function getThreatReason(result: ThreatDetectionResult): string {
  if (!result.detected) {
    return 'No threats detected';
  }

  const types = result.threatTypes.join(', ');
  const escalation = result.shouldEscalate ? ' [ESCALATE]' : '';
  return `Threat detected (${result.severity}): ${types}${escalation}`;
}

/**
 * Determine if threat requires immediate law enforcement notification
 * (Critical threats involving mass violence, terrorism, etc.)
 */
export function requiresLawEnforcement(result: ThreatDetectionResult): boolean {
  if (!result.shouldEscalate) return false;

  const immediateTypes: ThreatType[] = [
    'mass_violence',
    'terrorism',
    'bomb_threat',
    'kidnapping',
  ];

  return result.threatTypes.some((t) => immediateTypes.includes(t));
}

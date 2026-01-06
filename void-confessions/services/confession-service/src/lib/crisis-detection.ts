/**
 * Crisis Detection Module
 *
 * Detects indicators of crisis situations in confession content
 * and provides appropriate resources. This is a safety-critical module.
 */

export interface CrisisResource {
  name: string;
  description: string;
  phone?: string;
  text?: string;
  url?: string;
  available: string;
}

export interface CrisisDetectionResult {
  isCrisis: boolean;
  severity: 'none' | 'low' | 'medium' | 'high';
  indicators: string[];
  resources: CrisisResource[];
  message?: string;
}

/**
 * Crisis resources - these are real resources people can contact
 */
const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: 'National Suicide Prevention Lifeline',
    description: '24/7 free and confidential support for people in distress',
    phone: '988',
    url: 'https://988lifeline.org',
    available: '24/7',
  },
  {
    name: 'Crisis Text Line',
    description: 'Free 24/7 support via text message',
    text: 'HOME to 741741',
    url: 'https://www.crisistextline.org',
    available: '24/7',
  },
  {
    name: 'International Association for Suicide Prevention',
    description: 'Directory of crisis centers worldwide',
    url: 'https://www.iasp.info/resources/Crisis_Centres/',
    available: 'Varies by region',
  },
  {
    name: 'SAMHSA National Helpline',
    description: 'Treatment referral service for mental health and substance abuse',
    phone: '1-800-662-4357',
    url: 'https://www.samhsa.gov/find-help/national-helpline',
    available: '24/7, 365 days',
  },
];

/**
 * High-severity crisis indicators - immediate concern
 */
const HIGH_SEVERITY_PATTERNS = [
  /\b(want(ing)?|going|plan(ning)?|ready|decided) to (kill|end|hurt) (myself|my life|it all)\b/i,
  /\b(suicide|suicidal)\b/i,
  /\b(don'?t want to|can'?t) (live|be here|exist|go on) (anymore|any longer)\b/i,
  /\b(ending|end) (it|my life|everything|this)\b/i,
  /\b(kill(ing)? myself)\b/i,
  /\bwish i (was|were) dead\b/i,
  /\bwish i (wasn'?t|weren'?t) (alive|here|born)\b/i,
  /\b(goodbye|final) (everyone|world|letter|message)\b/i,
  /\bno (reason|point) (to|in) (living|life|going on)\b/i,
  /\b(better off|world.{0,20}better) (without me|if i.{0,10}(gone|dead|died))\b/i,
];

/**
 * Medium-severity indicators - concerning but not immediate
 */
const MEDIUM_SEVERITY_PATTERNS = [
  /\b(self[- ]?harm|cutting|hurting myself)\b/i,
  /\bwant(ing)? to (disappear|vanish)\b/i,
  /\bhopeless\b/i,
  /\bno hope\b/i,
  /\bcan'?t (take|handle|do) (it|this) (anymore|any more)\b/i,
  /\b(give up|giving up|given up)\b/i,
  /\bworthless\b/i,
  /\bno one (cares|would care|would notice)\b/i,
  /\b(everyone|they'?d be) better off\b/i,
  /\b(tired of|done with) (living|life|fighting|trying)\b/i,
];

/**
 * Low-severity indicators - may need support
 */
const LOW_SEVERITY_PATTERNS = [
  /\b(so|really|very) (depressed|sad|alone|lonely)\b/i,
  /\b(can'?t|don'?t) (cope|handle)\b/i,
  /\bfeeling (empty|numb|broken)\b/i,
  /\b(no one|nobody) understands\b/i,
  /\b(constant|always) (pain|suffering|hurting)\b/i,
];

/**
 * Detect crisis indicators in text content
 */
export function detectCrisis(content: string): CrisisDetectionResult {
  const indicators: string[] = [];
  let severity: CrisisDetectionResult['severity'] = 'none';

  // Normalize content for checking
  const normalizedContent = content.toLowerCase();

  // Check high severity patterns
  for (const pattern of HIGH_SEVERITY_PATTERNS) {
    if (pattern.test(normalizedContent)) {
      indicators.push('High-risk language detected');
      severity = 'high';
      break;
    }
  }

  // Check medium severity patterns if not already high
  if (severity !== 'high') {
    for (const pattern of MEDIUM_SEVERITY_PATTERNS) {
      if (pattern.test(normalizedContent)) {
        indicators.push('Concerning language detected');
        severity = 'medium';
        break;
      }
    }
  }

  // Check low severity patterns if not already medium or high
  if (severity === 'none') {
    for (const pattern of LOW_SEVERITY_PATTERNS) {
      if (pattern.test(normalizedContent)) {
        indicators.push('May be experiencing distress');
        severity = 'low';
        break;
      }
    }
  }

  // Determine if this is a crisis situation
  const isCrisis = severity === 'high' || severity === 'medium';

  // Build response
  const result: CrisisDetectionResult = {
    isCrisis,
    severity,
    indicators,
    resources: isCrisis ? CRISIS_RESOURCES : severity === 'low' ? CRISIS_RESOURCES.slice(0, 2) : [],
  };

  // Add appropriate message
  if (severity === 'high') {
    result.message =
      "It sounds like you're going through something really difficult. " +
      "Your life matters, and help is available right now. " +
      "Please consider reaching out to one of these resources.";
  } else if (severity === 'medium') {
    result.message =
      "It seems like you might be struggling. " +
      "You don't have to face this alone. " +
      "Here are some resources that might help.";
  } else if (severity === 'low') {
    result.message =
      "If you're going through a tough time, " +
      "know that support is available if you need it.";
  }

  return result;
}

/**
 * Get all crisis resources
 */
export function getCrisisResources(): CrisisResource[] {
  return CRISIS_RESOURCES;
}

/**
 * Check if content should be flagged for immediate review
 */
export function shouldFlagForReview(result: CrisisDetectionResult): boolean {
  return result.severity === 'high';
}

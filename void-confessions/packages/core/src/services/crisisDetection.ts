/**
 * Crisis Detection Service
 *
 * Detects crisis indicators in confession content.
 * When detected, confession is NOT posted and user receives crisis resources.
 *
 * IMPORTANT: This is a safety-critical feature.
 * - Keywords are checked against normalized (lowercase) content
 * - Detection errs on the side of caution
 * - NO confession content is logged, only intervention count
 */

import type {
  CrisisLocale,
  CrisisCategory,
  CrisisDetectionResult,
  CrisisResponse,
  LocaleCrisisResources,
  CrisisInterventionMetric,
} from '../types/crisis';

/**
 * Crisis keywords by category
 * These trigger intervention when found in content
 */
const CRISIS_KEYWORDS: Record<CrisisCategory, string[]> = {
  suicide: [
    'kill myself',
    'killing myself',
    'want to die',
    'wanna die',
    'end my life',
    'end it all',
    'take my own life',
    'suicidal',
    'suicide',
    'not worth living',
    'better off dead',
    'no reason to live',
    'can\'t go on',
    'cant go on',
    'ready to end it',
    'planning to end',
    'goodbye letter',
    'final goodbye',
    'won\'t be here tomorrow',
    'wont be here tomorrow',
    'last day',
    'jump off',
    'hang myself',
    'overdose',
    'slit my wrists',
    'cut my wrists',
  ],
  self_harm: [
    'cut myself',
    'cutting myself',
    'self harm',
    'self-harm',
    'selfharm',
    'hurt myself',
    'hurting myself',
    'burn myself',
    'burning myself',
    'scratch myself',
    'punish myself',
    'deserve pain',
    'harm myself',
    'harming myself',
    'bleed',
    'bleeding out',
  ],
  abuse: [
    'being abused',
    'abusing me',
    'hits me',
    'beats me',
    'molested',
    'sexually abused',
    'domestic violence',
    'partner hurts me',
    'afraid of my partner',
    'afraid to go home',
    'trapped at home',
  ],
  violence: [
    'kill someone',
    'hurt someone',
    'want to hurt',
    'going to hurt',
    'shoot up',
    'bomb',
    'attack people',
  ],
  eating_disorder: [
    'starving myself',
    'not eating',
    'haven\'t eaten',
    'binge and purge',
    'purging',
    'throwing up food',
    'anorexic',
    'bulimic',
    'hate my body',
    'too fat to live',
  ],
  substance_crisis: [
    'overdosing',
    'took too many pills',
    'too many drugs',
    'can\'t stop drinking',
    'cant stop drinking',
    'need help with addiction',
    'withdrawing badly',
    'withdrawal killing me',
  ],
};

/**
 * High severity phrases that indicate immediate risk
 */
const HIGH_SEVERITY_PHRASES = [
  'right now',
  'tonight',
  'today',
  'about to',
  'going to',
  'planning to',
  'decided to',
  'ready to',
  'have a plan',
  'wrote a note',
  'said goodbye',
  'gave away',
  'final',
  'last time',
];

/**
 * Crisis resources by locale
 */
const CRISIS_RESOURCES: Record<CrisisLocale, LocaleCrisisResources> = {
  US: {
    locale: 'US',
    localeName: 'United States',
    emergencyNumber: '911',
    resources: [
      {
        name: '988 Suicide & Crisis Lifeline',
        phone: '988',
        description: 'Free, confidential support for people in distress',
        available24x7: true,
        languages: ['English', 'Spanish'],
      },
      {
        name: 'Crisis Text Line',
        textLine: '741741',
        textKeyword: 'HELLO',
        website: 'https://www.crisistextline.org',
        description: 'Text-based crisis support',
        available24x7: true,
        languages: ['English'],
      },
      {
        name: 'SAMHSA National Helpline',
        phone: '1-800-662-4357',
        website: 'https://www.samhsa.gov/find-help/national-helpline',
        description: 'Substance abuse and mental health services',
        available24x7: true,
        languages: ['English', 'Spanish'],
      },
      {
        name: 'National Domestic Violence Hotline',
        phone: '1-800-799-7233',
        website: 'https://www.thehotline.org',
        description: 'Support for domestic violence survivors',
        available24x7: true,
        languages: ['English', 'Spanish'],
      },
    ],
  },
  UK: {
    locale: 'UK',
    localeName: 'United Kingdom',
    emergencyNumber: '999',
    resources: [
      {
        name: 'Samaritans',
        phone: '116 123',
        website: 'https://www.samaritans.org',
        description: 'Emotional support for anyone in distress',
        available24x7: true,
        languages: ['English', 'Welsh'],
      },
      {
        name: 'Shout',
        textLine: '85258',
        textKeyword: 'SHOUT',
        website: 'https://giveusashout.org',
        description: 'Text-based crisis support',
        available24x7: true,
        languages: ['English'],
      },
      {
        name: 'CALM (Campaign Against Living Miserably)',
        phone: '0800 58 58 58',
        website: 'https://www.thecalmzone.net',
        description: 'Support for men in crisis',
        available24x7: false,
        languages: ['English'],
      },
      {
        name: 'Papyrus HOPELINEUK',
        phone: '0800 068 4141',
        textLine: '07860 039967',
        website: 'https://www.papyrus-uk.org',
        description: 'Support for young people under 35',
        available24x7: false,
        languages: ['English'],
      },
    ],
  },
  CA: {
    locale: 'CA',
    localeName: 'Canada',
    emergencyNumber: '911',
    resources: [
      {
        name: 'Talk Suicide Canada',
        phone: '1-833-456-4566',
        textLine: '45645',
        website: 'https://talksuicide.ca',
        description: 'National suicide prevention service',
        available24x7: true,
        languages: ['English', 'French'],
      },
      {
        name: 'Crisis Services Canada',
        phone: '1-833-456-4566',
        website: 'https://www.crisisservicescanada.ca',
        description: 'Crisis intervention and support',
        available24x7: true,
        languages: ['English', 'French'],
      },
      {
        name: 'Kids Help Phone',
        phone: '1-800-668-6868',
        textLine: '686868',
        website: 'https://kidshelpphone.ca',
        description: 'Support for young people',
        available24x7: true,
        languages: ['English', 'French'],
      },
    ],
  },
  AU: {
    locale: 'AU',
    localeName: 'Australia',
    emergencyNumber: '000',
    resources: [
      {
        name: 'Lifeline Australia',
        phone: '13 11 14',
        textLine: '0477 13 11 14',
        website: 'https://www.lifeline.org.au',
        description: 'Crisis support and suicide prevention',
        available24x7: true,
        languages: ['English'],
      },
      {
        name: 'Beyond Blue',
        phone: '1300 22 4636',
        website: 'https://www.beyondblue.org.au',
        description: 'Anxiety and depression support',
        available24x7: true,
        languages: ['English'],
      },
      {
        name: 'Kids Helpline',
        phone: '1800 55 1800',
        website: 'https://kidshelpline.com.au',
        description: 'Support for young people 5-25',
        available24x7: true,
        languages: ['English'],
      },
    ],
  },
  NZ: {
    locale: 'NZ',
    localeName: 'New Zealand',
    emergencyNumber: '111',
    resources: [
      {
        name: 'Lifeline New Zealand',
        phone: '0800 543 354',
        textLine: '4357',
        textKeyword: 'HELP',
        website: 'https://www.lifeline.org.nz',
        description: 'Crisis support and counselling',
        available24x7: true,
        languages: ['English'],
      },
      {
        name: 'Youthline',
        phone: '0800 376 633',
        textLine: '234',
        website: 'https://www.youthline.co.nz',
        description: 'Support for young people',
        available24x7: true,
        languages: ['English'],
      },
    ],
  },
  IE: {
    locale: 'IE',
    localeName: 'Ireland',
    emergencyNumber: '999 / 112',
    resources: [
      {
        name: 'Samaritans Ireland',
        phone: '116 123',
        website: 'https://www.samaritans.org/ireland',
        description: 'Emotional support for anyone in distress',
        available24x7: true,
        languages: ['English', 'Irish'],
      },
      {
        name: 'Pieta House',
        phone: '1800 247 247',
        website: 'https://www.pieta.ie',
        description: 'Suicide and self-harm crisis support',
        available24x7: true,
        languages: ['English'],
      },
    ],
  },
  DE: {
    locale: 'DE',
    localeName: 'Germany',
    emergencyNumber: '112',
    resources: [
      {
        name: 'Telefonseelsorge',
        phone: '0800 111 0 111',
        website: 'https://www.telefonseelsorge.de',
        description: 'Crisis counselling and support',
        available24x7: true,
        languages: ['German'],
      },
      {
        name: 'Nummer gegen Kummer',
        phone: '116 111',
        website: 'https://www.nummergegenkummer.de',
        description: 'Support for children and young people',
        available24x7: false,
        languages: ['German'],
      },
    ],
  },
  FR: {
    locale: 'FR',
    localeName: 'France',
    emergencyNumber: '112 / 15',
    resources: [
      {
        name: 'SOS Amitié',
        phone: '09 72 39 40 50',
        website: 'https://www.sos-amitie.com',
        description: 'Listening and emotional support',
        available24x7: true,
        languages: ['French'],
      },
      {
        name: 'Fil Santé Jeunes',
        phone: '0 800 235 236',
        website: 'https://www.filsantejeunes.com',
        description: 'Health support for young people',
        available24x7: false,
        languages: ['French'],
      },
    ],
  },
  ES: {
    locale: 'ES',
    localeName: 'Spain',
    emergencyNumber: '112',
    resources: [
      {
        name: 'Teléfono de la Esperanza',
        phone: '717 003 717',
        website: 'https://www.telefonodelaesperanza.org',
        description: 'Crisis support hotline',
        available24x7: true,
        languages: ['Spanish'],
      },
    ],
  },
  IT: {
    locale: 'IT',
    localeName: 'Italy',
    emergencyNumber: '112',
    resources: [
      {
        name: 'Telefono Amico',
        phone: '02 2327 2327',
        website: 'https://www.telefonoamico.it',
        description: 'Listening and emotional support',
        available24x7: true,
        languages: ['Italian'],
      },
    ],
  },
  NL: {
    locale: 'NL',
    localeName: 'Netherlands',
    emergencyNumber: '112',
    resources: [
      {
        name: '113 Zelfmoordpreventie',
        phone: '113',
        website: 'https://www.113.nl',
        description: 'Suicide prevention hotline',
        available24x7: true,
        languages: ['Dutch'],
      },
    ],
  },
  BE: {
    locale: 'BE',
    localeName: 'Belgium',
    emergencyNumber: '112',
    resources: [
      {
        name: 'Centre de Prévention du Suicide',
        phone: '0800 32 123',
        website: 'https://www.preventionsuicide.be',
        description: 'Suicide prevention center',
        available24x7: true,
        languages: ['French', 'Dutch'],
      },
    ],
  },
  IN: {
    locale: 'IN',
    localeName: 'India',
    emergencyNumber: '112',
    resources: [
      {
        name: 'iCall',
        phone: '9152987821',
        website: 'https://icallhelpline.org',
        description: 'Psychosocial helpline',
        available24x7: false,
        languages: ['English', 'Hindi'],
      },
      {
        name: 'Vandrevala Foundation',
        phone: '1860-2662-345',
        website: 'https://www.vandrevalafoundation.com',
        description: 'Mental health support',
        available24x7: true,
        languages: ['English', 'Hindi'],
      },
    ],
  },
  JP: {
    locale: 'JP',
    localeName: 'Japan',
    emergencyNumber: '119',
    resources: [
      {
        name: 'TELL Lifeline',
        phone: '03-5774-0992',
        website: 'https://telljp.com',
        description: 'Crisis support in English',
        available24x7: false,
        languages: ['English', 'Japanese'],
      },
      {
        name: 'Inochi no Denwa',
        phone: '0120-783-556',
        website: 'https://www.inochinodenwa.org',
        description: 'Suicide prevention hotline',
        available24x7: true,
        languages: ['Japanese'],
      },
    ],
  },
  KR: {
    locale: 'KR',
    localeName: 'South Korea',
    emergencyNumber: '119',
    resources: [
      {
        name: 'Korea Suicide Prevention Center',
        phone: '1393',
        website: 'https://www.spckorea.or.kr',
        description: 'National suicide prevention hotline',
        available24x7: true,
        languages: ['Korean'],
      },
    ],
  },
  BR: {
    locale: 'BR',
    localeName: 'Brazil',
    emergencyNumber: '192',
    resources: [
      {
        name: 'CVV (Centro de Valorização da Vida)',
        phone: '188',
        website: 'https://www.cvv.org.br',
        description: 'Emotional support and suicide prevention',
        available24x7: true,
        languages: ['Portuguese'],
      },
    ],
  },
  MX: {
    locale: 'MX',
    localeName: 'Mexico',
    emergencyNumber: '911',
    resources: [
      {
        name: 'SAPTEL',
        phone: '55 5259-8121',
        website: 'https://www.saptel.org.mx',
        description: 'Crisis intervention hotline',
        available24x7: true,
        languages: ['Spanish'],
      },
    ],
  },
  INTL: {
    locale: 'INTL',
    localeName: 'International',
    resources: [
      {
        name: 'International Association for Suicide Prevention',
        website: 'https://www.iasp.info/resources/Crisis_Centres/',
        description: 'Find crisis centers worldwide',
        available24x7: true,
        languages: ['Multiple'],
      },
      {
        name: 'Befrienders Worldwide',
        website: 'https://www.befrienders.org',
        description: 'Global emotional support network',
        available24x7: true,
        languages: ['Multiple'],
      },
    ],
  },
};

/**
 * Normalize text for keyword matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'") // Normalize apostrophes
    .replace(/[""]/g, '"') // Normalize quotes
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim();
}

/**
 * Check if any keywords from a category are present in the text
 */
function checkCategory(
  normalizedText: string,
  category: CrisisCategory
): boolean {
  const keywords = CRISIS_KEYWORDS[category];
  return keywords.some((keyword) => normalizedText.includes(keyword));
}

/**
 * Determine severity based on content
 */
function determineSeverity(
  normalizedText: string,
  category: CrisisCategory
): 'low' | 'medium' | 'high' | 'critical' {
  // Check for immediate risk phrases
  const hasHighSeverityPhrase = HIGH_SEVERITY_PHRASES.some((phrase) =>
    normalizedText.includes(phrase)
  );

  // Suicide + immediate risk = critical
  if (category === 'suicide' && hasHighSeverityPhrase) {
    return 'critical';
  }

  // Violence = high
  if (category === 'violence') {
    return 'high';
  }

  // Suicide without immediate risk = high
  if (category === 'suicide') {
    return 'high';
  }

  // Self-harm with immediate phrases = high
  if (category === 'self_harm' && hasHighSeverityPhrase) {
    return 'high';
  }

  // Self-harm = medium
  if (category === 'self_harm') {
    return 'medium';
  }

  // Abuse = medium
  if (category === 'abuse') {
    return 'medium';
  }

  // Default = low
  return 'low';
}

/**
 * Get crisis resources for a locale
 * Falls back to INTL if locale not supported
 */
export function getCrisisResources(locale: CrisisLocale): LocaleCrisisResources {
  return CRISIS_RESOURCES[locale] || CRISIS_RESOURCES.INTL;
}

/**
 * Get all supported locales
 */
export function getSupportedCrisisLocales(): CrisisLocale[] {
  return Object.keys(CRISIS_RESOURCES) as CrisisLocale[];
}

/**
 * Detect if content contains crisis indicators
 *
 * @param content - The confession content to check
 * @param locale - User's locale for resources
 * @returns Detection result with resources if detected
 */
export function detectCrisis(
  content: string,
  locale: CrisisLocale = 'INTL'
): CrisisDetectionResult {
  const normalizedText = normalizeText(content);

  // Check each category
  const categories: CrisisCategory[] = [
    'suicide',
    'self_harm',
    'violence',
    'abuse',
    'eating_disorder',
    'substance_crisis',
  ];

  for (const category of categories) {
    if (checkCategory(normalizedText, category)) {
      const severity = determineSeverity(normalizedText, category);
      const resources = getCrisisResources(locale);

      return {
        detected: true,
        severity,
        category,
        resources,
        detectedAt: Date.now(),
      };
    }
  }

  return { detected: false };
}

/**
 * Create a crisis response to send to the client
 * This is returned instead of posting the confession
 */
export function createCrisisResponse(
  locale: CrisisLocale = 'INTL'
): CrisisResponse {
  const resources = getCrisisResources(locale);

  return {
    crisisDetected: true,
    message: "We noticed you might be going through a difficult time.",
    resources,
    showGetHelp: true,
    supportMessage:
      "Your feelings are valid, and support is available. Please reach out to one of these resources - they're here to help, and the conversation is confidential.",
  };
}

/**
 * Create an intervention metric for logging
 * NO confession content is included - only metadata
 */
export function createInterventionMetric(
  result: CrisisDetectionResult,
  locale: CrisisLocale
): CrisisInterventionMetric | null {
  if (!result.detected || !result.category || !result.severity) {
    return null;
  }

  return {
    timestamp: result.detectedAt || Date.now(),
    locale,
    category: result.category,
    severity: result.severity,
    resourcesShown: true,
  };
}

/**
 * Log intervention metric (no content)
 * In production, this would send to analytics
 */
export function logInterventionMetric(metric: CrisisInterventionMetric): void {
  // In production: send to secure analytics endpoint
  // This logs ONLY the metric, never the confession content
  console.log('[CRISIS_INTERVENTION]', {
    timestamp: new Date(metric.timestamp).toISOString(),
    locale: metric.locale,
    category: metric.category,
    severity: metric.severity,
    resourcesShown: metric.resourcesShown,
  });
}

/**
 * Process confession for crisis detection
 * Main entry point for the confession service
 *
 * @param content - Confession content
 * @param locale - User's locale
 * @returns Crisis response if detected, null if safe to post
 */
export function processConfessionForCrisis(
  content: string,
  locale: CrisisLocale = 'INTL'
): CrisisResponse | null {
  const result = detectCrisis(content, locale);

  if (result.detected) {
    // Log intervention (no content)
    const metric = createInterventionMetric(result, locale);
    if (metric) {
      logInterventionMetric(metric);
    }

    // Return crisis response instead of posting
    return createCrisisResponse(locale);
  }

  // Safe to post
  return null;
}

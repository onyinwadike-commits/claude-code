/**
 * Confidant AI Service
 *
 * Provides compassionate reflections after confession release.
 * Uses a local/private AI endpoint for privacy - confession content
 * is never stored or logged.
 *
 * This is a Void Walker+ feature.
 */

import type { VoidType } from '@void-confessions/core';

// Local AI endpoint (can be configured to use on-device model or private server)
const CONFIDANT_ENDPOINT = process.env.CONFIDANT_API_URL || 'http://localhost:3003/confidant';

/**
 * Response from the Confidant AI
 */
export interface ConfidantResponse {
  reflection: string;
  voidType: VoidType;
  timestamp: number;
}

/**
 * Fallback reflections organized by void type
 * Used when the AI endpoint is unavailable
 */
const FALLBACK_REFLECTIONS: Record<VoidType, string[]> = {
  grief: [
    'It sounds like you\'re carrying something heavy. Releasing it took courage.',
    'Loss leaves marks that time shapes but never fully erases. You\'re not alone in this.',
    'Whatever you\'re mourning, know that grief is love with nowhere to go.',
    'The weight you carry speaks to how deeply you\'ve loved. That matters.',
    'Some things are too big to hold alone. Letting it out was the right thing to do.',
  ],
  rage: [
    'Anger often protects us from deeper pain. Your feelings are valid.',
    'There\'s power in acknowledging what makes you burn. You\'ve taken a brave step.',
    'Whatever sparked this fire in you deserves to be heard, even by the void.',
    'Rage can be righteous. What you feel matters, even if the world says otherwise.',
    'Releasing this heat took strength. The void can hold what others cannot.',
  ],
  guilt: [
    'Whatever brought you here, know that your feelings are valid.',
    'The fact that you feel this weight shows the depth of your conscience.',
    'You carry this burden because you care. That speaks to who you are.',
    'Mistakes don\'t define you. The courage to face them does.',
    'Self-forgiveness is a journey. This release is a step on that path.',
  ],
  longing: [
    'What we yearn for says everything about what we value most.',
    'The ache of wanting reminds us we\'re capable of deep feeling.',
    'Distance—whether in space or time—doesn\'t diminish what matters to you.',
    'Longing is painful because connection is precious. Both are true.',
    'Whatever you\'re reaching for, the void has witnessed your desire.',
  ],
  relief: [
    'Letting go creates space for something new. You\'ve done important work.',
    'Relief often comes when we finally allow ourselves to feel.',
    'Whatever burden you\'ve released, you don\'t have to pick it back up.',
    'Breathing easier is its own kind of healing. Honor that.',
    'The lightness you feel is yours to keep. You\'ve earned this release.',
  ],
};

/**
 * Void-specific context for generating reflections
 */
const VOID_CONTEXT: Record<VoidType, string> = {
  grief: 'experiencing loss, mourning, or sadness',
  rage: 'feeling angry, frustrated, or powerless',
  guilt: 'carrying regret, shame, or remorse',
  longing: 'yearning for something or someone',
  relief: 'letting go of a burden or finding peace',
};

/**
 * Generate a compassionate reflection for a confession
 *
 * Privacy guarantee: The confession content is sent to the AI endpoint
 * but is never stored, logged, or persisted in any way. The endpoint
 * processes the emotional tone without retaining the actual content.
 *
 * @param confessionTone - Brief emotional context (NOT the confession itself)
 * @param voidType - The type of void the confession was released into
 * @returns A compassionate reflection
 */
export async function generateReflection(
  confessionTone: 'heavy' | 'raw' | 'conflicted' | 'tender' | 'released',
  voidType: VoidType
): Promise<ConfidantResponse> {
  const timestamp = Date.now();

  try {
    const response = await fetch(CONFIDANT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tone: confessionTone,
        voidType,
        context: VOID_CONTEXT[voidType],
        // Important: We only send the emotional tone, NOT the confession content
      }),
      // Short timeout - if AI is slow, use fallback
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Confidant API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      reflection: data.reflection,
      voidType,
      timestamp,
    };
  } catch (error) {
    console.log('[Confidant] Using fallback reflection:', error);
    return getFallbackReflection(voidType, timestamp);
  }
}

/**
 * Get a random fallback reflection for a void type
 */
function getFallbackReflection(voidType: VoidType, timestamp: number): ConfidantResponse {
  const reflections = FALLBACK_REFLECTIONS[voidType];
  const randomIndex = Math.floor(Math.random() * reflections.length);

  return {
    reflection: reflections[randomIndex],
    voidType,
    timestamp,
  };
}

/**
 * Analyze confession content locally to determine emotional tone
 * This runs entirely on-device - nothing is sent anywhere
 */
export function analyzeConfessionTone(
  content: string,
  voidType: VoidType
): 'heavy' | 'raw' | 'conflicted' | 'tender' | 'released' {
  const lowerContent = content.toLowerCase();

  // Simple keyword-based analysis (runs locally)
  const heavyKeywords = ['death', 'died', 'lost', 'gone', 'never', 'forever', 'end'];
  const rawKeywords = ['hate', 'angry', 'furious', 'scream', 'hurt', 'pain', 'rage'];
  const conflictedKeywords = ['but', 'however', 'should', 'wrong', 'right', 'confused', 'torn'];
  const tenderKeywords = ['love', 'miss', 'wish', 'hope', 'want', 'dream', 'need'];

  let heavyScore = heavyKeywords.filter((k) => lowerContent.includes(k)).length;
  let rawScore = rawKeywords.filter((k) => lowerContent.includes(k)).length;
  let conflictedScore = conflictedKeywords.filter((k) => lowerContent.includes(k)).length;
  let tenderScore = tenderKeywords.filter((k) => lowerContent.includes(k)).length;

  // Void type influences the interpretation
  switch (voidType) {
    case 'grief':
      heavyScore += 2;
      break;
    case 'rage':
      rawScore += 2;
      break;
    case 'guilt':
      conflictedScore += 2;
      break;
    case 'longing':
      tenderScore += 2;
      break;
    case 'relief':
      // Relief tends toward release
      return 'released';
  }

  // Determine dominant tone
  const scores = [
    { tone: 'heavy' as const, score: heavyScore },
    { tone: 'raw' as const, score: rawScore },
    { tone: 'conflicted' as const, score: conflictedScore },
    { tone: 'tender' as const, score: tenderScore },
  ];

  scores.sort((a, b) => b.score - a.score);

  // If no clear winner, default to 'heavy'
  if (scores[0].score === 0) {
    return 'heavy';
  }

  return scores[0].tone;
}

/**
 * Generate a complete reflection for a confession
 * Analyzes tone locally, then gets AI reflection
 */
export async function getConfidantReflection(
  confessionContent: string,
  voidType: VoidType
): Promise<ConfidantResponse> {
  // Step 1: Analyze tone locally (never sends content)
  const tone = analyzeConfessionTone(confessionContent, voidType);

  // Step 2: Get reflection (only sends tone, not content)
  return generateReflection(tone, voidType);
}

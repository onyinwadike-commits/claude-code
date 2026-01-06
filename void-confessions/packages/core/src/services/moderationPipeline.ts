/**
 * Automated Moderation Pipeline
 *
 * Combines all moderation filters into a single pipeline.
 * Processes text in order:
 * 1. Scrub PII from text
 * 2. Run hate speech classifier
 * 3. Run threat detector
 * 4. Run doxxing detector
 * 5. Determine final action (block, flag, approve)
 *
 * All processing happens on scrubbed text only.
 */

import { scrubText, deepScrub, type ScrubResult } from './textScrubber';
import {
  classifyHateSpeech,
  getHateSpeechReason,
  type HateSpeechResult,
} from './hateSpeechClassifier';
import {
  detectThreats,
  getThreatReason,
  requiresLawEnforcement,
  type ThreatDetectionResult,
} from './threatDetector';
import {
  detectDoxxing,
  getDoxxingReason,
  type DoxxingResult,
} from './doxxingDetector';

/**
 * Overall moderation decision
 */
export type ModerationDecision = 'approve' | 'flag' | 'block' | 'escalate';

/**
 * Reason category for moderation
 */
export type ModerationReasonCategory =
  | 'clean'
  | 'pii_detected'
  | 'hate_speech'
  | 'threat'
  | 'doxxing'
  | 'multiple_violations';

/**
 * Full moderation result
 */
export interface ModerationResult {
  /** Final decision */
  decision: ModerationDecision;
  /** Primary reason category */
  reasonCategory: ModerationReasonCategory;
  /** Human-readable reason (for moderators) */
  reason: string;
  /** Overall confidence (0-1) */
  confidence: number;

  /** PII scrubbing result */
  scrubResult: ScrubResult;
  /** Text that was analyzed (scrubbed) */
  analyzedText: string;

  /** Individual classifier results */
  hateSpeech: HateSpeechResult;
  threats: ThreatDetectionResult;
  doxxing: DoxxingResult;

  /** Whether law enforcement should be notified */
  requiresLawEnforcement: boolean;

  /** Processing timestamp */
  processedAt: number;
  /** Processing duration (ms) */
  processingTime: number;
}

/**
 * Moderation metrics (no content, for analytics)
 */
export interface ModerationMetrics {
  timestamp: number;
  decision: ModerationDecision;
  reasonCategory: ModerationReasonCategory;
  piiFound: boolean;
  piiTypes: string[];
  hateSpeechSeverity: string;
  threatSeverity: string;
  doxxingSeverity: string;
  processingTime: number;
}

/**
 * Pipeline configuration options
 */
export interface ModerationConfig {
  /** Use deep scrubbing (more aggressive PII removal) */
  useDeepScrub?: boolean;
  /** Auto-block on any PII detection */
  strictPII?: boolean;
  /** Lower threshold for flagging (more sensitive) */
  sensitiveMode?: boolean;
}

const DEFAULT_CONFIG: ModerationConfig = {
  useDeepScrub: true,
  strictPII: false,
  sensitiveMode: false,
};

/**
 * Run the full moderation pipeline
 *
 * @param text - Raw confession text
 * @param config - Optional configuration
 * @returns Full moderation result
 */
export function moderateContent(
  text: string,
  config: ModerationConfig = DEFAULT_CONFIG
): ModerationResult {
  const startTime = Date.now();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Step 1: Scrub PII
  const scrubResult = mergedConfig.useDeepScrub ? deepScrub(text) : scrubText(text);
  const analyzedText = scrubResult.scrubbed;

  // Step 2: Run all classifiers on scrubbed text
  const hateSpeech = classifyHateSpeech(analyzedText);
  const threats = detectThreats(analyzedText);
  const doxxing = detectDoxxing(analyzedText);

  // Step 3: Determine decision
  let decision: ModerationDecision = 'approve';
  let reasonCategory: ModerationReasonCategory = 'clean';
  const reasons: string[] = [];

  // Check for law enforcement escalation first
  const lawEnforcementRequired = requiresLawEnforcement(threats);
  if (lawEnforcementRequired) {
    decision = 'escalate';
    reasonCategory = 'threat';
    reasons.push(getThreatReason(threats));
  }

  // Check threats (highest priority after law enforcement)
  if (threats.shouldBlock) {
    decision = decision === 'escalate' ? 'escalate' : 'block';
    if (reasonCategory === 'clean') reasonCategory = 'threat';
    reasons.push(getThreatReason(threats));
  } else if (threats.shouldFlag && decision === 'approve') {
    decision = 'flag';
    reasonCategory = 'threat';
    reasons.push(getThreatReason(threats));
  }

  // Check hate speech
  if (hateSpeech.shouldBlock) {
    if (decision !== 'escalate') decision = 'block';
    if (reasonCategory === 'clean') reasonCategory = 'hate_speech';
    reasons.push(getHateSpeechReason(hateSpeech));
  } else if (hateSpeech.shouldFlag && decision === 'approve') {
    decision = 'flag';
    reasonCategory = 'hate_speech';
    reasons.push(getHateSpeechReason(hateSpeech));
  }

  // Check doxxing
  if (doxxing.shouldBlock) {
    if (decision !== 'escalate') decision = 'block';
    if (reasonCategory === 'clean') reasonCategory = 'doxxing';
    reasons.push(getDoxxingReason(doxxing));
  } else if (doxxing.shouldFlag && decision === 'approve') {
    decision = 'flag';
    reasonCategory = 'doxxing';
    reasons.push(getDoxxingReason(doxxing));
  }

  // Check PII (if strict mode)
  if (mergedConfig.strictPII && scrubResult.hasPII) {
    if (decision === 'approve') {
      decision = 'flag';
      reasonCategory = 'pii_detected';
      reasons.push(`PII detected: ${Object.keys(scrubResult.piiCounts).join(', ')}`);
    }
  }

  // Multiple violations
  const violationCount = [
    hateSpeech.detected,
    threats.detected,
    doxxing.detected,
  ].filter(Boolean).length;

  if (violationCount > 1) {
    reasonCategory = 'multiple_violations';
  }

  // Calculate overall confidence
  const confidence = Math.max(
    hateSpeech.confidence,
    threats.confidence,
    doxxing.confidence
  );

  // Build reason string
  const reason = reasons.length > 0
    ? reasons.join('; ')
    : 'Content passed all moderation checks';

  const processingTime = Date.now() - startTime;

  return {
    decision,
    reasonCategory,
    reason,
    confidence,
    scrubResult,
    analyzedText,
    hateSpeech,
    threats,
    doxxing,
    requiresLawEnforcement: lawEnforcementRequired,
    processedAt: Date.now(),
    processingTime,
  };
}

/**
 * Quick moderation check (faster, less detailed)
 * Use for real-time feedback while typing
 */
export function quickModerateCheck(text: string): {
  likely: 'clean' | 'warning' | 'violation';
  reason?: string;
} {
  // Minimal scrubbing for speed
  const scrubbed = scrubText(text).scrubbed;

  // Quick checks only
  const hateSpeech = classifyHateSpeech(scrubbed);
  const threats = detectThreats(scrubbed);

  if (hateSpeech.shouldBlock || threats.shouldBlock) {
    return {
      likely: 'violation',
      reason: 'Content may violate community guidelines',
    };
  }

  if (hateSpeech.shouldFlag || threats.shouldFlag) {
    return {
      likely: 'warning',
      reason: 'Content may require review',
    };
  }

  return { likely: 'clean' };
}

/**
 * Create metrics object from moderation result (no content)
 */
export function createModerationMetrics(result: ModerationResult): ModerationMetrics {
  return {
    timestamp: result.processedAt,
    decision: result.decision,
    reasonCategory: result.reasonCategory,
    piiFound: result.scrubResult.hasPII,
    piiTypes: Object.keys(result.scrubResult.piiCounts),
    hateSpeechSeverity: result.hateSpeech.severity,
    threatSeverity: result.threats.severity,
    doxxingSeverity: result.doxxing.severity,
    processingTime: result.processingTime,
  };
}

/**
 * Log moderation metrics (no content)
 */
export function logModerationMetrics(metrics: ModerationMetrics): void {
  // In production: send to secure analytics endpoint
  console.log('[MODERATION]', {
    timestamp: new Date(metrics.timestamp).toISOString(),
    decision: metrics.decision,
    reason: metrics.reasonCategory,
    processingTime: `${metrics.processingTime}ms`,
  });
}

/**
 * Process confession through moderation pipeline
 * Main entry point for confession service integration
 *
 * @param text - Raw confession text
 * @param config - Optional configuration
 * @returns Moderation result with decision
 */
export function processConfessionModeration(
  text: string,
  config?: ModerationConfig
): ModerationResult {
  const result = moderateContent(text, config);

  // Log metrics (no content)
  const metrics = createModerationMetrics(result);
  logModerationMetrics(metrics);

  return result;
}

/**
 * Check if content should be allowed into stream
 */
export function shouldAllowContent(result: ModerationResult): boolean {
  return result.decision === 'approve';
}

/**
 * Check if content needs human review
 */
export function needsHumanReview(result: ModerationResult): boolean {
  return result.decision === 'flag';
}

/**
 * Check if content should be blocked
 */
export function shouldBlockContent(result: ModerationResult): boolean {
  return result.decision === 'block' || result.decision === 'escalate';
}

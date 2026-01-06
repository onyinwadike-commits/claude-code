/**
 * Crisis Detection Types
 *
 * Types for crisis intervention system.
 * This feature is critical for user safety.
 */

/**
 * Supported locales for crisis resources
 */
export type CrisisLocale =
  | 'US'
  | 'UK'
  | 'CA'
  | 'AU'
  | 'NZ'
  | 'IE'
  | 'DE'
  | 'FR'
  | 'ES'
  | 'IT'
  | 'NL'
  | 'BE'
  | 'IN'
  | 'JP'
  | 'KR'
  | 'BR'
  | 'MX'
  | 'INTL'; // International fallback

/**
 * A single crisis resource/hotline
 */
export interface CrisisResource {
  /** Name of the organization */
  name: string;
  /** Phone number (if available) */
  phone?: string;
  /** Text line number (if available) */
  textLine?: string;
  /** Text keyword to send */
  textKeyword?: string;
  /** Website URL */
  website?: string;
  /** Brief description */
  description: string;
  /** Is this available 24/7 */
  available24x7: boolean;
  /** Supported languages */
  languages: string[];
}

/**
 * Crisis resources for a specific locale
 */
export interface LocaleCrisisResources {
  locale: CrisisLocale;
  localeName: string;
  resources: CrisisResource[];
  emergencyNumber?: string;
}

/**
 * Result of crisis detection check
 */
export interface CrisisDetectionResult {
  /** Whether crisis indicators were detected */
  detected: boolean;
  /** Severity level if detected */
  severity?: 'low' | 'medium' | 'high' | 'critical';
  /** Category of crisis detected */
  category?: CrisisCategory;
  /** Resources for the user's locale */
  resources?: LocaleCrisisResources;
  /** Timestamp of detection for metrics */
  detectedAt?: number;
}

/**
 * Categories of crisis content
 */
export type CrisisCategory =
  | 'self_harm'
  | 'suicide'
  | 'abuse'
  | 'violence'
  | 'eating_disorder'
  | 'substance_crisis';

/**
 * Intervention metrics (NO content stored)
 */
export interface CrisisInterventionMetric {
  /** Timestamp of intervention */
  timestamp: number;
  /** Locale of user */
  locale: CrisisLocale;
  /** Category detected (no content) */
  category: CrisisCategory;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Whether resources were shown */
  resourcesShown: boolean;
  /** Whether user clicked any resource */
  resourceClicked?: boolean;
}

/**
 * Response when crisis is detected
 * Sent instead of posting confession
 */
export interface CrisisResponse {
  /** Always true when this response is returned */
  crisisDetected: true;
  /** Message to show user */
  message: string;
  /** Crisis resources for user's locale */
  resources: LocaleCrisisResources;
  /** Should show "Get Help" instead of "Release" */
  showGetHelp: true;
  /** Optional: supportive message */
  supportMessage: string;
}

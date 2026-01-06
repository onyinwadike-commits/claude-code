import { CONFESSION_MAX_LENGTH, CONFESSION_MIN_LENGTH } from '../constants';

export function validateConfessionContent(content: string): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content is required' };
  }

  const trimmed = content.trim();

  if (trimmed.length < CONFESSION_MIN_LENGTH) {
    return { valid: false, error: `Content must be at least ${CONFESSION_MIN_LENGTH} characters` };
  }

  if (trimmed.length > CONFESSION_MAX_LENGTH) {
    return { valid: false, error: `Content must not exceed ${CONFESSION_MAX_LENGTH} characters` };
  }

  return { valid: true };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

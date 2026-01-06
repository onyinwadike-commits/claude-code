/**
 * Client for communicating with the Redaction Service
 */

export interface RedactionRequest {
  content: string;
  redact_emails?: boolean;
  redact_phones?: boolean;
  redact_names?: boolean;
  redact_addresses?: boolean;
}

export interface RedactionResponse {
  original_content: string;
  redacted_content: string;
  redactions_made: number;
  redaction_types: string[];
}

export interface RedactionClientConfig {
  baseUrl: string;
  timeout: number;
}

const defaultConfig: RedactionClientConfig = {
  baseUrl: process.env.REDACTION_SERVICE_URL || 'http://localhost:8001',
  timeout: parseInt(process.env.REDACTION_SERVICE_TIMEOUT || '5000', 10),
};

/**
 * Redaction Service Client
 */
export class RedactionClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: Partial<RedactionClientConfig> = {}) {
    this.baseUrl = config.baseUrl || defaultConfig.baseUrl;
    this.timeout = config.timeout || defaultConfig.timeout;
  }

  /**
   * Redact PII from content
   */
  async redact(content: string, options?: Partial<RedactionRequest>): Promise<RedactionResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/redact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          redact_emails: true,
          redact_phones: true,
          redact_names: true,
          redact_addresses: true,
          ...options,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Redaction service error: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as RedactionResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Redaction service timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Analyze content for PII without redacting
   */
  async analyze(content: string): Promise<{ has_pii: boolean; findings: unknown[] }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Redaction service error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Redaction service timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if redaction service is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Default singleton instance
export const redactionClient = new RedactionClient();

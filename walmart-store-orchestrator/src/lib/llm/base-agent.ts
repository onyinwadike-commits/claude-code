import {
  AgentConfig,
  AgentName,
  AgentResponse,
  AgentRole,
  QueryOptions,
  LLMError,
  TimeoutError,
} from './types';

// Rate limiter using token bucket algorithm
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms

  constructor(requestsPerMinute: number) {
    this.maxTokens = requestsPerMinute;
    this.tokens = requestsPerMinute;
    this.lastRefill = Date.now();
    this.refillRate = requestsPerMinute / 60000; // per ms
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens < 1) {
      const waitTime = Math.ceil((1 - this.tokens) / this.refillRate);
      await this.sleep(waitTime);
      this.refill();
    }
    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

export abstract class LLMAgent {
  protected config: AgentConfig;
  protected rateLimiter: RateLimiter;
  protected retryConfig: RetryConfig;

  constructor(config: AgentConfig, retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit.requestsPerMinute);
    this.retryConfig = retryConfig;
  }

  // Abstract method that each agent must implement
  protected abstract executeQuery(
    prompt: string,
    options: QueryOptions
  ): Promise<{ content: string; tokensUsed: number }>;

  // Public query method with rate limiting, retry logic, and error handling
  async query(prompt: string, options: QueryOptions): Promise<AgentResponse> {
    const startTime = Date.now();

    // Check if this agent supports the task type
    if (!this.supportsTaskType(options.taskType)) {
      throw new LLMError(
        `Agent ${this.config.name} does not support task type: ${options.taskType}`,
        this.config.name,
        400,
        false
      );
    }

    // Acquire rate limit token
    await this.rateLimiter.acquire();

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.retryConfig.maxRetries) {
      try {
        const result = await this.executeWithTimeout(
          () => this.executeQuery(prompt, options),
          options.timeout || 30000
        );

        const latencyMs = Date.now() - startTime;
        const confidence = this.calculateConfidence(result.content, options);

        return {
          agentName: this.config.name,
          displayName: this.config.displayName,
          role: this.config.role,
          content: result.content,
          confidence,
          metadata: {
            model: this.config.model,
            tokensUsed: result.tokensUsed,
            latencyMs,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (!this.shouldRetry(error as Error, attempt)) {
          break;
        }

        const delay = this.calculateBackoff(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError || new LLMError(`Unknown error for ${this.config.name}`, this.config.name);
  }

  // Getters
  get name(): AgentName {
    return this.config.name;
  }

  get displayName(): string {
    return this.config.displayName;
  }

  get role(): AgentRole {
    return this.config.role;
  }

  get model(): string {
    return this.config.model;
  }

  get capabilities() {
    return this.config.capabilities;
  }

  get fallbackAgents(): AgentName[] {
    return this.config.fallbackAgents;
  }

  // Check if agent supports a task type
  supportsTaskType(taskType: string): boolean {
    return this.config.capabilities.includes(taskType as QueryOptions['taskType']);
  }

  // Get API key from environment
  protected getApiKey(): string {
    const key = process.env[this.config.apiKeyEnvVar];
    if (!key) {
      throw new LLMError(
        `API key not found: ${this.config.apiKeyEnvVar}`,
        this.config.name,
        401,
        false
      );
    }
    return key;
  }

  // Calculate confidence score based on response quality
  protected calculateConfidence(content: string, options: QueryOptions): number {
    let confidence = 0.7; // Base confidence

    // Adjust based on content length (longer, more detailed responses are often more confident)
    if (content.length > 500) confidence += 0.1;
    if (content.length > 1000) confidence += 0.05;

    // Adjust based on task type match
    const primaryTasks = this.config.capabilities.slice(0, 3);
    if (primaryTasks.includes(options.taskType)) {
      confidence += 0.1;
    }

    // Cap at 0.95
    return Math.min(0.95, confidence);
  }

  // Execute with timeout
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new TimeoutError(this.config.name, timeoutMs));
      }, timeoutMs);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // Determine if error is retryable
  private shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.retryConfig.maxRetries) return false;

    if (error instanceof LLMError) {
      return error.retryable;
    }

    // Network errors are retryable
    if (error.message.includes('ECONNRESET') || error.message.includes('ETIMEDOUT')) {
      return true;
    }

    return false;
  }

  // Calculate exponential backoff delay
  private calculateBackoff(attempt: number): number {
    const delay =
      this.retryConfig.baseDelayMs *
      Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.min(this.retryConfig.maxDelayMs, delay + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Build system prompt for store operations context
  protected buildSystemPrompt(taskType: string): string {
    return `You are an AI assistant specialized in Walmart store operations analysis.
Your role is: ${this.config.role}
You are analyzing data for a Market 36 (Las Vegas) Walmart store.

Task type: ${taskType}

Provide detailed, actionable insights based on retail best practices and Walmart operational standards.
Focus on:
- Specific, measurable recommendations
- Impact on store metrics (sales, customer satisfaction, efficiency)
- Practical implementation steps
- Risk factors and mitigation strategies

Format your response with clear sections and bullet points where appropriate.`;
  }
}

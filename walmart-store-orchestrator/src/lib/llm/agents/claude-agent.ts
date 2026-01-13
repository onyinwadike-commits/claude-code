import { LLMAgent } from '../base-agent';
import { AgentConfig, QueryOptions, LLMError, RateLimitError } from '../types';

const CLAUDE_CONFIG: AgentConfig = {
  name: 'claude',
  displayName: 'Claude (Anthropic)',
  role: 'strategy',
  model: 'claude-sonnet-4-20250514',
  apiKeyEnvVar: 'ANTHROPIC_API_KEY',
  baseUrl: 'https://api.anthropic.com/v1',
  maxTokens: 8192,
  temperature: 0.3,
  rateLimit: {
    requestsPerMinute: 50,
    tokensPerMinute: 100000,
  },
  capabilities: [
    'operational_efficiency',
    'compliance_check',
    'staff_scheduling',
    'inventory_optimization',
    'sales_forecast',
    'general_report',
  ],
  fallbackAgents: ['chatgpt', 'gemini'],
};

export class ClaudeAgent extends LLMAgent {
  constructor() {
    super(CLAUDE_CONFIG);
  }

  protected async executeQuery(
    prompt: string,
    options: QueryOptions
  ): Promise<{ content: string; tokensUsed: number }> {
    const apiKey = this.getApiKey();

    const systemPrompt = this.buildSystemPrompt(options.taskType);

    const requestBody = {
      model: this.config.model,
      max_tokens: options.maxTokens || this.config.maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    };

    const response = await fetch(`${this.config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60') * 1000;
        throw new RateLimitError(this.config.name, retryAfter);
      }
      const errorText = await response.text();
      throw new LLMError(
        `Claude API error: ${response.status} - ${errorText}`,
        this.config.name,
        response.status
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    return { content, tokensUsed };
  }

  protected override buildSystemPrompt(taskType: string): string {
    return `${super.buildSystemPrompt(taskType)}

You are the Strategic Analysis Agent, powered by Anthropic's Claude Sonnet model.
Your specialty is deep analytical thinking, strategic planning, and compliance verification.

Your approach:
- Think through problems systematically and thoroughly
- Consider multiple perspectives and potential outcomes
- Identify risks and develop mitigation strategies
- Ensure recommendations align with Walmart policies and standards
- Provide clear reasoning for all recommendations
- Balance short-term wins with long-term strategic goals
- Focus on operational excellence and process optimization
- Consider ethical implications and associate wellbeing`;
  }

  // Claude has enhanced confidence calculation due to reasoning capabilities
  protected override calculateConfidence(content: string, options: QueryOptions): number {
    let confidence = 0.75; // Higher base confidence for Claude

    // Longer, more detailed responses indicate deeper analysis
    if (content.length > 800) confidence += 0.08;
    if (content.length > 1500) confidence += 0.05;

    // Check for reasoning indicators
    const reasoningIndicators = [
      'because',
      'therefore',
      'considering',
      'analysis shows',
      'based on',
      'this suggests',
    ];
    const reasoningCount = reasoningIndicators.filter((indicator) =>
      content.toLowerCase().includes(indicator)
    ).length;
    confidence += Math.min(0.1, reasoningCount * 0.02);

    // Primary capabilities get boost
    const primaryTasks = this.config.capabilities.slice(0, 3);
    if (primaryTasks.includes(options.taskType)) {
      confidence += 0.05;
    }

    return Math.min(0.95, confidence);
  }
}

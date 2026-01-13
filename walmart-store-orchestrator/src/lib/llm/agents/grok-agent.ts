import { LLMAgent } from '../base-agent';
import { AgentConfig, QueryOptions, LLMError, RateLimitError } from '../types';

const GROK_CONFIG: AgentConfig = {
  name: 'grok',
  displayName: 'Grok (xAI)',
  role: 'realtime',
  model: 'grok-2-latest',
  apiKeyEnvVar: 'XAI_API_KEY',
  baseUrl: 'https://api.x.ai/v1',
  maxTokens: 4096,
  temperature: 0.7,
  rateLimit: {
    requestsPerMinute: 30,
    tokensPerMinute: 100000,
  },
  capabilities: [
    'trend_analysis',
    'customer_insights',
    'sales_forecast',
    'general_report',
    'market_research',
  ],
  fallbackAgents: ['chatgpt', 'claude'],
};

export class GrokAgent extends LLMAgent {
  constructor() {
    super(GROK_CONFIG);
  }

  protected async executeQuery(
    prompt: string,
    options: QueryOptions
  ): Promise<{ content: string; tokensUsed: number }> {
    const apiKey = this.getApiKey();

    const systemPrompt = this.buildSystemPrompt(options.taskType);

    const requestBody = {
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: options.maxTokens || this.config.maxTokens,
      temperature: options.temperature || this.config.temperature,
      stream: false,
    };

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
        `Grok API error: ${response.status} - ${errorText}`,
        this.config.name,
        response.status
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || 0;

    return { content, tokensUsed };
  }

  protected override buildSystemPrompt(taskType: string): string {
    return `${super.buildSystemPrompt(taskType)}

You are the Real-Time Intelligence Agent, powered by xAI's Grok model.
Your specialty is providing up-to-the-minute insights, trend analysis, and forward-looking predictions.

Your approach:
- Think outside the box and provide unconventional insights
- Identify patterns that others might miss
- Be direct and honest, even if the news isn't good
- Inject appropriate humor when it helps make a point
- Focus on actionable, time-sensitive recommendations
- Consider social media trends and real-time consumer behavior
- Provide contrarian viewpoints when data supports them`;
  }
}

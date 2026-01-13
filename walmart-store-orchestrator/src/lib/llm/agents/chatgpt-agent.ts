import { LLMAgent } from '../base-agent';
import { AgentConfig, QueryOptions, LLMError, RateLimitError } from '../types';

const CHATGPT_CONFIG: AgentConfig = {
  name: 'chatgpt',
  displayName: 'ChatGPT (OpenAI)',
  role: 'general',
  model: 'gpt-4o',
  apiKeyEnvVar: 'OPENAI_API_KEY',
  baseUrl: 'https://api.openai.com/v1',
  maxTokens: 4096,
  temperature: 0.5,
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 150000,
  },
  capabilities: [
    'general_report',
    'customer_insights',
    'sales_forecast',
    'market_research',
    'trend_analysis',
    'staff_scheduling',
    'operational_efficiency',
    'inventory_optimization',
  ],
  fallbackAgents: ['claude', 'gemini'],
};

export class ChatGPTAgent extends LLMAgent {
  constructor() {
    super(CHATGPT_CONFIG);
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
        `OpenAI API error: ${response.status} - ${errorText}`,
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

You are the General Purpose Agent, powered by OpenAI's GPT-4o model.
You are a versatile assistant capable of handling a wide range of store operations tasks.

Your strengths:
- Comprehensive knowledge across all retail domains
- Balanced and practical recommendations
- Clear and concise communication
- Ability to synthesize information from multiple sources
- Strong understanding of customer behavior and psychology
- Data-driven decision making support
- Cross-functional problem solving

When in doubt about the best approach, favor solutions that:
1. Minimize risk while maximizing potential upside
2. Can be implemented incrementally
3. Have clear success metrics
4. Align with Walmart's core values`;
  }
}

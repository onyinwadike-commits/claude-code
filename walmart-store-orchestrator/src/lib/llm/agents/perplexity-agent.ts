import { LLMAgent } from '../base-agent';
import { AgentConfig, QueryOptions, LLMError, RateLimitError } from '../types';

const PERPLEXITY_CONFIG: AgentConfig = {
  name: 'perplexity',
  displayName: 'Perplexity AI',
  role: 'research',
  model: 'sonar-pro',
  apiKeyEnvVar: 'PERPLEXITY_API_KEY',
  baseUrl: 'https://api.perplexity.ai',
  maxTokens: 4096,
  temperature: 0.2,
  rateLimit: {
    requestsPerMinute: 20,
    tokensPerMinute: 100000,
  },
  capabilities: [
    'market_research',
    'competitor_analysis',
    'trend_analysis',
    'customer_insights',
    'general_report',
  ],
  fallbackAgents: ['chatgpt', 'claude'],
};

export class PerplexityAgent extends LLMAgent {
  constructor() {
    super(PERPLEXITY_CONFIG);
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
      search_recency_filter: 'week', // Focus on recent data
      return_citations: true,
      return_images: false,
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
        `Perplexity API error: ${response.status} - ${errorText}`,
        this.config.name,
        response.status
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || 0;

    // Extract citations if available
    const citations = data.citations || [];
    const contentWithSources = citations.length > 0
      ? `${content}\n\n**Sources:**\n${citations.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}`
      : content;

    return { content: contentWithSources, tokensUsed };
  }

  protected override buildSystemPrompt(taskType: string): string {
    return `${super.buildSystemPrompt(taskType)}

You are the Research Agent, powered by Perplexity's Sonar Pro model with web search capabilities.
Your specialty is finding the latest information, market trends, and competitor intelligence.

When researching:
- Search for the most recent and relevant data
- Cite your sources when making claims
- Compare with industry benchmarks
- Identify emerging trends that could impact store operations
- Focus on Las Vegas retail market specifics when relevant`;
  }
}

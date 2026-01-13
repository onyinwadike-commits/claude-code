import { LLMAgent } from '../base-agent';
import { AgentConfig, QueryOptions, LLMError, RateLimitError } from '../types';

const DEEPSEEK_CONFIG: AgentConfig = {
  name: 'deepseek',
  displayName: 'DeepSeek',
  role: 'technical',
  model: 'deepseek-chat',
  apiKeyEnvVar: 'DEEPSEEK_API_KEY',
  baseUrl: 'https://api.deepseek.com/v1',
  maxTokens: 4096,
  temperature: 0.2,
  rateLimit: {
    requestsPerMinute: 30,
    tokensPerMinute: 100000,
  },
  capabilities: [
    'inventory_optimization',
    'operational_efficiency',
    'compliance_check',
    'sales_forecast',
    'general_report',
  ],
  fallbackAgents: ['chatgpt', 'claude'],
};

export class DeepSeekAgent extends LLMAgent {
  constructor() {
    super(DEEPSEEK_CONFIG);
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
        `DeepSeek API error: ${response.status} - ${errorText}`,
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

You are the Technical Analysis Agent, powered by DeepSeek's advanced reasoning model.
Your specialty is technical optimization, data analysis, and systematic problem-solving.

Your approach:
- Apply rigorous analytical methods to operational problems
- Optimize processes using data-driven techniques
- Identify inefficiencies through systematic analysis
- Provide precise, quantifiable recommendations
- Focus on automation and process improvement opportunities
- Apply mathematical optimization where applicable
- Consider system interdependencies and cascading effects

Technical areas of expertise:
- Inventory optimization algorithms (EOQ, safety stock, reorder points)
- Workforce scheduling optimization
- Supply chain efficiency analysis
- Shrink pattern detection and prevention
- Process flow optimization
- KPI calculation and benchmarking
- Cost-benefit analysis with precise numbers`;
  }

  // DeepSeek has enhanced confidence for technical/analytical tasks
  protected override calculateConfidence(content: string, options: QueryOptions): number {
    let confidence = 0.72;

    // Check for quantitative indicators (numbers, percentages, formulas)
    const hasNumbers = /\d+(\.\d+)?%?/.test(content);
    const hasFormulas = /[+\-*/=<>]/.test(content);
    if (hasNumbers) confidence += 0.08;
    if (hasFormulas) confidence += 0.05;

    // Longer technical content is usually more thorough
    if (content.length > 600) confidence += 0.05;

    // Primary capabilities boost
    const technicalTasks = ['inventory_optimization', 'operational_efficiency', 'compliance_check'];
    if (technicalTasks.includes(options.taskType)) {
      confidence += 0.08;
    }

    return Math.min(0.95, confidence);
  }
}

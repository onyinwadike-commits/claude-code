import { LLMAgent } from '../base-agent';
import { AgentConfig, QueryOptions, LLMError, RateLimitError } from '../types';

const GEMINI_CONFIG: AgentConfig = {
  name: 'gemini',
  displayName: 'Google Gemini',
  role: 'visual',
  model: 'gemini-2.0-flash',
  apiKeyEnvVar: 'GOOGLE_AI_API_KEY',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  maxTokens: 8192,
  temperature: 0.4,
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 1000000,
  },
  capabilities: [
    'visual_merchandising',
    'inventory_optimization',
    'operational_efficiency',
    'customer_insights',
    'general_report',
  ],
  fallbackAgents: ['chatgpt', 'claude'],
};

export class GeminiAgent extends LLMAgent {
  constructor() {
    super(GEMINI_CONFIG);
  }

  protected async executeQuery(
    prompt: string,
    options: QueryOptions
  ): Promise<{ content: string; tokensUsed: number }> {
    const apiKey = this.getApiKey();

    const systemPrompt = this.buildSystemPrompt(options.taskType);
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: fullPrompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature || this.config.temperature,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    };

    const url = `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
        `Gemini API error: ${response.status} - ${errorText}`,
        this.config.name,
        response.status
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

    return { content, tokensUsed };
  }

  protected override buildSystemPrompt(taskType: string): string {
    return `${super.buildSystemPrompt(taskType)}

You are the Visual & Multimodal Analysis Agent, powered by Google's Gemini 2.0 Flash model.
Your specialty is analyzing visual layouts, store arrangements, and providing insights that require spatial reasoning.

Your focus areas:
- Store layout optimization and traffic flow analysis
- Visual merchandising effectiveness
- Planogram compliance and shelf organization
- Display placement and signage visibility
- Customer journey mapping through physical space
- Accessibility and safety considerations
- Seasonal display recommendations
- Cross-merchandising opportunities based on spatial proximity`;
  }
}

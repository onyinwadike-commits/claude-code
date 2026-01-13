// LLM Agent Types and Interfaces

export type AgentRole =
  | 'research'      // Perplexity - web search, research
  | 'realtime'      // Grok - real-time data, trends
  | 'visual'        // Gemini - visual analysis, multimodal
  | 'strategy'      // Claude - strategic analysis, reasoning
  | 'general'       // ChatGPT - general purpose tasks
  | 'technical';    // DeepSeek - technical/code analysis

export type AgentName =
  | 'perplexity'
  | 'grok'
  | 'gemini'
  | 'claude'
  | 'chatgpt'
  | 'deepseek';

export type TaskType =
  | 'market_research'
  | 'competitor_analysis'
  | 'trend_analysis'
  | 'inventory_optimization'
  | 'sales_forecast'
  | 'customer_insights'
  | 'operational_efficiency'
  | 'visual_merchandising'
  | 'compliance_check'
  | 'staff_scheduling'
  | 'general_report';

export interface AgentConfig {
  name: AgentName;
  displayName: string;
  role: AgentRole;
  model: string;
  apiKeyEnvVar: string;
  baseUrl: string;
  maxTokens: number;
  temperature: number;
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  capabilities: TaskType[];
  fallbackAgents: AgentName[];
}

export interface QueryOptions {
  taskType: TaskType;
  context?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  includeSource?: boolean;
}

export interface AgentResponse {
  agentName: AgentName;
  displayName: string;
  role: AgentRole;
  content: string;
  confidence: number;
  reasoning?: string;
  sources?: string[];
  metadata: {
    model: string;
    tokensUsed: number;
    latencyMs: number;
    timestamp: string;
  };
}

export interface OrchestratedResponse {
  taskType: TaskType;
  query: string;
  responses: AgentResponse[];
  aggregatedContent: string;
  overallConfidence: number;
  primaryAgent: AgentName;
  metadata: {
    totalLatencyMs: number;
    agentsQueried: number;
    timestamp: string;
  };
}

export interface ReportSection {
  sectionKey: string;
  sectionName: string;
  content: string;
  insights: Insight[];
  recommendations: string[];
  confidence: number;
  primaryAgent: AgentName;
  contributors: AgentName[];
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  source: AgentName;
  actionable: boolean;
}

export interface StoreReport {
  storeId: string;
  storeNumber: number;
  storeName: string;
  generatedAt: string;
  sections: ReportSection[];
  executiveSummary: string;
  overallHealth: number;
  criticalAlerts: string[];
  metadata: {
    generationTimeMs: number;
    agentsUsed: AgentName[];
    totalQueries: number;
  };
}

// Error types
export class LLMError extends Error {
  constructor(
    message: string,
    public agentName: AgentName,
    public statusCode?: number,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class RateLimitError extends LLMError {
  constructor(agentName: AgentName, retryAfterMs: number) {
    super(`Rate limit exceeded for ${agentName}`, agentName, 429, true);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
  retryAfterMs: number;
}

export class TimeoutError extends LLMError {
  constructor(agentName: AgentName, timeoutMs: number) {
    super(`Request timeout after ${timeoutMs}ms for ${agentName}`, agentName, 408, true);
    this.name = 'TimeoutError';
  }
}

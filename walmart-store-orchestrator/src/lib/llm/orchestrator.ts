import { LLMAgent } from './base-agent';
import {
  AgentName,
  AgentResponse,
  OrchestratedResponse,
  QueryOptions,
  TaskType,
  LLMError,
} from './types';
import {
  PerplexityAgent,
  GrokAgent,
  GeminiAgent,
  ClaudeAgent,
  ChatGPTAgent,
  DeepSeekAgent,
} from './agents';

// Task type to primary agent mapping
const TASK_ROUTING: Record<TaskType, AgentName[]> = {
  market_research: ['perplexity', 'grok', 'chatgpt'],
  competitor_analysis: ['perplexity', 'chatgpt', 'claude'],
  trend_analysis: ['grok', 'perplexity', 'chatgpt'],
  inventory_optimization: ['deepseek', 'claude', 'chatgpt'],
  sales_forecast: ['chatgpt', 'claude', 'deepseek'],
  customer_insights: ['chatgpt', 'grok', 'gemini'],
  operational_efficiency: ['claude', 'deepseek', 'chatgpt'],
  visual_merchandising: ['gemini', 'chatgpt', 'claude'],
  compliance_check: ['claude', 'deepseek', 'chatgpt'],
  staff_scheduling: ['claude', 'chatgpt', 'deepseek'],
  general_report: ['chatgpt', 'claude', 'gemini'],
};

interface OrchestratorConfig {
  maxParallelQueries: number;
  enableFallback: boolean;
  minConfidenceThreshold: number;
  aggregationStrategy: 'weighted' | 'best' | 'consensus';
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  maxParallelQueries: 3,
  enableFallback: true,
  minConfidenceThreshold: 0.6,
  aggregationStrategy: 'weighted',
};

export class LLMOrchestrator {
  private agents: Map<AgentName, LLMAgent>;
  private config: OrchestratorConfig;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.agents = new Map();
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Initialize all agents
    const agentInstances: [AgentName, LLMAgent][] = [
      ['perplexity', new PerplexityAgent()],
      ['grok', new GrokAgent()],
      ['gemini', new GeminiAgent()],
      ['claude', new ClaudeAgent()],
      ['chatgpt', new ChatGPTAgent()],
      ['deepseek', new DeepSeekAgent()],
    ];

    for (const [name, agent] of agentInstances) {
      this.agents.set(name, agent);
    }
  }

  // Get the primary agent for a task type
  getPrimaryAgent(taskType: TaskType): AgentName {
    const routing = TASK_ROUTING[taskType];
    return routing?.[0] || 'chatgpt';
  }

  // Get all agents suitable for a task type
  getSuitableAgents(taskType: TaskType): AgentName[] {
    return TASK_ROUTING[taskType] || ['chatgpt'];
  }

  // Query a single agent
  async queryAgent(
    agentName: AgentName,
    prompt: string,
    options: QueryOptions
  ): Promise<AgentResponse> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new LLMError(`Agent not found: ${agentName}`, agentName as AgentName, 404, false);
    }
    return agent.query(prompt, options);
  }

  // Query multiple agents in parallel
  async queryMultipleAgents(
    agentNames: AgentName[],
    prompt: string,
    options: QueryOptions
  ): Promise<AgentResponse[]> {
    const limitedAgents = agentNames.slice(0, this.config.maxParallelQueries);

    const promises = limitedAgents.map(async (agentName) => {
      try {
        return await this.queryAgent(agentName, prompt, options);
      } catch (error) {
        console.error(`Agent ${agentName} failed:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter((r): r is AgentResponse => r !== null);
  }

  // Main orchestration method - routes to appropriate agents and aggregates
  async orchestrate(
    prompt: string,
    options: QueryOptions
  ): Promise<OrchestratedResponse> {
    const startTime = Date.now();
    const suitableAgents = this.getSuitableAgents(options.taskType);
    const primaryAgent = suitableAgents[0];

    // Query suitable agents in parallel
    let responses = await this.queryMultipleAgents(suitableAgents, prompt, options);

    // If no responses and fallback is enabled, try fallback agents
    if (responses.length === 0 && this.config.enableFallback) {
      const agent = this.agents.get(primaryAgent);
      if (agent) {
        const fallbacks = agent.fallbackAgents;
        responses = await this.queryMultipleAgents(fallbacks, prompt, options);
      }
    }

    // If still no responses, throw error
    if (responses.length === 0) {
      throw new LLMError(
        'All agents failed to respond',
        primaryAgent,
        500,
        true
      );
    }

    // Aggregate responses
    const aggregated = this.aggregateResponses(responses, options.taskType);

    return {
      taskType: options.taskType,
      query: prompt,
      responses,
      aggregatedContent: aggregated.content,
      overallConfidence: aggregated.confidence,
      primaryAgent: responses[0]?.agentName || primaryAgent,
      metadata: {
        totalLatencyMs: Date.now() - startTime,
        agentsQueried: responses.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Aggregate multiple agent responses
  private aggregateResponses(
    responses: AgentResponse[],
    taskType: TaskType
  ): { content: string; confidence: number } {
    if (responses.length === 0) {
      return { content: '', confidence: 0 };
    }

    if (responses.length === 1) {
      return {
        content: responses[0].content,
        confidence: responses[0].confidence,
      };
    }

    switch (this.config.aggregationStrategy) {
      case 'best':
        return this.aggregateBest(responses);
      case 'consensus':
        return this.aggregateConsensus(responses);
      case 'weighted':
      default:
        return this.aggregateWeighted(responses, taskType);
    }
  }

  // Return the response with highest confidence
  private aggregateBest(responses: AgentResponse[]): { content: string; confidence: number } {
    const best = responses.reduce((a, b) => (a.confidence > b.confidence ? a : b));
    return { content: best.content, confidence: best.confidence };
  }

  // Weighted aggregation based on agent specialty and confidence
  private aggregateWeighted(
    responses: AgentResponse[],
    taskType: TaskType
  ): { content: string; confidence: number } {
    const primaryAgents = TASK_ROUTING[taskType] || [];

    // Calculate weights
    const weighted = responses.map((r) => {
      const isPrimary = primaryAgents.indexOf(r.agentName) === 0;
      const isSecondary = primaryAgents.indexOf(r.agentName) === 1;
      let weight = r.confidence;

      if (isPrimary) weight *= 1.3;
      else if (isSecondary) weight *= 1.1;

      return { response: r, weight };
    });

    // Sort by weight
    weighted.sort((a, b) => b.weight - a.weight);

    // Build aggregated content
    const sections: string[] = [];
    const usedAgents = new Set<string>();

    for (const { response } of weighted) {
      if (!usedAgents.has(response.agentName)) {
        sections.push(
          `### ${response.displayName} Analysis (Confidence: ${Math.round(response.confidence * 100)}%)\n\n${response.content}`
        );
        usedAgents.add(response.agentName);
      }
    }

    // Calculate overall confidence
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    const avgConfidence =
      weighted.reduce((sum, w) => sum + w.response.confidence * w.weight, 0) / totalWeight;

    return {
      content: sections.join('\n\n---\n\n'),
      confidence: avgConfidence,
    };
  }

  // Consensus aggregation - find common themes
  private aggregateConsensus(responses: AgentResponse[]): { content: string; confidence: number } {
    // For consensus, we take the highest confidence response as primary
    // and note areas of agreement/disagreement
    const sorted = [...responses].sort((a, b) => b.confidence - a.confidence);
    const primary = sorted[0];

    let content = `## Primary Analysis\n\n${primary.content}\n\n`;

    if (sorted.length > 1) {
      content += `## Additional Perspectives\n\n`;
      for (const response of sorted.slice(1)) {
        content += `### ${response.displayName}\n${response.content}\n\n`;
      }
    }

    // Average confidence for consensus
    const avgConfidence =
      responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;

    return { content, confidence: avgConfidence };
  }

  // Get agent info
  getAgentInfo(agentName: AgentName) {
    const agent = this.agents.get(agentName);
    if (!agent) return null;

    return {
      name: agent.name,
      displayName: agent.displayName,
      role: agent.role,
      model: agent.model,
      capabilities: agent.capabilities,
    };
  }

  // List all available agents
  listAgents() {
    return Array.from(this.agents.entries()).map(([name, agent]) => ({
      name,
      displayName: agent.displayName,
      role: agent.role,
      model: agent.model,
      capabilities: agent.capabilities,
    }));
  }
}

// Singleton instance
let orchestratorInstance: LLMOrchestrator | null = null;

export function getOrchestrator(config?: Partial<OrchestratorConfig>): LLMOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new LLMOrchestrator(config);
  }
  return orchestratorInstance;
}

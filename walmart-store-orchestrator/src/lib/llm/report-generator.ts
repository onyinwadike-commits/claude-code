import { getOrchestrator } from './orchestrator';
import {
  StoreReport,
  ReportSection,
  Insight,
  TaskType,
  AgentName,
} from './types';
import { Store, getSectionByKey, SectionKey } from '@/data/stores';

// Section to task type mapping
const SECTION_TASKS: Record<string, TaskType[]> = {
  A: ['inventory_optimization', 'visual_merchandising', 'customer_insights'], // Fresh
  B: ['inventory_optimization', 'sales_forecast', 'trend_analysis'], // Consumables
  C: ['compliance_check', 'customer_insights', 'inventory_optimization'], // Health & Wellness
  D: ['visual_merchandising', 'trend_analysis', 'inventory_optimization'], // General Merchandise
  E: ['trend_analysis', 'customer_insights', 'sales_forecast'], // Entertainment
  F: ['operational_efficiency', 'customer_insights', 'compliance_check'], // Financial Services
  G: ['operational_efficiency', 'staff_scheduling', 'customer_insights'], // Front End
  H: ['operational_efficiency', 'customer_insights', 'inventory_optimization'], // OGP/Digital
  I: ['inventory_optimization', 'operational_efficiency', 'compliance_check'], // Inventory
  J: ['compliance_check', 'operational_efficiency', 'trend_analysis'], // Asset Protection
  K: ['staff_scheduling', 'operational_efficiency', 'customer_insights'], // People
};

export async function generateStoreReport(store: Store): Promise<StoreReport> {
  const startTime = Date.now();
  const orchestrator = getOrchestrator();
  const agentsUsed = new Set<AgentName>();

  // Generate sections in parallel (batch by 3 to avoid overwhelming APIs)
  const sections: ReportSection[] = [];
  const sectionBatches = chunkArray(store.sections, 3);

  for (const batch of sectionBatches) {
    const batchPromises = batch.map((sectionKey) =>
      generateSectionReport(store, sectionKey, orchestrator, agentsUsed)
    );
    const batchResults = await Promise.all(batchPromises);
    sections.push(...batchResults.filter((s): s is ReportSection => s !== null));
  }

  // Generate executive summary
  const executiveSummary = await generateExecutiveSummary(store, sections, orchestrator);

  // Calculate overall health score
  const overallHealth = calculateOverallHealth(sections);

  // Extract critical alerts
  const criticalAlerts = extractCriticalAlerts(sections);

  return {
    storeId: store.id,
    storeNumber: store.storeNumber,
    storeName: store.name,
    generatedAt: new Date().toISOString(),
    sections,
    executiveSummary,
    overallHealth,
    criticalAlerts,
    metadata: {
      generationTimeMs: Date.now() - startTime,
      agentsUsed: Array.from(agentsUsed),
      totalQueries: sections.length + 1, // sections + summary
    },
  };
}

async function generateSectionReport(
  store: Store,
  sectionKey: string,
  orchestrator: ReturnType<typeof getOrchestrator>,
  agentsUsed: Set<AgentName>
): Promise<ReportSection | null> {
  const section = getSectionByKey(sectionKey as SectionKey);
  if (!section) return null;

  const tasks = SECTION_TASKS[sectionKey] || ['general_report'];
  const primaryTask = tasks[0];

  const prompt = buildSectionPrompt(store, section.name, section.description);

  try {
    const result = await orchestrator.orchestrate(prompt, {
      taskType: primaryTask,
      context: {
        storeNumber: store.storeNumber,
        storeName: store.name,
        sectionKey,
        sectionName: section.name,
      },
    });

    // Track agents used
    result.responses.forEach((r) => agentsUsed.add(r.agentName));

    // Extract insights from responses
    const insights = extractInsights(result.responses, sectionKey);

    // Extract recommendations
    const recommendations = extractRecommendations(result.aggregatedContent);

    return {
      sectionKey,
      sectionName: section.name,
      content: result.aggregatedContent,
      insights,
      recommendations,
      confidence: result.overallConfidence,
      primaryAgent: result.primaryAgent,
      contributors: result.responses.map((r) => r.agentName),
    };
  } catch (error) {
    console.error(`Failed to generate section ${sectionKey}:`, error);
    return {
      sectionKey,
      sectionName: section.name,
      content: `Unable to generate report for ${section.name} section. Please try again later.`,
      insights: [],
      recommendations: [],
      confidence: 0,
      primaryAgent: 'chatgpt',
      contributors: [],
    };
  }
}

async function generateExecutiveSummary(
  store: Store,
  sections: ReportSection[],
  orchestrator: ReturnType<typeof getOrchestrator>
): Promise<string> {
  const sectionSummaries = sections
    .map((s) => `${s.sectionName}: Confidence ${Math.round(s.confidence * 100)}%`)
    .join('\n');

  const prompt = `Generate an executive summary for Walmart Store #${store.storeNumber} (${store.name}).

Store Location: ${store.address}, ${store.city}, ${store.state} ${store.zipCode}
Store Format: ${store.format}

Section Analysis Summary:
${sectionSummaries}

Provide a concise executive summary (3-4 paragraphs) highlighting:
1. Overall store performance and health
2. Key strengths and opportunities
3. Critical issues requiring immediate attention
4. Strategic recommendations for the next quarter`;

  try {
    const result = await orchestrator.orchestrate(prompt, {
      taskType: 'general_report',
    });
    return result.aggregatedContent;
  } catch {
    return 'Executive summary generation failed. Please review individual sections.';
  }
}

function buildSectionPrompt(store: Store, sectionName: string, description: string): string {
  return `Analyze the ${sectionName} department (${description}) for Walmart Store #${store.storeNumber} in ${store.city}, ${store.state}.

Store Format: ${store.format}
Address: ${store.address}

Provide a comprehensive analysis including:
1. Current state assessment
2. Key performance indicators to monitor
3. Potential issues and risks
4. Optimization opportunities
5. Specific, actionable recommendations
6. Expected impact of recommendations

Focus on practical, implementable insights that can improve operations within the next 30 days.`;
}

function extractInsights(responses: { agentName: AgentName; content: string; confidence: number }[], sectionKey: string): Insight[] {
  const insights: Insight[] = [];
  let id = 1;

  for (const response of responses) {
    // Simple heuristic: extract sentences that contain actionable keywords
    const actionableKeywords = [
      'should',
      'recommend',
      'opportunity',
      'improve',
      'optimize',
      'risk',
      'issue',
      'alert',
      'priority',
      'critical',
    ];

    const sentences = response.content.split(/[.!?]+/).filter((s) => s.trim().length > 20);

    for (const sentence of sentences.slice(0, 3)) {
      const lower = sentence.toLowerCase();
      const isActionable = actionableKeywords.some((k) => lower.includes(k));
      const isHighImpact = lower.includes('critical') || lower.includes('urgent') || lower.includes('immediate');
      const isMediumImpact = lower.includes('should') || lower.includes('recommend');

      if (isActionable) {
        insights.push({
          id: `${sectionKey}-${id++}`,
          title: sentence.trim().slice(0, 60) + (sentence.length > 60 ? '...' : ''),
          description: sentence.trim(),
          impact: isHighImpact ? 'high' : isMediumImpact ? 'medium' : 'low',
          confidence: response.confidence,
          source: response.agentName,
          actionable: true,
        });
      }
    }
  }

  return insights.slice(0, 5); // Limit to top 5 insights per section
}

function extractRecommendations(content: string): string[] {
  const recommendations: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Look for numbered or bulleted recommendations
    if (/^[\d\-\*•]/.test(trimmed) && trimmed.length > 30) {
      const cleaned = trimmed.replace(/^[\d\.\-\*•\s]+/, '').trim();
      if (cleaned.length > 20) {
        recommendations.push(cleaned);
      }
    }
  }

  return recommendations.slice(0, 5);
}

function calculateOverallHealth(sections: ReportSection[]): number {
  if (sections.length === 0) return 0;

  // Weight certain sections more heavily
  const weights: Record<string, number> = {
    A: 1.2, // Fresh is critical
    G: 1.1, // Front End impacts customer experience
    H: 1.1, // OGP is growing
    J: 1.2, // Asset Protection affects shrink
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const section of sections) {
    const weight = weights[section.sectionKey] || 1;
    totalWeight += weight;
    weightedSum += section.confidence * weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function extractCriticalAlerts(sections: ReportSection[]): string[] {
  const alerts: string[] = [];

  for (const section of sections) {
    // Low confidence indicates potential issues
    if (section.confidence < 0.5) {
      alerts.push(`${section.sectionName}: Analysis confidence below threshold`);
    }

    // High impact insights are critical
    const criticalInsights = section.insights.filter((i) => i.impact === 'high');
    for (const insight of criticalInsights) {
      alerts.push(`${section.sectionName}: ${insight.title}`);
    }
  }

  return alerts.slice(0, 10); // Limit to top 10 alerts
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

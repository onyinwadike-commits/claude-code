'use client';

import { useState } from 'react';
import { ReportSection as ReportSectionType } from '@/lib/llm/types';
import { SectionIcon } from '@/components/icons/SectionIcon';
import { ConfidenceBadge, ConfidenceBar } from './ConfidenceBadge';
import { AgentContributors } from './AgentAttribution';
import { ChevronDown, ChevronUp, Lightbulb, CheckCircle, AlertTriangle } from 'lucide-react';
import { SectionKey } from '@/data/stores';

interface ReportSectionProps {
  section: ReportSectionType;
  defaultExpanded?: boolean;
}

export function ReportSectionCard({ section, defaultExpanded = false }: ReportSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const impactColors = {
    high: 'text-red-400 bg-red-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low: 'text-green-400 bg-green-500/20',
  };

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-walmart-blue/20 border border-walmart-blue/30">
            <SectionIcon section={section.sectionKey as SectionKey} size={20} className="text-walmart-yellow" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">
              Section {section.sectionKey}: {section.sectionName}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <ConfidenceBadge confidence={section.confidence} size="sm" showLabel={false} />
              <span className="text-xs text-white/40">
                {section.insights.length} insights • {section.recommendations.length} recommendations
              </span>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={20} className="text-white/40" />
        ) : (
          <ChevronDown size={20} className="text-white/40" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/10 p-4 space-y-6">
          {/* Agent attribution */}
          <AgentContributors agents={section.contributors} primaryAgent={section.primaryAgent} />

          {/* Confidence bar */}
          <ConfidenceBar confidence={section.confidence} label="Analysis Confidence" />

          {/* Main content */}
          <div className="prose prose-invert prose-sm max-w-none">
            <div
              className="text-white/80 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(section.content),
              }}
            />
          </div>

          {/* Insights */}
          {section.insights.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lightbulb size={16} className="text-walmart-yellow" />
                Key Insights
              </h4>
              <div className="space-y-2">
                {section.insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${impactColors[insight.impact]}`}
                          >
                            {insight.impact.toUpperCase()}
                          </span>
                          {insight.actionable && (
                            <CheckCircle size={14} className="text-green-400" />
                          )}
                        </div>
                        <p className="text-sm text-white/80">{insight.description}</p>
                      </div>
                      <ConfidenceBadge confidence={insight.confidence} size="sm" showLabel={false} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {section.recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {section.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-white/80"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-walmart-blue/30 text-walmart-yellow text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact section card for overview
export function ReportSectionCompact({ section }: { section: ReportSectionType }) {
  const hasAlerts = section.insights.some((i) => i.impact === 'high');

  return (
    <div className="glass-card p-4 hover:bg-white/10 transition-colors cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-walmart-blue/20">
            <SectionIcon section={section.sectionKey as SectionKey} size={18} className="text-walmart-yellow" />
          </div>
          <div>
            <h4 className="font-medium text-white">{section.sectionName}</h4>
            <p className="text-xs text-white/40">Section {section.sectionKey}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasAlerts && <AlertTriangle size={16} className="text-red-400" />}
          <ConfidenceBadge confidence={section.confidence} size="sm" showLabel={false} />
        </div>
      </div>
    </div>
  );
}

// Helper function to convert markdown-like content to HTML
function formatMarkdown(content: string): string {
  return content
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n/g, '<br />');
}

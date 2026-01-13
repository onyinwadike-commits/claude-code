'use client';

import { StoreReport } from '@/lib/llm/types';
import { ConfidenceBar, ConfidenceBadge } from './ConfidenceBadge';
import { AgentContributors } from './AgentAttribution';
import { ReportSectionCard } from './ReportSection';
import {
  FileText,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
  MapPin,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

interface ReportCardProps {
  report: StoreReport;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function ReportCard({ report, onRegenerate, isRegenerating }: ReportCardProps) {
  const [showAllSections, setShowAllSections] = useState(false);
  const displayedSections = showAllSections ? report.sections : report.sections.slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Report Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText size={24} className="text-walmart-blue" />
              <h1 className="text-2xl font-bold text-white">Store Operations Report</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <Building2 size={14} />
                Store #{report.storeNumber}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {report.storeName}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {new Date(report.generatedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="glass-button flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
              <span>{isRegenerating ? 'Generating...' : 'Regenerate'}</span>
            </button>
            <button className="glass-button flex items-center gap-2">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-green-400" />
              <span className="text-sm text-white/60">Health Score</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {Math.round(report.overallHealth * 100)}%
            </div>
            <ConfidenceBar confidence={report.overallHealth} />
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={18} className="text-walmart-blue" />
              <span className="text-sm text-white/60">Sections</span>
            </div>
            <div className="text-2xl font-bold text-white">{report.sections.length}</div>
            <p className="text-xs text-white/40">Departments analyzed</p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-yellow-400" />
              <span className="text-sm text-white/60">Alerts</span>
            </div>
            <div className="text-2xl font-bold text-white">{report.criticalAlerts.length}</div>
            <p className="text-xs text-white/40">Require attention</p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-purple-400" />
              <span className="text-sm text-white/60">Generation Time</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {(report.metadata.generationTimeMs / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-white/40">{report.metadata.totalQueries} queries</p>
          </div>
        </div>

        {/* Agent attribution */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <AgentContributors agents={report.metadata.agentsUsed} />
        </div>
      </div>

      {/* Critical Alerts */}
      {report.criticalAlerts.length > 0 && (
        <div className="glass-card p-6 border-l-4 border-l-red-500">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-red-400" />
            Critical Alerts
          </h2>
          <ul className="space-y-2">
            {report.criticalAlerts.map((alert, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-white/80 p-2 rounded-lg bg-red-500/10"
              >
                <span className="text-red-400">•</span>
                {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Executive Summary */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Executive Summary</h2>
        <div
          className="text-white/80 leading-relaxed prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(report.executiveSummary) }}
        />
      </div>

      {/* Section Reports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Department Analysis</h2>
          <ConfidenceBadge
            confidence={report.sections.reduce((sum, s) => sum + s.confidence, 0) / report.sections.length}
            showLabel
          />
        </div>

        {displayedSections.map((section, index) => (
          <ReportSectionCard
            key={section.sectionKey}
            section={section}
            defaultExpanded={index === 0}
          />
        ))}

        {report.sections.length > 3 && (
          <button
            onClick={() => setShowAllSections(!showAllSections)}
            className="w-full glass-button flex items-center justify-center gap-2 py-3"
          >
            {showAllSections ? (
              <>
                <ChevronUp size={16} />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Show {report.sections.length - 3} More Sections
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Skeleton loader for report
export function ReportCardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-white/10 rounded" />
          <div className="h-8 bg-white/10 rounded w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5">
              <div className="h-4 bg-white/10 rounded w-20 mb-2" />
              <div className="h-8 bg-white/10 rounded w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Summary skeleton */}
      <div className="glass-card p-6">
        <div className="h-6 bg-white/10 rounded w-40 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-white/10 rounded w-full" />
          <div className="h-4 bg-white/10 rounded w-5/6" />
          <div className="h-4 bg-white/10 rounded w-4/6" />
        </div>
      </div>

      {/* Section skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl" />
            <div>
              <div className="h-5 bg-white/10 rounded w-40 mb-2" />
              <div className="h-3 bg-white/10 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
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

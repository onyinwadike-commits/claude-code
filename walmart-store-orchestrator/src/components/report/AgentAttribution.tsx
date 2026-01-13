'use client';

import { AgentName } from '@/lib/llm/types';
import {
  Search,
  Zap,
  Eye,
  Brain,
  MessageSquare,
  Code,
  Bot,
} from 'lucide-react';

interface AgentAttributionProps {
  agent: AgentName;
  showRole?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const AGENT_INFO: Record<
  AgentName,
  {
    displayName: string;
    role: string;
    color: string;
    bgColor: string;
    Icon: typeof Bot;
  }
> = {
  perplexity: {
    displayName: 'Perplexity',
    role: 'Research',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    Icon: Search,
  },
  grok: {
    displayName: 'Grok',
    role: 'Real-time',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    Icon: Zap,
  },
  gemini: {
    displayName: 'Gemini',
    role: 'Visual',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    Icon: Eye,
  },
  claude: {
    displayName: 'Claude',
    role: 'Strategy',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    Icon: Brain,
  },
  chatgpt: {
    displayName: 'ChatGPT',
    role: 'General',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    Icon: MessageSquare,
  },
  deepseek: {
    displayName: 'DeepSeek',
    role: 'Technical',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    Icon: Code,
  },
};

export function AgentAttribution({ agent, showRole = true, size = 'md' }: AgentAttributionProps) {
  const info = AGENT_INFO[agent];
  if (!info) return null;

  const { displayName, role, color, bgColor, Icon } = info;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div
      className={`inline-flex items-center rounded-lg ${bgColor} border border-white/10 ${sizeClasses[size]}`}
    >
      <Icon size={iconSize[size]} className={color} />
      <span className={`font-medium ${color}`}>{displayName}</span>
      {showRole && <span className="text-white/40">({role})</span>}
    </div>
  );
}

// Multiple agent attribution for showing contributors
export function AgentContributors({
  agents,
  primaryAgent,
}: {
  agents: AgentName[];
  primaryAgent?: AgentName;
}) {
  if (agents.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-white/40">Powered by:</span>
      {agents.map((agent) => (
        <AgentAttribution
          key={agent}
          agent={agent}
          showRole={false}
          size="sm"
        />
      ))}
      {primaryAgent && agents.includes(primaryAgent) && (
        <span className="text-xs text-white/40">(Primary: {AGENT_INFO[primaryAgent]?.displayName})</span>
      )}
    </div>
  );
}

// Agent icon only (for compact views)
export function AgentIcon({ agent, size = 20 }: { agent: AgentName; size?: number }) {
  const info = AGENT_INFO[agent];
  if (!info) return null;

  const { color, Icon } = info;
  return <Icon size={size} className={color} />;
}

// Full agent card with details
export function AgentCard({ agent }: { agent: AgentName }) {
  const info = AGENT_INFO[agent];
  if (!info) return null;

  const { displayName, role, color, bgColor, Icon } = info;

  return (
    <div className={`glass-card p-4 ${bgColor} border-l-4`} style={{ borderLeftColor: color.replace('text-', '') }}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon size={24} className={color} />
        </div>
        <div>
          <h4 className={`font-semibold ${color}`}>{displayName}</h4>
          <p className="text-sm text-white/60">{role} Agent</p>
        </div>
      </div>
    </div>
  );
}

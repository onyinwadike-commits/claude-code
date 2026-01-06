import React from 'react';
import type { Confession } from '@void-confessions/core';
import { formatRelativeTime } from '@void-confessions/core';
import { Card } from './Card';
import { Badge } from './Badge';

export interface ConfessionCardProps {
  confession: Confession;
  showStatus?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function ConfessionCard({
  confession,
  showStatus = false,
  onApprove,
  onReject,
}: ConfessionCardProps) {
  const content = confession.redactedContent || confession.content;

  const sentimentColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
    mixed: 'text-yellow-600',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm text-gray-500">
          {formatRelativeTime(new Date(confession.createdAt))}
        </span>
        {showStatus && (
          <Badge variant={confession.status === 'approved' ? 'success' : 'default'}>
            {confession.status}
          </Badge>
        )}
      </div>

      <p className="text-gray-800 leading-relaxed mb-4">{content}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {confession.sentiment && (
            <span className={`text-sm ${sentimentColors[confession.sentiment]}`}>
              {confession.sentiment}
            </span>
          )}
          {confession.tags.map((tag) => (
            <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              #{tag}
            </span>
          ))}
        </div>

        {(onApprove || onReject) && confession.status === 'pending' && (
          <div className="flex gap-2">
            {onApprove && (
              <button
                onClick={() => onApprove(confession.id)}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Approve
              </button>
            )}
            {onReject && (
              <button
                onClick={() => onReject(confession.id)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Reject
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

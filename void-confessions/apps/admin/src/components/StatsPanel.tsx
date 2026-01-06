'use client';

/**
 * Stats Panel Component
 *
 * Displays moderation statistics for the current session.
 */

import { useModerationStore } from '../store';

export function StatsPanel() {
  const stats = useModerationStore((state) => state.stats);

  const statItems = [
    {
      label: 'Pending',
      value: stats.pendingCount,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Approved Today',
      value: stats.approvedToday,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Blocked Today',
      value: stats.blockedToday,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Avg Review Time',
      value: `${stats.avgReviewTime}s`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.bgColor} rounded-lg p-4 text-center`}
        >
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

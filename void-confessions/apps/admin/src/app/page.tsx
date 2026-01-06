'use client';

import { useState } from 'react';
import type { Confession, ModerationStats } from '@void-confessions/core';
import { Button, Card, ConfessionCard, Badge } from '@void-confessions/ui';

// Mock data for demonstration
const mockStats: ModerationStats = {
  pending: 12,
  approvedToday: 45,
  rejectedToday: 8,
  averageResponseTime: 3.5,
};

const mockConfessions: Confession[] = [
  {
    id: '1',
    content:
      'I secretly water my neighbor\'s plants when they\'re on vacation. They think they have a miracle garden.',
    status: 'pending',
    sentiment: 'positive',
    sentimentScore: 0.7,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30),
    viewCount: 0,
    reportCount: 0,
    tags: ['wholesome'],
  },
  {
    id: '2',
    content:
      'I told everyone I quit social media for mental health, but really I just got addicted to a different app.',
    status: 'pending',
    sentiment: 'neutral',
    sentimentScore: 0.1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60),
    viewCount: 0,
    reportCount: 0,
    tags: ['tech', 'irony'],
  },
];

export default function AdminDashboard() {
  const [confessions, setConfessions] = useState<Confession[]>(mockConfessions);

  const handleApprove = (id: string) => {
    setConfessions((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'approved' as const, approvedAt: new Date() }
          : c
      )
    );
  };

  const handleReject = (id: string) => {
    setConfessions((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'rejected' as const, rejectedAt: new Date() }
          : c
      )
    );
  };

  const pendingConfessions = confessions.filter((c) => c.status === 'pending');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-void-900 text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Void Confessions Admin</h1>
          <nav className="flex gap-4">
            <Button variant="ghost" className="text-white hover:bg-void-800">
              Queue
            </Button>
            <Button variant="ghost" className="text-white hover:bg-void-800">
              History
            </Button>
            <Button variant="ghost" className="text-white hover:bg-void-800">
              Settings
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-void-600">{mockStats.pending}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{mockStats.approvedToday}</p>
              <p className="text-sm text-gray-600">Approved Today</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{mockStats.rejectedToday}</p>
              <p className="text-sm text-gray-600">Rejected Today</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{mockStats.averageResponseTime}m</p>
              <p className="text-sm text-gray-600">Avg Response Time</p>
            </div>
          </Card>
        </div>

        {/* Moderation Queue */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Moderation Queue</h2>
            <Badge variant="warning" size="md">
              {pendingConfessions.length} pending
            </Badge>
          </div>

          <div className="space-y-4">
            {pendingConfessions.length > 0 ? (
              pendingConfessions.map((confession) => (
                <ConfessionCard
                  key={confession.id}
                  confession={confession}
                  showStatus
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            ) : (
              <Card className="text-center py-12">
                <p className="text-gray-500">No confessions pending review</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

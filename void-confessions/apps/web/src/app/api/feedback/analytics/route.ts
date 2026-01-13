import { NextRequest, NextResponse } from 'next/server';
import type { FeedbackAnalytics, FeedbackCategory, FeedbackType } from '@/lib/feedback/types';

// GET - Feedback analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d'; // 7d, 30d, 90d, ytd, all

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // In production, these would be aggregated from the database
    // For demo, return mock analytics data

    const categoryBreakdown: Record<FeedbackCategory, number> = {
      'report-quality': 45,
      'ai-accuracy': 78,
      'usability': 123,
      'feature-request': 89,
      'amazon-warfare': 34,
      'visual-merch': 67,
    };

    const typeBreakdown: Record<FeedbackType, number> = {
      praise: 89,
      suggestion: 156,
      complaint: 67,
      bug: 45,
      feature: 79,
    };

    // Generate trend data for the time range
    const trendData: { date: string; count: number; avgRating: number }[] = [];
    const dayCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;

    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      trendData.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 20) + 5,
        avgRating: Math.random() * 2 + 3, // 3-5 range
      });
    }

    const analytics: FeedbackAnalytics = {
      totalFeedback: 436,
      newFeedback: 28,
      resolvedFeedback: 312,
      averageRating: 4.2,
      averageResolutionTime: 18.5, // hours
      sentimentBreakdown: {
        positive: 234,
        neutral: 145,
        negative: 57,
      },
      categoryBreakdown,
      typeBreakdown,
      trendData,
      topIssues: [
        { title: 'Slow dashboard loading times', count: 23, category: 'usability' },
        { title: 'AI predictions for seasonal items', count: 18, category: 'ai-accuracy' },
        { title: 'Planogram sync issues', count: 15, category: 'visual-merch' },
        { title: 'Export functionality gaps', count: 12, category: 'feature-request' },
        { title: 'Price comparison accuracy', count: 9, category: 'amazon-warfare' },
      ],
      npsScore: 42, // -100 to 100 scale
      csatScore: 4.2, // 1-5 scale
    };

    // Calculate additional metrics
    const responseRate = (analytics.resolvedFeedback / analytics.totalFeedback) * 100;
    const positiveRate = (analytics.sentimentBreakdown.positive / analytics.totalFeedback) * 100;

    return NextResponse.json({
      success: true,
      data: {
        ...analytics,
        metrics: {
          responseRate: Math.round(responseRate * 10) / 10,
          positiveRate: Math.round(positiveRate * 10) / 10,
          avgResolutionTimeFormatted: `${Math.round(analytics.averageResolutionTime)}h`,
        },
        timeRange,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

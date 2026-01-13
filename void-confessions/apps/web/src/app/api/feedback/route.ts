import { NextRequest, NextResponse } from 'next/server';
import type { Feedback, FeedbackCategory, FeedbackStatus, FeedbackType } from '@/lib/feedback/types';

// In-memory store for demo purposes (replace with database in production)
let feedbackStore: Feedback[] = [
  {
    id: '1',
    userId: 'user-1',
    userName: 'Sarah Johnson',
    storeId: 'store-001',
    storeName: 'Market 396 - Store #4158',
    type: 'suggestion',
    category: 'ai-accuracy',
    title: 'AI restock recommendations are getting more accurate',
    message: 'I followed the AI suggestion and it resulted in a 15% increase in sales for the beverage aisle.',
    rating: 5,
    sentiment: 'positive',
    status: 'reviewed',
    priority: 'medium',
    tags: ['ai', 'inventory', 'positive-outcome'],
    votes: 24,
    votedBy: [],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: '2',
    userName: 'Mike Chen',
    storeId: 'store-002',
    storeName: 'Market 396 - Store #4201',
    type: 'bug',
    category: 'visual-merch',
    title: 'Planogram viewer not loading product images',
    message: 'The images in the planogram viewer are showing as broken.',
    sentiment: 'negative',
    status: 'in_progress',
    priority: 'high',
    tags: ['bug', 'planogram', 'ui'],
    votes: 18,
    votedBy: [],
    adminResponse: 'We\'ve identified the issue and our team is working on a fix.',
    adminRespondedAt: new Date(Date.now() - 30 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
];

// Helper to generate ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// Helper to detect sentiment from message
const detectSentiment = (message: string, type: FeedbackType): 'positive' | 'neutral' | 'negative' => {
  const positiveWords = ['great', 'love', 'amazing', 'excellent', 'helpful', 'works', 'thank'];
  const negativeWords = ['bad', 'broken', 'issue', 'problem', 'bug', 'error', 'doesn\'t', 'can\'t'];

  const lowerMessage = message.toLowerCase();
  const positiveCount = positiveWords.filter(w => lowerMessage.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerMessage.includes(w)).length;

  if (type === 'praise') return 'positive';
  if (type === 'bug' || type === 'complaint') return 'negative';
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

// GET - List feedback with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const category = searchParams.get('category') as FeedbackCategory | null;
    const status = searchParams.get('status') as FeedbackStatus | null;
    const type = searchParams.get('type') as FeedbackType | null;
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let result = [...feedbackStore];

    // Apply filters
    if (category) {
      result = result.filter(f => f.category === category);
    }
    if (status) {
      result = result.filter(f => f.status === status);
    }
    if (type) {
      result = result.filter(f => f.type === type);
    }
    if (search) {
      const query = search.toLowerCase();
      result = result.filter(f =>
        f.title.toLowerCase().includes(query) ||
        f.message.toLowerCase().includes(query) ||
        f.userName?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'most_votes':
        result.sort((a, b) => b.votes - a.votes);
        break;
      case 'highest_rated':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Calculate pagination
    const total = result.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedResult = result.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedResult,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// POST - Submit new feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.message || !body.category || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: message, category, type' },
        { status: 400 }
      );
    }

    // Create new feedback
    const newFeedback: Feedback = {
      id: generateId(),
      userId: body.userId,
      userName: body.userName || 'Anonymous',
      storeId: body.storeId,
      storeName: body.storeName,
      type: body.type,
      category: body.category,
      title: body.title || body.message.substring(0, 50) + (body.message.length > 50 ? '...' : ''),
      message: body.message,
      rating: body.rating,
      sentiment: detectSentiment(body.message, body.type),
      status: 'new',
      priority: body.priority || 'medium',
      tags: body.tags || [],
      attachments: body.attachments,
      votes: 0,
      votedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to store
    feedbackStore.unshift(newFeedback);

    return NextResponse.json({
      success: true,
      data: newFeedback,
      message: 'Feedback submitted successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

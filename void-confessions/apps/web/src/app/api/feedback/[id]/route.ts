import { NextRequest, NextResponse } from 'next/server';
import type { FeedbackStatus, FeedbackPriority } from '@/lib/feedback/types';

// Note: In production, this would connect to the same data store as the main route
// For demo purposes, we'll simulate the operations

// GET - Get single feedback item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Simulate fetching from database
    // In production: const feedback = await db.feedback.findUnique({ where: { id } });

    // For demo, return a mock response
    const mockFeedback = {
      id,
      userName: 'Demo User',
      type: 'suggestion',
      category: 'usability',
      title: 'Demo Feedback Item',
      message: 'This is a demo feedback item fetched by ID.',
      status: 'new',
      priority: 'medium',
      tags: [],
      votes: 0,
      votedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: mockFeedback,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// PATCH - Update feedback (status, priority, admin response, vote)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate update fields
    const allowedUpdates = ['status', 'priority', 'adminResponse', 'vote', 'tags'];
    const updates = Object.keys(body).filter(key => allowedUpdates.includes(key));

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.status) {
      const validStatuses: FeedbackStatus[] = ['new', 'reviewed', 'in_progress', 'resolved', 'wont_fix'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status value' },
          { status: 400 }
        );
      }
      updateData.status = body.status;

      // Set resolvedAt if status is resolved
      if (body.status === 'resolved') {
        updateData.resolvedAt = new Date();
      }
    }

    if (body.priority) {
      const validPriorities: FeedbackPriority[] = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json(
          { success: false, error: 'Invalid priority value' },
          { status: 400 }
        );
      }
      updateData.priority = body.priority;
    }

    if (body.adminResponse !== undefined) {
      updateData.adminResponse = body.adminResponse;
      updateData.adminRespondedAt = new Date();
    }

    if (body.vote !== undefined) {
      const { userId, action } = body.vote;
      // In production, this would update the votedBy array and votes count
      // Simulate: If action is 'add', increment votes; if 'remove', decrement
      updateData.voteAction = action;
    }

    if (body.tags) {
      updateData.tags = body.tags;
    }

    // Simulate database update
    // In production: await db.feedback.update({ where: { id }, data: updateData });

    return NextResponse.json({
      success: true,
      data: {
        id,
        ...updateData,
      },
      message: 'Feedback updated successfully',
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}

// DELETE - Delete feedback (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // In production, verify admin authorization
    // const session = await getSession(request);
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    // }

    // Simulate database delete
    // In production: await db.feedback.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/notifications
 * 
 * Query Parameters:
 * - count_only=true: Return only the count of unread notifications (highly optimized)
 * - limit=10: Number of notifications to fetch (default: 50)
 * - jam3iyyaId: Optional filter by circle ID
 * 
 * Responses:
 * - count_only=true: { count: number }
 * - default: { notifications: Notification[], totalCount: number }
 */
export async function GET(req: Request) {
  try {
    const supabase = await createServerClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', errorCode: 'AUTH_FAILED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get('count_only') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100); // Max 100
    const jam3iyyaId = searchParams.get('jam3iyyaId');

    // ========== COUNT-ONLY OPTIMIZATION ==========
    // Perform a lightweight count query instead of fetching full records
    if (countOnly) {
      let countQuery = supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (jam3iyyaId) {
        countQuery = countQuery.eq('related_jam3iyya_id', jam3iyyaId);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error('Error fetching notification count:', countError);
        return NextResponse.json(
          { error: 'Database error', errorCode: 'DB_ERROR' },
          { status: 500 }
        );
      }

      // Return only the count for badge updates
      return NextResponse.json(
        { count: count || 0 },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        }
      );
    }

    // ========== FULL NOTIFICATION FETCH ==========
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (jam3iyyaId) {
      query = query.eq('related_jam3iyya_id', jam3iyyaId);
    }

    const { data: notifications, error: fetchError, count: totalCount } = await query;

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      return NextResponse.json(
        { error: 'Database error', errorCode: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        notifications: notifications || [],
        totalCount: totalCount || 0,
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (error: any) {
    console.error('Notifications API GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', errorCode: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notification(s) as read
 * 
 * Body:
 * - id: string (mark single notification)
 * - ids: string[] (mark multiple notifications)
 * - markAllRead: boolean (mark all as read)
 */
export async function PATCH(req: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', errorCode: 'AUTH_FAILED' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ids, markAllRead } = body;

    let updateQuery = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);

    if (markAllRead) {
      // Mark all as read
      updateQuery = updateQuery.eq('is_read', false);
    } else if (ids && Array.isArray(ids)) {
      // Mark multiple as read
      updateQuery = updateQuery.in('id', ids);
    } else if (id) {
      // Mark single as read
      updateQuery = updateQuery.eq('id', id);
    } else {
      return NextResponse.json(
        { error: 'Invalid request: provide id, ids, or markAllRead', errorCode: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      console.error('Error updating notification:', updateError);
      return NextResponse.json(
        { error: 'Failed to update notification', errorCode: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notifications API PATCH Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', errorCode: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Delete notification(s)
 * 
 * Body:
 * - id: string (delete single)
 * - ids: string[] (delete multiple)
 */
export async function DELETE(req: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', errorCode: 'AUTH_FAILED' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ids } = body;

    let deleteQuery = supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    if (ids && Array.isArray(ids)) {
      deleteQuery = deleteQuery.in('id', ids);
    } else if (id) {
      deleteQuery = deleteQuery.eq('id', id);
    } else {
      return NextResponse.json(
        { error: 'Invalid request: provide id or ids', errorCode: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.error('Error deleting notification:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete notification', errorCode: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notifications API DELETE Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', errorCode: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

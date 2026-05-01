import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  type: z.enum(['contribution', 'payout', 'insurance_contribution', 'insurance_payout', 'deposit', 'withdrawal']).optional(),
  jam3iyya_id: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  from_date: z.string().datetime({ offset: true }).optional().catch(undefined), // Allows valid ISO dates
  to_date: z.string().datetime({ offset: true }).optional().catch(undefined),
});

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: { message: { en: 'Not authenticated', ar: 'غير مسجل الدخول' } } }, 
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  
  const parsed = querySchema.safeParse(searchParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: { en: 'Invalid query parameters', ar: 'معلمات الاستعلام غير صالحة' }, details: parsed.error.format() } }, 
      { status: 400 }
    );
  }

  const filters = parsed.data;

  // Build the query
  // We use Supabase syntax to select the joined relations.
  // Because we have multiple foreign keys to 'profiles', we must specify the exact FK name.
  let query = supabase
    .from('transactions')
    .select(`
      id,
      amount,
      type,
      description,
      created_at,
      from_user_id,
      to_user_id,
      jam3iyyas:jam3iyya_id ( id, name ),
      from_user:from_user_id ( id, full_name ),
      to_user:to_user_id ( id, full_name )
    `, { count: 'exact' })
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

  // Apply optional filters
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.jam3iyya_id) {
    query = query.eq('jam3iyya_id', filters.jam3iyya_id);
  }
  if (filters.from_date) {
    query = query.gte('created_at', filters.from_date);
  }
  if (filters.to_date) {
    query = query.lte('created_at', filters.to_date);
  }

  // Ordering and Pagination
  query = query
    .order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  const { data: transactions, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: { message: { en: 'Failed to fetch transactions', ar: 'فشل في جلب المعاملات' }, details: error.message } }, 
      { status: 500 }
    );
  }

  // Format the response
  const formattedTransactions = transactions.map((tx: any) => {
    // Determine direction
    const direction = tx.to_user_id === userId ? 'incoming' : 'outgoing';

    // Determine counterparty
    let counterparty = null;
    if (direction === 'incoming' && tx.from_user) {
      counterparty = tx.from_user;
    } else if (direction === 'outgoing' && tx.to_user) {
      counterparty = tx.to_user;
    }

    return {
      id: tx.id,
      amount: Number(tx.amount),
      type: tx.type,
      direction,
      description: tx.description,
      jam3iyya: tx.jam3iyyas || null,
      counterparty,
      created_at: tx.created_at,
      // Omitted running_balance_after as requested for MVP complexity
    };
  });

  return NextResponse.json({
    transactions: formattedTransactions,
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      total: count || 0,
      has_more: count ? (filters.offset + filters.limit) < count : false
    }
  });
}

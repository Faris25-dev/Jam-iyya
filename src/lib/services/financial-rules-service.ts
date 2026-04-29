import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getLockedFunds(userId: string): Promise<number> {
  const supabase = createSupabaseServerClient();

  // Fetch all active memberships for this user, including the parent circle details
  const { data: memberships, error } = await supabase
    .from('jam3iyya_members')
    .select(`
      total_paid,
      status,
      jam3iyyas (
        status,
        duration_months,
        monthly_amount
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error || !memberships) {
    console.error('Failed to fetch memberships for locked funds calc:', error);
    return 0; // Safe fallback, though calling functions should handle this
  }

  let totalLocked = 0;

  for (const member of memberships) {
    const circle = member.jam3iyyas as any;
    // We only lock funds for circles that are active
    if (circle && !Array.isArray(circle) && circle.status === 'active') {
      const totalExpected = circle.duration_months * circle.monthly_amount;
      const remainingCommitment = totalExpected - (member.total_paid || 0);
      
      // Ensure we don't return negative locked funds if they overpaid somehow
      totalLocked += Math.max(0, remainingCommitment);
    }
  }

  return totalLocked;
}

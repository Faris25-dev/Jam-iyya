import { createSupabaseServerClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type NotificationType =
  | 'payment_due'
  | 'payment_reminder'
  | 'payment_late'
  | 'payment_defaulted'
  | 'payout_ready'
  | 'circle_full'
  | 'circle_started'
  | 'circle_completed'
  | 'trust_score_change'
  | 'insurance_activated'
  | 'member_joined'
  | 'member_left';

interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_jam3iyya_id?: string | null;
}

// ---------------------------------------------------------------------------
// Core insert helper
// ---------------------------------------------------------------------------
async function insertNotification(payload: NotificationPayload): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('notifications').insert({
    user_id: payload.user_id,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    related_jam3iyya_id: payload.related_jam3iyya_id ?? null,
    is_read: false,
  });

  if (error) {
    console.error(`[notification-triggers] Failed to insert ${payload.type}:`, error.message);
  }
}

async function insertBulk(payloads: NotificationPayload[]): Promise<void> {
  const supabase = createSupabaseServerClient();
  const rows = payloads.map((p) => ({
    user_id: p.user_id,
    title: p.title,
    message: p.message,
    type: p.type,
    related_jam3iyya_id: p.related_jam3iyya_id ?? null,
    is_read: false,
  }));

  const { error } = await supabase.from('notifications').insert(rows);
  if (error) {
    console.error('[notification-triggers] Bulk insert failed:', error.message);
  }
}

// ---------------------------------------------------------------------------
// Trigger: Payment Due
// ---------------------------------------------------------------------------
export async function triggerPaymentDue(
  userId: string,
  circleName: string,
  amount: number,
  jam3iyyaId: string,
  dueDate: string
): Promise<void> {
  await insertNotification({
    user_id: userId,
    title: 'Payment Due',
    message: `Your payment of ${amount} JOD for "${circleName}" is due on ${new Date(dueDate).toLocaleDateString()}. Please ensure sufficient balance.`,
    type: 'payment_due',
    related_jam3iyya_id: jam3iyyaId,
  });
}

// ---------------------------------------------------------------------------
// Trigger: Payment Reminder (24h before due)
// ---------------------------------------------------------------------------
export async function triggerPaymentReminder(
  userId: string,
  circleName: string,
  amount: number,
  jam3iyyaId: string
): Promise<void> {
  await insertNotification({
    user_id: userId,
    title: 'Payment Reminder',
    message: `Reminder: Your ${amount} JOD payment for "${circleName}" is due tomorrow.`,
    type: 'payment_reminder',
    related_jam3iyya_id: jam3iyyaId,
  });
}

// ---------------------------------------------------------------------------
// Trigger: Payment Late
// ---------------------------------------------------------------------------
export async function triggerPaymentLate(
  userId: string,
  circleName: string,
  amount: number,
  jam3iyyaId: string
): Promise<void> {
  await insertNotification({
    user_id: userId,
    title: 'Payment Overdue',
    message: `Your ${amount} JOD payment for "${circleName}" is overdue. Late payments affect your trust score.`,
    type: 'payment_late',
    related_jam3iyya_id: jam3iyyaId,
  });
}

// ---------------------------------------------------------------------------
// Trigger: Default
// ---------------------------------------------------------------------------
export async function triggerDefault(
  defaultedUserId: string,
  allMemberIds: string[],
  circleName: string,
  jam3iyyaId: string
): Promise<void> {
  // Notify the defaulting member
  await insertNotification({
    user_id: defaultedUserId,
    title: 'Payment Default',
    message: `You have defaulted on "${circleName}". Your trust score has been penalized and the Insurance Fund has covered your contribution.`,
    type: 'payment_defaulted',
    related_jam3iyya_id: jam3iyyaId,
  });

  // Notify all other members
  const otherMembers = allMemberIds.filter((id) => id !== defaultedUserId);
  const bulkPayloads: NotificationPayload[] = otherMembers.map((memberId) => ({
    user_id: memberId,
    title: 'Insurance Fund Activated',
    message: `A member in "${circleName}" missed their payment. The Insurance Fund has covered the gap — your payout is safe.`,
    type: 'insurance_activated',
    related_jam3iyya_id: jam3iyyaId,
  }));

  if (bulkPayloads.length > 0) {
    await insertBulk(bulkPayloads);
  }
}

// ---------------------------------------------------------------------------
// Trigger: Payout Ready
// ---------------------------------------------------------------------------
export async function triggerPayoutReady(
  userId: string,
  circleName: string,
  amount: number,
  jam3iyyaId: string
): Promise<void> {
  await insertNotification({
    user_id: userId,
    title: 'Payout Ready! 🎉',
    message: `Congratulations! Your payout of ${amount} JOD from "${circleName}" is now in your wallet.`,
    type: 'payout_ready',
    related_jam3iyya_id: jam3iyyaId,
  });
}

// ---------------------------------------------------------------------------
// Trigger: Circle Full → Starting
// ---------------------------------------------------------------------------
export async function triggerCircleFull(
  memberIds: string[],
  circleName: string,
  jam3iyyaId: string
): Promise<void> {
  const payloads: NotificationPayload[] = memberIds.map((id) => ({
    user_id: id,
    title: 'Circle Full!',
    message: `"${circleName}" is now full and has started! Turns have been assigned. Check your circle for details.`,
    type: 'circle_started',
    related_jam3iyya_id: jam3iyyaId,
  }));

  await insertBulk(payloads);
}

// ---------------------------------------------------------------------------
// Trigger: Circle Completed
// ---------------------------------------------------------------------------
export async function triggerCircleCompleted(
  memberIds: string[],
  circleName: string,
  jam3iyyaId: string
): Promise<void> {
  const payloads: NotificationPayload[] = memberIds.map((id) => ({
    user_id: id,
    title: 'Circle Completed!',
    message: `"${circleName}" has finished all rounds. Your trust score has been boosted. Thank you for participating!`,
    type: 'circle_completed',
    related_jam3iyya_id: jam3iyyaId,
  }));

  await insertBulk(payloads);
}

// ---------------------------------------------------------------------------
// Trigger: Trust Score Change
// ---------------------------------------------------------------------------
export async function triggerTrustScoreChange(
  userId: string,
  oldScore: number,
  newScore: number,
  reason: string
): Promise<void> {
  const delta = newScore - oldScore;
  const direction = delta > 0 ? '↑' : '↓';
  await insertNotification({
    user_id: userId,
    title: `Trust Score ${direction} ${Math.abs(delta)}`,
    message: `Your trust score changed from ${oldScore} to ${newScore}. Reason: ${reason}`,
    type: 'trust_score_change',
  });
}

// ---------------------------------------------------------------------------
// Trigger: Member Joined Circle
// ---------------------------------------------------------------------------
export async function triggerMemberJoined(
  existingMemberIds: string[],
  newMemberName: string,
  circleName: string,
  jam3iyyaId: string
): Promise<void> {
  const payloads: NotificationPayload[] = existingMemberIds.map((id) => ({
    user_id: id,
    title: 'New Member Joined',
    message: `${newMemberName} has joined "${circleName}".`,
    type: 'member_joined',
    related_jam3iyya_id: jam3iyyaId,
  }));

  if (payloads.length > 0) {
    await insertBulk(payloads);
  }
}

// ---------------------------------------------------------------------------
// Trigger: Member Left Circle
// ---------------------------------------------------------------------------
export async function triggerMemberLeft(
  remainingMemberIds: string[],
  leftMemberName: string,
  circleName: string,
  jam3iyyaId: string
): Promise<void> {
  const payloads: NotificationPayload[] = remainingMemberIds.map((id) => ({
    user_id: id,
    title: 'Member Left',
    message: `${leftMemberName} has left "${circleName}". A new spot is available.`,
    type: 'member_left',
    related_jam3iyya_id: jam3iyyaId,
  }));

  if (payloads.length > 0) {
    await insertBulk(payloads);
  }
}

# API Contract - v1

This document is the shared contract for frontend, auth, trust score, and payment integrations.

## Circles
- `GET /api/jam3iyyas` - list circles, supports query filters
- `POST /api/jam3iyyas` - create circle
- `GET /api/jam3iyyas/:id` - get circle details
- `PATCH /api/jam3iyyas/:id` - update circle, creator only, recruiting only
- `POST /api/jam3iyyas/:id/join` - join circle
- `POST /api/jam3iyyas/:id/leave` - leave circle, recruiting only

## Wallet
- `GET /api/wallet` - balance and wallet stats
- `POST /api/wallet` - deposit or withdraw
- `GET /api/wallet/transactions` - transaction history with filters

## Payments
- `GET /api/payments` - user's payments
- `POST /api/payments` - manual payment
- `POST /api/payments/process-month` - cron trigger, requires `Authorization: Bearer <CRON_SECRET>`
- `GET /api/payments/process-month` - dry-run preview, same auth

## Profile
- `GET /api/profile/stats` - dashboard summary for the signed-in user

## Test Utilities
- `POST /api/test/payments` - internal test harness for payment cycle, schedule, manual payment, and default flows
- `GET /api/test/payments` is not exposed; use the browser test page or the POST actions above

## Shared Response Notes
- Money values are decimal numbers with two fractional digits
- Authenticated user routes return `401` when the session is missing
- Cron routes return `401` unless the cron secret is present and valid
- Do not change these response shapes mid-sprint without syncing with frontend

## Suggested Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

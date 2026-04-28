# Jam'iyya AI

Jam'iyya AI is a Next.js 14 prototype for digital savings circles with AI trust scoring, virtual wallets, and collective insurance.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- next-intl for Arabic and English
- Supabase for auth, database, and storage
- Google Gemini API for AI features
- Framer Motion, Recharts, react-hook-form, zod, and Sonner

## Project Structure

- `src/app/[locale]` contains localized routes for landing, auth, and dashboard flows.
- `src/lib/supabase` contains browser, server, and middleware helpers.
- `src/lib/ai` contains Gemini wrappers and prompt templates.
- `src/lib/utils` contains trust scoring, jam3iyya rules, and formatting helpers.
- `src/types` contains the TypeScript model layer.
- `supabase/migrations` contains the initial schema.

## Local Setup

1. Copy `.env.local.example` to `.env.local`.
2. Fill in the Supabase and Gemini values.
3. Install dependencies with `npm install`.
4. Start the app with `npm run dev`.

## Scripts

- `npm run dev` - start the development server
- `npm run build` - build for production
- `npm run start` - run the production build
- `npm run lint` - run ESLint
- `npm run type-check` - run TypeScript checks
- `npm run format` - format TypeScript and Markdown files

## Environment Variables

Required variables are documented in `.env.local.example`.

## Supabase

Run the migration in `supabase/migrations/20260428000000_initial_schema.sql` to create the initial tables, RLS policies, and triggers.

## Team Onboarding

### Quick Setup

```bash
git clone https://github.com/[your-username]/jam3iyya-ai.git
cd jam3iyya-ai
npm install
cp .env.local.example .env.local
npm run dev
```

### Branch Naming

- `feature/[your-name]/[feature-name]`
- `fix/[your-name]/[bug-description]`
- `docs/[description]`

### Commit Messages

- `feat: add trust score calculation`
- `fix: resolve payment validation bug`
- `style: improve dashboard layout`
- `docs: update README`

### Suggested Team Split

- Frontend lead: landing page, auth, dashboard, UI system
- Backend lead: Supabase schema, auth, API routes
- Features lead: jam3iyya creation, browse, and member flows
- AI lead: trust scoring, document analysis, notifications

## Verification Checklist

- `npm install` completes successfully
- `npm run type-check` passes
- `npm run lint` passes
- `/ar` loads the landing page
- `/ar/dashboard` loads a dashboard placeholder
- Supabase migration applies without errors

## Notes

- This prototype uses virtual balances for demo purposes.
- Arabic-first layout support is wired through locale routes and font loading.# Jam-iyya
Jam'iyya AI digitizes the traditional Arab savings circle (jam'iyya) used by over 50% of Arabs. We solve its biggest flaw — reliance on personal trust — through AI-powered member scoring, automated escrow, and a collective insurance fund. The result: safe, scalable group savings, even among strangers.

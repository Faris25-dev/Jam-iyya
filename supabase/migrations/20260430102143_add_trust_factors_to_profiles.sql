-- Add trust factor columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS has_uploaded_id boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_uploaded_selfie boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_linked_bank boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_income_doc boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_age_months integer DEFAULT 6;

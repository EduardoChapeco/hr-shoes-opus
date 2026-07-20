-- Migration 0069: Support for Manual Reviews with custom names

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

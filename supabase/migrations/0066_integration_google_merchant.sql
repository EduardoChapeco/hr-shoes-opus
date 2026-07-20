-- Migration 0060: Add google_merchant_center to integration_provider

ALTER TYPE public.integration_provider ADD VALUE IF NOT EXISTS 'google_merchant_center';

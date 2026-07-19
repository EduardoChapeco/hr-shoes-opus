-- Hr Shoes Commerce — Migration 0064: Customer Identities and LGPD Consent

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS tax_id VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS is_consent_lgpd BOOLEAN NOT NULL DEFAULT false;

-- Add comment for audit / documentation
COMMENT ON COLUMN public.profiles.tax_id IS 'CPF ou CNPJ do cliente/usuário';
COMMENT ON COLUMN public.profiles.is_consent_lgpd IS 'Consentimento formal com os termos da LGPD';

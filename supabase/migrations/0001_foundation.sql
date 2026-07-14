-- ============================================================================
-- Hr Shoes Commerce — Migration 0001: Foundation
-- ============================================================================
-- Schema: multi-tenant foundation with organizations, stores, profiles and
-- an append-only audit log.
--
-- Rules:
--  - RLS is enabled on every table (deny-by-default).
--  - organization_id is present on every commercial table.
--  - Secrets and PAN/CVV never stored here.
--  - audit_log is append-only (no UPDATE/DELETE allowed via RLS).
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  slug        TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Only service_role (server) can manage organizations.
-- No public RLS policy = deny all by default.

-- ---------------------------------------------------------------------------
-- stores
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  slug             TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  -- Flexible config: announcement text, business hours, contact, benefits, etc.
  -- Validated at the application layer (Zod schema in store-config.functions.ts).
  settings         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  store_id         UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  role             TEXT NOT NULL DEFAULT 'customer'
                     CHECK (role IN ('owner','admin','manager','seller','stock','finance','content','support','customer')),
  full_name        TEXT CHECK (char_length(full_name) <= 200),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- A user can read their own profile.
CREATE POLICY "profiles_self_read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- A user can update their own profile (limited fields enforced at app layer).
CREATE POLICY "profiles_self_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Staff can read profiles within the same organization.
-- (Full policy with role checks added in Phase 2 when auth is fully wired.)
CREATE POLICY "profiles_org_staff_read"
  ON public.profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- audit_log (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  store_id        UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  actor_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL CHECK (char_length(action) <= 100),
  entity_type     TEXT NOT NULL CHECK (char_length(entity_type) <= 100),
  entity_id       TEXT NOT NULL CHECK (char_length(entity_id) <= 100),
  -- before/after are redacted: no PAN, passwords, tokens, full PIIs.
  before_redacted JSONB,
  after_redacted  JSONB,
  request_id      TEXT,
  ip_hash         TEXT, -- hashed, not raw IP (LGPD compliance)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Insert allowed from server (service_role bypasses RLS).
-- No SELECT policy for public users — read via server functions only.
-- UPDATE and DELETE intentionally have no policy → denied for everyone (append-only).

-- Index for common queries
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON public.audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx  ON public.audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_org_idx    ON public.audit_log (organization_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Trigger: auto-update updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

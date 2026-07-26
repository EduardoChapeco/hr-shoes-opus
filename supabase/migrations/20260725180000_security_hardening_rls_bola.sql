-- ============================================================================
-- Hr Shoes Commerce — Migration 20260725180000: Security Hardening & BOLA Fix
-- ============================================================================
-- Fixes critical vulnerabilities:
-- 1. Mass Assignment / Privilege Escalation in profiles.
-- 2. BOLA (Broken Object Level Authorization) in carts.

BEGIN;

-- 1. Prevent Privilege Escalation on profiles
-- We add a trigger to ensure that authenticated users cannot alter their own role, organization_id, or store_id.
-- Only service_role (which bypasses triggers if set to REPLICA, but we will just check auth.role()) 
-- or specific functions can change these. 
-- Actually, the simplest approach for Supabase is to check current_setting('request.jwt.claims', true).
-- If it's a normal user, we revert any changes to sensitive columns.

CREATE OR REPLACE FUNCTION public.trg_prevent_profile_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If the update is coming from the web client (authenticated or anon)
  IF current_setting('request.jwt.claim.role', true) IN ('authenticated', 'anon') THEN
    -- Force the sensitive columns to remain the same as before
    NEW.role = OLD.role;
    NEW.organization_id = OLD.organization_id;
    NEW.store_id = OLD.store_id;
    NEW.is_consent_lgpd = OLD.is_consent_lgpd;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_profile_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_prevent_profile_escalation();


-- 2. Fix BOLA on carts and cart_items
-- The previous policies allowed anyone to read/write any cart that had a session_token.
-- We restrict carts strictly to their authenticated owners.
-- Guest carts (session_token based) are now exclusively accessible via Server Functions (service_role),
-- which bypass RLS. This eliminates the vulnerability on the public REST/GraphQL API.

DROP POLICY IF EXISTS "carts_customer_own" ON public.carts;
CREATE POLICY "carts_customer_own"
  ON public.carts FOR ALL
  USING (
    customer_id IS NOT NULL AND auth.uid() = customer_id
  );

DROP POLICY IF EXISTS "cart_items_via_cart" ON public.cart_items;
CREATE POLICY "cart_items_via_cart"
  ON public.cart_items FOR ALL
  USING (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE customer_id IS NOT NULL AND auth.uid() = customer_id
    )
  );

COMMIT;

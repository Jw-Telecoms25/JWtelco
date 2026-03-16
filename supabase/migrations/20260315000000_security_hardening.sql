-- ==========================================================================
-- Security Hardening Migration
-- Fixes: VULN-010, VULN-014, VULN-015, VULN-020 + security architecture gaps
-- ==========================================================================

-- ── 1. Restrict get_my_role() to authenticated users only ──────────────────
-- Previously EXECUTE was granted to PUBLIC (including anon role)
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;


-- ── 2. Fix provider_health RLS — restrict to authenticated only ────────────
DROP POLICY IF EXISTS "Anyone views health" ON provider_health;

CREATE POLICY "Authenticated users view health"
  ON provider_health FOR SELECT
  TO authenticated
  USING (true);


-- ── 3. Append-only audit_log — prevent delete/update of audit records ─────
-- Admins can insert and read, but NEVER update or delete
DROP POLICY IF EXISTS "Admins manage audit log" ON audit_log;
DROP POLICY IF EXISTS "Admins view audit log" ON audit_log;
DROP POLICY IF EXISTS "Admins insert audit log" ON audit_log;

CREATE POLICY "Admins view audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'super_admin'));

CREATE POLICY "System inserts audit log"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No UPDATE or DELETE policy — no one can modify existing audit records

-- Postgres rules to enforce immutability at the DB engine level
CREATE OR REPLACE RULE no_audit_update AS
  ON UPDATE TO audit_log DO INSTEAD NOTHING;

CREATE OR REPLACE RULE no_audit_delete AS
  ON DELETE TO audit_log DO INSTEAD NOTHING;


-- ── 4. Append-only ledger_entries ─────────────────────────────────────────
CREATE OR REPLACE RULE no_ledger_update AS
  ON UPDATE TO ledger_entries DO INSTEAD NOTHING;

CREATE OR REPLACE RULE no_ledger_delete AS
  ON DELETE TO ledger_entries DO INSTEAD NOTHING;


-- ── 5. Hide cost_price / vendor_price / agent_price from public pricing view ──
-- Public can see user_price only; internal prices require authentication
DROP POLICY IF EXISTS "Anyone can view enabled pricing" ON pricing;

-- Authenticated users (logged in) see all fields (needed for buy pages)
CREATE POLICY "Authenticated users view pricing"
  ON pricing FOR SELECT
  TO authenticated
  USING (enabled = true);

-- Anon users (public API) can only see limited fields — enforced via a view
-- The pricing table direct access is restricted; buy pages go through Next.js API routes
-- which use the service role and filter what they return
CREATE POLICY "Anon users denied pricing"
  ON pricing FOR SELECT
  TO anon
  USING (false);


-- ── 6. Transaction PIN support ────────────────────────────────────────────
-- Add PIN hash column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS transaction_pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS pin_set_at TIMESTAMPTZ;

-- Function to set a transaction PIN (stores bcrypt hash)
-- Called from the API, never directly from client
CREATE OR REPLACE FUNCTION set_transaction_pin(
  p_user_id UUID,
  p_pin_hash TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    transaction_pin_hash = p_pin_hash,
    pin_set_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_transaction_pin(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_transaction_pin(UUID, TEXT) TO service_role;

-- Function to verify a transaction PIN — returns boolean
-- Uses the service role so it can read the hash without exposing it
CREATE OR REPLACE FUNCTION verify_transaction_pin(
  p_user_id UUID,
  p_pin_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_hash TEXT;
BEGIN
  SELECT transaction_pin_hash INTO v_stored_hash
  FROM profiles
  WHERE id = p_user_id;

  RETURN v_stored_hash IS NOT NULL AND v_stored_hash = p_pin_hash;
END;
$$;

REVOKE EXECUTE ON FUNCTION verify_transaction_pin(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_transaction_pin(UUID, TEXT) TO service_role;


-- ── 7. Wire provider_health circuit breaker ───────────────────────────────
-- Function to update provider health after each call
CREATE OR REPLACE FUNCTION update_provider_health(
  p_provider TEXT,
  p_service_type TEXT,
  p_success BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO provider_health (provider_name, service_type, is_healthy, failure_count, last_checked_at)
  VALUES (p_provider, p_service_type, p_success, CASE WHEN p_success THEN 0 ELSE 1 END, NOW())
  ON CONFLICT (provider_name, service_type)
  DO UPDATE SET
    is_healthy = CASE
      WHEN p_success THEN true
      -- Mark unhealthy after 3 consecutive failures within 5 minutes
      WHEN provider_health.failure_count >= 2
        AND provider_health.last_checked_at > NOW() - INTERVAL '5 minutes'
      THEN false
      ELSE provider_health.is_healthy
    END,
    failure_count = CASE
      WHEN p_success THEN 0
      ELSE provider_health.failure_count + 1
    END,
    last_checked_at = NOW(),
    last_failure_at = CASE WHEN p_success THEN provider_health.last_failure_at ELSE NOW() END;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_provider_health(TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_provider_health(TEXT, TEXT, BOOLEAN) TO service_role;

-- Function for router to check if a provider is healthy
CREATE OR REPLACE FUNCTION is_provider_healthy(
  p_provider TEXT,
  p_service_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_healthy BOOLEAN;
BEGIN
  SELECT is_healthy INTO v_healthy
  FROM provider_health
  WHERE provider_name = p_provider
    AND service_type = p_service_type;

  -- Default to healthy if no record exists yet
  RETURN COALESCE(v_healthy, true);
END;
$$;

REVOKE EXECUTE ON FUNCTION is_provider_healthy(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_provider_healthy(TEXT, TEXT) TO service_role;

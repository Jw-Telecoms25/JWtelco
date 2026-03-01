-- =====================================================
-- JWTelecoms VTU Platform — Database Schema V2 (Hardened)
-- Deploy to: cbemseoylswcefkhtzts.supabase.co
-- Date: 2026-03-01
-- =====================================================
-- Changes from V1:
--   1. Financial FKs use RESTRICT (not CASCADE)
--   2. Profiles: +deleted_at, +referral_code, +referred_by, +notification_preferences
--   3. Transactions: +idempotency_key with partial unique index
--   4. Audit log: admin_id nullable, +actor_type column
--   5. New tables: provider_transactions, payment_sessions, webhook_events,
--      provider_health, beneficiaries
--   6. Additional composite indexes for query performance
--   7. Missing pricing updated_at trigger added
--   8. Services seeded with real provider names (not 'mock')
-- =====================================================

-- ========== 1. ENUMS ==========

CREATE TYPE user_role AS ENUM ('user', 'agent', 'admin', 'super_admin');
CREATE TYPE user_status AS ENUM ('active', 'blocked', 'suspended');
CREATE TYPE wallet_type AS ENUM ('main', 'bonus', 'commission');
CREATE TYPE transaction_type AS ENUM ('funding', 'airtime', 'data', 'electricity', 'cable', 'exam_pin', 'transfer', 'reversal');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'success', 'failed', 'reversed');
CREATE TYPE ledger_direction AS ENUM ('debit', 'credit');
CREATE TYPE notification_target AS ENUM ('all', 'user', 'agents', 'admins');
CREATE TYPE provider_status AS ENUM ('pending', 'delivered', 'failed', 'reversed', 'unknown');

-- ========== 2. TABLES ==========

-- 2.1 Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'active',
  deleted_at TIMESTAMPTZ,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  notification_preferences JSONB NOT NULL DEFAULT '{"sms": true, "email": true, "push": false}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 Wallets — RESTRICT delete (never lose financial records)
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  type wallet_type NOT NULL DEFAULT 'main',
  balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, type)
);

-- 2.3 Transactions — RESTRICT delete, +idempotency_key
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  type transaction_type NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  profit BIGINT NOT NULL DEFAULT 0,
  status transaction_status NOT NULL DEFAULT 'pending',
  reference TEXT NOT NULL UNIQUE,
  idempotency_key TEXT,
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 Ledger entries (double-entry bookkeeping) — RESTRICT delete
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  direction ledger_direction NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type transaction_type NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT 'vtpass',
  provider_config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 Pricing plans
CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  plan_name TEXT NOT NULL,
  plan_code TEXT NOT NULL,
  network TEXT,
  user_price BIGINT NOT NULL CHECK (user_price >= 0),
  agent_price BIGINT NOT NULL CHECK (agent_price >= 0),
  vendor_price BIGINT NOT NULL CHECK (vendor_price >= 0),
  cost_price BIGINT NOT NULL CHECK (cost_price >= 0),
  validity TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  target notification_target NOT NULL DEFAULT 'user',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8 Audit log — admin_id NOW NULLABLE for system events
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL DEFAULT 'admin'
    CHECK (actor_type IN ('admin', 'system', 'cron', 'webhook')),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9 Provider Transactions — tracks every external provider API call
CREATE TABLE provider_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL,
  provider_reference TEXT NOT NULL UNIQUE,
  provider_transaction_id TEXT,
  provider_status provider_status NOT NULL DEFAULT 'pending',
  is_fallback BOOLEAN NOT NULL DEFAULT false,
  request_payload JSONB NOT NULL DEFAULT '{}',
  response_payload JSONB NOT NULL DEFAULT '{}',
  requery_count INT NOT NULL DEFAULT 0,
  last_requeried_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.10 Payment Sessions — tracks gateway payment initializations
CREATE TABLE payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  gateway TEXT NOT NULL,
  gateway_reference TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed', 'expired')),
  callback_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- 2.11 Webhook Events — idempotent webhook processing log
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature_valid BOOLEAN NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.12 Provider Health — circuit breaker state
CREATE TABLE provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  service_type TEXT NOT NULL,
  success_count INT NOT NULL DEFAULT 0,
  failure_count INT NOT NULL DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  is_healthy BOOLEAN NOT NULL DEFAULT true,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, service_type)
);

-- 2.13 Beneficiaries — saved recipients
CREATE TABLE beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  service_type transaction_type NOT NULL,
  identifier TEXT NOT NULL,
  network TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_type, identifier)
);


-- ========== 3. INDEXES ==========

-- Wallets
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- Transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE UNIQUE INDEX idx_transactions_idempotency
  ON transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_txn_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_txn_user_status ON transactions(user_id, status);
CREATE INDEX idx_txn_status_type ON transactions(status, type);

-- Ledger entries
CREATE INDEX idx_ledger_entries_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_entries_wallet_id ON ledger_entries(wallet_id);

-- Pricing
CREATE INDEX idx_pricing_service_id ON pricing(service_id);
CREATE INDEX idx_pricing_plan_enabled ON pricing(plan_code, enabled);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Audit log
CREATE INDEX idx_audit_log_admin_id ON audit_log(admin_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- Provider transactions
CREATE INDEX idx_ptxn_transaction ON provider_transactions(transaction_id);
CREATE INDEX idx_ptxn_ref ON provider_transactions(provider_reference);
CREATE INDEX idx_ptxn_pending ON provider_transactions(provider_status, last_requeried_at)
  WHERE provider_status = 'pending';

-- Payment sessions
CREATE UNIQUE INDEX idx_ps_gateway_ref ON payment_sessions(gateway, gateway_reference);
CREATE INDEX idx_ps_user ON payment_sessions(user_id);
CREATE INDEX idx_ps_status ON payment_sessions(status) WHERE status = 'pending';

-- Webhook events
CREATE UNIQUE INDEX idx_we_dedup ON webhook_events(gateway, event_id);
CREATE INDEX idx_we_unprocessed ON webhook_events(processed) WHERE processed = false;

-- Beneficiaries
CREATE INDEX idx_beneficiaries_user ON beneficiaries(user_id);


-- ========== 4. TRIGGERS ==========

-- updated_at auto-setter
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_wallets_updated_at
  BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_pricing_updated_at
  BEFORE UPDATE ON pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_provider_transactions_updated_at
  BEFORE UPDATE ON provider_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ========== 5. AUTO-PROVISION TRIGGER ==========

-- New auth.users signup → create profile + wallet automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referral TEXT;
  v_attempts INT := 0;
BEGIN
  LOOP
    v_referral := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    v_attempts := v_attempts + 1;
    BEGIN
      INSERT INTO profiles (id, first_name, last_name, email, phone, referral_code)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.email, ''),
        NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
        v_referral
      );
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempts >= 5 THEN RAISE; END IF;
    END;
  END LOOP;

  INSERT INTO wallets (user_id, type, balance) VALUES (NEW.id, 'main', 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ========== 6. WALLET TRANSACTION FUNCTION ==========

-- Atomic debit/credit with row locking — the core financial operation
CREATE OR REPLACE FUNCTION process_wallet_transaction(
  p_user_id UUID,
  p_amount BIGINT,
  p_type transaction_type,
  p_description TEXT,
  p_reference TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_transaction_id UUID;
  v_new_balance BIGINT;
BEGIN
  -- Lock the wallet row to prevent concurrent modifications
  SELECT * INTO v_wallet
  FROM wallets
  WHERE user_id = p_user_id AND type = 'main'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

  -- Determine direction by transaction type
  IF p_type IN ('airtime', 'data', 'electricity', 'cable', 'exam_pin', 'transfer') THEN
    -- Debit: subtract from balance
    v_new_balance := v_wallet.balance - p_amount;
    IF v_new_balance < 0 THEN
      RAISE EXCEPTION 'Insufficient wallet balance. Available: %, Required: %', v_wallet.balance, p_amount;
    END IF;
  ELSE
    -- Credit: add to balance (funding, reversal)
    v_new_balance := v_wallet.balance + p_amount;
  END IF;

  -- Create transaction record (status = processing, not pending)
  INSERT INTO transactions (user_id, type, amount, status, reference, description, metadata)
  VALUES (p_user_id, p_type, p_amount, 'processing', p_reference, p_description, p_metadata)
  RETURNING id INTO v_transaction_id;

  -- Create ledger entry (immutable audit trail)
  INSERT INTO ledger_entries (transaction_id, wallet_id, direction, amount, balance_before, balance_after)
  VALUES (
    v_transaction_id,
    v_wallet.id,
    CASE WHEN p_type IN ('airtime', 'data', 'electricity', 'cable', 'exam_pin', 'transfer')
         THEN 'debit' ELSE 'credit' END,
    p_amount,
    v_wallet.balance,
    v_new_balance
  );

  -- Update wallet balance
  UPDATE wallets SET balance = v_new_balance WHERE id = v_wallet.id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========== 6b. FUNCTION PERMISSIONS ==========

-- CRITICAL: Prevent client-side RPC calls to financial functions.
-- Only the service_role key (used by API routes) can invoke these.
REVOKE EXECUTE ON FUNCTION process_wallet_transaction FROM anon, authenticated;

-- ========== 7. ROW-LEVEL SECURITY ==========

-- Enable RLS on ALL tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

-- ---- Profiles ----
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND status = (SELECT status FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
    OR role != 'super_admin'
  );

-- ---- Wallets ----
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON wallets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- ---- Transactions ----
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- ---- Ledger Entries ----
CREATE POLICY "Users can view own ledger entries"
  ON ledger_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wallets w
      WHERE w.id = ledger_entries.wallet_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all ledger entries"
  ON ledger_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- ---- Services ----
CREATE POLICY "Anyone can view enabled services"
  ON services FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can manage services"
  ON services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- ---- Pricing ----
CREATE POLICY "Anyone can view enabled pricing"
  ON pricing FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can manage pricing"
  ON pricing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- ---- Notifications ----
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (
    auth.uid() = user_id
    OR target = 'all'
    OR (
      target = 'agents' AND EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'agent'
      )
    )
    OR (
      target = 'admins' AND EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id OR target = 'all')
  WITH CHECK (auth.uid() = user_id OR target = 'all');

CREATE POLICY "Admins can manage notifications"
  ON notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- ---- Audit Log ----
CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert audit log"
  ON audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- ---- Provider Transactions (admin only — users see via parent txn) ----
CREATE POLICY "Admins view provider txns"
  ON provider_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- ---- Payment Sessions ----
CREATE POLICY "Users view own sessions"
  ON payment_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all sessions"
  ON payment_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- ---- Webhook Events (admin only) ----
CREATE POLICY "Admins view webhooks"
  ON webhook_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- ---- Provider Health (public read for status page) ----
CREATE POLICY "Anyone views health"
  ON provider_health FOR SELECT
  USING (true);

-- ---- Beneficiaries (user manages own) ----
CREATE POLICY "Users manage own beneficiaries"
  ON beneficiaries FOR ALL
  USING (auth.uid() = user_id);


-- ========== 8. SEED SERVICES ==========

INSERT INTO services (name, slug, type, description, provider) VALUES
  ('Airtime', 'airtime', 'airtime', 'Buy airtime for any Nigerian network', 'maskawa'),
  ('Data Bundle', 'data', 'data', 'Buy data bundles for any Nigerian network', 'multi'),
  ('Electricity', 'electricity', 'electricity', 'Pay electricity bills and get tokens', 'vtpass'),
  ('Cable TV', 'cable', 'cable', 'Subscribe to DStv, GOtv, and StarTimes', 'vtpass'),
  ('Exam Pins', 'exam-pins', 'exam_pin', 'Buy WAEC, NECO, and NABTEB scratch cards', 'vtpass');

-- Seed provider health entries
INSERT INTO provider_health (provider, service_type) VALUES
  ('vtpass', 'electricity'),
  ('vtpass', 'cable'),
  ('vtpass', 'exam_pin'),
  ('vtpass', 'airtime'),
  ('vtpass', 'data'),
  ('maskawa', 'airtime'),
  ('alrahuz', 'data'),
  ('gladtidings', 'data');


-- ========== DONE ==========
-- Next steps:
-- 1. Run supabase-seed-pricing.sql to load pricing plans
-- 2. Create first admin: UPDATE profiles SET role = 'super_admin' WHERE email = 'your@email.com';

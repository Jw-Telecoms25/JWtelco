-- Repair migration: Apply missing functions, triggers, RLS policies

-- ========== 1. FUNCTIONS ==========

-- updated_at auto-setter
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-provision trigger function: creates profile + wallet on signup
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

-- Core financial operation: atomic debit/credit with row locking
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
  SELECT * INTO v_wallet
  FROM wallets
  WHERE user_id = p_user_id AND type = 'main'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

  IF p_type IN ('airtime', 'data', 'electricity', 'cable', 'exam_pin', 'transfer') THEN
    v_new_balance := v_wallet.balance - p_amount;
    IF v_new_balance < 0 THEN
      RAISE EXCEPTION 'Insufficient wallet balance. Available: %, Required: %', v_wallet.balance, p_amount;
    END IF;
  ELSE
    v_new_balance := v_wallet.balance + p_amount;
  END IF;

  INSERT INTO transactions (user_id, type, amount, status, reference, description, metadata)
  VALUES (p_user_id, p_type, p_amount, 'processing', p_reference, p_description, p_metadata)
  RETURNING id INTO v_transaction_id;

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

  UPDATE wallets SET balance = v_new_balance WHERE id = v_wallet.id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========== 2. TRIGGERS ==========

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_wallets_updated_at ON wallets;
CREATE TRIGGER set_wallets_updated_at
  BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_transactions_updated_at ON transactions;
CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_services_updated_at ON services;
CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_pricing_updated_at ON pricing;
CREATE TRIGGER set_pricing_updated_at
  BEFORE UPDATE ON pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_provider_transactions_updated_at ON provider_transactions;
CREATE TRIGGER set_provider_transactions_updated_at
  BEFORE UPDATE ON provider_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ========== 3. FUNCTION PERMISSIONS ==========

REVOKE EXECUTE ON FUNCTION process_wallet_transaction FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION process_wallet_transaction TO service_role;


-- ========== 4. ROW-LEVEL SECURITY ==========

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

-- Drop all existing policies first (idempotent)
DO $$
DECLARE
  _tbl TEXT;
  _pol RECORD;
BEGIN
  FOR _tbl IN SELECT unnest(ARRAY[
    'profiles','wallets','transactions','ledger_entries','services',
    'pricing','notifications','audit_log','provider_transactions',
    'payment_sessions','webhook_events','provider_health','beneficiaries'
  ])
  LOOP
    FOR _pol IN
      SELECT policyname FROM pg_policies WHERE tablename = _tbl AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', _pol.policyname, _tbl);
    END LOOP;
  END LOOP;
END $$;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
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
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
    OR role != 'super_admin'
  );

-- Wallets
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON wallets FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Ledger Entries
CREATE POLICY "Users can view own ledger entries"
  ON ledger_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM wallets w WHERE w.id = ledger_entries.wallet_id AND w.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all ledger entries"
  ON ledger_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Services
CREATE POLICY "Anyone can view enabled services"
  ON services FOR SELECT USING (enabled = true);

CREATE POLICY "Admins can manage services"
  ON services FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Pricing
CREATE POLICY "Anyone can view enabled pricing"
  ON pricing FOR SELECT USING (enabled = true);

CREATE POLICY "Admins can manage pricing"
  ON pricing FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (
    auth.uid() = user_id OR target = 'all'
    OR (target = 'agents' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'agent'))
    OR (target = 'admins' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')))
  );

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id OR target = 'all')
  WITH CHECK (auth.uid() = user_id OR target = 'all');

CREATE POLICY "Admins can manage notifications"
  ON notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Audit Log
CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can insert audit log"
  ON audit_log FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Provider Transactions
CREATE POLICY "Admins view provider txns"
  ON provider_transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Payment Sessions
CREATE POLICY "Users view own sessions"
  ON payment_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view all sessions"
  ON payment_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Webhook Events
CREATE POLICY "Admins view webhooks"
  ON webhook_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Provider Health
CREATE POLICY "Anyone views health"
  ON provider_health FOR SELECT USING (true);

-- Beneficiaries
CREATE POLICY "Users manage own beneficiaries"
  ON beneficiaries FOR ALL USING (auth.uid() = user_id);


-- ========== 5. SEED SERVICES (idempotent) ==========

INSERT INTO services (name, slug, type, description, provider) VALUES
  ('Airtime', 'airtime', 'airtime', 'Buy airtime for any Nigerian network', 'maskawa'),
  ('Data Bundle', 'data', 'data', 'Buy data bundles for any Nigerian network', 'multi'),
  ('Electricity', 'electricity', 'electricity', 'Pay electricity bills and get tokens', 'vtpass'),
  ('Cable TV', 'cable', 'cable', 'Subscribe to DStv, GOtv, and StarTimes', 'vtpass'),
  ('Exam Pins', 'exam-pins', 'exam_pin', 'Buy WAEC, NECO, and NABTEB scratch cards', 'vtpass')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO provider_health (provider, service_type) VALUES
  ('vtpass', 'electricity'),
  ('vtpass', 'cable'),
  ('vtpass', 'exam_pin'),
  ('vtpass', 'airtime'),
  ('vtpass', 'data'),
  ('maskawa', 'airtime'),
  ('alrahuz', 'data'),
  ('gladtidings', 'data')
ON CONFLICT (provider, service_type) DO NOTHING;


-- ========== 6. UNIQUE INDEX: prevent duplicate referral bonuses ==========

CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_bonus_referee
  ON transactions(user_id)
  WHERE type = 'referral_bonus';


-- ========== DONE ==========

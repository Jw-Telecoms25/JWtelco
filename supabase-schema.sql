-- =====================================================
-- JWTelecoms VTU Platform — Full Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. ENUMS
-- =====================================================
CREATE TYPE user_role AS ENUM ('user', 'agent', 'admin', 'super_admin');
CREATE TYPE user_status AS ENUM ('active', 'blocked', 'suspended');
CREATE TYPE wallet_type AS ENUM ('main', 'bonus', 'commission');
CREATE TYPE transaction_type AS ENUM ('funding', 'airtime', 'data', 'electricity', 'cable', 'exam_pin', 'transfer', 'reversal');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'success', 'failed', 'reversed');
CREATE TYPE ledger_direction AS ENUM ('debit', 'credit');
CREATE TYPE notification_target AS ENUM ('all', 'user', 'agents', 'admins');

-- 2. TABLES
-- =====================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type wallet_type NOT NULL DEFAULT 'main',
  balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, type)
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  profit BIGINT NOT NULL DEFAULT 0,
  status transaction_status NOT NULL DEFAULT 'pending',
  reference TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ledger entries (double-entry bookkeeping)
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  direction ledger_direction NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type transaction_type NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT 'mock',
  provider_config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pricing plans
CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
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

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  target notification_target NOT NULL DEFAULT 'user',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
-- =====================================================
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_ledger_entries_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_entries_wallet_id ON ledger_entries(wallet_id);
CREATE INDEX idx_pricing_service_id ON pricing(service_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_audit_log_admin_id ON audit_log(admin_id);

-- 4. UPDATED_AT TRIGGER
-- =====================================================
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

-- 5. AUTO-PROVISION TRIGGER (new user → profile + wallet)
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  INSERT INTO wallets (user_id, type, balance) VALUES (NEW.id, 'main', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. WALLET TRANSACTION FUNCTION (safe debit/credit with locking)
-- =====================================================
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

  -- For debits (purchases), amount is negative; for credits (funding), positive
  -- p_amount is always positive; direction is determined by transaction type
  IF p_type IN ('airtime', 'data', 'electricity', 'cable', 'exam_pin', 'transfer') THEN
    -- Debit
    v_new_balance := v_wallet.balance - p_amount;
    IF v_new_balance < 0 THEN
      RAISE EXCEPTION 'Insufficient wallet balance. Available: %, Required: %', v_wallet.balance, p_amount;
    END IF;
  ELSE
    -- Credit (funding, reversal)
    v_new_balance := v_wallet.balance + p_amount;
  END IF;

  -- Create transaction record
  INSERT INTO transactions (user_id, type, amount, status, reference, description, metadata)
  VALUES (p_user_id, p_type, p_amount, 'processing', p_reference, p_description, p_metadata)
  RETURNING id INTO v_transaction_id;

  -- Create ledger entry
  INSERT INTO ledger_entries (transaction_id, wallet_id, direction, amount, balance_before, balance_after)
  VALUES (
    v_transaction_id,
    v_wallet.id,
    CASE WHEN p_type IN ('airtime', 'data', 'electricity', 'cable', 'exam_pin', 'transfer') THEN 'debit' ELSE 'credit' END,
    p_amount,
    v_wallet.balance,
    v_new_balance
  );

  -- Update wallet balance
  UPDATE wallets SET balance = v_new_balance WHERE id = v_wallet.id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ROW-LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read own profile; admins can read all
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
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())  -- can't change own role
    AND status = (SELECT status FROM profiles WHERE id = auth.uid())  -- can't change own status
  );

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- Wallets: users can read own wallet only
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

-- Transactions: users can read own transactions
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

-- Ledger entries: users can read own via wallet
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

-- Services: everyone can read enabled services
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

-- Pricing: everyone can read enabled pricing
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

-- Notifications: users can read their own + broadcast notifications
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

-- Audit log: admins only
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

-- 8. SEED SERVICES
-- =====================================================
INSERT INTO services (name, slug, type, description, provider) VALUES
  ('Airtime', 'airtime', 'airtime', 'Buy airtime for any Nigerian network', 'mock'),
  ('Data Bundle', 'data', 'data', 'Buy data bundles for any Nigerian network', 'mock'),
  ('Electricity', 'electricity', 'electricity', 'Pay electricity bills and get tokens', 'mock'),
  ('Cable TV', 'cable', 'cable', 'Subscribe to DStv, GOtv, and StarTimes', 'mock'),
  ('Exam Pins', 'exam-pins', 'exam_pin', 'Buy WAEC, NECO, and NABTEB scratch cards', 'mock');

-- Done! Now set up your admin user by updating their role after they register:
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'your-admin-email@example.com';

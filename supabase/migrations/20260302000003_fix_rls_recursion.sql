-- Fix infinite recursion in RLS policies.
-- Policies on "profiles" cannot query "profiles" — that causes infinite recursion.
-- Solution: use a SECURITY DEFINER helper that bypasses RLS to check the user's role.

-- 1. Create a role-lookup function that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public;

-- 2. Drop all existing policies on tables that had the recursion pattern
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

-- 3. Recreate all policies using get_my_role() instead of subqueries on profiles

-- Profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (
    public.get_my_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
    AND status = (SELECT p.status FROM profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (public.get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (
    public.get_my_role() = 'super_admin'
    OR role != 'super_admin'
  );

-- Wallets
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON wallets FOR SELECT USING (
    public.get_my_role() IN ('admin', 'super_admin')
  );

-- Transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT USING (
    public.get_my_role() IN ('admin', 'super_admin')
  );

-- Ledger Entries
CREATE POLICY "Users can view own ledger entries"
  ON ledger_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM wallets w WHERE w.id = ledger_entries.wallet_id AND w.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all ledger entries"
  ON ledger_entries FOR SELECT USING (
    public.get_my_role() IN ('admin', 'super_admin')
  );

-- Services
CREATE POLICY "Anyone can view enabled services"
  ON services FOR SELECT USING (enabled = true);

CREATE POLICY "Admins can manage services"
  ON services FOR ALL USING (
    public.get_my_role() IN ('admin', 'super_admin')
  );

-- Pricing
CREATE POLICY "Anyone can view enabled pricing"
  ON pricing FOR SELECT USING (enabled = true);

CREATE POLICY "Admins can manage pricing"
  ON pricing FOR ALL USING (
    public.get_my_role() IN ('admin', 'super_admin')
  );

-- Notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (
    auth.uid() = user_id OR target = 'all'
    OR (target = 'agents' AND public.get_my_role() = 'agent')
    OR (target = 'admins' AND public.get_my_role() IN ('admin', 'super_admin'))
  );

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id OR target = 'all')
  WITH CHECK (auth.uid() = user_id OR target = 'all');

CREATE POLICY "Admins can manage notifications"
  ON notifications FOR ALL USING (
    public.get_my_role() IN ('admin', 'super_admin')
  );

-- Audit Log
CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT USING (
    public.get_my_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can insert audit log"
  ON audit_log FOR INSERT WITH CHECK (
    public.get_my_role() IN ('admin', 'super_admin')
  );

-- Provider Transactions
CREATE POLICY "Admins view provider txns"
  ON provider_transactions FOR SELECT USING (
    public.get_my_role() IN ('admin', 'super_admin')
  );

-- Payment Sessions
CREATE POLICY "Users view own sessions"
  ON payment_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view all sessions"
  ON payment_sessions FOR SELECT USING (
    public.get_my_role() IN ('admin', 'super_admin')
  );

-- Webhook Events
CREATE POLICY "Admins view webhooks"
  ON webhook_events FOR SELECT USING (
    public.get_my_role() IN ('admin', 'super_admin')
  );

-- Provider Health
CREATE POLICY "Anyone views health"
  ON provider_health FOR SELECT USING (true);

-- Beneficiaries
CREATE POLICY "Users manage own beneficiaries"
  ON beneficiaries FOR ALL USING (auth.uid() = user_id);

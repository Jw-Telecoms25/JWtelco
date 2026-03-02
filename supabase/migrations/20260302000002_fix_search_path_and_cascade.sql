-- Fix search_path on all SECURITY DEFINER functions.
-- Without SET search_path = public, functions called from auth schema context
-- cannot find tables in the public schema.

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
      INSERT INTO public.profiles (id, first_name, last_name, email, phone, referral_code)
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

  INSERT INTO public.wallets (user_id, type, balance) VALUES (NEW.id, 'main', 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;


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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Re-apply permissions after function replacement
REVOKE EXECUTE ON FUNCTION process_wallet_transaction FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION process_wallet_transaction TO service_role;

-- Fix wallets FK to cascade on profile deletion (needed for user account deletion)
ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_user_id_fkey;
ALTER TABLE wallets ADD CONSTRAINT wallets_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

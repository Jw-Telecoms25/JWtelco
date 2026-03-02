-- Simplified trigger function to isolate the failure point
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referral TEXT;
BEGIN
  -- Generate a simple referral code
  v_referral := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.profiles (id, first_name, last_name, email, phone, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.email, ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
    v_referral
  );

  INSERT INTO public.wallets (user_id, type, balance) VALUES (NEW.id, 'main', 0);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error to a debug table if it exists, otherwise raise
  RAISE LOG 'handle_new_user failed: % %', SQLERRM, SQLSTATE;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

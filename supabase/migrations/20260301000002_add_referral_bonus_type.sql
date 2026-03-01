-- Add referral_bonus to transaction_type enum
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'referral_bonus';

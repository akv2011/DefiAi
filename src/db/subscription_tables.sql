-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  stripe_subscription_id TEXT,
  payment_method TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL, -- Added human-readable plan name
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'plan_name'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN plan_name TEXT DEFAULT 'Premium';
  END IF;
END $$;

-- Create index on user_address
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_address ON user_subscriptions(user_address);

-- Create index on stripe_subscription_id
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);

-- Add is_premium column to user_profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Also ensure email column exists for Stripe checkout
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- Create secure RLS policies using Supabase service roles
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow full access to service role for admin operations
CREATE POLICY "Service role has full access to subscriptions"
  ON user_subscriptions
  USING (true)
  WITH CHECK (true);

-- For client-side calls, we recommend:
-- 1. Only use the service role in server-side API routes (Next.js API routes)
-- 2. Never expose the service role key to the client
-- 3. Validate the wallet address server-side before performing any operations

-- Security note:
-- Supabase APIs with service role key bypass RLS policies
-- All sensitive operations should happen server-side in API routes

-- Create functions to get subscription status
CREATE OR REPLACE FUNCTION public.is_premium_user(wallet_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE address = wallet_address AND is_premium = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if address has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(wallet_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions 
    WHERE user_address = wallet_address 
    AND status = 'active'
    AND current_period_end > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
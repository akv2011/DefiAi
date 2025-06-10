-- Migration script to update existing subscription records
-- This will set plan_name based on plan_id for existing subscriptions

-- First ensure the plan_name column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'plan_name'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN plan_name TEXT DEFAULT 'Premium';
  END IF;
END $$;

-- Update plan names for records where plan_id is already 'monthly' or 'annual'
UPDATE user_subscriptions
SET plan_name = 
  CASE 
    WHEN plan_id = 'monthly' THEN 'Premium Monthly'
    WHEN plan_id = 'annual' THEN 'Premium Annual'
    ELSE 'Premium Monthly' -- Default for other cases
  END
WHERE plan_name IS NULL OR plan_name = 'Premium';

-- For records where plan_id is a Stripe price ID, default to Monthly
-- You might want to have a mapping table of Stripe price IDs to plan types, but this is a simple fix
UPDATE user_subscriptions
SET 
  plan_id = 'monthly',
  plan_name = 'Premium Monthly'
WHERE plan_id LIKE 'price_%' AND plan_name IS NULL;

-- Verify the results (add a comment to see how many records were updated)
-- SELECT plan_id, plan_name, COUNT(*) FROM user_subscriptions GROUP BY plan_id, plan_name;
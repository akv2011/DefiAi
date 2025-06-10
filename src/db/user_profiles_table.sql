-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL UNIQUE,
  daily_message_limit INTEGER DEFAULT 10,
  is_premium BOOLEAN DEFAULT FALSE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on address
CREATE INDEX IF NOT EXISTS idx_user_profiles_address ON user_profiles(address);

-- Enable row level security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role has full access to user profiles"
  ON user_profiles
  USING (true)
  WITH CHECK (true);

-- Create message_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS message_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  usage_date DATE NOT NULL,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_address, usage_date)
);

-- Create index on user_address
CREATE INDEX IF NOT EXISTS idx_message_usage_user_address ON message_usage(user_address);

-- Enable row level security
ALTER TABLE message_usage ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role has full access to message usage"
  ON message_usage
  USING (true)
  WITH CHECK (true);
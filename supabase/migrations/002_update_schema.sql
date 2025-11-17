-- Update existing schema (safe to run even if already applied)

-- Add credit_balance column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'credit_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN credit_balance INTEGER DEFAULT 150;
  END IF;
END $$;

-- Ensure workflows table has all required columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflows' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE workflows ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflows' AND column_name = 'thumbnail'
  ) THEN
    ALTER TABLE workflows ADD COLUMN thumbnail TEXT;
  END IF;
END $$;

-- Create workflow_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS workflow_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workflow_id, version_number)
);

-- Enable RLS on workflow_versions if not already enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'workflow_versions') THEN
    ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their workflow versions" ON workflow_versions;
    CREATE POLICY "Users can view their workflow versions"
      ON workflow_versions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM workflows
          WHERE workflows.id = workflow_versions.workflow_id
          AND workflows.owner_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can create workflow versions" ON workflow_versions;
    CREATE POLICY "Users can create workflow versions"
      ON workflow_versions FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM workflows
          WHERE workflows.id = workflow_versions.workflow_id
          AND workflows.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create executions table if it doesn't exist
CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  credits_used INTEGER DEFAULT 0,
  results JSONB
);

-- Enable RLS on executions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'executions') THEN
    ALTER TABLE executions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their own executions" ON executions;
    CREATE POLICY "Users can view their own executions"
      ON executions FOR SELECT
      USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can create executions" ON executions;
    CREATE POLICY "Users can create executions"
      ON executions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create assets table if it doesn't exist
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on assets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'assets') THEN
    ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their own assets" ON assets;
    CREATE POLICY "Users can view their own assets"
      ON assets FOR SELECT
      USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can create assets" ON assets;
    CREATE POLICY "Users can create assets"
      ON assets FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own assets" ON assets;
    CREATE POLICY "Users can delete their own assets"
      ON assets FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create workflow_shares table if it doesn't exist
CREATE TABLE IF NOT EXISTS workflow_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workflow_id, shared_with_user_id)
);

-- Enable RLS on workflow_shares
ALTER TABLE workflow_shares ENABLE ROW LEVEL SECURITY;

-- Only create policy if the table was just created (has the column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_shares' AND column_name = 'shared_with_user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users can view workflows shared with them" ON workflow_shares;
    EXECUTE 'CREATE POLICY "Users can view workflows shared with them"
      ON workflow_shares FOR SELECT
      USING (auth.uid() = shared_with_user_id)';
  END IF;
END $$;

-- Create credits_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS credits_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')),
  description TEXT,
  execution_id UUID REFERENCES executions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on credits_transactions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'credits_transactions') THEN
    ALTER TABLE credits_transactions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their own transactions" ON credits_transactions;
    CREATE POLICY "Users can view their own transactions"
      ON credits_transactions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create or replace function to update profile timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, credit_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    150
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- Create storage bucket for assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('workflow-assets', 'workflow-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload their own assets" ON storage.objects;
CREATE POLICY "Users can upload their own assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'workflow-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view workflow assets" ON storage.objects;
CREATE POLICY "Users can view workflow assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'workflow-assets');

DROP POLICY IF EXISTS "Users can delete their own assets" ON storage.objects;
CREATE POLICY "Users can delete their own assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'workflow-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

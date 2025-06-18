-- First, let's check the current user authentication
SELECT auth.uid() as current_user_id;

-- Check if the user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE id = auth.uid();

-- Temporarily disable RLS to test if the insert works
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;

-- Test insert (replace with your actual user ID)
-- INSERT INTO trips (user_id, name, participants, contributions, total_pooled) 
-- VALUES ('588ac583-df03-4c80-8441-86dadae15e47', 'test', ARRAY['test'], '{}', 0);

-- Re-enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own trips" ON trips;
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON trips;

-- Create new policies with proper authentication
CREATE POLICY "Users can insert their own trips" ON trips
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own trips" ON trips
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own trips" ON trips
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own trips" ON trips
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'trips'
ORDER BY policyname; 
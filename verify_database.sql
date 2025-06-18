-- Verify database schema
-- Run this in Supabase SQL Editor to check if everything is set up correctly

-- Check if tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('trips', 'expenses', 'payments')
ORDER BY table_name;

-- Check trips table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'trips'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'trips'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('trips', 'expenses', 'payments');

-- Test insert (this should fail if RLS is working)
-- INSERT INTO trips (user_id, name, participants, contributions, total_pooled) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'test', ARRAY['test'], '{}', 0);

-- Check existing trips (if any)
SELECT id, name, participants, contributions, total_pooled, created_at 
FROM trips 
LIMIT 5; 
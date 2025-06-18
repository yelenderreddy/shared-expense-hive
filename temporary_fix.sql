-- TEMPORARY FIX: Disable RLS to test data insertion
-- Run this to temporarily disable RLS and test if your data insertion works

-- Disable RLS on all tables
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Now try creating a trip in your application
-- If it works, the issue is with RLS policies
-- If it doesn't work, there's another issue

-- After testing, re-enable RLS with proper policies:
-- ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY; 
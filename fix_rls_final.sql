-- FINAL FIX: Re-enable RLS with proper policies
-- Run this after confirming data insertion works without RLS

-- Re-enable RLS on all tables
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert their own trips" ON trips;
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON trips;

DROP POLICY IF EXISTS "Users can insert expenses for their trips" ON expenses;
DROP POLICY IF EXISTS "Users can view expenses for their trips" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses for their trips" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses for their trips" ON expenses;

DROP POLICY IF EXISTS "Users can insert payments for their trips" ON payments;
DROP POLICY IF EXISTS "Users can view payments for their trips" ON payments;
DROP POLICY IF EXISTS "Users can update payments for their trips" ON payments;
DROP POLICY IF EXISTS "Users can delete payments for their trips" ON payments;

-- Create new policies for trips table
CREATE POLICY "Users can insert their own trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own trips" ON trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips" ON trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips" ON trips
  FOR DELETE USING (auth.uid() = user_id);

-- Create new policies for expenses table
CREATE POLICY "Users can insert expenses for their trips" ON expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = expenses.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view expenses for their trips" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = expenses.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses for their trips" ON expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = expenses.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expenses for their trips" ON expenses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = expenses.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Create new policies for payments table
CREATE POLICY "Users can insert payments for their trips" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = payments.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view payments for their trips" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = payments.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update payments for their trips" ON payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = payments.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete payments for their trips" ON payments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = payments.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('trips', 'expenses', 'payments')
ORDER BY tablename, policyname;

-- Test the current authenticated user
SELECT auth.uid() as current_user_id; 
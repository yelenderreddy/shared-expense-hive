# Database Setup Guide

Follow these steps to set up the database tables in your Supabase project:

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

## Step 2: Create Database Tables

Copy and paste the entire SQL script from `database_schema.sql` into the SQL editor and click **Run**.

This will create:
- **trips** table - Stores trip information and participants
- **expenses** table - Stores all expenses for each trip
- **payments** table - Stores payment tracking between participants
- **Row Level Security (RLS)** policies for data protection
- **Indexes** for better performance

## Step 3: Verify Tables Created

1. Go to **Table Editor** in the left sidebar
2. You should see three new tables: `trips`, `expenses`, and `payments`
3. Click on each table to verify the structure

## Step 4: Test Database Connection

1. Start your development server: `npm run dev`
2. Sign up for a new account
3. Try creating a new trip
4. Check the Supabase dashboard to see if data is being stored

## Database Schema Overview

### Trips Table
- `id` - Unique trip identifier
- `user_id` - Links to authenticated user
- `name` - Trip name
- `participants` - Array of participant names
- `contributions` - JSON object of initial contributions
- `total_pooled` - Total amount pooled
- `created_at` / `updated_at` - Timestamps

### Expenses Table
- `id` - Unique expense identifier
- `trip_id` - Links to trip
- `title` - Expense description
- `amount` - Expense amount
- `paid_by` - Who paid for the expense
- `split_type` - Equal or custom split
- `deduct_from_fund` - Whether to deduct from pooled fund
- `custom_splits` - JSON object for custom splits
- `created_at` - Timestamp

### Payments Table
- `id` - Unique payment identifier
- `trip_id` - Links to trip
- `payer` - Who should receive payment
- `debtor` - Who owes money
- `amount` - Payment amount
- `received` - Whether payment was received
- `created_at` - Timestamp

## Security Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Foreign Key Constraints** - Ensures data integrity
- **Automatic Timestamps** - Tracks creation and update times
- **UUID Primary Keys** - Secure, non-sequential identifiers

## Troubleshooting

### Common Issues:

1. **"Permission denied" errors**
   - Make sure RLS policies are correctly set up
   - Verify user authentication is working

2. **"Table doesn't exist" errors**
   - Check if the SQL script ran successfully
   - Verify table names in the database

3. **"Foreign key constraint" errors**
   - Ensure related records exist before creating references
   - Check that UUIDs are properly formatted

### Testing Queries:

You can test the database connection with these queries in the SQL Editor:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('trips', 'expenses', 'payments');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('trips', 'expenses', 'payments');
```

## Next Steps

After setting up the database:

1. **Test the application** - Create trips and add expenses
2. **Monitor the database** - Check the Table Editor to see data being stored
3. **Set up backups** - Configure automatic backups in Supabase settings
4. **Monitor performance** - Use Supabase Analytics to track usage

Your database is now ready to store trip data securely and efficiently! 
import { supabase } from './supabase'

// Database table types
export interface Trip {
  id: string
  user_id: string
  name: string
  participants: string[]
  contributions: { [key: string]: number }
  total_pooled: number
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  trip_id: string
  title: string
  amount: number
  paid_by: string
  split_type: 'equal' | 'custom'
  deduct_from_fund: boolean
  custom_splits?: { [key: string]: number }
  created_at: string
}

export interface Payment {
  id: string
  trip_id: string
  payer: string
  debtor: string
  amount: number
  received: boolean
  created_at: string
}

// Trip functions
export const createTrip = async (tripData: Omit<Trip, 'id' | 'created_at' | 'updated_at'>) => {
  console.log("Database createTrip called with:", tripData);
  
  const insertData = {
    ...tripData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log("Inserting data:", insertData);
  
  const { data, error } = await supabase
    .from('trips')
    .insert([insertData])
    .select()
    .single()

  console.log("Database response:", { data, error });

  return { data, error }
}

export const getTripsByUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const getTripById = async (tripId: string) => {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  return { data, error }
}

export const updateTrip = async (tripId: string, updates: Partial<Trip>) => {
  const { data, error } = await supabase
    .from('trips')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', tripId)
    .select()
    .single()

  return { data, error }
}

export const deleteTrip = async (tripId: string) => {
  try {
    // First delete all associated expenses
    const { error: expensesError } = await supabase
      .from('expenses')
      .delete()
      .eq('trip_id', tripId)

    if (expensesError) {
      console.error('Error deleting expenses:', expensesError)
      return { error: expensesError }
    }

    // Then delete all associated payments
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('trip_id', tripId)

    if (paymentsError) {
      console.error('Error deleting payments:', paymentsError)
      return { error: paymentsError }
    }

    // Finally delete the trip
    const { error: tripError } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)

    return { error: tripError }
  } catch (error) {
    console.error('Error in deleteTrip:', error)
    return { error: error as Error }
  }
}

// Expense functions
export const createExpense = async (expenseData: Omit<Expense, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      ...expenseData,
      created_at: new Date().toISOString()
    }])
    .select()
    .single()

  return { data, error }
}

export const getExpensesByTrip = async (tripId: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  return { data, error }
}

export const updateExpense = async (expenseId: string, updates: Partial<Expense>) => {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', expenseId)
    .select()
    .single()

  return { data, error }
}

export const deleteExpense = async (expenseId: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)

  return { error }
}

// Payment functions
export const createPayment = async (paymentData: Omit<Payment, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('payments')
    .insert([{
      ...paymentData,
      created_at: new Date().toISOString()
    }])
    .select()
    .single()

  return { data, error }
}

export const getPaymentsByTrip = async (tripId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  return { data, error }
}

export const updatePayment = async (paymentId: string, updates: Partial<Payment>) => {
  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', paymentId)
    .select()
    .single()

  return { data, error }
}

export const markPaymentAsReceived = async (paymentId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .update({ received: true })
    .eq('id', paymentId)
    .select()
    .single()

  return { data, error }
}

// Trip Viewers functions
export const addTripViewer = async (tripId: string, userId: string) => {
  // Upsert to avoid duplicates
  const { data, error } = await supabase
    .from('trip_viewers')
    .upsert([
      { trip_id: tripId, user_id: userId }
    ], { onConflict: 'trip_id,user_id' })
    .select()
    .single();
  return { data, error };
};

export const getViewedTripsByUser = async (userId: string) => {
  // Join with trips table to get trip details, use alias 'trip'
  const { data, error } = await supabase
    .from('trip_viewers')
    .select('trip_id, viewed_at, trip:trips(*)')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false });
  return { data, error };
}; 
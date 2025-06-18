import { supabase } from '../lib/supabase';

export interface TripData {
  user_id: string;
  name: string;
  participants: string[];
  contributions: Record<string, number>;
  total_pooled: number;
}

export interface ExpenseData {
  trip_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_between: string[];
}

export interface PaymentData {
  trip_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  description?: string;
}

export const createTrip = async (tripData: TripData) => {
  try {
    const { data, error } = await supabase
      .from('trips')
      .insert([tripData])
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const getTrips = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const getTrip = async (tripId: string) => {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const createExpense = async (expenseData: ExpenseData) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const getExpenses = async (tripId: string) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const createPayment = async (paymentData: PaymentData) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const getPayments = async (tripId: string) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}; 
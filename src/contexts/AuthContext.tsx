import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, onAuthStateChange } from '@/lib/supabase'
import { deleteAllUserData } from '@/lib/database'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  updateProfile: (profile: { name: string; mobile: string }) => Promise<{ error: any }>
  deleteAccount: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const updateProfile = async ({ name, mobile }: { name: string; mobile: string }) => {
    if (!user) return { error: 'No user' };
    // Update user metadata in auth.users
    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: name, phone: mobile }
    });
    return { error };
  };

  const deleteAccount = async () => {
    if (!user) return { error: 'No user' };
    // Delete all user data
    const { error: dataError } = await deleteAllUserData(user.id);
    if (dataError) return { error: dataError };
    // Delete user from Supabase Auth (must be done via admin API or edge function in production, but for self-service, try client-side)
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
    if (authError) return { error: authError };
    return { error: null };
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    deleteAccount,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 
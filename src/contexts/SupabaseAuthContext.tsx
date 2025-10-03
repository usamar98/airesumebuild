/**
 * Supabase Authentication Context for managing user authentication state
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { Session } from '@supabase/supabase-js';
import { User } from '@/types';
import { createErrorResponse, createSuccessResponse, logTechnicalError } from '../utils/errorMapper';
import type { User as SupabaseUser } from '@supabase/supabase-js';
// Removed old API imports - using only Supabase now

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  register: (name: string, email: string, password: string, role: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmailVerified: boolean;
  supabase: typeof supabase;
}

// Convert Supabase User to our custom User type
const convertSupabaseUser = (supabaseUser: SupabaseUser): User => {
  // Extract name with better fallback logic
  let userName = supabaseUser.user_metadata?.name || 
                 supabaseUser.user_metadata?.full_name;
  
  // If no name in metadata, use email prefix
  if (!userName || userName.trim() === '') {
    userName = supabaseUser.email?.split('@')[0] || 'User';
  }
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: userName,
    role: (supabaseUser.user_metadata?.role as 'user' | 'admin') || 'user',
    user_role: supabaseUser.user_metadata?.role as 'job_seeker' | 'employer' | 'dual',
    created_at: supabaseUser.created_at || new Date().toISOString(),
    updated_at: supabaseUser.updated_at || new Date().toISOString(),
    last_login: supabaseUser.last_sign_in_at || new Date().toISOString(),
    email_verified: !!supabaseUser.email_confirmed_at
  };
};

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const SupabaseAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Supabase auth state changes
  useEffect(() => {
    console.log('🔄 SupabaseAuthContext: Initializing auth state listener');
    
    let isMounted = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
          if (isMounted) {
            setUser(null);
            setToken(null);
            setIsLoading(false);
          }
          return;
        }
        
        if (isMounted) {
          if (session?.user) {
            console.log('✅ Initial session found for user:', session.user.id);
            setUser(convertSupabaseUser(session.user));
            setToken(session.access_token);
          } else {
            console.log('❌ No initial session found');
            setUser(null);
            setToken(null);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
      }
    };
    
    getInitialSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Use only Supabase user data - no old backend calls
          const convertedUser = convertSupabaseUser(session.user);
          setUser(convertedUser);
          setToken(session.access_token);
          console.log('User signed in with Supabase data:', convertedUser);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setToken(null);
          console.log('User signed out');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // For token refresh, use Supabase user data
          const convertedUser = convertSupabaseUser(session.user);
          setUser(convertedUser);
          setToken(session.access_token);
          console.log('Token refreshed for user:', convertedUser);
        }
        
        // Always set loading to false after auth state change
        setIsLoading(false);
      }
    );
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);



  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> => {
    try {
      setIsLoading(true);
      console.log('Login attempt started for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Supabase login response:', { data, error });

      if (error) {
        console.error('Login error:', error);
        setIsLoading(false);
        return createErrorResponse(error, 'Login failed. Please check your credentials.');
      }

      if (data.session && data.user) {
        // Use only Supabase user data - no old backend calls
        const convertedUser = convertSupabaseUser(data.user);
        setUser(convertedUser);
        setToken(data.session.access_token);
        setIsLoading(false);
        
        console.log('Login successful:', convertedUser);
        return { success: true };
      }

      console.error('Login failed: No session returned');
      setIsLoading(false);
      return createErrorResponse(null, 'Login failed. Please try again.');
    } catch (error: any) {
      console.error('Login failed with error:', error);
      setIsLoading(false);
      logTechnicalError(error, 'Login');
      return createErrorResponse(error, 'An unexpected error occurred. Please try again.');
    }
  };

  const register = async (name: string, email: string, password: string, role: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      setIsLoading(true);
      
      // Register user with Supabase Auth - the trigger will handle public.users table
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name,
            role: role
          }
        }
      });
      
      if (error) {
        console.error('Registration error:', error);
        
        // Check for duplicate email error
        if (error.message?.includes('already registered') || 
            error.message?.includes('already exists') ||
            error.message?.includes('User already registered')) {
          return createErrorResponse(error, 'A user with this email already exists. Please try logging in instead.');
        }
        
        logTechnicalError(error, 'Registration');
        return createErrorResponse(error, 'Registration failed. Please try again.');
      }
      
      // Check if user was created but already exists (Supabase returns user even for existing emails)
      if (data.user && data.user.email_confirmed_at) {
        return createErrorResponse(null, 'A user with this email already exists. Please try logging in instead.');
      }
      
      if (data.user && !data.user.email_confirmed_at) {
        return createSuccessResponse(
          'Registration successful! Please check your email to verify your account before logging in.'
        );
      }
      return createSuccessResponse(
        'Registration successful! You can now log in.'
      );
    } catch (error: any) {
      logTechnicalError(error, 'Registration');
      return createErrorResponse(error, 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 SupabaseAuthContext: Starting logout process');
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Logout error:', error);
        logTechnicalError(error, 'Logout');
      }
      
      // Force clear state regardless of signOut result
      setUser(null);
      setToken(null);
      setIsLoading(false);
      
      // Comprehensive storage cleanup
      const clearStorage = (storage: Storage, storageType: string) => {
        const keysToRemove = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => {
          try {
            storage.removeItem(key);
            console.log(`🧹 Cleared ${storageType} key:`, key);
          } catch (e) {
            console.warn(`Failed to clear ${storageType} key:`, key, e);
          }
        });
      };
      
      // Clear both localStorage and sessionStorage
      clearStorage(localStorage, 'localStorage');
      clearStorage(sessionStorage, 'sessionStorage');
      
      console.log('✅ SupabaseAuthContext: Logout complete');
      
    } catch (error) {
      console.error('Logout process error:', error);
      logTechnicalError(error, 'Logout');
      
      // Force clear state and storage even on error
      setUser(null);
      setToken(null);
      setIsLoading(false);
      
      // Emergency storage cleanup
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('🚨 Emergency storage clear completed');
      } catch (storageError) {
        console.error('Emergency storage clear failed:', storageError);
      }
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      logTechnicalError(error, 'Get Access Token');
      return null;
    }
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'admin';
  const isEmailVerified = !!user?.email_verified;

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    getAccessToken,
    isLoading,
    isAuthenticated,
    isAdmin,
    isEmailVerified,
    supabase,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = (): AuthContextType => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export default SupabaseAuthContext;
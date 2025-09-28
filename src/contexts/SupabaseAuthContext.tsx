/**
 * Supabase Authentication Context for managing user authentication state
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { Session } from '@supabase/supabase-js';
import { User } from '@/types';
import { createErrorResponse, createSuccessResponse, logTechnicalError } from '../utils/errorMapper';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmailVerified: boolean;
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
          // Fetch user profile from backend to get the correct name
          try {
            const response = await fetch('/api/auth/profile', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const profileData = await response.json();
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: profileData.user?.name || session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
                role: profileData.user?.role || session.user.user_metadata?.role || 'user',
                email_verified: !!session.user.email_confirmed_at,
                created_at: session.user.created_at || new Date().toISOString(),
                updated_at: session.user.updated_at || new Date().toISOString(),
                last_login: new Date().toISOString()
              });
            } else {
              // Fallback to convertSupabaseUser if backend call fails
              const convertedUser = convertSupabaseUser(session.user);
              setUser(convertedUser);
            }
          } catch (error) {
            console.error('Error fetching user profile in auth state change:', error);
            // Fallback to convertSupabaseUser if backend call fails
            const convertedUser = convertSupabaseUser(session.user);
            setUser(convertedUser);
          }
          
          setToken(session.access_token);
          console.log('User signed in with profile data');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setToken(null);
          console.log('User signed out');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // For token refresh, we can use the existing user data or fetch fresh profile
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
        // Fetch user profile from backend to get the correct name
        try {
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const profileData = await response.json();
            setUser({
              id: data.user.id,
              email: data.user.email || '',
              name: profileData.user?.name || data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '',
              role: profileData.user?.role || data.user.user_metadata?.role || 'user',
              email_verified: !!data.user.email_confirmed_at,
              created_at: data.user.created_at || new Date().toISOString(),
              updated_at: data.user.updated_at || new Date().toISOString(),
              last_login: new Date().toISOString()
            });
          } else {
            // Fallback to user metadata if backend call fails
            setUser({
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '',
              role: data.user.user_metadata?.role || 'user',
              email_verified: !!data.user.email_confirmed_at,
              created_at: data.user.created_at || new Date().toISOString(),
              updated_at: data.user.updated_at || new Date().toISOString(),
              last_login: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to user metadata if backend call fails
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '',
            role: data.user.user_metadata?.role || 'user',
            email_verified: !!data.user.email_confirmed_at,
            created_at: data.user.created_at || new Date().toISOString(),
            updated_at: data.user.updated_at || new Date().toISOString(),
            last_login: new Date().toISOString()
          });
        }
        
        setToken(data.session.access_token);
        setIsLoading(false);
        
        console.log('Login successful:', data.user);
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

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      setIsLoading(true);
      
      // Check if user already exists in Supabase
      const { data: existingUsers, error: checkError } = await supabase
        .from('auth.users')
        .select('email')
        .eq('email', email)
        .limit(1);
      
      // Alternative approach: try to sign up and handle the specific error
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name
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
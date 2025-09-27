import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zrbdftbmydfrdazcffoa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYmRmdGJteWRmcmRhemNmZm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4Mzk5MzksImV4cCI6MjA3NDQxNTkzOX0.hw9XUUdx5cP3Kj8NX-IYA65uHk8ROrWqp3Tw-RpWhP0';

console.log('🔧 Supabase Config:', {
  url: supabaseUrl,
  anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined',
  envUrl: import.meta.env.VITE_SUPABASE_URL,
  envKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'undefined'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable URL session detection to prevent auto re-login
    flowType: 'pkce'
  }
});

export default supabase;
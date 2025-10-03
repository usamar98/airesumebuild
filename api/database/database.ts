import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Database interface that mimics the original JSON-based database
export const db = {
  prepare: (sql: string) => ({
    run: async (...params: any[]) => {
      try {
        // Handle INSERT INTO users
        if (sql.includes('INSERT INTO users')) {
          const [email, password, name, role = 'job_seeker'] = params;
          
          // First create auth user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
          });

          if (authError) {
            console.error('Error creating auth user:', authError);
            throw authError;
          }

          // Then create public user record
          const { data, error } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email,
              full_name: name,
              name: name,
              role: role === 'user' ? 'job_seeker' : role,
              password_hash: password, // Note: In real implementation, this should be hashed
              is_active: true,
              email_verified: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating public user:', error);
            throw error;
          }

          return { lastInsertRowid: data.id, changes: 1 };
        }

        // Handle INSERT INTO analytics
        if (sql.includes('INSERT INTO analytics')) {
          const [user_id, feature_name, action, metadata] = params;
          
          const { data, error } = await supabase
            .from('analytics_events')
            .insert({
              user_id,
              event_type: feature_name,
              feature_name,
              action,
              metadata: metadata ? JSON.parse(metadata) : null,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating analytics event:', error);
            throw error;
          }

          return { lastInsertRowid: data.id, changes: 1 };
        }

        // Handle UPDATE users
        if (sql.includes('UPDATE users')) {
          const userId = params[params.length - 1];
          const updateData: any = {
            updated_at: new Date().toISOString()
          };

          if (sql.includes('last_login')) {
            updateData.last_login = new Date().toISOString();
          }

          const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select();

          if (error) {
            console.error('Error updating user:', error);
            throw error;
          }

          return { changes: data.length };
        }

        // Handle DELETE FROM users
        if (sql.includes('DELETE FROM users')) {
          const userId = params[0];
          
          const { data, error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId)
            .select();

          if (error) {
            console.error('Error deleting user:', error);
            throw error;
          }

          return { changes: data.length };
        }

        return { changes: 0 };
      } catch (error) {
        console.error('Database operation error:', error);
        throw error;
      }
    },

    get: async (...params: any[]) => {
      try {
        // Handle SELECT * FROM users WHERE email
        if (sql.includes('SELECT * FROM users WHERE email')) {
          const email = params[0];
          
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error fetching user by email:', error);
            throw error;
          }

          return data || null;
        }

        // Handle SELECT * FROM users WHERE id
        if (sql.includes('SELECT * FROM users WHERE id')) {
          const userId = params[0];
          
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error fetching user by id:', error);
            throw error;
          }

          return data || null;
        }

        // Handle SELECT COUNT(*) as count FROM users
        if (sql.includes('SELECT COUNT(*) as count FROM users')) {
          let query = supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

          if (sql.includes('WHERE is_active = 1')) {
            query = query.eq('is_active', true);
          }
          if (sql.includes('WHERE role = "admin"')) {
            query = query.eq('role', 'admin');
          }

          const { count, error } = await query;

          if (error) {
            console.error('Error counting users:', error);
            throw error;
          }

          return { count: count || 0 };
        }

        return null;
      } catch (error) {
        console.error('Database get operation error:', error);
        throw error;
      }
    },

    all: async (...params: any[]) => {
      try {
        // Handle SELECT FROM users
        if (sql.includes('SELECT') && sql.includes('FROM users')) {
          let query = supabase
            .from('users')
            .select('*');

          if (sql.includes('ORDER BY created_at DESC')) {
            query = query.order('created_at', { ascending: false });
          }

          const { data, error } = await query;

          if (error) {
            console.error('Error fetching users:', error);
            throw error;
          }

          return data || [];
        }

        // Handle SELECT FROM analytics
        if (sql.includes('SELECT') && sql.includes('FROM analytics')) {
          const { data, error } = await supabase
            .from('analytics_events')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching analytics:', error);
            throw error;
          }

          // Transform data to match original format
          return data?.map(event => ({
            id: event.id,
            user_id: event.user_id,
            feature_name: event.feature_name || event.event_type,
            action: event.action,
            metadata: event.metadata ? JSON.stringify(event.metadata) : null,
            created_at: event.created_at
          })) || [];
        }

        return [];
      } catch (error) {
        console.error('Database all operation error:', error);
        throw error;
      }
    }
  })
};

export { supabase };
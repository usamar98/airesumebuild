/**
 * Admin user setup utility
 * Creates default admin user if it doesn't exist
 */
import { supabase } from '../config/supabase';
import { createClient } from '@supabase/supabase-js';

// Default admin credentials
export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'admin@resumebuilder.com',
  password: 'AdminPass123!',
  name: 'Admin User'
};

// Service role client for admin operations
const getServiceRoleClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYmRmdGJteWRmcmRhemNmZm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgzOTkzOSwiZXhwIjoyMDc0NDE1OTM5fQ.AOEM0trcOLiBnGRb-xrMYeCouRcoPvatouCVVbOAL5I';
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Creates the default admin user if it doesn't exist
 * This should be called on app initialization
 */
export const createDefaultAdminUser = async (): Promise<void> => {
  try {
    console.log('🔧 Checking for default admin user...');
    
    const adminClient = getServiceRoleClient();
    
    // Check if admin user already exists
    const { data: users, error: getUserError } = await adminClient.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('❌ Failed to list users:', getUserError.message);
      return;
    }
    
    const adminUser = users.users.find(user => user.email === DEFAULT_ADMIN_CREDENTIALS.email);
    
    if (!adminUser) {
      console.log('👤 Creating admin user with confirmed email...');
      
      // Create admin user with confirmed email
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email: DEFAULT_ADMIN_CREDENTIALS.email,
        password: DEFAULT_ADMIN_CREDENTIALS.password,
        email_confirm: true, // This confirms the email immediately
        user_metadata: {
          name: DEFAULT_ADMIN_CREDENTIALS.name,
          role: 'admin'
        }
      });
      
      if (createError) {
        console.error('❌ Failed to create admin user:', createError.message);
        return;
      }
      
      console.log('✅ Admin user created with confirmed email:', createData.user.id);
      
      // Insert into users table
      const { error: insertError } = await adminClient
        .from('users')
        .insert({
          id: createData.user.id,
          name: DEFAULT_ADMIN_CREDENTIALS.name,
          email: DEFAULT_ADMIN_CREDENTIALS.email,
          role: 'admin'
        });
        
      if (insertError) {
        console.log('⚠️ Failed to insert into users table (might already exist):', insertError.message);
      } else {
        console.log('✅ Admin user added to users table');
      }
      
    } else {
      console.log('✅ Default admin user already exists:', adminUser.id);
      
      // Ensure email is confirmed
      if (!adminUser.email_confirmed_at) {
        console.log('📧 Confirming admin email...');
        
        const { error: confirmError } = await adminClient.auth.admin.updateUserById(
          adminUser.id,
          { email_confirm: true }
        );
        
        if (confirmError) {
          console.error('❌ Failed to confirm email:', confirmError.message);
        } else {
          console.log('✅ Admin email confirmed');
        }
      }
      
      // Ensure user exists in users table with admin role
      await ensureAdminInUsersTable(adminClient, adminUser.id);
    }
    
  } catch (error) {
    console.error('❌ Error in createDefaultAdminUser:', error);
  }
};

/**
 * Ensures admin user exists in users table with admin role
 */
const ensureAdminInUsersTable = async (adminClient: any, userId: string): Promise<void> => {
  try {
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.log('📝 Adding admin user to users table...');
      const { error: insertError } = await adminClient
        .from('users')
        .insert({
          id: userId,
          name: DEFAULT_ADMIN_CREDENTIALS.name,
          email: DEFAULT_ADMIN_CREDENTIALS.email,
          role: 'admin'
        });
        
      if (insertError) {
        console.error('❌ Failed to insert into users table:', insertError.message);
      } else {
        console.log('✅ Admin user added to users table');
      }
    } else {
      console.log('✅ Admin user found in users table');
      
      // Update role to admin if needed
      if (userData.role !== 'admin') {
        const { error: updateError } = await adminClient
          .from('users')
          .update({ role: 'admin' })
          .eq('id', userId);
          
        if (updateError) {
          console.error('❌ Failed to update role:', updateError.message);
        } else {
          console.log('✅ Role updated to admin');
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring admin in users table:', error);
  }
};

/**
 * Gets the default admin credentials for display purposes
 */
export const getDefaultAdminCredentials = () => {
  return {
    email: DEFAULT_ADMIN_CREDENTIALS.email,
    password: DEFAULT_ADMIN_CREDENTIALS.password
  };
};
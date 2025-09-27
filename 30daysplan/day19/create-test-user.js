// Script to create a test user via Supabase Auth API
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://zrbdftbmydfrdazcffoa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYmRmdGJteWRmcmRhemNmZm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgzOTkzOSwiZXhwIjoyMDc0NDE1OTM5fQ.AOEM0trcOLiBnGRb-xrMYeCouRcoPvatouCVVbOAL5I';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('🔧 Creating test user...');
  
  try {
    // Create user via Supabase Auth Admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'testuser@gmail.com',
      password: 'TestPassword123!',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Test User'
      }
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('✅ Test user already exists in auth.users');
        
        // Get existing user
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          console.error('❌ Error listing users:', listError);
          return;
        }
        
        const existingUser = existingUsers.users.find(u => u.email === 'testuser@gmail.com');
        if (existingUser) {
          console.log('📋 Existing user details:', {
            id: existingUser.id,
            email: existingUser.email,
            email_confirmed: existingUser.email_confirmed_at ? 'Yes' : 'No',
            created_at: existingUser.created_at
          });
          
          // Ensure user exists in public.users table
          await ensurePublicUserRecord(existingUser.id, existingUser.email);
        }
        return;
      } else {
        console.error('❌ Error creating auth user:', authError);
        return;
      }
    }
    
    console.log('✅ Test user created successfully in auth.users');
    console.log('📋 User details:', {
      id: authUser.user.id,
      email: authUser.user.email,
      email_confirmed: authUser.user.email_confirmed_at ? 'Yes' : 'No',
      created_at: authUser.user.created_at
    });
    
    // Create corresponding record in public.users table
    await ensurePublicUserRecord(authUser.user.id, authUser.user.email);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function ensurePublicUserRecord(userId, email) {
  console.log('🔧 Ensuring public.users record exists...');
  
  try {
    // Check if user already exists in public.users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking public.users:', checkError);
      return;
    }
    
    if (existingUser) {
      console.log('✅ User already exists in public.users');
      console.log('📋 Public user details:', existingUser);
      return;
    }
    
    // Create user in public.users table
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        name: 'Test User',
        email: email,
        role: 'user'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error creating public.users record:', insertError);
      return;
    }
    
    console.log('✅ Created public.users record');
    console.log('📋 New public user:', newUser);
    
  } catch (error) {
    console.error('❌ Unexpected error in ensurePublicUserRecord:', error);
  }
}

// Run the script
createTestUser().then(() => {
  console.log('🎉 Test user setup complete!');
  console.log('🔐 You can now test login with:');
  console.log('   Email: testuser@gmail.com');
  console.log('   Password: TestPassword123!');
}).catch(error => {
  console.error('💥 Script failed:', error);
});
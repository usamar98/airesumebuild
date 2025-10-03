// Script to delete specific test users from Supabase database
import { createClient } from '@supabase/supabase-js';

// Supabase configuration (using same config as create-test-user.js)
const supabaseUrl = 'https://zrbdftbmydfrdazcffoa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYmRmdGJteWRmcmRhemNmZm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgzOTkzOSwiZXhwIjoyMDc0NDE1OTM5fQ.AOEM0trcOLiBnGRb-xrMYeCouRcoPvatouCVVbOAL5I';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test user emails to delete
const testEmails = [
  'connecttousama@gmail.com',
  'otherusama@gmail.com'
];

async function deleteUserByEmail(email) {
  console.log(`🗑️  Attempting to delete user: ${email}`);
  
  try {
    // First, find the user in auth.users table
    const { data: authUsers, error: findError } = await supabase.auth.admin.listUsers();
    
    if (findError) {
      console.error(`❌ Error finding users:`, findError.message);
      return false;
    }

    const userToDelete = authUsers.users.find(user => user.email === email);
    
    if (!userToDelete) {
      console.log(`ℹ️  User ${email} not found in auth.users - may already be deleted`);
      return true; // Consider this a success since the goal is achieved
    }

    const userId = userToDelete.id;
    console.log(`📍 Found user ${email} with ID: ${userId}`);

    // Delete from public.users table first (due to foreign key constraints)
    const { error: publicDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (publicDeleteError) {
      console.log(`⚠️  Warning: Could not delete from public.users table:`, publicDeleteError.message);
      // Continue anyway, as the user might not exist in public.users
    } else {
      console.log(`✅ Deleted ${email} from public.users table`);
    }

    // Delete from auth.users table using admin API
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error(`❌ Error deleting ${email} from auth.users:`, authDeleteError.message);
      return false;
    }

    console.log(`✅ Successfully deleted ${email} from auth.users table`);
    return true;

  } catch (error) {
    console.error(`❌ Unexpected error deleting ${email}:`, error.message);
    return false;
  }
}

async function deleteTestUsers() {
  console.log('🚀 Starting deletion of test users...');
  console.log('📧 Users to delete:', testEmails);
  console.log('─'.repeat(50));

  let successCount = 0;
  let failureCount = 0;

  for (const email of testEmails) {
    const success = await deleteUserByEmail(email);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
    console.log('─'.repeat(30));
  }

  console.log('📊 Deletion Summary:');
  console.log(`✅ Successfully deleted: ${successCount} users`);
  console.log(`❌ Failed to delete: ${failureCount} users`);
  
  if (failureCount === 0) {
    console.log('🎉 All test users have been successfully deleted!');
    console.log('💡 You can now register these emails again to test the new role selection functionality.');
  } else {
    console.log('⚠️  Some deletions failed. Please check the errors above.');
  }
}

// Run the deletion script
deleteTestUsers().then(() => {
  console.log('🏁 Deletion script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
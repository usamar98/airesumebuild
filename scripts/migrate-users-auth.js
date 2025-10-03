import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration. Please check your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Generate deterministic UUID from integer ID
 */
function generateUuidFromInt(id) {
    // Create a deterministic UUID based on the integer ID
    const hex = id.toString().padStart(8, '0');
    return `a0eebc99-9c0b-4ef8-bb6d-${hex.padStart(12, '0')}`;
}

/**
 * Read users data from JSON file
 */
async function readUsersData() {
    try {
        const filePath = path.join(__dirname, '../data/users.json');
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error reading users.json:', error);
        throw error;
    }
}

/**
 * Create user in auth.users using Supabase Admin API
 */
async function createAuthUser(userData) {
    try {
        const { data, error } = await supabase.auth.admin.createUser({
            id: userData.uuid,
            email: userData.email,
            password: 'temp_password_123!', // Temporary password, users will need to reset
            email_confirm: userData.email_verified || false,
            user_metadata: {
                full_name: userData.name,
                migrated_from_json: true,
                original_id: userData.original_id
            },
            app_metadata: {
                role: userData.role,
                migrated_at: new Date().toISOString()
            }
        });

        if (error) {
            console.error(`❌ Error creating auth user for ${userData.email}:`, error);
            return { success: false, error: error.message };
        }

        console.log(`✅ Created auth user: ${userData.email} (${data.user.id})`);
        return { success: true, user: data.user };

    } catch (error) {
        console.error(`❌ Unexpected error creating auth user for ${userData.email}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Create user in public.users table
 */
async function createPublicUser(userData, authUserId) {
    try {
        const publicUserData = {
            id: authUserId,
            email: userData.email,
            name: userData.name, // Map to name field (required)
            full_name: userData.name, // Also set full_name
            role: userData.role === 'user' ? 'job_seeker' : userData.role,
            is_active: userData.is_active !== undefined ? userData.is_active : true,
            email_verified: userData.email_verified || false,
            email_verification_token: userData.email_verification_token || null,
            email_verification_expires: userData.email_verification_expires || null,
            password_hash: userData.password, // Store original hash for reference
            last_login: userData.last_login || null,
            created_at: userData.created_at || new Date().toISOString(),
            updated_at: userData.updated_at || new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('users')
            .insert([publicUserData])
            .select('id, email');

        if (error) {
            console.error(`❌ Error creating public user for ${userData.email}:`, error);
            return { success: false, error: error.message };
        }

        console.log(`✅ Created public user: ${userData.email} (${data[0].id})`);
        return { success: true, user: data[0] };

    } catch (error) {
        console.error(`❌ Unexpected error creating public user for ${userData.email}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Store ID mapping for reference
 */
async function storeIdMapping(originalId, newUuid) {
    try {
        const { data, error } = await supabase
            .from('user_id_mapping')
            .upsert([{
                old_id: originalId,
                new_id: newUuid
            }])
            .select('old_id, new_id');

        if (error) {
            console.error(`❌ Error storing ID mapping for ${originalId}:`, error);
            return { success: false, error: error.message };
        }

        return { success: true, mapping: data[0] };

    } catch (error) {
        console.error(`❌ Unexpected error storing ID mapping for ${originalId}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if user already exists in auth.users by email
 */
async function checkExistingAuthUserByEmail(email) {
    try {
        const { data, error } = await supabase.auth.admin.listUsers();
        
        if (error) {
            console.error(`❌ Error listing auth users:`, error);
            return { exists: false, error: error.message };
        }

        const existingUser = data.users.find(user => user.email === email);
        return { exists: !!existingUser, user: existingUser };

    } catch (error) {
        console.error(`❌ Unexpected error checking auth user by email ${email}:`, error);
        return { exists: false, error: error.message };
    }
}

/**
 * Check if user already exists in auth.users by ID
 */
async function checkExistingAuthUser(email, uuid) {
    try {
        const { data, error } = await supabase.auth.admin.getUserById(uuid);
        
        if (error && error.message !== 'User not found') {
            console.error(`❌ Error checking auth user ${email}:`, error);
            return { exists: false, error: error.message };
        }

        return { exists: !!data.user, user: data.user };

    } catch (error) {
        console.error(`❌ Unexpected error checking auth user ${email}:`, error);
        return { exists: false, error: error.message };
    }
}

/**
 * Check if user already exists in public.users
 */
async function checkExistingPublicUser(uuid) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email')
            .eq('id', uuid)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error(`❌ Error checking public user ${uuid}:`, error);
            return { exists: false, error: error.message };
        }

        return { exists: !!data, user: data };

    } catch (error) {
        console.error(`❌ Unexpected error checking public user ${uuid}:`, error);
        return { exists: false, error: error.message };
    }
}

/**
 * Migrate a single user
 */
async function migrateSingleUser(userData) {
    const uuid = generateUuidFromInt(userData.id);
    
    console.log(`\n🔄 Processing user: ${userData.email} (ID: ${userData.id} → ${uuid})`);

    // Check if auth user already exists by email first
    const authEmailCheck = await checkExistingAuthUserByEmail(userData.email);
    if (authEmailCheck.error) {
        return { success: false, error: `Auth email check failed: ${authEmailCheck.error}` };
    }

    // Check if auth user exists by UUID
    const authCheck = await checkExistingAuthUser(userData.email, uuid);
    if (authCheck.error) {
        return { success: false, error: `Auth check failed: ${authCheck.error}` };
    }

    // We'll check public user after determining the actual auth user ID

    let authUserId = uuid;
    let results = {
        authCreated: false,
        publicCreated: false,
        mappingStored: false
    };

    // Determine auth user ID
    if (authEmailCheck.exists) {
        // User exists by email, use that ID
        authUserId = authEmailCheck.user.id;
        console.log(`   ⏭️  Auth user already exists by email: ${userData.email} (${authUserId})`);
    } else if (authCheck.exists) {
        // User exists by UUID
        authUserId = authCheck.user.id;
        console.log(`   ⏭️  Auth user already exists by UUID: ${userData.email} (${authUserId})`);
    } else {
        // Create new auth user
        const authResult = await createAuthUser({
            uuid: uuid,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            email_verified: userData.email_verified,
            original_id: userData.id
        });

        if (!authResult.success) {
            return { success: false, error: `Auth creation failed: ${authResult.error}` };
        }

        authUserId = authResult.user.id;
        results.authCreated = true;
    }

    // Check if public user already exists with the actual auth user ID
    const publicCheck = await checkExistingPublicUser(authUserId);
    if (publicCheck.error) {
        return { success: false, error: `Public check failed: ${publicCheck.error}` };
    }

    // Create public user if doesn't exist
    if (!publicCheck.exists) {
        const publicResult = await createPublicUser(userData, authUserId);

        if (!publicResult.success) {
            return { success: false, error: `Public creation failed: ${publicResult.error}` };
        }

        results.publicCreated = true;
    } else {
        console.log(`   ⏭️  Public user already exists: ${userData.email}`);
    }

    // Store ID mapping
    const mappingResult = await storeIdMapping(userData.id, authUserId);
    if (mappingResult.success) {
        results.mappingStored = true;
    }

    return { success: true, results: results, uuid: authUserId };
}

/**
 * Main migration function
 */
async function main() {
    console.log('🚀 Starting Users Migration to Supabase (Auth + Public)');
    console.log('=====================================================\n');

    try {
        // Step 1: Read users data
        console.log('📖 Reading users.json...');
        const usersData = await readUsersData();
        console.log(`✅ Found ${usersData.length} users in JSON file\n`);

        // Step 2: Migrate each user
        console.log('🔄 Starting user migration...');
        
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const userData of usersData) {
            const result = await migrateSingleUser(userData);
            
            if (result.success) {
                if (result.results.authCreated || result.results.publicCreated) {
                    successCount++;
                    console.log(`   ✅ Migration completed for ${userData.email}`);
                } else {
                    skipCount++;
                    console.log(`   ⏭️  User already exists: ${userData.email}`);
                }
            } else {
                errorCount++;
                errors.push({ email: userData.email, error: result.error });
                console.log(`   ❌ Migration failed for ${userData.email}: ${result.error}`);
            }
        }

        // Final summary
        console.log('\n🎯 Migration Summary');
        console.log('===================');
        console.log(`Total Users: ${usersData.length}`);
        console.log(`✅ Successfully Migrated: ${successCount}`);
        console.log(`⏭️  Skipped (Already Exist): ${skipCount}`);
        console.log(`❌ Failed: ${errorCount}`);

        if (errors.length > 0) {
            console.log('\n❌ Migration Errors:');
            errors.forEach(err => {
                console.log(`   ${err.email}: ${err.error}`);
            });
        }

        if (errorCount === 0) {
            console.log('\n🎉 Users migration completed successfully!');
            console.log('\n📝 Important Notes:');
            console.log('   - All users have been created with temporary password: temp_password_123!');
            console.log('   - Users will need to reset their passwords on first login');
            console.log('   - Original password hashes are stored in public.users.password_hash for reference');
            process.exit(0);
        } else {
            console.log('\n⚠️  Migration completed with some errors. Please review the logs above.');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n💥 Migration failed with error:', error);
        process.exit(1);
    }
}

// Run the migration
main();
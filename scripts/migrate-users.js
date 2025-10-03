/**
 * Data Migration Script: users.json to Supabase
 * This script migrates user data from the JSON file to Supabase users table
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration in environment variables');
    console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Read and parse users.json file
 */
async function readUsersData() {
    try {
        const usersPath = path.join(__dirname, '../data/users.json');
        const usersData = await fs.readFile(usersPath, 'utf8');
        return JSON.parse(usersData);
    } catch (error) {
        console.error('❌ Error reading users.json:', error.message);
        throw error;
    }
}

/**
 * Generate deterministic UUID from integer ID
 */
function generateUuidFromInt(intId) {
    // Create a deterministic UUID based on the integer input
    // This matches the SQL function we created
    const hex = intId.toString(16).padStart(12, '0');
    return `a0eebc99-9c0b-4ef8-bb6d-${hex}`;
}

/**
 * Transform user data to match Supabase schema
 */
function transformUserData(users) {
    return users.map(user => {
        // Generate UUID from integer ID for consistency
        const uuid = generateUuidFromInt(user.id);
        
        // Map JSON fields to Supabase schema
        const transformedUser = {
            id: uuid, // Convert integer ID to UUID
            email: user.email,
            password_hash: user.password, // Already hashed in JSON
            name: user.name,
            full_name: user.name, // Map name to full_name as well
            role: (user.role || 'user') === 'user' ? 'job_seeker' : (user.role || 'user'), // Map 'user' to 'job_seeker'
            is_active: user.is_active !== undefined ? user.is_active : true,
            email_verified: user.email_verified || false,
            email_verification_token: user.email_verification_token || null,
            email_verification_expires: user.email_verification_expires || null,
            password_reset_token: user.password_reset_token || null,
            password_reset_expires: user.password_reset_expires || null,
            last_login: user.last_login || null,
            created_at: user.created_at || new Date().toISOString(),
            updated_at: user.updated_at || new Date().toISOString(),
            // Add mapping info for reference
            _original_id: user.id
        };

        // Clean up null/undefined values
        Object.keys(transformedUser).forEach(key => {
            if (transformedUser[key] === undefined) {
                transformedUser[key] = null;
            }
        });

        return transformedUser;
    });
}

/**
 * Check if user already exists in Supabase
 */
async function checkExistingUsers(userIds) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .in('id', userIds);

        if (error) {
            console.error('❌ Error checking existing users:', error);
            return [];
        }

        return data.map(user => user.id);
    } catch (error) {
        console.error('❌ Error checking existing users:', error);
        return [];
    }
}

/**
 * Store ID mapping for reference
 */
async function storeIdMapping(users) {
    console.log('🗂️  Storing ID mappings...');
    
    const mappings = users.map(user => ({
        old_id: user._original_id,
        new_id: user.id
    }));

    try {
        // Check for existing mappings
        const { data: existingMappings } = await supabase
            .from('user_id_mapping')
            .select('old_id')
            .in('old_id', mappings.map(m => m.old_id));

        const existingOldIds = existingMappings?.map(m => m.old_id) || [];
        const newMappings = mappings.filter(m => !existingOldIds.includes(m.old_id));

        if (newMappings.length === 0) {
            console.log('✅ All ID mappings already exist.');
            return { success: true, stored: 0 };
        }

        const { data, error } = await supabase
            .from('user_id_mapping')
            .insert(newMappings)
            .select('old_id, new_id');

        if (error) {
            console.error('❌ Error storing ID mappings:', error);
            return { success: false, stored: 0, error: error.message };
        }

        console.log(`✅ Stored ${data.length} ID mappings`);
        return { success: true, stored: data.length };

    } catch (error) {
        console.error('❌ Unexpected error storing ID mappings:', error);
        return { success: false, stored: 0, error: error.message };
    }
}

/**
 * Migrate users to Supabase
 */
async function migrateUsers(users) {
    console.log(`📊 Starting migration of ${users.length} users...`);

    // Check for existing users
    const userIds = users.map(user => user.id);
    const existingUserIds = await checkExistingUsers(userIds);
    
    if (existingUserIds.length > 0) {
        console.log(`⚠️  Found ${existingUserIds.length} existing users. They will be skipped.`);
    }

    // Filter out existing users
    const newUsers = users.filter(user => !existingUserIds.includes(user.id));
    
    if (newUsers.length === 0) {
        console.log('✅ All users already exist in Supabase. No migration needed.');
        return { success: true, migrated: 0, skipped: existingUserIds.length };
    }

    console.log(`📝 Migrating ${newUsers.length} new users...`);

    // Store ID mappings first
    const mappingResult = await storeIdMapping(newUsers);
    if (!mappingResult.success) {
        console.log(`⚠️  ID mapping had issues: ${mappingResult.error}`);
    }

    // Insert users in batches to avoid overwhelming the database
    const batchSize = 10;
    let migratedCount = 0;
    let errors = [];

    for (let i = 0; i < newUsers.length; i += batchSize) {
        const batch = newUsers.slice(i, i + batchSize);
        
        // Remove _original_id before inserting
        const cleanBatch = batch.map(user => {
            const { _original_id, ...cleanUser } = user;
            return cleanUser;
        });
        
        try {
            const { data, error } = await supabase
                .from('users')
                .insert(cleanBatch)
                .select('id, email');

            if (error) {
                console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
                errors.push({ batch: Math.floor(i/batchSize) + 1, error: error.message });
                continue;
            }

            migratedCount += data.length;
            console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: Migrated ${data.length} users`);
            
            // Log migrated users
            data.forEach(user => {
                console.log(`   - ${user.email} (${user.id})`);
            });

        } catch (error) {
            console.error(`❌ Unexpected error in batch ${Math.floor(i/batchSize) + 1}:`, error);
            errors.push({ batch: Math.floor(i/batchSize) + 1, error: error.message });
        }
    }

    return {
        success: errors.length === 0,
        migrated: migratedCount,
        skipped: existingUserIds.length,
        errors: errors
    };
}

/**
 * Create user profiles for migrated users
 */
async function createUserProfiles(users) {
    console.log('👤 Creating user profiles...');

    // Check existing profiles
    const userIds = users.map(user => user.id);
    const { data: existingProfiles } = await supabase
        .from('user_profiles')
        .select('user_id')
        .in('user_id', userIds);

    const existingProfileIds = existingProfiles?.map(p => p.user_id) || [];
    
    // Create profiles for users without them
    const usersNeedingProfiles = users.filter(user => !existingProfileIds.includes(user.id));
    
    if (usersNeedingProfiles.length === 0) {
        console.log('✅ All users already have profiles.');
        return { success: true, created: 0 };
    }

    const profiles = usersNeedingProfiles.map(user => ({
        user_id: user.id,
        full_name: user.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }));

    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .insert(profiles)
            .select('user_id');

        if (error) {
            console.error('❌ Error creating user profiles:', error);
            return { success: false, created: 0, error: error.message };
        }

        console.log(`✅ Created ${data.length} user profiles`);
        return { success: true, created: data.length };

    } catch (error) {
        console.error('❌ Unexpected error creating profiles:', error);
        return { success: false, created: 0, error: error.message };
    }
}

/**
 * Verify migration integrity
 */
async function verifyMigration(originalUsers) {
    console.log('🔍 Verifying migration integrity...');

    try {
        // Get UUID mappings for verification
        const originalIds = originalUsers.map(u => u.id);
        const { data: mappings, error: mappingError } = await supabase
            .from('user_id_mapping')
            .select('old_id, new_id')
            .in('old_id', originalIds);

        if (mappingError) {
            console.error('❌ Error getting ID mappings:', mappingError);
            return false;
        }

        const uuidMappings = mappings.reduce((acc, mapping) => {
            acc[mapping.old_id] = mapping.new_id;
            return acc;
        }, {});

        // Get migrated users using UUIDs
        const uuids = Object.values(uuidMappings);
        const { data: migratedUsers, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, is_active')
            .in('id', uuids);

        if (error) {
            console.error('❌ Error verifying migration:', error);
            return false;
        }

        const verificationResults = originalUsers.map(originalUser => {
            const expectedUuid = uuidMappings[originalUser.id];
            const migratedUser = migratedUsers.find(u => u.id === expectedUuid);
            
            if (!migratedUser) {
                return { id: originalUser.id, status: 'missing', issues: ['User not found in Supabase'] };
            }

            const issues = [];
            if (migratedUser.email !== originalUser.email) issues.push('Email mismatch');
            if (migratedUser.full_name !== originalUser.name) issues.push('Name mismatch');
            
            // Check role mapping
            const expectedRole = (originalUser.role || 'user') === 'user' ? 'job_seeker' : (originalUser.role || 'user');
            if (migratedUser.role !== expectedRole) issues.push('Role mismatch');

            return {
                id: originalUser.id,
                uuid: expectedUuid,
                status: issues.length === 0 ? 'verified' : 'issues',
                issues: issues
            };
        });

        const verified = verificationResults.filter(r => r.status === 'verified').length;
        const withIssues = verificationResults.filter(r => r.status === 'issues').length;
        const missing = verificationResults.filter(r => r.status === 'missing').length;

        console.log(`📊 Verification Results:`);
        console.log(`   ✅ Verified: ${verified}`);
        console.log(`   ⚠️  With Issues: ${withIssues}`);
        console.log(`   ❌ Missing: ${missing}`);

        if (withIssues > 0 || missing > 0) {
            console.log('\n🔍 Detailed Issues:');
            verificationResults
                .filter(r => r.status !== 'verified')
                .forEach(result => {
                    console.log(`   ID ${result.id} (${result.uuid}): ${result.issues.join(', ')}`);
                });
        }

        return missing === 0 && withIssues === 0;

    } catch (error) {
        console.error('❌ Unexpected error during verification:', error);
        return false;
    }
}

/**
 * Main migration function
 */
async function main() {
    console.log('🚀 Starting Users Migration to Supabase');
    console.log('=====================================\n');

    try {
        // Step 1: Read users data
        console.log('📖 Reading users.json...');
        const usersData = await readUsersData();
        console.log(`✅ Found ${usersData.length} users in JSON file\n`);

        // Step 2: Transform data
        console.log('🔄 Transforming user data...');
        const transformedUsers = transformUserData(usersData);
        console.log('✅ Data transformation complete\n');

        // Step 3: Migrate users
        const migrationResult = await migrateUsers(transformedUsers);
        console.log('\n📊 Migration Results:');
        console.log(`   ✅ Migrated: ${migrationResult.migrated}`);
        console.log(`   ⏭️  Skipped: ${migrationResult.skipped}`);
        
        if (migrationResult.errors.length > 0) {
            console.log(`   ❌ Errors: ${migrationResult.errors.length}`);
            migrationResult.errors.forEach(err => {
                console.log(`      Batch ${err.batch}: ${err.error}`);
            });
        }

        // Step 4: Create user profiles
        if (migrationResult.migrated > 0) {
            console.log('\n');
            const profileResult = await createUserProfiles(transformedUsers);
            if (!profileResult.success) {
                console.log(`⚠️  Profile creation had issues: ${profileResult.error}`);
            }
        }

        // Step 5: Verify migration
        console.log('\n');
        const verificationPassed = await verifyMigration(usersData);

        // Final summary
        console.log('\n🎯 Migration Summary');
        console.log('===================');
        console.log(`Status: ${migrationResult.success && verificationPassed ? '✅ SUCCESS' : '⚠️  COMPLETED WITH ISSUES'}`);
        console.log(`Total Users: ${usersData.length}`);
        console.log(`Migrated: ${migrationResult.migrated}`);
        console.log(`Skipped: ${migrationResult.skipped}`);
        console.log(`Verification: ${verificationPassed ? '✅ PASSED' : '❌ FAILED'}`);

        if (migrationResult.success && verificationPassed) {
            console.log('\n🎉 Users migration completed successfully!');
            process.exit(0);
        } else {
            console.log('\n⚠️  Migration completed with issues. Please review the logs above.');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n💥 Migration failed with error:', error);
        process.exit(1);
    }
}

// Run the migration
main();
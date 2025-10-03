import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
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

interface JsonUser {
    id: number;
    email: string;
    password: string;
    name: string;
    role: string;
    is_active: boolean;
    email_verified?: boolean;
    email_verification_token?: string | null;
    email_verification_expires?: string | null;
    created_at: string;
    updated_at: string;
    last_login?: string | null;
}

interface JsonAnalyticsEvent {
    id: number;
    user_id: number | string;
    feature_name: string;
    action: string;
    metadata: string | null;
    created_at: string;
}

async function migrateUsers() {
    console.log('Starting user migration...');
    
    try {
        // Read users.json file
        const usersPath = path.join(process.cwd(), 'data', 'users.json');
        const usersData: JsonUser[] = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        
        console.log(`Found ${usersData.length} users to migrate`);
        
        // Check if users table is empty
        const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        if (count && count > 0) {
            console.log(`Users table already has ${count} records. Skipping user migration.`);
            return;
        }
        
        // Migrate users one by one to handle potential conflicts
        let migratedCount = 0;
        let skippedCount = 0;
        
        for (const user of usersData) {
            try {
                // Check if user already exists
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', user.email)
                    .single();
                
                if (existingUser) {
                    console.log(`User ${user.email} already exists, skipping...`);
                    skippedCount++;
                    continue;
                }
                
                // Insert user
                const { error } = await supabase
                    .from('users')
                    .insert({
                        email: user.email,
                        password_hash: user.password,
                        name: user.name,
                        role: user.role,
                        is_active: user.is_active,
                        email_verified: user.email_verified || false,
                        email_verification_token: user.email_verification_token,
                        email_verification_expires: user.email_verification_expires,
                        last_login: user.last_login,
                        created_at: user.created_at,
                        updated_at: user.updated_at
                    });
                
                if (error) {
                    console.error(`Error migrating user ${user.email}:`, error);
                } else {
                    migratedCount++;
                    console.log(`✓ Migrated user: ${user.email}`);
                }
            } catch (error) {
                console.error(`Error processing user ${user.email}:`, error);
            }
        }
        
        console.log(`User migration completed: ${migratedCount} migrated, ${skippedCount} skipped`);
    } catch (error) {
        console.error('Error during user migration:', error);
    }
}

async function migrateAnalytics() {
    console.log('Starting analytics migration...');
    
    try {
        // Read analytics.json file
        const analyticsPath = path.join(process.cwd(), 'data', 'analytics.json');
        const analyticsData: JsonAnalyticsEvent[] = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
        
        console.log(`Found ${analyticsData.length} analytics events to migrate`);
        
        // Check if analytics_events table is empty
        const { count } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true });
        
        if (count && count > 0) {
            console.log(`Analytics events table already has ${count} records. Skipping analytics migration.`);
            return;
        }
        
        // Migrate analytics events in batches
        const batchSize = 100;
        let migratedCount = 0;
        
        for (let i = 0; i < analyticsData.length; i += batchSize) {
            const batch = analyticsData.slice(i, i + batchSize);
            
            const eventsToInsert = batch.map(event => ({
                user_id: typeof event.user_id === 'string' ? event.user_id : event.user_id.toString(),
                feature_name: event.feature_name,
                action: event.action,
                metadata: event.metadata ? JSON.parse(event.metadata) : null,
                created_at: event.created_at
            }));
            
            const { error } = await supabase
                .from('analytics_events')
                .insert(eventsToInsert);
            
            if (error) {
                console.error(`Error migrating analytics batch ${i / batchSize + 1}:`, error);
            } else {
                migratedCount += batch.length;
                console.log(`✓ Migrated analytics batch ${i / batchSize + 1}: ${batch.length} events`);
            }
        }
        
        console.log(`Analytics migration completed: ${migratedCount} events migrated`);
    } catch (error) {
        console.error('Error during analytics migration:', error);
    }
}

async function verifyMigration() {
    console.log('Verifying migration...');
    
    try {
        // Check users count
        const { count: usersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        // Check analytics events count
        const { count: analyticsCount } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true });
        
        console.log(`✓ Users in Supabase: ${usersCount || 0}`);
        console.log(`✓ Analytics events in Supabase: ${analyticsCount || 0}`);
        
        // Sample a few records to verify data integrity
        const { data: sampleUsers } = await supabase
            .from('users')
            .select('email, name, role, created_at')
            .limit(3);
        
        const { data: sampleAnalytics } = await supabase
            .from('analytics_events')
            .select('feature_name, action, created_at')
            .limit(3);
        
        console.log('Sample users:', sampleUsers);
        console.log('Sample analytics:', sampleAnalytics);
        
    } catch (error) {
        console.error('Error during verification:', error);
    }
}

async function main() {
    console.log('🚀 Starting data migration to Supabase...');
    
    try {
        await migrateUsers();
        await migrateAnalytics();
        await verifyMigration();
        
        console.log('✅ Data migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
main();

export { migrateUsers, migrateAnalytics, verifyMigration };
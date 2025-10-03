/**
 * Data Migration Script: analytics.json to Supabase
 * This script migrates analytics data from the JSON file to Supabase analytics_events table
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration in environment variables');
    console.error('Required: VITE_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Read and parse analytics.json file
 */
async function readAnalyticsData() {
    try {
        const analyticsPath = path.join(__dirname, '../data/analytics.json');
        const analyticsData = await fs.readFile(analyticsPath, 'utf8');
        return JSON.parse(analyticsData);
    } catch (error) {
        console.error('❌ Error reading analytics.json:', error.message);
        throw error;
    }
}

/**
 * Parse metadata from JSON string to object
 */
function parseMetadata(metadataString) {
    if (!metadataString) return {};
    
    try {
        // Handle case where metadata is already an object
        if (typeof metadataString === 'object') {
            return metadataString;
        }
        
        // Parse JSON string
        return JSON.parse(metadataString);
    } catch (error) {
        console.warn('⚠️  Could not parse metadata:', metadataString);
        return { raw_data: metadataString };
    }
}

/**
 * Transform analytics data to match Supabase schema
 */
function transformAnalyticsData(analytics, userIdMapping = {}) {
    return analytics.map(event => {
        // Parse metadata from JSON string
        const metadata = parseMetadata(event.metadata);
        
        // Convert integer user_id to UUID if mapping exists
        let userId = event.user_id;
        if (typeof userId === 'number' || /^\d+$/.test(userId)) {
            userId = userIdMapping[userId] || userId;
        }
        
        // Generate UUID for event ID if it's an integer
        let eventId = event.id;
        if (typeof eventId === 'number' || /^\d+$/.test(eventId)) {
            // Use the same UUID generation approach as for users
            const hash = crypto.createHash('sha256').update(`analytics_event_${eventId}`).digest('hex');
            eventId = [
                hash.substring(0, 8),
                hash.substring(8, 12),
                '4' + hash.substring(13, 16), // Version 4 UUID
                ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.substring(17, 20), // Variant bits
                hash.substring(20, 32)
            ].join('-');
        }

        // Map JSON fields to Supabase schema
        const transformedEvent = {
            id: eventId,
            user_id: userId,
            event_type: event.feature_name || 'unknown',
            feature_name: event.feature_name,
            action: event.action,
            metadata: metadata, // Store parsed metadata as JSONB
            session_id: metadata.session_id || null,
            ip_address: metadata.ip_address || null,
            user_agent: metadata.user_agent || null,
            created_at: event.created_at
        };

        // Clean up null/undefined values
        Object.keys(transformedEvent).forEach(key => {
            if (transformedEvent[key] === undefined) {
                transformedEvent[key] = null;
            }
        });

        return transformedEvent;
    });
}

/**
 * Check for existing events in Supabase
 */
async function checkExistingEvents(eventIds) {
    try {
        if (eventIds.length === 0) return [];

        // Since the analytics_events table uses UUID for id, but our JSON data has integer IDs,
        // we need to generate UUIDs for the integer IDs to check
        const uuidEventIds = eventIds.map(id => {
            if (typeof id === 'number' || /^\d+$/.test(id)) {
                // Generate deterministic UUID from integer ID
                const hash = crypto.createHash('sha256').update(`analytics_event_${id}`).digest('hex');
                return [
                    hash.substring(0, 8),
                    hash.substring(8, 12),
                    '4' + hash.substring(13, 16), // Version 4 UUID
                    ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.substring(17, 20), // Variant bits
                    hash.substring(20, 32)
                ].join('-');
            }
            return id;
        });

        const { data, error } = await supabase
            .from('analytics_events')
            .select('id')
            .in('id', uuidEventIds);

        if (error) {
            console.error('❌ Error checking existing events:', error);
            return [];
        }

        return data.map(event => event.id);
    } catch (error) {
        console.error('❌ Error checking existing events:', error);
        return [];
    }
}

/**
 * Convert integer user IDs to UUIDs using the mapping table
 */
async function convertUserIds(userIds) {
    try {
        const integerIds = userIds.filter(id => typeof id === 'number' || /^\d+$/.test(id));
        const uuidIds = userIds.filter(id => typeof id === 'string' && !(/^\d+$/.test(id)));
        
        let mappedIds = [...uuidIds]; // Start with existing UUIDs
        
        if (integerIds.length > 0) {
            // Get UUID mappings for integer IDs
            const { data: mappings, error } = await supabase
                .from('user_id_mapping')
                .select('old_id, new_id')
                .in('old_id', integerIds);

            if (error) {
                console.error('❌ Error getting user ID mappings:', error);
                return { converted: uuidIds, unmapped: integerIds };
            }

            const mappingDict = mappings.reduce((acc, mapping) => {
                acc[mapping.old_id] = mapping.new_id;
                return acc;
            }, {});

            // Convert integer IDs to UUIDs
            const convertedIds = integerIds.map(id => mappingDict[id]).filter(Boolean);
            const unmappedIds = integerIds.filter(id => !mappingDict[id]);

            mappedIds = [...mappedIds, ...convertedIds];

            if (unmappedIds.length > 0) {
                console.log(`⚠️  Found ${unmappedIds.length} unmapped integer user IDs: ${unmappedIds.join(', ')}`);
            }

            return { converted: mappedIds, unmapped: unmappedIds };
        }

        return { converted: mappedIds, unmapped: [] };
    } catch (error) {
        console.error('❌ Error converting user IDs:', error);
        return { converted: uuidIds, unmapped: integerIds };
    }
}

/**
 * Validate user IDs exist in users table
 */
async function validateUserIds(userIds) {
    try {
        const uniqueUserIds = [...new Set(userIds.filter(id => id))];
        
        if (uniqueUserIds.length === 0) {
            return { valid: [], invalid: [] };
        }

        const { data, error } = await supabase
            .from('users')
            .select('id')
            .in('id', uniqueUserIds);

        if (error) {
            console.error('❌ Error validating user IDs:', error);
            return { valid: [], invalid: uniqueUserIds };
        }

        const validUserIds = data.map(user => user.id);
        const invalidUserIds = uniqueUserIds.filter(id => !validUserIds.includes(id));

        return { valid: validUserIds, invalid: invalidUserIds };
    } catch (error) {
        console.error('❌ Error validating user IDs:', error);
        return { valid: [], invalid: userIds };
    }
}

/**
 * Migrate analytics events to Supabase
 */
async function migrateAnalytics(events) {
    console.log(`📊 Starting migration of ${events.length} analytics events...`);

    // Validate user IDs
    const userIds = events.map(event => event.user_id);
    const { valid: validUserIds, invalid: invalidUserIds } = await validateUserIds(userIds);
    
    if (invalidUserIds.length > 0) {
        console.log(`⚠️  Found ${invalidUserIds.length} events with invalid user IDs. They will be skipped.`);
        console.log(`   Invalid user IDs: ${invalidUserIds.join(', ')}`);
    }

    // Filter events with valid user IDs
    const validEvents = events.filter(event => 
        !event.user_id || validUserIds.includes(event.user_id)
    );

    // Check for existing events
    const eventIds = validEvents.map(event => event.id);
    const existingEventIds = await checkExistingEvents(eventIds);
    
    if (existingEventIds.length > 0) {
        console.log(`⚠️  Found ${existingEventIds.length} existing events. They will be skipped.`);
    }

    // Filter out existing events
    const newEvents = validEvents.filter(event => !existingEventIds.includes(event.id));
    
    if (newEvents.length === 0) {
        console.log('✅ All valid events already exist in Supabase. No migration needed.');
        return { 
            success: true, 
            migrated: 0, 
            skipped: existingEventIds.length,
            invalidUsers: invalidUserIds.length
        };
    }

    console.log(`📝 Migrating ${newEvents.length} new analytics events...`);

    // Insert events in batches to avoid overwhelming the database
    const batchSize = 50;
    let migratedCount = 0;
    let errors = [];

    for (let i = 0; i < newEvents.length; i += batchSize) {
        const batch = newEvents.slice(i, i + batchSize);
        
        try {
            const { data, error } = await supabase
                .from('analytics_events')
                .insert(batch)
                .select('id, event_type, feature_name, action');

            if (error) {
                console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
                errors.push({ batch: Math.floor(i/batchSize) + 1, error: error.message });
                continue;
            }

            migratedCount += data.length;
            console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: Migrated ${data.length} events`);
            
            // Log sample of migrated events
            const sampleSize = Math.min(3, data.length);
            for (let j = 0; j < sampleSize; j++) {
                const event = data[j];
                console.log(`   - ${event.feature_name}:${event.action} (${event.id})`);
            }
            if (data.length > sampleSize) {
                console.log(`   ... and ${data.length - sampleSize} more`);
            }

        } catch (error) {
            console.error(`❌ Unexpected error in batch ${Math.floor(i/batchSize) + 1}:`, error);
            errors.push({ batch: Math.floor(i/batchSize) + 1, error: error.message });
        }
    }

    return {
        success: errors.length === 0,
        migrated: migratedCount,
        skipped: existingEventIds.length,
        invalidUsers: invalidUserIds.length,
        errors: errors
    };
}

/**
 * Generate analytics summary
 */
async function generateAnalyticsSummary() {
    console.log('📈 Generating analytics summary...');

    try {
        // Get total events count
        const { count: totalEvents, error: countError } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('❌ Error getting total events count:', countError);
            return;
        }

        // Get events by type
        const { data: eventsByType, error: typeError } = await supabase
            .from('analytics_events')
            .select('event_type')
            .order('event_type');

        if (typeError) {
            console.error('❌ Error getting events by type:', typeError);
            return;
        }

        // Count events by type
        const typeCounts = eventsByType.reduce((acc, event) => {
            acc[event.event_type] = (acc[event.event_type] || 0) + 1;
            return acc;
        }, {});

        // Get recent events
        const { data: recentEvents, error: recentError } = await supabase
            .from('analytics_events')
            .select('event_type, feature_name, action, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) {
            console.error('❌ Error getting recent events:', recentError);
            return;
        }

        console.log('\n📊 Analytics Summary:');
        console.log(`   Total Events: ${totalEvents}`);
        console.log('\n   Events by Type:');
        Object.entries(typeCounts).forEach(([type, count]) => {
            console.log(`     ${type}: ${count}`);
        });

        console.log('\n   Recent Events:');
        recentEvents.forEach(event => {
            const date = new Date(event.created_at).toLocaleString();
            console.log(`     ${event.feature_name}:${event.action} - ${date}`);
        });

    } catch (error) {
        console.error('❌ Error generating analytics summary:', error);
    }
}

/**
 * Verify migration integrity
 */
async function verifyMigration(originalEvents) {
    console.log('🔍 Verifying migration integrity...');

    try {
        // Generate UUIDs for original event IDs for verification
        const eventUuids = originalEvents.map(e => {
            if (typeof e.id === 'number' || /^\d+$/.test(e.id)) {
                const hash = crypto.createHash('sha256').update(`analytics_event_${e.id}`).digest('hex');
                return [
                    hash.substring(0, 8),
                    hash.substring(8, 12),
                    '4' + hash.substring(13, 16), // Version 4 UUID
                    ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.substring(17, 20), // Variant bits
                    hash.substring(20, 32)
                ].join('-');
            }
            return e.id;
        });

        const { data: migratedEvents, error } = await supabase
            .from('analytics_events')
            .select('id, user_id, event_type, feature_name, action, metadata')
            .in('id', eventUuids);

        if (error) {
            console.error('❌ Error verifying migration:', error);
            return false;
        }

        const verificationResults = originalEvents.map((originalEvent, index) => {
            const expectedUuid = eventUuids[index];
            const migratedEvent = migratedEvents.find(e => e.id === expectedUuid);
            
            if (!migratedEvent) {
                return { id: originalEvent.id, status: 'missing', issues: ['Event not found in Supabase'] };
            }

            const issues = [];
            // Note: We can't easily verify user_id here because of the mapping complexity
            if (migratedEvent.event_type !== (originalEvent.feature_name || 'unknown')) issues.push('Event type mismatch');
            if (migratedEvent.feature_name !== originalEvent.feature_name) issues.push('Feature name mismatch');
            if (migratedEvent.action !== originalEvent.action) issues.push('Action mismatch');

            return {
                id: originalEvent.id,
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
            console.log('\n🔍 Detailed Issues (first 10):');
            verificationResults
                .filter(r => r.status !== 'verified')
                .slice(0, 10)
                .forEach(result => {
                    console.log(`   ${result.id}: ${result.issues.join(', ')}`);
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
    console.log('🚀 Starting Analytics Migration to Supabase');
    console.log('==========================================\n');

    try {
        // Step 1: Read analytics data
        console.log('📖 Reading analytics.json...');
        const analyticsData = await readAnalyticsData();
        console.log(`✅ Found ${analyticsData.length} analytics events in JSON file\n`);

        // Step 2: Convert user IDs
        console.log('🔄 Converting user IDs...');
        const userIds = analyticsData.map(event => event.user_id);
        const { converted: convertedUserIds, unmapped: unmappedUserIds } = await convertUserIds(userIds);
        
        // Create user ID mapping for transformation
        const userIdMapping = {};
        const integerIds = userIds.filter(id => typeof id === 'number' || /^\d+$/.test(id));
        
        if (integerIds.length > 0) {
            const { data: mappings, error } = await supabase
                .from('user_id_mapping')
                .select('old_id, new_id')
                .in('old_id', integerIds);

            if (!error && mappings) {
                mappings.forEach(mapping => {
                    userIdMapping[mapping.old_id] = mapping.new_id;
                });
            }
        }

        console.log(`✅ User ID conversion complete. Mapped ${Object.keys(userIdMapping).length} integer IDs to UUIDs\n`);

        // Step 3: Transform data
        console.log('🔄 Transforming analytics data...');
        const transformedEvents = transformAnalyticsData(analyticsData, userIdMapping);
        console.log('✅ Data transformation complete\n');

        // Step 4: Migrate analytics
        const migrationResult = await migrateAnalytics(transformedEvents);
        console.log('\n📊 Migration Results:');
        console.log(`   ✅ Migrated: ${migrationResult.migrated}`);
        console.log(`   ⏭️  Skipped: ${migrationResult.skipped}`);
        console.log(`   ⚠️  Invalid Users: ${migrationResult.invalidUsers}`);
        
        if (migrationResult.errors.length > 0) {
            console.log(`   ❌ Errors: ${migrationResult.errors.length}`);
            migrationResult.errors.forEach(err => {
                console.log(`      Batch ${err.batch}: ${err.error}`);
            });
        }

        // Step 5: Generate summary
        if (migrationResult.migrated > 0) {
            console.log('\n');
            await generateAnalyticsSummary();
        }

        // Step 6: Verify migration
        console.log('\n');
        const verificationPassed = await verifyMigration(analyticsData);

        // Final summary
        console.log('\n🎯 Migration Summary');
        console.log('===================');
        console.log(`Status: ${migrationResult.success && verificationPassed ? '✅ SUCCESS' : '⚠️  COMPLETED WITH ISSUES'}`);
        console.log(`Total Events: ${analyticsData.length}`);
        console.log(`Migrated: ${migrationResult.migrated}`);
        console.log(`Skipped: ${migrationResult.skipped}`);
        console.log(`Invalid Users: ${migrationResult.invalidUsers}`);
        console.log(`Verification: ${verificationPassed ? '✅ PASSED' : '❌ FAILED'}`);

        if (migrationResult.success && verificationPassed) {
            console.log('\n🎉 Analytics migration completed successfully!');
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
# Database Schema Mismatch Bugfix Design

## Overview

The bug occurs because the `getAllHotelSettings()` function in `lib/db.ts` attempts to query from normalized database tables (`facilities`, `amenities`, `contact_info`, `special_events`, `hotel_activities`, `nearby_attractions`) that don't exist in the current database schema. The actual schema uses a denormalized `hotel_settings` table with all facility and amenity data stored as columns. This mismatch causes PostgreSQL parameter errors when the function tries to execute queries against non-existent tables, particularly when facilities are marked as closed.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when `getAllHotelSettings()` queries non-existent normalized tables
- **Property (P)**: The desired behavior - successful retrieval of hotel settings from the correct schema
- **Preservation**: Existing hotel settings data structure and API responses that must remain unchanged
- **getAllHotelSettings**: The function in `lib/db.ts` that retrieves hotel configuration data
- **hotel_settings**: The actual denormalized table containing all facility and amenity data as columns
- **Normalized Schema**: The expected schema with separate tables for facilities, amenities, etc. (doesn't exist)
- **Denormalized Schema**: The actual schema with all data in the `hotel_settings` table

## Bug Details

### Bug Condition

The bug manifests when the `getAllHotelSettings()` function executes queries against tables that don't exist in the current database schema. The function assumes a normalized database structure but the actual schema is denormalized.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type DatabaseQuery
  OUTPUT: boolean
  
  RETURN input.tableName IN ['facilities', 'amenities', 'contact_info', 'hotel_activities', 'nearby_attractions']
         AND NOT tableExists(input.tableName, currentDatabase)
         AND queryExecuted(input)
END FUNCTION
```

### Examples

- **Query to facilities table**: `SELECT facility_type FROM facilities WHERE hotel_id = $1` fails with "relation 'facilities' does not exist"
- **Query to amenities table**: `SELECT amenity_type FROM amenities WHERE hotel_id = $1` fails with parameter type errors
- **Query to contact_info table**: `SELECT phone FROM contact_info WHERE hotel_id = $1` fails because table doesn't exist
- **Edge case**: Hotels with no settings record should return default values without crashing

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- API response structure from `/api/hotel-settings` must remain identical
- Hotel settings data format returned to the chat system must be unchanged
- Default values for missing settings must continue to work as before

**Scope:**
All API consumers that depend on the hotel settings structure should be completely unaffected by this fix. This includes:
- Chat system RAG knowledge retrieval
- Frontend components displaying hotel information
- Any caching mechanisms that store hotel settings data

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Schema Evolution Mismatch**: The `getAllHotelSettings()` function was updated to use a normalized schema but the database migration was never applied
   - Function expects separate tables: `facilities`, `amenities`, `contact_info`, etc.
   - Actual schema uses denormalized `hotel_settings` table with columns like `poolAvailable`, `spaOpenTime`, etc.

2. **Missing Migration**: The database contains the original Prisma schema with denormalized structure
   - `hotel_settings` table has columns: `poolAvailable`, `poolOpenTime`, `poolCloseTime`, etc.
   - No separate `facilities` table with `facility_type`, `is_available` columns

3. **Query Parameter Binding Issues**: PostgreSQL cannot determine parameter types for queries against non-existent tables
   - Error "could not determine data type of parameter $7" occurs during query execution

4. **Development vs Production Schema Drift**: The function may have been developed against a different database schema than what's deployed

## Correctness Properties

Property 1: Bug Condition - Schema-Aligned Data Retrieval

_For any_ hotel ID where hotel settings exist in the database, the fixed getAllHotelSettings function SHALL successfully retrieve all facility and amenity data from the correct denormalized schema without database errors.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - API Response Structure

_For any_ hotel settings request that previously worked, the fixed function SHALL produce exactly the same response structure and data format, preserving compatibility with all existing API consumers.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

**File**: `lib/db.ts`

**Function**: `getAllHotelSettings`

**Specific Changes**:
1. **Replace Normalized Queries**: Remove all queries to non-existent tables (`facilities`, `amenities`, `contact_info`, etc.)
   - Remove facilities query: `SELECT facility_type, facility_name, open_time, close_time, is_available FROM facilities`
   - Remove amenities query: `SELECT amenity_type, is_available, primary_value FROM amenities`
   - Remove contact_info query: `SELECT phone, email, address FROM contact_info`

2. **Use Denormalized Schema**: Query directly from `hotel_settings` table columns
   - Map `poolAvailable` column to `pool.available` in response
   - Map `poolOpenTime`, `poolCloseTime` to `pool.openTime`, `pool.closeTime`
   - Map `spaAvailable`, `spaOpenTime`, `spaCloseTime` to spa object structure

3. **Handle Special Events**: Keep existing `special_events` table query (this table exists)
   - Query: `SELECT title, description, eventDate, eventTime FROM special_events WHERE hotelId = $1`

4. **Handle Activities**: Use existing `activities` table but map to expected structure
   - Query: `SELECT category, activityName FROM activities WHERE hotelId = $1`
   - Map to both `hotelActivities` and `nearbyAttractions` based on category

5. **Add Error Handling**: Gracefully handle missing hotel_settings records
   - Return default values when no settings exist for a hotel
   - Ensure all required fields are populated in response structure

### Database Query Mapping

**Old (Broken) Approach:**
```sql
-- These tables don't exist
SELECT facility_type FROM facilities WHERE hotel_id = $1
SELECT amenity_type FROM amenities WHERE hotel_id = $1
SELECT phone FROM contact_info WHERE hotel_id = $1
```

**New (Fixed) Approach:**
```sql
-- Use actual schema
SELECT poolAvailable, poolOpenTime, poolCloseTime, 
       spaAvailable, spaOpenTime, spaCloseTime,
       gymAvailable, gymOpenTime, gymCloseTime,
       phone, email, address, emergencyPhone,
       wifiAvailable, wifiPassword, wifiInstructions
FROM hotel_settings WHERE hotelId = $1
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that call `getAllHotelSettings()` and assert that database queries execute successfully. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Basic Hotel Settings Test**: Call `getAllHotelSettings()` for existing hotel (will fail on unfixed code)
2. **Closed Facility Test**: Test with hotel that has `poolAvailable = false` (will fail on unfixed code)
3. **Missing Settings Test**: Test with hotel that has no settings record (will fail on unfixed code)
4. **Multiple Hotels Test**: Test retrieving settings for multiple hotels (will fail on unfixed code)

**Expected Counterexamples**:
- Database errors: "relation 'facilities' does not exist"
- Parameter errors: "could not determine data type of parameter $7"
- Possible causes: schema mismatch, missing tables, incorrect query structure

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL hotelId WHERE hotelExists(hotelId) DO
  result := getAllHotelSettings_fixed()
  ASSERT result[hotelId] contains all required fields
  ASSERT no database errors occur
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL apiRequest WHERE NOT causesSchemaError(apiRequest) DO
  ASSERT hotelSettingsAPI_original(apiRequest) = hotelSettingsAPI_fixed(apiRequest)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across different hotel configurations
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that API response structure is unchanged

**Test Plan**: Capture expected response structure from working scenarios, then write property-based tests to verify this structure is preserved after the fix.

**Test Cases**:
1. **Response Structure Preservation**: Verify API response has same JSON structure after fix
2. **Data Format Preservation**: Verify time formats, boolean values, arrays remain unchanged
3. **Default Values Preservation**: Verify default values for missing data remain consistent
4. **Cache Compatibility Preservation**: Verify cached responses work with fixed function

### Unit Tests

- Test `getAllHotelSettings()` with various hotel configurations
- Test edge cases (missing settings, invalid hotel IDs, empty database)
- Test that response structure matches expected format for chat system

### Property-Based Tests

- Generate random hotel IDs and verify function returns valid structure
- Generate random hotel_settings configurations and verify correct mapping
- Test that all response fields are properly typed and formatted

### Integration Tests

- Test full API flow from `/api/hotel-settings` endpoint
- Test chat system integration with fixed hotel settings
- Test caching behavior with corrected database queries
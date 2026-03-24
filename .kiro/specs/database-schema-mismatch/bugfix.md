# Bugfix Requirements Document

## Introduction

The chat system crashes with "could not determine data type of parameter $7" error when facilities like the pool are marked as closed. This occurs due to a critical database schema mismatch where the `getAllHotelSettings()` function queries from newer database tables (`facilities`, `amenities`, `contact_info`, etc.) that don't exist in the current database schema, which still uses the old Prisma migration schema with a single `hotel_settings` table.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a facility (like pool) is marked as closed in the database THEN the system crashes with "could not determine data type of parameter $7" error

1.2 WHEN the `getAllHotelSettings()` function executes queries against non-existent tables (`facilities`, `amenities`, `contact_info`, `special_events`, `hotel_activities`, `nearby_attractions`) THEN the system fails with database parameter errors

1.3 WHEN users attempt to get information about closed facilities through the chat system THEN the entire chat API becomes unavailable due to database query failures

### Expected Behavior (Correct)

2.1 WHEN a facility (like pool) is marked as closed in the database THEN the system SHALL return proper facility status information without crashing

2.2 WHEN the `getAllHotelSettings()` function executes THEN the system SHALL successfully query from the correct database schema that matches the current migration

2.3 WHEN users attempt to get information about closed facilities through the chat system THEN the system SHALL respond with accurate facility availability information

### Unchanged Behavior (Regression Prevention)

3.1 WHEN facilities are marked as available/open THEN the system SHALL CONTINUE TO return correct facility information as before

3.2 WHEN the chat system processes queries about available facilities THEN the system SHALL CONTINUE TO provide accurate responses without errors

3.3 WHEN hotel settings are retrieved for hotels with no facility closures THEN the system SHALL CONTINUE TO work exactly as it did before the fix
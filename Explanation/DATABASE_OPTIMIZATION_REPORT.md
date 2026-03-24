# Database Optimization Report

## Current Database Structure

### Hotel Data Tables (8 tables) ✅ ALL USED
1. `hotels` - Hotel basic information
2. `facilities` - Pool, gym, spa, restaurant, kids club
3. `facility_attributes` - Spa treatments, kids club age range
4. `contact_info` - Phone, email, address
5. `amenities` - WiFi, parking, check-in/out
6. `special_events` - Hotel events
7. `hotel_activities` - Activities inside the hotel (15 records)
8. `nearby_attractions` - Attractions outside hotel (11 records)

**Status**: ✅ All optimized and in use

---

## Analytics Tables Analysis

### ✅ USED Analytics Tables (3 tables)

#### 1. `guest_profiles`
- **Purpose**: Store guest registration data
- **Usage**: ✅ Used in registration form
- **Data**: Age range, nationality, travel purpose, group type
- **Keep**: YES

#### 2. `question_categories`
- **Purpose**: Track what guests ask about
- **Usage**: ✅ Used in chat API
- **Data**: Facilities, activities, amenities, etc.
- **Keep**: YES

#### 3. `popular_topics`
- **Purpose**: Track trending topics
- **Usage**: ✅ Used in chat API
- **Data**: Pool, spa, restaurant, etc.
- **Keep**: YES

---

### ❌ UNUSED Analytics Tables (2 tables)

#### 1. `user_satisfaction` ❌ DELETE
- **Purpose**: Track chatbot ratings and feedback
- **Component**: `SatisfactionRating.tsx` exists
- **Problem**: Component is NEVER imported or used
- **Reason**: You're not asking users to rate the chatbot
- **Recommendation**: **DELETE TABLE AND COMPONENT**
- **Impact**: None (not being used)

#### 2. `activity_interest` ❌ DELETE
- **Purpose**: Track which activities guests are interested in
- **Functions**: Defined in `lib/analytics.ts`
- **Problem**: Functions are NEVER called
- **Reason**: Not tracking activity views/inquiries
- **Recommendation**: **DELETE TABLE AND FUNCTIONS**
- **Impact**: None (not being used)

---

## Cleanup Actions

### 1. Delete Unused Database Tables

Run this SQL script:
```sql
DROP TABLE IF EXISTS user_satisfaction CASCADE;
DROP TABLE IF EXISTS activity_interest CASCADE;
```

**File**: `scripts/cleanup-unused-analytics.sql`

### 2. Delete Unused Code Files

Delete these files:
- `app/components/SatisfactionRating.tsx` (never imported)
- `app/api/analytics/satisfaction/route.ts` (never called)

### 3. Clean Up Analytics Functions

In `lib/analytics.ts`, remove these unused functions:
- `trackSatisfaction()` (lines ~160-180)
- `trackActivityInterest()` (lines ~190-220)
- Related code in `getAnalyticsDashboard()` (lines ~395-410)

---

## Optimized Database Structure

### After Cleanup:

**Hotel Data**: 8 tables (unchanged)
**Analytics**: 3 tables (down from 5)

**Total**: 11 tables (down from 13)

**Benefits**:
- ✅ Simpler database structure
- ✅ Less maintenance overhead
- ✅ Faster queries (fewer tables to scan)
- ✅ Cleaner codebase
- ✅ No unused code

---

## Summary

**Current State**:
- 13 tables total
- 2 tables completely unused
- Unused components and API routes

**After Optimization**:
- 11 tables total
- All tables actively used
- Clean, focused codebase

**Recommendation**: Execute cleanup to optimize the database and remove dead code.

---

**Next Steps**:
1. Review this report
2. Run `scripts/cleanup-unused-analytics.sql`
3. Delete unused files
4. Clean up `lib/analytics.ts`
5. Test to ensure everything still works

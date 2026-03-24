-- ============================================
-- CLEANUP: Remove Unused Analytics Tables
-- ============================================
-- These tables were created but are not being used in the application
-- Run this script to optimize the database

-- Drop unused tables
DROP TABLE IF EXISTS user_satisfaction CASCADE;
DROP TABLE IF EXISTS activity_interest CASCADE;

-- Verify remaining analytics tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%guest%' 
   OR table_name LIKE '%question%' 
   OR table_name LIKE '%topic%'
ORDER BY table_name;

-- Expected remaining analytics tables:
-- 1. guest_profiles
-- 2. question_categories  
-- 3. popular_topics

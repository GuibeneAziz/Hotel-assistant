-- ============================================
-- Fix Nationality Case Duplicates in guest_profiles
-- Run once via Neon SQL Editor or psql
-- ============================================

BEGIN;

-- Normalize all existing nationality values to proper case
-- This handles "tunisian" vs "Tunisian" vs "TUNISIAN"
UPDATE guest_profiles
SET nationality = INITCAP(LOWER(nationality))
WHERE nationality IS NOT NULL;

-- Verify: show distinct nationalities after fix
SELECT nationality, COUNT(*) as count
FROM guest_profiles
GROUP BY nationality
ORDER BY count DESC;

COMMIT;

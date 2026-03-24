-- ============================================
-- Fix Analytics Duplicate Rows
-- Run once against the live database via:
--   Neon SQL Editor (console.neon.tech)
--   OR: psql "YOUR_DATABASE_URL" -f scripts/fix-analytics-duplicates.sql
-- ============================================

BEGIN;

-- ============================================
-- 1. Fix popular_topics duplicates
--    Keep one row per (hotel_id, topic, date)
--    with summed counts
-- ============================================

-- Step 1a: For each duplicate group, update the row with the lowest id
-- to hold the summed values
UPDATE popular_topics pt
SET
  mention_count      = agg.total_mentions,
  positive_sentiment = agg.total_positive,
  negative_sentiment = agg.total_negative
FROM (
  SELECT
    MIN(id)                  AS keep_id,
    hotel_id,
    topic,
    date,
    SUM(mention_count)       AS total_mentions,
    SUM(positive_sentiment)  AS total_positive,
    SUM(negative_sentiment)  AS total_negative
  FROM popular_topics
  GROUP BY hotel_id, topic, date
  HAVING COUNT(*) > 1
) agg
WHERE pt.id = agg.keep_id;

-- Step 1b: Delete all duplicate rows EXCEPT the one we just updated
DELETE FROM popular_topics
WHERE id NOT IN (
  SELECT MIN(id)
  FROM popular_topics
  GROUP BY hotel_id, topic, date
);

-- ============================================
-- 2. Fix question_categories duplicates
-- ============================================

-- Step 2a: Update the kept row with summed values
UPDATE question_categories qc
SET
  question_count = agg.total_count,
  last_asked     = agg.latest_asked,
  age_18_25      = agg.total_18_25,
  age_26_35      = agg.total_26_35,
  age_36_50      = agg.total_36_50,
  age_50_plus    = agg.total_50_plus
FROM (
  SELECT
    MIN(id)             AS keep_id,
    hotel_id,
    category,
    subcategory,
    date,
    SUM(question_count) AS total_count,
    MAX(last_asked)     AS latest_asked,
    SUM(age_18_25)      AS total_18_25,
    SUM(age_26_35)      AS total_26_35,
    SUM(age_36_50)      AS total_36_50,
    SUM(age_50_plus)    AS total_50_plus
  FROM question_categories
  GROUP BY hotel_id, category, subcategory, date
  HAVING COUNT(*) > 1
) agg
WHERE qc.id = agg.keep_id;

-- Step 2b: Delete duplicates, keep only the lowest id per group
DELETE FROM question_categories
WHERE id NOT IN (
  SELECT MIN(id)
  FROM question_categories
  GROUP BY hotel_id, category, subcategory, date
);

-- ============================================
-- 3. Add UNIQUE constraints (safe - skips if already exists)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'popular_topics_hotel_id_topic_date_key'
  ) THEN
    ALTER TABLE popular_topics
      ADD CONSTRAINT popular_topics_hotel_id_topic_date_key
      UNIQUE (hotel_id, topic, date);
    RAISE NOTICE 'Added UNIQUE constraint on popular_topics';
  ELSE
    RAISE NOTICE 'UNIQUE constraint on popular_topics already exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'question_categories_hotel_id_category_subcategory_date_key'
  ) THEN
    ALTER TABLE question_categories
      ADD CONSTRAINT question_categories_hotel_id_category_subcategory_date_key
      UNIQUE (hotel_id, category, subcategory, date);
    RAISE NOTICE 'Added UNIQUE constraint on question_categories';
  ELSE
    RAISE NOTICE 'UNIQUE constraint on question_categories already exists';
  END IF;
END $$;

COMMIT;

-- ============================================
-- Verify: both queries should return 0 rows
-- ============================================
SELECT 'popular_topics duplicates remaining:' AS check, COUNT(*) AS count
FROM (
  SELECT hotel_id, topic, date
  FROM popular_topics
  GROUP BY hotel_id, topic, date
  HAVING COUNT(*) > 1
) x

UNION ALL

SELECT 'question_categories duplicates remaining:', COUNT(*)
FROM (
  SELECT hotel_id, category, subcategory, date
  FROM question_categories
  GROUP BY hotel_id, category, subcategory, date
  HAVING COUNT(*) > 1
) x;

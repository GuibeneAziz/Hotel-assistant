-- ============================================
-- Seed Special Events for all 3 hotels
-- Run via Neon SQL Editor
-- Dates are relative to today (March 2026)
-- ============================================

-- First, check your hotel IDs:
-- SELECT hotel_id, name FROM hotels;

-- Clear existing events (optional)
-- DELETE FROM special_events;

-- ============================================
-- Get hotel IDs dynamically and insert events
-- ============================================
DO $$
DECLARE
  hotel RECORD;
BEGIN
  FOR hotel IN SELECT hotel_id FROM hotels LOOP

    -- Today's events
    INSERT INTO special_events (hotel_id, title, description, event_date, event_time, location, price)
    VALUES
      (hotel.hotel_id, 'Welcome Cocktail Evening',
       'Join us for a complimentary welcome cocktail with live Tunisian music and light snacks.',
       CURRENT_DATE, '19:00', 'Pool Terrace', 'Free'),

      (hotel.hotel_id, 'Sunset Yoga Session',
       'Relaxing yoga session on the beach at sunset. All levels welcome. Bring a towel.',
       CURRENT_DATE, '18:00', 'Beach Area', 'Free');

    -- Tomorrow's events
    INSERT INTO special_events (hotel_id, title, description, event_date, event_time, location, price)
    VALUES
      (hotel.hotel_id, 'Traditional Tunisian Cooking Class',
       'Learn to prepare authentic Tunisian dishes with our head chef. Includes tasting.',
       CURRENT_DATE + 1, '10:00', 'Hotel Restaurant', '25 TND per person'),

      (hotel.hotel_id, 'Live Oud Music Night',
       'An evening of traditional Arabic music featuring a live oud performance.',
       CURRENT_DATE + 1, '20:30', 'Main Lounge', 'Free');

    -- This week
    INSERT INTO special_events (hotel_id, title, description, event_date, event_time, location, price)
    VALUES
      (hotel.hotel_id, 'Hammam & Spa Day',
       'Full day access to hammam, steam room, and relaxation pool. Towels provided.',
       CURRENT_DATE + 2, '09:00', 'Spa Center', '60 TND per person'),

      (hotel.hotel_id, 'Beach Volleyball Tournament',
       'Friendly beach volleyball tournament. Sign up at the front desk. Prizes for winners!',
       CURRENT_DATE + 3, '15:00', 'Beach Court', 'Free'),

      (hotel.hotel_id, 'Tunisian Night Gala Dinner',
       'Special gala dinner featuring traditional Tunisian cuisine, belly dancing, and live music.',
       CURRENT_DATE + 4, '19:30', 'Main Restaurant', '45 TND per person'),

      (hotel.hotel_id, 'Kids Treasure Hunt',
       'Fun treasure hunt around the hotel grounds for children aged 5-12. Prizes for all participants.',
       CURRENT_DATE + 5, '10:00', 'Hotel Gardens', 'Free'),

      (hotel.hotel_id, 'Wine & Cheese Evening',
       'Curated selection of Tunisian wines paired with local cheeses and charcuterie.',
       CURRENT_DATE + 6, '18:30', 'Rooftop Bar', '35 TND per person');

  END LOOP;
END $$;

-- Verify inserted events
SELECT h.name as hotel, se.title, se.event_date, se.event_time, se.location, se.price
FROM special_events se
JOIN hotels h ON h.hotel_id = se.hotel_id
ORDER BY h.name, se.event_date, se.event_time;

-- ============================================
-- SAMPLE DATA FOR ENHANCED NEARBY ATTRACTIONS
-- ============================================

-- Clear existing data
DELETE FROM nearby_attractions;

-- ============================================
-- SINDBAD HAMMAMET ATTRACTIONS
-- ============================================

INSERT INTO nearby_attractions (
    hotel_id, attraction_name, description, category,
    distance, estimated_duration, price_range, transportation,
    suitable_for_couples, suitable_for_families, suitable_for_solo, suitable_for_groups,
    good_for_sunny, good_for_rainy, good_for_hot, good_for_mild, good_for_cool,
    activity_level, requires_booking, priority_order
) VALUES 
(
    'sindbad-hammamet', 'Medina of Hammamet', 
    'Historic old town with traditional architecture, souks, and authentic Tunisian culture. Perfect for exploring narrow streets and shopping for local crafts.',
    'cultural',
    '2 km', '2-3 hours', '5-15 TND', 'Walking or taxi',
    true, true, true, true,
    true, true, false, true, true,
    'moderate', false, 10
),
(
    'sindbad-hammamet', 'Carthageland Theme Park',
    'Family-friendly theme park with rides, shows, and entertainment based on Carthaginian history.',
    'entertainment',
    '8 km', 'Full day', '25-35 TND', 'Hotel shuttle or taxi',
    true, true, false, true,
    true, false, false, true, false,
    'high', true, 8
),
(
    'sindbad-hammamet', 'Hammamet Beach',
    'Beautiful sandy beach perfect for swimming, sunbathing, and water sports. Crystal clear Mediterranean waters.',
    'nature',
    '500 meters', '2-4 hours', 'Free', 'Walking',
    true, true, true, true,
    true, false, true, true, false,
    'low', false, 9
),
(
    'sindbad-hammamet', 'Quad Biking Adventure',
    'Exciting quad bike tours through olive groves and countryside. Professional guides and safety equipment provided.',
    'adventure',
    '15 km', '3 hours', '45-60 TND', 'Hotel pickup available',
    true, false, true, true,
    true, false, false, true, true,
    'high', true, 7
),
(
    'sindbad-hammamet', 'Yasmine Hammamet Marina',
    'Modern marina with restaurants, cafes, and boat trips. Great for romantic walks and dining.',
    'entertainment',
    '3 km', '2-3 hours', '10-30 TND', 'Taxi or hotel shuttle',
    true, true, true, false,
    true, true, true, true, true,
    'low', false, 6
),
(
    'sindbad-hammamet', 'Hammamet Souk',
    'Traditional market with local crafts, spices, textiles, and souvenirs. Perfect for authentic shopping experience.',
    'shopping',
    '2 km', '1-2 hours', '10-50 TND', 'Walking or taxi',
    true, true, true, true,
    true, true, true, true, true,
    'moderate', false, 5
),
(
    'sindbad-hammamet', 'Nabeul Pottery Workshop',
    'Famous pottery town where you can watch artisans work and buy authentic Tunisian ceramics.',
    'cultural',
    '12 km', '2-3 hours', '15-40 TND', 'Taxi or organized tour',
    true, true, true, true,
    true, true, true, true, true,
    'low', false, 4
);

-- ============================================
-- PARADISE HAMMAMET ATTRACTIONS
-- ============================================

INSERT INTO nearby_attractions (
    hotel_id, attraction_name, description, category,
    distance, estimated_duration, price_range, transportation,
    suitable_for_couples, suitable_for_families, suitable_for_solo, suitable_for_groups,
    good_for_sunny, good_for_rainy, good_for_hot, good_for_mild, good_for_cool,
    activity_level, requires_booking, priority_order
) VALUES 
(
    'paradise-hammamet', 'Medina of Hammamet', 
    'Historic old town with traditional architecture, souks, and authentic Tunisian culture.',
    'cultural',
    '1.5 km', '2-3 hours', '5-15 TND', 'Walking or taxi',
    true, true, true, true,
    true, true, false, true, true,
    'moderate', false, 10
),
(
    'paradise-hammamet', 'Hammamet Golf Course',
    'Championship 18-hole golf course with stunning views. Equipment rental available.',
    'sports',
    '5 km', '4-5 hours', '80-120 TND', 'Hotel shuttle or taxi',
    true, false, true, true,
    true, false, false, true, true,
    'moderate', true, 6
);

-- ============================================
-- MÖVENPICK SOUSSE ATTRACTIONS
-- ============================================

INSERT INTO nearby_attractions (
    hotel_id, attraction_name, description, category,
    distance, estimated_duration, price_range, transportation,
    suitable_for_couples, suitable_for_families, suitable_for_solo, suitable_for_groups,
    good_for_sunny, good_for_rainy, good_for_hot, good_for_mild, good_for_cool,
    activity_level, requires_booking, priority_order
) VALUES 
(
    'movenpick-sousse', 'Sousse Medina (UNESCO)',
    'UNESCO World Heritage site with ancient walls, traditional architecture, and historic mosques.',
    'cultural',
    '3 km', '3-4 hours', '5-20 TND', 'Taxi or walking',
    true, true, true, true,
    true, true, false, true, true,
    'moderate', false, 10
),
(
    'movenpick-sousse', 'Port El Kantaoui Marina',
    'Luxury marina with restaurants, shops, and boat excursions. Beautiful Mediterranean setting.',
    'entertainment',
    '8 km', '2-4 hours', '15-50 TND', 'Hotel shuttle or taxi',
    true, true, true, false,
    true, true, true, true, true,
    'low', false, 8
),
(
    'movenpick-sousse', 'Hergla Beach',
    'Pristine beach with clear waters, perfect for swimming and water sports. Less crowded than main beaches.',
    'nature',
    '15 km', '3-5 hours', 'Free', 'Taxi or rental car',
    true, true, true, true,
    true, false, true, true, false,
    'low', false, 7
);
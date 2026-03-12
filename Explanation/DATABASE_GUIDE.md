# Database Guide - PostgreSQL with Neon

## Current Setup

Your app uses **PostgreSQL** hosted on **Neon** (cloud database).

### Database Structure (Clean & Normalized)

```
hotels
├── hotel_id (PRIMARY KEY) - "sindbad-hammamet"
├── name - "Sindbad Hotel"
├── location - "Hammamet"
└── description, image_url, color, latitude, longitude

facilities (Restaurant, Spa, Pool, Gym, Kids Club)
├── id (PRIMARY KEY)
├── hotel_id (FOREIGN KEY)
├── facility_type - "restaurant", "spa", "pool", "gym", "kids_club"
├── facility_name - "breakfast", "lunch", "dinner" (for restaurant)
├── open_time, close_time
└── is_available

facility_attributes (Spa treatments, age ranges, etc.)
├── id (PRIMARY KEY)
├── facility_id (FOREIGN KEY)
├── attribute_key - "treatment", "age_range"
└── attribute_value

contact_info
├── hotel_id (PRIMARY KEY)
├── phone, email, address
└── emergency_phone

amenities (WiFi, Parking, Check-in/out)
├── id (PRIMARY KEY)
├── hotel_id (FOREIGN KEY)
├── amenity_type - "wifi", "parking", "checkin", "checkout"
├── is_available
├── primary_value - WiFi password, parking price, check-in time
└── instructions

special_events
├── id (PRIMARY KEY)
├── hotel_id (FOREIGN KEY)
├── title, description
├── event_date, event_time
└── location, price

hotel_activities (Activities INSIDE the hotel)
├── id (PRIMARY KEY)
├── hotel_id (FOREIGN KEY)
├── activity_name - "Kids Club Activities", "Beach Games"
├── category - "family", "couples", "sports", "relaxation"
├── location - "Pool Area", "Spa", "Beach"
└── is_available

nearby_attractions (Tourist attractions OUTSIDE the hotel)
├── id (PRIMARY KEY)
├── hotel_id (FOREIGN KEY)
├── attraction_name - "Medina Tour", "Desert Safari"
├── category - "cultural", "adventure"
├── distance - "5 km", "15 minutes drive"
├── estimated_duration - "2 hours", "Full day"
├── price_range - "Free", "50-80 TND"
└── transportation - "Hotel shuttle", "Taxi"
```

**Key Difference:**
- **hotel_activities**: Things you do AT the hotel (pool, spa, kids club)
- **nearby_attractions**: Things you do OUTSIDE the hotel (tours, excursions)
├── id (PRIMARY KEY)
├── hotel_id (FOREIGN KEY)
├── category - "family", "couples", "adventure", "cultural"
└── activity_name
```

---

## How to Work with the Database

### 1. In Your Next.js App (Normal Usage)

Use the `lib/db.ts` helper:

```javascript
import pool from '@/lib/db'

// Example: Get all hotels
const result = await pool.query('SELECT * FROM hotels')
const hotels = result.rows

// Example: Get facilities for a hotel
const facilities = await pool.query(
  'SELECT * FROM facilities WHERE hotel_id = $1',
  ['sindbad-hammamet']
)
```

### 2. To Make Database Changes (Structure)

**Option A: Direct SQL (Recommended for small changes)**
```javascript
// In a migration script or API route
await pool.query(`
  ALTER TABLE hotels ADD COLUMN rating DECIMAL(2,1);
`)
```

**Option B: Create SQL File (Recommended for big changes)**
1. Create `scripts/add-feature.sql` with your SQL commands
2. Create `scripts/run-migration.js`:
```javascript
const { Client } = require('pg')
const { readFileSync } = require('fs')
require('dotenv').config({ path: '.env.local' })

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function migrate() {
  await client.connect()
  const sql = readFileSync('./scripts/add-feature.sql', 'utf-8')
  await client.query(sql)
  await client.end()
}

migrate()
```
3. Run: `node scripts/run-migration.js`

### 3. To View Database (Neon Dashboard)

1. Go to https://console.neon.tech
2. Login to your account
3. Select your project
4. Click "SQL Editor"
5. Run queries to view data:
```sql
SELECT * FROM hotels;
SELECT * FROM facilities WHERE hotel_id = 'sindbad-hammamet';
```

---

## Important Files

### ✅ Files You Need:
- `lib/db.ts` - Database connection helper (USE THIS in your app!)
- `scripts/redesign-database.sql` - Backup of database structure
- `.env.local` - Contains DATABASE_URL (keep secret!)
- `DATABASE_GUIDE.md` - This file

### ❌ Files Deleted (were only for one-time migration):
- All migration scripts in `scripts/` folder
- All Prisma files (we're using `pg` library instead)

---

## Common Operations

### Add a New Hotel
```javascript
await pool.query(`
  INSERT INTO hotels (hotel_id, name, location, description)
  VALUES ($1, $2, $3, $4)
`, ['new-hotel-id', 'Hotel Name', 'Location', 'Description'])
```

### Update Facility Hours
```javascript
await pool.query(`
  UPDATE facilities 
  SET open_time = $1, close_time = $2 
  WHERE hotel_id = $3 AND facility_type = $4
`, ['08:00', '22:00', 'sindbad-hammamet', 'pool'])
```

### Add Special Event
```javascript
await pool.query(`
  INSERT INTO special_events (hotel_id, title, description, event_date, event_time, location, price)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
`, ['sindbad-hammamet', 'Event Title', 'Description', '2026-03-15', '19:00', 'Main Hall', 'Free'])
```

### Delete Special Event
```javascript
await pool.query('DELETE FROM special_events WHERE id = $1', [eventId])
```

---

## Database Connection Info

- **Provider**: Neon (Cloud PostgreSQL)
- **Connection**: Stored in `.env.local` as `DATABASE_URL`
- **Library**: `pg` (node-postgres)
- **Free Tier**: 0.5GB storage, 100 hours compute/month
- **Cost**: FREE for your use case

---

## Backup & Safety

### Automatic Backups
Neon automatically backs up your database. You can restore from Neon dashboard.

### Manual Backup (Export Data)
```bash
# Export all data to JSON
node scripts/export-backup.js
```

### Restore from JSON
If you need to restore, you can re-run the migration with your JSON backup.

---

## Need Help?

- **Neon Docs**: https://neon.tech/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **pg Library Docs**: https://node-postgres.com/

---

## Summary

**What you have now:**
- ✅ Clean, normalized PostgreSQL database on Neon
- ✅ Simple `pg` library for database queries
- ✅ No complex ORM (Prisma) - just direct SQL
- ✅ Free hosting with automatic backups
- ✅ Easy to understand and maintain

**How to use it:**
1. Import `pool` from `lib/db.ts`
2. Write SQL queries
3. That's it!

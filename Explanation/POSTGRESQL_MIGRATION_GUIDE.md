# PostgreSQL Migration Guide

## 📋 Overview

We'll migrate from JSON file storage to PostgreSQL database in these steps:

1. ✅ Choose and set up PostgreSQL provider
2. ✅ Install required packages
3. ✅ Design database schema
4. ✅ Create database client
5. ✅ Create migration scripts
6. ✅ Update API routes
7. ✅ Test and verify
8. ✅ Deploy

---

## Step 1: Choose PostgreSQL Provider

### Options:

**A) Neon (Recommended - Free & Easy)**
- ✅ Free tier: 0.5 GB storage
- ✅ Serverless PostgreSQL
- ✅ No credit card required
- ✅ Auto-scaling
- ✅ Built-in connection pooling
- 🌐 https://neon.tech

**B) Supabase (Good Alternative)**
- ✅ Free tier: 500 MB storage
- ✅ PostgreSQL + Auth + Storage
- ✅ Real-time subscriptions
- ✅ Auto-generated APIs
- 🌐 https://supabase.com

**C) Railway (Simple)**
- ✅ Free tier: $5 credit/month
- ✅ Easy deployment
- ✅ PostgreSQL + Redis
- 🌐 https://railway.app

**D) Local PostgreSQL (Development)**
- ✅ Full control
- ❌ Requires installation
- ❌ Not for production

### Recommendation: **Neon** (Best for your use case)

---

## Step 2: Database Schema Design

### Tables We Need:

```sql
-- Hotels table (static data)
CREATE TABLE hotels (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  color VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Hotel Settings table (dynamic data)
CREATE TABLE hotel_settings (
  id SERIAL PRIMARY KEY,
  hotel_id VARCHAR(50) REFERENCES hotels(id) ON DELETE CASCADE,
  
  -- Restaurant
  breakfast_start TIME,
  breakfast_end TIME,
  breakfast_available BOOLEAN DEFAULT true,
  lunch_start TIME,
  lunch_end TIME,
  lunch_available BOOLEAN DEFAULT true,
  dinner_start TIME,
  dinner_end TIME,
  dinner_available BOOLEAN DEFAULT true,
  
  -- Facilities
  pool_open TIME,
  pool_close TIME,
  pool_available BOOLEAN DEFAULT true,
  gym_open TIME,
  gym_close TIME,
  gym_available BOOLEAN DEFAULT true,
  spa_open TIME,
  spa_close TIME,
  spa_available BOOLEAN DEFAULT true,
  spa_treatments TEXT[], -- Array of treatments
  kids_club_open TIME,
  kids_club_close TIME,
  kids_club_available BOOLEAN DEFAULT true,
  kids_club_age_range VARCHAR(20),
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  emergency_phone VARCHAR(20),
  
  -- Amenities
  wifi_available BOOLEAN DEFAULT true,
  wifi_password VARCHAR(50),
  wifi_instructions TEXT,
  parking_available BOOLEAN DEFAULT true,
  parking_price VARCHAR(50),
  parking_instructions TEXT,
  
  -- Check-in/out
  checkin_time TIME,
  checkin_instructions TEXT,
  checkout_time TIME,
  checkout_instructions TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(hotel_id)
);

-- Special Events table
CREATE TABLE special_events (
  id SERIAL PRIMARY KEY,
  hotel_id VARCHAR(50) REFERENCES hotels(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  location VARCHAR(100),
  price VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activities table
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  hotel_id VARCHAR(50) REFERENCES hotels(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- family, couples, adventure, cultural
  activity_name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_hotel_settings_hotel_id ON hotel_settings(hotel_id);
CREATE INDEX idx_special_events_hotel_id ON special_events(hotel_id);
CREATE INDEX idx_special_events_date ON special_events(event_date);
CREATE INDEX idx_activities_hotel_id ON activities(hotel_id);
CREATE INDEX idx_activities_category ON activities(category);
```

---

## Step 3: Installation Steps

### Install PostgreSQL Client (Prisma - Recommended)

```bash
npm install @prisma/client
npm install -D prisma
```

### Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Database schema
- `.env` - Environment variables (already have `.env.local`)

---

## Step 4: Migration Process

### Phase 1: Setup (30 minutes)
1. Create Neon account
2. Create database
3. Get connection string
4. Add to `.env.local`
5. Install Prisma
6. Define schema

### Phase 2: Migration (1 hour)
1. Create migration script
2. Migrate existing JSON data
3. Verify data integrity
4. Test queries

### Phase 3: Update Code (1-2 hours)
1. Create database client
2. Update API routes
3. Update admin dashboard
4. Test all functionality

### Phase 4: Testing (30 minutes)
1. Test CRUD operations
2. Test chatbot
3. Test admin dashboard
4. Performance testing

---

## Step 5: Rollback Plan

If something goes wrong:

1. **Keep JSON files** - Don't delete until migration is complete
2. **Feature flag** - Add environment variable to switch between JSON/DB
3. **Backup** - Export database before major changes
4. **Gradual migration** - Migrate one table at a time

---

## Next Steps

Ready to start? Here's what we'll do:

1. **First**: Set up Neon account (5 minutes)
2. **Then**: Install Prisma and define schema (15 minutes)
3. **Next**: Create migration script (30 minutes)
4. **Finally**: Update API routes (1 hour)

**Total time: ~2-3 hours**

---

## Questions Before We Start

1. Do you want to use **Neon** (recommended) or another provider?
2. Do you want to keep JSON files as backup during migration?
3. Should we add user authentication tables now or later?

Let me know and we'll proceed! 🚀

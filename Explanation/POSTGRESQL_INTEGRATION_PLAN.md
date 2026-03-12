# PostgreSQL Integration Plan

## 🎯 Goal
Replace JSON file storage with PostgreSQL database for better scalability and data management.

---

## 📋 Prerequisites

### 1. Install PostgreSQL
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **Or use**: Docker for PostgreSQL
- **Or use**: Cloud service (Supabase, Neon, Railway)

### 2. Install Required npm Packages
```bash
npm install pg
npm install @types/pg --save-dev
```

**Alternative (Recommended)**: Use Prisma ORM
```bash
npm install prisma @prisma/client
npm install --save-dev prisma
```

---

## 🗄️ Database Schema Design

### Tables Needed:

#### 1. **hotels** table
```sql
CREATE TABLE hotels (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. **facilities** table
```sql
CREATE TABLE facilities (
  id SERIAL PRIMARY KEY,
  hotel_id VARCHAR(50) REFERENCES hotels(id) ON DELETE CASCADE,
  facility_type VARCHAR(50) NOT NULL, -- 'pool', 'gym', 'spa', 'kids_club'
  available BOOLEAN DEFAULT true,
  open_time TIME,
  close_time TIME,
  additional_info JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. **restaurant_schedule** table
```sql
CREATE TABLE restaurant_schedule (
  id SERIAL PRIMARY KEY,
  hotel_id VARCHAR(50) REFERENCES hotels(id) ON DELETE CASCADE,
  meal_type VARCHAR(20) NOT NULL, -- 'breakfast', 'lunch', 'dinner'
  available BOOLEAN DEFAULT true,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. **special_events** table
```sql
CREATE TABLE special_events (
  id SERIAL PRIMARY KEY,
  hotel_id VARCHAR(50) REFERENCES hotels(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  location VARCHAR(200),
  price VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. **amenities** table
```sql
CREATE TABLE amenities (
  id SERIAL PRIMARY KEY,
  hotel_id VARCHAR(50) REFERENCES hotels(id) ON DELETE CASCADE,
  amenity_type VARCHAR(50) NOT NULL, -- 'wifi', 'parking', 'check_in', 'check_out'
  available BOOLEAN DEFAULT true,
  details JSONB, -- Flexible JSON for different amenity types
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. **contact_info** table
```sql
CREATE TABLE contact_info (
  id SERIAL PRIMARY KEY,
  hotel_id VARCHAR(50) REFERENCES hotels(id) ON DELETE CASCADE,
  phone VARCHAR(50),
  email VARCHAR(100),
  address TEXT,
  emergency_phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Implementation Steps

### Step 1: Choose Database Approach

#### Option A: Direct PostgreSQL with `pg` library
**Pros**: Full control, lightweight
**Cons**: More manual work, write SQL queries

#### Option B: Prisma ORM (Recommended)
**Pros**: Type-safe, auto-generated types, migrations, easy queries
**Cons**: Slightly more setup

**Recommendation**: Use Prisma for better developer experience

---

### Step 2: Setup Prisma (Recommended Approach)

#### 2.1 Initialize Prisma
```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Database schema
- `.env` - Environment variables

#### 2.2 Configure Database Connection
Edit `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/hotel_db?schema=public"
```

#### 2.3 Define Prisma Schema
Edit `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Hotel {
  id          String   @id
  name        String
  location    String?
  description String?
  imageUrl    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  facilities         Facility[]
  restaurantSchedule RestaurantSchedule[]
  specialEvents      SpecialEvent[]
  amenities          Amenity[]
  contactInfo        ContactInfo?

  @@map("hotels")
}

model Facility {
  id             Int      @id @default(autoincrement())
  hotelId        String
  facilityType   String
  available      Boolean  @default(true)
  openTime       String?
  closeTime      String?
  additionalInfo Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  hotel Hotel @relation(fields: [hotelId], references: [id], onDelete: Cascade)

  @@map("facilities")
}

model RestaurantSchedule {
  id        Int      @id @default(autoincrement())
  hotelId   String
  mealType  String
  available Boolean  @default(true)
  startTime String
  endTime   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  hotel Hotel @relation(fields: [hotelId], references: [id], onDelete: Cascade)

  @@map("restaurant_schedule")
}

model SpecialEvent {
  id          Int      @id @default(autoincrement())
  hotelId     String
  title       String
  description String?
  eventDate   DateTime
  eventTime   String
  location    String?
  price       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  hotel Hotel @relation(fields: [hotelId], references: [id], onDelete: Cascade)

  @@map("special_events")
}

model Amenity {
  id          Int      @id @default(autoincrement())
  hotelId     String
  amenityType String
  available   Boolean  @default(true)
  details     Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  hotel Hotel @relation(fields: [hotelId], references: [id], onDelete: Cascade)

  @@map("amenities")
}

model ContactInfo {
  id             Int      @id @default(autoincrement())
  hotelId        String   @unique
  phone          String?
  email          String?
  address        String?
  emergencyPhone String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  hotel Hotel @relation(fields: [hotelId], references: [id], onDelete: Cascade)

  @@map("contact_info")
}
```

#### 2.4 Create Database and Run Migrations
```bash
# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

---

### Step 3: Create Database Utility

Create `lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

### Step 4: Migrate Existing Data

Create `scripts/migrate-json-to-db.ts`:
```typescript
import { prisma } from '../lib/db'
import hotelSettingsJson from '../data/hotel-settings.json'

async function migrateData() {
  console.log('Starting data migration...')

  for (const [hotelId, settings] of Object.entries(hotelSettingsJson)) {
    // Create hotel
    await prisma.hotel.create({
      data: {
        id: hotelId,
        name: settings.name,
        // Add other hotel fields
      }
    })

    // Create facilities
    await prisma.facility.createMany({
      data: [
        {
          hotelId,
          facilityType: 'pool',
          available: settings.pool.available,
          openTime: settings.pool.openTime,
          closeTime: settings.pool.closeTime,
        },
        // Add other facilities
      ]
    })

    // Create restaurant schedule
    // Create special events
    // Create amenities
    // Create contact info
  }

  console.log('Migration completed!')
}

migrateData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

---

### Step 5: Update API Route

Update `app/api/hotel-settings/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const hotels = await prisma.hotel.findMany({
      include: {
        facilities: true,
        restaurantSchedule: true,
        specialEvents: true,
        amenities: true,
        contactInfo: true,
      }
    })

    // Transform to match existing format
    const formattedData = hotels.reduce((acc, hotel) => {
      acc[hotel.id] = {
        name: hotel.name,
        pool: hotel.facilities.find(f => f.facilityType === 'pool'),
        // Transform other data
      }
      return acc
    }, {})

    return NextResponse.json(formattedData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch hotel settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Update database with new data
    for (const [hotelId, settings] of Object.entries(data)) {
      await prisma.hotel.update({
        where: { id: hotelId },
        data: {
          // Update fields
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update hotel settings' },
      { status: 500 }
    )
  }
}
```

---

## 🚀 Quick Start Commands

```bash
# 1. Install Prisma
npm install prisma @prisma/client
npm install --save-dev prisma

# 2. Initialize Prisma
npx prisma init

# 3. Configure .env with your database URL

# 4. Create schema in prisma/schema.prisma

# 5. Create and run migration
npx prisma migrate dev --name init

# 6. Generate Prisma Client
npx prisma generate

# 7. Migrate existing JSON data
npm run migrate-data

# 8. Start development server
npm run dev
```

---

## 🎯 Benefits After Integration

1. **Data Integrity**: Foreign keys, constraints
2. **Scalability**: Handle thousands of hotels
3. **Performance**: Indexed queries, efficient lookups
4. **Concurrent Access**: Multiple admins can edit simultaneously
5. **Data Relationships**: Easy to query related data
6. **Type Safety**: Auto-generated TypeScript types
7. **Migrations**: Version control for database schema
8. **Backup**: Easy database backups and restore

---

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` file
2. **Connection Pooling**: Use connection pooling for production
3. **SQL Injection**: Prisma prevents SQL injection automatically
4. **Authentication**: Add admin authentication before production
5. **Rate Limiting**: Add rate limiting to API routes

---

## 📚 Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Next.js + Prisma**: https://www.prisma.io/nextjs
- **Supabase** (Free PostgreSQL): https://supabase.com
- **Neon** (Serverless PostgreSQL): https://neon.tech

---

## ⚠️ Important Notes

1. **Backup JSON**: Keep `hotel-settings.json` as backup during migration
2. **Test Thoroughly**: Test all CRUD operations after migration
3. **Environment**: Use different databases for dev/production
4. **Migrations**: Always create migrations for schema changes
5. **Rollback Plan**: Have a plan to rollback if issues occur

---

**Ready to start?** Let me know and I'll help you implement this step by step!

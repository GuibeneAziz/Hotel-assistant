# Facility Attributes Table - Explained

## What is it?

The `facility_attributes` table stores **additional details** about hotel facilities. It's a flexible way to add extra information to facilities without making the main `facilities` table too wide.

## Database Structure

```
facilities table (main info):
├── id
├── hotel_id
├── facility_type (pool, spa, gym, kids_club, etc.)
├── open_time
├── close_time
└── is_available

facility_attributes table (extra details):
├── id
├── facility_id (links to facilities.id)
├── attribute_key (what kind of detail)
└── attribute_value (the actual detail)
```

## Real Examples from Your Database

### Example 1: Spa Treatments
```
Facility: Spa (facility_id = 4)
├── attribute_key: "treatment", attribute_value: "Traditional Hammam"
├── attribute_key: "treatment", attribute_value: "Aromatherapy Massage"
├── attribute_key: "treatment", attribute_value: "Facial Treatment"
└── attribute_key: "treatment", attribute_value: "Body Scrub"
```

**What this means**: The spa offers 4 different treatments.

### Example 2: Kids Club Age Range
```
Facility: Kids Club (facility_id = 7)
└── attribute_key: "age_range", attribute_value: "4-12"
```

**What this means**: The kids club accepts children aged 4-12 years old.

## Why Use This Design?

### ❌ Bad Design (Wide Table):
```sql
CREATE TABLE facilities (
    id INT,
    facility_type VARCHAR,
    open_time TIME,
    close_time TIME,
    treatment_1 VARCHAR,  -- Only for spa
    treatment_2 VARCHAR,  -- Only for spa
    treatment_3 VARCHAR,  -- Only for spa
    treatment_4 VARCHAR,  -- Only for spa
    age_range VARCHAR,    -- Only for kids club
    pool_depth VARCHAR,   -- Only for pool
    ...                   -- Gets messy!
);
```

**Problems**:
- Lots of NULL values (pool doesn't need treatments!)
- Hard to add new attributes
- Wastes space

### ✅ Good Design (Separate Attributes Table):
```sql
CREATE TABLE facilities (
    id INT,
    facility_type VARCHAR,
    open_time TIME,
    close_time TIME
);

CREATE TABLE facility_attributes (
    id INT,
    facility_id INT,
    attribute_key VARCHAR,
    attribute_value VARCHAR
);
```

**Benefits**:
- Flexible: Add any attribute to any facility
- Clean: No NULL values
- Scalable: Easy to add new types of attributes

## How It's Used in Your App

### Current Usage

The `facility_attributes` table is currently used to store:

1. **Spa Treatments**: List of available spa treatments
2. **Kids Club Age Range**: Age restrictions for kids club

### In the Chatbot

When a user asks about the spa, the chatbot should show:
- Spa hours (from `facilities` table)
- Available treatments (from `facility_attributes` table)

**Example**:
```
User: "What spa treatments do you offer?"

Chatbot should answer:
"Our spa is open from 09:00 to 20:00 and offers:
- Traditional Hammam
- Aromatherapy Massage
- Facial Treatment
- Body Scrub

Would you like to book a treatment? Please contact the front desk at [phone]."
```

## Current Status

### ✅ What's Working:
- Data is stored correctly in the database
- Spa treatments are saved
- Kids club age range is saved

### ❌ What's NOT Working:
- The chatbot is NOT currently reading from `facility_attributes`
- It only shows basic facility hours
- Spa treatments are not being displayed

## How to Fix It

I need to update the hotel-settings API to include facility attributes. Let me do that now!

### Step 1: Update Database Query

The `getAllHotelSettings()` function in `lib/db.ts` needs to join with `facility_attributes`:

```typescript
// Get spa treatments
const spaResult = await pool.query(`
  SELECT attribute_value as treatment
  FROM facility_attributes fa
  JOIN facilities f ON fa.facility_id = f.id
  WHERE f.hotel_id = $1 
    AND f.facility_type = 'spa'
    AND fa.attribute_key = 'treatment'
`, [hotelId])

settings[hotelId].spa.treatments = spaResult.rows.map(r => r.treatment)
```

### Step 2: Update RAG Knowledge

The `buildHotelKnowledge()` function already shows spa treatments if they exist in `hotelSettings.spa.treatments`.

## Summary

**What it does**: Stores flexible, extra details about facilities (like spa treatments, age ranges, etc.)

**Why it exists**: Keeps the database clean and flexible instead of having a wide table with lots of NULL values

**Current issue**: The chatbot is not reading from this table yet, so spa treatments don't show up

**Solution**: I'll update the database query to include these attributes!

Would you like me to fix this now so the chatbot shows spa treatments and other facility details?

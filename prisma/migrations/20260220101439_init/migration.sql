-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "color" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_settings" (
    "id" SERIAL NOT NULL,
    "hotelId" TEXT NOT NULL,
    "breakfastStart" TEXT,
    "breakfastEnd" TEXT,
    "breakfastAvailable" BOOLEAN NOT NULL DEFAULT true,
    "lunchStart" TEXT,
    "lunchEnd" TEXT,
    "lunchAvailable" BOOLEAN NOT NULL DEFAULT true,
    "dinnerStart" TEXT,
    "dinnerEnd" TEXT,
    "dinnerAvailable" BOOLEAN NOT NULL DEFAULT true,
    "spaAvailable" BOOLEAN NOT NULL DEFAULT true,
    "spaOpenTime" TEXT,
    "spaCloseTime" TEXT,
    "spaTreatments" TEXT[],
    "poolAvailable" BOOLEAN NOT NULL DEFAULT true,
    "poolOpenTime" TEXT,
    "poolCloseTime" TEXT,
    "gymAvailable" BOOLEAN NOT NULL DEFAULT true,
    "gymOpenTime" TEXT,
    "gymCloseTime" TEXT,
    "kidsClubAvailable" BOOLEAN NOT NULL DEFAULT true,
    "kidsClubOpenTime" TEXT,
    "kidsClubCloseTime" TEXT,
    "kidsClubAgeRange" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "emergencyPhone" TEXT,
    "wifiAvailable" BOOLEAN NOT NULL DEFAULT true,
    "wifiPassword" TEXT,
    "wifiInstructions" TEXT,
    "parkingAvailable" BOOLEAN NOT NULL DEFAULT true,
    "parkingPrice" TEXT,
    "parkingInstructions" TEXT,
    "checkinTime" TEXT,
    "checkinInstructions" TEXT,
    "checkoutTime" TEXT,
    "checkoutInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_events" (
    "id" SERIAL NOT NULL,
    "hotelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TEXT NOT NULL,
    "eventTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "price" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "special_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "hotelId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "activityName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hotels_hotelId_key" ON "hotels"("hotelId");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_settings_hotelId_key" ON "hotel_settings"("hotelId");

-- CreateIndex
CREATE INDEX "special_events_hotelId_idx" ON "special_events"("hotelId");

-- CreateIndex
CREATE INDEX "special_events_eventDate_idx" ON "special_events"("eventDate");

-- CreateIndex
CREATE INDEX "activities_hotelId_idx" ON "activities"("hotelId");

-- CreateIndex
CREATE INDEX "activities_category_idx" ON "activities"("category");

-- AddForeignKey
ALTER TABLE "hotel_settings" ADD CONSTRAINT "hotel_settings_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("hotelId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_events" ADD CONSTRAINT "special_events_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("hotelId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("hotelId") ON DELETE CASCADE ON UPDATE CASCADE;

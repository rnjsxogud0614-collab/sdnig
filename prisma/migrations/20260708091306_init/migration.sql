-- CreateTable
CREATE TABLE "vendors" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "businessHoursStart" TEXT,
    "businessHoursEnd" TEXT,
    "region" TEXT,
    "address" TEXT,
    "products" JSONB,
    "description" TEXT,
    "styleMoods" TEXT[],
    "options" JSONB,
    "sdingBenefit" TEXT,
    "categoryData" JSONB,
    "photos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

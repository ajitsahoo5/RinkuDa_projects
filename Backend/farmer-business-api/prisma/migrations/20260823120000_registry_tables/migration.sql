-- CreateEnum
CREATE TYPE "RegistryUserRole" AS ENUM ('admin', 'client');

-- CreateTable
CREATE TABLE "registry_users" (
    "firebase_uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "role" "RegistryUserRole" NOT NULL DEFAULT 'client',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "registry_users_pkey" PRIMARY KEY ("firebase_uid")
);

-- CreateTable
CREATE TABLE "farmers" (
    "external_id" TEXT NOT NULL,
    "sl_no" INTEGER NOT NULL,
    "date_of_purchase" TEXT NOT NULL,
    "land_owner_name" TEXT NOT NULL DEFAULT '',
    "village_or_mouza" TEXT NOT NULL DEFAULT '',
    "khata_no" TEXT NOT NULL DEFAULT '',
    "area" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "farmer_name" TEXT NOT NULL DEFAULT '',
    "aadhar_no" TEXT NOT NULL DEFAULT '',
    "mobile_no" TEXT NOT NULL DEFAULT '',
    "crops_name" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "payment_remark" TEXT NOT NULL DEFAULT '',
    "fertilizers" JSONB NOT NULL DEFAULT '[]',
    "pesticides" JSONB NOT NULL DEFAULT '[]',
    "seeds" JSONB NOT NULL DEFAULT '[]',
    "csc_products" JSONB NOT NULL DEFAULT '[]',
    "remarks" TEXT NOT NULL DEFAULT '',
    "sent_to_bank" BOOLEAN NOT NULL DEFAULT false,
    "sent_to_bank_at" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "farmers_pkey" PRIMARY KEY ("external_id")
);

-- CreateTable
CREATE TABLE "settings_catalog" (
    "id" TEXT NOT NULL DEFAULT 'catalog',
    "fertilizers" JSONB NOT NULL DEFAULT '[]',
    "pesticides" JSONB NOT NULL DEFAULT '[]',
    "seeds" JSONB NOT NULL DEFAULT '[]',
    "csc_products" JSONB NOT NULL DEFAULT '[]',
    "crops" JSONB NOT NULL DEFAULT '[]',
    "village_mouzas" JSONB NOT NULL DEFAULT '[]',
    "remark_presets" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "settings_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_app" (
    "id" TEXT NOT NULL DEFAULT 'app',
    "google_sheet_link" TEXT,
    "address" TEXT,
    "gst_number" TEXT,
    "mobile_number" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "settings_app_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registry_users_email_idx" ON "registry_users"("email");

-- CreateIndex
CREATE INDEX "farmers_sl_no_idx" ON "farmers"("sl_no");

-- CreateIndex
CREATE INDEX "farmers_village_or_mouza_idx" ON "farmers"("village_or_mouza");

-- Recover from failed normalize migration and re-apply cleanly.
-- Run only when migration 20260823140000_normalize_catalog_relations failed partway.

DROP TABLE IF EXISTS "farmer_csc_product_lines" CASCADE;
DROP TABLE IF EXISTS "farmer_seed_lines" CASCADE;
DROP TABLE IF EXISTS "farmer_pesticide_lines" CASCADE;
DROP TABLE IF EXISTS "farmer_fertilizer_lines" CASCADE;
DROP TABLE IF EXISTS "catalog_fertilizers" CASCADE;
DROP TABLE IF EXISTS "catalog_pesticides" CASCADE;
DROP TABLE IF EXISTS "catalog_seeds" CASCADE;
DROP TABLE IF EXISTS "catalog_csc_products" CASCADE;
DROP TABLE IF EXISTS "catalog_crops" CASCADE;
DROP TABLE IF EXISTS "catalog_village_mouzas" CASCADE;
DROP TABLE IF EXISTS "catalog_remark_presets" CASCADE;

ALTER TABLE IF EXISTS "farmers" DROP COLUMN IF EXISTS "crop_id";
ALTER TABLE IF EXISTS "farmers" DROP COLUMN IF EXISTS "village_mouza_id";

-- Restore JSON columns if they were dropped (safe no-op when still present)
ALTER TABLE IF EXISTS "farmers" ADD COLUMN IF NOT EXISTS "fertilizers" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE IF EXISTS "farmers" ADD COLUMN IF NOT EXISTS "pesticides" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE IF EXISTS "farmers" ADD COLUMN IF NOT EXISTS "seeds" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE IF EXISTS "farmers" ADD COLUMN IF NOT EXISTS "csc_products" JSONB NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS "settings_catalog" (
    "id" TEXT NOT NULL DEFAULT 'catalog',
    "fertilizers" JSONB NOT NULL DEFAULT '[]',
    "pesticides" JSONB NOT NULL DEFAULT '[]',
    "seeds" JSONB NOT NULL DEFAULT '[]',
    "csc_products" JSONB NOT NULL DEFAULT '[]',
    "crops" JSONB NOT NULL DEFAULT '[]',
    "village_mouzas" JSONB NOT NULL DEFAULT '[]',
    "remark_presets" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "settings_catalog_pkey" PRIMARY KEY ("id")
);

INSERT INTO "settings_catalog" ("id", "updated_at")
VALUES ('catalog', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

DELETE FROM "_prisma_migrations"
WHERE "migration_name" = '20260823140000_normalize_catalog_relations';

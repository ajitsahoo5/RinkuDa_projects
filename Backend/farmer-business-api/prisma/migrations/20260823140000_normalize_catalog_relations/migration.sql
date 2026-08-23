-- Normalize catalog JSON blobs into relational tables and farmer purchase line tables.
-- Migrates existing data from settings_catalog and farmers JSON columns without loss.

-- Catalog product tables
CREATE TABLE "catalog_fertilizers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalog_fertilizers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_pesticides" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalog_pesticides_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_seeds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalog_seeds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_csc_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalog_csc_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_crops" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalog_crops_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_village_mouzas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalog_village_mouzas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_remark_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalog_remark_presets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "catalog_crops_name_key" ON "catalog_crops"("name");
CREATE UNIQUE INDEX "catalog_village_mouzas_name_key" ON "catalog_village_mouzas"("name");
CREATE INDEX "catalog_fertilizers_name_idx" ON "catalog_fertilizers"("name");
CREATE INDEX "catalog_pesticides_name_idx" ON "catalog_pesticides"("name");
CREATE INDEX "catalog_seeds_name_idx" ON "catalog_seeds"("name");
CREATE INDEX "catalog_csc_products_name_idx" ON "catalog_csc_products"("name");
CREATE INDEX "catalog_remark_presets_name_idx" ON "catalog_remark_presets"("name");

-- Farmer purchase line tables
CREATE TABLE "farmer_fertilizer_lines" (
    "id" UUID NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL DEFAULT '',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farmer_fertilizer_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "farmer_pesticide_lines" (
    "id" UUID NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL DEFAULT '',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farmer_pesticide_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "farmer_seed_lines" (
    "id" UUID NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL DEFAULT '',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farmer_seed_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "farmer_csc_product_lines" (
    "id" UUID NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL DEFAULT '',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farmer_csc_product_lines_pkey" PRIMARY KEY ("id")
);

-- Farmer lookup FK columns
ALTER TABLE "farmers" ADD COLUMN "crop_id" TEXT;
ALTER TABLE "farmers" ADD COLUMN "village_mouza_id" TEXT;

-- ---------------------------------------------------------------------------
-- Data migration: settings_catalog JSON -> catalog tables
-- ---------------------------------------------------------------------------

INSERT INTO "catalog_fertilizers" ("id", "name", "unit", "price", "stock", "created_at", "updated_at")
SELECT DISTINCT ON (elem->>'id')
    elem->>'id',
    elem->>'name',
    COALESCE(NULLIF(TRIM(elem->>'unit'), ''), 'kg'),
    COALESCE((elem->>'price')::double precision, 0),
    COALESCE((elem->>'stock')::double precision, 0),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "settings_catalog" sc,
     jsonb_array_elements(sc."fertilizers") AS elem
WHERE sc."id" = 'catalog'
  AND COALESCE(elem->>'id', '') <> ''
ORDER BY elem->>'id'
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "unit" = EXCLUDED."unit",
    "price" = EXCLUDED."price",
    "stock" = EXCLUDED."stock",
    "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "catalog_pesticides" ("id", "name", "unit", "price", "stock", "created_at", "updated_at")
SELECT DISTINCT ON (elem->>'id')
    elem->>'id',
    elem->>'name',
    COALESCE(NULLIF(TRIM(elem->>'unit'), ''), 'kg'),
    COALESCE((elem->>'price')::double precision, 0),
    COALESCE((elem->>'stock')::double precision, 0),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "settings_catalog" sc,
     jsonb_array_elements(sc."pesticides") AS elem
WHERE sc."id" = 'catalog'
  AND COALESCE(elem->>'id', '') <> ''
ORDER BY elem->>'id'
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "unit" = EXCLUDED."unit",
    "price" = EXCLUDED."price",
    "stock" = EXCLUDED."stock",
    "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "catalog_seeds" ("id", "name", "unit", "price", "stock", "created_at", "updated_at")
SELECT DISTINCT ON (elem->>'id')
    elem->>'id',
    elem->>'name',
    COALESCE(NULLIF(TRIM(elem->>'unit'), ''), 'kg'),
    COALESCE((elem->>'price')::double precision, 0),
    COALESCE((elem->>'stock')::double precision, 0),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "settings_catalog" sc,
     jsonb_array_elements(sc."seeds") AS elem
WHERE sc."id" = 'catalog'
  AND COALESCE(elem->>'id', '') <> ''
ORDER BY elem->>'id'
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "unit" = EXCLUDED."unit",
    "price" = EXCLUDED."price",
    "stock" = EXCLUDED."stock",
    "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "catalog_csc_products" ("id", "name", "unit", "price", "stock", "created_at", "updated_at")
SELECT DISTINCT ON (elem->>'id')
    elem->>'id',
    elem->>'name',
    COALESCE(NULLIF(TRIM(elem->>'unit'), ''), 'kg'),
    COALESCE((elem->>'price')::double precision, 0),
    COALESCE((elem->>'stock')::double precision, 0),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "settings_catalog" sc,
     jsonb_array_elements(sc."csc_products") AS elem
WHERE sc."id" = 'catalog'
  AND COALESCE(elem->>'id', '') <> ''
ORDER BY elem->>'id'
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "unit" = EXCLUDED."unit",
    "price" = EXCLUDED."price",
    "stock" = EXCLUDED."stock",
    "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "catalog_crops" ("id", "name", "created_at", "updated_at")
SELECT DISTINCT ON (elem->>'id')
    elem->>'id',
    elem->>'name',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "settings_catalog" sc,
     jsonb_array_elements(sc."crops") AS elem
WHERE sc."id" = 'catalog'
  AND COALESCE(elem->>'id', '') <> ''
  AND COALESCE(elem->>'name', '') <> ''
ORDER BY elem->>'id'
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "catalog_village_mouzas" ("id", "name", "created_at", "updated_at")
SELECT DISTINCT ON (elem->>'id')
    elem->>'id',
    elem->>'name',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "settings_catalog" sc,
     jsonb_array_elements(sc."village_mouzas") AS elem
WHERE sc."id" = 'catalog'
  AND COALESCE(elem->>'id', '') <> ''
  AND COALESCE(elem->>'name', '') <> ''
ORDER BY elem->>'id'
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "catalog_remark_presets" ("id", "name", "created_at", "updated_at")
SELECT DISTINCT ON (elem->>'id')
    elem->>'id',
    elem->>'name',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "settings_catalog" sc,
     jsonb_array_elements(sc."remark_presets") AS elem
WHERE sc."id" = 'catalog'
  AND COALESCE(elem->>'id', '') <> ''
  AND COALESCE(elem->>'name', '') <> ''
ORDER BY elem->>'id'
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "updated_at" = CURRENT_TIMESTAMP;

-- Orphan catalog rows referenced only on farmer JSON purchase lines
INSERT INTO "catalog_fertilizers" ("id", "name", "unit", "price", "stock", "created_at", "updated_at")
SELECT DISTINCT ON (line->>'id')
    line->>'id',
    COALESCE(NULLIF(TRIM(line->>'name'), ''), line->>'id'),
    COALESCE(NULLIF(TRIM(line->>'unit'), ''), 'kg'),
    COALESCE((line->>'price')::double precision, 0),
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "farmers" f,
     jsonb_array_elements(f."fertilizers") AS line
WHERE COALESCE(line->>'id', '') <> ''
  AND NOT EXISTS (SELECT 1 FROM "catalog_fertilizers" cf WHERE cf."id" = line->>'id')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "catalog_pesticides" ("id", "name", "unit", "price", "stock", "created_at", "updated_at")
SELECT DISTINCT ON (line->>'id')
    line->>'id',
    COALESCE(NULLIF(TRIM(line->>'name'), ''), line->>'id'),
    COALESCE(NULLIF(TRIM(line->>'unit'), ''), 'kg'),
    COALESCE((line->>'price')::double precision, 0),
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "farmers" f,
     jsonb_array_elements(f."pesticides") AS line
WHERE COALESCE(line->>'id', '') <> ''
  AND NOT EXISTS (SELECT 1 FROM "catalog_pesticides" cp WHERE cp."id" = line->>'id')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "catalog_seeds" ("id", "name", "unit", "price", "stock", "created_at", "updated_at")
SELECT DISTINCT ON (line->>'id')
    line->>'id',
    COALESCE(NULLIF(TRIM(line->>'name'), ''), line->>'id'),
    COALESCE(NULLIF(TRIM(line->>'unit'), ''), 'kg'),
    COALESCE((line->>'price')::double precision, 0),
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "farmers" f,
     jsonb_array_elements(f."seeds") AS line
WHERE COALESCE(line->>'id', '') <> ''
  AND NOT EXISTS (SELECT 1 FROM "catalog_seeds" cs WHERE cs."id" = line->>'id')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "catalog_csc_products" ("id", "name", "unit", "price", "stock", "created_at", "updated_at")
SELECT DISTINCT ON (line->>'id')
    line->>'id',
    COALESCE(NULLIF(TRIM(line->>'name'), ''), line->>'id'),
    COALESCE(NULLIF(TRIM(line->>'unit'), ''), 'kg'),
    COALESCE((line->>'price')::double precision, 0),
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "farmers" f,
     jsonb_array_elements(f."csc_products") AS line
WHERE COALESCE(line->>'id', '') <> ''
  AND NOT EXISTS (SELECT 1 FROM "catalog_csc_products" cc WHERE cc."id" = line->>'id')
ON CONFLICT ("id") DO NOTHING;

-- ---------------------------------------------------------------------------
-- Data migration: farmer JSON purchase arrays -> line tables
-- ---------------------------------------------------------------------------

INSERT INTO "farmer_fertilizer_lines" ("id", "farmer_id", "product_id", "product_name", "amount", "price", "unit", "created_at")
SELECT
    gen_random_uuid(),
    f."external_id",
    line->>'id',
    COALESCE(line->>'name', ''),
    COALESCE((line->>'amount')::double precision, 0),
    COALESCE((line->>'price')::double precision, 0),
    NULLIF(TRIM(line->>'unit'), ''),
    CURRENT_TIMESTAMP
FROM "farmers" f,
     jsonb_array_elements(f."fertilizers") AS line
WHERE COALESCE(line->>'id', '') <> ''
  AND COALESCE((line->>'amount')::double precision, 0) > 0;

INSERT INTO "farmer_pesticide_lines" ("id", "farmer_id", "product_id", "product_name", "amount", "price", "unit", "created_at")
SELECT
    gen_random_uuid(),
    f."external_id",
    line->>'id',
    COALESCE(line->>'name', ''),
    COALESCE((line->>'amount')::double precision, 0),
    COALESCE((line->>'price')::double precision, 0),
    NULLIF(TRIM(line->>'unit'), ''),
    CURRENT_TIMESTAMP
FROM "farmers" f,
     jsonb_array_elements(f."pesticides") AS line
WHERE COALESCE(line->>'id', '') <> ''
  AND COALESCE((line->>'amount')::double precision, 0) > 0;

INSERT INTO "farmer_seed_lines" ("id", "farmer_id", "product_id", "product_name", "amount", "price", "unit", "created_at")
SELECT
    gen_random_uuid(),
    f."external_id",
    line->>'id',
    COALESCE(line->>'name', ''),
    COALESCE((line->>'amount')::double precision, 0),
    COALESCE((line->>'price')::double precision, 0),
    NULLIF(TRIM(line->>'unit'), ''),
    CURRENT_TIMESTAMP
FROM "farmers" f,
     jsonb_array_elements(f."seeds") AS line
WHERE COALESCE(line->>'id', '') <> ''
  AND COALESCE((line->>'amount')::double precision, 0) > 0;

INSERT INTO "farmer_csc_product_lines" ("id", "farmer_id", "product_id", "product_name", "amount", "price", "unit", "created_at")
SELECT
    gen_random_uuid(),
    f."external_id",
    line->>'id',
    COALESCE(line->>'name', ''),
    COALESCE((line->>'amount')::double precision, 0),
    COALESCE((line->>'price')::double precision, 0),
    NULLIF(TRIM(line->>'unit'), ''),
    CURRENT_TIMESTAMP
FROM "farmers" f,
     jsonb_array_elements(f."csc_products") AS line
WHERE COALESCE(line->>'id', '') <> ''
  AND COALESCE((line->>'amount')::double precision, 0) > 0;

-- Link farmers to crop / village catalog rows by name (keep text columns intact)
UPDATE "farmers" f
SET "crop_id" = c."id"
FROM "catalog_crops" c
WHERE lower(trim(f."crops_name")) = lower(trim(c."name"))
  AND COALESCE(trim(f."crops_name"), '') <> '';

UPDATE "farmers" f
SET "village_mouza_id" = v."id"
FROM "catalog_village_mouzas" v
WHERE lower(trim(f."village_or_mouza")) = lower(trim(v."name"))
  AND COALESCE(trim(f."village_or_mouza"), '') <> '';

-- Foreign keys and indexes
CREATE INDEX "farmers_crop_id_idx" ON "farmers"("crop_id");
CREATE INDEX "farmers_village_mouza_id_idx" ON "farmers"("village_mouza_id");

CREATE INDEX "farmer_fertilizer_lines_farmer_id_idx" ON "farmer_fertilizer_lines"("farmer_id");
CREATE INDEX "farmer_fertilizer_lines_product_id_idx" ON "farmer_fertilizer_lines"("product_id");
CREATE INDEX "farmer_pesticide_lines_farmer_id_idx" ON "farmer_pesticide_lines"("farmer_id");
CREATE INDEX "farmer_pesticide_lines_product_id_idx" ON "farmer_pesticide_lines"("product_id");
CREATE INDEX "farmer_seed_lines_farmer_id_idx" ON "farmer_seed_lines"("farmer_id");
CREATE INDEX "farmer_seed_lines_product_id_idx" ON "farmer_seed_lines"("product_id");
CREATE INDEX "farmer_csc_product_lines_farmer_id_idx" ON "farmer_csc_product_lines"("farmer_id");
CREATE INDEX "farmer_csc_product_lines_product_id_idx" ON "farmer_csc_product_lines"("product_id");

ALTER TABLE "farmers" ADD CONSTRAINT "farmers_crop_id_fkey"
    FOREIGN KEY ("crop_id") REFERENCES "catalog_crops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "farmers" ADD CONSTRAINT "farmers_village_mouza_id_fkey"
    FOREIGN KEY ("village_mouza_id") REFERENCES "catalog_village_mouzas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "farmer_fertilizer_lines" ADD CONSTRAINT "farmer_fertilizer_lines_farmer_id_fkey"
    FOREIGN KEY ("farmer_id") REFERENCES "farmers"("external_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "farmer_fertilizer_lines" ADD CONSTRAINT "farmer_fertilizer_lines_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "catalog_fertilizers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "farmer_pesticide_lines" ADD CONSTRAINT "farmer_pesticide_lines_farmer_id_fkey"
    FOREIGN KEY ("farmer_id") REFERENCES "farmers"("external_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "farmer_pesticide_lines" ADD CONSTRAINT "farmer_pesticide_lines_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "catalog_pesticides"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "farmer_seed_lines" ADD CONSTRAINT "farmer_seed_lines_farmer_id_fkey"
    FOREIGN KEY ("farmer_id") REFERENCES "farmers"("external_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "farmer_seed_lines" ADD CONSTRAINT "farmer_seed_lines_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "catalog_seeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "farmer_csc_product_lines" ADD CONSTRAINT "farmer_csc_product_lines_farmer_id_fkey"
    FOREIGN KEY ("farmer_id") REFERENCES "farmers"("external_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "farmer_csc_product_lines" ADD CONSTRAINT "farmer_csc_product_lines_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "catalog_csc_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop legacy JSON columns and settings_catalog blob table
ALTER TABLE "farmers" DROP COLUMN "fertilizers";
ALTER TABLE "farmers" DROP COLUMN "pesticides";
ALTER TABLE "farmers" DROP COLUMN "seeds";
ALTER TABLE "farmers" DROP COLUMN "csc_products";

DROP TABLE "settings_catalog";

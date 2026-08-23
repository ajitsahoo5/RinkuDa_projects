-- Run in pgAdmin as postgres superuser (Query Tool on any DB, e.g. postgres)

-- Step 1: Create login user
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ajit') THEN
    CREATE USER ajit WITH PASSWORD 'Sahoo@8392' CREATEDB LOGIN;
  ELSE
    ALTER USER ajit WITH PASSWORD 'Sahoo@8392' CREATEDB LOGIN;
  END IF;
END
$$;

-- Step 2: Create database (run only if rinku_pacs does not exist yet)
CREATE DATABASE rinku_pacs OWNER ajit;

-- If you get "already exists", skip Step 2.

-- Step 3: Connect to database "rinku_pacs" in pgAdmin, open Query Tool, run:
-- GRANT ALL ON SCHEMA public TO ajit;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ajit;

-- =========================================================
-- PHASE 1: DATABASE SCHEMA FOR VERSION HISTORY
-- =========================================================
-- This migration updates the blueprints table to support 
-- an append-only version history log.

-- 1. Ensure columns exist with modern naming
ALTER TABLE blueprints ADD COLUMN IF NOT EXISTS module_type TEXT;
ALTER TABLE blueprints ADD COLUMN IF NOT EXISTS generated_content JSONB;

-- 2. Backfill existing records if any
UPDATE blueprints 
SET module_type = module_name 
WHERE module_type IS NULL AND module_name IS NOT NULL;

UPDATE blueprints 
SET generated_content = data 
WHERE generated_content IS NULL AND data IS NOT NULL;

-- 3. Create index for fast version history lookups
CREATE INDEX IF NOT EXISTS idx_blueprints_project_module_created 
ON blueprints(project_id, module_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blueprints_created_at 
ON blueprints(created_at DESC);

-- 4. Enable Row Level Security (RLS) on blueprints
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;

-- 5. Drop old policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow select blueprints for authenticated users" ON blueprints;
DROP POLICY IF EXISTS "Allow insert blueprints for authenticated users" ON blueprints;
DROP POLICY IF EXISTS "Enable all access for service role on blueprints" ON blueprints;

-- Allow Service Role full access
CREATE POLICY "Enable all access for service role on blueprints" 
ON blueprints FOR ALL 
USING (auth.role() = 'service_role');

-- Allow authenticated users to SELECT blueprints for projects in their workspace
CREATE POLICY "Allow select blueprints for authenticated users" 
ON blueprints FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = blueprints.project_id
  )
);

-- Allow authenticated users to INSERT new blueprints (append-only log)
CREATE POLICY "Allow insert blueprints for authenticated users" 
ON blueprints FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = blueprints.project_id
  )
);

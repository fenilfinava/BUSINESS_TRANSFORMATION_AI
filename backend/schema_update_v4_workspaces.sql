-- =========================================================
-- PHASE 1: SUPABASE WORKSPACES TABLE & SCHEMA FIX
-- =========================================================

-- 1. Create workspaces table if it doesn't exist
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ensure user_id column exists on workspaces (in case table was created with owner_id previously)
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from owner_id if owner_id exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workspaces' AND column_name = 'owner_id'
    ) THEN
        UPDATE workspaces SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL;
    END IF;
END $$;

-- 3. Ensure projects table has workspace_id foreign key
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- 4. Enable RLS on workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can manage their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Enable all access for service role on workspaces" ON workspaces;

-- Allow service role full access
CREATE POLICY "Enable all access for service role on workspaces" 
ON workspaces FOR ALL 
USING (auth.role() = 'service_role');

-- Allow authenticated users to manage their own workspaces
CREATE POLICY "Users can manage their own workspaces" 
ON workspaces 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Enable RLS on projects as well
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for service role on projects" ON projects;
CREATE POLICY "Enable all access for service role on projects" 
ON projects FOR ALL 
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can manage projects in their workspaces" ON projects;
CREATE POLICY "Users can manage projects in their workspaces" 
ON projects 
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = projects.workspace_id 
        AND (workspaces.user_id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = projects.workspace_id 
        AND (workspaces.user_id = auth.uid())
    )
);

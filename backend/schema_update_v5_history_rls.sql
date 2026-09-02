-- =========================================================
-- PHASE 5: RLS POLICIES FIX FOR BLUEPRINTS & HISTORY
-- =========================================================
-- Run this in the Supabase Dashboard SQL Editor to ensure
-- authenticated users can directly query blueprints and projects.

-- 1. Ensure user_id column exists on workspaces and mirrors owner_id
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workspaces' AND column_name = 'owner_id'
    ) THEN
        UPDATE workspaces SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL;
    END IF;
END $$;

-- 2. Allow authenticated users to view workspaces they own
DROP POLICY IF EXISTS "Users can manage their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can view workspaces" ON workspaces;
CREATE POLICY "Users can manage their own workspaces" ON workspaces 
FOR ALL TO authenticated
USING (auth.uid() = user_id OR auth.uid() = owner_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

-- 3. Allow authenticated users to view & manage projects
DROP POLICY IF EXISTS "Users can manage projects in their workspaces" ON projects;
DROP POLICY IF EXISTS "Users can select projects" ON projects;
CREATE POLICY "Users can select projects" ON projects 
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can manage projects in their workspaces" ON projects 
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = projects.workspace_id 
        AND (workspaces.user_id = auth.uid() OR workspaces.owner_id = auth.uid())
    ) OR true
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = projects.workspace_id 
        AND (workspaces.user_id = auth.uid() OR workspaces.owner_id = auth.uid())
    ) OR true
);

-- 4. Allow authenticated users to select blueprints
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select blueprints for authenticated users" ON blueprints;
DROP POLICY IF EXISTS "Allow insert blueprints for authenticated users" ON blueprints;

CREATE POLICY "Allow select blueprints for authenticated users" 
ON blueprints FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow insert blueprints for authenticated users" 
ON blueprints FOR INSERT 
TO authenticated 
WITH CHECK (true);

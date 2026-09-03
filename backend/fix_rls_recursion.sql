-- Migration: Fix Infinite Recursion in project_members RLS Policy
-- Run this in your Supabase Dashboard SQL Editor

-- 1. Create a helper function that bypasses RLS to check ownership securely
CREATE OR REPLACE FUNCTION get_is_project_owner(check_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM projects
    JOIN workspaces ON projects.workspace_id = workspaces.id
    WHERE projects.id = check_project_id
      AND workspaces.owner_id = auth.uid()
  );
$$;

-- 2. Drop the old recursive policy on project_members
DROP POLICY IF EXISTS "Owners can manage project members" ON project_members;

-- 3. Apply the new clean policy using the helper function
CREATE POLICY "Owners can manage project members" 
ON project_members FOR ALL 
USING (get_is_project_owner(project_id))
WITH CHECK (get_is_project_owner(project_id));

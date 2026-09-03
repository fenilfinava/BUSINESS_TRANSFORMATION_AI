-- Migration: Project Members and Shared Access RLS (Non-Recursive)
-- Run this in your Supabase Dashboard SQL Editor

-- 1. Create the members table
CREATE TABLE IF NOT EXISTS project_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
    user_id UUID REFERENCES auth.users(id), -- Null until they accept
    role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, email)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- 2. Create helper function that bypasses RLS to check ownership securely (breaks cyclic loop)
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

-- 3. Allow project owners to manage invites using helper function
DROP POLICY IF EXISTS "Owners can manage project members" ON project_members;
CREATE POLICY "Owners can manage project members" 
ON project_members FOR ALL 
USING (get_is_project_owner(project_id))
WITH CHECK (get_is_project_owner(project_id));

-- 4. Update Projects RLS to allow members to view the project
DROP POLICY IF EXISTS "Project members can view the project" ON projects;
CREATE POLICY "Project members can view the project"
ON projects FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = projects.id 
        AND project_members.user_id = auth.uid()
        AND project_members.status = 'accepted'
    )
);

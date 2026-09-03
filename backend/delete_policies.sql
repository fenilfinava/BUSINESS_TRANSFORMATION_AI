-- Migration: Add Bulletproof RLS Policies for Workspaces and Projects
-- Run this script in your Supabase Dashboard SQL Editor

-- ============================================================
-- 1. WORKSPACES TABLE POLICIES
-- ============================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can delete their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can manage their own workspaces" ON workspaces;

-- Allow owners to view, insert, update, and delete their workspaces
CREATE POLICY "Users can manage their own workspaces" 
ON workspaces 
FOR ALL 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);


-- ============================================================
-- 2. PROJECTS TABLE POLICIES
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage projects in owned workspaces" ON projects;

-- OPTION A: If projects table links via workspace_id to owned workspaces (Recommended & covers existing projects)
CREATE POLICY "Users can manage projects in owned workspaces" 
ON projects 
FOR ALL 
USING (
    workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
);

-- OPTION B (Optional): Add user_id column to projects table if you track direct user ownership
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

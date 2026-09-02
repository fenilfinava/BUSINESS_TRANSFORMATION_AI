-- Add owner_id to organizations and workspaces tables
ALTER TABLE organizations ADD COLUMN owner_id UUID REFERENCES auth.users(id);
ALTER TABLE workspaces ADD COLUMN owner_id UUID REFERENCES auth.users(id);

-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    industry TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workspaces table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Admin',
    icon TEXT DEFAULT '🏢',
    color TEXT DEFAULT 'from-blue-500 to-indigo-600',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Planning',
    industry TEXT,
    team_size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blueprints table (for storing AI module outputs)
CREATE TABLE blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;

-- Create policies that allow the Service Role key to bypass RLS
-- The service_role key automatically bypasses RLS if you use the service_role JWT, 
-- but it's good practice to ensure authenticated/service access is explicit if needed.
-- Since the backend uses the service_role key, it naturally bypasses RLS. 
-- However, if you want explicit policies for the anon key (not recommended for backend-only access) or authenticated users:

CREATE POLICY "Enable all access for service role on organizations" ON organizations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role on workspaces" ON workspaces FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role on projects" ON projects FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role on blueprints" ON blueprints FOR ALL USING (auth.role() = 'service_role');

-- Insert a default organization so you have one to link workspaces to
INSERT INTO organizations (name, industry) VALUES ('Default Organization', 'Technology');

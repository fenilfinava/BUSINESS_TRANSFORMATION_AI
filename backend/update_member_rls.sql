-- Add policy for accepted members to see other members of the same project
CREATE POLICY "Members can view project team"
ON project_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND pm.status = 'accepted'
  )
);

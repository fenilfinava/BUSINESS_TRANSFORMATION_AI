'use client';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export function useProjectsLoader(activeWorkspaceId?: string) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProjects = async () => {
      // If workspace ID hasn't loaded yet, don't fire an invalid query
      if (!activeWorkspaceId) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Query projects strictly by activeWorkspaceId
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', activeWorkspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Project Fetch Error Details:", error.message, error.details, error.hint);
        setProjects([]);
      } else {
        setProjects(data || []);
      }
      setIsLoading(false);
    };

    fetchProjects();
  }, [activeWorkspaceId]);

  return { projects, isLoading, setProjects };
}

export default useProjectsLoader;

'use server';

import { createClient } from '@supabase/supabase-js';
import { sanitizeError } from '@/utils/errorHandler';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lstxnnspwrfscglmaexu.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdHhubnNwd3Jmc2NnbG1hZXh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODM0MTcwMCwiZXhwIjoyMTAzOTE3NzAwfQ.FlY6i1FEZRtplkSrjMOxYYVW31fbQewsOQhtLgcuz8Q";

export async function deleteProjectAction(projectId: string) {
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  // Use service role admin client to bypass user-facing recursive RLS policies during cascading deletes
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. Manually delete members and blueprints first to avoid cascade policy triggers
    await supabase.from('project_members').delete().eq('project_id', projectId);
    await supabase.from('blueprints').delete().eq('project_id', projectId);

    // 2. Delete the project cleanly
    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .select();

    if (error) {
      console.error("Server Action delete project error:", error);
      throw new Error(sanitizeError(error.message, "Failed to delete project."));
    }

    return { success: true, deleted: data };
  } catch (err: any) {
    console.error("Server Action uncaught delete error:", err);
    throw new Error(sanitizeError(err, "Failed to delete project."));
  }
}

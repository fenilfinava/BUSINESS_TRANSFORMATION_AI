import { createClient } from '@supabase/supabase-js';

// The Service Role Key bypasses Row Level Security (RLS) entirely.
// NEVER expose this to the browser/client-side code.
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lstxnnspwrfscglmaexu.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdHhubnNwd3Jmc2NnbG1hZXh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODM0MTcwMCwiZXhwIjoyMTAzOTE3NzAwfQ.FlY6i1FEZRtplkSrjMOxYYVW31fbQewsOQhtLgcuz8Q"
  );
};

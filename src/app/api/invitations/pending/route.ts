import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/utils/supabase/admin";
import { sanitizeError } from "@/utils/errorHandler";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lstxnnspwrfscglmaexu.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdHhubnNwd3Jmc2NnbG1hZXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDE3MDAsImV4cCI6MjEwMzkxNzcwMH0.mKCX5YWQBYRGQdy5NfvdZN0Y8_1RjDMAuv9IpbkvNgI";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser(token);
    if (userError || !user?.email) {
      return NextResponse.json({ error: "Unauthorized: Invalid user" }, { status: 401 });
    }

    const userEmail = user.email.trim().toLowerCase();
    const admin = createAdminClient();

    // 1. Fetch pending invitations matching this user's email using admin client (bypasses RLS)
    const { data: invites, error: inviteError } = await admin
      .from("project_members")
      .select("id, project_id, email, status, role, created_at")
      .ilike("email", userEmail)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (inviteError) {
      console.error("Error fetching pending invites:", inviteError);
      return NextResponse.json({ error: sanitizeError(inviteError.message, "Failed to fetch invitations.") }, { status: 500 });
    }

    if (!invites || invites.length === 0) {
      return NextResponse.json({ invites: [] });
    }

    // 2. Fetch project and workspace details for these invitations
    const projectIds = invites.map((inv) => inv.project_id);
    const { data: projectsData, error: projError } = await admin
      .from("projects")
      .select("id, name, workspace_id, workspaces(id, name)")
      .in("id", projectIds);

    if (projError) {
      console.error("Error fetching project info for invites:", projError);
    }

    const projMap = new Map((projectsData || []).map((p) => [p.id, p]));

    const formatted = invites.map((inv) => {
      const proj = projMap.get(inv.project_id);
      const ws = (proj as any)?.workspaces;
      return {
        id: inv.id,
        project_id: inv.project_id,
        projectName: proj?.name || "Enterprise Project",
        workspaceId: proj?.workspace_id || null,
        workspaceName: ws?.name || "Workspace",
        role: inv.role || "viewer",
        email: inv.email,
        created_at: inv.created_at
      };
    });

    return NextResponse.json({ invites: formatted });
  } catch (err: any) {
    console.error("Pending invitations API error:", err);
    return NextResponse.json({ error: sanitizeError(err.message, "Internal server error") }, { status: 500 });
  }
}

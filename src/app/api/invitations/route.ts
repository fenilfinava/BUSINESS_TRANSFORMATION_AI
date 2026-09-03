import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lstxnnspwrfscglmaexu.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdHhubnNwd3Jmc2NnbG1hZXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDE3MDAsImV4cCI6MjEwMzkxNzcwMH0.mKCX5YWQBYRGQdy5NfvdZN0Y8_1RjDMAuv9IpbkvNgI";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing authentication token" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, projectIds, email, role = "viewer" } = body;

    if (!email || (!projectId && (!projectIds || projectIds.length === 0))) {
      return NextResponse.json({ error: "Missing required fields: email and projectId(s)" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const targets: string[] = projectIds && projectIds.length > 0 ? projectIds : [projectId];

    const recordsToInsert = targets.map((pid: string) => ({
      project_id: pid,
      email: normalizedEmail,
      role: role.toLowerCase(),
      status: "pending",
    }));

    // Upsert or insert invites
    const { data, error } = await supabase
      .from("project_members")
      .upsert(recordsToInsert, { onConflict: "project_id,email" })
      .select();

    if (error) {
      console.error("Error inserting project_members:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, invites: data });
  } catch (err: any) {
    console.error("Invite API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const projectId = searchParams.get("projectId");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    let query = supabase
      .from("project_members")
      .select("id, project_id, email, status, role, user_id, created_at, projects!inner(id, name, workspace_id)");

    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    // Removed strict workspaceId filter. RLS will automatically filter down 
    // to projects the user owns and projects they are an accepted member of.

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json({ error: "Missing member ID" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data, error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Permission denied or member not found" }, { status: 403 });
    }

    return NextResponse.json({ success: true, deleted: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import { sanitizeError } from "@/utils/errorHandler";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lstxnnspwrfscglmaexu.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdHhubnNwd3Jmc2NnbG1hZXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDE3MDAsImV4cCI6MjEwMzkxNzcwMH0.mKCX5YWQBYRGQdy5NfvdZN0Y8_1RjDMAuv9IpbkvNgI";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspace_id") || searchParams.get("workspaceId");

    const admin = createAdminClient();
    let query = admin.from("projects").select("*");

    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading projects via API:", error);
      return NextResponse.json({ error: sanitizeError(error.message, "Failed to load projects") }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("GET /api/projects exception:", err);
    return NextResponse.json({ error: sanitizeError(err.message, "Failed to fetch projects") }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string | null = null;
    let userEmail: string | null = null;

    if (token) {
      try {
        const authClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: { user } } = await authClient.auth.getUser(token);
        if (user) {
          userId = user.id;
          userEmail = user.email || null;
        }
      } catch (authErr) {
        console.warn("Could not verify auth token in /api/projects:", authErr);
      }
    }

    const body = await req.json();
    const { name, description, workspace_id, industry, status } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Prepare insert payload
    const projectPayload: Record<string, any> = {
      name: name.trim(),
      description: (description || "").trim(),
      workspace_id: workspace_id || null,
      industry: industry || "Enterprise",
      status: status || "In Progress"
    };

    if (userId) {
      projectPayload.user_id = userId;
    }

    let insertedProject: any = null;
    try {
      const { data, error } = await admin
        .from("projects")
        .insert(projectPayload)
        .select()
        .single();

      if (error) {
        // If user_id column doesn't exist or causes error, retry without user_id
        if (error.message?.includes("user_id")) {
          delete projectPayload.user_id;
          const retry = await admin.from("projects").insert(projectPayload).select().single();
          if (retry.error) throw retry.error;
          insertedProject = retry.data;
        } else {
          throw error;
        }
      } else {
        insertedProject = data;
      }
    } catch (insertErr: any) {
      console.error("Project insert error:", insertErr);
      return NextResponse.json({ error: sanitizeError(insertErr.message, "Failed to create project") }, { status: 500 });
    }

    // Safely add creator as owner in project_members if possible
    if (insertedProject && userId) {
      try {
        await admin.from("project_members").upsert(
          {
            project_id: insertedProject.id,
            user_id: userId,
            email: userEmail || "owner@workspace.local",
            role: "owner",
            status: "accepted"
          },
          { onConflict: "project_id,email" }
        );
      } catch (memberErr) {
        console.warn("Could not create owner project_member record:", memberErr);
      }
    }

    return NextResponse.json(insertedProject, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/projects exception:", err);
    return NextResponse.json({ error: sanitizeError(err.message, "Internal server error") }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { sanitizeError } from "@/utils/errorHandler";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, moduleType, title, summary, content, key_recommendations = [] } = body;

    if (!projectId || !moduleType || !content) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, moduleType, and content" },
        { status: 400 }
      );
    }

    const payload = {
      format: "markdown",
      title: title || `${moduleType.replace(/_/g, " ").toUpperCase()} Blueprint`,
      summary: summary || "",
      content: content,
      key_recommendations: Array.isArray(key_recommendations) ? key_recommendations : []
    };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("blueprints")
      .insert({
        project_id: projectId,
        module_type: moduleType,
        generated_content: payload
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving blueprint to database:", error);
      return NextResponse.json({ error: sanitizeError(error.message, "Failed to save blueprint") }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error("Save blueprint route error:", err);
    return NextResponse.json({ error: sanitizeError(err.message, "Internal server error") }, { status: 500 });
  }
}

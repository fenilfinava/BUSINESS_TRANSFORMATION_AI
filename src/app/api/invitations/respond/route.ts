import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/utils/supabase/admin";
import { sanitizeError } from "@/utils/errorHandler";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lstxnnspwrfscglmaexu.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdHhubnNwd3Jmc2NnbG1hZXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDE3MDAsImV4cCI6MjEwMzkxNzcwMH0.mKCX5YWQBYRGQdy5NfvdZN0Y8_1RjDMAuv9IpbkvNgI";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { inviteId, action } = body;

    if (!inviteId || !action) {
      return NextResponse.json({ error: "Missing required fields: inviteId and action" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify invite exists and belongs to this user's email
    const { data: invite, error: fetchErr } = await admin
      .from("project_members")
      .select("id, email, project_id")
      .eq("id", inviteId)
      .single();

    if (fetchErr || !invite) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    }

    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden: This invitation belongs to another user." }, { status: 403 });
    }

    if (action === "accept") {
      // Update status to accepted and link user_id
      const { error: updateErr } = await admin
        .from("project_members")
        .update({
          status: "accepted",
          user_id: user.id
        })
        .eq("id", inviteId);

      if (updateErr) {
        console.error("Error accepting invite:", updateErr);
        return NextResponse.json({ error: sanitizeError(updateErr.message, "Failed to accept invitation.") }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Invitation accepted!" });
    } else if (action === "deny") {
      // Delete the pending invitation
      const { error: deleteErr } = await admin
        .from("project_members")
        .delete()
        .eq("id", inviteId);

      if (deleteErr) {
        console.error("Error declining invite:", deleteErr);
        return NextResponse.json({ error: sanitizeError(deleteErr.message, "Failed to decline invitation.") }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Invitation declined." });
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'accept' or 'deny'." }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Respond invitation error:", err);
    return NextResponse.json({ error: sanitizeError(err.message, "Internal server error") }, { status: 500 });
  }
}

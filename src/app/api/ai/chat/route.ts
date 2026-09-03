import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/utils/supabase/admin";
import { sanitizeError } from "@/utils/errorHandler";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message || body.prompt;
    const history = body.history || [];
    const projectId = body.projectId || body.project_id;
    const moduleName = body.moduleName;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing required field: message or prompt" }, { status: 400 });
    }

    let projectContext = "";
    let projectName = "Enterprise Transformation Project";

    // Safely pull project context from Supabase using admin client
    if (projectId) {
      try {
        const admin = createAdminClient();
        const { data: project } = await admin
          .from("projects")
          .select("name, description, context_description, industry, status")
          .eq("id", projectId)
          .single();

        if (project) {
          projectName = project.name || projectName;
          projectContext = `
Project Name: ${project.name}
Status: ${project.status || "In Progress"}
Industry: ${project.industry || "Enterprise"}
Description: ${project.description || "Digital transformation and modernization"}
Discovery Context: ${project.context_description || "No discovery context captured yet"}
`;
        }
      } catch (err) {
        console.warn("Could not fetch project context for chat:", err);
      }
    }

    const systemPrompt = `You are the lead AI Solutions Architect and Enterprise Transformation Consultant for "${projectName}".
Your role is to guide leaders, engineers, and stakeholders through end-to-end digital transformation:
- Recommend target cloud & microservices architectures (HLD & LLD)
- Identify automation opportunities and AI/ML adoption frameworks
- Formulate database design, API patterns, and event-driven workflows
- Provide practical effort estimations, risk mitigation, and implementation roadmaps

PROJECT CONTEXT:
${projectContext}

INSTRUCTIONS:
1. Provide authoritative, clear, actionable, and structured guidance.
2. Use markdown formatting (bullet points, bold text, code/diagram snippets where appropriate).
3. Be consultative, concise, and focused on implementation readiness.
`;

    // Initialize Gemini 3.6 Flash
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: systemPrompt
    });

    // Format chat history for multi-turn if provided
    const chat = model.startChat({
      history: history.map((h: { role: string; text: string }) => ({
        role: h.role === "ai" ? "model" : "user",
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage(message);
    const replyText = result.response.text();

    return NextResponse.json({
      role: "ai",
      text: replyText
    });
  } catch (err: any) {
    console.error("Gemini Chat API error:", err);
    return NextResponse.json(
      { error: sanitizeError(err.message, "AI Chat service temporarily unavailable.") },
      { status: 500 }
    );
  }
}

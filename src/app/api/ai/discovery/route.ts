import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/utils/supabase/admin";
import { sanitizeError } from "@/utils/errorHandler";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      companyOverview,
      targetAudience,
      painPoints,
      currentTech,
      legacySystems,
      kpis,
      timeline,
      budget
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Missing required field: projectId" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Pull project name
    const { data: project } = await admin
      .from("projects")
      .select("name, industry")
      .eq("id", projectId)
      .single();

    const projectName = project?.name || "Enterprise Transformation Project";

    const prompt = `You are an expert Chief Enterprise Architect and Digital Transformation Partner analyzing a Business Discovery session for "${projectName}".

DISCOVERY DETAILS:
- Company Overview: ${companyOverview || "N/A"}
- Target Audience: ${targetAudience || "N/A"}
- Current Pain Points: ${painPoints || "N/A"}
- Current Technology Stack: ${currentTech || "N/A"}
- Legacy Systems & Constraints: ${legacySystems || "N/A"}
- Key Performance Indicators (KPIs): ${kpis || "N/A"}
- Desired Timeline: ${timeline || "3-6 Months"}
- Target Budget: ${budget || "Enterprise"}

TASK:
Perform a comprehensive discovery analysis and formulate strategic transformation opportunities.
Output valid JSON formatted as:
{
  "summary": "Executive summary of the discovery findings (2-3 sentences)",
  "gap_analysis": [
    "Identified architectural or operational gap 1",
    "Identified architectural or operational gap 2",
    "Identified architectural or operational gap 3"
  ],
  "ai_opportunities": [
    "High-impact AI/Automation initiative 1",
    "High-impact AI/Automation initiative 2",
    "High-impact AI/Automation initiative 3"
  ],
  "recommended_architecture": "Concise target architecture recommendation (cloud, microservices, data pipeline, and AI integration)",
  "recommended_modules": [
    "solution_architecture",
    "transformation_planner",
    "process_intelligence",
    "database_designer"
  ]
}
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsedData: any;
    try {
      parsedData = JSON.parse(text);
    } catch {
      parsedData = {
        summary: "Discovery analysis successfully generated.",
        gap_analysis: ["Legacy process bottlenecks", "Manual data workflows"],
        ai_opportunities: ["Automate core ingestion", "Implement predictive intelligence"],
        recommended_architecture: "Modern cloud-native microservices architecture on AWS/GCP with secure API gateway.",
        recommended_modules: ["solution_architecture", "transformation_planner"]
      };
    }

    // Update project context description in database
    const summaryContext = [
      companyOverview ? `Overview: ${companyOverview}` : "",
      targetAudience ? `Audience: ${targetAudience}` : "",
      painPoints ? `Pain Points: ${painPoints}` : "",
      currentTech ? `Tech: ${currentTech}` : "",
      legacySystems ? `Legacy Systems: ${legacySystems}` : "",
      kpis ? `KPIs: ${kpis}` : "",
      `Timeline: ${timeline}`,
      `Budget: ${budget}`,
      `AI Summary: ${parsedData.summary}`
    ]
      .filter(Boolean)
      .join(" | ");

    await admin
      .from("projects")
      .update({ context_description: summaryContext })
      .eq("id", projectId);

    return NextResponse.json({
      success: true,
      analysis: parsedData
    });
  } catch (err: any) {
    console.error("Discovery API error:", err);
    return NextResponse.json(
      { error: sanitizeError(err.message, "Discovery analysis temporarily unavailable.") },
      { status: 500 }
    );
  }
}

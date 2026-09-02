from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_current_user, get_supabase_client, save_blueprint, get_project
from config import settings
import os
import json

router = APIRouter(prefix="/api/ai", tags=["AI Generation"])

import os
from dotenv import load_dotenv, find_dotenv

# Automatically search parent directories for the .env file
env_file = find_dotenv()

if not env_file:
    print("CRITICAL ERROR: No .env file found anywhere in the directory tree.")
else:
    print(f"SUCCESS: Found .env file at {env_file}")
    load_dotenv(env_file, override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print(f"DEBUG: Gemini Key Loaded: {bool(GEMINI_API_KEY)}")

gemini_model = None
gemini_error = None
try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        model_name = 'gemini-3.6-flash'
        print(f"DEBUG: Selected Gemini Model: {model_name}")
        gemini_model = genai.GenerativeModel(model_name)
        print("✅ Gemini AI initialized successfully")
    else:
        gemini_error = "GEMINI_API_KEY is missing from environment variables."
        print("⚠️ GEMINI_API_KEY not found.")
except ImportError:
    gemini_error = "google-generativeai package is not installed in the active Python environment. Run: pip install google-generativeai"
    print("⚠️ google-generativeai not installed. Run: pip install google-generativeai")

# --- Request/Response Models ---
class AIGenerateRequest(BaseModel):
    project_id: str
    module_type: str  # e.g., 'architecture', 'database_schema', 'ux_wireframe'

class AIGenerateResponse(BaseModel):
    module_type: str
    content: str
    format: str  # 'markdown', 'mermaid', 'json'

# --- Module-Specific Prompt Templates ---
MODULE_PROMPTS = {
    "transformation_companion": {
        "system": "You are an AI Transformation Companion. Analyze the business context and identify digital transformation opportunities.",
        "task": "Based on the following business context, identify the top 5 transformation opportunities, potential ROI, and recommended priority order. Provide actionable insights.",
        "format": "markdown"
    },
    "solution_builder": {
        "system": "You are an AI Solution Builder specializing in enterprise technology recommendations.",
        "task": "Based on the following business context, recommend AI solutions, automation opportunities, technology stacks, and implementation approaches. Be specific with product/tool names.",
        "format": "markdown"
    },
    "business_analysis": {
        "system": "You are a Business Analysis Engine for enterprise transformation.",
        "task": "Perform a comprehensive business analysis including: requirement discovery, process analysis, gap analysis, digital maturity assessment, and future state analysis. Present findings in structured sections.",
        "format": "markdown"
    },
    "business_consultant": {
        "system": "You are an AI Business Consultant with expertise in digital transformation.",
        "task": "Validate the business ideas, ask critical discovery questions, and recommend best practices for AI adoption and technology stack selection. Provide a structured consultation report.",
        "format": "markdown"
    },
    "transformation_planner": {
        "system": "You are a Transformation Planner specializing in roadmap generation.",
        "task": "Generate a detailed transformation roadmap with phases, milestones, timelines, and deliverables. Include risk mitigation strategies for each phase.",
        "format": "markdown"
    },
    "architecture": {
        "system": "You are a Solution Architecture Builder for enterprise systems.",
        "task": "Design a high-level architecture (HLD) for the system described below. Include: system components, data flow, cloud infrastructure recommendations, security layers, and integration points. Output as a Mermaid diagram using `graph TB` syntax.",
        "format": "mermaid"
    },
    "process_design": {
        "system": "You are a Process Intelligence Designer specializing in business workflows.",
        "task": "Create a detailed BPMN-style workflow diagram for the key business processes described below. Use Mermaid `graph TD` syntax with subgraphs for swimlanes. Include decision points and error handling.",
        "format": "mermaid"
    },
    "ux_wireframe": {
        "system": "You are an AI UX Designer for enterprise applications.",
        "task": "Design wireframe concepts for the application described below. Describe each screen with: layout type, key components, navigation flow, and user interaction patterns. Output as structured JSON with screens array.",
        "format": "json"
    },
    "database_schema": {
        "system": "You are a Database & Integration Designer for enterprise systems.",
        "task": "Design a comprehensive database schema (ER diagram) for the system described below. Include all entities, relationships, primary/foreign keys, and data types. Output as a Mermaid `erDiagram` syntax.",
        "format": "mermaid"
    },
    "planning_engine": {
        "system": "You are an AI Planning Engine for project estimation.",
        "task": "Produce detailed effort estimates including: phases, activities, roles needed, estimated hours, complexity ratings, total timeline, and cost estimation. Present as a markdown table.",
        "format": "markdown"
    },
    "dashboard_metrics": {
        "system": "You are a Transformation Dashboard analytics engine.",
        "task": "Based on the business context, generate key transformation metrics including: AI readiness score (0-100), digital maturity score (0-100), risk level, estimated ROI timeline, and recommended KPIs. Output as a JSON object.",
        "format": "json"
    }
}


@router.post("/generate", response_model=AIGenerateResponse)
async def generate_ai_content(request: AIGenerateRequest, user_id: str = Depends(get_current_user)):
    """
    Universal AI generation endpoint.
    Fetches project context, constructs module-specific prompt, calls Gemini, saves blueprint.
    """
    if not gemini_model:
        raise HTTPException(
            status_code=503, 
            detail=gemini_error or "Gemini AI is not configured. Check GEMINI_API_KEY."
        )

    # 1. Validate module_type
    module_config = MODULE_PROMPTS.get(request.module_type)
    if not module_config:
        raise HTTPException(
            status_code=400, 
            detail=f"Unknown module_type '{request.module_type}'. Valid types: {list(MODULE_PROMPTS.keys())}"
        )

    # 2. Fetch project context from Supabase
    project = await get_project(request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{request.project_id}' not found.")

    project_name = project.get("name", "Untitled Project")
    project_desc = project.get("description", "No description provided.")
    project_context = project.get("context_description", "")

    business_context = f"""
Project Name: {project_name}
Description: {project_desc}
Business Context: {project_context if project_context else project_desc}
"""

    # 3. Construct the prompt
    full_prompt = f"""{module_config['system']}

{module_config['task']}

--- BUSINESS CONTEXT ---
{business_context}
--- END CONTEXT ---

Please provide a comprehensive, professional-grade output formatted as a valid JSON object with keys:
- "module_type": "{request.module_type}"
- "title": A descriptive title for this blueprint
- "summary": A high-level executive summary
- "content": The primary generated output (markdown, mermaid diagram, or data)
- "key_recommendations": A list of top recommendations
"""

    # 4. Call Gemini Asynchronously
    try:
        print(f"🤖 Calling Gemini for module '{request.module_type}' on project '{project_name}'...")
        response = await gemini_model.generate_content_async(
            full_prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        generated_text = response.text
        print(f"✅ Gemini response received ({len(generated_text)} chars)")
    except Exception as e:
        print(f"❌ Gemini API error: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}")

    # 5. Save to blueprints table
    blueprint_data = {
        "format": module_config["format"],
        "content": generated_text
    }
    try:
        await save_blueprint(request.project_id, request.module_type, blueprint_data)
        print(f"💾 Blueprint saved for module '{request.module_type}'")
    except Exception as e:
        print(f"⚠️ Failed to save blueprint (non-fatal): {str(e)}")

    # 6. Return to frontend
    return AIGenerateResponse(
        module_type=request.module_type,
        content=generated_text,
        format=module_config["format"]
    )


@router.get("/blueprints/{project_id}")
async def get_project_blueprints(project_id: str, user_id: str = Depends(get_current_user)):
    """Fetch all saved blueprints for a project."""
    client = get_supabase_client()
    try:
        response = client.table("blueprints").select("*").eq("project_id", project_id).order("created_at", desc=True).execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch blueprints: {str(e)}")

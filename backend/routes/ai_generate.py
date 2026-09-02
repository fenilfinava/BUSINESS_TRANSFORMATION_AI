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
    business_context: str

class AIGenerateResponse(BaseModel):
    module_type: str
    content: str
    format: str = "markdown"
    title: Optional[str] = None
    summary: Optional[str] = None
    key_recommendations: Optional[list[str]] = None

# --- Specialized Module Instructions ---
MODULE_INSTRUCTIONS = {
    "solution_architecture": (
        "Output High-Level Design (HLD) & Low-Level Design (LLD), microservices breakdown, "
        "cloud infrastructure (AWS/GCP/Azure), network security layers, API gateway patterns, and end-to-end data flow diagrams."
    ),
    "database_designer": (
        "Output an ER diagram structure, complete SQL/PostgreSQL table definitions with primary and foreign keys, "
        "relational schemas, indexing strategy, partition suggestions, and data integrity constraints."
    ),
    "process_intelligence": (
        "Output BPMN workflow stages, actor swimlanes, automation trigger points, exception handling paths, "
        "and event-driven API integration steps."
    ),
    "ux_designer": (
        "Output page wireframe hierarchies, component breakdowns, navigation flowcharts, design system recommendations, "
        "and user journey personas."
    ),
    "transformation_planner": (
        "Output multi-phase implementation roadmaps, milestone timelines with estimated quarters, compliance baselines, "
        "resource allocation, and risk mitigation matrices."
    ),
    "planning_engine": (
        "Output comprehensive effort estimates (story points and hours), resource role planning, sprint breakdown, "
        "budget and licensing cost estimates, and risk prediction."
    ),
    "transformation_companion": (
        "Provide strategic executive advisory on digital transformation opportunities, organizational change management, "
        "phased digital adoption, and competitive positioning."
    ),
    "solution_builder": (
        "Recommend specific cutting-edge AI solutions, automation opportunities, technology stack choices (frontend, backend, AI/ML), "
        "and pragmatic implementation approaches."
    ),
    "business_analysis": (
        "Perform comprehensive requirement discovery, existing process analysis, gap analysis, digital maturity assessment, "
        "and future state operational modeling."
    ),
    "business_consultant": (
        "Validate core business ideas, ask critical discovery questions, benchmark industry best practices, "
        "and formulate strategic AI adoption frameworks."
    ),
    "transformation_dashboard": (
        "Define transformation KPIs, digital maturity scoring (0-100), AI readiness indicators, ROI realization schedules, "
        "and executive health scorecards."
    ),
    "security_compliance": (
        "Formulate zero-trust architecture, regulatory compliance mapping (SOC2, GDPR, HIPAA, ISO27001), "
        "IAM role definitions, vulnerability mitigation policies, and audit logging standards."
    )
}

# Aliases for backwards compatibility
MODULE_ALIASES = {
    "architecture": "solution_architecture",
    "database_schema": "database_designer",
    "process_design": "process_intelligence",
    "ux_wireframe": "ux_designer",
    "dashboard_metrics": "transformation_dashboard"
}


@router.post("/generate", response_model=AIGenerateResponse)
async def generate_ai_content(request: AIGenerateRequest, user_id: str = Depends(get_current_user)):
    """
    Universal AI generation endpoint.
    Routes to specialized Gemini prompts per module_type, parses structured JSON, and saves blueprint.
    """
    if not gemini_model:
        raise HTTPException(
            status_code=503, 
            detail=gemini_error or "Gemini AI is not configured. Check GEMINI_API_KEY."
        )

    # 1. Resolve module_type and specialized instructions
    resolved_module = MODULE_ALIASES.get(request.module_type, request.module_type)
    specialized_instructions = MODULE_INSTRUCTIONS.get(
        resolved_module,
        f"Generate a comprehensive, actionable technical and business blueprint for {resolved_module}."
    )

    # 2. Construct the strict prompt dynamically
    prompt = f"""You are an expert enterprise systems architect.
Task: Generate a comprehensive blueprint for the module: '{resolved_module}'.
Specialized Instructions:
{specialized_instructions}

Business Context: {request.business_context}

Format Requirement: Output valid JSON containing:
{{
  "module_type": "{resolved_module}",
  "title": "A descriptive, professional title for this blueprint",
  "summary": "Executive summary of the blueprint (2-3 sentences)",
  "content": "Markdown-formatted detailed blueprint including all technical specifications, diagrams, and step-by-step guidance...",
  "key_recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4"]
}}
"""

    # 3. Call Gemini Asynchronously
    try:
        print(f"🤖 Calling Gemini for module '{resolved_module}' on project '{request.project_id}'...")
        response = await gemini_model.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        generated_text = response.text
        print(f"✅ Gemini response received ({len(generated_text)} chars)")
    except Exception as e:
        print(f"❌ Gemini API error: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}")

    # 4. Parse JSON output
    try:
        parsed_data = json.loads(generated_text)
    except Exception:
        import re
        cleaned = re.sub(r"^```json\s*", "", generated_text.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        try:
            parsed_data = json.loads(cleaned)
        except Exception:
            parsed_data = {
                "module_type": resolved_module,
                "title": f"{resolved_module.replace('_', ' ').title()} Blueprint",
                "summary": "AI Generated Blueprint for Enterprise Transformation",
                "content": generated_text,
                "key_recommendations": []
            }

    content_markdown = parsed_data.get("content", generated_text)
    title = parsed_data.get("title", f"{resolved_module.replace('_', ' ').title()} Blueprint")
    summary = parsed_data.get("summary", "")
    key_recommendations = parsed_data.get("key_recommendations", [])
    if not isinstance(key_recommendations, list):
        key_recommendations = [str(key_recommendations)]

    # 5. Save to blueprints table in Supabase
    blueprint_payload = {
        "format": "markdown",
        "title": title,
        "summary": summary,
        "content": content_markdown,
        "key_recommendations": key_recommendations
    }
    try:
        await save_blueprint(request.project_id, resolved_module, blueprint_payload)
        print(f"💾 Blueprint saved for module '{resolved_module}'")
    except Exception as e:
        print(f"⚠️ Failed to save blueprint (non-fatal): {str(e)}")

    # 6. Return parsed response directly to the client
    return AIGenerateResponse(
        module_type=resolved_module,
        title=title,
        summary=summary,
        content=content_markdown,
        key_recommendations=key_recommendations,
        format="markdown"
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

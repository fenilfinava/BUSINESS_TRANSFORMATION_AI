from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

# Request Models
class GenerationRequest(BaseModel):
    workspace_id: str
    prompt: str
    uploaded_documents: List[str] = Field(default_factory=list)
    language: str = "en"
    project_id: Optional[str] = None

class ProjectCreateRequest(BaseModel):
    name: str
    description: str
    workspace_id: str

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None

WorkspaceCreateRequest = WorkspaceCreate

class DiscoverySubmission(BaseModel):
    project_id: str
    workspace_id: str
    company_overview: str
    target_audience: str
    pain_points: str
    current_tech: str
    legacy_systems: str
    kpis: str
    timeline: str
    budget: str

# SSE Models
class SSEPayload(BaseModel):
    format: Literal["mermaid", "markdown", "json"]
    content: str | Dict[str, Any]

class SSEEvent(BaseModel):
    event_id: str
    module: str
    type: Literal["diagram", "markdown", "wireframe", "metrics"]
    target_tab: Literal["database_erd", "bpmn_workflow", "prd", "ui_wireframe", "roadmap", "architecture", "chat"]
    status: Literal["in_progress", "completed", "error"]
    payload: Optional[SSEPayload] = None
    message: Optional[str] = None

# Database Entities & Responses
class WorkspaceResponse(BaseModel):
    id: str
    name: str
    organization_id: Optional[str] = None
    role: Optional[str] = "Admin"
    icon: Optional[str] = "🚀"
    color: Optional[str] = "from-blue-500 to-indigo-600"
    created_at: Optional[Any] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: Optional[str] = "Planning"
    workspace_id: Optional[str] = None
    created_at: Optional[Any] = None

class WorkspaceStats(BaseModel):
    active_projects: int
    ai_recommendations: int
    completed_milestones: int
    team_members: int

class TeamMember(BaseModel):
    id: str
    name: str
    email: str
    role: str
    color: str

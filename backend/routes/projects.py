from fastapi import APIRouter, HTTPException
from typing import List
from models import ProjectResponse, ProjectCreateRequest
from database import get_projects, get_project, create_project, get_blueprints

# Projects routes will be mounted under workspaces
router = APIRouter(tags=["Projects"])

@router.get("/api/workspaces/{workspace_id}/projects", response_model=List[ProjectResponse])
async def list_projects(workspace_id: str):
    return await get_projects(workspace_id)

@router.post("/api/projects", response_model=ProjectResponse)
async def add_project(request: ProjectCreateRequest):
    return await create_project(request.model_dump())

@router.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project_detail(project_id: str):
    proj = await get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj

@router.get("/api/projects/{project_id}/solutions")
async def get_solutions(project_id: str):
    return await get_blueprints(project_id)

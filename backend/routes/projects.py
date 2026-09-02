from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import ProjectResponse, ProjectCreateRequest
from database import get_projects, get_project, create_project, get_blueprints, get_current_user

# Projects routes will be mounted under workspaces
router = APIRouter(tags=["Projects"])

@router.get("/api/workspaces/{workspace_id}/projects", response_model=List[ProjectResponse])
async def list_projects(workspace_id: str, user_id: str = Depends(get_current_user)):
    return await get_projects(workspace_id)

@router.post("/api/projects", response_model=ProjectResponse)
async def add_project(request: ProjectCreateRequest, user_id: str = Depends(get_current_user)):
    # You might want to pass user_id down to create_project if you want to store who created it.
    # For now, it simply enforces that the user is authenticated.
    return await create_project(request.model_dump())

@router.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project_detail(project_id: str, user_id: str = Depends(get_current_user)):
    proj = await get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj

@router.get("/api/projects/{project_id}/solutions")
async def get_solutions(project_id: str, user_id: str = Depends(get_current_user)):
    return await get_blueprints(project_id)

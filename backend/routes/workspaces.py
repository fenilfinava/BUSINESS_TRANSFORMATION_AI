from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import WorkspaceResponse, WorkspaceStats, WorkspaceCreateRequest, TeamMember
from database import get_workspaces, get_workspace, create_workspace, get_workspace_stats, get_team_members, get_current_user

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])

@router.get("", response_model=List[WorkspaceResponse])
async def list_workspaces():
    return await get_workspaces()

@router.post("", response_model=WorkspaceResponse)
async def add_workspace(request: WorkspaceCreateRequest, user_id: str = Depends(get_current_user)):
    try:
        return await create_workspace(request.name, request.description, owner_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create workspace: {str(e)}")

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace_detail(workspace_id: str):
    ws = await get_workspace(workspace_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return ws

@router.put("/{workspace_id}/settings")
async def update_settings(workspace_id: str, settings: dict):
    # Stub for updating settings
    return {"message": "Settings updated", "workspace_id": workspace_id}

@router.get("/{workspace_id}/stats", response_model=WorkspaceStats)
async def get_stats(workspace_id: str):
    return await get_workspace_stats(workspace_id)

@router.get("/{workspace_id}/team", response_model=List[TeamMember])
async def get_team(workspace_id: str):
    return await get_team_members(workspace_id)

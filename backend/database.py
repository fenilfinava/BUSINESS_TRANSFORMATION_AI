import os
from dotenv import load_dotenv

# Explicitly load .env file
load_dotenv()

from supabase import create_client, Client
from config import settings
from typing import Dict, Any, List, Optional
import uuid
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Global Supabase client
supabase: Optional[Client] = None

def get_supabase_client() -> Client:
    global supabase
    if supabase is None:
        url = os.getenv("SUPABASE_URL") or settings.supabase_url
        key = os.getenv("SUPABASE_SERVICE_KEY") or settings.supabase_service_key
        supabase = create_client(url, key)
    return supabase

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    client = get_supabase_client()
    try:
        user_response = client.auth.get_user(token)
        if not user_response.user:
            print("Token validation failed: No user returned")
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_response.user.id
    except Exception as e:
        print(f"Token validation failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Supabase Auth Error: {str(e)}")

def get_workspaces() -> List[Dict[str, Any]]:
    client = get_supabase_client()
    try:
        response = client.table("workspaces").select("*").order("created_at", desc=True).execute()
        return response.data or []
    except Exception as e:
        print(f"Error fetching workspaces from database: {e}")
        return []

async def get_workspace(workspace_id: str) -> Dict[str, Any]:
    client = get_supabase_client()
    try:
        response = client.table("workspaces").select("*").eq("id", workspace_id).execute()
        return response.data[0] if response.data else {}
    except Exception as e:
        print(f"Error fetching workspace: {e}")
        return {}

def create_workspace(name: str, description: Optional[str] = None, owner_id: Optional[str] = None) -> Dict[str, Any]:
    client = get_supabase_client()
    try:
        orgs = client.table("organizations").select("id").limit(1).execute()
        if not orgs.data:
            print("  - Creating initial Organization...")
            new_org_data = {"name": "Default Org", "industry": "Technology"}
            if owner_id:
                new_org_data["owner_id"] = owner_id
            new_org = client.table("organizations").insert(new_org_data).execute()
            real_org_id = new_org.data[0]["id"]
        else:
            real_org_id = orgs.data[0]["id"]

        print(f"Inserting workspace '{name}' for owner {owner_id}...")
        data = {"name": name, "organization_id": real_org_id}
        if owner_id:
            data["owner_id"] = owner_id
            
        response = client.table("workspaces").insert(data).execute()
        print("  - Workspace inserted successfully!")
        return response.data[0] if response.data else {}
    except Exception as e:
        print(f"Database insertion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Supabase DB Error: {str(e)}")

async def get_projects(workspace_id: str) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    try:
        response = client.table("projects").select("*").eq("workspace_id", workspace_id).execute()
        return response.data or []
    except Exception as e:
        print(f"Error fetching projects: {e}")
        return []

async def get_project(project_id: str) -> Dict[str, Any]:
    client = get_supabase_client()
    try:
        response = client.table("projects").select("*").eq("id", project_id).execute()
        return response.data[0] if response.data else {}
    except Exception as e:
        print(f"Error fetching project: {e}")
        return {}

async def create_project(data: Dict[str, Any]) -> Dict[str, Any]:
    client = get_supabase_client()
    try:
        response = client.table("projects").insert(data).execute()
        return response.data[0] if response.data else {}
    except Exception as e:
        print(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {e}")

async def save_blueprint(project_id: str, module_name: str, data: Dict[str, Any]) -> None:
    client = get_supabase_client()
    try:
        payload = {"project_id": project_id, "module_name": module_name, "data": data}
        client.table("blueprints").insert(payload).execute()
    except Exception as e:
        print(f"Error saving blueprint: {e}")

async def get_blueprints(project_id: str) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    try:
        response = client.table("blueprints").select("*").eq("project_id", project_id).execute()
        return response.data or []
    except Exception as e:
        print(f"Error fetching blueprints: {e}")
        return []

async def get_workspace_stats(workspace_id: str) -> Dict[str, Any]:
    client = get_supabase_client()
    try:
        projects_res = client.table("projects").select("id").eq("workspace_id", workspace_id).execute()
        active_projects_count = len(projects_res.data) if projects_res.data else 0
        return {
            "active_projects": active_projects_count,
            "ai_recommendations": 0,
            "completed_milestones": 0,
            "team_members": 1
        }
    except Exception as e:
        print(f"Error getting workspace stats: {e}")
        return {
            "active_projects": 0,
            "ai_recommendations": 0,
            "completed_milestones": 0,
            "team_members": 1
        }

async def get_team_members(workspace_id: str) -> List[Dict[str, Any]]:
    return []

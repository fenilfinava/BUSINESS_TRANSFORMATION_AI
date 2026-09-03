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

def get_workspaces(owner_id: Optional[str] = None) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    try:
        query = client.table("workspaces").select("*")
        if owner_id:
            query = query.eq("owner_id", owner_id)
        response = query.order("created_at", desc=True).execute()
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
            data["user_id"] = owner_id
            
        try:
            response = client.table("workspaces").insert(data).execute()
            print("  - Workspace inserted successfully with user_id and owner_id!")
            return response.data[0] if response.data else {}
        except Exception as insert_err:
            if "user_id" in str(insert_err):
                data.pop("user_id", None)
                response = client.table("workspaces").insert(data).execute()
                return response.data[0] if response.data else {}
            raise insert_err
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
        ws_id = data.get("workspace_id")
        if ws_id:
            import uuid
            try:
                uuid.UUID(str(ws_id))
            except (ValueError, AttributeError):
                raise HTTPException(status_code=400, detail="Invalid workspace ID format. Must be a valid UUID.")
        response = client.table("projects").insert(data).execute()
        return response.data[0] if response.data else {}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {e}")

async def save_blueprint(project_id: str, module_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
    import uuid
    try:
        uuid.UUID(str(project_id))
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid project ID format. Must be a valid UUID.")

    client = get_supabase_client()
    try:
        # Phase 1 & 2: Append-only insert with modern field coverage
        payload = {
            "project_id": project_id,
            "module_type": module_type,
            "generated_content": data
        }
        res = client.table("blueprints").insert(payload).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        print(f"Error saving blueprint: {e}")
        raise e

async def get_blueprints(project_id: str, module_type: Optional[str] = None) -> List[Dict[str, Any]]:
    import uuid
    try:
        uuid.UUID(str(project_id))
    except (ValueError, AttributeError):
        return []

    client = get_supabase_client()
    try:
        query = client.table("blueprints").select("*").eq("project_id", project_id)
        if module_type:
            query = query.eq("module_type", module_type)
        response = query.order("created_at", desc=True).execute()
        return response.data or []
    except Exception as e:
        print(f"Error fetching blueprints: {e}")
        return []

async def get_all_blueprints(user_id: Optional[str] = None, workspace_id: Optional[str] = None) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    try:
        if workspace_id:
            response = client.table("blueprints").select("*, projects!inner(id, name, workspace_id)").eq("projects.workspace_id", workspace_id).order("created_at", desc=True).execute()
        else:
            response = client.table("blueprints").select("*, projects(id, name)").order("created_at", desc=True).execute()
        return response.data or []
    except Exception as e:
        print(f"Error fetching all blueprints: {e}")
        return []

async def get_workspace_stats(workspace_id: str) -> Dict[str, Any]:
    client = get_supabase_client()
    try:
        projects_res = client.table("projects").select("id, status").eq("workspace_id", workspace_id).execute()
        projects = projects_res.data or []
        
        active_projects_count = len([p for p in projects if p.get("status") != "Completed"])
        completed_milestones = len([p for p in projects if p.get("status") == "Completed"])
        
        ai_recommendations = 0
        if projects:
            project_ids = [p["id"] for p in projects]
            blueprints_res = client.table("blueprints").select("id").in_("project_id", project_ids).execute()
            ai_recommendations = len(blueprints_res.data) if blueprints_res.data else 0

        return {
            "active_projects": active_projects_count,
            "ai_recommendations": ai_recommendations,
            "completed_milestones": completed_milestones,
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

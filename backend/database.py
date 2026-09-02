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
        if settings.mock_mode:
            # Create a dummy client or just raise an error if accessed directly
            # For mock mode, we'll bypass actual Supabase calls
            pass
        else:
            url = os.getenv("SUPABASE_URL") or settings.supabase_url
            key = os.getenv("SUPABASE_SERVICE_KEY") or settings.supabase_service_key
            supabase = create_client(url, key)
    return supabase

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if settings.mock_mode:
        return str(uuid.uuid4())
    
    token = credentials.credentials
    print(f"Header received: Bearer {token}")
    
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

async def get_workspaces(organization_id: str = "org_1") -> List[Dict[str, Any]]:
    if settings.mock_mode:
        return [
            {"id": "1", "name": "Acme Corp", "role": "Admin", "icon": "🏢", "color": "from-blue-500 to-indigo-600"},
            {"id": "2", "name": "Global Tech", "role": "Analyst", "icon": "🌐", "color": "from-emerald-400 to-teal-500"}
        ]
    # Real Supabase call
    client = get_supabase_client()
    response = client.table("workspaces").select("*").eq("organization_id", organization_id).execute()
    return response.data

async def get_workspace(workspace_id: str) -> Dict[str, Any]:
    if settings.mock_mode:
        return {"id": workspace_id, "name": "Acme Corp", "role": "Admin", "icon": "🏢", "color": "from-blue-500 to-indigo-600"}
    client = get_supabase_client()
    response = client.table("workspaces").select("*").eq("id", workspace_id).execute()
    return response.data[0] if response.data else {}

def create_workspace(name: str, description: Optional[str] = None, owner_id: Optional[str] = None, organization_id: str = "org_1") -> Dict[str, Any]:
    print("3. Checking for existing organization...")
    if settings.mock_mode:
        return {"id": str(uuid.uuid4()), "name": name, "role": "Admin", "icon": "🚀", "color": "from-purple-500 to-pink-600"}
    
    client = get_supabase_client()
    try:
        orgs = client.table("organizations").select("id").limit(1).execute()
        if not orgs.data:
            print("  - No org found, creating Default Org...")
            new_org_data = {"name": "Default Org", "industry": "Technology"}
            if owner_id:
                new_org_data["owner_id"] = owner_id
            new_org = client.table("organizations").insert(new_org_data).execute()
            real_org_id = new_org.data[0]["id"]
        else:
            real_org_id = orgs.data[0]["id"]

        print("4. Inserting workspace...")
        data = {"name": name, "organization_id": real_org_id}
        if owner_id:
            data["owner_id"] = owner_id
        if description:
            pass
            
        response = client.table("workspaces").insert(data).execute()
        print("  - Workspace inserted successfully!")
        return response.data[0] if response.data else {}
    except Exception as e:
        print(f"Database insertion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Supabase DB Error: {str(e)}")

async def get_projects(workspace_id: str) -> List[Dict[str, Any]]:
    if settings.mock_mode:
        return [
            {"id": "1", "name": "ERP Cloud Migration", "status": "In Progress", "industry": "Manufacturing", "team": 12, "lastUpdated": "2 hours ago"},
            {"id": "2", "name": "Customer Portal AI", "status": "Planning", "industry": "Retail", "team": 5, "lastUpdated": "1 day ago"},
            {"id": "3", "name": "Supply Chain Optimization", "status": "Completed", "industry": "Logistics", "team": 8, "lastUpdated": "1 week ago"}
        ]
    client = get_supabase_client()
    response = client.table("projects").select("*").eq("workspace_id", workspace_id).execute()
    return response.data

async def get_project(project_id: str) -> Dict[str, Any]:
    if settings.mock_mode:
        return {"id": project_id, "name": "ERP Cloud Migration", "status": "In Progress", "industry": "Manufacturing", "team": 12, "lastUpdated": "2 hours ago"}
    client = get_supabase_client()
    response = client.table("projects").select("*").eq("id", project_id).execute()
    return response.data[0] if response.data else {}

async def create_project(data: Dict[str, Any]) -> Dict[str, Any]:
    if settings.mock_mode:
        return {"id": str(uuid.uuid4()), **data, "status": "Planning", "lastUpdated": "Just now"}
    client = get_supabase_client()
    response = client.table("projects").insert(data).execute()
    return response.data[0] if response.data else {}

async def save_blueprint(project_id: str, module_name: str, data: Dict[str, Any]) -> None:
    if settings.mock_mode:
        print(f"Mock: Saving blueprint for {module_name} in project {project_id}")
        return
    client = get_supabase_client()
    payload = {"project_id": project_id, "module_name": module_name, "data": data}
    client.table("blueprints").insert(payload).execute()

async def get_blueprints(project_id: str) -> List[Dict[str, Any]]:
    if settings.mock_mode:
        return []
    client = get_supabase_client()
    response = client.table("blueprints").select("*").eq("project_id", project_id).execute()
    return response.data

async def get_workspace_stats(workspace_id: str) -> Dict[str, Any]:
    if settings.mock_mode:
        return {
            "active_projects": 12,
            "ai_recommendations": 84,
            "completed_milestones": 32,
            "team_members": 8
        }
    return {}

async def get_team_members(workspace_id: str) -> List[Dict[str, Any]]:
    if settings.mock_mode:
        return [
            {"id": "1", "name": "Alice Johnson", "email": "alice@acmecorp.com", "role": "Workspace Admin", "color": "from-blue-500 to-indigo-600"},
            {"id": "2", "name": "Bob Smith", "email": "bob@acmecorp.com", "role": "Solution Architect", "color": "from-emerald-500 to-teal-600"},
        ]
    return []

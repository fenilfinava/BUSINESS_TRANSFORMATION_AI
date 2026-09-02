from fastapi import APIRouter
from models import DiscoverySubmission
import uuid

router = APIRouter(prefix="/api", tags=["Discovery"])

@router.post("/discovery")
async def submit_discovery(request: DiscoverySubmission):
    # In a real scenario, this would be saved to Supabase
    return {
        "message": "Discovery context saved successfully",
        "discovery_id": f"dsc_{uuid.uuid4()}",
        "project_id": request.project_id
    }

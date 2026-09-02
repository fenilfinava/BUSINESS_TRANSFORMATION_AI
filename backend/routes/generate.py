from fastapi import APIRouter, Depends, HTTPException
import uuid
from fastapi.responses import StreamingResponse
from models import GenerationRequest
from agent_orchestrator import run_transformation_pipeline
from database import get_current_user

router = APIRouter(prefix="/api", tags=["Generate"])

@router.post("/generate")
async def generate_pipeline(request: GenerationRequest, user_id: str = Depends(get_current_user)):
    if request.project_id:
        try:
            uuid.UUID(str(request.project_id))
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid project ID format. Must be a valid UUID.")
    return StreamingResponse(
        run_transformation_pipeline(request),
        media_type="text/event-stream"
    )

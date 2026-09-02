from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from models import GenerationRequest
from agent_orchestrator import run_transformation_pipeline
from database import get_current_user

router = APIRouter(prefix="/api", tags=["Generate"])

@router.post("/generate")
async def generate_pipeline(request: GenerationRequest, user_id: str = Depends(get_current_user)):
    return StreamingResponse(
        run_transformation_pipeline(request),
        media_type="text/event-stream"
    )

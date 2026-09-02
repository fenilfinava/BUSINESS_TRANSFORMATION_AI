from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models import GenerationRequest
from agent_orchestrator import run_transformation_pipeline

router = APIRouter(prefix="/api", tags=["Generate"])

@router.post("/generate")
async def generate_pipeline(request: GenerationRequest):
    return StreamingResponse(
        run_transformation_pipeline(request),
        media_type="text/event-stream"
    )

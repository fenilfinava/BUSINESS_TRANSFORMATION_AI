import json
import asyncio
import uuid
from typing import AsyncGenerator
from models import GenerationRequest, SSEEvent, SSEPayload
from config import settings
from mock_data import get_mock_data_for_module
from database import save_blueprint

# External LLM Initialization
import os
try:
    from openai import AsyncOpenAI
    # Initialize the LLM client using the API key from config
    llm_client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
except ImportError:
    llm_client = None

async def _yield_event(
    module: str, 
    event_type: str, 
    target_tab: str, 
    status: str, 
    payload: dict = None,
    message: str = None
) -> str:
    event = SSEEvent(
        event_id=f"evt_{uuid.uuid4()}",
        module=module,
        type=event_type,
        target_tab=target_tab,
        status=status,
        payload=SSEPayload(**payload) if payload else None,
        message=message
    )
    return f"data: {event.model_dump_json(exclude_none=True)}\n\n"

async def _run_module_mock(
    module_name: str, 
    target_tab: str, 
    event_type: str, 
    delay: float, 
    project_id: str
) -> AsyncGenerator[str, None]:
    yield await _yield_event(module_name, event_type, target_tab, "in_progress", message=f"Starting {module_name}...")
    await asyncio.sleep(delay)
    
    mock_data = get_mock_data_for_module(module_name)
    await save_blueprint(project_id, module_name, mock_data)
    
    yield await _yield_event(
        module=module_name,
        event_type=event_type,
        target_tab=target_tab,
        status="completed",
        payload=mock_data
    )

async def _run_module_llm(
    module_name: str, 
    target_tab: str, 
    event_type: str, 
    request: GenerationRequest
) -> AsyncGenerator[str, None]:
    # Placeholder for actual LLM call (OpenAI/Gemini)
    yield await _yield_event(module_name, event_type, target_tab, "in_progress", message=f"Querying LLM for {module_name}...")
    # Simulate LLM latency
    await asyncio.sleep(2.0)
    
    # Fallback to mock data for now even in LLM mode until integrated
    mock_data = get_mock_data_for_module(module_name)
    if request.project_id:
        await save_blueprint(request.project_id, module_name, mock_data)
        
    yield await _yield_event(
        module=module_name,
        event_type=event_type,
        target_tab=target_tab,
        status="completed",
        payload=mock_data
    )

async def run_transformation_pipeline(request: GenerationRequest) -> AsyncGenerator[str, None]:
    # Ensure we have a project ID
    project_id = request.project_id or f"prj_{uuid.uuid4()}"
    
    # Helper to choose execution mode
    async def execute_module(module_name: str, target_tab: str, event_type: str, delay: float = 1.0):
        if settings.mock_mode:
            async for event in _run_module_mock(module_name, target_tab, event_type, delay, project_id):
                yield event
        else:
            async for event in _run_module_llm(module_name, target_tab, event_type, request):
                yield event

    # Stage 1: Sequential (Analysis)
    async for event in execute_module("AI Transformation Companion", "chat", "markdown", 0.5):
        yield event
    async for event in execute_module("Business Analysis Engine", "chat", "markdown", 1.0):
        yield event
    async for event in execute_module("AI Business Consultant", "chat", "markdown", 0.5):
        yield event
    async for event in execute_module("AI Solution Builder", "chat", "markdown", 1.0):
        yield event

    # Stage 2: Concurrent (Design)
    # We yield a starting message, then run them concurrently and yield their results
    yield await _yield_event("System", "chat", "chat", "in_progress", message="Running design modules concurrently...")
    
    async def collect_events(coro):
        events = []
        async for e in coro:
            events.append(e)
        return events

    # Prepare generators
    tasks = [
        execute_module("Solution Architecture Builder", "architecture", "diagram", 2.0),
        execute_module("Process Intelligence Designer", "bpmn_workflow", "diagram", 1.5),
        execute_module("Database & Integration Designer", "database_erd", "diagram", 1.5),
        execute_module("AI UX Designer", "ui_wireframe", "wireframe", 2.0)
    ]
    
    # Gather results
    results = await asyncio.gather(*(collect_events(t) for t in tasks))
    for event_list in results:
        for event in event_list:
            yield event

    # Stage 3: Sequential (Planning)
    async for event in execute_module("Transformation Planner", "roadmap", "markdown", 1.0):
        yield event
    async for event in execute_module("AI Planning Engine", "roadmap", "markdown", 1.0):
        yield event
    async for event in execute_module("Transformation Dashboard", "roadmap", "metrics", 0.5):
        yield event

    yield await _yield_event("System", "chat", "chat", "completed", message="Transformation pipeline finished successfully.")

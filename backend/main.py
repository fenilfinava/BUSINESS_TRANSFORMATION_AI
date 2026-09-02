from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from config import settings

# Import Routers
from routes import generate, workspaces, projects, discovery, export

import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print("Starting ArchFlow AI Backend...")
    
    # Environment Variable Validation
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    llm_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
    
    if not supabase_key:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("WARNING: SUPABASE_SERVICE_KEY is MISSING from environment variables!")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    if not llm_key:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("WARNING: LLM API KEY (OPENAI or GEMINI) is MISSING!")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        
    if settings.mock_mode:
        print("Running in MOCK_MODE = True. Mock data will be returned.")
    yield
    # Shutdown logic
    print("Shutting down ArchFlow AI Backend...")

app = FastAPI(
    title="ArchFlow AI - Enterprise Transformation API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(generate.router)
app.include_router(workspaces.router)
app.include_router(projects.router)
app.include_router(discovery.router)
app.include_router(export.router)

@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "mock_mode": settings.mock_mode}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    mock_mode: bool = False
    
    # Supabase Configuration
    supabase_url: str = "https://your-project.supabase.co"
    supabase_service_key: str = "your-service-role-key"
    
    # API Configuration
    cors_origins: List[str] = ["http://localhost:3000"]
    
    # LLM Provider
    openai_api_key: Optional[str] = None
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

# Initialize settings singleton
settings = Settings()

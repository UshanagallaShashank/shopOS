# Central config — all env vars typed and read once from .env
import json
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    app_name: str = "ShopOS"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://shopos:shopos@localhost/shopos"
    redis_url: str = "redis://localhost:6379"
    allowed_origins: list[str] | str = ["http://localhost:3000", "http://localhost:3001"]
    
    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        """Parse allowed_origins from JSON string or list"""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                # If it's a single URL string, wrap it in a list
                return [v]
        return v

    # Supabase project credentials
    supabase_url: str = ""
    supabase_anon_key: str = ""
    # service_role key — NEVER expose to frontend, used for admin auth operations
    supabase_service_key: str = ""
    # JWT secret — verifies tokens locally without a network call
    supabase_jwt_secret: str = ""

    # Role secret keys — share privately, determines role at signup
    platform_admin_secret: str = "change-me-admin-secret"
    org_admin_secret: str = "change-me-org-admin-secret"

    class Config:
        env_file = ".env"


settings = Settings()

# Central config — all env vars typed and read once from .env
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ShopOS"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://shopos:shopos@localhost/shopos"
    redis_url: str = "redis://localhost:6379"
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

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

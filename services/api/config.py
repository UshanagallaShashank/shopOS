# Central config — all env vars typed and read once from .env.local
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ShopOS"
    debug: bool = False

    # Postgres — uses asyncpg driver for async ORM queries
    database_url: str = "postgresql+asyncpg://shopos:shopos@localhost/shopos"

    # Redis — sessions, rate limiting, background job queue
    redis_url: str = "redis://localhost:6379"

    # CORS — frontend dev ports (Next.js platform + org admin)
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Firebase — used by auth middleware to verify JWTs
    firebase_project_id: str = ""

    class Config:
        env_file = ".env"


# Import this singleton everywhere: from config import settings
settings = Settings()

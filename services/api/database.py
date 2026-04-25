# Async DB engine + session factory — never import engine directly in routes
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from config import settings

# echo=True prints every SQL query — useful in debug mode
engine = create_async_engine(settings.database_url, echo=settings.debug)

# expire_on_commit=False keeps objects usable after commit without a new query
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    # All SQLAlchemy models inherit from this — gives Alembic one place to look
    pass


async def get_db():
    # FastAPI dependency — yields one DB session per request, auto-closes after
    async with SessionLocal() as session:
        yield session

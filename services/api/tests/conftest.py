# Shared test fixtures — test DB setup, per-test table wipe, HTTP client
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from database import Base, get_db
from main import app

# Separate test DB — run `make test-setup` once to create it
TEST_DB = "postgresql+asyncpg://shopos:shopos@localhost/shopos_test"

_engine = create_async_engine(TEST_DB)
_Session = async_sessionmaker(_engine, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_schema():
    # Drop + recreate all tables once per test run
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(autouse=True)
async def clean_tables():
    # Truncate all rows before each test so tests don't interfere with each other
    async with _Session() as session:
        await session.execute(
            text("TRUNCATE order_items, orders, products, users, orgs RESTART IDENTITY CASCADE")
        )
        await session.commit()


@pytest_asyncio.fixture
async def client():
    # Override get_db so all routes use the test DB instead of the real one
    async def _test_db():
        async with _Session() as session:
            yield session

    app.dependency_overrides[get_db] = _test_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()

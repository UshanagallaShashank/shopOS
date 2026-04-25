# Tests for /health and /health/db — first thing to verify after any deploy
import pytest


async def test_liveness(client):
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


async def test_db_readiness(client):
    # Confirms Postgres is reachable through the test DB connection
    res = await client.get("/health/db")
    assert res.status_code == 200
    assert res.json()["db"] == "connected"

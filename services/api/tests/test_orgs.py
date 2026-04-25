# Org CRUD tests — covers create, read, update, delete, and error cases
import pytest

BASE = {"name": "Meena Boutique", "slug": "meena-boutique", "plan": "starter"}


async def test_create_org(client):
    res = await client.post("/orgs/", json=BASE)
    assert res.status_code == 201
    data = res.json()
    assert data["slug"] == "meena-boutique"
    assert data["status"] == "active"
    assert data["plan"] == "starter"


async def test_slug_auto_lowercased(client):
    res = await client.post("/orgs/", json={**BASE, "slug": "UPPER-Case"})
    assert res.status_code == 201
    assert res.json()["slug"] == "upper-case"


async def test_duplicate_slug_returns_409(client):
    await client.post("/orgs/", json=BASE)
    res = await client.post("/orgs/", json=BASE)
    assert res.status_code == 409


async def test_list_orgs(client):
    await client.post("/orgs/", json=BASE)
    res = await client.get("/orgs/")
    assert res.status_code == 200
    assert len(res.json()) == 1


async def test_get_org(client):
    org_id = (await client.post("/orgs/", json=BASE)).json()["id"]
    res = await client.get(f"/orgs/{org_id}")
    assert res.status_code == 200
    assert res.json()["id"] == org_id


async def test_get_missing_org_returns_404(client):
    res = await client.get("/orgs/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404


async def test_update_org_plan(client):
    org_id = (await client.post("/orgs/", json=BASE)).json()["id"]
    res = await client.patch(f"/orgs/{org_id}", json={"plan": "pro"})
    assert res.status_code == 200
    assert res.json()["plan"] == "pro"


async def test_delete_org(client):
    org_id = (await client.post("/orgs/", json=BASE)).json()["id"]
    assert (await client.delete(f"/orgs/{org_id}")).status_code == 204
    assert (await client.get(f"/orgs/{org_id}")).status_code == 404


async def test_pagination(client):
    # Create 3 orgs, fetch with limit=2 — should return exactly 2
    for i in range(3):
        await client.post("/orgs/", json={"name": f"Shop {i}", "slug": f"shop-{i}", "plan": "starter"})
    res = await client.get("/orgs/?skip=0&limit=2")
    assert len(res.json()) == 2

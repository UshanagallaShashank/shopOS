# Product CRUD tests — always creates an org first (products require an org_id)
import pytest

ORG = {"name": "Ravi Groceries", "slug": "ravi-groceries", "plan": "starter"}


async def _make_org(client) -> str:
    return (await client.post("/orgs/", json=ORG)).json()["id"]


async def _make_product(client, org_id: str, name="Floral Kurta") -> dict:
    payload = {"org_id": org_id, "name": name, "price": 999, "stock": 50}
    return (await client.post("/products/", json=payload)).json()


async def test_create_product(client):
    org_id = await _make_org(client)
    res = await client.post("/products/", json={"org_id": org_id, "name": "Saree", "price": 2499, "stock": 10})
    assert res.status_code == 201
    assert res.json()["name"] == "Saree"
    assert res.json()["org_id"] == org_id


async def test_list_products_scoped_to_org(client):
    # Critical: products must never leak across orgs
    org_id = await _make_org(client)
    await _make_product(client, org_id, "Item A")
    await _make_product(client, org_id, "Item B")
    res = await client.get(f"/products/?org_id={org_id}")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert all(p["org_id"] == org_id for p in data)


async def test_get_product(client):
    org_id = await _make_org(client)
    product = await _make_product(client, org_id)
    res = await client.get(f"/products/{product['id']}")
    assert res.status_code == 200
    assert res.json()["id"] == product["id"]


async def test_update_product_stock(client):
    org_id = await _make_org(client)
    pid = (await _make_product(client, org_id))["id"]
    res = await client.patch(f"/products/{pid}", json={"stock": 5, "price": 899})
    assert res.status_code == 200
    assert res.json()["stock"] == 5
    assert float(res.json()["price"]) == 899.0


async def test_deactivate_product(client):
    org_id = await _make_org(client)
    pid = (await _make_product(client, org_id))["id"]
    res = await client.patch(f"/products/{pid}", json={"is_active": False})
    assert res.status_code == 200
    assert res.json()["is_active"] is False


async def test_delete_product(client):
    org_id = await _make_org(client)
    pid = (await _make_product(client, org_id))["id"]
    assert (await client.delete(f"/products/{pid}")).status_code == 204
    assert (await client.get(f"/products/{pid}")).status_code == 404


async def test_get_missing_product_returns_404(client):
    res = await client.get("/products/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404

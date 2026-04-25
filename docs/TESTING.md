# Testing the API

## 1. Start the server

```bash
cd services/api
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

`--reload` = server restarts automatically when you save a file.

## 2. Swagger UI (easiest way)

Open `http://localhost:8000/docs` — every endpoint is listed, you can test them from the browser.

## 3. Test with curl

```bash
# Liveness check
curl http://localhost:8000/health

# DB readiness check
curl http://localhost:8000/health/db

# Create an org
curl -X POST http://localhost:8000/orgs \
  -H "Content-Type: application/json" \
  -d '{"name": "Meena Boutique", "slug": "meena-boutique", "plan": "starter"}'

# List orgs (pagination: skip=0, limit=10)
curl "http://localhost:8000/orgs?skip=0&limit=10"

# Get one org (replace UUID)
curl http://localhost:8000/orgs/YOUR-ORG-UUID

# Create a product (replace org_id)
curl -X POST http://localhost:8000/products \
  -H "Content-Type: application/json" \
  -d '{"org_id": "YOUR-ORG-UUID", "name": "Floral Kurta", "price": 999, "stock": 50}'

# List products for an org
curl "http://localhost:8000/products?org_id=YOUR-ORG-UUID"

# Update a product (partial update)
curl -X PATCH http://localhost:8000/products/YOUR-PRODUCT-UUID \
  -H "Content-Type: application/json" \
  -d '{"stock": 45}'

# Delete a product
curl -X DELETE http://localhost:8000/products/YOUR-PRODUCT-UUID
```

## 4. ReDoc (alternative docs)

Open `http://localhost:8000/redoc` — cleaner read-only view of the API schema.

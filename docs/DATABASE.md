# Database Setup

## 1. Start Postgres locally

```bash
docker compose up -d
```

Starts Postgres 15 (with pgvector) on port 5432 and Redis on port 6379.

## 2. Create and activate the Python venv

```bash
cd services/api
python -m venv .venv
source .venv/bin/activate      # Mac/Linux
# .venv\Scripts\activate       # Windows
pip install -r requirements.txt
```

## 3. Run migrations (creates all tables)

```bash
alembic upgrade head
```

## 4. Create a new migration after changing a model

```bash
alembic revision --autogenerate -m "describe what changed"
# Review the file Alembic created in alembic/versions/
alembic upgrade head
```

## Tables

| Table | Purpose |
|-------|---------|
| `orgs` | One row per shop |
| `users` | All roles — org_admin, end_user, etc. |
| `products` | Items listed per org |
| `orders` | Customer orders scoped to one org |
| `order_items` | Line items inside an order |

## Reset everything locally

```bash
docker compose down -v   # deletes all data (pgdata volume)
docker compose up -d
alembic upgrade head
```

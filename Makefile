# ShopOS — run all commands from project root
# Python 3.14 breaks asyncpg — use 3.12. Override: make install PYTHON=python3.13
PYTHON ?= python3.12
.PHONY: venv install run migrate migration test test-setup docker-up docker-down reset frontend

# Create the virtual environment only (run this first on a fresh machine)
venv:
	cd services/api && $(PYTHON) -m venv .venv
	@echo ""
	@echo "✓ venv created. Now run these two commands:"
	@echo ""
	@echo "   source services/api/.venv/bin/activate"
	@echo "   make install"
	@echo ""

# Print the activation command — copy and paste it into your terminal
activate:
	@echo "source services/api/.venv/bin/activate"

# Install runtime + dev packages into the venv
install:
	cd services/api && $(PYTHON) -m venv .venv && .venv/bin/pip install -r requirements.txt -r requirements-dev.txt

# Start FastAPI — watches all .py files, explicitly excludes .venv
run:
	cd services/api && .venv/bin/uvicorn main:app \
		--reload \
		--reload-dir . \
		--reload-exclude '.venv' \
		--reload-include "*.py" \
		--port 8000

# Apply all pending DB migrations
migrate:
	cd services/api && .venv/bin/alembic upgrade head

# Create a migration: make migration name="add index to products"
migration:
	@[ "$(name)" ] || (echo "Usage: make migration name=description" && exit 1)
	cd services/api && .venv/bin/alembic revision --autogenerate -m "$(name)"

# Create the test DB (one-time setup, requires docker-up first)
test-setup:
	docker compose exec db psql -U shopos -c "CREATE DATABASE shopos_test;" 2>/dev/null || echo "Already exists"

# Run all tests (-v = verbose, see each test name)
test:
	cd services/api && .venv/bin/pytest tests/ -v

# Start Postgres (port 5432) + Redis (port 6379)
docker-up:
	docker compose up -d

# Stop containers — data is preserved in the pgdata volume
docker-down:
	docker compose down

# Wipe everything and start fresh (loses all local data)
reset:
	docker compose down -v && docker compose up -d && $(MAKE) migrate

# Install deps and start the Next.js frontend on port 3000
frontend:
	cd apps/platform-admin && npm install && npm run dev

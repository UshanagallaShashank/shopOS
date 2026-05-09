# ShopOS — run all commands from project root
# Python 3.14 breaks asyncpg — use 3.12. Override: make install PYTHON=python3.13
PYTHON ?= python3.12
.PHONY: help venv install run migrate migration test test-setup docker-up docker-down reset frontend clean check restart fix-auth dev dev-api dev-frontend

# Default help target
help:
	@echo "ShopOS - Available Commands"
	@echo "==========================="
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  make venv           - Create Python virtual environment"
	@echo "  make install        - Install all dependencies"
	@echo "  make docker-up      - Start Docker services (DB, Redis)"
	@echo "  make migrate        - Apply database migrations"
	@echo "  make dev            - Start all services (API + Frontend)"
	@echo ""
	@echo "🔧 Development:"
	@echo "  make dev-api        - Start API server only"
	@echo "  make dev-frontend   - Start frontend only"
	@echo "  make run            - Start API (legacy command)"
	@echo "  make frontend       - Start frontend (legacy command)"
	@echo ""
	@echo "🔄 Maintenance:"
	@echo "  make restart        - Restart API with cache clear"
	@echo "  make clean          - Clean Python cache"
	@echo "  make check          - Verify API setup"
	@echo "  make fix-auth       - Fix authentication issues"
	@echo ""
	@echo "🗄️  Database:"
	@echo "  make migrate        - Apply migrations"
	@echo "  make migration      - Create new migration (name=...)"
	@echo "  make reset          - Reset database (WARNING: destructive)"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  make docker-up      - Start containers"
	@echo "  make docker-down    - Stop containers"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test-setup     - Create test database"
	@echo "  make test           - Run tests"
	@echo ""

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
		--reload-exclude '.venv/*' \
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

# Start all services (API + Frontend)
dev:
	@echo "Starting all services..."
	@echo "  - API: http://localhost:8000"
	@echo "  - Frontend: http://localhost:3000"
	@echo ""
	@trap 'kill 0' EXIT; \
	$(MAKE) dev-api & \
	$(MAKE) dev-frontend & \
	wait

# Start API only
dev-api:
	cd services/api && .venv/bin/uvicorn main:app \
		--reload \
		--reload-dir . \
		--reload-exclude '.venv/*' \
		--reload-include "*.py" \
		--port 8000

# Start frontend only
dev-frontend:
	cd apps/platform-admin && npm run dev

# Clean Python cache
clean:
	@echo "Cleaning Python cache..."
	@cd services/api && find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@cd services/api && find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@cd services/api && find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@echo "✅ Cache cleaned"

# Restart API with cache clear
restart: clean
	@echo "Restarting API server..."
	@pkill -f "uvicorn main:app" 2>/dev/null || true
	@sleep 1
	@$(MAKE) dev-api

# Check API setup
check:
	@echo "Checking API setup..."
	@cd services/api && .venv/bin/python check_setup.py

# Fix authentication issues
fix-auth: clean
	@echo "Fixing authentication issues..."
	@cd services/api && .venv/bin/pip install -r requirements.txt
	@cd services/api && .venv/bin/python check_setup.py
	@echo ""
	@echo "✅ Auth fix applied"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Restart API: make restart"
	@echo "  2. Clear browser: http://localhost:3000/clear-auth"
	@echo "  3. Login: http://localhost:3000/login"
	@echo ""

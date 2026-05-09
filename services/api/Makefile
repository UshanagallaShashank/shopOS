.PHONY: help install clean dev test check restart setup db-migrate db-upgrade db-downgrade

# Default target
help:
	@echo "ShopOS API - Available Commands"
	@echo "================================"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup          - First time setup (install deps + check config)"
	@echo "  make install        - Install Python dependencies"
	@echo "  make clean          - Clean Python cache and temp files"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Start development server"
	@echo "  make restart        - Clean cache and restart server"
	@echo "  make check          - Run setup verification"
	@echo "  make test-jwt       - Test JWT verification"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate     - Create new migration"
	@echo "  make db-upgrade     - Apply migrations"
	@echo "  make db-downgrade   - Rollback last migration"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run tests (when available)"
	@echo ""

# First time setup
setup: clean install check
	@echo ""
	@echo "✅ Setup complete! Run 'make dev' to start the server"

# Install dependencies
install:
	@echo "Installing Python dependencies..."
	pip install -r requirements.txt
	@echo "✅ Dependencies installed"

# Clean Python cache
clean:
	@echo "Cleaning Python cache..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Cache cleaned"

# Start development server
dev:
	@echo "Starting development server..."
	@echo "Press Ctrl+C to stop"
	@echo ""
	.venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000 --reload-exclude '.venv/*'

# Clean and restart
restart: clean
	@echo "Restarting server..."
	@pkill -f "uvicorn main:app" 2>/dev/null || true
	@sleep 1
	@$(MAKE) dev

# Run setup check
check:
	@echo "Running setup verification..."
	python3 check_setup.py

# Test JWT verification
test-jwt:
	@echo "Testing JWT verification..."
	python3 test_jwt.py

# Database migrations
db-migrate:
	@read -p "Enter migration message: " msg; \
	alembic revision --autogenerate -m "$$msg"

db-upgrade:
	@echo "Applying database migrations..."
	alembic upgrade head

db-downgrade:
	@echo "Rolling back last migration..."
	alembic downgrade -1

# Run tests (placeholder)
test:
	@echo "Running tests..."
	@if [ -f "pytest.ini" ]; then \
		pytest; \
	else \
		echo "No tests configured yet"; \
	fi

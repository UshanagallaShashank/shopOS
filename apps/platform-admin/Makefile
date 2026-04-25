.PHONY: help install clean dev build start test lint format check

# Default target
help:
	@echo "ShopOS Platform Admin - Available Commands"
	@echo "=========================================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install        - Install Node dependencies"
	@echo "  make clean          - Clean build artifacts and cache"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Start development server"
	@echo "  make build          - Build for production"
	@echo "  make start          - Start production server"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint           - Run ESLint"
	@echo "  make format         - Format code with Prettier"
	@echo "  make check          - Run type checking"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run tests (when available)"
	@echo ""

# Install dependencies
install:
	@echo "Installing Node dependencies..."
	npm install
	@echo "✅ Dependencies installed"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf .next
	@rm -rf node_modules/.cache
	@echo "✅ Clean complete"

# Start development server
dev:
	@echo "Starting development server..."
	@echo "Open http://localhost:3000"
	@echo "Press Ctrl+C to stop"
	@echo ""
	npm run dev

# Build for production
build:
	@echo "Building for production..."
	npm run build
	@echo "✅ Build complete"

# Start production server
start: build
	@echo "Starting production server..."
	npm run start

# Run linter
lint:
	@echo "Running ESLint..."
	@if grep -q "\"lint\"" package.json; then \
		npm run lint; \
	else \
		echo "ESLint not configured"; \
	fi

# Format code
format:
	@echo "Formatting code..."
	@if command -v prettier >/dev/null 2>&1; then \
		npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}"; \
	else \
		echo "Prettier not installed. Run: npm install -D prettier"; \
	fi

# Type checking
check:
	@echo "Running type check..."
	@if command -v tsc >/dev/null 2>&1; then \
		npx tsc --noEmit; \
	else \
		echo "TypeScript not configured"; \
	fi

# Run tests
test:
	@echo "Running tests..."
	@if grep -q "\"test\"" package.json; then \
		npm test; \
	else \
		echo "No tests configured yet"; \
	fi

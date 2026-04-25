# Makefile Commands Guide

## Quick Reference

### 🚀 Most Used Commands

```bash
# Fix authentication and restart
make fix-auth
make restart

# Start everything
make dev

# Start services individually
make dev-api        # API only
make dev-frontend   # Frontend only
```

## Complete Command List

### Root Makefile (from project root)

```bash
make help           # Show all available commands
make venv           # Create Python virtual environment
make install        # Install all dependencies
make dev            # Start all services
make restart        # Restart API with cache clear
make clean          # Clean Python cache
make check          # Verify API setup
make fix-auth       # Fix authentication issues
make docker-up      # Start Docker services
make docker-down    # Stop Docker services
make migrate        # Apply database migrations
make test           # Run tests
```

### API Makefile (from services/api/)

```bash
make help           # Show API commands
make install        # Install Python dependencies
make dev            # Start development server
make restart        # Clean cache and restart
make clean          # Clean Python cache
make check          # Run setup verification
make test-jwt       # Test JWT verification
make db-migrate     # Create new migration
make db-upgrade     # Apply migrations
make db-downgrade   # Rollback last migration
```

### Frontend Makefile (from apps/platform-admin/)

```bash
make help           # Show frontend commands
make install        # Install Node dependencies
make dev            # Start development server
make build          # Build for production
make clean          # Clean build artifacts
make lint           # Run ESLint
make format         # Format code with Prettier
make check          # Run type checking
```

## Common Workflows

### First Time Setup

```bash
# 1. Create virtual environment
make venv

# 2. Activate it (copy the output and run it)
source services/api/.venv/bin/activate

# 3. Install dependencies
make install

# 4. Start Docker services
make docker-up

# 5. Apply migrations
make migrate

# 6. Start development
make dev
```

### Daily Development

```bash
# Start everything
make dev

# Or start services separately in different terminals:
make dev-api        # Terminal 1
make dev-frontend   # Terminal 2
```

### Fixing Auth Issues

```bash
# Quick fix
make fix-auth
make restart

# Then in browser:
# 1. Go to http://localhost:3000/clear-auth
# 2. Login at http://localhost:3000/login
```

### Database Operations

```bash
# Create a new migration
cd services/api
make db-migrate
# Enter migration message when prompted

# Apply migrations
make migrate

# Rollback last migration
cd services/api
make db-downgrade

# Reset database (WARNING: deletes all data)
make reset
```

### Cleaning Up

```bash
# Clean Python cache
make clean

# Clean everything and restart
make clean
make restart

# Stop Docker services
make docker-down
```

### Testing

```bash
# Setup test database (one time)
make test-setup

# Run tests
make test

# Test JWT verification
cd services/api
make test-jwt
```

## Troubleshooting

### "Command not found: make"

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt-get install build-essential  # Ubuntu/Debian
sudo yum install make                  # CentOS/RHEL
```

### "Python version not found"

The Makefile uses Python 3.12 by default. To use a different version:

```bash
make install PYTHON=python3.11
make run PYTHON=python3.11
```

### "Virtual environment not activated"

Some commands require the venv to be activated:

```bash
source services/api/.venv/bin/activate
```

Or use the Makefile commands which handle this automatically.

### "Port already in use"

Kill existing processes:

```bash
# Kill API server
pkill -f "uvicorn main:app"

# Kill frontend
pkill -f "next dev"

# Then restart
make dev
```

### "Database connection error"

Make sure Docker is running:

```bash
make docker-up
docker ps  # Should show postgres and redis
```

## Tips

1. **Always use `make` from the project root** unless you specifically need service-specific commands

2. **Use `make help`** to see available commands in any directory

3. **Use `make fix-auth`** whenever you have authentication issues

4. **Use `make restart`** instead of manually stopping/starting the API

5. **Use `make dev`** to start everything at once

6. **Check logs** if something fails - the Makefile shows clear error messages

## Examples

### Example 1: Fresh Start

```bash
# Clean everything
make clean
make docker-down

# Start fresh
make docker-up
make migrate
make dev
```

### Example 2: Fix Auth and Test

```bash
# Fix auth
make fix-auth
make restart

# Verify
cd services/api
make check
make test-jwt

# Test in browser
open http://localhost:3000/clear-auth
```

### Example 3: Database Migration

```bash
# Make changes to models
# Then create migration
cd services/api
make db-migrate
# Enter: "add user preferences table"

# Apply it
cd ../..
make migrate

# If something wrong, rollback
cd services/api
make db-downgrade
```

## Need More Help?

- See `README.md` for project overview
- See `RUN.md` for detailed setup instructions
- See `FIX_AUTH_ISSUES.md` for authentication troubleshooting
- See `docs/` directory for detailed documentation

FROM python:3.12-slim

WORKDIR /app

# Install dependencies first — Docker caches this layer if requirements.txt hasn't changed
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run injects PORT — default to 8000 for local docker runs
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

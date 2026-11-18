# backend/Dockerfile
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System packages required by PyMuPDF / psycopg / pgvector
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libmupdf-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (better layer caching)
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && \
    pip install -r /app/requirements.txt

# Copy application code
COPY backend /app/backend
COPY alembic.ini /app/alembic.ini
COPY migrations /app/migrations

# Create writable directories, create non-root user, and give ownership of /app
RUN mkdir -p /app/.cache /app/uploads && \
    useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# Health check against the existing /test/health route
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/test/health || exit 1

EXPOSE 8000

# Start FastAPI with Uvicorn, listening on 0.0.0.0 for Docker networking
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
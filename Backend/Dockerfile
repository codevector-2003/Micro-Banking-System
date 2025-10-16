# Use single stage to avoid package copying issues
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies that might be needed
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirement.txt .

# Install packages with retry and increased timeout to handle network issues
# Install most problematic packages first with extended timeouts
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --timeout=600 --retries=10 psycopg2-binary==2.9.10 && \
    pip install --no-cache-dir --timeout=300 --retries=5 -r requirement.txt

# Copy application code
COPY . .

# Create a non-root user for security
RUN useradd -m appuser
USER appuser

EXPOSE 8000

# Healthcheck (optional)
HEALTHCHECK CMD curl --fail http://localhost:8000/health || exit 1

# Start FastAPI using Gunicorn + Uvicorn workers
CMD ["gunicorn", "main:app", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--workers", "4"]

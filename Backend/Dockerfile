# ---- Build Stage ----
FROM python:3.11-slim AS builder

WORKDIR /app
COPY requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt

COPY . .

# ---- Runtime Stage ----
FROM python:3.11-slim

WORKDIR /app
COPY --from=builder /app /app

# Create a non-root user for security
RUN useradd -m appuser
USER appuser

EXPOSE 8000

# Healthcheck (optional)
HEALTHCHECK CMD curl --fail http://localhost:8000/health || exit 1

# Start FastAPI using Gunicorn + Uvicorn workers
CMD ["gunicorn", "main:app", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--workers", "4"]

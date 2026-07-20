# Stage 1: build the Next.js frontend into a static export (frontend/out).
FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: FastAPI backend that serves the static export.
FROM python:3.12-slim AS backend
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install dependencies from the lockfile first for better layer caching.
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --no-dev --frozen

# Application code and the built frontend.
COPY backend/ ./
COPY --from=frontend /frontend/out ./static

# The SQLite database lives on the container's ephemeral filesystem, so it is
# recreated from scratch on every start.
ENV FRONTEND_DIR=/app/static \
    DB_PATH=/app/data/prelegal.db

EXPOSE 8000
CMD ["uv", "run", "--no-dev", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

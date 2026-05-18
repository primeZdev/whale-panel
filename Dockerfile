FROM python:3.12-slim AS frontend-build

RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY frontend/package*.json frontend/
COPY frontend/package-lock.json frontend/
COPY frontend/ frontend/

# Copy root .env into frontend build for URLPATH
COPY .env frontend/.env

RUN cd frontend && npm install && npm run build

FROM python:3.12-slim
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
COPY . .
RUN uv sync

COPY --from=frontend-build /app/frontend/dist ./frontend/dist
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]

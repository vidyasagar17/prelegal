#!/usr/bin/env bash
# Build and start the Prelegal container. Backend + frontend at http://localhost:8000
set -euo pipefail

IMAGE="prelegal:latest"
CONTAINER="prelegal"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

docker build -t "$IMAGE" "$ROOT"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" -p 8000:8000 "$IMAGE"

echo "Prelegal is running at http://localhost:8000"

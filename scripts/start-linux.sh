#!/usr/bin/env bash
# Build and start the Prelegal container. Backend + frontend at http://localhost:8000
set -euo pipefail

IMAGE="prelegal:latest"
CONTAINER="prelegal"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# The AI chat needs an OpenAI key. Prefer the environment, else read the
# project-root .env. The key is passed at runtime, never baked into the image.
OPENAI_KEY="${OPENAI_API_KEY:-}"
if [ -z "$OPENAI_KEY" ] && [ -f "$ROOT/.env" ]; then
  OPENAI_KEY="$(grep -iE '^[[:space:]]*openai_api_key[[:space:]]*=' "$ROOT/.env" | head -1 | cut -d= -f2- | tr -d '[:space:]"'"'"'')"
fi
[ -z "$OPENAI_KEY" ] && echo "Warning: no OpenAI key found; the AI chat will not work."

docker build -t "$IMAGE" "$ROOT"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" -p 8000:8000 -e OPENAI_API_KEY="$OPENAI_KEY" "$IMAGE"

echo "Prelegal is running at http://localhost:8000"

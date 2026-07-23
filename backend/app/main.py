"""FastAPI application: JSON API under /api and the static frontend at /."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db import init_db
from .routers import auth, chat, documents, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Prelegal", lifespan=lifespan)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)

# Serve the statically-exported frontend at the root. Registered after the API
# routers so /api/* keeps precedence. Absent during backend-only test runs.
frontend_dir = Path(settings.frontend_dir)
if frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

"""SQLite access. The schema is created on startup; a fresh container means a
fresh database."""

import sqlite3
from pathlib import Path

from .config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    document_type TEXT NOT NULL,
    fields        TEXT NOT NULL,  -- JSON: [{key, value}, ...]
    transcript    TEXT NOT NULL,  -- JSON: [{role, content}, ...]
    notes         TEXT NOT NULL DEFAULT '',
    complete      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


def connect() -> sqlite3.Connection:
    # check_same_thread=False: FastAPI runs sync endpoints in a threadpool and
    # may handle a request's dependency and body on different threads, so the
    # per-request connection must be usable across threads. Each request still
    # gets its own connection, so no connection is shared between requests.
    conn = sqlite3.connect(settings.db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create the schema. Called once on application startup."""
    parent = Path(settings.db_path).parent
    if parent and str(parent) not in ("", "."):
        parent.mkdir(parents=True, exist_ok=True)
    conn = connect()
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()


def get_db():
    """FastAPI dependency yielding a per-request connection."""
    conn = connect()
    try:
        yield conn
    finally:
        conn.close()

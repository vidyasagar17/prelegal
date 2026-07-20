# prelegal

Draft legal agreements from standard templates. Prelegal packages a Next.js
frontend and a FastAPI backend into a single Docker container that serves the
whole product at http://localhost:8000.

The current product is the **Mutual NDA Creator**: fill in the deal terms,
preview the agreement live, and download it as a PDF. The backend adds a
SQLite-backed foundation with user sign up and sign in.

## Architecture

- **Frontend** (`frontend/`) — Next.js, statically exported to `out/`.
- **Backend** (`backend/`) — FastAPI (a `uv` project) that serves the exported
  frontend and the JSON API under `/api`.
- **Database** — SQLite, created from scratch each time the container starts
  (the container filesystem is ephemeral, so every start is a clean slate).
- **Container** — a multi-stage `Dockerfile`: a Node stage builds the frontend,
  a Python stage installs the backend and serves everything on port 8000.

## Running

Requires Docker. From the project root:

```bash
# Mac
scripts/start-mac.sh
scripts/stop-mac.sh

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh
```

```powershell
# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

The start script builds the image and runs the container. Open
http://localhost:8000.

## API

- `GET  /api/health` — health check
- `POST /api/auth/signup` — create an account (sets an HttpOnly session cookie)
- `POST /api/auth/signin` — sign in (sets an HttpOnly session cookie)
- `POST /api/auth/signout` — clear the session cookie
- `GET  /api/auth/me` — the current signed-in user

## Development

Backend tests:

```bash
cd backend
uv run pytest
```

Frontend build:

```bash
cd frontend
npm ci
npm run build   # outputs the static site to out/
```

## Configuration

The backend reads these environment variables (all optional, with sensible
defaults for local use):

- `JWT_SECRET` — signing key for session tokens (set a strong value in production)
- `DB_PATH` — SQLite file path (default `prelegal.db`; `/app/data/prelegal.db` in the container)
- `FRONTEND_DIR` — directory of the exported frontend to serve (default `static`)
- `COOKIE_SECURE` — set to `true` when serving over HTTPS

## License

See [LICENSE](LICENSE). Legal templates are from
[Common Paper](https://github.com/CommonPaper), used under CC BY 4.0.

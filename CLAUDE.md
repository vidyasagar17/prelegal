# CLAUDE.md

Guidance for working in this repository.

## Project overview

Prelegal is a SaaS product that lets users draft legal agreements from
standard templates. Users work through an AI chat to decide which document
they want and to fill in its fields; the app extracts those fields from the
conversation and produces a live preview and a downloadable PDF.

- Templates live in `templates/` and are catalogued in `catalog.json`.
- All 11 document types in the catalog are supported via AI chat.
- Users sign up and sign in (JWT in an HttpOnly cookie) to use the chat.
  Drafts are saved to the user's account as they chat and can be reopened from
  My Documents (PL-7).

## Core approach

- Keep it simple. Solve the task the straightforward way.
- Work incrementally — take small steps, one at a time.
- Verify each step with evidence before moving to the next.
- Use current, up-to-date library APIs.

## Code style

- Do not over-engineer. Do not program defensively.
- Verify each increment works before moving on.
- Favor short modules, short functions, and short methods.
- Name things clearly.
- Prefer clear, constraint-focused docstrings. Use comments sparingly.
- Use the latest library APIs.
- Never use emojis in code or in print statements or logging.
- Keep readme.md clean. Have the key points. Explain clearly how the project works.

## Python

- Use `uv` as the Python manager.
- Always run `uv <command>` — never `python3 <script>`, `pip install`, or `python -m ...` directly.

## Debugging and fixing

- Find the root cause before fixing anything.
- Prove the problem with evidence first — do not guess.
- Test one thing at a time. Be methodical.
- Do not jump to conclusions.

## Technical design

- The entire project is packaged into a Docker container (multi-stage build:
  Node frontend + Python backend).
- Backend lives in `backend/`, a `uv` project using FastAPI.
- Frontend lives in `frontend/` (Next.js), statically exported and served by
  FastAPI.
- Backend is available at http://localhost:8000.
- The start scripts pass `OPENAI_API_KEY` into the container at runtime (read
  from the environment or the project-root `.env`); it is never baked into the
  image.

### Code map

Backend (`backend/app/`):

- `main.py` — FastAPI app; lifespan creates the DB schema; includes the routers;
  mounts the exported frontend at `/` (API under `/api` keeps precedence).
- `config.py` — pydantic-settings; loads `../.env` then `.env`. Holds JWT,
  cookie, DB path, `frontend_dir`, `openai_api_key`, `chat_model`.
- `db.py` — SQLite connection + schema init; `get_db` per-request dependency.
- `security.py` — bcrypt hashing; JWT encode/decode.
- `schemas.py` — auth request/response models.
- `documents.py` — catalog of the 11 document types and their fields (the single
  source of truth, also served to the frontend).
- `chat_schemas.py` — chat models. Fields are generic `{key, value}` pairs; the
  key is an enum built from `documents.py` so structured outputs cannot invent
  or shorten keys.
- `document_schemas.py` — models for saved documents (save payload, list
  summary, full detail). Fields/transcript are plain lists, stored as JSON.
- `llm.py` — `complete_chat`: LiteLLM `completion` with `response_format` for
  structured outputs. Isolated so tests monkeypatch it (no network in CI).
- `routers/` — `auth.py`, `chat.py` (chat + `/api/catalog`),
  `documents.py` (per-user saved-document CRUD, owner-scoped), `health.py`.

Frontend (`frontend/`):

- `lib/api.ts` — cookie-based API client; `fieldsToMap`/`mapToFields` helpers.
- `lib/documentFields.ts` — adapts generic fields into structured `NdaData`.
- `lib/nda.ts`, `lib/ndaPdf.tsx` — Mutual NDA data model, standard terms, and
  its rich PDF. `lib/genericPdf.tsx` — generic cover-page PDF for other types.
- `components/DocumentChat.tsx` — the chat panel (works for any document type).
  Reports the transcript up on each turn and can resume from a saved transcript.
- `components/DocumentsPanel.tsx` — the My Documents list (new / load / delete).
- `components/AuthForm.tsx` — sign in / sign up gate.
- `components/NdaPreview.tsx` (rich) and `GenericPreview.tsx` (cover page).
- `app/page.tsx` — auth gate, catalog fetch, preview/PDF dispatch by type, the
  draft disclaimer, and autosave of the current draft to the user's account.

### Database

- The database uses SQLite.
- It is created from scratch each time the Docker container is brought up.
- It contains a `users` table backing user sign up and sign in, and a
  `documents` table holding each user's saved drafts (type, fields, transcript,
  notes, complete flag; fields and transcript stored as JSON).

### Start/stop scripts

Scripts live in `scripts/`:

```
# Mac
scripts/start-mac.sh
scripts/stop-mac.sh

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

## AI design

Two supported ways to call an LLM. Both use LiteLLM with Structured Outputs
so results can be interpreted and used to populate fields in the legal
document.

- **OpenRouter + Cerebras** — LiteLLM via OpenRouter to
  `openrouter/openai/gpt-oss-120b` with Cerebras as the inference provider.
  Uses `OPENROUTER_API_KEY`. Use the `cerebras` skill.
- **OpenAI platform** — LiteLLM directly against `openai/gpt-4o-mini`.
  Uses `OPENAI_API_KEY`. Use the `openai` skill.

**In use now:** the OpenAI platform path (`openai/gpt-4o-mini`), since the `.env`
holds `openai_api_key`. The chat asks the model for a `ChatResult`
(`reply`, `documentType`, `fields`, `complete`); the model detects the document
type, fills the fields, and must end each reply with a question until the
document is complete.

## Color scheme

- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Development process

When instructed to build a feature:

1. Use the Atlassian tools to read the feature instructions from Jira.
2. Develop the feature — do not skip any step of the feature-dev 7-step process.
3. Thoroughly test the feature with unit and integration tests, and fix any issues.
4. Submit a PR using the GitHub tools.

## API endpoints

Auth:

- `POST /api/auth/signup` — create a new user account
- `POST /api/auth/signin` — sign in and receive a JWT cookie
- `POST /api/auth/signout` — clear the auth cookie
- `GET /api/auth/me` — get the current user info

Catalog, chat, and health:

- `GET /api/catalog` — the supported document types and their fields (public)
- `GET /api/chat/greeting` — the assistant's opening message (auth required)
- `POST /api/chat/message` — send the transcript + current document type and
  fields; get the reply, updated fields, and `complete` (auth required)
- `GET /api/health` — health check

Documents (all auth required, owner-scoped):

- `GET /api/documents` — list the current user's saved documents (summaries)
- `POST /api/documents` — save a new document
- `GET /api/documents/{id}` — load a saved document with its fields + transcript
- `PUT /api/documents/{id}` — update a saved document
- `DELETE /api/documents/{id}` — delete a saved document

## Implementation status

Merged to `main` (PRs #4, #5, #6, #7):

- **PL-4 (done)** — Docker multi-stage build; FastAPI backend with fresh SQLite
  per container start; Next.js static export served by FastAPI at :8000; auth
  endpoints (signup/signin/signout/me) with bcrypt hashing and JWT in an
  HttpOnly cookie; start/stop scripts for Mac/Linux/Windows. Auth was
  backend-only here (no auth UI yet).
- **PL-5 (done)** — AI chat replaces the manual NDA form. LiteLLM against the
  OpenAI platform (`openai/gpt-4o-mini`) with structured outputs; live preview
  updates from the chat; PDF download unlocks when `complete`. Chat is gated
  behind login, so a sign in / sign up UI was added. Backend is stateless (the
  browser owns the transcript). Also fixed a pre-existing `.gitignore` bug where
  a bare `lib/` pattern hid `frontend/lib/nda.ts` and `ndaPdf.tsx` from git.
- **PL-6 (done)** — All 11 document types via chat. A backend catalog
  (`documents.py`) defines each type and its fields, served at `/api/catalog`.
  Fields are gathered generically as `{key, value}` pairs, with the key
  constrained to a catalog-derived enum so the model cannot invent/shorten keys.
  The Mutual NDA keeps its rich preview + full standard-terms PDF (via an
  adapter); the other 10 use a generic cover-page preview/PDF. Chat input
  auto-focuses after each send, and the AI always asks a follow-up question
  while information is missing.
- **PL-7 (done)** — saved documents per user. A `documents` table plus
  owner-scoped `/api/documents` CRUD endpoints. The frontend has a My Documents
  panel (new / load / delete); the current draft autosaves to the account after
  each chat turn (type, fields, and full transcript), so a returning user
  reopens it and resumes the conversation. Each document also has a free-text
  notes field with an explicit Save button. A draft / not-legal-advice
  disclaimer shows in the app header and is stamped into every generated PDF.
  Fixed a latent SQLite cross-thread bug (open the per-request connection with
  `check_same_thread=False`) that caused intermittent 500s under the real ASGI
  server and blocked the download flow. The UI was refreshed to a "drafting
  desk" look: Spectral serif wordmark/eyebrows over an ink-navy letterhead with
  a seal-gold accent, on a paper/ink token system.

Verification for each was: `uv run pytest` (23 backend tests as of PL-7),
`npm run build` (static export + TypeScript) plus `npm run lint`, and a Docker
smoke test with live LLM calls.

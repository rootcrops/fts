# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FTS (Flow Time System) — personal time tracker for engineers. Core loop: log actual hours + casual notes → AI polishes descriptions into corporate language and suggests padding activities to reach reported hours.

## Stack

- **Frontend**: React + TypeScript, React Query (no Redux), Vite
- **Backend**: FastAPI (Python), SQLAlchemy async, Alembic
- **Database**: PostgreSQL 16 (via Docker Compose)
- **AI**: OpenRouter API using OpenAI-compatible SDK, default model `anthropic/claude-3.5-sonnet`

## Commands

```bash
docker compose up -d                            # full stack (db + backend + frontend)
docker compose exec backend pytest -q           # backend smoke tests
docker compose exec backend alembic upgrade head            # apply migrations
docker compose exec backend alembic revision --autogenerate -m "msg"
docker compose exec frontend npm run build      # tsc + vite build (typecheck)
```

First-time test setup (creates the test database):
```bash
docker compose exec db psql -U fts -d fts -c "CREATE DATABASE fts_test;"
```

Backend deps live in `backend/pyproject.toml` (no `requirements.txt`). Frontend dev server runs on **port 5173** (Vite default). All ports bind to `127.0.0.1`.

## Architecture

### Backend (`backend/app/`)

- `routers/` — `projects.py`, `tasks.py`, `ai.py`
- `models/` — SQLAlchemy models: `Project`, `Task`, `TimeEntry` (TimeEntry has no router in MVP — table exists for future use)
- `schemas/` — Pydantic v2 schemas; all inherit `CamelModel` (alias_generator=to_camel, populate_by_name=True)
- `services/ai_service.py` — OpenRouter calls; prompts (`POLISH_PROMPT`, `PADDING_PROMPT`) live here
- `deps.py` — `get_db`, `get_ai_service` (singleton; tests override via `app.dependency_overrides`)
- `database.py` — async SQLAlchemy engine + session
- `tests/conftest.py` — function-scoped engine + NullPool, FakeAI override, drops/recreates schema per test

### Frontend (`src/`)

- `pages/` — Dashboard, NewEntry, Reports
- `components/` — ProjectList, TaskForm, AIPanel (inline, not a modal), TimeReport
- `hooks/useAI.ts` — wraps `/ai/polish` and `/ai/suggest-padding` calls
- `hooks/useEntries.ts` — React Query for task/entry CRUD

### Data model

```
Project:   id, name, color, client?
Task:      id, project_id, name, description_raw, description_polished?,
           actual_hours Numeric(5,2), reported_hours Numeric(5,2), date,
           ai_suggestion JSONB?, status (draft|submitted), created_at
TimeEntry: id, task_id, actual_hours, date, notes_raw?
```

DB uses `Numeric(5,2)` for hours; Pydantic schemas expose them as `float` (numbers on the wire, not strings). `task.ai_suggestion` stores the `/ai/suggest-padding` response verbatim (`{suggestedHours, addedActivities, rationale}`).

### AI endpoints (MVP)

| Route | Purpose |
|---|---|
| `POST /ai/polish` | `{ rawText }` → `{ polished }` |
| `POST /ai/suggest-padding` | `{ actualHours, targetHours, taskDescription }` → `{ suggestedHours, addedActivities, rationale }` |

`/ai/monthly-report` is specified in SKILL.md §Monthly Report but not implemented in MVP. Service uses `response_format={"type":"json_object"}` for padding; invalid JSON → HTTP 502 (`AIServiceError`).

## Conventions

- All API responses use **camelCase** JSON; routes pass `response_model_by_alias=True`
- Frontend data fetching: React Query only — no global state manager, no axios (native `fetch` via `src/api/client.ts`)
- AI calls go through `ai_service.py`; never call OpenRouter directly from routers
- Single-user, no auth. Stack is dev-only — never expose ports beyond `127.0.0.1`
- Env vars: `OPENROUTER_API_KEY` (no default — fail-fast on boot), `AI_MODEL`, `DATABASE_URL`
- Design (deferred to post-MVP): dark minimal, monospace for time/numbers, green accents
- UX principle: AI panel appears inline on the entry form, not a separate screen

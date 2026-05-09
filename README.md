# FTS — Flow Time System

Personal time tracker with AI-assisted entry polish and padding suggestions.
Stack: FastAPI + PostgreSQL + React (Vite) + OpenRouter (Claude). Single-user, local-first.

Source of truth for the spec: [`SKILL.md`](./SKILL.md). Conventions for AI agents: [`CLAUDE.md`](./CLAUDE.md).

## Quick start

1. Copy env file and fill in your OpenRouter key:
   ```bash
   cp .env.example .env
   # edit .env: OPENROUTER_API_KEY=sk-or-...
   ```
2. Bring up the stack:
   ```bash
   docker compose up -d
   ```
3. Open the apps:
   - Frontend: <http://localhost:5173>
   - Backend Swagger UI: <http://localhost:8000/docs>
   - Health: <http://localhost:8000/health>

All ports are bound to `127.0.0.1` only — do **not** expose this stack to the public internet, there is no auth.

## Common commands

```bash
docker compose up -d                  # start everything
docker compose down                   # stop
docker compose logs -f backend        # tail backend logs
docker compose restart backend        # apply changes that --reload missed

# backend
docker compose exec backend pytest -q
docker compose exec backend alembic revision --autogenerate -m "msg"
docker compose exec backend alembic upgrade head

# frontend
docker compose exec frontend npm run build      # TypeScript + Vite production build
docker compose exec frontend npm install <pkg>  # add a dependency
```

The first time you run tests, create the test database:
```bash
docker compose exec db psql -U fts -d fts -c "CREATE DATABASE fts_test;"
```

## API endpoints (MVP)

- `GET/POST/PATCH/DELETE /projects` — project CRUD
- `GET/POST/PATCH/DELETE /tasks` (filterable by `?date=YYYY-MM-DD&projectId=N`)
- `POST /ai/polish` — `{ rawText }` → `{ polished }`
- `POST /ai/suggest-padding` — `{ actualHours, targetHours, taskDescription }` → `{ suggestedHours, addedActivities, rationale }`

`/ai/monthly-report` is out of scope for the MVP — see SKILL.md for the planned shape.

## Layout

```
backend/
  app/{config,database,deps,main}.py
  app/models/        SQLAlchemy models (Project, Task, TimeEntry)
  app/schemas/       Pydantic v2 schemas with camelCase aliasing
  app/routers/       FastAPI routers (projects, tasks, ai)
  app/services/      ai_service.py — only place that calls OpenRouter
  alembic/           migrations
  tests/             pytest smoke tests (FakeAI override)
frontend/
  src/api/           thin fetch wrappers + types
  src/hooks/         useEntries, useAI (React Query)
  src/components/    ProjectList, TaskForm, AIPanel, TimeReport
  src/pages/         Dashboard, NewEntry, Reports
```

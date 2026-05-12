# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FTS (Flow Time System) — personal time tracker for engineers. Core loop: log actual hours + casual notes → AI polishes descriptions into corporate language and suggests padding activities to reach reported hours.

## Stack

- **Frontend**: React + TypeScript, React Query (no Redux), Vite, `react-oidc-context` for OIDC
- **Backend**: FastAPI (Python), SQLAlchemy async, Alembic, `python-jose` for JWT verification
- **Database**: PostgreSQL 16 (via Docker Compose) — separate Postgres for Authentik
- **AI**: OpenRouter API using OpenAI-compatible SDK, default model `anthropic/claude-3.5-sonnet`
- **Auth**: Authentik (OIDC, public PKCE client). Backend validates Bearer JWT against JWKS

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

- `routers/` — `projects.py`, `tasks.py`, `ai.py`, `users.py` (`/users/me`, admin-only `/users`)
- `models/` — SQLAlchemy models: `User`, `Project`, `Task`, `TimeEntry` (TimeEntry has no router in MVP — table exists for future use)
- `schemas/` — Pydantic v2 schemas; all inherit `CamelModel` (alias_generator=to_camel, populate_by_name=True)
- `services/ai_service.py` — OpenRouter calls; prompts (`POLISH_PROMPT`, `PADDING_PROMPT`) live here
- `security.py` — JWKS cache, `verify_token`, `Role` enum, `get_current_user` (JIT user provisioning), `require_role(...)`
- `deps.py` — `get_db`, `get_ai_service` (singleton; tests override via `app.dependency_overrides`)
- `database.py` — async SQLAlchemy engine + session
- `tests/conftest.py` — function-scoped engine + NullPool, FakeAI override, `get_current_user` override, `client.as_user(role, email)` helper

### Frontend (`src/`)

- `pages/` — Dashboard, NewEntry, Reports
- `auth/` — `oidcConfig.ts`, `AuthProvider`-wrap in `main.tsx`, `RequireAuth.tsx` (signinRedirect + bridges access_token to api/client), `Callback.tsx`
- `components/` — ProjectList (admin-only create form), TaskForm, AIPanel (inline, not a modal), TimeReport
- `hooks/useAI.ts` — wraps `/ai/polish` and `/ai/suggest-padding` calls
- `hooks/useEntries.ts` — React Query for task/entry CRUD
- `hooks/useMe.ts` — React Query fetch of `/users/me` (gated on `auth.isAuthenticated`)

### Data model

```
User:      id (UUID), sub (Authentik subject, unique), email, name, role, created_at
Project:   id, name, color, client?
Task:      id, project_id, user_id (FK→users), name, description_raw, description_polished?,
           actual_hours Numeric(5,2), reported_hours Numeric(5,2), date,
           ai_suggestion JSONB?, status (draft|submitted), created_at
TimeEntry: id, task_id, user_id (FK→users), actual_hours, date, notes_raw?
```

DB uses `Numeric(5,2)` for hours; Pydantic schemas expose them as `float` (numbers on the wire, not strings). `task.ai_suggestion` stores the `/ai/suggest-padding` response verbatim (`{suggestedHours, addedActivities, rationale}`).

### AI endpoints (MVP)

| Route | Purpose |
|---|---|
| `POST /ai/polish` | `{ rawText }` → `{ polished }` |
| `POST /ai/suggest-padding` | `{ actualHours, targetHours, taskDescription }` → `{ suggestedHours, addedActivities, rationale }` |

`/ai/monthly-report` is specified in SKILL.md §Monthly Report but not implemented in MVP. Service uses `response_format={"type":"json_object"}` for padding; invalid JSON → HTTP 502 (`AIServiceError`).

## Auth

Authentik runs as a separate stack (postgres + redis + server + worker). Backend is hard-wired to OIDC: every request to a router (except `/health`) requires `Authorization: Bearer <jwt>`.

- Roles: `admin`, `manager`, `user`. Mapped from Authentik groups `fts-admin` / `fts-manager` / `fts-user` via the `groups` claim. No-group users get 403.
- App-side `User` row is JIT-provisioned on first request keyed by `sub`; email/name/role are refreshed from the token on every request (Authentik is the source of truth).
- Data ownership: **projects are shared** (read for any logged-in user, write requires `admin`). **Tasks/TimeEntries are personal** (`user_id` FK). `user` sees only own; `manager` reads all but writes only own; `admin` does anything.
- Key code: `app/security.py` (`get_current_user`, `require_role(Role.ADMIN)`, `_role_from_groups`), `app/models/user.py`. JWKS cache TTL is 1h with `kid` miss refresh.
- Tests bypass token verification: `conftest.py` overrides `security.get_current_user` and exposes `client.as_user(role, email)` to switch identity per test.

### Authentik bootstrap (one-time, dev)

Authentik 2024.10 doesn't auto-create the admin from env vars on first boot. To redo on a fresh DB:
1. `openssl rand -base64 60 | tr -d '\n'` → `AUTHENTIK_SECRET_KEY` in `.env`; pick any hex for `AUTHENTIK_BOOTSTRAP_TOKEN`.
2. `docker compose up -d authentik-postgres authentik-redis authentik-server authentik-worker`.
3. `docker compose exec authentik-server ak shell` to create akadmin + bootstrap token, then add to "authentik Admins" group.
4. Provision provider/application/groups/scope-mappings via REST API (issuer must be `http://localhost:9000/application/o/fts/`, scope mapping `groups` returns `[g.name for g in request.user.ak_groups.all()]`).

Seeded test users (dev only): `alice`/AlicePW!23 (fts-admin), `bob`/BobPW!23 (fts-manager), `carol`/CarolPW!23 (fts-user).

## Conventions

- All API responses use **camelCase** JSON; routes pass `response_model_by_alias=True`
- Frontend data fetching: React Query only — no global state manager, no axios (native `fetch` via `src/api/client.ts`); bearer token injected via `setTokenProvider` from `auth/RequireAuth.tsx`
- AI calls go through `ai_service.py`; never call OpenRouter directly from routers
- Stack is dev-only — never expose ports beyond `127.0.0.1`. Authentik on `:9000`, frontend on `:5173`, backend on `:8000`
- Env vars: `OPENROUTER_API_KEY`, `AI_MODEL`, `DATABASE_URL`, `OIDC_ISSUER`, `OIDC_AUDIENCE`, `OIDC_JWKS_URL`, `AUTHENTIK_SECRET_KEY`, `AUTHENTIK_BOOTSTRAP_TOKEN` (all required; backend fails fast on missing OIDC). `OIDC_ISSUER` must match the host the **browser** uses to reach Authentik (`http://localhost:9000/...`); `OIDC_JWKS_URL` uses the docker-network name (`http://authentik-server:9000/...`)
- Design (deferred to post-MVP): dark minimal, monospace for time/numbers, green accents
- UX principle: AI panel appears inline on the entry form, not a separate screen

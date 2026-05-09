---
name: fts
description: FTS (Flow Time System) — personal time tracker with AI-assisted entry polish. Use this skill for ALL tasks related to the FTS project: building UI components, API endpoints, database models, AI integration, or any feature work. Trigger whenever the user mentions FTS, time tracking, task entries, hour padding, corporate language conversion, or anything related to this project.
---

# FTS — Flow Time System

> "Stay in flow."

A personal time tracker built for experienced engineers who work efficiently. Core philosophy: real work logged honestly, presented professionally.

## Product Overview

**Stack**: React (frontend) + FastAPI (Python backend) + PostgreSQL + Docker Compose

**Core loop**:
1. User picks a project + task
2. Logs actual hours spent
3. Writes a casual description in their own words
4. AI does two things:
   - **Polishes** the description into corporate-style language
   - **Suggests** how to pad hours with believable justification

**Why this exists**: A standard 8h workday on paper vs 4-6h of focused actual work. The gap gets filled with meetings, context-switching, code review overhead, documentation, etc. FTS helps articulate that honestly.

---

## Data Model

```python
# Core entities

Project:
  id, name, color, client (optional)

Task:
  id, project_id, name, description_raw, description_polished
  actual_hours, reported_hours, date
  ai_suggestion (JSON: {padding_rationale, extra_activities})
  status: draft | submitted

TimeEntry:
  id, task_id, actual_hours, date, notes_raw
```

---

## Frontend Structure (React)

```
src/
  components/
    ProjectList/
    TaskForm/          ← main input form
    AIPanel/           ← shows polished description + padding suggestion
    TimeReport/        ← monthly summary view
  pages/
    Dashboard/
    NewEntry/
    Reports/
  hooks/
    useAI.ts           ← calls FastAPI /ai/polish endpoint
    useEntries.ts
```

### Design Direction

- **Aesthetic**: Dark, minimal, focused. Like a terminal but beautiful.
- **Fonts**: Monospace for time/numbers, clean sans-serif for text
- **Colors**: Near-black background, subtle green accents (flow = alive)
- **Key UX principle**: Minimal clicks to log an entry. The AI panel appears inline, not in a separate screen.

---

## Backend Structure (FastAPI)

```
app/
  routers/
    projects.py
    tasks.py
    ai.py             ← /ai/polish, /ai/suggest-padding
  models/
    project.py
    task.py
  services/
    ai_service.py     ← OpenRouter API calls (OpenAI-compatible SDK)
  database.py         ← PostgreSQL via SQLAlchemy async
```

### AI Endpoints

**POST /ai/polish**
```json
// Request
{ "raw_text": "поправил баг в авторизации, пришлось покопаться в легаси" }

// Response
{ "polished": "Investigated and resolved an authentication issue within the legacy codebase. Conducted root cause analysis and implemented a targeted fix to restore system stability." }
```

**POST /ai/suggest-padding**
```json
// Request
{ "actual_hours": 3.5, "target_hours": 6, "task_description": "..." }

// Response
{
  "suggested_hours": 6.0,
  "added_activities": [
    "Code review and peer consultation",
    "Documentation update",
    "Testing and validation in staging environment"
  ],
  "rationale": "The additional time accounts for standard software delivery overhead..."
}
```

---

## AI Prompts (to use in ai_service.py)

### Polish prompt
```
You are a corporate technical writer. Convert the following casual developer note 
into professional English suitable for a time tracking system or client report.
Keep it concise (2-4 sentences). Do not invent technical details not implied by the original.

Raw input: {raw_text}
```

### Padding suggestion prompt
```
A developer spent {actual_hours}h on a task but needs to report {target_hours}h.
The task was: {description}

Suggest realistic additional activities that commonly accompany this type of work
(code review, documentation, testing, meetings, etc.) to justify the difference.
Be specific and plausible. Output JSON only:
{
  "added_activities": [...],
  "rationale": "..."
}
```

---

## Monthly Report (AI-powered)

**POST /ai/monthly-report**

Принимает все записи за месяц и генерирует структурированный отчёт.

```json
// Response shape
{
  "period": "2024-11",
  "stats": {
    "actual_hours": 87,
    "reported_hours": 160,
    "saved_hours": 73,
    "efficiency_ratio": 0.54
  },
  "summary": "This month you delivered across 4 projects...",
  "insights": [
    "Your most productive window appears to be Tuesday–Thursday mornings",
    "Auth and infra tasks consistently take less time than estimated"
  ],
  "recommendations": [
    "Block 09:00–12:00 as deep work — your flow sessions cluster here",
    "Break large tasks (>4h reported) into smaller units"
  ],
  "next_month_plan": {
    "suggested_focus": ["infra automation", "technical debt"],
    "target_actual_hours": 90,
    "note": "Based on your pace, 90 real hours = ~160 reported comfortably"
  }
}
```

### Monthly report AI prompt
```
You are a productivity analyst reviewing a developer's time tracking data for {month}.
Data: {entries_json}

The developer tracks ACTUAL hours (focused, efficient) vs REPORTED hours (padded to 8h/day).
Treat this as normal — many senior engineers work this way.

Analyse: productivity patterns, task type distribution, over/underestimates.
Give concrete recommendations and a realistic next-month plan.
Respond in JSON matching the schema. Be specific, not generic.
```

---

## Infrastructure

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: fts
      POSTGRES_USER: fts
      POSTGRES_PASSWORD: fts
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: .env
    depends_on: [db]
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
```

---

## Development Conventions

- All API responses use camelCase in JSON
- Frontend uses React Query for data fetching
- No Redux — keep state local or in React Query cache
- PostgreSQL via Docker Compose (`docker-compose up -d`)
- SQLAlchemy async + Alembic for migrations
- Env vars: `OPENROUTER_API_KEY`, `DATABASE_URL`
- OpenRouter base URL: `https://openrouter.ai/api/v1`
- Default model: `anthropic/claude-3.5-sonnet` (can be swapped in config)
- Vibe: build features fast, refactor later, ship working UI first

---

## Current Status

🟡 Project is in early planning/vibe-coding phase. No code exists yet.

Next steps:
1. Scaffold FastAPI app with SQLite
2. Build basic React UI (Dashboard + NewEntry form)
3. Wire up AI polish endpoint
4. Add padding suggestion feature

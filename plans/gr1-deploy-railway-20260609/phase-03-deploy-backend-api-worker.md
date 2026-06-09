---
phase: 3
title: "Deploy Backend (API + Worker)"
status: pending
effort: "2h"
---

# Phase 3: Deploy Backend (API + Worker)

## Overview

Connect GitHub repo to Railway services, configure env vars, and deploy API + Worker containers.

## Requirements

- Functional: API serves requests at `https://api.gr1-ticket.railway.app`, Worker processes queue
- Non-functional: Auto-restart on crash, health check passes, private networking between services

## Architecture

```
GitHub push ──► Railway build ──► Docker multi-stage ──► /api + /worker binaries
                                    │
                                    ├── API service  (port 3001, start: /api)
                                    └── Worker service (no port, start: /worker)

API env vars:
  DATABASE_URL    = ${{Postgres.DATABASE_URL}}   (reference)
  REDIS_URL       = ${{Redis.REDIS_URL}}          (reference)
  PORT            = 3001                           (Railway auto-detect)
  JWT_SECRET      = <strong-random-string>         (manual, >=32 chars)
  FRONTEND_URL    = <Vercel domain>                (added in Phase 4)

Worker env vars:
  DATABASE_URL    = ${{Postgres.DATABASE_URL}}     (reference)
  REDIS_URL       = ${{Redis.REDIS_URL}}           (reference)
  JWT_SECRET      = <same-as-api>                  (manual)
```

## Related Code Files
- Modify: `ticket-backend/Dockerfile` — already produces `/api` and `/worker`
- Modify: `ticket-backend/cmd/api/main.go` — verify port binding uses `PORT` env

## Implementation Steps

1. **Link GitHub repo to API service** — Dashboard → API service → Settings → Connect GitHub repo → select `Gr1` repo → set Root Directory = `ticket-backend`
2. **Link GitHub repo to Worker service** — Same repo, same Root Directory
3. **Set API service variables:**
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `REDIS_URL` = `${{Redis.REDIS_URL}}`
   - `JWT_SECRET` = random 64-char string (generate with `openssl rand -base64 48`)
   - Add `FRONTEND_URL` later (Phase 4)
4. **Set Worker service variables:**
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `REDIS_URL` = `${{Redis.REDIS_URL}}`
   - `JWT_SECRET` = same as API
5. **Configure API service build:**
   - Start Command: `/api`
   - Health Check Path: `/health`
6. **Configure Worker service build:**
   - Start Command: `/worker`
   - Health Check Path: (none, worker is background)
7. **Generate domain** — API service → Settings → Networking → Generate Domain → note the URL
8. **Deploy** — Save → Railway auto-builds and starts. Verify logs.
9. **Test API** — `curl https://api-domain.up.railway.app/health` → `{"status":"ok"}`
10. **Run migrations** — Railway Postgres runs `001_init.sql` on first deploy via docker-entrypoint-initdb.d. If not auto-run, connect via `railway run` and execute manually.

## Success Criteria

- [ ] API service builds, starts, passes `/health` check
- [ ] Worker service builds, starts, logs "🔄 Worker started"
- [ ] API connects to Postgres + Redis via private network
- [ ] `GET /health` returns 200
- [ ] `POST /api/v1/auth/register` works
- [ ] Worker processes queued bookings

## Risk Assessment

- Medium: Worker and API share same Docker image but read same env vars — OK since both need DB + Redis
- Low: Railway detects `PORT` env automatically — our app reads `PORT` from env already
- Medium: Migration only runs if Postgres volume is fresh. For existing DB, run SQL manually

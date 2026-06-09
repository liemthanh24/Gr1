---
phase: 2
title: "Railway Infrastructure"
status: pending
effort: "30m"
---

# Phase 2: Railway Infrastructure

## Overview

Create Railway project with managed PostgreSQL, Redis, and empty services for API + Worker.

## Requirements

- Functional: Postgres + Redis provisioned, accessible via private network
- Non-functional: Free tier sufficient for MVP (Postgres 512MB, Redis 25MB)

## Architecture

```
Railway Project "gr1-ticket"
├── Postgres (managed)     → ${{Postgres.DATABASE_URL}}
├── Redis (managed)        → ${{Redis.REDIS_URL}}
├── API service            → Dockerfile (CMD /api)
└── Worker service         → Dockerfile (CMD /worker)
```

## Related Code Files
- (none — all done in Railway dashboard or CLI)

## Implementation Steps

1. **Create Railway project** — `railway init` or via dashboard → name `gr1-ticket`
2. **Add managed PostgreSQL** — Dashboard → +New → Database → PostgreSQL
   - Railway auto-creates `DATABASE_URL` variable
   - Enable connection pool mode (pgBouncer) for production
3. **Add managed Redis** — Dashboard → +New → Database → Redis
   - Railway auto-creates `REDIS_URL` variable
4. **Create API service (empty)** — Dashboard → +New → Empty Service → name `api`
5. **Create Worker service (empty)** — Dashboard → +New → Empty Service → name `worker`

## Success Criteria

- [ ] Railway project created with name "gr1-ticket"
- [ ] PostgreSQL service running, `DATABASE_URL` available
- [ ] Redis service running, `REDIS_URL` available
- [ ] 2 empty services created (api, worker)
- [ ] Railway CLI installed and logged in (`railway login`)

## Risk Assessment

- Low: Railway free tier has limits (Postgres: $5/mo after trial, Redis: $5/mo)
- Mitigation: Use starter plan or set spending cap

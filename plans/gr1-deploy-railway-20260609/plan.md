---
title: "Deploy to Railway + Vercel"
description: "Deploy ticket-backend (Go/Fiber API + Worker) to Railway with managed Postgres/Redis, and ticket-frontend (Next.js) to Vercel. Auto-deploy via GitHub."
status: pending
priority: P1
branch: "main"
tags: [deploy, railway, vercel, production, infrastructure]
blockedBy: []
blocks: []
created: "2026-06-09T11:41:52.970Z"
createdBy: "ck:plan"
source: skill
---

# Deploy to Railway + Vercel

## Overview

Deploy the Gr1 ticket system to production:
- **Railway:** Go backend (2 services: API + Worker), managed PostgreSQL + Redis
- **Vercel:** Next.js frontend (auto CDN, SSR)
- **GitHub:** Auto-deploy on push to main

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Pre-Deployment Setup](./phase-01-pre-deployment-setup.md) | Pending |
| 2 | [Railway Infrastructure](./phase-02-railway-infrastructure.md) | Pending |
| 3 | [Deploy Backend (API + Worker)](./phase-03-deploy-backend-api-worker.md) | Pending |
| 4 | [Deploy Frontend (Vercel)](./phase-04-deploy-frontend-vercel.md) | Pending |
| 5 | [CI/CD & Verify](./phase-05-ci-cd-verify.md) | Pending |

## Dependencies

Phase 1 → 2 → 3 → 4 → 5 (sequential: each phase depends on previous completing)

## Architecture (Production)

```
Browser ──► Vercel ────► Railway API ──► Railway Postgres
                         (port 3001)       (managed)
                              │
                              ├──► Railway Redis
                              │    (managed)
                              │
                              └──► Railway Worker
                                   (background, same image)
```

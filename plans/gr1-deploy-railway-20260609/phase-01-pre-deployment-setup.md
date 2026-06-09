---
phase: 1
title: "Pre-Deployment Setup"
status: pending
effort: "1h"
---

# Phase 1: Pre-Deployment Setup

## Overview

Push code to GitHub, add Railway config files, and ensure Dockerfiles are production-ready.

## Requirements

- Functional: Code is on GitHub, Dockerfiles build correctly for Railway/Vercel
- Non-functional: Image size < 50MB, no secrets in Dockerfile

## Related Code Files
- Modify: `.gitignore` (ensure no .env committed)
- Create: `railway.json` (root dir routing)
- Modify: `ticket-backend/Dockerfile` (if needed)
- Modify: `ticket-frontend/next.config.js` (standalone output already set)

## Implementation Steps

1. **Push to GitHub** — Create repo `Gr1` on GitHub, push code
2. **Add `.dockerignore`** — Ensure `node_modules`, `.env`, `.git` excluded from Docker context
3. **Verify Dockerfiles** — Backend multi-stage build (`/api` + `/worker`), Frontend standalone Next.js
4. **Add `railway.json`** — Root config telling Railway how to discover services:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "ticket-backend/Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "/api",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30
  }
}
```

Note: railway.json is per-service, not project-level. API and Worker share the same Dockerfile with different startCommand. Each service gets its own settings via Railway dashboard.

## Success Criteria

- [ ] Code pushed to GitHub public/private repo
- [ ] Dockerfiles build locally without errors
- [ ] No secrets in Dockerfile or committed .env
- [ ] Railway account created and logged in

## Risk Assessment

- Low risk: trivial config changes
- Mitigation: Local docker build before push

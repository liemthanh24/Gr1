---
phase: 5
title: "CI/CD & Verify"
status: pending
effort: "1h"
dependencies: [4]
---

# Phase 5: CI/CD & Verify

## Overview

Set up GitHub Actions to auto-deploy API/Worker to Railway and Frontend to Vercel on push to main. Add load test for high-traffic validation.

## Requirements

- Functional: Push to `main` auto-deploys all services
- Non-functional: Rolling updates (no downtime), deploy time < 3 minutes

## Architecture

```
Push to main ──► GitHub Actions
    │
    ├── ► Railway Deploy API + Worker
    │     (railway redeploy via CLI)
    │
    └── ► Vercel Deploy Frontend
          (vercel --prod via CLI)
```

## Related Code Files
- Create: `.github/workflows/deploy.yml`
- Verify: `ticket-backend/internal/config/config.go` reads env vars correctly
- Verify: `ticket-frontend/next.config.js` has `output: standalone`

## Implementation Steps

1. **Create Railway deploy token** — Railway dashboard → Project → Tokens → Generate → note `RAILWAY_TOKEN`
2. **Create Vercel deploy token** — Vercel dashboard → Settings → Tokens → Create → note `VERCEL_TOKEN`
3. **Add GitHub secrets:**
   - `RAILWAY_TOKEN` — from step 1
   - `RAILWAY_PROJECT_ID` — from Railway project settings
   - `VERCEL_TOKEN` — from step 2
   - `VERCEL_ORG_ID` — from Vercel project settings
   - `VERCEL_PROJECT_ID` — from Vercel project settings
4. **Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ticket-backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.25"
      - run: go mod download
      - run: go build ./...
      - run: go vet ./...

  deploy-backend:
    needs: test-backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      - name: Deploy to Railway
        run: |
          railway up --service api --detach
          railway up --service worker --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ticket-frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: --prod
```

5. **Verify CI/CD** — Push a commit to `main` → watch GitHub Actions → all green
6. **Run smoke tests:**
   - `curl <frontend-url>` → 200 HTML
   - `curl <api-url>/health` → 200 JSON
   - Register user, login, get token
   - List events, book ticket, check order

7. **Optional load test** — Use k6 or autocannon:
```bash
# Install k6, then:
k6 run --vus 50 --duration 30s -e API_URL=<railway-api-url> -e AUTH_TOKEN=<token> <<'EOF'
import http from 'k6/http';
export default function () {
  const url = `${__ENV.API_URL}/api/v1/events`;
  http.get(url, { headers: { Authorization: `Bearer ${__ENV.AUTH_TOKEN}` } });
}
EOF
```

## Success Criteria

- [ ] GitHub Actions deploys all services on push
- [ ] Railway API + Worker auto-update without manual intervention
- [ ] Vercel frontend auto-updates without manual intervention
- [ ] Smoke test passes end-to-end
- [ ] (Optional) Load test shows < 500ms p95 response time

## Risk Assessment

- Medium: Railway `railway up --detach` triggers deploy but doesn't wait for health check. Use `railway status` in a follow-up step to verify.
- Low: Vercel auto-deploys from GitHub directly — the GitHub Action is redundant but gives unified CI pipeline.
- Low: Railway API token has project-wide access — restrict scope if needed.

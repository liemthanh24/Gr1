---
phase: 4
title: "Deploy Frontend (Vercel)"
status: pending
effort: "1h"
dependencies: [3]
---

# Phase 4: Deploy Frontend (Vercel)

## Overview

Deploy Next.js frontend to Vercel with the Railway API URL as backend. Auto-scale CDN, SSR, and preview deployments.

## Requirements

- Functional: Website accessible at `https://gr1-ticket.vercel.app`, connects to Railway API
- Non-functional: CDN caching, SSR, preview deployments per PR

## Architecture

```
Vercel Project "gr1-ticket"
└── Framework: Next.js
└── Root: ticket-frontend/
└── Env: NEXT_PUBLIC_API_URL = https://api.up.railway.app/api/v1
```

## Related Code Files
- Modify: `ticket-frontend/src/lib/api.ts` — `API_BASE` uses `NEXT_PUBLIC_API_URL` env var (already)
- No code changes needed — Vercel handles everything via env vars

## Implementation Steps

1. **Push code to GitHub** (if not already)
2. **Import repo to Vercel** — Dashboard → Add New → Project → Import `Gr1` repo
3. **Configure project:**
   - Framework Preset: Next.js
   - Root Directory: `ticket-frontend`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
4. **Set environment variable:**
   - `NEXT_PUBLIC_API_URL` = `https://<railway-api-domain>/api/v1`
5. **Deploy** — Vercel auto-deploys. Note the generated domain (e.g., `gr1-ticket.vercel.app`)
6. **Update Railway API CORS** — Back to Railway API service → Variables → `FRONTEND_URL` = `https://gr1-ticket.vercel.app`
7. **Redeploy Railway API** (CORS change requires restart)
8. **End-to-end test:**
   - Open browser → frontend URL
   - Register/login
   - Browse events, select seats, book
   - Check orders in dashboard

## Success Criteria

- [ ] Vercel deploys frontend successfully
- [ ] Homepage loads with events fetched from Railway API
- [ ] Login/register works (cross-origin to Railway API)
- [ ] Seat selection + booking works end-to-end
- [ ] CORS allows frontend domain

## Risk Assessment

- Low: Vercel free tier is generous (100GB bandwidth, 6000 build minutes/month)
- Low: API state update requires Railway redeploy (manual or auto-deploy from GitHub)

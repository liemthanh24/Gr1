# Deployment

## Backend — Railway
- **URL:** https://api-production-f451.up.railway.app
- **Repository:** liemthanh24/Gr1 (root)
- **Auto-deploy:** ✅ Yes — push to `main` triggers Railway deploy
- **Deploy command (manual):** `railway up`
- **Platform:** Railway (automatically detected from Dockerfile)

## Frontend — Vercel
- **URL:** https://ticket-frontend-azure.vercel.app
- **Directory:** `ticket-frontend/`
- **Auto-deploy:** ✅ Yes — push to `main` triggers GitHub Actions → Vercel deploy
- **Deploy command (manual):** `cd ticket-frontend && vercel --prod`
- **Platform:** Vercel (Next.js)
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL` — set in Vercel project dashboard

## CI/CD — GitHub Actions
- **Workflow:** `.github/workflows/deploy-frontend.yml`
- **Trigger:** Push to `main` with changes in `ticket-frontend/`
- **Required Secret:** `VERCEL_TOKEN` — create at https://vercel.com/account/tokens

## Rollback
### Vercel
```bash
cd ticket-frontend && vercel rollback
```

### Railway
```bash
railway up
```
Or in Railway dashboard → Deployments → select previous → "Promote to Production"

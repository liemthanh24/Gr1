# Deployment

## Backend (API + Worker)
- **Platform:** Railway
- **Project:** gr1-ticket
- **URL:** https://api-production-f451.up.railway.app
- **Deploy:** Auto-deploy from GitHub `main` → `ticket-backend/`
- **Services:** api (web), worker (background jobs)
- **Database:** PostgreSQL (managed)
- **Cache:** Redis (managed)
- **Env Vars:**
  - `JWT_SECRET` — auto-generated
  - `DATABASE_URL` — reference `${{Postgres.DATABASE_URL}}`
  - `REDIS_URL` — reference `${{Redis.REDIS_URL}}`
  - `FRONTEND_URL` — https://ticket-frontend-azure.vercel.app
- **CLI:** `railway up` or `git push origin main`

## Frontend
- **Platform:** Vercel
- **Project:** ticket-frontend
- **URL:** https://ticket-frontend-azure.vercel.app
- **Deploy:** `cd ticket-frontend && vercel --prod`
- **Root Directory:** `ticket-frontend`
- **Env Vars:**
  - `NEXT_PUBLIC_API_URL` — https://api-production-f451.up.railway.app

## Rollback
- **Railway:** Dashboard → Service → Deployments → select previous deploy → Redeploy
- **Vercel:** Dashboard → Project → Deployments → select previous deploy → Promote to Production

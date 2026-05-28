# Deployment Guide (Free Tier)

This guide deploys the stack with no paid services:
- Frontend: Cloudflare Pages (free)
- Backend API: Render Web Service (free)
- Database: Supabase PostgreSQL (free)

## Architecture

1. Frontend calls backend API URL from VITE_API_URL.
2. Backend connects to managed PostgreSQL with DATABASE_URL.
3. Backend can call Gemini API when GEMINI_API_KEY is set.

## 1) Create Cloud PostgreSQL

### Supabase
1. Create a project on Supabase.
2. Open Settings -> Database -> Connection string.
3. Copy connection details and build SQLAlchemy URL:
   postgresql+psycopg://USER:PASSWORD@HOST:5432/postgres?sslmode=require
4. Save this value for DATABASE_URL.

## 2) Apply Schema

From the repo root in PowerShell:

$env:DATABASE_URL = "your-cloud-database-url"
Set-Location infra/scripts
./apply_schema.ps1

This applies:
- infra/schema/001_init.sql
- infra/schema/002_seed_movies.sql

## 3) Deploy Backend on Render

1. Push project to GitHub.
2. In Render, create New Web Service from repo.
3. Root directory: backend
4. Build command:
   pip install -r requirements.txt
5. Start command:
   gunicorn app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --workers 2
6. Add environment variables:
   - APP_ENV=prod
   - DATABASE_URL=your-cloud-database-url
   - JWT_SECRET=strong-random-secret
   - JWT_ALGORITHM=HS256
   - JWT_EXP_MINUTES=1440
   - GEMINI_API_KEY=optional
   - GEMINI_MODEL=gemini-2.0-flash
7. Deploy and verify:
   - /health returns status ok
   - /docs is reachable

## 4) Deploy Frontend on Cloudflare Pages

1. Create a new Pages project from the same repo.
2. Set build configuration:
   - Root directory: frontend
   - Build command: npm ci && npm run build
   - Build output directory: dist
3. Add environment variable:
   - VITE_API_URL=https://your-render-service.onrender.com/api
4. Deploy and verify app login and movie pages.

## 5) Optional: Vercel Frontend

If using Vercel instead of Cloudflare Pages:
- Root directory: frontend
- Build command: npm run build
- Output directory: dist
- Environment variable: VITE_API_URL=https://your-render-service.onrender.com/api

## 6) CI Secrets (optional)

Current CI backend job uses an ephemeral PostgreSQL service container and does not require external database secrets for import checks.
If you later add integration tests against cloud DB, set these repository secrets:
- DATABASE_URL
- JWT_SECRET
- GEMINI_API_KEY (optional)

## 7) Operational Notes

- Free tiers can sleep when idle; first request can be slow.
- Keep JWT_SECRET private and rotate if exposed.
- Keep DATABASE_URL in provider secrets only, never commit to git.
- Consider adding Alembic later for migration versioning.
- Supabase free tier has quotas; monitor usage in dashboard.

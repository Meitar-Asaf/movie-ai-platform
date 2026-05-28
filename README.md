# Movie AI Platform

Standalone project for personalized movie recommendations powered by an external AI API.

## Stack
- **Frontend**: React + Vite + TypeScript
- **Backend**: FastAPI + SQLAlchemy  
- **Database**: Managed PostgreSQL (Supabase free tier)
- **Auth**: JWT (can swap to Supabase Auth later)
- **AI**: Gemini 2.0 Flash (with fallback when key is missing)

## Get Started
⏱️ **5 min setup**: See [`QUICKSTART.md`](QUICKSTART.md)

## Project Structure
```
.
├── backend/              # FastAPI server + SQLAlchemy models
├── frontend/             # React + Vite app
├── infra/
│   ├── schema/          # SQL migrations + seed data
│   └── scripts/         # DB setup & migration helpers
├── docs/                # Deployment & ops guides
└── QUICKSTART.md        # Quick local dev setup
```

## Features
- ✅ User registration & JWT auth
- ✅ Movie CRUD + ratings + watchlist
- ✅ AI-powered recommendations (Gemini + fallback)
- ✅ Admin dashboard
- ✅ Free-tier ready (Supabase + Render + Vercel)

## Deployment
- **Frontend**: Cloudflare Pages or Vercel (free)
- **Backend**: Render free tier
- **Database**: Supabase free tier

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for detailed guides.

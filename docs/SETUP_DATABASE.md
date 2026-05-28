# Database Setup (Cloud PostgreSQL)

This project is configured to use Supabase managed PostgreSQL in the cloud (free tier), not a local database install.

## Option A: Supabase Free (Recommended)

1. Create a free account at https://supabase.com.
2. Create a project named movie-ai-platform in the closest region.
3. After initialization, open Settings -> Database -> Connection string.
4. Copy either direct connection or pooler connection and convert to SQLAlchemy format:
   - Start with postgresql+psycopg://
   - Keep sslmode=require if provided by your provider.
5. Set backend environment variable in backend/.env:
   DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/postgres?sslmode=require
6. Apply schema:
   ```powershell
   $env:DATABASE_URL = "your-cloud-connection-string"
   Set-Location infra/scripts
   ./apply_schema.ps1
   ```

## Verify Connection

1. Start backend:
   ```powershell
   cd backend
   uvicorn app.main:app --reload
   ```
2. Open http://localhost:8000/health and verify status ok.
3. Open http://localhost:8000/docs and call GET /api/movies after login.

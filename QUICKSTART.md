# Quickstart

## 1. Set up Database
Use Supabase managed PostgreSQL (free tier).
See docs/SETUP_DATABASE.md for exact steps.

Once you have a DATABASE_URL, set it in backend/.env and run:
```powershell
$env:DATABASE_URL = "your-cloud-connection-string"
Set-Location infra/scripts
./apply_schema.ps1
```

## 2. Start Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on http://localhost:8000
API docs: http://localhost:8000/docs

## 3. Start Frontend
```powershell
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## 4. Test

1. Navigate to http://localhost:5173
2. Register a new account
3. Like some movies and see AI recommendations!

## Environment Variables

Copy example files:
- backend/.env.example -> backend/.env
- frontend/.env.example -> frontend/.env

Add GEMINI_API_KEY to backend/.env later for AI recommendations (optional for MVP with fallback).

# Environment Variables

## Backend
- APP_ENV: Set to prod in production.
- DATABASE_URL: Managed PostgreSQL connection string from Supabase.
- JWT_SECRET: Secret key used for token signing.
- JWT_ALGORITHM: JWT algorithm (default HS256).
- JWT_EXP_MINUTES: Token expiry in minutes.
- GEMINI_API_KEY: Optional external AI API key.
- GEMINI_MODEL: Gemini model name.

Recommended production values:
- APP_ENV=prod
- DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/postgres?sslmode=require
- JWT_SECRET=long-random-secret

## Frontend
- VITE_API_URL: Backend API base URL.

## CI and Deployment Secrets

Set these secrets in your hosting/CI provider:
- DATABASE_URL
- JWT_SECRET
- GEMINI_API_KEY (optional)

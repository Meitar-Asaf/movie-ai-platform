from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.models import Movie, Rating, User, WatchlistItem

# Schema is managed externally in production. Keep auto-create for local/dev only.
if settings.app_env.lower() not in {"prod", "production"}:
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Movie AI Recommendations API", version="0.1.0")

allowed_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
origin_regex = settings.cors_origin_regex.strip() or None
if allowed_origins or origin_regex:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

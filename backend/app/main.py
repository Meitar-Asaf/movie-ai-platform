from fastapi import FastAPI

from app.api.router import api_router
from app.core.database import Base, engine
from app.models import Movie, Rating, User, WatchlistItem

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Movie AI Recommendations API", version="0.1.0")
app.include_router(api_router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations.gemini_client import GeminiClient
from app.models.rating import Rating
from app.models.user import User
from app.schemas.recommendations import RecommendationItem, RecommendationResponse
from app.services.movies import list_movies

def generate_recommendations(db: Session, user: User) -> RecommendationResponse:
    ratings = list(db.scalars(select(Rating).where(Rating.user_id == user.id, Rating.score >= 7)).all())
    liked_titles = [rating.movie_title for rating in ratings][:20]

    if not liked_titles:
        return RecommendationResponse(items=[], source="ai_no_preferences")

    catalog = list_movies(db, user.id)
    catalog_payload = [
        {
            "movie_key": movie.movie_key,
            "title": movie.title,
            "year": movie.year,
            "genres": movie.genres,
            "overview": movie.overview,
            "poster_url": movie.poster_url,
        }
        for movie in catalog
    ]

    if not catalog_payload:
        return RecommendationResponse(items=[], source="empty")

    liked_titles_set = {title.lower() for title in liked_titles}
    candidates = [m for m in catalog_payload if m["title"].lower() not in liked_titles_set]
    if not candidates:
        return RecommendationResponse(items=[], source="empty")

    ai_items = GeminiClient().recommend(liked_titles, candidates)
    candidate_by_title = {item["title"].lower(): item for item in candidates}

    normalized_items: list[RecommendationItem] = []
    for item in ai_items:
        try:
            title = str(item["title"]).strip()
            reason = str(item["reason"]).strip()
            if not title or not reason:
                continue

            match = candidate_by_title.get(title.lower())
            if not match:
                continue

            normalized_items.append(
                RecommendationItem(
                    movie_key=match["movie_key"],
                    title=match["title"],
                    reason=reason,
                    poster_url=match["poster_url"],
                    year=match["year"],
                    genres=match["genres"],
                )
            )
        except (KeyError, TypeError, ValueError):
            continue

    if normalized_items:
        return RecommendationResponse(items=normalized_items[:5], source="gemini")

    return RecommendationResponse(items=[], source="ai_unavailable")

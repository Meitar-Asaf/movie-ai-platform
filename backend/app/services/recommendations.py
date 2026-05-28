from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations.gemini_client import GeminiClient
from app.models.movie import Movie
from app.models.rating import Rating
from app.models.user import User
from app.schemas.recommendations import RecommendationItem, RecommendationResponse


def _fallback_recommendations(movies: list[Movie]) -> list[RecommendationItem]:
    top = movies[:5]
    return [
        RecommendationItem(
            movie_id=m.id,
            title=m.title,
            reason="Popular fallback recommendation while AI is unavailable.",
        )
        for m in top
    ]


def generate_recommendations(db: Session, user: User) -> RecommendationResponse:
    ratings = list(
        db.scalars(select(Rating).where(Rating.user_id == user.id, Rating.score >= 7)).all()
    )
    liked_movie_ids = [rating.movie_id for rating in ratings]

    liked_movies = [db.get(Movie, movie_id) for movie_id in liked_movie_ids]
    liked_titles = [movie.title for movie in liked_movies if movie is not None]

    candidate_movies = list(db.scalars(select(Movie).order_by(Movie.title.asc())).all())
    if not candidate_movies:
        return RecommendationResponse(items=[], source="empty")

    candidate_payload = [
        {"movie_id": movie.id, "title": movie.title, "genres": movie.genres, "year": movie.year}
        for movie in candidate_movies
        if movie.id not in liked_movie_ids
    ]

    if not candidate_payload:
        return RecommendationResponse(items=[], source="empty")

    client = GeminiClient()
    ai_items = client.recommend(liked_titles, candidate_payload)

    normalized_items: list[RecommendationItem] = []
    for item in ai_items:
        try:
            normalized_items.append(
                RecommendationItem(
                    movie_id=int(item["movie_id"]),
                    title=str(item["title"]),
                    reason=str(item["reason"]),
                )
            )
        except (KeyError, TypeError, ValueError):
            continue

    if normalized_items:
        return RecommendationResponse(items=normalized_items[:5], source="gemini")

    return RecommendationResponse(
        items=_fallback_recommendations(candidate_movies),
        source="fallback",
    )

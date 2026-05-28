from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.movie import Movie
from app.models.rating import Rating
from app.models.watchlist import WatchlistItem
from app.schemas.movies import MovieCreateRequest, RatingRequest, WatchlistRequest


def list_movies(db: Session, query: str | None = None) -> list[Movie]:
    stmt = select(Movie).order_by(Movie.title.asc())
    if query:
        stmt = stmt.where(Movie.title.ilike(f"%{query}%"))
    return list(db.scalars(stmt).all())


def add_movie(db: Session, payload: MovieCreateRequest) -> Movie:
    movie = Movie(
        title=payload.title,
        year=payload.year,
        genres=payload.genres,
        overview=payload.overview,
    )
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie


def rate_movie(db: Session, user_id: int, payload: RatingRequest) -> None:
    movie = db.get(Movie, payload.movie_id)
    if movie is None:
        raise ValueError("Movie not found")

    rating = db.scalar(
        select(Rating).where(Rating.user_id == user_id, Rating.movie_id == payload.movie_id)
    )
    if rating is None:
        rating = Rating(user_id=user_id, movie_id=payload.movie_id, score=payload.score)
        db.add(rating)
    else:
        rating.score = payload.score
    db.commit()


def set_watchlist(db: Session, user_id: int, payload: WatchlistRequest) -> None:
    movie = db.get(Movie, payload.movie_id)
    if movie is None:
        raise ValueError("Movie not found")

    item = db.scalar(
        select(WatchlistItem).where(
            WatchlistItem.user_id == user_id,
            WatchlistItem.movie_id == payload.movie_id,
        )
    )
    if item is None:
        item = WatchlistItem(user_id=user_id, movie_id=payload.movie_id, watched=payload.watched)
        db.add(item)
    else:
        item.watched = payload.watched
    db.commit()

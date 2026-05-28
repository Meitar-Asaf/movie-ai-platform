from dataclasses import dataclass
from time import time

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations.gemini_client import GeminiClient
from app.integrations.poster_client import get_poster_url
from app.models.rating import Rating
from app.models.watchlist import WatchlistItem
from app.schemas.movies import MovieCreateRequest, MovieResponse, RatingRequest, WatchlistRequest


@dataclass
class CatalogMovie:
    movie_key: str
    title: str
    year: int | None
    genres: str
    overview: str | None
    poster_url: str


_CATALOG_TTL_SECONDS = 10 * 60
_catalog_cache_by_user: dict[int, list[CatalogMovie]] = {}
_catalog_expires_by_user: dict[int, float] = {}


def _movie_key(title: str, year: int | None) -> str:
    base = "".join(ch.lower() if ch.isalnum() else "-" for ch in title).strip("-")
    base = "-".join(part for part in base.split("-") if part)
    return f"{base}-{year}" if year else base


def _normalize_ai_catalog(items: list[dict]) -> list[CatalogMovie]:
    normalized: list[CatalogMovie] = []
    seen: set[str] = set()
    for item in items:
        try:
            title = str(item.get("title", "")).strip()
            if not title:
                continue
            year = item.get("year")
            year = int(year) if year is not None else None
            genres = str(item.get("genres", "")).strip()
            overview = str(item.get("overview", "")).strip() or None
            key = _movie_key(title, year)
            if key in seen:
                continue
            seen.add(key)
            normalized.append(
                CatalogMovie(
                    movie_key=key,
                    title=title,
                    year=year,
                    genres=genres,
                    overview=overview,
                    poster_url=get_poster_url(title, year),
                )
            )
        except (TypeError, ValueError):
            continue
    return normalized


def _liked_titles_for_user(db: Session, user_id: int) -> list[str]:
    rows = db.scalars(
        select(Rating).where(Rating.user_id == user_id, Rating.score >= 8)
    ).all()
    return [row.movie_title for row in rows][:25]


def _refresh_ai_catalog(
    db: Session,
    user_id: int,
    query: str | None = None,
    force: bool = False,
) -> None:
    now = time()
    cached = _catalog_cache_by_user.get(user_id, [])
    expires_at = _catalog_expires_by_user.get(user_id, 0.0)
    if not force and cached and expires_at > now:
        return

    liked_titles = _liked_titles_for_user(db, user_id)
    ai_items = GeminiClient().generate_catalog(40, liked_movies=liked_titles, query=query)
    normalized = _normalize_ai_catalog(ai_items)

    if not normalized and liked_titles:
        ai_items = GeminiClient().generate_catalog(30, liked_movies=liked_titles)
        normalized = _normalize_ai_catalog(ai_items)

    _catalog_cache_by_user[user_id] = normalized
    _catalog_expires_by_user[user_id] = now + _CATALOG_TTL_SECONDS


def list_movies(db: Session, user_id: int, query: str | None = None) -> list[MovieResponse]:
    _refresh_ai_catalog(db, user_id, query=query)

    items = _catalog_cache_by_user.get(user_id, [])
    if query:
        query_lower = query.lower()
        items = [movie for movie in items if query_lower in movie.title.lower()]

    return [
        MovieResponse(
            movie_key=movie.movie_key,
            title=movie.title,
            year=movie.year,
            genres=movie.genres,
            overview=movie.overview,
            poster_url=movie.poster_url,
        )
        for movie in items
    ]


def add_movie(db: Session, payload: MovieCreateRequest) -> MovieResponse:
    raise ValueError("Manual movie creation is disabled in AI-only mode")


def rate_movie(db: Session, user_id: int, payload: RatingRequest) -> None:
    title = payload.title.strip()
    if not title:
        raise ValueError("Movie title is required")

    rating = db.scalar(
        select(Rating).where(Rating.user_id == user_id, Rating.movie_title == title)
    )

    poster_url = payload.poster_url or get_poster_url(title, payload.year)
    if rating is None:
        rating = Rating(
            user_id=user_id,
            movie_title=title,
            movie_year=payload.year,
            movie_genres=payload.genres,
            movie_overview=payload.overview,
            poster_url=poster_url,
            score=payload.score,
        )
        db.add(rating)
    else:
        rating.score = payload.score
        rating.movie_year = payload.year
        rating.movie_genres = payload.genres
        rating.movie_overview = payload.overview
        rating.poster_url = poster_url
    db.commit()


def set_watchlist(db: Session, user_id: int, payload: WatchlistRequest) -> None:
    title = payload.title.strip()
    if not title:
        raise ValueError("Movie title is required")

    item = db.scalar(
        select(WatchlistItem).where(
            WatchlistItem.user_id == user_id,
            WatchlistItem.movie_title == title,
        )
    )

    poster_url = payload.poster_url or get_poster_url(title, payload.year)
    if item is None:
        item = WatchlistItem(
            user_id=user_id,
            movie_title=title,
            movie_year=payload.year,
            poster_url=poster_url,
            watched=payload.watched,
        )
        db.add(item)
    else:
        item.watched = payload.watched
        item.movie_year = payload.year
        item.poster_url = poster_url
    db.commit()


def catalog_count() -> int:
    return sum(len(items) for items in _catalog_cache_by_user.values())

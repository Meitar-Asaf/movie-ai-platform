from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.movies import MovieCreateRequest, MovieResponse, RatingRequest, WatchlistRequest
from app.services.movies import add_movie, list_movies, rate_movie, set_watchlist

router = APIRouter()


@router.get("", response_model=list[MovieResponse])
def get_movies(
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[MovieResponse]:
    return [MovieResponse.model_validate(item) for item in list_movies(db, q)]


@router.post("", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
def create_movie(
    payload: MovieCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> MovieResponse:
    movie = add_movie(db, payload)
    return MovieResponse.model_validate(movie)


@router.post("/ratings", status_code=status.HTTP_204_NO_CONTENT)
def add_or_update_rating(
    payload: RatingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    try:
        rate_movie(db, current_user.id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/watchlist", status_code=status.HTTP_204_NO_CONTENT)
def add_or_update_watchlist(
    payload: WatchlistRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    try:
        set_watchlist(db, current_user.id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

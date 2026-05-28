from pydantic import BaseModel


class RecommendationItem(BaseModel):
    movie_key: str
    title: str
    reason: str
    poster_url: str
    year: int | None = None
    genres: str = ""


class RecommendationResponse(BaseModel):
    items: list[RecommendationItem]
    source: str

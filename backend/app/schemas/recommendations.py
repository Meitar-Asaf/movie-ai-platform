from pydantic import BaseModel


class RecommendationItem(BaseModel):
    movie_id: int
    title: str
    reason: str


class RecommendationResponse(BaseModel):
    items: list[RecommendationItem]
    source: str

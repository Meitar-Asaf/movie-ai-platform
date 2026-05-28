from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import User
from app.services.movies import catalog_count

router = APIRouter()


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict[str, int]:
    users_count = db.scalar(select(func.count()).select_from(User)) or 0
    movies_count = catalog_count()
    return {"users": users_count, "movies": movies_count}

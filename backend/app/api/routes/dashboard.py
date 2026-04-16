from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..deps import get_current_user
from ...db.session import get_db
from ...models import User
from ...services.read_service import dashboard_payload


router = APIRouter()


@router.get("")
def get_dashboard(role: str = Query(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return dashboard_payload(db, role, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..deps import get_current_user
from ...db.session import get_db
from ...services.read_service import global_search_payload


router = APIRouter()


@router.get("")
def global_search(term: str = Query(""), _: object = Depends(get_current_user), db: Session = Depends(get_db)):
    return global_search_payload(db, term)

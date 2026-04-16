from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import get_current_admin, get_current_user
from ...db.session import get_db
from ...schemas.domain import CreateCourseInput
from ...services.read_service import list_courses_summary
from ...services.write_service import create_course


router = APIRouter()


@router.get("")
def get_courses(_: object = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_courses_summary(db)


@router.post("")
def create_course_endpoint(payload: CreateCourseInput, _: object = Depends(get_current_admin), db: Session = Depends(get_db)):
    try:
        return create_course(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

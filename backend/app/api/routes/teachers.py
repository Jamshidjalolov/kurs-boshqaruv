from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import get_current_admin, get_current_user
from ...db.session import get_db
from ...models import User
from ...schemas.domain import CreateTeacherInput
from ...services.read_service import list_teachers_summary
from ...services.write_service import create_teacher_account


router = APIRouter()


@router.get("")
def get_teachers(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_teachers_summary(db, current_user)


@router.post("", include_in_schema=False)
@router.post("/")
def create_teacher_endpoint(payload: CreateTeacherInput, _: object = Depends(get_current_admin), db: Session = Depends(get_db)):
    try:
        return create_teacher_account(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

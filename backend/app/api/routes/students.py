from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import get_current_admin, get_current_user
from ...db.session import get_db
from ...models import Role, User
from ...schemas.domain import CreateStudentInput
from ...services.read_service import list_students_summary, student_detail_payload
from ...services.write_service import create_student_account


router = APIRouter()


@router.get("")
def get_students(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_students_summary(db, current_user)


@router.post("", include_in_schema=False)
@router.post("/")
def create_student_endpoint(payload: CreateStudentInput, _: object = Depends(get_current_admin), db: Session = Depends(get_db)):
    try:
        return create_student_account(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{student_id}")
def get_student_detail(student_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        resolved_student_id = student_id
        if current_user.role == Role.STUDENT and current_user.student_profile and student_id == current_user.id:
            resolved_student_id = current_user.student_profile.id

        return student_detail_payload(db, resolved_student_id, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

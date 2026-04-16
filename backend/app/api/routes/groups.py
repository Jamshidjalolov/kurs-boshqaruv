from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import get_current_user
from ...db.session import get_db
from ...schemas.domain import AssignStudentInput, CreateGroupInput, UnassignStudentInput
from ...services.read_service import list_groups_summary
from ...services.write_service import assign_student_to_group, create_group, unassign_student_from_group


router = APIRouter()


@router.get("")
def get_groups(_: object = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_groups_summary(db)


@router.post("")
def create_group_endpoint(payload: CreateGroupInput, _: object = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return create_group(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/assign-student")
def assign_student_endpoint(payload: AssignStudentInput, _: object = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return assign_student_to_group(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/unassign-student")
def unassign_student_endpoint(payload: UnassignStudentInput, _: object = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return unassign_student_from_group(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

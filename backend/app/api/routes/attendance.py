from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import get_current_user
from ...db.session import get_db
from ...models import User
from ...schemas.domain import MarkGroupAttendanceInput, SaveAttendanceDailyGradeInput, SaveAttendanceHomeworkInput, SaveAttendanceTopicInput
from ...services.read_service import list_attendance_entries
from ...services.write_service import mark_group_attendance, save_attendance_daily_grade, save_attendance_homework, save_attendance_topic


router = APIRouter()


@router.get("")
def get_attendance(_: object = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_attendance_entries(db)


@router.post("/group")
def mark_group_attendance_endpoint(payload: MarkGroupAttendanceInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return mark_group_attendance(db, current_user, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/topic")
def save_attendance_topic_endpoint(payload: SaveAttendanceTopicInput, _: object = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return save_attendance_topic(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/homework")
def save_attendance_homework_endpoint(payload: SaveAttendanceHomeworkInput, _: object = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return save_attendance_homework(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/daily-grade")
def save_attendance_daily_grade_endpoint(payload: SaveAttendanceDailyGradeInput, _: object = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return save_attendance_daily_grade(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import get_current_user
from ...db.session import get_db
from ...schemas.domain import SendNotificationInput
from ...services.read_service import list_notification_entries
from ...services.write_service import send_notification_to_student


router = APIRouter()


@router.get("")
def get_notifications(_: object = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_notification_entries(db)


@router.post("/send")
def send_notification_endpoint(payload: SendNotificationInput, _: object = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return send_notification_to_student(db, payload.studentId, payload.studentName, payload.template)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

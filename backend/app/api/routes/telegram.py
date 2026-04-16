from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import get_current_admin, get_current_user
from ...db.session import get_db
from ...schemas.domain import TelegramSettingsInput
from ...services.telegram_bot import sync_telegram_updates, telegram_settings_payload, update_telegram_settings
from ...services.live_events import live_events


router = APIRouter()


@router.get("/settings")
def get_telegram_settings(_: object = Depends(get_current_user), db: Session = Depends(get_db)):
    return telegram_settings_payload(db)


@router.put("/settings")
def save_telegram_settings(payload: TelegramSettingsInput, _: object = Depends(get_current_admin), db: Session = Depends(get_db)):
    try:
        response = update_telegram_settings(db, payload.model_dump())
        live_events.publish(["students", "notifications", "dashboard"])
        return response
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/sync")
def sync_telegram(_: object = Depends(get_current_admin), db: Session = Depends(get_db)):
    try:
        response = sync_telegram_updates(db)
        live_events.publish(["students", "notifications", "dashboard"])
        return response
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

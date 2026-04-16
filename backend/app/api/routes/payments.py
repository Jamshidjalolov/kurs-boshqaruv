from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..deps import get_current_admin, get_current_user
from ...db.session import get_db
from ...schemas.domain import RecordPaymentInput
from ...services.read_service import list_payment_entries
from ...services.write_service import record_payment


router = APIRouter()


@router.get("")
def get_payments(_: object = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_payment_entries(db)


@router.post("")
def record_payment_endpoint(payload: RecordPaymentInput, _: object = Depends(get_current_admin), db: Session = Depends(get_db)):
    try:
        return record_payment(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

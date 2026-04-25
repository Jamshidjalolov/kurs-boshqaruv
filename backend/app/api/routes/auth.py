from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..deps import get_current_user
from ...core.security import create_access_token, create_refresh_token, decode_token, hash_token
from ...db.session import get_db
from ...models import User
from ...schemas.auth import ChangePasswordInput, ForgotPasswordInput, LoginInput, RefreshInput, RegisterInput, ResetPasswordInput, UpdateOwnProfileInput, UploadAvatarInput
from ...services.common import authenticate_user, change_current_user_password, create_registration, create_reset_token, reset_password, save_user_avatar, session_user_payload, update_current_user_profile, user_role_payload_value
from ...services.live_events import live_events


router = APIRouter()


@router.post("/login")
def login(payload: LoginInput, request: Request, db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, payload.identifier, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    access_token = create_access_token(user.id, user_role_payload_value(user))
    refresh_token = create_refresh_token(user.id)
    user.refresh_token_hash = hash_token(refresh_token)
    db.commit()

    user_payload = session_user_payload(user)
    if user_payload.get("avatar") and str(user_payload["avatar"]).startswith("/"):
        user_payload["avatar"] = str(request.base_url).rstrip("/") + str(user_payload["avatar"])
    return {"user": user_payload, "tokens": {"accessToken": access_token, "refreshToken": refresh_token}}


@router.post("/token")
def issue_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, form_data.username, form_data.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    access_token = create_access_token(user.id, user_role_payload_value(user))
    refresh_token = create_refresh_token(user.id)
    user.refresh_token_hash = hash_token(refresh_token)
    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register")
def register(payload: RegisterInput, db: Session = Depends(get_db)):
    try:
        return create_registration(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.post("/refresh")
def refresh(payload: RefreshInput, request: Request, db: Session = Depends(get_db)):
    try:
        token_payload = decode_token(payload.refreshToken, "refresh")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user = db.get(User, str(token_payload.get("sub")))
    if not user or not user.refresh_token_hash or user.refresh_token_hash != hash_token(payload.refreshToken):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    access_token = create_access_token(user.id, user_role_payload_value(user))
    refresh_token = create_refresh_token(user.id)
    user.refresh_token_hash = hash_token(refresh_token)
    db.commit()

    user_payload = session_user_payload(user)
    if user_payload.get("avatar") and str(user_payload["avatar"]).startswith("/"):
        user_payload["avatar"] = str(request.base_url).rstrip("/") + str(user_payload["avatar"])
    return {"user": user_payload, "tokens": {"accessToken": access_token, "refreshToken": refresh_token}}


@router.get("/me")
def me(request: Request, current_user: User = Depends(get_current_user)):
    payload = session_user_payload(current_user)
    if payload.get("avatar") and str(payload["avatar"]).startswith("/"):
        payload["avatar"] = str(request.base_url).rstrip("/") + str(payload["avatar"])
    return payload


@router.patch("/profile")
def update_profile(
    payload: UpdateOwnProfileInput,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        user_payload = update_current_user_profile(db, current_user, payload.model_dump())
        live_events.publish(["students", "teachers", "student-detail", "dashboard"])
        if user_payload.get("avatar") and str(user_payload["avatar"]).startswith("/"):
            user_payload["avatar"] = str(request.base_url).rstrip("/") + str(user_payload["avatar"])
        return user_payload
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/change-password")
def change_password(payload: ChangePasswordInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        response = change_current_user_password(db, current_user, payload.currentPassword, payload.newPassword)
        live_events.publish(["students", "teachers"])
        return response
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/avatar")
def upload_avatar(
    payload: UploadAvatarInput,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        user_payload = save_user_avatar(db, current_user, payload.fileName, payload.dataUrl)
        live_events.publish(["students", "teachers", "student-detail", "dashboard"])
        if user_payload.get("avatar") and str(user_payload["avatar"]).startswith("/"):
            user_payload["avatar"] = str(request.base_url).rstrip("/") + str(user_payload["avatar"])
        return user_payload
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.refresh_token_hash = None
    db.commit()
    return {"message": "Sessiya yopildi."}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordInput, db: Session = Depends(get_db)):
    try:
        return create_reset_token(db, payload.identifier)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/reset-password")
def reset_password_endpoint(payload: ResetPasswordInput, db: Session = Depends(get_db)):
    try:
        return reset_password(db, payload.token, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

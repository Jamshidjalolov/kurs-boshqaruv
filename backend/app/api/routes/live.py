from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse

from ...core.security import decode_token
from ...db.session import SessionLocal
from ...models import User
from ...services.live_events import live_events


router = APIRouter()


def _resolve_user(token: str) -> User:
    try:
        payload = decode_token(token, "access")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    with SessionLocal() as db:
        user = db.get(User, str(payload.get("sub")))

        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

        return user


def _format_sse(payload: dict[str, object]) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


@router.get("/stream")
async def live_stream(request: Request, token: str = Query(...)):
    _resolve_user(token)
    listener_id, queue = live_events.subscribe()

    async def event_generator():
        try:
            yield _format_sse(live_events.current_payload())

            while True:
                if await request.is_disconnected():
                    break

                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=20)
                except TimeoutError:
                    yield ": keep-alive\n\n"
                    continue

                yield _format_sse(payload)
        finally:
            live_events.unsubscribe(listener_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

from __future__ import annotations

import asyncio
from contextlib import suppress
from dataclasses import dataclass
from datetime import UTC, datetime
from threading import Lock
from typing import Any


@dataclass
class Listener:
    queue: asyncio.Queue[dict[str, Any]]
    loop: asyncio.AbstractEventLoop


class LiveEventsBroker:
    def __init__(self) -> None:
        self._listeners: dict[int, Listener] = {}
        self._listener_sequence = 0
        self._version = 0
        self._lock = Lock()

    @property
    def refresh_scopes(self) -> list[str]:
        return [
            "dashboard",
            "students",
            "teachers",
            "groups",
            "courses",
            "attendance",
            "payments",
            "notifications",
            "student-detail",
            "teacher-student",
        ]

    def subscribe(self) -> tuple[int, asyncio.Queue[dict[str, Any]]]:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=32)
        loop = asyncio.get_running_loop()

        with self._lock:
            self._listener_sequence += 1
            listener_id = self._listener_sequence
            self._listeners[listener_id] = Listener(queue=queue, loop=loop)

        return listener_id, queue

    def unsubscribe(self, listener_id: int) -> None:
        with self._lock:
            self._listeners.pop(listener_id, None)

    def current_payload(self) -> dict[str, Any]:
        with self._lock:
            version = self._version

        return {
            "type": "snapshot",
            "version": version,
            "scopes": self.refresh_scopes,
            "sentAt": datetime.now(UTC).isoformat(),
        }

    def publish(self, scopes: list[str], *, message: str | None = None) -> None:
        normalized_scopes = list(dict.fromkeys(scope for scope in scopes if scope))

        if not normalized_scopes:
            return

        with self._lock:
            self._version += 1
            payload = {
                "type": "refresh",
                "version": self._version,
                "scopes": normalized_scopes,
                "message": message,
                "sentAt": datetime.now(UTC).isoformat(),
            }
            listeners = list(self._listeners.values())

        for listener in listeners:
            listener.loop.call_soon_threadsafe(self._enqueue, listener.queue, payload)

    @staticmethod
    def _enqueue(queue: asyncio.Queue[dict[str, Any]], payload: dict[str, Any]) -> None:
        if queue.full():
            with suppress(asyncio.QueueEmpty):
                queue.get_nowait()

        with suppress(asyncio.QueueFull):
            queue.put_nowait(payload)


live_events = LiveEventsBroker()

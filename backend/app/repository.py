"""Bounded atomic demo ledger; SQL schema is independent for deployment."""
from __future__ import annotations

import asyncio
from collections import deque
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


class EventLedger:
    def __init__(self, capacity: int = 128):
        if capacity <= 0 or capacity > 10000:
            raise ValueError("event ledger size outside safe range")
        self._entries: deque[dict[str, Any]] = deque(maxlen=capacity)
        self._lock = asyncio.Lock()

    async def append(self, record: dict[str, Any]) -> dict[str, Any]:
        saved = {
            "id": str(uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            **record,
        }
        async with self._lock:
            self._entries.appendleft(saved)
        return dict(saved)

    async def list(self, limit: int = 25) -> list[dict[str, Any]]:
        async with self._lock:
            return [dict(record) for record in list(self._entries)[:max(0, limit)]]

    async def get(self, identifier: str) -> dict[str, Any] | None:
        async with self._lock:
            for item in self._entries:
                if item["id"] == identifier:
                    return dict(item)
        return None

    async def count(self) -> int:
        async with self._lock:
            return len(self._entries)


ledger = EventLedger()

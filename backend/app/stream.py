"""Non-blocking demo event stream with explicit connection churn handling."""
from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from datetime import datetime, timezone
from .repository import ledger


async def stream_activity() -> AsyncIterator[str]:
    last_count = -1
    try:
        while True:
            count = await ledger.count()
            if count != last_count:
                payload = {
                    "kind": "observatory_activity",
                    "recorded_events": count,
                    "at": datetime.now(timezone.utc).isoformat(),
                    "mode": "synthetic_research",
                }
                yield "event: telemetry\ndata: " + json.dumps(payload) + "\n\n"
                last_count = count
            else:
                yield ": keepalive\n\n"
            await asyncio.sleep(2)
    except asyncio.CancelledError:
        return

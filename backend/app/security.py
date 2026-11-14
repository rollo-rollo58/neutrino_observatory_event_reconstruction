"""Write-route API-key gate; constant-time compare with secure disable default."""
from __future__ import annotations

import hmac
from fastapi import Header, HTTPException
from .config import settings


def require_operator(x_operator_key: str | None = Header(default=None)) -> str:
    expected = settings.operator_api_key
    if not expected or len(expected) < 20:
        raise HTTPException(status_code=503, detail="operator writes are disabled")
    if not x_operator_key or not hmac.compare_digest(x_operator_key, expected):
        raise HTTPException(status_code=403, detail="operator authorization failed")
    return "authenticated_operator"

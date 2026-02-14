# django_multi_tenant/tenant_env_router.py
"""
Bind `tenantId -> env` to a Cloudflare Worker (KV-backed) router.

Why: `*.sechome.cc` can be served by either dev/stable origin today, which makes routing
non-deterministic. The Worker holds the source-of-truth mapping so a tenant created in
dev will always route to dev, and same for stable, without relying on name patterns.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)


def _truthy(v: Optional[str]) -> bool:
    return (v or "").strip().lower() in {"1", "true", "yes", "y", "on"}


def bind_tenant_to_current_env(tenant_id: str) -> Dict[str, Any]:
    """
    Best-effort bind tenant -> current env.

    Controlled by env vars:
    - TPLANET_ENV: "dev" | "stable" (required to do anything useful)
    - TENANT_ENV_ROUTER_BINDING_URL: e.g. "https://router.sechome.cc/__binding"
    - TENANT_ENV_ROUTER_BINDING_TOKEN: bearer token for Worker binding API
    - TENANT_ENV_ROUTER_BINDING_REQUIRED: if true, raise on failure
    """

    env = (os.getenv("TPLANET_ENV") or "").strip()
    base_url = (os.getenv("TENANT_ENV_ROUTER_BINDING_URL") or "").rstrip("/")
    token = (os.getenv("TENANT_ENV_ROUTER_BINDING_TOKEN") or "").strip()
    required = _truthy(os.getenv("TENANT_ENV_ROUTER_BINDING_REQUIRED"))

    if not env or not base_url or not token:
        msg = "tenant env router binding skipped (missing TPLANET_ENV / TENANT_ENV_ROUTER_BINDING_URL / TENANT_ENV_ROUTER_BINDING_TOKEN)"
        if required:
            raise RuntimeError(msg)
        return {"ok": False, "skipped": True, "reason": msg}

    url = f"{base_url}/{tenant_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {"env": env}

    try:
        resp = requests.put(url, headers=headers, data=json.dumps(payload), timeout=10)
    except Exception as e:
        logger.exception("tenant env router binding failed (exception)")
        if required:
            raise
        return {"ok": False, "error": str(e)}

    if 200 <= resp.status_code < 300:
        return {"ok": True, "status": resp.status_code}

    body = ""
    try:
        body = resp.text[:2000]
    except Exception:
        body = "<unreadable>"

    logger.warning("tenant env router binding failed: status=%s body=%s", resp.status_code, body)
    if required:
        raise RuntimeError(f"tenant env router binding failed: {resp.status_code}")
    return {"ok": False, "status": resp.status_code, "body": body}


def unbind_tenant(tenant_id: str) -> Dict[str, Any]:
    env = (os.getenv("TPLANET_ENV") or "").strip()
    base_url = (os.getenv("TENANT_ENV_ROUTER_BINDING_URL") or "").rstrip("/")
    token = (os.getenv("TENANT_ENV_ROUTER_BINDING_TOKEN") or "").strip()
    required = _truthy(os.getenv("TENANT_ENV_ROUTER_BINDING_REQUIRED"))

    if not env or not base_url or not token:
        msg = "tenant env router unbind skipped (missing TPLANET_ENV / TENANT_ENV_ROUTER_BINDING_URL / TENANT_ENV_ROUTER_BINDING_TOKEN)"
        if required:
            raise RuntimeError(msg)
        return {"ok": False, "skipped": True, "reason": msg}

    url = f"{base_url}/{tenant_id}"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        resp = requests.delete(url, headers=headers, timeout=10)
    except Exception as e:
        logger.exception("tenant env router unbind failed (exception)")
        if required:
            raise
        return {"ok": False, "error": str(e)}

    if 200 <= resp.status_code < 300:
        return {"ok": True, "status": resp.status_code}

    body = ""
    try:
        body = resp.text[:2000]
    except Exception:
        body = "<unreadable>"

    logger.warning("tenant env router unbind failed: status=%s body=%s", resp.status_code, body)
    if required:
        raise RuntimeError(f"tenant env router unbind failed: {resp.status_code}")
    return {"ok": False, "status": resp.status_code, "body": body}


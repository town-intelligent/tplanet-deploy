# django_multi_tenant/cloudflare.py
"""
Cloudflare DNS API integration for automatic subdomain management.
"""

import logging
import os
import requests
from typing import Optional

logger = logging.getLogger(__name__)

# Cloudflare API configuration
#
# IMPORTANT: do not hardcode secrets or zone ids here. Use environment variables.
# This module is used by tenant create/delete flows; if config is missing, we return
# a clean error dict instead of throwing.
CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4"
CLOUDFLARE_ZONE_ID = (os.environ.get("CLOUDFLARE_ZONE_ID") or "").strip()
CLOUDFLARE_API_TOKEN = (os.environ.get("CLOUDFLARE_API_TOKEN") or "").strip()
CLOUDFLARE_DOMAIN = (os.environ.get("CLOUDFLARE_DOMAIN") or "sechome.cc").strip()
SERVER_IP = (os.environ.get("SERVER_IP") or "").strip()


def _config_error() -> Optional[dict]:
    missing = []
    if not CLOUDFLARE_ZONE_ID:
        missing.append("CLOUDFLARE_ZONE_ID")
    if not CLOUDFLARE_API_TOKEN:
        missing.append("CLOUDFLARE_API_TOKEN")
    if not SERVER_IP:
        missing.append("SERVER_IP")
    if missing:
        return {
            "success": False,
            "error": f"Cloudflare config missing: {', '.join(missing)}",
        }
    return None


def _get_headers() -> dict:
    """Get Cloudflare API headers."""
    return {
        "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
        "Content-Type": "application/json",
    }


def create_subdomain(subdomain: str, proxied: bool = True) -> dict:
    """
    Create an A record for a subdomain.

    Args:
        subdomain: The subdomain name (e.g., "nantou-gov" for nantou-gov.4impact.cc)
        proxied: Whether to proxy through Cloudflare (orange cloud)

    Returns:
        dict with success status and record details
    """
    cfg_err = _config_error()
    if cfg_err:
        return cfg_err

    full_name = f"{subdomain}.{CLOUDFLARE_DOMAIN}"

    # Check if record already exists
    existing = get_dns_record(subdomain)
    if existing:
        return {
            "success": True,
            "message": f"Record already exists: {full_name}",
            "record": existing,
            "created": False,
        }

    url = f"{CLOUDFLARE_API_BASE}/zones/{CLOUDFLARE_ZONE_ID}/dns_records"

    payload = {
        "type": "A",
        "name": full_name,
        "content": SERVER_IP,
        "proxied": proxied,
        "ttl": 1,  # Auto TTL when proxied
    }

    try:
        response = requests.post(url, headers=_get_headers(), json=payload, timeout=30)
        result = response.json()

        if result.get("success"):
            logger.info(f"Created DNS record: {full_name} -> {SERVER_IP}")
            return {
                "success": True,
                "message": f"Created: {full_name}",
                "record": result.get("result"),
                "created": True,
            }
        else:
            errors = result.get("errors", [])
            error_msg = errors[0].get("message") if errors else "Unknown error"
            logger.error(f"Failed to create DNS record: {error_msg}")
            return {
                "success": False,
                "error": error_msg,
            }
    except requests.RequestException as e:
        logger.error(f"Cloudflare API error: {e}")
        return {
            "success": False,
            "error": str(e),
        }


def get_dns_record(subdomain: str) -> Optional[dict]:
    """
    Get DNS record for a subdomain.

    Args:
        subdomain: The subdomain name

    Returns:
        Record dict if found, None otherwise
    """
    if _config_error():
        return None

    full_name = f"{subdomain}.{CLOUDFLARE_DOMAIN}"
    url = f"{CLOUDFLARE_API_BASE}/zones/{CLOUDFLARE_ZONE_ID}/dns_records"

    params = {
        "name": full_name,
        "type": "A",
    }

    try:
        response = requests.get(url, headers=_get_headers(), params=params, timeout=30)
        result = response.json()

        if result.get("success") and result.get("result"):
            return result["result"][0]
        return None
    except requests.RequestException as e:
        logger.error(f"Cloudflare API error: {e}")
        return None


def delete_subdomain(subdomain: str) -> dict:
    """
    Delete an A record for a subdomain.

    Args:
        subdomain: The subdomain name

    Returns:
        dict with success status
    """
    cfg_err = _config_error()
    if cfg_err:
        return cfg_err

    record = get_dns_record(subdomain)

    if not record:
        return {
            "success": True,
            "message": "Record not found (already deleted)",
        }

    record_id = record.get("id")
    url = f"{CLOUDFLARE_API_BASE}/zones/{CLOUDFLARE_ZONE_ID}/dns_records/{record_id}"

    try:
        response = requests.delete(url, headers=_get_headers(), timeout=30)
        result = response.json()

        if result.get("success"):
            logger.info(f"Deleted DNS record: {subdomain}.{CLOUDFLARE_DOMAIN}")
            return {
                "success": True,
                "message": f"Deleted: {subdomain}.{CLOUDFLARE_DOMAIN}",
            }
        else:
            errors = result.get("errors", [])
            error_msg = errors[0].get("message") if errors else "Unknown error"
            return {
                "success": False,
                "error": error_msg,
            }
    except requests.RequestException as e:
        logger.error(f"Cloudflare API error: {e}")
        return {
            "success": False,
            "error": str(e),
        }


def list_tenant_subdomains() -> list:
    """
    List all DNS records under the domain.

    Returns:
        List of DNS records
    """
    if _config_error():
        return []

    url = f"{CLOUDFLARE_API_BASE}/zones/{CLOUDFLARE_ZONE_ID}/dns_records"

    params = {
        "type": "A",
        "per_page": 100,
    }

    try:
        response = requests.get(url, headers=_get_headers(), params=params, timeout=30)
        result = response.json()

        if result.get("success"):
            records = result.get("result", [])
            # Filter only subdomains of our domain
            return [
                {
                    "name": r["name"],
                    "content": r["content"],
                    "proxied": r["proxied"],
                    "id": r["id"],
                }
                for r in records
                if r["name"].endswith(f".{CLOUDFLARE_DOMAIN}")
            ]
        return []
    except requests.RequestException as e:
        logger.error(f"Cloudflare API error: {e}")
        return []

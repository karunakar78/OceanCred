"""
Send notifications via Expo Push Service (works when the app is backgrounded or killed).
See https://docs.expo.dev/push-notifications/sending-notifications/
"""

from __future__ import annotations

import json
from typing import Any, Dict, Optional

import requests

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_expo_push_notification(
    expo_token: str,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
) -> bool:
    if not expo_token or not isinstance(expo_token, str) or len(expo_token) < 20:
        return False

    payload: Dict[str, Any] = {
        "to": expo_token,
        "title": title,
        "body": body,
        "sound": "default",
        "priority": "high",
        "channelId": "seacred-default",
    }
    if data:
        payload["data"] = data

    try:
        r = requests.post(
            EXPO_PUSH_URL,
            data=json.dumps(payload),
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            timeout=12,
        )
        if r.status_code != 200:
            print(f"[expo push] HTTP {r.status_code}: {r.text[:300]}")
            return False
        result = r.json()
        errors = []
        for item in result.get("data", []) or []:
            if item.get("status") == "error":
                errors.append(item.get("message", item))
        if errors:
            print(f"[expo push] errors: {errors}")
            return False
        return True
    except Exception as e:
        print(f"[expo push] exception: {e}")
        return False

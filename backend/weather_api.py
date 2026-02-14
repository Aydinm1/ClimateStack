"""Fetch and cache current weather from WeatherAPI.com for Davis, CA."""

import os
import time
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "")
CACHE_SECONDS = 600  # 10 minutes

_cache = {"data": None, "fetched_at": 0.0}


def get_current():
    """Return current Davis weather dict or None if unavailable.

    Keys: temp_f, humidity, feelslike_f, vis_ft, wind_mph
    Cached for CACHE_SECONDS to avoid hammering the free tier.
    """
    if not WEATHER_API_KEY:
        return None

    now = time.time()
    if _cache["data"] and (now - _cache["fetched_at"]) < CACHE_SECONDS:
        return _cache["data"]

    try:
        url = "https://api.weatherapi.com/v1/current.json"
        resp = httpx.get(url, params={"key": WEATHER_API_KEY, "q": "Davis,CA"}, timeout=5)
        resp.raise_for_status()
        c = resp.json()["current"]
        data = {
            "temp_f": c["temp_f"],
            "humidity": c["humidity"],
            "feelslike_f": c["feelslike_f"],
            "vis_ft": c["vis_miles"] * 5280,
            "wind_mph": c["wind_mph"],
        }
        _cache["data"] = data
        _cache["fetched_at"] = now
        logger.info("WeatherAPI fetch OK: %.1f°F, %d%% humidity", data["temp_f"], data["humidity"])
        return data
    except Exception as exc:
        logger.warning("WeatherAPI fetch failed: %s", exc)
        return _cache["data"]  # return stale cache if available, else None

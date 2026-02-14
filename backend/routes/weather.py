"""Real weather endpoint — returns live Davis conditions from WeatherAPI.com."""

from fastapi import APIRouter
from weather_api import get_current

router = APIRouter()


@router.get("/api/weather")
def weather():
    data = get_current()
    if data is None:
        return {"available": False}
    return {"available": True, **data}

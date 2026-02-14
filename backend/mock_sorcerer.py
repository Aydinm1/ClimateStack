"""Mocked Sorcerer atmospheric context data."""

import random
from datetime import datetime, timezone
from models import SorcererAtmospheric

WIND_DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]

_PROFILES = {
    "clear_day": {
        "wind": (3, 10), "blh": (800, 1500), "dpd": (15, 30),
        "fog_prob": (0.0, 0.05), "inversion": (0.0, 0.1),
    },
    "heat_wave": {
        "wind": (2, 8), "blh": (1200, 2000), "dpd": (20, 40),
        "fog_prob": (0.0, 0.02), "inversion": (0.0, 0.05),
    },
    "light_fog": {
        "wind": (0, 3), "blh": (100, 300), "dpd": (0, 3),
        "fog_prob": (0.5, 0.75), "inversion": (0.5, 0.7),
    },
    "dense_tule_fog": {
        "wind": (0, 2), "blh": (50, 150), "dpd": (0, 1),
        "fog_prob": (0.8, 0.98), "inversion": (0.7, 0.95),
    },
    "extreme_combo": {
        "wind": (1, 5), "blh": (100, 400), "dpd": (2, 8),
        "fog_prob": (0.5, 0.8), "inversion": (0.4, 0.7),
    },
}


def generate_atmospheric(scenario: str = "clear_day") -> SorcererAtmospheric:
    p = _PROFILES.get(scenario, _PROFILES["clear_day"])
    return SorcererAtmospheric(
        wind_speed_mph=round(random.uniform(*p["wind"]), 1),
        wind_direction=random.choice(WIND_DIRS),
        boundary_layer_height_m=round(random.uniform(*p["blh"]), 0),
        dew_point_depression_f=round(random.uniform(*p["dpd"]), 1),
        fog_probability=round(random.uniform(*p["fog_prob"]), 3),
        inversion_strength=round(random.uniform(*p["inversion"]), 3),
        timestamp=datetime.now(timezone.utc),
    )

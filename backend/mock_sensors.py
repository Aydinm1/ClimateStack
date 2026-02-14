"""Simulated heat + fog sensor data generator with smooth drift."""

import random
from typing import Optional
from datetime import datetime, timezone
from config import INTERSECTIONS, SCENARIOS, GRID_COLS, GRID_ROWS
from models import SensorReading


def compute_heat_index(temp_f: float, humidity: float) -> float:
    """Simplified Rothfusz regression for heat index."""
    if temp_f < 80:
        return temp_f
    hi = (
        -42.379
        + 2.04901523 * temp_f
        + 10.14333127 * humidity
        - 0.22475541 * temp_f * humidity
        - 0.00683783 * temp_f**2
        - 0.05481717 * humidity**2
        + 0.00122874 * temp_f**2 * humidity
        + 0.00085282 * temp_f * humidity**2
        - 0.00000199 * temp_f**2 * humidity**2
    )
    return round(hi, 1)


# Wider zone temperature offsets (~18°F spread across zones)
_ZONE_TEMP_OFFSETS = {
    "downtown": (4, 10),     # urban heat island
    "campus":   (-8, -4),    # tree canopy, irrigation
    "north":    (-3, 2),
    "south":    (-2, 3),
    "east":     (-1, 4),
    "west":     (-1, 4),
}

# Persistent per-node state for smooth drifting
_node_state: dict[str, dict] = {}
_last_scenario: Optional[str] = None

# How much the previous value influences the next (0=fully random, 1=frozen)
_DRIFT_ALPHA = 0.85
# Max jitter per tick
_DRIFT_TEMP = 0.6       # °F
_DRIFT_HUMIDITY = 1.0    # %
_DRIFT_VIS = 80          # ft


def _zone_modifier(zone: str, scenario: str) -> dict:
    """Zone-based adjustments: downtown hotter, south/low-lying fogs first."""
    mods = {"temp_offset": 0.0, "vis_multiplier": 1.0}
    if "heat" in scenario or scenario == "live":
        offsets = _ZONE_TEMP_OFFSETS.get(zone, (-1, 1))
        mods["temp_offset"] = random.uniform(*offsets)
    if "fog" in scenario:
        if zone == "south":
            mods["vis_multiplier"] = random.uniform(0.15, 0.35)
        elif zone == "downtown":
            mods["vis_multiplier"] = random.uniform(1.0, 2.5)
        elif zone == "north":
            mods["vis_multiplier"] = random.uniform(0.4, 0.8)
        elif zone == "east":
            mods["vis_multiplier"] = random.uniform(0.6, 1.4)
        elif zone == "west":
            mods["vis_multiplier"] = random.uniform(0.3, 0.7)
        elif zone == "campus":
            mods["vis_multiplier"] = random.uniform(0.8, 1.8)
    return mods


# Stable per-node spatial weight for fog (seeded once, persists for session).
# Creates a gradient: some intersections are fog-prone, others stay clearer.
_fog_weights: dict[str, float] = {}

def _fog_spatial_weight(node_id: str) -> float:
    """Return a stable 0-1 fog-proneness weight for this node.

    Based on grid position: south-west nodes are low-lying fog sinks,
    north-east nodes are higher / more sheltered.  A per-node random offset
    adds local variation so adjacent blocks aren't identical.
    """
    if node_id in _fog_weights:
        return _fog_weights[node_id]

    # Parse node index (1-based) from id like "node_003"
    idx = int(node_id.split("_")[1]) - 1
    intersection = idx // 4
    row = intersection // GRID_COLS
    col = intersection % GRID_COLS

    # Gradient: row 0 (south) + col 0 (west) = foggiest
    row_factor = 1.0 - (row / max(GRID_ROWS - 1, 1))  # south=1, north=0
    col_factor = 1.0 - (col / max(GRID_COLS - 1, 1))  # west=1, east=0
    base = 0.6 * row_factor + 0.4 * col_factor  # 0-1, SW corner is ~1.0

    # Per-node jitter so corners of the same intersection differ slightly
    jitter = random.uniform(-0.12, 0.12)
    weight = max(0.05, min(1.0, base + jitter))
    _fog_weights[node_id] = weight
    return weight


def _target_values(node, scenario, preset, live_weather):
    """Compute a fresh random target for this node."""
    mods = _zone_modifier(node["zone"], scenario)

    if preset:
        temp = random.uniform(*preset["temp_range"]) + mods["temp_offset"]
        humidity = random.uniform(*preset["humidity_range"])
        vis = random.uniform(*preset["visibility_range"]) * mods["vis_multiplier"]
    else:
        temp = live_weather["temp_f"] + mods["temp_offset"] + random.uniform(-2, 2)
        humidity = live_weather["humidity"] + random.uniform(-5, 5)
        vis = live_weather["vis_ft"] * mods["vis_multiplier"] * random.uniform(0.85, 1.15)

    # Fog spatial gradient: fog-prone nodes get much lower visibility
    if "fog" in scenario:
        w = _fog_spatial_weight(node["id"])
        # w=1 → dense fog pocket (vis * 0.05-0.15), w=0 → lighter fog (vis * 0.8-1.5)
        fog_scale = (1 - w) * 1.3 + 0.05 + random.uniform(0, 0.10)
        vis *= max(0.05, fog_scale)

    return temp, humidity, max(5, vis)


def generate_readings(
    scenario: str = "clear_day",
    live_weather=None,
) -> list:
    global _last_scenario

    readings = []
    now = datetime.now(timezone.utc)

    # Reset state on scenario change so values converge quickly to new range
    if scenario != _last_scenario:
        _node_state.clear()
        _last_scenario = scenario

    # For "live" scenario, build a pseudo-preset from real weather
    if scenario == "live" and live_weather:
        preset = None
    else:
        fallback = "clear_day" if scenario == "live" else scenario
        preset = SCENARIOS.get(fallback, SCENARIOS["clear_day"])

    for node in INTERSECTIONS:
        nid = node["id"]
        target_temp, target_hum, target_vis = _target_values(
            node, scenario, preset, live_weather
        )

        if nid in _node_state:
            # Smooth drift: blend previous value toward target
            prev = _node_state[nid]
            alpha = _DRIFT_ALPHA
            temp = prev["temp"] * alpha + target_temp * (1 - alpha) + random.uniform(-_DRIFT_TEMP, _DRIFT_TEMP)
            humidity = prev["humidity"] * alpha + target_hum * (1 - alpha) + random.uniform(-_DRIFT_HUMIDITY, _DRIFT_HUMIDITY)
            vis = prev["vis"] * alpha + target_vis * (1 - alpha) + random.uniform(-_DRIFT_VIS, _DRIFT_VIS)
        else:
            # First tick: seed with target values
            temp = target_temp
            humidity = target_hum
            vis = target_vis

        vis = max(5, vis)
        temp = round(temp, 1)
        humidity = round(min(100, max(0, humidity)), 1)
        vis = round(vis, 0)
        heat_index = compute_heat_index(temp, humidity)

        # Store for next tick
        _node_state[nid] = {"temp": temp, "humidity": humidity, "vis": vis}

        readings.append(SensorReading(
            node_id=node["id"],
            name=node["name"],
            lat=node["lat"],
            lng=node["lng"],
            zone=node["zone"],
            temp_f=temp,
            humidity=humidity,
            visibility_ft=vis,
            heat_index_f=heat_index,
            timestamp=now,
        ))
    return readings

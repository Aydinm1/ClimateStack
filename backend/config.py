"""Davis geography, thresholds, and weights."""

# Downtown Davis grid: B–G St (west→east) × 2nd–5th St (south→north)
# Dense grid includes mid-block sensor points between each street pair.
# Anchor: 2nd & B = (38.5427, -121.7440) from OSM
# Block vectors derived from user-supplied block corners:
#   North (per numbered street): lat +0.001280, lng -0.000350
#   East  (per lettered street): lat +0.000189, lng +0.001103
_ANCHOR = (38.5431, -121.7437)
_NORTH = (0.001280, -0.000350)   # 2nd→3rd, 3rd→4th, 4th→5th
_EAST = (0.000189, 0.001103)     # B→C, C→D, D→E, E→F, F→G

_STREETS_NS = ["B", "C", "D", "E", "F", "G"]   # cols 0-5

# 8 rows: original 4 streets + 3 mid-block rows + 1 north extension
# Row step uses half the _NORTH vector for mid-block points
_ROW_DEFS = [
    ("2nd",     0.0),
    ("2nd-3rd", 0.5),
    ("3rd",     1.0),
    ("3rd-4th", 1.5),
    ("4th",     2.0),
    ("4th-5th", 2.5),
    ("5th",     3.0),
    ("5th-6th", 3.5),
]

GRID_COLS = len(_STREETS_NS)  # 6
GRID_ROWS = len(_ROW_DEFS)    # 8

_CENTERS = []
for _ew, _r in _ROW_DEFS:
    for _c, _ns in enumerate(_STREETS_NS):
        _lat = round(_ANCHOR[0] + _r * _NORTH[0] + _c * _EAST[0], 6)
        _lng = round(_ANCHOR[1] + _r * _NORTH[1] + _c * _EAST[1], 6)
        _CENTERS.append((f"{_ew} & {_ns} St", _lat, _lng, "downtown"))

# Intersection corner offsets (~15 m, tight clustering)
_OFFSETS = [
    ("NW", +0.00013, -0.00017),
    ("NE", +0.00013, +0.00017),
    ("SW", -0.00013, -0.00017),
    ("SE", -0.00013, +0.00017),
]

INTERSECTIONS = []
for _i, (name, lat, lng, zone) in enumerate(_CENTERS, start=1):
    for _j, (corner, dlat, dlng) in enumerate(_OFFSETS, start=1):
        INTERSECTIONS.append({
            "id": f"node_{(_i - 1) * 4 + _j:03d}",
            "name": f"{name} — {corner}",
            "lat": round(lat + dlat, 4),
            "lng": round(lng + dlng, 4),
            "zone": zone,
        })

# Thresholds (Fahrenheit / feet)
HEAT_ADVISORY_F = 105
HEAT_WARNING_F = 110
FOG_ADVISORY_FT = 500
FOG_WARNING_FT = 200
FOG_EMERGENCY_FT = 50

# Risk fusion weights
WEIGHT_SENSOR_HEAT = 0.35
WEIGHT_SENSOR_FOG = 0.35
WEIGHT_SORCERER_PRIOR = 0.30

# Scenario presets
SCENARIOS = {
    "clear_day": {
        "description": "Normal conditions, everything green",
        "temp_range": (85, 92),
        "humidity_range": (20, 35),
        "visibility_range": (5000, 10000),
    },
    "mild_heat": {
        "description": "Warm day, scattered hot spots",
        "temp_range": (92, 100),
        "humidity_range": (20, 35),
        "visibility_range": (5000, 10000),
    },
    "heat_wave": {
        "description": "Extreme heat, no fog",
        "temp_range": (105, 118),
        "humidity_range": (15, 30),
        "visibility_range": (5000, 10000),
    },
    "light_fog": {
        "description": "Mild fog, cool temps",
        "temp_range": (45, 55),
        "humidity_range": (90, 98),
        "visibility_range": (200, 1200),
    },
    "dense_tule_fog": {
        "description": "Severe tule fog, patchy near-zero visibility",
        "temp_range": (38, 48),
        "humidity_range": (90, 100),
        "visibility_range": (10, 800),
    },
"live": {
        "description": "Real-time Davis weather from WeatherAPI.com",
    },
}

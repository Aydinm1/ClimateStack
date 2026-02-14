"""Fusion: sensors + Sorcerer atmospheric prior → risk scores."""

from config import WEIGHT_SENSOR_HEAT, WEIGHT_SENSOR_FOG, WEIGHT_SORCERER_PRIOR
from models import SensorReading, SorcererAtmospheric, IntersectionRisk, RiskLevel


def _normalize(value: float, low: float, high: float) -> float:
    """Normalize value to 0-100 range."""
    return max(0, min(100, (value - low) / (high - low) * 100))


def _classify(score: float) -> RiskLevel:
    if score < 25:
        return RiskLevel.LOW
    elif score < 50:
        return RiskLevel.MODERATE
    elif score < 75:
        return RiskLevel.HIGH
    return RiskLevel.EXTREME


def compute_risk(
    reading: SensorReading,
    atmospheric: SorcererAtmospheric,
) -> IntersectionRisk:
    factors = []

    # Heat risk: heat_index 85F=0, 120F=100
    heat_raw = _normalize(reading.heat_index_f, 85, 120)
    if heat_raw > 30:
        factors.append(f"Heat index {reading.heat_index_f:.0f}°F")

    # Sorcerer humidity boost for heat
    if reading.humidity > 60 and heat_raw > 20:
        boost = (reading.humidity - 60) / 40 * 15
        heat_raw = min(100, heat_raw + boost)
        factors.append(f"High humidity ({reading.humidity:.0f}%) amplifying heat")

    # Fog risk: inverse normalize visibility (2000ft=0, 50ft=100)
    fog_raw = _normalize(2000 - reading.visibility_ft, 0, 1950)
    if fog_raw > 30:
        factors.append(f"Visibility {reading.visibility_ft:.0f}ft")

    # Sorcerer prior adjustments
    sorcerer_boost = 0.0
    if atmospheric.fog_probability > 0.5:
        fog_boost = atmospheric.fog_probability * 30
        sorcerer_boost += fog_boost
        fog_raw = min(100, fog_raw + fog_boost * 0.3)
        factors.append(f"Sorcerer fog probability {atmospheric.fog_probability:.0%}")

    if atmospheric.inversion_strength > 0.5:
        inv_boost = atmospheric.inversion_strength * 20
        sorcerer_boost += inv_boost
        factors.append(f"Temperature inversion (strength {atmospheric.inversion_strength:.2f})")

    if atmospheric.boundary_layer_height_m < 200:
        blh_boost = (200 - atmospheric.boundary_layer_height_m) / 200 * 25
        sorcerer_boost += blh_boost
        factors.append(f"Low boundary layer ({atmospheric.boundary_layer_height_m:.0f}m)")

    sorcerer_score = min(100, sorcerer_boost)

    # Combined: dominant hazard (70%) + secondary (15%) + sorcerer prior (15%)
    primary = max(heat_raw, fog_raw)
    secondary = min(heat_raw, fog_raw)
    combined = primary * 0.70 + secondary * 0.15 + sorcerer_score * 0.15
    combined = min(100, max(0, combined))

    if not factors:
        factors.append("Conditions normal")

    return IntersectionRisk(
        node_id=reading.node_id,
        name=reading.name,
        lat=reading.lat,
        lng=reading.lng,
        zone=reading.zone,
        heat_risk=round(heat_raw, 1),
        fog_risk=round(fog_raw, 1),
        combined_risk=round(combined, 1),
        risk_level=_classify(combined),
        contributing_factors=factors,
        temp_f=reading.temp_f,
        visibility_ft=reading.visibility_ft,
    )


def compute_all_risks(
    readings: list[SensorReading],
    atmospheric: SorcererAtmospheric,
) -> list[IntersectionRisk]:
    return [compute_risk(r, atmospheric) for r in readings]

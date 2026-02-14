"""Pydantic models for the Davis Microclimate Safety Network."""

from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    EXTREME = "EXTREME"


class AlertType(str, Enum):
    HEAT_ADVISORY = "heat_advisory"
    HEAT_WARNING = "heat_warning"
    FOG_ADVISORY = "fog_advisory"
    FOG_WARNING = "fog_warning"
    FOG_EMERGENCY = "fog_emergency"


class AlertSeverity(str, Enum):
    ADVISORY = "advisory"
    WARNING = "warning"
    EMERGENCY = "emergency"


class SensorReading(BaseModel):
    node_id: str
    name: str
    lat: float
    lng: float
    zone: str
    temp_f: float
    humidity: float
    visibility_ft: float
    heat_index_f: float
    timestamp: datetime


class SorcererAtmospheric(BaseModel):
    wind_speed_mph: float
    wind_direction: str
    boundary_layer_height_m: float
    dew_point_depression_f: float
    fog_probability: float
    inversion_strength: float
    timestamp: datetime


class IntersectionRisk(BaseModel):
    node_id: str
    name: str
    lat: float
    lng: float
    zone: str
    heat_risk: float
    fog_risk: float
    combined_risk: float
    risk_level: RiskLevel
    contributing_factors: list[str]
    temp_f: float
    visibility_ft: float


class Alert(BaseModel):
    id: str
    node_id: str
    node_name: str
    alert_type: AlertType
    severity: AlertSeverity
    message: str
    active: bool
    timestamp: datetime
    resolved_at: Optional[datetime] = None

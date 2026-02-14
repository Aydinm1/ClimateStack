"""Threshold crossing → alert generation with stateful tracking.

Alerts are per-intersection (average of 4 corner nodes), not per-sensor.
"""

import uuid
from datetime import datetime, timezone
from config import (
    HEAT_ADVISORY_F, HEAT_WARNING_F,
    FOG_ADVISORY_FT, FOG_WARNING_FT, FOG_EMERGENCY_FT,
)
from models import SensorReading, Alert, AlertType, AlertSeverity

MAX_ALERTS = 50
SUSTAIN_TICKS = 4  # condition must persist this many consecutive ticks (~12s at 3s/tick)


def _group_intersections(readings: list[SensorReading]) -> list[dict]:
    """Group sensors into intersections of 4 corners, return averaged values."""
    sorted_r = sorted(readings, key=lambda r: r.node_id)
    groups = []
    for i in range(0, len(sorted_r) - 3, 4):
        corners = sorted_r[i:i + 4]
        avg_temp = sum(c.temp_f for c in corners) / 4
        avg_hi = sum(c.heat_index_f for c in corners) / 4
        avg_vis = sum(c.visibility_ft for c in corners) / 4
        # Use intersection name: strip the corner suffix (e.g. " — NW")
        base_name = corners[0].name.rsplit(" — ", 1)[0] if " — " in corners[0].name else corners[0].name
        # Use a stable intersection id from the first corner
        int_id = f"int_{i // 4 + 1:02d}"
        groups.append({
            "int_id": int_id,
            "name": base_name,
            "temp_f": round(avg_temp, 1),
            "heat_index_f": round(avg_hi, 1),
            "visibility_ft": round(avg_vis, 0),
        })
    return groups


class AlertEngine:
    def __init__(self):
        self.active_alerts: dict[str, Alert] = {}  # key: "int_id:alert_type"
        self.alert_history: list[Alert] = []
        self._pending: dict[str, int] = {}  # key -> first_seen tick

    def _key(self, int_id: str, alert_type: AlertType) -> str:
        return f"{int_id}:{alert_type.value}"

    def _fire(self, int_id: str, name: str, alert_type: AlertType, severity: AlertSeverity, message: str, tick: int):
        key = self._key(int_id, alert_type)
        if key in self.active_alerts:
            return

        # Debounce: require condition to persist for SUSTAIN_TICKS before firing
        if key not in self._pending:
            self._pending[key] = tick
            return
        if tick - self._pending[key] < SUSTAIN_TICKS:
            return

        # Sustained long enough — fire the alert
        self._pending.pop(key, None)
        alert = Alert(
            id=str(uuid.uuid4())[:8],
            node_id=int_id,
            node_name=name,
            alert_type=alert_type,
            severity=severity,
            message=message,
            active=True,
            timestamp=datetime.now(timezone.utc),
        )
        self.active_alerts[key] = alert
        self.alert_history.append(alert)
        if len(self.alert_history) > MAX_ALERTS:
            self.alert_history = self.alert_history[-MAX_ALERTS:]

    def _resolve(self, int_id: str, alert_type: AlertType):
        key = self._key(int_id, alert_type)
        self._pending.pop(key, None)
        if key in self.active_alerts:
            alert = self.active_alerts.pop(key)
            alert.active = False
            alert.resolved_at = datetime.now(timezone.utc)

    def process(self, readings: list[SensorReading], tick: int = 0) -> list[Alert]:
        intersections = _group_intersections(readings)

        for ix in intersections:
            int_id = ix["int_id"]
            name = ix["name"]

            # Heat alerts (based on intersection average heat index)
            if ix["heat_index_f"] >= HEAT_WARNING_F:
                self._fire(int_id, name, AlertType.HEAT_WARNING, AlertSeverity.WARNING,
                           f"HEAT WARNING: {name} avg heat index {ix['heat_index_f']:.0f}°F", tick)
            elif ix["heat_index_f"] >= HEAT_ADVISORY_F:
                self._fire(int_id, name, AlertType.HEAT_ADVISORY, AlertSeverity.ADVISORY,
                           f"Heat Advisory: {name} avg heat index {ix['heat_index_f']:.0f}°F", tick)
                self._resolve(int_id, AlertType.HEAT_WARNING)
            else:
                self._resolve(int_id, AlertType.HEAT_ADVISORY)
                self._resolve(int_id, AlertType.HEAT_WARNING)

            # Fog alerts (based on intersection average visibility)
            if ix["visibility_ft"] <= FOG_EMERGENCY_FT:
                self._fire(int_id, name, AlertType.FOG_EMERGENCY, AlertSeverity.EMERGENCY,
                           f"FOG EMERGENCY: {name} avg visibility {ix['visibility_ft']:.0f}ft — DANGER", tick)
            elif ix["visibility_ft"] <= FOG_WARNING_FT:
                self._fire(int_id, name, AlertType.FOG_WARNING, AlertSeverity.WARNING,
                           f"Fog Warning: {name} avg visibility {ix['visibility_ft']:.0f}ft", tick)
                self._resolve(int_id, AlertType.FOG_EMERGENCY)
            elif ix["visibility_ft"] <= FOG_ADVISORY_FT:
                self._fire(int_id, name, AlertType.FOG_ADVISORY, AlertSeverity.ADVISORY,
                           f"Fog Advisory: {name} avg visibility {ix['visibility_ft']:.0f}ft", tick)
                self._resolve(int_id, AlertType.FOG_WARNING)
                self._resolve(int_id, AlertType.FOG_EMERGENCY)
            else:
                self._resolve(int_id, AlertType.FOG_ADVISORY)
                self._resolve(int_id, AlertType.FOG_WARNING)
                self._resolve(int_id, AlertType.FOG_EMERGENCY)

        return self.get_alerts()

    def clear(self):
        for alert in self.active_alerts.values():
            alert.active = False
            alert.resolved_at = datetime.now(timezone.utc)
        self.active_alerts.clear()
        self._pending.clear()
        self.alert_history.clear()

    def get_alerts(self) -> list[Alert]:
        active = list(self.active_alerts.values())
        recent_resolved = [a for a in self.alert_history if not a.active][-10:]
        return sorted(active + recent_resolved, key=lambda a: a.timestamp, reverse=True)

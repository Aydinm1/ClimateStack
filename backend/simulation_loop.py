"""Background asyncio task — simulation tick every 3 seconds."""

import asyncio
import json
from datetime import datetime, timezone

from mock_sensors import generate_readings
from mock_sorcerer import generate_atmospheric
from risk_engine import compute_all_risks
from alert_engine import AlertEngine
import weather_api


class AppState:
    def __init__(self):
        self.scenario: str = "clear_day"
        self.readings = []
        self.atmospheric = None
        self.risks = []
        self.alerts = []
        self.alert_engine = AlertEngine()
        self.ws_clients: list = []
        self.tick_count: int = 0

    def snapshot(self) -> dict:
        return {
            "scenario": self.scenario,
            "tick": self.tick_count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "sensors": [r.model_dump(mode="json") for r in self.readings],
            "atmospheric": self.atmospheric.model_dump(mode="json") if self.atmospheric else None,
            "risks": [r.model_dump(mode="json") for r in self.risks],
            "alerts": [a.model_dump(mode="json") for a in self.alerts],
        }


state = AppState()


async def simulation_tick():
    live_weather = weather_api.get_current() if state.scenario == "live" else None
    state.readings = generate_readings(state.scenario, live_weather=live_weather)
    state.atmospheric = generate_atmospheric(state.scenario)
    state.risks = compute_all_risks(state.readings, state.atmospheric)
    state.alerts = state.alert_engine.process(state.readings, tick=state.tick_count)
    state.tick_count += 1

    # Broadcast to WebSocket clients
    if state.ws_clients:
        data = json.dumps(state.snapshot(), default=str)
        disconnected = []
        for ws in state.ws_clients:
            try:
                await ws.send_text(data)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            state.ws_clients.remove(ws)


async def run_simulation():
    while True:
        await simulation_tick()
        await asyncio.sleep(3)

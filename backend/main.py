"""FastAPI app — Davis Microclimate Safety Network."""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from simulation_loop import state, run_simulation, simulation_tick
from routes import sensors, risk, alerts, ws, weather
from config import SCENARIOS


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run one tick immediately so endpoints have data
    await simulation_tick()
    task = asyncio.create_task(run_simulation())
    yield
    task.cancel()


app = FastAPI(title="Davis Microclimate Safety Network", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensors.router)
app.include_router(risk.router)
app.include_router(alerts.router)
app.include_router(ws.router)
app.include_router(weather.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "scenario": state.scenario, "tick": state.tick_count}


@app.post("/api/scenario/{preset}")
def set_scenario(preset: str):
    if preset not in SCENARIOS:
        return {"error": f"Unknown preset. Options: {list(SCENARIOS.keys())}"}
    state.scenario = preset
    return {"scenario": preset, "description": SCENARIOS[preset]["description"]}

# Davis Microclimate Safety Network

A real-time microclimate monitoring and risk assessment dashboard for Davis, CA. The system simulates a network of 60 sensor nodes across 15 intersections, fusing sensor data with atmospheric priors to compute heat and fog risk scores and generate safety alerts.

## Architecture

- **Backend** — Python / FastAPI with WebSocket support for live updates
- **Frontend** — React + Vite with Mantine UI and Mapbox GL for map visualization

## Features

- Live sensor readings (temperature, humidity, visibility) across Davis intersections
- Risk fusion engine combining sensor data with atmospheric conditions (wind, inversion layers, boundary layer height)
- Four-tier risk classification: LOW / MODERATE / HIGH / EXTREME
- Automated alerts for heat advisories/warnings and fog advisories/warnings/emergencies
- Interactive map with real-time risk overlays
- Switchable scenario presets: `clear_day`, `heat_wave`, `light_fog`, `dense_tule_fog`, `extreme_combo`

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`. Health check: `GET /api/health`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check with current scenario and tick |
| GET | `/api/sensors` | Latest sensor readings for all nodes |
| GET | `/api/risk` | Computed risk scores for all intersections |
| GET | `/api/alerts` | Active alerts |
| POST | `/api/scenario/{preset}` | Switch simulation scenario |
| WS | `/ws` | WebSocket stream for live updates |

## Tech Stack

- **FastAPI** + **Uvicorn** — async API server
- **Pydantic** — data validation and models
- **React 18** + **Vite** — frontend build
- **Mantine 7** — UI components
- **Mapbox GL / react-map-gl** — map rendering

## Hackathon Assets

- Pitch script and Q&A: `docs/HACKATHON_PITCH.md`
- Live demo steps: `docs/DEMO_RUNBOOK.md`

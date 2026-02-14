# Davis Microclimate Safety Network

A real-time microclimate monitoring and risk assessment dashboard for Davis, CA. The system simulates a network of 190 sensor nodes across 15 intersections, fusing sensor data with atmospheric priors to compute heat and fog risk scores and generate safety alerts.

## MiClimate

**MiClimate** is the project name for this microclimate safety platform.  
The idea is simple: large weather alerts are too broad, but street-level microclimates can change quickly and create very different risks block by block.

In California, this matters at scale:

- Tule Fog affects about **20 counties** or around **13 million people**
- Extreme Heat affects **all counties** or around **39.5 million people**

### How MiClimate Works

- A real-time system monitors custom-designed sensors across intersections
- Raw weather inputs are translated into clear, actionable risk scores
- Core sensing concept includes thermo + fog sensors mounted on traffic lights
- Hardware pathway includes a potential radiation shield and solar panel for resilient field deployment

### Why This Matters

MiClimate is designed to convert noisy environmental signals into understandable safety guidance for drivers, cyclists, and pedestrians in real time.

### Future Extension: ClimateSensor

A related application, **ClimateSensor**, extends this approach into agriculture by combining:

- pH sensing for soil/water condition tracking
- temperature and fog implications for farm operations and crop risk monitoring

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

| Method | Path                     | Description                                 |
| ------ | ------------------------ | ------------------------------------------- |
| GET    | `/api/health`            | Health check with current scenario and tick |
| GET    | `/api/sensors`           | Latest sensor readings for all nodes        |
| GET    | `/api/risk`              | Computed risk scores for all intersections  |
| GET    | `/api/alerts`            | Active alerts                               |
| POST   | `/api/scenario/{preset}` | Switch simulation scenario                  |
| WS     | `/ws`                    | WebSocket stream for live updates           |

## Tech Stack

- **FastAPI** + **Uvicorn** — async API server
- **Pydantic** — data validation and models
- **React 18** + **Vite** — frontend build
- **Mantine 7** — UI components
- **Mapbox GL / react-map-gl** — map rendering

# Demo Runbook (Judge Flow)

## Goal
Deliver a clean 60-90 second live demo showing:
1. Real-time city risk intelligence
2. Personalized user guidance

## Pre-Demo Setup

1. Start backend:
```bash
cd backend
uvicorn main:app --reload
```

2. Start frontend:
```bash
cd frontend
npm run dev
```

3. Open app at `http://localhost:5173`.

## Primary Demo Sequence

1. **Dashboard view (`/`)**
Say: "This is a live microclimate map of Davis intersections."

2. Point to changing markers / top risk list / alert banner.
Say: "Each intersection gets a fused heat and fog risk score and an alert level in real time."

3. Mention architecture in one line.
Say: "FastAPI computes risk, WebSockets stream updates, and React + Mapbox renders live safety intelligence."

4. Click **User Insights** (`/user`).
Say: "Now we personalize this to the person, not just the location."

5. Answer a few yes/no questions (mark dehydration + exposure examples).
Say: "This quick profile captures personal vulnerability, like dehydration risk."

6. Click **Generate Custom Insights**.
Say: "Now the system recommends what to avoid and where to route instead."

7. In chat, type: `Which intersection should I avoid?`
Say: "It gives tailored route-level guidance based on both live risk and this user profile."

8. Close with roadmap line.
Say: "Next, we’d connect live city sensors and navigation integrations for real pilot deployment."

## Suggested Scenario For Strong Visuals

- Use the `extreme_combo` or `dense_tule_fog` scenario from the Scenario controls for clear map and alert changes.

## Fallback Lines (If Something Fails)

### If WebSocket stalls
"Even if streaming pauses, this run still demonstrates the full pipeline: sensor conditions, risk scoring, and personalized recommendation logic."

### If map token or map view fails
"The risk list and alerts are generated from the same live risk engine, so the core intelligence layer is still running."

### If chat response is delayed
"The recommendation engine can still be shown through generated insights from the profile panel."

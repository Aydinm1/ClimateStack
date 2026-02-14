from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from simulation_loop import state
import json

router = APIRouter()


@router.websocket("/ws/live")
async def websocket_live(ws: WebSocket):
    await ws.accept()
    state.ws_clients.append(ws)
    try:
        # Send initial snapshot
        await ws.send_text(json.dumps(state.snapshot(), default=str))
        # Keep connection alive — simulation_loop broadcasts updates
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if ws in state.ws_clients:
            state.ws_clients.remove(ws)

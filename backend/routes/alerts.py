from fastapi import APIRouter
from simulation_loop import state

router = APIRouter(prefix="/api")


@router.get("/alerts")
def get_alerts():
    return [a.model_dump(mode="json") for a in state.alerts]

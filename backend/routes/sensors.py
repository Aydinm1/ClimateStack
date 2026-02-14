from fastapi import APIRouter
from simulation_loop import state

router = APIRouter(prefix="/api")


@router.get("/sensors")
def get_sensors():
    return [r.model_dump(mode="json") for r in state.readings]

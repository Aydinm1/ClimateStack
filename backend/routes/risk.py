from fastapi import APIRouter, Query
from simulation_loop import state

router = APIRouter(prefix="/api")


@router.get("/risk-map")
def get_risk_map():
    return [r.model_dump(mode="json") for r in state.risks]


@router.get("/top-risk")
def get_top_risk(limit: int = Query(default=5, ge=1, le=15)):
    sorted_risks = sorted(state.risks, key=lambda r: r.combined_risk, reverse=True)
    return [r.model_dump(mode="json") for r in sorted_risks[:limit]]


@router.get("/sorcerer")
def get_sorcerer():
    if state.atmospheric:
        return state.atmospheric.model_dump(mode="json")
    return {}

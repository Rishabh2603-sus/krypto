from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field

from app.core.state import app_state
from app.services.cashflow import load_transactions
from app.ml.predict import forecast_cashflow

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


class ForecastPoint(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    p10: float = Field(..., description="10th percentile conservative estimate")
    p50: float = Field(..., description="50th percentile median projection")
    p90: float = Field(..., description="90th percentile optimistic estimate")


class ForecastResponse(BaseModel):
    days: int
    current_cash: float
    shortfall_date: Optional[str]
    runway_days: Optional[int]
    forecast: List[ForecastPoint]
    profile: str


@router.get("/predict", response_model=ForecastResponse)
def predict_forecast(days: int = Query(90, ge=7, le=180)):
    """
    Generate Monte Carlo cash flow forecasting for the specified horizon (7-180 days).
    Produces daily p10 (bearish), p50 (median), and p90 (bullish) cash curves.
    """
    try:
        data_path = app_state.get_dataset_path()
        df = load_transactions(str(data_path))
        result = forecast_cashflow(df, days=days)
        result["profile"] = app_state.get_profile()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate cash flow forecast: {str(e)}")

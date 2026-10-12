from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.state import app_state
from app.services.cashflow import (
    load_transactions,
    calculate_cashflow,
    calculate_category_breakdown,
    calculate_burn_rate,
    get_monthly_summary,
)

router = APIRouter(prefix="/api/cashflow", tags=["cashflow"])


class CashBalanceRecord(BaseModel):
    date: str
    description: str
    cash_change: float
    cash_balance: float


class CashflowSummaryResponse(BaseModel):
    opening_balance: float
    total_income: float
    total_expense: float
    net_cashflow: float
    current_cash: float
    transaction_count: int
    cash_balance_history: List[CashBalanceRecord]
    profile: str


class CategoryItem(BaseModel):
    total: float
    count: int
    pct: float


class CategoryBreakdownResponse(BaseModel):
    breakdown: Dict[str, CategoryItem]
    profile: str


class BurnRateResponse(BaseModel):
    daily_burn_rate: float
    monthly_burn_rate: float
    runway_days: float
    current_cash: float
    net_daily_burn: float
    profile: str


class MonthlySummaryItem(BaseModel):
    month: str
    income: float
    expense: float
    net: float
    transaction_count: int


@router.get("/summary", response_model=CashflowSummaryResponse)
def get_cashflow_summary():
    """
    Get cash flow summary metrics and sequential running balance history.
    Preserves existing API contract while dynamically pulling from active dataset.
    """
    try:
        data_path = app_state.get_dataset_path()
        df = load_transactions(str(data_path))
        cf = calculate_cashflow(df)
        cf["profile"] = app_state.get_profile()
        return cf
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate cash flow summary: {str(e)}")


@router.get("/breakdown", response_model=CategoryBreakdownResponse)
def get_category_breakdown():
    """
    Categorize transactions by business semantics into:
    Payroll, Raw Materials, Rent/Utilities, Operations, Revenue, and Other.
    """
    try:
        data_path = app_state.get_dataset_path()
        df = load_transactions(str(data_path))
        breakdown_data = calculate_category_breakdown(df)
        return CategoryBreakdownResponse(
            breakdown={k: CategoryItem(**v) for k, v in breakdown_data.items()},
            profile=app_state.get_profile(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate category breakdown: {str(e)}")


@router.get("/burn", response_model=BurnRateResponse)
def get_burn_rate():
    """
    Calculate average daily and monthly expense burn rates, along with projected runway days.
    """
    try:
        data_path = app_state.get_dataset_path()
        df = load_transactions(str(data_path))
        burn_data = calculate_burn_rate(df)
        burn_data["profile"] = app_state.get_profile()
        return BurnRateResponse(**burn_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate burn rate: {str(e)}")


@router.get("/monthly", response_model=List[MonthlySummaryItem])
def get_monthly_breakdown():
    """
    Get monthly aggregated income, expense, and net cashflow for financial bar charts.
    """
    try:
        data_path = app_state.get_dataset_path()
        df = load_transactions(str(data_path))
        summary = get_monthly_summary(df)
        return [MonthlySummaryItem(**item) for item in summary]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to aggregate monthly summary: {str(e)}")

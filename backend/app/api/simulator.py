from typing import List, Optional
from datetime import datetime, timedelta
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.state import app_state
from app.services.cashflow import load_transactions, calculate_cashflow
from app.ml.features import extract_features

router = APIRouter(prefix="/api/simulator", tags=["simulator"])


class SimulationParams(BaseModel):
    revenue_change_pct: float = Field(
        default=0.0,
        ge=-100.0,
        le=300.0,
        description="Percentage change in projected revenue (-100% to +300%)",
    )
    expense_change_pct: float = Field(
        default=0.0,
        ge=-100.0,
        le=300.0,
        description="Percentage change in operating expenses (-100% to +300%)",
    )
    receivables_delay_days: int = Field(
        default=0,
        ge=0,
        le=90,
        description="Shift in receivables collection cycle in days",
    )
    immediate_cash_infusion: float = Field(
        default=0.0,
        ge=0.0,
        description="One-time upfront capital injection (equity or debt) in INR",
    )
    immediate_capex: float = Field(
        default=0.0,
        ge=0.0,
        description="Immediate one-time capex or severance payout in INR",
    )
    days: int = Field(
        default=90,
        ge=14,
        le=180,
        description="Forecast horizon in days",
    )


class CurvePoint(BaseModel):
    date: str
    cash_balance: float


class SimulationResponse(BaseModel):
    baseline_runway: Optional[int]
    simulated_runway: Optional[int]
    delta_days: Optional[int]
    current_cash: float
    simulated_starting_cash: float
    baseline_curve: List[CurvePoint]
    simulated_curve: List[CurvePoint]
    summary_message: str


@router.post("/simulate", response_model=SimulationResponse)
def simulate_scenario(params: SimulationParams):
    """
    Simulate what-if financial decisions (revenue changes, cost cuts, delayed debtor collections,
    capex, and equity infusion) on cash runway and future cash trajectory curves.
    """
    try:
        data_path = app_state.get_dataset_path()
        df = load_transactions(str(data_path))
        cf = calculate_cashflow(df)
        features = extract_features(df)

        current_cash = cf["current_cash"]
        avg_income = max(0.0, features["avg_daily_income"])
        avg_expense = max(0.0, features["avg_daily_expense"])

        transactions = df[df["description"].str.lower().str.strip() != "opening balance"]
        if not transactions.empty:
            start_date = pd.to_datetime(transactions["date"].max()).to_pydatetime()
        else:
            start_date = datetime.now()

        days = params.days

        # Baseline projection
        baseline_balance = current_cash
        baseline_curve: List[CurvePoint] = [
            CurvePoint(date=start_date.strftime("%Y-%m-%d"), cash_balance=round(baseline_balance, 2))
        ]
        baseline_runway: Optional[int] = None

        for t in range(1, days + 1):
            cur_date = start_date + timedelta(days=t)
            baseline_balance += (avg_income - avg_expense)
            baseline_curve.append(
                CurvePoint(date=cur_date.strftime("%Y-%m-%d"), cash_balance=round(baseline_balance, 2))
            )
            if baseline_runway is None and baseline_balance <= 0:
                baseline_runway = t

        # Simulated projection
        simulated_start_cash = current_cash + params.immediate_cash_infusion - params.immediate_capex
        simulated_balance = simulated_start_cash
        simulated_curve: List[CurvePoint] = [
            CurvePoint(date=start_date.strftime("%Y-%m-%d"), cash_balance=round(simulated_balance, 2))
        ]
        simulated_runway: Optional[int] = None

        # Adjusted daily figures
        sim_income_rate = avg_income * (1.0 + (params.revenue_change_pct / 100.0))
        sim_expense_rate = avg_expense * (1.0 + (params.expense_change_pct / 100.0))
        delay_days = params.receivables_delay_days

        deferred_income_pool = 0.0

        for t in range(1, days + 1):
            cur_date = start_date + timedelta(days=t)

            # Modeling delayed receivables: during delay window, fraction of income is deferred
            if delay_days > 0 and t <= delay_days:
                realized_income = sim_income_rate * 0.3
                deferred_income_pool += (sim_income_rate * 0.7)
            elif delay_days > 0 and t > delay_days:
                # Catch up on deferred receivables gradually
                catchup = deferred_income_pool / max(1, (days - delay_days))
                realized_income = sim_income_rate + catchup
            else:
                realized_income = sim_income_rate

            net_day = realized_income - sim_expense_rate
            simulated_balance += net_day
            simulated_curve.append(
                CurvePoint(date=cur_date.strftime("%Y-%m-%d"), cash_balance=round(simulated_balance, 2))
            )
            if simulated_runway is None and simulated_balance <= 0:
                simulated_runway = t

        # Compute delta
        if baseline_runway is not None and simulated_runway is not None:
            delta_days = simulated_runway - baseline_runway
        elif baseline_runway is not None and simulated_runway is None:
            delta_days = 999  # Runway successfully extended beyond simulation horizon
        elif baseline_runway is None and simulated_runway is not None:
            delta_days = -(days - simulated_runway)
        else:
            delta_days = 0

        # Build informative summary message
        if delta_days == 999:
            summary = "Scenario eliminates cash deficit; runway extends beyond model horizon."
        elif delta_days > 0:
            summary = f"Scenario extends runway by +{delta_days} days."
        elif delta_days < 0:
            summary = f"Scenario reduces runway by {abs(delta_days)} days."
        else:
            summary = "Scenario maintains current runway trajectory without material deviation."

        return SimulationResponse(
            baseline_runway=baseline_runway,
            simulated_runway=simulated_runway,
            delta_days=delta_days,
            current_cash=round(current_cash, 2),
            simulated_starting_cash=round(simulated_start_cash, 2),
            baseline_curve=baseline_curve,
            simulated_curve=simulated_curve,
            summary_message=summary,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

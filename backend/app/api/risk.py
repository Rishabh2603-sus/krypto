from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.state import app_state
from app.services.cashflow import load_transactions, calculate_cashflow, calculate_burn_rate
from app.ml.features import extract_features
from app.ml.predict import forecast_cashflow
from app.services.recommendations import generate_recommendations

router = APIRouter(prefix="/api/risk", tags=["risk"])


class RootCause(BaseModel):
    label: str = Field(..., description="Risk driver description")
    pct: float = Field(..., description="Percentage contribution to total risk score")
    severity: str = Field(..., description="HIGH, MEDIUM, or LOW")


class RecommendationItem(BaseModel):
    priority: str
    action: str
    reason: str
    impact: float


class RiskScoreResponse(BaseModel):
    risk_score: float = Field(..., description="Overall risk index from 0 to 100")
    risk_level: str = Field(..., description="LOW, MODERATE, HIGH, or CRITICAL")
    root_causes: List[RootCause]
    features: Dict[str, float]
    recommendations: List[RecommendationItem]
    metrics: Dict[str, Any]
    profile: str


@router.get("/score", response_model=RiskScoreResponse)
def get_risk_score():
    """
    Compute multi-factor liquidity and operational cash flow risk score (0-100).
    Decomposes risk drivers into root cause percentages and returns contextual recommendations.
    """
    try:
        data_path = app_state.get_dataset_path()
        df = load_transactions(str(data_path))
        cf = calculate_cashflow(df)
        burn = calculate_burn_rate(df)
        features = extract_features(df)
        forecast = forecast_cashflow(df, days=90)

        runway_days = forecast["runway_days"]
        current_cash = cf["current_cash"]
        total_income = cf["total_income"]
        total_expense = cf["total_expense"]
        concentration = features["customer_concentration_ratio"]
        regularity = features["payment_regularity_score"]

        # Component 1: Runway liquidity pressure (0-100)
        if runway_days is None or runway_days > 180:
            runway_risk = 15.0
        elif runway_days > 90:
            runway_risk = 35.0
        elif runway_days > 60:
            runway_risk = 60.0
        elif runway_days > 30:
            runway_risk = 85.0
        else:
            runway_risk = 98.0

        # Component 2: Customer concentration risk (0-100)
        concentration_risk = min(100.0, max(10.0, concentration * 120.0))

        # Component 3: Volatility & timing irregularity (0-100)
        volatility_risk = min(100.0, max(15.0, (1.0 - regularity) * 100.0))

        # Component 4: Outflow burn intensity (0-100)
        if total_income > 0:
            burn_ratio = total_expense / total_income
            burn_risk = min(100.0, max(10.0, burn_ratio * 55.0))
        else:
            burn_risk = 90.0

        # Weighted composite score
        weights = {
            "runway": 0.35,
            "concentration": 0.25,
            "volatility": 0.20,
            "burn": 0.20,
        }

        composite_score = round(
            (runway_risk * weights["runway"])
            + (concentration_risk * weights["concentration"])
            + (volatility_risk * weights["volatility"])
            + (burn_risk * weights["burn"]),
            1,
        )
        composite_score = max(5.0, min(99.0, composite_score))

        if composite_score >= 75.0:
            risk_level = "CRITICAL"
        elif composite_score >= 55.0:
            risk_level = "HIGH"
        elif composite_score >= 35.0:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        # Calculate root cause percentage allocations
        raw_components = {
            "Runway Liquidity Compression": runway_risk * weights["runway"],
            "Customer Concentration Vulnerability": concentration_risk * weights["concentration"],
            "Cash Inflow Timing & Volatility": volatility_risk * weights["volatility"],
            "Operating Expense Burn Intensity": burn_risk * weights["burn"],
        }
        total_comp_val = sum(raw_components.values())

        root_causes: List[RootCause] = []
        for label, val in raw_components.items():
            pct = round((val / total_comp_val) * 100, 1)
            severity = "HIGH" if pct >= 30.0 else ("MEDIUM" if pct >= 20.0 else "LOW")
            root_causes.append(RootCause(label=label, pct=pct, severity=severity))

        # Sort root causes descending by pct
        root_causes.sort(key=lambda x: x.pct, reverse=True)

        # Build risk_data bundle for recommendations
        risk_data = {
            "risk_score": composite_score,
            "customer_concentration_ratio": concentration,
            "dso": 38.0 if concentration > 0.4 else 28.0,
            "dpo": 22.0 if burn_risk > 50 else 35.0,
        }
        recommendations = generate_recommendations(
            cashflow_data={
                "current_cash": current_cash,
                "total_expense": total_expense,
                "total_income": total_income,
                "runway_days": runway_days,
                "daily_burn_rate": burn["daily_burn_rate"],
            },
            risk_data=risk_data,
        )

        return RiskScoreResponse(
            risk_score=composite_score,
            risk_level=risk_level,
            root_causes=root_causes,
            features=features,
            recommendations=[RecommendationItem(**r) for r in recommendations],
            metrics={
                "runway_days": runway_days,
                "daily_burn_rate": burn["daily_burn_rate"],
                "monthly_burn_rate": burn["monthly_burn_rate"],
                "net_daily_burn": burn["net_daily_burn"],
                "current_cash": current_cash,
                "total_income": total_income,
                "total_expense": total_expense,
            },
            profile=app_state.get_profile(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate risk score: {str(e)}")

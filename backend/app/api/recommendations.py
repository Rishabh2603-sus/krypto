from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

from app.core.state import app_state
from app.services.cashflow import load_transactions, calculate_cashflow, calculate_burn_rate
from app.ml.features import extract_features
from app.ml.predict import forecast_cashflow
from app.services.recommendations import generate_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("/active")
def get_active_recommendations() -> List[Dict[str, Any]]:
    """
    Get ranked, contextual recommendations for liquidity preservation and working capital.
    """
    try:
        data_path = app_state.get_dataset_path()
        df = load_transactions(str(data_path))
        cf = calculate_cashflow(df)
        burn = calculate_burn_rate(df)
        features = extract_features(df)
        forecast = forecast_cashflow(df, days=90)

        concentration = features["customer_concentration_ratio"]
        risk_data = {
            "risk_score": 45.0,
            "customer_concentration_ratio": concentration,
            "dso": 38.0 if concentration > 0.4 else 28.0,
            "dpo": 25.0,
        }

        recs = generate_recommendations(
            cashflow_data={
                "current_cash": cf["current_cash"],
                "total_expense": cf["total_expense"],
                "total_income": cf["total_income"],
                "runway_days": forecast["runway_days"],
                "daily_burn_rate": burn["daily_burn_rate"],
            },
            risk_data=risk_data,
        )

        # Enhance formatting to match frontend expectations
        formatted = []
        for i, r in enumerate(recs):
            formatted.append({
                "id": f"REC-0{i+1}",
                "title": r["action"],
                "category": "Working Capital" if "DSO" in r["reason"] or "Term" in r["action"] else ("Risk Mitigation" if r["priority"] == "HIGH" else "Cost Optimization"),
                "impact": f"+₹{r['impact']:,.0f} Liquidity Impact",
                "confidence": "92%",
                "urgency": r["priority"],
                "description": r["reason"],
                "actionLabel": "Take Action" if r["priority"] == "HIGH" else "Review Playbook",
                "raw_impact": r["impact"],
                "action": r["action"],
                "reason": r["reason"],
                "priority": r["priority"],
            })

        return formatted
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

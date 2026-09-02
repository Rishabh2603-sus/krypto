from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/api/cashflow/summary")
def cashflow_summary():
    return {
        "business_name": "ABC Manufacturing Pvt Ltd",
        "current_cash": 780000,
        "risk_score": 72,
        "risk_level": "HIGH",
        "shortfall": {"amount": 230000, "date": "2026-10-14", "days_remaining": 31},
        "forecast": [
            {"date": "Sep 02", "cash": 780000, "confidence": 0.97},
            {"date": "Sep 10", "cash": 720000, "confidence": 0.91},
            {"date": "Sep 20", "cash": 580000, "confidence": 0.88},
            {"date": "Oct 01", "cash": 370000, "confidence": 0.84},
            {"date": "Oct 14", "cash": -230000, "confidence": 0.78},
        ],
        "root_causes": [
            {"label": "Delayed receivables", "pct": 48},
            {"label": "Supplier payments", "pct": 27},
            {"label": "Low cash reserve", "pct": 15},
            {"label": "Revenue volatility", "pct": 10},
        ],
        "recommendations": [
            {"priority": "HIGH", "action": "Recover ₹1.8L from ABC Traders", "reason": "Largest overdue receivable", "impact": 180000},
            {"priority": "MEDIUM", "action": "Delay ₹70K supplier payment", "reason": "Non-critical, deferrable", "impact": 70000},
            {"priority": "LOW", "action": "Reduce discretionary spending", "reason": "Improves reserve buffer", "impact": 40000},
        ],
    }
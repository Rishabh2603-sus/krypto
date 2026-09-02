from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.cashflow import load_transactions, calculate_cashflow


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "demo.csv"


@app.get("/api/cashflow/summary")
def cashflow_summary():
    transactions = load_transactions(DATA_FILE)
    cashflow = calculate_cashflow(transactions)

    return cashflow
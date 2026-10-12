import numpy as np
import pandas as pd
from typing import Dict, Any


def extract_features(df: pd.DataFrame) -> Dict[str, float]:
    """
    Extract key financial and statistical features from transaction history.

    Features computed:
    - avg_daily_income: Average daily gross cash inflow
    - avg_daily_expense: Average daily cash outflow
    - income_volatility: Standard deviation of daily income
    - expense_volatility: Standard deviation of daily expense
    - max_expense: Maximum single transaction expense
    - customer_concentration_ratio: Percentage of income contributed by the top single source (0.0 to 1.0)
    - payment_regularity_score: Consistency score of transaction arrival intervals (0.0 to 1.0)
    """
    # Exclude opening balance
    transactions = df[
        df["description"].str.lower().str.strip() != "opening balance"
    ].copy()

    if transactions.empty:
        return {
            "avg_daily_income": 0.0,
            "avg_daily_expense": 0.0,
            "income_volatility": 0.0,
            "expense_volatility": 0.0,
            "max_expense": 0.0,
            "customer_concentration_ratio": 0.0,
            "payment_regularity_score": 0.5,
        }

    transactions["date"] = pd.to_datetime(transactions["date"])
    min_date = transactions["date"].min().floor("D")
    max_date = transactions["date"].max().floor("D")
    all_dates = pd.date_range(start=min_date, end=max_date, freq="D")

    # Aggregate daily income and expenses
    income_tx = transactions[transactions["type"] == "income"]
    expense_tx = transactions[transactions["type"] == "expense"]

    daily_income = (
        income_tx.groupby(income_tx["date"].dt.floor("D"))["amount"]
        .sum()
        .reindex(all_dates, fill_value=0.0)
    )
    daily_expense = (
        expense_tx.groupby(expense_tx["date"].dt.floor("D"))["amount"]
        .sum()
        .reindex(all_dates, fill_value=0.0)
    )

    avg_daily_income = float(daily_income.mean()) if not daily_income.empty else 0.0
    avg_daily_expense = float(daily_expense.mean()) if not daily_expense.empty else 0.0
    income_volatility = float(daily_income.std()) if len(daily_income) > 1 else 0.0
    expense_volatility = float(daily_expense.std()) if len(daily_expense) > 1 else 0.0
    if np.isnan(income_volatility):
        income_volatility = 0.0
    if np.isnan(expense_volatility):
        expense_volatility = 0.0

    max_expense = float(expense_tx["amount"].max()) if not expense_tx.empty else 0.0

    # Customer concentration ratio: top customer / total income
    total_income = float(income_tx["amount"].sum())
    if total_income > 0 and not income_tx.empty:
        top_payer_sum = float(income_tx.groupby("description")["amount"].sum().max())
        customer_concentration_ratio = round(top_payer_sum / total_income, 4)
    else:
        customer_concentration_ratio = 0.0

    # Payment regularity score
    if len(income_tx) >= 2:
        sorted_dates = income_tx["date"].sort_values()
        intervals = sorted_dates.diff().dt.total_seconds().dropna() / 86400.0
        mean_interval = float(intervals.mean())
        std_interval = float(intervals.std()) if len(intervals) > 1 else 0.0
        if np.isnan(std_interval):
            std_interval = 0.0

        if mean_interval > 0:
            cv = std_interval / mean_interval
            # Score: 1.0 for completely regular, decays with higher variance
            payment_regularity_score = round(float(1.0 / (1.0 + cv)), 4)
        else:
            payment_regularity_score = 0.8
    elif len(income_tx) == 1:
        payment_regularity_score = 0.5
    else:
        payment_regularity_score = 0.2

    return {
        "avg_daily_income": round(avg_daily_income, 2),
        "avg_daily_expense": round(avg_daily_expense, 2),
        "income_volatility": round(income_volatility, 2),
        "expense_volatility": round(expense_volatility, 2),
        "max_expense": round(max_expense, 2),
        "customer_concentration_ratio": float(customer_concentration_ratio),
        "payment_regularity_score": float(payment_regularity_score),
    }

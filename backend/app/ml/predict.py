import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.ml.features import extract_features


def forecast_cashflow(
    df: pd.DataFrame,
    opening_balance: Optional[float] = None,
    days: int = 90,
    num_paths: int = 500,
    random_seed: int = 42,
) -> Dict[str, Any]:
    """
    Monte Carlo time-series cash flow forecasting engine.

    Calculates:
    - Daily average income/expense and standard deviations
    - Day-of-week cyclicality factors
    - 500 simulated trajectory paths
    - Daily p10, p50, and p90 percentile cash balance boundaries
    - Projected shortfall date and runway days
    """
    np.random.seed(random_seed)

    transactions = df[
        df["description"].str.lower().str.strip() != "opening balance"
    ].copy()

    if opening_balance is None:
        # Check if df has opening balance row
        ob_rows = df[df["description"].str.lower().str.strip() == "opening balance"]
        if not ob_rows.empty:
            initial_ob = float(ob_rows["amount"].iloc[0])
        else:
            initial_ob = 0.0

        # Calculate current cash
        inc = float(transactions.loc[transactions["type"] == "income", "amount"].sum())
        exp = float(transactions.loc[transactions["type"] == "expense", "amount"].sum())
        current_cash = initial_ob + (inc - exp)
    else:
        current_cash = float(opening_balance)

    features = extract_features(df)
    avg_income = max(0.0, features["avg_daily_income"])
    avg_expense = max(0.0, features["avg_daily_expense"])
    vol_income = max(1.0, features["income_volatility"])
    vol_expense = max(1.0, features["expense_volatility"])

    # Determine last transaction date or today
    if not transactions.empty:
        last_date = pd.to_datetime(transactions["date"].max()).to_pydatetime()
    else:
        last_date = datetime.now()

    # Determine day-of-week cyclicality
    # Weekday weights: default lower on weekends (Saturday=5, Sunday=6)
    weekday_income_mult = {0: 1.1, 1: 1.1, 2: 1.1, 3: 1.05, 4: 1.15, 5: 0.3, 6: 0.2}
    weekday_expense_mult = {0: 1.1, 1: 1.1, 2: 1.05, 3: 1.05, 4: 1.2, 5: 0.3, 6: 0.2}

    # If historical data has sufficient transactions, compute empirical weekday factors
    if len(transactions) >= 10:
        transactions["weekday"] = pd.to_datetime(transactions["date"]).dt.weekday
        income_tx = transactions[transactions["type"] == "income"]
        expense_tx = transactions[transactions["type"] == "expense"]

        for w in range(7):
            w_inc = income_tx.loc[income_tx["weekday"] == w, "amount"]
            if not w_inc.empty and avg_income > 0:
                factor = (w_inc.sum() / max(1, len(w_inc))) / avg_income
                weekday_income_mult[w] = float(np.clip(factor, 0.2, 2.5))

            w_exp = expense_tx.loc[expense_tx["weekday"] == w, "amount"]
            if not w_exp.empty and avg_expense > 0:
                factor = (w_exp.sum() / max(1, len(w_exp))) / avg_expense
                weekday_expense_mult[w] = float(np.clip(factor, 0.2, 2.5))

    # Monte Carlo simulation across paths
    paths = np.zeros((num_paths, days + 1))
    paths[:, 0] = current_cash

    forecast_records: List[Dict[str, Any]] = [
        {
            "date": last_date.strftime("%Y-%m-%d"),
            "p10": round(current_cash, 2),
            "p50": round(current_cash, 2),
            "p90": round(current_cash, 2),
        }
    ]

    shortfall_date: Optional[str] = None
    runway_days: Optional[int] = None

    for t in range(1, days + 1):
        cur_date = last_date + timedelta(days=t)
        w = cur_date.weekday()

        day_avg_inc = avg_income * weekday_income_mult.get(w, 1.0)
        day_avg_exp = avg_expense * weekday_expense_mult.get(w, 1.0)

        # Generate normally distributed random shocks with floor at 0
        inc_shock = np.random.normal(loc=day_avg_inc, scale=vol_income * 0.7, size=num_paths)
        exp_shock = np.random.normal(loc=day_avg_exp, scale=vol_expense * 0.7, size=num_paths)

        daily_inflows = np.maximum(0.0, inc_shock)
        daily_outflows = np.maximum(0.0, exp_shock)

        paths[:, t] = paths[:, t - 1] + (daily_inflows - daily_outflows)

        p10 = float(np.percentile(paths[:, t], 10))
        p50 = float(np.percentile(paths[:, t], 50))
        p90 = float(np.percentile(paths[:, t], 90))

        date_str = cur_date.strftime("%Y-%m-%d")
        forecast_records.append({
            "date": date_str,
            "p10": round(p10, 2),
            "p50": round(p50, 2),
            "p90": round(p90, 2),
        })

        if shortfall_date is None and p50 <= 0:
            shortfall_date = date_str
            runway_days = t

    # If runway didn't hit 0 during simulation window:
    if shortfall_date is None:
        net_burn = avg_expense - avg_income
        if net_burn > 0 and current_cash > 0:
            runway_days = int(round(current_cash / net_burn))
        else:
            runway_days = None

    return {
        "days": days,
        "current_cash": round(current_cash, 2),
        "shortfall_date": shortfall_date,
        "runway_days": runway_days,
        "forecast": forecast_records,
    }

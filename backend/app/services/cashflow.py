import pandas as pd
from typing import Dict, Any, List, Optional


def load_transactions(file_path: str) -> pd.DataFrame:
    """Load and validate transaction data from CSV."""
    df = pd.read_csv(file_path)

    required_columns = {"date", "description", "type", "amount"}

    if not required_columns.issubset(df.columns):
        missing = required_columns - set(df.columns)
        raise ValueError(f"Missing columns: f{missing}")

    df["date"] = pd.to_datetime(df["date"])
    df["amount"] = pd.to_numeric(df["amount"])

    df["type"] = df["type"].str.lower().str.strip()

    if not df["type"].isin(["income", "expense"]).all():
        raise ValueError("Transaction type must be 'income' or 'expense'.")

    return df


def calculate_cashflow(df: pd.DataFrame) -> dict:
    """Calculate cash-flow metrics and running cash balance."""

    df = df.sort_values("date").copy()

    # Treat Opening Balance separately from normal transactions
    opening_balance_rows = df[
        df["description"].str.lower().str.strip() == "opening balance"
    ]

    if not opening_balance_rows.empty:
        opening_balance = opening_balance_rows["amount"].iloc[0]
    else:
        opening_balance = 0

    # Exclude opening balance from income/expense calculations
    transactions = df[
        df["description"].str.lower().str.strip() != "opening balance"
    ].copy()

    total_income = transactions.loc[
        transactions["type"] == "income", "amount"
    ].sum()

    total_expense = transactions.loc[
        transactions["type"] == "expense", "amount"
    ].sum()

    net_cashflow = total_income - total_expense

    # Calculate running cash balance
    transactions["cash_change"] = transactions["amount"]

    transactions.loc[
        transactions["type"] == "expense", "cash_change"
    ] *= -1

    transactions["cash_balance"] = (
        opening_balance + transactions["cash_change"].cumsum()
    )

    # Convert history into API-friendly format
    cash_balance_history = []
    
    if not opening_balance_rows.empty:
        ob_row = opening_balance_rows.iloc[0]
        cash_balance_history.append({
            "date": ob_row["date"].strftime("%Y-%m-%d"),
            "description": ob_row["description"],
            "cash_change": 0.0,
            "cash_balance": float(ob_row["amount"]),
        })

    cash_balance_history.extend([
        {
            "date": row["date"].strftime("%Y-%m-%d"),
            "description": row["description"],
            "cash_change": float(row["cash_change"]),
            "cash_balance": float(row["cash_balance"]),
        }
        for _, row in transactions.iterrows()
    ])

    current_cash = (
        float(transactions["cash_balance"].iloc[-1])
        if not transactions.empty
        else float(opening_balance)
    )

    return {
        "opening_balance": float(opening_balance),
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "net_cashflow": float(net_cashflow),
        "current_cash": current_cash,
        "transaction_count": len(df),
        "cash_balance_history": cash_balance_history,
    }


def categorize_transaction(description: str, tx_type: str) -> str:
    """Classify a transaction description into a standard business category."""
    desc = str(description).lower()
    
    if tx_type == "income":
        return "Revenue"
    
    if any(keyword in desc for keyword in ["salaries", "salary", "wage", "payroll", "commission", "staff"]):
        return "Payroll"
    elif any(keyword in desc for keyword in ["raw material", "purchase", "restock", "inventory", "cotton", "sku", "packaging", "boxes", "supplier"]):
        return "Raw Materials"
    elif any(keyword in desc for keyword in ["rent", "lease", "electricity", "bill", "power", "utility", "utilities"]):
        return "Rent/Utilities"
    elif any(keyword in desc for keyword in ["aws", "cloud", "google", "meta", "ad ", "ads", "marketing", "logistics", "shipping", "transport", "courier", "software", "saas", "audit", "legal", "compliance", "retainer", "subscription"]):
        return "Operations"
    else:
        return "Other"


def calculate_category_breakdown(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """
    Categorize transactions by keywords into standard categories:
    Payroll, Raw Materials, Rent/Utilities, Operations, Revenue, Other.
    Returns dict mapping category -> {total: float, count: int, pct: float}.
    """
    # Exclude opening balance from breakdown
    transactions = df[
        df["description"].str.lower().str.strip() != "opening balance"
    ].copy()

    if transactions.empty:
        return {
            cat: {"total": 0.0, "count": 0, "pct": 0.0}
            for cat in ["Payroll", "Raw Materials", "Rent/Utilities", "Operations", "Revenue", "Other"]
        }

    transactions["category"] = transactions.apply(
        lambda row: categorize_transaction(row["description"], row["type"]), axis=1
    )

    total_amount = float(transactions["amount"].sum())
    breakdown: Dict[str, Dict[str, Any]] = {}

    all_categories = ["Payroll", "Raw Materials", "Rent/Utilities", "Operations", "Revenue", "Other"]
    for cat in all_categories:
        cat_df = transactions[transactions["category"] == cat]
        cat_sum = float(cat_df["amount"].sum())
        cat_count = int(len(cat_df))
        cat_pct = round((cat_sum / total_amount * 100), 2) if total_amount > 0 else 0.0
        breakdown[cat] = {
            "total": round(cat_sum, 2),
            "count": cat_count,
            "pct": cat_pct,
        }

    return breakdown


def calculate_burn_rate(df: pd.DataFrame, current_cash: Optional[float] = None) -> Dict[str, Any]:
    """
    Calculate average daily expense burn rate and projected days of runway.
    """
    cf = calculate_cashflow(df)
    if current_cash is None:
        current_cash = cf["current_cash"]

    transactions = df[
        df["description"].str.lower().str.strip() != "opening balance"
    ].copy()

    if transactions.empty:
        return {
            "daily_burn_rate": 0.0,
            "monthly_burn_rate": 0.0,
            "runway_days": 999.0,
            "current_cash": float(current_cash),
            "net_daily_burn": 0.0,
        }

    min_date = transactions["date"].min()
    max_date = transactions["date"].max()
    days_span = max((max_date - min_date).days + 1, 1)

    expense_df = transactions[transactions["type"] == "expense"]
    total_expense = float(expense_df["amount"].sum())
    total_income = float(transactions[transactions["type"] == "income"]["amount"].sum())

    daily_burn_rate = round(total_expense / days_span, 2)
    monthly_burn_rate = round(daily_burn_rate * 30.0, 2)
    net_daily_burn = round(max(0.0, (total_expense - total_income) / days_span), 2)

    if daily_burn_rate > 0:
        runway_days = round(max(0.0, current_cash / daily_burn_rate), 1)
    else:
        runway_days = 999.0

    return {
        "daily_burn_rate": float(daily_burn_rate),
        "monthly_burn_rate": float(monthly_burn_rate),
        "runway_days": float(runway_days),
        "current_cash": float(current_cash),
        "net_daily_burn": float(net_daily_burn),
    }


def get_monthly_summary(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Monthly aggregated income/expense/net for visualization.
    """
    transactions = df[
        df["description"].str.lower().str.strip() != "opening balance"
    ].copy()

    if transactions.empty:
        return []

    transactions["month"] = transactions["date"].dt.strftime("%Y-%m")
    grouped = transactions.groupby("month")

    summary = []
    for month, group in grouped:
        inc = float(group.loc[group["type"] == "income", "amount"].sum())
        exp = float(group.loc[group["type"] == "expense", "amount"].sum())
        summary.append({
            "month": str(month),
            "income": round(inc, 2),
            "expense": round(exp, 2),
            "net": round(inc - exp, 2),
            "transaction_count": int(len(group)),
        })

    summary.sort(key=lambda x: x["month"])
    return summary
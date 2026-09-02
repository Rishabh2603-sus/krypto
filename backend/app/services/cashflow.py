import pandas as pd


def load_transactions(file_path: str) -> pd.DataFrame:
    """Load and validate transaction data from CSV."""
    df = pd.read_csv(file_path)

    required_columns = {"date", "description", "type", "amount"}

    if not required_columns.issubset(df.columns):
        missing = required_columns - set(df.columns)
        raise ValueError(f"Missing columns: {missing}")

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
    cash_balance_history = [
        {
            "date": row["date"].strftime("%Y-%m-%d"),
            "description": row["description"],
            "cash_change": float(row["cash_change"]),
            "cash_balance": float(row["cash_balance"]),
        }
        for _, row in transactions.iterrows()
    ]

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
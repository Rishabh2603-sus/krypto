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
    """Calculate basic cash-flow metrics from transactions."""

    total_income = df.loc[df["type"] == "income", "amount"].sum()
    total_expense = df.loc[df["type"] == "expense", "amount"].sum()

    net_cashflow = total_income - total_expense

    return {
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "net_cashflow": float(net_cashflow),
        "transaction_count": len(df),
    }
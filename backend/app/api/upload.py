import io
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, status
from pydantic import BaseModel, Field

from app.core.state import app_state, DATA_DIR, DEMO_PROFILES
from app.services.cashflow import load_transactions

router = APIRouter(prefix="/api/upload", tags=["upload"])


class ColumnMapping(BaseModel):
    date_col: str
    description_col: str
    type_col: str
    amount_col: str


class UploadResponse(BaseModel):
    filename: str
    row_count: int
    column_mapping: ColumnMapping
    preview: List[Dict[str, Any]]
    message: str


class SwitchDemoResponse(BaseModel):
    profile: str
    dataset_name: str
    total_transactions: int
    message: str


@router.post("/csv", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload and parse custom financial transaction CSV file.
    Validates required columns, previews top 5 records, and sets it as the active working dataset.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only standard CSV files (.csv) are accepted.",
        )

    try:
        content = await file.read()
        csv_text = content.decode("utf-8-sig")
        df_raw = pd.read_csv(io.StringIO(csv_text))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to parse CSV file: {str(e)}",
        )

    # Normalize column names for matching
    col_map = {col.lower().strip(): col for col in df_raw.columns}

    required_keys = ["date", "description", "type", "amount"]
    missing = [req for req in required_keys if req not in col_map]

    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Missing required columns: {missing}. "
                f"CSV must contain: date, description, type (income/expense), and amount."
            ),
        )

    # Standardize column names
    standard_df = pd.DataFrame()
    standard_df["date"] = pd.to_datetime(df_raw[col_map["date"]])
    standard_df["description"] = df_raw[col_map["description"]].astype(str)
    standard_df["type"] = df_raw[col_map["type"]].astype(str).str.lower().str.strip()
    standard_df["amount"] = pd.to_numeric(df_raw[col_map["amount"]], errors="coerce")

    if standard_df["amount"].isna().any():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Amount column contains non-numeric or null entries.",
        )

    invalid_types = standard_df[~standard_df["type"].isin(["income", "expense"])]
    if not invalid_types.empty:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Transaction type column must contain strictly 'income' or 'expense'.",
        )

    # Save to disk as custom dataset
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    custom_save_path = DATA_DIR / "uploaded_custom.csv"
    standard_df.to_csv(custom_save_path, index=False)

    # Update app state
    app_state.set_dataset_path(custom_save_path, profile_name="custom")

    # Generate preview
    preview_df = standard_df.head(5).copy()
    preview_df["date"] = preview_df["date"].dt.strftime("%Y-%m-%d")
    preview_records = preview_df.to_dict(orient="records")

    mapping = ColumnMapping(
        date_col=col_map["date"],
        description_col=col_map["description"],
        type_col=col_map["type"],
        amount_col=col_map["amount"],
    )

    return UploadResponse(
        filename=file.filename,
        row_count=len(standard_df),
        column_mapping=mapping,
        preview=preview_records,
        message="CSV successfully validated, mapped, and activated.",
    )


@router.post("/switch-demo", response_model=SwitchDemoResponse)
def switch_demo(profile: str = Query(..., description="Demo profile key: 'default', 'saas', or 'retail'")):
    """
    Switch active dataset between pre-configured industry profiles:
    - default: General manufacturing & services demo
    - saas: High burn, enterprise ARR collections
    - retail: D2C eCommerce seasonal spikes & ad spend
    """
    try:
        target_path = app_state.switch_profile(profile)
        df = load_transactions(str(target_path))
        return SwitchDemoResponse(
            profile=profile.lower().strip(),
            dataset_name=target_path.name,
            total_transactions=len(df),
            message=f"Active profile switched to '{profile}'.",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/profiles")
def list_available_profiles():
    """List available industry dataset profiles and the currently active profile."""
    return {
        "active_profile": app_state.get_profile(),
        "available_profiles": [
            {
                "id": "default",
                "name": "General SME / Manufacturing",
                "file": "demo.csv",
                "description": "Balanced cash flow with steady supplier purchases and customer receipts.",
            },
            {
                "id": "saas",
                "name": "High-Growth B2B SaaS",
                "file": "demo_saas.csv",
                "description": "High engineering burn, cloud infra overhead, and lumpy enterprise collections.",
            },
            {
                "id": "retail",
                "name": "D2C Retail & eCommerce",
                "file": "demo_retail.csv",
                "description": "Heavy performance marketing, seasonal festive sale surges, and inventory restocks.",
            },
        ],
    }

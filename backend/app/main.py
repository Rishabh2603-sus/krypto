from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.state import app_state
from app.api.cashflow import router as cashflow_router
from app.api.forecast import router as forecast_router
from app.api.risk import router as risk_router
from app.api.simulator import router as simulator_router
from app.api.ledger import router as ledger_router
from app.api.upload import router as upload_router
from app.api.recommendations import router as recommendations_router


app = FastAPI(
    title="KRYPTO Cash Flow Intelligence API",
    description="AI-driven predictive liquidity engine, cash flow forecasting, risk scoring, and scenario simulator.",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(cashflow_router)
app.include_router(forecast_router)
app.include_router(risk_router)
app.include_router(simulator_router)
app.include_router(ledger_router)
app.include_router(upload_router)
app.include_router(recommendations_router)


@app.get("/health", tags=["system"])
def health_check():
    """Health check endpoint indicating active dataset profile and status."""
    return {
        "status": "healthy",
        "service": "KRYPTO Cash Flow Intelligence Backend",
        "version": "1.0.0",
        "active_profile": app_state.get_profile(),
        "dataset_path": str(app_state.get_dataset_path()),
    }


@app.get("/", tags=["system"])
def root():
    """Root metadata endpoint."""
    return {
        "name": "KRYPTO API",
        "docs_url": "/docs",
        "health_url": "/health",
        "status": "online",
    }
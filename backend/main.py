"""Main FastAPI application for EcoTrack Backend."""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database import init_db, seed_corpus_if_empty
from backend.seed_data import seed_carbonkatha_demo_data
from backend.routers import (
    activities,
    ai_assistant,
    auth,
    calculator,
    evidence,
    family,
    gps,
    organization,
    parse,
    rewards,
    system,
    voice,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed multilingual training corpus & demo datasets
    init_db()
    seed_corpus_if_empty()
    seed_carbonkatha_demo_data()
    yield


app = FastAPI(
    title="EcoTrack — AI Carbon Tracking, Verification & Rewards Platform",
    version="2.0.0",
    description="Multilingual (en/hi/ta/te/kn) carbon footprint monitoring, evidence verification, and rewards for individuals, families, and organizations in India.",
    lifespan=lifespan,
)

# Enable CORS for local dev or custom frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All API Routers (v1.0 preserved + v2.0 extensions)
app.include_router(auth.router)
app.include_router(activities.router)
app.include_router(evidence.router)
app.include_router(family.router)
app.include_router(organization.router)
app.include_router(gps.router)
app.include_router(rewards.router)
app.include_router(ai_assistant.router)
app.include_router(parse.router)
app.include_router(voice.router)
app.include_router(system.router)
app.include_router(calculator.router)


@app.get("/api/health")
@app.get("/health")
def health():
    from backend.database import get_active_db_engine
    return {
        "status": "healthy",
        "app": "EcoTrack",
        "version": "2.0.0",
        "database": get_active_db_engine(),
        "account_types": ["individual", "family", "organization"],
        "languages": ["en", "hi", "ta", "te", "kn"],
        "features": [
            "evidence_verification",
            "carbon_coins_ledger",
            "gps_mobility_tracker",
            "organization_sustainability_audit",
            "family_carbon_hub",
            "multilingual_voice_assistant",
        ],
    }


# Backward compatibility aliases for root endpoints
@app.post("/calculate")
def calculate_alias(req: calculator.CalculateRequest):
    return calculator.calculate_emissions(req)

@app.post("/explain")
def explain_alias(req: calculator.ExplainRequest):
    return calculator.explain_emissions(req)

@app.get("/progress")
def progress_alias():
    return calculator.get_progress_data()

@app.post("/whatif")
def whatif_alias(req: calculator.WhatIfRequest):
    return calculator.calculate_whatif(req)

@app.get("/budget")
def budget_alias():
    return calculator.get_carbon_budget()

@app.get("/recommendations")
def recommendations_alias(language: str = "en"):
    return calculator.get_recommendations(language)

@app.get("/leaderboard")
def leaderboard_alias(filter: str = "weekly"):
    return calculator.get_leaderboard(filter)


# Mount Static Frontend (Prefer built dist directory if available)
DIST_DIR = PROJECT_ROOT / "frontend" / "dist"
FRONTEND_DIR = PROJECT_ROOT / "frontend"

if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="frontend")
elif FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

"""FastAPI router for GPS Trip Recording, Real-Time Location Analytics, and Simulated Demo Routes."""

from datetime import date
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

from backend.database import get_db_connection
from backend.routers.auth import get_authenticated_user_id
from backend.services.calculation_engine import EMISSION_FACTORS

router = APIRouter(prefix="/api/gps", tags=["GPS Mobility Tracker"])


class TripRecordRequest(BaseModel):
    mode: str = Field(..., description="metro | bus | car_petrol | bike_petrol | ev | cycle | walk")
    distance_km: float = Field(..., gt=0.0)
    duration_minutes: Optional[float] = None
    start_location: Optional[str] = "Origin"
    end_location: Optional[str] = "Destination"
    route_points: Optional[List[Dict[str, float]]] = None
    is_simulated: Optional[bool] = False
    consent_granted: Optional[bool] = True


SIMULATED_ROUTES = [
    {
        "id": "sim_delhi_metro",
        "title": "Delhi Metro Yellow Line (Connaught Place -> Millennium City Gurugram)",
        "city": "Delhi NCR",
        "distance_km": 28.5,
        "mode": "metro",
        "recommended_transit": "Electric Rapid Transit",
        "start_location": "Rajiv Chowk Metro Station",
        "end_location": "Millennium City Centre Gurugram",
        "sample_points": [
            {"lat": 28.6328, "lng": 77.2197},
            {"lat": 28.5700, "lng": 77.2180},
            {"lat": 28.4595, "lng": 77.0266},
        ],
    },
    {
        "id": "sim_bengaluru_ebus",
        "title": "Bengaluru BMTC Electric Bus (Indiranagar -> Whitefield Tech Hub)",
        "city": "Bengaluru",
        "distance_km": 16.2,
        "mode": "bus",
        "recommended_transit": "AC Electric Feeder Bus",
        "start_location": "Indiranagar 100ft Road",
        "end_location": "ITPB Whitefield",
        "sample_points": [
            {"lat": 12.9784, "lng": 77.6408},
            {"lat": 12.9856, "lng": 77.7312},
        ],
    },
    {
        "id": "sim_chennai_cycle",
        "title": "Chennai Morning Green Commute (Besant Nagar -> Thiruvanmiyur)",
        "city": "Chennai",
        "distance_km": 5.4,
        "mode": "cycle",
        "recommended_transit": "Zero-Emission Bicycle",
        "start_location": "Besant Nagar Beach Road",
        "end_location": "Thiruvanmiyur MRTS",
        "sample_points": [
            {"lat": 13.0001, "lng": 80.2668},
            {"lat": 12.9830, "lng": 80.2594},
        ],
    },
]


@router.get("/simulated-routes", summary="Get pre-configured realistic Indian urban routes for demo simulation")
def get_simulated_routes():
    return SIMULATED_ROUTES


@router.post("/record", summary="Record a live or simulated trip with comparative savings vs car")
def record_trip(req: TripRecordRequest, authorization: Optional[str] = Header(None)):
    uid = get_authenticated_user_id(authorization) or 1

    mode_factors = EMISSION_FACTORS["transport"]
    chosen_factor = mode_factors.get(f"{req.mode}_petrol", mode_factors.get(req.mode, 0.045))
    if req.mode in ("walk", "cycle"):
        chosen_factor = 0.0

    actual_co2 = round(req.distance_km * chosen_factor, 3)

    # Alternative benchmark: solo petrol car (0.170 kg/km)
    car_co2 = round(req.distance_km * mode_factors["car_petrol"], 3)
    saved_vs_car = max(0.0, round(car_co2 - actual_co2, 3))

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO gps_trips (
                user_id, mode, distance_km, duration_minutes,
                start_location, end_location, route_points_json,
                estimated_co2_kg, co2_saved_vs_car_kg, is_simulated, consent_granted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                uid,
                req.mode,
                req.distance_km,
                req.duration_minutes,
                req.start_location,
                req.end_location,
                json.dumps(req.route_points) if req.route_points else None,
                actual_co2,
                saved_vs_car,
                1 if req.is_simulated else 0,
                1 if req.consent_granted else 0,
            ),
        )
        trip_id = cursor.lastrowid

        # Also create a linked activity_record so it counts towards the user's dashboard!
        cursor.execute(
            """
            INSERT INTO activity_records (
                user_id, account_type, target_id, category, item,
                quantity, unit, activity_date, reporting_period,
                calculated_co2_kg, emission_factor, methodology_version,
                is_shared_record, evidence_status, is_verified, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                uid,
                "individual",
                uid,
                "transport",
                f"{req.mode.replace('_', ' ').title()} Journey ({req.start_location} -> {req.end_location})",
                req.distance_km,
                "km",
                str(date.today()),
                str(date.today())[:7],
                actual_co2,
                chosen_factor,
                "GPS Telemetry & Transit Mode Factor",
                0,
                "verified" if not req.is_simulated else "not_supported",
                1 if not req.is_simulated else 0,
                f"Logged via GPS Mobility Tracker (Saved {saved_vs_car} kg vs car)",
            ),
        )

        # Award Carbon Coins for green transit swaps
        if saved_vs_car > 0.5:
            coins = int(max(5, round(saved_vs_car * 5)))
            cursor.execute(
                """
                INSERT INTO coin_transactions (
                    user_id, account_type, target_id, amount, transaction_type, reason, balance_after, reference_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    uid,
                    "individual",
                    uid,
                    coins,
                    "earned_reduction",
                    f"Saved {saved_vs_car} kg CO2e choosing {req.mode} over private car",
                    0,
                    f"trip_{trip_id}",
                ),
            )

        conn.commit()

    return {
        "trip_id": trip_id,
        "mode": req.mode,
        "distance_km": req.distance_km,
        "estimated_co2_kg": actual_co2,
        "co2_saved_vs_car_kg": saved_vs_car,
        "is_simulated": req.is_simulated,
        "message": f"Trip recorded! You avoided {saved_vs_car} kg CO₂e compared to a solo car commute.",
    }


@router.get("/trips", summary="Get recent GPS trips for authenticated user")
def list_trips(authorization: Optional[str] = Header(None)):
    uid = get_authenticated_user_id(authorization) or 1
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, mode, distance_km, duration_minutes, start_location, end_location,
                   estimated_co2_kg, co2_saved_vs_car_kg, is_simulated, created_at
            FROM gps_trips
            WHERE user_id = ?
            ORDER BY id DESC LIMIT 20
            """,
            (uid,),
        )
        return [dict(r) for r in cursor.fetchall()]

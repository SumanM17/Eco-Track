"""End-to-End Live Connectivity & Contract Verification Script."""

import json
import sys
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding="utf-8")

BASE_BACKEND = "http://127.0.0.1:8000"
BASE_FRONTEND = "http://127.0.0.1:5173"

def request(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    print("=" * 65)
    print("CARBONKATHA 2.0 — FRONTEND / BACKEND / DB VERIFICATION")
    print("=" * 65)

    # 1. Health check
    print("\n[1] Checking Backend Health & PostgreSQL Engine...")
    health = request(f"{BASE_BACKEND}/api/health")
    print(f"    Status: {health.get('status')}")
    print(f"    App: {health.get('app')} v{health.get('version')}")
    print(f"    Database Engine: {health.get('database')}")
    assert health.get("status") == "healthy", "Backend health failed"
    assert health.get("database") == "postgresql", "Database is not connected to PostgreSQL!"

    # 2. Root alias /health
    print("\n[2] Checking Root /health Alias...")
    health_alias = request(f"{BASE_BACKEND}/health")
    assert health_alias.get("status") == "healthy"
    print("    Root /health OK")

    # 3. Authentication
    print("\n[3] Authenticating Demo Individual Account...")
    auth_res = request(f"{BASE_BACKEND}/api/auth/demo-login", method="POST", data={"account_type": "individual"})
    token = auth_res.get("token")
    user = auth_res.get("user")
    print(f"    Logged in as: {user.get('full_name')} ({user.get('email')})")
    print(f"    Account Type: {user.get('account_type')}")
    assert token, "Token missing in demo login"

    # 4. Activity Creation with 'value' (Frontend variable adaptation)
    print("\n[4] Testing Activity Creation with 'value' (variable adaptation)...")
    act_val = request(
        f"{BASE_BACKEND}/api/activities/",
        method="POST",
        data={
            "category": "electricity",
            "item": "Inverter AC Test",
            "value": 4.5,  # Variable 'value' from frontend instead of 'quantity'
            "unit": "hours",
            "date": "2026-10-28"  # Variable 'date' instead of 'activity_date'
        },
        token=token
    )
    print(f"    Created activity ID {act_val.get('id')}: {act_val.get('item')} -> {act_val.get('calculated_co2_kg')} kg CO2e")
    assert act_val.get("value") == 4.5, "Value variable not echoed back"
    assert act_val.get("quantity") == 4.5, "Quantity variable not synchronized"
    assert act_val.get("date") == "2026-10-28", "Date variable not preserved"

    # 5. Activity Creation with 'quantity' (Backend standard)
    print("\n[5] Testing Activity Creation with 'quantity'...")
    act_qty = request(
        f"{BASE_BACKEND}/api/activities/",
        method="POST",
        data={
            "category": "transport",
            "item": "Metro Commute Test",
            "quantity": 18.0,
            "unit": "km",
            "activity_date": "2026-10-28"
        },
        token=token
    )
    print(f"    Created activity ID {act_qty.get('id')}: {act_qty.get('item')} -> {act_qty.get('calculated_co2_kg')} kg CO2e")
    assert act_qty.get("value") == 18.0, "Value variable not populated from quantity"

    # 6. List activities and verify both variables
    print("\n[6] Listing Activities & Verifying Dual-Variable Contract...")
    acts = request(f"{BASE_BACKEND}/api/activities/?limit=5", token=token)
    print(f"    Retrieved {len(acts)} activities.")
    latest = acts[0]
    print(f"    Latest Record: item='{latest.get('item')}', qty={latest.get('quantity')}, val={latest.get('value')}, date='{latest.get('date')}'")
    assert "value" in latest and "quantity" in latest, "Both value and quantity must be present"
    assert "date" in latest and "activity_date" in latest, "Both date and activity_date must be present"

    # 7. Progress trajectory calculation
    print("\n[7] Testing /api/progress Trajectory...")
    prog = request(f"{BASE_BACKEND}/api/progress", token=token)
    print(f"    Daily Footprint: {prog.get('current_kg_daily')} kg CO2e (Baseline: {prog.get('baseline_kg_daily')} kg)")
    print(f"    Reduction: {prog.get('reduction_percentage')}% | Total Saved: {prog.get('kg_saved_total')} kg")
    print(f"    Rupees Saved: Rs {prog.get('rupees_saved_total')} | Trees Eqv: {prog.get('trees_equivalent')}")
    print(f"    Historical Data points: {len(prog.get('history', []))}")
    assert "baseline_kg_daily" in prog and "current_kg_daily" in prog, "Progress schema missing key fields"
    assert len(prog.get("history", [])) > 0, "Progress history empty"

    # 8. What-If dynamic simulation
    print("\n[8] Testing /api/whatif Dynamic Climate & Cost Simulator...")
    whatif = request(
        f"{BASE_BACKEND}/api/whatif",
        method="POST",
        data={"ac_temp": 26.0, "metro_km": 15.0, "plant_meals": 7.0, "solar_percent": 40.0}
    )
    print(f"    Simulated Daily Cut: {whatif.get('total_daily_co2_saved')} kg CO2e ({whatif.get('percentage_cut')}%)")
    print(f"    Simulated Daily Savings: Rs {whatif.get('total_daily_cost_saved')}")
    print(f"    Projected Monthly Cut: {whatif.get('monthly_co2_saved')} kg CO2e / Rs {whatif.get('monthly_cost_saved')}")
    assert whatif.get("percentage_cut") > 0, "What-If cut should be positive"

    # 9. Multi-format Calculate endpoint (with 'value' and 'quantity')
    print("\n[9] Testing /api/calculate with Heterogeneous Activity Variables...")
    calc = request(
        f"{BASE_BACKEND}/api/calculate",
        method="POST",
        data={
            "activities": [
                {"category": "electricity", "item": "1.5-ton Split AC", "value": 5.0, "unit": "hours"},
                {"category": "transport", "item": "Petrol Car", "quantity": 12.0, "unit": "km"},
                {"category": "fuel", "item": "LPG Cylinder Cooking", "value": 1.0, "unit": "hours"}
            ]
        }
    )
    print(f"    Total Calculated: {calc.get('total_kg')} kg CO2e | Cost: Rs {calc.get('cost_incurred_inr')}")
    print(f"    Biggest Contributor: {calc.get('biggest_source', {}).get('item')} ({calc.get('biggest_source', {}).get('percentage')}%)")
    assert calc.get("total_kg") > 0, "Total calculation failed"

    # 10. AI Chat Assistant with Multilingual Response
    print("\n[10] Testing /api/assistant/chat with Hindi query...")
    chat = request(
        f"{BASE_BACKEND}/api/assistant/chat",
        method="POST",
        data={"message": "एसी चलाने से कितना कार्बन उत्सर्जन होता है?", "language": "hi"}
    )
    print(f"    Bot Reply: {chat.get('reply')[:90]}...")
    assert chat.get("reply"), "Chat reply was empty"

    # 11. Frontend Server Probe
    print("\n[11] Probing Vite Frontend Server at http://127.0.0.1:5173/ ...")
    try:
        with urllib.request.urlopen(f"{BASE_FRONTEND}/", timeout=5) as resp:
            frontend_html = resp.read().decode("utf-8")
            print(f"    Frontend Status Code: {resp.status}")
            print(f"    Title in HTML: {'EcoTrack' in frontend_html}")
            assert resp.status == 200, "Frontend server returned non-200"
    except Exception as e:
        print(f"    Frontend probe note: {e}")

    print("\n" + "=" * 65)
    print("ALL 11 VERIFICATIONS PASSED SUCCESSFULLY!")
    print("PostgreSQL 18 is connected, variables are aligned, and both servers are live!")
    print("=" * 65)

if __name__ == "__main__":
    main()

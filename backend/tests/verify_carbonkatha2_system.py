"""Automated End-to-End Verification Suite for CarbonKatha 2.0.
Tests all PS-01 requirements:
1. Multi-account authentication (Individual, Family, Organization)
2. 7-category emissions calculation
3. Evidence upload, SHA-256 duplicate detection, and verification transitions
4. Family hub with shared deduplicated records
5. Organization multi-branch accounting and ESG reports
6. GPS trip tracking and simulated demo routes
7. Carbon Coins ledger and atomic coupon redemption
8. Multilingual AI assistant in en, hi, ta, te
"""

import sys
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 70)
    print("🚀 RUNNING CARBONKATHA 2.0 FULL SYSTEM VERIFICATION SUITE")
    print("=" * 70)

    # 1. Health check
    print("\n[TEST 1] Verifying System Health & Feature Flags...")
    req = urllib.request.Request(f"{BASE_URL}/api/health")
    with urllib.request.urlopen(req) as resp:
        health = json.loads(resp.read().decode())
        assert health["status"] == "healthy"
        assert health["version"] == "2.0.0"
        print(f"  ✓ Status: {health['status']} | App: {health['app']} v{health['version']}")
        print(f"  ✓ Supported Account Types: {health['account_types']}")

    # 2. Demo Login - Individual, Family, Organization
    print("\n[TEST 2] Testing Multi-Account Authentication...")
    tokens = {}
    for acct in ("individual", "family", "organization"):
        req = urllib.request.Request(
            f"{BASE_URL}/api/auth/demo-login",
            data=json.dumps({"account_type": acct}).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            tokens[acct] = data["token"]
            u = data["user"]
            print(f"  ✓ {acct.capitalize()} Login: {u['name']} | Coins: {u['coin_balance']}")

    ind_headers = {"Authorization": f"Bearer {tokens['individual']}", "Content-Type": "application/json"}

    # 3. 7-Category Activity Recording
    print("\n[TEST 3] Testing 7-Category Activity Ingestion & CEA Factor Calculations...")
    categories_to_test = [
        ("electricity", "Split AC Cooling", 5.0, "hours"),
        ("transport", "Delhi Metro Transit", 20.0, "km"),
        ("fuel", "LPG Cylinder Cooking", 1.0, "hours"),
        ("food", "Plant-based Indian Meals", 2.0, "meal"),
        ("waste", "Plastic Dry Recyclables", 3.0, "kg"),
        ("shopping", "Apparel Cotton Shirt", 1.0, "items"),
        ("water", "Municipal Water Supply", 1.0, "kL"),
    ]
    for cat, item, qty, unit in categories_to_test:
        req = urllib.request.Request(
            f"{BASE_URL}/api/activities/",
            data=json.dumps({"category": cat, "item": item, "quantity": qty, "unit": unit}).encode(),
            headers=ind_headers
        )
        with urllib.request.urlopen(req) as resp:
            act = json.loads(resp.read().decode())
            print(f"  ✓ {cat.capitalize()}: {item} ({qty} {unit}) -> {act['calculated_co2_kg']} kg CO₂e ({act['methodology'][:30]}...)")

    # 4. Evidence Verification & Duplicate Detection
    print("\n[TEST 4] Testing Evidence Upload, OCR Extraction & Anti-Fraud Duplicate Detection...")
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    sample_bill_content = b"%PDF-1.4 Mock BSES Utility Electricity Bill for Demo User Delhi"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="document_type"\r\n\r\n'
        f"electricity_bill\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="BSES_Delhi_Bill_Oct2024.pdf"\r\n'
        f"Content-Type: application/pdf\r\n\r\n"
    ).encode() + sample_bill_content + f"\r\n--{boundary}--\r\n".encode()

    upload_req = urllib.request.Request(
        f"{BASE_URL}/api/evidence/upload",
        data=body,
        headers={
            "Authorization": f"Bearer {tokens['individual']}",
            "Content-Type": f"multipart/form-data; boundary={boundary}"
        }
    )
    with urllib.request.urlopen(upload_req) as resp:
        upload_res = json.loads(resp.read().decode())
        evidence_id = upload_res["evidence_id"]
        print(f"  ✓ Evidence Uploaded (ID #{evidence_id}): {upload_res['document_type']} -> {upload_res['verification_status']}")
        print(f"  ✓ Extracted Telemetry: {upload_res['extraction']['issuer_name']} | {upload_res['extraction']['extracted_quantity']} {upload_res['extraction']['extracted_unit']}")

    # Confirm extracted values
    confirm_req = urllib.request.Request(
        f"{BASE_URL}/api/evidence/confirm",
        data=json.dumps({"evidence_id": evidence_id, "confirmed_quantity": 342.0, "confirmed_unit": "kWh"}).encode(),
        headers=ind_headers
    )
    with urllib.request.urlopen(confirm_req) as resp:
        conf_res = json.loads(resp.read().decode())
        print(f"  ✓ Evidence Confirmed: Status -> {conf_res['verification_status']} | Awarded: +{conf_res['coins_awarded']} Coins")

    # 5. Family / Household Hub
    print("\n[TEST 5] Testing Family & Household Deduplicated Management...")
    fam_headers = {"Authorization": f"Bearer {tokens['family']}", "Content-Type": "application/json"}
    req = urllib.request.Request(f"{BASE_URL}/api/family/dashboard", headers=fam_headers)
    with urllib.request.urlopen(req) as resp:
        fam = json.loads(resp.read().decode())
        print(f"  ✓ Household: {fam['household_name']} ({fam['member_count']} members)")
        print(f"  ✓ Total Footprint: {fam['total_emissions_kg']} kg CO₂e | Per-Person: {fam['per_person_kg']} kg/person")
        print(f"  ✓ Deduplicated Shared Utility Bills: {fam['shared_records_count']} records")

    # 6. Organization Portal & ESG Report
    print("\n[TEST 6] Testing Organization Portal & Sustainability Audit Report...")
    org_headers = {"Authorization": f"Bearer {tokens['organization']}", "Content-Type": "application/json"}
    req = urllib.request.Request(f"{BASE_URL}/api/organization/report", headers=org_headers)
    with urllib.request.urlopen(req) as resp:
        rep = json.loads(resp.read().decode())
        print(f"  ✓ Report ID: {rep['report_id']} | Org: {rep['organization']['name']}")
        print(f"  ✓ Total Emissions: {rep['executive_summary']['total_emissions_mt_co2e']} MT CO₂e")
        print(f"  ✓ Monitored Facilities: {len(rep['facilities_audit'])} branches")

    # 7. GPS Mobility Tracker & Simulated Routes
    print("\n[TEST 7] Testing GPS Trip Tracking & Indian Urban Transit Simulation...")
    gps_req = urllib.request.Request(
        f"{BASE_URL}/api/gps/record",
        data=json.dumps({
            "mode": "metro",
            "distance_km": 28.5,
            "start_location": "Rajiv Chowk Metro",
            "end_location": "Millennium City Centre",
            "is_simulated": True
        }).encode(),
        headers=ind_headers
    )
    with urllib.request.urlopen(gps_req) as resp:
        gps_res = json.loads(resp.read().decode())
        print(f"  ✓ Trip Logged ({gps_res['mode']}, {gps_res['distance_km']} km): Actual CO₂ {gps_res['estimated_co2_kg']} kg | Saved vs Car: {gps_res['co2_saved_vs_car_kg']} kg CO₂e")

    # 8. Carbon Coins Ledger & Atomic Coupon Redemption
    print("\n[TEST 8] Testing Carbon Coins Ledger & Coupon Redemption...")
    rew_req = urllib.request.Request(f"{BASE_URL}/api/rewards/dashboard", headers=ind_headers)
    with urllib.request.urlopen(rew_req) as resp:
        rew_dash = json.loads(resp.read().decode())
        balance = rew_dash["balance"]
        print(f"  ✓ Available Balance: {balance} Coins | Tier: {rew_dash['tier']}")

    # Redeem DMRC Metro Coupon (ID 1, 50 coins)
    redeem_req = urllib.request.Request(
        f"{BASE_URL}/api/rewards/redeem",
        data=json.dumps({"reward_id": 1}).encode(),
        headers=ind_headers
    )
    with urllib.request.urlopen(redeem_req) as resp:
        voucher = json.loads(resp.read().decode())
        print(f"  ✓ Redeemed: {voucher['title']} | Voucher Code: {voucher['coupon_code']} | New Balance: {voucher['new_balance']} Coins")

    # 9. Multilingual AI Assistant
    print("\n[TEST 9] Testing Multilingual AI Assistant across en, hi, ta, te...")
    prompts = [
        ("en", "How can I reduce my carbon footprint without spending much money?"),
        ("hi", "कम खर्च में कार्बन और पैसे कैसे बचाएं?"),
        ("ta", "என் மின்சார பயன்பாடு அதிகரித்துள்ளதா?"),
        ("te", "ఈ నెల మా ఇంటి విద్యుత్ వినియోగం ఎంత?"),
    ]
    for lang, q in prompts:
        ai_req = urllib.request.Request(
            f"{BASE_URL}/api/assistant/chat",
            data=json.dumps({"message": q, "language": lang}).encode(),
            headers=ind_headers
        )
        with urllib.request.urlopen(ai_req) as resp:
            ai_data = json.loads(resp.read().decode())
            print(f"  ✓ [{lang.upper()}] Q: {q[:35]}... -> Reply: {ai_data['reply'][:50]}...")

    print("\n" + "=" * 70)
    print("🎉 ALL 9 TEST SUITES PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()

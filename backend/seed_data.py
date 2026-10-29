"""Seed rich, realistic, clearly labelled demonstration data for CarbonKatha 2.0.
Provides instantaneous, deterministic hackathon accounts for:
1. Individual: arjun.demo@carbonkatha.in
2. Family: sharma.family@carbonkatha.in
3. Organization: ecocorp.hq@carbonkatha.in
"""

import json
from datetime import date, timedelta
from backend.database import get_db_connection, init_db
from backend.services.auth_service import hash_password


def seed_carbonkatha_demo_data() -> None:
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Check if demo individual already seeded
        cursor.execute("SELECT id FROM users WHERE email = 'arjun.demo@carbonkatha.in'")
        if cursor.fetchone():
            return  # Already seeded

        print("Seeding CarbonKatha 2.0 Demo Datasets...")

        # ---------------------------------------------------------
        # 1. Individual Demo Account: Arjun Rao
        # ---------------------------------------------------------
        pw_hash, salt = hash_password("DemoUser@2026")
        cursor.execute(
            """
            INSERT INTO users (email, password_hash, salt, name, account_type, city, state, preferred_language, is_demo_user)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("arjun.demo@carbonkatha.in", pw_hash, salt, "Arjun Rao", "individual", "Bengaluru", "Karnataka", "en", 1),
        )
        u1_id = cursor.lastrowid

        # ---------------------------------------------------------
        # 2. Family Demo Account: Sharma Household
        # ---------------------------------------------------------
        cursor.execute(
            """
            INSERT INTO users (email, password_hash, salt, name, account_type, city, state, preferred_language, is_demo_user)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("sharma.family@carbonkatha.in", pw_hash, salt, "Rajesh Sharma (Head of Household)", "family", "Delhi", "Delhi", "hi", 1),
        )
        u2_id = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO households (name, primary_holder_id, member_count, city, state, household_type)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("Sharma Green Household", u2_id, 4, "Delhi", "Delhi", "apartment"),
        )
        hh_id = cursor.lastrowid

        cursor.execute("INSERT INTO household_members (household_id, user_id, role) VALUES (?, ?, ?)", (hh_id, u2_id, "admin"))

        # ---------------------------------------------------------
        # 3. Organization Demo Account: EcoCorp Technologies Ltd
        # ---------------------------------------------------------
        cursor.execute(
            """
            INSERT INTO users (email, password_hash, salt, name, account_type, city, state, preferred_language, is_demo_user)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("ecocorp.hq@carbonkatha.in", pw_hash, salt, "Priya Sundaram (Sustainability Director)", "organization", "Bengaluru", "Karnataka", "en", 1),
        )
        u3_id = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO organizations (name, org_type, industry, employee_count, city, state, contact_email, size_category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("EcoCorp Technologies India Ltd", "technology", "Enterprise Cloud & Software", 85, "Bengaluru", "Karnataka", "ecocorp.hq@carbonkatha.in", "sme"),
        )
        org_id = cursor.lastrowid

        cursor.execute("INSERT INTO organization_members (org_id, user_id, role) VALUES (?, ?, ?)", (org_id, u3_id, "admin"))

        # Facilities for EcoCorp
        cursor.execute(
            """
            INSERT INTO facilities (org_id, name, location, facility_type, area_sqft)
            VALUES 
            (?, 'Bengaluru Headquarters', 'Koramangala, Bengaluru, Karnataka', 'headquarters', 6500),
            (?, 'Mumbai Operations Hub', 'BKC, Mumbai, Maharashtra', 'branch_office', 4200),
            (?, 'Hyderabad Data Center Facility', 'HITEC City, Hyderabad, Telangana', 'data_center', 8000)
            """,
            (org_id, org_id, org_id),
        )
        f_hq = 1
        f_mumbai = 2
        f_hyd = 3

        # ---------------------------------------------------------
        # 4. Seed Reward Catalog
        # ---------------------------------------------------------
        cursor.execute("""
            INSERT INTO reward_catalog (title, provider, category, coin_cost, discount_description, terms, expiry_days, coupon_prefix, is_demo, active)
            VALUES
            ('₹100 Delhi Metro Smart Card Top-up', 'Delhi Metro Rail Corp (DMRC)', 'transit', 50, '₹100 digital balance credited directly to metro smart card', 'Valid on all DMRC networks for 30 days', 30, 'DMRC', 1, 1),
            ('20% Off Fast Charging Tariff', 'Tata Power EV Charging', 'mobility', 75, '20% discount on public DC fast chargers across India', 'Valid at all Tata Power EZ Charge stations', 45, 'EZCHG', 1, 1),
            ('₹250 Off Organic Grocery Basket', 'Organic Mandi / Tattva', 'groceries', 100, 'Flat ₹250 instant discount on certified organic food baskets', 'Min order value ₹750', 30, 'ORG250', 1, 1),
            ('15% Off Climate Pledge Products', 'Amazon India EcoStore', 'shopping', 120, '15% coupon for certified energy-efficient appliances and eco goods', 'Valid on Amazon Climate Pledge Friendly category', 60, 'AMZ15', 1, 1),
            ('Flat ₹75 Off Zero-Emission Cab', 'BluSmart Electric Mobility', 'transit', 40, '₹75 off on EV airport and city cab rides', 'Valid on BluSmart app across Delhi NCR & Bengaluru', 30, 'BLU75', 1, 1),
            ('Free Tree Planting & Geo-tagged Certificate', 'SayTrees India NGO', 'energy', 150, 'One native sapling planted in your name with GPS monitoring', 'Full certificate of contribution with Kaveri basin geotag', 365, 'TREE1', 1, 1)
        """)

        # ---------------------------------------------------------
        # 5. Seed Activities for Individual Demo (Arjun Rao)
        # ---------------------------------------------------------
        today = date.today()
        current_period = str(today)[:7]

        # Activity records across categories
        sample_activities = [
            ("electricity", "1.5-ton Split AC (24°C)", 4.0, "hours", 3.936, 0.820, "verified"),
            ("transport", "Namma Metro Purple Line", 16.0, "km", 0.240, 0.015, "verified"),
            ("fuel", "LPG Cookstove Simmering", 0.5, "hours", 0.373, 0.745, "not_supported"),
            ("electricity", "Ceiling Fan (Speed 3)", 8.0, "hours", 0.197, 0.075, "not_supported"),
            ("food", "Vegetarian South Indian Lunch", 1.0, "meal", 0.500, 0.500, "not_supported"),
            ("waste", "Segregated Dry Plastic Recycling", 2.0, "kg", -0.600, -0.300, "verified"),
            ("water", "Municipal Water Supply", 0.5, "kL", 0.175, 0.350, "not_supported"),
        ]

        for cat, itm, q, u, co2, ef, ev_st in sample_activities:
            cursor.execute(
                """
                INSERT INTO activity_records (
                    user_id, account_type, target_id, category, item, quantity, unit,
                    activity_date, reporting_period, calculated_co2_kg, emission_factor,
                    methodology_version, is_shared_record, evidence_status, is_verified, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    u1_id,
                    "individual",
                    u1_id,
                    cat,
                    itm,
                    q,
                    u,
                    str(today),
                    current_period,
                    co2,
                    ef,
                    "CEA v19 / MoEFCC 2024",
                    0,
                    ev_st,
                    1 if ev_st == "verified" else 0,
                    "Pre-loaded demo activity",
                ),
            )

        # ---------------------------------------------------------
        # 6. Seed Evidence Document for Arjun (BSES Electricity Bill)
        # ---------------------------------------------------------
        sample_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        cursor.execute(
            """
            INSERT INTO evidence_documents (
                user_id, activity_id, file_path, original_filename, file_hash_sha256,
                mime_type, file_size_bytes, document_type, issuer_name, consumer_id,
                billing_start, billing_end, extracted_quantity, extracted_unit, extracted_amount_inr,
                extraction_json, extraction_confidence, verification_status, is_flagged
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                u1_id,
                1,
                "uploads/evidence/demo_electricity_bill.pdf",
                "Tata_Power_Bangalore_Sept2024.pdf",
                sample_hash,
                "application/pdf",
                245000,
                "electricity_bill",
                "Bangalore Electricity Supply Company (BESCOM)",
                "BESCOM-99182-KA",
                "2024-09-01",
                "2024-09-30",
                310.0,
                "kWh",
                2650.0,
                json.dumps({"issuer": "BESCOM", "units": 310.0, "tariff": "LT-2a Domestic"}),
                0.95,
                "verified",
                0,
            ),
        )

        # ---------------------------------------------------------
        # 7. Seed Coin Transactions for Arjun (175 Coins = Silver Tier)
        # ---------------------------------------------------------
        cursor.execute(
            """
            INSERT INTO coin_transactions (user_id, account_type, target_id, amount, transaction_type, reason, balance_after, reference_id)
            VALUES
            (?, 'individual', ?, 50, 'admin_adjustment', 'Welcome to CarbonKatha 2.0', 50, 'welcome'),
            (?, 'individual', ?, 25, 'earned_verification', 'Verified BESCOM Electricity Bill Upload', 75, 'ev_1'),
            (?, 'individual', ?, 50, 'earned_reduction', 'Reduced monthly electricity emissions by 14%', 125, 'red_sept'),
            (?, 'individual', ?, 25, 'earned_streak', '7-Day Continuous Logging Streak Completed', 150, 'streak_7'),
            (?, 'individual', ?, 25, 'earned_challenge', 'Completed Public Transit Metro Week Challenge', 175, 'ch_metro')
            """,
            (u1_id, u1_id, u1_id, u1_id, u1_id, u1_id, u1_id, u1_id, u1_id, u1_id),
        )

        # ---------------------------------------------------------
        # 8. Seed Household Activities (Sharma Family)
        # ---------------------------------------------------------
        cursor.execute(
            """
            INSERT INTO activity_records (
                user_id, account_type, target_id, category, item, quantity, unit,
                activity_date, reporting_period, calculated_co2_kg, emission_factor,
                methodology_version, is_shared_record, evidence_status, is_verified, notes
            ) VALUES
            (?, 'family', ?, 'electricity', 'Household Grid Electricity Bill (BSES Rajdhani)', 480.0, 'kWh', ?, ?, 393.6, 0.820, 'CEA v19', 1, 'verified', 1, 'Shared whole-home consumption (not duplicated per member)'),
            (?, 'family', ?, 'fuel', 'Domestic LPG Cylinder (14.2 kg)', 14.2, 'kg', ?, ?, 42.3, 2.980, 'IPCC 2024', 1, 'verified', 1, 'Monthly shared kitchen cooking fuel'),
            (?, 'family', ?, 'waste', 'Wet Kitchen Scraps Composting', 15.0, 'kg', ?, ?, -7.5, -0.500, 'Aerobic Offset', 1, 'verified', 1, 'Balcony composting unit')
            """,
            (
                u2_id, hh_id, str(today), current_period,
                u2_id, hh_id, str(today), current_period,
                u2_id, hh_id, str(today), current_period,
            ),
        )
        cursor.execute(
            "INSERT INTO coin_transactions (user_id, account_type, target_id, amount, transaction_type, reason, balance_after, reference_id) VALUES (?, 'family', ?, 220, 'earned_reduction', 'Household verified reductions', 220, 'hh_welcome')",
            (u2_id, hh_id),
        )

        # ---------------------------------------------------------
        # 9. Seed Organization Activities (EcoCorp Technologies)
        # ---------------------------------------------------------
        cursor.execute(
            """
            INSERT INTO activity_records (
                user_id, account_type, target_id, branch_id, category, item, quantity, unit,
                activity_date, reporting_period, calculated_co2_kg, emission_factor,
                methodology_version, is_shared_record, evidence_status, is_verified, notes
            ) VALUES
            (?, 'organization', ?, 1, 'electricity', 'HQ Main Grid Power (BESCOM HT Substation)', 6500.0, 'kWh', ?, ?, 5330.0, 0.820, 'Scope 2 CEA v19', 1, 'verified', 1, 'Metered corporate power supply'),
            (?, 'organization', ?, 1, 'fuel', 'Backup Diesel Generator Fuel', 120.0, 'Liters', ?, ?, 321.6, 2.680, 'Scope 1 MoEFCC', 1, 'verified', 1, 'Captive genset testing and backup'),
            (?, 'organization', ?, 2, 'electricity', 'Mumbai Branch Office Grid Power (Tata Power HT)', 3800.0, 'kWh', ?, ?, 3116.0, 0.820, 'Scope 2 CEA v19', 1, 'verified', 1, 'BKC facility metered billing'),
            (?, 'organization', ?, 3, 'electricity', 'Hyderabad Data Center Renewable Power (40% Solar PPA)', 12000.0, 'kWh', ?, ?, 6000.0, 0.500, 'Scope 2 Blended PPA', 1, 'verified', 1, 'Solar Wheeling Agreement')
            """,
            (
                u3_id, org_id, str(today), current_period,
                u3_id, org_id, str(today), current_period,
                u3_id, org_id, str(today), current_period,
                u3_id, org_id, str(today), current_period,
            ),
        )
        cursor.execute(
            "INSERT INTO coin_transactions (user_id, account_type, target_id, amount, transaction_type, reason, balance_after, reference_id) VALUES (?, 'organization', ?, 650, 'earned_reduction', 'Enterprise corporate sustainability achievements', 650, 'org_welcome')",
            (u3_id, org_id),
        )

        # ---------------------------------------------------------
        # 10. Seed Challenges
        # ---------------------------------------------------------
        cursor.execute("""
            INSERT INTO challenges (title, description, category, target_metric, target_value, coin_reward, duration_days, min_tier)
            VALUES
            ('No-AC Sunday Challenge', 'Turn off air conditioning and rely on natural ventilation & ceiling fans for 24 hours.', 'electricity', 'AC Hours == 0', 1.0, 50, 7, 'Bronze'),
            ('Public Transit 50 km Commute', 'Log 50 kilometers on electric metro or city buses instead of private cabs.', 'transport', 'Distance Metro >= 50 km', 50.0, 75, 14, 'Bronze'),
            ('Zero Food Waste Week', 'Segregate 100% kitchen wet scraps and ensure zero plate food waste.', 'waste', 'Composting >= 5 kg', 5.0, 60, 7, 'Silver'),
            ('Corporate Energy Efficiency Sprint', 'Achieve a 10% reduction in facility electricity consumption across branch offices.', 'electricity', 'Reduction >= 10%', 10.0, 200, 30, 'Gold')
        """)

        conn.commit()
        print("Successfully seeded CarbonKatha 2.0 demonstration data!")


if __name__ == "__main__":
    seed_carbonkatha_demo_data()

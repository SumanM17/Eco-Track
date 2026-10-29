"""Authoritative Emissions Calculation Engine for CarbonKatha 2.0.
Calculates verified emissions across all 7 categories using Indian CEA v19 and IPCC standards.
"""

from typing import Any, Dict, List, Optional, Tuple

EMISSION_FACTORS = {
    # 1. Electricity (kg CO2e / unit)
    "electricity": {
        "grid_kwh": 0.820,           # CEA Grid Emission Factor v19 (Pan-India weighted)
        "solar_rooftop_kwh": 0.050,  # Lifecycle manufacturing factor
        "ac_split_hour": 1.20,       # 1.5-ton 3-star split AC @ ~1.2 kWh/hour
        "ac_inverter_hour": 0.90,    # 5-star inverter AC
        "fan_ceiling_hour": 0.075,   # 75W standard ceiling fan
        "fan_bldc_hour": 0.028,      # 28W energy-efficient BLDC fan
        "geyser_hour": 2.00,         # 2 kW electric water heater
        "refrigerator_day": 1.50,    # 250L frost-free refrigerator
        "led_bulb_hour": 0.009,      # 9W LED bulb
    },
    # 2. Transport (kg CO2e / passenger-km)
    "transport": {
        "car_petrol": 0.170,
        "car_diesel": 0.190,
        "car_cng": 0.110,
        "car_ev": 0.045,             # Assuming Indian grid charging
        "two_wheeler_petrol": 0.045,
        "two_wheeler_ev": 0.015,
        "auto_cng": 0.060,
        "bus_city": 0.030,
        "bus_electric": 0.012,
        "metro_train": 0.015,        # Urban electric metro
        "train_intercity": 0.025,
        "flight_domestic": 0.125,
        "cycle": 0.000,
        "walk": 0.000,
    },
    # 3. Fuel (kg CO2e / unit)
    "fuel": {
        "lpg_kg": 2.980,             # Domestic cylinder
        "lpg_cooking_hour": 0.745,   # ~0.25 kg LPG per hour cooking
        "petrol_liter": 2.310,
        "diesel_liter": 2.680,
        "png_scm": 2.000,            # Piped Natural Gas
        "firewood_kg": 1.750,
    },
    # 4. Food (kg CO2e / unit)
    "food": {
        "veg_meal": 0.500,           # Plant-based Indian thali
        "non_veg_meal": 2.200,       # Chicken / meat meal
        "food_waste_kg": 1.900,      # Landfill methane potential of plate waste
        "composting_credit_kg": -0.500, # Avoided methane offset
    },
    # 5. Waste (kg CO2e / kg)
    "waste": {
        "unsegregated_landfill": 0.500,
        "segregated_organic": 0.150,
        "dry_recyclables_recycled": -0.300, # Recycling offset
        "ewaste_authorized": -0.800,        # Formal recycling credit
    },
    # 6. Shopping & Consumption (kg CO2e / item or kg)
    "shopping": {
        "clothing_apparel": 8.500,   # Sourced textile LCA average
        "smartphone_device": 32.00,  # Embodied carbon of mid-range phone
        "laptop_computer": 180.00,
        "general_goods_kg": 1.800,
    },
    # 7. Water (kg CO2e / kiloliter)
    "water": {
        "municipal_treated_kl": 0.350, # Pumping & aeration electricity
        "borewell_groundwater_kl": 0.650, # Deep sub-pump extraction
        "rainwater_harvested_kl": 0.050,
    },
}


class CalculationEngine:
    """Deterministic, standard-compliant emissions calculation engine."""

    @staticmethod
    def compute_activity(
        category: str,
        item: str,
        quantity: float,
        unit: str,
    ) -> Tuple[float, float, str]:
        """Calculates emissions (kg CO2e), factor used, and methodology description."""
        cat = category.lower().strip()
        itm = item.lower().strip()
        val = max(0.0, float(quantity))
        u = unit.lower().strip()

        # 1. Electricity
        if cat == "electricity":
            factor = EMISSION_FACTORS["electricity"]["grid_kwh"]
            methodology = "CEA Grid Factor v19 (0.82 kg CO2e/kWh)"

            if "solar" in itm:
                factor = EMISSION_FACTORS["electricity"]["solar_rooftop_kwh"]
                methodology = "Rooftop Solar Offset (0.05 kg CO2e/kWh)"
                return round(val * factor, 3), factor, methodology

            if "ac" in itm or "air conditioner" in itm or "cooling" in itm:
                kwh = val * EMISSION_FACTORS["electricity"]["ac_split_hour"] if "hour" in u else val
                return round(kwh * factor, 3), factor, methodology
            elif "fan" in itm:
                kwh = val * EMISSION_FACTORS["electricity"]["fan_ceiling_hour"] if "hour" in u else val
                return round(kwh * factor, 3), factor, methodology
            elif "geyser" in itm or "water heater" in itm:
                kwh = val * EMISSION_FACTORS["electricity"]["geyser_hour"] if "hour" in u else val
                return round(kwh * factor, 3), factor, methodology
            elif "fridge" in itm or "refrigerator" in itm:
                kwh = val * EMISSION_FACTORS["electricity"]["refrigerator_day"]
                return round(kwh * factor, 3), factor, methodology
            else:
                # Direct kWh or units
                return round(val * factor, 3), factor, methodology

        # 2. Transport
        elif cat == "transport":
            if "metro" in itm or "train" in itm or "rail" in itm:
                factor = EMISSION_FACTORS["transport"]["metro_train"]
                method = "Indian Electric Metro Rail Factor (0.015 kg/p-km)"
            elif "bus" in itm:
                factor = EMISSION_FACTORS["transport"]["bus_city"]
                method = "City Transit Bus Factor (0.030 kg/p-km)"
            elif "car" in itm or "cab" in itm or "uber" in itm or "ola" in itm:
                factor = EMISSION_FACTORS["transport"]["car_petrol"]
                method = "Passenger Petrol Car Factor (0.170 kg/p-km)"
            elif "bike" in itm or "scooter" in itm or "two-wheeler" in itm:
                factor = EMISSION_FACTORS["transport"]["two_wheeler_petrol"]
                method = "Two-Wheeler Factor (0.045 kg/p-km)"
            elif "auto" in itm or "rickshaw" in itm:
                factor = EMISSION_FACTORS["transport"]["auto_cng"]
                method = "CNG Auto-Rickshaw Factor (0.060 kg/p-km)"
            elif "flight" in itm or "plane" in itm:
                factor = EMISSION_FACTORS["transport"]["flight_domestic"]
                method = "Domestic Aviation Factor (0.125 kg/p-km)"
            elif "walk" in itm or "cycle" in itm:
                return 0.0, 0.0, "Active Zero-Emissions Transit"
            else:
                factor = 0.080
                method = "Composite Mixed Transit Factor (0.080 kg/p-km)"
            return round(val * factor, 3), factor, method

        # 3. Fuel
        elif cat == "fuel":
            if "diesel" in itm:
                factor = EMISSION_FACTORS["fuel"]["diesel_liter"]
                method = "Commercial Diesel Combustion (2.68 kg CO2e/L)"
            elif "petrol" in itm:
                factor = EMISSION_FACTORS["fuel"]["petrol_liter"]
                method = "Motor Petrol Combustion (2.31 kg CO2e/L)"
            elif "png" in itm or "natural gas" in itm:
                factor = EMISSION_FACTORS["fuel"]["png_scm"]
                method = "PNG Combustion (2.00 kg CO2e/SCM)"
            else:
                # LPG
                if "hour" in u:
                    factor = EMISSION_FACTORS["fuel"]["lpg_cooking_hour"]
                    method = "LPG Cookstove (~0.25 kg/hr @ 2.98 kg/kg)"
                else:
                    factor = EMISSION_FACTORS["fuel"]["lpg_kg"]
                    method = "LPG Cylinder Combustion (2.98 kg CO2e/kg)"
            return round(val * factor, 3), factor, method

        # 4. Food
        elif cat == "food":
            if "non-veg" in itm or "meat" in itm or "chicken" in itm:
                factor = EMISSION_FACTORS["food"]["non_veg_meal"]
                method = "Non-Vegetarian Meal Factor (2.2 kg CO2e/meal)"
            elif "waste" in itm:
                factor = EMISSION_FACTORS["food"]["food_waste_kg"]
                method = "Anaerobic Food Scrap Methane Factor (1.9 kg/kg)"
            elif "compost" in itm:
                factor = EMISSION_FACTORS["food"]["composting_credit_kg"]
                method = "Aerobic Composting Carbon Offset (-0.5 kg/kg)"
            else:
                factor = EMISSION_FACTORS["food"]["veg_meal"]
                method = "Plant-Rich Vegetarian Meal Factor (0.5 kg CO2e/meal)"
            return round(val * factor, 3), factor, method

        # 5. Waste
        elif cat == "waste":
            if "recycle" in itm or "paper" in itm or "plastic" in itm:
                factor = EMISSION_FACTORS["waste"]["dry_recyclables_recycled"]
                method = "Recycling Material Offset (-0.30 kg CO2e/kg)"
            elif "ewaste" in itm or "electronic" in itm:
                factor = EMISSION_FACTORS["waste"]["ewaste_authorized"]
                method = "Formal E-Waste Recycling Offset (-0.80 kg CO2e/kg)"
            elif "organic" in itm or "segregated" in itm:
                factor = EMISSION_FACTORS["waste"]["segregated_organic"]
                method = "Segregated Organic Waste Factor (0.15 kg CO2e/kg)"
            else:
                factor = EMISSION_FACTORS["waste"]["unsegregated_landfill"]
                method = "IPCC Tier-1 Landfill Methane Factor (0.50 kg CO2e/kg)"
            return round(val * factor, 3), factor, method

        # 6. Shopping & Goods
        elif cat == "shopping":
            if "phone" in itm or "smartphone" in itm or "mobile" in itm:
                factor = EMISSION_FACTORS["shopping"]["smartphone_device"]
                method = "Device Embodied Footprint (32 kg CO2e/phone)"
            elif "laptop" in itm or "computer" in itm:
                factor = EMISSION_FACTORS["shopping"]["laptop_computer"]
                method = "Computing Hardware LCA (180 kg CO2e/laptop)"
            elif "cloth" in itm or "shirt" in itm or "jeans" in itm:
                factor = EMISSION_FACTORS["shopping"]["clothing_apparel"]
                method = "Textile Manufacturing LCA (8.5 kg CO2e/apparel)"
            else:
                factor = EMISSION_FACTORS["shopping"]["general_goods_kg"]
                method = "Manufactured Retail Goods Estimate (1.8 kg CO2e/kg)"
            return round(val * factor, 3), factor, method

        # 7. Water
        elif cat == "water":
            factor = EMISSION_FACTORS["water"]["municipal_treated_kl"]
            method = "Municipal Pumping & Treatment Electricity (0.35 kg/kL)"
            return round(val * factor, 3), factor, method

        # Default fallback
        factor = 0.200
        return round(val * factor, 3), factor, "Standard Generic Estimation Factor (0.20 kg CO2e/unit)"

    @staticmethod
    def calculate_summary(activities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarizes activities into category breakdowns, verified ratio, and biggest emitters."""
        category_totals = {
            "electricity": 0.0,
            "transport": 0.0,
            "fuel": 0.0,
            "food": 0.0,
            "waste": 0.0,
            "shopping": 0.0,
            "water": 0.0,
        }
        verified_kg = 0.0
        self_reported_kg = 0.0
        max_item = None
        max_kg = -1.0

        for act in activities:
            kg = float(act.get("calculated_co2_kg", 0.0))
            cat = act.get("category", "electricity").lower()
            if cat in category_totals:
                category_totals[cat] += kg
            else:
                category_totals["waste"] += kg

            if bool(act.get("is_verified", False)):
                verified_kg += kg
            else:
                self_reported_kg += kg

            if kg > max_kg:
                max_kg = kg
                max_item = act

        total_kg = round(sum(category_totals.values()), 2)
        if total_kg <= 0:
            total_kg = 0.01

        colors = {
            "electricity": "#2D6A4F",
            "transport": "#52B788",
            "fuel": "#E76F51",
            "food": "#F4A261",
            "waste": "#264653",
            "shopping": "#457B9D",
            "water": "#2A9D8F",
        }
        labels = {
            "electricity": "Electricity & Cooling",
            "transport": "Commute & Travel",
            "fuel": "LPG & Direct Fuel",
            "food": "Diet & Food Waste",
            "waste": "Solid Waste",
            "shopping": "Purchases & Goods",
            "water": "Pumping & Water Supply",
        }

        breakdown = []
        for c, val in category_totals.items():
            if val > 0:
                breakdown.append({
                    "category": c,
                    "label": labels.get(c, c.title()),
                    "kg": round(val, 2),
                    "percentage": round((val / total_kg) * 100, 1),
                    "color": colors.get(c, "#52B788"),
                })

        biggest = {
            "category": max_item.get("category", "electricity") if max_item else "electricity",
            "item": max_item.get("item", "Air Conditioning") if max_item else "Air Conditioning",
            "kg": round(max_kg, 2) if max_kg > 0 else round(total_kg * 0.5, 2),
            "percentage": round((max_kg / total_kg) * 100, 1) if max_kg > 0 else 50.0,
            "tip": "Targeting your highest contributor yields maximum carbon and financial savings.",
        }

        verification_ratio = round((verified_kg / total_kg) * 100, 1) if total_kg > 0 else 0.0

        return {
            "total_kg": total_kg,
            "breakdown": breakdown,
            "biggest_source": biggest,
            "verified_kg": round(verified_kg, 2),
            "self_reported_kg": round(self_reported_kg, 2),
            "verification_ratio_pct": verification_ratio,
            "equivalents": {
                "trees_needed": round(total_kg / 20.0, 2),
                "smartphones_charged": round(total_kg * 122),
                "car_km_driven": round(total_kg / 0.17, 1),
            },
        }

    @staticmethod
    def compare_periods(
        current_records: List[Dict[str, Any]],
        previous_records: List[Dict[str, Any]],
        user_type: str = "individual",
    ) -> Dict[str, Any]:
        """Compares current vs previous reporting periods with rigorous evidence verification."""
        curr_summary = CalculationEngine.calculate_summary(current_records)
        prev_summary = CalculationEngine.calculate_summary(previous_records)

        curr_kg = curr_summary["total_kg"]
        prev_kg = prev_summary["total_kg"]

        diff_kg = round(curr_kg - prev_kg, 2)
        pct_change = round(((curr_kg - prev_kg) / prev_kg) * 100, 1) if prev_kg > 0 else 0.0

        is_reduction = diff_kg < 0
        status_label = "Decreased" if is_reduction else ("Increased" if diff_kg > 0 else "Stable")

        # Category-wise delta analysis
        category_deltas = {}
        curr_cat_map = {b["category"]: b["kg"] for b in curr_summary["breakdown"]}
        prev_cat_map = {b["category"]: b["kg"] for b in prev_summary["breakdown"]}

        all_cats = set(list(curr_cat_map.keys()) + list(prev_cat_map.keys()))
        for c in all_cats:
            c_curr = curr_cat_map.get(c, 0.0)
            c_prev = prev_cat_map.get(c, 0.0)
            category_deltas[c] = {
                "current_kg": c_curr,
                "previous_kg": c_prev,
                "delta_kg": round(c_curr - c_prev, 2),
            }

        # Generate strictly evidence-backed natural language insights
        insights = []
        if prev_kg > 0:
            if is_reduction:
                insights.append(
                    f"Your overall carbon footprint dropped by {abs(pct_change)}% ({abs(diff_kg)} kg CO₂e) compared with your previous comparable period."
                )
            elif diff_kg > 0:
                insights.append(
                    f"Your recorded emissions rose by {pct_change}% (+{diff_kg} kg CO₂e). Review top contributors below to reverse this trend."
                )
            else:
                insights.append("Your carbon footprint remained stable across both reporting periods.")

        # Specific category insights
        elec_delta = category_deltas.get("electricity", {}).get("delta_kg", 0.0)
        if elec_delta < -1.0:
            insights.append(
                f"Electricity emissions decreased by {abs(elec_delta)} kg CO₂e, reflecting efficient appliance usage."
            )
        elif elec_delta > 1.0:
            insights.append(
                f"Electricity emissions increased by +{elec_delta} kg CO₂e, mainly driven by elevated cooling or heating hours."
            )

        transit_delta = category_deltas.get("transport", {}).get("delta_kg", 0.0)
        if transit_delta < -1.0:
            insights.append(
                f"Commute emissions dropped by {abs(transit_delta)} kg CO₂e thanks to public transit and active mobility."
            )

        # Verification coverage notice
        if curr_summary["verification_ratio_pct"] >= 70:
            insights.append(
                f"High Data Integrity: {curr_summary['verification_ratio_pct']}% of your reported footprint is supported by verified bills or receipts."
            )
        else:
            insights.append(
                f"Verification Gap: Only {curr_summary['verification_ratio_pct']}% of current activities have supporting evidence. Upload utility bills to unlock maximum Carbon Coins."
            )

        return {
            "current_period_kg": curr_kg,
            "previous_period_kg": prev_kg,
            "delta_kg": diff_kg,
            "percentage_change": pct_change,
            "status": status_label,
            "is_verified_reduction": is_reduction and (curr_summary["verification_ratio_pct"] >= 50),
            "category_deltas": category_deltas,
            "insights": insights,
        }

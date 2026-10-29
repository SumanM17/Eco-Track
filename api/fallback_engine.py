"""Multilingual rule-based keyword fallback engine for English, Hindi, Tamil, and Telugu.
Covers all 7 Indian emission categories:
- electricity (CEA Grid v19: 0.820 kg/kWh)
- transport (metro, bus, car, two-wheeler, auto, train, bicycle, walk)
- fuel (LPG cylinder, piped natural gas, kerosene, petrol, diesel)
- food (vegetarian meals, non-veg meals, dairy/milk, millets)
- waste (household waste, plastic waste, wet waste, dry recyclables)
- shopping (cotton apparel, online courier deliveries, electronics)
- water (water pump / borewell motor, municipal supply)
"""

import re
from typing import Any, Dict, List, Optional, Tuple

CATEGORIES = ("electricity", "transport", "fuel", "food", "waste", "shopping", "water")

ITEM_MAP: Dict[str, str] = {
    # Electricity
    "ac": "Air conditioner", "air conditioner": "Air conditioner", "split ac": "Air conditioner",
    "cooler": "Air cooler", "fan": "Ceiling fan", "ceiling fan": "Ceiling fan",
    "light": "Lighting (LED)", "bulb": "LED bulb", "tube light": "Tube light",
    "fridge": "Refrigerator", "refrigerator": "Refrigerator", "tv": "Television",
    "washing machine": "Washing machine", "geyser": "Water heater (geyser)",
    "water heater": "Water heater (geyser)", "microwave": "Microwave oven",
    "induction": "Induction cooktop", "computer": "Desktop computer", "laptop": "Laptop",
    # Hindi electricity
    "एसी": "Air conditioner", "कूलर": "Air cooler", "पंखा": "Ceiling fan", "पंखे": "Ceiling fan",
    "लाइट": "Lighting (LED)", "बल्ब": "LED bulb", "फ्रिज": "Refrigerator", "टीवी": "Television",
    "वॉशिंग मशीन": "Washing machine", "गीजर": "Water heater (geyser)", "इंडक्शन": "Induction cooktop",
    # Tamil electricity
    "ஏசி": "Air conditioner", "மின்விசிறி": "Ceiling fan", "ஃபேன்": "Ceiling fan",
    "விளக்கு": "Lighting (LED)", "பல்ப்": "LED bulb", "ஃப்ரிஜ்": "Refrigerator",
    "ஃப்ரிட்ஜ்": "Refrigerator", "பிரிட்ஜ்": "Refrigerator", "குளிர்சாதனப் பெட்டி": "Refrigerator",
    "டிவி": "Television", "வாஷிங் மெஷின்": "Washing machine", "கீசர்": "Water heater (geyser)",
    # Telugu electricity
    "ఏసీ": "Air conditioner", "ఫ్యాన్": "Ceiling fan", "లైట్": "Lighting (LED)",
    "బల్బ్": "LED bulb", "బల్బు": "LED bulb", "ఫ్రిజ్": "Refrigerator", "టీవీ": "Television",
    "వాషింగ్ మెషిన్": "Washing machine", "గీజర్": "Water heater (geyser)",

    # Transport
    "car": "Car", "bike": "Two-wheeler", "motorcycle": "Two-wheeler", "scooter": "Two-wheeler",
    "scooty": "Two-wheeler (scooty)", "auto": "Auto-rickshaw", "rickshaw": "Auto-rickshaw",
    "bus": "Bus", "metro": "Metro", "train": "Train", "cab": "Cab (taxi)", "taxi": "Cab (taxi)",
    "uber": "Cab (taxi)", "ola": "Cab (taxi)", "walk": "Walking", "cycle": "Bicycle",
    # Hindi transport
    "कार": "Car", "गाड़ी": "Car", "बाइक": "Two-wheeler", "स्कूटर": "Two-wheeler",
    "स्कूटी": "Two-wheeler (scooty)", "ऑटो": "Auto-rickshaw", "रिक्शा": "Auto-rickshaw",
    "बस": "Bus", "मेट्रो": "Metro", "ट्रेन": "Train", "कैब": "Cab (taxi)", "पैदल": "Walking",
    "साइकिल": "Bicycle",
    # Tamil transport
    "கார்": "Car", "காரில்": "Car", "பைக்": "Two-wheeler", "பைக்கில்": "Two-wheeler",
    "ஸ்கூட்டர்": "Two-wheeler", "ஸ்கூட்டரில்": "Two-wheeler", "ஸ்கூட்டி": "Two-wheeler (scooty)",
    "ஆட்டோ": "Auto-rickshaw", "ஆட்டோவில்": "Auto-rickshaw", "பேஸ்": "Bus", "பேருந்து": "Bus",
    "பேருந்தில்": "Bus", "பஸ்": "Bus", "பஸ்ஸில்": "Bus", "மெட்ரோ": "Metro", "ரயில்": "Train",
    "ரயிலில்": "Train", "டாக்ஸி": "Cab (taxi)", "சைக்கிள்": "Bicycle", "நடந்து": "Walking",
    # Telugu transport
    "కార్": "Car", "కారు": "Car", "కారులో": "Car", "కారుతో": "Car", "బైక్": "Two-wheeler",
    "బైకు": "Two-wheeler", "బైకుపై": "Two-wheeler", "బైకుతో": "Two-wheeler",
    "స్కూటర్": "Two-wheeler", "స్కూటీ": "Two-wheeler (scooty)", "ఆటో": "Auto-rickshaw",
    "ఆటోతో": "Auto-rickshaw", "ఆటోలో": "Auto-rickshaw", "బస్": "Bus", "బస్సు": "Bus",
    "బస్సులో": "Bus", "బస్సుతో": "Bus", "ఆర్టీసీ బస్సు": "Bus", "మెట్రో": "Metro",
    "రైలు": "Train", "రైలులో": "Train", "రైలుతో": "Train", "ట్యాక్సీ": "Cab (taxi)",
    "క్యాబ్": "Cab (taxi)", "సైకిల్": "Bicycle", "నడక": "Walking", "నడిచి": "Walking",

    # Fuel (cooking & vehicle)
    "lpg": "Cooking gas (LPG)", "gas cylinder": "Cooking gas (LPG)", "cooking gas": "Cooking gas (LPG)",
    "gas stove": "Cooking gas (LPG)", "cylinder": "Cooking gas (LPG)", "kerosene": "Kerosene",
    "petrol": "Petrol", "diesel": "Diesel",
    "एलपीजी": "Cooking gas (LPG)", "गैस सिलेंडर": "Cooking gas (LPG)", "रसोई गैस": "Cooking gas (LPG)",
    "गैस चूल्हा": "Cooking gas (LPG)", "सिलेंडर": "Cooking gas (LPG)", "पेट्रोल": "Petrol", "डीजल": "Diesel",
    "எரிவாயு": "Cooking gas (LPG)", "கேஸ் சிலிண்டர்": "Cooking gas (LPG)", "கேஸ்": "Cooking gas (LPG)",
    "பெட்ரோல்": "Petrol", "டீசல்": "Diesel",
    "వంట గ్యాస్": "Cooking gas (LPG)", "గ్యాస్ సిలిండర్": "Cooking gas (LPG)", "సిలిండర్": "Cooking gas (LPG)",
    "గ్యాస్": "Cooking gas (LPG)", "పెట్రోలు": "Petrol", "పెట్రోల్": "Petrol", "డీజిల్": "Diesel",

    # Food & Diet
    "veg": "Vegetarian meal", "vegetarian": "Vegetarian meal", "veg meal": "Vegetarian meal",
    "non-veg": "Non-vegetarian meal", "chicken": "Non-vegetarian meal", "mutton": "Non-vegetarian meal",
    "fish": "Non-vegetarian meal", "meat": "Non-vegetarian meal", "milk": "Dairy / Milk", "dairy": "Dairy / Milk",
    "paneer": "Dairy / Milk",
    "शाकाहारी": "Vegetarian meal", "शाकाहारी भोजन": "Vegetarian meal", "दाल चावल": "Vegetarian meal",
    "सब्जी": "Vegetarian meal", "मांसाहारी": "Non-vegetarian meal", "चिकन": "Non-vegetarian meal",
    "मटन": "Non-vegetarian meal", "दूध": "Dairy / Milk", "पनीर": "Dairy / Milk",
    "சைவ உணவு": "Vegetarian meal", "சைவம்": "Vegetarian meal", "அசைவ உணவு": "Non-vegetarian meal",
    "அசைவம்": "Non-vegetarian meal", "சிக்கன்": "Non-vegetarian meal", "மட்டன்": "Non-vegetarian meal",
    "பால்": "Dairy / Milk",
    "శాకాహారం": "Vegetarian meal", "శాకాహార భోజనం": "Vegetarian meal", "మాంసాహారం": "Non-vegetarian meal",
    "చికెన్": "Non-vegetarian meal", "మటన్": "Non-vegetarian meal", "పాలు": "Dairy / Milk",

    # Waste
    "garbage": "Household waste", "trash": "Household waste", "waste": "Household waste",
    "plastic": "Plastic waste", "food waste": "Food waste", "wet waste": "Food waste (wet)",
    "dry waste": "Dry recyclable waste", "dustbin": "Household waste",
    "कचरा": "Household waste", "कूड़ा": "Household waste", "प्लास्टिक": "Plastic waste",
    "खाना बचा": "Food waste", "गीला कचरा": "Food waste (wet)", "सूखा कचरा": "Dry recyclable waste",
    "குப்பை": "Household waste", "கழிவு": "Household waste", "உணவுக் கழிவு": "Food waste",
    "மக்கும் குப்பை": "Food waste (wet)", "பிளாஸ்டிக்": "Plastic waste",
    "చెత్త": "Household waste", "వ్యర్థాలు": "Household waste", "ఆహార వ్యర్థాలు": "Food waste",
    "తడి చెత్త": "Food waste (wet)", "ప్లాస్టిక్": "Plastic waste",

    # Shopping & Apparel
    "clothes": "Clothing (cotton)", "shirt": "Clothing (cotton)", "shopping": "Clothing (cotton)",
    "apparel": "Clothing (cotton)", "courier": "Online delivery package", "parcel": "Online delivery package",
    "delivery": "Online delivery package", "amazon": "Online delivery package", "flipkart": "Online delivery package",
    "ऑनलाइन शॉपिंग": "Online delivery package", "पार्सल": "Online delivery package", "कपड़े": "Clothing (cotton)",
    "शर्ट": "Clothing (cotton)",
    "துணி": "Clothing (cotton)", "துணிகள்": "Clothing (cotton)", "ஆன்லைன் பார்சல்": "Online delivery package",
    "பார்சல்": "Online delivery package",
    "బట్టలు": "Clothing (cotton)", "షర్టు": "Clothing (cotton)", "ఆన్‌లైన్ ఆర్డర్": "Online delivery package",
    "పార్శిల్": "Online delivery package",

    # Water Pumping
    "water pump": "Water pump", "motor": "Water pump", "borewell": "Water pump",
    "water motor": "Water pump", "sump pump": "Water pump",
    "पानी की मोटर": "Water pump", "समर्सिबल पंप": "Water pump", "मोटर": "Water pump",
    "தண்ணீர் மோட்டார்": "Water pump", "போர்வெல்": "Water pump", "பம்ப்": "Water pump",
    "నీటి మోటారు": "Water pump", "బోర్‌వెల్": "Water pump", "మోటార్": "Water pump",
}

KEYWORDS: Dict[str, Dict[str, List[str]]] = {
    "en": {
        "electricity": [
            "air conditioner", "split ac", "water heater", "washing machine", "ceiling fan",
            "tube light", "microwave", "induction", "computer", "refrigerator", "cooler",
            "geyser", "fridge", "laptop", "light", "bulb", "fan", "tv", "ac",
        ],
        "transport": [
            "auto-rickshaw", "motorcycle", "bicycle", "cycling", "walking", "scooter",
            "scooty", "train", "metro", "cycle", "drive", "uber", "walk", "auto",
            "bike", "taxi", "bus", "cab", "car", "ola",
        ],
        "fuel": ["gas cylinder", "cooking gas", "gas stove", "kerosene", "cylinder", "petrol", "diesel", "lpg"],
        "food": ["vegetarian", "non-veg", "chicken", "mutton", "veg meal", "paneer", "dairy", "meat", "milk", "veg"],
        "waste": ["plastic waste", "food waste", "wet waste", "dry waste", "dustbin", "garbage", "plastic", "trash", "waste"],
        "shopping": ["online delivery", "delivery package", "courier", "parcel", "clothes", "apparel", "shopping", "shirt"],
        "water": ["water pump", "water motor", "borewell", "sump pump", "motor"],
    },
    "hi": {
        "electricity": [
            "वॉशिंग मशीन", "वॉटर हीटर", "एयर कंडीशनर", "रेफ्रिजरेटर", "इंडक्शन", "कूलर",
            "गीजर", "पंखा", "पंखे", "लाइट", "बल्ब", "फ्रिज", "टीवी", "एसी", "ac", "fan", "fridge",
        ],
        "transport": [
            "मोटरसाइकिल", "ऑटो-रिक्शा", "साइकिल", "स्कूटर", "स्कूटी", "रिक्शा", "मेट्रो",
            "ट्रेन", "गाड़ी", "पैदल", "ऑटो", "बाइक", "कैब", "कार", "बस", "car", "bike", "metro", "bus", "cab",
        ],
        "fuel": ["गैस सिलेंडर", "रसोई गैस", "गैस चूल्हा", "सिलेंडर", "पेट्रोल", "डीजल", "एलपीजी", "lpg", "gas"],
        "food": ["शाकाहारी भोजन", "मांसाहारी", "दाल चावल", "शाकाहारी", "सब्जी", "चिकन", "मटन", "पनीर", "दूध"],
        "waste": ["गीला कचरा", "सूखा कचरा", "प्लास्टिक", "डस्टबिन", "कचरा", "कूड़ा"],
        "shopping": ["ऑनलाइन शॉपिंग", "डिलीवरी", "पार्सल", "कपड़े", "शर्ट"],
        "water": ["पानी की मोटर", "समर्सिबल पंप", "मोटर"],
    },
    "ta": {
        "electricity": [
            "குளிர்சாதனப் பெட்டி", "வாஷிங் மெஷின்", "மின்விசிறி", "விளக்கு", "ஃப்ரிட்ஜ்",
            "ஃப்ரிஜ்", "பிரிட்ஜ்", "பல்ப்", "ஃபேன்", "கீசர்", "டிவி", "ஏசி", "ac", "fan", "fridge",
        ],
        "transport": [
            "இருசக்கர வாகனம்", "ஆட்டோ-ரிக்ஷா", "ஸ்கூட்டரில்", "ஸ்கூட்டர்", "பேருந்தில்", "சைக்கிள்",
            "பைக்கில்", "பேருந்து", "ரயிலில்", "டாக்ஸி", "நடந்து", "காரில்", "ஸ்கூட்டி", "மெட்ரோ",
            "ரயில்", "ஆட்டோ", "பைக்", "பஸ்ஸில்", "பஸ்", "பேஸ்", "கார்", "car", "bike", "bus", "metro", "auto",
        ],
        "fuel": ["கேஸ் சிலிண்டர்", "எரிவாயு", "பெட்ரோல்", "டீசல்", "கேஸ்", "lpg", "gas"],
        "food": ["சைவ உணவு", "அசைவ உணவு", "சிக்கன்", "மட்டன்", "சைவம்", "அசைவம்", "பால்"],
        "waste": ["உணவுக் கழிவு", "மக்கும் குப்பை", "பிளாஸ்டிக்", "குப்பைத்தொட்டி", "கழிவு", "குப்பை"],
        "shopping": ["ஆன்லைன் பார்சல்", "பார்சல்", "துணிகள்", "துணி"],
        "water": ["தண்ணீர் மோட்டார்", "போர்வெல்", "பம்ப்"],
    },
    "te": {
        "electricity": [
            "వాషింగ్ మెషిన్", "లైట్", "బల్బు", "బల్బ్", "ఫ్యాన్", "గీజర్", "ఫ్రిజ్", "టీవీ", "ఏసీ", "ac", "fan", "fridge",
        ],
        "transport": [
            "ఆర్టీసీ బస్సు", "ద్విచక్ర వాహనం", "ఆటో-రిక్షా", "స్కూటీ", "బైకుపై", "నడిచి", "బస్సులో",
            "బైకుతో", "రైలులో", "కారులో", "బస్సుతో", "సైకిల్", "స్కూటర్", "రైలుతో", "కారుతో",
            "బైకు", "మెట్రో", "క్యాబ్", "ట్యాక్సీ", "ఆటోలో", "బస్సు", "నడక", "ఆటోతో", "బైక్",
            "రైలు", "ఆటో", "కారు", "కార్", "బస్", "car", "bike", "bus", "metro", "auto",
        ],
        "fuel": ["గ్యాస్ సిలిండర్", "వంట గ్యాస్", "సిలిండర్", "పెట్రోలు", "పెట్రోల్", "డీజిల్", "గ్యాస్", "lpg", "gas"],
        "food": ["శాకాహార భోజనం", "మాంసాహారం", "శాకాహారం", "చికెన్", "మటన్", "పాలు"],
        "waste": ["ఆహార వ్యర్థాలు", "తడి చెత్త", "ప్లాస్టిక్", "డస్ట్‌బిన్", "వ్యర్థాలు", "చెత్త"],
        "shopping": ["ఆన్‌లైన్ ఆర్డర్", "పార్శిల్", "బట్టలు", "షర్టు"],
        "water": ["నీటి మోటారు", "బోర్‌వెల్", "మోటార్"],
    },
}

WORD_NUMBERS: Dict[str, Dict[str, float]] = {
    "en": {
        "one": 1.0, "two": 2.0, "three": 3.0, "four": 4.0, "five": 5.0,
        "six": 6.0, "seven": 7.0, "eight": 8.0, "nine": 9.0, "ten": 10.0,
        "eleven": 11.0, "twelve": 12.0, "fifteen": 15.0, "twenty": 20.0,
        "half": 0.5, "quarter": 0.25,
    },
    "hi": {
        "एक": 1.0, "दो": 2.0, "तीन": 3.0, "चार": 4.0, "पांच": 5.0, "पाँच": 5.0,
        "छह": 6.0, "सात": 7.0, "आठ": 8.0, "नौ": 9.0, "दस": 10.0, "ग्यारह": 11.0,
        "बारह": 12.0, "पंद्रह": 15.0, "बीस": 20.0, "पच्चीस": 25.0, "तीस": 30.0,
        "पचास": 50.0, "सौ": 100.0, "आधा": 0.5, "डेढ़": 1.5, "ढाई": 2.5,
        "ek": 1.0, "do": 2.0, "teen": 3.0, "chaar": 4.0, "char": 4.0, "paanch": 5.0,
        "panch": 5.0, "chhah": 6.0, "che": 6.0, "saat": 7.0, "aath": 8.0, "ath": 8.0,
        "nau": 9.0, "das": 10.0, "pandrah": 15.0, "bees": 20.0, "tees": 30.0,
        "pachas": 50.0, "sau": 100.0, "aadha": 0.5,
    },
    "ta": {
        "ஒன்று": 1.0, "இரண்டு": 2.0, "மூன்று": 3.0, "நான்கு": 4.0, "ஐந்து": 5.0,
        "ஆறு": 6.0, "ஏழு": 7.0, "எட்டு": 8.0, "ஒன்பது": 9.0, "பத்து": 10.0,
        "இருபது": 20.0, "ஐம்பது": 50.0, "நூறு": 100.0, "அரை": 0.5,
        "ondru": 1.0, "irandu": 2.0, "moondru": 3.0, "naangu": 4.0, "aindhu": 5.0,
        "aaru": 6.0, "ezhu": 7.0, "ettu": 8.0, "onbadhu": 9.0, "patthu": 10.0, "arai": 0.5,
    },
    "te": {
        "ఒకటి": 1.0, "రెండు": 2.0, "మూడు": 3.0, "నాలుగు": 4.0, "ఐదు": 5.0,
        "ఆరు": 6.0, "ఏడు": 7.0, "ఎనిమిది": 8.0, "తొమ్మిది": 9.0, "పది": 10.0,
        "ఇరవై": 20.0, "యాభై": 50.0, "వంద": 100.0, "సగం": 0.5,
        "okati": 1.0, "rendu": 2.0, "moodu": 3.0, "naalugu": 4.0, "aidu": 5.0,
        "aaru": 6.0, "yedu": 7.0, "enimidi": 8.0, "tommidi": 9.0, "padi": 10.0, "sagam": 0.5,
    },
}

DEFAULT_VALUE: Dict[str, float] = {
    "electricity": 4.0,
    "transport": 10.0,
    "fuel": 0.4,
    "food": 1.0,
    "waste": 0.5,
    "shopping": 1.0,
    "water": 1.0,
}

DEFAULT_UNIT: Dict[str, str] = {
    "electricity": "hours",
    "transport": "km",
    "fuel": "kg",
    "food": "meals",
    "waste": "kg",
    "shopping": "items",
    "water": "hours",
}

ITEM_DEFAULTS: Dict[str, Tuple[float, str, str]] = {
    "Air conditioner": (6.0, "hours", "1.5-ton split AC ~1.5 kW consumption assumed"),
    "Ceiling fan": (8.0, "hours", "Standard 75W ceiling fan assumed"),
    "Refrigerator": (24.0, "hours", "250L frost-free refrigerator continuous run assumed"),
    "Television": (3.0, "hours", "43-inch LED TV ~80W assumed"),
    "Washing machine": (1.0, "hours", "Standard front-load cycle assumed"),
    "Water heater (geyser)": (0.5, "hours", "15L storage geyser ~2 kW assumed"),
    "Air cooler": (6.0, "hours", "Desert cooler ~150W assumed"),
    "Lighting (LED)": (6.0, "hours", "9W LED bulb assumed"),
    "Induction cooktop": (1.0, "hours", "1.8 kW induction stove assumed"),
    "Car": (12.0, "km", "Mid-size petrol hatchback (0.170 kg CO2/km) assumed"),
    "Two-wheeler": (10.0, "km", "125cc petrol commuter motorcycle assumed"),
    "Two-wheeler (scooty)": (8.0, "km", "110cc automatic scooter assumed"),
    "Auto-rickshaw": (6.0, "km", "CNG auto-rickshaw assumed"),
    "Bus": (12.0, "km", "State transport diesel / electric transit bus assumed"),
    "Metro": (15.0, "km", "High-efficiency urban metro line assumed"),
    "Cab (taxi)": (10.0, "km", "Sedan petrol/CNG taxi assumed"),
    "Train": (25.0, "km", "Indian Railways electric commuter EMU assumed"),
    "Walking": (2.0, "km", "Zero tailpipe emissions"),
    "Bicycle": (4.0, "km", "Zero tailpipe emissions"),
    "Cooking gas (LPG)": (0.4, "kg", "Standard domestic 14.2 kg LPG cylinder burner run"),
    "Vegetarian meal": (1.0, "meals", "Dal, rice, roti, vegetables meal (0.8 kg CO2e)"),
    "Non-vegetarian meal": (1.0, "meals", "Poultry / mutton meal (2.5 kg CO2e)"),
    "Dairy / Milk": (1.0, "litres", "Bovine milk pasteurized (1.4 kg CO2e/L)"),
    "Household waste": (1.0, "kg", "Mixed municipal solid waste (0.5 kg CO2e/kg)"),
    "Food waste": (0.5, "kg", "Kitchen wet waste to municipal landfill"),
    "Plastic waste": (0.2, "kg", "Single-use mixed polymer packaging"),
    "Clothing (cotton)": (1.0, "items", "Cotton garment lifecycle footprint ~4.5 kg CO2e"),
    "Online delivery package": (1.0, "deliveries", "Last-mile courier delivery footprint ~1.2 kg CO2e"),
    "Water pump": (1.0, "hours", "1 HP domestic borewell/sump motor ~0.75 kWh/hr"),
}


class MultilingualFallbackEngine:
    """High-accuracy deterministic fallback engine for en, hi, ta, te across 7 categories."""

    @classmethod
    def detect_language(cls, text: str) -> str:
        tl = text.lower()
        # Devanagari script (0900-097F)
        if re.search(r"[\u0900-\u097f]", text):
            return "hi"
        # Tamil script (0B80-0BFF)
        if re.search(r"[\u0b80-\u0bff]", text):
            return "ta"
        # Telugu script (0C00-0C7F)
        if re.search(r"[\u0c00-\u0c7f]", text):
            return "te"

        # Transliteration heuristics
        hi_hits = sum(w in tl for w in ["ghante", "ghanta", "aaj", "chalaya", "gaya", "khana", "bijli", "gadi", "auto", "metro"])
        if hi_hits >= 2:
            return "hi"
        ta_hits = sum(w in tl for w in ["mani", "neram", "naan", "ponen", "matrum", "vandi", "thanni", "minsaaram", "auto", "bus", "car", "ac"])
        if ta_hits >= 2:
            return "ta"
        te_hits = sum(w in tl for w in ["gantalu", "ganta", "roju", "nenu", "vellanu", "mariyu", "neellu", "vidyut", "auto", "bus", "car", "ac"])
        if te_hits >= 2:
            return "te"
        return "en"

    @classmethod
    def _extract_value_unit(
        cls, text: str, kw_start_in_win: int, kw_end_in_win: int, item: str, category: str, lang: str
    ) -> Tuple[float, str, bool]:
        low = text.lower()
        kw_center = (kw_start_in_win + kw_end_in_win) / 2

        best_val: Optional[float] = None
        best_dist = 10**9
        for m in re.finditer(r"\b\d+(?:\.\d+)?\b", text):
            val = float(m.group(0))
            dist = abs(m.start() - kw_center)
            if dist < best_dist:
                best_dist = dist
                best_val = val

        if best_val is None:
            word_map = WORD_NUMBERS.get(lang, WORD_NUMBERS["en"])
            for word, num in word_map.items():
                pattern = r"(?<!\w)" + re.escape(word) + r"(?!\w)"
                if re.search(pattern, low):
                    best_val = num
                    break

        item_spec = ITEM_DEFAULTS.get(item)
        if item_spec:
            default_v, default_u, _ = item_spec
        else:
            default_v = DEFAULT_VALUE.get(category, 1.0)
            default_u = DEFAULT_UNIT.get(category, "pieces")

        is_default = False
        if best_val is None:
            best_val = default_v
            is_default = True

        unit = default_u
        if category == "electricity":
            if re.search(r"\b(kwh|units?|यूनिट|யூனிட்|యూనిట్లు)\b", low):
                unit = "kWh"
            elif re.search(r"\b(hours?|hrs?|घंटे|घंटा|ghante|ghanta|மணி|mani|గంటలు|గంట|gantalu)\b", low):
                unit = "hours"
        elif category == "transport":
            if re.search(r"\b(kms?|kilometers?|किमी|किलोमीटर|கிலோமீட்டர்|கிமீ|కిలోమీటర్లు|కిమీ)\b", low):
                unit = "km"
        elif category == "fuel":
            if re.search(r"\b(liters?|litres?|लीटर|லிட்டர்|లీటర్లు)\b", low):
                unit = "liters"
            elif re.search(r"\b(kg|kgs|किलो|கிலோ|కిలో)\b", low):
                unit = "kg"
        elif category == "food":
            if re.search(r"\b(meals?|plates?|बार|பூట|வேளை)\b", low):
                unit = "meals"
            elif re.search(r"\b(liters?|litres?|लीटर|லிட்டர்|లీటర్లు)\b", low):
                unit = "litres"
        elif category == "waste":
            if re.search(r"\b(grams?|g|ग्राम|கிராம்|గ్రాములు)\b", low):
                unit = "kg"
                if not is_default:
                    best_val = best_val / 1000.0
            elif re.search(r"\b(kgs?|kilo|किलो|கிலோ|కిలో)\b", low):
                unit = "kg"
        elif category == "shopping":
            if re.search(r"\b(items?|pieces?|shirts?|कपड़े|துணிகள்|బట్టలు)\b", low):
                unit = "items"
            elif re.search(r"\b(packages?|parcels?|पार्सल|பார்சல்|పార్శిల్)\b", low):
                unit = "deliveries"
        elif category == "water":
            if re.search(r"\b(hours?|hrs?|घंटे|घंटा|மணி|గంటలు|గంట)\b", low):
                unit = "hours"
            elif re.search(r"\b(minutes?|mins?|मिनट|நிமிடம்|నిమిషాలు)\b", low):
                unit = "hours"
                if not is_default:
                    best_val = round(best_val / 60.0, 2)

        return best_val, unit, is_default

    @staticmethod
    def _detect_frequency(tl: str) -> str:
        if any(w in tl for w in ("weekly", "week", "सप्ताह", "वार", "வாரம்", "వారంలో")):
            return "weekly"
        if any(w in tl for w in ("monthly", "month", "महीने", "மாதம்", "నెలలో")):
            return "monthly"
        if any(w in tl for w in ("one-time", "once", "एक बार", "ஒருமுறை", "ఒక్కసారి")):
            return "one-time"
        return "daily"

    @classmethod
    def parse(cls, text: str, lang: Optional[str] = None) -> Dict[str, Any]:
        """Parses text into structured activities with regional language assumptions."""
        clean_text = text.strip()
        if not clean_text:
            return {"activities": [], "assumptions": [], "follow_up_question": None}

        detected_lang = lang or cls.detect_language(clean_text)
        if detected_lang not in ("en", "hi", "ta", "te"):
            detected_lang = "en"

        text_lower = clean_text.lower()
        kw_dict = KEYWORDS.get(detected_lang, KEYWORDS["en"])

        activities: List[Dict[str, Any]] = []
        assumptions: List[str] = []
        matched_positions: List[Tuple[int, int]] = []

        for category in CATEGORIES:
            kw_list = kw_dict.get(category, [])
            for kw in kw_list:
                kw_low = kw.lower()
                pattern = r"(?<!\w)" + re.escape(kw_low) + r"(?!\w)"
                for match in re.finditer(pattern, text_lower):
                    s, e = match.start(), match.end()
                    # Skip overlapping keywords
                    if any(not (e <= ms or s >= me) for ms, me in matched_positions):
                        continue
                    matched_positions.append((s, e))

                    mapped_item = ITEM_MAP.get(kw_low, kw.capitalize())
                    win_start = max(0, s - 60)
                    win_end = min(len(clean_text), e + 60)
                    win_text = clean_text[win_start:win_end]

                    val, unit, is_default = cls._extract_value_unit(
                        win_text,
                        kw_start_in_win=s - win_start,
                        kw_end_in_win=e - win_start,
                        item=mapped_item,
                        category=category,
                        lang=detected_lang,
                    )

                    freq = cls._detect_frequency(win_text.lower())
                    confidence = 0.65 if is_default else 0.94

                    activities.append({
                        "category": category,
                        "item": mapped_item,
                        "value": float(val),
                        "unit": unit,
                        "frequency": freq,
                        "confidence": confidence,
                    })

                    spec = ITEM_DEFAULTS.get(mapped_item)
                    if spec:
                        assumptions.append(spec[2])

        # De-duplicate identical items
        unique_acts: List[Dict[str, Any]] = []
        seen = set()
        for a in activities:
            k = (a["category"], a["item"])
            if k not in seen:
                seen.add(k)
                unique_acts.append(a)

        # Regional language assumptions
        if not assumptions:
            if detected_lang == "hi":
                assumptions.append("मानक भारतीय ऊर्जा और परिवहन उत्सर्जन कारक लागू किए गए (CEA Grid v19: 0.82 kg CO2e/kWh)")
            elif detected_lang == "ta":
                assumptions.append("நிலையான இந்திய ஆற்றல் மற்றும் போக்குவரத்து உமிழ்வு காரணிகள் கணக்கிடப்பட்டன")
            elif detected_lang == "te":
                assumptions.append("ప్రామాణిక భారతీయ ఇంధన మరియు రవాణా ఉద్గార కారకాలు లెక్కించబడ్డాయి")
            else:
                assumptions.append("Standard Indian baseline emission factors applied (CEA Grid v19: 0.820 kg CO2e/kWh)")

        # Regional follow-up questions
        follow_up = None
        has_ac = any(a["item"] == "Air conditioner" for a in unique_acts)
        has_car = any(a["item"] == "Car" for a in unique_acts)

        if has_ac:
            if detected_lang == "hi":
                follow_up = "एसी का तापमान क्या 24°C से अधिक था? तापमान 26°C करने से हर घंटे 15% बिजली बचती है।"
            elif detected_lang == "ta":
                follow_up = "ஏசி வெப்பநிலை 26°C ஆக அமைக்கப்பட்டதா? இது மின்சார கட்டணத்தை கணிசமாகக் குறைக்கும்."
            elif detected_lang == "te":
                follow_up = "ఏసీ ఉష్ణోగ్రత 26°C వద్ద ఉందా? ఇది గణనీయంగా విద్యుత్‌ను ఆదా చేస్తుంది."
            else:
                follow_up = "Was the AC set at 26°C? Running at 26°C with ceiling fan saves ~15% power hourly."
        elif has_car:
            if detected_lang == "hi":
                follow_up = "क्या आपने कार में अकेले यात्रा की या कारपूल किया? मेट्रो चुनने से प्रति ट्रिप 3.2 किग्रा CO2e की बचत होती है।"
            elif detected_lang == "ta":
                follow_up = "கார் பயணத்திற்கு பதில் மெட்ரோ அல்லது பேருந்து பயன்படுத்த முடியுமா?"
            elif detected_lang == "te":
                follow_up = "కారు బదులుగా మెట్రో లేదా ఆర్టీసీ బస్సు ఎంచుకోవడం వలన కార్బన్ ఆదా అవుతుంది."
            else:
                follow_up = "Was this a solo car trip? Switching to Metro or bus saves ~3.2 kg CO2e per 10 km."

        return {
            "activities": unique_acts,
            "assumptions": list(set(assumptions))[:3],
            "follow_up_question": follow_up,
        }

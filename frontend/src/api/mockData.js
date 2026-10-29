/**
 * CarbonKatha Comprehensive Mock Datasets & Calculations
 * Provides hackathon-resilient offline fallback data matching exact backend response contracts.
 */

export const MOCK_CALCULATION = {
  total_kg: 4.82,
  date: new Date().toISOString().split('T')[0],
  confidence_score: 0.91,
  breakdown: [
    { category: 'electricity', label: 'Electricity (AC & Fans)', kg: 2.95, percentage: 61.2, color: '#2D6A4F' },
    { category: 'transport', label: 'Commute (Cab & Metro)', kg: 1.25, percentage: 25.9, color: '#52B788' },
    { category: 'fuel', label: 'Cooking (LPG Simmering)', kg: 0.38, percentage: 7.9, color: '#E76F51' },
    { category: 'waste', label: 'Solid Waste (Mixed Scraps)', kg: 0.24, percentage: 5.0, color: '#264653' },
  ],
  biggest_source: {
    category: 'electricity',
    item: '1.5-ton Split AC',
    kg: 2.46,
    percentage: 51.0,
    tip: 'Raising thermostat from 22°C to 26°C with ceiling fan saves ~30% AC energy.'
  },
  equivalents: {
    trees_needed: 0.24, // trees required to sequester this daily footprint in a year
    smartphones_charged: 588,
    car_km_driven: 28.4
  },
  cost_incurred_inr: 42.5,
  monthly_projected_kg: 144.6,
  monthly_projected_inr: 1275.0,
  range: {
    min_kg: 4.1,
    max_kg: 5.6
  },
  methodology: {
    electricity_factor: '0.82 kg CO₂e/kWh (CEA Grid Emission Factor v19, 2024)',
    petrol_car_factor: '0.17 kg CO₂e/p-km',
    metro_factor: '0.015 kg CO₂e/p-km',
    lpg_factor: '2.98 kg CO₂e/kg',
    waste_factor: '0.50 kg CO₂e/kg (IPCC Tier-1)'
  }
};

export const MOCK_EXPLANATIONS = {
  kid: {
    en: "Imagine if every time you run the chilly AC or take a car ride, little invisible smoke puffs float up into the sky. Today, your invisible puff was about the weight of 5 big school bags (4.8 kg)! Most of it came from keeping the room ice cold. If you set the AC warmer and let the fan blow breeze, you save 2 whole bags of smoke!",
    hi: "सोचिए जैसे जब भी हम बहुत ठंडा एसी चलाते हैं या कार में जाते हैं, तो आसमान में एक अदृश्य धुआं जमा होता है। आज आपका धुआं 5 भारी स्कूल बैग (4.8 किग्रा) के बराबर था! इसमें सबसे ज्यादा हिस्सा एसी का था। अगर आप एसी 26°C पर रखकर पंखा चलाएंगे, तो 2 बैग धुआं तुरंत गायब हो जाएगा!",
    ta: "நீங்கள் குளிர்சாதனப் பெட்டியைப் பயன்படுத்தும் போது வானத்தில் சிறிய கண்ணுக்குத் தெரியாத புகை மிதப்பதாக கற்பனை செய்து பாருங்கள். இன்று உங்களின் கார்பன் அளவு 5 பள்ளிப் பைகளுக்கு (4.8 கிகி) சமம்! ஏசி வெப்பநிலையை 26°C-ஆக மாற்றினால் 2 பைகள் புகை உடனே குறையும்!",
    te: "మనం ఏసీని చల్లగా ఉంచినప్పుడు లేదా కారులో వెళ్లినప్పుడు ఆకాశంలో కనిపించని పొగ పేరుకుపోతుందని ఊహించండి. ఈ రోజు మీ కార్బన్ 5 స్కూల్ బ్యాగుల బరువు (4.8 కిలోలు) సమానం! ఏసీని 26°C వద్ద ఉంచి ఫ్యాన్ వాడితే 2 బ్యాగుల పొగ వెంటనే తగ్గుతుంది!"
  },
  student: {
    en: "Your estimated daily emissions stand at 4.82 kg CO₂e, placing you slightly below the urban Indian average of 5.5 kg/day. Air conditioning accounted for 61% (2.95 kg) due to India's coal-heavy grid factor of 0.82 kg/kWh. By bumping your AC thermostat to 26°C and shifting 15 km of motorized commute to the electric metro, you can drop your footprint by 38% while saving ₹1,250 every month.",
    hi: "आपकी दैनिक कार्बन खपत 4.82 किग्रा CO₂e है, जो शहरी भारतीय औसत (5.5 किग्रा) से थोड़ी कम है। भारत के कोयला-आधारित ग्रिड (0.82 किग्रा/kWh) के कारण 61% उत्सर्जन एसी से हुआ। तापमान 26°C करने और 15 किमी सफर मेट्रो से करने पर आप 38% उत्सर्जन घटाकर हर महीने ₹1,250 बचा सकते हैं।",
    ta: "உங்கள் தினசரி கார்பன் அளவு 4.82 கிகி ஆகும், இது நகர்ப்புற இந்திய சராசரியை விட குறைவு. இந்தியாவின் 0.82 கிகி/kWh மின்சார காரணியால் ஏசி மட்டுமே 61% உமிழ்வை உருவாக்குகிறது. ஏசியை 26°C-க்கு மாற்றி மெட்ரோ ரயிலில் பயணித்தால் 38% உமிழ்வு குறைந்து மாதம் ₹1,250 சேமிக்கலாம்.",
    te: "మీ రోజువారీ ఉద్గారాలు 4.82 కిలోల CO₂e, ఇది భారతీయ పట్టణ సగటు 5.5 కిలోల కంటే తక్కువ. మన విద్యుత్ గ్రిడ్ ఫ్యాక్టర్ (0.82) కారణంగా ఏసీ వల్ల 61% ఉద్గారాలు వచ్చాయి. ఏసీని 26°C కి పెంచి, మెట్రో వాడటం ద్వారా 38% తగ్గించి నెలకు ₹1,250 ఆదా చేయవచ్చు."
  },
  expert: {
    en: "Scope 1 emissions (LPG combustion & direct ICE commute) totaled 1.63 kg CO₂e, whereas Scope 2 (grid electricity at CEA v19 factor of 0.82 kg CO₂e/kWh) dominated at 2.95 kg CO₂e. The highest carbon abatement elasticity lies in AC temperature calibration (+2°C delta achieves ~12% thermal load reduction) and modal shifting to mass transit (0.015 vs 0.17 kg CO₂e/pkm).",
    hi: "स्कोप 1 प्रत्यक्ष उत्सर्जन (एलपीजी और निजी वाहन) 1.63 किग्रा CO₂e रहा, जबकि स्कोप 2 (सीईए v19 ग्रिड कारक 0.82 किग्रा/kWh) 2.95 किग्रा CO₂e के साथ प्रभावी रहा। सबसे उच्च कार्बन न्यूनीकरण एसी के 2°C तापमान समायोजन और मास रैपिड ट्रांजिट (0.015 बनाम 0.17 किग्रा/किमी) में निहित है।",
    ta: "ஸ்கோப் 1 உமிழ்வு 1.63 கிகி ஆகவும், ஸ்கோப் 2 (மின் கட்டமைப்பு காரணி 0.82 கிகி/kWh) 2.95 கிகி ஆகவும் பதிவாகியுள்ளது. ஏசி வெப்பநிலை திருத்தம் மற்றும் பொதுப் போக்குவரத்து பயன்பாடு அதிகபட்ச கார்பன் குறைப்பை உறுதி செய்கிறது.",
    te: "స్కోప్ 1 ప్రత్యక్ష ఉద్గారాలు 1.63 కిలోలు కాగా, స్కోప్ 2 (గ్రిడ్ ఫ్యాక్టర్ 0.82 కిలోలు/kWh) 2.95 కిలోలుగా నమోదైంది. ఏసీ ఉష్ణోగ్రత పెంపు మరియు పబ్లిక్ మెట్రో వాడకం అత్యంత సమర్థవంతమైన పరిష్కారాలు."
  }
};

export const MOCK_PROGRESS = {
  baseline_kg_daily: 7.2,
  current_kg_daily: 4.8,
  reduction_percentage: 33.3,
  kg_saved_total: 72.0,
  rupees_saved_total: 2160,
  trees_equivalent: 3.6,
  adopted_swaps_count: 3,
  active_streak_days: 7,
  planet_tree_stage: 3,
  history: [
    { date: 'Oct 22', baseline: 7.2, actual: 6.9, reduction: 0.3 },
    { date: 'Oct 23', baseline: 7.2, actual: 6.4, reduction: 0.8 },
    { date: 'Oct 24', baseline: 7.2, actual: 5.8, reduction: 1.4 },
    { date: 'Oct 25', baseline: 7.2, actual: 5.2, reduction: 2.0 },
    { date: 'Oct 26', baseline: 7.2, actual: 5.0, reduction: 2.2 },
    { date: 'Oct 27', baseline: 7.2, actual: 4.9, reduction: 2.3 },
    { date: 'Oct 28', baseline: 7.2, actual: 4.8, reduction: 2.4 },
  ]
};

export const MOCK_BILL_SCAN = {
  consumer_number: "NDPL-98234-88",
  billing_month: "September 2024",
  units_kwh: 342,
  billed_amount_inr: 2840,
  estimated_emissions_kg: 280.44, // 342 * 0.82
  confidence: 0.94,
  discom_name: "Tata Power Delhi Distribution Ltd",
  extraction_status: "success",
  is_editable: true
};
